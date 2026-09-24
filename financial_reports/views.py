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
# Task: Create your financial & collection reporting views here.
# ==========================================


# =========================================================
# DAILY COLLECTION
# =========================================================


# Daily Collection List


@login_required
def daily_collection_list_view(request):

    collections = DailyCollection.objects.all().order_by('-date')

    context = {
        'collections': collections,
        'page_title': 'Daily Collections'
    }

    return render(
        request,
        'financial_reports/daily_collection_list.html',
        context
    )



# Create Daily Collection


@login_required
def daily_collection_create_view(request):

    if request.method == 'POST':

        form = DailyCollectionForm(request.POST)

        if form.is_valid():

            data=form.save(commit=False)
            data.total_amount=data.cash_amount + data.card_amount+data.mfs_amount
            data.save()
            messages.success(
                request,
                'Daily collection added successfully.'
            )

            return redirect(
                'daily_collection_list'
            )

    else:

        form = DailyCollectionForm()

    context = {
        'form_data': form,
        'form_title': 'Add Daily Collection',
        'form_btn': 'Save Collection'
    }

    return render(
        request,
        'financial_reports/daily_collection_form.html',
        context
    )



# Update Daily Collection


@login_required
def daily_collection_update_view(request, pk):

    collection = get_object_or_404(
        DailyCollection,
        pk=pk
    )

    if request.method == 'POST':

        form = DailyCollectionForm(
            request.POST,
            instance=collection
        )

        if form.is_valid():

            data=form.save(commit=False)
            data.total_amount=data.cash_amount + data.card_amount+data.mfs_amount
            data.save()

            messages.success(
                request,
                'Daily collection updated successfully.'
            )

            return redirect(
                'daily_collection_list'
            )

    else:

        form = DailyCollectionForm(
            instance=collection
        )

    context = {
        'form_data': form,
        'form_title': 'Update Daily Collection',
        'form_btn': 'Update Collection',
        'collection': collection
    }

    return render(
        request,
        'financial_reports/daily_collection_form.html',
        context
    )



# Delete Daily Collection

@login_required
def daily_collection_delete_view(request, pk):

    collection = get_object_or_404(
        DailyCollection,
        pk=pk
    )

    if request.method == 'POST':

        collection.delete()

        messages.success(
            request,
            'Daily collection deleted successfully.'
        )

        return redirect(
            'daily_collection_list'
        )

    context = {
        'collection': collection
    }

    return render(
        request,
        'financial_reports/daily_collection_confirm_delete.html',
        context
    )


# =========================================================
# CONCESSION RECORD
# =========================================================



# Concession Record List


@login_required
def concession_record_list_view(request):

    concessions = ConcessionRecord.objects.all().order_by('-date')

    context = {
        'concessions': concessions,
        'page_title': 'Concession Records'
    }

    return render(
        request,
        'financial_reports/concession_record_list.html',
        context
    )



# Create Concession Record


@login_required
def concession_record_create_view(request):

    if request.method == 'POST':

        form = ConcessionRecordForm(request.POST)

        if form.is_valid():            

            data=form.save(commit=False)
            data.payable_amount=data.bill_total - data.discount_amount
            data.save()
            messages.success(
                request,
                'Concession record added successfully.'
            )

            return redirect(
                'concession_record_list'
            )

    else:

        form = ConcessionRecordForm()

    context = {
        'form_data': form,
        'form_title': 'Add Concession Record',
        'form_btn': 'Save Concession'
    }

    return render(
        request,
        'financial_reports/concession_record_form.html',
        context
    )


# Update Concession Record


@login_required
def concession_record_update_view(request, pk):

    concession = get_object_or_404(
        ConcessionRecord,
        pk=pk
    )

    if request.method == 'POST':

        form = ConcessionRecordForm(
            request.POST,
            instance=concession
        )

        if form.is_valid():

            data=form.save(commit=False)
            data.payable_amount=data.bill_total - data.discount_amount
            data.save()

            messages.success(
                request,
                'Concession record updated successfully.'
            )

            return redirect(
                'concession_record_list'
            )

    else:

        form = ConcessionRecordForm(
            instance=concession
        )

    context = {
        'form_data': form,
        'form_title': 'Update Concession Record',
        'form_btn': 'Update Concession',
        'concession': concession
    }

    return render(
        request,
        'financial_reports/concession_record_form.html',
        context
    )



# Delete Concession Record


@login_required
def concession_record_delete_view(request, pk):

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

        return redirect(
            'concession_record_list'
        )

    context = {
        'concession': concession
    }

    return render(
        request,
        'financial_reports/concession_record_confirm_delete.html',
        context
    )