from django.shortcuts import render

# ==========================================
# Developer: Nusrat
# Task: Implement your login, logout, and profile logic below.
# ==========================================

def login_view(request):
    """
    Very simple starter login view for Nusrat's module.
    """
    return render(request, 'users_nusrat/login.html')
