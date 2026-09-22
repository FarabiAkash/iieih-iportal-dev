from django.urls import path
from . import views

app_name = 'opd_ipd_reports'

urlpatterns = [
    path('', views.index, name='index'),
    # Nusrat: Add more report URLs here
]
