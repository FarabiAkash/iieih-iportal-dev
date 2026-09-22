# 📋 Intern Task Guide: Naimul (Surgical & Clinical Reports Developer)

Welcome to the team, **Naimul**! 

You are responsible for building the **Eye Surgeries, OT (Operation Theatre), and Diagnostic Procedures** module for the hospital portal.

---

## 🎯 Your Assigned Apps & Git Branch

- **Git Branch:** `naimul`
- **Assigned User App:** `users_naimul/` (Your custom login, surgical staff role, and profile)
- **Assigned Reporting App:** `surgeries_procedures/` (Surgical records, OT log, diagnostic tests)
- **Designated Templates:**
  - `users_naimul/templates/users_naimul/`
  - `surgeries_procedures/templates/surgeries_procedures/`

---

## 🏥 Real-World Context: What Does an Eye Hospital Need Here?

An eye hospital performs hundreds of specialized micro-surgeries every week:
- **Cataract Surgeries:** Phacoemulsification with Foldable IOL, SICS (Small Incision Cataract Surgery).
- **Subspecialty Surgeries:** Vitreo-Retinal (PPV), Glaucoma (Trabeculectomy), Cornea (Keratoplasty/Corneal Graft), Pediatric Strabismus (Squint), Oculoplasty (DCR).
- **Ocular Diagnostics:** OCT (Macula & Glaucoma), Humphrey Visual Field (Perimetry), Fundus Photography / FFA, B-Scan Ultrasound.

Your system helps surgeons and OT supervisors track:
1. Which surgeries were performed today, by which doctor, in which OT room, and for which eye (Left/Right).
2. Any surgical complications or cases requiring extended observation.
3. How many diagnostic scans (OCT, Perimetry) were conducted.

---

## 📝 Step-by-Step Task Breakdown

### Step 1: Get Started on Your Branch
Open your terminal in VS Code and run:
```powershell
# 1. Switch to your personal branch
git checkout naimul

# 2. Activate the virtual environment
.\venv\Scripts\activate

# 3. Verify server starts
python manage.py runserver
```
Visit `http://127.0.0.1:8000/naimul/login/` and `http://127.0.0.1:8000/surgeries/`.

---

### Step 2: Build Your Custom User Profile (`users_naimul/`)

Doctors and OT nurses need their own user experience.

1. **Open `users_naimul/models.py`**:
   - Create a `NaimulProfile` model linked to Django's standard `User` model (`OneToOneField`).
   - Add fields like:
     - `specialty`: (e.g., Cataract, Retina, Glaucoma, Cornea, Pediatric).
     - `assigned_ot_room`: (e.g., OT-1, OT-2, Laser Suite).
     - `surgeon_code` or `license_number`.
2. **Open `users_naimul/views.py`**:
   - Implement your login view (`login_view`), logout view, or profile view.
   - Validate credentials and redirect logged-in users to `/surgeries/`.
3. **Open `users_naimul/templates/users_naimul/login.html`**:
   - Style your login page with your own UI design (CSS, Bootstrap, or Tailwind CDN).
   - Include a professional surgical/clinical hospital theme.

---

### Step 3: Build the Surgery & Diagnostic Models (`surgeries_procedures/`)

1. **Open `surgeries_procedures/models.py`**:
   Create two main models:
   - **`SurgeryRecord`**:
     - `date`: `DateField`
     - `patient_mrn`: `CharField` (Hospital registration number)
     - `patient_name`: `CharField`
     - `eye`: Choices: Right Eye (`OD`), Left Eye (`OS`), Both Eyes (`OU`)
     - `surgery_type`: Choices: Cataract Phaco, SICS, Vitrectomy, Trabeculectomy, Cornea Transplant, Squint, etc.
     - `surgeon_name`: `CharField`
     - `ot_room`: `CharField` (e.g. "OT-1", "OT-3")
     - `outcome`: Choices: Successful, Complication, Under Observation
     - `notes`: `TextField` (optional)
   - **`DiagnosticProcedure`**:
     - `date`: `DateField`
     - `patient_mrn`: `CharField`
     - `procedure_name`: Choices: OCT Macula, OCT RNFL, Visual Field (Perimetry), B-Scan, FFA
     - `eye`: OD, OS, OU
     - `technician_name`: `CharField`
     - `findings_summary`: `TextField`

2. **Register in `surgeries_procedures/admin.py`**:
   - Register both models so you can add sample data from Django Admin (`http://127.0.0.1:8000/admin/`).

---

### Step 4: Create Views & Design Templates (`surgeries_procedures/`)

1. **Open `surgeries_procedures/views.py`**:
   - Query the surgery records: `SurgeryRecord.objects.all()`
   - Add simple filtering (filter by date or by surgery type from `request.GET`).
   - Calculate summary stats (e.g., total surgeries performed, count of Phaco vs. Retina).
   - Pass this data to the template context.
2. **Design your templates in `surgeries_procedures/templates/surgeries_procedures/`**:
   - Create a clean table showing today's surgery list.
   - Add KPI cards at the top (e.g., "Total Surgeries Today", "OT Utilization", "Success Rate").
   - You have full creative freedom over colors, typography, tables, and charts!

---

### Step 5: Test & Make Migrations

Every time you change `models.py`, run:
```powershell
python manage.py makemigrations
python manage.py migrate
```

Verify your pages in the browser:
- `http://127.0.0.1:8000/naimul/login/`
- `http://127.0.0.1:8000/surgeries/`

---

### Step 6: Commit and Push Your Work

**Golden Rule:** Always work on your own branch `naimul`. Do not commit directly to `dev` or `main`.

```powershell
# Check which files you changed
git status

# Add only your app files
git add users_naimul/ surgeries_procedures/

# Commit with a clear description
git commit -m "feat(surgeries): added SurgeryRecord model and styled report template"

# Push to your remote branch
git push origin naimul
```

After pushing, open a Pull Request (PR) to merge `naimul` into `dev`. 
**Subhendu (QA)** will test your code in `dev` and notify you if anything needs adjusting!
