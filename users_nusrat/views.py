import re

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import NusratProfile
from django.contrib import messages

def login_view(request):

    if request.method == "POST":

        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            login(request, user)

            return redirect('/opd-ipd/')

        else:
            return render(
                request,
                'users_nusrat/login.html',
                {
                    "error": "Invalid username or password"
                }
            )

    return render(
        request,
        'users_nusrat/login.html'
    )



def logout_view(request):

    logout(request)

    return redirect('/nusrat/login/')


def register_view(request):

    if request.GET.get("registered") == "1": 

        success = "Registration successful! Your account has been created. You can now log in." 
        return render( request, "users_nusrat/register.html", { "success": success } )

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        assigned_counter = request.POST.get("assigned_counter", "").strip()
        shift = request.POST.get("shift", "")
        desk_extension = request.POST.get("desk_extension", "").strip()

        context = { 
            "username": username, 
            "email": email, 
            "assigned_counter": assigned_counter, 
            "shift": shift, 
            "desk_extension": desk_extension,    
        }

        # Check required fields
        if not all([
            username,
            email,
            password,
            confirm_password,
            assigned_counter,
            shift,
            desk_extension
        ]):
            return render(
                request,
                "users_nusrat/register.html",
                {
                    "error": "Please fill in all fields.",
                    "username": username,
                    "email": email,
                    "assigned_counter": assigned_counter,
                    "shift": shift,
                    "desk_extension": desk_extension,
                }
            )

        # Check username
        if User.objects.filter(username=username).exists():
            return render(
                request,
                "users_nusrat/register.html",
                {
                    "error": "This username is already registered.",
                    "username": username,
                    "email": email,
                    "assigned_counter": assigned_counter,
                    "shift": shift,
                    "desk_extension": desk_extension,
                }
            )

        # Check email
        if User.objects.filter(email=email).exists():
            return render(
                request,
                "users_nusrat/register.html",
                {
                    "error": "This email address is already registered.",
                    "username": username,
                    "email": email,
                    "assigned_counter": assigned_counter,
                    "shift": shift,
                    "desk_extension": desk_extension,
                }
            )


        # Check for at least 8 characters, a capital letter, a number & a special character
        if(
            len(password) < 8
            or not re.search(r"[A-Z]", password)
            or not re.search(r"[0-9]", password)
            or not re.search(r"[^A-Za-z0-9]", password)
        ):
            context["error"] = (
            "Password must contain at least 8 characters, include a capital letter, a number & a special character."
            )

            return render(
                request,
                "users_nusrat/register.html",
                context
            )

        # Check password confirmation
        if password != confirm_password:
            return render(
                request,
                "users_nusrat/register.html",
                {
                    "error": "Passwords do not match.",
                    "username": username,
                    "email": email,
                    "assigned_counter": assigned_counter,
                    "shift": shift,
                    "desk_extension": desk_extension,
                }
            )


        # Create Django user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # Create Nusrat profile with registration information
        NusratProfile.objects.create(
            user=user,
            assigned_counter=assigned_counter,
            shift=shift,
            desk_extension=desk_extension
        )

        return redirect("/nusrat/register/?registered=1")

    return render(
        request,
        "users_nusrat/register.html"
    )


@login_required
def profile_view(request):
    profile, created = NusratProfile.objects.get_or_create(
        user=request.user,
        defaults={
            "assigned_counter": "Registration Counter 2 - Glaucoma Desk",
            "shift": "morning",
            "desk_extension": "102",
        }
    )

    context = {
        "profile": profile,
    }

    return render(
        request,
        "users_nusrat/profile.html",
        context
    )