from django.shortcuts import render
from django.db.models import Sum

from .models import DailyOPDCensus, IPDBedOccupancy


def index(request):
    # Get filter values from the URL
    selected_branch = request.GET.get('branch', '')
    selected_clinic = request.GET.get('clinic', '')

    # Get all OPD records
    opd_records = DailyOPDCensus.objects.all()

    # Filter by branch if selected
    if selected_branch:
        opd_records = opd_records.filter(
            hospital_branch=selected_branch
        )

    # Filter by clinic if selected
    if selected_clinic:
        opd_records = opd_records.filter(
            clinic_name=selected_clinic
        )

    # Calculate OPD statistics
    opd_stats = opd_records.aggregate(
        total_visits=Sum('total_visits'),
        new_patients=Sum('new_patients'),
        followup_patients=Sum('followup_patients'),
        refractions_done=Sum('refractions_done'),
    )

    # Replace None with 0
    total_visits = opd_stats['total_visits'] or 0
    new_patients = opd_stats['new_patients'] or 0
    followup_patients = opd_stats['followup_patients'] or 0
    refractions_done = opd_stats['refractions_done'] or 0

    # Get all IPD records
    ipd_records = IPDBedOccupancy.objects.all()

    # Filter IPD by branch
    if selected_branch:
        ipd_records = ipd_records.filter(
            hospital_branch=selected_branch
        )

    # Calculate IPD statistics
    ipd_stats = ipd_records.aggregate(
        total_beds=Sum('total_beds'),
        occupied_beds=Sum('occupied_beds'),
        new_admissions=Sum('new_admissions'),
        discharges_today=Sum('discharges_today'),
    )

    total_beds = ipd_stats['total_beds'] or 0
    occupied_beds = ipd_stats['occupied_beds'] or 0
    new_admissions = ipd_stats['new_admissions'] or 0
    discharges_today = ipd_stats['discharges_today'] or 0

    # Calculate available beds
    available_beds = total_beds - occupied_beds

    # Calculate occupancy percentage
    if total_beds > 0:
        occupancy_percentage = round(
            (occupied_beds / total_beds) * 100,
            1
        )
    else:
        occupancy_percentage = 0

    # Get unique branches for filter dropdown
    branches = DailyOPDCensus.objects.values_list(
        'hospital_branch',
        flat=True
    ).distinct()

    # Get clinic choices from the model
    clinics = [
        choice[0]
        for choice in DailyOPDCensus.CLINIC_CHOICES
    ]

    context = {
        'total_visits': total_visits,
        'new_patients': new_patients,
        'followup_patients': followup_patients,
        'refractions_done': refractions_done,

        'total_beds': total_beds,
        'occupied_beds': occupied_beds,
        'available_beds': available_beds,
        'new_admissions': new_admissions,
        'discharges_today': discharges_today,
        'occupancy_percentage': occupancy_percentage,

        'opd_records': opd_records,
        'ipd_records': ipd_records,

        'branches': branches,
        'clinics': clinics,

        'selected_branch': selected_branch,
        'selected_clinic': selected_clinic,
    }

    return render(
        request,
        'opd_ipd_reports/index.html',
        context
    )