// ─── Pre-render theme check to prevent flash of unstyled content ───────────
(function () {
    try {
        const savedTheme = localStorage.getItem('iieih_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    } catch (e) { }
})();

// ─── Universal Theme Controller ─────────────────────────────────────────────
function setAppTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem('iieih_theme', theme);
    } catch (e) { }

    document.querySelectorAll('.theme-btn, .theme-switch-btn').forEach(btn => {
        const isMatch = btn.getAttribute('data-theme-val') === theme;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });
}
window.setAppTheme = setAppTheme;
window.applyLoginTheme = setAppTheme;

// Auto-sync button states once DOM is available
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        setAppTheme(currentTheme);
    });
} else {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setAppTheme(currentTheme);
}
