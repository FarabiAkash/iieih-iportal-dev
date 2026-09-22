from django.shortcuts import render

# ==========================================
# Developer: Adnan
# Task: Implement your login, logout, and profile logic below.
# ==========================================

def login_view(request):
    """
    Very simple starter login view for Adnan's module.
    """
    return render(request, 'users_adnan/login.html')
