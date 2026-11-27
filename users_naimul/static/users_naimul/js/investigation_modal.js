/**
 * =============================================================================
 * INVESTIGATION POPUP MODAL CONTROLLER (investigation_modal.js)
 * Ispahani Islamia Eye Institute & Hospital (IIEIH)
 *
 * Architecture:
 * - Automatic system-generated Date, Time, and Entered By (logged-in user)
 * - Which Hospital selector appears inside the Date, Time & By column before save
 * - Read-only Date, Time, Entered By & Hospital are displayed after saving
 * - Once saved, the investigation record (including hospital) is locked and cannot be edited again
 * - Canonical fixed-field registry for IOP, DUCT, Blood Sugar, Colour Vision,
 *   Blood Pressure, K Reading, plus dynamic custom ophthalmic/systemic rows
 * - Real-time clinical calculation assistants & Undo support
 * =============================================================================
 */

(function () {
    'use strict';

    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // ── Global Investigation State ────────────────────────────────────────────
    window._investigationsState = window._investigationsState || {
        saved_records: [],
        global_remarks: ''
    };

    // Map of canonicalKey -> saved investigation record (with signature & audit metadata)
    let _savedInvestigations = {};

    // Backup state for Undo support
    let _lastDeletedRow = null;

    // ── Identity & System Timestamp Helpers ───────────────────────────────────
    function getLoggedInUserDisplay() {
        const modal = document.getElementById('investigationModal');
        if (!modal) return '';
        const displayName = (modal.getAttribute('data-current-user-name') || '').trim();
        const username = (modal.getAttribute('data-current-username') || '').trim();
        return displayName || username;
    }

    function getLoggedInUsername() {
        const modal = document.getElementById('investigationModal');
        return modal ? (modal.getAttribute('data-current-username') || '').trim() : '';
    }

    function formatDateObjParts(dt) {
        const date = `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;
        let hours = dt.getHours();
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const time = `${hours}:${minutes} ${ampm}`;
        return { date, time };
    }

    function generateSystemAuditStamp() {
        const now = new Date();
        const { date, time } = formatDateObjParts(now);
        return {
            saved_date: date,
            saved_time: time,
            saved_datetime: `${date} ${time}`,
            saved_at: now.toISOString(),
            entered_by: getLoggedInUserDisplay(),
            entered_by_username: getLoggedInUsername()
        };
    }

    function formatAuditDateAndTime(auditInfo) {
        if (!auditInfo) return { date: '', time: '' };
        if (auditInfo.saved_at) {
            const dt = new Date(auditInfo.saved_at);
            if (!isNaN(dt.getTime())) {
                return formatDateObjParts(dt);
            }
        }
        return {
            date: auditInfo.saved_date || '',
            time: auditInfo.saved_time || ''
        };
    }

    // ── Shared HTML & Attribute Escaping Helpers ───────────────────────────────
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeJsSingleQuote(str) {
        if (!str) return '';
        return String(str)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'");
    }

    function canonicalInvKey(name) {
        return String(name || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function buildOptionsHtml(options, selectedValue) {
        return options.map(([value, label]) => {
            const selAttr = value === selectedValue ? ' selected' : '';
            return `<option value="${escapeHtml(value)}"${selAttr}>${escapeHtml(label)}</option>`;
        }).join('');
    }

    // ── Canonical Fixed Investigation Definitions ──────────────────────────────
    const IOP_METHOD_OPTIONS = [
        ['Applanation', 'Applanation'],
        ['Non-Contact (NCT)', 'Non-Contact (NCT)'],
        ['Tonopen', 'Tonopen'],
        ['Perkins', 'Perkins'],
        ['iCare Rebound', 'iCare'],
        ['Schiotz', 'Schiotz']
    ];

    const DUCT_LOWER_OPTIONS = [
        ['', 'select Lower Punctum'],
        ['Patent', 'Patent (Clear flow to throat)'],
        ['Regurgitation upper punctum', 'Regurgitation from upper punctum'],
        ['Regurgitation same punctum', 'Regurgitation from same punctum'],
        ['Mucopurulent regurgitation', 'Mucopurulent regurgitation'],
        ['Hard stop', 'Hard stop (bony)'],
        ['Soft stop', 'Soft stop (tissue)'],
        ['Stenosed / Blocked', 'Stenosed / Blocked punctum']
    ];

    const DUCT_UPPER_OPTIONS = [
        ['', 'select Upper Punctum'],
        ['Patent', 'Patent'],
        ['Regurgitation lower punctum', 'Regurgitation from lower punctum'],
        ['Regurgitation same punctum', 'Regurgitation from same punctum'],
        ['Mucopurulent regurgitation', 'Mucopurulent regurgitation'],
        ['Hard stop', 'Hard stop'],
        ['Soft stop', 'Soft stop'],
        ['Blocked', 'Blocked punctum']
    ];

    const SUGAR_TYPE_OPTIONS = [
        ['', 'Select'],
        ['FBS', 'FBS (Fasting)'],
        ['RBS', 'RBS (Random)'],
        ['2HABF', '2HABF (2h Post-Breakfast)'],
        ['HbA1c', 'HbA1c (Glycated Hb)'],
        ['PPBS', 'PPBS (Post Prandial)']
    ];

    const SUGAR_LOCATION_OPTIONS = [
        ['Done at Hospital', 'Done at Hospital'],
        ['Patient Report / Outside Lab', 'Patient Report / Outside Lab'],
        ['Home Glucometer', 'Home Glucometer'],
        ['Point of Care (POC)', 'Point of Care (POC Clinic)']
    ];

    const SUGAR_DIABETIC_OPTIONS = [
        ['Non-Diabetic', 'Non-Diabetic'],
        ['Known Diabetic (T2DM)', 'Known Diabetic (T2DM)'],
        ['Known Diabetic (T1DM)', 'Known Diabetic (T1DM)'],
        ['Gestational', 'Gestational Diabetes'],
        ['Pre-diabetic', 'Pre-diabetic']
    ];

    const CV_RESULT_OPTIONS = [
        ['', 'Select'],
        ['Normal', 'Normal (Ishihara 38 Plates)'],
        ['Red-Green Deficiency', 'Red-Green Deficiency'],
        ['Protanopia', 'Protanopia (Red blind)'],
        ['Deuteranopia', 'Deuteranopia (Green blind)'],
        ['Tritanopia', 'Tritanopia (Blue-Yellow)'],
        ['Total Colour Blindness', 'Total Colour Blindness'],
        ['Illiterate / Inconclusive', 'Inconclusive / Illiterate']
    ];

    const CV_METHOD_OPTIONS = [
        ['Ishihara 38 Plates', 'Ishihara 38 Plates'],
        ['Ishihara 24 Plates', 'Ishihara 24 Plates'],
        ['Farnsworth D-15', 'Farnsworth D-15'],
        ['City University Test', 'City University Test']
    ];

    const BP_POSITION_OPTIONS = [
        ['Sitting', 'Sitting (Arm supported)'],
        ['Supine', 'Supine (Lying down)'],
        ['Standing', 'Standing']
    ];

    const K_DEVICE_OPTIONS = [
        ['Bausch & Lomb Manual Keratometer', 'B&L Manual Keratometer'],
        ['IOL Master 700 / 500', 'IOL Master 700 / 500'],
        ['Auto-Refractometer (ARK)', 'Auto-Keratometer (ARK)'],
        ['Pentacam HR Topography', 'Pentacam HR Topography']
    ];

    const FIXED_INVESTIGATIONS = {
        'IOP': {
            name: 'IOP',
            rowId: 'inv_row_iop',
            drawerId: 'inv_drawer_iop',
            shortKey: 'iop',
            rowClass: 'inv-row inv-row-iop',
            typeTag: 'Tonometry',
            isNonOcular: false,
            deleteTitle: 'Remove IOP entry',
            saveTitle: 'Save/Update IOP record',
            focusByEye: { RE: 'iop_re_value', LE: 'iop_le_value', BE: 'iop_re_value' },
            buildValueCellsHtml: function () {
                const buildEyeCell = (eye, colClass) => `
                    <td class="${colClass}">
                        <div class="inv-cell-flex">
                            <div class="inv-input-affix-group">
                                <input type="number" step="0.5" min="0" max="80"
                                       class="inv-input inv-input-num" id="iop_${eye}_value"
                                       placeholder="mm of Hg" oninput="handleIopChange('${eye}')">
                                <span class="inv-affix">mmHg</span>
                            </div>
                            <select class="inv-select inv-select-sm" id="iop_${eye}_method" onchange="handleIopChange('${eye}')">
                                ${buildOptionsHtml(IOP_METHOD_OPTIONS, 'Applanation')}
                            </select>
                            <span class="inv-status-chip" id="iop_${eye}_chip" style="display: none;"></span>
                        </div>
                    </td>
                `;
                return buildEyeCell('re', 'col-re') + buildEyeCell('le', 'col-le');
            },
            buildDrawerHtml: function () {
                return `
                    <td colspan="5">
                        <div class="inv-drawer-content">
                            <div class="drawer-field grow">
                                <label class="drawer-label">Tonometry Remarks &amp; CCT Correlation:</label>
                                <input type="text" class="inv-input inv-input-sm" id="iop_notes" placeholder="e.g. Corneal thickness adjusted, no corneal edema, reliable reading">
                            </div>
                        </div>
                    </td>
                `;
            },
            bindBehaviors: function () {
                window.handleIopChange('re');
                window.handleIopChange('le');
            }
        },
        'DUCT': {
            name: 'DUCT',
            rowId: 'inv_row_duct',
            drawerId: 'inv_drawer_duct',
            shortKey: 'duct',
            rowClass: 'inv-row inv-row-duct',
            typeTag: 'Syringing',
            isNonOcular: false,
            deleteTitle: 'Remove DUCT entry',
            saveTitle: 'Save/Update DUCT record',
            focusByEye: { RE: 'duct_re_lower', LE: 'duct_le_lower', BE: 'duct_re_lower' },
            buildValueCellsHtml: function () {
                const buildEyeCell = (eye, colClass) => `
                    <td class="${colClass}">
                        <div class="inv-stacked-selects">
                            <select class="inv-select inv-select-block" id="duct_${eye}_lower">
                                ${buildOptionsHtml(DUCT_LOWER_OPTIONS, '')}
                            </select>
                            <select class="inv-select inv-select-block" id="duct_${eye}_upper">
                                ${buildOptionsHtml(DUCT_UPPER_OPTIONS, '')}
                            </select>
                        </div>
                    </td>
                `;
                return buildEyeCell('re', 'col-re') + buildEyeCell('le', 'col-le');
            },
            buildDrawerHtml: function () {
                return `
                    <td colspan="5">
                        <div class="inv-drawer-content">
                            <div class="drawer-field grow">
                                <label class="drawer-label">Syringing Findings &amp; Nasolacrimal Duct Notes:</label>
                                <input type="text" class="inv-input inv-input-sm" id="duct_notes" placeholder="e.g. Free flow on pressure, saline tasted in throat, gentle pressure used">
                            </div>
                        </div>
                    </td>
                `;
            }
        },
        'Blood Sugar': {
            name: 'Blood Sugar',
            rowId: 'inv_row_blood_sugar',
            drawerId: 'inv_drawer_sugar',
            shortKey: 'sugar',
            rowClass: 'inv-row inv-row-blood-sugar',
            typeTag: 'Biochemistry',
            isNonOcular: true,
            deleteTitle: 'Remove Blood Sugar entry',
            saveTitle: 'Save/Update Blood Sugar record',
            focusByEye: { NA: 'sugar_value', BE: 'sugar_value' },
            buildValueCellsHtml: function () {
                return `
                    <td class="col-re" colspan="2">
                        <div class="inv-cell-flex">
                            <select class="inv-select inv-select-sm" id="sugar_test_type" onchange="handleSugarChange()">
                                ${buildOptionsHtml(SUGAR_TYPE_OPTIONS, '')}
                            </select>
                            <div class="inv-input-affix-group">
                                <input type="number" step="0.1" min="0" max="600"
                                       class="inv-input inv-input-num" id="sugar_value"
                                       placeholder="mg%" oninput="handleSugarChange()">
                                <span class="inv-affix" id="sugar_unit_label">mg%</span>
                            </div>
                            <span class="inv-status-chip" id="sugar_chip" style="display: none;"></span>
                        </div>
                    </td>
                `;
            },
            buildDrawerHtml: function () {
                return `
                    <td colspan="5">
                        <div class="inv-drawer-content">
                            <div class="drawer-field">
                                <label class="drawer-label">Last Meal Time:</label>
                                <input type="time" class="inv-input inv-input-sm" id="sugar_last_meal">
                            </div>
                            <div class="drawer-field">
                                <label class="drawer-label">Diabetic Status:</label>
                                <select class="inv-select inv-select-sm" id="sugar_diabetic_status">
                                    ${buildOptionsHtml(SUGAR_DIABETIC_OPTIONS, 'Non-Diabetic')}
                                </select>
                            </div>
                            <div class="drawer-field grow">
                                <label class="drawer-label">Medication / Insulin Status:</label>
                                <input type="text" class="inv-input inv-input-sm" id="sugar_med_status" placeholder="e.g. On Metformin 500mg BD, taken breakfast at 8:00 AM">
                            </div>
                        </div>
                    </td>
                `;
            },
            bindBehaviors: function () {
                window.handleSugarChange();
            }
        },
        'Colour Vision': {
            name: 'Colour Vision',
            rowId: 'inv_row_colour_vision',
            drawerId: 'inv_drawer_cv',
            shortKey: 'cv',
            rowClass: 'inv-row inv-row-colour-vision',
            typeTag: 'Optometry',
            isNonOcular: false,
            deleteTitle: 'Remove Colour Vision entry',
            saveTitle: 'Save/Update Colour Vision record',
            focusByEye: { RE: 'cv_re_select', LE: 'cv_le_select', BE: 'cv_re_select' },
            buildValueCellsHtml: function () {
                const buildEyeCell = (eye, colClass) => `
                    <td class="${colClass}">
                        <div class="inv-cell-flex">
                            <select class="inv-select inv-select-grow" id="cv_${eye}_select" onchange="handleColourVisionChange('${eye}')">
                                ${buildOptionsHtml(CV_RESULT_OPTIONS, '')}
                            </select>
                            <input type="text" class="inv-input inv-input-plates" id="cv_${eye}_score" placeholder="17/17" title="Plates read correctly">
                        </div>
                    </td>
                `;
                return buildEyeCell('re', 'col-re') + buildEyeCell('le', 'col-le');
            },
            buildDrawerHtml: function () {
                return `
                    <td colspan="5">
                        <div class="inv-drawer-content">
                            <div class="drawer-field">
                                <label class="drawer-label">Test Method:</label>
                                <select class="inv-select inv-select-sm" id="cv_method">
                                    ${buildOptionsHtml(CV_METHOD_OPTIONS, 'Ishihara 38 Plates')}
                                </select>
                            </div>
                            <div class="drawer-field grow">
                                <label class="drawer-label">Clinical Remarks (e.g., Congenital vs Acquired, Optic Neuropathy):</label>
                                <input type="text" class="inv-input inv-input-sm" id="cv_notes" placeholder="e.g. Congenital X-linked trait, no relative afferent pupillary defect">
                            </div>
                        </div>
                    </td>
                `;
            }
        },
        'Blood Pressure': {
            name: 'Blood Pressure',
            rowId: 'inv_row_blood_pressure',
            drawerId: 'inv_drawer_bp',
            shortKey: 'bp',
            rowClass: 'inv-row inv-row-blood-pressure',
            typeTag: 'Vitals',
            isNonOcular: true,
            deleteTitle: 'Remove Blood Pressure entry',
            saveTitle: 'Save/Update Blood Pressure record',
            focusByEye: { NA: 'bp_systolic', BE: 'bp_systolic' },
            buildValueCellsHtml: function () {
                return `
                    <td class="col-re" colspan="2">
                        <div class="inv-bp-cell-container">
                            <div class="inv-bp-group">
                                <div class="inv-input-affix-group inv-bp-input-wrap">
                                    <input type="number" min="50" max="300"
                                           class="inv-input inv-input-bp" id="bp_systolic"
                                           placeholder="mm Hg" oninput="handleBpChange()"
                                           aria-label="Systolic BP">
                                    <span class="inv-affix">Sys</span>
                                </div>
                                <span class="inv-bp-slash">/</span>
                                <div class="inv-input-affix-group inv-bp-input-wrap">
                                    <input type="number" min="30" max="200"
                                           class="inv-input inv-input-bp" id="bp_diastolic"
                                           placeholder="mm Hg" oninput="handleBpChange()"
                                           aria-label="Diastolic BP">
                                    <span class="inv-affix">Dia</span>
                                </div>
                                <span class="inv-bp-unit-tag">mm Hg</span>
                            </div>
                            <span class="inv-status-chip bp-chip" id="bp_chip" style="display: none;"></span>
                        </div>
                    </td>
                `;
            },
            buildDrawerHtml: function () {
                return `
                    <td colspan="5">
                        <div class="inv-drawer-content">
                            <div class="drawer-field">
                                <label class="drawer-label">Pulse (bpm):</label>
                                <input type="number" class="inv-input inv-input-sm" id="bp_pulse" placeholder="e.g. 72 bpm" style="width: 100px;">
                            </div>
                            <div class="drawer-field">
                                <label class="drawer-label">Patient Position:</label>
                                <select class="inv-select inv-select-sm" id="bp_position">
                                    ${buildOptionsHtml(BP_POSITION_OPTIONS, 'Sitting')}
                                </select>
                            </div>
                            <div class="drawer-field grow">
                                <label class="drawer-label">Antihypertensive Status / Notes:</label>
                                <input type="text" class="inv-input inv-input-sm" id="bp_notes" placeholder="e.g. Known hypertensive on Amlodipine 5mg, regular compliance">
                            </div>
                        </div>
                    </td>
                `;
            },
            bindBehaviors: function () {
                window.handleBpChange();
            }
        },
        'K Reading': {
            name: 'K Reading',
            rowId: 'inv_row_k_reading',
            drawerId: 'inv_drawer_k',
            shortKey: 'k',
            rowClass: 'inv-row inv-row-k-reading',
            typeTag: 'Keratometry',
            isNonOcular: false,
            deleteTitle: 'Remove K Reading entry',
            saveTitle: 'Save/Update K Reading record',
            focusByEye: { RE: 'k_re_k1', LE: 'k_le_k1', BE: 'k_re_k1' },
            buildValueCellsHtml: function () {
                const buildAxisRow = (eye, num) => `
                    <div class="inv-k-axis-row">
                        <span class="inv-k-label">K${num}:</span>
                        <div class="inv-input-affix-group k-d-wrap">
                            <input type="number" step="0.25" min="30" max="65"
                                   class="inv-input inv-input-k" id="k_${eye}_k${num}"
                                   placeholder="D" oninput="calculateKeratometry('${eye}')">
                            <span class="inv-affix">D</span>
                        </div>
                        <span class="inv-k-at">@</span>
                        <div class="inv-input-affix-group k-deg-wrap">
                            <input type="number" step="1" min="0" max="180"
                                   class="inv-input inv-input-deg" id="k_${eye}_axis${num}"
                                   placeholder="°" oninput="calculateKeratometry('${eye}')">
                            <span class="inv-affix">°</span>
                        </div>
                    </div>
                `;
                const buildEyeCell = (eye, colClass) => `
                    <td class="${colClass}">
                        <div class="inv-k-values-container">
                            ${buildAxisRow(eye, 1)}
                            ${buildAxisRow(eye, 2)}
                            <div class="inv-k-calc-badge" id="k_${eye}_calc" style="display: none;">
                                <i class="fa-solid fa-calculator"></i>
                                <span id="k_${eye}_calc_text">--</span>
                            </div>
                        </div>
                    </td>
                `;
                return buildEyeCell('re', 'col-re') + buildEyeCell('le', 'col-le');
            },
            buildDrawerHtml: function () {
                return `
                    <td colspan="5">
                        <div class="inv-drawer-content">
                            <div class="drawer-field">
                                <label class="drawer-label">Keratometer Device:</label>
                                <select class="inv-select inv-select-sm" id="k_device">
                                    ${buildOptionsHtml(K_DEVICE_OPTIONS, 'Bausch & Lomb Manual Keratometer')}
                                </select>
                            </div>
                            <div class="drawer-field grow">
                                <label class="drawer-label">Mires Quality &amp; Corneal Surface Notes:</label>
                                <input type="text" class="inv-input inv-input-sm" id="k_notes" placeholder="e.g. Regular, crisp circular mires. No corneal distortion.">
                            </div>
                        </div>
                    </td>
                `;
            },
            bindBehaviors: function () {
                window.calculateKeratometry('re');
                window.calculateKeratometry('le');
            }
        }
    };

    const FIXED_INVESTIGATIONS_BY_LOWER = {};
    const FIXED_INVESTIGATIONS_BY_ROW_ID = {};
    const FIXED_INVESTIGATIONS_BY_SHORT_KEY = {};
    Object.values(FIXED_INVESTIGATIONS).forEach(cfg => {
        FIXED_INVESTIGATIONS_BY_LOWER[cfg.name.toLowerCase()] = cfg;
        FIXED_INVESTIGATIONS_BY_ROW_ID[cfg.rowId] = cfg;
        FIXED_INVESTIGATIONS_BY_SHORT_KEY[cfg.shortKey] = cfg;
    });

    function getFixedInvestigationConfig(name) {
        if (!name) return null;
        const clean = String(name).trim().toLowerCase();
        return FIXED_INVESTIGATIONS_BY_LOWER[clean] || null;
    }

    function getFixedInvestigationByRowId(rowId) {
        if (!rowId) return null;
        return FIXED_INVESTIGATIONS_BY_ROW_ID[rowId] || null;
    }

    function getFixedInvestigationByShortKey(shortKey) {
        if (!shortKey) return null;
        return FIXED_INVESTIGATIONS_BY_SHORT_KEY[shortKey] || null;
    }

    window.isFixedInvestigation = function (name) {
        return Boolean(getFixedInvestigationConfig(name));
    };

    window.getFixedInvestigationConfig = function (name) {
        const cfg = getFixedInvestigationConfig(name);
        if (!cfg) return null;
        return {
            name: cfg.name,
            rowId: cfg.rowId,
            drawerId: cfg.drawerId,
            shortKey: cfg.shortKey,
            typeTag: cfg.typeTag,
            isNonOcular: cfg.isNonOcular
        };
    };

    function buildEyeToggleHtml(rowKey, toggleId, labelPrefix) {
        const safeJsKey = escapeJsSingleQuote(rowKey);
        const safeLabel = escapeHtml(labelPrefix || 'Investigation');
        return `
            <div class="inv-eye-toggle" id="${escapeHtml(toggleId)}" role="group" aria-label="${safeLabel} eye toggle">
                <button type="button" class="inv-eye-btn" data-eye="re" aria-pressed="false" title="Right Eye (OD)" onclick="toggleInvEye('${safeJsKey}', 're', this)">RE</button>
                <button type="button" class="inv-eye-btn" data-eye="le" aria-pressed="false" title="Left Eye (OS)" onclick="toggleInvEye('${safeJsKey}', 'le', this)">LE</button>
                <button type="button" class="inv-eye-btn active" data-eye="be" aria-pressed="true" title="Both Eyes (OU)" onclick="toggleInvEye('${safeJsKey}', 'be', this)">BE</button>
            </div>`;
    }

    function buildHospitalInnerHtml(keyPrefix) {
        const safePrefix = escapeHtml(keyPrefix);
        return `
            <div class="inv-hospital-wrap">
                <span class="inv-hospital-field-label">
                    <i class="fa-regular fa-hospital" aria-hidden="true"></i>
                    <span>Which Hospital</span>
                </span>
                <select class="inv-select inv-select-sm inv-hospital-select" id="${safePrefix}_hospital_select" aria-label="Which Hospital" onchange="handleInvHospitalChange(this)">
                    <option value="IIEIH" selected>IIEIH</option>
                    <option value="Others">Others</option>
                </select>
                <input type="text" class="inv-input inv-input-sm inv-hospital-other" id="${safePrefix}_hospital_other" placeholder="Enter hospital name..." style="display: none;" autocomplete="off">
            </div>`;
    }

    function buildFixedInvestigationElements(cfg) {
        const tr = document.createElement('tr');
        tr.className = cfg.rowClass;
        tr.id = cfg.rowId;
        tr.setAttribute('data-investigation', cfg.name);
        tr.setAttribute('data-fixed', 'true');
        tr.setAttribute('data-saved', 'false');
        if (cfg.isNonOcular) {
            tr.setAttribute('data-non-ocular', 'true');
        }

        const safeJsName = escapeJsSingleQuote(cfg.name);
        const safeJsRowId = escapeJsSingleQuote(cfg.rowId);

        const eyeToggleHtml = !cfg.isNonOcular
            ? buildEyeToggleHtml(cfg.rowId.replace('inv_row_', ''), `inv_eye_toggle_${cfg.shortKey}`, cfg.name)
            : '';

        tr.innerHTML = `
            <td class="col-name">
                <div class="inv-name-block">
                    <div class="inv-name-row">
                        <span class="inv-primary-name">${escapeHtml(cfg.name)}</span>
                        ${eyeToggleHtml}
                    </div>
                </div>
            </td>
            ${cfg.buildValueCellsHtml()}
            <td class="col-date">
                ${buildHospitalInnerHtml(cfg.shortKey)}
                <div class="inv-date-cell-content" id="${escapeHtml(cfg.shortKey)}_audit_cell"></div>
            </td>
            <td class="col-action">
                <div class="inv-action-btn-group">
                    <button type="button" class="btn-inv-delete" onclick="removeInvestigationRow('${safeJsRowId}', '${safeJsName}')" title="${escapeHtml(cfg.deleteTitle)}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <button type="button" class="btn-inv-save-row" onclick="saveRowIndividual('${safeJsName}')" title="${escapeHtml(cfg.saveTitle)}">
                        <i class="fa-regular fa-floppy-disk"></i>
                    </button>
                </div>
            </td>
        `;

        const drawerTr = document.createElement('tr');
        drawerTr.className = 'inv-detail-drawer';
        drawerTr.id = cfg.drawerId;
        drawerTr.style.display = 'none';
        drawerTr.innerHTML = cfg.buildDrawerHtml();

        return { tr, drawerTr };
    }

    function bindFixedInvestigationBehaviors(nameOrCfg) {
        const cfg = typeof nameOrCfg === 'string'
            ? getFixedInvestigationConfig(nameOrCfg)
            : nameOrCfg;
        if (cfg && typeof cfg.bindBehaviors === 'function') {
            cfg.bindBehaviors();
        }
    }

    // ── Read-Only Audit Cell & Column Visibility ──────────────────────────────
    function extractAuditDisplayParts(auditInfo, fallbackToCurrentUser = false) {
        const { date, time } = formatAuditDateAndTime(auditInfo);
        const rawBy = (auditInfo && (auditInfo.entered_by || auditInfo.entered_by_username)) || '';
        const enteredBy = String(rawBy || (fallbackToCurrentUser ? getLoggedInUserDisplay() : '') || '').trim();
        const hospitalType = auditInfo && auditInfo.hospital_type === 'Others' ? 'Others' : 'IIEIH';
        const hospitalDisplay = hospitalType === 'Others'
            ? (String((auditInfo && auditInfo.hospital_name) || '').trim() || 'Others')
            : 'IIEIH';
        return {
            date: date || '',
            time: time || '',
            enteredBy,
            hospitalDisplay
        };
    }

    function renderRowAuditCell(row, auditInfo) {
        if (!row) return;
        const cellContent = row.querySelector('td.col-date .inv-date-cell-content');
        if (!auditInfo) {
            row.setAttribute('data-saved', 'false');
            if (cellContent) cellContent.innerHTML = '';
            return;
        }

        const { date, time, enteredBy, hospitalDisplay } = extractAuditDisplayParts(auditInfo, true);
        const safeDate = date || '—';
        const safeTime = time || '—';
        const safeEnteredBy = enteredBy || '—';
        const safeHospital = hospitalDisplay || 'IIEIH';
        row.setAttribute('data-saved', 'true');

        if (cellContent) {
            cellContent.innerHTML = `
                <div class="inv-audit-readonly" data-saved-audit="true">
                    <div class="inv-audit-row inv-datetime-text" role="group" aria-label="Investigation date and time">
                        <div class="inv-audit-cell inv-audit-date-cell" title="Investigation Date: ${escapeHtml(safeDate)}">
                            <span class="inv-audit-date">${escapeHtml(safeDate)}</span>
                        </div>
                        <div class="inv-audit-cell inv-audit-time-cell" title="Investigation Time: ${escapeHtml(safeTime)}">
                            <span class="inv-audit-time">${escapeHtml(safeTime)}</span>
                        </div>
                    </div>
                    <div class="inv-audit-row inv-audit-meta-row" role="group" aria-label="Done by and hospital name">
                        <div class="inv-audit-cell inv-entered-by-wrap inv-entered-by-readonly" title="Done By: ${escapeHtml(safeEnteredBy)}">
                            <i class="" aria-hidden="true">Done by</i>
                            <span class="inv-entered-name">${escapeHtml(safeEnteredBy)}</span>
                        </div>
                        <div class="inv-audit-cell inv-hospital-readonly" title="Hospital Name: ${escapeHtml(safeHospital)}">
                            <i class="" aria-hidden="true">In: </i>
                            <span class="inv-hospital-value">${escapeHtml(safeHospital)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    function refreshAuditColumnVisibility() {
        const table = document.getElementById('invGridTable');
        if (!table) return;
        table.classList.remove('inv-hide-audit-col');
    }

    // ── Uniform Row Data Extraction & Clinical Fingerprinting ─────────────────
    function getRowEyeState(row) {
        if (!row || row.getAttribute('data-non-ocular') === 'true') return 'NA';
        const activeBtn = row.querySelector('.inv-eye-btn.active');
        const eye = activeBtn ? (activeBtn.getAttribute('data-eye') || 'be').toUpperCase() : 'BE';
        return (eye === 'RE' || eye === 'LE' || eye === 'BE') ? eye : 'BE';
    }

    function getElVal(id) {
        const el = document.getElementById(id);
        return el ? String(el.value || '').trim() : '';
    }

    function isElEnabled(id) {
        const el = document.getElementById(id);
        if (!el) return false;
        const eyeCell = el.closest ? el.closest('td.col-re, td.col-le') : null;
        if (eyeCell && eyeCell.classList.contains('inv-eye-cell-hidden')) {
            return false;
        }
        // Locked (saved) fields remain disabled in DOM so users can't edit them,
        // but must still be readable when saving other rows or checking signatures.
        if (el.classList.contains('inv-field-locked')) {
            return true;
        }
        return !el.disabled;
    }

    function getRowHospitalState(row) {
        if (!row) return { hospital_type: 'IIEIH', hospital_name: 'IIEIH' };
        const selectEl = row.querySelector('.inv-hospital-select');
        const otherInput = row.querySelector('.inv-hospital-other');
        const rawType = selectEl ? String(selectEl.value || 'IIEIH').trim() : 'IIEIH';
        const hospitalType = rawType === 'Others' ? 'Others' : 'IIEIH';
        const hospitalName = hospitalType === 'Others'
            ? (otherInput ? String(otherInput.value || '').trim() : '')
            : 'IIEIH';
        return {
            hospital_type: hospitalType,
            hospital_name: hospitalName
        };
    }

    function syncRowHospitalVisibility(row, options = {}) {
        if (!row) return;
        const selectEl = row.querySelector('.inv-hospital-select');
        const otherInput = row.querySelector('.inv-hospital-other');
        if (!selectEl || !otherInput) return;

        const isOthers = selectEl.value === 'Others';
        otherInput.style.display = isOthers ? 'block' : 'none';
        if (!isOthers) {
            otherInput.value = '';
        } else if (options.focusInput && !otherInput.disabled && typeof otherInput.focus === 'function') {
            otherInput.focus();
        }
    }

    window.handleInvHospitalChange = function (selectEl) {
        const row = selectEl && selectEl.closest ? selectEl.closest('tr.inv-row') : null;
        if (!row) return;
        if (row.getAttribute('data-saved') === 'true' || row.classList.contains('inv-row-locked')) {
            return;
        }
        syncRowHospitalVisibility(row, { focusInput: true });
        syncRowDirtyState(row);
    };

    function computeClinicalSignature(rec) {
        if (!rec) return '';
        const data = rec.data && typeof rec.data === 'object' ? rec.data : {};
        const sortedData = {};
        Object.keys(data).sort().forEach(k => {
            sortedData[k] = data[k] === null || data[k] === undefined ? '' : String(data[k]).trim();
        });
        const hospitalType = rec.hospital_type === 'Others' ? 'Others' : 'IIEIH';
        const hospitalName = hospitalType === 'Others'
            ? String(rec.hospital_name || '').trim()
            : 'IIEIH';
        return JSON.stringify({
            key: canonicalInvKey(rec.key || rec.name),
            name: String(rec.name || '').trim().toLowerCase(),
            is_non_ocular: Boolean(rec.is_non_ocular),
            eye: String(rec.eye || (rec.is_non_ocular ? 'NA' : 'BE')).trim().toUpperCase(),
            hospital_type: hospitalType,
            hospital_name: hospitalName,
            data: sortedData
        });
    }

    function extractRowRecord(row) {
        if (!row) return null;
        const name = (row.getAttribute('data-investigation') || '').trim();
        if (!name) return null;

        const key = canonicalInvKey(name);
        const isFixed = row.getAttribute('data-fixed') === 'true' || Boolean(getFixedInvestigationConfig(name));
        const isNonOcular = row.getAttribute('data-non-ocular') === 'true';
        const eye = getRowEyeState(row);
        const reActive = !isNonOcular && (eye === 'RE' || eye === 'BE');
        const leActive = !isNonOcular && (eye === 'LE' || eye === 'BE');

        let data = {};
        let hasData = false;
        let summary = '';

        if (key === 'iop') {
            const reVal = reActive && isElEnabled('iop_re_value') ? getElVal('iop_re_value') : '';
            const leVal = leActive && isElEnabled('iop_le_value') ? getElVal('iop_le_value') : '';
            const reMethod = getElVal('iop_re_method') || 'Applanation';
            const leMethod = getElVal('iop_le_method') || 'Applanation';
            const notes = getElVal('iop_notes');
            data = {
                re_value: reVal,
                re_method: reMethod,
                le_value: leVal,
                le_method: leMethod,
                notes
            };
            hasData = Boolean(reVal || leVal || notes);
            if (hasData) {
                const parts = [];
                if (reVal) parts.push(`RE: ${reVal} mmHg (${reMethod})`);
                if (leVal) parts.push(`LE: ${leVal} mmHg (${leMethod})`);
                if (notes) parts.push(`Notes: ${notes}`);
                summary = `IOP: ${parts.join(' | ')}`;
            }
        } else if (key === 'duct') {
            const reLower = reActive && isElEnabled('duct_re_lower') ? getElVal('duct_re_lower') : '';
            const reUpper = reActive && isElEnabled('duct_re_upper') ? getElVal('duct_re_upper') : '';
            const leLower = leActive && isElEnabled('duct_le_lower') ? getElVal('duct_le_lower') : '';
            const leUpper = leActive && isElEnabled('duct_le_upper') ? getElVal('duct_le_upper') : '';
            const notes = getElVal('duct_notes');
            data = {
                re_lower: reLower,
                re_upper: reUpper,
                le_lower: leLower,
                le_upper: leUpper,
                notes
            };
            hasData = Boolean(reLower || reUpper || leLower || leUpper || notes);
            if (hasData) {
                const parts = [];
                const reSub = [reLower ? `Lower ${reLower}` : '', reUpper ? `Upper ${reUpper}` : ''].filter(Boolean).join(', ');
                const leSub = [leLower ? `Lower ${leLower}` : '', leUpper ? `Upper ${leUpper}` : ''].filter(Boolean).join(', ');
                if (reSub) parts.push(`RE: ${reSub}`);
                if (leSub) parts.push(`LE: ${leSub}`);
                if (notes) parts.push(`Notes: ${notes}`);
                summary = `DUCT: ${parts.join(' | ')}`;
            }
        } else if (key === 'blood_sugar') {
            const testType = getElVal('sugar_test_type');
            const val = getElVal('sugar_value');
            const location = getElVal('sugar_location') || 'Done at Hospital';
            const lastMeal = getElVal('sugar_last_meal');
            const diabeticStatus = getElVal('sugar_diabetic_status') || 'Non-Diabetic';
            const medStatus = getElVal('sugar_med_status');
            data = {
                test_type: testType,
                value: val,
                location,
                last_meal: lastMeal,
                diabetic_status: diabeticStatus,
                med_status: medStatus
            };
            hasData = Boolean(val || testType);
            if (hasData) {
                const label = testType || 'RBS';
                const unit = label === 'HbA1c' ? '%' : 'mg%';
                summary = val
                    ? `Blood Sugar (${label}): ${val} ${unit} (${location})`
                    : `Blood Sugar (${label}): ${location}`;
            }
        } else if (key === 'colour_vision') {
            const reSel = reActive && isElEnabled('cv_re_select') ? getElVal('cv_re_select') : '';
            const reScore = reActive && isElEnabled('cv_re_score') ? getElVal('cv_re_score') : '';
            const leSel = leActive && isElEnabled('cv_le_select') ? getElVal('cv_le_select') : '';
            const leScore = leActive && isElEnabled('cv_le_score') ? getElVal('cv_le_score') : '';
            const method = getElVal('cv_method') || 'Ishihara 38 Plates';
            const notes = getElVal('cv_notes');
            data = {
                re_result: reSel,
                re_score: reScore,
                le_result: leSel,
                le_score: leScore,
                method,
                notes
            };
            hasData = Boolean(reSel || reScore || leSel || leScore || notes);
            if (hasData) {
                const parts = [];
                if (reSel || reScore) parts.push(`RE: ${reSel || 'Recorded'}${reScore ? ` (${reScore})` : ''}`);
                if (leSel || leScore) parts.push(`LE: ${leSel || 'Recorded'}${leScore ? ` (${leScore})` : ''}`);
                if (notes) parts.push(`Notes: ${notes}`);
                summary = `Colour Vision: ${parts.join(' | ')}`;
            }
        } else if (key === 'blood_pressure') {
            const systolic = getElVal('bp_systolic');
            const diastolic = getElVal('bp_diastolic');
            const pulse = getElVal('bp_pulse');
            const position = getElVal('bp_position') || 'Sitting';
            const notes = getElVal('bp_notes');
            data = {
                systolic,
                diastolic,
                pulse,
                position,
                notes
            };
            hasData = Boolean(systolic || diastolic || pulse || notes);
            if (hasData) {
                const bpVal = (systolic || diastolic) ? `${systolic || '--'}/${diastolic || '--'} mmHg` : '';
                const extra = [pulse ? `Pulse: ${pulse} bpm` : '', notes].filter(Boolean).join(' | ');
                summary = `BP: ${[bpVal, extra].filter(Boolean).join(' | ')}`;
            }
        } else if (key === 'k_reading') {
            const reK1 = reActive && isElEnabled('k_re_k1') ? getElVal('k_re_k1') : '';
            const reAx1 = reActive && isElEnabled('k_re_axis1') ? getElVal('k_re_axis1') : '';
            const reK2 = reActive && isElEnabled('k_re_k2') ? getElVal('k_re_k2') : '';
            const reAx2 = reActive && isElEnabled('k_re_axis2') ? getElVal('k_re_axis2') : '';
            const leK1 = leActive && isElEnabled('k_le_k1') ? getElVal('k_le_k1') : '';
            const leAx1 = leActive && isElEnabled('k_le_axis1') ? getElVal('k_le_axis1') : '';
            const leK2 = leActive && isElEnabled('k_le_k2') ? getElVal('k_le_k2') : '';
            const leAx2 = leActive && isElEnabled('k_le_axis2') ? getElVal('k_le_axis2') : '';
            const device = getElVal('k_device') || 'Bausch & Lomb Manual Keratometer';
            const notes = getElVal('k_notes');
            data = {
                re_k1: reK1,
                re_axis1: reAx1,
                re_k2: reK2,
                re_axis2: reAx2,
                le_k1: leK1,
                le_axis1: leAx1,
                le_k2: leK2,
                le_axis2: leAx2,
                device,
                notes
            };
            hasData = Boolean(reK1 || reAx1 || reK2 || reAx2 || leK1 || leAx1 || leK2 || leAx2 || notes);
            if (hasData) {
                const kParts = [];
                if (reK1 || reK2) {
                    kParts.push(`RE: ${reK1 || '--'}D@${reAx1 || '180'}° / ${reK2 || '--'}D@${reAx2 || '90'}°`);
                }
                if (leK1 || leK2) {
                    kParts.push(`LE: ${leK1 || '--'}D@${leAx1 || '180'}° / ${leK2 || '--'}D@${leAx2 || '90'}°`);
                }
                if (notes) kParts.push(`Notes: ${notes}`);
                summary = `Keratometry: ${kParts.join(' | ')}`;
            }
        } else {
            const safeKey = canonicalInvKey(name);
            const reVal = (isNonOcular || reActive) && isElEnabled(`${safeKey}_re`) ? getElVal(`${safeKey}_re`) : '';
            const leVal = !isNonOcular && leActive && isElEnabled(`${safeKey}_le`) ? getElVal(`${safeKey}_le`) : '';
            const notes = getElVal(`${safeKey}_notes`);
            data = isNonOcular
                ? { value: reVal, notes }
                : { re_value: reVal, le_value: leVal, notes };
            hasData = Boolean(reVal || leVal || notes);
            if (hasData) {
                const parts = [];
                if (isNonOcular) {
                    if (reVal) parts.push(reVal);
                } else {
                    if (reVal) parts.push(`RE: ${reVal}`);
                    if (leVal) parts.push(`LE: ${leVal}`);
                }
                if (notes) parts.push(`Notes: ${notes}`);
                summary = `${name}: ${parts.join(' | ')}`;
            }
        }

        const hospitalState = getRowHospitalState(row);
        if (hasData && hospitalState.hospital_type === 'Others' && hospitalState.hospital_name) {
            summary = `${summary} [Hospital: ${hospitalState.hospital_name}]`;
        }

        return {
            key,
            name,
            is_fixed: isFixed,
            is_non_ocular: isNonOcular,
            eye,
            hospital_type: hospitalState.hospital_type,
            hospital_name: hospitalState.hospital_name,
            data,
            summary,
            hasData
        };
    }

    function applySavedRowUI(row, auditInfo) {
        if (!row) return;
        row.setAttribute('data-editing', 'false');
        renderRowAuditCell(row, auditInfo);
        lockRowFields(row);
        renderRowActionButtons(row, true);
    }

    function syncRowDirtyState(row) {
        if (!row) return;
        const rec = extractRowRecord(row);
        if (!rec) return;
        const savedRec = _savedInvestigations[rec.key];

        if (!savedRec) {
            if (row.getAttribute('data-saved') === 'true') {
                renderRowAuditCell(row, null);
                refreshAuditColumnVisibility();
            }
            if (row.classList.contains('inv-row-locked')) {
                unlockRowFields(row, { editing: false });
            }
            renderRowActionButtons(row, false);
            return;
        }

        // Once saved, investigation data (including Which Hospital) stays permanently locked
        applySavedRowUI(row, savedRec);
        refreshAuditColumnVisibility();
    }

    function getDrawerForRow(row, rowId) {
        const fixedCfg = getFixedInvestigationByRowId(rowId) ||
            (row ? getFixedInvestigationConfig(row.getAttribute('data-investigation')) : null);
        if (fixedCfg) {
            const fixedDrawer = document.getElementById(fixedCfg.drawerId);
            if (fixedDrawer) return fixedDrawer;
        }
        const defaultDrawerId = rowId.replace('inv_row_', 'inv_drawer_');
        const byDefaultId = document.getElementById(defaultDrawerId);
        if (byDefaultId) return byDefaultId;
        if (row && row.nextElementSibling && row.nextElementSibling.classList.contains('inv-detail-drawer')) {
            return row.nextElementSibling;
        }
        return null;
    }

    function findRowsByInvestigation(tableBody, name, fixedCfg) {
        const targetLower = String(name || '').trim().toLowerCase();
        const matches = [];
        tableBody.querySelectorAll('tr.inv-row').forEach(row => {
            const attrName = (row.getAttribute('data-investigation') || '').trim().toLowerCase();
            if (attrName === targetLower || (fixedCfg && row.id === fixedCfg.rowId)) {
                matches.push(row);
            }
        });
        return matches;
    }

    function finalizePendingRemoval(row) {
        if (!row) return;
        if (row._removeTimer) {
            clearTimeout(row._removeTimer);
            row._removeTimer = null;
        }
        const invKey = canonicalInvKey(row.getAttribute('data-investigation') || '');
        const drawer = row._pendingDrawer || getDrawerForRow(row, row.id);
        row._pendingDrawer = null;
        row.remove();
        if (drawer) drawer.remove();
        if (invKey && _savedInvestigations[invKey]) {
            delete _savedInvestigations[invKey];
            syncSavedRecordsToEMR();
        }
    }

    function captureFormValues(container) {
        const values = [];
        if (!container) return values;
        container.querySelectorAll('input, select, textarea').forEach(el => {
            if (!el.id) return;
            values.push({ id: el.id, value: el.value });
        });
        return values;
    }

    function restoreFormValues(savedValues) {
        if (!Array.isArray(savedValues)) return;
        savedValues.forEach(({ id, value }) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (el.tagName === 'SELECT' && value) {
                const hasOpt = Array.from(el.options).some(o => o.value === value);
                if (!hasOpt) {
                    const opt = document.createElement('option');
                    opt.value = value;
                    opt.textContent = value;
                    el.appendChild(opt);
                }
            }
            el.value = value;
        });
    }

    // ── Toast Notifications ───────────────────────────────────────────────────
    window.showInvToast = function (message, type = 'info', actionCallback = null, actionLabel = 'Undo') {
        const container = document.getElementById('invToastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `inv-toast ${type}`;

        const msgSpan = document.createElement('span');
        msgSpan.innerHTML = message;
        toast.appendChild(msgSpan);

        if (actionCallback) {
            const actionBtn = document.createElement('button');
            actionBtn.type = 'button';
            actionBtn.style.cssText = 'background:transparent; border:1px solid rgba(255,255,255,0.4); color:#fff; padding:2px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; margin-left:8px; font-weight:700;';
            actionBtn.textContent = actionLabel;
            actionBtn.onclick = function () {
                actionCallback();
                toast.remove();
            };
            toast.appendChild(actionBtn);
        }

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                toast.style.transition = 'all 0.25s ease';
                setTimeout(() => toast.remove(), 250);
            }
        }, 4000);
    };

    // ── Helper: Non-Ocular / Systemic Investigations ──────────────────────────
    const NON_OCULAR_INVESTIGATIONS = [
        'Blood Sugar',
        'Blood Pressure',
        'CBC / ESR',
        'Serum Creatinine',
        'Coagulation (PT / INR)',
        'Serology (HBsAg, Anti-HCV, HIV)',
        'ECG',
        'Urine R/M/E',
        'Chest X-Ray',
        'HbA1c',
        'FBS',
        'RBS'
    ];

    window.isNonOcularInvestigation = function (name) {
        if (!name) return false;
        const fixedCfg = getFixedInvestigationConfig(name);
        if (fixedCfg) {
            return fixedCfg.isNonOcular;
        }
        const select = document.getElementById('invTypeSelect');
        if (select) {
            const opt = Array.from(select.options).find(o => o.value === name);
            if (opt) {
                if (opt.getAttribute('data-ocular') === 'false') return true;
                if (opt.getAttribute('data-ocular') === 'true') return false;
                const optgroup = opt.closest('optgroup');
                if (optgroup && /systemic|general|non-ocular/i.test(optgroup.label)) return true;
            }
        }
        return NON_OCULAR_INVESTIGATIONS.some(item =>
            name.toLowerCase().includes(item.toLowerCase()) ||
            item.toLowerCase().includes(name.toLowerCase())
        );
    };

    window.handleInvTypeChange = function () {
        const typeSelect = document.getElementById('invTypeSelect');
        if (!typeSelect) return;
    };

    // ── Modal Open & Close ────────────────────────────────────────────────────
    window.openInvestigationModal = function () {
        const modal = document.getElementById('investigationModal');
        if (!modal) return;

        handleInvTypeChange();

        // Sync saved audit cells & hide audit fields on unsaved/modified rows
        const tableBody = document.getElementById('invTableBody');
        if (tableBody) {
            tableBody.querySelectorAll('tr.inv-row:not(.inv-row-leaving)').forEach(row => {
                syncRowDirtyState(row);
                // Ensure "Others" textbox is properly shown/hidden on open
                syncRowHospitalVisibility(row);
            });
        }
        refreshAuditColumnVisibility();

        // Run live calculations on any existing data
        handleIopChange('re');
        handleIopChange('le');
        handleBpChange();
        calculateKeratometry('re');
        calculateKeratometry('le');
        handleSugarChange();
        updateTotalCountBadge();

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        window.addEventListener('keydown', handleInvKeyboardShortcuts);
    };

    window.closeInvestigationModal = function () {
        const modal = document.getElementById('investigationModal');
        if (modal) {
            modal.style.display = 'none';
        }
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleInvKeyboardShortcuts);
    };

    function handleInvKeyboardShortcuts(event) {
        if (event.key === 'Escape') {
            closeInvestigationModal();
        } else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            saveAllInvestigations();
        }
    }

    // Close when clicking modal backdrop outside the card
    document.addEventListener('click', function (event) {
        const modal = document.getElementById('investigationModal');
        if (modal && event.target === modal) {
            closeInvestigationModal();
        }
    });

    // ── Quick-Jump / Add via Quick Pills ───────────────────────────────────────
    window.handleQuickPillClick = function (investigationName) {
        const fixedCfg = getFixedInvestigationConfig(investigationName);
        const rowIdMap = {
            'IOP': 'inv_row_iop',
            'DUCT': 'inv_row_duct',
            'Blood Sugar': 'inv_row_blood_sugar',
            'Colour Vision': 'inv_row_colour_vision',
            'Blood Pressure': 'inv_row_blood_pressure',
            'K Reading': 'inv_row_k_reading'
        };

        const targetId = fixedCfg ? fixedCfg.rowId : rowIdMap[investigationName];
        const rowEl = targetId ? document.getElementById(targetId) : null;

        if (rowEl && !rowEl.classList.contains('inv-row-leaving')) {
            rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            rowEl.classList.remove('inv-row-highlight');
            void rowEl.offsetWidth;
            rowEl.classList.add('inv-row-highlight');
            showInvToast(`Jumped to <strong>${escapeHtml(fixedCfg ? fixedCfg.name : investigationName)}</strong>`, 'info');
        } else {
            quickAddInvestigation(investigationName);
        }
    };

    // ── Quick Add Investigation Row ───────────────────────────────────────────
    window.quickAddInvestigation = function (name, eye = 'BE', options = {}) {
        const tableBody = document.getElementById('invTableBody');
        const cleanName = (name || '').trim();
        if (!tableBody || !cleanName) return null;

        const fixedCfg = getFixedInvestigationConfig(cleanName);
        const canonicalName = fixedCfg ? fixedCfg.name : cleanName;

        const matchedRows = findRowsByInvestigation(tableBody, canonicalName, fixedCfg);
        let activeRow = null;
        matchedRows.forEach(row => {
            if (row.classList.contains('inv-row-leaving')) {
                finalizePendingRemoval(row);
            } else if (!activeRow) {
                activeRow = row;
            }
        });

        if (activeRow) {
            if (!options.silent) {
                activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                activeRow.classList.remove('inv-row-highlight');
                void activeRow.offsetWidth;
                activeRow.classList.add('inv-row-highlight');
                showInvToast(`<strong>${escapeHtml(canonicalName)}</strong> is already present in the investigation table.`, 'warning');
            }
            return activeRow;
        }

        // Fixed investigation: restore canonical fields (without displaying audit fields before save)
        if (fixedCfg) {
            const emptyRow = tableBody.querySelector('.inv-empty-state-row');
            if (emptyRow) emptyRow.remove();

            const strayDrawer = document.getElementById(fixedCfg.drawerId);
            if (strayDrawer) strayDrawer.remove();

            const { tr, drawerTr } = buildFixedInvestigationElements(fixedCfg);
            tableBody.appendChild(tr);
            tableBody.appendChild(drawerTr);

            bindFixedInvestigationBehaviors(fixedCfg);
            if (!fixedCfg.isNonOcular) {
                applyRowEyeState(tr, eye);
            }

            if (!options.silent) {
                const focusId = fixedCfg.focusByEye && (fixedCfg.focusByEye[eye] || fixedCfg.focusByEye.BE || fixedCfg.focusByEye.NA);
                if (focusId) {
                    const focusEl = document.getElementById(focusId);
                    if (focusEl && typeof focusEl.focus === 'function') {
                        focusEl.focus();
                    }
                }
                tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
                tr.classList.add('inv-row-highlight');
                showInvToast(`Added <strong>${escapeHtml(fixedCfg.name)}</strong> to investigations.`, 'success');
            }

            updateTotalCountBadge();
            refreshAuditColumnVisibility();
            return tr;
        }

        // Custom investigation: audit cell stays empty until saved
        const safeKey = canonicalInvKey(cleanName);
        const rowId = `inv_row_${safeKey}`;
        const isNonOcular = window.isNonOcularInvestigation(cleanName);

        const safeJsRowId = escapeJsSingleQuote(rowId);
        const safeJsName = escapeJsSingleQuote(cleanName);

        const tr = document.createElement('tr');
        tr.className = 'inv-row';
        tr.id = rowId;
        tr.setAttribute('data-investigation', cleanName);
        tr.setAttribute('data-saved', 'false');
        if (isNonOcular) tr.setAttribute('data-non-ocular', 'true');

        const eyeToggleHtml = !isNonOcular
            ? buildEyeToggleHtml(safeKey, `inv_eye_toggle_${safeKey}`, cleanName)
            : '';

        tr.innerHTML = `
            <td class="col-name">
                <div class="inv-name-block">
                    <div class="inv-name-row">
                        <span class="inv-primary-name">${escapeHtml(cleanName)}</span>
                        ${eyeToggleHtml}
                    </div>
                </div>
            </td>
            <td class="col-re"${isNonOcular ? ' colspan="2"' : ''}>
                <div class="inv-cell-flex">
                    <input type="text" class="inv-input inv-select-grow" id="${escapeHtml(safeKey)}_re" placeholder="${isNonOcular ? 'Value / Result...' : 'RE findings / value...'}">
                </div>
            </td>
            ${isNonOcular ? '' : `<td class="col-le">
                <div class="inv-cell-flex">
                    <input type="text" class="inv-input inv-select-grow" id="${escapeHtml(safeKey)}_le" placeholder="LE findings / value...">
                </div>
            </td>`}
            <td class="col-date">
                ${buildHospitalInnerHtml(safeKey)}
                <div class="inv-date-cell-content" id="${escapeHtml(safeKey)}_audit_cell"></div>
            </td>
            <td class="col-action">
                <div class="inv-action-btn-group">
                    <button type="button" class="btn-inv-delete" onclick="removeInvestigationRow('${escapeHtml(safeJsRowId)}', '${escapeHtml(safeJsName)}')" title="Remove entry">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <button type="button" class="btn-inv-save-row" onclick="saveRowIndividual('${escapeHtml(safeJsName)}')" title="Save entry">
                        <i class="fa-regular fa-floppy-disk"></i>
                    </button>
                </div>
            </td>
        `;

        const drawerTr = document.createElement('tr');
        drawerTr.className = 'inv-detail-drawer';
        drawerTr.id = `inv_drawer_${safeKey}`;
        drawerTr.style.display = 'none';
        drawerTr.innerHTML = `
            <td colspan="5">
                <div class="inv-drawer-content">
                    <div class="drawer-field grow">
                        <label class="drawer-label"><i class="fa-regular fa-clipboard"></i> Clinical Findings / Report Summary:</label>
                        <input type="text" class="inv-input inv-input-sm" id="${escapeHtml(safeKey)}_notes" placeholder="Enter diagnostic impression, instrument findings, or parameters...">
                    </div>
                </div>
            </td>
        `;

        const emptyRow = tableBody.querySelector('.inv-empty-state-row');
        if (emptyRow) emptyRow.remove();

        tableBody.appendChild(tr);
        tableBody.appendChild(drawerTr);

        if (!isNonOcular) {
            applyRowEyeState(tr, eye);
        }

        if (!options.silent) {
            tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            tr.classList.add('inv-row-highlight');
            showInvToast(`Added <strong>${escapeHtml(cleanName)}</strong> to investigations.`, 'success');
        }

        updateTotalCountBadge();
        refreshAuditColumnVisibility();
        return tr;
    };

    // ── Add from Controls Bar ─────────────────────────────────────────────────
    window.addNewInvestigationFromBar = function () {
        const select = document.getElementById('invTypeSelect');

        if (!select || !select.value) {
            showInvToast('Please select an investigation from the dropdown.', 'warning');
            if (select) select.focus();
            return;
        }

        const invName = select.value;
        const isNonOcular = window.isNonOcularInvestigation(invName);
        const eye = isNonOcular ? 'NA' : 'BE';

        quickAddInvestigation(invName, eye);

        select.value = '';
        handleInvTypeChange();
    };

    // ── Remove Row with Undo ──────────────────────────────────────────────────
    window.removeInvestigationRow = function (rowId, name) {
        const row = document.getElementById(rowId);
        if (!row || row.classList.contains('inv-row-leaving')) return;

        const drawer = getDrawerForRow(row, rowId);
        const invName = name || row.getAttribute('data-investigation') || '';
        const invKey = canonicalInvKey(invName);
        const savedRecordBackup = _savedInvestigations[invKey] ? { ..._savedInvestigations[invKey] } : null;

        const deletedEntry = {
            rowHtml: row.outerHTML,
            drawerHtml: drawer ? drawer.outerHTML : null,
            rowValues: captureFormValues(row),
            drawerValues: captureFormValues(drawer),
            rowId: rowId,
            name: invName,
            key: invKey,
            savedRecord: savedRecordBackup
        };
        _lastDeletedRow = deletedEntry;

        row.classList.add('inv-row-leaving');
        row._pendingDrawer = drawer;
        if (drawer) drawer.style.display = 'none';
        updateTotalCountBadge();
        refreshAuditColumnVisibility();

        row._removeTimer = setTimeout(() => {
            row._removeTimer = null;
            row._pendingDrawer = null;
            row.remove();
            if (drawer) drawer.remove();
            if (invKey && _savedInvestigations[invKey]) {
                delete _savedInvestigations[invKey];
                syncSavedRecordsToEMR();
            }
            updateTotalCountBadge();
            refreshAuditColumnVisibility();

            showInvToast(`Removed <strong>${escapeHtml(invName)}</strong>`, 'info', function () {
                const entry = deletedEntry || _lastDeletedRow;
                if (!entry) return;
                const tableBody = document.getElementById('invTableBody');
                if (!tableBody) return;

                const fixedCfg = getFixedInvestigationByRowId(entry.rowId) || getFixedInvestigationConfig(entry.name);
                const existing = findRowsByInvestigation(tableBody, entry.name, fixedCfg);
                if (existing.some(r => !r.classList.contains('inv-row-leaving'))) {
                    return;
                }
                existing.forEach(r => finalizePendingRemoval(r));

                const emptyRow = tableBody.querySelector('.inv-empty-state-row');
                if (emptyRow) emptyRow.remove();

                const tempDiv = document.createElement('tbody');
                tempDiv.innerHTML = entry.rowHtml + (entry.drawerHtml || '');
                let restoredRow = null;
                while (tempDiv.firstChild) {
                    const node = tempDiv.firstChild;
                    if (node.classList && node.classList.contains('inv-row-leaving')) {
                        node.classList.remove('inv-row-leaving');
                    }
                    if (!restoredRow && node.classList && node.classList.contains('inv-row')) {
                        restoredRow = node;
                    }
                    tableBody.appendChild(node);
                }

                restoreFormValues(entry.rowValues);
                restoreFormValues(entry.drawerValues);
                if (restoredRow) {
                    syncRowHospitalVisibility(restoredRow);
                }
                if (entry.savedRecord && restoredRow) {
                    _savedInvestigations[entry.key] = entry.savedRecord;
                    syncRowDirtyState(restoredRow);
                    syncSavedRecordsToEMR();
                } else if (restoredRow) {
                    renderRowAuditCell(restoredRow, null);
                }
                if (fixedCfg) {
                    bindFixedInvestigationBehaviors(fixedCfg);
                }
                updateTotalCountBadge();
                refreshAuditColumnVisibility();
                showInvToast(`Restored <strong>${escapeHtml(entry.name)}</strong>`, 'success');
            });
        }, 180);
    };

    // ── Toggle Collapsible Row Details ────────────────────────────────────────
    window.toggleInvRowDetails = function (rowKey) {
        const drawer = document.getElementById(`inv_drawer_${rowKey}`);
        if (!drawer) return;

        let parentRow = document.getElementById(`inv_row_${rowKey}`);
        if (!parentRow) {
            const fixedCfg = getFixedInvestigationByShortKey(rowKey);
            if (fixedCfg) {
                parentRow = document.getElementById(fixedCfg.rowId);
            }
        }
        if (!parentRow && drawer.previousElementSibling && drawer.previousElementSibling.classList.contains('inv-row')) {
            parentRow = drawer.previousElementSibling;
        }

        const isVisible = drawer.style.display !== 'none';
        drawer.style.display = isVisible ? 'none' : 'table-row';

        if (parentRow) {
            const expandBtn = parentRow.querySelector('.btn-inv-expand');
            if (expandBtn) {
                expandBtn.setAttribute('aria-expanded', isVisible ? 'false' : 'true');
                if (isVisible) {
                    expandBtn.classList.remove('active');
                    expandBtn.innerHTML = '<i class="fa-solid fa-circle-plus"></i>';
                } else {
                    expandBtn.classList.add('active');
                    expandBtn.innerHTML = '<i class="fa-solid fa-circle-minus"></i>';
                }
            }
        }
    };

    // ── Eye Toggle Helpers & Row Eye Visibility ───────────────────────────────
    function setRowEyeCellEnabled(cell, isEnabled) {
        if (!cell) return;
        cell.classList.toggle('inv-eye-cell-hidden', !isEnabled);
        cell.querySelectorAll('input, select, textarea, button').forEach(el => {
            el.disabled = !isEnabled;
        });
    }

    function normalizeRowEye(eye) {
        const raw = String(eye || '').toLowerCase().trim();
        if (raw === 're' || raw === 'le' || raw === 'be') return raw;
        return 'be';
    }

    function resolveOcularRow(rowKey, btnEl) {
        let row = btnEl && btnEl.closest ? btnEl.closest('tr.inv-row') : null;
        if (!row && rowKey) {
            row = document.getElementById(`inv_row_${rowKey}`);
            if (!row) {
                const fixedCfg = getFixedInvestigationByShortKey(rowKey);
                if (fixedCfg) {
                    row = document.getElementById(fixedCfg.rowId);
                }
            }
        }
        return row;
    }

    function applyRowEyeState(row, eye) {
        if (!row || row.getAttribute('data-non-ocular') === 'true') return;
        if (String(eye || '').toLowerCase().trim() === 'na') return;

        const eyeLower = normalizeRowEye(eye);
        const reActive = eyeLower === 're' || eyeLower === 'be';
        const leActive = eyeLower === 'le' || eyeLower === 'be';

        row.querySelectorAll('.inv-eye-btn').forEach(btn => {
            const btnEye = (btn.getAttribute('data-eye') || '').toLowerCase();
            const isActive = btnEye === eyeLower;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        setRowEyeCellEnabled(row.querySelector('td.col-re'), reActive);
        setRowEyeCellEnabled(row.querySelector('td.col-le'), leActive);
    }

    window.toggleInvEye = function (rowKey, eye, btnEl) {
        const row = resolveOcularRow(rowKey, btnEl);
        if (!row || row.getAttribute('data-non-ocular') === 'true') return;
        if (row.getAttribute('data-saved') === 'true' || row.classList.contains('inv-row-locked')) {
            return;
        }
        applyRowEyeState(row, eye);
        syncRowDirtyState(row);
    };

    // ── Clinical Assistant: IOP Validation ────────────────────────────────────
    window.handleIopChange = function (eye) {
        const valInput = document.getElementById(`iop_${eye}_value`);
        const chip = document.getElementById(`iop_${eye}_chip`);
        if (!valInput || !chip) return;

        const val = parseFloat(valInput.value);
        if (isNaN(val) || val <= 0) {
            chip.style.display = 'none';
            return;
        }

        chip.style.display = 'inline-flex';
        if (val > 21) {
            chip.className = 'inv-status-chip danger';
            chip.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> High (>21)';
        } else if (val < 10) {
            chip.className = 'inv-status-chip warning';
            chip.innerHTML = '<i class="fa-solid fa-circle-info"></i> Low (<10)';
        } else {
            chip.className = 'inv-status-chip normal';
            chip.innerHTML = '<i class="fa-solid fa-check"></i> Normal';
        }
    };

    // ── Clinical Assistant: Blood Pressure Staging ────────────────────────────
    window.handleBpChange = function () {
        const sysInput = document.getElementById('bp_systolic');
        const diaInput = document.getElementById('bp_diastolic');
        const chip = document.getElementById('bp_chip');
        if (!sysInput || !diaInput || !chip) return;

        const sys = parseInt(sysInput.value, 10);
        const dia = parseInt(diaInput.value, 10);

        if (isNaN(sys) && isNaN(dia)) {
            chip.style.display = 'none';
            return;
        }

        chip.style.display = 'inline-flex';

        if (sys >= 180 || dia >= 120) {
            chip.className = 'inv-status-chip danger';
            chip.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Crisis (>180/120)';
        } else if (sys >= 140 || dia >= 90) {
            chip.className = 'inv-status-chip danger';
            chip.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Stage 2 HTN';
        } else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
            chip.className = 'inv-status-chip warning';
            chip.innerHTML = '<i class="fa-solid fa-circle-info"></i> Stage 1 HTN';
        } else if (sys >= 120 && sys <= 129 && dia < 80) {
            chip.className = 'inv-status-chip warning';
            chip.innerHTML = 'Elevated BP';
        } else if (sys < 120 && dia < 80 && sys > 70 && dia > 40) {
            chip.className = 'inv-status-chip normal';
            chip.innerHTML = '<i class="fa-solid fa-check"></i> Normal';
        } else {
            chip.className = 'inv-status-chip';
            chip.textContent = `${sys || '--'}/${dia || '--'} mmHg`;
        }
    };

    // ── Clinical Assistant: Keratometry & Corneal Astigmatism ─────────────────
    window.calculateKeratometry = function (eye) {
        const k1Input = document.getElementById(`k_${eye}_k1`);
        const axis1Input = document.getElementById(`k_${eye}_axis1`);
        const k2Input = document.getElementById(`k_${eye}_k2`);
        const axis2Input = document.getElementById(`k_${eye}_axis2`);
        const badge = document.getElementById(`k_${eye}_calc`);
        const badgeText = document.getElementById(`k_${eye}_calc_text`);

        if (!k1Input || !k2Input || !badge || !badgeText) return;

        const k1 = parseFloat(k1Input.value);
        const k2 = parseFloat(k2Input.value);
        const axis1 = parseInt(axis1Input ? axis1Input.value : '', 10) || 0;
        const axis2 = parseInt(axis2Input ? axis2Input.value : '', 10) || 0;

        if (isNaN(k1) || isNaN(k2)) {
            badge.style.display = 'none';
            return;
        }

        const deltaK = Math.abs(k2 - k1).toFixed(2);
        const avgK = ((k1 + k2) / 2).toFixed(2);

        let rule = '';
        const steepAxis = k2 > k1 ? axis2 : axis1;
        if (steepAxis >= 60 && steepAxis <= 120) {
            rule = 'WTR';
        } else if ((steepAxis >= 0 && steepAxis <= 30) || (steepAxis >= 150 && steepAxis <= 180)) {
            rule = 'ATR';
        } else if (steepAxis > 0) {
            rule = 'Oblique';
        }

        badge.style.display = 'inline-flex';
        badgeText.textContent = `ΔK: ${deltaK} D ${rule ? `(${rule})` : ''} • Avg: ${avgK} D`;
    };

    // ── Clinical Assistant: Blood Sugar Evaluation ─────────────────────────────
    window.handleSugarChange = function () {
        const typeSelect = document.getElementById('sugar_test_type');
        const valInput = document.getElementById('sugar_value');
        const chip = document.getElementById('sugar_chip');
        const unitLabel = document.getElementById('sugar_unit_label');

        if (!typeSelect || !valInput || !chip) return;

        const type = typeSelect.value;
        const val = parseFloat(valInput.value);

        if (unitLabel) {
            unitLabel.textContent = type === 'HbA1c' ? '%' : 'mg%';
        }

        if (isNaN(val) || val <= 0) {
            chip.style.display = 'none';
            return;
        }

        chip.style.display = 'inline-flex';

        if (type === 'FBS') {
            if (val >= 126) {
                chip.className = 'inv-status-chip danger';
                chip.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> High (≥126)';
            } else if (val >= 100) {
                chip.className = 'inv-status-chip warning';
                chip.innerHTML = 'Impaired (100-125)';
            } else {
                chip.className = 'inv-status-chip normal';
                chip.innerHTML = '<i class="fa-solid fa-check"></i> Normal';
            }
        } else if (type === 'HbA1c') {
            if (val >= 6.5) {
                chip.className = 'inv-status-chip danger';
                chip.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Diabetic (≥6.5%)';
            } else if (val >= 5.7) {
                chip.className = 'inv-status-chip warning';
                chip.innerHTML = 'Pre-diabetic';
            } else {
                chip.className = 'inv-status-chip normal';
                chip.innerHTML = '<i class="fa-solid fa-check"></i> Normal (<5.7%)';
            }
        } else {
            if (val >= 200) {
                chip.className = 'inv-status-chip danger';
                chip.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Elevated (≥200)';
            } else if (val >= 140) {
                chip.className = 'inv-status-chip warning';
                chip.innerHTML = 'Borderline';
            } else {
                chip.className = 'inv-status-chip normal';
                chip.innerHTML = '<i class="fa-solid fa-check"></i> Normal';
            }
        }
    };

    // ── Colour Vision Auto-Score Fill ──────────────────────────────────────────
    window.handleColourVisionChange = function (eye) {
        const select = document.getElementById(`cv_${eye}_select`);
        const scoreInput = document.getElementById(`cv_${eye}_score`);
        if (!select || !scoreInput) return;

        if (select.value === 'Normal' && !scoreInput.value) {
            scoreInput.value = '17/17';
        }
    };

    // ── Empty State & Total Count Badge ───────────────────────────────────────
    function syncEmptyStateRow(tableBody, activeCount) {
        if (!tableBody) return;
        const existingEmpty = tableBody.querySelector('.inv-empty-state-row');
        if (activeCount > 0) {
            if (existingEmpty) existingEmpty.remove();
            return;
        }
        if (!existingEmpty) {
            const emptyTr = document.createElement('tr');
            emptyTr.className = 'inv-empty-state-row';
            emptyTr.id = 'invEmptyStateRow';
            emptyTr.innerHTML = `
                <td colspan="5" class="inv-empty-state-cell">
                    <div class="inv-empty-state-content">
                        <i class="fa-solid fa-microscope" aria-hidden="true"></i>
                        <span>No investigations added yet. Select an investigation above and click <strong>Add</strong>.</span>
                    </div>
                </td>
            `;
            tableBody.appendChild(emptyTr);
        }
    }

    function updateTotalCountBadge() {
        const tableBody = document.getElementById('invTableBody');
        const countBadge = document.getElementById('invTotalCountBadge');
        const footerStatus = document.getElementById('invFooterStatusText');

        if (!tableBody) return;

        const activeRows = tableBody.querySelectorAll('tr.inv-row:not(.inv-row-leaving)');
        const count = activeRows.length;

        syncEmptyStateRow(tableBody, count);

        if (countBadge) {
            countBadge.textContent = `${count} ${count === 1 ? 'Item' : 'Items'}`;
        }
        if (footerStatus) {
            footerStatus.textContent = count === 0
                ? 'No investigations added • Select an investigation above to add'
                : `${count} ${count === 1 ? 'investigation' : 'investigations'} active • All entries validated`;
        }
    }

    // ── Backend Persistence Helper ────────────────────────────────────────────
    function getCsrfToken() {
        if (typeof window.getPatientLoadCsrf === 'function') {
            return window.getPatientLoadCsrf();
        }
        const input = document.querySelector('[name=csrfmiddlewaretoken]');
        if (input) return input.value;
        const cookies = document.cookie ? document.cookie.split(';') : [];
        for (let i = 0; i < cookies.length; i++) {
            const c = cookies[i].trim();
            if (c.startsWith('csrftoken=')) {
                return decodeURIComponent(c.substring('csrftoken='.length));
            }
        }
        return '';
    }

    function stripAuditFields(rec) {
        const hospitalType = rec.hospital_type === 'Others' ? 'Others' : 'IIEIH';
        const hospitalName = hospitalType === 'Others'
            ? String(rec.hospital_name || '').trim()
            : 'IIEIH';
        return {
            key: rec.key,
            name: rec.name,
            is_fixed: Boolean(rec.is_fixed),
            is_non_ocular: Boolean(rec.is_non_ocular),
            eye: rec.eye || (rec.is_non_ocular ? 'NA' : 'BE'),
            hospital_type: hospitalType,
            hospital_name: hospitalName,
            data: rec.data || {},
            summary: rec.summary || ''
        };
    }

    async function persistInvestigationsToBackend(cleanItems, summaryText, saveMode) {
        const pat = window._rxPatient || null;
        if (!pat) return null;

        const payload = new FormData();
        payload.append('save_investigations', '1');
        payload.append('save_mode', saveMode || 'replace');
        payload.append('investigations_json', JSON.stringify(cleanItems));
        payload.append('investigations_summary', summaryText || '');
        if (window._rxPrescriptionId) {
            payload.append('prescription_id', window._rxPrescriptionId);
        }
        payload.append('patient_mrn', pat.mrn || '');
        payload.append('patient_name', pat.name || '');
        payload.append('patient_age', pat.age || 0);
        payload.append('patient_gender', pat.gender || 'Male');
        payload.append('eye', pat.eye || 'BE');

        const resp = await fetch(window.location.pathname, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: payload
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data && data.success) {
            if (data.prescription_id && !window._rxPrescriptionId) {
                window._rxPrescriptionId = data.prescription_id;
            }
            return data;
        }
        return null;
    }

    // ── EMR Sidebar Sync ──────────────────────────────────────────────────────
    function syncSavedRecordsToEMR() {
        const records = Object.values(_savedInvestigations);
        window._investigationsState.saved_records = records;

        const summaryLines = records.map(r => r.summary).filter(Boolean);
        const emrTextarea = document.getElementById('rx_investigation');
        if (emrTextarea) {
            emrTextarea.value = summaryLines.join('\n');
        }

        const invBadge = document.getElementById('investigation_count_badge');
        if (invBadge) {
            if (records.length > 0) {
                invBadge.style.display = 'inline-flex';
                invBadge.textContent = `${records.length} recorded`;
            } else {
                invBadge.style.display = 'none';
                invBadge.textContent = '';
            }
        }

        renderEmrInvestigationDisplay(records);

        // Sync IOP quick summary boxes if IOP is saved
        const iopRec = _savedInvestigations['iop'];
        const iopOdEl = document.getElementById('emr_iop_od');
        const iopOsEl = document.getElementById('emr_iop_os');
        if (iopRec && iopRec.data) {
            if (iopOdEl) iopOdEl.value = iopRec.data.re_value || '-';
            if (iopOsEl) iopOsEl.value = iopRec.data.le_value || '-';
        }
    }

    function renderEmrInvestigationDisplay(records, fallbackText = '') {
        const displayEl = document.getElementById('emr_investigation_display');
        if (!displayEl) return;

        if ((!records || records.length === 0) && !fallbackText) {
            displayEl.innerHTML = `
                <div class="emr-empty-complaints-hint">
                    <i class="fa-solid fa-microscope"></i>
                    <span>Click to record Tonometry, DUCT, BP, K Reading, Labs...</span>
                </div>
            `;
            return;
        }

        if ((!records || records.length === 0) && fallbackText) {
            const lines = fallbackText.split('\n').map(s => s.trim()).filter(Boolean);
            displayEl.innerHTML = `
                <div class="inv-emr-summary-list">
                    ${lines.map(ln => `
                        <div class="inv-emr-item-card" onclick="openInvestigationModal()" title="Click to manage Investigation findings">
                            <div class="inv-emr-item-summary">${escapeHtml(ln)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            return;
        }

        displayEl.innerHTML = `
            <div class="inv-emr-summary-list">
                ${records.map(rec => {
            const { date, time, enteredBy, hospitalDisplay } = extractAuditDisplayParts(rec, false);
            const hasAuditMeta = Boolean(date || time || enteredBy || hospitalDisplay);
            const safeDate = date || '—';
            const safeTime = time || '—';
            const safeBy = enteredBy || '—';
            const safeHospital = hospitalDisplay || 'IIEIH';
            return `
                        <div class="inv-emr-item-card" onclick="openInvestigationModal()" title="Click to view or add Investigations">
                            <div class="inv-emr-item-summary">${escapeHtml(rec.summary || rec.name)}</div>
                            ${hasAuditMeta ? `
                                <div class="inv-emr-item-audit">
                                    <div class="inv-emr-audit-row">
                                        <span class="inv-emr-audit-cell inv-emr-audit-date" title="Investigation Date: ${escapeHtml(safeDate)}">
                                            <i class="fa-regular fa-calendar" aria-hidden="true"></i>
                                            <span class="inv-emr-audit-text">${escapeHtml(safeDate)}</span>
                                        </span>
                                        <span class="inv-emr-audit-cell inv-emr-audit-time" title="Investigation Time: ${escapeHtml(safeTime)}">
                                            <i class="fa-regular fa-clock" aria-hidden="true"></i>
                                            <span class="inv-emr-audit-text">${escapeHtml(safeTime)}</span>
                                        </span>
                                    </div>
                                    <div class="inv-emr-audit-row">
                                        <span class="inv-emr-audit-cell inv-emr-audit-by" title="Done By: ${escapeHtml(safeBy)}">
                                            <i class="fa-solid fa-user-check" aria-hidden="true"></i>
                                            <span class="inv-emr-audit-text">${escapeHtml(safeBy)}</span>
                                        </span>
                                        <span class="inv-emr-audit-cell inv-emr-audit-hospital" title="Hospital Name: ${escapeHtml(safeHospital)}">
                                            <i class="fa-regular fa-hospital" aria-hidden="true"></i>
                                            <span class="inv-emr-audit-text">${escapeHtml(safeHospital)}</span>
                                        </span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    function applyServerRecordsToStateAndTable(serverList, options = {}) {
        if (!Array.isArray(serverList)) return;
        const tableBody = document.getElementById('invTableBody');
        const nextSaved = {};
        serverList.forEach(item => {
            const key = canonicalInvKey(item.key || item.name);
            if (!key) return;
            nextSaved[key] = { ...item, key };
        });
        _savedInvestigations = nextSaved;

        if (tableBody) {
            tableBody.querySelectorAll('tr.inv-row:not(.inv-row-leaving)').forEach(row => {
                const key = canonicalInvKey(row.getAttribute('data-investigation'));
                if (_savedInvestigations[key]) {
                    if (options.lockSaved) {
                        row.setAttribute('data-editing', 'false');
                    }
                    syncRowDirtyState(row);
                } else {
                    row.setAttribute('data-editing', 'false');
                    renderRowAuditCell(row, null);
                    if (row.classList.contains('inv-row-locked')) {
                        unlockRowFields(row, { editing: false });
                    }
                    renderRowActionButtons(row, false);
                }
            });
            refreshAuditColumnVisibility();
        }
        syncSavedRecordsToEMR();
    }

    // ── Row Field Lock / Unlock Helpers ──────────────────────────────────────
    function lockRowFields(row) {
        if (!row) return;
        row.querySelectorAll('input, select, textarea').forEach(el => {
            el.disabled = true;
            el.classList.add('inv-field-locked');
        });
        row.querySelectorAll('.inv-eye-btn').forEach(btn => {
            btn.disabled = true;
        });
        const drawer = getDrawerForRow(row, row.id);
        if (drawer) {
            drawer.querySelectorAll('input, select, textarea').forEach(el => {
                el.disabled = true;
                el.classList.add('inv-field-locked');
            });
        }
        row.classList.add('inv-row-locked');
        row.setAttribute('data-editing', 'false');
    }

    function unlockRowFields(row, options = {}) {
        if (!row) return;
        const isNonOcular = row.getAttribute('data-non-ocular') === 'true';
        const eyeState = getRowEyeState(row);

        row.querySelectorAll('input, select, textarea').forEach(el => {
            el.disabled = false;
            el.classList.remove('inv-field-locked');
        });
        row.querySelectorAll('.inv-eye-btn').forEach(btn => {
            btn.disabled = false;
        });

        if (!isNonOcular && eyeState !== 'NA') {
            applyRowEyeState(row, eyeState);
        }

        // Re-sync hospital visibility after unlocking all fields
        syncRowHospitalVisibility(row);

        const drawer = getDrawerForRow(row, row.id);
        if (drawer) {
            drawer.querySelectorAll('input, select, textarea').forEach(el => {
                el.disabled = false;
                el.classList.remove('inv-field-locked');
            });
        }

        row.classList.remove('inv-row-locked');
        row.setAttribute('data-editing', options.editing === false ? 'false' : 'true');
    }

    // ── Render Action Buttons Based on Saved State ────────────────────────────
    /**
     * Re-renders the action button group inside the given row.
     * isSaved=true  → Delete button only (saved data cannot be edited again)
     * isSaved=false → Delete + Save buttons (fields are editable)
     */
    function renderRowActionButtons(row, isSaved) {
        if (!row) return;
        const actionGroup = row.querySelector('.inv-action-btn-group');
        if (!actionGroup) return;

        const wantsSavedButtons = Boolean(isSaved);
        const hasDeleteBtn = Boolean(actionGroup.querySelector('.btn-inv-delete'));
        const hasLockBadge = Boolean(actionGroup.querySelector('.inv-row-lock-badge'));
        const hasSaveBtn = Boolean(actionGroup.querySelector('.btn-inv-save-row'));
        if (wantsSavedButtons && hasDeleteBtn && !hasSaveBtn && !hasLockBadge) return;
        if (!wantsSavedButtons && hasDeleteBtn && hasSaveBtn && !hasLockBadge) return;

        const name = (row.getAttribute('data-investigation') || '').trim();
        const rowId = row.id || '';
        const safeJsName = escapeHtml(escapeJsSingleQuote(name));
        const safeJsRowId = escapeHtml(escapeJsSingleQuote(rowId));

        if (wantsSavedButtons) {
            actionGroup.innerHTML = `
                <button type="button" class="btn-inv-delete" onclick="removeInvestigationRow('${safeJsRowId}', '${safeJsName}')" title="Delete ${escapeHtml(name)} record">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
        } else {
            const fixedCfg = getFixedInvestigationConfig(name);
            const saveTitle = fixedCfg ? fixedCfg.saveTitle : `Save ${name} record`;
            const deleteTitle = fixedCfg ? fixedCfg.deleteTitle : `Remove ${name} entry`;
            actionGroup.innerHTML = `
                <button type="button" class="btn-inv-delete" onclick="removeInvestigationRow('${safeJsRowId}', '${safeJsName}')" title="${escapeHtml(deleteTitle)}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
                <button type="button" class="btn-inv-save-row" onclick="saveRowIndividual('${safeJsName}')" title="${escapeHtml(saveTitle)}">
                    <i class="fa-regular fa-floppy-disk"></i>
                </button>
            `;
        }
    }

    // ── Saved Rows Are Permanently Locked ────────────────────────────────────
    window.editInvestigationRow = function (name) {
        showInvToast(`<strong>${escapeHtml(name)}</strong> is saved and locked — saved data cannot be edited again.`, 'warning');
    };

    // ── Save Individual Row ───────────────────────────────────────────────────
    window.saveRowIndividual = async function (name) {
        const tableBody = document.getElementById('invTableBody');
        if (!tableBody) return;

        const fixedCfg = getFixedInvestigationConfig(name);
        const matches = findRowsByInvestigation(tableBody, name, fixedCfg).filter(
            r => !r.classList.contains('inv-row-leaving')
        );
        const row = matches[0];
        if (!row) return;

        const invKey = canonicalInvKey(row.getAttribute('data-investigation') || name);
        if (row.getAttribute('data-saved') === 'true' || _savedInvestigations[invKey]) {
            showInvToast(`<strong>${escapeHtml(name)}</strong> is already saved and locked.`, 'info');
            return;
        }

        const rec = extractRowRecord(row);
        if (!rec || !rec.hasData) {
            showInvToast(`Please enter values for <strong>${escapeHtml(name)}</strong> before saving.`, 'warning');
            const firstInput = row.querySelector('input:not([disabled]), select:not([disabled])');
            if (firstInput && typeof firstInput.focus === 'function') firstInput.focus();
            return;
        }
        if (rec.hospital_type === 'Others' && !rec.hospital_name) {
            showInvToast(`Please enter the hospital name for <strong>${escapeHtml(name)}</strong>.`, 'warning');
            const otherInput = row.querySelector('.inv-hospital-other');
            if (otherInput && typeof otherInput.focus === 'function') otherInput.focus();
            return;
        }

        const cleanPayload = stripAuditFields(rec);
        let stampedItem = null;

        try {
            const serverResp = await persistInvestigationsToBackend([cleanPayload], rec.summary, 'merge');
            if (serverResp && Array.isArray(serverResp.investigations)) {
                row.setAttribute('data-editing', 'false');
                applyServerRecordsToStateAndTable(serverResp.investigations);
                stampedItem = _savedInvestigations[rec.key];
            }
        } catch (err) {
            // Fall back to client system stamp below if offline / unmounted
        }

        if (!stampedItem) {
            const existing = _savedInvestigations[rec.key];
            const unchanged = existing && computeClinicalSignature(existing) === computeClinicalSignature(rec);
            const stamp = unchanged
                ? {
                    saved_date: existing.saved_date,
                    saved_time: existing.saved_time,
                    saved_datetime: existing.saved_datetime,
                    saved_at: existing.saved_at,
                    entered_by: existing.entered_by,
                    entered_by_username: existing.entered_by_username
                }
                : generateSystemAuditStamp();
            stampedItem = { ...cleanPayload, ...stamp };
            _savedInvestigations[rec.key] = stampedItem;
            applySavedRowUI(row, stampedItem);
            refreshAuditColumnVisibility();
            syncSavedRecordsToEMR();
        } else {
            applySavedRowUI(row, stampedItem);
            refreshAuditColumnVisibility();
        }

        showInvToast(`<strong>${escapeHtml(rec.name)}</strong> record saved.`, 'success');
    };

    // ── Save All Investigations & Sync to Profile EMR ─────────────────────────
    window.saveAllInvestigations = async function () {
        const tableBody = document.getElementById('invTableBody');
        const btnSave = document.getElementById('btnInvSaveAll');
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        }

        const enteredRecords = [];
        const activeRowsByKey = {};
        let missingHospitalRow = null;

        if (tableBody) {
            tableBody.querySelectorAll('tr.inv-row:not(.inv-row-leaving)').forEach(row => {
                const rec = extractRowRecord(row);
                if (!rec) return;
                activeRowsByKey[rec.key] = row;
                if (rec.hasData) {
                    if (rec.hospital_type === 'Others' && !rec.hospital_name && !missingHospitalRow) {
                        missingHospitalRow = { row, name: rec.name };
                    }
                    enteredRecords.push(rec);
                }
            });
        }

        if (missingHospitalRow) {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = '<i class="fa-solid fa-check"></i> <span>Save Investigations</span>';
            }
            showInvToast(`Please enter the hospital name for <strong>${escapeHtml(missingHospitalRow.name)}</strong>.`, 'warning');
            const otherInput = missingHospitalRow.row.querySelector('.inv-hospital-other');
            if (otherInput && typeof otherInput.focus === 'function') otherInput.focus();
            return;
        }

        const cleanItems = enteredRecords.map(stripAuditFields);
        const summaryLines = enteredRecords.map(r => r.summary).filter(Boolean);
        let handledByServer = false;

        try {
            const serverResp = await persistInvestigationsToBackend(cleanItems, summaryLines.join(' | '), 'replace');
            if (serverResp && Array.isArray(serverResp.investigations)) {
                applyServerRecordsToStateAndTable(serverResp.investigations, { lockSaved: true });
                handledByServer = true;
            }
        } catch (err) {
            handledByServer = false;
        }

        if (!handledByServer) {
            const nextSaved = {};
            const nowStamp = generateSystemAuditStamp();
            enteredRecords.forEach(rec => {
                const existing = _savedInvestigations[rec.key];
                const unchanged = existing && computeClinicalSignature(existing) === computeClinicalSignature(rec);
                const stamp = unchanged
                    ? {
                        saved_date: existing.saved_date,
                        saved_time: existing.saved_time,
                        saved_datetime: existing.saved_datetime,
                        saved_at: existing.saved_at,
                        entered_by: existing.entered_by,
                        entered_by_username: existing.entered_by_username
                    }
                    : nowStamp;
                nextSaved[rec.key] = { ...stripAuditFields(rec), ...stamp };
            });
            _savedInvestigations = nextSaved;

            Object.keys(activeRowsByKey).forEach(key => {
                const targetRow = activeRowsByKey[key];
                const savedRec = _savedInvestigations[key] || null;
                if (savedRec) {
                    applySavedRowUI(targetRow, savedRec);
                } else {
                    targetRow.setAttribute('data-editing', 'false');
                    renderRowAuditCell(targetRow, null);
                    if (targetRow.classList.contains('inv-row-locked')) {
                        unlockRowFields(targetRow, { editing: false });
                    }
                    renderRowActionButtons(targetRow, false);
                }
            });
            refreshAuditColumnVisibility();
            syncSavedRecordsToEMR();
        }

        if (btnSave) {
            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="fa-solid fa-check"></i> <span>Saved!</span>';
        }
        showInvToast('Investigations saved successfully to patient record.', 'success');

        setTimeout(() => {
            if (btnSave) {
                btnSave.innerHTML = '<i class="fa-solid fa-check"></i> <span>Save Investigations</span>';
            }
            closeInvestigationModal();
        }, 500);
    };

    // ── Collect & Restore API for EMR Prescription Save / Load / Reset ─────────
    window.collectInvestigationsForSave = function () {
        return Object.values(_savedInvestigations).map(stripAuditFields);
    };

    window.syncSavedInvestigationsFromServer = function (serverList) {
        applyServerRecordsToStateAndTable(serverList, { lockSaved: true });
    };

    function populateRowFromRecord(row, rec) {
        if (!row || !rec) return;
        const key = canonicalInvKey(rec.key || rec.name);
        const data = rec.data && typeof rec.data === 'object' ? rec.data : {};

        if (rec.eye && !rec.is_non_ocular && rec.eye !== 'NA') {
            applyRowEyeState(row, rec.eye);
        }

        // Restore hospital selection
        const hospitalSelect = row.querySelector('.inv-hospital-select');
        const hospitalOther = row.querySelector('.inv-hospital-other');
        if (hospitalSelect) {
            const hospitalType = rec.hospital_type === 'Others' ? 'Others' : 'IIEIH';
            // Add "Others" option dynamically if it's missing for some reason
            if (!Array.from(hospitalSelect.options).some(o => o.value === hospitalType)) {
                const opt = document.createElement('option');
                opt.value = hospitalType;
                opt.textContent = hospitalType;
                hospitalSelect.appendChild(opt);
            }
            hospitalSelect.value = hospitalType;
            if (hospitalOther) {
                hospitalOther.value = hospitalType === 'Others' ? (rec.hospital_name || '') : '';
            }
            syncRowHospitalVisibility(row);
        }

        const setIf = (id, val) => {
            const el = document.getElementById(id);
            if (!el || val === undefined || val === null) return;
            if (el.tagName === 'SELECT' && val) {
                const hasOpt = Array.from(el.options).some(o => o.value === val);
                if (!hasOpt) {
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = val;
                    el.appendChild(opt);
                }
            }
            el.value = val;
        };

        if (key === 'iop') {
            setIf('iop_re_value', data.re_value || '');
            setIf('iop_re_method', data.re_method || 'Applanation');
            setIf('iop_le_value', data.le_value || '');
            setIf('iop_le_method', data.le_method || 'Applanation');
            setIf('iop_notes', data.notes || '');
            window.handleIopChange('re');
            window.handleIopChange('le');
        } else if (key === 'duct') {
            setIf('duct_re_lower', data.re_lower || '');
            setIf('duct_re_upper', data.re_upper || '');
            setIf('duct_le_lower', data.le_lower || '');
            setIf('duct_le_upper', data.le_upper || '');
            setIf('duct_notes', data.notes || '');
        } else if (key === 'blood_sugar') {
            setIf('sugar_test_type', data.test_type || '');
            setIf('sugar_value', data.value || '');
            setIf('sugar_location', data.location || 'Done at Hospital');
            setIf('sugar_last_meal', data.last_meal || '');
            setIf('sugar_diabetic_status', data.diabetic_status || 'Non-Diabetic');
            setIf('sugar_med_status', data.med_status || '');
            window.handleSugarChange();
        } else if (key === 'colour_vision') {
            setIf('cv_re_select', data.re_result || '');
            setIf('cv_re_score', data.re_score || '');
            setIf('cv_le_select', data.le_result || '');
            setIf('cv_le_score', data.le_score || '');
            setIf('cv_method', data.method || 'Ishihara 38 Plates');
            setIf('cv_notes', data.notes || '');
        } else if (key === 'blood_pressure') {
            setIf('bp_systolic', data.systolic || '');
            setIf('bp_diastolic', data.diastolic || '');
            setIf('bp_pulse', data.pulse || '');
            setIf('bp_position', data.position || 'Sitting');
            setIf('bp_notes', data.notes || '');
            window.handleBpChange();
        } else if (key === 'k_reading') {
            setIf('k_re_k1', data.re_k1 || '');
            setIf('k_re_axis1', data.re_axis1 || '');
            setIf('k_re_k2', data.re_k2 || '');
            setIf('k_re_axis2', data.re_axis2 || '');
            setIf('k_le_k1', data.le_k1 || '');
            setIf('k_le_axis1', data.le_axis1 || '');
            setIf('k_le_k2', data.le_k2 || '');
            setIf('k_le_axis2', data.le_axis2 || '');
            setIf('k_device', data.device || 'Bausch & Lomb Manual Keratometer');
            setIf('k_notes', data.notes || '');
            window.calculateKeratometry('re');
            window.calculateKeratometry('le');
        } else {
            const safeKey = canonicalInvKey(rec.name);
            if (rec.is_non_ocular) {
                setIf(`${safeKey}_re`, data.value || data.re_value || '');
            } else {
                setIf(`${safeKey}_re`, data.re_value || '');
                setIf(`${safeKey}_le`, data.le_value || '');
            }
            setIf(`${safeKey}_notes`, data.notes || '');
        }
    }

    window.resetInvestigationState = function () {
        _savedInvestigations = {};
        window._investigationsState.saved_records = [];
        window._investigationsState.global_remarks = '';

        const tableBody = document.getElementById('invTableBody');
        if (tableBody) {
            tableBody.querySelectorAll('tr.inv-row').forEach(r => {
                if (r._removeTimer) {
                    clearTimeout(r._removeTimer);
                    r._removeTimer = null;
                }
            });
            tableBody.innerHTML = '';
        }

        const emrTextarea = document.getElementById('rx_investigation');
        if (emrTextarea) emrTextarea.value = '';
        const invBadge = document.getElementById('investigation_count_badge');
        if (invBadge) {
            invBadge.style.display = 'none';
            invBadge.textContent = '';
        }
        const iopOdEl = document.getElementById('emr_iop_od');
        const iopOsEl = document.getElementById('emr_iop_os');
        if (iopOdEl) iopOdEl.value = '-';
        if (iopOsEl) iopOsEl.value = '-';

        renderEmrInvestigationDisplay([]);
        refreshAuditColumnVisibility();
        updateTotalCountBadge();
    };

    window.restoreInvestigations = function (investigationsList, fallbackNotesText = '') {
        window.resetInvestigationState();
        const tableBody = document.getElementById('invTableBody');
        if (!tableBody) return;

        if (Array.isArray(investigationsList) && investigationsList.length > 0) {
            investigationsList.forEach(item => {
                if (!item || !item.name) return;
                const key = canonicalInvKey(item.key || item.name);
                const fixedCfg = getFixedInvestigationConfig(item.name);
                let row = findRowsByInvestigation(tableBody, item.name, fixedCfg)[0];
                if (!row) {
                    row = window.quickAddInvestigation(item.name, item.eye || (item.is_non_ocular ? 'NA' : 'BE'), { silent: true });
                }
                if (row) {
                    populateRowFromRecord(row, item);
                    const stored = { ...item, key };
                    _savedInvestigations[key] = stored;
                    applySavedRowUI(row, stored);
                }
            });
            refreshAuditColumnVisibility();
            syncSavedRecordsToEMR();
            updateTotalCountBadge();
        } else if (fallbackNotesText && fallbackNotesText.trim()) {
            const emrTextarea = document.getElementById('rx_investigation');
            if (emrTextarea) emrTextarea.value = fallbackNotesText.trim();
            const invBadge = document.getElementById('investigation_count_badge');
            if (invBadge) {
                invBadge.style.display = 'inline-flex';
                invBadge.textContent = 'Recorded';
            }
            renderEmrInvestigationDisplay([], fallbackNotesText.trim());
        }
    };

    // ── Reset & Clear All Prompts ─────────────────────────────────────────────
    window.resetInvestigationsToDefault = function () {
        if (!confirm('Reset investigations to standard template rows?')) return;
        window.resetInvestigationState();
    };

    window.clearAllInvestigationsPrompt = function () {
        if (!confirm('Clear all investigation rows from the table?')) return;
        const tableBody = document.getElementById('invTableBody');
        if (tableBody) {
            tableBody.querySelectorAll('tr.inv-row').forEach(r => {
                if (r._removeTimer) {
                    clearTimeout(r._removeTimer);
                    r._removeTimer = null;
                }
            });
            tableBody.innerHTML = '';
            _savedInvestigations = {};
            refreshAuditColumnVisibility();
            updateTotalCountBadge();
            syncSavedRecordsToEMR();
            showInvToast('All investigation rows cleared.', 'warning');
        }
    };

    // ── Order Re-workup ───────────────────────────────────────────────────────
    window.orderInvestigationReworkup = function () {
        showInvToast('Optometry / Diagnostic Re-workup requested.', 'info');
    };

    // ── Auto-initialize Live Dirty Listeners on DOM Ready ─────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const tableBody = document.getElementById('invTableBody');
        if (tableBody) {
            const handleRowEdit = function (event) {
                const row = event.target && event.target.closest ? event.target.closest('tr.inv-row') : null;
                if (row) {
                    syncRowDirtyState(row);
                    return;
                }
                const drawer = event.target && event.target.closest ? event.target.closest('tr.inv-detail-drawer') : null;
                if (drawer && drawer.previousElementSibling && drawer.previousElementSibling.classList.contains('inv-row')) {
                    syncRowDirtyState(drawer.previousElementSibling);
                }
            };
            tableBody.addEventListener('input', handleRowEdit);
            tableBody.addEventListener('change', handleRowEdit);
        }
        refreshAuditColumnVisibility();
        updateTotalCountBadge();
    });

})();
