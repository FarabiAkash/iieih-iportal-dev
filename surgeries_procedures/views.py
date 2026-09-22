from django.shortcuts import render

# ==========================================
# Developer: Naimul
# App: surgeries_procedures
# Task: Create your surgery & procedure reporting views here.
# ==========================================

def index(request):
    """
    Skeletal index view for surgeries & procedures report.
    """
    return render(request, 'surgeries_procedures/index.html')
