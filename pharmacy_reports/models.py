# from django.db import models

# # ==========================================
# # Developer: Adnan
# # App: pharmacy_reports
# # Task: Create your eye pharmacy & surgical consumables models here.
# # (e.g. Ophthalmic drops dispensing, IOL lens implants stock, OT consumables, near-expiry alerts)
# # ==========================================


from django.db import models

class MedicineDispensingLog(models.Model):

    CATEGORY_CHOICES = [
        ('anti_glaucoma', 'Anti-Glaucoma'),
        ('antibiotic', 'Antibiotic'),
        ('steroid', 'Steroid'),
        ('lubricant', 'Lubricant'),
        ('surgical_consumable', 'Surgical Consumable'),
    ]

    date = models.DateField()
    hospital_branch = models.CharField(max_length=100)
    patient_mrn = models.CharField(max_length=50)
    medicine_name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    quantity_dispensed = models.PositiveIntegerField()
    batch_number = models.CharField(max_length=50)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.medicine_name} - {self.date}"


class SurgicalConsumableStock(models.Model):

    SUBSPECIALTY_CHOICES = [
        ('cataract', 'Cataract'),
        ('vitreo_retina', 'Vitreo-Retina'),
        ('glaucoma', 'Glaucoma'),
        ('cornea', 'Cornea'),
    ]

    item_name = models.CharField(max_length=100)
    subspecialty = models.CharField(max_length=50, choices=SUBSPECIALTY_CHOICES)
    current_quantity = models.PositiveIntegerField()
    reorder_threshold = models.PositiveIntegerField()
    expiry_date = models.DateField()

    def __str__(self):
        return f"{self.item_name} - {self.current_quantity} units"