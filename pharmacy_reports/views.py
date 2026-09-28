from django.shortcuts import render
from django.db.models import Sum, F, Q
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required
from .models import MedicineDispensingLog, SurgicalConsumableStock
import datetime

ALLOWED_PER_PAGE = (10, 20, 50)


def get_per_page(request, key):
    """Read a per-page value (10 / 20 / 50) from the URL, defaulting to 10."""
    try:
        value = int(request.GET.get(key, 10))
    except ValueError:
        return 10
    return value if value in ALLOWED_PER_PAGE else 10


@login_required(login_url='/adnan/login/')
def index(request):
    today = datetime.date.today()
    near_expiry_date = today + datetime.timedelta(days=90)

    search_query = request.GET.get('search', '')

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

    # Surgical stock
    stock_items = SurgicalConsumableStock.objects.all().order_by('expiry_date', 'id')
    if search_query:
        stock_items = stock_items.filter(
            Q(item_name__icontains=search_query)
            | Q(subspecialty__icontains=search_query)
        )

    # Stat cards
    total_dispensed = MedicineDispensingLog.objects.filter(
        date=today
    ).aggregate(Sum('quantity_dispensed'))['quantity_dispensed__sum'] or 0

    low_stock_count = SurgicalConsumableStock.objects.filter(
        current_quantity__lte=F('reorder_threshold')
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

    context = {
        'today': today,
        'search_query': search_query,
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