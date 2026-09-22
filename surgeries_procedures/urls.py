from django.urls import path
from . import views

app_name = 'surgeries_procedures'

urlpatterns = [
    path('', views.index, name='index'),
    # Naimul: Add more report URLs here
]
