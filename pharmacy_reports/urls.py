from django.urls import path
from . import views

app_name = 'pharmacy_reports'

urlpatterns = [
    path('', views.index, name='index'),
    # Adnan: Add more report URLs here
]

