from django.db import models


class DailyOPDCensus(models.Model):
    CLINIC_CHOICES = [
        ('General Eye OPD', 'General Eye OPD'),
        ('Cornea Clinic', 'Cornea Clinic'),
        ('Retina Clinic', 'Retina Clinic'),
        ('Glaucoma Clinic', 'Glaucoma Clinic'),
        ('Pediatric Clinic', 'Pediatric Clinic'),
        ('Emergency Eye Care', 'Emergency Eye Care'),
    ]

    date = models.DateField()
    hospital_branch = models.CharField(max_length=100)

    clinic_name = models.CharField(
        max_length=50,
        choices=CLINIC_CHOICES
    )

    total_visits = models.PositiveIntegerField(default=0)
    new_patients = models.PositiveIntegerField(default=0)
    followup_patients = models.PositiveIntegerField(default=0)
    refractions_done = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.date} - {self.hospital_branch} - {self.clinic_name}"
    

class IPDBedOccupancy(models.Model):
    WARD_CHOICES = [
        ('Male Surgical Ward', 'Male Surgical Ward'),
        ('Female Surgical Ward', 'Female Surgical Ward'),
        ('VIP Cabin', 'VIP Cabin'),
        ('Daycare Cataract Recovery', 'Daycare Cataract Recovery'),
    ]

    date = models.DateField()
    hospital_branch = models.CharField(max_length=100)

    ward_type = models.CharField(
        max_length=50,
        choices=WARD_CHOICES
    )

    total_beds = models.PositiveIntegerField(default=0)
    occupied_beds = models.PositiveIntegerField(default=0)
    new_admissions = models.PositiveIntegerField(default=0)
    discharges_today = models.PositiveIntegerField(default=0)

    @property
    def available_beds(self):
        return self.total_beds - self.occupied_beds

    def __str__(self):
            return f"{self.date} - {self.hospital_branch} - {self.ward_type}"