from django.urls import path
from . import views

app_name = 'pharmacy_reports'

urlpatterns = [
    path('', views.index, name='index'),
    path('analytics/', views.analytics, name='analytics'),
    path('export/dispensing/', views.export_dispensing_csv, name='export_dispensing'),
    path('export/stock/', views.export_stock_csv, name='export_stock'),
]