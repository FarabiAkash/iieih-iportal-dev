from django.contrib import admin
from .models import DailyCollection, ConcessionRecord
# Register your models here.
@admin.register(DailyCollection)
class DailyCollectionAdmin(admin.ModelAdmin):

    list_display = (
        'date',
        'hospital_branch',
        'counter_name',
        'cash_amount',
        'card_amount',
        'mfs_amount',
        'total_amount',
    )

    list_filter = (
        'date',
        'hospital_branch',
        'counter_name',
    )

    search_fields = (
        'hospital_branch',
    )


@admin.register(ConcessionRecord)
class ConcessionRecordAdmin(admin.ModelAdmin):

    list_display = (
        'date',
        'patient_mrn',
        'concession_type',
        'bill_total',
        'discount_amount',
        'approved_by',
    )

    list_filter = (
        'date',
        'concession_type',
    )

    search_fields = (
        'patient_mrn',
        'approved_by',
    )