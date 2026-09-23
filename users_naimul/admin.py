from django.contrib import admin

from users_naimul.models import SurgeryRecord
from users_naimul.models import DiagnosisProcedure

# Register your models here.
admin.site.register(SurgeryRecord)
admin.site.register(DiagnosisProcedure)
