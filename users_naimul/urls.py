from django.urls import path
from . import views

app_name = 'users_naimul'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    # Naimul: Add more URLs here (e.g. logout, profile, register)
]
