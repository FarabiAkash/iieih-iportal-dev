// =============================================================================
// PROCEDURE ADVICE / ADVICE / PLAN POPUP MODALS — Shared Logic
// Hospital EMR Standard — Ispahani Islamia Eye Institute & Hospital
// Three independent popup modals:
//   1. Procedure Advice  → opens via openProcedureAdviceModal()
//   2. Advice            → opens via openAdviceModal()
//   3. Plan              → opens via openPlanModal()
// Each: search bar, favorites pills, custom entry, summary side panel
// =============================================================================

(function () {
    'use strict';

    // ── Per-Modal Catalog Databases ───────────────────────────────────────────

    const CATALOGS = {
        procedure: [
            'YAG Capsulotomy',
            'YAG Iridotomy',
            'SLT (Selective Laser Trabeculoplasty)',
            'Laser Peripheral Iridoplasty',
            'Pan-Retinal Photocoagulation (PRP)',
            'Focal/Grid Laser Photocoagulation',
            'Fundus Fluorescein Angiography (FFA)',
            'Indocyanine Green Angiography (ICGA)',
            'OCT Macula',
            'OCT Optic Disc',
            'OCT Angiography (OCTA)',
            'B-Scan Ultrasonography',
            'UBM (Ultrasound Biomicroscopy)',
            'Corneal Topography (Pentacam)',
            'Corneal Topography (Orbscan)',
            'Specular Microscopy',
            'Pachymetry (Central Corneal Thickness)',
            'Optical Biometry (IOL Master)',
            'Electrophysiology (ERG/VEP)',
            'Visual Field Test (Humphrey / Goldmann)',
            'Gonioscopy',
            'Schirmer Tear Test',
            'Intravitreal Anti-VEGF Injection',
            'Intravitreal Steroid Injection',
            'Intravitreal Gas Injection (C3F8/SF6)',
            'Orbital / Ocular Ultrasound',
            'Anterior Segment OCT',
            'Suture Removal',
            'Lid Hygiene Procedure',
            'Punctal Plug Insertion',
            'Nasolacrimal Duct (NLD) Probing',
            'Incision & Drainage (Chalazion)',
            'Epilation of Trichiatic Lashes',
            'Corneal Foreign Body Removal',
            'Sub-conjunctival Injection',
            'Corneal Collagen Cross-Linking (CXL)',
            'Rigid Gas Permeable (RGP) Contact Lens Fitting',
        ],
        advice: [
            'Avoid rubbing the eye',
            'Wear protective glasses outdoors',
            'No swimming for 4 weeks',
            'Maintain good hand hygiene before instilling eye drops',
            'Avoid dusty or smoky environments',
            'Control blood sugar and blood pressure',
            'Use artificial tears for dry eye relief',
            'Take medications as prescribed',
            'Avoid heavy lifting for 2 weeks post-surgery',
            'Sleep with head slightly elevated',
            'Avoid driving until vision stabilizes',
            'Return immediately if sudden vision loss or severe pain',
            'Avoid pressing or touching the operated eye',
            'Complete full course of prescribed antibiotics',
            'Do not miss follow-up appointments',
            'Wash hands before and after handling eye medications',
            'Avoid alcohol while on systemic medications',
            'Maintain a healthy diet rich in antioxidants',
            'Take frequent breaks from screen use (20-20-20 rule)',
            'Use prescribed spectacles regularly',
            'Never self-medicate with steroid eye drops',
            'Protect eye from bright sunlight with UV-blocking glasses',
            'Report any sudden increase in floaters or flashes immediately',
            'Avoid bending head below waist for 2 weeks post-surgery',
        ],
        plan: [
            'Continue current medications',
            'Scheduled for cataract surgery',
            'Admit for surgical work-up',
            'Pre-operative evaluation',
            'Repeat visual field test in 3 months',
            'IOP monitoring – 1 month',
            'IOP monitoring – 3 months',
            'Refer to glaucoma clinic',
            'Refer to retina specialist',
            'Refer to cornea specialist',
            'Refer to oculoplastics specialist',
            'Refer to neuro-ophthalmologist',
            'HbA1c & BP check before surgery',
            'Biometry (IOL Master) pending',
            'Corneal topography planned',
            'Routine follow-up only',
            'Adjust glaucoma medication dose',
            'Start anti-VEGF injection therapy',
            'Monitor for surgical planning (3 months)',
            'Admit for LSCS / vitreoretinal surgery',
            'Orthoptic / vision therapy referral',
            'Refractive surgery counselling (LASIK/PRK)',
            'Low vision rehabilitation referral',
            'Conservative management – observe',
            'Urgent systemic workup (neurology/cardiology)',
        ],
    };

    // ── State per Modal ───────────────────────────────────────────────────────
    const _state = {
        procedure: { items: [], dropdownIndex: -1 },
        advice:    { items: [], dropdownIndex: -1 },
        plan:      { items: [], dropdownIndex: -1 },
    };

    // ── Config per Modal ──────────────────────────────────────────────────────
    const _config = {
        procedure: {
            overlayId:    'procedureAdviceModal',
            searchId:     'procAdvSearchInput',
            clearBtnId:   'procAdvSearchClear',
            dropdownId:   'procAdvDropdown',
            summaryId:    'procAdvSummaryBody',
            badgeId:      'procAdvCountBadge',
            clearAllId:   'procAdvClearAll',
            footerId:     'procAdvFooterCount',
            customInputId:'procAdvCustomInput',
            hiddenId:     'rx_procedure_advice',
            itemNoun:     'procedure advice',
        },
        advice: {
            overlayId:    'adviceModal',
            searchId:     'adviceSearchInput',
            clearBtnId:   'adviceSearchClear',
            dropdownId:   'adviceDropdown',
            summaryId:    'adviceSummaryBody',
            badgeId:      'adviceCountBadge',
            clearAllId:   'adviceClearAll',
            footerId:     'adviceFooterCount',
            customInputId:'adviceCustomInput',
            hiddenId:     'rx_advice',
            itemNoun:     'advice',
        },
        plan: {
            overlayId:    'planModal',
            searchId:     'planSearchInput',
            clearBtnId:   'planSearchClear',
            dropdownId:   'planDropdown',
            summaryId:    'planSummaryBody',
            badgeId:      'planCountBadge',
            clearAllId:   'planClearAll',
            footerId:     'planFooterCount',
            customInputId:'planCustomInput',
            hiddenId:     'rx_plan',
            itemNoun:     'plan item',
        },
    };

    // ── Open / Close ──────────────────────────────────────────────────────────

    function openModal(type) {
        const cfg = _config[type];
        const overlay = document.getElementById(cfg.overlayId);
        if (!overlay) return;

        // Load from hidden textarea if present
        const hiddenEl = document.getElementById(cfg.hiddenId);
        if (hiddenEl && hiddenEl.value.trim()) {
            const existing = hiddenEl.value
                .split('\n')
                .map(s => s.replace(/^[•\-\*]\s*/, '').trim())
                .filter(Boolean);
            _state[type].items = [...new Set(existing)];
        } else {
            // Keep current state if re-opening without hidden element changes
        }

        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        renderSummary(type);
        syncFavPills(type);

        // Focus search
        const si = document.getElementById(cfg.searchId);
        if (si) setTimeout(() => { si.focus(); }, 60);
    }

    function closeModal(type) {
        const cfg = _config[type];
        const overlay = document.getElementById(cfg.overlayId);
        if (overlay) overlay.style.display = 'none';

        // Check if any other adv modal is open
        const anyOpen = Object.values(_config).some(c => {
            const el = document.getElementById(c.overlayId);
            return el && el.style.display !== 'none';
        });
        if (!anyOpen) document.body.style.overflow = '';

        hideDropdown(type);

        // Clear search field
        const si = document.getElementById(cfg.searchId);
        if (si) si.value = '';
        const cb = document.getElementById(cfg.clearBtnId);
        if (cb) cb.style.display = 'none';
    }

    function saveModal(type) {
        const cfg = _config[type];
        const hiddenEl = document.getElementById(cfg.hiddenId);
        if (hiddenEl) {
            hiddenEl.value = _state[type].items.map(i => `• ${i}`).join('\n');
        }

        // Update badge on the emr-adv-row button (the small header + badge)
        updateAdvRowBadge(type, _state[type].items.length);

        closeModal(type);
    }

    // Update the badge / open badge on the main EMR page row header
    function updateAdvRowBadge(type, count) {
        // Try to find associated badge element in emr advice rows
        const badgeMap = {
            procedure: 'proc_advice_badge',
            advice:    'adv_advice_badge',
            plan:      'plan_advice_badge',
        };
        const badgeEl = document.getElementById(badgeMap[type]);
        if (badgeEl) {
            if (count > 0) {
                badgeEl.style.display = 'inline-flex';
                badgeEl.textContent = `${count} item${count !== 1 ? 's' : ''}`;
            } else {
                badgeEl.style.display = 'none';
            }
        }
    }

    // ── Search Logic ──────────────────────────────────────────────────────────

    function onAdvSearchInput(type) {
        const cfg = _config[type];
        const si = document.getElementById(cfg.searchId);
        const cb = document.getElementById(cfg.clearBtnId);
        const q = (si?.value || '').trim().toLowerCase();

        if (cb) cb.style.display = q ? 'flex' : 'none';

        if (!q) {
            hideDropdown(type);
            return;
        }

        const catalog = CATALOGS[type] || [];
        const filtered = catalog.filter(item =>
            item.toLowerCase().includes(q) && !_state[type].items.includes(item)
        ).slice(0, 12);

        renderDropdown(type, filtered, q);
    }

    function openAdvDropdown(type) {
        const cfg = _config[type];
        const si = document.getElementById(cfg.searchId);
        const q = (si?.value || '').trim().toLowerCase();
        if (!q) return;
        onAdvSearchInput(type);
    }

    function renderDropdown(type, filtered, q) {
        const cfg = _config[type];
        const dd = document.getElementById(cfg.dropdownId);
        if (!dd) return;
        _state[type].dropdownIndex = -1;

        if (filtered.length === 0) {
            dd.innerHTML = `<div class="adv-dropdown-empty">No matches found</div>`;
            dd.style.display = 'flex';
            return;
        }

        dd.innerHTML = filtered.map((item, i) => {
            const esc = escHtml(item);
            const highlighted = esc.replace(
                new RegExp(escHtml(q).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi'),
                match => `<strong>${match}</strong>`
            );
            return `<div class="adv-dropdown-item" role="option"
                        onclick="window._advSelectFromDropdown('${type}', ${i})"
                        data-idx="${i}">
                        <i class="fa-regular fa-circle-dot"></i>
                        <span>${highlighted}</span>
                    </div>`;
        }).join('');
        dd.style.display = 'flex';

        // Store filtered list for keyboard nav
        _state[type]._filteredDropdown = filtered;
    }

    function hideDropdown(type) {
        const cfg = _config[type];
        const dd = document.getElementById(cfg.dropdownId);
        if (dd) dd.style.display = 'none';
        _state[type].dropdownIndex = -1;
        _state[type]._filteredDropdown = [];
    }

    function onAdvSearchKeydown(event, type) {
        const dd = document.getElementById(_config[type].dropdownId);
        const items = dd ? dd.querySelectorAll('.adv-dropdown-item') : [];
        const count = items.length;
        let idx = _state[type].dropdownIndex;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            idx = (idx + 1) % count;
            _state[type].dropdownIndex = idx;
            highlightDropdownItem(type, idx, items);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            idx = (idx - 1 + count) % count;
            _state[type].dropdownIndex = idx;
            highlightDropdownItem(type, idx, items);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (idx >= 0 && _state[type]._filteredDropdown?.[idx]) {
                addAdvItem(type, _state[type]._filteredDropdown[idx]);
                clearSearch(type);
            } else {
                // Add raw typed text
                const si = document.getElementById(_config[type].searchId);
                const raw = (si?.value || '').trim();
                if (raw) { addAdvItem(type, raw); clearSearch(type); }
            }
        } else if (event.key === 'Escape') {
            hideDropdown(type);
        }
    }

    function highlightDropdownItem(type, idx, items) {
        items.forEach((el, i) => {
            el.classList.toggle('active', i === idx);
        });
    }

    function clearSearch(type) {
        const cfg = _config[type];
        const si = document.getElementById(cfg.searchId);
        const cb = document.getElementById(cfg.clearBtnId);
        if (si) si.value = '';
        if (cb) cb.style.display = 'none';
        hideDropdown(type);
    }

    // ── Item Management ───────────────────────────────────────────────────────

    function addAdvItem(type, text) {
        const item = text.trim();
        if (!item || _state[type].items.includes(item)) return;
        _state[type].items.push(item);
        renderSummary(type);
        syncFavPills(type);
    }

    function removeAdvItem(type, idx) {
        _state[type].items.splice(idx, 1);
        renderSummary(type);
        syncFavPills(type);
    }

    function clearAllAdvItems(type) {
        _state[type].items = [];
        renderSummary(type);
        syncFavPills(type);
    }

    function addAdvCustomItem(type) {
        const cfg = _config[type];
        const inp = document.getElementById(cfg.customInputId);
        const val = (inp?.value || '').trim();
        if (!val) { inp?.focus(); return; }
        addAdvItem(type, val);
        if (inp) inp.value = '';
        inp?.focus();
    }

    function selectAdvFav(type, text) {
        if (_state[type].items.includes(text)) {
            // De-select if already added
            const idx = _state[type].items.indexOf(text);
            if (idx > -1) removeAdvItem(type, idx);
        } else {
            addAdvItem(type, text);
        }
    }

    function selectFromDropdown(type, filteredIdx) {
        const item = _state[type]._filteredDropdown?.[filteredIdx];
        if (item) {
            addAdvItem(type, item);
            clearSearch(type);
        }
    }

    // ── Render Summary Panel ──────────────────────────────────────────────────

    function renderSummary(type) {
        const cfg = _config[type];
        const body = document.getElementById(cfg.summaryId);
        const badge = document.getElementById(cfg.badgeId);
        const clearAllBtn = document.getElementById(cfg.clearAllId);
        const footerCount = document.getElementById(cfg.footerId);
        const count = _state[type].items.length;

        if (badge) badge.textContent = count;
        if (clearAllBtn) clearAllBtn.style.display = count > 0 ? 'inline-block' : 'none';
        if (footerCount) {
            footerCount.textContent = count === 0
                ? `0 ${cfg.itemNoun}s recorded`
                : `${count} ${cfg.itemNoun}${count !== 1 ? 's' : ''} recorded`;
        }

        if (!body) return;

        if (count === 0) {
            body.innerHTML = `
                <div class="adv-empty-state">
                    <div class="adv-empty-icon"><i class="fa-regular fa-clipboard"></i></div>
                    <p class="adv-empty-title">No items added</p>
                    <p class="adv-empty-desc">Select a favorite or search above to add ${cfg.itemNoun}.</p>
                </div>`;
            return;
        }

        body.innerHTML = _state[type].items.map((item, i) => `
            <div class="adv-summary-item">
                <span class="adv-item-bullet">${i + 1}</span>
                <span class="adv-item-text">${escHtml(item)}</span>
                <button type="button" class="adv-item-remove"
                        onclick="window._advRemoveItem('${type}', ${i})"
                        title="Remove">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>`).join('');
    }

    // ── Sync Favorite Pill Active State ──────────────────────────────────────

    function syncFavPills(type) {
        const pillGroupId = { procedure: 'procAdvFavPills', advice: 'adviceFavPills', plan: 'planFavPills' }[type];
        const group = document.getElementById(pillGroupId);
        if (!group) return;
        group.querySelectorAll('.adv-fav-pill').forEach(pill => {
            const txt = pill.textContent.trim();
            // Check if any item in state starts with or equals pill label
            const matched = _state[type].items.some(item =>
                item === txt || item.toLowerCase() === txt.toLowerCase()
            );
            // Also check using onclick value
            const onclickAttr = pill.getAttribute('onclick') || '';
            const match2 = _state[type].items.some(item => onclickAttr.includes(escHtml(item)));
            pill.classList.toggle('active', matched || match2);
        });
    }

    // ── Keyboard / Click Outside Listeners ───────────────────────────────────

    function bindGlobalEvents() {
        document.addEventListener('click', function (e) {
            ['procedure', 'advice', 'plan'].forEach(type => {
                const cfg = _config[type];
                const wrap = document.getElementById(cfg.overlayId)?.querySelector('.adv-search-wrap');
                if (wrap && !wrap.contains(e.target)) {
                    hideDropdown(type);
                }
                // Close modal on overlay backdrop click
                const overlay = document.getElementById(cfg.overlayId);
                if (overlay && e.target === overlay) {
                    closeModal(type);
                }
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                ['procedure', 'advice', 'plan'].forEach(type => {
                    const overlay = document.getElementById(_config[type].overlayId);
                    if (overlay && overlay.style.display === 'flex') {
                        closeModal(type);
                    }
                });
            }
        });
    }

    // ── Helper: HTML Escape ───────────────────────────────────────────────────

    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    function init() {
        bindGlobalEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ── Expose Globally ───────────────────────────────────────────────────────

    // Open / close / save per modal
    window.openProcedureAdviceModal  = () => openModal('procedure');
    window.closeProcedureAdviceModal = () => closeModal('procedure');
    window.saveProcedureAdviceModal  = () => saveModal('procedure');

    window.openAdviceModal  = () => openModal('advice');
    window.closeAdviceModal = () => closeModal('advice');
    window.saveAdviceModal  = () => saveModal('advice');

    window.openPlanModal  = () => openModal('plan');
    window.closePlanModal = () => closeModal('plan');
    window.savePlanModal  = () => saveModal('plan');

    // Shared helpers called from inline HTML
    window.onAdvSearchInput   = onAdvSearchInput;
    window.onAdvSearchKeydown = onAdvSearchKeydown;
    window.openAdvDropdown    = openAdvDropdown;
    window.clearAdvSearch     = clearSearch;
    window.selectAdvFav       = selectAdvFav;
    window.addAdvCustomItem   = addAdvCustomItem;
    window.clearAllAdvItems   = clearAllAdvItems;

    // Internal bridge called from dynamically rendered HTML
    window._advSelectFromDropdown = selectFromDropdown;
    window._advRemoveItem         = removeAdvItem;

})();
