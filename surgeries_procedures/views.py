# from django.shortcuts import render

# # ==========================================
# # Developer: Naimul
# # App: surgeries_procedures
# # Task: Create your surgery & procedure reporting views here.
# # ==========================================

# def index(request):
#     """
#     Skeletal index view for surgeries & procedures report.
#     """
#     return render(request, 'surgeries_procedures/index.html')


from django.shortcuts import render, redirect
from django.contrib import messages
from django.db.models import Q
from datetime import date
from users_naimul.models import SurgeryRecord, DiagnosisProcedure, NaimulProfile

def index(request):
    """
    Eye Surgeries, Operation Theatre (OT), and Diagnostic Procedures Hub.
    Provides surgical KPI metrics, OT room filtering, and operational records.
    """
    # Handle quick surgery record creation from the OT console
    if request.method == 'POST' and 'add_surgery' in request.POST:
        mrn = request.POST.get('patient_mrn', '').strip()
        name = request.POST.get('patient_name', '').strip()
        age = request.POST.get('patient_age', 0)
        gender = request.POST.get('patient_gender', 'Male')
        eye = request.POST.get('eye', 'RE')
        surgery_type = request.POST.get('surgery_type', 'Cataract')
        surgeon_name = request.POST.get('surgeon_name', '').strip() or 'Dr. Naimul Hasan'
        ot_room = request.POST.get('ot_room', 'OT-1')
        ot_slot = request.POST.get('ot_slot', 'Slot 1 (08:30 - 10:00 AM)')
        outcome = request.POST.get('outcome', 'Successful')
        medical_history = request.POST.get('medical_history', '').strip() or 'No systemic comorbidities reported. Pre-op IOP normal.'
        notes = request.POST.get('notes', '').strip()
        
        if mrn and name:
            user = request.user if request.user.is_authenticated else None
            # If guest or anonymous, link to first staff user
            if not user or not user.is_authenticated:
                from django.contrib.auth.models import User
                user = User.objects.first()

            SurgeryRecord.objects.create(
                date=date.today(),
                patient_mrn=mrn,
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
                created_by=user
            )
            messages.success(request, f"Surgery record for Patient {name} ({mrn}) logged successfully in {ot_room} ({ot_slot})!")
            return redirect('surgeries_procedures:index')
        else:
            messages.error(request, "Please provide valid Patient MRN and Full Name.")

    # Handle surgery record edit
    elif request.method == 'POST' and 'edit_surgery' in request.POST:
        surgery_id = request.POST.get('surgery_id')
        try:
            surg = SurgeryRecord.objects.get(id=surgery_id)
            surg.patient_mrn = request.POST.get('patient_mrn', surg.patient_mrn).strip()
            surg.patient_name = request.POST.get('patient_name', surg.patient_name).strip()
            age_val = request.POST.get('patient_age')
            if age_val and str(age_val).isdigit():
                surg.patient_age = int(age_val)
            surg.patient_gender = request.POST.get('patient_gender', surg.patient_gender)
            surg.eye = request.POST.get('eye', surg.eye)
            surg.surgery_type = request.POST.get('surgery_type', surg.surgery_type)
            surg.surgeon_name = request.POST.get('surgeon_name', surg.surgeon_name).strip()
            surg.ot_room = request.POST.get('ot_room', surg.ot_room)
            surg.ot_slot = request.POST.get('ot_slot', surg.ot_slot)
            surg.outcome = request.POST.get('outcome', surg.outcome)
            surg.medical_history = request.POST.get('medical_history', surg.medical_history).strip()
            surg.notes = request.POST.get('notes', surg.notes).strip()
            surg.save()
            messages.success(request, f"Surgery record #{surg.id} for {surg.patient_name} ({surg.patient_mrn}) updated successfully.")
        except SurgeryRecord.DoesNotExist:
            messages.error(request, "Surgery record not found.")
        return redirect('surgeries_procedures:index')

    # Base query
    surgeries = SurgeryRecord.objects.all().order_by('-id')

    # Filters
    ot_filter = request.GET.get('ot_room', '')
    type_filter = request.GET.get('surgery_type', '')
    outcome_filter = request.GET.get('outcome', '')
    search_query = request.GET.get('q', '').strip()

    if ot_filter:
        surgeries = surgeries.filter(ot_room=ot_filter)
    if type_filter:
        surgeries = surgeries.filter(surgery_type__icontains=type_filter)
    if outcome_filter:
        surgeries = surgeries.filter(outcome=outcome_filter)
    if search_query:
        surgeries = surgeries.filter(
            Q(patient_mrn__icontains=search_query) |
            Q(patient_name__icontains=search_query) |
            Q(surgeon_name__icontains=search_query)
        )

    # Statistical Aggregates
    all_surgeries = SurgeryRecord.objects.all()
    total_count = all_surgeries.count()
    cataract_count = all_surgeries.filter(surgery_type__icontains='Cataract').count()
    retina_count = all_surgeries.filter(surgery_type__icontains='Retina').count()
    glaucoma_count = all_surgeries.filter(surgery_type__icontains='Glaucoma').count()
    cornea_count = all_surgeries.filter(surgery_type__icontains='Cornea').count()
    pediatric_count = all_surgeries.filter(surgery_type__icontains='Pediatric').count()
    successful_count = all_surgeries.filter(outcome='Successful').count()
    
    success_rate = round((successful_count / total_count * 100), 1) if total_count > 0 else 100.0

    # OT Suite Breakdown
    ot1_count = all_surgeries.filter(ot_room='OT-1').count()
    ot2_count = all_surgeries.filter(ot_room='OT-2').count()
    ot3_count = all_surgeries.filter(ot_room='OT-3').count()
    ot4_count = all_surgeries.filter(ot_room='OT-4').count()

    context = {
        'surgeries': surgeries,
        'total_count': total_count,
        'cataract_count': cataract_count,
        'retina_count': retina_count,
        'glaucoma_count': glaucoma_count,
        'cornea_count': cornea_count,
        'pediatric_count': pediatric_count,
        'success_rate': success_rate,
        'ot1_count': ot1_count,
        'ot2_count': ot2_count,
        'ot3_count': ot3_count,
        'ot4_count': ot4_count,
        'selected_ot': ot_filter,
        'selected_type': type_filter,
        'selected_outcome': outcome_filter,
        'search_query': search_query,
        'ot_room_choices': SurgeryRecord.OT_Room_Choices,
        'ot_slot_choices': SurgeryRecord.OT_Slot_Choices,
        'surgery_type_choices': SurgeryRecord.Surgery_Type_Choices,
        'outcome_choices': SurgeryRecord.Outcome_Choices,
    }
    return render(request, 'surgeries_procedures/index.html', context)

