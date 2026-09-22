from django.shortcuts import render

# ==========================================
# Developer: Naimul
# Task: Implement your login, logout, and profile logic below.
# ==========================================

def login_view(request):
    """
    Very simple starter login view for Naimul's module.
    """
    return render(request, 'users_naimul/login.html')
