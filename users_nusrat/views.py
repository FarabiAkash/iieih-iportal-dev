import re

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.contrib import messages

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

    if request.GET.get("registered") == "1":

        success = (
            "Registration successful! Your account has been created. "
            "You can now log in."
        )

        return render(
            request,
            "users_nusrat/register.html",
            {"success": success}
        )

    if request.method == "POST":

        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        assigned_counter = request.POST.get(
            "assigned_counter", ""
        ).strip()

        shift = request.POST.get("shift", "")

        desk_extension = request.POST.get(
            "desk_extension", ""
        ).strip()

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

            context["error"] = "Please fill in all fields."

            return render(
                request,
                "users_nusrat/register.html",
                context
            )

        # Check username
        if User.objects.filter(username=username).exists():

            context["error"] = (
                "This username is already registered."
            )

            return render(
                request,
                "users_nusrat/register.html",
                context
            )

        # Check email
        if User.objects.filter(email=email).exists():

            context["error"] = (
                "This email address is already registered."
            )

            return render(
                request,
                "users_nusrat/register.html",
                context
            )

        # Check password requirements
        if (
            len(password) < 8
            or not re.search(r"[A-Z]", password)
            or not re.search(r"[0-9]", password)
            or not re.search(r"[^A-Za-z0-9]", password)
        ):

            context["error"] = (
                "Password must contain at least 8 characters, "
                "include a capital letter, a number "
                "& a special character."
            )

            return render(
                request,
                "users_nusrat/register.html",
                context
            )

        # Check password confirmation
        if password != confirm_password:

            context["error"] = "Passwords do not match."

            return render(
                request,
                "users_nusrat/register.html",
                context
            )

        # Create Django user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # Create Nusrat profile
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


def password_reset_view(request):

    if request.method == "POST":

        email = request.POST.get("email", "").strip()

        if not email:

            return render(
                request,
                "users_nusrat/password_reset_form.html",
                {
                    "error": (
                        "Please enter your registered email address."
                    )
                }
            )

        try:
            user = User.objects.get(email__iexact=email)

        except User.DoesNotExist:

            return render(
                request,
                "users_nusrat/password_reset_form.html",
                {
                    "error": (
                        "No account is registered with this email address."
                    )
                }
            )

        # Store the user ID temporarily in the session
        request.session["password_reset_user_id"] = user.id

        return redirect("users_nusrat:password_reset_confirm")

    return render(
        request,
        "users_nusrat/password_reset_form.html"
    )


def password_reset_confirm_view(request):

    user_id = request.session.get("password_reset_user_id")

    if not user_id:
        return redirect("users_nusrat:password_reset")

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:

        request.session.pop("password_reset_user_id", None)

        return redirect("users_nusrat:password_reset")

    if request.method == "POST":

        password1 = request.POST.get("new_password1", "")
        password2 = request.POST.get("new_password2", "")

        if not password1:

            return render(
                request,
                "users_nusrat/password_reset_confirm.html",
                {
                    "error": "Please enter a new password."
                }
            )

        if password1 != password2:

            return render(
                request,
                "users_nusrat/password_reset_confirm.html",
                {
                    "error": "The two passwords do not match."
                }
            )

        if (
            len(password1) < 8
            or not re.search(r"[A-Z]", password1)
            or not re.search(r"[0-9]", password1)
            or not re.search(r"[^A-Za-z0-9]", password1)
        ):

            return render(
                request,
                "users_nusrat/password_reset_confirm.html",
                {
                    "error": (
                        "Password must contain at least 8 characters, "
                        "include a capital letter, a number "
                        "& a special character."
                    )
                }
            )

        # Change password
        user.set_password(password1)
        user.save()

        # Remove temporary session data
        request.session.pop("password_reset_user_id", None)

        return redirect(
            "users_nusrat:password_reset_complete"
        )

    return render(
        request,
        "users_nusrat/password_reset_confirm.html"
    )


def password_reset_complete_view(request):

    return render(
        request,
        "users_nusrat/password_reset_complete.html"
    )


@login_required
def profile_view(request):

    profile, created = NusratProfile.objects.get_or_create(
        user=request.user,
        defaults={
            "assigned_counter": (
                "Registration Counter 2 - Glaucoma Desk"
            ),
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


@login_required
def update_profile_view(request):

    profile, created = NusratProfile.objects.get_or_create(
        user=request.user,
        defaults={
            "assigned_counter": (
                "Registration Counter 2 - Glaucoma Desk"
            ),
            "shift": "morning",
            "desk_extension": "102",
        }
    )

    counter_choices = [ 
        "Registration Counter 1", 
        "Registration Counter 2", 
        "Registration Counter 3", 
        "Registration Counter 4", 
        "Registration Counter 5",
        "Registration Counter 6",
        "Registration Counter 7",
        "Registration Counter 8",
        "Registration Counter 9",
        "Registration Counter 10",
        "Registration Counter 11",
        "Registration Counter 12", 
    ]

    if ( 
        profile.assigned_counter 
        and profile.assigned_counter not in counter_choices 
    ): 
        counter_choices.append(profile.assigned_counter)

    context = {
        "profile": profile,
        "shift_choices": NusratProfile.SHIFT_CHOICES,
        "counter_choices": counter_choices,
    }

    if request.method == "POST":

        email = request.POST.get("email", "").strip()
        assigned_counter = request.POST.get(
            "assigned_counter", ""
        ).strip()
        shift = request.POST.get("shift", "")
        desk_extension = request.POST.get(
            "desk_extension", ""
        ).strip()

        # Preserve submitted values if validation fails
        context["form_data"] = {
            "email": email,
            "assigned_counter": assigned_counter,
            "shift": shift,
            "desk_extension": desk_extension,
        }

        # Check required fields
        if not all([
            email,
            assigned_counter,
            shift,
            desk_extension
        ]):

            context["error"] = "Please fill in all required fields."

            return render(
                request,
                "users_nusrat/update_profile.html",
                context
            )

        # Validate email format
        try:
            validate_email(email)

        except ValidationError:

            context["error"] = (
                "Please enter a valid email address."
            )

            return render(
                request,
                "users_nusrat/update_profile.html",
                context
            )

        # Check whether another user already uses this email
        if User.objects.filter(
            email__iexact=email
        ).exclude(
            pk=request.user.pk
        ).exists():

            context["error"] = (
                "This email address is already registered."
            )

            return render(
                request,
                "users_nusrat/update_profile.html",
                context
            )

        # Validate shift
        valid_shifts = dict(NusratProfile.SHIFT_CHOICES)

        if shift not in valid_shifts:

            context["error"] = "Please select a valid shift."

            return render(
                request,
                "users_nusrat/update_profile.html",
                context
            )

        # Update Django user email
        request.user.email = email
        request.user.save(update_fields=["email"])

        # Update staff profile information
        profile.assigned_counter = assigned_counter
        profile.shift = shift
        profile.desk_extension = desk_extension

        profile.save(
            update_fields=[
                "assigned_counter",
                "shift",
                "desk_extension",
            ]
        )

        messages.success(
            request,
            "Your profile has been updated successfully."
        )

        return redirect("users_nusrat:profile")

    return render(
        request,
        "users_nusrat/update_profile.html",
        context
    )


@login_required
def delete_account_view(request):

    if request.method == "POST":

        password = request.POST.get("password", "")
        confirm_delete = request.POST.get("confirm_delete")

        # Verify the current password
        if not request.user.check_password(password):

            return render(
                request,
                "users_nusrat/delete_account_confirm.html",
                {
                    "error": (
                        "Incorrect password. Please try again."
                    )
                }
            )

        # Require explicit confirmation
        if confirm_delete != "yes":

            return render(
                request,
                "users_nusrat/delete_account_confirm.html",
                {
                    "error": (
                        "Please confirm that you want to delete "
                        "your account."
                    )
                }
            )

        # Keep a reference to the user before logging out
        user = request.user

        # Log out before deleting the account
        user.delete() 
        logout(request) 
        
        return redirect("users_nusrat:login") 
    
    return render( 
        request, 
        "users_nusrat/delete_account_confirm.html", 
    )
