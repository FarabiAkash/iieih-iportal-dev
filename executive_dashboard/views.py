from django.shortcuts import render

def index(request):
    """
    Skeletal index view for executive dashboard.
    """
    return render(request, 'executive_dashboard/index.html')
