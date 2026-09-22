from django.urls import path
from . import views

app_name = 'users_adnan'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    # Adnan: Add more URLs here (e.g. logout, profile, register)
]

