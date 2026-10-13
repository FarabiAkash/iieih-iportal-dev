// ─── Pre-render theme check to prevent flash of unstyled content ───────────
(function () {
    try {
        const savedTheme = localStorage.getItem('iieih_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    } catch (e) { }
})();
