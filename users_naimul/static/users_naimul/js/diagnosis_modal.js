// =============================================================================
// DIAGNOSIS MODAL — Hospital EMR Extension
// Matching IIEI&H Clinical Portal Diagnosis Popup Reference:
// - Title: Diagnosis | Last Diagnosis found (today) - Pull | Close
// - Left: Search diagnosis, Load Template, 3-column Favorite / Common Diagnosis
// - Right: Diagnosis Summary [Apply to all] [Eye: RE | LE | BE]
// - Footer: Cancel | Save Diagnosis
// =============================================================================

(function () {
    'use strict';

    // ── 18 Favorite / Common Diagnoses (Exact Match to Reference Screenshot) ──
    const FAVORITE_DIAGNOSES = [
        // Column 1
        'Ocular Allergy',
        'Dx',
        'Refractive error',
        'Simple hypermetropia',
        'Corneal foreign Body',
        'IMC - immature cataract',

        // Column 2
        'S/P',
        'Simple myopia',
        'Entropion',
        'Acute conjunctivitis',
        'Episcleritis',
        'Mature cataract',

        // Column 3
        'Eyache with headache',
        'Chalazion',
        'Fail DCR + ASIC',
        'Blepharitis',
        'Hyperopic astigmatism',
        'MGD - Meibomian gland dysfunction'
    ];

    // ── Extended Autocomplete Catalog for Search ──────────────────────────────
    const DIAGNOSIS_CATALOG = [
        'Ocular Allergy',
        'Dx',
        'Refractive error',
        'Simple hypermetropia',
        'Simple myopia',
        'Corneal foreign Body',
        'IMC - immature cataract',
        'Mature cataract',
        'Hypermature cataract',
        'Nuclear sclerotic cataract (NSC)',
        'Posterior subcapsular cataract (PSC)',
        'Pseudophakia',
        'Aphakia',
        'S/P',
        'Entropion',
        'Ectropion',
        'Trichiasis',
        'Ptosis',
        'Acute conjunctivitis',
        'Allergic conjunctivitis',
        'Bacterial conjunctivitis',
        'Viral conjunctivitis',
        'Episcleritis',
        'Scleritis',
        'Eyache with headache',
        'Chalazion',
        'Stye / Hordeolum',
        'Fail DCR + ASIC',
        'Blepharitis',
        'Hyperopic astigmatism',
        'Myopic astigmatism',
        'Mixed astigmatism',
        'Presbyopia',
        'MGD - Meibomian gland dysfunction',
        'Dry Eye Syndrome / KCS',
        'Corneal abrasion',
        'Corneal ulcer / Microbial keratitis',
        'Pterygium',
        'Pinguecula',
        'Subconjunctival hemorrhage',
        'Primary open-angle glaucoma (POAG)',
        'Angle closure glaucoma (ACG)',
        'Ocular hypertension',
        'Diabetic Retinopathy (NPDR)',
        'Diabetic Retinopathy (PDR)',
        'Diabetic Macular Edema (DME)',
        'Age-related macular degeneration (ARMD)',
        'Retinal detachment (RD)',
        'Central retinal vein occlusion (CRVO)',
        'Branch retinal vein occlusion (BRVO)',
        'Central retinal artery occlusion (CRAO)',
        'Vitreous hemorrhage',
        'Posterior vitreous detachment (PVD)',
        'Uveitis (Anterior / Intermediate / Posterior)',
        'Optic neuritis',
        'Amblyopia',
        'Strabismus / Squint'
    ];

    // ── Pre-configured Clinical Templates ─────────────────────────────────────
    const CLINICAL_TEMPLATES = {
        cataract: {
            title: 'Cataract (IMC / Refractive)',
            desc: 'IMC - immature cataract (RE), Refractive error (LE)',
            items: [
                { name: 'IMC - immature cataract', eye: 'RE' },
                { name: 'Refractive error', eye: 'LE' }
            ]
        },
        mature_cataract: {
            title: 'Mature Cataract & Pseudophakia',
            desc: 'Mature cataract (RE), S/P (LE)',
            items: [
                { name: 'Mature cataract', eye: 'RE' },
                { name: 'S/P', eye: 'LE' }
            ]
        },
        refractive: {
            title: 'Refractive & Astigmatism Suite',
            desc: 'Refractive error (BE), Simple myopia (BE)',
            items: [
                { name: 'Refractive error', eye: 'BE' },
                { name: 'Simple myopia', eye: 'BE' }
            ]
        },
        blepharitis_mgd: {
            title: 'Ocular Surface & Lid Disease',
            desc: 'Blepharitis (BE), MGD - Meibomian gland dysfunction (BE)',
            items: [
                { name: 'Blepharitis', eye: 'BE' },
                { name: 'MGD - Meibomian gland dysfunction', eye: 'BE' }
            ]
        },
        red_eye: {
            title: 'Acute Red Eye & Allergy',
            desc: 'Acute conjunctivitis (RE), Ocular Allergy (BE)',
            items: [
                { name: 'Acute conjunctivitis', eye: 'RE' },
                { name: 'Ocular Allergy', eye: 'BE' }
            ]
        },
        corneal_trauma: {
            title: 'Cornea Foreign Body / Trauma',
            desc: 'Corneal foreign Body (RE)',
            items: [
                { name: 'Corneal foreign Body', eye: 'RE' }
            ]
        },
        adnexal: {
            title: 'Adnexal & Eyelid Evaluation',
            desc: 'Entropion (RE), Chalazion (LE)',
            items: [
                { name: 'Entropion', eye: 'RE' },
                { name: 'Chalazion', eye: 'LE' }
            ]
        }
    };

    // ── Internal State ────────────────────────────────────────────────────────
    let _diagEntries = [];        // [{ id, name, eye }]
    let _diagApplyAllEye = 'BE';  // Current eye for Apply to All & new items

    // Generate unique ID for entries
    function genId() {
        return 'diag_' + Math.random().toString(36).substr(2, 9);
    }

    // Escape HTML helper
    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ── Initialization ────────────────────────────────────────────────────────
    function initDiagnosisModal() {
        renderFavoriteGrid();
        renderTemplatesMenu();
        bindGlobalEvents();
        syncFromMainField();
    }

    // ── Render Favorites Grid ─────────────────────────────────────────────────
    function renderFavoriteGrid() {
        const grid = document.getElementById('diagFavoritesGrid');
        if (!grid) return;

        grid.innerHTML = FAVORITE_DIAGNOSES.map((name) => {
            const isSelected = _diagEntries.some(e => e.name.toLowerCase() === name.toLowerCase());
            return `
                <button type="button" class="diag-fav-btn ${isSelected ? 'active' : ''}" 
                        onclick="toggleFavoriteDiagnosis('${esc(name)}')" 
                        data-diag="${esc(name)}">
                    <span>${esc(name)}</span>
                    <i class="fa-solid fa-check diag-fav-check"></i>
                </button>
            `;
        }).join('');
    }

    // ── Render Template Menu ──────────────────────────────────────────────────
    function renderTemplatesMenu() {
        const menu = document.getElementById('diagTemplateDropdown');
        if (!menu) return;

        menu.innerHTML = Object.keys(CLINICAL_TEMPLATES).map(key => {
            const t = CLINICAL_TEMPLATES[key];
            return `
                <button type="button" class="diag-template-item" onclick="loadDiagTemplate('${key}')">
                    <span class="diag-template-item-title">${esc(t.title)}</span>
                    <span class="diag-template-item-desc">${esc(t.desc)}</span>
                </button>
            `;
        }).join('');
    }

    // ── Summary List Rendering ────────────────────────────────────────────────
    function renderDiagnosisSummary() {
        const emptyEl = document.getElementById('diagSummaryEmpty');
        const listEl = document.getElementById('diagSummaryList');
        if (!emptyEl || !listEl) return;

        if (_diagEntries.length === 0) {
            emptyEl.style.display = 'block';
            listEl.style.display = 'none';
            listEl.innerHTML = '';
        } else {
            emptyEl.style.display = 'none';
            listEl.style.display = 'flex';
            listEl.innerHTML = _diagEntries.map(item => `
                <div class="diag-summary-item" data-id="${item.id}">
                    <div class="diag-item-left">
                        <div class="diag-item-eye-segment">
                            <button type="button" class="diag-mini-eye-btn ${item.eye === 'RE' ? 'active' : ''}" 
                                    onclick="updateItemEye('${item.id}', 'RE')">RE</button>
                            <button type="button" class="diag-mini-eye-btn ${item.eye === 'LE' ? 'active' : ''}" 
                                    onclick="updateItemEye('${item.id}', 'LE')">LE</button>
                            <button type="button" class="diag-mini-eye-btn ${item.eye === 'BE' ? 'active' : ''}" 
                                    onclick="updateItemEye('${item.id}', 'BE')">BE</button>
                        </div>
                        <span class="diag-item-name" title="${esc(item.name)}">${esc(item.name)}</span>
                    </div>
                    <button type="button" class="diag-item-remove-btn" onclick="removeDiagnosisItem('${item.id}')" title="Remove diagnosis">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `).join('');
        }

        // Update active states on favorite grid buttons
        document.querySelectorAll('.diag-fav-btn').forEach(btn => {
            const diagName = btn.dataset.diag || '';
            const isSelected = _diagEntries.some(e => e.name.toLowerCase() === diagName.toLowerCase());
            btn.classList.toggle('active', isSelected);
        });
    }

    // ── Open / Close Modal ────────────────────────────────────────────────────
    function openDiagnosisModal() {
        const modal = document.getElementById('diagnosisModal');
        if (!modal) return;

        // If local entries are empty but textarea has text, parse it
        if (_diagEntries.length === 0) {
            syncFromMainField();
        }

        renderFavoriteGrid();
        renderDiagnosisSummary();
        setApplyAllEye(_diagApplyAllEye);

        const searchInput = document.getElementById('diagSearchInput');
        if (searchInput) {
            searchInput.value = '';
            hideSearchDropdown();
        }
        hideTemplateDropdown();

        modal.style.display = 'flex';
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 120);
        }
    }

    function closeDiagnosisModal() {
        const modal = document.getElementById('diagnosisModal');
        if (modal) modal.style.display = 'none';
        hideSearchDropdown();
        hideTemplateDropdown();
    }

    // ── Toggle Favorite Diagnosis ─────────────────────────────────────────────
    function toggleFavoriteDiagnosis(name) {
        const idx = _diagEntries.findIndex(e => e.name.toLowerCase() === name.toLowerCase());
        if (idx !== -1) {
            _diagEntries.splice(idx, 1);
        } else {
            _diagEntries.push({
                id: genId(),
                name: name,
                eye: _diagApplyAllEye || 'BE'
            });
        }
        renderDiagnosisSummary();
    }

    // ── Add Diagnosis Item ────────────────────────────────────────────────────
    function addDiagnosisEntry(name, eye = null) {
        if (!name || !name.trim()) return;
        const cleanName = name.trim();
        const existing = _diagEntries.find(e => e.name.toLowerCase() === cleanName.toLowerCase());
        if (existing) {
            existing.eye = eye || _diagApplyAllEye || 'BE';
        } else {
            _diagEntries.push({
                id: genId(),
                name: cleanName,
                eye: eye || _diagApplyAllEye || 'BE'
            });
        }
        renderDiagnosisSummary();
    }

    // ── Remove Diagnosis Item ─────────────────────────────────────────────────
    function removeDiagnosisItem(id) {
        _diagEntries = _diagEntries.filter(e => e.id !== id);
        renderDiagnosisSummary();
    }

    // ── Update Single Item Eye ────────────────────────────────────────────────
    function updateItemEye(id, eye) {
        const item = _diagEntries.find(e => e.id === id);
        if (item) {
            item.eye = eye;
            renderDiagnosisSummary();
        }
    }

    // ── Set Apply All Eye ─────────────────────────────────────────────────────
    function setApplyAllEye(eye) {
        _diagApplyAllEye = eye || 'BE';
        document.querySelectorAll('#diagApplyEyeGroup .diag-eye-pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.eye === _diagApplyAllEye);
        });
    }

    // ── Apply Eye to All Items in Summary ─────────────────────────────────────
    function applyEyeToAll() {
        if (_diagEntries.length === 0) return;
        _diagEntries.forEach(e => {
            e.eye = _diagApplyAllEye || 'BE';
        });
        renderDiagnosisSummary();
        if (typeof showRxFeedback === 'function') {
            showRxFeedback(`Applied eye '${_diagApplyAllEye}' to all diagnoses.`, 'info');
        }
    }

    // ── Pull Last Diagnosis (Today / Patient History) ──────────────────────────
    function pullLastDiagnosis() {
        let pulledList = [];

        // 1. Try currently loaded patient object in window._rxPatient
        const pat = window._rxPatient || null;
        if (pat) {
            if (pat.diagnosis) {
                pulledList.push(pat.diagnosis);
            }
            if (pat.medical_history && !pulledList.length) {
                pulledList.push(pat.medical_history);
            }
            if (pat.surgery_type && !pulledList.length && pat.surgery_type !== 'Consultation / OPD') {
                pulledList.push(pat.surgery_type);
            }
            if (pat.visits && Array.isArray(pat.visits)) {
                for (const v of pat.visits) {
                    if (v.encounters && Array.isArray(v.encounters)) {
                        for (const enc of v.encounters) {
                            if (enc.title && enc.type !== 'Optometry' && !pulledList.includes(enc.title)) {
                                pulledList.push(enc.title);
                            }
                        }
                    }
                }
            }
        }

        // 2. Fallback to existing textarea if not pulled yet
        if (!pulledList.length) {
            const rxDiag = document.getElementById('rx_diagnosis')?.value?.trim();
            if (rxDiag) pulledList.push(rxDiag);
        }

        if (pulledList.length > 0) {
            pulledList.forEach(raw => {
                const parsed = parseDiagnosisString(raw);
                parsed.forEach(p => addDiagnosisEntry(p.name, p.eye));
            });
            renderDiagnosisSummary();
            if (typeof showRxFeedback === 'function') {
                showRxFeedback(`Pulled ${pulledList.length} diagnosis record(s) for patient.`, 'success');
            }
        } else {
            // Default clinical evaluation if no prior record exists
            addDiagnosisEntry('Refractive evaluation & routine review', 'BE');
            renderDiagnosisSummary();
            if (typeof showRxFeedback === 'function') {
                showRxFeedback('No prior diagnosis found. Loaded routine ophthalmic review.', 'info');
            }
        }
    }

    // ── Load Clinical Template ────────────────────────────────────────────────
    function loadDiagTemplate(templateKey) {
        const tmpl = CLINICAL_TEMPLATES[templateKey];
        if (!tmpl) return;

        tmpl.items.forEach(it => {
            addDiagnosisEntry(it.name, it.eye);
        });

        hideTemplateDropdown();
        if (typeof showRxFeedback === 'function') {
            showRxFeedback(`Loaded template: ${tmpl.title}`, 'success');
        }
    }

    // ── Template Dropdown Toggle ──────────────────────────────────────────────
    function toggleDiagTemplateDropdown(e) {
        if (e) e.stopPropagation();
        const dd = document.getElementById('diagTemplateDropdown');
        if (!dd) return;
        const isHidden = dd.style.display === 'none' || !dd.style.display;
        dd.style.display = isHidden ? 'block' : 'none';
        hideSearchDropdown();
    }

    function hideTemplateDropdown() {
        const dd = document.getElementById('diagTemplateDropdown');
        if (dd) dd.style.display = 'none';
    }

    // ── Search & Autocomplete ─────────────────────────────────────────────────
    function onDiagSearchInput(val) {
        const query = (val || '').trim().toLowerCase();
        const dd = document.getElementById('diagSearchDropdown');
        if (!dd) return;

        if (!query) {
            hideSearchDropdown();
            return;
        }

        const matches = DIAGNOSIS_CATALOG.filter(d => d.toLowerCase().includes(query)).slice(0, 8);

        if (matches.length === 0) {
            dd.innerHTML = `
                <div class="diag-search-item" onclick="selectSearchDiagnosis('${esc(val.trim())}')">
                    <span>Add "<strong>${esc(val.trim())}</strong>"</span>
                    <span class="diag-search-item-badge">Custom</span>
                </div>
            `;
        } else {
            dd.innerHTML = matches.map(m => `
                <div class="diag-search-item" onclick="selectSearchDiagnosis('${esc(m)}')">
                    <span>${highlightMatch(m, query)}</span>
                    <span class="diag-search-item-badge">Ophthalmic</span>
                </div>
            `).join('');
        }
        dd.style.display = 'block';
    }

    function highlightMatch(text, query) {
        const idx = text.toLowerCase().indexOf(query);
        if (idx === -1) return esc(text);
        return esc(text.substring(0, idx)) +
            '<strong>' + esc(text.substring(idx, idx + query.length)) + '</strong>' +
            esc(text.substring(idx + query.length));
    }

    function selectSearchDiagnosis(name) {
        addDiagnosisEntry(name, _diagApplyAllEye || 'BE');
        const input = document.getElementById('diagSearchInput');
        if (input) input.value = '';
        hideSearchDropdown();
    }

    function onDiagSearchKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = document.getElementById('diagSearchInput');
            const val = (input?.value || '').trim();
            if (val) {
                selectSearchDiagnosis(val);
            }
        } else if (e.key === 'Escape') {
            hideSearchDropdown();
        }
    }

    function hideSearchDropdown() {
        const dd = document.getElementById('diagSearchDropdown');
        if (dd) dd.style.display = 'none';
    }

    // ── Save Diagnosis Modal ──────────────────────────────────────────────────
    async function saveDiagnosisModal() {
        const formatted = formatDiagnosisSummaryText();
        const rxDiagField = document.getElementById('rx_diagnosis');
        if (rxDiagField) {
            rxDiagField.value = formatted;
        }

        updateEMRDiagnosisDisplay();
        closeDiagnosisModal();

        // Save draft in sessionStorage for patient
        const pat = window._rxPatient;
        if (pat && pat.mrn) {
            try {
                sessionStorage.setItem('rx_draft_diagnosis_' + pat.mrn, JSON.stringify(_diagEntries));
            } catch (e) {}
        }

        // Persist via AJAX if doctor has opened prescription
        const saveBtn = document.querySelector('.btn-diag-save');
        const origHtml = saveBtn ? saveBtn.innerHTML : 'Save Diagnosis';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        }

        try {
            const rxPrescriptionId = window._rxPrescriptionId || null;
            if (pat && pat.mrn) {
                const payload = new FormData();
                payload.append('save_diagnosis', '1');
                payload.append('diagnosis_summary', formatted);
                payload.append('diagnosis_json', JSON.stringify(_diagEntries));
                if (rxPrescriptionId) {
                    payload.append('prescription_id', rxPrescriptionId);
                }
                payload.append('patient_mrn', pat.mrn || '');
                payload.append('patient_name', pat.name || '');

                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
                await fetch('/naimul/profile/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: payload
                });
            }
        } catch (e) {
            // Silently handled; local field is already updated
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = origHtml;
            }
        }

        if (typeof showRxFeedback === 'function') {
            showRxFeedback('Diagnosis saved to prescription.', 'success');
        }
    }

    // ── Format Summary Text for Main EMR Field ────────────────────────────────
    function formatDiagnosisSummaryText() {
        if (_diagEntries.length === 0) return '';
        return _diagEntries.map(e => {
            const eyeLabel = e.eye || 'BE';
            return `${e.name} (${eyeLabel})`;
        }).join(', ');
    }

    // ── Update Left Sidebar EMR Display ───────────────────────────────────────
    function updateEMRDiagnosisDisplay() {
        const displayEl = document.getElementById('emr_diagnosis_display');
        const rxDiagField = document.getElementById('rx_diagnosis');
        if (!displayEl) return;

        if (_diagEntries.length === 0) {
            const textVal = (rxDiagField?.value || '').trim();
            if (textVal) {
                // If there is legacy text without parsed entries, parse it
                const parsed = parseDiagnosisString(textVal);
                if (parsed.length > 0) {
                    _diagEntries = parsed;
                    return updateEMRDiagnosisDisplay();
                }
            }

            displayEl.innerHTML = `
                <div class="emr-empty-complaints-hint">
                    <i class="fa-solid fa-stethoscope"></i>
                    <span>Click to record diagnosis...</span>
                </div>
            `;
            return;
        }

        displayEl.innerHTML = `
            <div class="emr-diagnosis-pill-list">
                ${_diagEntries.map(e => `
                    <div class="emr-diagnosis-badge-row">
                        <div class="emr-diag-badge-left">
                            <span class="emr-diag-eye-tag">${esc(e.eye || 'BE')}</span>
                            <span class="emr-diag-name-tag">${esc(e.name)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ── Parse Diagnosis String ────────────────────────────────────────────────
    function parseDiagnosisString(str) {
        if (!str || !str.trim()) return [];
        const result = [];
        // Split by semicolon, newline, or comma
        const tokens = str.split(/[;\n]/).map(s => s.trim()).filter(Boolean);

        const reParen = /^(.+?)\s*\((RE|LE|BE|Right Eye|Left Eye|Both Eyes|OD|OS|OU)\)$/i;
        const rePrefix = /^(RE|LE|BE|Right Eye|Left Eye|Both Eyes|OD|OS|OU)\s*:\s*(.+)$/i;

        const normalizeEye = (raw) => {
            const u = (raw || '').toUpperCase().trim();
            if (u === 'RE' || u === 'RIGHT EYE' || u === 'OD') return 'RE';
            if (u === 'LE' || u === 'LEFT EYE' || u === 'OS') return 'LE';
            return 'BE';
        };

        tokens.forEach(tok => {
            // Further split by comma if not inside parenthesis
            const subparts = tok.split(',').map(s => s.trim()).filter(Boolean);
            subparts.forEach(p => {
                let m = p.match(reParen);
                if (m) {
                    result.push({
                        id: genId(),
                        name: m[1].trim(),
                        eye: normalizeEye(m[2])
                    });
                    return;
                }
                m = p.match(rePrefix);
                if (m) {
                    result.push({
                        id: genId(),
                        name: m[2].trim(),
                        eye: normalizeEye(m[1])
                    });
                    return;
                }
                // Bare string
                if (p.trim()) {
                    result.push({
                        id: genId(),
                        name: p.trim(),
                        eye: 'BE'
                    });
                }
            });
        });

        return result;
    }

    // ── Sync from Main Field on Load ──────────────────────────────────────────
    function syncFromMainField() {
        const rxDiagField = document.getElementById('rx_diagnosis');
        const val = (rxDiagField?.value || '').trim();
        if (val) {
            _diagEntries = parseDiagnosisString(val);
        } else {
            _diagEntries = [];
        }
        updateEMRDiagnosisDisplay();
    }

    // ── Global Document Click & Key Listeners ─────────────────────────────────
    function bindGlobalEvents() {
        document.addEventListener('click', function (e) {
            // Close dropdowns on click outside
            if (!e.target.closest('.diag-search-wrap')) {
                hideSearchDropdown();
            }
            if (!e.target.closest('.diag-template-wrap')) {
                hideTemplateDropdown();
            }

            // Close modal on backdrop click
            const modal = document.getElementById('diagnosisModal');
            if (modal && e.target === modal) {
                closeDiagnosisModal();
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('diagnosisModal');
                if (modal && modal.style.display === 'flex') {
                    closeDiagnosisModal();
                }
            }
        });
    }

    // ── Reset Diagnosis State (e.g. for new patient) ──────────────────────────
    function resetDiagnosisState() {
        _diagEntries = [];
        _diagApplyAllEye = 'BE';
        const rxDiagField = document.getElementById('rx_diagnosis');
        if (rxDiagField) rxDiagField.value = '';
        updateEMRDiagnosisDisplay();
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDiagnosisModal);
    } else {
        initDiagnosisModal();
    }

    // ── Expose Globally ───────────────────────────────────────────────────────
    window.openDiagnosisModal         = openDiagnosisModal;
    window.closeDiagnosisModal        = closeDiagnosisModal;
    window.pullLastDiagnosis          = pullLastDiagnosis;
    window.toggleFavoriteDiagnosis    = toggleFavoriteDiagnosis;
    window.addDiagnosisEntry          = addDiagnosisEntry;
    window.removeDiagnosisItem        = removeDiagnosisItem;
    window.updateItemEye              = updateItemEye;
    window.setApplyAllEye             = setApplyAllEye;
    window.applyEyeToAll              = applyEyeToAll;
    window.saveDiagnosisModal         = saveDiagnosisModal;
    window.updateEMRDiagnosisDisplay  = updateEMRDiagnosisDisplay;
    window.resetDiagnosisState        = resetDiagnosisState;
    window.loadDiagTemplate           = loadDiagTemplate;
    window.toggleDiagTemplateDropdown = toggleDiagTemplateDropdown;
    window.onDiagSearchInput          = onDiagSearchInput;
    window.selectSearchDiagnosis      = selectSearchDiagnosis;
    window.onDiagSearchKeydown        = onDiagSearchKeydown;

})();
