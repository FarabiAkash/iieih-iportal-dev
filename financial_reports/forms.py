from django import forms

from .models import (
    DailyCollection,
    ConcessionRecord
)


# =========================================================
# Daily Collection Form
# =========================================================

class DailyCollectionForm(forms.ModelForm):

    class Meta:

        model = DailyCollection

        fields = [
            'date',
            'hospital_branch',
            'counter_name',
            'cash_amount',
            'card_amount',
            'mfs_amount',
        ]

        exclude=['total_amount']

        widgets = {

            'date': forms.DateInput(
                attrs={
                    'type': 'date',
                    'class': 'form-control'
                }
            ),

            'hospital_branch': forms.TextInput(
                attrs={
                    'class': 'form-control',
                    'placeholder': 'Enter hospital branch'
                }
            ),

            'counter_name': forms.Select(
                attrs={
                    'class': 'form-select'
                }
            ),

            'cash_amount': forms.NumberInput(
                attrs={
                    'class': 'form-control',
                    'placeholder': 'Enter cash amount',
                    'step': '0.01',
                    'min': '0'
                }
            ),

            'card_amount': forms.NumberInput(
                attrs={
                    'class': 'form-control',
                    'placeholder': 'Enter card amount',
                    'step': '0.01',
                    'min': '0'
                }
            ),

            'mfs_amount': forms.NumberInput(
                attrs={
                    'class': 'form-control',
                    'placeholder': 'Enter MFS amount',
                    'step': '0.01',
                    'min': '0'
                }
            ),

            # 'total_amount': forms.NumberInput(
            #     attrs={
            #         'class': 'form-control',
            #         'placeholder': 'Enter total amount',
            #         'step': '0.01',
            #         'min': '0'
            #     }
            # ),
        }

        labels = {

            'date': 'Collection Date',

            'hospital_branch': 'Hospital Branch',

            'counter_name': 'Counter Name',

            'cash_amount': 'Cash Amount',

            'card_amount': 'Card Amount',

            'mfs_amount': 'MFS Amount',

        }


# =========================================================
# Concession Record Form
# =========================================================

class ConcessionRecordForm(forms.ModelForm):

    class Meta:

        model = ConcessionRecord

        fields = [
            'date',
            'patient_mrn',
            'concession_type',
            'bill_total',
            'discount_amount',
            'approved_by',
            
        ]

        exclude=['payable_amount']

        widgets = {

            'date': forms.DateInput(
                attrs={
                    'type': 'date',
                    'class': 'form-control'
                }
            ),

            'patient_mrn': forms.TextInput(
                attrs={
                    'class': 'form-control',
                    'placeholder': 'Enter patient MRN'
                }
            ),

            'concession_type': forms.Select(
                attrs={
                    'class': 'form-select'
                }
            ),

            'bill_total': forms.NumberInput(
                attrs={
                    'class': 'form-control',
                    'placeholder': 'Enter bill total',
                    'step': '0.01',
                    'min': '0'
                }
            ),

            'discount_amount': forms.NumberInput(
                attrs={
                    'class': 'form-control',
                    'placeholder': 'Enter discount amount',
                    'step': '0.01',
                    'min': '0'
                }
            ),

            'approved_by': forms.TextInput(
                attrs={
                    'class': 'form-control',
                    'placeholder': 'Enter approver name'
                }
            ),
        }

        labels = {

            'date': 'Concession Date',

            'patient_mrn': 'Patient MRN',

            'concession_type': 'Concession Type',

            'bill_total': 'Bill Total',

            'discount_amount': 'Discount Amount',

            'approved_by': 'Approved By',
        }