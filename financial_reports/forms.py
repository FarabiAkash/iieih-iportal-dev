from django import forms
from django.utils import timezone

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

        }

        labels = {

            'date': 'Collection Date',

            'hospital_branch': 'Hospital Branch',

            'counter_name': 'Counter Name',

            'cash_amount': 'Cash Amount',

            'card_amount': 'Card Amount',

            'mfs_amount': 'MFS Amount',

        }

    # =====================================================
    # Initialize Form
    # =====================================================

    def __init__(self, *args, **kwargs):

        super().__init__(*args, **kwargs)

        # Add / Create
        if not self.instance.pk:

            self.fields['date'].initial = timezone.localdate()

            self.fields['date'].disabled = True

        # Edit / Update
        else:

            self.fields['date'].disabled = False

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
        ]

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
                    'placeholder': 'Enter patient MRN number'
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

        }

        labels = {

            'date': 'Concession Date',

            'patient_mrn': 'Patient MRN',

            'concession_type': 'Concession Type',

            'bill_total': 'Bill Total',

            'discount_amount': 'Discount Amount',

        }

    # =====================================================
    # Patient MRN Validation
    # =====================================================

    def clean_patient_mrn(self):

        mrn = self.cleaned_data['patient_mrn'].strip()

        # Remove MRN- if user already entered it
        if mrn.upper().startswith('MRN-'):
            mrn = mrn[4:].strip()

        # Only numbers are allowed
        if not mrn.isdigit():

            raise forms.ValidationError(
                'Patient MRN must contain numbers only.'
            )

        # Automatically add MRN-
        return f'MRN-{mrn}'