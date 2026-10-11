from django.urls import path

from .views import (
    registration_view,
    login_view,
    logout_view,
    profile_view,
    profile_update_view,

    test_password_reset_view,
    test_password_reset_done_view,
    test_password_reset_confirm_view,
    test_password_reset_complete_view,
)


urlpatterns = [

    # =====================================================
    # AUTHENTICATION
    # =====================================================

    path(
        'registration/',
        registration_view,
        name='ruhul_registration'
    ),

    path(
        'login/',
        login_view,
        name='ruhul_login'
    ),

    path(
        'logout/',
        logout_view,
        name='ruhul_logout'
    ),


    # =====================================================
    # PROFILE
    # =====================================================

    path(
        'profile/',
        profile_view,
        name='ruhul_profile'
    ),

    path(
        'profile/update/',
        profile_update_view,
        name='ruhul_profile_update'
    ),


    # =====================================================
    # TEST PASSWORD RESET
    # =====================================================

    path(
        'password-reset/',
        test_password_reset_view,
        name='password_reset'
    ),

    path(
        'password-reset/done/',
        test_password_reset_done_view,
        name='password_reset_done'
    ),

    path(
        'password-reset-confirm/',
        test_password_reset_confirm_view,
        name='password_reset_confirm'
    ),

    path(
        'password-reset-complete/',
        test_password_reset_complete_view,
        name='password_reset_complete'
    ),

]