"""
URL configuration for iieih_portal project.
"""
from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),

    # Minimal Portal Navigation
    path('', views.home, name='home'),

    # Intern Auth & Profile Modules
    path('naimul/', include('users_naimul.urls')),
    path('nusrat/', include('users_nusrat.urls')),
    path('ruhul/', include('users_ruhul.urls')),

    # Intern Domain Reporting Modules
    path('surgeries/', include('surgeries_procedures.urls')),
    path('opd-ipd/', include('opd_ipd_reports.urls')),
    path('finance/', include('financial_reports.urls')),

    # App 4: Consolidated Executive Dashboard
    path('dashboard/', include('executive_dashboard.urls')),
]
