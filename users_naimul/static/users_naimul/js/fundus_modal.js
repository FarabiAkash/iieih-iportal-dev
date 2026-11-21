// =============================================================================
// FUNDUS EXAMINATION MODAL — profile.js extension
// IIEI&H Clinical Portal
// Matching UI reference: Dilated pupil? (Yes/No) | RE | [ Normal ] | LE
// 5 Ocular structures: Media, Disc, Vessels, Background retina, Macula/Foveal Reflex
// =============================================================================

(function () {
    'use strict';

    // ── 5 Clinical Structures & Comprehensive Ophthalmic Presets ───────────────
    const FUNDUS_STRUCTURES = [
        {
            key: 'media',
            label: 'Media',
            options: [
                'Normal',
                'Clear',
                'Hazy',
                'Vitreous haze (1+)',
                'Vitreous haze (2+)',
                'Vitreous haze (3+)',
                'Vitreous hemorrhage',
                'Asteroid hyalosis',
                'Posterior vitreous detachment (PVD)',
                'Vitreous floaters',
                'Lens opacity',
                'Media hazy / view obscured'
            ]
        },
        {
            key: 'disc',
            label: 'Disc',
            options: [
                'Normal',
                'CDR 0.3',
                'CDR 0.4',
                'CDR 0.5',
                'CDR 0.6',
                'CDR 0.7',
                'CDR 0.8',
                'CDR 0.9',
                'Deep cup',
                'Glaucomatous cupping',
                'Pale disc / Optic atrophy',
                'Hyperemic disc',
                'Papilledema / Disc edema',
                'Temporal pallor',
                'Peripapillary atrophy (PPA)',
                'Notched neuroretinal rim',
                'Blurry margins',
                'Coloboma of disc'
            ]
        },
        {
            key: 'vessels',
            label: 'Vessels',
            options: [
                'Normal',
                'Normal caliber & course',
                'Attenuated arterioles',
                'Arteriolar narrowing (Grade 1)',
                'Arteriolar narrowing (Grade 2)',
                'Silver wiring',
                'Copper wiring',
                'AV crossing changes (nicking)',
                'Tortuous vessels',
                'Neovascularization elsewhere (NVE)',
                'Neovascularization of disc (NVD)',
                'Venous engorgement',
                'Ghost vessels',
                'Vessel tortuosity'
            ]
        },
        {
            key: 'background_retina',
            label: 'Background retina',
            options: [
                'Normal',
                'Normal & flat',
                'Microaneurysms',
                'Dot & blot hemorrhages',
                'Flame-shaped hemorrhages',
                'Hard exudates',
                'Cotton wool spots (soft exudates)',
                'Drusen',
                'Retinal detachment (RD)',
                'Retinal tear / hole',
                'Lattice degeneration',
                'Chorioretinal scar / Atrophic patch',
                'Subretinal fluid (SRF)',
                'Pigmentary changes / RP',
                'Diabetic retinopathy changes',
                'Hypertensive retinopathy changes',
                'Tessellated fundus / Myopic atrophy'
            ]
        },
        {
            key: 'macula_foveal_reflex',
            label: 'Macula/Foveal Reflex',
            options: [
                'Normal',
                'Foveal reflex present',
                'Foveal reflex dull',
                'Foveal reflex absent',
                'Clinically Significant Macular Edema (CSME)',
                'Macular edema',
                'Macular hole (Full thickness)',
                'Macular hole (Lamellar)',
                'Epiretinal membrane (ERM)',
                'Dry AMD',
                'Wet AMD / CNVM',
                'Drusen at macula',
                'Macular scar / Disciform scar',
                'Cherry red spot',
                'Cystoid macular edema (CME)'
            ]
        }
    ];

    // ── State ──────────────────────────────────────────────────────────────────
    let _fundusState = {
        dilated: null, // 'yes' | 'no' | null
        re: {},
        le: {},
        remarks: '',
        hasData: false,
        timestamp: null,
    };

    // ── Open / Close ───────────────────────────────────────────────────────────
    function openFundusModal() {
        const modal = document.getElementById('fundusModal');
        if (!modal) return;

        // Ensure timestamp is updated
        updateTimestampDisplay();

        // Sync inputs from current state
        syncStateToInputs();

        modal.style.display = 'flex';
    }

    function closeFundusModal() {
        const modal = document.getElementById('fundusModal');
        if (modal) modal.style.display = 'none';
        closeAllMenus();
    }

    function updateTimestampDisplay() {
        const timeEl = document.getElementById('fundusHeaderTime');
        if (timeEl && !_fundusState.timestamp) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            timeEl.textContent = `${dateStr} ${timeStr}`;
        } else if (timeEl && _fundusState.timestamp) {
            timeEl.textContent = _fundusState.timestamp;
        }
    }

    function syncStateToInputs() {
        // Dilated toggle buttons
        const btnYes = document.getElementById('fundus_dilated_yes');
        const btnNo = document.getElementById('fundus_dilated_no');
        if (btnYes) btnYes.classList.toggle('active', _fundusState.dilated === 'yes');
        if (btnNo) btnNo.classList.toggle('active', _fundusState.dilated === 'no');

        // Row inputs
        FUNDUS_STRUCTURES.forEach(s => {
            const reInput = document.getElementById(`fundus_input_re_${s.key}`);
            const leInput = document.getElementById(`fundus_input_le_${s.key}`);
            if (reInput) reInput.value = _fundusState.re[s.key] || '';
            if (leInput) leInput.value = _fundusState.le[s.key] || '';
        });

        // Remarks
        const remarksEl = document.getElementById('fundusRemarks');
        if (remarksEl) remarksEl.value = _fundusState.remarks || '';
    }

    // ── Dilated Pupil Toggle ───────────────────────────────────────────────────
    function setFundusDilated(val) {
        if (_fundusState.dilated === val) {
            _fundusState.dilated = null; // Toggle off if clicked again
        } else {
            _fundusState.dilated = val;
        }
        const btnYes = document.getElementById('fundus_dilated_yes');
        const btnNo = document.getElementById('fundus_dilated_no');
        if (btnYes) btnYes.classList.toggle('active', _fundusState.dilated === 'yes');
        if (btnNo) btnNo.classList.toggle('active', _fundusState.dilated === 'no');
    }

    // ── Set All to Normal ──────────────────────────────────────────────────────
    function setAllFundusNormal() {
        FUNDUS_STRUCTURES.forEach(s => {
            const reInput = document.getElementById(`fundus_input_re_${s.key}`);
            const leInput = document.getElementById(`fundus_input_le_${s.key}`);
            if (reInput) reInput.value = 'Normal';
            if (leInput) leInput.value = 'Normal';
            _fundusState.re[s.key] = 'Normal';
            _fundusState.le[s.key] = 'Normal';
        });
        closeAllMenus();
    }

    // ── Copy Between Eyes (RE <-> LE) ──────────────────────────────────────────
    function copyFundusRow(direction, key) {
        const reInput = document.getElementById(`fundus_input_re_${key}`);
        const leInput = document.getElementById(`fundus_input_le_${key}`);
        if (!reInput || !leInput) return;

        if (direction === 're_to_le') {
            leInput.value = reInput.value;
            _fundusState.le[key] = reInput.value;
        } else if (direction === 'le_to_re') {
            reInput.value = leInput.value;
            _fundusState.re[key] = leInput.value;
        }
        closeAllMenus();
    }

    // ── Set Single Row to Normal ───────────────────────────────────────────────
    function setFundusRowNormal(key) {
        const reInput = document.getElementById(`fundus_input_re_${key}`);
        const leInput = document.getElementById(`fundus_input_le_${key}`);
        if (!reInput || !leInput) return;

        if (reInput.value === 'Normal' && leInput.value === 'Normal') {
            reInput.value = '';
            leInput.value = '';
            _fundusState.re[key] = '';
            _fundusState.le[key] = '';
        } else {
            reInput.value = 'Normal';
            leInput.value = 'Normal';
            _fundusState.re[key] = 'Normal';
            _fundusState.le[key] = 'Normal';
        }
        closeAllMenus();
    }

    // ── Combobox Dropdown Logic ────────────────────────────────────────────────
    function setupComboboxes() {
        FUNDUS_STRUCTURES.forEach(struct => {
            ['re', 'le'].forEach(eye => {
                const inputId  = `fundus_input_${eye}_${struct.key}`;
                const menuId   = `fundus_menu_${eye}_${struct.key}`;
                const toggleId = `fundus_toggle_${eye}_${struct.key}`;

                const input  = document.getElementById(inputId);
                const menu   = document.getElementById(menuId);
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
                    _fundusState[eye][struct.key] = input.value;
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
            if (!e.target.closest('.fundus-combo-wrap')) {
                closeAllMenus();
            }
        });
    }

    function populateMenu(menu, options, input, eye, key) {
        menu.innerHTML = options.map(opt => {
            const isNorm = opt.toLowerCase().includes('normal') || opt.toLowerCase() === 'clear';
            return `<div class="fundus-combo-item ${isNorm ? 'is-normal' : ''}" data-val="${escapeHtml(opt)}">${escapeHtml(opt)}</div>`;
        }).join('');

        menu.querySelectorAll('.fundus-combo-item').forEach(item => {
            item.addEventListener('click', function (e) {
                e.stopPropagation();
                const val = this.dataset.val;
                input.value = val;
                _fundusState[eye][key] = val;
                menu.classList.remove('open');
            });
        });
    }

    function filterMenu(menu, query, options, input, eye, key) {
        const q = (query || '').trim().toLowerCase();
        const filtered = options.filter(opt => opt.toLowerCase().includes(q));

        if (filtered.length === 0) {
            menu.innerHTML = `<div class="fundus-combo-empty">No preset matching "${escapeHtml(query)}"</div>`;
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
        document.querySelectorAll('.fundus-combo-menu.open').forEach(m => m.classList.remove('open'));
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Save Findings ──────────────────────────────────────────────────────────
    function saveFundusModal() {
        let hasAnyValue = false;
        const reFindings = {};
        const leFindings = {};

        FUNDUS_STRUCTURES.forEach(s => {
            const reVal = (document.getElementById(`fundus_input_re_${s.key}`)?.value || '').trim();
            const leVal = (document.getElementById(`fundus_input_le_${s.key}`)?.value || '').trim();
            _fundusState.re[s.key] = reVal;
            _fundusState.le[s.key] = leVal;
            if (reVal) { reFindings[s.label] = reVal; hasAnyValue = true; }
            if (leVal) { leFindings[s.label] = leVal; hasAnyValue = true; }
        });

        const remarks = (document.getElementById('fundusRemarks')?.value || '').trim();
        _fundusState.remarks = remarks;
        if (remarks) hasAnyValue = true;
        if (_fundusState.dilated) hasAnyValue = true;

        _fundusState.hasData = hasAnyValue;

        const now = new Date();
        _fundusState.timestamp = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        // Build formatted string for hidden rx_fundus
        const parts = [];
        if (_fundusState.dilated) {
            parts.push(`Dilated: ${_fundusState.dilated === 'yes' ? 'Yes' : 'No'}`);
        }
        const rePairs = Object.entries(reFindings).map(([k, v]) => `${k}: ${v}`);
        const lePairs = Object.entries(leFindings).map(([k, v]) => `${k}: ${v}`);

        if (rePairs.length > 0) parts.push(`RE [${rePairs.join(', ')}]`);
        if (lePairs.length > 0) parts.push(`LE [${lePairs.join(', ')}]`);
        if (remarks) parts.push(`Remarks: ${remarks}`);

        const fundusHidden = document.getElementById('rx_fundus');
        if (fundusHidden) {
            fundusHidden.value = parts.join(' | ');
        }

        // Render inline EMR left-column view
        renderFundusEmrDisplay(reFindings, leFindings, remarks, _fundusState.dilated);

        closeFundusModal();

        if (typeof window.showRxFeedback === 'function') {
            window.showRxFeedback('Fundus findings saved.', 'success');
        }
    }

    // ── Render Inline EMR Display ──────────────────────────────────────────────
    function renderFundusEmrDisplay(reFindings, leFindings, remarks, dilated) {
        const container = document.getElementById('emr_fundus_display');
        if (!container) return;

        const reKeys = Object.keys(reFindings);
        const leKeys = Object.keys(leFindings);

        if (reKeys.length === 0 && leKeys.length === 0 && !remarks && !dilated) {
            container.innerHTML = `
                <div class="emr-empty-complaints-hint">
                    <i class="fa-regular fa-eye"></i>
                    <span>Click to record Fundus exam...</span>
                </div>`;
            return;
        }

        // Check if all filled are 'Normal'
        const allReNormal = reKeys.length > 0 && reKeys.every(k => reFindings[k].toLowerCase() === 'normal');
        const allLeNormal = leKeys.length > 0 && leKeys.every(k => leFindings[k].toLowerCase() === 'normal');
        const isCompleteNormal = (reKeys.length === 5 && leKeys.length === 5 && allReNormal && allLeNormal);

        let dilatedBadge = '';
        if (dilated === 'yes') {
            dilatedBadge = `<span class="fundus-emr-dilated-badge"><i class="fa-solid fa-expand"></i> Dilated</span>`;
        } else if (dilated === 'no') {
            dilatedBadge = `<span class="fundus-emr-dilated-badge" style="background:#f1f5f9;color:#64748b;border-color:#cbd5e1;"><i class="fa-solid fa-compress"></i> Undilated</span>`;
        }

        let html = `
            <div class="fundus-emr-summary-wrap" onclick="openFundusModal()" title="Click to edit Fundus exam">
                <div class="fundus-emr-summary-header">
                    <div>
                        <span><i class="fa-solid fa-circle-dot"></i> Fundus Exam</span>
                        ${dilatedBadge}
                    </div>
                    ${isCompleteNormal ? '<span class="fundus-emr-normal-badge"><i class="fa-solid fa-check"></i> Normal BE</span>' : '<span style="font-size:0.7rem;color:#0284c7;">Click to edit</span>'}
                </div>
                <div class="fundus-emr-summary-grid">
                    <div class="fundus-emr-eye-col">
                        <div class="fundus-emr-eye-title">RE (Right Eye)</div>
                        ${reKeys.length ? reKeys.map(k => {
                            const val = reFindings[k];
                            const isNorm = val.toLowerCase().includes('normal') || val.toLowerCase() === 'clear';
                            return `<div class="fundus-emr-item-line"><span class="fundus-emr-item-name">${escapeHtml(k)}:</span> <span class="fundus-emr-item-val ${isNorm ? 'is-normal' : 'is-abnormal'}">${escapeHtml(val)}</span></div>`;
                        }).join('') : '<div class="fundus-emr-item-line" style="color:#94a3b8;">Not recorded</div>'}
                    </div>
                    <div class="fundus-emr-eye-col">
                        <div class="fundus-emr-eye-title">LE (Left Eye)</div>
                        ${leKeys.length ? leKeys.map(k => {
                            const val = leFindings[k];
                            const isNorm = val.toLowerCase().includes('normal') || val.toLowerCase() === 'clear';
                            return `<div class="fundus-emr-item-line"><span class="fundus-emr-item-name">${escapeHtml(k)}:</span> <span class="fundus-emr-item-val ${isNorm ? 'is-normal' : 'is-abnormal'}">${escapeHtml(val)}</span></div>`;
                        }).join('') : '<div class="fundus-emr-item-line" style="color:#94a3b8;">Not recorded</div>'}
                    </div>
                </div>
                ${remarks ? `<div class="fundus-emr-remarks-line"><strong>Remarks:</strong> ${escapeHtml(remarks)}</div>` : ''}
            </div>
        `;
        container.innerHTML = html;
    }

    // ── Restore State From Notes Text ──────────────────────────────────────────
    function restoreFundusFromText(text) {
        if (!text) return;
        resetFundusState();

        const reFindings = {};
        const leFindings = {};
        let remarks = '';
        let dilated = null;

        // Check dilated
        const dilMatch = text.match(/Dilated:\s*(Yes|No)/i);
        if (dilMatch) {
            dilated = dilMatch[1].toLowerCase();
            _fundusState.dilated = dilated;
        }

        // Check RE [...]
        const reMatch = text.match(/RE\s*\[(.*?)\]/);
        if (reMatch) {
            const reParts = reMatch[1].split(',');
            reParts.forEach(p => {
                const idx = p.indexOf(':');
                if (idx > -1) {
                    const label = p.substring(0, idx).trim();
                    const val = p.substring(idx + 1).trim();
                    const struct = FUNDUS_STRUCTURES.find(s => s.label.toLowerCase() === label.toLowerCase());
                    if (struct) {
                        _fundusState.re[struct.key] = val;
                        reFindings[struct.label] = val;
                    }
                }
            });
        }

        // Check LE [...]
        const leMatch = text.match(/LE\s*\[(.*?)\]/);
        if (leMatch) {
            const leParts = leMatch[1].split(',');
            leParts.forEach(p => {
                const idx = p.indexOf(':');
                if (idx > -1) {
                    const label = p.substring(0, idx).trim();
                    const val = p.substring(idx + 1).trim();
                    const struct = FUNDUS_STRUCTURES.find(s => s.label.toLowerCase() === label.toLowerCase());
                    if (struct) {
                        _fundusState.le[struct.key] = val;
                        leFindings[struct.label] = val;
                    }
                }
            });
        }

        // Check Remarks:
        const remMatch = text.match(/Remarks:\s*(.*)$/);
        if (remMatch) {
            remarks = remMatch[1].trim();
            _fundusState.remarks = remarks;
        }

        _fundusState.hasData = true;
        syncStateToInputs();
        renderFundusEmrDisplay(reFindings, leFindings, remarks, dilated);
    }

    // ── Reset State ────────────────────────────────────────────────────────────
    function resetFundusState() {
        _fundusState = {
            dilated: null,
            re: {},
            le: {},
            remarks: '',
            hasData: false,
            timestamp: null,
        };
        syncStateToInputs();
        const display = document.getElementById('emr_fundus_display');
        if (display) {
            display.innerHTML = `
                <div class="emr-empty-complaints-hint">
                    <i class="fa-regular fa-eye"></i>
                    <span>Click to record Fundus exam...</span>
                </div>`;
        }
        const fundusHidden = document.getElementById('rx_fundus');
        if (fundusHidden) fundusHidden.value = '';
    }

    // ── Backdrop & Escape Key Handlers ─────────────────────────────────────────
    document.addEventListener('click', function (e) {
        const modal = document.getElementById('fundusModal');
        if (modal && e.target === modal) {
            closeFundusModal();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('fundusModal');
            if (modal && modal.style.display === 'flex') {
                closeFundusModal();
            }
        }
    });

    // ── Initialize on DOM ready ────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        setupComboboxes();
    });

    // ── Global Exports ─────────────────────────────────────────────────────────
    window.openFundusModal        = openFundusModal;
    window.closeFundusModal       = closeFundusModal;
    window.setFundusDilated       = setFundusDilated;
    window.setAllFundusNormal     = setAllFundusNormal;
    window.copyFundusRow          = copyFundusRow;
    window.setFundusRowNormal     = setFundusRowNormal;
    window.saveFundusModal        = saveFundusModal;
    window.resetFundusState       = resetFundusState;
    window.restoreFundusFromText  = restoreFundusFromText;

})();
