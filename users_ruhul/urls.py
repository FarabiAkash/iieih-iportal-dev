from django.urls import path
from . import views

app_name = 'users_ruhul'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    # Ruhul: Add more URLs here (e.g. logout, profile, register)
]
