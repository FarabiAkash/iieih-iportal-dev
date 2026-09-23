# from django.urls import path
# from . import views

# app_name = 'users_ruhul'

# urlpatterns = [
#     path('login/', views.login_view, name='login'),
#     # Ruhul: Add more URLs here (e.g. logout, profile, register)
# ]


from django.urls import path

from .views import (
    registration_view,
    login_view,
    logout_view,
    profile_view,
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

]
