// =============================================================================
// OPINION / REFER POPUP MODAL — opinion_refer_modal.js
// Hospital EMR — Ispahani Islamia Eye Institute & Hospital
// Handles open / close / save / clear / summary / data-sync for the
// Opinion / Refer popup that hangs off the Advice section.
// =============================================================================

(function () {
    'use strict';

    // ── Specialty catalogs per category ───────────────────────────────────────
    const SPECIALTIES_BY_CATEGORY = {
        internal: [
            'Retina & Vitreous',
            'Glaucoma Services',
            'Cornea & External Disease',
            'Oculoplastic, Orbit & Reconstructive',
            'Pediatric Ophthalmology & Strabismus',
            'Neuro-Ophthalmology',
            'Cataract & Refractive Surgery',
            'Uveitis & Ocular Immunology',
            'Low Vision & Visual Rehabilitation',
            'Contact Lens Clinic',
            'Emergency Eye Casualty',
            'Other Eye Subspecialty'
        ],
        external: [
            'Internal Medicine / General Physician',
            'Diabetology & Endocrinology (Glycemic Control)',
            'Cardiology & Cardiovascular Medicine',
            'Neurology & Neurosurgery',
            'Nephrology / Renal Medicine',
            'ENT / Otorhinolaryngology',
            'Dermatology & Allergy',
            'General Pediatrics',
            'Anesthesia & Critical Care',
            'Other External Specialist'
        ],
        second_opinion: [
            'Senior Consultant (Second Opinion)',
            'Glaucoma Specialist (Second Opinion)',
            'Retina Specialist (Second Opinion)',
            'Cornea Specialist (Second Opinion)',
            'Pediatric Ophthalmologist (Second Opinion)',
            'Oculoplastic Specialist (Second Opinion)',
            'Tertiary Eye Care Center / Board'
        ],
        pre_op: [
            'Pre-Op Anesthesia Fitness',
            'Diabetology (Glycemic Optimization for OT)',
            'Cardiology (Cardiac Fitness for OT)',
            'General Physician (Medical Clearance for OT)',
            'Nephrology (Renal Clearance for OT)'
        ]
    };

    // ── State ──────────────────────────────────────────────────────────────────
    let _opState = {
        category: 'internal', // 'internal' | 'external' | 'second_opinion' | 'pre_op'
        subspecialty: 'Retina & Vitreous',
        customSpecialty: '',
        consultant: '',
        urgency: 'Routine', // 'Routine' | 'Priority (24–48h)' | 'Emergency (STAT)'
        eye: 'OU', // 'OD' | 'OS' | 'OU' | 'Systemic'
        reasonChips: [],
        customReason: '',
        requestChips: [],
        customRequest: '',
        clinicalSummary: '',
        isDirectEdit: false,
        directNote: ''
    };

    // ── DOM Helpers ────────────────────────────────────────────────────────────
    function $id(id) { return document.getElementById(id); }

    function getInput(id) {
        const el = $id(id);
        return el ? el.value.trim() : '';
    }

    function setInput(id, val) {
        const el = $id(id);
        if (el) el.value = val || '';
    }

    // ── Populate Subspecialty Dropdown ─────────────────────────────────────────
    function _populateSubspecialties(category, selectedVal) {
        const select = $id('op_subspecialty');
        if (!select) return;

        const list = SPECIALTIES_BY_CATEGORY[category] || SPECIALTIES_BY_CATEGORY.internal;
        select.innerHTML = '';

        list.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item;
            opt.textContent = item;
            select.appendChild(opt);
        });

        // Add Custom / Other option
        const customOpt = document.createElement('option');
        customOpt.value = 'Other / Custom';
        customOpt.textContent = 'Other / Custom Specialty...';
        select.appendChild(customOpt);

        if (selectedVal && (list.includes(selectedVal) || selectedVal === 'Other / Custom')) {
            select.value = selectedVal;
        } else if (list.length > 0) {
            select.value = list[0];
            _opState.subspecialty = list[0];
        }

        _onSubspecialtyChange();
    }

    function _onSubspecialtyChange() {
        const select = $id('op_subspecialty');
        const customWrap = $id('opCustomSpecialtyWrap');
        if (!select || !customWrap) return;

        if (select.value === 'Other / Custom' || select.value.toLowerCase().includes('other')) {
            customWrap.style.display = 'block';
        } else {
            customWrap.style.display = 'none';
        }
    }

    // ── Switch Category Tab ────────────────────────────────────────────────────
    function switchOPCategory(category) {
        _opState.category = category;

        // Update tab buttons
        document.querySelectorAll('.op-type-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        // Repopulate subspecialties
        _populateSubspecialties(category);

        // Adjust default eye if pre-op or external
        if (category === 'pre_op' || category === 'external') {
            if (_opState.eye === 'OU' || !_opState.eye) {
                selectOPEye('Systemic');
            }
        } else if (_opState.eye === 'Systemic') {
            selectOPEye('OU');
        }

        _renderSummary();
    }

    // ── Urgency Selection ──────────────────────────────────────────────────────
    function selectOPUrgency(val) {
        _opState.urgency = val;
        document.querySelectorAll('.op-urgency-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.urgency === val);
        });
        _renderSummary();
    }

    // ── Eye Selection ──────────────────────────────────────────────────────────
    function selectOPEye(val) {
        _opState.eye = val;
        document.querySelectorAll('.op-eye-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.eye === val);
        });
        _renderSummary();
    }

    // ── Toggle Reason Chips ────────────────────────────────────────────────────
    function toggleOPReasonChip(val, btn) {
        if (!btn) return;
        const idx = _opState.reasonChips.indexOf(val);
        if (idx === -1) {
            _opState.reasonChips.push(val);
            btn.classList.add('active');
        } else {
            _opState.reasonChips.splice(idx, 1);
            btn.classList.remove('active');
        }
        _renderSummary();
    }

    // ── Toggle Request Chips ───────────────────────────────────────────────────
    function toggleOPRequestChip(val, btn) {
        if (!btn) return;
        const idx = _opState.requestChips.indexOf(val);
        if (idx === -1) {
            _opState.requestChips.push(val);
            btn.classList.add('active');
        } else {
            _opState.requestChips.splice(idx, 1);
            btn.classList.remove('active');
        }
        _renderSummary();
    }

    // ── 1-Click Clinical Presets ───────────────────────────────────────────────
    function applyOPPreset(presetKey) {
        _opState.reasonChips = [];
        _opState.requestChips = [];
        _opState.customReason = '';
        _opState.customRequest = '';

        if (presetKey === 'retina_dr') {
            switchOPCategory('internal');
            _opState.subspecialty = 'Retina & Vitreous';
            _opState.urgency = 'Priority (24–48h)';
            _opState.eye = 'OU';
            _opState.reasonChips = ['Diabetic Retinopathy Screening / Evaluation', 'Macular Edema / Anti-VEGF Review'];
            _opState.requestChips = ['Kindly evaluate and manage', 'Evaluate for Laser / Anti-VEGF injection'];
            _opState.clinicalSummary = 'Known diabetic with impaired vision. Fundus reveals retinal microaneurysms and hard exudates.';
        } else if (presetKey === 'glaucoma_iop') {
            switchOPCategory('internal');
            _opState.subspecialty = 'Glaucoma Services';
            _opState.urgency = 'Priority (24–48h)';
            _opState.eye = 'OU';
            _opState.reasonChips = ['Glaucoma / Elevated IOP Evaluation', 'Optic Disc Cupping / Visual Field Defect'];
            _opState.requestChips = ['Kindly evaluate and advise medical or surgical management', 'Detailed gonioscopy / VF / OCT review'];
            _opState.clinicalSummary = 'Persistently elevated IOP with suspicious cup-to-disc ratio. Specialist evaluation requested.';
        } else if (presetKey === 'retinal_tear') {
            switchOPCategory('internal');
            _opState.subspecialty = 'Retina & Vitreous';
            _opState.urgency = 'Emergency (STAT)';
            _opState.eye = (window._rxPatient && window._rxPatient.eye && window._rxPatient.eye !== 'BE') ? (window._rxPatient.eye === 'RE' ? 'OD' : 'OS') : 'OD';
            _opState.reasonChips = ['Suspected Retinal Detachment / Tear'];
            _opState.requestChips = ['Kindly evaluate urgently and manage', 'Urgent surgical / retinopexy review'];
            _opState.clinicalSummary = 'Sudden flashes, floaters and curtain-like visual field loss. Urgent evaluation requested.';
        } else if (presetKey === 'corneal_ulcer') {
            switchOPCategory('internal');
            _opState.subspecialty = 'Cornea & External Disease';
            _opState.urgency = 'Priority (24–48h)';
            _opState.eye = (window._rxPatient && window._rxPatient.eye && window._rxPatient.eye !== 'BE') ? (window._rxPatient.eye === 'RE' ? 'OD' : 'OS') : 'OD';
            _opState.reasonChips = ['Corneal Ulcer / Microbial Keratitis'];
            _opState.requestChips = ['Kindly evaluate and manage / scraping and culture', 'Advise intensive antimicrobial regimen'];
            _opState.clinicalSummary = 'Pain, photophobia, and epithelial defect with stromal infiltrate. Cornea opinion requested.';
        } else if (presetKey === 'neuro_vision') {
            switchOPCategory('internal');
            _opState.subspecialty = 'Neuro-Ophthalmology';
            _opState.urgency = 'Priority (24–48h)';
            _opState.eye = 'OU';
            _opState.reasonChips = ['Unexplained Sudden Visual Loss / RAPD', 'Optic Disc Swelling / Papilledema'];
            _opState.requestChips = ['Kindly evaluate and advise neuro-imaging / workup', 'Review and provide second opinion'];
            _opState.clinicalSummary = 'Subnormal visual acuity not explained by refractive error or media opacity. Neuro-ophthalmology assessment sought.';
        } else if (presetKey === 'diabetic_control') {
            switchOPCategory('external');
            _opState.subspecialty = 'Diabetology & Endocrinology (Glycemic Control)';
            _opState.urgency = 'Routine';
            _opState.eye = 'Systemic';
            _opState.reasonChips = ['Strict Glycemic Control before Cataract / Ocular Surgery'];
            _opState.requestChips = ['Kindly optimize blood sugars and provide surgical clearance', 'Advise pre-op insulin / OHA adjustments'];
            _opState.clinicalSummary = 'Patient scheduled for intraocular surgery. Glycemic control optimization requested.';
        } else if (presetKey === 'cardiac_clearance') {
            switchOPCategory('pre_op');
            _opState.subspecialty = 'Cardiology (Cardiac Fitness for OT)';
            _opState.urgency = 'Routine';
            _opState.eye = 'Systemic';
            _opState.reasonChips = ['Pre-Operative Cardiac Evaluation & Surgical Fitness'];
            _opState.requestChips = ['Kindly evaluate cardiovascular status and provide pre-op clearance'];
            _opState.clinicalSummary = 'Patient planned for elective ophthalmic procedure under local/general anesthesia. Cardiac clearance requested.';
        }

        _restoreStateToUI();
        _renderSummary();
    }

    // ── Auto-fill Patient Clinical Data ────────────────────────────────────────
    function autoFillPatientClinicalData() {
        const diag = getInput('rx_diagnosis');
        const bcvaOD = getInput('emr_bcva_od');
        const bcvaOS = getInput('emr_bcva_os');
        const iopOD = getInput('emr_iop_od');
        const iopOS = getInput('emr_iop_os');

        const parts = [];
        if (diag) parts.push(`Diagnosis: ${diag}`);
        if (bcvaOD || bcvaOS) parts.push(`BCVA: OD ${bcvaOD || '-'} | OS ${bcvaOS || '-'}`);
        if (iopOD || iopOS) parts.push(`IOP: OD ${iopOD || '-'} | OS ${iopOS || '-'} mmHg`);

        if (parts.length === 0) {
            alert('No current patient diagnosis or visual exam data found in the workspace to auto-fill.');
            return;
        }

        const autoText = parts.join('; ');
        const summaryInput = $id('op_clinical_summary');
        if (summaryInput) {
            const existing = summaryInput.value.trim();
            summaryInput.value = existing ? `${existing} | ${autoText}` : autoText;
            _opState.clinicalSummary = summaryInput.value;
        }

        _renderSummary();
    }

    // ── Toggle Direct Note Editing ─────────────────────────────────────────────
    function toggleOPDirectEdit() {
        _opState.isDirectEdit = !_opState.isDirectEdit;
        const textEl = $id('opSummaryText');
        const btn = $id('opBtnEditToggle');

        if (_opState.isDirectEdit) {
            textEl.contentEditable = 'true';
            textEl.focus();
            if (btn) btn.innerHTML = '<i class="fa-solid fa-lock"></i> Auto-Generate Note';
            textEl.style.borderColor = '#2563eb';
            textEl.style.background = '#f8faff';
        } else {
            textEl.contentEditable = 'false';
            if (btn) btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Note Directly';
            textEl.style.borderColor = '#cbd5e1';
            textEl.style.background = '#ffffff';
            _renderSummary();
        }
    }

    // ── Construct Formatted Referral String ────────────────────────────────────
    function _buildFormattedString() {
        _saveUIToState();

        if (_opState.isDirectEdit && _opState.directNote) {
            return _opState.directNote;
        }

        const { category, subspecialty, customSpecialty, consultant, urgency, eye,
                reasonChips, customReason, requestChips, customRequest, clinicalSummary } = _opState;

        const effectiveSpecialty = (subspecialty === 'Other / Custom' || subspecialty.toLowerCase().includes('other'))
            ? (customSpecialty || 'Specialist')
            : subspecialty;

        // Target Consultant / Doctor
        const targetStr = consultant ? `${effectiveSpecialty} (${consultant})` : effectiveSpecialty;

        // Category Prefix
        let prefix = 'Referral to';
        if (category === 'second_opinion') {
            prefix = 'Second Opinion Request:';
        } else if (category === 'pre_op') {
            prefix = 'Pre-Op Referral:';
        } else if (category === 'external') {
            prefix = 'External Referral:';
        } else {
            prefix = 'Referral to:';
        }

        // Reasons
        const allReasons = [...reasonChips];
        if (customReason) allReasons.push(customReason);

        // Requests
        const allRequests = [...requestChips];
        if (customRequest) allRequests.push(customRequest);

        // Build Segments
        const segments = [];
        segments.push(`${prefix} ${targetStr}`);
        if (urgency && urgency !== 'Routine') segments.push(`Urgency: ${urgency}`);
        if (eye && eye !== 'Systemic') segments.push(`Eye: ${eye}`);
        if (allReasons.length) segments.push(`Reason: ${allReasons.join('; ')}`);
        if (allRequests.length) segments.push(`Request: ${allRequests.join('; ')}`);
        if (clinicalSummary) segments.push(`Clinical Notes: ${clinicalSummary}`);

        return segments.join(' | ');
    }

    // ── Render Live Summary ────────────────────────────────────────────────────
    function _renderSummary() {
        const textEl = $id('opSummaryText');
        if (!textEl) return;

        if (_opState.isDirectEdit) {
            _opState.directNote = textEl.textContent.trim();
            return;
        }

        const formatted = _buildFormattedString();
        if (formatted) {
            textEl.textContent = formatted;
            textEl.className = 'op-summary-text';
        } else {
            textEl.textContent = 'Select department, reason, and request above to preview referral note.';
            textEl.className = 'op-summary-empty';
        }
    }

    // ── Save UI → State ────────────────────────────────────────────────────────
    function _saveUIToState() {
        const specSelect = $id('op_subspecialty');
        if (specSelect) _opState.subspecialty = specSelect.value;
        _opState.customSpecialty = getInput('op_custom_specialty');

        const docSelect = $id('op_consultant');
        if (docSelect) _opState.consultant = docSelect.value;

        _opState.customReason = getInput('op_custom_reason');
        _opState.customRequest = getInput('op_custom_request');
        _opState.clinicalSummary = getInput('op_clinical_summary');

        const textEl = $id('opSummaryText');
        if (_opState.isDirectEdit && textEl) {
            _opState.directNote = textEl.textContent.trim();
        }
    }

    // ── Restore State → UI ─────────────────────────────────────────────────────
    function _restoreStateToUI() {
        // Restore category tab
        document.querySelectorAll('.op-type-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === _opState.category);
        });

        // Repopulate subspecialties and select current
        _populateSubspecialties(_opState.category, _opState.subspecialty);
        setInput('op_custom_specialty', _opState.customSpecialty);

        // Restore consultant
        const docSelect = $id('op_consultant');
        if (docSelect) docSelect.value = _opState.consultant || '';

        // Restore urgency buttons
        document.querySelectorAll('.op-urgency-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.urgency === _opState.urgency);
        });

        // Restore eye buttons
        document.querySelectorAll('.op-eye-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.eye === _opState.eye);
        });

        // Restore reason chips
        document.querySelectorAll('.op-reason-chip').forEach(btn => {
            const val = btn.dataset.val;
            btn.classList.toggle('active', _opState.reasonChips.includes(val));
        });
        setInput('op_custom_reason', _opState.customReason);

        // Restore request chips
        document.querySelectorAll('.op-request-chip').forEach(btn => {
            const val = btn.dataset.val;
            btn.classList.toggle('active', _opState.requestChips.includes(val));
        });
        setInput('op_custom_request', _opState.customRequest);

        // Restore clinical summary
        setInput('op_clinical_summary', _opState.clinicalSummary);
    }

    // ── Open / Close Modal ─────────────────────────────────────────────────────
    function openOpinionReferModal() {
        const overlay = $id('opinionReferModal');
        if (!overlay) return;

        // If state is empty but rx_opinion input has text, parse or set as note
        const existingRx = getInput('rx_opinion');
        if (existingRx && !_opState.clinicalSummary && _opState.reasonChips.length === 0 && !_opState.customReason) {
            restoreOpinionReferFromText(existingRx);
        }

        _restoreStateToUI();
        overlay.style.display = 'flex';

        setTimeout(() => {
            const first = overlay.querySelector('.op-select, .op-input, .op-textarea');
            if (first) first.focus();
        }, 80);

        _renderSummary();
    }

    function closeOpinionReferModal() {
        _saveUIToState();
        const overlay = $id('opinionReferModal');
        if (overlay) overlay.style.display = 'none';
    }

    // ── Clear All ──────────────────────────────────────────────────────────────
    function clearOpinionReferModal() {
        _opState = {
            category: 'internal',
            subspecialty: 'Retina & Vitreous',
            customSpecialty: '',
            consultant: '',
            urgency: 'Routine',
            eye: 'OU',
            reasonChips: [],
            customReason: '',
            requestChips: [],
            customRequest: '',
            clinicalSummary: '',
            isDirectEdit: false,
            directNote: ''
        };

        const textEl = $id('opSummaryText');
        if (textEl) {
            textEl.contentEditable = 'false';
            textEl.style.borderColor = '#cbd5e1';
            textEl.style.background = '#ffffff';
        }
        const editBtn = $id('opBtnEditToggle');
        if (editBtn) editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Note Directly';

        _restoreStateToUI();
        _renderSummary();
    }

    // ── Save & Apply to EMR Prescription ───────────────────────────────────────
    function saveOpinionReferModal() {
        const note = _buildFormattedString();

        // Write directly to rx_opinion
        const rxInput = $id('rx_opinion');
        if (rxInput) {
            rxInput.value = note;
        }

        // Expand advice content if collapsed
        const advContent = $id('adv_content_opinion');
        if (advContent && advContent.style.display === 'none') {
            advContent.style.display = 'block';
        }

        // Update badge
        _updateAdviceBadge(note, Boolean(note));

        // Toast feedback
        if (typeof window.showRxFeedback === 'function') {
            window.showRxFeedback('Opinion / Referral updated in prescription.', 'success');
        }

        closeOpinionReferModal();
    }

    // ── Update Badge in Advice Header ──────────────────────────────────────────
    function _updateAdviceBadge(text, hasData) {
        const badge = $id('opinion_advice_badge');
        if (!badge) return;

        if (hasData && text) {
            badge.innerHTML = '<i class="fa-solid fa-check"></i> Filled';
            badge.style.display = 'inline-flex';
        } else {
            badge.innerHTML = '';
            badge.style.display = 'none';
        }
    }

    // ── Reset State (Workspace Clear) ──────────────────────────────────────────
    function resetOpinionReferState() {
        _opState = {
            category: 'internal',
            subspecialty: 'Retina & Vitreous',
            customSpecialty: '',
            consultant: '',
            urgency: 'Routine',
            eye: 'OU',
            reasonChips: [],
            customReason: '',
            requestChips: [],
            customRequest: '',
            clinicalSummary: '',
            isDirectEdit: false,
            directNote: ''
        };

        setInput('rx_opinion', '');
        _updateAdviceBadge('', false);
    }

    // ── Restore from Saved Prescription ────────────────────────────────────────
    function restoreOpinionReferFromText(text) {
        if (!text) {
            resetOpinionReferState();
            return;
        }

        // Populate rx_opinion
        setInput('rx_opinion', text);
        _updateAdviceBadge(text, true);

        // Attempt structured parsing if formatted with pipes
        if (text.includes('|')) {
            const parts = text.split('|').map(s => s.trim());
            parts.forEach(part => {
                if (part.toLowerCase().startsWith('referral to:') || part.toLowerCase().startsWith('referral to')) {
                    const val = part.replace(/^referral to:?\s*/i, '').trim();
                    _opState.category = 'internal';
                    if (val.includes('(')) {
                        const m = val.match(/^(.*?)\s*\((.*?)\)$/);
                        if (m) {
                            _opState.subspecialty = m[1].trim();
                            _opState.consultant = m[2].trim();
                        } else {
                            _opState.subspecialty = val;
                        }
                    } else {
                        _opState.subspecialty = val;
                    }
                } else if (part.toLowerCase().startsWith('external referral:')) {
                    _opState.category = 'external';
                    _opState.subspecialty = part.replace(/^external referral:\s*/i, '').trim();
                } else if (part.toLowerCase().startsWith('second opinion request:')) {
                    _opState.category = 'second_opinion';
                    _opState.subspecialty = part.replace(/^second opinion request:\s*/i, '').trim();
                } else if (part.toLowerCase().startsWith('pre-op referral:')) {
                    _opState.category = 'pre_op';
                    _opState.subspecialty = part.replace(/^pre-op referral:\s*/i, '').trim();
                } else if (part.toLowerCase().startsWith('urgency:')) {
                    _opState.urgency = part.replace(/^urgency:\s*/i, '').trim();
                } else if (part.toLowerCase().startsWith('eye:')) {
                    _opState.eye = part.replace(/^eye:\s*/i, '').trim();
                } else if (part.toLowerCase().startsWith('reason:')) {
                    _opState.customReason = part.replace(/^reason:\s*/i, '').trim();
                } else if (part.toLowerCase().startsWith('request:')) {
                    _opState.customRequest = part.replace(/^request:\s*/i, '').trim();
                } else if (part.toLowerCase().startsWith('clinical notes:')) {
                    _opState.clinicalSummary = part.replace(/^clinical notes:\s*/i, '').trim();
                }
            });
        } else {
            // Free-form text
            _opState.clinicalSummary = text;
        }

        _restoreStateToUI();
    }

    // ── Event Wiring (DOMContentLoaded) ────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const overlay = $id('opinionReferModal');
        if (!overlay) return;

        // Close on backdrop click
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeOpinionReferModal();
        });

        // Live summary on changes
        overlay.addEventListener('input', function (e) {
            if (e.target.id !== 'opSummaryText') {
                _renderSummary();
            }
        });
        overlay.addEventListener('change', function () {
            _renderSummary();
        });

        // Subspecialty select listener
        const specSelect = $id('op_subspecialty');
        if (specSelect) {
            specSelect.addEventListener('change', _onSubspecialtyChange);
        }

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (overlay.style.display === 'flex') {
                e.stopPropagation();
                closeOpinionReferModal();
            }
        }, true);
    });

    // ── Global Exports ─────────────────────────────────────────────────────────
    window.openOpinionReferModal          = openOpinionReferModal;
    window.closeOpinionReferModal         = closeOpinionReferModal;
    window.saveOpinionReferModal          = saveOpinionReferModal;
    window.clearOpinionReferModal         = clearOpinionReferModal;
    window.resetOpinionReferState         = resetOpinionReferState;
    window.restoreOpinionReferFromText    = restoreOpinionReferFromText;
    window.switchOPCategory               = switchOPCategory;
    window.applyOPPreset                  = applyOPPreset;
    window.selectOPUrgency                = selectOPUrgency;
    window.selectOPEye                    = selectOPEye;
    window.toggleOPReasonChip             = toggleOPReasonChip;
    window.toggleOPRequestChip            = toggleOPRequestChip;
    window.autoFillPatientClinicalData    = autoFillPatientClinicalData;
    window.toggleOPDirectEdit             = toggleOPDirectEdit;
})();
