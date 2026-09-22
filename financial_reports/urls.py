from django.urls import path
from . import views

app_name = 'financial_reports'

urlpatterns = [
    path('', views.index, name='index'),
    # Ruhul: Add more report URLs here
]
