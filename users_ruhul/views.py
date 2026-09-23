from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages

from .forms import RegistrationForm, LoginForm


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


@login_required
def profile_view(request):

    profile = request.user.ruhul_profile

    context = {
        'profile': profile
    }

    return render(
        request,
        'users_ruhul/profile.html',
        context
    )