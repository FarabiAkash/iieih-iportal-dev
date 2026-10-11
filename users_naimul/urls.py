from django.urls import path
from . import views

app_name = 'users_naimul'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    # Naimul: Add more URLs here (e.g. logout, profile, register)
]
