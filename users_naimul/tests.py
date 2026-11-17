# Create your tests here.

# from django.test import TestCase, Client
# from django.urls import reverse
# from django.contrib.auth.models import User
# from datetime import date, timedelta
# from .models import NaimulProfile

# class UsersNaimulStaticFilesSeparationTest(TestCase):
#     def setUp(self):
#         self.client = Client()
#         self.user = User.objects.create_user(
#             username='naimul',
#             password='pass@123',
#             first_name='Naimul',
#             last_name='Islam'
#         )
#         self.profile = NaimulProfile.objects.create(
#             user=self.user,
#             role='Surgeon',
#             specialty='Retina',
#             department='Department of Ophthalmology & Microsurgery',
#             license_number='BMDC-SURG-TEST'
#         )

#     def test_login_template_uses_separated_static_files(self):
#         response = self.client.get(reverse('users_naimul:login'))
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
        
#         # Verify external CSS and JS are referenced
#         self.assertTrue(
#             'users_naimul/css/login.css' in content or 'users_naimul/login.css' in content,
#             "login.css should be referenced"
#         )
#         self.assertTrue(
#             'users_naimul/js/login.js' in content or 'users_naimul/login.js' in content,
#             "login.js should be referenced"
#         )
        
#         # Verify large inline style block has been separated
#         self.assertNotIn('<style>', content)
#         self.assertNotIn('</style>', content)

#     def test_profile_template_uses_separated_static_files(self):
#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.get(reverse('users_naimul:profile'))
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
        
#         # Verify external CSS and JS are referenced
#         self.assertTrue(
#             'users_naimul/css/profile.css' in content or 'users_naimul/profile.css' in content,
#             "profile.css should be referenced"
#         )
#         self.assertTrue(
#             'users_naimul/js/profile.js' in content or 'users_naimul/profile.js' in content,
#             "profile.js should be referenced"
#         )
        
#         # Verify no rogue leftover <style> block exists
#         self.assertNotIn('<style>', content)
#         self.assertNotIn('</style>', content)

#     def test_login_page_defaults_to_light_theme(self):
#         response = self.client.get(reverse('users_naimul:login'))
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
        
#         # Verify default data-theme is light
#         self.assertIn('data-theme="light"', content)
#         self.assertNotIn('<html lang="en" data-theme="dark">', content)
        
#         # Verify light theme button is active by default
#         self.assertIn('id="themeBtnLight"', content)
#         self.assertTrue('active' in content.split('id="themeBtnLight"')[0].split('<button')[-1])
        
#         # Verify theme switch buttons have onclick handlers
#         self.assertIn('onclick="setAppTheme(\'light\')"', content)
#         self.assertIn('onclick="setAppTheme(\'dark\')"', content)

#     def test_profile_page_defaults_to_light_theme(self):
#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.get(reverse('users_naimul:profile'))
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
        
#         # Verify default data-theme is light
#         self.assertIn('data-theme="light"', content)
#         self.assertNotIn('<html lang="en" data-theme="dark">', content)
        
#         # Verify Day switch button is active by default
#         self.assertIn('class="theme-switch-btn active" data-theme-val="light"', content)

#     def test_login_redirects_directly_to_profile(self):
#         response = self.client.post(reverse('users_naimul:login'), {
#             'username': 'naimul',
#             'password': 'pass@123'
#         })
#         self.assertRedirects(response, f"{reverse('users_naimul:profile')}?tab=patients")

#     def test_profile_defaults_to_patients_tab(self):
#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.get(reverse('users_naimul:profile'))
#         self.assertEqual(response.status_code, 200)
#         self.assertEqual(response.context['active_tab'], 'patients')
#         content = response.content.decode('utf-8')
#         self.assertIn('id="pane-patients"', content)
#         self.assertTrue('active' in content.split('id="pane-patients"')[0].split('<div')[-1])

#     def test_surgeon_role_renders_doctor_tabs(self):
#         self.assertFalse(self.profile.is_staff_role)
#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.get(reverse('users_naimul:profile'))
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
#         # Check that doctor tabs are rendered
#         self.assertIn('Patient Details', content)
#         self.assertIn('OT Slot Schedule', content)
#         self.assertIn('Medical History', content)
#         self.assertIn('Diagnostic History', content)
#         self.assertIn('OT Utilization', content)
#         self.assertIn('Ocular Reports', content)
#         self.assertIn('Surgery History (View &amp; Edit)', content)
#     def test_search_invalid_mrn_displays_popup(self):
#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.get(reverse('users_naimul:profile') + '?tab=patients&patient_mrn=MRN-999999')
#         self.assertEqual(response.status_code, 200)
#         self.assertTrue(response.context['search_error'])
#         self.assertEqual(response.context['search_error_headline'], "Not a valid MRN number or not such patient found.")
#         content = response.content.decode('utf-8')
#         self.assertIn('id="searchErrorModal"', content)
#         self.assertIn('style="display: flex;"', content)
#         self.assertIn('Not a valid MRN number or not such patient found.', content)

#     def test_search_invalid_patient_name_displays_popup(self):
#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.get(reverse('users_naimul:profile') + '?tab=patients&patient_mrn=NonExistentPatientNameXYZ')
#         self.assertEqual(response.status_code, 200)
#         self.assertTrue(response.context['search_error'])
#         self.assertEqual(response.context['search_error_headline'], "Not a valid MRN number or not such patient found.")
#         content = response.content.decode('utf-8')
#         self.assertIn('id="searchErrorModal"', content)
#         self.assertIn('style="display: flex;"', content)
#         self.assertIn('No Such Patient Found', content)

#     def test_search_valid_patient_finds_record_without_popup(self):
#         from .models import SurgeryRecord
#         from datetime import date
#         record = SurgeryRecord.objects.create(
#             date=date.today(),
#             patient_name='Shahida Akhter',
#             patient_age=45,
#             patient_gender='Female',
#             eye='RE',
#             surgery_type='Cataract',
#             surgeon_name='Dr. Naimul Islam',
#             ot_room='OT-1',
#             outcome='Successful'
#         )
#         self.client.login(username='naimul', password='pass@123')
        
#         # Test 1: Search by valid MRN
#         response = self.client.get(reverse('users_naimul:profile') + f'?tab=patients&patient_mrn={record.patient_mrn}')
#         self.assertEqual(response.status_code, 200)
#         self.assertFalse(response.context['search_error'])
#         self.assertEqual(response.context['displayed_patients'].count(), 1)
#         content = response.content.decode('utf-8')
#         # Popup modal should NOT have inline display: flex
#         self.assertNotIn('id="searchErrorModal" style="display: flex;"', content)
#         self.assertIn(record.patient_mrn, content)

#         # Test 2: Search by valid patient name
#         response_name = self.client.get(reverse('users_naimul:profile') + '?tab=patients&patient_mrn=Shahida')
#         self.assertEqual(response_name.status_code, 200)
#         self.assertFalse(response_name.context['search_error'])
#         self.assertEqual(response_name.context['displayed_patients'].count(), 1)

#     def test_get_available_doctors_fetches_from_database(self):
#         from .models import get_available_doctors, SurgeryRecord
#         from datetime import date
#         SurgeryRecord.objects.create(
#             date=date.today(),
#             patient_name='Patient For Dr Akib',
#             patient_age=60,
#             patient_gender='Male',
#             eye='LE',
#             surgery_type='Glaucoma',
#             surgeon_name='Dr. Akib Ashfaq',
#             ot_room='OT-2',
#             outcome='Successful'
#         )
#         doctors = get_available_doctors()
#         self.assertIn('Dr. Naimul Islam', doctors)
#         self.assertIn('Dr. Akib Ashfaq', doctors)

#     def test_patient_registration_forms_render_doctor_dropdown(self):
#         from .models import SurgeryRecord
#         from datetime import date
#         SurgeryRecord.objects.create(
#             date=date.today(),
#             patient_name='Sample Patient',
#             patient_age=50,
#             patient_gender='Male',
#             eye='RE',
#             surgery_type='Cataract',
#             surgeon_name='Dr. Akib Ashfaq',
#             ot_room='OT-1',
#             outcome='Successful'
#         )
#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.get(reverse('users_naimul:profile'))
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')

#         # Check that surgery doctor field is a <select> element, not <input type="text">
#         self.assertIn('<select id="surg_surgeon" name="surgeon_name"', content)
#         # Check that appointment doctor field is a <select> element, not <input type="text">
#         self.assertIn('<select id="appt_doctor" name="doctor_name"', content)
#         # Check that available doctors are rendered as <option> values
#         self.assertIn('<option value="Dr. Naimul Islam"', content)
#         self.assertIn('<option value="Dr. Akib Ashfaq"', content)

#     def test_patient_registration_saves_selected_doctor(self):
#         """
#         When a doctor registers a patient via the OT Schedule modal, the saved record
#         must always carry the logged-in doctor's own canonical name and assigned OT room
#         (not whatever was submitted in the form). This is the core doctor-restriction test.
#         """
#         from .models import SurgeryRecord
#         self.client.login(username='naimul', password='pass@123')

#         # Attempt to submit with a different surgeon name and OT room — both must be overridden
#         response = self.client.post(reverse('users_naimul:profile'), {
#             'apply_surgery': '1',
#             'patient_name': 'Test Registered Patient',
#             'patient_age': '48',
#             'patient_gender': 'Male',
#             'eye': 'RE',
#             'surgery_type': 'Cataract',
#             'surgeon_name': 'Dr. Akib Ashfaq',   # attempted spoof — must be ignored
#             'ot_room': 'OT-3',                    # attempted spoof — must be ignored
#             'ot_slot': 'Slot 4 (02:00 - 03:30 PM)',
#             'outcome': 'Successful',
#             'medical_history': 'No comorbidities.',
#             'notes': 'Booked via dropdown.'
#         })
#         self.assertEqual(response.status_code, 302)

#         saved_record = SurgeryRecord.objects.filter(patient_name='Test Registered Patient').first()
#         self.assertIsNotNone(saved_record)

#         # The record must carry the logged-in doctor's own identity (from DB profile)
#         expected_surgeon = self.profile.get_surgeon_display_name()
#         expected_room = self.profile.assigned_ot_room
#         self.assertEqual(
#             saved_record.surgeon_name, expected_surgeon,
#             f"Doctor restriction failed: expected '{expected_surgeon}', got '{saved_record.surgeon_name}'"
#         )
#         self.assertEqual(
#             saved_record.ot_room, expected_room,
#             f"Doctor OT room restriction failed: expected '{expected_room}', got '{saved_record.ot_room}'"
#         )

#         # The record should appear in the doctor's own patient list
#         resp_naimul = self.client.get(reverse('users_naimul:profile') + '?tab=patients')
#         self.assertIn(saved_record, resp_naimul.context['user_surgeries'])

#     def test_doctor_roles_display_dr_prefix(self):
#         doctor_roles = ['Surgeon', 'Consultant', 'Associate', 'Resident']
#         for r in doctor_roles:
#             u = User.objects.create_user(username=f'user_{r.lower()}', password='password123', first_name='Test', last_name=r)
#             p = NaimulProfile.objects.create(user=u, role=r)
#             self.assertTrue(p.is_doctor_role, f"Role {r} should be identified as doctor role")
#             self.assertFalse(p.is_staff_role, f"Role {r} should not be identified as staff role")
#             display_name = p.get_surgeon_display_name()
#             self.assertTrue(display_name.startswith('Dr. '), f"Role {r} display name should start with 'Dr. ', got: {display_name}")
#             self.assertEqual(display_name, f"Dr. Test {r}")

#     def test_non_doctor_roles_do_not_display_dr_prefix(self):
#         non_doctor_roles = ['Technician', 'OT Nurse', 'Staff', 'Admin', 'Other']
#         for r in non_doctor_roles:
#             uname = f'user_{r.lower().replace(" ", "_")}'
#             u = User.objects.create_user(username=uname, password='password123', first_name='Staff', last_name=r)
#             p = NaimulProfile.objects.create(user=u, role=r, surgeon_display_name=f"Dr. Staff {r}")
#             self.assertFalse(p.is_doctor_role, f"Role {r} should not be identified as doctor role")
#             self.assertTrue(p.is_staff_role, f"Role {r} should be identified as staff role")
#             display_name = p.get_surgeon_display_name()
#             self.assertFalse(display_name.lower().startswith('dr.'), f"Role {r} display name should NOT start with 'Dr.', got: {display_name}")
#             self.assertEqual(display_name, f"Staff {r}")

#     def test_login_welcome_message_respects_doctor_role(self):
#         # Doctor role
#         doc_user = User.objects.create_user(username='doc_consultant', password='pass@123', first_name='Farabi', last_name='Consultant')
#         NaimulProfile.objects.create(user=doc_user, role='Consultant')
#         resp = self.client.post(reverse('users_naimul:login'), {'username': 'doc_consultant', 'password': 'pass@123'}, follow=True)
#         messages = list(resp.context['messages'])
#         self.assertTrue(any("Dr. Farabi Consultant" in str(m) for m in messages))

#         # Logout first so login_view executes the POST branch
#         self.client.logout()

#         # Non-doctor role
#         tech_user = User.objects.create_user(username='tech_user', password='pass@123', first_name='Kamal', last_name='Technician')
#         NaimulProfile.objects.create(user=tech_user, role='Technician')
#         resp_tech = self.client.post(reverse('users_naimul:login'), {'username': 'tech_user', 'password': 'pass@123'}, follow=True)
#         tech_messages = list(resp_tech.context['messages'])
#         self.assertTrue(any("Kamal Technician" in str(m) and "Dr." not in str(m) for m in tech_messages))

#     def test_non_doctor_not_in_available_doctors(self):
#         from .models import get_available_doctors
#         tech_user = User.objects.create_user(username='lab_tech', password='pass@123', first_name='Sadia', last_name='Technician')
#         NaimulProfile.objects.create(user=tech_user, role='Technician')
#         doctors = get_available_doctors()
#         self.assertFalse(any("Sadia" in d or "lab_tech" in d for d in doctors), "Technicians must not appear in available doctors list")

#     def test_doctor_ot_schedule_contains_schedule_modal_and_no_redirect_links(self):
#         """
#         Verify that in the doctor dashboard OT Schedule tab, clicking to schedule a patient
#         triggers the modal and does not redirect to another URL like /surgeries/.
#         """
#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.get(reverse('users_naimul:profile') + '?tab=ot-slots')
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')

#         # Verify schedulePatientModal is present in the DOM
#         self.assertIn('id="schedulePatientModal"', content)
#         self.assertIn('id="modal_surg_name"', content)
#         self.assertIn('id="modal_surg_surgeon"', content)
#         self.assertIn('id="modal_surg_ot_room"', content)
#         self.assertIn('id="modal_surg_ot_slot"', content)
#         self.assertIn('id="modal_surg_form_error"', content)
#         self.assertIn('id="modal_surg_clash_alert"', content)

#         # Verify buttons invoke openSchedulePatientModal instead of linking to /surgeries/
#         self.assertIn('onclick="openSchedulePatientModal(', content)
#         self.assertNotIn('<a href="/surgeries/" class="btn-action-view">', content)

#     def test_ajax_patient_registration_successful(self):
#         """
#         Verify that registering a patient via AJAX successfully saves to DB,
#         returns JSON with success=True and patient data, and does not redirect.
#         """
#         from .models import SurgeryRecord
#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Anowar Hossain',
#                 'patient_age': '56',
#                 'patient_gender': 'Male',
#                 'eye': 'LE',
#                 'surgery_type': 'Phacoemulsification',
#                 'surgeon_name': 'Dr. Naimul Islam',
#                 'ot_room': 'OT-1',
#                 'ot_slot': 'Slot 2 (10:15 - 11:45 AM)',
#                 'outcome': 'Successful',
#                 'medical_history': 'Asthma controlled.',
#                 'notes': 'Monofocal IOL implanted.',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertTrue(data['success'])
#         self.assertEqual(data['patient']['patient_name'], 'Anowar Hossain')
#         self.assertEqual(data['patient']['ot_room'], 'OT-1')
#         self.assertEqual(data['patient']['ot_slot'], 'Slot 2 (10:15 - 11:45 AM)')

#         record = SurgeryRecord.objects.filter(patient_name='Anowar Hossain').first()
#         self.assertIsNotNone(record)
#         self.assertEqual(record.surgeon_name, 'Dr. Naimul Islam')
#         self.assertEqual(record.ot_room, 'OT-1')
#         self.assertEqual(record.ot_slot, 'Slot 2 (10:15 - 11:45 AM)')

#     def test_ajax_patient_registration_validation_error_no_redirect(self):
#         """
#         Verify that missing required patient name returns an error in JSON without redirecting.
#         """
#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': '   ',  # Empty name
#                 'patient_age': '50',
#                 'ot_room': 'OT-1',
#                 'ot_slot': 'Slot 1 (08:30 - 10:00 AM)',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertFalse(data['success'])
#         self.assertIn("Please provide the Patient's Full Name", data['error'])

#     def test_ajax_patient_registration_slot_clash_no_redirect(self):
#         """
#         Verify that an OT slot clash returns an error in JSON without redirecting.
#         The clash must be on the doctor's own assigned OT room since the backend
#         enforces that doctors can only book in their assigned room.
#         """
#         from .models import SurgeryRecord
#         # The logged-in doctor (naimul) has assigned_ot_room = 'OT-1' (setUp default)
#         doctor_room = self.profile.assigned_ot_room  # dynamic, no hardcode

#         # Pre-book a slot in the doctor's own OT room
#         SurgeryRecord.objects.create(
#             date=date.today(),
#             patient_name='Existing Booked Patient',
#             patient_age=60,
#             patient_gender='Female',
#             eye='RE',
#             surgery_type='Cataract',
#             surgeon_name=self.profile.get_surgeon_display_name(),
#             ot_room=doctor_room,
#             ot_slot='Slot 3 (12:00 - 01:30 PM)',
#             outcome='Successful'
#         )

#         self.client.login(username='naimul', password='pass@123')
#         # Attempt to book the exact same room and slot — backend overrides ot_room to doctor's own room
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Clashing Patient',
#                 'patient_age': '52',
#                 'surgeon_name': self.profile.get_surgeon_display_name(),
#                 'ot_room': doctor_room,
#                 'ot_slot': 'Slot 3 (12:00 - 01:30 PM)',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertFalse(data['success'])
#         self.assertIn("OT Slot Clash!", data['error'])
#         self.assertIn("Existing Booked Patient", data['error'])



#     def test_doctor_cannot_override_surgeon_name_or_ot_room_via_post(self):
#         """
#         Backend enforcement: even if a doctor submits a different surgeon_name or ot_room,
#         the saved record must use the logged-in doctor's own profile values.
#         All assertions use DB relationships — no hardcoded names or IDs.
#         """
#         from .models import SurgeryRecord
#         # Ensure the doctor profile has a distinct assigned OT room
#         self.profile.assigned_ot_room = 'OT-1'
#         self.profile.save()

#         # Create a second doctor whose name/room the logged-in doctor tries to spoof
#         other_user = User.objects.create_user(
#             username='other_doc', password='pass@123', first_name='Other', last_name='Doctor'
#         )
#         NaimulProfile.objects.create(user=other_user, role='Consultant', assigned_ot_room='OT-2')

#         self.client.login(username='naimul', password='pass@123')
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Restriction Test Patient',
#                 'patient_age': '45',
#                 'patient_gender': 'Female',
#                 'eye': 'LE',
#                 'surgery_type': 'Glaucoma',
#                 # Attempt to spoof another doctor's name and room
#                 'surgeon_name': 'Dr. Other Doctor',
#                 'ot_room': 'OT-2',
#                 'ot_slot': 'Slot 1 (08:30 - 10:00 AM)',
#                 'outcome': 'Successful',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertTrue(data['success'], f"Expected success but got: {data.get('error')}")

#         record = SurgeryRecord.objects.filter(patient_name='Restriction Test Patient').first()
#         self.assertIsNotNone(record)

#         # Surgeon must be the logged-in doctor's own canonical name (from profile)
#         expected_surgeon = self.profile.get_surgeon_display_name()
#         self.assertEqual(
#             record.surgeon_name, expected_surgeon,
#             f"Expected surgeon '{expected_surgeon}' but got '{record.surgeon_name}'"
#         )
#         # OT room must be the doctor's own assigned room (from profile)
#         self.assertEqual(
#             record.ot_room, self.profile.assigned_ot_room,
#             f"Expected OT room '{self.profile.assigned_ot_room}' but got '{record.ot_room}'"
#         )

#     def test_staff_user_can_choose_any_surgeon_and_ot_room(self):
#         """
#         Staff (non-doctor) roles retain full freedom to pick any surgeon name and OT room.
#         The restriction only applies to doctor roles.
#         """
#         from .models import SurgeryRecord
#         staff_user = User.objects.create_user(
#             username='ot_staff', password='pass@123', first_name='Kamal', last_name='Staff'
#         )
#         NaimulProfile.objects.create(user=staff_user, role='Staff', assigned_ot_room='OT-3')

#         self.client.login(username='ot_staff', password='pass@123')
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Staff Booked Patient',
#                 'patient_age': '60',
#                 'patient_gender': 'Male',
#                 'eye': 'RE',
#                 'surgery_type': 'Cataract',
#                 'surgeon_name': 'Dr. Naimul Islam',
#                 'ot_room': 'OT-4',
#                 'ot_slot': 'Slot 2 (10:15 - 11:45 AM)',
#                 'outcome': 'Successful',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertTrue(data['success'], f"Expected success but got: {data.get('error')}")

#         record = SurgeryRecord.objects.filter(patient_name='Staff Booked Patient').first()
#         self.assertIsNotNone(record)
#         # Staff submission must be respected as-is
#         self.assertEqual(record.surgeon_name, 'Dr. Naimul Islam')
#         self.assertEqual(record.ot_room, 'OT-4')


# class OtSlotAvailabilityAndClashTests(TestCase):
#     def setUp(self):
#         self.client = Client()
#         self.doctor_user = User.objects.create_user(
#             username='doctor_test',
#             password='pass@123',
#             first_name='Naimul',
#             last_name='Islam'
#         )
#         self.profile = NaimulProfile.objects.create(
#             user=self.doctor_user,
#             role='Surgeon',
#             specialty='Retina',
#             assigned_ot_room='OT-1',
#             surgeon_display_name='Dr. Naimul Islam'
#         )
#         self.client.login(username='doctor_test', password='pass@123')

#     def test_ot_slot_availability_api_requires_login(self):
#         anon_client = Client()
#         url = reverse('users_naimul:ot_slot_availability_api')
#         response = anon_client.get(f"{url}?ot_room=OT-1&ot_date=2026-10-25")
#         self.assertEqual(response.status_code, 302)

#     def test_ot_slot_availability_api_returns_booked_slots(self):
#         from .models import SurgeryRecord
#         from datetime import date
#         SurgeryRecord.objects.create(
#             date=date(2026, 10, 25),
#             patient_name='Existing Patient 1',
#             patient_age=55,
#             patient_gender='Male',
#             eye='RE',
#             surgery_type='Cataract',
#             surgeon_name='Dr. Naimul Islam',
#             ot_room='OT-1',
#             ot_slot='Slot 1 (08:30 - 10:00 AM)',
#             outcome='Successful'
#         )
#         SurgeryRecord.objects.create(
#             date=date(2026, 10, 25),
#             patient_name='Existing Patient 2',
#             patient_age=48,
#             patient_gender='Female',
#             eye='LE',
#             surgery_type='Vitrectomy',
#             surgeon_name='Dr. Naimul Islam',
#             ot_room='OT-1',
#             ot_slot='Slot 3 (12:00 - 01:30 PM)',
#             outcome='Successful'
#         )
#         # Different room on same date
#         SurgeryRecord.objects.create(
#             date=date(2026, 10, 25),
#             patient_name='Other Room Patient',
#             patient_age=50,
#             patient_gender='Male',
#             eye='RE',
#             surgery_type='Glaucoma',
#             surgeon_name='Dr. Other',
#             ot_room='OT-2',
#             ot_slot='Slot 1 (08:30 - 10:00 AM)',
#             outcome='Successful'
#         )
#         # Different date in same room
#         SurgeryRecord.objects.create(
#             date=date(2026, 10, 26),
#             patient_name='Tomorrow Patient',
#             patient_age=60,
#             patient_gender='Female',
#             eye='RE',
#             surgery_type='Cataract',
#             surgeon_name='Dr. Naimul Islam',
#             ot_room='OT-1',
#             ot_slot='Slot 2 (10:15 - 11:45 AM)',
#             outcome='Successful'
#         )

#         url = reverse('users_naimul:ot_slot_availability_api')
#         response = self.client.get(f"{url}?ot_room=OT-1&ot_date=2026-10-25", HTTP_X_REQUESTED_WITH='XMLHttpRequest')
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertIn('booked_slots', data)
#         self.assertEqual(len(data['booked_slots']), 2)
#         self.assertIn('Slot 1 (08:30 - 10:00 AM)', data['booked_slots'])
#         self.assertIn('Slot 3 (12:00 - 01:30 PM)', data['booked_slots'])
#         self.assertNotIn('Slot 2 (10:15 - 11:45 AM)', data['booked_slots'])
#         # Verify dynamic booked_details and patient names
#         self.assertIn('booked_details', data)
#         self.assertEqual(data['booked_details']['Slot 1 (08:30 - 10:00 AM)']['patient_name'], 'Existing Patient 1')
#         self.assertEqual(data['booked_details']['Slot 3 (12:00 - 01:30 PM)']['patient_name'], 'Existing Patient 2')
#         # Verify structured slots with availability status
#         self.assertIn('slots', data)
#         slot1 = next(s for s in data['slots'] if s['slot_val'] == 'Slot 1 (08:30 - 10:00 AM)')
#         self.assertTrue(slot1['is_booked'])
#         self.assertEqual(slot1['patient_name'], 'Existing Patient 1')
#         slot2 = next(s for s in data['slots'] if s['slot_val'] == 'Slot 2 (10:15 - 11:45 AM)')
#         self.assertFalse(slot2['is_booked'])
#         self.assertIsNone(slot2['patient_name'])

#     def test_backend_prevents_booking_invalid_slot(self):
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Invalid Slot Patient',
#                 'patient_age': '40',
#                 'patient_gender': 'Male',
#                 'eye': 'LE',
#                 'surgery_type': 'Glaucoma',
#                 'ot_date': '2026-10-25',
#                 'ot_slot': 'Select OT Slot',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertFalse(data['success'])
#         self.assertIn('valid OT Slot', data['error'])

#     def test_backend_prevents_booking_occupied_slot_on_same_date(self):
#         from .models import SurgeryRecord
#         from datetime import date
#         SurgeryRecord.objects.create(
#             date=date(2026, 10, 25),
#             patient_name='First Booking',
#             patient_age=55,
#             patient_gender='Male',
#             eye='RE',
#             surgery_type='Cataract',
#             surgeon_name='Dr. Naimul Islam',
#             ot_room='OT-1',
#             ot_slot='Slot 1 (08:30 - 10:00 AM)',
#             outcome='Successful'
#         )

#         # Attempt to book the same slot on the same date via AJAX
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Clash Attempt Patient',
#                 'patient_age': '40',
#                 'patient_gender': 'Male',
#                 'eye': 'LE',
#                 'surgery_type': 'Glaucoma',
#                 'ot_date': '2026-10-25',
#                 'ot_slot': 'Slot 1 (08:30 - 10:00 AM)',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertFalse(data['success'])
#         self.assertIn('OT Slot Clash', data['error'])

#     def test_booking_same_slot_on_different_date_succeeds(self):
#         from .models import SurgeryRecord
#         from datetime import date
#         SurgeryRecord.objects.create(
#             date=date(2026, 10, 25),
#             patient_name='Day 1 Booking',
#             patient_age=55,
#             patient_gender='Male',
#             eye='RE',
#             surgery_type='Cataract',
#             surgeon_name='Dr. Naimul Islam',
#             ot_room='OT-1',
#             ot_slot='Slot 1 (08:30 - 10:00 AM)',
#             outcome='Successful'
#         )

#         # Attempt to book the same slot on a different date (2026-10-26)
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Day 2 Patient',
#                 'patient_age': '42',
#                 'patient_gender': 'Female',
#                 'eye': 'RE',
#                 'surgery_type': 'Cataract',
#                 'ot_date': '2026-10-26',
#                 'ot_slot': 'Slot 1 (08:30 - 10:00 AM)',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertTrue(data['success'])
#         self.assertIn('Day 2 Patient', data['message'])


# class PatientRegistrationFormFieldsTests(TestCase):
#     def setUp(self):
#         self.client = Client()
#         self.doctor_user = User.objects.create_user(
#             username='doctor_naimul',
#             password='pass@123',
#             first_name='Naimul',
#             last_name='Islam'
#         )
#         self.profile = NaimulProfile.objects.create(
#             user=self.doctor_user,
#             role='Surgeon',
#             specialty='Retina',
#             assigned_ot_room='OT-1',
#             surgeon_display_name='Dr. Naimul Islam'
#         )
#         self.client.login(username='doctor_naimul', password='pass@123')

#     def test_registration_form_displays_date_field_in_place_of_mrn(self):
#         """
#         Verify that in the patient registration form, the Date field is displayed
#         in place of the Patient MRN field, and MRN is hidden.
#         """
#         response = self.client.get(reverse('users_naimul:profile') + '?tab=ot-slots')
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')

#         # Check modal form:
#         # Date field should be present with modal_surg_ot_date id and Date label
#         self.assertIn('for="modal_surg_ot_date"', content)
#         self.assertIn('id="modal_surg_ot_date"', content)
#         # MRN input is hidden
#         self.assertIn('<input type="hidden" name="patient_mrn" id="modal_surg_mrn" value="">', content)
#         # The visible auto-assigned MRN label and display box should not be present in modal form
#         self.assertNotIn('for="modal_surg_mrn"', content)

#         # Check staff pane form:
#         self.assertIn('for="surg_ot_date"', content)
#         self.assertIn('id="surg_ot_date"', content)
#         self.assertIn('<input type="hidden" name="patient_mrn" id="surg_mrn" value="">', content)
#         self.assertNotIn('for="surg_mrn"', content)

#     def test_mrn_auto_generation_preserved_on_save(self):
#         """
#         Verify that submitting the patient registration form without supplying an MRN
#         still automatically assigns a valid P26XXXXX MRN upon database save.
#         """
#         from .models import SurgeryRecord
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Automated MRN Patient',
#                 'patient_age': '52',
#                 'patient_gender': 'Female',
#                 'eye': 'LE',
#                 'surgery_type': 'Phacoemulsification',
#                 'ot_date': '2026-10-28',
#                 'ot_slot': 'Slot 2 (10:15 - 11:45 AM)',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertTrue(data['success'])

#         record = SurgeryRecord.objects.filter(patient_name='Automated MRN Patient').first()
#         self.assertIsNotNone(record)
#         self.assertTrue(record.patient_mrn.startswith('P26'))
#         self.assertEqual(len(record.patient_mrn), 8)
#         self.assertEqual(record.date.strftime('%Y-%m-%d'), '2026-10-28')

#     def test_date_picker_minimum_date_set_to_today(self):
#         """
#         Verify that the date picker input fields have the minimum date attribute set to today
#         and dynamic JavaScript logic enforces today's date dynamically.
#         """
#         response = self.client.get(reverse('users_naimul:profile') + '?tab=ot-slots')
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
#         today_iso = date.today().strftime('%Y-%m-%d')

#         # Check modal date picker has min set to today
#         self.assertIn('id="modal_surg_ot_date"', content)
#         self.assertIn(f'min="{today_iso}"', content)
#         # Check staff pane date picker has min set to today
#         self.assertIn('id="surg_ot_date"', content)
#         # Verify dynamic JS min date logic is present
#         self.assertIn('getLocalDateString', content)
#         self.assertIn('el.min = todayStr;', content)

#     def test_date_selection_allows_today_date(self):
#         """
#         Verify that registering a patient with today's date is allowed and succeeds.
#         """
#         from .models import SurgeryRecord
#         today_iso = date.today().strftime('%Y-%m-%d')
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Today Date Patient',
#                 'patient_age': '40',
#                 'patient_gender': 'Male',
#                 'eye': 'RE',
#                 'surgery_type': 'Cataract',
#                 'ot_date': today_iso,
#                 'ot_slot': 'Slot 4 (02:00 - 03:30 PM)',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertTrue(data['success'])

#         record = SurgeryRecord.objects.filter(patient_name='Today Date Patient').first()
#         self.assertIsNotNone(record)
#         self.assertEqual(record.date, date.today())

#     def test_date_selection_allows_future_date(self):
#         """
#         Verify that registering a patient with a future date is allowed and succeeds.
#         """
#         from .models import SurgeryRecord
#         future_day = date.today() + timedelta(days=10)
#         future_iso = future_day.strftime('%Y-%m-%d')
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Future Date Patient',
#                 'patient_age': '35',
#                 'patient_gender': 'Female',
#                 'eye': 'LE',
#                 'surgery_type': 'Glaucoma',
#                 'ot_date': future_iso,
#                 'ot_slot': 'Slot 1 (08:30 - 10:00 AM)',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertTrue(data['success'])

#         record = SurgeryRecord.objects.filter(patient_name='Future Date Patient').first()
#         self.assertIsNotNone(record)
#         self.assertEqual(record.date, future_day)

#     def test_date_selection_prevents_past_date_ajax(self):
#         """
#         Backend validation: verify that submitting a past date via AJAX is rejected
#         and does not create a database record.
#         """
#         from .models import SurgeryRecord
#         past_day = date.today() - timedelta(days=1)
#         past_iso = past_day.strftime('%Y-%m-%d')
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Past Date Patient AJAX',
#                 'patient_age': '60',
#                 'patient_gender': 'Male',
#                 'eye': 'RE',
#                 'surgery_type': 'Cataract',
#                 'ot_date': past_iso,
#                 'ot_slot': 'Slot 2 (10:15 - 11:45 AM)',
#             },
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertFalse(data['success'])
#         self.assertIn("Past dates are not allowed", data['error'])

#         record = SurgeryRecord.objects.filter(patient_name='Past Date Patient AJAX').first()
#         self.assertIsNone(record)

#     def test_date_selection_prevents_past_date_post_redirect(self):
#         """
#         Backend validation: verify that submitting a past date via standard POST
#         sets an error message, redirects, and does not create a database record.
#         """
#         from .models import SurgeryRecord
#         past_day = date.today() - timedelta(days=5)
#         past_iso = past_day.strftime('%Y-%m-%d')
#         response = self.client.post(
#             reverse('users_naimul:profile'),
#             {
#                 'apply_surgery': '1',
#                 'patient_name': 'Past Date Patient POST',
#                 'patient_age': '65',
#                 'patient_gender': 'Female',
#                 'eye': 'LE',
#                 'surgery_type': 'Retina',
#                 'ot_date': past_iso,
#                 'ot_slot': 'Slot 3 (12:00 - 01:30 PM)',
#             },
#             follow=True
#         )
#         self.assertEqual(response.status_code, 200)
#         messages_list = list(response.context['messages'])
#         self.assertTrue(any("Past dates are not allowed" in str(m) for m in messages_list))

#         record = SurgeryRecord.objects.filter(patient_name='Past Date Patient POST').first()
#         self.assertIsNone(record)


# from django.test import TestCase, Client
# from django.urls import reverse
# from django.contrib.auth.models import User
# from users_naimul.models import NaimulProfile, get_available_doctors


# class DoctorRegistrationTests(TestCase):
#     """
#     Tests for the Doctor Registration feature in users_naimul:
#     - Authorization (only authorized administrators can register accounts)
#     - Privilege limitation (only superusers can assign the 'Admin' role)
#     - Field validations, formats, and duplicate detection
#     - Secure password hashing
#     - Account creation and subsequent login
#     - Doctor role behavior (Dr. prefix, available_doctors listing)
#     - Dropdown choices (Role, Specialty, Assigned OT)
#     - AJAX endpoint behavior
#     """

#     def setUp(self):
#         self.client = Client()

#         # 1. Superuser Administrator
#         self.superuser = User.objects.create_superuser(
#             username='superadmin',
#             email='superadmin@iieih.com',
#             password='AdminPass@123',
#             first_name='Super',
#             last_name='Admin'
#         )
#         self.super_profile = NaimulProfile.objects.create(
#             user=self.superuser,
#             role='Admin',
#             specialty='Cataract',
#             assigned_ot_room='OT-1',
#             surgeon_code='ADMIN-001',
#             license_number='BMDC-AD-0001'
#         )

#         # 2. Staff Administrator (is_staff=True, not superuser)
#         self.staff_admin = User.objects.create_user(
#             username='staffadmin',
#             email='staffadmin@iieih.com',
#             password='StaffPass@123',
#             first_name='Staff',
#             last_name='Admin',
#             is_staff=True
#         )
#         self.staff_admin_profile = NaimulProfile.objects.create(
#             user=self.staff_admin,
#             role='Admin',
#             specialty='Glaucoma',
#             assigned_ot_room='OT-2',
#             surgeon_code='ADMIN-002',
#             license_number='BMDC-AD-0002'
#         )

#         # 3. Regular Doctor (Surgeon, not staff, not superuser)
#         self.doctor_user = User.objects.create_user(
#             username='regular_surgeon',
#             email='surgeon@iieih.com',
#             password='DocPass@123',
#             first_name='Naimul',
#             last_name='Islam'
#         )
#         self.doctor_profile = NaimulProfile.objects.create(
#             user=self.doctor_user,
#             role='Surgeon',
#             specialty='Retina',
#             assigned_ot_room='OT-2',
#             surgeon_display_name='Dr. Naimul Islam',
#             surgeon_code='SURG-001',
#             license_number='BMDC-A-0001'
#         )

#         # 4. Standard registration POST payload
#         self.valid_payload = {
#             'register_doctor': '1',
#             'username': 'new_dr_fahim',
#             'password': 'SecurePassword@2026',
#             'email': 'fahim.eye@iieih.com',
#             'phone': '+880 1711-987654',
#             'role': 'Consultant',
#             'specialty': 'Glaucoma',
#             'assigned_ot_room': 'OT-1',
#             'surgeon_display_name': 'Dr. Fahim Rahman',
#             'surgeon_code': 'SURG-501',
#             'license_number': 'BMDC-A-50123',
#             'department': 'Department of Ophthalmology & Microsurgery',
#             'bio': 'Senior Consultant in Glaucoma micro-invasive surgery.'
#         }

#     def test_admin_can_view_doctor_registration_tab(self):
#         """Authorized administrator can see the Doctor Registration tab button and pane."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         response = self.client.get(reverse('users_naimul:profile') + '?tab=doctor-reg')
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
#         self.assertIn('Doctor Registration', content)
#         self.assertIn('id="pane-doctor-reg"', content)
#         self.assertIn('id="doctorRegForm"', content)

#     def test_regular_doctor_cannot_view_doctor_registration_tab(self):
#         """Regular clinical doctor cannot see the Doctor Registration tab button or form."""
#         self.client.login(username='regular_surgeon', password='DocPass@123')
#         response = self.client.get(reverse('users_naimul:profile'))
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
#         self.assertNotIn('admin-tab-btn', content)
#         self.assertNotIn('id="pane-doctor-reg"', content)

#     def test_admin_creates_doctor_account_success(self):
#         """Administrator successfully creates a doctor account with all required fields."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         response = self.client.post(reverse('users_naimul:profile'), self.valid_payload, follow=True)
#         self.assertEqual(response.status_code, 200)

#         # Verify user exists in database
#         new_user = User.objects.filter(username='new_dr_fahim').first()
#         self.assertIsNotNone(new_user)
#         self.assertEqual(new_user.email, 'fahim.eye@iieih.com')

#         # Verify profile exists with correct fields
#         profile = getattr(new_user, 'naimul_profile', None)
#         self.assertIsNotNone(profile)
#         self.assertEqual(profile.role, 'Consultant')
#         self.assertEqual(profile.specialty, 'Glaucoma')
#         self.assertEqual(profile.assigned_ot_room, 'OT-1')
#         self.assertEqual(profile.surgeon_code, 'SURG-501')
#         self.assertEqual(profile.license_number, 'BMDC-A-50123')
#         self.assertEqual(profile.phone, '+880 1711-987654')
#         self.assertEqual(profile.surgeon_display_name, 'Dr. Fahim Rahman')
#         self.assertTrue(profile.is_doctor_role)

#     def test_created_doctor_can_log_in(self):
#         """The newly created doctor user can authenticate and log in successfully."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         self.client.post(reverse('users_naimul:profile'), self.valid_payload)
#         self.client.logout()

#         # Attempt login with newly created credentials
#         login_resp = self.client.post(reverse('users_naimul:login'), {
#             'username': 'new_dr_fahim',
#             'password': 'SecurePassword@2026'
#         }, follow=True)
#         self.assertEqual(login_resp.status_code, 200)
#         # Doctor role redirects to profile patients tab
#         self.assertTrue(login_resp.context['user'].is_authenticated)
#         self.assertEqual(login_resp.context['user'].username, 'new_dr_fahim')
#         # Welcome message contains display name
#         messages_text = [str(m) for m in login_resp.context['messages']]
#         self.assertTrue(any('Dr. Fahim Rahman' in m for m in messages_text))

#     def test_doctor_gets_dr_prefix_and_in_available_doctors(self):
#         """Doctor role accounts have 'Dr.' display name and appear in available doctors list."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         self.client.post(reverse('users_naimul:profile'), self.valid_payload)

#         doctors = get_available_doctors()
#         self.assertIn('Dr. Fahim Rahman', doctors)

#     def test_secure_password_hashing(self):
#         """Passwords are never stored in plaintext and are hashed via PBKDF2/Django auth."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         self.client.post(reverse('users_naimul:profile'), self.valid_payload)

#         new_user = User.objects.get(username='new_dr_fahim')
#         self.assertNotEqual(new_user.password, 'SecurePassword@2026')
#         self.assertTrue(new_user.password.startswith('pbkdf2_') or new_user.password.startswith('bcrypt') or new_user.password.startswith('argon2'))
#         self.assertTrue(new_user.check_password('SecurePassword@2026'))

#     def test_duplicate_username_rejected(self):
#         """Attempting to register with an existing username is rejected."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['username'] = 'regular_surgeon'  # Already exists
#         payload['surgeon_code'] = 'SURG-UNIQUE-1'
#         payload['license_number'] = 'BMDC-UNIQUE-1'
#         payload['email'] = 'unique1@iieih.com'

#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("already in use" in m or "already exists" in m for m in messages_text))

#     def test_duplicate_email_rejected(self):
#         """Attempting to register with an existing email address is rejected."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['email'] = 'surgeon@iieih.com'  # Already exists
#         payload['username'] = 'unique_dr_user'
#         payload['surgeon_code'] = 'SURG-UNIQUE-2'
#         payload['license_number'] = 'BMDC-UNIQUE-2'

#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("already registered" in m or "already exists" in m for m in messages_text))

#     def test_duplicate_surgeon_code_rejected(self):
#         """Duplicate surgeon code is rejected."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['surgeon_code'] = 'SURG-001'  # Already exists
#         payload['username'] = 'unique_code_user'
#         payload['email'] = 'uniquecode@iieih.com'
#         payload['license_number'] = 'BMDC-UNIQUE-3'

#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("already assigned" in m or "surgeon code" in m.lower() for m in messages_text))

#     def test_duplicate_license_number_rejected(self):
#         """Duplicate medical license number is rejected."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['license_number'] = 'BMDC-A-0001'  # Already exists
#         payload['username'] = 'unique_lic_user'
#         payload['email'] = 'uniquelic@iieih.com'
#         payload['surgeon_code'] = 'SURG-UNIQUE-4'

#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("already registered" in m or "license" in m.lower() for m in messages_text))

#     def test_invalid_username_format_rejected(self):
#         """Usernames with spaces or illegal characters are rejected."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['username'] = 'dr fahim space'

#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("may only contain" in m or "invalid" in m.lower() for m in messages_text))

#     def test_invalid_email_format_rejected(self):
#         """Invalid email addresses are rejected."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['email'] = 'not-an-email-address'

#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("valid email address" in m for m in messages_text))

#     def test_short_password_rejected(self):
#         """Passwords shorter than 6 characters are rejected."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['password'] = '123'

#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("at least 6 characters" in m for m in messages_text))

#     def test_invalid_phone_rejected(self):
#         """Phones without enough digits are rejected."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['phone'] = '123'

#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("at least 7 digits" in m for m in messages_text))

#     def test_non_admin_cannot_post_doctor_registration(self):
#         """A non-administrator user posting to doctor registration is rejected with access denied."""
#         self.client.login(username='regular_surgeon', password='DocPass@123')
#         response = self.client.post(reverse('users_naimul:profile'), self.valid_payload, follow=True)
#         self.assertEqual(response.status_code, 200)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("Access Denied" in m for m in messages_text))

#         # Check dedicated view rejects non-admin with 403 on AJAX
#         ajax_resp = self.client.post(reverse('users_naimul:register_doctor'), self.valid_payload, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
#         self.assertEqual(ajax_resp.status_code, 403)

#     def test_staff_admin_cannot_assign_admin_role(self):
#         """A staff administrator without superuser privileges CANNOT assign the Admin role."""
#         self.client.login(username='staffadmin', password='StaffPass@123')
#         payload = self.valid_payload.copy()
#         payload['role'] = 'Admin'

#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("Only Super Administrators can assign the Admin role" in m for m in messages_text))
#         self.assertFalse(User.objects.filter(username=payload['username']).exists())

#     def test_superuser_can_assign_admin_role(self):
#         """A superuser administrator CAN assign the Admin role."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['username'] = 'second_admin'
#         payload['email'] = 'admin2@iieih.com'
#         payload['surgeon_code'] = 'ADMIN-003'
#         payload['license_number'] = 'BMDC-AD-0003'
#         payload['role'] = 'Admin'

#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         self.assertEqual(response.status_code, 200)

#         created_user = User.objects.filter(username='second_admin').first()
#         self.assertIsNotNone(created_user)
#         self.assertEqual(created_user.naimul_profile.role, 'Admin')
#         self.assertTrue(created_user.is_staff)

#     def test_all_role_choices_accepted(self):
#         """Verifies all dropdown role choices from prompt are accepted."""
#         roles = [
#             'Surgeon',
#             'Technician',
#             'Consultant — Consultant Eye Surgeon',
#             'Associate — Associate Specialist',
#             'Resident — Surgical Resident / Fellow',
#             'OT Nurse — OT',
#             'Staff — OT Coordinator / Surgical Staff',
#             'Other'
#         ]
#         self.client.login(username='superadmin', password='AdminPass@123')
#         for i, r in enumerate(roles):
#             payload = self.valid_payload.copy()
#             payload['username'] = f'test_role_user_{i}'
#             payload['email'] = f'roleuser{i}@iieih.com'
#             payload['surgeon_code'] = f'CODE-R-{i}'
#             payload['license_number'] = f'LIC-R-{i}'
#             payload['role'] = r
#             resp = self.client.post(reverse('users_naimul:profile'), payload)
#             self.assertEqual(resp.status_code, 302)
#             u = User.objects.filter(username=f'test_role_user_{i}').first()
#             self.assertIsNotNone(u, f"Failed creating user with role: {r}")

#     def test_all_specialty_choices_including_aliases_accepted(self):
#         """Verifies all specialty dropdown choices and aliases from prompt are accepted."""
#         specialties = [
#             'Qatar',
#             'Glaucoma — Glaucoma Services',
#             'Retina — Vitreoretinal Surgery',
#             'Cornea — Cornea & External Disease',
#             'THE',
#             'Pediatric Ophthalmology — Pediatric Ophthalmology & Strabismus',
#             'Neuro-Ophthalmology — Neuro-Ophthalmology',
#             'IN',
#             'Re',
#             'Other'
#         ]
#         self.client.login(username='superadmin', password='AdminPass@123')
#         for i, s in enumerate(specialties):
#             payload = self.valid_payload.copy()
#             payload['username'] = f'test_spec_user_{i}'
#             payload['email'] = f'specuser{i}@iieih.com'
#             payload['surgeon_code'] = f'CODE-S-{i}'
#             payload['license_number'] = f'LIC-S-{i}'
#             payload['specialty'] = s
#             resp = self.client.post(reverse('users_naimul:profile'), payload)
#             self.assertEqual(resp.status_code, 302)
#             u = User.objects.filter(username=f'test_spec_user_{i}').first()
#             self.assertIsNotNone(u, f"Failed creating user with specialty: {s}")

#     def test_all_ot_rooms_accepted(self):
#         """Verifies all assigned OT room choices (OT-1, OT-2, OT-3, OT-4) are accepted."""
#         rooms = ['OT-1', 'OT-2', 'OT-3', 'OT-4']
#         self.client.login(username='superadmin', password='AdminPass@123')
#         for i, rm in enumerate(rooms):
#             payload = self.valid_payload.copy()
#             payload['username'] = f'test_ot_user_{i}'
#             payload['email'] = f'otuser{i}@iieih.com'
#             payload['surgeon_code'] = f'CODE-OT-{i}'
#             payload['license_number'] = f'LIC-OT-{i}'
#             payload['assigned_ot_room'] = rm
#             resp = self.client.post(reverse('users_naimul:profile'), payload)
#             self.assertEqual(resp.status_code, 302)
#             u = User.objects.filter(username=f'test_ot_user_{i}').first()
#             self.assertIsNotNone(u)
#             self.assertEqual(u.naimul_profile.assigned_ot_room, rm)

#     def test_ajax_registration_success(self):
#         """Submitting doctor registration via AJAX returns JSON success with created doctor details."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['username'] = 'ajax_doctor'
#         payload['email'] = 'ajax.dr@iieih.com'
#         payload['surgeon_code'] = 'SURG-AJAX-1'
#         payload['license_number'] = 'BMDC-AJAX-1'

#         response = self.client.post(
#             reverse('users_naimul:register_doctor'),
#             payload,
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertTrue(data['success'])
#         self.assertEqual(data['doctor']['username'], 'ajax_doctor')
#         self.assertEqual(data['doctor']['role'], 'Consultant')

#     def test_ajax_registration_validation_error(self):
#         """Submitting invalid data via AJAX returns JSON failure with 400 status code and errors dict."""
#         self.client.login(username='superadmin', password='AdminPass@123')
#         payload = self.valid_payload.copy()
#         payload['username'] = ''  # missing username

#         response = self.client.post(
#             reverse('users_naimul:register_doctor'),
#             payload,
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 400)
#         data = response.json()
#         self.assertFalse(data['success'])
#         self.assertIn('username', data['errors'])


# from django.test import TestCase, Client
# from django.urls import reverse
# from django.contrib.auth.models import User
# from users_naimul.models import NaimulProfile


# class DoctorEditTestCase(TestCase):
#     def setUp(self):
#         self.client = Client()
#         # Admin user
#         self.admin_user = User.objects.create_superuser(
#             username='admin_naimul',
#             email='admin@iieih.org.bd',
#             password='AdminPassword123'
#         )
#         self.admin_profile = NaimulProfile.objects.create(
#             user=self.admin_user,
#             role='Admin',
#             specialty='Cataract',
#             assigned_ot_room='OT-1',
#             surgeon_code='ADMIN-101',
#             license_number='BMDC-AD-48291',
#             department='Department of Administration',
#             phone='+8801911-220856'
#         )

#         # Target Doctor to edit
#         self.doctor_user = User.objects.create_user(
#             username='shifat',
#             email='nazmulislam.shifat@iieih.org.bd',
#             password='DoctorPassword123',
#             first_name='Nazmul',
#             last_name='Shifat'
#         )
#         self.doctor_profile = NaimulProfile.objects.create(
#             user=self.doctor_user,
#             role='Surgeon',
#             specialty='Retina',
#             assigned_ot_room='OT-2',
#             surgeon_display_name='Dr. Nazmul Islam Shifat',
#             surgeon_code='SURG-101',
#             license_number='BMDC-S-49201',
#             department='Department of Retina',
#             phone='+8801911-712670'
#         )

#         # Regular non-admin doctor
#         self.regular_user = User.objects.create_user(
#             username='regular_doc',
#             email='regular@iieih.org.bd',
#             password='DocPassword123'
#         )
#         self.regular_profile = NaimulProfile.objects.create(
#             user=self.regular_user,
#             role='Resident',
#             specialty='Cornea',
#             assigned_ot_room='OT-3',
#             surgeon_code='SURG-999',
#             license_number='BMDC-R-99999'
#         )

#     def test_directory_renders_edit_button_and_modal(self):
#         """Admin viewing doctor-reg tab should see the Edit button and the edit modal."""
#         self.client.login(username='admin_naimul', password='AdminPassword123')
#         response = self.client.get(reverse('users_naimul:profile') + '?tab=doctor-reg')
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
#         self.assertIn('btn-edit-doc-entry', content)
#         self.assertIn('id="editDoctorModal"', content)
#         self.assertIn('SURG-101', content)
#         self.assertIn('BMDC-S-49201', content)

#     def test_admin_can_edit_doctor_information(self):
#         """Admin can update doctor details via POST to profile."""
#         self.client.login(username='admin_naimul', password='AdminPassword123')
#         payload = {
#             'edit_doctor': '1',
#             'profile_id': self.doctor_profile.id,
#             'username': 'shifat_updated',
#             'first_name': 'Nazmul Islam',
#             'last_name': 'Shifat',
#             'surgeon_display_name': 'Dr. Nazmul Islam Shifat, PhD',
#             'email': 'shifat.new@iieih.org.bd',
#             'phone': '+8801911-999999',
#             'role': 'Consultant',
#             'specialty': 'Retina',
#             'assigned_ot_room': 'OT-2',
#             'surgeon_code': 'SURG-101-NEW',
#             'license_number': 'BMDC-S-49201-NEW',
#             'department': 'Department of Vitreoretinal Surgery',
#             'bio': 'Senior Consultant Vitreoretinal Surgeon',
#             'is_active': '1',
#         }
#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         self.assertEqual(response.status_code, 200)

#         self.doctor_profile.refresh_from_db()
#         self.doctor_user.refresh_from_db()

#         self.assertEqual(self.doctor_user.username, 'shifat_updated')
#         self.assertEqual(self.doctor_user.email, 'shifat.new@iieih.org.bd')
#         self.assertEqual(self.doctor_profile.role, 'Consultant')
#         self.assertEqual(self.doctor_profile.surgeon_code, 'SURG-101-NEW')
#         self.assertEqual(self.doctor_profile.license_number, 'BMDC-S-49201-NEW')
#         self.assertEqual(self.doctor_profile.department, 'Department of Vitreoretinal Surgery')
#         self.assertEqual(self.doctor_profile.phone, '+8801911-999999')
#         self.assertEqual(self.doctor_profile.surgeon_display_name, 'Dr. Nazmul Islam Shifat, PhD')

#     def test_non_admin_cannot_edit_doctor(self):
#         """Non-admin user cannot edit doctor profiles."""
#         self.client.login(username='regular_doc', password='DocPassword123')
#         payload = {
#             'edit_doctor': '1',
#             'profile_id': self.doctor_profile.id,
#             'username': 'hacked_name',
#             'email': 'hacked@iieih.org.bd',
#             'phone': '+8801911-000000',
#             'role': 'Admin',
#             'specialty': 'Retina',
#             'assigned_ot_room': 'OT-1',
#             'surgeon_code': 'SURG-HACK',
#             'license_number': 'BMDC-HACK',
#         }
#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         self.doctor_profile.refresh_from_db()
#         self.assertEqual(self.doctor_profile.surgeon_code, 'SURG-101')

#     def test_edit_doctor_ajax_endpoint(self):
#         """Admin can edit doctor via dedicated AJAX endpoint."""
#         self.client.login(username='admin_naimul', password='AdminPassword123')
#         payload = {
#             'profile_id': self.doctor_profile.id,
#             'username': 'shifat',
#             'first_name': 'Nazmul',
#             'last_name': 'Shifat',
#             'email': 'nazmulislam.shifat@iieih.org.bd',
#             'phone': '+8801911-712670',
#             'role': 'Surgeon',
#             'specialty': 'Glaucoma',
#             'assigned_ot_room': 'OT-3',
#             'surgeon_code': 'SURG-101',
#             'license_number': 'BMDC-S-49201',
#             'department': 'Department of Glaucoma',
#             'is_active': '1',
#         }
#         response = self.client.post(
#             reverse('users_naimul:edit_doctor'),
#             payload,
#             HTTP_X_REQUESTED_WITH='XMLHttpRequest'
#         )
#         self.assertEqual(response.status_code, 200)
#         data = response.json()
#         self.assertTrue(data['success'])
#         self.assertEqual(data['doctor']['specialty'], 'Glaucoma')
#         self.assertEqual(data['doctor']['assigned_ot_room'], 'OT-3')

#     def test_duplicate_surgeon_code_rejected(self):
#         """Editing doctor to an existing surgeon code used by another doctor is rejected."""
#         self.client.login(username='admin_naimul', password='AdminPassword123')
#         payload = {
#             'edit_doctor': '1',
#             'profile_id': self.doctor_profile.id,
#             'username': 'shifat',
#             'first_name': 'Nazmul',
#             'last_name': 'Shifat',
#             'email': 'nazmulislam.shifat@iieih.org.bd',
#             'phone': '+8801911-712670',
#             'role': 'Surgeon',
#             'specialty': 'Retina',
#             'assigned_ot_room': 'OT-2',
#             'surgeon_code': 'ADMIN-101',  # already used by admin_profile!
#             'license_number': 'BMDC-S-49201',
#             'department': 'Department of Retina',
#         }
#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("already assigned to another staff member" in m for m in messages_text))

#     def test_duplicate_license_number_rejected(self):
#         """Editing doctor to an existing license number used by another doctor is rejected."""
#         self.client.login(username='admin_naimul', password='AdminPassword123')
#         payload = {
#             'edit_doctor': '1',
#             'profile_id': self.doctor_profile.id,
#             'username': 'shifat',
#             'first_name': 'Nazmul',
#             'last_name': 'Shifat',
#             'email': 'nazmulislam.shifat@iieih.org.bd',
#             'phone': '+8801911-712670',
#             'role': 'Surgeon',
#             'specialty': 'Retina',
#             'assigned_ot_room': 'OT-2',
#             'surgeon_code': 'SURG-101',
#             'license_number': 'BMDC-AD-48291',  # already used by admin_profile!
#             'department': 'Department of Retina',
#         }
#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         messages_text = [str(m) for m in response.context['messages']]
#         self.assertTrue(any("already registered in the system" in m for m in messages_text))

#     def test_password_update_when_provided(self):
#         """Password is updated when a valid new password is provided."""
#         self.client.login(username='admin_naimul', password='AdminPassword123')
#         payload = {
#             'edit_doctor': '1',
#             'profile_id': self.doctor_profile.id,
#             'username': 'shifat',
#             'first_name': 'Nazmul',
#             'last_name': 'Shifat',
#             'email': 'nazmulislam.shifat@iieih.org.bd',
#             'phone': '+8801911-712670',
#             'role': 'Surgeon',
#             'specialty': 'Retina',
#             'assigned_ot_room': 'OT-2',
#             'surgeon_code': 'SURG-101',
#             'license_number': 'BMDC-S-49201',
#             'department': 'Department of Retina',
#             'password': 'NewSecurePassword@456',
#         }
#         response = self.client.post(reverse('users_naimul:profile'), payload, follow=True)
#         self.assertEqual(response.status_code, 200)

#         # Doctor user should now authenticate with the new password
#         from django.contrib.auth import authenticate
#         user = authenticate(username='shifat', password='NewSecurePassword@456')
#         self.assertIsNotNone(user)


# from django.test import TestCase, Client
# from django.urls import reverse
# from django.contrib.auth.models import User
# import json
# from datetime import date
# from .models import NaimulProfile, SurgeryRecord, Prescription

# class PatientLoadTabTests(TestCase):
#     def setUp(self):
#         self.client = Client()
#         self.doc_user = User.objects.create_user(
#             username='dr_test',
#             password='Password123!',
#             first_name='Rashidul',
#             last_name='Hasan'
#         )
#         self.doc_profile = NaimulProfile.objects.create(
#             user=self.doc_user,
#             role='Surgeon',
#             specialty='Cataract',
#             assigned_ot_room='OT-1',
#             surgeon_display_name='Dr. Rashidul Hasan',
#             license_number='BMDC-DOC-1234'
#         )
#         self.staff_user = User.objects.create_user(
#             username='staff_test',
#             password='Password123!',
#             first_name='OT',
#             last_name='Nurse'
#         )
#         self.staff_profile = NaimulProfile.objects.create(
#             user=self.staff_user,
#             role='OT Nurse',
#             specialty='Cataract',
#             assigned_ot_room='OT-1',
#             surgeon_display_name='Nurse Test',
#             license_number='NURSE-1234'
#         )
#         self.patient = SurgeryRecord.objects.create(
#             date=date.today(),
#             patient_name='Karim Rahman',
#             patient_age=58,
#             patient_gender='Male',
#             eye='RE',
#             surgery_type='Cataract',
#             surgeon_name='Dr. Rashidul Hasan',
#             ot_room='OT-1',
#             ot_slot='Slot 1 (08:30 - 10:00 AM)',
#             outcome='Successful',
#             medical_history='Mild hypertension controlled. Pre-op IOP 16 mmHg.',
#             notes='Clear corneal incision phacoemulsification with foldable IOL.'
#         )

#     def test_doctor_ui_has_patient_load_search_box_and_modal(self):
#         self.client.login(username='dr_test', password='Password123!')
#         response = self.client.get(reverse('users_naimul:profile'))
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
#         self.assertIn("switchClinicalTab('patient-load')", content)
#         self.assertIn('<span>Patient Load</span>', content)
#         self.assertIn('id="pane-patient-load"', content)
#         self.assertIn('id="patientLoadSearchSection"', content)
#         self.assertIn('id="patientLoadMRNInput"', content)
#         self.assertIn('id="patientLoadMRNSearchBtn"', content)
#         self.assertIn('id="patientInfoModal"', content)
#         self.assertIn('id="btnConfirmOpenPatient"', content)
#         self.assertIn('Confirm &amp; Open', content)
#         self.assertIn('id="patientPrescriptionWorkspace"', content)
#         self.assertIn('id="prescriptionPrintArea"', content)

#     def test_static_files_separation(self):
#         self.client.login(username='dr_test', password='Password123!')
#         response = self.client.get(reverse('users_naimul:profile'))
#         self.assertEqual(response.status_code, 200)
#         content = response.content.decode('utf-8')
#         self.assertIn('users_naimul/css/profile.css', content)
#         self.assertIn('users_naimul/js/profile.js', content)

#     def test_patient_lookup_api_by_mrn(self):
#         self.client.login(username='dr_test', password='Password123!')
#         url = f"{reverse('users_naimul:patient_lookup_api')}?mrn={self.patient.patient_mrn}"
#         res = self.client.get(url)
#         self.assertEqual(res.status_code, 200)
#         data = res.json()
#         self.assertTrue(data.get('success'))
#         pat = data['patient']
#         self.assertEqual(pat['mrn'], self.patient.patient_mrn)
#         self.assertEqual(pat['name'], 'Karim Rahman')
#         self.assertEqual(pat['age'], 58)
#         self.assertEqual(pat['gender'], 'Male')
#         self.assertEqual(pat['surgery_type'], 'Cataract')

#     def test_patient_lookup_api_not_found(self):
#         self.client.login(username='dr_test', password='Password123!')
#         url = f"{reverse('users_naimul:patient_lookup_api')}?mrn=NONEXISTENT_MRN"
#         res = self.client.get(url)
#         self.assertEqual(res.status_code, 404)
#         data = res.json()
#         self.assertFalse(data.get('success'))
#         self.assertIn('No patient found', data.get('error', ''))

#     def test_patient_lookup_api_empty_mrn(self):
#         self.client.login(username='dr_test', password='Password123!')
#         url = f"{reverse('users_naimul:patient_lookup_api')}?mrn="
#         res = self.client.get(url)
#         self.assertEqual(res.status_code, 400)
#         data = res.json()
#         self.assertFalse(data.get('success'))

#     def test_patient_lookup_api_fallback_to_prescription(self):
#         self.client.login(username='dr_test', password='Password123!')
#         rx = Prescription.objects.create(
#             patient_mrn='RX_ONLY_001',
#             patient_name='Outpatient Sara',
#             patient_age=32,
#             patient_gender='Female',
#             eye='LE',
#             diagnosis='Allergic Conjunctivitis',
#             prescribing_doctor=self.doc_profile.get_surgeon_display_name(),
#             medications_json=json.dumps([{'drug': 'Olopatadine 0.1%'}])
#         )
#         url = f"{reverse('users_naimul:patient_lookup_api')}?mrn=RX_ONLY_001"
#         res = self.client.get(url)
#         self.assertEqual(res.status_code, 200)
#         data = res.json()
#         self.assertTrue(data.get('success'))
#         self.assertEqual(data['patient']['name'], 'Outpatient Sara')

#     def test_staff_cannot_access_patient_lookup_api(self):
#         self.client.login(username='staff_test', password='Password123!')
#         url = f"{reverse('users_naimul:patient_lookup_api')}?mrn={self.patient.patient_mrn}"
#         res = self.client.get(url)
#         self.assertEqual(res.status_code, 403)

#     def test_staff_cannot_access_prescription_api(self):
#         self.client.login(username='staff_test', password='Password123!')
#         response = self.client.get(reverse('users_naimul:prescription_api'))
#         self.assertEqual(response.status_code, 403)
#         data = response.json()
#         self.assertFalse(data.get('success', True))

#     def test_staff_cannot_save_prescription(self):
#         self.client.login(username='staff_test', password='Password123!')
#         payload = {
#             'save_prescription': '1',
#             'patient_mrn': self.patient.patient_mrn,
#             'patient_name': self.patient.patient_name,
#             'diagnosis': 'Post-op examination',
#             'medications_json': json.dumps([{'drug': 'Moxifloxacin', 'dosage': '1 drop', 'frequency': '4x daily', 'duration': '7 days'}])
#         }
#         response = self.client.post(reverse('users_naimul:profile'), payload)
#         self.assertEqual(response.status_code, 403)
#         data = response.json()
#         self.assertFalse(data.get('success', True))

#     def test_doctor_can_create_prescription_with_validation(self):
#         self.client.login(username='dr_test', password='Password123!')
#         bad_payload = {
#             'save_prescription': '1',
#             'patient_mrn': self.patient.patient_mrn,
#             'patient_name': self.patient.patient_name,
#             'diagnosis': '',
#             'medications_json': json.dumps([{'drug': 'Moxifloxacin'}])
#         }
#         res = self.client.post(reverse('users_naimul:profile'), bad_payload)
#         self.assertEqual(res.status_code, 400)

#         bad_payload_meds = {
#             'save_prescription': '1',
#             'patient_mrn': self.patient.patient_mrn,
#             'patient_name': self.patient.patient_name,
#             'diagnosis': 'Post-op review',
#             'medications_json': json.dumps([])
#         }
#         res2 = self.client.post(reverse('users_naimul:profile'), bad_payload_meds)
#         self.assertEqual(res2.status_code, 400)

#         meds = [
#             {'drug': 'Moxifloxacin 0.5%', 'dosage': '1 drop', 'frequency': '4 times daily', 'duration': '7 days'},
#             {'drug': 'Prednisolone Acetate 1%', 'dosage': '1 drop', 'frequency': '6 times daily', 'duration': '14 days'}
#         ]
#         valid_payload = {
#             'save_prescription': '1',
#             'patient_mrn': self.patient.patient_mrn,
#             'patient_name': self.patient.patient_name,
#             'patient_age': '58',
#             'patient_gender': 'Male',
#             'eye': 'RE',
#             'diagnosis': 'Post-phacoemulsification day 1 review',
#             'notes': 'Keep eye shield on at night. Do not rub eye.',
#             'medications_json': json.dumps(meds)
#         }
#         res3 = self.client.post(reverse('users_naimul:profile'), valid_payload)
#         self.assertEqual(res3.status_code, 200)
#         data = res3.json()
#         self.assertTrue(data['success'])
#         self.assertIn('prescription_id', data)

#         rx = Prescription.objects.get(id=data['prescription_id'])
#         self.assertEqual(rx.patient_name, 'Karim Rahman')
#         self.assertEqual(rx.diagnosis, 'Post-phacoemulsification day 1 review')
#         self.assertEqual(len(rx.medications), 2)
#         self.assertEqual(rx.medications[0]['drug'], 'Moxifloxacin 0.5%')

#     def test_doctor_can_update_prescription(self):
#         self.client.login(username='dr_test', password='Password123!')
#         rx = Prescription.objects.create(
#             patient_mrn=self.patient.patient_mrn,
#             patient_name=self.patient.patient_name,
#             patient_age=58,
#             patient_gender='Male',
#             eye='RE',
#             diagnosis='Initial diagnosis',
#             prescribing_doctor=self.doc_profile.get_surgeon_display_name(),
#             medications_json=json.dumps([{'drug': 'Drug A'}])
#         )

#         update_payload = {
#             'save_prescription': '1',
#             'prescription_id': str(rx.id),
#             'patient_mrn': self.patient.patient_mrn,
#             'patient_name': self.patient.patient_name,
#             'patient_age': '58',
#             'patient_gender': 'Male',
#             'eye': 'RE',
#             'diagnosis': 'Updated clinical impression: corneal edema resolved',
#             'notes': 'Taper drops over next 2 weeks.',
#             'medications_json': json.dumps([
#                 {'drug': 'Prednisolone Acetate 1%', 'dosage': '1 drop', 'frequency': '3 times daily', 'duration': '7 days'}
#             ])
#         }
#         res = self.client.post(reverse('users_naimul:profile'), update_payload)
#         self.assertEqual(res.status_code, 200)
#         data = res.json()
#         self.assertTrue(data['success'])

#         rx.refresh_from_db()
#         self.assertEqual(rx.diagnosis, 'Updated clinical impression: corneal edema resolved')
#         self.assertEqual(len(rx.medications), 1)
#         self.assertEqual(rx.medications[0]['drug'], 'Prednisolone Acetate 1%')

#     def test_prescription_api_filtering(self):
#         self.client.login(username='dr_test', password='Password123!')
#         rx1 = Prescription.objects.create(
#             patient_mrn=self.patient.patient_mrn,
#             patient_name=self.patient.patient_name,
#             patient_age=58,
#             patient_gender='Male',
#             diagnosis='Rx 1',
#             prescribing_doctor=self.doc_profile.get_surgeon_display_name(),
#             medications_json=json.dumps([{'drug': 'Drug 1'}])
#         )
#         rx2 = Prescription.objects.create(
#             patient_mrn='OTHER_MRN',
#             patient_name='Another Patient',
#             patient_age=40,
#             patient_gender='Female',
#             diagnosis='Rx 2',
#             prescribing_doctor=self.doc_profile.get_surgeon_display_name(),
#             medications_json=json.dumps([{'drug': 'Drug 2'}])
#         )

#         res_mrn = self.client.get(f"{reverse('users_naimul:prescription_api')}?patient_mrn={self.patient.patient_mrn}")
#         self.assertEqual(res_mrn.status_code, 200)
#         items = res_mrn.json()['prescriptions']
#         self.assertEqual(len(items), 1)
#         self.assertEqual(items[0]['id'], rx1.id)

#         res_id = self.client.get(f"{reverse('users_naimul:prescription_api')}?rx_id={rx2.id}")
#         self.assertEqual(res_id.status_code, 200)
#         items2 = res_id.json()['prescriptions']
#         self.assertEqual(len(items2), 1)
#         self.assertEqual(items2[0]['id'], rx2.id)

