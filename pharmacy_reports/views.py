# from django.shortcuts import render

# # ==========================================
# # Developer: Adnan
# # App: pharmacy_reports
# # Task: Create your pharmacy & inventory reporting views here.
# # ==========================================

# def index(request):
#     """
#     Skeletal index view for pharmacy & consumables reports.
#     """
#     return render(request, 'pharmacy_reports/index.html')



from django.shortcuts import render
from django.db.models import Sum, F
from .models import MedicineDispensingLog, SurgicalConsumableStock
import datetime

def index(request):
    today = datetime.date.today()
    near_expiry_date = today + datetime.timedelta(days=90)

    dispensing_logs = MedicineDispensingLog.objects.all()

    total_dispensed = MedicineDispensingLog.objects.filter(
        date=today
    ).aggregate(Sum('quantity_dispensed'))['quantity_dispensed__sum'] or 0

    stock_items = SurgicalConsumableStock.objects.all()

    low_stock_count = stock_items.filter(
        current_quantity__lte=F('reorder_threshold')
    ).count()

    near_expiry_count = stock_items.filter(
        expiry_date__lte=near_expiry_date
    ).count()

    context = {
        'dispensing_logs': dispensing_logs,
        'stock_items': stock_items,
        'total_dispensed': total_dispensed,
        'low_stock_count': low_stock_count,
        'near_expiry_count': near_expiry_count,
    }

    return render(request, 'pharmacy_reports/index.html', context)
