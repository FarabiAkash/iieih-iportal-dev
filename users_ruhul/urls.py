from django.urls import path
from .views import (
    registration_view,
    login_view,
    logout_view,
    profile_view,
    profile_update_view,
)


urlpatterns = [

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

    # =========================
    # Password Reset
    # =========================

    # path(
    #     'password-reset/',
    #     auth_views.PasswordResetView.as_view(
    #         template_name='users_ruhul/password_reset.html',
    #         email_template_name='users_ruhul/password_reset_email.html',
    #         subject_template_name='users_ruhul/password_reset_subject.txt',
    #         success_url=reverse_lazy('password_reset_done')
    #     ),
    #     name='password_reset'
    # ),

    # path(
    #     'password-reset/done/',
    #     auth_views.PasswordResetDoneView.as_view(
    #         template_name='users_ruhul/password_reset_done.html'
    #     ),
    #     name='password_reset_done'
    # ),

    # path(
    #     'password-reset-confirm/<uidb64>/<token>/',
    #     auth_views.PasswordResetConfirmView.as_view(
    #         template_name='users_ruhul/password_reset_confirm.html',
    #         success_url=reverse_lazy('password_reset_complete')
    #     ),
    #     name='password_reset_confirm'
    # ),

    # path(
    #     'password-reset-complete/',
    #     auth_views.PasswordResetCompleteView.as_view(
    #         template_name='users_ruhul/password_reset_complete.html'
    #     ),
    #     name='password_reset_complete'
    # ),

]