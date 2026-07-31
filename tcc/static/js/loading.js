(function () {
    let requisicoesAtivas = 0;
    let overlay;

    function obterOverlay() {
        if (overlay) return overlay;
        overlay = document.createElement("div");
        overlay.id = "loading-overlay";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML = '<div class="loading-indicator"><span class="loading-spinner"></span><span>Carregando...</span></div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    function iniciarCarregamento() {
        requisicoesAtivas += 1;
        if (document.body) {
            obterOverlay().classList.add("active");
            document.body.classList.add("is-loading");
        }
    }

    function finalizarCarregamento() {
        requisicoesAtivas = Math.max(0, requisicoesAtivas - 1);
        if (requisicoesAtivas === 0 && overlay) {
            overlay.classList.remove("active");
            document.body.classList.remove("is-loading");
        }
    }

    window.iniciarCarregamento = iniciarCarregamento;
    window.finalizarCarregamento = finalizarCarregamento;

    const fetchOriginal = window.fetch.bind(window);
    window.fetch = async function (...args) {
        iniciarCarregamento();
        try {
            return await fetchOriginal(...args);
        } finally {
            finalizarCarregamento();
        }
    };

    document.addEventListener("click", event => {
        const link = event.target.closest("a[href]");
        if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || event.ctrlKey || event.metaKey) return;
        iniciarCarregamento();
    });
}());
