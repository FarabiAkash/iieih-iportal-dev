# from django.shortcuts import render

# # ==========================================
# # Developer: Adnan
# # Task: Implement your login, logout, and profile logic below.
# # ==========================================

# def login_view(request):
#     """
#     Very simple starter login view for Adnan's module.
#     """
#     return render(request, 'users_adnan/login.html')


from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required

def login_view(request):
    error = None
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('/pharmacy/')
        else:
            error = 'Invalid username or password.'
    return render(request, 'users_adnan/login.html', {'error': error})

def logout_view(request):
    logout(request)
    return redirect('/adnan/login/')