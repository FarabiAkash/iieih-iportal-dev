from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from .models import RuhulProfile
from .forms import (
    RegistrationForm,
    LoginForm,
    ProfileUpdateForm,
    TestPasswordResetForm,
    TestSetPasswordForm,
)


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


@login_required(login_url='ruhul_login')
def logout_view(request):

    logout(request)

    messages.success(
        request,
        'Logout Successfully.'
    )

    return redirect('ruhul_login')


@login_required(login_url='ruhul_login')
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

@login_required(login_url='ruhul_login')
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


# =========================================================
# TEST PASSWORD RESET
# =========================================================

def test_password_reset_view(request):

    if request.method == 'POST':

        form = TestPasswordResetForm(request.POST)

        if form.is_valid():

            email = form.cleaned_data['email']

            # Find registered user by email
            user = User.objects.filter(
                email__iexact=email
            ).first()

            request.session['password_reset_email'] = email

            if user:

                request.session['password_reset_user_id'] = user.id

                request.session['password_reset_valid'] = True

            else:

                request.session['password_reset_user_id'] = None

                request.session['password_reset_valid'] = False

            return redirect('password_reset_done')

    else:

        form = TestPasswordResetForm()

    return render(
        request,
        'users_ruhul/password_reset_form.html',
        {
            'form': form,
        }
    )


# =========================================================
# PASSWORD RESET DONE
# =========================================================

def test_password_reset_done_view(request):

    return render(
        request,
        'users_ruhul/password_reset_done.html'
    )


# =========================================================
# PASSWORD RESET CONFIRM
# =========================================================

def test_password_reset_confirm_view(request):

    user_id = request.session.get(
        'password_reset_user_id'
    )

    valid_reset = request.session.get(
        'password_reset_valid',
        False
    )

    # No valid registered user
    if not valid_reset or not user_id:

        return render(
            request,
            'users_ruhul/password_reset_confirm.html',
            {
                'validlink': False,
            }
        )

    try:

        user = User.objects.get(
            id=user_id
        )

    except User.DoesNotExist:

        request.session.flush()

        return render(
            request,
            'users_ruhul/password_reset_confirm.html',
            {
                'validlink': False,
            }
        )


    if request.method == 'POST':

        form = TestSetPasswordForm(
            user=user,
            data=request.POST
        )

        if form.is_valid():

            form.save()

            # Clear reset session
            request.session.pop(
                'password_reset_email',
                None
            )

            request.session.pop(
                'password_reset_user_id',
                None
            )

            request.session.pop(
                'password_reset_valid',
                None
            )

            return redirect(
                'password_reset_complete'
            )

    else:

        form = TestSetPasswordForm(
            user=user
        )


    return render(
        request,
        'users_ruhul/password_reset_confirm.html',
        {
            'form': form,
            'validlink': True,
        }
    )


# =========================================================
# PASSWORD RESET COMPLETE
# =========================================================

def test_password_reset_complete_view(request):

    return render(
        request,
        'users_ruhul/password_reset_complete.html'
    )