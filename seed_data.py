import os
import django
import random
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iieih_portal.settings')
django.setup()

from pharmacy_reports.models import MedicineDispensingLog, SurgicalConsumableStock

medicines = [
    ("Moxifloxacin 0.5% Drops", "antibiotic"),
    ("Ciprofloxacin 0.3% Eye Drops", "antibiotic"),
    ("Tobramycin 0.3% Drops", "antibiotic"),
    ("Ofloxacin 0.3% Eye Drops", "antibiotic"),
    ("Latanoprost 0.005% Drops", "anti_glaucoma"),
    ("Timolol 0.5% Eye Drops", "anti_glaucoma"),
    ("Brimonidine 0.2% Drops", "anti_glaucoma"),
    ("Dorzolamide 2% Drops", "anti_glaucoma"),
    ("Prednisolone 1% Eye Drops", "steroid"),
    ("Dexamethasone 0.1% Drops", "steroid"),
    ("Fluorometholone 0.1% Drops", "steroid"),
    ("Tears Naturale Eye Drops", "lubricant"),
    ("Carboxymethylcellulose 0.5%", "lubricant"),
    ("Hypromellose 0.3% Drops", "lubricant"),
    ("Tropicamide 1% Drops", "lubricant"),
    ("Cyclopentolate 1% Drops", "lubricant"),
    ("Diclofenac 0.1% Eye Drops", "surgical_consumable"),
    ("Ketorolac 0.5% Eye Drops", "surgical_consumable"),
    ("Acetazolamide 250mg Tablets", "anti_glaucoma"),
    ("Mannitol 20% IV Infusion", "anti_glaucoma"),
]

branches = [
    "Main Hospital Dhaka",
    "Chittagong Center",
    "Sylhet Branch",
    "Rajshahi Outpost",
    "Mirpur Satellite Clinic",
]

batch_prefixes = ["BATCH", "LOT", "MFG", "RX"]

surgical_items = [
    ("Foldable Hydrophobic IOL Lens", "cataract"),
    ("Foldable Hydrophilic IOL Lens", "cataract"),
    ("Toric IOL Lens", "cataract"),
    ("Multifocal IOL Lens", "cataract"),
    ("Healon Viscoelastic 1ml", "cataract"),
    ("Sodium Hyaluronate 1.4% OVD", "cataract"),
    ("Sodium Hyaluronate 2.4% OVD", "vitreo_retina"),
    ("Trypan Blue 0.06% Dye", "cataract"),
    ("Crescent Blade 2.2mm", "cataract"),
    ("Keratome Blade 2.75mm", "cataract"),
    ("Silicon Oil 1000 cSt", "vitreo_retina"),
    ("Silicon Oil 5000 cSt", "vitreo_retina"),
    ("Perfluorocarbon Liquid 10ml", "vitreo_retina"),
    ("Polypropylene Suture 10-0", "cornea"),
    ("Nylon Suture 9-0", "cornea"),
    ("Mitomycin C 0.2mg", "glaucoma"),
    ("Ahmed Glaucoma Valve", "glaucoma"),
    ("Trabeculectomy Punch", "glaucoma"),
    ("Corneal Graft Tissue", "cornea"),
    ("Descemet Membrane Graft", "cornea"),
]

def random_date(start_days_ago=180, end_days_ago=0):
    delta = random.randint(end_days_ago, start_days_ago)
    return date.today() - timedelta(days=delta)

def random_expiry():
    days = random.choice([
        random.randint(-60, 0),
        random.randint(1, 90),
        random.randint(91, 730),
    ])
    return date.today() + timedelta(days=days)

def random_batch():
    prefix = random.choice(batch_prefixes)
    number = random.randint(1000, 9999)
    return f"{prefix}-{number}"

def random_mrn():
    return f"MRN-{random.randint(1000, 9999)}"

print("Seeding MedicineDispensingLog...")
logs = []
for _ in range(400):
    medicine, category = random.choice(medicines)
    logs.append(MedicineDispensingLog(
        date=random_date(),
        hospital_branch=random.choice(branches),
        patient_mrn=random_mrn(),
        medicine_name=medicine,
        category=category,
        quantity_dispensed=random.randint(1, 30),
        batch_number=random_batch(),
        unit_price=round(random.uniform(5.00, 500.00), 2),
    ))
MedicineDispensingLog.objects.bulk_create(logs)
print("✓ Created 400 medicine dispensing records.")

print("Seeding SurgicalConsumableStock...")
stocks = []
for _ in range(100):
    item, subspecialty = random.choice(surgical_items)
    current_qty = random.randint(0, 50)
    reorder = random.randint(5, 20)
    stocks.append(SurgicalConsumableStock(
        item_name=item,
        subspecialty=subspecialty,
        current_quantity=current_qty,
        reorder_threshold=reorder,
        expiry_date=random_expiry(),
    ))
SurgicalConsumableStock.objects.bulk_create(stocks)
print("✓ Created 100 surgical stock records.")

print("\nAll done! 500 records seeded successfully.")