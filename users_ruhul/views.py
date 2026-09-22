from django.shortcuts import render

# ==========================================
# Developer: Ruhul
# Task: Implement your login, logout, and profile logic below.
# ==========================================

def login_view(request):
    """
    Very simple starter login view for Ruhul's module.
    """
    return render(request, 'users_ruhul/login.html')
