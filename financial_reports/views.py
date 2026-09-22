from django.shortcuts import render

# ==========================================
# Developer: Ruhul
# App: financial_reports
# Task: Create your financial & collection reporting views here.
# ==========================================

def index(request):
    """
    Skeletal index view for financial & billing reports.
    """
    return render(request, 'financial_reports/index.html')
