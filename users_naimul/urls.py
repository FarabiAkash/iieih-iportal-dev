from django.urls import path
from . import views

app_name = 'users_naimul'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    # OT slot availability API — returns booked slots for a given room + date
    path('api/ot-slot-availability/', views.ot_slot_availability_api, name='ot_slot_availability_api'),
]
