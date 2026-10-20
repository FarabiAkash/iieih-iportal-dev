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
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from datetime import date
from .models import (
    NaimulProfile,
    SurgeryRecord,
    DiagnosisProcedure,
    Appointment,
    get_available_doctors,
    get_doctor_assigned_ot_room,
    get_doctor_ot_room_map,
)

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
            
            if profile.is_staff_role:
                welcome_msg = f"Welcome, {user.get_full_name() or user.username}! OT Coordinator Console is ready."
            else:
                welcome_msg = f"Welcome back, Dr. {user.get_full_name() or user.username}! Operation Theatre roster loaded."

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

    # ── POST: Apply for Surgery ──────────────────────────────────────────────
    if request.method == 'POST' and 'apply_surgery' in request.POST:
        name = request.POST.get('patient_name', '').strip()
        age = request.POST.get('patient_age', 0)
        gender = request.POST.get('patient_gender', 'Male')
        eye = request.POST.get('eye', 'RE')
        surgery_type = request.POST.get('surgery_type', 'Cataract')
        _default_surgeon = f"Dr. {request.user.get_full_name() or request.user.username}"
        surgeon_name = request.POST.get('surgeon_name', '').strip() or _default_surgeon
        ot_room = request.POST.get('ot_room', 'OT-1')
        ot_slot = request.POST.get('ot_slot', 'Slot 1 (08:30 - 10:00 AM)')
        outcome = request.POST.get('outcome', 'Successful')
        medical_history = request.POST.get('medical_history', '').strip() or 'No systemic comorbidities reported. Pre-op IOP normal.'
        notes = request.POST.get('notes', '').strip()

        if name:
            # ── OT Slot Clash Detection ──────────────────────────────────────
            clash = SurgeryRecord.objects.filter(ot_room=ot_room, ot_slot=ot_slot).first()
            if clash:
                messages.error(
                    request,
                    f"⚠ OT Slot Clash! {ot_room} / {ot_slot} is already booked for "
                    f"{clash.patient_name} ({clash.patient_mrn}). "
                    f"Please choose a different room or slot."
                )
            else:
                record = SurgeryRecord.objects.create(
                    date=date.today(),
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
                messages.success(request, f"Surgery application for {name} ({record.patient_mrn}) submitted. Booked: {ot_room} — {ot_slot}.")
        else:
            messages.error(request, "Please provide the Patient's Full Name.")
        redirect_tab = request.POST.get('active_tab', 'ot-matrix')
        return redirect(f"{request.path}?tab={redirect_tab}")

    # ── POST: Make Appointment ───────────────────────────────────────────────
    elif request.method == 'POST' and 'make_appointment' in request.POST:
        name = request.POST.get('patient_name', '').strip()
        phone = request.POST.get('patient_phone', '').strip()
        age = request.POST.get('patient_age', 0)
        gender = request.POST.get('patient_gender', 'Male')
        appt_type = request.POST.get('appointment_type', 'Consultant Clinic')
        _default_doctor = f"Dr. {request.user.get_full_name() or request.user.username}"
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
            new_ot_room = request.POST.get('ot_room', surg.ot_room)
            new_ot_slot = request.POST.get('ot_slot', surg.ot_slot)

            # ── OT Slot Clash Detection (exclude current record) ─────────────
            clash = SurgeryRecord.objects.filter(
                ot_room=new_ot_room, ot_slot=new_ot_slot
            ).exclude(pk=surg.pk).first()

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

    # ── POST: Update Profile ─────────────────────────────────────────────────
    elif request.method == 'POST':
        profile.specialty = request.POST.get('specialty', profile.specialty)
        profile.assigned_ot_room = request.POST.get('assigned_ot_room', profile.assigned_ot_room)
        profile.surgeon_code = request.POST.get('surgeon_code', profile.surgeon_code)
        profile.license_number = request.POST.get('license_number', profile.license_number)
        profile.phone = request.POST.get('phone', profile.phone)
        profile.bio = request.POST.get('bio', profile.bio)
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
    # Build a set of keywords from first_name, last_name, full name, and username.
    # This avoids any hardcoded fallback and works for every registered doctor.
    _u = request.user
    _full_name = _u.get_full_name().strip()
    doctor_keywords = []
    if _u.first_name.strip():
        doctor_keywords.append(_u.first_name.strip())
    if _u.last_name.strip() and len(_u.last_name.strip()) >= 3:
        doctor_keywords.append(_u.last_name.strip())
    if _full_name and _full_name not in doctor_keywords:
        doctor_keywords.append(_full_name)
    # Username is the reliable fallback (it often appears inside the surgeon_name string)
    if _u.username.strip() and len(_u.username.strip()) >= 3:
        doctor_keywords.append(_u.username.strip())

    # Best single display keyword (first_name → full name → username)
    doctor_kw = _u.first_name.strip() or _full_name or _u.username.strip()

    # STRICT PATIENT ISOLATION:
    # Only load patients whose surgeon_name matches any of the logged-in doctor's identity keywords.
    my_surgeries_q = Q()
    for _kw in doctor_keywords:
        if _kw:
            my_surgeries_q |= Q(surgeon_name__icontains=_kw)
    if my_surgeries_q:
        my_surgeries = SurgeryRecord.objects.filter(my_surgeries_q).order_by('-date', '-id')
    else:
        my_surgeries = SurgeryRecord.objects.none()

    # Search Query Handling (Doctor can search via MRN Number or Patient Name)
    search_mrn = request.GET.get('patient_mrn', '').strip()
    general_query = request.GET.get('q', '').strip()
    search_query = search_mrn or general_query
    default_tab = 'ot-matrix' if profile.is_staff_role else 'patients'
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

    # OT Utilization Analytics
    total_ot_capacity = 20  # 4 suites * 5 slots
    total_booked_cases = all_surgeries.count()
    overall_ot_utilization = round((total_booked_cases / total_ot_capacity) * 100, 1)

    ot1_count = all_surgeries.filter(ot_room='OT-1').count()
    ot2_count = all_surgeries.filter(ot_room='OT-2').count()
    ot3_count = all_surgeries.filter(ot_room='OT-3').count()
    ot4_count = all_surgeries.filter(ot_room='OT-4').count()

    ot_suite_stats = [
        {'room': 'OT-1', 'name': 'General & Phaco Suite', 'count': ot1_count, 'capacity': 5, 'utilization': round((ot1_count / 5) * 100, 1), 'icon': 'fa-microscope', 'color': '#0284c7'},
        {'room': 'OT-2', 'name': 'Retina Microsurgery Suite', 'count': ot2_count, 'capacity': 5, 'utilization': round((ot2_count / 5) * 100, 1), 'icon': 'fa-eye', 'color': '#0d9488'},
        {'room': 'OT-3', 'name': 'Laser & Refractive Suite', 'count': ot3_count, 'capacity': 5, 'utilization': round((ot3_count / 5) * 100, 1), 'icon': 'fa-bolt', 'color': '#f59e0b'},
        {'room': 'OT-4', 'name': 'Pediatric & Day Care OT', 'count': ot4_count, 'capacity': 5, 'utilization': round((ot4_count / 5) * 100, 1), 'icon': 'fa-children', 'color': '#8b5cf6'},
    ]

    # Appointments (all, ordered by date)
    appointments = Appointment.objects.all().order_by('appointment_date', 'appointment_time_slot')
    upcoming_appointments = appointments.filter(status__in=['Scheduled', 'Confirmed'])
    
    # Full OT Slot Matrix — all 4 suites
    ot_suite_matrix = []
    for room_val, room_label in SurgeryRecord.OT_Room_Choices:
        room_surgeries = SurgeryRecord.objects.filter(ot_room=room_val).order_by('ot_slot')
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

    # Legacy single-suite slot schedule (assigned room)
    ot_suite_surgeries = SurgeryRecord.objects.filter(ot_room=profile.assigned_ot_room).order_by('ot_slot')
    if not ot_suite_surgeries.exists():
        ot_suite_surgeries = my_surgeries

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
    # Format: { "OT-1||Slot 1 (08:30 - 10:00 AM)": {patient_name, patient_mrn}, ... }
    booked_ot_slots_raw = SurgeryRecord.objects.values('ot_room', 'ot_slot', 'patient_name', 'patient_mrn', 'id')
    booked_ot_slots = {
        f"{r['ot_room']}||{r['ot_slot']}": {
            'patient_name': r['patient_name'],
            'patient_mrn': r['patient_mrn'],
            'id': r['id'],
        }
        for r in booked_ot_slots_raw
    }

    # Precompute doctor display name for form defaults and template use
    doctor_display_name = _u.get_full_name() or _u.username
    available_doctors = get_available_doctors()
    if doctor_display_name:
        current_doc = f"Dr. {doctor_display_name}" if not doctor_display_name.lower().startswith(('dr.', 'prof.')) else doctor_display_name
        if not any(doctor_kw.lower() in d.lower() for d in available_doctors) and current_doc not in available_doctors:
            available_doctors.append(current_doc)
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
    }
    return render(request, 'users_naimul/profile.html', context)

