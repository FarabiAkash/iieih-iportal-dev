from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Creates default users for IIEH iPortal modules'

    def handle(self, *args, **kwargs):
        # Adnan - Pharmacy module
        if not User.objects.filter(username='adnan_pharmacist').exists():
            User.objects.create_superuser(
                username='adnan_pharmacist',
                password='pharmacy123',
                email='adnan@iieh.com'
            )
            self.stdout.write(self.style.SUCCESS('✓ Created: adnan_pharmacist / pharmacy123'))
        else:
            self.stdout.write('— adnan_pharmacist already exists')

        # Admin superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                password='admin123',
                email='admin@iieh.com'
            )
            self.stdout.write(self.style.SUCCESS('✓ Created: admin / admin123'))
        else:
            self.stdout.write('— admin already exists')

        self.stdout.write(self.style.SUCCESS('\nDefault users ready.'))