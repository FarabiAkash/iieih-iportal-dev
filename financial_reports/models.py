from django.db import models

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

    date = models.DateField()

    hospital_branch = models.CharField(
        max_length=100
    )

    counter_name = models.CharField(
        max_length=30,
        choices=COUNTER_CHOICES
    )

    cash_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    card_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    mfs_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
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

    date = models.DateField()

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


    approved_by = models.CharField(
        max_length=100
    )


    def __str__(self):
        return f"{self.patient_mrn} - {self.discount_amount}"
    