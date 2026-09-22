from django.urls import path
from . import views

app_name = 'users_nusrat'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    # Nusrat: Add more URLs here (e.g. logout, profile, register)
]
