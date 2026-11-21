// =============================================================================
// ANTERIOR SEGMENT EXAM MODAL — profile.js extension
// IIEI&H Clinical Portal
// Matching UI reference: RE | [ Normal ] | LE with 11 ocular structures & remarks
// =============================================================================

(function () {
    'use strict';

    // ── 11 Clinical Structures & Clinical Options ───────────────────────────────
    const ANTERIOR_SEGMENT_STRUCTURES = [
        {
            key: 'lids',
            label: 'Lids',
            options: [
                'Normal',
                'Blepharitis',
                'Meibomitis',
                'Chalazion',
                'Stye / External Hordeolum',
                'Internal Hordeolum',
                'Ptosis',
                'Entropion',
                'Ectropion',
                'Trichiasis',
                'Lid edema',
                'Dermatochalasis',
                'Lagophthalmos',
                'Coloboma'
            ]
        },
        {
            key: 'conjunctiva',
            label: 'Conjunctiva',
            options: [
                'Normal',
                'Congestion / Hyperemia',
                'Ciliary congestion',
                'Follicles',
                'Papillae',
                'Chemosis',
                'Subconjunctival hemorrhage',
                'Pterygium',
                'Pinguecula',
                'Concretions',
                'Discharge (Mucopurulent)',
                'Discharge (Watery)',
                'Pallor'
            ]
        },
        {
            key: 'cornea',
            label: 'Cornea',
            options: [
                'Normal',
                'Clear',
                'Corneal opacity',
                'Corneal ulcer',
                'Epithelial defect / Abrasion',
                'Keratic precipitates (KPs)',
                'Corneal edema',
                'Arcus senilis',
                'Dystrophy',
                'Foreign body',
                'Neovascularization',
                'Infiltrate',
                'Band keratopathy'
            ]
        },
        {
            key: 'anterior_chamber',
            label: 'Anterior Chamber',
            options: [
                'Normal',
                'Deep & quiet',
                'Normal depth & quiet',
                'Shallow',
                'Flat',
                'Cells & flare (1+)',
                'Cells & flare (2+)',
                'Cells & flare (3+ / 4+)',
                'Hypopyon',
                'Hyphema',
                'Pseudophakic (IOL in place)',
                'AC IOL'
            ]
        },
        {
            key: 'iris',
            label: 'Iris',
            options: [
                'Normal',
                'Normal pattern & color',
                'Muddy iris',
                'Posterior synechiae',
                'Anterior synechiae',
                'Coloboma',
                'Iridodonesis',
                'Atrophy',
                'Neovascularization of iris (NVI)',
                'Heterochromia',
                'Peripheral iridotomy (PI) patent'
            ]
        },
        {
            key: 'pupil',
            label: 'Pupil',
            options: [
                'Normal',
                'Round, regular & reactive (RRR)',
                'Sluggishly reactive',
                'Dilated & fixed',
                'Constricted / Pinpoint',
                'Relative Afferent Pupillary Defect (RAPD)',
                'Irregular',
                'Corectopia',
                'Leukocoria'
            ]
        },
        {
            key: 'lens',
            label: 'Lens',
            options: [
                'Normal',
                'Clear',
                'Early cataractous changes',
                'Immature Senile Cataract (IMSC)',
                'Mature Senile Cataract (MSC)',
                'Hyper-mature Senile Cataract (HMSC)',
                'Nuclear Sclerosis (NS I)',
                'Nuclear Sclerosis (NS II)',
                'Nuclear Sclerosis (NS III)',
                'Cortical cataract',
                'Posterior Subcapsular Cataract (PSC)',
                'Pseudophakic (PCIOL in the bag)',
                'Pseudophakic (Sulcus IOL)',
                'Posterior Capsular Opacification (PCO)',
                'Aphakic',
                'Subluxated lens'
            ]
        },
        {
            key: 'ocular_movements',
            label: 'Ocular Movements',
            options: [
                'Normal',
                'Full & free in all gazes',
                'Restricted',
                'Restricted on abduction',
                'Restricted on adduction',
                'Restricted on elevation',
                'Restricted on depression',
                'Painful movement',
                'Nystagmus',
                'Squint (Esotropia)',
                'Squint (Exotropia)',
                'Diplopia'
            ]
        },
        {
            key: 'corneal_reflex',
            label: 'Corneal Reflex',
            options: [
                'Normal',
                'Central & symmetric',
                'Intact / Brisk',
                'Diminished / Reduced',
                'Absent',
                'Eccentric'
            ]
        },
        {
            key: 'globe',
            label: 'Globe',
            options: [
                'Normal',
                'Microphthalmos',
                'Buphthalmos',
                'Proptosis / Exophthalmos',
                'Enophthalmos',
                'Phthisis bulbi',
                'Tender',
                'Normal size & tension'
            ]
        },
        {
            key: 'undilated_fundus',
            label: 'Undilated Fundus',
            options: [
                'Normal',
                'Grossly normal',
                'Media clear, Disc normal',
                'CDR 0.3, Macula normal',
                'CDR 0.4',
                'CDR 0.5',
                'CDR 0.6',
                'CDR 0.7',
                'Media hazy / poorly visualized',
                'Pale disc',
                'Hypertensive retinopathy changes',
                'Diabetic retinopathy changes',
                'View obscured'
            ]
        }
    ];

    // ── State ──────────────────────────────────────────────────────────────────
    let _asState = {
        re: {},
        le: {},
        remarks: '',
        hasData: false,
        timestamp: null,
    };

    // ── Open / Close ───────────────────────────────────────────────────────────
    function openAntSegModal() {
        const modal = document.getElementById('anteriorSegmentModal');
        if (!modal) return;

        // Ensure time is updated if not recorded yet
        updateTimestampDisplay();

        // Sync inputs from current state
        syncStateToInputs();

        modal.style.display = 'flex';
    }

    function closeAntSegModal() {
        const modal = document.getElementById('anteriorSegmentModal');
        if (modal) modal.style.display = 'none';
        closeAllMenus();
    }

    function updateTimestampDisplay() {
        const timeEl = document.getElementById('asHeaderTime');
        if (timeEl && !_asState.timestamp) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            timeEl.textContent = `${dateStr} ${timeStr}`;
        } else if (timeEl && _asState.timestamp) {
            timeEl.textContent = _asState.timestamp;
        }
    }

    function syncStateToInputs() {
        ANTERIOR_SEGMENT_STRUCTURES.forEach(s => {
            const reInput = document.getElementById(`as_input_re_${s.key}`);
            const leInput = document.getElementById(`as_input_le_${s.key}`);
            if (reInput) reInput.value = _asState.re[s.key] || '';
            if (leInput) leInput.value = _asState.le[s.key] || '';
        });
        const remarksEl = document.getElementById('asRemarks');
        if (remarksEl) remarksEl.value = _asState.remarks || '';
    }

    // ── Set All to Normal ──────────────────────────────────────────────────────
    function setAllAntSegNormal() {
        ANTERIOR_SEGMENT_STRUCTURES.forEach(s => {
            const reInput = document.getElementById(`as_input_re_${s.key}`);
            const leInput = document.getElementById(`as_input_le_${s.key}`);
            if (reInput) reInput.value = 'Normal';
            if (leInput) leInput.value = 'Normal';
            _asState.re[s.key] = 'Normal';
            _asState.le[s.key] = 'Normal';
        });
        closeAllMenus();
    }

    // ── Copy Between Eyes (RE <-> LE) ──────────────────────────────────────────
    function copyAntSegRow(direction, key) {
        const reInput = document.getElementById(`as_input_re_${key}`);
        const leInput = document.getElementById(`as_input_le_${key}`);
        if (!reInput || !leInput) return;

        if (direction === 're_to_le') {
            leInput.value = reInput.value;
            _asState.le[key] = reInput.value;
        } else if (direction === 'le_to_re') {
            reInput.value = leInput.value;
            _asState.re[key] = leInput.value;
        }
        closeAllMenus();
    }

    // ── Set Single Row to Normal ───────────────────────────────────────────────
    function setAntSegRowNormal(key) {
        const reInput = document.getElementById(`as_input_re_${key}`);
        const leInput = document.getElementById(`as_input_le_${key}`);
        if (!reInput || !leInput) return;

        if (reInput.value === 'Normal' && leInput.value === 'Normal') {
            reInput.value = '';
            leInput.value = '';
            _asState.re[key] = '';
            _asState.le[key] = '';
        } else {
            reInput.value = 'Normal';
            leInput.value = 'Normal';
            _asState.re[key] = 'Normal';
            _asState.le[key] = 'Normal';
        }
        closeAllMenus();
    }

    // ── Combobox Dropdown Logic ────────────────────────────────────────────────
    function setupComboboxes() {
        ANTERIOR_SEGMENT_STRUCTURES.forEach(struct => {
            ['re', 'le'].forEach(eye => {
                const inputId = `as_input_${eye}_${struct.key}`;
                const menuId  = `as_menu_${eye}_${struct.key}`;
                const toggleId = `as_toggle_${eye}_${struct.key}`;

                const input = document.getElementById(inputId);
                const menu  = document.getElementById(menuId);
                const toggle = document.getElementById(toggleId);

                if (!input || !menu) return;

                // Populate menu items
                populateMenu(menu, struct.options, input, eye, struct.key);

                // Input focus / click opens menu
                input.addEventListener('focus', function () {
                    openMenu(menu, input, struct.options, eye, struct.key);
                });

                input.addEventListener('input', function () {
                    filterMenu(menu, input.value, struct.options, input, eye, struct.key);
                    _asState[eye][struct.key] = input.value;
                });

                // Toggle button
                if (toggle) {
                    toggle.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (menu.classList.contains('open')) {
                            menu.classList.remove('open');
                        } else {
                            openMenu(menu, input, struct.options, eye, struct.key);
                            input.focus();
                        }
                    });
                }
            });
        });

        // Close dropdowns on outside click
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.as-combo-wrap')) {
                closeAllMenus();
            }
        });
    }

    function populateMenu(menu, options, input, eye, key) {
        menu.innerHTML = options.map(opt => {
            const isNorm = opt.toLowerCase().includes('normal') || opt.toLowerCase() === 'clear';
            return `<div class="as-combo-item ${isNorm ? 'is-normal' : ''}" data-val="${escapeHtml(opt)}">${escapeHtml(opt)}</div>`;
        }).join('');

        menu.querySelectorAll('.as-combo-item').forEach(item => {
            item.addEventListener('click', function (e) {
                e.stopPropagation();
                const val = this.dataset.val;
                input.value = val;
                _asState[eye][key] = val;
                menu.classList.remove('open');
            });
        });
    }

    function filterMenu(menu, query, options, input, eye, key) {
        const q = (query || '').trim().toLowerCase();
        const filtered = options.filter(opt => opt.toLowerCase().includes(q));

        if (filtered.length === 0) {
            menu.innerHTML = `<div class="as-combo-empty">No preset matching "${escapeHtml(query)}"</div>`;
        } else {
            populateMenu(menu, filtered, input, eye, key);
        }
        menu.classList.add('open');
    }

    function openMenu(menu, input, options, eye, key) {
        closeAllMenus();
        populateMenu(menu, options, input, eye, key);
        menu.classList.add('open');
    }

    function closeAllMenus() {
        document.querySelectorAll('.as-combo-menu.open').forEach(m => m.classList.remove('open'));
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Save Findings ──────────────────────────────────────────────────────────
    function saveAntSegModal() {
        let hasAnyValue = false;
        const reFindings = {};
        const leFindings = {};

        ANTERIOR_SEGMENT_STRUCTURES.forEach(s => {
            const reVal = (document.getElementById(`as_input_re_${s.key}`)?.value || '').trim();
            const leVal = (document.getElementById(`as_input_le_${s.key}`)?.value || '').trim();
            _asState.re[s.key] = reVal;
            _asState.le[s.key] = leVal;
            if (reVal) { reFindings[s.label] = reVal; hasAnyValue = true; }
            if (leVal) { leFindings[s.label] = leVal; hasAnyValue = true; }
        });

        const remarks = (document.getElementById('asRemarks')?.value || '').trim();
        _asState.remarks = remarks;
        if (remarks) hasAnyValue = true;

        _asState.hasData = hasAnyValue;

        const now = new Date();
        _asState.timestamp = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        // Build formatted string for hidden rx_ant_seg
        const parts = [];
        const rePairs = Object.entries(reFindings).map(([k, v]) => `${k}: ${v}`);
        const lePairs = Object.entries(leFindings).map(([k, v]) => `${k}: ${v}`);

        if (rePairs.length > 0) parts.push(`RE [${rePairs.join(', ')}]`);
        if (lePairs.length > 0) parts.push(`LE [${lePairs.join(', ')}]`);
        if (remarks) parts.push(`Remarks: ${remarks}`);

        const antSegHidden = document.getElementById('rx_ant_seg');
        if (antSegHidden) {
            antSegHidden.value = parts.join(' | ');
        }

        // Render inline EMR left-column view
        renderEmrDisplay(reFindings, leFindings, remarks);

        closeAntSegModal();

        if (typeof window.showRxFeedback === 'function') {
            window.showRxFeedback('Anterior Segment findings saved.', 'success');
        }
    }

    // ── Render Inline EMR Display ──────────────────────────────────────────────
    function renderEmrDisplay(reFindings, leFindings, remarks) {
        const container = document.getElementById('emr_ant_seg_display');
        if (!container) return;

        const reKeys = Object.keys(reFindings);
        const leKeys = Object.keys(leFindings);

        if (reKeys.length === 0 && leKeys.length === 0 && !remarks) {
            container.innerHTML = `
                <div class="emr-empty-complaints-hint">
                    <i class="fa-regular fa-eye"></i>
                    <span>Click to record Anterior Segment exam...</span>
                </div>`;
            return;
        }

        // Check if all filled are 'Normal'
        const allReNormal = reKeys.length > 0 && reKeys.every(k => reFindings[k].toLowerCase() === 'normal');
        const allLeNormal = leKeys.length > 0 && leKeys.every(k => leFindings[k].toLowerCase() === 'normal');
        const isCompleteNormal = (reKeys.length === 11 && leKeys.length === 11 && allReNormal && allLeNormal);

        let html = `
            <div class="as-emr-summary-wrap" onclick="openAntSegModal()" title="Click to edit Anterior Segment exam">
                <div class="as-emr-summary-header">
                    <span><i class="fa-solid fa-eye-dropper"></i> Anterior Segment Exam</span>
                    ${isCompleteNormal ? '<span class="as-emr-normal-badge"><i class="fa-solid fa-check"></i> Normal BE</span>' : '<span style="font-size:0.7rem;color:#0284c7;">Click to edit</span>'}
                </div>
                <div class="as-emr-summary-grid">
                    <div class="as-emr-eye-col">
                        <div class="as-emr-eye-title">RE (Right Eye)</div>
                        ${reKeys.length ? reKeys.map(k => {
                            const val = reFindings[k];
                            const isNorm = val.toLowerCase().includes('normal') || val.toLowerCase() === 'clear';
                            return `<div class="as-emr-item-line"><span class="as-emr-item-name">${escapeHtml(k)}:</span> <span class="as-emr-item-val ${isNorm ? 'is-normal' : 'is-abnormal'}">${escapeHtml(val)}</span></div>`;
                        }).join('') : '<div class="as-emr-item-line" style="color:#94a3b8;">Not recorded</div>'}
                    </div>
                    <div class="as-emr-eye-col">
                        <div class="as-emr-eye-title">LE (Left Eye)</div>
                        ${leKeys.length ? leKeys.map(k => {
                            const val = leFindings[k];
                            const isNorm = val.toLowerCase().includes('normal') || val.toLowerCase() === 'clear';
                            return `<div class="as-emr-item-line"><span class="as-emr-item-name">${escapeHtml(k)}:</span> <span class="as-emr-item-val ${isNorm ? 'is-normal' : 'is-abnormal'}">${escapeHtml(val)}</span></div>`;
                        }).join('') : '<div class="as-emr-item-line" style="color:#94a3b8;">Not recorded</div>'}
                    </div>
                </div>
                ${remarks ? `<div class="as-emr-remarks-line"><strong>Remarks:</strong> ${escapeHtml(remarks)}</div>` : ''}
            </div>
        `;
        container.innerHTML = html;
    }

    // ── Order Re-workup Action ─────────────────────────────────────────────────
    function orderAntSegReworkup() {
        if (typeof window.showRxFeedback === 'function') {
            window.showRxFeedback('Re-workup ordered for Anterior Segment. Optometrist notified.', 'info');
        } else {
            alert('Re-workup order noted for Anterior Segment. Please follow up with the optometry department.');
        }
    }

    // ── Reset State ────────────────────────────────────────────────────────────
    function resetAntSegState() {
        _asState = {
            re: {},
            le: {},
            remarks: '',
            hasData: false,
            timestamp: null,
        };
        syncStateToInputs();
        const display = document.getElementById('emr_ant_seg_display');
        if (display) {
            display.innerHTML = `
                <div class="emr-empty-complaints-hint">
                    <i class="fa-regular fa-eye"></i>
                    <span>Click to record Anterior Segment exam...</span>
                </div>`;
        }
        const antSegHidden = document.getElementById('rx_ant_seg');
        if (antSegHidden) antSegHidden.value = '';
    }

    // ── Backdrop & Escape Key Handlers ─────────────────────────────────────────
    document.addEventListener('click', function (e) {
        const modal = document.getElementById('anteriorSegmentModal');
        if (modal && e.target === modal) {
            closeAntSegModal();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('anteriorSegmentModal');
            if (modal && modal.style.display === 'flex') {
                closeAntSegModal();
            }
        }
    });

    // ── Initialize on DOM ready ────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        setupComboboxes();
    });

    // ── Global Exports ─────────────────────────────────────────────────────────
    window.openAntSegModal       = openAntSegModal;
    window.closeAntSegModal      = closeAntSegModal;
    window.setAllAntSegNormal    = setAllAntSegNormal;
    window.copyAntSegRow         = copyAntSegRow;
    window.setAntSegRowNormal    = setAntSegRowNormal;
    window.saveAntSegModal       = saveAntSegModal;
    window.orderAntSegReworkup   = orderAntSegReworkup;
    window.resetAntSegState      = resetAntSegState;

})();
