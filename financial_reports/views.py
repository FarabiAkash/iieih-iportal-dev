from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Sum, Count
from django.utils import timezone

from .models import (
    DailyCollection,
    ConcessionRecord
)

from .forms import (
    DailyCollectionForm,
    ConcessionRecordForm
)


# ==========================================
# Developer: Ruhul
# App: financial_reports
# Task: Finance & Billing Reports
# ==========================================


# =========================================================
# GET USER ROLE
# =========================================================

def get_user_role(request):

    try:
        return request.user.ruhul_profile.finance_role

    except:
        return None


# =========================================================
# FINANCIAL DASHBOARD
# =========================================================

# =========================================================
# FINANCIAL DASHBOARD
# Developer: Ruhul
# App: financial_reports
# =========================================================

@login_required(login_url='ruhul_login')
def financial_dashboard_view(request):

    role = get_user_role(request)

    # -----------------------------------------------------
    # Date Filter: Default Last 30 Days
    # -----------------------------------------------------

    today = timezone.localdate()
    default_start = today - timedelta(days=29)

    try:
        start_date = date.fromisoformat(
            request.GET.get('start_date', '')
        )
    except (ValueError, TypeError):
        start_date = default_start

    try:
        end_date = date.fromisoformat(
            request.GET.get('end_date', '')
        )
    except (ValueError, TypeError):
        end_date = today

    # Invalid range হলে default range ব্যবহার হবে
    if start_date > end_date:
        start_date = default_start
        end_date = today

    # -----------------------------------------------------
    # Role-based Collection Access
    # -----------------------------------------------------

    if role == 'Accounts Supervisor':
        collections = DailyCollection.objects.all()

    elif role in ['Cashier', 'Pharmacy Cashier']:
        collections = DailyCollection.objects.filter(
            created_by=request.user
        )

    else:
        collections = DailyCollection.objects.none()

    # -----------------------------------------------------
    # Role-based Concession Access
    # -----------------------------------------------------

    if role == 'Accounts Supervisor':
        concessions = ConcessionRecord.objects.all()

    elif role == 'Zakat Relief Officer':
        concessions = ConcessionRecord.objects.filter(
            created_by=request.user
        )

    else:
        concessions = ConcessionRecord.objects.none()

    # -----------------------------------------------------
    # Apply Date Filters
    # -----------------------------------------------------

    collections = collections.filter(
        date__range=(start_date, end_date)
    )

    concessions = concessions.filter(
        date__range=(start_date, end_date)
    )

    # -----------------------------------------------------
    # Summary Cards
    # -----------------------------------------------------

    collection_summary = collections.aggregate(
        total=Sum('total_amount'),
        cash=Sum('cash_amount'),
        card=Sum('card_amount'),
        mfs=Sum('mfs_amount'),
        count=Count('id'),
    )

    concession_summary = concessions.aggregate(
        total_discount=Sum('discount_amount'),
        total_bill=Sum('bill_total'),
        total_payable=Sum('payable_amount'),
        count=Count('id'),
    )

    zero = Decimal('0.00')

    total_collection = (
        collection_summary['total'] or zero
    )

    total_cash = collection_summary['cash'] or zero
    total_card = collection_summary['card'] or zero
    total_mfs = collection_summary['mfs'] or zero

    total_concession = (
        concession_summary['total_discount'] or zero
    )

    # -----------------------------------------------------
    # Daily Collection Line Chart
    # -----------------------------------------------------

    daily_rows = (
        collections
        .values('date')
        .annotate(total=Sum('total_amount'))
        .order_by('date')
    )

    daily_totals = {
        row['date']: float(row['total'] or zero)
        for row in daily_rows
    }

    chart_labels = []
    chart_values = []

    current_date = start_date

    while current_date <= end_date:

        chart_labels.append(
            current_date.strftime('%d %b')
        )

        chart_values.append(
            daily_totals.get(current_date, 0)
        )

        current_date += timedelta(days=1)

    # -----------------------------------------------------
    # Counter-wise Collection
    # -----------------------------------------------------

    counter_rows = (
        collections
        .values('counter_name')
        .annotate(total=Sum('total_amount'))
        .order_by('counter_name')
    )

    counter_labels = [
        row['counter_name']
        for row in counter_rows
    ]

    counter_values = [
        float(row['total'] or zero)
        for row in counter_rows
    ]

    # -----------------------------------------------------
    # Recent Collections
    # -----------------------------------------------------

    recent_collections = (
        collections
        .select_related('created_by')
        .order_by('-date', '-created_at')[:8]
    )

    # -----------------------------------------------------
    # Context
    # -----------------------------------------------------

    context = {
        'page_title': 'Financial Dashboard',
        'role': role,

        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),

        'total_collection': total_collection,
        'total_cash': total_cash,
        'total_card': total_card,
        'total_mfs': total_mfs,

        'total_concession': total_concession,
        'total_bill': (
            concession_summary['total_bill'] or zero
        ),
        'total_payable': (
            concession_summary['total_payable'] or zero
        ),

        'collection_count': (
            collection_summary['count'] or 0
        ),
        'concession_count': (
            concession_summary['count'] or 0
        ),

        'chart_labels': chart_labels,
        'chart_values': chart_values,

        'counter_labels': counter_labels,
        'counter_values': counter_values,

        'recent_collections': recent_collections,
    }

    return render(
        request,
        'financial_reports/financial_dashboard.html',
        context
    )


# =========================================================
# DAILY COLLECTION LIST
# =========================================================

@login_required(login_url='ruhul_login')
def daily_collection_list_view(request):

    role = get_user_role(request)

    # =========================================
    # Allowed Roles
    # =========================================

    allowed_roles = [
        'Cashier',
        'Pharmacy Cashier',
        'Accounts Supervisor',
    ]

    # =========================================
    # Role Permission Check
    # =========================================

    if role not in allowed_roles:

        messages.error(
            request,
            'You are not authorized to access daily collections.'
        )

        return redirect('ruhul_profile')

    # =========================================
    # Base Queryset According to Role
    # =========================================

    if role == 'Accounts Supervisor':

        # Accounts Supervisor can see ALL collections
        collections = DailyCollection.objects.all()

    else:

        # Cashier / Pharmacy Cashier can see
        # ONLY their own collections
        collections = DailyCollection.objects.filter(
            created_by=request.user
        )

    # =========================================
    # Search Values
    # =========================================

    search_date = request.GET.get(
        'date',
        ''
    ).strip()

    hospital_branch = request.GET.get(
        'hospital_branch',
        ''
    ).strip()

    counter_name = request.GET.get(
        'counter_name',
        ''
    ).strip()

    created_by = request.GET.get(
        'created_by',
        ''
    ).strip()

    # =========================================
    # Search Query using Q
    # =========================================

    search_query = Q()

    # Date
    if search_date:

        search_query &= Q(
            date=search_date
        )

    # Hospital Branch
    if hospital_branch:

        search_query &= Q(
            hospital_branch__icontains=hospital_branch
        )

    # Counter Name
    if counter_name:

        search_query &= Q(
            counter_name=counter_name
        )

    # Created By
    if created_by:

        search_query &= Q(
            created_by__username__icontains=created_by
        )

    # =========================================
    # Apply Search
    # =========================================

    collections = collections.filter(
        search_query
    ).order_by('-date')

    # =========================================
    # Context
    # =========================================

    context = {
        'collections': collections,
        'page_title': 'Daily Collections',
        'role': role,

        # Search values
        'search_date': search_date,
        'hospital_branch': hospital_branch,
        'counter_name': counter_name,
        'created_by': created_by,

        # Counter choices
        'counter_choices': (
            DailyCollection.COUNTER_CHOICES
        ),
    }

    # =========================================
    # Render Template
    # =========================================

    return render(
        request,
        'financial_reports/daily_collection_list.html',
        context
    )

# =========================================================
# DAILY COLLECTION CREATE
# =========================================================

@login_required(login_url='ruhul_login')
def daily_collection_create_view(request):

    role = get_user_role(request)

    allowed_roles = [
        'Cashier',
        'Pharmacy Cashier',
        'Accounts Supervisor',
    ]

    if role not in allowed_roles:

        messages.error(
            request,
            'You are not authorized to add daily collections.'
        )

        return redirect('ruhul_profile')


    if request.method == 'POST':

        form = DailyCollectionForm(request.POST)

        if form.is_valid():

            data = form.save(commit=False)

            # =========================================
            # Calculate Total Amount
            # =========================================

            data.total_amount = (
                data.cash_amount
                + data.card_amount
                + data.mfs_amount
            )

            # =========================================
            # Store Created User
            # =========================================

            data.created_by = request.user

            data.save()

            messages.success(
                request,
                'Daily collection added successfully.'
            )

            return redirect('daily_collection_list')

    else:

        form = DailyCollectionForm()


    context = {
        'form_data': form,
        'form_title': 'Add Daily Collection',
        'form_btn': 'Save Collection',
    }

    return render(
        request,
        'financial_reports/daily_collection_form.html',
        context
    )


# =========================================================
# DAILY COLLECTION UPDATE
# =========================================================

@login_required(login_url='ruhul_login')
def daily_collection_update_view(request, pk):

    role = get_user_role(request)

    allowed_roles = [
        'Cashier',
        'Pharmacy Cashier',
        'Accounts Supervisor',
    ]

    if role not in allowed_roles:

        messages.error(
            request,
            'You are not authorized to update daily collections.'
        )

        return redirect('ruhul_profile')


    collection = get_object_or_404(
        DailyCollection,
        pk=pk
    )


    # =========================================
    # Non Supervisor নিজের collection update করবে
    # =========================================

    if role != 'Accounts Supervisor':

        if collection.created_by != request.user:

            messages.error(
                request,
                'You are not authorized to update this collection.'
            )

            return redirect('ruhul_profile')


    if request.method == 'POST':

        form = DailyCollectionForm(
            request.POST,
            instance=collection
        )

        if form.is_valid():

            data = form.save(commit=False)

            # =========================================
            # Calculate Total Amount
            # =========================================

            data.total_amount = (
                data.cash_amount
                + data.card_amount
                + data.mfs_amount
            )

            # =========================================
            # Keep Original Creator
            # =========================================

            data.created_by = collection.created_by

            data.save()

            messages.success(
                request,
                'Daily collection updated successfully.'
            )

            return redirect('daily_collection_list')

    else:

        form = DailyCollectionForm(
            instance=collection
        )


    context = {
        'form_data': form,
        'form_title': 'Update Daily Collection',
        'form_btn': 'Update Collection',
        'collection': collection,
    }

    return render(
        request,
        'financial_reports/daily_collection_form.html',
        context
    )


# =========================================================
# DAILY COLLECTION DELETE
# =========================================================

@login_required(login_url='ruhul_login')
def daily_collection_delete_view(request, pk):

    role = get_user_role(request)

    allowed_roles = [
        'Cashier',
        'Pharmacy Cashier',
        'Accounts Supervisor',
    ]

    if role not in allowed_roles:

        messages.error(
            request,
            'You are not authorized to delete daily collections.'
        )

        return redirect('ruhul_profile')


    collection = get_object_or_404(
        DailyCollection,
        pk=pk
    )


    # =========================================
    # Non Supervisor নিজের collection delete করবে
    # =========================================

    if role != 'Accounts Supervisor':

        if collection.created_by != request.user:

            messages.error(
                request,
                'You are not authorized to delete this collection.'
            )

            return redirect('ruhul_profile')


    if request.method == 'POST':

        collection.delete()

        messages.success(
            request,
            'Daily collection deleted successfully.'
        )

        return redirect('daily_collection_list')


    context = {
        'collection': collection,
    }

    return render(
        request,
        'financial_reports/daily_collection_confirm_delete.html',
        context
    )


# =========================================================
# CONCESSION RECORD LIST
# =========================================================

@login_required(login_url='ruhul_login')
def concession_record_list_view(request):

    role = get_user_role(request)

    # =========================================
    # Allowed Roles
    # =========================================

    allowed_roles = [
        'Zakat Relief Officer',
        'Accounts Supervisor',
    ]

    # =========================================
    # Role Permission Check
    # =========================================

    if role not in allowed_roles:

        messages.error(
            request,
            'You are not authorized to access concession records.'
        )

        return redirect('ruhul_profile')

    # =========================================
    # Base Queryset According to Role
    # =========================================

    if role == 'Accounts Supervisor':

        # Accounts Supervisor can see ALL records
        concessions = ConcessionRecord.objects.all()

    else:

        # Zakat Relief Officer can see
        # ONLY his own created records
        concessions = ConcessionRecord.objects.filter(
            created_by=request.user
        )

    # =========================================
    # Search Values
    # =========================================

    patient_mrn = request.GET.get(
        'patient_mrn',
        ''
    ).strip()

    search_date = request.GET.get(
        'date',
        ''
    ).strip()

    concession_type = request.GET.get(
        'concession_type',
        ''
    ).strip()

    # =========================================
    # Search / Filter using Q
    # =========================================

    search_query = Q()

    # Patient MRN
    if patient_mrn:

        search_query &= Q(
            patient_mrn__icontains=patient_mrn
        )

    # Date
    if search_date:

        search_query &= Q(
            date=search_date
        )

    # Concession Type
    if concession_type:

        search_query &= Q(
            concession_type=concession_type
        )

    # Apply Search
    concessions = concessions.filter(
        search_query
    ).order_by('-date')

    # =========================================
    # Context
    # =========================================

    context = {
        'concessions': concessions,
        'page_title': 'Concession Records',
        'role': role,

        # Search values
        'patient_mrn': patient_mrn,
        'search_date': search_date,
        'concession_type': concession_type,

        # Dropdown choices
        'concession_choices': (
            ConcessionRecord.CONCESSION_CHOICES
        ),
    }

    # =========================================
    # Render Template
    # =========================================

    return render(
        request,
        'financial_reports/concession_record_list.html',
        context
    )

@login_required(login_url='ruhul_login')
def concession_approve_view(request, pk):

    role = get_user_role(request)

    # Only Accounts Supervisor can approve
    if role != 'Accounts Supervisor':

        messages.error(
            request,
            'You are not authorized to approve concessions.'
        )

        return redirect('ruhul_profile')

    concession = get_object_or_404(
        ConcessionRecord,
        pk=pk
    )

    # Approve the concession
    concession.approved_by = request.user
    concession.save()

    messages.success(
        request,
        'Concession approved successfully.'
    )

    return redirect('concession_record_list')


# =========================================================
# CONCESSION RECORD CREATE
# =========================================================

@login_required(login_url='ruhul_login')
def concession_record_create_view(request):

    role = get_user_role(request)

    # =========================================
    # Allowed Roles
    # =========================================

    allowed_roles = [
        'Zakat Relief Officer',
        'Accounts Supervisor',
    ]

    # =========================================
    # Role Permission Check
    # =========================================

    if role not in allowed_roles:

        messages.error(
            request,
            'You are not authorized to add concession records.'
        )

        return redirect('ruhul_profile')

    # =========================================
    # POST Request
    # =========================================

    if request.method == 'POST':

        form = ConcessionRecordForm(request.POST)

        if form.is_valid():

            # =========================================
            # Create Object Without Saving
            # =========================================

            data = form.save(commit=False)

            # =========================================
            # DISCOUNT APPROVAL LIMIT CHECK
            # =========================================

            profile = request.user.ruhul_profile

            if data.discount_amount > profile.discount_approval_limit:

                form.add_error(
                    'discount_amount',
                    f'Your discount approval limit is '
                    f'{profile.discount_approval_limit}. '
                    f'You cannot approve this discount amount.'
                )

            else:

                # =========================================
                # Calculate Payable Amount
                # =========================================

                data.payable_amount = (
                    data.bill_total
                    - data.discount_amount
                )

                # =========================================
                # Store Record Creator
                # =========================================

                data.created_by = request.user

                # =========================================
                # Accounts Supervisor Approval
                # =========================================

                if role == 'Accounts Supervisor':

                    data.approved_by = request.user

                # =========================================
                # Zakat Relief Officer
                # approved_by remains None
                # =========================================

                else:

                    data.approved_by = None

                # =========================================
                # Save Data
                # =========================================

                data.save()

                # =========================================
                # Success Message
                # =========================================

                messages.success(
                    request,
                    'Concession record added successfully.'
                )

                return redirect(
                    'concession_record_list'
                )

    # =========================================
    # GET Request
    # =========================================

    else:

        form = ConcessionRecordForm()

    # =========================================
    # Context
    # =========================================

    context = {
        'form_data': form,
        'form_title': 'Add Concession Record',
        'form_btn': 'Save Concession',
    }

    # =========================================
    # Render Template
    # =========================================

    return render(
        request,
        'financial_reports/concession_record_form.html',
        context
    )


# =========================================================
# CONCESSION RECORD UPDATE
# =========================================================

@login_required(login_url='ruhul_login')
def concession_record_update_view(request, pk):

    role = get_user_role(request)

    # =========================================
    # Allowed Roles
    # =========================================

    allowed_roles = [
        'Zakat Relief Officer',
        'Accounts Supervisor',
    ]

    # =========================================
    # Role Permission Check
    # =========================================

    if role not in allowed_roles:

        messages.error(
            request,
            'You are not authorized to update concession records.'
        )

        return redirect('ruhul_profile')

    # =========================================
    # Get Existing Concession Record
    # =========================================

    concession = get_object_or_404(
        ConcessionRecord,
        pk=pk
    )

    # =========================================
    # POST Request
    # =========================================

    if request.method == 'POST':

        form = ConcessionRecordForm(
            request.POST,
            instance=concession
        )

        if form.is_valid():

            # =========================================
            # Create Object Without Saving
            # =========================================

            data = form.save(commit=False)

            # =========================================
            # DISCOUNT APPROVAL LIMIT CHECK
            # =========================================

            profile = request.user.ruhul_profile

            if data.discount_amount > profile.discount_approval_limit:

                form.add_error(
                    'discount_amount',
                    f'Your discount approval limit is '
                    f'{profile.discount_approval_limit}. '
                    f'You cannot approve this discount amount.'
                )

            else:

                # =========================================
                # Calculate Payable Amount
                # =========================================

                data.payable_amount = (
                    data.bill_total
                    - data.discount_amount
                )

                # =========================================
                # Store Record Creator
                # =========================================
                
                data.created_by = request.user

                # =========================================
                # Accounts Supervisor Approval
                # =========================================

                if role == 'Accounts Supervisor':

                    data.approved_by = request.user

                # =========================================
                # Save Updated Data
                # =========================================

                data.save()

                # =========================================
                # Success Message
                # =========================================

                messages.success(
                    request,
                    'Concession record updated successfully.'
                )

                return redirect(
                    'concession_record_list'
                )

    # =========================================
    # GET Request
    # =========================================

    else:

        form = ConcessionRecordForm(
            instance=concession
        )

    # =========================================
    # Context
    # =========================================

    context = {
        'form_data': form,
        'form_title': 'Update Concession Record',
        'form_btn': 'Update Concession',
        'concession': concession,
    }

    # =========================================
    # Render Form
    # =========================================

    return render(
        request,
        'financial_reports/concession_record_form.html',
        context
    )


# =========================================================
# CONCESSION RECORD DELETE
# =========================================================

@login_required(login_url='ruhul_login')
def concession_record_delete_view(request, pk):

    role = get_user_role(request)

    allowed_roles = [
        'Zakat Relief Officer',
        'Accounts Supervisor',
    ]

    if role not in allowed_roles:

        messages.error(
            request,
            'You are not authorized to delete concession records.'
        )

        return redirect('ruhul_profile')


    concession = get_object_or_404(
        ConcessionRecord,
        pk=pk
    )


    if request.method == 'POST':

        concession.delete()

        messages.success(
            request,
            'Concession record deleted successfully.'
        )

        return redirect('concession_record_list')


    context = {
        'concession': concession,
    }

    return render(
        request,
        'financial_reports/concession_record_confirm_delete.html',
        context
    )