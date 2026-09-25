from django.db import models
from django.contrib.auth.models import User

# ==========================================
# Developer: Naimul
# Task: Design your user profile, roles, and fields below.
# ==========================================

# Example:
# class NaimulProfile(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
#     ...

class SurgeryRecord(models.Model):
    
    Eye_Choices = [
        ('LE', 'Left Eye'),
        ('RE', 'Right Eye'),
        ('BE', 'Both Eyes'),
    ]
    Gender_Choices = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    
    Surgery_Type_Choices = [
        ('Cataract', 'Cataract'),
        ('Glaucoma', 'Glaucoma'),
        ('Retina', 'Retina'),
        ('Cornea', 'Cornea'),
        ('Corneal', 'Corneal'), 
        ('LASIK', 'LASIK'), 
        ('Oculoplastic', 'Oculoplastic'),
        ('Pediatric Ophthalmology', 'Pediatric Ophthalmology'),
        ('Neuro-Ophthalmology', 'Neuro-Ophthalmology'),
        ('Uveitis', 'Uveitis'),
        ('Refractive Surgery', 'Refractive Surgery'),
        ('Other', 'Other'),
    ]
    
    OT_Room_Choices = [
        ('OT-1', 'OT Room 1 (General OT)'),
        ('OT-2', 'OT Room 2 (Retina OT)'),
        ('OT-3', 'OT Room 3 (Laser OT)'),
        ('OT-4', 'OT Room 4 (Pediatric OT)'),
    ]
    
    OT_Slot_Choices = [
        ('Slot 1 (08:30 - 10:00 AM)', 'Slot 1 (08:30 - 10:00 AM) - Morning Primary'),
        ('Slot 2 (10:15 - 11:45 AM)', 'Slot 2 (10:15 - 11:45 AM) - Mid-Day Micro-Surgery'),
        ('Slot 3 (12:00 - 01:30 PM)', 'Slot 3 (12:00 - 01:30 PM) - Afternoon Session'),
        ('Slot 4 (02:00 - 03:30 PM)', 'Slot 4 (02:00 - 03:30 PM) - Post-Lunch Refractive'),
        ('Emergency Slot', 'Emergency / Add-on Slot'),
    ]
    
    Outcome_Choices = [
        ('Successful', 'Successful'),
        ('Under Observation', 'Under Observation'),
        ('Complications', 'Complications'),
    ]
    
    date = models.DateField(help_text="Date of Surgery (YYYY-MM-DD)")
    patient_mrn = models.CharField(max_length=8, unique=True, help_text="Medical Record Number (MRN) of the Patient")
    patient_name = models.CharField(max_length=100, help_text="Full Name of the Patient")
    patient_age = models.PositiveIntegerField(help_text="Age of the Patient")
    
    patient_gender = models.CharField(max_length=10, choices=Gender_Choices, help_text="Gender of the Patient")
    eye = models.CharField(max_length=2, choices=Eye_Choices, help_text="Which eye was operated on")
    surgery_type = models.CharField(max_length=50, choices=Surgery_Type_Choices, help_text="Type of Surgery Performed")
    
    surgeon_name = models.CharField(max_length=100, help_text="Name of the Surgeon")
    
    ot_room = models.CharField(max_length=10, choices=OT_Room_Choices, help_text="Operating Theater Room")
    ot_slot = models.CharField(max_length=30, choices=OT_Slot_Choices, blank=True, null=True, help_text="Operating Theater Slot")
    outcome = models.CharField(max_length=20, choices=Outcome_Choices, help_text="Outcome of the Surgery")
    
    medical_history = models.TextField(blank=True, help_text="Patient's Medical History and Previous Surgeries")
    notes = models.TextField(blank=True, help_text="Additional Notes or Comments")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, help_text="User who created this record")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when the record was created")
    
class DiagnosisProcedure(models.Model):
    
    Eye_Choices = [
        ('LE', 'Left Eye'),
        ('RE', 'Right Eye'),
        ('BE', 'Both Eyes'),
    ]
    
    Gender_Choices = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    
    Procedure_Choices = [        
        ('OCT Macula', 'OCT Macula'),
        ('OCT RNFL', 'OCT RNFL'),
        ('Visual Field (Perimetry)', 'Visual Field (Perimetry)'),
        ('B-Scan', 'B-Scan'),
        ('FFA', 'FFA'),
        ('Other', 'Other'),
    ]
    
    date = models.DateField(help_text="Date of Diagnosis (YYYY-MM-DD)")
    patient_mrn = models.CharField(max_length=8, unique=True, help_text="Medical Record Number (MRN) of the Patient")
    eye = models.CharField(max_length=2, choices=Eye_Choices, help_text="Which eye was diagnosed")
    procedure_name = models.CharField(max_length=50, choices=Procedure_Choices, help_text="Procedure Performed")
    technician_name = models.CharField(max_length=100, help_text="Name of the Technician")
    findings_summary = models.TextField(blank=True, help_text="Findings summary from the Diagnosis")
    
class NaimulProfile(models.Model):
    
    Specialty_Choices = [
        ('Cataract', 'Cataract & Refractive'),
        ('Glaucoma', 'Glaucoma Services'),
        ('Retina', 'Vitreoretinal Surgery'),
        ('Cornea', 'Cornea & External Disease'),
        ('Oculoplastic', 'Oculoplastic  & Orbit'),
        ('Pediatric Ophthalmology', 'Pediatric Ophthalmology & Strabismus'),
        ('Neuro-Ophthalmology', 'Neuro-Ophthalmology'),
        ('Uveitis', 'Uveitis Services'),
        ('Refractive Surgery', 'Refractive Surgery'),
        ('Other', 'Other'),
    ]
    
    OT_Room_Choices = [
        ('OT-1', 'OT Room 1 (General OT)'),
        ('OT-2', 'OT Room 2 (Retina OT)'),
        ('OT-3', 'OT Room 3 (Laser OT)'),
        ('OT-4', 'OT Room 4 (Pediatric OT)'),
    ]
    
    Role_Choices = [
        ('Surgeon', 'Surgeon'),
        ('Technician', 'Technician'),
        ('Consultant', 'Consultant Eye Surgeon'),
        ('Associate', 'Associate Specialist'),
        ('Resident', 'Surgical Resident / Fellow'),
        ('OT Nurse', 'OT Nursing Supervisor'),
        ('Staff', 'OT Coordinator / Surgical Staff'),
        ('Admin', 'Admin'),
        ('Other', 'Other'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='naimul_profile')
    role = models.CharField(max_length=30, choices=Role_Choices, default='Consultant')
    specialty = models.CharField(max_length=50, choices=Specialty_Choices, default='Cataract')
    assigned_ot_room = models.CharField(max_length=20, choices=OT_Room_Choices, default='OT-1')
    surgeon_code = models.CharField(max_length=30, default='SURG-101', help_text="Hospital Surgeon ID Code")
    license_number = models.CharField(max_length=50, default='BMDC-A-48291', help_text="Medical Council License Number")
    department = models.CharField(max_length=100, default='Department of Ophthalmology & Microsurgery')
    phone = models.CharField(max_length=20, blank=True, default='+880 1711-000000')
    bio = models.TextField(blank=True, default='Consultant Ophthalmic Surgeon specializing in advanced micro-incision cataract surgery and anterior segment reconstruction.')
    can_view_patient_details = models.BooleanField(default=True, help_text="Doctor Role Permission: View Patient Demographics & Records")
    can_view_medical_history = models.BooleanField(default=True, help_text="Doctor Role Permission: View Patient Medical History & Diagnostic Scans")
    can_view_ot_slots = models.BooleanField(default=True, help_text="Doctor Role Permission: View Operation Theatre Slot Schedules")
    can_apply_surgery = models.BooleanField(default=True, help_text="Staff Role Permission: Submit Surgery Applications & Book OT Slots")
    can_make_appointments = models.BooleanField(default=True, help_text="Staff Role Permission: Schedule & Manage Patient Appointments")
    created_at = models.DateTimeField(auto_now_add=True)
    
class Appointment(models.Model):

    Gender_Choices = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    Appointment_Type_Choices = [
        ('Pre-Op Surgical Workup', 'Pre-Op Surgical Workup'),
        ('Consultant Clinic', 'Consultant Clinic'),
        ('Post-Op Follow-Up', 'Post-Op Follow-Up Visit'),
        ('Diagnostic Scan', 'Diagnostic Scan (OCT / B-Scan / VF)'),
        ('OT Anesthesia Clearance', 'OT Anesthesia Clearance'),
        ('Emergency Consultation', 'Emergency Consultation'),
        ('Corneal Topography', 'Corneal Topography / Biometry'),
        ('Refraction & Prescription', 'Refraction & Spectacle Prescription'),
    ]

    Time_Slot_Choices = [
        ('08:00 - 09:00 AM', '08:00 - 09:00 AM (Morning First)'),
        ('09:00 - 10:00 AM', '09:00 - 10:00 AM (Morning Regular)'),
        ('10:00 - 11:00 AM', '10:00 - 11:00 AM (Mid-Morning)'),
        ('11:00 - 12:00 PM', '11:00 - 12:00 PM (Late Morning)'),
        ('12:00 - 01:00 PM', '12:00 - 01:00 PM (Early Afternoon)'),
        ('02:00 - 03:00 PM', '02:00 - 03:00 PM (Afternoon)'),
        ('03:00 - 04:00 PM', '03:00 - 04:00 PM (Late Afternoon)'),
        ('04:00 - 05:00 PM', '04:00 - 05:00 PM (Evening Clinic)'),
    ]

    Status_Choices = [
        ('Scheduled', 'Scheduled'),
        ('Confirmed', 'Confirmed'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
        ('No-Show', 'No-Show'),
    ]

    patient_mrn = models.CharField(max_length=12, help_text="Medical Record Number (MRN)")
    patient_name = models.CharField(max_length=100, help_text="Full Name of the Patient")
    patient_phone = models.CharField(max_length=20, blank=True, help_text="Patient Contact Number")
    patient_age = models.PositiveIntegerField(help_text="Age of the Patient")
    patient_gender = models.CharField(max_length=10, choices=Gender_Choices, help_text="Gender")
    appointment_type = models.CharField(
        max_length=60, choices=Appointment_Type_Choices,
        default='Consultant Clinic',
        help_text="Type of clinical appointment"
    )
    doctor_name = models.CharField(max_length=100, help_text="Assigned Consultant / Doctor")
    appointment_date = models.DateField(help_text="Date of the Appointment (YYYY-MM-DD)")
    appointment_time_slot = models.CharField(
        max_length=30, choices=Time_Slot_Choices,
        default='09:00 - 10:00 AM',
        help_text="Time slot for the appointment"
    )
    status = models.CharField(
        max_length=20, choices=Status_Choices,
        default='Scheduled',
        help_text="Current status of the appointment"
    )
    notes = models.TextField(blank=True, help_text="Clinical notes, referral details, or special requirements")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, help_text="Staff user who created the appointment")
    created_at = models.DateTimeField(auto_now_add=True)

# role = models.CharField(
#     max_length=30,
#     choices=ROLE_CHOICES,
#     default='Doctor'
# )
