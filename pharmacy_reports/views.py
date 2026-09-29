from django.shortcuts import render
from django.db.models import Sum, F, Q
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required
from .models import MedicineDispensingLog, SurgicalConsumableStock
from urllib.parse import urlencode
import datetime

ALLOWED_PER_PAGE = (10, 20, 50)
STOCK_STATUSES = ('out_of_stock', 'expired', 'low_stock', 'ok')


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


def stock_status_filter(status, today):
    """Q object matching the same rules as the status badges in the template.

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


@login_required(login_url='/adnan/login/')
def index(request):
    today = datetime.date.today()
    near_expiry_date = today + datetime.timedelta(days=90)

    search_query = request.GET.get('search', '')

    # Date range (dispensing log) and status (stock table)
    date_from = parse_date(request.GET.get('date_from'))
    date_to = parse_date(request.GET.get('date_to'))
    if date_from and date_to and date_from > date_to:
        date_from, date_to = date_to, date_from
    stock_status = request.GET.get('stock_status', '')
    if stock_status not in STOCK_STATUSES:
        stock_status = ''

    # Each table has its own page size
    log_per_page = get_per_page(request, 'log_per_page')
    stock_per_page = get_per_page(request, 'stock_per_page')

    # Dispensing log
    dispensing_logs = MedicineDispensingLog.objects.all().order_by('-date', '-id')
    if search_query:
        dispensing_logs = dispensing_logs.filter(
            Q(medicine_name__icontains=search_query)
            | Q(hospital_branch__icontains=search_query)
            | Q(category__icontains=search_query)
            | Q(patient_mrn__icontains=search_query)
        )

    if date_from:
        dispensing_logs = dispensing_logs.filter(date__gte=date_from)
    if date_to:
        dispensing_logs = dispensing_logs.filter(date__lte=date_to)

    # Surgical stock
    stock_items = SurgicalConsumableStock.objects.all().order_by('expiry_date', 'id')
    if search_query:
        stock_items = stock_items.filter(
            Q(item_name__icontains=search_query)
            | Q(subspecialty__icontains=search_query)
        )

    if stock_status:
        stock_items = stock_items.filter(stock_status_filter(stock_status, today))

    # Stat cards
    total_dispensed = MedicineDispensingLog.objects.filter(
        date=today
    ).aggregate(Sum('quantity_dispensed'))['quantity_dispensed__sum'] or 0

    low_stock_count = SurgicalConsumableStock.objects.filter(
    current_quantity__gt=0,
    current_quantity__lte=F('reorder_threshold'),
    expiry_date__gte=today
    ).count()

    near_expiry_count = SurgicalConsumableStock.objects.filter(
        expiry_date__lte=near_expiry_date,
        expiry_date__gte=today
    ).count()

    expired_count = SurgicalConsumableStock.objects.filter(
        expiry_date__lt=today
    ).count()

    # Pagination
    log_paginator = Paginator(dispensing_logs, log_per_page)
    log_page = log_paginator.get_page(request.GET.get('log_page', 1))

    stock_paginator = Paginator(stock_items, stock_per_page)
    stock_page = stock_paginator.get_page(request.GET.get('stock_page', 1))

    # Compact page lists, e.g. 1 ··· 4 5 [6] 7 8 ··· 50
    log_pages = list(
        log_paginator.get_elided_page_range(log_page.number, on_each_side=2, on_ends=1)
    )
    stock_pages = list(
        stock_paginator.get_elided_page_range(stock_page.number, on_each_side=2, on_ends=1)
    )

    # Shared filters, appended to every pager link so nothing is lost
    date_from_str = date_from.isoformat() if date_from else ''
    date_to_str = date_to.isoformat() if date_to else ''
    filters_qs = urlencode({
        'search': search_query,
        'date_from': date_from_str,
        'date_to': date_to_str,
        'stock_status': stock_status,
    })
    has_filters = bool(search_query or date_from or date_to or stock_status)

    context = {
        'today': today,
        'search_query': search_query,
        'date_from': date_from_str,
        'date_to': date_to_str,
        'stock_status': stock_status,
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
        'low_stock_count': low_stock_count,
        'near_expiry_count': near_expiry_count,
        'expired_count': expired_count,
    }

    return render(request, 'pharmacy_reports/index.html', context)

@login_required(login_url='/adnan/login/')
def analytics(request):
    today = datetime.date.today()
    last_30_days = today - datetime.timedelta(days=30)

    # Pie chart — medicines by category
    category_data = (
        MedicineDispensingLog.objects
        .values('category')
        .annotate(total=Sum('quantity_dispensed'))
        .order_by('-total')
    )
    category_labels = [item['category'] for item in category_data]
    category_display = [
        dict(MedicineDispensingLog.CATEGORY_CHOICES).get(c, c)
        for c in category_labels
    ]
    category_totals = [item['total'] for item in category_data]

    # Bar chart — daily dispensing last 30 days
    daily_data = (
        MedicineDispensingLog.objects
        .filter(date__gte=last_30_days)
        .values('date')
        .annotate(total=Sum('quantity_dispensed'))
        .order_by('date')
    )
    daily_labels = [str(item['date']) for item in daily_data]
    daily_totals = [item['total'] for item in daily_data]

    # Bar chart — stock by subspecialty
    subspecialty_data = (
        SurgicalConsumableStock.objects
        .values('subspecialty')
        .annotate(total=Sum('current_quantity'))
        .order_by('-total')
    )
    subspecialty_labels = [
        dict(SurgicalConsumableStock.SUBSPECIALTY_CHOICES).get(item['subspecialty'], item['subspecialty'])
        for item in subspecialty_data
    ]
    subspecialty_totals = [item['total'] for item in subspecialty_data]

    context = {
        'today': today,
        'category_labels': category_display,
        'category_totals': category_totals,
        'daily_labels': daily_labels,
        'daily_totals': daily_totals,
        'subspecialty_labels': subspecialty_labels,
        'subspecialty_totals': subspecialty_totals,
    }

    return render(request, 'pharmacy_reports/analytics.html', context)