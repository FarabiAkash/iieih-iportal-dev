# # ==========================================
# # Developer: Naimul
# # Task: Implement your login, logout, and profile logic below.
# # ==========================================

# def login_view(request):
#     """
#     Very simple starter login view for Naimul's module.
#     """
#     return render(request, 'users_naimul/login.html')

import json
import re
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db.models import Q
from datetime import date
from django.views.decorators.http import require_GET
from .models import (
    NaimulProfile,
    SurgeryRecord,
    DiagnosisProcedure,
    Appointment,
    Prescription,
    get_available_doctors,
    get_doctor_assigned_ot_room,
    get_doctor_ot_room_map,
)

def is_authorized_admin(user, profile=None):
    """
    Checks if the user has administrator authorization:
    - superuser
    - staff user (is_staff)
    - profile has role == 'Admin'
    """
    if not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    if profile is None:
        profile = getattr(user, 'naimul_profile', None)
    return profile is not None and profile.role == 'Admin'


def handle_doctor_registration(request, current_profile=None):
    """
    Validates form data and creates a new user account with NaimulProfile.
    Enforces authorization, formats, required fields, and duplicate checks.
    Returns: (success: bool, message: str, data_or_errors: dict)
    """
    if current_profile is None:
        current_profile, _ = NaimulProfile.objects.get_or_create(user=request.user)

    # 1. Authorization Guard
    if not is_authorized_admin(request.user, current_profile):
        return (
            False,
            "Access Denied: Only authorized administrators can access doctor registration and create accounts.",
            {'auth': 'Unauthorized'}
        )

    # 2. Extract Fields
    username = request.POST.get('username', '').strip()
    password = request.POST.get('password', '').strip()
    phone = request.POST.get('phone', '').strip()
    email = request.POST.get('email', '').strip()
    role = request.POST.get('role', '').strip()
    specialty = request.POST.get('specialty', '').strip()
    assigned_ot_room = request.POST.get('assigned_ot_room', '').strip()
    surgeon_display_name = request.POST.get('surgeon_display_name', '').strip()
    surgeon_code = request.POST.get('surgeon_code', '').strip()
    license_number = request.POST.get('license_number', '').strip()
    department = request.POST.get('department', '').strip() or 'Department of Ophthalmology & Microsurgery'
    bio = request.POST.get('bio', '').strip()

    errors = {}

    # 3. Validation: Required fields & formats & duplicate checks
    if not username:
        errors['username'] = "Username is required."
    elif len(username) < 3:
        errors['username'] = "Username must be at least 3 characters long."
    elif len(username) > 150:
        errors['username'] = "Username cannot exceed 150 characters."
    elif not re.match(r'^[\w.@+-]+$', username):
        errors['username'] = "Username may only contain letters, numbers, and @/./+/-/_ characters."
    elif User.objects.filter(username__iexact=username).exists():
        errors['username'] = f"The username '{username}' is already in use. Please select a different username."

    if not password:
        errors['password'] = "Password is required."
    elif len(password) < 6:
        errors['password'] = "Password must be at least 6 characters long."

    if not email:
        errors['email'] = "Email address is required."
    else:
        try:
            validate_email(email)
            if User.objects.filter(email__iexact=email).exists():
                errors['email'] = f"The email '{email}' is already registered with an existing account."
        except ValidationError:
            errors['email'] = "Please enter a valid email address (e.g., doctor@iieih.com)."

    if not phone:
        errors['phone'] = "Phone number is required."
    else:
        digits_only = re.sub(r'\D', '', phone)
        if len(digits_only) < 7:
            errors['phone'] = "Phone number must contain at least 7 digits."
        elif not re.match(r'^[\d\s+\-().]+$', phone):
            errors['phone'] = "Phone number contains invalid characters."

    # Normalization & Validation for Role
    ROLE_NORMALIZATION = {
        'surgeon': 'Surgeon',
        'technician': 'Technician',
        'consultant': 'Consultant',
        'consultant — consultant eye surgeon': 'Consultant',
        'consultant eye surgeon': 'Consultant',
        'associate': 'Associate',
        'associate — associate specialist': 'Associate',
        'associate specialist': 'Associate',
        'resident': 'Resident',
        'resident — surgical resident / fellow': 'Resident',
        'surgical resident / fellow': 'Resident',
        'ot nurse': 'OT Nurse',
        'ot nurse — ot': 'OT Nurse',
        'ot nursing supervisor': 'OT Nurse',
        'staff': 'Staff',
        'staff — ot coordinator / surgical staff': 'Staff',
        'ot coordinator / surgical staff': 'Staff',
        'admin': 'Admin',
        'other': 'Other',
    }
    normalized_role = ROLE_NORMALIZATION.get(role.lower(), role)
    valid_roles = [choice[0] for choice in NaimulProfile.Role_Choices]
    if not role:
        errors['role'] = "Please select a professional role."
    elif normalized_role not in valid_roles:
        errors['role'] = f"Invalid role selection: '{role}'."
    else:
        role = normalized_role
        # Limit Admin role assignment:
        # "Limit Admin role assignment to appropriately authorized administrators."
        if role == 'Admin' and not request.user.is_superuser:
            errors['role'] = "Permission Denied: Only Super Administrators can assign the Admin role."

    # Normalization & Validation for Specialty
    SPECIALTY_NORMALIZATION = {
        'qatar': 'Qatar',
        'cataract': 'Cataract',
        'qatar (cataract) — cataract & refractive services': 'Qatar',
        'cataract & refractive': 'Cataract',
        'glaucoma': 'Glaucoma',
        'glaucoma — glaucoma services': 'Glaucoma',
        'retina': 'Retina',
        'retina — vitreoretinal surgery': 'Retina',
        'cornea': 'Cornea',
        'cornea — cornea & external disease': 'Cornea',
        'the': 'THE',
        'oculoplastic': 'Oculoplastic',
        'the (oculoplastic) — oculoplastic & orbit': 'THE',
        'oculoplastic  & orbit': 'Oculoplastic',
        'pediatric ophthalmology': 'Pediatric Ophthalmology',
        'pediatric ophthalmology — pediatric ophthalmology & strabismus': 'Pediatric Ophthalmology',
        'neuro-ophthalmology': 'Neuro-Ophthalmology',
        'neuro-ophthalmology — neuro-ophthalmology': 'Neuro-Ophthalmology',
        'in': 'IN',
        'uveitis': 'Uveitis',
        'in (uveitis) — uveitis & inflammatory services': 'IN',
        'uveitis services': 'Uveitis',
        're': 'Re',
        'refractive surgery': 'Refractive Surgery',
        're (refractive) — refractive surgery': 'Re',
        'other': 'Other',
    }
    normalized_spec = SPECIALTY_NORMALIZATION.get(specialty.lower(), specialty)
    valid_specs = [choice[0] for choice in NaimulProfile.Specialty_Choices]
    if not specialty:
        errors['specialty'] = "Please select a surgical specialty."
    elif normalized_spec not in valid_specs:
        errors['specialty'] = f"Invalid specialty selection: '{specialty}'."
    else:
        specialty = normalized_spec

    # Normalization & Validation for Assigned OT Room
    OT_ROOM_NORMALIZATION = {
        'ot-1': 'OT-1',
        'ot 1': 'OT-1',
        'ot': 'OT-1',
        'ot room 1': 'OT-1',
        'ot-1 (ot room 1 — general ot)': 'OT-1',
        'ot-2': 'OT-2',
        'ot 2': 'OT-2',
        'ot room 2': 'OT-2',
        'ot-2 (ot room 2 — retina ot)': 'OT-2',
        'ot-3': 'OT-3',
        'ot 3': 'OT-3',
        'ot room 3': 'OT-3',
        'ot-3 (ot room 3 — laser ot)': 'OT-3',
        'ot-4': 'OT-4',
        'ot 4': 'OT-4',
        'ot room 4': 'OT-4',
        'ot-4 (ot room 4 — pediatric ot)': 'OT-4',
    }
    normalized_room = OT_ROOM_NORMALIZATION.get(assigned_ot_room.lower(), assigned_ot_room)
    valid_rooms = [choice[0] for choice in NaimulProfile.OT_Room_Choices]
    if not assigned_ot_room:
        errors['assigned_ot_room'] = "Please select an assigned OT room."
    elif normalized_room not in valid_rooms:
        errors['assigned_ot_room'] = f"Invalid OT room selection: '{assigned_ot_room}'."
    else:
        assigned_ot_room = normalized_room

    # Surgeon Code validation & duplicate check
    if not surgeon_code:
        errors['surgeon_code'] = "Surgeon ID code is required (e.g. SURG-102)."
    elif NaimulProfile.objects.filter(surgeon_code__iexact=surgeon_code).exists():
        errors['surgeon_code'] = f"The surgeon code '{surgeon_code}' is already assigned to another staff member."

    # License Number validation & duplicate check
    if not license_number:
        errors['license_number'] = "Medical license number is required (e.g. BMDC-A-XXXXX)."
    elif NaimulProfile.objects.filter(license_number__iexact=license_number).exists():
        errors['license_number'] = f"The medical license number '{license_number}' is already registered in the system."

    # Return errors if validation fails
    if errors:
        first_error_msg = next(iter(errors.values()))
        return (False, first_error_msg, errors)

    # 4. Canonical Surgeon Display Name & User Names
    if not surgeon_display_name:
        if role in NaimulProfile.DOCTOR_ROLES:
            surgeon_display_name = f"Dr. {username.title()}"
        else:
            surgeon_display_name = username.title()
    elif role in NaimulProfile.DOCTOR_ROLES and not surgeon_display_name.lower().startswith(('dr.', 'prof.')):
        surgeon_display_name = f"Dr. {surgeon_display_name}"

    clean_name = re.sub(r'^(Dr\.|Prof\.)\s*', '', surgeon_display_name, flags=re.IGNORECASE).strip()
    name_tokens = clean_name.split(None, 1)
    first_name = name_tokens[0] if len(name_tokens) > 0 else username.title()
    last_name = name_tokens[1] if len(name_tokens) > 1 else ''

    # 5. Create User Account securely
    new_user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    if role == 'Admin':
        new_user.is_staff = True
        new_user.save()

    # 6. Create Profile with permissions
    is_doc = role in NaimulProfile.DOCTOR_ROLES
    new_profile = NaimulProfile.objects.create(
        user=new_user,
        role=role,
        specialty=specialty,
        assigned_ot_room=assigned_ot_room,
        surgeon_display_name=surgeon_display_name,
        surgeon_code=surgeon_code,
        license_number=license_number,
        department=department,
        phone=phone,
        bio=bio,
        can_view_patient_details=True,
        can_view_medical_history=True,
        can_view_ot_slots=True,
        can_apply_surgery=not is_doc,
        can_make_appointments=not is_doc,
    )

    success_msg = (
        f"Doctor account '{username}' ({surgeon_display_name}) registered successfully with role '{role}' "
        f"and assigned to {assigned_ot_room}. The user can now log in."
    )
    return (True, success_msg, {'profile': new_profile, 'user': new_user})


def handle_edit_doctor(request, current_profile=None):
    """
    Validates form data and updates an existing doctor/staff user account & NaimulProfile.
    Enforces authorization, formats, required fields, and duplicate checks.
    Returns: (success: bool, message: str, data_or_errors: dict)
    """
    if current_profile is None:
        current_profile, _ = NaimulProfile.objects.get_or_create(user=request.user)

    # 1. Authorization Guard
    if not is_authorized_admin(request.user, current_profile):
        return (
            False,
            "Access Denied: Only authorized administrators can edit doctor or staff accounts.",
            {'auth': 'Unauthorized'}
        )

    # 2. Identify target profile
    profile_id = request.POST.get('profile_id')
    try:
        target_profile = NaimulProfile.objects.select_related('user').get(id=profile_id)
    except (NaimulProfile.DoesNotExist, ValueError, TypeError):
        return (False, "Doctor or staff profile not found.", {'profile_id': 'Profile not found'})

    target_user = target_profile.user

    # 3. Extract Fields
    username = request.POST.get('username', '').strip()
    email = request.POST.get('email', '').strip()
    phone = request.POST.get('phone', '').strip()
    role = request.POST.get('role', '').strip()
    specialty = request.POST.get('specialty', '').strip()
    assigned_ot_room = request.POST.get('assigned_ot_room', '').strip()
    surgeon_display_name = request.POST.get('surgeon_display_name', '').strip()
    surgeon_code = request.POST.get('surgeon_code', '').strip()
    license_number = request.POST.get('license_number', '').strip()
    department = request.POST.get('department', '').strip() or 'Department of Ophthalmology & Microsurgery'
    bio = request.POST.get('bio', '').strip()
    first_name = request.POST.get('first_name', '').strip()
    last_name = request.POST.get('last_name', '').strip()
    password = request.POST.get('password', '').strip()
    is_active = request.POST.get('is_active') in ['1', 'true', 'on', True]

    errors = {}

    # Validation for username
    if not username:
        errors['username'] = "Username is required."
    elif len(username) < 3:
        errors['username'] = "Username must be at least 3 characters long."
    elif len(username) > 150:
        errors['username'] = "Username cannot exceed 150 characters."
    elif not re.match(r'^[\w.@+-]+$', username):
        errors['username'] = "Username may only contain letters, numbers, and @/./+/-/_ characters."
    elif User.objects.filter(username__iexact=username).exclude(id=target_user.id).exists():
        errors['username'] = f"The username '{username}' is already in use by another account."

    # Validation for password (optional)
    if password and len(password) < 6:
        errors['password'] = "Password must be at least 6 characters long."

    # Validation for email
    if not email:
        errors['email'] = "Email address is required."
    else:
        try:
            validate_email(email)
            if User.objects.filter(email__iexact=email).exclude(id=target_user.id).exists():
                errors['email'] = f"The email '{email}' is already registered with another account."
        except ValidationError:
            errors['email'] = "Please enter a valid email address (e.g., doctor@iieih.com)."

    # Validation for phone
    if not phone:
        errors['phone'] = "Phone number is required."
    else:
        digits_only = re.sub(r'\D', '', phone)
        if len(digits_only) < 7:
            errors['phone'] = "Phone number must contain at least 7 digits."
        elif not re.match(r'^[\d\s+\-().]+$', phone):
            errors['phone'] = "Phone number contains invalid characters."

    # Normalization & Validation for Role
    ROLE_NORMALIZATION = {
        'surgeon': 'Surgeon',
        'technician': 'Technician',
        'consultant': 'Consultant',
        'consultant — consultant eye surgeon': 'Consultant',
        'consultant eye surgeon': 'Consultant',
        'associate': 'Associate',
        'associate — associate specialist': 'Associate',
        'associate specialist': 'Associate',
        'resident': 'Resident',
        'resident — surgical resident / fellow': 'Resident',
        'surgical resident / fellow': 'Resident',
        'ot nurse': 'OT Nurse',
        'ot nurse — ot': 'OT Nurse',
        'ot nursing supervisor': 'OT Nurse',
        'staff': 'Staff',
        'staff — ot coordinator / surgical staff': 'Staff',
        'ot coordinator / surgical staff': 'Staff',
        'admin': 'Admin',
        'other': 'Other',
    }
    normalized_role = ROLE_NORMALIZATION.get(role.lower(), role)
    valid_roles = [choice[0] for choice in NaimulProfile.Role_Choices]
    if not role:
        errors['role'] = "Please select a professional role."
    elif normalized_role not in valid_roles:
        errors['role'] = f"Invalid role selection: '{role}'."
    else:
        role = normalized_role
        if role == 'Admin' and target_profile.role != 'Admin' and not request.user.is_superuser:
            errors['role'] = "Permission Denied: Only Super Administrators can assign the Admin role."

    # Normalization & Validation for Specialty
    SPECIALTY_NORMALIZATION = {
        'qatar': 'Qatar',
        'cataract': 'Cataract',
        'qatar (cataract) — cataract & refractive services': 'Qatar',
        'cataract & refractive': 'Cataract',
        'glaucoma': 'Glaucoma',
        'glaucoma — glaucoma services': 'Glaucoma',
        'retina': 'Retina',
        'retina — vitreoretinal surgery': 'Retina',
        'cornea': 'Cornea',
        'cornea — cornea & external disease': 'Cornea',
        'the': 'THE',
        'oculoplastic': 'Oculoplastic',
        'the (oculoplastic) — oculoplastic & orbit': 'THE',
        'oculoplastic  & orbit': 'Oculoplastic',
        'pediatric ophthalmology': 'Pediatric Ophthalmology',
        'pediatric ophthalmology — pediatric ophthalmology & strabismus': 'Pediatric Ophthalmology',
        'neuro-ophthalmology': 'Neuro-Ophthalmology',
        'neuro-ophthalmology — neuro-ophthalmology': 'Neuro-Ophthalmology',
        'in': 'IN',
        'uveitis': 'Uveitis',
        'in (uveitis) — uveitis & inflammatory services': 'IN',
        'uveitis services': 'Uveitis',
        're': 'Re',
        'refractive surgery': 'Refractive Surgery',
        're (refractive) — refractive surgery': 'Re',
        'other': 'Other',
    }
    normalized_spec = SPECIALTY_NORMALIZATION.get(specialty.lower(), specialty)
    valid_specs = [choice[0] for choice in NaimulProfile.Specialty_Choices]
    if not specialty:
        errors['specialty'] = "Please select a surgical specialty."
    elif normalized_spec not in valid_specs:
        errors['specialty'] = f"Invalid specialty selection: '{specialty}'."
    else:
        specialty = normalized_spec

    # Normalization & Validation for Assigned OT Room
    OT_ROOM_NORMALIZATION = {
        'ot-1': 'OT-1',
        'ot 1': 'OT-1',
        'ot': 'OT-1',
        'ot room 1': 'OT-1',
        'ot-1 (ot room 1 — general ot)': 'OT-1',
        'ot-2': 'OT-2',
        'ot 2': 'OT-2',
        'ot room 2': 'OT-2',
        'ot-2 (ot room 2 — retina ot)': 'OT-2',
        'ot-3': 'OT-3',
        'ot 3': 'OT-3',
        'ot room 3': 'OT-3',
        'ot-3 (ot room 3 — laser ot)': 'OT-3',
        'ot-4': 'OT-4',
        'ot 4': 'OT-4',
        'ot room 4': 'OT-4',
        'ot-4 (ot room 4 — pediatric ot)': 'OT-4',
    }
    normalized_room = OT_ROOM_NORMALIZATION.get(assigned_ot_room.lower(), assigned_ot_room)
    valid_rooms = [choice[0] for choice in NaimulProfile.OT_Room_Choices]
    if not assigned_ot_room:
        errors['assigned_ot_room'] = "Please select an assigned OT room."
    elif normalized_room not in valid_rooms:
        errors['assigned_ot_room'] = f"Invalid OT room selection: '{assigned_ot_room}'."
    else:
        assigned_ot_room = normalized_room

    # Surgeon Code validation & duplicate check (exclude current profile)
    if not surgeon_code:
        errors['surgeon_code'] = "Surgeon ID code is required (e.g. SURG-102)."
    elif NaimulProfile.objects.filter(surgeon_code__iexact=surgeon_code).exclude(id=target_profile.id).exists():
        errors['surgeon_code'] = f"The surgeon code '{surgeon_code}' is already assigned to another staff member."

    # License Number validation & duplicate check (exclude current profile)
    if not license_number:
        errors['license_number'] = "Medical license number is required (e.g. BMDC-A-XXXXX)."
    elif NaimulProfile.objects.filter(license_number__iexact=license_number).exclude(id=target_profile.id).exists():
        errors['license_number'] = f"The medical license number '{license_number}' is already registered in the system."

    if errors:
        first_error_msg = next(iter(errors.values()))
        return (False, first_error_msg, errors)

    old_display_name = target_profile.get_surgeon_display_name()

    # Canonical Surgeon Display Name & User Names
    if not surgeon_display_name:
        if first_name or last_name:
            full = f"{first_name} {last_name}".strip()
            surgeon_display_name = f"Dr. {full}" if role in NaimulProfile.DOCTOR_ROLES else full
        else:
            surgeon_display_name = f"Dr. {username.title()}" if role in NaimulProfile.DOCTOR_ROLES else username.title()
    elif role in NaimulProfile.DOCTOR_ROLES and not surgeon_display_name.lower().startswith(('dr.', 'prof.')):
        surgeon_display_name = f"Dr. {surgeon_display_name}"
    elif role not in NaimulProfile.DOCTOR_ROLES:
        surgeon_display_name = re.sub(r'^(Dr\.|Prof\.)\s*', '', surgeon_display_name, flags=re.IGNORECASE).strip()

    if not first_name and not last_name:
        clean_name = re.sub(r'^(Dr\.|Prof\.)\s*', '', surgeon_display_name, flags=re.IGNORECASE).strip()
        tokens = clean_name.split(None, 1)
        first_name = tokens[0] if len(tokens) > 0 else target_user.first_name
        last_name = tokens[1] if len(tokens) > 1 else target_user.last_name

    # Save User
    target_user.username = username
    target_user.email = email
    target_user.first_name = first_name
    target_user.last_name = last_name
    target_user.is_active = is_active
    if role == 'Admin':
        target_user.is_staff = True
    elif target_profile.role == 'Admin' and not target_user.is_superuser:
        target_user.is_staff = False
    if password:
        target_user.set_password(password)
    target_user.save()

    # Save Profile
    is_doc = role in NaimulProfile.DOCTOR_ROLES
    target_profile.role = role
    target_profile.specialty = specialty
    target_profile.assigned_ot_room = assigned_ot_room
    target_profile.surgeon_display_name = surgeon_display_name
    target_profile.surgeon_code = surgeon_code
    target_profile.license_number = license_number
    target_profile.department = department
    target_profile.phone = phone
    target_profile.bio = bio
    target_profile.can_apply_surgery = not is_doc
    target_profile.can_make_appointments = not is_doc
    target_profile.save()

    new_display_name = target_profile.get_surgeon_display_name()
    if old_display_name and new_display_name and old_display_name != new_display_name:
        SurgeryRecord.objects.filter(surgeon_name=old_display_name).update(surgeon_name=new_display_name)
        Appointment.objects.filter(doctor_name=old_display_name).update(doctor_name=new_display_name)

    success_msg = f"Information for '{new_display_name}' (@{target_user.username}) updated successfully."
    return (True, success_msg, {'profile': target_profile, 'user': target_user})

def login_view(request):
    """
    Surgical & Clinical Staff Portal Login View.
    Validates credentials and redirects authenticated users directly to profile patient details.
    """
    if request.user.is_authenticated:
        return redirect('/naimul/profile/?tab=patients')

    error_message = None
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        remember_me = request.POST.get('remember_me')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if not remember_me:
                request.session.set_expiry(0)
            else:
                request.session.set_expiry(1209600)
            
            # Ensure profile exists
            profile, _ = NaimulProfile.objects.get_or_create(user=user)
            
            if profile.is_doctor_role:
                welcome_msg = f"Welcome back, {profile.get_surgeon_display_name()}! Operation Theatre roster loaded."
            else:
                welcome_msg = f"Welcome, {profile.get_surgeon_display_name()}! OT Coordinator Console is ready."

            messages.success(request, welcome_msg)
            
            next_url = request.GET.get('next') or request.POST.get('next')
            if not next_url or next_url in ['/surgeries/', '/naimul/profile/']:
                return redirect('/naimul/profile/?tab=patients')
            return redirect(next_url)
        else:
            error_message = "Invalid credentials or access token. Please check your ID and password."

    # Clinical telemetry & context for the login screen
    total_surgeries_today = SurgeryRecord.objects.count()
    context = {
        'error_message': error_message,
        'total_surgeries_today': total_surgeries_today,
    }
    return render(request, 'users_naimul/login.html', context)

def logout_view(request):
    """
    Terminates session securely and returns to the portal login.
    """
    logout(request)
    messages.info(request, "Session signed out safely. OT records synchronized.")
    return redirect('users_naimul:login')

@login_required(login_url='users_naimul:login')
def profile_view(request):
    """
    Doctor & Staff Clinical Console.
    - Doctors: View Patient Details, Medical History, OT Slot schedules.
    - Staff: Apply for Surgery, Manage OT Slot Matrix, Make & Track Appointments.
    """
    profile, created = NaimulProfile.objects.get_or_create(user=request.user)

    # ── POST: Save Prescription (Doctors Only) ───────────────────────────────
    if request.method == 'POST' and 'save_prescription' in request.POST:
        if not profile.is_doctor_role:
            return JsonResponse({'success': False, 'error': 'Access denied. Only doctors can save prescriptions.'}, status=403)

        patient_mrn = request.POST.get('patient_mrn', '').strip()
        patient_name = request.POST.get('patient_name', '').strip()
        patient_age = request.POST.get('patient_age', 0)
        patient_gender = request.POST.get('patient_gender', 'Male')
        eye = request.POST.get('eye', '').strip()
        diagnosis = request.POST.get('diagnosis', '').strip()
        notes = request.POST.get('notes', '').strip()
        prescribing_doctor = request.POST.get('prescribing_doctor', '').strip() or profile.get_surgeon_display_name()
        medications_json_raw = request.POST.get('medications_json', '[]').strip()
        complaints_json_raw = request.POST.get('complaints_json', '[]').strip()
        complaint_meta_json_raw = request.POST.get('complaint_meta_json', '{}').strip()

        # All fields are optional — just ensure medications_json is valid JSON
        try:
            meds_list = json.loads(medications_json_raw)
            if not isinstance(meds_list, list):
                raise ValueError("Must be a JSON array.")
        except (json.JSONDecodeError, ValueError):
            medications_json_raw = '[]'

        prescription_id = request.POST.get('prescription_id', '').strip()
        if prescription_id:
            # Update existing
            try:
                rx_qs = Prescription.objects.filter(id=prescription_id)
                if not (request.user.is_superuser or profile.is_admin_role):
                    rx_qs = rx_qs.filter(
                        Q(prescribing_doctor__icontains=profile.get_surgeon_display_name()) |
                        Q(prescribing_doctor__icontains=request.user.username)
                    )
                rx = rx_qs.first()
                if not rx:
                    raise Prescription.DoesNotExist
            except Prescription.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Prescription not found or access denied.'}, status=400)
            rx.patient_mrn = patient_mrn
            rx.patient_name = patient_name
            rx.patient_age = int(patient_age) if str(patient_age).isdigit() else 0
            rx.patient_gender = patient_gender
            rx.eye = eye
            rx.diagnosis = diagnosis
            rx.notes = notes
            rx.prescribing_doctor = prescribing_doctor
            rx.medications_json = medications_json_raw
            if complaints_json_raw and complaints_json_raw != '[]':
                rx.complaints_json = complaints_json_raw
            if complaint_meta_json_raw and complaint_meta_json_raw != '{}':
                rx.complaint_meta_json = complaint_meta_json_raw
            rx.save()
            return JsonResponse({'success': True, 'message': f'Prescription for {patient_name} updated successfully.', 'prescription_id': rx.id})
        else:
            # Create new
            rx = Prescription.objects.create(
                patient_mrn=patient_mrn,
                patient_name=patient_name,
                patient_age=int(patient_age) if str(patient_age).isdigit() else 0,
                patient_gender=patient_gender,
                eye=eye,
                diagnosis=diagnosis,
                notes=notes,
                prescribing_doctor=prescribing_doctor,
                medications_json=medications_json_raw,
                complaints_json=complaints_json_raw or '[]',
                complaint_meta_json=complaint_meta_json_raw or '{}',
            )
            return JsonResponse({'success': True, 'message': f'Prescription for {patient_name} saved successfully.', 'prescription_id': rx.id})

    # ── POST: Save Complaints (Quick Action from Modal) ──────────────────────
    elif request.method == 'POST' and 'save_complaints' in request.POST:
        if not profile.is_doctor_role:
            return JsonResponse({'success': False, 'error': 'Access denied. Only doctors can save complaints.'}, status=403)

        prescription_id = request.POST.get('prescription_id', '').strip()
        patient_mrn = request.POST.get('patient_mrn', '').strip()
        patient_name = request.POST.get('patient_name', '').strip()
        patient_age = request.POST.get('patient_age', 0)
        patient_gender = request.POST.get('patient_gender', 'Male')
        eye = request.POST.get('eye', 'BE').strip()
        complaints_json_raw = request.POST.get('complaints_json', '[]').strip()
        complaint_meta_json_raw = request.POST.get('complaint_meta_json', '{}').strip()
        complaints_summary = request.POST.get('complaints_summary', '').strip()
        doctor_name = profile.get_surgeon_display_name()

        rx = None
        if prescription_id and prescription_id.isdigit():
            rx_qs = Prescription.objects.filter(id=int(prescription_id))
            if not (request.user.is_superuser or profile.is_admin_role):
                rx_qs = rx_qs.filter(
                    Q(prescribing_doctor__icontains=doctor_name) |
                    Q(prescribing_doctor__icontains=request.user.username)
                )
            rx = rx_qs.first()

        if rx:
            rx.complaints_json = complaints_json_raw or '[]'
            rx.complaint_meta_json = complaint_meta_json_raw or '{}'
            new_lines = []
            replaced = False
            for line in (rx.notes or '').splitlines():
                if line.strip().startswith('Complaints:'):
                    if complaints_summary:
                        new_lines.append(f"Complaints: {complaints_summary}")
                    replaced = True
                else:
                    new_lines.append(line)
            if not replaced and complaints_summary:
                new_lines.insert(0, f"Complaints: {complaints_summary}")
            rx.notes = '\n'.join(new_lines).strip()
            rx.save()
            return JsonResponse({
                'success': True,
                'message': 'Complaints saved to prescription.',
                'prescription_id': rx.id,
                'complaints': rx.complaints,
                'complaint_meta': rx.complaint_meta,
            })
        elif patient_mrn or patient_name:
            today = date.today()
            recent_rx = Prescription.objects.filter(
                patient_mrn=patient_mrn,
                date_created__date=today
            ).filter(
                Q(prescribing_doctor__icontains=doctor_name) |
                Q(prescribing_doctor__icontains=request.user.username)
            ).order_by('-date_created').first() if patient_mrn else None

            if recent_rx:
                rx = recent_rx
                rx.complaints_json = complaints_json_raw or '[]'
                rx.complaint_meta_json = complaint_meta_json_raw or '{}'
                new_lines = []
                replaced = False
                for line in (rx.notes or '').splitlines():
                    if line.strip().startswith('Complaints:'):
                        if complaints_summary:
                            new_lines.append(f"Complaints: {complaints_summary}")
                        replaced = True
                    else:
                        new_lines.append(line)
                if not replaced and complaints_summary:
                    new_lines.insert(0, f"Complaints: {complaints_summary}")
                rx.notes = '\n'.join(new_lines).strip()
                rx.save()
            else:
                initial_notes = f"Complaints: {complaints_summary}" if complaints_summary else ""
                rx = Prescription.objects.create(
                    patient_mrn=patient_mrn,
                    patient_name=patient_name or f"Patient {patient_mrn}",
                    patient_age=int(patient_age) if str(patient_age).isdigit() else 0,
                    patient_gender=patient_gender,
                    eye=eye,
                    diagnosis="Clinical Evaluation (OPD)",
                    notes=initial_notes,
                    complaints_json=complaints_json_raw or '[]',
                    complaint_meta_json=complaint_meta_json_raw or '{}',
                    prescribing_doctor=doctor_name,
                    medications_json="[]",
                )
            return JsonResponse({
                'success': True,
                'message': 'Complaints saved successfully.',
                'prescription_id': rx.id,
                'complaints': rx.complaints,
                'complaint_meta': rx.complaint_meta,
            })

        return JsonResponse({'success': True, 'message': 'Complaints recorded.'})

    # ── POST: Apply for Surgery ──────────────────────────────────────────────
    elif request.method == 'POST' and 'apply_surgery' in request.POST:
        name = request.POST.get('patient_name', '').strip()
        age = request.POST.get('patient_age', 0)
        gender = request.POST.get('patient_gender', 'Male')
        eye = request.POST.get('eye', 'RE')
        surgery_type = request.POST.get('surgery_type', 'Cataract')
        _default_surgeon = profile.get_surgeon_display_name() if profile.is_doctor_role else ""
        surgeon_name = request.POST.get('surgeon_name', '').strip() or _default_surgeon
        ot_room = request.POST.get('ot_room', 'OT-1')
        valid_slots = [choice[0] for choice in SurgeryRecord.OT_Slot_Choices]
        ot_slot = (request.POST.get('ot_slot') or '').strip() or 'Slot 1 (08:30 - 10:00 AM)'
        outcome = request.POST.get('outcome', 'Successful')
        medical_history = request.POST.get('medical_history', '').strip() or 'No systemic comorbidities reported. Pre-op IOP normal.'
        notes = request.POST.get('notes', '').strip()

        # ── Doctor restriction: always use the logged-in doctor's own identity ──
        # Derived purely from DB relationships — no hardcoded names/IDs.
        # Non-doctor roles (staff) may book any surgeon/room.
        if profile.is_doctor_role:
            surgeon_name = profile.get_surgeon_display_name()
            ot_room = profile.assigned_ot_room

        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.POST.get('ajax') == '1'

        # ── OT Date ─────────────────────────────────────────────────────────
        ot_date_raw = (request.POST.get('ot_date') or request.POST.get('date') or '').strip()
        ot_date_val = None
        if ot_date_raw:
            try:
                from datetime import datetime
                ot_date_val = datetime.strptime(ot_date_raw, '%Y-%m-%d').date()
            except ValueError:
                ot_date_val = None
        record_date = ot_date_val or date.today()

        if ot_date_raw and ot_date_val is None:
            err_msg = "Invalid date format. Please select a valid date (YYYY-MM-DD)."
            if is_ajax:
                return JsonResponse({'success': False, 'error': err_msg})
            messages.error(request, err_msg)
        elif not name:
            err_msg = "Please provide the Patient's Full Name."
            if is_ajax:
                return JsonResponse({'success': False, 'error': err_msg})
            messages.error(request, err_msg)
        elif record_date < date.today():
            err_msg = "Please select today or a future date. Past dates are not allowed."
            if is_ajax:
                return JsonResponse({'success': False, 'error': err_msg})
            messages.error(request, err_msg)
        elif not ot_slot or ot_slot == 'Select OT Slot' or ot_slot not in valid_slots:
            err_msg = "Please select a valid OT Slot."
            if is_ajax:
                return JsonResponse({'success': False, 'error': err_msg})
            messages.error(request, err_msg)
        else:
            # ── OT Slot Clash Detection (scoped to ot_room + ot_slot + date) ─
            clash_qs = SurgeryRecord.objects.filter(
                ot_room=ot_room, ot_slot=ot_slot, date=record_date
            ).exclude(outcome='Cancelled')
            clash = clash_qs.first()
            if clash:
                err_msg = (
                    f"⚠ OT Slot Clash! {ot_room} / {ot_slot} is already booked for "
                    f"{clash.patient_name} ({clash.patient_mrn}). "
                    f"Please choose a different room or slot."
                )
                if is_ajax:
                    return JsonResponse({'success': False, 'error': err_msg})
                messages.error(request, err_msg)
            else:
                record = SurgeryRecord.objects.create(
                    date=record_date,
                    patient_name=name,
                    patient_age=int(age) if str(age).isdigit() else 45,
                    patient_gender=gender,
                    eye=eye,
                    surgery_type=surgery_type,
                    surgeon_name=surgeon_name,
                    ot_room=ot_room,
                    ot_slot=ot_slot,
                    outcome=outcome,
                    medical_history=medical_history,
                    notes=notes,
                    # created_by=request.user,
                )
                succ_msg = f"Surgery application for {name} ({record.patient_mrn}) submitted. Booked: {ot_room} — {ot_slot}."
                if is_ajax:
                    return JsonResponse({
                        'success': True,
                        'message': succ_msg,
                        'patient': {
                            'id': record.id,
                            'patient_mrn': record.patient_mrn,
                            'patient_name': record.patient_name,
                            'patient_age': record.patient_age,
                            'patient_gender': record.patient_gender,
                            'eye': record.eye,
                            'surgery_type': record.surgery_type,
                            'surgeon_name': record.surgeon_name,
                            'ot_room': record.ot_room,
                            'ot_slot': record.ot_slot,
                            'outcome': record.outcome,
                            'medical_history': record.medical_history,
                            'notes': record.notes,
                            'date': record.date.strftime('%d %b %Y'),
                            'ot_date': record.date.strftime('%Y-%m-%d'),
                        }
                    })
                messages.success(request, succ_msg)
        redirect_tab = request.POST.get('active_tab', 'ot-matrix')
        return redirect(f"{request.path}?tab={redirect_tab}")

    # ── POST: Make Appointment ───────────────────────────────────────────────
    elif request.method == 'POST' and 'make_appointment' in request.POST:
        name = request.POST.get('patient_name', '').strip()
        phone = request.POST.get('patient_phone', '').strip()
        age = request.POST.get('patient_age', 0)
        gender = request.POST.get('patient_gender', 'Male')
        appt_type = request.POST.get('appointment_type', 'Consultant Clinic')
        _default_doctor = profile.get_surgeon_display_name() if profile.is_doctor_role else ""
        doctor = request.POST.get('doctor_name', '').strip() or _default_doctor
        appt_date = request.POST.get('appointment_date', '')
        time_slot = request.POST.get('appointment_time_slot', '09:00 - 10:00 AM')
        status = request.POST.get('status', 'Scheduled')
        notes = request.POST.get('notes', '').strip()

        if name and appt_date:
            appt = Appointment.objects.create(
                patient_name=name,
                patient_phone=phone,
                patient_age=int(age) if str(age).isdigit() else 30,
                patient_gender=gender,
                appointment_type=appt_type,
                doctor_name=doctor,
                appointment_date=appt_date,
                appointment_time_slot=time_slot,
                status=status,
                notes=notes,
                # created_by=request.user,
            )
            messages.success(request, f"Appointment for {name} ({appt.patient_mrn}) scheduled on {appt_date} at {time_slot}.")
        else:
            messages.error(request, "Please provide Patient Full Name and Appointment Date.")
        redirect_tab = request.POST.get('active_tab', 'appointments')
        return redirect(f"{request.path}?tab={redirect_tab}")

    # ── POST: Edit Surgery Record ───────────────────────────────────────────
    elif request.method == 'POST' and 'edit_surgery' in request.POST:
        surgery_id = request.POST.get('surgery_id')
        try:
            surg = SurgeryRecord.objects.get(id=surgery_id)

            # ── Ownership check: only the assigned doctor (or admin/superuser) can edit ──
            if not (request.user.is_superuser or profile.is_admin_role):
                _canon = profile.get_surgeon_display_name().lower()
                _surg_lower = (surg.surgeon_name or '').lower()
                _user_kws = [_canon]
                import re as _re2
                _bare = _re2.sub(r'^(dr\.|prof\.)\s*', '', _canon, flags=_re2.IGNORECASE).strip()
                if _bare and _bare != _canon:
                    _user_kws.append(_bare)
                if request.user.first_name.strip():
                    _user_kws.append(request.user.first_name.strip().lower())
                if request.user.last_name.strip() and len(request.user.last_name.strip()) >= 3:
                    _user_kws.append(request.user.last_name.strip().lower())
                _full = request.user.get_full_name().strip().lower()
                if _full:
                    _user_kws.append(_full)
                if request.user.username.strip():
                    _user_kws.append(request.user.username.strip().lower())
                _is_own = any(kw and kw in _surg_lower for kw in _user_kws)
                if not _is_own:
                    messages.error(
                        request,
                        f"⛔ Access Denied: You can only edit your own patients. "
                        f"Record #{surg.id} is assigned to {surg.surgeon_name}."
                    )
                    redirect_tab = request.POST.get('active_tab', 'surgery-history')
                    return redirect(f"{request.path}?tab={redirect_tab}")

            new_ot_room = request.POST.get('ot_room', surg.ot_room)
            new_ot_slot = request.POST.get('ot_slot', surg.ot_slot)

            # ── OT Slot Clash Detection (scoped to room + slot + date, exclude current record) ──
            clash = SurgeryRecord.objects.filter(
                ot_room=new_ot_room, ot_slot=new_ot_slot, date=surg.date
            ).exclude(outcome='Cancelled').exclude(pk=surg.pk).first()

            if clash:
                messages.error(
                    request,
                    f"⚠ OT Slot Clash! {new_ot_room} / {new_ot_slot} is already booked for "
                    f"{clash.patient_name} ({clash.patient_mrn}). "
                    f"Please choose a different room or slot."
                )
            else:
                surg.patient_mrn = request.POST.get('patient_mrn', surg.patient_mrn).strip()
                surg.patient_name = request.POST.get('patient_name', surg.patient_name).strip()
                age_val = request.POST.get('patient_age')
                if age_val and str(age_val).isdigit():
                    surg.patient_age = int(age_val)
                surg.patient_gender = request.POST.get('patient_gender', surg.patient_gender)
                surg.eye = request.POST.get('eye', surg.eye)
                surg.surgery_type = request.POST.get('surgery_type', surg.surgery_type)
                surg.surgeon_name = request.POST.get('surgeon_name', surg.surgeon_name).strip()
                surg.ot_room = new_ot_room
                surg.ot_slot = new_ot_slot
                surg.outcome = request.POST.get('outcome', surg.outcome)
                surg.medical_history = request.POST.get('medical_history', surg.medical_history).strip()
                surg.notes = request.POST.get('notes', surg.notes).strip()
                surg.save()
                messages.success(request, f"Surgery record #{surg.id} for {surg.patient_name} ({surg.patient_mrn}) updated successfully.")
        except SurgeryRecord.DoesNotExist:
            messages.error(request, "Surgery record not found.")
        redirect_tab = request.POST.get('active_tab', 'patients')
        return redirect(f"{request.path}?tab={redirect_tab}")

    # ── POST: Doctor Registration (Authorized Administrators Only) ────────────
    elif request.method == 'POST' and 'register_doctor' in request.POST:
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.POST.get('ajax') == '1'
        if not is_authorized_admin(request.user, profile):
            err_msg = "Access Denied: Only authorized administrators can register doctor accounts."
            if is_ajax:
                return JsonResponse({'success': False, 'error': err_msg}, status=403)
            messages.error(request, err_msg)
            return redirect(f"{request.path}?tab=patients")

        success, msg, data = handle_doctor_registration(request, current_profile=profile)
        if success:
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': msg,
                    'doctor': {
                        'id': data['profile'].id,
                        'username': data['user'].username,
                        'display_name': data['profile'].get_surgeon_display_name(),
                        'role': data['profile'].role,
                        'specialty': data['profile'].specialty,
                        'assigned_ot_room': data['profile'].assigned_ot_room,
                        'surgeon_code': data['profile'].surgeon_code,
                        'license_number': data['profile'].license_number,
                        'phone': data['profile'].phone,
                        'department': data['profile'].department,
                    }
                })
            messages.success(request, msg)
            return redirect(f"{request.path}?tab=doctor-reg")
        else:
            if is_ajax:
                return JsonResponse({'success': False, 'error': msg, 'errors': data if isinstance(data, dict) else {}}, status=400)
            messages.error(request, msg)
            request.session['reg_form_errors'] = data if isinstance(data, dict) else {}
            request.session['reg_form_data'] = {k: v for k, v in request.POST.items() if k != 'password'}
            return redirect(f"{request.path}?tab=doctor-reg")

    # ── POST: Edit Doctor / Staff Account (Authorized Administrators Only) ────
    elif request.method == 'POST' and 'edit_doctor' in request.POST:
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.POST.get('ajax') == '1'
        if not is_authorized_admin(request.user, profile):
            err_msg = "Access Denied: Only authorized administrators can edit doctor accounts."
            if is_ajax:
                return JsonResponse({'success': False, 'error': err_msg}, status=403)
            messages.error(request, err_msg)
            return redirect(f"{request.path}?tab=patients")

        success, msg, data = handle_edit_doctor(request, current_profile=profile)
        if success:
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': msg,
                    'doctor': {
                        'id': data['profile'].id,
                        'username': data['user'].username,
                        'display_name': data['profile'].get_surgeon_display_name(),
                        'role': data['profile'].role,
                        'specialty': data['profile'].specialty,
                        'assigned_ot_room': data['profile'].assigned_ot_room,
                        'surgeon_code': data['profile'].surgeon_code,
                        'license_number': data['profile'].license_number,
                        'phone': data['profile'].phone,
                        'department': data['profile'].department,
                        'is_active': data['user'].is_active,
                    }
                })
            messages.success(request, msg)
            return redirect(f"{request.path}?tab=doctor-reg")
        else:
            if is_ajax:
                return JsonResponse({'success': False, 'error': msg, 'errors': data if isinstance(data, dict) else {}}, status=400)
            messages.error(request, msg)
            return redirect(f"{request.path}?tab=doctor-reg")

    # ── POST: Update Profile ─────────────────────────────────────────────────
    elif request.method == 'POST':
        profile.specialty = request.POST.get('specialty', profile.specialty)
        profile.assigned_ot_room = request.POST.get('assigned_ot_room', profile.assigned_ot_room)
        profile.surgeon_code = request.POST.get('surgeon_code', profile.surgeon_code)
        profile.license_number = request.POST.get('license_number', profile.license_number)
        profile.phone = request.POST.get('phone', profile.phone)
        profile.bio = request.POST.get('bio', profile.bio)
        # surgeon_display_name: save only when explicitly submitted (e.g. from the profile settings form)
        surgeon_display_name_val = request.POST.get('surgeon_display_name')
        if surgeon_display_name_val is not None:
            profile.surgeon_display_name = surgeon_display_name_val.strip()
        role_val = request.POST.get('role', profile.role)
        profile.role = role_val
        profile.save()

        user = request.user
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        user.save()

        messages.success(request, "Profile updated successfully.")
        return redirect(f"{request.path}?tab=profile-settings")

    # ── GET: Build Context ───────────────────────────────────────────────────

    # All hospital surgery records
    all_surgeries = SurgeryRecord.objects.all().order_by('-date', '-id')

    # ── Logged-in doctor identity — derived entirely from the authenticated user account.
    # Use profile.get_surgeon_display_name() as the primary, reliable key that maps
    # this user to their surgery/appointment records in the database.  This reads from
    # NaimulProfile.surgeon_display_name (explicit DB field) → user.get_full_name() →
    # 'Dr. <username>' in that priority order, so it works for every doctor without
    # any hardcoded names or IDs.
    _u = request.user
    canonical_name = profile.get_surgeon_display_name()  # primary reliable key

    # Build supplementary keyword list from the user's identity fields as a fallback.
    # This ensures existing records that don't perfectly match the canonical name
    _full_name = _u.get_full_name().strip()
    doctor_keywords = []
    if canonical_name:
        doctor_keywords.append(canonical_name)
        # Also add the name without the 'Dr.' prefix so partial matches still work
        import re as _re
        bare = _re.sub(r'^(Dr\.|Prof\.)\s*', '', canonical_name, flags=_re.IGNORECASE).strip()
        if bare and bare.lower() != canonical_name.lower():
            doctor_keywords.append(bare)
    if _u.first_name.strip():
        doctor_keywords.append(_u.first_name.strip())
    if _u.last_name.strip() and len(_u.last_name.strip()) >= 3:
        doctor_keywords.append(_u.last_name.strip())
    if _full_name and _full_name not in doctor_keywords:
        doctor_keywords.append(_full_name)
    # Username is a reliable fallback (often appears inside the surgeon_name string)
    if _u.username.strip() and len(_u.username.strip()) >= 3:
        doctor_keywords.append(_u.username.strip())
    # De-duplicate while preserving order
    seen = set()
    _dedup = []
    for _k in doctor_keywords:
        _kl = _k.lower()
        if _kl not in seen:
            seen.add(_kl)
            _dedup.append(_k)
    doctor_keywords = _dedup

    # Best single display keyword for template use (canonical → first_name → full_name → username)
    doctor_kw = canonical_name or _u.first_name.strip() or _full_name or _u.username.strip()

    # STRICT PATIENT ISOLATION:
    # Filter surgery records by ANY of the doctor's identity keywords (icontains).
    # The canonical_name is always first in doctor_keywords, so it takes priority.
    my_surgeries_q = Q()
    for _kw in doctor_keywords:
        if _kw:
            my_surgeries_q |= Q(surgeon_name__icontains=_kw)
    if my_surgeries_q:
        my_surgeries = SurgeryRecord.objects.filter(my_surgeries_q, date=date.today()).order_by('-date', '-id')
    else:
        my_surgeries = SurgeryRecord.objects.none()

    # Search Query Handling (Doctor can search via MRN Number or Patient Name)
    search_mrn = request.GET.get('patient_mrn', '').strip()
    general_query = request.GET.get('q', '').strip()
    search_query = search_mrn or general_query
    is_admin = is_authorized_admin(request.user, profile)
    default_tab = 'doctor-reg' if profile.role == 'Admin' else ('ot-matrix' if profile.is_staff_role else 'patients')
    active_tab = request.GET.get('tab') or default_tab

    is_cross_doctor_lookup = False
    searched_patient_found = None
    searched_doctor_name = None
    search_error = False
    search_error_title = ""
    search_error_headline = ""
    search_error_desc = ""

    if search_query:
        # Cross-Doctor Lookup via MRN OR Patient Name
        matched_records = SurgeryRecord.objects.filter(
            Q(patient_mrn__iexact=search_query) |
            Q(patient_mrn__icontains=search_query) |
            Q(patient_name__icontains=search_query)
        ).order_by('-date', '-id')

        if matched_records.exists():
            displayed_patients = matched_records
            first_match = matched_records.first()
            # Determine if the found patient belongs to the logged-in doctor
            is_own_patient = any(
                _kw.lower() in first_match.surgeon_name.lower()
                for _kw in doctor_keywords if _kw
            )
            if not is_own_patient:
                is_cross_doctor_lookup = True
                searched_patient_found = first_match
                searched_doctor_name = first_match.surgeon_name
        else:
            displayed_patients = SurgeryRecord.objects.none()
            search_error = True
            import re
            is_mrn_like = bool(re.search(r'mrn|\bp\d|\b\d{3,}', search_query, re.IGNORECASE))
            search_error_headline = "Not a valid MRN number or not such patient found."
            if is_mrn_like:
                search_error_title = "Not a Valid MRN Number"
                search_error_desc = f"\"{search_query}\" is not a valid MRN number or no matching patient was found in the hospital registry."
            else:
                search_error_title = "No Such Patient Found"
                search_error_desc = f"No patient records found matching the name \"{search_query}\"."
    else:
        # DEFAULT: Strictly show only my own patients!
        displayed_patients = my_surgeries

    # Diagnostic procedures & Ocular Diagnostic Reports
    diagnostic_procedures = DiagnosisProcedure.objects.all().order_by('-date', '-id')
    if search_query:
        displayed_diagnostics = DiagnosisProcedure.objects.filter(
            Q(patient_mrn__icontains=search_query) |
            Q(patient_name__icontains=search_query)
        )
    else:
        my_mrns = my_surgeries.values_list('patient_mrn', flat=True)
        displayed_diagnostics = DiagnosisProcedure.objects.filter(patient_mrn__in=my_mrns)

    # OT Utilization Analytics — derived from DB model choices, no hardcoded values
    # Capacity = number of OT rooms × number of OT slots (all from model definitions)
    num_ot_rooms = len(SurgeryRecord.OT_Room_Choices)
    num_ot_slots = len(SurgeryRecord.OT_Slot_Choices)
    total_ot_capacity = num_ot_rooms * num_ot_slots
    total_booked_cases = all_surgeries.count()
    overall_ot_utilization = round((total_booked_cases / total_ot_capacity) * 100, 1) if total_ot_capacity else 0

    # OT suite metadata derived from DB model choices — room name/icon/color mapped to room value
    _ot_room_meta = {
        'OT-1': {'name': 'General & Phaco Suite',      'icon': 'fa-microscope', 'color': '#0284c7'},
        'OT-2': {'name': 'Retina Microsurgery Suite',  'icon': 'fa-eye',        'color': '#0d9488'},
        'OT-3': {'name': 'Laser & Refractive Suite',   'icon': 'fa-bolt',       'color': '#f59e0b'},
        'OT-4': {'name': 'Pediatric & Day Care OT',    'icon': 'fa-children',   'color': '#8b5cf6'},
    }
    ot_suite_stats = []
    for room_val, _room_label in SurgeryRecord.OT_Room_Choices:
        room_count = all_surgeries.filter(ot_room=room_val).count()
        meta = _ot_room_meta.get(room_val, {'name': _room_label, 'icon': 'fa-hospital', 'color': '#6b7280'})
        ot_suite_stats.append({
            'room': room_val,
            'name': meta['name'],
            'count': room_count,
            'capacity': num_ot_slots,
            'utilization': round((room_count / num_ot_slots) * 100, 1) if num_ot_slots else 0,
            'icon': meta['icon'],
            'color': meta['color'],
        })

    # Appointments (all, ordered by date)
    appointments = Appointment.objects.all().order_by('appointment_date', 'appointment_time_slot')
    upcoming_appointments = appointments.filter(status__in=['Scheduled', 'Confirmed'])
    
    # Full OT Slot Matrix — all 4 suites (filtered to today, excludes cancelled)
    today = date.today()
    ot_suite_matrix = []
    for room_val, room_label in SurgeryRecord.OT_Room_Choices:
        room_surgeries = SurgeryRecord.objects.filter(
            ot_room=room_val, date=today
        ).exclude(outcome='Cancelled').order_by('ot_slot')
        slots = []
        for slot_val, slot_label in SurgeryRecord.OT_Slot_Choices:
            case = room_surgeries.filter(ot_slot=slot_val).first()
            slots.append({
                'slot_name': slot_val,
                'slot_label': slot_label,
                'case': case,
                'is_booked': case is not None,
            })
        ot_suite_matrix.append({
            'room': room_val,
            'room_label': room_label,
            'slots': slots,
            'total_booked': room_surgeries.count(),
            'utilization': round((room_surgeries.count() / 5) * 100, 1),
        })

    # Doctor's single-suite slot schedule (assigned room, filtered to today)
    ot_suite_surgeries = SurgeryRecord.objects.filter(
        ot_room=profile.assigned_ot_room, date=today
    ).exclude(outcome='Cancelled').order_by('ot_slot')

    ot_slots_schedule = []
    for slot_val, slot_label in SurgeryRecord.OT_Slot_Choices:
        case = ot_suite_surgeries.filter(ot_slot=slot_val).first()
        ot_slots_schedule.append({
            'slot_name': slot_val,
            'slot_label': slot_label,
            'case': case,
            'is_booked': case is not None,
        })

    # Build a JSON map of already-booked OT slots for front-end clash detection
    # Scoped to today's date and excludes cancelled bookings
    # Format: { "OT-1||Slot 1 (08:30 - 10:00 AM)": {patient_name, patient_mrn}, ... }
    booked_ot_slots_raw = SurgeryRecord.objects.filter(
        date=today
    ).exclude(outcome='Cancelled').values('ot_room', 'ot_slot', 'patient_name', 'patient_mrn', 'id')
    booked_ot_slots = {
        f"{r['ot_room']}||{r['ot_slot']}": {
            'patient_name': r['patient_name'],
            'patient_mrn': r['patient_mrn'],
            'id': r['id'],
        }
        for r in booked_ot_slots_raw
    }

    # Precompute doctor display name for form defaults and template use
    doctor_display_name = profile.get_surgeon_display_name()
    available_doctors = get_available_doctors()
    if profile.is_doctor_role and canonical_name and canonical_name not in available_doctors:
        available_doctors.append(canonical_name)
        available_doctors.sort()

    context = {
        'profile': profile,
        'user_surgeries': my_surgeries,
        'all_surgeries': all_surgeries,
        'diagnostic_records': displayed_diagnostics,
        'displayed_patients': displayed_patients,
        'search_mrn': search_query,
        'search_query': search_query,
        'search_error': search_error,
        'search_error_title': search_error_title,
        'search_error_headline': search_error_headline,
        'search_error_desc': search_error_desc,
        'general_query': general_query,
        'is_cross_doctor_lookup': is_cross_doctor_lookup,
        'searched_patient_found': searched_patient_found,
        'searched_doctor_name': searched_doctor_name,
        'diagnostic_procedures': diagnostic_procedures,
        # 'displayed_diagnostics': displayed_diagnostics,
        'overall_ot_utilization': overall_ot_utilization,
        'total_booked_cases': total_booked_cases,
        'total_ot_capacity': total_ot_capacity,
        'ot_suite_stats': ot_suite_stats,
        'appointments': appointments,
        'upcoming_appointments': upcoming_appointments,
        'ot_slots_schedule': ot_slots_schedule,
        'ot_suite_surgeries': ot_suite_surgeries,
        'ot_suite_matrix': ot_suite_matrix,
        'active_tab': active_tab,
        'specialty_choices': NaimulProfile.Specialty_Choices,
        'ot_room_choices': NaimulProfile.OT_Room_Choices,
        'role_choices': NaimulProfile.Role_Choices,
        'ot_slot_choices': SurgeryRecord.OT_Slot_Choices,
        'surgery_type_choices': SurgeryRecord.Surgery_Type_Choices,
        'outcome_choices': SurgeryRecord.Outcome_Choices,
        'ot_room_choices_surgery': SurgeryRecord.OT_Room_Choices,
        'appointment_type_choices': Appointment.Appointment_Type_Choices,
        'appointment_time_slot_choices': Appointment.Time_Slot_Choices,
        'appointment_status_choices': Appointment.Status_Choices,
        'booked_ot_slots_json': json.dumps(booked_ot_slots),
        # Available doctors for patient registration dropdown
        'available_doctors': available_doctors,
        # Doctor → assigned OT room map (JSON for frontend auto-populate)
        'doctor_ot_room_map_json': json.dumps(get_doctor_ot_room_map()),
        # Doctor identity helpers for template-level display logic
        'doctor_kw': doctor_kw,
        'doctor_kw_lower': doctor_kw.lower(),
        'doctor_display_name': doctor_display_name,
        # Admin & Doctor Registration context
        'is_admin': is_admin,
        'all_registered_profiles': NaimulProfile.objects.select_related('user').all().order_by('-id') if is_admin else NaimulProfile.objects.none(),
        'reg_form_errors': request.session.pop('reg_form_errors', None),
        'reg_form_data': request.session.pop('reg_form_data', None),
        'can_assign_admin': request.user.is_superuser,
        'prescriptions_count': Prescription.objects.filter(prescribing_doctor=profile.get_surgeon_display_name()).count(),
    }
    return render(request, 'users_naimul/profile.html', context)


@login_required(login_url='users_naimul:login')
@require_GET
def prescription_api(request):
    """
    API endpoint: Return prescriptions for a given patient MRN by the logged-in doctor.
    Query params:
        patient_mrn  - e.g. 'P2600001'
    Response JSON:
        {'prescriptions': [list of dicts with all Prescription fields including medications (parsed JSON)]}
    """
    profile, _ = NaimulProfile.objects.get_or_create(user=request.user)
    if not profile.is_doctor_role:
        return JsonResponse({'success': False, 'error': 'Access denied. Only doctors can access prescriptions.'}, status=403)

    patient_mrn = request.GET.get('patient_mrn', '').strip()
    rx_id = request.GET.get('rx_id', '').strip()
    doctor_name = profile.get_surgeon_display_name()

    qs = Prescription.objects.all()
    if not (request.user.is_superuser or profile.is_admin_role):
        qs = qs.filter(
            Q(prescribing_doctor__icontains=doctor_name) |
            Q(prescribing_doctor__icontains=request.user.username)
        )
    if rx_id and rx_id.isdigit():
        qs = qs.filter(id=int(rx_id))
    elif patient_mrn:
        qs = qs.filter(patient_mrn=patient_mrn)
    qs = qs.order_by('-date_created')

    prescriptions = []
    for rx in qs:
        prescriptions.append({
            'id': rx.id,
            'patient_mrn': rx.patient_mrn,
            'patient_name': rx.patient_name,
            'patient_age': rx.patient_age,
            'patient_gender': rx.patient_gender,
            'eye': rx.eye,
            'diagnosis': rx.diagnosis,
            'medications': rx.medications,
            'notes': rx.notes,
            'complaints': rx.complaints,
            'complaint_meta': rx.complaint_meta,
            'prescribing_doctor': rx.prescribing_doctor,
            'date_created': rx.date_created.strftime('%Y-%m-%d %H:%M:%S'),
            'date_updated': rx.date_updated.strftime('%Y-%m-%d %H:%M:%S'),
        })

    return JsonResponse({'prescriptions': prescriptions})


@login_required(login_url='users_naimul:login')
@require_GET
def patient_lookup_api(request):
    """
    API endpoint: Look up patient clinical details by MRN for Patient Load.
    Query params:
        mrn - Patient MRN e.g. 'P2600001'
    Response JSON:
        {'success': True, 'patient': {...}} or {'success': False, 'error': '...'}
    """
    profile, _ = NaimulProfile.objects.get_or_create(user=request.user)
    if not profile.is_doctor_role:
        return JsonResponse({'success': False, 'error': 'Access denied. Only doctors can access patient records.'}, status=403)

    mrn = request.GET.get('mrn', '').strip()
    if not mrn:
        return JsonResponse({'success': False, 'error': 'Please enter a valid Patient MRN to search.'}, status=400)

    eye_map = {'LE': 'Left Eye (OS)', 'RE': 'Right Eye (OD)', 'BE': 'Both Eyes (OU)'}

    # 1. Search across SurgeryRecord, Prescription, Appointment, DiagnosisProcedure
    record = SurgeryRecord.objects.filter(patient_mrn__iexact=mrn).first()
    if not record:
        record = SurgeryRecord.objects.filter(patient_mrn__icontains=mrn).first()
    if not record:
        record = SurgeryRecord.objects.filter(patient_name__icontains=mrn).first()

    rx_record = None
    if not record:
        rx_record = Prescription.objects.filter(patient_mrn__iexact=mrn).first()
        if not rx_record:
            rx_record = Prescription.objects.filter(patient_mrn__icontains=mrn).first()
        if not rx_record:
            rx_record = Prescription.objects.filter(patient_name__icontains=mrn).first()

    appt_record = None
    if not record and not rx_record:
        appt_record = Appointment.objects.filter(patient_mrn__iexact=mrn).first()
        if not appt_record:
            appt_record = Appointment.objects.filter(patient_mrn__icontains=mrn).first()
        if not appt_record:
            appt_record = Appointment.objects.filter(patient_name__icontains=mrn).first()

    diag_record = None
    if not record and not rx_record and not appt_record:
        diag_record = DiagnosisProcedure.objects.filter(patient_mrn__iexact=mrn).first()
        if not diag_record:
            diag_record = DiagnosisProcedure.objects.filter(patient_mrn__icontains=mrn).first()
        if not diag_record:
            diag_record = DiagnosisProcedure.objects.filter(patient_name__icontains=mrn).first()

    matched_obj = record or rx_record or appt_record or diag_record
    if not matched_obj:
        return JsonResponse({
            'success': False,
            'error': f'No patient found with MRN "{mrn}". Please verify the MRN and try again.'
        }, status=404)

    target_mrn = matched_obj.patient_mrn or mrn
    patient_name = matched_obj.patient_name
    patient_age = getattr(matched_obj, 'patient_age', 0)
    patient_gender = getattr(matched_obj, 'patient_gender', 'Male')
    patient_eye = getattr(matched_obj, 'eye', 'BE')
    uin_val = f"{matched_obj.id:010d}"

    # Determine procedure / attending doctor details
    if record:
        surgery_type = record.surgery_type or 'General Ophthalmology'
        surgeon_name = record.surgeon_name or 'N/A'
        ot_room = record.ot_room or 'N/A'
        ot_slot = record.ot_slot or 'N/A'
        outcome = record.outcome or 'Pending / Under Evaluation'
        medical_history = record.medical_history or 'No systemic comorbidities reported.'
        notes = record.notes or 'No clinical notes recorded.'
        clinic_label = 'Clinic: Surgical Ophthalmology'
    elif rx_record:
        surgery_type = 'Consultation / Follow-Up'
        surgeon_name = rx_record.prescribing_doctor or 'N/A'
        ot_room = 'N/A'
        ot_slot = 'N/A'
        outcome = 'Consultation Completed'
        medical_history = rx_record.diagnosis or 'No prior systemic history.'
        notes = rx_record.notes or 'No prior clinical notes.'
        try:
            rx_doctor_profile = NaimulProfile.objects.select_related('user').filter(
                Q(surgeon_display_name__icontains=rx_record.prescribing_doctor) |
                Q(user__username__icontains=rx_record.prescribing_doctor)
            ).first()
            clinic_label = f"Clinic: {rx_doctor_profile.department}" if rx_doctor_profile and rx_doctor_profile.department else 'Clinic: OPD'
        except Exception:
            clinic_label = 'Clinic: OPD'
    elif appt_record:
        surgery_type = appt_record.appointment_type or 'Clinical Consultation'
        surgeon_name = appt_record.doctor_name or 'N/A'
        ot_room = 'N/A'
        ot_slot = appt_record.appointment_time_slot or 'N/A'
        outcome = appt_record.status or 'Scheduled'
        medical_history = 'Scheduled for clinical evaluation.'
        notes = appt_record.notes or 'No appointment notes.'
        clinic_label = 'Clinic: OPD Consultation'
    else:
        surgery_type = diag_record.procedure_name or 'Ophthalmic Investigation'
        surgeon_name = diag_record.technician_name or 'N/A'
        ot_room = 'N/A'
        ot_slot = 'N/A'
        outcome = 'Diagnostics Completed'
        medical_history = diag_record.findings_summary or 'Diagnostic investigations recorded.'
        notes = diag_record.findings_summary or 'No diagnostic notes.'
        clinic_label = 'Clinic: Ocular Diagnostics'

    # 2. Collect ALL visits and encounters from the database for this patient
    surg_qs = SurgeryRecord.objects.filter(Q(patient_mrn=target_mrn) | Q(patient_name__iexact=patient_name)).order_by('date', 'id')
    rx_qs = Prescription.objects.filter(Q(patient_mrn=target_mrn) | Q(patient_name__iexact=patient_name)).order_by('date_created')
    appt_qs = Appointment.objects.filter(Q(patient_mrn=target_mrn) | Q(patient_name__iexact=patient_name)).order_by('appointment_date', 'id')
    diag_qs = DiagnosisProcedure.objects.filter(Q(patient_mrn=target_mrn) | Q(patient_name__iexact=patient_name)).order_by('date', 'id')

    visits_by_date = {}

    for s in surg_qs:
        if s.date:
            d = s.date
            visits_by_date.setdefault(d, []).append({
                'type': 'Surgery',
                'title': s.surgery_type,
                'doctor': s.surgeon_name,
                'details': f"{s.surgery_type} ({s.ot_room or 'OT'})",
            })

    for p in rx_qs:
        if p.date_created:
            d = p.date_created.date()
            visits_by_date.setdefault(d, []).append({
                'type': 'Prescription',
                'title': p.diagnosis or 'Prescription',
                'doctor': p.prescribing_doctor,
                'rx_id': p.id,
                'details': p.diagnosis,
            })

    for a in appt_qs:
        if a.appointment_date:
            d = a.appointment_date
            visits_by_date.setdefault(d, []).append({
                'type': 'Appointment',
                'title': a.appointment_type,
                'doctor': a.doctor_name,
                'details': f"{a.appointment_type} ({a.appointment_time_slot})",
            })

    for diag in diag_qs:
        if diag.date:
            d = diag.date
            visits_by_date.setdefault(d, []).append({
                'type': 'Diagnostic',
                'title': diag.procedure_name,
                'doctor': diag.technician_name,
                'details': diag.procedure_name,
            })

    sorted_db_dates = sorted(visits_by_date.keys())
    today = date.today()

    # All unique encounter dates
    all_dates = list(sorted_db_dates)
    if today not in all_dates:
        all_dates.append(today)
    all_dates.sort()

    # Registration date is the earliest recorded date in DB
    reg_date = sorted_db_dates[0] if sorted_db_dates else today
    registration_date_str = reg_date.strftime('%d %b %Y')

    # Last Visit date:
    # Most recent visit strictly before today (or before the latest active visit)
    earlier_dates = [d for d in sorted_db_dates if d < today]
    if earlier_dates:
        last_visit_date = earlier_dates[-1]
        last_visit_str = last_visit_date.strftime('%d %b %Y')
    elif len(all_dates) > 1 and all_dates[-1] == today:
        last_visit_date = all_dates[-2]
        last_visit_str = last_visit_date.strftime('%d %b %Y')
    else:
        # If there's only 1 encounter date
        last_visit_str = reg_date.strftime('%d %b %Y')

    # Active encounter date (default to today or latest)
    active_date = today if today in all_dates else all_dates[-1]
    active_date_str = active_date.strftime('%d %b %Y')

    # Build visits payload
    visits_list = []
    for d in all_dates:
        encounters = visits_by_date.get(d, [])
        is_today = (d == today)
        is_active = (d == active_date)
        label_parts = [e['title'] for e in encounters if e.get('title')]
        label = ', '.join(label_parts) if label_parts else ('OPD Consultation' if is_today else 'Hospital Visit')
        visits_list.append({
            'date': d.strftime('%d %b %Y'),
            'date_iso': d.strftime('%Y-%m-%d'),
            'is_new': is_today,
            'is_active': is_active,
            'label': label,
            'encounters': encounters,
        })

    return JsonResponse({
        'success': True,
        'patient': {
            'mrn': target_mrn,
            'name': patient_name,
            'age': patient_age,
            'gender': patient_gender,
            'uin': uin_val,
            'eye': patient_eye,
            'eye_display': eye_map.get(patient_eye, patient_eye),
            'surgery_type': surgery_type,
            'surgeon_name': surgeon_name,
            'clinic': clinic_label,
            'ot_room': ot_room,
            'ot_slot': ot_slot,
            'outcome': outcome,
            'medical_history': medical_history,
            'notes': notes,
            'date': active_date_str,
            'registration_date': registration_date_str,
            'last_visit': last_visit_str,
            'last_visit_date': last_visit_str,
            'visits': visits_list,
        }
    })


@login_required(login_url='users_naimul:login')
def register_doctor_view(request):
    """
    Dedicated view endpoint for doctor registration.
    Accessible to authorized administrators; supports AJAX & POST.
    """
    profile, _ = NaimulProfile.objects.get_or_create(user=request.user)
    is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.POST.get('ajax') == '1'

    if not is_authorized_admin(request.user, profile):
        err_msg = "Access Denied: Only authorized administrators can access doctor registration."
        if is_ajax:
            return JsonResponse({'success': False, 'error': err_msg}, status=403)
        messages.error(request, err_msg)
        return redirect('users_naimul:profile')

    if request.method == 'POST':
        success, msg, data = handle_doctor_registration(request, current_profile=profile)
        if success:
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': msg,
                    'doctor': {
                        'id': data['profile'].id,
                        'username': data['user'].username,
                        'display_name': data['profile'].get_surgeon_display_name(),
                        'role': data['profile'].role,
                        'specialty': data['profile'].specialty,
                        'assigned_ot_room': data['profile'].assigned_ot_room,
                        'surgeon_code': data['profile'].surgeon_code,
                        'license_number': data['profile'].license_number,
                        'phone': data['profile'].phone,
                        'department': data['profile'].department,
                    }
                })
            messages.success(request, msg)
            return redirect('/naimul/profile/?tab=doctor-reg')
        else:
            if is_ajax:
                return JsonResponse({'success': False, 'error': msg, 'errors': data if isinstance(data, dict) else {}}, status=400)
            messages.error(request, msg)
            request.session['reg_form_errors'] = data if isinstance(data, dict) else {}
            request.session['reg_form_data'] = {k: v for k, v in request.POST.items() if k != 'password'}
            return redirect('/naimul/profile/?tab=doctor-reg')

    return redirect('/naimul/profile/?tab=doctor-reg')


@login_required(login_url='users_naimul:login')
def edit_doctor_view(request):
    """
    Dedicated view endpoint for editing doctor / staff information.
    Accessible to authorized administrators; supports AJAX & POST.
    """
    profile, _ = NaimulProfile.objects.get_or_create(user=request.user)
    is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.POST.get('ajax') == '1'

    if not is_authorized_admin(request.user, profile):
        err_msg = "Access Denied: Only authorized administrators can edit doctor accounts."
        if is_ajax:
            return JsonResponse({'success': False, 'error': err_msg}, status=403)
        messages.error(request, err_msg)
        return redirect('users_naimul:profile')

    if request.method == 'POST':
        success, msg, data = handle_edit_doctor(request, current_profile=profile)
        if success:
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': msg,
                    'doctor': {
                        'id': data['profile'].id,
                        'username': data['user'].username,
                        'display_name': data['profile'].get_surgeon_display_name(),
                        'role': data['profile'].role,
                        'specialty': data['profile'].specialty,
                        'assigned_ot_room': data['profile'].assigned_ot_room,
                        'surgeon_code': data['profile'].surgeon_code,
                        'license_number': data['profile'].license_number,
                        'phone': data['profile'].phone,
                        'department': data['profile'].department,
                        'is_active': data['user'].is_active,
                    }
                })
            messages.success(request, msg)
            return redirect('/naimul/profile/?tab=doctor-reg')
        else:
            if is_ajax:
                return JsonResponse({'success': False, 'error': msg, 'errors': data if isinstance(data, dict) else {}}, status=400)
            messages.error(request, msg)
            return redirect('/naimul/profile/?tab=doctor-reg')

    return redirect('/naimul/profile/?tab=doctor-reg')


@require_GET
@login_required(login_url='users_naimul:login')
def ot_slot_availability_api(request):
    """
    AJAX API: Return the list of booked OT slots, patient names, and availability for a given OT room and date.
    Query params:
        ot_room  - e.g. 'OT-1'
        ot_date  - ISO date string 'YYYY-MM-DD'
    Response JSON:
        {
            "booked_slots": ["Slot 1 (08:30 - 10:00 AM)", ...],
            "booked_details": {
                "Slot 1 (08:30 - 10:00 AM)": {
                    "patient_name": "...",
                    "patient_mrn": "...",
                    "id": 1
                }
            },
            "slots": [
                {
                    "slot_val": "Slot 1 (08:30 - 10:00 AM)",
                    "slot_label": "Slot 1 (08:30 - 10:00 AM) - Morning Primary",
                    "is_booked": true,
                    "patient_name": "...",
                    "patient_mrn": "..."
                },
                ...
            ]
        }
    """
    ot_room = request.GET.get('ot_room', '').strip()
    ot_date_raw = request.GET.get('ot_date', '').strip()

    if not ot_room or not ot_date_raw:
        return JsonResponse({'booked_slots': [], 'booked_details': {}, 'slots': []})

    try:
        from datetime import datetime
        ot_date = datetime.strptime(ot_date_raw, '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

    booked_records = list(
        SurgeryRecord.objects
        .filter(ot_room=ot_room, date=ot_date)
        .exclude(ot_slot__isnull=True)
        .exclude(ot_slot='')
        .exclude(outcome='Cancelled')
        .values('ot_slot', 'patient_name', 'patient_mrn', 'id')
    )

    booked_slots = [r['ot_slot'] for r in booked_records]
    booked_details = {
        r['ot_slot']: {
            'patient_name': r['patient_name'],
            'patient_mrn': r['patient_mrn'],
            'id': r['id'],
        }
        for r in booked_records
    }

    slots_data = []
    for slot_val, slot_label in SurgeryRecord.OT_Slot_Choices:
        detail = booked_details.get(slot_val)
        is_booked = detail is not None
        p_name = detail['patient_name'] if is_booked else None
        p_mrn = detail['patient_mrn'] if is_booked else None
        slots_data.append({
            'slot_val': slot_val,
            'slot_label': slot_label,
            'is_booked': is_booked,
            'patient_name': p_name,
            'patient_mrn': p_mrn,
        })

    return JsonResponse({
        'booked_slots': booked_slots,
        'booked_details': booked_details,
        'slots': slots_data,
    })

