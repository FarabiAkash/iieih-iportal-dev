from django.shortcuts import render


def index(request):
    selected_branch = request.GET.get('branch', '')
    selected_clinic = request.GET.get('clinic', '')
    selected_ward = request.GET.get('ward', '')
    selected_report = request.GET.get('report', 'opd')

    # Temporary demo OPD data
    opd_records = [
        {
            'date': '2026-09-23',
            'hospital_branch': 'Main Branch (Dhaka)',
            'clinic_name': 'General Eye OPD',
            'total_visits': 120,
            'new_patients': 45,
            'followup_patients': 75,
            'refractions_done': 38,
        },
        {
            'date': '2026-09-23',
            'hospital_branch': 'Main Branch (Dhaka)',
            'clinic_name': 'Glaucoma Clinic',
            'total_visits': 42,
            'new_patients': 15,
            'followup_patients': 27,
            'refractions_done': 12,
        },
        {
            'date': '2026-09-23',
            'hospital_branch': 'Chittagong Branch',
            'clinic_name': 'Cornea Clinic',
            'total_visits': 35,
            'new_patients': 18,
            'followup_patients': 17,
            'refractions_done': 10,
        },
        {
            'date': '2026-09-23',
            'hospital_branch': 'Chittagong Branch',
            'clinic_name': 'Pediatric Clinic',
            'total_visits': 28,
            'new_patients': 20,
            'followup_patients': 8,
            'refractions_done': 7,
        },
    ]

    # Temporary demo IPD data
    ipd_records = [
        {
            'date': '2026-09-23',
            'hospital_branch': 'Main Branch (Dhaka)',
            'ward_type': 'Male Surgical Ward',
            'total_beds': 30,
            'occupied_beds': 24,
            'available_beds': 6,
            'new_admissions': 5,
            'discharges_today': 3,
        },
        {
            'date': '2026-09-23',
            'hospital_branch': 'Main Branch (Dhaka)',
            'ward_type': 'Female Surgical Ward',
            'total_beds': 25,
            'occupied_beds': 20,
            'available_beds': 5,
            'new_admissions': 4,
            'discharges_today': 2,
        },
        {
            'date': '2026-09-23',
            'hospital_branch': 'Chittagong Branch',
            'ward_type': 'VIP Cabin',
            'total_beds': 10,
            'occupied_beds': 7,
            'available_beds': 3,
            'new_admissions': 2,
            'discharges_today': 1,
        },
        {
            'date': '2026-09-23',
            'hospital_branch': 'Chittagong Branch',
            'ward_type': 'Daycare Cataract Recovery',
            'total_beds': 20,
            'occupied_beds': 12,
            'available_beds': 8,
            'new_admissions': 6,
            'discharges_today': 5,
        },
    ]


    filtered_opd_records = opd_records

    if selected_branch:
        filtered_opd_records = [
            record for record in filtered_opd_records
            if record['hospital_branch'] == selected_branch
        ]

    if selected_clinic:
        filtered_opd_records = [
            record for record in filtered_opd_records
            if record['clinic_name'] == selected_clinic
        ]

    filtered_ipd_records = ipd_records

    if selected_branch:
        filtered_ipd_records = [
            record for record in filtered_ipd_records
            if record['hospital_branch'] == selected_branch
        ]

    if selected_ward:
        filtered_ipd_records = [
            record for record in filtered_ipd_records
            if record['ward_type'] == selected_ward
        ]


    total_visits = sum(
        record['total_visits']
        for record in filtered_opd_records
    )

    new_patients = sum(
        record['new_patients']
        for record in filtered_opd_records
    )

    followup_patients = sum(
        record['followup_patients']
        for record in filtered_opd_records
    )

    refractions_done = sum(
        record['refractions_done']
        for record in filtered_opd_records
    )

    total_beds = sum(
        record['total_beds']
        for record in filtered_ipd_records
    )

    occupied_beds = sum(
        record['occupied_beds']
        for record in filtered_ipd_records
    )

    available_beds = total_beds - occupied_beds

    new_admissions = sum(
        record['new_admissions']
        for record in filtered_ipd_records
    )

    discharges_today = sum(
        record['discharges_today']
        for record in filtered_ipd_records
    )

    if total_beds > 0:
        occupancy_percentage = round(
            (occupied_beds / total_beds) * 100,
            1
        )
    else:
        occupancy_percentage = 0


    branches = [
        'Main Branch (Dhaka)',
        'Chittagong Branch',
        'Jamalpur Branch',
        'Barisal Branch',
    ]

    clinics = [
        'General Eye OPD',
        'Cornea Clinic',
        'Retina Clinic',
        'Glaucoma Clinic',
        'Pediatric Clinic',
        'Emergency Eye Care',
    ]

    wards = [
        'Male Surgical Ward',
        'Female Surgical Ward',
        'VIP Cabin',
        'Daycare Cataract Recovery',
    ]


    if request.user.is_authenticated:
        user_name = request.user.get_full_name()

        if not user_name:
            user_name = request.user.username
    else:
        user_name = 'Guest User'

    context = {
        # Report selection
        'selected_report': selected_report,

        # User
        'user_name': user_name,

        # OPD
        'total_visits': total_visits,
        'new_patients': new_patients,
        'followup_patients': followup_patients,
        'refractions_done': refractions_done,
        'opd_records': filtered_opd_records,

        # IPD
        'total_beds': total_beds,
        'occupied_beds': occupied_beds,
        'available_beds': available_beds,
        'new_admissions': new_admissions,
        'discharges_today': discharges_today,
        'occupancy_percentage': occupancy_percentage,
        'ipd_records': filtered_ipd_records,

        # Filters
        'branches': branches,
        'clinics': clinics,
        'wards': wards,

        'selected_branch': selected_branch,
        'selected_clinic': selected_clinic,
        'selected_ward': selected_ward,
    }

    return render(
        request,
        'opd_ipd_reports/index.html',
        context
    )