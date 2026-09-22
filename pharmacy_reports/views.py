from django.shortcuts import render

# ==========================================
# Developer: Adnan
# App: pharmacy_reports
# Task: Create your pharmacy & inventory reporting views here.
# ==========================================

def index(request):
    """
    Skeletal index view for pharmacy & consumables reports.
    """
    return render(request, 'pharmacy_reports/index.html')
