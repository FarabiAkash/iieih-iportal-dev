from django.urls import path
from . import views

app_name = 'users_nusrat'


urlpatterns = [

    path(
        'login/',
        views.login_view,
        name='login'
    ),

    path(
        'register/', 
        views.register_view, 
        name='register'
    ),

    path(
        'logout/',
        views.logout_view,
        name='logout'
    ),

    path(
        'profile/',
        views.profile_view,
        name='profile'
    ),

    path(
        'password-reset/',
        views.password_reset_view,
        name='password_reset'
    ),

    path(
        'password-reset/confirm/',
        views.password_reset_confirm_view,
        name='password_reset_confirm'
    ),

    path(
        'password-reset/complete/',
        views.password_reset_complete_view,
        name='password_reset_complete'
    ),

    path(
        "profile/update/", 
        views.update_profile_view, 
        name="update_profile"
    ),

    path(
        "account/delete/", 
        views.delete_account_view, 
        name="delete_account"
    ),

]