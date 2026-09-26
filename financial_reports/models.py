from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# ==========================================
# Developer: Ruhul
# App: financial_reports
# Task: Create your financial & collection models here.
# (e.g. Daily counter collections, billing packages, charity/zakat concessions)
# ==========================================


class DailyCollection(models.Model):

    COUNTER_CHOICES = [
        ('OPD', 'OPD Cash Counter'),
        ('OT', 'OT Surgery Packages'),
        ('PHARMACY', 'Eye Pharmacy'),
        ('OPTICAL', 'Optical Frame Shop'),
        ('DIAGNOSTICS', 'Diagnostics Counter'),
    ]

    date = models.DateTimeField(default=timezone.now)

    hospital_branch = models.CharField(
        max_length=100 ,default='Ispahani Islamia Eye Institute and Hospital', null=True
    )

    counter_name = models.CharField(
        max_length=30,
        choices=COUNTER_CHOICES ,null=True
    )

    cash_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0 ,null=True
    )

    card_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0 ,null=True
    )

    mfs_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0 ,null=True
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0 ,null=True
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='daily_collections'
    )

    created_at = models.DateTimeField(
        auto_now_add=True ,null=True
    )

    updated_at = models.DateTimeField(
        auto_now=True ,null=True
    )


    def __str__(self):
        return f"{self.date} - {self.hospital_branch} - {self.counter_name}"


class ConcessionRecord(models.Model):

    CONCESSION_CHOICES = [
        ('ZAKAT', 'Zakat Welfare Fund'),
        ('POOR', 'Poor Patient Relief'),
        ('STAFF', 'Staff Dependent'),
        ('EXECUTIVE', 'Executive Exemption'),
    ]

    date = models.DateTimeField(default=timezone.now)

    patient_mrn = models.CharField(
        max_length=50
    )

    concession_type = models.CharField(
        max_length=30,
        choices=CONCESSION_CHOICES
    )

    bill_total = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payable_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )


    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_concessions' 
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_concessions'
    )

    created_at = models.DateTimeField(
        auto_now_add=True ,null=True
    )


    def __str__(self):
        return f"{self.patient_mrn} - {self.discount_amount}"
    