# 📋 Intern Task Guide: Nusrat (OPD & IPD Operations Developer)

Welcome to the team, **Nusrat**!

You are responsible for building the **Outpatient (OPD) Census, Specialty Eye Clinics, and Inpatient (IPD) Bed Occupancy** module.

---

## 🎯 Your Assigned Apps & Git Branch

- **Git Branch:** `nusrat`
- **Assigned User App:** `users_nusrat/` (Your custom login, registration officer role, and desk profile)
- **Assigned Reporting App:** `opd_ipd_reports/` (Daily patient footfalls, specialty clinics, IPD admissions)
- **Designated Templates:**
  - `users_nusrat/templates/users_nusrat/`
  - `opd_ipd_reports/templates/opd_ipd_reports/`

---

## 🏥 Real-World Context: What Does an Eye Hospital Need Here?

An eye institute serves thousands of outpatients daily across different specialized units:
- **General OPD:** Vision checkups, primary eye care, visual acuity testing, auto-refraction.
- **Specialty Eye Clinics:** Cornea Clinic, Glaucoma Clinic, Retina Clinic, Pediatric Ophthalmology, Uveitis & Neuro-Ophthalmology, Ocular Trauma Emergency.
- **Inpatient Department (IPD):** Post-operative surgical beds, private cabins, daycare recovery beds for elderly cataract patients.
- **Multi-Branch Operations:** Central hospital (Dhaka) vs. branch centers (Chittagong, Jamalpur, Barisal).

Your system gives administrators a daily breakdown of:
1. How many patients visited each clinic today (New vs. Follow-up vs. Emergency).
2. How many refractions (spectacle prescriptions) were completed.
3. Bed occupancy rate in the surgical recovery wards.

---

## 📝 Step-by-Step Task Breakdown

### Step 1: Get Started on Your Branch
Open your terminal in VS Code and run:
```powershell
# 1. Switch to your personal branch
git checkout nusrat

# 2. Activate the virtual environment
.\venv\Scripts\activate

# 3. Verify server starts
python manage.py runserver
```
Visit `http://127.0.0.1:8000/nusrat/login/` and `http://127.0.0.1:8000/opd-ipd/`.

---

### Step 2: Build Your Custom User Profile (`users_nusrat/`)

OPD front-desk staff, triaging nurses, and ward managers need their own profile.

1. **Open `users_nusrat/models.py`**:
   - Create a `NusratProfile` model linked to Django's standard `User` model (`OneToOneField`).
   - Add fields like:
     - `assigned_counter`: (e.g., "Registration Counter 2 - Glaucoma Desk").
     - `shift`: Choices: Morning (8 AM - 2 PM), Evening (2 PM - 8 PM), Night Emergency.
     - `desk_extension`: Phone extension.
2. **Open `users_nusrat/views.py`**:
   - Implement your login view (`login_view`), logout view, and profile view.
   - Validate credentials and redirect logged-in users to `/opd-ipd/`.
3. **Open `users_nusrat/templates/users_nusrat/login.html`**:
   - Style your login page with your own UI design (CSS, Bootstrap, or Tailwind CDN).
   - Use a welcoming, clean patient-care/hospital theme.

---

### Step 3: Build the OPD & IPD Models (`opd_ipd_reports/`)

1. **Open `opd_ipd_reports/models.py`**:
   Create two main models:
   - **`DailyOPDCensus`**:
     - `date`: `DateField`
     - `hospital_branch`: `CharField` (e.g. "Main Hospital Dhaka", "Chittagong Branch", "Jamalpur Center")
     - `clinic_name`: Choices: General Eye OPD, Cornea Clinic, Retina Clinic, Glaucoma Clinic, Pediatric Clinic, Emergency Eye Care
     - `total_visits`: `PositiveIntegerField`
     - `new_patients`: `PositiveIntegerField`
     - `followup_patients`: `PositiveIntegerField`
     - `refractions_done`: `PositiveIntegerField` (Eye glass tests)
   - **`IPDBedOccupancy`**:
     - `date`: `DateField`
     - `hospital_branch`: `CharField`
     - `ward_type`: Choices: Male Surgical Ward, Female Surgical Ward, VIP Cabin, Daycare Cataract Recovery
     - `total_beds`: `PositiveIntegerField` (e.g., 30)
     - `occupied_beds`: `PositiveIntegerField`
     - `new_admissions`: `PositiveIntegerField`
     - `discharges_today`: `PositiveIntegerField`

2. **Register in `opd_ipd_reports/admin.py`**:
   - Register your models so you can populate test data via Django Admin (`http://127.0.0.1:8000/admin/`).

---

### Step 4: Create Views & Design Templates (`opd_ipd_reports/`)

1. **Open `opd_ipd_reports/views.py`**:
   - Query the census records: `DailyOPDCensus.objects.all()`
   - Add filtering (by branch or by clinic).
   - Use Django aggregates (`from django.db.models import Sum`) to calculate total patient visits and total new admissions.
   - Pass stats to your template context.
2. **Design your templates in `opd_ipd_reports/templates/opd_ipd_reports/`**:
   - Create cards displaying total consultations today, new registrations, and ward occupancy percentage.
   - Show a structured table or visual progress bars representing bed occupancy.
   - Customize styles, colors, and layout completely independently!

---

### Step 5: Test & Make Migrations

Whenever you update `models.py`, run:
```powershell
python manage.py makemigrations
python manage.py migrate
```

Verify in your browser:
- `http://127.0.0.1:8000/nusrat/login/`
- `http://127.0.0.1:8000/opd-ipd/`

---

### Step 6: Commit and Push Your Work

**Golden Rule:** Always work on your own branch `nusrat`. Do not commit directly to `dev` or `main`.

```powershell
# Check changed files
git status

# Add only your app files
git add users_nusrat/ opd_ipd_reports/

# Commit with a clear message
git commit -m "feat(opd): created DailyOPDCensus model and styled report view"

# Push to your remote branch
git push origin nusrat
```

After pushing, open a Pull Request (PR) to merge `nusrat` into `dev`. 
**Subhendu (QA)** will review and test your code on `dev`!
