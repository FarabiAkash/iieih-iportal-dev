from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from .models import *

from .forms import RegistrationForm, LoginForm ,ProfileUpdateForm


def registration_view(request):

    if request.method == 'POST':
        form = RegistrationForm(request.POST)

        if form.is_valid():
            user = form.save()

            messages.success(
                request,
                'Registration Successfully Completed.'
            )

            login(request, user)

            return redirect('ruhul_profile')

    else:
        form = RegistrationForm()

    context = {
        'form_data': form,
        'form_title': 'Registration Information',
        'form_btn': 'Register'
    }

    return render(
        request,
        'users_ruhul/profile_form.html',
        context
    )


def login_view(request):

    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)

        if form.is_valid():
            user = form.get_user()

            login(request, user)

            messages.success(
                request,
                'Login Successfully.'
            )

            return redirect('ruhul_profile')

    else:
        form = LoginForm()

    context = {
        'form_data': form,
        'form_title': 'Login Information',
        'form_btn': 'Login'
    }

    return render(
        request,
        'users_ruhul/profile_form.html',
        context
    )


@login_required
def logout_view(request):

    logout(request)

    messages.success(
        request,
        'Logout Successfully.'
    )

    return redirect('ruhul_login')


from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import RuhulProfile


@login_required
def profile_view(request):

    user = request.user

    profile, created = RuhulProfile.objects.get_or_create(
        user=user
    )

    context = {
        'profile': profile,
        'user_profile': user,
    }

    return render(
        request,
        'users_ruhul/profile.html',
        context
    )

@login_required
def profile_update_view(request):

    user = request.user

    profile, created = RuhulProfile.objects.get_or_create(
        user=user
    )

    if request.method == 'POST':

        form = ProfileUpdateForm(
            request.POST,
            instance=profile,
            user=user
        )

        if form.is_valid():

            # =========================
            # Update User Information
            # =========================

            user.first_name = form.cleaned_data['first_name']

            user.last_name = form.cleaned_data['last_name']

            user.username = form.cleaned_data['username']

            user.email = form.cleaned_data['email']

            user.save()


            # =========================
            # Update Profile Information
            # =========================

            profile = form.save(commit=False)

            profile.user = user

            profile.save()


            messages.success(
                request,
                'Profile updated successfully.'
            )

            return redirect('ruhul_profile')

    else:

        form = ProfileUpdateForm(
            instance=profile,
            user=user
        )

    context = {
        'form_data': form,
        'form_title': 'Update Profile',
        'form_btn': 'Update Profile'
    }

    return render(
        request,
        'users_ruhul/profile_Update_form.html',
        context
    )