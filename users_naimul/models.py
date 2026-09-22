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
    outcome = models.CharField(max_length=20, choices=Outcome_Choices, help_text="Outcome of the Surgery")
    
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
    
class DoctorProfile(models.Model):
    
    Specialty_Choices = [
        ('Cataract', 'Cataract'),
        ('Glaucoma', 'Glaucoma'),
        ('Retina', 'Retina'),
        ('Cornea', 'Cornea'),
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
    
    Role_Choices = [
        ('Surgeon', 'Surgeon'),
        ('Technician', 'Technician'),
        ('Nurse', 'Nurse'),
        ('Admin', 'Admin'),
        ('Other', 'Other'),
    ]
    
    