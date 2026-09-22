from django.shortcuts import render

# ==========================================
# Developer: Nusrat
# App: opd_ipd_reports
# Task: Create your OPD/IPD reporting views here.
# ==========================================

def index(request):
    """
    Skeletal index view for OPD/IPD census reports.
    """
    return render(request, 'opd_ipd_reports/index.html')
