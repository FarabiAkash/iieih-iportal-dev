# Create your tests here.

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import NaimulProfile

class UsersNaimulStaticFilesSeparationTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='naimul',
            password='pass@123',
            first_name='Naimul',
            last_name='Islam'
        )
        self.profile = NaimulProfile.objects.create(
            user=self.user,
            role='Surgeon',
            specialty='Retina',
            department='Department of Ophthalmology & Microsurgery',
            license_number='BMDC-SURG-TEST'
        )

    def test_login_template_uses_separated_static_files(self):
        response = self.client.get(reverse('users_naimul:login'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify external CSS and JS are referenced
        self.assertTrue(
            'users_naimul/css/login.css' in content or 'users_naimul/login.css' in content,
            "login.css should be referenced"
        )
        self.assertTrue(
            'users_naimul/js/login.js' in content or 'users_naimul/login.js' in content,
            "login.js should be referenced"
        )
        
        # Verify large inline style block has been separated
        self.assertNotIn('<style>', content)
        self.assertNotIn('</style>', content)

    def test_profile_template_uses_separated_static_files(self):
        self.client.login(username='naimul', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify external CSS and JS are referenced
        self.assertTrue(
            'users_naimul/css/profile.css' in content or 'users_naimul/profile.css' in content,
            "profile.css should be referenced"
        )
        self.assertTrue(
            'users_naimul/js/profile.js' in content or 'users_naimul/profile.js' in content,
            "profile.js should be referenced"
        )
        
        # Verify no rogue leftover <style> block exists
        self.assertNotIn('<style>', content)
        self.assertNotIn('</style>', content)

    def test_login_page_defaults_to_light_theme(self):
        response = self.client.get(reverse('users_naimul:login'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify default data-theme is light
        self.assertIn('data-theme="light"', content)
        self.assertNotIn('<html lang="en" data-theme="dark">', content)
        
        # Verify light theme button is active by default
        self.assertIn('id="themeBtnLight"', content)
        self.assertTrue('active' in content.split('id="themeBtnLight"')[0].split('<button')[-1])
        
        # Verify theme switch buttons have onclick handlers
        self.assertIn('onclick="setAppTheme(\'light\')"', content)
        self.assertIn('onclick="setAppTheme(\'dark\')"', content)

    def test_profile_page_defaults_to_light_theme(self):
        self.client.login(username='naimul', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify default data-theme is light
        self.assertIn('data-theme="light"', content)
        self.assertNotIn('<html lang="en" data-theme="dark">', content)
        
        # Verify Day switch button is active by default
        self.assertIn('class="theme-switch-btn active" data-theme-val="light"', content)

    def test_login_redirects_directly_to_profile(self):
        response = self.client.post(reverse('users_naimul:login'), {
            'username': 'naimul',
            'password': 'pass@123'
        })
        self.assertRedirects(response, f"{reverse('users_naimul:profile')}?tab=patients")

    def test_profile_defaults_to_patients_tab(self):
        self.client.login(username='naimul', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['active_tab'], 'patients')
        content = response.content.decode('utf-8')
        self.assertIn('id="pane-patients"', content)
        self.assertTrue('active' in content.split('id="pane-patients"')[0].split('<div')[-1])

    def test_surgeon_role_renders_doctor_tabs(self):
        self.assertFalse(self.profile.is_staff_role)
        self.client.login(username='naimul', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        # Check that doctor tabs are rendered
        self.assertIn('Patient Details', content)
        self.assertIn('OT Slot Schedule', content)
        self.assertIn('Medical History', content)
        self.assertIn('Diagnostic History', content)
        self.assertIn('OT Utilization', content)
        self.assertIn('Ocular Reports', content)
        self.assertIn('Surgery History (View &amp; Edit)', content)
    def test_search_invalid_mrn_displays_popup(self):
        self.client.login(username='naimul', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile') + '?tab=patients&patient_mrn=MRN-999999')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.context['search_error'])
        self.assertEqual(response.context['search_error_headline'], "Not a valid MRN number or not such patient found.")
        content = response.content.decode('utf-8')
        self.assertIn('id="searchErrorModal"', content)
        self.assertIn('style="display: flex;"', content)
        self.assertIn('Not a valid MRN number or not such patient found.', content)

    def test_search_invalid_patient_name_displays_popup(self):
        self.client.login(username='naimul', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile') + '?tab=patients&patient_mrn=NonExistentPatientNameXYZ')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.context['search_error'])
        self.assertEqual(response.context['search_error_headline'], "Not a valid MRN number or not such patient found.")
        content = response.content.decode('utf-8')
        self.assertIn('id="searchErrorModal"', content)
        self.assertIn('style="display: flex;"', content)
        self.assertIn('No Such Patient Found', content)

    def test_search_valid_patient_finds_record_without_popup(self):
        from .models import SurgeryRecord
        from datetime import date
        record = SurgeryRecord.objects.create(
            date=date.today(),
            patient_name='Shahida Akhter',
            patient_age=45,
            patient_gender='Female',
            eye='RE',
            surgery_type='Cataract',
            surgeon_name='Dr. Naimul Islam',
            ot_room='OT-1',
            outcome='Successful'
        )
        self.client.login(username='naimul', password='pass@123')
        
        # Test 1: Search by valid MRN
        response = self.client.get(reverse('users_naimul:profile') + f'?tab=patients&patient_mrn={record.patient_mrn}')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.context['search_error'])
        self.assertEqual(response.context['displayed_patients'].count(), 1)
        content = response.content.decode('utf-8')
        # Popup modal should NOT have inline display: flex
        self.assertNotIn('id="searchErrorModal" style="display: flex;"', content)
        self.assertIn(record.patient_mrn, content)

        # Test 2: Search by valid patient name
        response_name = self.client.get(reverse('users_naimul:profile') + '?tab=patients&patient_mrn=Shahida')
        self.assertEqual(response_name.status_code, 200)
        self.assertFalse(response_name.context['search_error'])
        self.assertEqual(response_name.context['displayed_patients'].count(), 1)

    def test_get_available_doctors_fetches_from_database(self):
        from .models import get_available_doctors, SurgeryRecord
        from datetime import date
        SurgeryRecord.objects.create(
            date=date.today(),
            patient_name='Patient For Dr Akib',
            patient_age=60,
            patient_gender='Male',
            eye='LE',
            surgery_type='Glaucoma',
            surgeon_name='Dr. Akib Ashfaq',
            ot_room='OT-2',
            outcome='Successful'
        )
        doctors = get_available_doctors()
        self.assertIn('Dr. Naimul Islam', doctors)
        self.assertIn('Dr. Akib Ashfaq', doctors)

    def test_patient_registration_forms_render_doctor_dropdown(self):
        from .models import SurgeryRecord
        from datetime import date
        SurgeryRecord.objects.create(
            date=date.today(),
            patient_name='Sample Patient',
            patient_age=50,
            patient_gender='Male',
            eye='RE',
            surgery_type='Cataract',
            surgeon_name='Dr. Akib Ashfaq',
            ot_room='OT-1',
            outcome='Successful'
        )
        self.client.login(username='naimul', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')

        # Check that surgery doctor field is a <select> element, not <input type="text">
        self.assertIn('<select id="surg_surgeon" name="surgeon_name"', content)
        # Check that appointment doctor field is a <select> element, not <input type="text">
        self.assertIn('<select id="appt_doctor" name="doctor_name"', content)
        # Check that available doctors are rendered as <option> values
        self.assertIn('<option value="Dr. Naimul Islam"', content)
        self.assertIn('<option value="Dr. Akib Ashfaq"', content)

    def test_patient_registration_saves_selected_doctor(self):
        from .models import SurgeryRecord
        self.client.login(username='naimul', password='pass@123')
        response = self.client.post(reverse('users_naimul:profile'), {
            'apply_surgery': '1',
            'patient_name': 'Test Registered Patient',
            'patient_age': '48',
            'patient_gender': 'Male',
            'eye': 'RE',
            'surgery_type': 'Cataract',
            'surgeon_name': 'Dr. Akib Ashfaq',
            'ot_room': 'OT-3',
            'ot_slot': 'Slot 4 (02:00 - 03:30 PM)',
            'outcome': 'Successful',
            'medical_history': 'No comorbidities.',
            'notes': 'Booked via dropdown.'
        })
        self.assertEqual(response.status_code, 302)

        saved_record = SurgeryRecord.objects.filter(patient_name='Test Registered Patient').first()
        self.assertIsNotNone(saved_record)
        self.assertEqual(saved_record.surgeon_name, 'Dr. Akib Ashfaq')

        resp_naimul = self.client.get(reverse('users_naimul:profile') + '?tab=patients')
        self.assertNotIn(saved_record, resp_naimul.context['user_surgeries'])

        resp_search = self.client.get(reverse('users_naimul:profile') + f'?tab=patients&patient_mrn={saved_record.patient_mrn}')
        self.assertEqual(resp_search.status_code, 200)
        self.assertTrue(resp_search.context['is_cross_doctor_lookup'])
        self.assertEqual(resp_search.context['searched_doctor_name'], 'Dr. Akib Ashfaq')

    def test_doctor_roles_display_dr_prefix(self):
        doctor_roles = ['Surgeon', 'Consultant', 'Associate', 'Resident']
        for r in doctor_roles:
            u = User.objects.create_user(username=f'user_{r.lower()}', password='password123', first_name='Test', last_name=r)
            p = NaimulProfile.objects.create(user=u, role=r)
            self.assertTrue(p.is_doctor_role, f"Role {r} should be identified as doctor role")
            self.assertFalse(p.is_staff_role, f"Role {r} should not be identified as staff role")
            display_name = p.get_surgeon_display_name()
            self.assertTrue(display_name.startswith('Dr. '), f"Role {r} display name should start with 'Dr. ', got: {display_name}")
            self.assertEqual(display_name, f"Dr. Test {r}")

    def test_non_doctor_roles_do_not_display_dr_prefix(self):
        non_doctor_roles = ['Technician', 'OT Nurse', 'Staff', 'Admin', 'Other']
        for r in non_doctor_roles:
            uname = f'user_{r.lower().replace(" ", "_")}'
            u = User.objects.create_user(username=uname, password='password123', first_name='Staff', last_name=r)
            p = NaimulProfile.objects.create(user=u, role=r, surgeon_display_name=f"Dr. Staff {r}")
            self.assertFalse(p.is_doctor_role, f"Role {r} should not be identified as doctor role")
            self.assertTrue(p.is_staff_role, f"Role {r} should be identified as staff role")
            display_name = p.get_surgeon_display_name()
            self.assertFalse(display_name.lower().startswith('dr.'), f"Role {r} display name should NOT start with 'Dr.', got: {display_name}")
            self.assertEqual(display_name, f"Staff {r}")

    def test_login_welcome_message_respects_doctor_role(self):
        # Doctor role
        doc_user = User.objects.create_user(username='doc_consultant', password='pass@123', first_name='Farabi', last_name='Consultant')
        NaimulProfile.objects.create(user=doc_user, role='Consultant')
        resp = self.client.post(reverse('users_naimul:login'), {'username': 'doc_consultant', 'password': 'pass@123'}, follow=True)
        messages = list(resp.context['messages'])
        self.assertTrue(any("Dr. Farabi Consultant" in str(m) for m in messages))

        # Logout first so login_view executes the POST branch
        self.client.logout()

        # Non-doctor role
        tech_user = User.objects.create_user(username='tech_user', password='pass@123', first_name='Kamal', last_name='Technician')
        NaimulProfile.objects.create(user=tech_user, role='Technician')
        resp_tech = self.client.post(reverse('users_naimul:login'), {'username': 'tech_user', 'password': 'pass@123'}, follow=True)
        tech_messages = list(resp_tech.context['messages'])
        self.assertTrue(any("Kamal Technician" in str(m) and "Dr." not in str(m) for m in tech_messages))

    def test_non_doctor_not_in_available_doctors(self):
        from .models import get_available_doctors
        tech_user = User.objects.create_user(username='lab_tech', password='pass@123', first_name='Sadia', last_name='Technician')
        NaimulProfile.objects.create(user=tech_user, role='Technician')
        doctors = get_available_doctors()
        self.assertFalse(any("Sadia" in d or "lab_tech" in d for d in doctors), "Technicians must not appear in available doctors list")





