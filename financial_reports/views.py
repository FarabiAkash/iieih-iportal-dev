from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404

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

@login_required
def financial_dashboard_view(request):

    role = get_user_role(request)

    context = {
        'role': role,
        'page_title': 'Financial Dashboard',
    }

    return render(
        request,
        'financial_reports/financial_dashboard.html',
        context
    )


# =========================================================
# DAILY COLLECTION LIST
# =========================================================

@login_required
def daily_collection_list_view(request):

    role = get_user_role(request)

    allowed_roles = [
        'Cashier',
        'Pharmacy Cashier',
        'Accounts Supervisor',
    ]

    if role not in allowed_roles:

        messages.error(
            request,
            'You are not authorized to access daily collections.'
        )

        return redirect('ruhul_profile')


    # Accounts Supervisor can see all collection 
    if role == 'Accounts Supervisor':

        collections = DailyCollection.objects.all().order_by('-date')

    else:

        # Cashier / Pharmacy Cashier শুধু নিজের collection দেখতে পারবে
        collections = DailyCollection.objects.filter(
            created_by=request.user
        ).order_by('-date')


    context = {
        'collections': collections,
        'page_title': 'Daily Collections',
        'role': role,
    }

    return render(
        request,
        'financial_reports/daily_collection_list.html',
        context
    )


# =========================================================
# DAILY COLLECTION CREATE
# =========================================================

@login_required
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

@login_required
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

@login_required
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

@login_required
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
    # Accounts Supervisor
    # Can see ALL concessions
    # =========================================

    if role == 'Accounts Supervisor':

        concessions = ConcessionRecord.objects.all().order_by('-date')

    # =========================================
    # Zakat Relief Officer
    # Can see ONLY own created concessions
    # =========================================

    else:

        concessions = ConcessionRecord.objects.filter(
            created_by=request.user
        ).order_by('-date')

    # =========================================
    # Context
    # =========================================

    context = {
        'concessions': concessions,
        'page_title': 'Concession Records',
        'role': role,
    }

    # =========================================
    # Render Template
    # =========================================

    return render(
        request,
        'financial_reports/concession_record_list.html',
        context
    )

@login_required
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

@login_required
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

@login_required
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

@login_required
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