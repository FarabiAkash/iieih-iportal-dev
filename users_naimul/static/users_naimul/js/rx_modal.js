// =============================================================================
// RX MEDICINE PICKER MODAL — Hospital EMR Extension
// Ispahani Islamia Eye Institute & Hospital
// Clinical standard:
// - Title: Rx Medicine Picker | Close
// - Subheader: Apply Eye to All [RE] [LE] [BE] | Load a Preset [v] [Save Preset]
// - Table Grid:
//   MEDICINE (Search + BRAND/GENERIC toggle) | EYE | DOSAGE | FREQUENCY & PATTERN |
//   DURATION | TIME (Day/Night) | MEAL | NOTES | ACTIONS (+ Add)
// - Added medicines table / Empty state with blue square-plus icon
// - Medicine Advice Card with catalog autocomplete & tags
// - Footer: Cancel | Save Rx
// =============================================================================

(function () {
    'use strict';

    // ── Extended Ophthalmic & General Medicines Database ──────────────────────
    const MEDICINES_DATABASE = [
        // Antibiotics / Antiseptics
        {
            brand: 'Moxicip 0.5% Eye Drops',
            generic: 'Moxifloxacin 0.5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '14 days',
            time: 'Day',
            meal: '',
            notes: 'Operated eye / Antibiotic'
        },
        {
            brand: 'Vigamox 0.5% Eye Drops',
            generic: 'Moxifloxacin 0.5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '14 days',
            time: 'Day',
            meal: '',
            notes: 'Broad spectrum fluoroquinolone'
        },
        {
            brand: 'Tobrex 0.3% Eye Drops',
            generic: 'Tobramycin 0.3%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '7 days',
            time: 'Day',
            meal: '',
            notes: 'Gentle aminoglycoside'
        },
        {
            brand: 'Tobrex Eye Ointment',
            generic: 'Tobramycin 0.3%',
            form: 'Ointment',
            dosage: '1 applic.',
            frequency: 'At bedtime',
            duration: '7 days',
            time: 'Night',
            meal: '',
            notes: 'Apply inside lower eyelid'
        },
        {
            brand: 'Ciprocin 0.3% Eye Drops',
            generic: 'Ciprofloxacin 0.3%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '7 days',
            time: 'Day',
            meal: '',
            notes: 'Corneal / conjunctival infection'
        },
        {
            brand: 'Tarivid 0.3% Eye Drops',
            generic: 'Ofloxacin 0.3%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '7 days',
            time: 'Day',
            meal: '',
            notes: 'Bacterial ocular infection'
        },
        {
            brand: 'Chloromycetin 0.5% Drops',
            generic: 'Chloramphenicol 0.5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '7 days',
            time: 'Day',
            meal: '',
            notes: 'Bacterial surface infection'
        },
        {
            brand: 'Zymaxid 0.5% Eye Drops',
            generic: 'Gatifloxacin 0.5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '7 days',
            time: 'Day',
            meal: '',
            notes: '4th gen fluoroquinolone'
        },
        {
            brand: 'AzaSite 1% Eye Drops',
            generic: 'Azithromycin 1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily',
            duration: '7 days',
            time: 'Day',
            meal: '',
            notes: 'Blepharitis & conjunctivitis'
        },

        // Steroids & Anti-inflammatory
        {
            brand: 'Pred Forte 1% Eye Drops',
            generic: 'Prednisolone Acetate 1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '6 times daily (Taper weekly)',
            duration: '28 days',
            time: 'Day',
            meal: '',
            notes: 'Shake bottle well before instillation'
        },
        {
            brand: 'Maxidex 0.1% Eye Drops',
            generic: 'Dexamethasone 0.1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '14 days',
            time: 'Day',
            meal: '',
            notes: 'Anti-inflammatory steroid'
        },
        {
            brand: 'FML Liquifilm 0.1%',
            generic: 'Fluorometholone 0.1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '3 times daily',
            duration: '14 days',
            time: 'Day',
            meal: '',
            notes: 'Surface anti-inflammatory steroid'
        },
        {
            brand: 'Lotemax 0.5% Eye Drops',
            generic: 'Loteprednol Etabonate 0.5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '14 days',
            time: 'Day',
            meal: '',
            notes: 'Site-specific ester steroid'
        },
        {
            brand: 'Durezol 0.05% Eye Drops',
            generic: 'Difluprednate 0.05%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '14 days',
            time: 'Day',
            meal: '',
            notes: 'Post-surgical ocular inflammation'
        },

        // Combination (Antibiotic + Steroid)
        {
            brand: 'Tobradex Eye Drops',
            generic: 'Tobramycin 0.3% + Dexamethasone 0.1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '14 days',
            time: 'Day',
            meal: '',
            notes: 'Shake well, anti-infective & steroid'
        },
        {
            brand: 'Moxicip-D Eye Drops',
            generic: 'Moxifloxacin 0.5% + Dexamethasone 0.1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '14 days',
            time: 'Day',
            meal: '',
            notes: 'Post-op cataract coverage'
        },
        {
            brand: 'Maxitrol Eye Drops',
            generic: 'Neomycin + Polymyxin B + Dexamethasone',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '7 days',
            time: 'Day',
            meal: '',
            notes: 'Shake well'
        },

        // NSAIDs
        {
            brand: 'Nevanac 0.1% Eye Drops',
            generic: 'Nepafenac 0.1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '3 times daily',
            duration: '1 month',
            time: 'Day',
            meal: '',
            notes: 'Post-op macular edema prevention'
        },
        {
            brand: 'Ilevro 0.3% Eye Drops',
            generic: 'Nepafenac 0.3%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '1 time daily',
            duration: '1 month',
            time: 'Day',
            meal: '',
            notes: 'Once daily post-op NSAID'
        },
        {
            brand: 'Acular 0.5% Eye Drops',
            generic: 'Ketorolac Tromethamine 0.5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '14 days',
            time: 'Day',
            meal: '',
            notes: 'Anti-inflammatory & pain relief'
        },
        {
            brand: 'BromSite 0.09% Eye Drops',
            generic: 'Bromfenac 0.09%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily',
            duration: '14 days',
            time: 'Day',
            meal: '',
            notes: 'Post-cataract NSAID'
        },

        // Anti-Glaucoma (IOP Lowering)
        {
            brand: 'Timoptic 0.5% Eye Drops',
            generic: 'Timolol Maleate 0.5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily (1-0-1)',
            duration: 'Continue',
            time: 'Day, Night',
            meal: '',
            notes: 'Morning and evening'
        },
        {
            brand: 'Xalatan 0.005% Eye Drops',
            generic: 'Latanoprost 0.005%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '1 time at night (0-0-1)',
            duration: 'Continue',
            time: 'Night',
            meal: '',
            notes: 'Instill once at bedtime'
        },
        {
            brand: 'Alphagan 0.2% Eye Drops',
            generic: 'Brimonidine Tartrate 0.2%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily (1-0-1)',
            duration: 'Continue',
            time: 'Day, Night',
            meal: '',
            notes: 'Alpha-2 agonist'
        },
        {
            brand: 'Trusopt 2% Eye Drops',
            generic: 'Dorzolamide 2%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '3 times daily',
            duration: 'Continue',
            time: 'Day',
            meal: '',
            notes: 'Carbonic anhydrase inhibitor'
        },
        {
            brand: 'Cosopt Eye Drops',
            generic: 'Timolol 0.5% + Dorzolamide 2%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily (1-0-1)',
            duration: 'Continue',
            time: 'Day, Night',
            meal: '',
            notes: 'Fixed combination anti-glaucoma'
        },
        {
            brand: 'Combigan Eye Drops',
            generic: 'Timolol 0.5% + Brimonidine 0.2%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily (1-0-1)',
            duration: 'Continue',
            time: 'Day, Night',
            meal: '',
            notes: 'Combination pressure lowering'
        },
        {
            brand: 'Travatan 0.004% Eye Drops',
            generic: 'Travoprost 0.004%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '1 time at night (0-0-1)',
            duration: 'Continue',
            time: 'Night',
            meal: '',
            notes: 'Prostaglandin analogue at bedtime'
        },
        {
            brand: 'Lumigan 0.03% Eye Drops',
            generic: 'Bimatoprost 0.03%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '1 time at night (0-0-1)',
            duration: 'Continue',
            time: 'Night',
            meal: '',
            notes: 'Prostamide bedtime drop'
        },
        {
            brand: 'Azopt 1% Eye Drops',
            generic: 'Brinzolamide 1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily (1-0-1)',
            duration: 'Continue',
            time: 'Day, Night',
            meal: '',
            notes: 'Shake well'
        },

        // Lubricants & Artificial Tears (Dry Eye)
        {
            brand: 'Refresh Tears 0.5% Drops',
            generic: 'Carboxymethylcellulose 0.5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '1 month',
            time: 'Day',
            meal: '',
            notes: 'Soothing lubricant eye drops'
        },
        {
            brand: 'Refresh Plus 0.5% (PF)',
            generic: 'Carboxymethylcellulose 0.5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '1 month',
            time: 'Day',
            meal: '',
            notes: 'Preservative-free single use'
        },
        {
            brand: 'Hylo-Comod 0.1% Eye Drops',
            generic: 'Sodium Hyaluronate 0.1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '3 times daily',
            duration: '1 month',
            time: 'Day',
            meal: '',
            notes: 'High hydration artificial tears'
        },
        {
            brand: 'Tears Naturale II Eye Drops',
            generic: 'Hydroxypropyl Methylcellulose (HPMC)',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '4 times daily',
            duration: '1 month',
            time: 'Day',
            meal: '',
            notes: 'Relief for dry irritated eyes'
        },
        {
            brand: 'Systane Ultra Eye Drops',
            generic: 'PEG 400 + Propylene Glycol',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '3 times daily',
            duration: '1 month',
            time: 'Day',
            meal: '',
            notes: 'Extended tear protection'
        },
        {
            brand: 'Liposic Eye Gel 0.2%',
            generic: 'Carbomer 0.2%',
            form: 'Gel',
            dosage: '1 applic.',
            frequency: 'At bedtime',
            duration: '1 month',
            time: 'Night',
            meal: '',
            notes: 'Thick lubricating gel for night lag'
        },
        {
            brand: 'Restasis 0.05% Emulsion',
            generic: 'Cyclosporine 0.05%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily (1-0-1)',
            duration: '3 months',
            time: 'Day, Night',
            meal: '',
            notes: 'Invert vial several times before use'
        },

        // Antiallergic & Mast Cell Stabilizers
        {
            brand: 'Patanol 0.1% Eye Drops',
            generic: 'Olopatadine 0.1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily (1-0-1)',
            duration: '1 month',
            time: 'Day, Night',
            meal: '',
            notes: 'Allergic conjunctivitis / Itching'
        },
        {
            brand: 'Pataday 0.2% Eye Drops',
            generic: 'Olopatadine 0.2%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '1 time daily',
            duration: '1 month',
            time: 'Day',
            meal: '',
            notes: 'Once daily allergic eye relief'
        },
        {
            brand: 'Zaditen 0.025% Eye Drops',
            generic: 'Ketotifen Fumarate 0.025%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily (1-0-1)',
            duration: '1 month',
            time: 'Day, Night',
            meal: '',
            notes: 'Antihistamine & mast cell stabilizer'
        },
        {
            brand: 'Bepreve 1.5% Eye Drops',
            generic: 'Bepotastine Besilate 1.5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily (1-0-1)',
            duration: '1 month',
            time: 'Day, Night',
            meal: '',
            notes: 'Rapid relief for ocular pruritus'
        },

        // Mydriatics & Cycloplegics
        {
            brand: 'Mydriacyl 1% Eye Drops',
            generic: 'Tropicamide 1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: 'Diagnostic / SOS',
            duration: 'Single use',
            time: 'Day',
            meal: '',
            notes: 'Pupil dilation for fundus exam'
        },
        {
            brand: 'Appamide-Plus Eye Drops',
            generic: 'Tropicamide 0.8% + Phenylephrine 5%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: 'Pre-op / Diagnostic',
            duration: 'Single use',
            time: 'Day',
            meal: '',
            notes: 'Rapid dilation for cataract / fundus'
        },
        {
            brand: 'Homide 2% Eye Drops',
            generic: 'Homatropine Hydrobromide 2%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '2 times daily',
            duration: '3 days',
            time: 'Day',
            meal: '',
            notes: 'Relief of ciliary spasm & uveitis'
        },
        {
            brand: 'Atropine 1% Eye Drops',
            generic: 'Atropine Sulphate 1%',
            form: 'Drops',
            dosage: '1 drop',
            frequency: '1 time daily',
            duration: '7 days',
            time: 'Night',
            meal: '',
            notes: 'Potent cycloplegic, press lacrimal sac'
        },

        // Oral / Systemic Medications
        {
            brand: 'Diamox 250mg Tablets',
            generic: 'Acetazolamide 250mg',
            form: 'Tablets',
            dosage: '1 tab',
            frequency: '2 times daily (1-0-1)',
            duration: '3 days',
            time: 'Day, Night',
            meal: 'After meal',
            notes: 'Acute IOP reduction, monitor potassium'
        },
        {
            brand: 'Ciprocin 500mg Tablets',
            generic: 'Ciprofloxacin 500mg',
            form: 'Tablets',
            dosage: '1 tab',
            frequency: '2 times daily (1-0-1)',
            duration: '5 days',
            time: 'Day, Night',
            meal: 'After meal',
            notes: 'Systemic antibiotic coverage'
        },
        {
            brand: 'Kilbac 500mg Tablets',
            generic: 'Cefuroxime Axetil 500mg',
            form: 'Tablets',
            dosage: '1 tab',
            frequency: '2 times daily (1-0-1)',
            duration: '5 days',
            time: 'Day, Night',
            meal: 'After meal',
            notes: 'Post-op antibiotic prophylaxis'
        },
        {
            brand: 'Napa 500mg Tablets',
            generic: 'Paracetamol 500mg',
            form: 'Tablets',
            dosage: '1 tab',
            frequency: '3 times daily (SOS)',
            duration: '3 days',
            time: 'Day',
            meal: 'After meal',
            notes: 'For ocular pain and headache'
        },
        {
            brand: 'I-Site Capsules',
            generic: 'Lutein + Zeaxanthin + Antioxidants',
            form: 'Capsules',
            dosage: '1 cap',
            frequency: '1 time daily',
            duration: '3 months',
            time: 'Day',
            meal: 'After meal',
            notes: 'Macular health AREDS-2 formula'
        }
    ];

    // ── Medicine Advice Catalog ───────────────────────────────────────────────
    const ADVICE_CATALOG = [
        'Maintain at least 5 minutes interval between two different eye drops.',
        'Do not rub, press, or touch the operated eye.',
        'Wash hands thoroughly with soap and water before applying eye drops.',
        'Do not touch the dropper tip to eyelids, eyelashes, or fingers.',
        'Shake bottle well before instilling suspension eye drops.',
        'Wear protective dark sunglasses when exposed to bright sunlight or outdoors.',
        'Avoid splashing tap water or soap directly into eyes for 2 weeks.',
        'Do not stop glaucoma medication without consulting your ophthalmologist.',
        'Apply eye ointment inside the lower conjunctival sac at bedtime.',
        'Keep eye drops in a cool, dry place away from direct heat (do not freeze).',
        'Discard opened eye drop bottle after 30 days of first opening.',
        'Report immediately to emergency if severe eye pain, sudden redness, or vision loss occurs.',
        'Take 20-20-20 screen breaks: every 20 minutes, look 20 feet away for 20 seconds.',
        'Avoid heavy lifting, bending down, or vigorous physical exercise for 2 weeks.',
        'Do not wear contact lenses while using medicated eye drops unless instructed.',
        'Press gently on inner corner of eye (lacrimal sac) for 1 minute after drop instillation.'
    ];

    // ── Pre-configured Clinical Presets ───────────────────────────────────────
    const CLINICAL_PRESETS = {
        cataract_postop: {
            name: 'Post-op Cataract Care',
            meds: [
                {
                    drug: 'Moxicip 0.5% Eye Drops',
                    eye: 'RE',
                    dosage: '1 drop',
                    frequency: '4 times daily',
                    duration: '14 days',
                    time: 'Day',
                    meal: '',
                    notes: 'Operated eye'
                },
                {
                    drug: 'Pred Forte 1% Eye Drops',
                    eye: 'RE',
                    dosage: '1 drop',
                    frequency: '6 times daily (Taper weekly)',
                    duration: '28 days',
                    time: 'Day',
                    meal: '',
                    notes: 'Shake well, taper weekly'
                },
                {
                    drug: 'Refresh Tears 0.5% Drops',
                    eye: 'BE',
                    dosage: '1 drop',
                    frequency: '4 times daily',
                    duration: '1 month',
                    time: 'Day',
                    meal: '',
                    notes: 'Comfort & lubrication'
                }
            ],
            advice: [
                'Maintain at least 5 minutes interval between two different eye drops.',
                'Do not rub, press, or touch the operated eye.',
                'Wear protective dark sunglasses when exposed to bright sunlight or outdoors.',
                'Avoid splashing tap water or soap directly into eyes for 2 weeks.'
            ]
        },
        conjunctivitis: {
            name: 'Acute Conjunctivitis',
            meds: [
                {
                    drug: 'Moxicip 0.5% Eye Drops',
                    eye: 'BE',
                    dosage: '1 drop',
                    frequency: '4 times daily',
                    duration: '7 days',
                    time: 'Day',
                    meal: '',
                    notes: 'Both eyes'
                },
                {
                    drug: 'Refresh Tears 0.5% Drops',
                    eye: 'BE',
                    dosage: '1 drop',
                    frequency: '4 times daily',
                    duration: '14 days',
                    time: 'Day',
                    meal: '',
                    notes: 'Comfort tears'
                }
            ],
            advice: [
                'Wash hands thoroughly with soap and water before applying eye drops.',
                'Do not rub, press, or touch the operated eye.',
                'Maintain at least 5 minutes interval between two different eye drops.'
            ]
        },
        glaucoma_standard: {
            name: 'Glaucoma Standard (POAG)',
            meds: [
                {
                    drug: 'Timoptic 0.5% Eye Drops',
                    eye: 'BE',
                    dosage: '1 drop',
                    frequency: '2 times daily (1-0-1)',
                    duration: 'Continue',
                    time: 'Day, Night',
                    meal: '',
                    notes: 'Morning and evening'
                },
                {
                    drug: 'Xalatan 0.005% Eye Drops',
                    eye: 'BE',
                    dosage: '1 drop',
                    frequency: '1 time at night (0-0-1)',
                    duration: 'Continue',
                    time: 'Night',
                    meal: '',
                    notes: 'Instill at bedtime'
                }
            ],
            advice: [
                'Do not stop glaucoma medication without consulting your ophthalmologist.',
                'Press gently on inner corner of eye (lacrimal sac) for 1 minute after drop instillation.'
            ]
        },
        dry_eye: {
            name: 'Dry Eye Syndrome (KCS)',
            meds: [
                {
                    drug: 'Refresh Tears 0.5% Drops',
                    eye: 'BE',
                    dosage: '1 drop',
                    frequency: '4 times daily',
                    duration: '1 month',
                    time: 'Day',
                    meal: '',
                    notes: 'Artificial tears'
                },
                {
                    brand: 'Hylo-Comod 0.1% Eye Drops',
                    drug: 'Hylo-Comod 0.1% Eye Drops',
                    eye: 'BE',
                    dosage: '1 drop',
                    frequency: '3 times daily',
                    duration: '1 month',
                    time: 'Day',
                    meal: '',
                    notes: 'High hydration'
                },
                {
                    drug: 'Liposic Eye Gel 0.2%',
                    eye: 'BE',
                    dosage: '1 applic.',
                    frequency: 'At bedtime',
                    duration: '1 month',
                    time: 'Night',
                    meal: '',
                    notes: 'Bedtime lubrication'
                }
            ],
            advice: [
                'Take 20-20-20 screen breaks: every 20 minutes, look 20 feet away for 20 seconds.',
                'Maintain at least 5 minutes interval between two different eye drops.'
            ]
        },
        corneal_trauma: {
            name: 'Corneal Trauma / Abrasion',
            meds: [
                {
                    drug: 'Moxicip 0.5% Eye Drops',
                    eye: 'RE',
                    dosage: '1 drop',
                    frequency: '4 times daily',
                    duration: '7 days',
                    time: 'Day',
                    meal: '',
                    notes: 'Prophylactic antibiotic'
                },
                {
                    drug: 'Homide 2% Eye Drops',
                    eye: 'RE',
                    dosage: '1 drop',
                    frequency: '2 times daily',
                    duration: '3 days',
                    time: 'Day',
                    meal: '',
                    notes: 'Relief of ciliary spasm'
                },
                {
                    drug: 'Refresh Tears 0.5% Drops',
                    eye: 'RE',
                    dosage: '1 drop',
                    frequency: '4 times daily',
                    duration: '14 days',
                    time: 'Day',
                    meal: '',
                    notes: 'Corneal epithelial healing'
                }
            ],
            advice: [
                'Do not rub, press, or touch the operated eye.',
                'Report immediately to emergency if severe eye pain, sudden redness, or vision loss occurs.'
            ]
        },
        allergic_eye: {
            name: 'Allergic Eye Disease',
            meds: [
                {
                    drug: 'Patanol 0.1% Eye Drops',
                    eye: 'BE',
                    dosage: '1 drop',
                    frequency: '2 times daily (1-0-1)',
                    duration: '1 month',
                    time: 'Day, Night',
                    meal: '',
                    notes: 'Antihistamine'
                },
                {
                    drug: 'FML Liquifilm 0.1%',
                    eye: 'BE',
                    dosage: '1 drop',
                    frequency: '3 times daily',
                    duration: '10 days',
                    time: 'Day',
                    meal: '',
                    notes: 'Mild surface steroid taper'
                },
                {
                    drug: 'Refresh Tears 0.5% Drops',
                    eye: 'BE',
                    dosage: '1 drop',
                    frequency: '4 times daily',
                    duration: '1 month',
                    time: 'Day',
                    meal: '',
                    notes: 'Comfort'
                }
            ],
            advice: [
                'Do not rub, press, or touch the operated eye.',
                'Wash hands thoroughly with soap and water before applying eye drops.'
            ]
        },
        uveitis_acute: {
            name: 'Anterior Uveitis',
            meds: [
                {
                    drug: 'Pred Forte 1% Eye Drops',
                    eye: 'RE',
                    dosage: '1 drop',
                    frequency: 'Every 2 hours (Taper weekly)',
                    duration: '21 days',
                    time: 'Day',
                    meal: '',
                    notes: 'Intensive topical steroid'
                },
                {
                    drug: 'Homide 2% Eye Drops',
                    eye: 'RE',
                    dosage: '1 drop',
                    frequency: '2 times daily (1-0-1)',
                    duration: '7 days',
                    time: 'Day, Night',
                    meal: '',
                    notes: 'Cycloplegia & prevent posterior synechiae'
                }
            ],
            advice: [
                'Shake bottle well before instilling suspension eye drops.',
                'Report immediately to emergency if severe eye pain, sudden redness, or vision loss occurs.'
            ]
        }
    };

    // ── Modal State ───────────────────────────────────────────────────────────
    let _modalMeds = [];
    let _modalAdvice = [];
    let _searchMode = 'brand'; // 'brand' | 'generic'
    let _timeState = { day: true, night: false };
    let _applyAllEye = 'BE';
    let _highlightedIndex = -1;
    let _customPresets = {};

    // ── Initialization ────────────────────────────────────────────────────────
    function initRxModal() {
        loadCustomPresets();
        populatePresetDropdown();
        bindModalEvents();
    }

    function loadCustomPresets() {
        try {
            const raw = localStorage.getItem('iieih_custom_rx_presets');
            if (raw) {
                _customPresets = JSON.parse(raw) || {};
            }
        } catch (e) {
            _customPresets = {};
        }
    }

    function saveCustomPresetsToStorage() {
        try {
            localStorage.setItem('iieih_custom_rx_presets', JSON.stringify(_customPresets));
        } catch (e) {
            console.error('Failed to save custom presets:', e);
        }
    }

    function populatePresetDropdown() {
        const select = document.getElementById('rxPresetSelect');
        if (!select) return;

        // Reset to default standard presets
        select.innerHTML = `
            <option value="">Load a Preset</option>
            <optgroup label="Standard Ophthalmology Protocols">
                <option value="cataract_postop">Post-op Cataract Care</option>
                <option value="conjunctivitis">Acute Conjunctivitis</option>
                <option value="glaucoma_standard">Glaucoma Standard (POAG)</option>
                <option value="dry_eye">Dry Eye Syndrome (KCS)</option>
                <option value="corneal_trauma">Corneal Trauma / Abrasion</option>
                <option value="allergic_eye">Allergic Eye Disease</option>
                <option value="uveitis_acute">Anterior Uveitis</option>
            </optgroup>
        `;

        // Append custom user presets if available
        const customKeys = Object.keys(_customPresets);
        if (customKeys.length > 0) {
            const group = document.createElement('optgroup');
            group.label = 'Custom Doctor Presets';
            customKeys.forEach(k => {
                const opt = document.createElement('option');
                opt.value = 'custom_' + k;
                opt.textContent = _customPresets[k].name || k;
                group.appendChild(opt);
            });
            select.appendChild(group);
        }
    }

    // ── Open & Close Functions ────────────────────────────────────────────────
    function openRxModal(show = true) {
        const modal = document.getElementById('rxMedicinePickerModal');
        if (!modal) return;

        if (!show) {
            closeRxModal();
            return;
        }

        // Initialize modal medications copy from global _currentMedications
        if (Array.isArray(window._currentMedications)) {
            _modalMeds = window._currentMedications.map(m => ({
                drug: m.drug || '',
                eye: m.eye || 'BE',
                dosage: m.dosage || '1 drop',
                frequency: m.frequency || '4x daily',
                duration: m.duration || '7 days',
                time: m.time || (m.instructions && m.instructions.toLowerCase().includes('bedtime') ? 'Night' : 'Day'),
                meal: m.meal || '',
                notes: m.notes || m.instructions || ''
            }));
        } else {
            _modalMeds = [];
        }

        // Initialize advice copy from rx_advice textarea
        _modalAdvice = [];
        const adviceEl = document.getElementById('rx_advice');
        if (adviceEl && adviceEl.value.trim()) {
            _modalAdvice = adviceEl.value.split('\n')
                .map(s => s.trim().replace(/^[-•*]\s*/, ''))
                .filter(Boolean);
        }

        // Set eye to patient's affected eye if present, else BE
        const patEye = (window._rxPatient && window._rxPatient.eye) || 'BE';
        _applyAllEye = patEye === 'OD' ? 'RE' : (patEye === 'OS' ? 'LE' : 'BE');
        updateApplyEyePillsUI(_applyAllEye);

        // Reset adder row inputs
        resetEntryRow();

        // Render added table and advice
        renderAddedTable();
        renderAdviceChips();

        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Focus search input
        setTimeout(() => {
            const input = document.getElementById('rxInputMedicine');
            if (input) input.focus();
        }, 120);
    }

    function closeRxModal() {
        const modal = document.getElementById('rxMedicinePickerModal');
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = '';
        hideMedDropdown();
        hideAdviceDropdown();
    }

    // ── Save Rx Modal ─────────────────────────────────────────────────────────
    function saveRxModal() {
        // Sync modal meds to global _currentMedications
        window._currentMedications = _modalMeds.map(m => ({
            drug: m.drug,
            eye: m.eye,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            time: m.time,
            meal: m.meal,
            instructions: m.notes || (m.time ? `${m.time}` : '')
        }));

        // Re-render main page medications
        if (typeof window.renderAllMedications === 'function') {
            window.renderAllMedications();
        }

        // Sync advice to main page rx_advice textarea
        if (_modalAdvice.length > 0) {
            const adviceEl = document.getElementById('rx_advice');
            if (adviceEl) {
                adviceEl.value = _modalAdvice.map(a => `• ${a}`).join('\n');
            }
        }

        closeRxModal();

        if (typeof window.showRxFeedback === 'function') {
            window.showRxFeedback('Prescription medications updated successfully.', 'success');
        }
    }

    // ── Search Mode (Brand / Generic) ─────────────────────────────────────────
    function setRxSearchMode(mode) {
        _searchMode = mode;
        const btnBrand = document.getElementById('rxBtnBrand');
        const btnGeneric = document.getElementById('rxBtnGeneric');
        const input = document.getElementById('rxInputMedicine');

        if (mode === 'brand') {
            btnBrand?.classList.add('active');
            btnGeneric?.classList.remove('active');
            if (input) input.placeholder = 'Search brand na...';
        } else {
            btnBrand?.classList.remove('active');
            btnGeneric?.classList.add('active');
            if (input) input.placeholder = 'Search generic na...';
        }

        if (input && input.value.trim()) {
            onRxMedicineInput(input.value);
        }
    }

    // ── Medicine Input & Dropdown ─────────────────────────────────────────────
    function onRxMedicineInput(query) {
        const dropdown = document.getElementById('rxMedDropdown');
        if (!dropdown) return;

        const q = (query || '').trim().toLowerCase();
        if (!q) {
            hideMedDropdown();
            return;
        }

        const filtered = MEDICINES_DATABASE.filter(item => {
            if (_searchMode === 'brand') {
                return item.brand.toLowerCase().includes(q) || item.generic.toLowerCase().includes(q);
            } else {
                return item.generic.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q);
            }
        });

        if (filtered.length === 0) {
            dropdown.innerHTML = `
                <div class="rx-med-item" style="cursor: default; color: #94a3b8; font-style: italic;">
                    No matching medicines found in catalog. Type custom name and click "+ Add".
                </div>
            `;
            dropdown.style.display = 'block';
            _highlightedIndex = -1;
            return;
        }

        dropdown.innerHTML = filtered.map((item, idx) => {
            const isBrandPrimary = _searchMode === 'brand';
            const primaryName = isBrandPrimary ? item.brand : item.generic;
            const secondaryName = isBrandPrimary ? item.generic : item.brand;
            const badgeClass = isBrandPrimary ? 'badge-brand' : 'badge-generic';
            const badgeLabel = isBrandPrimary ? 'Brand' : 'Generic';

            return `
                <div class="rx-med-item" data-idx="${idx}" onclick="window.selectRxMedicine(${idx})">
                    <div class="rx-med-item-top">
                        <span class="rx-med-item-name">${escapeHtml(primaryName)}</span>
                        <span class="rx-med-item-badge ${badgeClass}">${badgeLabel} &bull; ${escapeHtml(item.form)}</span>
                    </div>
                    <div class="rx-med-item-sub">${escapeHtml(secondaryName)} &bull; ${escapeHtml(item.dosage)} &bull; ${escapeHtml(item.frequency)}</div>
                </div>
            `;
        }).join('');

        dropdown.dataset.filtered = JSON.stringify(filtered);
        dropdown.style.display = 'block';
        _highlightedIndex = -1;
    }

    function onRxMedicineFocus() {
        const input = document.getElementById('rxInputMedicine');
        if (input && input.value.trim()) {
            onRxMedicineInput(input.value);
        }
    }

    function onRxMedicineKeydown(e) {
        const dropdown = document.getElementById('rxMedDropdown');
        if (!dropdown || dropdown.style.display === 'none') {
            if (e.key === 'Enter') {
                e.preventDefault();
                addRxMedicineFromRow();
            }
            return;
        }

        const items = dropdown.querySelectorAll('.rx-med-item[data-idx]');
        if (!items || items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            _highlightedIndex = Math.min(_highlightedIndex + 1, items.length - 1);
            updateHighlightedItem(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            _highlightedIndex = Math.max(_highlightedIndex - 1, 0);
            updateHighlightedItem(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (_highlightedIndex >= 0 && items[_highlightedIndex]) {
                const idx = parseInt(items[_highlightedIndex].dataset.idx, 10);
                selectRxMedicine(idx);
            } else {
                hideMedDropdown();
                addRxMedicineFromRow();
            }
        } else if (e.key === 'Escape') {
            hideMedDropdown();
        }
    }

    function updateHighlightedItem(items) {
        items.forEach((item, idx) => {
            if (idx === _highlightedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function selectRxMedicine(filteredIndex) {
        const dropdown = document.getElementById('rxMedDropdown');
        if (!dropdown || !dropdown.dataset.filtered) return;

        let filtered = [];
        try {
            filtered = JSON.parse(dropdown.dataset.filtered);
        } catch (e) {
            filtered = MEDICINES_DATABASE;
        }

        const item = filtered[filteredIndex];
        if (!item) return;

        const displayName = _searchMode === 'brand' ? item.brand : item.generic;
        const inputMed = document.getElementById('rxInputMedicine');
        if (inputMed) {
            inputMed.value = displayName;
            inputMed.dataset.generic = item.generic;
            inputMed.dataset.brand = item.brand;
        }

        // Auto-fill defaults
        const dosageInput = document.getElementById('rxInputDosage');
        if (dosageInput && item.dosage) dosageInput.value = item.dosage;

        const freqInput = document.getElementById('rxInputFrequency');
        if (freqInput && item.frequency) freqInput.value = item.frequency;

        const durationInput = document.getElementById('rxInputDuration');
        if (durationInput && item.duration) durationInput.value = item.duration;

        const mealInput = document.getElementById('rxInputMeal');
        if (mealInput && item.meal) mealInput.value = item.meal;

        const notesInput = document.getElementById('rxInputNotes');
        if (notesInput && item.notes) notesInput.value = item.notes;

        // Auto-fill time
        if (item.time) {
            _timeState.day = item.time.includes('Day');
            _timeState.night = item.time.includes('Night');
            updateTimeButtonsUI();
        }

        hideMedDropdown();

        // Focus next logical input
        if (notesInput && !notesInput.value) {
            notesInput.focus();
        } else {
            document.getElementById('rxBtnAddMed')?.focus();
        }
    }

    function hideMedDropdown() {
        const dropdown = document.getElementById('rxMedDropdown');
        if (dropdown) dropdown.style.display = 'none';
        _highlightedIndex = -1;
    }

    // ── Time Day / Night Buttons ──────────────────────────────────────────────
    function toggleRxTimeBtn(which) {
        if (which === 'day') {
            _timeState.day = !_timeState.day;
            // Ensure at least one is selected if user clicks off
            if (!_timeState.day && !_timeState.night) _timeState.night = true;
        } else if (which === 'night') {
            _timeState.night = !_timeState.night;
            if (!_timeState.day && !_timeState.night) _timeState.day = true;
        }
        updateTimeButtonsUI();
    }

    function updateTimeButtonsUI() {
        const dayBtn = document.getElementById('rxTimeDayBtn');
        const nightBtn = document.getElementById('rxTimeNightBtn');

        if (dayBtn) {
            if (_timeState.day) dayBtn.classList.add('active');
            else dayBtn.classList.remove('active');
        }

        if (nightBtn) {
            if (_timeState.night) nightBtn.classList.add('active');
            else nightBtn.classList.remove('active');
        }
    }

    // ── Apply Eye to All ──────────────────────────────────────────────────────
    function setRxApplyAllEye(eye) {
        _applyAllEye = eye;
        updateApplyEyePillsUI(eye);

        // Update all current medicines in modal
        _modalMeds.forEach(m => {
            m.eye = eye;
        });

        // Update the current input eye select
        const eyeSelect = document.getElementById('rxInputEye');
        if (eyeSelect) eyeSelect.value = eye;

        renderAddedTable();
    }

    function updateApplyEyePillsUI(activeEye) {
        const pills = document.querySelectorAll('#rxApplyEyePills .rx-pill-btn');
        pills.forEach(p => {
            if (p.dataset.eye === activeEye) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
    }

    // ── Add Medicine From Row ─────────────────────────────────────────────────
    function addRxMedicineFromRow() {
        const inputMed = document.getElementById('rxInputMedicine');
        const drug = (inputMed?.value || '').trim();

        if (!drug) {
            if (typeof window.showRxFeedback === 'function') {
                window.showRxFeedback('Please enter or select a medicine name.', 'error');
            }
            inputMed?.focus();
            return;
        }

        const eye = document.getElementById('rxInputEye')?.value || _applyAllEye || 'BE';
        const dosage = (document.getElementById('rxInputDosage')?.value || '').trim() || '1 drop';
        const frequency = (document.getElementById('rxInputFrequency')?.value || '').trim() || '4 times daily';
        const duration = (document.getElementById('rxInputDuration')?.value || '').trim() || '7 days';
        const meal = document.getElementById('rxInputMeal')?.value || '';
        const notes = (document.getElementById('rxInputNotes')?.value || '').trim();

        let timeStr = 'Day';
        if (_timeState.day && _timeState.night) timeStr = 'Day, Night';
        else if (_timeState.night) timeStr = 'Night';

        const newMed = {
            drug,
            eye,
            dosage,
            frequency,
            duration,
            time: timeStr,
            meal,
            notes,
            generic: inputMed?.dataset.generic || '',
            brand: inputMed?.dataset.brand || ''
        };

        _modalMeds.push(newMed);
        renderAddedTable();
        resetEntryRow();

        if (inputMed) inputMed.focus();
    }

    function resetEntryRow() {
        const inputMed = document.getElementById('rxInputMedicine');
        if (inputMed) {
            inputMed.value = '';
            delete inputMed.dataset.generic;
            delete inputMed.dataset.brand;
        }

        const eyeSelect = document.getElementById('rxInputEye');
        if (eyeSelect) eyeSelect.value = _applyAllEye || 'BE';

        const dosageInput = document.getElementById('rxInputDosage');
        if (dosageInput) dosageInput.value = '';

        const freqInput = document.getElementById('rxInputFrequency');
        if (freqInput) freqInput.value = '';

        const durationInput = document.getElementById('rxInputDuration');
        if (durationInput) durationInput.value = '';

        const mealInput = document.getElementById('rxInputMeal');
        if (mealInput) mealInput.value = '';

        const notesInput = document.getElementById('rxInputNotes');
        if (notesInput) notesInput.value = '';

        _timeState = { day: true, night: false };
        updateTimeButtonsUI();
        hideMedDropdown();
    }

    function removeRxModalItem(idx) {
        if (idx >= 0 && idx < _modalMeds.length) {
            _modalMeds.splice(idx, 1);
            renderAddedTable();
        }
    }

    // ── Render Added Medicines Table / Empty State ────────────────────────────
    function renderAddedTable() {
        const emptyCard = document.getElementById('rxEmptyMedsCard');
        const rowsList = document.getElementById('rxMedsRowsList');
        if (!emptyCard || !rowsList) return;

        if (_modalMeds.length === 0) {
            emptyCard.style.display = 'flex';
            rowsList.style.display = 'none';
            rowsList.innerHTML = '';
            return;
        }

        emptyCard.style.display = 'none';
        rowsList.style.display = 'flex';

        rowsList.innerHTML = _modalMeds.map((m, idx) => {
            const eyeClass = (m.eye || 'be').toLowerCase();
            const timeIcon = m.time?.includes('Night') && m.time?.includes('Day')
                ? '<i class="fa-regular fa-sun"></i><i class="fa-regular fa-moon"></i> Day, Night'
                : (m.time?.includes('Night')
                    ? '<i class="fa-regular fa-moon"></i> Night'
                    : '<i class="fa-regular fa-sun"></i> Day');

            return `
                <div class="rx-added-row">
                    <div class="col-medicine">
                        <div class="rx-row-drug-name">
                            <span>${escapeHtml(m.drug)}</span>
                            ${m.generic && m.generic !== m.drug ? `<span class="rx-row-drug-sub">${escapeHtml(m.generic)}</span>` : ''}
                        </div>
                    </div>
                    <div class="col-eye">
                        <span class="rx-eye-badge ${eyeClass}">${escapeHtml(m.eye || 'BE')}</span>
                    </div>
                    <div class="col-dosage">${escapeHtml(m.dosage || '1 drop')}</div>
                    <div class="col-freq">${escapeHtml(m.frequency || '4x daily')}</div>
                    <div class="col-duration">${escapeHtml(m.duration || '7 days')}</div>
                    <div class="col-time">
                        <span class="rx-time-tag">${timeIcon}</span>
                    </div>
                    <div class="col-meal">${escapeHtml(m.meal || '-')}</div>
                    <div class="col-notes">${escapeHtml(m.notes || '-')}</div>
                    <div class="col-actions">
                        <button type="button" class="rx-row-del-btn" onclick="window.removeRxModalItem(${idx})" title="Remove Medication">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ── Medicine Advice Management ────────────────────────────────────────────
    function onRxAdviceInput(query) {
        const dropdown = document.getElementById('rxAdviceDropdown');
        if (!dropdown) return;

        const q = (query || '').trim().toLowerCase();
        if (!q) {
            hideAdviceDropdown();
            return;
        }

        const filtered = ADVICE_CATALOG.filter(item =>
            item.toLowerCase().includes(q) && !_modalAdvice.includes(item)
        );

        if (filtered.length === 0) {
            dropdown.innerHTML = `
                <div class="rx-advice-drop-item" style="color: #94a3b8; font-style: italic;">
                    Press Enter to add "${escapeHtml(query)}"
                </div>
            `;
            dropdown.style.display = 'block';
            return;
        }

        dropdown.innerHTML = filtered.map(item => `
            <div class="rx-advice-drop-item" onclick="window.addRxAdviceItem('${escapeHtml(item).replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-plus" style="margin-right: 6px; font-size: 0.7rem; color: #2563eb;"></i>
                ${escapeHtml(item)}
            </div>
        `).join('');

        dropdown.style.display = 'block';
    }

    function onRxAdviceFocus() {
        const input = document.getElementById('rxAdviceInput');
        if (input && input.value.trim()) {
            onRxAdviceInput(input.value);
        }
    }

    function onRxAdviceKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = document.getElementById('rxAdviceInput');
            const val = (input?.value || '').trim();
            if (val) {
                addRxAdviceItem(val);
                if (input) input.value = '';
                hideAdviceDropdown();
            }
        } else if (e.key === 'Escape') {
            hideAdviceDropdown();
        }
    }

    function addRxAdviceItem(text) {
        const clean = (text || '').trim();
        if (!clean) return;
        if (!_modalAdvice.includes(clean)) {
            _modalAdvice.push(clean);
            renderAdviceChips();
        }
        const input = document.getElementById('rxAdviceInput');
        if (input) input.value = '';
        hideAdviceDropdown();
    }

    function removeRxAdviceItem(idx) {
        if (idx >= 0 && idx < _modalAdvice.length) {
            _modalAdvice.splice(idx, 1);
            renderAdviceChips();
        }
    }

    function renderAdviceChips() {
        const emptyMsg = document.getElementById('rxAdviceEmptyMsg');
        const chipsList = document.getElementById('rxAdviceChipsList');
        if (!emptyMsg || !chipsList) return;

        if (_modalAdvice.length === 0) {
            emptyMsg.style.display = 'inline-block';
            chipsList.innerHTML = '';
            return;
        }

        emptyMsg.style.display = 'none';
        chipsList.innerHTML = _modalAdvice.map((adv, idx) => `
            <div class="rx-advice-chip">
                <span>${escapeHtml(adv)}</span>
                <button type="button" class="rx-advice-chip-remove" onclick="window.removeRxAdviceItem(${idx})" title="Remove advice">&times;</button>
            </div>
        `).join('');
    }

    function hideAdviceDropdown() {
        const dropdown = document.getElementById('rxAdviceDropdown');
        if (dropdown) dropdown.style.display = 'none';
    }

    // ── Presets Loading & Saving ──────────────────────────────────────────────
    function onRxPresetSelected(presetKey) {
        if (!presetKey) return;

        let preset = null;
        if (presetKey.startsWith('custom_')) {
            const rawKey = presetKey.replace('custom_', '');
            preset = _customPresets[rawKey];
        } else {
            preset = CLINICAL_PRESETS[presetKey];
        }

        if (!preset) return;

        // Apply medicines
        if (Array.isArray(preset.meds)) {
            _modalMeds = preset.meds.map(m => ({ ...m }));
        }

        // Apply advice
        if (Array.isArray(preset.advice)) {
            preset.advice.forEach(a => {
                if (!_modalAdvice.includes(a)) {
                    _modalAdvice.push(a);
                }
            });
        }

        renderAddedTable();
        renderAdviceChips();

        if (typeof window.showRxFeedback === 'function') {
            window.showRxFeedback(`Loaded preset: ${preset.name || presetKey}`, 'success');
        }

        // Reset dropdown to default option
        const select = document.getElementById('rxPresetSelect');
        if (select) select.value = '';
    }

    function promptSaveRxPreset() {
        if (_modalMeds.length === 0) {
            if (typeof window.showRxFeedback === 'function') {
                window.showRxFeedback('Add at least one medicine before saving as preset.', 'error');
            }
            return;
        }

        const name = prompt('Enter a name for this custom Rx preset:');
        if (!name || !name.trim()) return;

        const cleanName = name.trim();
        const key = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        _customPresets[key] = {
            name: cleanName,
            meds: _modalMeds.map(m => ({ ...m })),
            advice: [..._modalAdvice]
        };

        saveCustomPresetsToStorage();
        populatePresetDropdown();

        if (typeof window.showRxFeedback === 'function') {
            window.showRxFeedback(`Preset "${cleanName}" saved successfully.`, 'success');
        }
    }

    // ── Global Document Click & Escape Listeners ──────────────────────────────
    function bindModalEvents() {
        document.addEventListener('click', function (e) {
            // Close autocomplete dropdowns on outside click
            if (!e.target.closest('.rx-med-search-wrap')) {
                hideMedDropdown();
            }
            if (!e.target.closest('.rx-advice-input-wrap')) {
                hideAdviceDropdown();
            }

            // Close modal on backdrop click
            const modal = document.getElementById('rxMedicinePickerModal');
            if (modal && e.target === modal) {
                closeRxModal();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('rxMedicinePickerModal');
                if (modal && modal.style.display === 'flex') {
                    closeRxModal();
                }
            }
        });
    }

    // Helper: HTML escape
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRxModal);
    } else {
        initRxModal();
    }

    // ── Expose Globally ───────────────────────────────────────────────────────
    window.openRxModal             = openRxModal;
    window.closeRxModal            = closeRxModal;
    window.saveRxModal             = saveRxModal;
    window.setRxSearchMode         = setRxSearchMode;
    window.onRxMedicineInput       = onRxMedicineInput;
    window.onRxMedicineFocus       = onRxMedicineFocus;
    window.onRxMedicineKeydown     = onRxMedicineKeydown;
    window.selectRxMedicine        = selectRxMedicine;
    window.toggleRxTimeBtn         = toggleRxTimeBtn;
    window.setRxApplyAllEye        = setRxApplyAllEye;
    window.addRxMedicineFromRow    = addRxMedicineFromRow;
    window.removeRxModalItem       = removeRxModalItem;
    window.onRxAdviceInput         = onRxAdviceInput;
    window.onRxAdviceFocus         = onRxAdviceFocus;
    window.onRxAdviceKeydown       = onRxAdviceKeydown;
    window.addRxAdviceItem         = addRxAdviceItem;
    window.removeRxAdviceItem      = removeRxAdviceItem;
    window.onRxPresetSelected      = onRxPresetSelected;
    window.promptSaveRxPreset      = promptSaveRxPreset;

    // Backward compatibility with legacy inline adder
    window.toggleInlineMedAdder    = function (show) {
        openRxModal(show !== false);
    };

})();
