from django.shortcuts import render
from django.db.models import Sum, F
from django.core.paginator import Paginator
from .models import MedicineDispensingLog, SurgicalConsumableStock
import datetime

def index(request):
    today = datetime.date.today()
    near_expiry_date = today + datetime.timedelta(days=90)

    # Search
    search_query = request.GET.get('search', '')

    # Dispensing logs
    dispensing_logs = MedicineDispensingLog.objects.all().order_by('-date')
    if search_query:
        dispensing_logs = dispensing_logs.filter(
            medicine_name__icontains=search_query
        ) | dispensing_logs.filter(
            hospital_branch__icontains=search_query
        ) | dispensing_logs.filter(
            category__icontains=search_query
        ) | dispensing_logs.filter(
            patient_mrn__icontains=search_query
        )

    # Surgical stock
    stock_items = SurgicalConsumableStock.objects.all().order_by('expiry_date')
    if search_query:
        stock_items = stock_items.filter(
            item_name__icontains=search_query
        ) | stock_items.filter(
            subspecialty__icontains=search_query
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

    # Pagination — dispensing logs
    log_paginator = Paginator(dispensing_logs, 10)
    log_page_number = request.GET.get('log_page', 1)
    log_page = log_paginator.get_page(log_page_number)

    # Pagination — stock items
    stock_paginator = Paginator(stock_items, 10)
    stock_page_number = request.GET.get('stock_page', 1)
    stock_page = stock_paginator.get_page(stock_page_number)

    context = {
        'today': today,
        'search_query': search_query,
        'dispensing_logs': log_page,
        'stock_items': stock_page,
        'total_dispensed': total_dispensed,
        'low_stock_count': low_stock_count,
        'near_expiry_count': near_expiry_count,
        'expired_count': expired_count,
    }

    return render(request, 'pharmacy_reports/index.html', context)