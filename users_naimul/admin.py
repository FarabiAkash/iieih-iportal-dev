from django.contrib import admin

from users_naimul.models import SurgeryRecord
from users_naimul.models import DiagnosisProcedure
from users_naimul.models import Appointment
from users_naimul.models import NaimulProfile

# Register your models here.
# admin.site.register(SurgeryRecord)

# admin.site.register(DiagnosisProcedure)

# admin.site.register(Appointment)

# admin.site.register(NaimulProfile)

@admin.register(NaimulProfile)
class NaimulProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'specialty', 'assigned_ot_room', 'surgeon_code', 'license_number', 'can_apply_surgery', 'can_make_appointments')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'surgeon_code', 'license_number')
    list_filter = ('role', 'specialty', 'assigned_ot_room', 'can_apply_surgery', 'can_make_appointments')

@admin.register(SurgeryRecord)
class SurgeryRecordAdmin(admin.ModelAdmin):
    list_display = ('patient_mrn', 'patient_name', 'eye', 'surgery_type', 'surgeon_name', 'ot_room', 'date', 'outcome')
    search_fields = ('patient_mrn', 'patient_name', 'surgeon_name')
    list_filter = ('surgery_type', 'ot_room', 'outcome', 'eye', 'date')

@admin.register(DiagnosisProcedure)
class DiagnosisProcedureAdmin(admin.ModelAdmin):
    list_display = ('patient_mrn', 'patient_name', 'procedure_name', 'eye', 'date', 'technician_name')
    search_fields = ('patient_mrn', 'patient_name', 'technician_name')
    list_filter = ('procedure_name', 'eye', 'date')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('appointment_date', 'appointment_time_slot', 'patient_name', 'patient_mrn', 'appointment_type', 'doctor_name', 'status', 'created_by')
    search_fields = ('patient_mrn', 'patient_name', 'doctor_name')
    list_filter = ('status', 'appointment_type', 'appointment_date')
    date_hierarchy = 'appointment_date'
    ordering = ['appointment_date', 'appointment_time_slot']
