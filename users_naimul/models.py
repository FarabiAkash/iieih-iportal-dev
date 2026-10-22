# ==========================================
# Developer: Naimul
# Task: Design your user profile, roles, and fields below.
# ==========================================

# Example:
# class NaimulProfile(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
#     ...

from django.db import models
from django.contrib.auth.models import User

def generate_mrn():
    """
    Auto-generates the next MRN in the format P26XXXXX
    (e.g. P2600001, P2600002, …).
    The counter is the global maximum across all three patient tables
    so numbers are never repeated across models.
    """
    import re
    max_num = 0
    for Model in _mrn_models():
        last = Model.objects.filter(
            patient_mrn__regex=r'^P26\d{5}$'
        ).order_by('-patient_mrn').values_list('patient_mrn', flat=True).first()
        if last:
            num = int(last[3:])  # strip 'P26'
            if num > max_num:
                max_num = num
    return f'P26{max_num + 1:05d}'


def _mrn_models():
    """Returns the three models that carry a patient_mrn field."""
    # Imported lazily inside the function to avoid circular imports at module load.
    from django.apps import apps
    return [
        apps.get_model('users_naimul', 'SurgeryRecord'),
        apps.get_model('users_naimul', 'DiagnosisProcedure'),
        apps.get_model('users_naimul', 'Appointment'),
    ]


def get_available_doctors():
    """
    Fetches distinct doctor/surgeon names from the existing database:
    - Existing SurgeryRecord entries
    - Existing Appointment entries
    - Registered User accounts with Doctor/Surgeon roles in NaimulProfile
    Returns a sorted list of unique formatted doctor names (e.g. 'Dr. ...').
    """
    from django.apps import apps
    doctors = []
    try:
        SurgeryRecord = apps.get_model('users_naimul', 'SurgeryRecord')
        Appointment = apps.get_model('users_naimul', 'Appointment')
        NaimulProfile = apps.get_model('users_naimul', 'NaimulProfile')

        # 1. Doctors from existing SurgeryRecord entries in DB
        for name in SurgeryRecord.objects.values_list('surgeon_name', flat=True).distinct():
            if name and name.strip():
                clean = name.strip()
                doc_name = clean if clean.lower().startswith(('dr.', 'prof.')) else f"Dr. {clean}"
                if doc_name not in doctors:
                    doctors.append(doc_name)

        # 2. Doctors from existing Appointment entries in DB
        for name in Appointment.objects.values_list('doctor_name', flat=True).distinct():
            if name and name.strip():
                clean = name.strip()
                doc_name = clean if clean.lower().startswith(('dr.', 'prof.')) else f"Dr. {clean}"
                if doc_name not in doctors:
                    doctors.append(doc_name)

        # 3. Doctors from registered User accounts with clinical roles in NaimulProfile
        doc_profiles = NaimulProfile.objects.select_related('user').filter(
            role__in=['Surgeon', 'Consultant', 'Associate', 'Resident']
        )
        for p in doc_profiles:
            u = p.user
            full_name = u.get_full_name().strip()
            if full_name:
                doc_name = full_name if full_name.lower().startswith(('dr.', 'prof.')) else f"Dr. {full_name}"
                if doc_name not in doctors:
                    doctors.append(doc_name)
            else:
                uname = u.username.strip()
                if uname and uname.lower() != 'admin':
                    if not any(uname.lower() in d.lower() for d in doctors):
                        doc_name = f"Dr. {uname.title()}"
                        if doc_name not in doctors:
                            doctors.append(doc_name)
    except Exception:
        pass

    return sorted(doctors)


def get_doctor_assigned_ot_room(doctor_name):
    """
    Fetches the dedicated OT room assigned to the doctor based on database relationships:
    1. Look up NaimulProfile where the user's username, full name, first name, or last name
       matches the doctor's name, returning p.assigned_ot_room if set.
    2. Fallback: Look up existing SurgeryRecord entries for this doctor in the database
       to retrieve their operational OT room.
    3. If the doctor has no assigned OT room, returns None (handles gracefully).
    """
    if not doctor_name:
        return None
    from django.apps import apps
    import re

    clean = re.sub(r'^(Dr\.|Prof\.)\s*', '', doctor_name.strip(), flags=re.IGNORECASE).strip()
    if not clean:
        return None
    clean_lower = clean.lower()
    tokens = [t.lower() for t in re.split(r'[\s.]+', clean) if len(t) >= 2]

    try:
        NaimulProfile = apps.get_model('users_naimul', 'NaimulProfile')
        SurgeryRecord = apps.get_model('users_naimul', 'SurgeryRecord')

        # 1. Primary DB relationship: NaimulProfile.assigned_ot_room
        profiles = list(
            NaimulProfile.objects.select_related('user')
            .filter(assigned_ot_room__isnull=False)
            .exclude(assigned_ot_room='')
        )
        for p in profiles:
            u = p.user
            uname = u.username.lower() if u.username else ''
            full = u.get_full_name().strip().lower() if u.get_full_name() else ''
            fname = u.first_name.strip().lower() if u.first_name else ''
            lname = u.last_name.strip().lower() if u.last_name else ''

            if uname and (uname == clean_lower or uname in tokens or uname in clean_lower):
                return p.assigned_ot_room
            if full and (full == clean_lower or full in clean_lower or clean_lower in full):
                return p.assigned_ot_room
            if fname and (fname == clean_lower or fname in tokens):
                return p.assigned_ot_room
            if lname and len(lname) >= 3 and (lname == clean_lower or lname in tokens):
                return p.assigned_ot_room

        # 2. Secondary DB relationship fallback: SurgeryRecord
        surg = SurgeryRecord.objects.filter(
            models.Q(surgeon_name__iexact=doctor_name) |
            models.Q(surgeon_name__iexact=clean) |
            models.Q(surgeon_name__icontains=clean)
        ).exclude(ot_room__isnull=True).exclude(ot_room='').order_by('-id').first()
        if surg and surg.ot_room:
            return surg.ot_room
    except Exception:
        pass

    return None


def get_doctor_ot_room_map():
    """
    Returns a dictionary mapping each available doctor name to their dedicated OT room
    fetched dynamically from the database via NaimulProfile.assigned_ot_room.
    Keys are the canonical surgeon names as they appear in SurgeryRecord and Appointment.
    If a doctor has no assigned OT room, maps to None.
    """
    doctors = get_available_doctors()
    mapping = {}
    for doc in doctors:
        mapping[doc] = get_doctor_assigned_ot_room(doc)
    return mapping

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
    patient_mrn = models.CharField(
        max_length=12,
        unique=True,
        blank=True,
        editable=False,
        help_text="Auto-generated Medical Record Number (MRN) — format: P26XXXXX"
    )
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

    def save(self, *args, **kwargs):
        if not self.patient_mrn:
            self.patient_mrn = generate_mrn()
        super().save(*args, **kwargs)


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
    patient_mrn = models.CharField(
        max_length=12,
        blank=True,
        editable=False,
        help_text="Auto-generated Medical Record Number (MRN) — format: P26XXXXX"
    )
    patient_name = models.CharField(max_length=100)
    patient_age = models.PositiveIntegerField()
    patient_gender = models.CharField(max_length=10, choices=Gender_Choices)
    eye = models.CharField(
        max_length=2,
        choices=Eye_Choices,
        help_text="Which eye was diagnosed"
    )
    procedure_name = models.CharField(
        max_length=50,
        choices=Procedure_Choices,
        help_text="Procedure Performed"
    )
    technician_name = models.CharField(
        max_length=100,
        help_text="Name of the Technician"
    )
    findings_summary = models.TextField(
        blank=True,
        help_text="Findings summary from the Diagnosis"
    )

    def save(self, *args, **kwargs):
        if not self.patient_mrn:
            self.patient_mrn = generate_mrn()
        super().save(*args, **kwargs)
    
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
    role = models.CharField(max_length=30, choices=Role_Choices, default='Surgeon')
    specialty = models.CharField(max_length=50, choices=Specialty_Choices, default='Cataract')
    assigned_ot_room = models.CharField(max_length=20, choices=OT_Room_Choices, default='OT-1')
    surgeon_display_name = models.CharField(
        max_length=120,
        blank=True,
        default='',
        help_text=(
            "Canonical surgeon name exactly as it appears in SurgeryRecord.surgeon_name "
            "and Appointment.doctor_name. "
            "Leave blank to fall back to the user's full name or username."
        )
    )
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

    def get_surgeon_display_name(self):
        """
        Returns the canonical name for this doctor as it appears in SurgeryRecord /
        Appointment records.  Priority order:
          1. surgeon_display_name (explicit DB field, most reliable)
          2. user.get_full_name()  (set via profile-settings form)
          3. 'Dr. <username.title()>'  (last-resort fallback)
        """
        if self.surgeon_display_name.strip():
            return self.surgeon_display_name.strip()
        full = self.user.get_full_name().strip()
        if full:
            return full if full.lower().startswith(('dr.', 'prof.')) else f'Dr. {full}'
        uname = self.user.username.strip()
        return f'Dr. {uname.title()}' if uname else ''

    @property
    def is_staff_role(self):
        return self.role in ['Staff', 'OT Nurse', 'Admin', 'Technician']
    
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

    patient_mrn = models.CharField(
        max_length=12,
        blank=True,
        editable=False,
        help_text="Auto-generated Medical Record Number (MRN) — format: P26XXXXX"
    )
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

    def save(self, *args, **kwargs):
        if not self.patient_mrn:
            self.patient_mrn = generate_mrn()
        super().save(*args, **kwargs)

# role = models.CharField(
#     max_length=30,
#     choices=ROLE_CHOICES,
#     default='Doctor'
# )
