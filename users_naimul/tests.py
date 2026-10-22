# Create your tests here.

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from datetime import date, timedelta
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
        """
        When a doctor registers a patient via the OT Schedule modal, the saved record
        must always carry the logged-in doctor's own canonical name and assigned OT room
        (not whatever was submitted in the form). This is the core doctor-restriction test.
        """
        from .models import SurgeryRecord
        self.client.login(username='naimul', password='pass@123')

        # Attempt to submit with a different surgeon name and OT room — both must be overridden
        response = self.client.post(reverse('users_naimul:profile'), {
            'apply_surgery': '1',
            'patient_name': 'Test Registered Patient',
            'patient_age': '48',
            'patient_gender': 'Male',
            'eye': 'RE',
            'surgery_type': 'Cataract',
            'surgeon_name': 'Dr. Akib Ashfaq',   # attempted spoof — must be ignored
            'ot_room': 'OT-3',                    # attempted spoof — must be ignored
            'ot_slot': 'Slot 4 (02:00 - 03:30 PM)',
            'outcome': 'Successful',
            'medical_history': 'No comorbidities.',
            'notes': 'Booked via dropdown.'
        })
        self.assertEqual(response.status_code, 302)

        saved_record = SurgeryRecord.objects.filter(patient_name='Test Registered Patient').first()
        self.assertIsNotNone(saved_record)

        # The record must carry the logged-in doctor's own identity (from DB profile)
        expected_surgeon = self.profile.get_surgeon_display_name()
        expected_room = self.profile.assigned_ot_room
        self.assertEqual(
            saved_record.surgeon_name, expected_surgeon,
            f"Doctor restriction failed: expected '{expected_surgeon}', got '{saved_record.surgeon_name}'"
        )
        self.assertEqual(
            saved_record.ot_room, expected_room,
            f"Doctor OT room restriction failed: expected '{expected_room}', got '{saved_record.ot_room}'"
        )

        # The record should appear in the doctor's own patient list
        resp_naimul = self.client.get(reverse('users_naimul:profile') + '?tab=patients')
        self.assertIn(saved_record, resp_naimul.context['user_surgeries'])

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

    def test_doctor_ot_schedule_contains_schedule_modal_and_no_redirect_links(self):
        """
        Verify that in the doctor dashboard OT Schedule tab, clicking to schedule a patient
        triggers the modal and does not redirect to another URL like /surgeries/.
        """
        self.client.login(username='naimul', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile') + '?tab=ot-slots')
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')

        # Verify schedulePatientModal is present in the DOM
        self.assertIn('id="schedulePatientModal"', content)
        self.assertIn('id="modal_surg_name"', content)
        self.assertIn('id="modal_surg_surgeon"', content)
        self.assertIn('id="modal_surg_ot_room"', content)
        self.assertIn('id="modal_surg_ot_slot"', content)
        self.assertIn('id="modal_surg_form_error"', content)
        self.assertIn('id="modal_surg_clash_alert"', content)

        # Verify buttons invoke openSchedulePatientModal instead of linking to /surgeries/
        self.assertIn('onclick="openSchedulePatientModal(', content)
        self.assertNotIn('<a href="/surgeries/" class="btn-action-view">', content)

    def test_ajax_patient_registration_successful(self):
        """
        Verify that registering a patient via AJAX successfully saves to DB,
        returns JSON with success=True and patient data, and does not redirect.
        """
        from .models import SurgeryRecord
        self.client.login(username='naimul', password='pass@123')
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Anowar Hossain',
                'patient_age': '56',
                'patient_gender': 'Male',
                'eye': 'LE',
                'surgery_type': 'Phacoemulsification',
                'surgeon_name': 'Dr. Naimul Islam',
                'ot_room': 'OT-1',
                'ot_slot': 'Slot 2 (10:15 - 11:45 AM)',
                'outcome': 'Successful',
                'medical_history': 'Asthma controlled.',
                'notes': 'Monofocal IOL implanted.',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['patient']['patient_name'], 'Anowar Hossain')
        self.assertEqual(data['patient']['ot_room'], 'OT-1')
        self.assertEqual(data['patient']['ot_slot'], 'Slot 2 (10:15 - 11:45 AM)')

        record = SurgeryRecord.objects.filter(patient_name='Anowar Hossain').first()
        self.assertIsNotNone(record)
        self.assertEqual(record.surgeon_name, 'Dr. Naimul Islam')
        self.assertEqual(record.ot_room, 'OT-1')
        self.assertEqual(record.ot_slot, 'Slot 2 (10:15 - 11:45 AM)')

    def test_ajax_patient_registration_validation_error_no_redirect(self):
        """
        Verify that missing required patient name returns an error in JSON without redirecting.
        """
        self.client.login(username='naimul', password='pass@123')
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': '   ',  # Empty name
                'patient_age': '50',
                'ot_room': 'OT-1',
                'ot_slot': 'Slot 1 (08:30 - 10:00 AM)',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn("Please provide the Patient's Full Name", data['error'])

    def test_ajax_patient_registration_slot_clash_no_redirect(self):
        """
        Verify that an OT slot clash returns an error in JSON without redirecting.
        The clash must be on the doctor's own assigned OT room since the backend
        enforces that doctors can only book in their assigned room.
        """
        from .models import SurgeryRecord
        # The logged-in doctor (naimul) has assigned_ot_room = 'OT-1' (setUp default)
        doctor_room = self.profile.assigned_ot_room  # dynamic, no hardcode

        # Pre-book a slot in the doctor's own OT room
        SurgeryRecord.objects.create(
            date=date.today(),
            patient_name='Existing Booked Patient',
            patient_age=60,
            patient_gender='Female',
            eye='RE',
            surgery_type='Cataract',
            surgeon_name=self.profile.get_surgeon_display_name(),
            ot_room=doctor_room,
            ot_slot='Slot 3 (12:00 - 01:30 PM)',
            outcome='Successful'
        )

        self.client.login(username='naimul', password='pass@123')
        # Attempt to book the exact same room and slot — backend overrides ot_room to doctor's own room
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Clashing Patient',
                'patient_age': '52',
                'surgeon_name': self.profile.get_surgeon_display_name(),
                'ot_room': doctor_room,
                'ot_slot': 'Slot 3 (12:00 - 01:30 PM)',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn("OT Slot Clash!", data['error'])
        self.assertIn("Existing Booked Patient", data['error'])



    def test_doctor_cannot_override_surgeon_name_or_ot_room_via_post(self):
        """
        Backend enforcement: even if a doctor submits a different surgeon_name or ot_room,
        the saved record must use the logged-in doctor's own profile values.
        All assertions use DB relationships — no hardcoded names or IDs.
        """
        from .models import SurgeryRecord
        # Ensure the doctor profile has a distinct assigned OT room
        self.profile.assigned_ot_room = 'OT-1'
        self.profile.save()

        # Create a second doctor whose name/room the logged-in doctor tries to spoof
        other_user = User.objects.create_user(
            username='other_doc', password='pass@123', first_name='Other', last_name='Doctor'
        )
        NaimulProfile.objects.create(user=other_user, role='Consultant', assigned_ot_room='OT-2')

        self.client.login(username='naimul', password='pass@123')
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Restriction Test Patient',
                'patient_age': '45',
                'patient_gender': 'Female',
                'eye': 'LE',
                'surgery_type': 'Glaucoma',
                # Attempt to spoof another doctor's name and room
                'surgeon_name': 'Dr. Other Doctor',
                'ot_room': 'OT-2',
                'ot_slot': 'Slot 1 (08:30 - 10:00 AM)',
                'outcome': 'Successful',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'], f"Expected success but got: {data.get('error')}")

        record = SurgeryRecord.objects.filter(patient_name='Restriction Test Patient').first()
        self.assertIsNotNone(record)

        # Surgeon must be the logged-in doctor's own canonical name (from profile)
        expected_surgeon = self.profile.get_surgeon_display_name()
        self.assertEqual(
            record.surgeon_name, expected_surgeon,
            f"Expected surgeon '{expected_surgeon}' but got '{record.surgeon_name}'"
        )
        # OT room must be the doctor's own assigned room (from profile)
        self.assertEqual(
            record.ot_room, self.profile.assigned_ot_room,
            f"Expected OT room '{self.profile.assigned_ot_room}' but got '{record.ot_room}'"
        )

    def test_staff_user_can_choose_any_surgeon_and_ot_room(self):
        """
        Staff (non-doctor) roles retain full freedom to pick any surgeon name and OT room.
        The restriction only applies to doctor roles.
        """
        from .models import SurgeryRecord
        staff_user = User.objects.create_user(
            username='ot_staff', password='pass@123', first_name='Kamal', last_name='Staff'
        )
        NaimulProfile.objects.create(user=staff_user, role='Staff', assigned_ot_room='OT-3')

        self.client.login(username='ot_staff', password='pass@123')
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Staff Booked Patient',
                'patient_age': '60',
                'patient_gender': 'Male',
                'eye': 'RE',
                'surgery_type': 'Cataract',
                'surgeon_name': 'Dr. Naimul Islam',
                'ot_room': 'OT-4',
                'ot_slot': 'Slot 2 (10:15 - 11:45 AM)',
                'outcome': 'Successful',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'], f"Expected success but got: {data.get('error')}")

        record = SurgeryRecord.objects.filter(patient_name='Staff Booked Patient').first()
        self.assertIsNotNone(record)
        # Staff submission must be respected as-is
        self.assertEqual(record.surgeon_name, 'Dr. Naimul Islam')
        self.assertEqual(record.ot_room, 'OT-4')


class OtSlotAvailabilityAndClashTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.doctor_user = User.objects.create_user(
            username='doctor_test',
            password='pass@123',
            first_name='Naimul',
            last_name='Islam'
        )
        self.profile = NaimulProfile.objects.create(
            user=self.doctor_user,
            role='Surgeon',
            specialty='Retina',
            assigned_ot_room='OT-1',
            surgeon_display_name='Dr. Naimul Islam'
        )
        self.client.login(username='doctor_test', password='pass@123')

    def test_ot_slot_availability_api_requires_login(self):
        anon_client = Client()
        url = reverse('users_naimul:ot_slot_availability_api')
        response = anon_client.get(f"{url}?ot_room=OT-1&ot_date=2026-10-25")
        self.assertEqual(response.status_code, 302)

    def test_ot_slot_availability_api_returns_booked_slots(self):
        from .models import SurgeryRecord
        from datetime import date
        SurgeryRecord.objects.create(
            date=date(2026, 10, 25),
            patient_name='Existing Patient 1',
            patient_age=55,
            patient_gender='Male',
            eye='RE',
            surgery_type='Cataract',
            surgeon_name='Dr. Naimul Islam',
            ot_room='OT-1',
            ot_slot='Slot 1 (08:30 - 10:00 AM)',
            outcome='Successful'
        )
        SurgeryRecord.objects.create(
            date=date(2026, 10, 25),
            patient_name='Existing Patient 2',
            patient_age=48,
            patient_gender='Female',
            eye='LE',
            surgery_type='Vitrectomy',
            surgeon_name='Dr. Naimul Islam',
            ot_room='OT-1',
            ot_slot='Slot 3 (12:00 - 01:30 PM)',
            outcome='Successful'
        )
        # Different room on same date
        SurgeryRecord.objects.create(
            date=date(2026, 10, 25),
            patient_name='Other Room Patient',
            patient_age=50,
            patient_gender='Male',
            eye='RE',
            surgery_type='Glaucoma',
            surgeon_name='Dr. Other',
            ot_room='OT-2',
            ot_slot='Slot 1 (08:30 - 10:00 AM)',
            outcome='Successful'
        )
        # Different date in same room
        SurgeryRecord.objects.create(
            date=date(2026, 10, 26),
            patient_name='Tomorrow Patient',
            patient_age=60,
            patient_gender='Female',
            eye='RE',
            surgery_type='Cataract',
            surgeon_name='Dr. Naimul Islam',
            ot_room='OT-1',
            ot_slot='Slot 2 (10:15 - 11:45 AM)',
            outcome='Successful'
        )

        url = reverse('users_naimul:ot_slot_availability_api')
        response = self.client.get(f"{url}?ot_room=OT-1&ot_date=2026-10-25", HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('booked_slots', data)
        self.assertEqual(len(data['booked_slots']), 2)
        self.assertIn('Slot 1 (08:30 - 10:00 AM)', data['booked_slots'])
        self.assertIn('Slot 3 (12:00 - 01:30 PM)', data['booked_slots'])
        self.assertNotIn('Slot 2 (10:15 - 11:45 AM)', data['booked_slots'])

    def test_backend_prevents_booking_occupied_slot_on_same_date(self):
        from .models import SurgeryRecord
        from datetime import date
        SurgeryRecord.objects.create(
            date=date(2026, 10, 25),
            patient_name='First Booking',
            patient_age=55,
            patient_gender='Male',
            eye='RE',
            surgery_type='Cataract',
            surgeon_name='Dr. Naimul Islam',
            ot_room='OT-1',
            ot_slot='Slot 1 (08:30 - 10:00 AM)',
            outcome='Successful'
        )

        # Attempt to book the same slot on the same date via AJAX
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Clash Attempt Patient',
                'patient_age': '40',
                'patient_gender': 'Male',
                'eye': 'LE',
                'surgery_type': 'Glaucoma',
                'ot_date': '2026-10-25',
                'ot_slot': 'Slot 1 (08:30 - 10:00 AM)',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('OT Slot Clash', data['error'])

    def test_booking_same_slot_on_different_date_succeeds(self):
        from .models import SurgeryRecord
        from datetime import date
        SurgeryRecord.objects.create(
            date=date(2026, 10, 25),
            patient_name='Day 1 Booking',
            patient_age=55,
            patient_gender='Male',
            eye='RE',
            surgery_type='Cataract',
            surgeon_name='Dr. Naimul Islam',
            ot_room='OT-1',
            ot_slot='Slot 1 (08:30 - 10:00 AM)',
            outcome='Successful'
        )

        # Attempt to book the same slot on a different date (2026-10-26)
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Day 2 Patient',
                'patient_age': '42',
                'patient_gender': 'Female',
                'eye': 'RE',
                'surgery_type': 'Cataract',
                'ot_date': '2026-10-26',
                'ot_slot': 'Slot 1 (08:30 - 10:00 AM)',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('Day 2 Patient', data['message'])


class PatientRegistrationFormFieldsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.doctor_user = User.objects.create_user(
            username='doctor_naimul',
            password='pass@123',
            first_name='Naimul',
            last_name='Islam'
        )
        self.profile = NaimulProfile.objects.create(
            user=self.doctor_user,
            role='Surgeon',
            specialty='Retina',
            assigned_ot_room='OT-1',
            surgeon_display_name='Dr. Naimul Islam'
        )
        self.client.login(username='doctor_naimul', password='pass@123')

    def test_registration_form_displays_date_field_in_place_of_mrn(self):
        """
        Verify that in the patient registration form, the Date field is displayed
        in place of the Patient MRN field, and MRN is hidden.
        """
        response = self.client.get(reverse('users_naimul:profile') + '?tab=ot-slots')
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')

        # Check modal form:
        # Date field should be present with modal_surg_ot_date id and Date label
        self.assertIn('for="modal_surg_ot_date"', content)
        self.assertIn('id="modal_surg_ot_date"', content)
        # MRN input is hidden
        self.assertIn('<input type="hidden" name="patient_mrn" id="modal_surg_mrn" value="">', content)
        # The visible auto-assigned MRN label and display box should not be present in modal form
        self.assertNotIn('for="modal_surg_mrn"', content)

        # Check staff pane form:
        self.assertIn('for="surg_ot_date"', content)
        self.assertIn('id="surg_ot_date"', content)
        self.assertIn('<input type="hidden" name="patient_mrn" id="surg_mrn" value="">', content)
        self.assertNotIn('for="surg_mrn"', content)

    def test_mrn_auto_generation_preserved_on_save(self):
        """
        Verify that submitting the patient registration form without supplying an MRN
        still automatically assigns a valid P26XXXXX MRN upon database save.
        """
        from .models import SurgeryRecord
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Automated MRN Patient',
                'patient_age': '52',
                'patient_gender': 'Female',
                'eye': 'LE',
                'surgery_type': 'Phacoemulsification',
                'ot_date': '2026-10-28',
                'ot_slot': 'Slot 2 (10:15 - 11:45 AM)',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])

        record = SurgeryRecord.objects.filter(patient_name='Automated MRN Patient').first()
        self.assertIsNotNone(record)
        self.assertTrue(record.patient_mrn.startswith('P26'))
        self.assertEqual(len(record.patient_mrn), 8)
        self.assertEqual(record.date.strftime('%Y-%m-%d'), '2026-10-28')

    def test_date_picker_minimum_date_set_to_today(self):
        """
        Verify that the date picker input fields have the minimum date attribute set to today
        and dynamic JavaScript logic enforces today's date dynamically.
        """
        response = self.client.get(reverse('users_naimul:profile') + '?tab=ot-slots')
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        today_iso = date.today().strftime('%Y-%m-%d')

        # Check modal date picker has min set to today
        self.assertIn('id="modal_surg_ot_date"', content)
        self.assertIn(f'min="{today_iso}"', content)
        # Check staff pane date picker has min set to today
        self.assertIn('id="surg_ot_date"', content)
        # Verify dynamic JS min date logic is present
        self.assertIn('getLocalDateString', content)
        self.assertIn('el.min = todayStr;', content)

    def test_date_selection_allows_today_date(self):
        """
        Verify that registering a patient with today's date is allowed and succeeds.
        """
        from .models import SurgeryRecord
        today_iso = date.today().strftime('%Y-%m-%d')
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Today Date Patient',
                'patient_age': '40',
                'patient_gender': 'Male',
                'eye': 'RE',
                'surgery_type': 'Cataract',
                'ot_date': today_iso,
                'ot_slot': 'Slot 4 (02:00 - 03:30 PM)',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])

        record = SurgeryRecord.objects.filter(patient_name='Today Date Patient').first()
        self.assertIsNotNone(record)
        self.assertEqual(record.date, date.today())

    def test_date_selection_allows_future_date(self):
        """
        Verify that registering a patient with a future date is allowed and succeeds.
        """
        from .models import SurgeryRecord
        future_day = date.today() + timedelta(days=10)
        future_iso = future_day.strftime('%Y-%m-%d')
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Future Date Patient',
                'patient_age': '35',
                'patient_gender': 'Female',
                'eye': 'LE',
                'surgery_type': 'Glaucoma',
                'ot_date': future_iso,
                'ot_slot': 'Slot 1 (08:30 - 10:00 AM)',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])

        record = SurgeryRecord.objects.filter(patient_name='Future Date Patient').first()
        self.assertIsNotNone(record)
        self.assertEqual(record.date, future_day)

    def test_date_selection_prevents_past_date_ajax(self):
        """
        Backend validation: verify that submitting a past date via AJAX is rejected
        and does not create a database record.
        """
        from .models import SurgeryRecord
        past_day = date.today() - timedelta(days=1)
        past_iso = past_day.strftime('%Y-%m-%d')
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Past Date Patient AJAX',
                'patient_age': '60',
                'patient_gender': 'Male',
                'eye': 'RE',
                'surgery_type': 'Cataract',
                'ot_date': past_iso,
                'ot_slot': 'Slot 2 (10:15 - 11:45 AM)',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn("Past dates are not allowed", data['error'])

        record = SurgeryRecord.objects.filter(patient_name='Past Date Patient AJAX').first()
        self.assertIsNone(record)

    def test_date_selection_prevents_past_date_post_redirect(self):
        """
        Backend validation: verify that submitting a past date via standard POST
        sets an error message, redirects, and does not create a database record.
        """
        from .models import SurgeryRecord
        past_day = date.today() - timedelta(days=5)
        past_iso = past_day.strftime('%Y-%m-%d')
        response = self.client.post(
            reverse('users_naimul:profile'),
            {
                'apply_surgery': '1',
                'patient_name': 'Past Date Patient POST',
                'patient_age': '65',
                'patient_gender': 'Female',
                'eye': 'LE',
                'surgery_type': 'Retina',
                'ot_date': past_iso,
                'ot_slot': 'Slot 3 (12:00 - 01:30 PM)',
            },
            follow=True
        )
        self.assertEqual(response.status_code, 200)
        messages_list = list(response.context['messages'])
        self.assertTrue(any("Past dates are not allowed" in str(m) for m in messages_list))

        record = SurgeryRecord.objects.filter(patient_name='Past Date Patient POST').first()
        self.assertIsNone(record)



