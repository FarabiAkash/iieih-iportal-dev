// =============================================================================
// GONIOSCOPY / SPECIALITY WORKUP MODAL
// IIEI&H Clinical Portal — Ispahani Islamia Eye Institute & Hospital
// Speciality Workup: Comprehensive Angle Examination (Shaffer Classification)
// Matching clinical workflow:
// - Technique (Goldmann / Zeiss / Sussman, Undilated / Dilated)
// - Dual Eye (RE / LE) 4-Quadrant Shaffer Grading (Sup, Inf, Nas, Temp)
// - Most Posterior Structure Seen, Trabecular Pigmentation, Iris Profile, Dynamic
// - Dedicated Gonioscopy Input & Result for RE and LE
// - Overall Clinical Impression / Result & Action Plan
// - EMR Summary Card in Speciality Workup section
// =============================================================================

(function () {
    'use strict';

    // ── Shaffer Grade Definitions ──────────────────────────────────────────────
    const SHAFFER_GRADES = [
        { code: 'IV', label: 'Grade IV (35°-45° Wide Open)', short: 'IV', class: 'grade-iv', desc: 'CBB visible, wide open angle' },
        { code: 'III', label: 'Grade III (20°-35° Open)', short: 'III', class: 'grade-iii', desc: 'Scleral spur visible, open angle' },
        { code: 'II', label: 'Grade II (20° Moderately Narrow)', short: 'II', class: 'grade-ii', desc: 'PTM/ATM visible, narrow angle' },
        { code: 'I', label: 'Grade I (10° Very Narrow)', short: 'I', class: 'grade-i', desc: 'Schwalbe line only, very narrow/occludable' },
        { code: '0', label: 'Grade 0 / Slit (0° Closed)', short: '0', class: 'grade-0', desc: 'Iridocorneal contact, angle closed' }
    ];

    // ── State ──────────────────────────────────────────────────────────────────
    function getInitialEyeState() {
        return {
            sup: '',
            inf: '',
            nas: '',
            temp: '',
            structures: '',
            pigment: '',
            iris: '',
            pas: '',
            nva: '',
            indentation: '',
            result: ''
        };
    }

    let _gonioscopyState = {
        method: 'Goldmann 3-Mirror',
        dilation: 'Undilated',
        lighting: 'Dim Room',
        re: getInitialEyeState(),
        le: getInitialEyeState(),
        overall_result: '',
        plan: '',
        remarks: '',
        hasData: false,
        timestamp: null
    };

    // ── Helper: Escape HTML ────────────────────────────────────────────────────
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ── Timestamp Management ───────────────────────────────────────────────────
    function updateTimestampDisplay() {
        const timeEl = document.getElementById('gonioHeaderTime');
        if (!timeEl) return;
        if (!_gonioscopyState.timestamp) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            timeEl.textContent = `${dateStr} ${timeStr}`;
        } else {
            timeEl.textContent = _gonioscopyState.timestamp;
        }
    }

    // ── Open / Close Modal ─────────────────────────────────────────────────────
    function openGonioscopyModal() {
        const modal = document.getElementById('gonioscopyModal');
        if (!modal) return;

        updateTimestampDisplay();
        syncStateToInputs();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeGonioscopyModal() {
        const modal = document.getElementById('gonioscopyModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // ── Technique Setting ──────────────────────────────────────────────────────
    function setGonioscopyTechnique(type, val) {
        if (type === 'method') {
            _gonioscopyState.method = val;
        } else if (type === 'dilation') {
            _gonioscopyState.dilation = val;
        } else if (type === 'lighting') {
            _gonioscopyState.lighting = val;
        }
        updateTechniquePills();
    }

    function updateTechniquePills() {
        document.querySelectorAll('[data-gonio-tech]').forEach(btn => {
            const type = btn.getAttribute('data-gonio-tech');
            const val = btn.getAttribute('data-val');
            btn.classList.toggle('active', _gonioscopyState[type] === val);
        });
    }

    // ── Quadrant Angle Grade Management ────────────────────────────────────────
    function getGradeBadgeClass(gradeCode) {
        if (!gradeCode) return '';
        const found = SHAFFER_GRADES.find(g => g.code === gradeCode || g.label === gradeCode || g.short === gradeCode);
        return found ? found.class : '';
    }

    function extractGradeCode(val) {
        if (!val) return '';
        if (val.includes('Grade IV') || val.startsWith('IV')) return 'IV';
        if (val.includes('Grade III') || val.startsWith('III')) return 'III';
        if (val.includes('Grade II') || val.startsWith('II')) return 'II';
        if (val.includes('Grade I') || val.startsWith('I')) return 'I';
        if (val.includes('Grade 0') || val.startsWith('0')) return '0';
        return val;
    }

    function setEyeQuadrantGrade(eye, quad, val) {
        if (!_gonioscopyState[eye]) _gonioscopyState[eye] = getInitialEyeState();
        _gonioscopyState[eye][quad] = val;

        const selectEl = document.getElementById(`gonio_${eye}_${quad}`);
        if (selectEl) selectEl.value = val;

        updateQuadrantBadge(eye, quad, val);
        autoSuggestEyeResult(eye);
    }

    function updateQuadrantBadge(eye, quad, val) {
        const badgeEl = document.getElementById(`gonio_badge_${eye}_${quad}`);
        if (!badgeEl) return;

        const code = extractGradeCode(val);
        badgeEl.textContent = code ? `Gr ${code}` : 'Gr -';
        badgeEl.className = 'gonio-quad-badge ' + getGradeBadgeClass(code);
    }

    function setEyeAllQuadrants(eye, gradeCode) {
        const gradeObj = SHAFFER_GRADES.find(g => g.code === gradeCode);
        const gradeVal = gradeObj ? gradeObj.label : gradeCode;

        ['sup', 'inf', 'nas', 'temp'].forEach(q => {
            setEyeQuadrantGrade(eye, q, gradeVal);
        });
    }

    // ── Auto Suggest Gonioscopy Result for Eye ─────────────────────────────────
    function autoSuggestEyeResult(eye) {
        const eyeState = _gonioscopyState[eye];
        if (!eyeState) return;

        const quads = [eyeState.sup, eyeState.inf, eyeState.nas, eyeState.temp].map(extractGradeCode).filter(Boolean);
        if (quads.length < 4) return; // Only suggest once all 4 quadrants are marked

        const resultInput = document.getElementById(`gonio_result_${eye}`);
        if (!resultInput) return;

        // If user already typed a custom result, don't clobber it unless empty or standard
        const currentVal = (resultInput.value || '').trim();
        const isStandard = !currentVal ||
            currentVal.includes('Open Angle') ||
            currentVal.includes('Narrow Angle') ||
            currentVal.includes('Angle Closure') ||
            currentVal.includes('PACS');

        if (!isStandard) return;

        let suggested = '';
        if (quads.every(q => q === 'IV')) {
            suggested = 'Open Angle (Grade IV) - Normal';
        } else if (quads.every(q => q === 'IV' || q === 'III')) {
            suggested = 'Open Angle (Grade III-IV)';
        } else if (quads.some(q => q === '0')) {
            suggested = 'Primary Angle Closure (PAC / Grade 0)';
        } else if (quads.some(q => q === 'I' || q === 'II')) {
            suggested = 'Narrow Angle / Occludable (Grade I-II)';
        } else {
            suggested = 'Open Angle';
        }

        if (suggested && !currentVal) {
            setEyeResult(eye, suggested);
        }
    }

    // ── Eye Result Setter ──────────────────────────────────────────────────────
    function setEyeResult(eye, text) {
        if (!_gonioscopyState[eye]) _gonioscopyState[eye] = getInitialEyeState();
        _gonioscopyState[eye].result = text;

        const input = document.getElementById(`gonio_result_${eye}`);
        if (input) input.value = text;

        // Highlight matching chip
        document.querySelectorAll(`[data-gonio-result-eye="${eye}"]`).forEach(chip => {
            chip.classList.toggle('active', chip.getAttribute('data-val') === text);
        });

        // Update result box styling based on result severity
        const box = document.getElementById(`gonio_result_box_${eye}`);
        if (box) {
            box.classList.remove('is-narrow', 'is-closed');
            const lower = text.toLowerCase();
            if (lower.includes('closed') || lower.includes('closure') || lower.includes('pacg') || lower.includes('pac')) {
                box.classList.add('is-closed');
            } else if (lower.includes('narrow') || lower.includes('occludable') || lower.includes('pacs') || lower.includes('grade i') || lower.includes('grade ii')) {
                box.classList.add('is-narrow');
            }
        }

        autoSuggestOverallSummary();
    }

    // ── Overall Impression & Plan Setter ───────────────────────────────────────
    function setOverallResult(text) {
        _gonioscopyState.overall_result = text;
        const input = document.getElementById('gonio_overall_result');
        if (input) input.value = text;

        document.querySelectorAll('[data-gonio-overall-chip]').forEach(chip => {
            chip.classList.toggle('active', chip.getAttribute('data-val') === text);
        });
    }

    function setOverallPlan(text) {
        _gonioscopyState.plan = text;
        const input = document.getElementById('gonio_overall_plan');
        if (input) input.value = text;

        document.querySelectorAll('[data-gonio-plan-chip]').forEach(chip => {
            chip.classList.toggle('active', chip.getAttribute('data-val') === text);
        });
    }

    function autoSuggestOverallSummary() {
        const reRes = (_gonioscopyState.re?.result || '').toLowerCase();
        const leRes = (_gonioscopyState.le?.result || '').toLowerCase();
        const overallInput = document.getElementById('gonio_overall_result');
        if (!overallInput || overallInput.value.trim()) return;

        if (reRes.includes('normal') && leRes.includes('normal')) {
            setOverallResult('Normal open angles BE (Shaffer Grade IV/III)');
            if (!document.getElementById('gonio_overall_plan')?.value.trim()) {
                setOverallPlan('Routine annual review / Glaucoma screening');
            }
        } else if (reRes.includes('pacs') || leRes.includes('pacs') || reRes.includes('narrow') || leRes.includes('narrow')) {
            setOverallResult('Bilateral Primary Angle Closure Suspect (PACS)');
            if (!document.getElementById('gonio_overall_plan')?.value.trim()) {
                setOverallPlan('Nd:YAG Laser Peripheral Iridotomy (LPI) advised');
            }
        } else if (reRes.includes('closed') || leRes.includes('closed') || reRes.includes('pacg') || leRes.includes('pacg')) {
            setOverallResult('Angle Closure Glaucoma (PACG) / Occludable Angle');
            if (!document.getElementById('gonio_overall_plan')?.value.trim()) {
                setOverallPlan('Urgent Nd:YAG LPI + Medical IOP Management');
            }
        }
    }

    // ── Fast Clinical Presets (One-Click) ──────────────────────────────────────
    function setGonioscopyPreset(preset) {
        if (preset === 'normal_be') {
            ['re', 'le'].forEach(eye => {
                setEyeAllQuadrants(eye, 'IV');
                const structEl = document.getElementById(`gonio_struct_${eye}`);
                if (structEl) structEl.value = 'Ciliary Body Band (CBB) - All visible';
                const pigEl = document.getElementById(`gonio_pigment_${eye}`);
                if (pigEl) pigEl.value = '1+ (Mild / Normal)';
                const irisEl = document.getElementById(`gonio_iris_${eye}`);
                if (irisEl) irisEl.value = 'Flat / Regular';
                const pasEl = document.getElementById(`gonio_pas_${eye}`);
                if (pasEl) pasEl.value = 'None';
                const nvaEl = document.getElementById(`gonio_nva_${eye}`);
                if (nvaEl) nvaEl.value = 'Absent';
                const indEl = document.getElementById(`gonio_indent_${eye}`);
                if (indEl) indEl.value = 'Not tested';
                setEyeResult(eye, 'Open Angle (Grade IV) - Normal');
            });
            setOverallResult('Normal open angles BE (Shaffer Grade IV)');
            setOverallPlan('Routine annual review / No intervention needed');
        } else if (preset === 'grade3_be') {
            ['re', 'le'].forEach(eye => {
                setEyeAllQuadrants(eye, 'III');
                const structEl = document.getElementById(`gonio_struct_${eye}`);
                if (structEl) structEl.value = 'Scleral Spur (SS visible)';
                const pigEl = document.getElementById(`gonio_pigment_${eye}`);
                if (pigEl) pigEl.value = '2+ (Moderate)';
                const irisEl = document.getElementById(`gonio_iris_${eye}`);
                if (irisEl) irisEl.value = 'Flat / Regular';
                setEyeResult(eye, 'Open Angle (Grade III)');
            });
            setOverallResult('Open angles BE (Shaffer Grade III)');
            setOverallPlan('Routine glaucoma follow-up');
        } else if (preset === 'narrow_be') {
            ['re', 'le'].forEach(eye => {
                setEyeQuadrantGrade(eye, 'sup', 'Grade I (10° Very Narrow)');
                setEyeQuadrantGrade(eye, 'inf', 'Grade II (20° Moderately Narrow)');
                setEyeQuadrantGrade(eye, 'nas', 'Grade II (20° Moderately Narrow)');
                setEyeQuadrantGrade(eye, 'temp', 'Grade I (10° Very Narrow)');
                const structEl = document.getElementById(`gonio_struct_${eye}`);
                if (structEl) structEl.value = 'Schwalbe Line only (SL visible)';
                const irisEl = document.getElementById(`gonio_iris_${eye}`);
                if (irisEl) irisEl.value = 'Convex / Steep (Pupillary block)';
                const indEl = document.getElementById(`gonio_indent_${eye}`);
                if (indEl) indEl.value = 'Angle Opens (Appositional closure)';
                setEyeResult(eye, 'Narrow Angle / Occludable (PACS)');
            });
            setOverallResult('Bilateral Primary Angle Closure Suspect (PACS)');
            setOverallPlan('Bilateral Nd:YAG Laser Peripheral Iridotomy (LPI) advised');
        } else if (preset === 'closed_be') {
            ['re', 'le'].forEach(eye => {
                setEyeAllQuadrants(eye, '0');
                const structEl = document.getElementById(`gonio_struct_${eye}`);
                if (structEl) structEl.value = 'None / Root of Iris contact (Closed)';
                const irisEl = document.getElementById(`gonio_iris_${eye}`);
                if (irisEl) irisEl.value = 'Convex / Steep (Pupillary block)';
                const pasEl = document.getElementById(`gonio_pas_${eye}`);
                if (pasEl) pasEl.value = 'Present (Synechial)';
                const indEl = document.getElementById(`gonio_indent_${eye}`);
                if (indEl) indEl.value = 'Angle Remains Closed (Synechial)';
                setEyeResult(eye, 'Closed Angle / PACG');
            });
            setOverallResult('Primary Angle Closure Glaucoma (PACG)');
            setOverallPlan('Urgent Nd:YAG LPI + Intensive Medical IOP Lowering');
        }
    }

    // ── Copy RE <-> LE ─────────────────────────────────────────────────────────
    function copyGonioscopySide(direction) {
        const fromEye = direction === 're_to_le' ? 're' : 'le';
        const toEye   = direction === 're_to_le' ? 'le' : 're';

        // Copy quadrants
        ['sup', 'inf', 'nas', 'temp'].forEach(q => {
            const val = document.getElementById(`gonio_${fromEye}_${q}`)?.value || '';
            setEyeQuadrantGrade(toEye, q, val);
        });

        // Copy secondary inputs
        const structVal = document.getElementById(`gonio_struct_${fromEye}`)?.value || '';
        const pigVal    = document.getElementById(`gonio_pigment_${fromEye}`)?.value || '';
        const irisVal   = document.getElementById(`gonio_iris_${fromEye}`)?.value || '';
        const pasVal    = document.getElementById(`gonio_pas_${fromEye}`)?.value || '';
        const nvaVal    = document.getElementById(`gonio_nva_${fromEye}`)?.value || '';
        const indVal    = document.getElementById(`gonio_indent_${fromEye}`)?.value || '';
        const resVal    = document.getElementById(`gonio_result_${fromEye}`)?.value || '';

        const structTo = document.getElementById(`gonio_struct_${toEye}`);
        if (structTo) structTo.value = structVal;
        const pigTo = document.getElementById(`gonio_pigment_${toEye}`);
        if (pigTo) pigTo.value = pigVal;
        const irisTo = document.getElementById(`gonio_iris_${toEye}`);
        if (irisTo) irisTo.value = irisVal;
        const pasTo = document.getElementById(`gonio_pas_${toEye}`);
        if (pasTo) pasTo.value = pasVal;
        const nvaTo = document.getElementById(`gonio_nva_${toEye}`);
        if (nvaTo) nvaTo.value = nvaVal;
        const indTo = document.getElementById(`gonio_indent_${toEye}`);
        if (indTo) indTo.value = indVal;

        setEyeResult(toEye, resVal);
    }

    // ── Sync State To Inputs ───────────────────────────────────────────────────
    function syncStateToInputs() {
        updateTechniquePills();

        ['re', 'le'].forEach(eye => {
            const eyeState = _gonioscopyState[eye] || {};
            ['sup', 'inf', 'nas', 'temp'].forEach(q => {
                const el = document.getElementById(`gonio_${eye}_${q}`);
                if (el) el.value = eyeState[q] || '';
                updateQuadrantBadge(eye, q, eyeState[q] || '');
            });

            const structEl = document.getElementById(`gonio_struct_${eye}`);
            if (structEl) structEl.value = eyeState.structures || '';

            const pigEl = document.getElementById(`gonio_pigment_${eye}`);
            if (pigEl) pigEl.value = eyeState.pigment || '';

            const irisEl = document.getElementById(`gonio_iris_${eye}`);
            if (irisEl) irisEl.value = eyeState.iris || '';

            const pasEl = document.getElementById(`gonio_pas_${eye}`);
            if (pasEl) pasEl.value = eyeState.pas || '';

            const nvaEl = document.getElementById(`gonio_nva_${eye}`);
            if (nvaEl) nvaEl.value = eyeState.nva || '';

            const indEl = document.getElementById(`gonio_indent_${eye}`);
            if (indEl) indEl.value = eyeState.indentation || '';

            const resEl = document.getElementById(`gonio_result_${eye}`);
            if (resEl) resEl.value = eyeState.result || '';

            // Update box styling
            const box = document.getElementById(`gonio_result_box_${eye}`);
            if (box) {
                box.classList.remove('is-narrow', 'is-closed');
                const lower = (eyeState.result || '').toLowerCase();
                if (lower.includes('closed') || lower.includes('closure') || lower.includes('pacg') || lower.includes('pac')) {
                    box.classList.add('is-closed');
                } else if (lower.includes('narrow') || lower.includes('occludable') || lower.includes('pacs') || lower.includes('grade i') || lower.includes('grade ii')) {
                    box.classList.add('is-narrow');
                }
            }

            // Sync result chip highlights
            document.querySelectorAll(`[data-gonio-result-eye="${eye}"]`).forEach(chip => {
                chip.classList.toggle('active', chip.getAttribute('data-val') === eyeState.result);
            });
        });

        const overallEl = document.getElementById('gonio_overall_result');
        if (overallEl) overallEl.value = _gonioscopyState.overall_result || '';

        const planEl = document.getElementById('gonio_overall_plan');
        if (planEl) planEl.value = _gonioscopyState.plan || '';

        const remEl = document.getElementById('gonio_remarks');
        if (remEl) remEl.value = _gonioscopyState.remarks || '';
    }

    // ── Save Gonioscopy Modal Findings ─────────────────────────────────────────
    function saveGonioscopyModal() {
        let hasAnyValue = false;

        ['re', 'le'].forEach(eye => {
            if (!_gonioscopyState[eye]) _gonioscopyState[eye] = getInitialEyeState();

            ['sup', 'inf', 'nas', 'temp'].forEach(q => {
                const val = (document.getElementById(`gonio_${eye}_${q}`)?.value || '').trim();
                _gonioscopyState[eye][q] = val;
                if (val) hasAnyValue = true;
            });

            _gonioscopyState[eye].structures = (document.getElementById(`gonio_struct_${eye}`)?.value || '').trim();
            _gonioscopyState[eye].pigment    = (document.getElementById(`gonio_pigment_${eye}`)?.value || '').trim();
            _gonioscopyState[eye].iris       = (document.getElementById(`gonio_iris_${eye}`)?.value || '').trim();
            _gonioscopyState[eye].pas        = (document.getElementById(`gonio_pas_${eye}`)?.value || '').trim();
            _gonioscopyState[eye].nva        = (document.getElementById(`gonio_nva_${eye}`)?.value || '').trim();
            _gonioscopyState[eye].indentation= (document.getElementById(`gonio_indent_${eye}`)?.value || '').trim();
            _gonioscopyState[eye].result     = (document.getElementById(`gonio_result_${eye}`)?.value || '').trim();

            if (_gonioscopyState[eye].result) hasAnyValue = true;
            if (_gonioscopyState[eye].structures) hasAnyValue = true;
        });

        _gonioscopyState.overall_result = (document.getElementById('gonio_overall_result')?.value || '').trim();
        _gonioscopyState.plan           = (document.getElementById('gonio_overall_plan')?.value || '').trim();
        _gonioscopyState.remarks        = (document.getElementById('gonio_remarks')?.value || '').trim();

        if (_gonioscopyState.overall_result || _gonioscopyState.plan || _gonioscopyState.remarks) {
            hasAnyValue = true;
        }

        _gonioscopyState.hasData = hasAnyValue;

        const now = new Date();
        _gonioscopyState.timestamp = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

        // Build formatted string for hidden rx_speciality
        const serialized = buildSerializedNotesString();
        const specialityHidden = document.getElementById('rx_speciality');
        if (specialityHidden) {
            specialityHidden.value = serialized;
        }

        // Render inline EMR left-column view
        renderGonioscopyEmrDisplay(_gonioscopyState);

        closeGonioscopyModal();

        if (typeof window.showRxFeedback === 'function') {
            window.showRxFeedback('Gonioscopy / Speciality workup saved successfully.', 'success');
        }
    }

    // ── Build Formatted String for EMR Prescription Notes ─────────────────────
    function buildSerializedNotesString() {
        if (!_gonioscopyState.hasData) return '';

        const parts = ['Gonioscopy'];

        if (_gonioscopyState.method) parts.push(`Method: ${_gonioscopyState.method} (${_gonioscopyState.dilation || 'Undilated'})`);

        ['re', 'le'].forEach(eye => {
            const eState = _gonioscopyState[eye];
            const eyeLabel = eye.toUpperCase();
            const eyeParts = [];

            if (eState.result) eyeParts.push(`Result: ${eState.result}`);

            const quads = [];
            if (eState.sup) quads.push(`Sup: ${extractGradeCode(eState.sup)}`);
            if (eState.inf) quads.push(`Inf: ${extractGradeCode(eState.inf)}`);
            if (eState.nas) quads.push(`Nas: ${extractGradeCode(eState.nas)}`);
            if (eState.temp) quads.push(`Temp: ${extractGradeCode(eState.temp)}`);
            if (quads.length > 0) eyeParts.push(`Shaffer: [${quads.join(', ')}]`);

            if (eState.structures) eyeParts.push(`Struct: ${eState.structures}`);
            if (eState.pigment) eyeParts.push(`Pigment: ${eState.pigment}`);
            if (eState.iris) eyeParts.push(`Iris: ${eState.iris}`);
            if (eState.pas && eState.pas !== 'None') eyeParts.push(`PAS: ${eState.pas}`);
            if (eState.nva && eState.nva !== 'Absent') eyeParts.push(`NVA: ${eState.nva}`);
            if (eState.indentation && eState.indentation !== 'Not tested') eyeParts.push(`Dynamic: ${eState.indentation}`);

            if (eyeParts.length > 0) {
                parts.push(`${eyeLabel} [${eyeParts.join(' | ')}]`);
            }
        });

        if (_gonioscopyState.overall_result) parts.push(`Impression: ${_gonioscopyState.overall_result}`);
        if (_gonioscopyState.plan) parts.push(`Plan: ${_gonioscopyState.plan}`);
        if (_gonioscopyState.remarks) parts.push(`Remarks: ${_gonioscopyState.remarks}`);

        return parts.join(' | ');
    }

    // ── Render Inline EMR Display (Left Column Card) ───────────────────────────
    function renderGonioscopyEmrDisplay(state) {
        const container = document.getElementById('emr_speciality_display');
        if (!container) return;

        if (!state || !state.hasData) {
            container.innerHTML = `
                <div class="emr-empty-complaints-hint">
                    <i class="fa-solid fa-compass"></i>
                    <span>Click to record Gonioscopy (Angle evaluation)...</span>
                </div>`;
            return;
        }

        const reState = state.re || {};
        const leState = state.le || {};

        // Determine badge status
        const ovResult = (state.overall_result || reState.result || leState.result || '').toLowerCase();
        let badgeClass = 'is-normal';
        let badgeText  = 'Open Angle BE';

        if (ovResult.includes('closed') || ovResult.includes('closure') || ovResult.includes('pacg') || ovResult.includes('pac')) {
            badgeClass = 'is-closed';
            badgeText  = 'Angle Closure';
        } else if (ovResult.includes('narrow') || ovResult.includes('occludable') || ovResult.includes('pacs')) {
            badgeClass = 'is-narrow';
            badgeText  = 'Narrow / PACS';
        } else if (ovResult) {
            badgeText = state.overall_result || 'Recorded';
        }

        function formatEyeSummary(e) {
            const lines = [];
            if (e.result) {
                const resLow = e.result.toLowerCase();
                const resClass = resLow.includes('closed') || resLow.includes('pacg') ? 'is-closed' : (resLow.includes('narrow') || resLow.includes('pacs') ? 'is-narrow' : '');
                lines.push(`<div class="gonio-emr-line"><span class="gonio-emr-label">Result:</span> <span class="gonio-emr-val gonio-emr-result-tag ${resClass}">${escapeHtml(e.result)}</span></div>`);
            }

            const quads = [];
            if (e.sup) quads.push(`S:${extractGradeCode(e.sup)}`);
            if (e.inf) quads.push(`I:${extractGradeCode(e.inf)}`);
            if (e.nas) quads.push(`N:${extractGradeCode(e.nas)}`);
            if (e.temp) quads.push(`T:${extractGradeCode(e.temp)}`);
            if (quads.length > 0) {
                lines.push(`<div class="gonio-emr-line"><span class="gonio-emr-label">Shaffer:</span> <span class="gonio-emr-val">${escapeHtml(quads.join(' '))}</span></div>`);
            }

            if (e.structures) {
                lines.push(`<div class="gonio-emr-line"><span class="gonio-emr-label">Struct:</span> <span class="gonio-emr-val">${escapeHtml(e.structures)}</span></div>`);
            }
            if (e.pigment) {
                lines.push(`<div class="gonio-emr-line"><span class="gonio-emr-label">Pigment:</span> <span class="gonio-emr-val">${escapeHtml(e.pigment)}</span></div>`);
            }
            if (e.iris && !e.iris.includes('Flat')) {
                lines.push(`<div class="gonio-emr-line"><span class="gonio-emr-label">Iris:</span> <span class="gonio-emr-val">${escapeHtml(e.iris)}</span></div>`);
            }
            if (e.pas && e.pas !== 'None') {
                lines.push(`<div class="gonio-emr-line"><span class="gonio-emr-label">PAS:</span> <span class="gonio-emr-val" style="color:#b91c1c;">${escapeHtml(e.pas)}</span></div>`);
            }

            return lines.length > 0 ? lines.join('') : '<div class="gonio-emr-line" style="color:#94a3b8;">Not evaluated</div>';
        }

        let html = `
            <div class="gonio-emr-summary-wrap" onclick="openGonioscopyModal()" title="Click to view or edit Gonioscopy findings">
                <div class="gonio-emr-header">
                    <div>
                        <i class="fa-solid fa-compass" style="color:#0284c7; margin-right:4px;"></i>
                        <span>Gonioscopy (Angle Exam)</span>
                    </div>
                    <span class="gonio-emr-badge ${badgeClass}">${escapeHtml(badgeText)}</span>
                </div>
                <div class="gonio-emr-grid">
                    <div class="gonio-emr-eye-col">
                        <div class="gonio-emr-eye-title">
                            <span>RE (OD)</span>
                        </div>
                        ${formatEyeSummary(reState)}
                    </div>
                    <div class="gonio-emr-eye-col">
                        <div class="gonio-emr-eye-title">
                            <span>LE (OS)</span>
                        </div>
                        ${formatEyeSummary(leState)}
                    </div>
                </div>
                ${state.plan ? `
                    <div class="gonio-emr-plan-line">
                        <i class="fa-solid fa-lightbulb"></i>
                        <span>Plan: ${escapeHtml(state.plan)}</span>
                    </div>
                ` : ''}
                ${state.remarks ? `
                    <div class="gonio-emr-line" style="font-size:0.7rem; font-style:italic; color:#64748b;">
                        <span>Notes: ${escapeHtml(state.remarks)}</span>
                    </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = html;
    }

    // ── Restore State From Saved Notes Text ────────────────────────────────────
    function restoreGonioscopyFromText(text) {
        if (!text) return;
        resetGonioscopyState();

        // Check Method
        const methodMatch = text.match(/Method:\s*([^|(]+)/i);
        if (methodMatch) _gonioscopyState.method = methodMatch[1].trim();

        // Check Dilation
        if (text.toLowerCase().includes('dilated') && !text.toLowerCase().includes('undilated')) {
            _gonioscopyState.dilation = 'Dilated';
        } else {
            _gonioscopyState.dilation = 'Undilated';
        }

        // Helper to parse eye block
        function parseEyeBlock(eye, eyeRegex) {
            const match = text.match(eyeRegex);
            if (!match) return;

            const block = match[1];
            const eState = _gonioscopyState[eye];

            // Result
            const resMatch = block.match(/Result:\s*([^|]+)/i);
            if (resMatch) eState.result = resMatch[1].trim();

            // Shaffer quads
            const shafferMatch = block.match(/Shaffer:\s*\[(.*?)\]/i);
            if (shafferMatch) {
                const parts = shafferMatch[1].split(',');
                parts.forEach(p => {
                    const idx = p.indexOf(':');
                    if (idx > -1) {
                        const qName = p.substring(0, idx).trim().toLowerCase();
                        const qCode = p.substring(idx + 1).trim();
                        const foundGrade = SHAFFER_GRADES.find(g => g.code === qCode || g.short === qCode);
                        const val = foundGrade ? foundGrade.label : qCode;
                        if (qName.includes('sup')) eState.sup = val;
                        else if (qName.includes('inf')) eState.inf = val;
                        else if (qName.includes('nas')) eState.nas = val;
                        else if (qName.includes('temp')) eState.temp = val;
                    }
                });
            }

            // Structures
            const stMatch = block.match(/Struct:\s*([^|]+)/i);
            if (stMatch) eState.structures = stMatch[1].trim();

            // Pigment
            const pigMatch = block.match(/Pigment:\s*([^|]+)/i);
            if (pigMatch) eState.pigment = pigMatch[1].trim();

            // Iris
            const irMatch = block.match(/Iris:\s*([^|]+)/i);
            if (irMatch) eState.iris = irMatch[1].trim();

            // PAS
            const pasMatch = block.match(/PAS:\s*([^|]+)/i);
            if (pasMatch) eState.pas = pasMatch[1].trim();

            // Dynamic
            const dynMatch = block.match(/Dynamic:\s*([^|]+)/i);
            if (dynMatch) eState.indentation = dynMatch[1].trim();
        }

        parseEyeBlock('re', /RE\s*\[(.*?)\]/);
        parseEyeBlock('le', /LE\s*\[(.*?)\]/);

        // Overall Impression
        const impMatch = text.match(/Impression:\s*([^|]+)/i);
        if (impMatch) _gonioscopyState.overall_result = impMatch[1].trim();

        // Plan
        const planMatch = text.match(/Plan:\s*([^|]+)/i);
        if (planMatch) _gonioscopyState.plan = planMatch[1].trim();

        // Remarks
        const remMatch = text.match(/Remarks:\s*(.*)$/i);
        if (remMatch) _gonioscopyState.remarks = remMatch[1].trim();

        _gonioscopyState.hasData = true;
        syncStateToInputs();
        renderGonioscopyEmrDisplay(_gonioscopyState);
    }

    // ── Reset State ────────────────────────────────────────────────────────────
    function resetGonioscopyState() {
        _gonioscopyState = {
            method: 'Goldmann 3-Mirror',
            dilation: 'Undilated',
            lighting: 'Dim Room',
            re: getInitialEyeState(),
            le: getInitialEyeState(),
            overall_result: '',
            plan: '',
            remarks: '',
            hasData: false,
            timestamp: null
        };

        syncStateToInputs();

        const display = document.getElementById('emr_speciality_display');
        if (display) {
            display.innerHTML = `
                <div class="emr-empty-complaints-hint">
                    <i class="fa-solid fa-compass"></i>
                    <span>Click to record Gonioscopy (Angle evaluation)...</span>
                </div>`;
        }

        const hidden = document.getElementById('rx_speciality');
        if (hidden) hidden.value = '';
    }

    // ── Backdrop & Keyboard Event Listeners ────────────────────────────────────
    document.addEventListener('click', function (e) {
        const modal = document.getElementById('gonioscopyModal');
        if (modal && e.target === modal) {
            closeGonioscopyModal();
        }
    });

    document.addEventListener('keydown', function (e) {
        const modal = document.getElementById('gonioscopyModal');
        if (!modal || modal.style.display === 'none') return;

        if (e.key === 'Escape') {
            closeGonioscopyModal();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            saveGonioscopyModal();
        }
    });

    // ── Global Exports ─────────────────────────────────────────────────────────
    window.openGonioscopyModal          = openGonioscopyModal;
    window.closeGonioscopyModal         = closeGonioscopyModal;
    window.saveGonioscopyModal          = saveGonioscopyModal;
    window.resetGonioscopyState         = resetGonioscopyState;
    window.restoreGonioscopyFromText    = restoreGonioscopyFromText;
    window.setGonioscopyPreset          = setGonioscopyPreset;
    window.setEyeQuadrantGrade          = setEyeQuadrantGrade;
    window.setEyeAllQuadrants           = setEyeAllQuadrants;
    window.setEyeResult                 = setEyeResult;
    window.setOverallResult             = setOverallResult;
    window.setOverallPlan               = setOverallPlan;
    window.copyGonioscopySide           = copyGonioscopySide;
    window.setGonioscopyTechnique       = setGonioscopyTechnique;
    // Alias for speciality workup
    window.openSpecialityWorkupModal    = openGonioscopyModal;

})();
