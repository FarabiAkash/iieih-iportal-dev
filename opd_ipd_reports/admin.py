from django.contrib import admin
from .models import DailyOPDCensus, IPDBedOccupancy


@admin.register(DailyOPDCensus)
class DailyOPDCensusAdmin(admin.ModelAdmin):
    list_display = (
        'date',
        'hospital_branch',
        'clinic_name',
        'total_visits',
        'new_patients',
        'followup_patients',
        'refractions_done',
    )

    list_filter = (
        'date',
        'hospital_branch',
        'clinic_name',
    )


@admin.register(IPDBedOccupancy)
class IPDBedOccupancyAdmin(admin.ModelAdmin):
    list_display = (
        'date',
        'hospital_branch',
        'ward_type',
        'total_beds',
        'occupied_beds',
        'new_admissions',
        'discharges_today',
    )

    list_filter = (
        'date',
        'hospital_branch',
        'ward_type',
    )