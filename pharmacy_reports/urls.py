from django.urls import path
from . import views

app_name = 'pharmacy_reports'

urlpatterns = [
    path('', views.index, name='index'),
    path('analytics/', views.analytics, name='analytics'),
]
