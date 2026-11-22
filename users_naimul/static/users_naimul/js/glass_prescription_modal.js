// =============================================================================
// GLASS PRESCRIPTION POPUP MODAL — glass_prescription_modal.js
// Hospital EMR — Ispahani Islamia Eye Institute & Hospital
// Handles open / close / save / clear / summary / data-sync for the
// Glass Prescription popup that hangs off the Advice section.
// =============================================================================

(function () {
    'use strict';

    // ── State ──────────────────────────────────────────────────────────────────
    /**
     * _gpState: persists between open/close cycles so data survives modal close.
     * Each key is a field name; value is the user-entered string.
     *
     * Fields per eye (OD = right, OS = left):
     *   od_sph, od_cyl, od_axis, od_add, od_prism  (Right Eye)
     *   os_sph, os_cyl, os_axis, os_add, os_prism  (Left Eye)
     *
     * Near-Add (extra panel, only visible for Bifocal / Progressive / Reading):
     *   od_near_add, os_near_add
     *
     * Purpose tags: array of active strings from gp-purpose-pill buttons
     * Remarks: free text
     * Active prescription type tab: 'distance' | 'near' | 'bifocal' | 'progressive'
     */
    let _gpState = {
        activeTab: 'distance',
        purposes: [],
        remarks: '',
        od_sph: '', od_cyl: '', od_axis: '', od_add: '', od_prism: '',
        os_sph: '', os_cyl: '', os_axis: '', os_add: '', os_prism: '',
        od_near_add: '', os_near_add: '',
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    function $id(id) { return document.getElementById(id); }

    function getInput(id) {
        const el = $id(id);
        return el ? el.value.trim() : '';
    }

    function setInput(id, val) {
        const el = $id(id);
        if (el) el.value = val || '';
    }

    // ── Open / Close ───────────────────────────────────────────────────────────
    function openGlassPrescriptionModal() {
        const overlay = $id('glassPrescriptionModal');
        if (!overlay) return;
        // Restore persisted state into inputs
        _restoreStateToUI();
        overlay.style.display = 'flex';
        // Auto-focus first input
        setTimeout(() => {
            const first = overlay.querySelector('.gp-cell-input');
            if (first) first.focus();
        }, 80);
        _renderSummary();
    }

    function closeGlassPrescriptionModal() {
        // Persist current UI → state before closing
        _saveUIToState();
        const overlay = $id('glassPrescriptionModal');
        if (overlay) overlay.style.display = 'none';
    }

    // ── Tab switching ──────────────────────────────────────────────────────────
    function switchGPTab(tab) {
        _gpState.activeTab = tab;
        // Update tab UI
        document.querySelectorAll('.gp-type-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        // Show/hide Near Add panel
        const nearPanel = $id('gpNearAddPanel');
        if (nearPanel) {
            nearPanel.style.display = (tab === 'near' || tab === 'bifocal' || tab === 'progressive')
                ? 'block' : 'none';
        }
        _renderSummary();
    }

    // ── Purpose pills ──────────────────────────────────────────────────────────
    function toggleGPPurpose(val, btn) {
        if (!btn) return;
        const idx = _gpState.purposes.indexOf(val);
        if (idx === -1) {
            _gpState.purposes.push(val);
            btn.classList.add('active');
        } else {
            _gpState.purposes.splice(idx, 1);
            btn.classList.remove('active');
        }
    }

    // ── Live summary render ────────────────────────────────────────────────────
    function _renderSummary() {
        const bodyEl = $id('gpSummaryBody');
        if (!bodyEl) return;

        _saveUIToState(); // snapshot current inputs

        const { od_sph, od_cyl, od_axis, od_add, od_prism,
                os_sph, os_cyl, os_axis, os_add, os_prism,
                od_near_add, os_near_add, activeTab, purposes } = _gpState;

        const hasOD = od_sph || od_cyl || od_axis || od_add || od_prism;
        const hasOS = os_sph || os_cyl || os_axis || os_add || os_prism;
        const hasNear = od_near_add || os_near_add;

        if (!hasOD && !hasOS && !hasNear) {
            bodyEl.innerHTML = '<div class="gp-summary-empty">Enter refraction values above to see summary.</div>';
            return;
        }

        const lines = [];

        if (hasOD) {
            lines.push(_buildSummaryLine('OD (R)', od_sph, od_cyl, od_axis, od_add, od_prism));
        }
        if (hasOS) {
            lines.push(_buildSummaryLine('OS (L)', os_sph, os_cyl, os_axis, os_add, os_prism));
        }
        if ((activeTab === 'bifocal' || activeTab === 'progressive') && hasNear) {
            const nearParts = [];
            if (od_near_add) nearParts.push(`OD Add: ${od_near_add}`);
            if (os_near_add) nearParts.push(`OS Add: ${os_near_add}`);
            lines.push(`<div class="gp-summary-line"><span class="gp-summary-eye">Near Add</span><span class="gp-summary-vals">${nearParts.join(' | ')}</span></div>`);
        }

        const typeLabel = {
            distance: 'Distance',
            near: 'Near / Reading',
            bifocal: 'Bifocal',
            progressive: 'Progressive',
        }[activeTab] || activeTab;

        const purposeStr = purposes.length ? ` — ${purposes.join(', ')}` : '';
        const header = `<div style="font-size:0.72rem;color:#1d4ed8;font-weight:700;margin-bottom:6px;">
                            <i class="fa-solid fa-glasses"></i>&nbsp;${typeLabel}${purposeStr}
                        </div>`;

        bodyEl.innerHTML = header + lines.join('');
    }

    function _buildSummaryLine(eye, sph, cyl, axis, add, prism) {
        const parts = [];
        if (sph)   parts.push(`Sph: ${sph}`);
        if (cyl)   parts.push(`Cyl: ${cyl}`);
        if (axis)  parts.push(`Ax: ${axis}°`);
        if (add)   parts.push(`Add: ${add}`);
        if (prism) parts.push(`Prism: ${prism}`);
        const valStr = parts.length ? parts.join('  ') : '—';
        return `<div class="gp-summary-line">
                    <span class="gp-summary-eye">${eye}</span>
                    <span class="gp-summary-vals">${valStr}</span>
                </div>`;
    }

    // ── Persist UI → state ─────────────────────────────────────────────────────
    function _saveUIToState() {
        _gpState.od_sph    = getInput('gp_od_sph');
        _gpState.od_cyl    = getInput('gp_od_cyl');
        _gpState.od_axis   = getInput('gp_od_axis');
        _gpState.od_add    = getInput('gp_od_add');
        _gpState.od_prism  = getInput('gp_od_prism');
        _gpState.os_sph    = getInput('gp_os_sph');
        _gpState.os_cyl    = getInput('gp_os_cyl');
        _gpState.os_axis   = getInput('gp_os_axis');
        _gpState.os_add    = getInput('gp_os_add');
        _gpState.os_prism  = getInput('gp_os_prism');
        _gpState.od_near_add = getInput('gp_od_near_add');
        _gpState.os_near_add = getInput('gp_os_near_add');
        _gpState.remarks   = getInput('gp_remarks');
    }

    // ── Restore state → UI ─────────────────────────────────────────────────────
    function _restoreStateToUI() {
        setInput('gp_od_sph',    _gpState.od_sph);
        setInput('gp_od_cyl',    _gpState.od_cyl);
        setInput('gp_od_axis',   _gpState.od_axis);
        setInput('gp_od_add',    _gpState.od_add);
        setInput('gp_od_prism',  _gpState.od_prism);
        setInput('gp_os_sph',    _gpState.os_sph);
        setInput('gp_os_cyl',    _gpState.os_cyl);
        setInput('gp_os_axis',   _gpState.os_axis);
        setInput('gp_os_add',    _gpState.os_add);
        setInput('gp_os_prism',  _gpState.os_prism);
        setInput('gp_od_near_add', _gpState.od_near_add);
        setInput('gp_os_near_add', _gpState.os_near_add);
        setInput('gp_remarks',   _gpState.remarks);

        // Restore tab
        switchGPTab(_gpState.activeTab);

        // Restore purpose pills
        document.querySelectorAll('.gp-purpose-pill').forEach(btn => {
            const val = btn.dataset.val || '';
            btn.classList.toggle('active', _gpState.purposes.includes(val));
        });
    }

    // ── Clear all fields ───────────────────────────────────────────────────────
    function clearGlassPrescriptionModal() {
        _gpState = {
            activeTab: _gpState.activeTab,
            purposes: [],
            remarks: '',
            od_sph: '', od_cyl: '', od_axis: '', od_add: '', od_prism: '',
            os_sph: '', os_cyl: '', os_axis: '', os_add: '', os_prism: '',
            od_near_add: '', os_near_add: '',
        };
        _restoreStateToUI();
        _renderSummary();
    }

    // ── Save & apply to EMR workspace ─────────────────────────────────────────
    function saveGlassPrescriptionModal() {
        _saveUIToState();

        const { od_sph, od_cyl, od_axis, od_add, od_prism,
                os_sph, os_cyl, os_axis, os_add, os_prism,
                od_near_add, os_near_add,
                activeTab, purposes, remarks } = _gpState;

        // Build human-readable string parts
        const odParts = [];
        if (od_sph)   odParts.push(`Sph ${od_sph}`);
        if (od_cyl)   odParts.push(`Cyl ${od_cyl}`);
        if (od_axis)  odParts.push(`Ax ${od_axis}°`);
        if (od_add)   odParts.push(`Add ${od_add}`);
        if (od_prism) odParts.push(`Prism ${od_prism}`);

        const osParts = [];
        if (os_sph)   osParts.push(`Sph ${os_sph}`);
        if (os_cyl)   osParts.push(`Cyl ${os_cyl}`);
        if (os_axis)  osParts.push(`Ax ${os_axis}°`);
        if (os_add)   osParts.push(`Add ${os_add}`);
        if (os_prism) osParts.push(`Prism ${os_prism}`);

        const odStr = odParts.length ? odParts.join(', ') : '-';
        const osStr = osParts.length ? osParts.join(', ') : '-';

        // Construct legacy-compatible string for the advice card inputs
        // Pattern: "Glass: OD [<vals>] | OS [<vals>]"
        let glassStr = `OD [${odStr}] | OS [${osStr}]`;

        // Append near add if applicable
        const nearTabActive = (activeTab === 'bifocal' || activeTab === 'progressive' || activeTab === 'near');
        if (nearTabActive && (od_near_add || os_near_add)) {
            const nearParts = [];
            if (od_near_add) nearParts.push(`OD Add ${od_near_add}`);
            if (os_near_add) nearParts.push(`OS Add ${os_near_add}`);
            glassStr += ` | Near Add: ${nearParts.join(', ')}`;
        }

        // Append prescription type
        const typeLabel = {
            distance: 'Distance',
            near: 'Near',
            bifocal: 'Bifocal',
            progressive: 'Progressive',
        }[activeTab] || activeTab;
        glassStr += ` (${typeLabel}`;
        if (purposes.length) glassStr += ` — ${purposes.join(', ')}`;
        glassStr += ')';

        if (remarks) glassStr += ` | Remarks: ${remarks}`;

        // ── Write into the two advice inputs in the EMR workspace ──
        // Legacy inputs (simple text, still used by save logic)
        const legacyOD = $id('rx_glass_od');
        const legacyOS = $id('rx_glass_os');
        if (legacyOD) legacyOD.value = odStr !== '-' ? odStr : '';
        if (legacyOS) legacyOS.value = osStr !== '-' ? osStr : '';

        // ── Open the advice section if collapsed ──
        const advContent = $id('adv_content_glass');
        if (advContent && advContent.style.display === 'none') {
            advContent.style.display = 'block';
        }

        // ── Update the display badge in the advice header ──
        _updateAdviceBadge(glassStr, odParts.length > 0 || osParts.length > 0);

        // Close the popup
        closeGlassPrescriptionModal();
    }

    // ── Update the small badge / preview text in the Advice header ────────────
    function _updateAdviceBadge(text, hasPrescription) {
        // The badge <span> lives inside .emr-adv-header of adv_sec_glass
        let badge = $id('gp_advice_badge');
        if (!badge) return;
        if (hasPrescription) {
            badge.textContent = '✓ Filled';
            badge.style.display = 'inline-flex';
        } else {
            badge.textContent = '';
            badge.style.display = 'none';
        }
    }

    // ── Reset state (called when workspace resets for new patient) ────────────
    function resetGlassPrescriptionState() {
        _gpState = {
            activeTab: 'distance',
            purposes: [],
            remarks: '',
            od_sph: '', od_cyl: '', od_axis: '', od_add: '', od_prism: '',
            os_sph: '', os_cyl: '', os_axis: '', os_add: '', os_prism: '',
            od_near_add: '', os_near_add: '',
        };
        // Also clear legacy inputs
        setInput('rx_glass_od', '');
        setInput('rx_glass_os', '');
        // Reset badge
        const badge = $id('gp_advice_badge');
        if (badge) { badge.textContent = ''; badge.style.display = 'none'; }
    }

    // ── Restore from saved prescription (called when loading rx from API) ─────
    function restoreGlassPrescriptionFromText(odText, osText) {
        // Legacy two-field restore (backward-compatible)
        if (odText) {
            _gpState.od_sph  = _extractField(odText, 'Sph');
            _gpState.od_cyl  = _extractField(odText, 'Cyl');
            _gpState.od_axis = _extractField(odText, 'Ax');
            _gpState.od_add  = _extractField(odText, 'Add');
            _gpState.od_prism = _extractField(odText, 'Prism');
        }
        if (osText) {
            _gpState.os_sph  = _extractField(osText, 'Sph');
            _gpState.os_cyl  = _extractField(osText, 'Cyl');
            _gpState.os_axis = _extractField(osText, 'Ax');
            _gpState.os_add  = _extractField(osText, 'Add');
            _gpState.os_prism = _extractField(osText, 'Prism');
        }
        const hasData = odText || osText;
        _updateAdviceBadge('', Boolean(hasData));
    }

    function _extractField(text, field) {
        // Match "Sph -1.50" or "Sph: -1.50" patterns
        const re = new RegExp(field + '[:\\s]+([+-]?[\\d.]+)', 'i');
        const m = text.match(re);
        return m ? m[1] : '';
    }

    // ── Event wiring (DOMContentLoaded) ───────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const overlay = $id('glassPrescriptionModal');
        if (!overlay) return;

        // Close on backdrop click
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeGlassPrescriptionModal();
        });

        // Live summary on any input change inside modal
        overlay.addEventListener('input', function () {
            _renderSummary();
        });

        // ESC to close (glass modal first, then others in chain)
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (overlay.style.display === 'flex') {
                e.stopPropagation();
                closeGlassPrescriptionModal();
            }
        }, true);
    });

    // ── Expose to global scope ─────────────────────────────────────────────────
    window.openGlassPrescriptionModal     = openGlassPrescriptionModal;
    window.closeGlassPrescriptionModal    = closeGlassPrescriptionModal;
    window.saveGlassPrescriptionModal     = saveGlassPrescriptionModal;
    window.clearGlassPrescriptionModal    = clearGlassPrescriptionModal;
    window.switchGPTab                    = switchGPTab;
    window.toggleGPPurpose                = toggleGPPurpose;
    window.resetGlassPrescriptionState    = resetGlassPrescriptionState;
    window.restoreGlassPrescriptionFromText = restoreGlassPrescriptionFromText;
})();
