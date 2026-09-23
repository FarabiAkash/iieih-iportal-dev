# 📋 Intern Task Guide: Adnan (Eye Pharmacy & Surgical Consumables Developer)

Welcome to the team, **Adnan**!

You are responsible for building the **Hospital Eye Pharmacy, Surgical Consumables, and Medication Dispensing** reporting module.

---

## 🎯 Your Assigned Apps & Git Branch

- **Git Branch:** `adnan`
- **Assigned User App:** `users_adnan/` (Your custom login, pharmacist / inventory officer role, and profile)
- **Assigned Reporting App:** `pharmacy_reports/` (Daily medicine dispensing, surgical IOL lens stock, near-expiry alerts)
- **Designated Templates:**
  - `users_adnan/templates/users_adnan/`
  - `pharmacy_reports/templates/pharmacy_reports/`

---

## 🏥 Real-World Context: What Does an Eye Hospital Need Here?

An eye hospital relies heavily on specialized pharmaceutical and surgical supplies:
- **Ophthalmic Medications:** 
  - Glaucoma pressure-lowering drops (Latanoprost, Timolol, Brimonidine, Dorzolamide).
  - Post-operative eye drops (Moxifloxacin antibiotic, Prednisolone steroid, NSAID drops).
  - Dry eye lubricants and diagnostic pupil-dilating drops (Tropicamide, Cyclopentolate).
- **Surgical Consumables for OT:**
  - Intraocular Lenses (IOL): Monofocal, Toric, Multifocal implants used in cataract surgeries.
  - OVD / Viscoelastics (Sodium Hyaluronate), Trypan Blue capsule staining dye, Ophthalmic Knives/Blades.
- **Critical Inventory Audits:**
  - Tracking stock levels across central store and satellite branch pharmacies.
  - Expiry date monitoring (preventing expired eye drops from being dispensed).
  - Reorder alerts for low-stock lenses or vital surgical supplies.

Your system gives hospital directors and chief pharmacists a daily breakdown of:
1. Which medicines were dispensed today and in what quantity.
2. The current stock and utilization of surgical IOL lenses.
3. Near-expiry batches and fast-depleting inventory alerts.

---

## 📝 Step-by-Step Task Breakdown

### Step 1: Get Started on Your Branch
Open your terminal in VS Code and run:
```powershell
# 1. Switch to your personal branch
git checkout adnan

# 2. Activate the virtual environment
.\venv\Scripts\activate

# 3. Verify server starts
python manage.py runserver
```
Visit `http://127.0.0.1:8000/adnan/login/` and `http://127.0.0.1:8000/pharmacy/`.

---

### Step 2: Build Your Custom User Profile (`users_adnan/`)

Hospital pharmacists and store managers need their own role and permissions.

1. **Open `users_adnan/models.py`**:
   - Create an `AdnanProfile` model linked to Django's standard `User` model (`OneToOneField`).
   - Add fields like:
     - `pharmacy_role`: Choices: Senior Pharmacist, OT Consumables Officer, Central Store Manager.
     - `dispensary_counter`: (e.g., "Counter 1 - OPD Pharmacy", "OT Supply Depot").
     - `license_number`: (Pharmacist registration ID).
2. **Open `users_adnan/views.py`**:
   - Implement your login view (`login_view`), logout view, and profile view.
   - Validate credentials and redirect logged-in users to `/pharmacy/`.
3. **Open `users_adnan/templates/users_adnan/login.html`**:
   - Style your login page with your own UI design (CSS, Bootstrap, or Tailwind CDN).
   - Use a clean medical pharmacy / inventory theme.

---

### Step 3: Build the Pharmacy & Consumables Models (`pharmacy_reports/`)

1. **Open `pharmacy_reports/models.py`**:
   Create two main models:
   - **`MedicineDispensingLog`**:
     - `date`: `DateField`
     - `hospital_branch`: `CharField` (e.g. "Main Hospital Dhaka", "Chittagong Center")
     - `patient_mrn`: `CharField` (Patient Registration No.)
     - `medicine_name`: `CharField` (e.g., "Moxifloxacin 0.5% Drops", "Latanoprost 0.005%", "Tears Naturale")
     - `category`: Choices: Anti-Glaucoma, Antibiotic, Steroid, Lubricant, Surgical Consumable
     - `quantity_dispensed`: `PositiveIntegerField`
     - `batch_number`: `CharField`
     - `unit_price`: `DecimalField(max_digits=8, decimal_places=2)`
   - **`SurgicalConsumableStock`**:
     - `item_name`: `CharField` (e.g., "Foldable Hydrophobic IOL Lens", "Healon Viscoelastic 1ml", "Crescent Blade 2.2mm")
     - `subspecialty`: Choices: Cataract, Vitreo-Retina, Glaucoma, Cornea
     - `current_quantity`: `PositiveIntegerField`
     - `reorder_threshold`: `PositiveIntegerField` (alert when stock drops below this number)
     - `expiry_date`: `DateField`

2. **Register in `pharmacy_reports/admin.py`**:
   - Register your models so you can insert test medicines and stock in Django Admin (`http://127.0.0.1:8000/admin/`).

---

### Step 4: Create Views & Design Templates (`pharmacy_reports/`)

1. **Open `pharmacy_reports/views.py`**:
   - Query dispensing logs: `MedicineDispensingLog.objects.all()`
   - Add filtering (by category, branch, or date).
   - Use Django aggregates (`from django.db.models import Sum`) to calculate:
     - Total units dispensed today
     - Low-stock consumable alerts (`current_quantity <= reorder_threshold`)
     - Near-expiry item count
   - Pass calculations to your template context.
2. **Design your templates in `pharmacy_reports/templates/pharmacy_reports/`**:
   - Create cards for "Total Medicines Dispensed", "Low Stock Alerts", and "OT Lens Inventory".
   - Design a table showing dispensing transactions and stock levels.
   - You have complete freedom to choose styles, colors, badges, and layout!

---

### Step 5: Test & Make Migrations

Whenever you modify `models.py`, run:
```powershell
python manage.py makemigrations
python manage.py migrate
```

Verify in your browser:
- `http://127.0.0.1:8000/adnan/login/`
- `http://127.0.0.1:8000/pharmacy/`

---

### Step 6: Commit and Push Your Work

**Golden Rule:** Always work on your own branch `adnan`. Do not commit directly to `dev` or `main`.

```powershell
# Check changed files
git status

# Add only your app files
git add users_adnan/ pharmacy_reports/

# Commit with a clear message
git commit -m "feat(pharmacy): created MedicineDispensingLog model and styled report view"

# Push to your remote branch
git push origin adnan
```

After pushing, open a Pull Request (PR) to merge `adnan` into `dev`. 
**Subhendu (QA)** will run automated tests on `dev` and report any bugs back to you!

