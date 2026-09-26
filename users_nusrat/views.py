from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import NusratProfile

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
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        assigned_counter = request.POST.get("assigned_counter", "").strip()
        shift = request.POST.get("shift", "")
        desk_extension = request.POST.get("desk_extension", "").strip()

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

        # Check password length
        if len(password) < 8:
            return render(
                request,
                "users_nusrat/register.html",
                {
                    "error": "Password must be at least 8 characters long.",
                    "username": username,
                    "email": email,
                    "assigned_counter": assigned_counter,
                    "shift": shift,
                    "desk_extension": desk_extension,
                }
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

        return redirect("/nusrat/login/?registered=1")

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