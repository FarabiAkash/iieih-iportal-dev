import csv
import datetime
import re
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Count, F, Q, Sum
from django.http import StreamingHttpResponse
from django.shortcuts import render
from django.urls import reverse_lazy
from django.utils import timezone
from django.views.decorators.cache import never_cache

from .models import MedicineDispensingLog, SurgicalConsumableStock

# ---------------------------------------------------------------- constants
ALLOWED_PER_PAGE = (10, 20, 50)
STOCK_STATUSES = ('out_of_stock', 'expired', 'low_stock', 'ok')
NEAR_EXPIRY_DAYS = 90
ANALYTICS_DAYS = 30
MAX_SEARCH_LENGTH = 100

# settings.TIME_ZONE is 'UTC', so "today" is computed in the hospital's own zone here.
HOSPITAL_TZ = ZoneInfo('Asia/Dhaka')

# One place for the login redirect (matches users_adnan's login view, which honours ?next=).
pharmacy_login_required = login_required(login_url=reverse_lazy('users_adnan:login'))

# Chart colours are keyed by value, so a colour never moves to another category.
FALLBACK_COLOR = '#98a2b3'
CATEGORY_COLORS = {
    'anti_glaucoma': '#0077b6',
    'antibiotic': '#2d6a4f',
    'steroid': '#f4a261',
    'lubricant': '#48cae4',
    'surgical_consumable': '#7b2d8b',
}
SUBSPECIALTY_COLORS = {
    'cataract': '#1d4e89',
    'vitreo_retina': '#00a6a6',
    'glaucoma': '#e07a5f',
    'cornea': '#81b29a',
}


# ------------------------------------------------------------------ helpers
def local_today():
    """Today's date in the hospital's timezone (not the server's)."""
    return timezone.now().astimezone(HOSPITAL_TZ).date()


def get_per_page(request, key):
    """Read a per-page value (10 / 20 / 50) from the URL, defaulting to 10."""
    try:
        value = int(request.GET.get(key, 10))
    except ValueError:
        return 10
    return value if value in ALLOWED_PER_PAGE else 10


def parse_date(value):
    """Turn 'YYYY-MM-DD' into a date, or None if missing/invalid."""
    try:
        return datetime.date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def normalize(text):
    """Lower-case and drop punctuation so 'Anti-Glaucoma' == 'anti_glaucoma'."""
    return re.sub(r'[^a-z0-9]', '', str(text).lower())


def matching_choice_keys(choices, query):
    """Stored keys of a choices field whose key OR display label matches the query."""
    needle = normalize(query)
    if not needle:
        return []
    return [
        key for key, label in choices
        if needle in normalize(key) or needle in normalize(label)
    ]


def read_filters(request):
    """Read and clean the shared filters. Used by the page AND both CSV exports,
    so the screen and the downloads always agree."""
    search = request.GET.get('search', '').strip()[:MAX_SEARCH_LENGTH]
    date_from = parse_date(request.GET.get('date_from'))
    date_to = parse_date(request.GET.get('date_to'))
    if date_from and date_to and date_from > date_to:
        date_from, date_to = date_to, date_from
    stock_status = request.GET.get('stock_status', '')
    if stock_status not in STOCK_STATUSES:
        stock_status = ''
    return {
        'search': search,
        'date_from': date_from,
        'date_to': date_to,
        'stock_status': stock_status,
    }


def stock_status_filter(status, today):
    """Q object for a stock status. Single source of truth for the rules.

    Precedence: Out of Stock -> Expired -> Low Stock -> OK
    """
    in_stock = Q(current_quantity__gt=0)
    not_expired = Q(expiry_date__gte=today)
    if status == 'out_of_stock':
        return Q(current_quantity=0)
    if status == 'expired':
        return in_stock & Q(expiry_date__lt=today)
    if status == 'low_stock':
        return in_stock & not_expired & Q(current_quantity__lte=F('reorder_threshold'))
    if status == 'ok':
        return in_stock & not_expired & Q(current_quantity__gt=F('reorder_threshold'))
    return Q()


def stock_status_label(item, today):
    """Same precedence as stock_status_filter(), for a single row (used by the CSV)."""
    if item.current_quantity == 0:
        return 'Out of Stock'
    if item.expiry_date < today:
        return 'Expired'
    if item.current_quantity <= item.reorder_threshold:
        return 'Low Stock'
    return 'OK'


def dispensing_queryset(filters):
    logs = MedicineDispensingLog.objects.order_by('-date', '-id')
    search = filters['search']
    if search:
        category_keys = matching_choice_keys(MedicineDispensingLog.CATEGORY_CHOICES, search)
        logs = logs.filter(
            Q(medicine_name__icontains=search)
            | Q(hospital_branch__icontains=search)
            | Q(patient_mrn__icontains=search)
            | Q(category__in=category_keys)
        )
    if filters['date_from']:
        logs = logs.filter(date__gte=filters['date_from'])
    if filters['date_to']:
        logs = logs.filter(date__lte=filters['date_to'])
    return logs


def stock_queryset(filters, today):
    items = SurgicalConsumableStock.objects.order_by('expiry_date', 'id')
    search = filters['search']
    if search:
        subspecialty_keys = matching_choice_keys(
            SurgicalConsumableStock.SUBSPECIALTY_CHOICES, search
        )
        items = items.filter(
            Q(item_name__icontains=search)
            | Q(subspecialty__in=subspecialty_keys)
        )
    if filters['stock_status']:
        items = items.filter(stock_status_filter(filters['stock_status'], today))
    return items


# CSV helpers ---------------------------------------------------------------
FORMULA_PREFIXES = ('=', '+', '-', '@', '\t', '\r')


def csv_safe(value):
    """Stop Excel/Sheets treating text as a formula (CSV injection)."""
    if isinstance(value, str) and value.startswith(FORMULA_PREFIXES):
        return "'" + value
    return value


class _Echo:
    """File-like object whose write() just returns the value (for streaming)."""
    def write(self, value):
        return value


def csv_response(filename, header, rows):
    """Stream a UTF-8 CSV (with BOM so Excel reads it correctly)."""
    writer = csv.writer(_Echo())

    def generate():
        yield '\ufeff'
        yield writer.writerow(header)
        for row in rows:
            yield writer.writerow(row)

    response = StreamingHttpResponse(generate(), content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


# -------------------------------------------------------------------- views
@pharmacy_login_required
@never_cache
def index(request):
    today = local_today()
    near_expiry_date = today + datetime.timedelta(days=NEAR_EXPIRY_DAYS)

    filters = read_filters(request)
    log_per_page = get_per_page(request, 'log_per_page')
    stock_per_page = get_per_page(request, 'stock_per_page')

    dispensing_logs = dispensing_queryset(filters)
    stock_items = stock_queryset(filters, today)

    # Stat cards
    total_dispensed = (
        MedicineDispensingLog.objects.filter(date=today)
        .aggregate(total=Sum('quantity_dispensed'))['total'] or 0
    )
    # One query; "low" and "expired" use the same rules as the table filter and badges.
    stock_stats = SurgicalConsumableStock.objects.aggregate(
        low_stock=Count('pk', filter=stock_status_filter('low_stock', today)),
        near_expiry=Count('pk', filter=Q(expiry_date__gte=today, expiry_date__lte=near_expiry_date)),
        expired=Count('pk', filter=stock_status_filter('expired', today)),
    )

    # Pagination
    log_paginator = Paginator(dispensing_logs, log_per_page)
    log_page = log_paginator.get_page(request.GET.get('log_page', 1))

    stock_paginator = Paginator(stock_items, stock_per_page)
    stock_page = stock_paginator.get_page(request.GET.get('stock_page', 1))

    # Compact page lists, e.g. 1 ... 4 5 [6] 7 8 ... 50
    log_pages = list(
        log_paginator.get_elided_page_range(log_page.number, on_each_side=2, on_ends=1)
    )
    stock_pages = list(
        stock_paginator.get_elided_page_range(stock_page.number, on_each_side=2, on_ends=1)
    )

    # Shared filters, appended to every pager / export link
    date_from_str = filters['date_from'].isoformat() if filters['date_from'] else ''
    date_to_str = filters['date_to'].isoformat() if filters['date_to'] else ''
    filters_qs = urlencode({
        'search': filters['search'],
        'date_from': date_from_str,
        'date_to': date_to_str,
        'stock_status': filters['stock_status'],
    })
    has_filters = bool(
        filters['search'] or filters['date_from'] or filters['date_to'] or filters['stock_status']
    )

    context = {
        'today': today,
        'search_query': filters['search'],
        'date_from': date_from_str,
        'date_to': date_to_str,
        'stock_status': filters['stock_status'],
        'filters_qs': filters_qs,
        'has_filters': has_filters,
        'log_per_page': log_per_page,
        'stock_per_page': stock_per_page,
        'dispensing_logs': log_page,
        'stock_items': stock_page,
        'log_pages': log_pages,
        'stock_pages': stock_pages,
        'ellipsis': Paginator.ELLIPSIS,
        'total_dispensed': total_dispensed,
        'low_stock_count': stock_stats['low_stock'],
        'near_expiry_count': stock_stats['near_expiry'],
        'expired_count': stock_stats['expired'],
    }
    return render(request, 'pharmacy_reports/index.html', context)


@pharmacy_login_required
@never_cache
def analytics(request):
    today = local_today()
    start = today - datetime.timedelta(days=ANALYTICS_DAYS - 1)  # exactly 30 days incl. today

    # Pie: units dispensed by category (all time)
    category_names = dict(MedicineDispensingLog.CATEGORY_CHOICES)
    category_rows = (
        MedicineDispensingLog.objects
        .values('category')
        .annotate(total=Sum('quantity_dispensed'))
        .order_by('-total')
    )
    category = {'labels': [], 'totals': [], 'colors': []}
    for row in category_rows:
        key = row['category']
        category['labels'].append(category_names.get(key, key))
        category['totals'].append(row['total'] or 0)
        category['colors'].append(CATEGORY_COLORS.get(key, FALLBACK_COLOR))

    # Bar: daily dispensing, last 30 days, with zero-filled gaps
    daily_rows = (
        MedicineDispensingLog.objects
        .filter(date__range=(start, today))
        .values('date')
        .annotate(total=Sum('quantity_dispensed'))
        .order_by()
    )
    daily_map = {row['date']: row['total'] or 0 for row in daily_rows}
    days = [start + datetime.timedelta(days=i) for i in range(ANALYTICS_DAYS)]
    daily = {
        'labels': [d.strftime('%d %b') for d in days],
        'totals': [daily_map.get(d, 0) for d in days],
    }

    # Bar: current stock by subspecialty (every subspecialty shown, even at 0)
    stock_rows = (
        SurgicalConsumableStock.objects
        .values('subspecialty')
        .annotate(total=Sum('current_quantity'))
        .order_by()
    )
    stock_map = {row['subspecialty']: row['total'] or 0 for row in stock_rows}
    sub_rows = sorted(
        (
            (label, stock_map.get(key, 0), SUBSPECIALTY_COLORS.get(key, FALLBACK_COLOR))
            for key, label in SurgicalConsumableStock.SUBSPECIALTY_CHOICES
        ),
        key=lambda r: -r[1],
    )
    subspecialty = {
        'labels': [r[0] for r in sub_rows],
        'totals': [r[1] for r in sub_rows],
        'colors': [r[2] for r in sub_rows],
    }

    context = {
        'days': ANALYTICS_DAYS,
        # Rendered with |json_script in the template (safe for JavaScript)
        'chart_data': {
            'category': category,
            'daily': daily,
            'subspecialty': subspecialty,
        },
        'has_category': bool(category['labels']),
        'has_daily': any(daily['totals']),
        'has_subspecialty': any(subspecialty['totals']),
    }
    return render(request, 'pharmacy_reports/analytics.html', context)


@pharmacy_login_required
@never_cache
def export_dispensing_csv(request):
    today = local_today()
    logs = dispensing_queryset(read_filters(request))

    def rows():
        for log in logs.iterator(chunk_size=2000):
            yield [
                log.date.isoformat(),
                csv_safe(log.patient_mrn),
                csv_safe(log.medicine_name),
                csv_safe(log.get_category_display()),
                csv_safe(log.hospital_branch),
                log.quantity_dispensed,
                log.unit_price,
                csv_safe(log.batch_number),
            ]

    return csv_response(
        f'dispensing_log_{today}.csv',
        ['Date', 'Patient MRN', 'Medicine', 'Category', 'Branch', 'Qty', 'Unit Price', 'Batch'],
        rows(),
    )


@pharmacy_login_required
@never_cache
def export_stock_csv(request):
    today = local_today()
    items = stock_queryset(read_filters(request), today)

    def rows():
        for item in items.iterator(chunk_size=2000):
            yield [
                csv_safe(item.item_name),
                csv_safe(item.get_subspecialty_display()),
                item.current_quantity,
                item.reorder_threshold,
                item.expiry_date.isoformat(),
                stock_status_label(item, today),
            ]

    return csv_response(
        f'surgical_stock_{today}.csv',
        ['Item', 'Subspecialty', 'Current Qty', 'Reorder At', 'Expiry Date', 'Status'],
        rows(),
    )