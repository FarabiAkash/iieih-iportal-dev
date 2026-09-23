# from django.contrib import admin

# # Register your models here.


from django.contrib import admin
from .models import MedicineDispensingLog, SurgicalConsumableStock

admin.site.register(MedicineDispensingLog)
admin.site.register(SurgicalConsumableStock)