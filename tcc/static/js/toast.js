(function () {
    let ultimaMensagem = "";
    let ultimoToastEm = 0;

    function removerToast(toast) {
        if (!toast || toast.classList.contains("toast-out")) return;
        toast.classList.add("toast-out");
        toast.addEventListener("animationend", event => {
            if (event.target === toast && event.animationName === "toast-out") {
                toast.remove();
            }
        });
    }

    function mostrarToast(mensagem, categoria) {
        if (!mensagem) return;
        const agora = Date.now();
        if (mensagem === ultimaMensagem && agora - ultimoToastEm < 750) return;
        ultimaMensagem = mensagem;
        ultimoToastEm = agora;
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `toast-card ${categoria === "error" ? "error" : ""}`;
        toast.innerHTML = `<span>${categoria === "error" ? "⚠" : "✓"}</span><span class="toast-card__message"></span><button class="toast-card__close" type="button" aria-label="Fechar">&times;</button>`;
        toast.querySelector(".toast-card__message").textContent = mensagem;
        toast.querySelector("button").addEventListener("click", () => removerToast(toast));
        container.appendChild(toast);
        window.setTimeout(() => removerToast(toast), 5500);
    }

    window.mostrarToast = mostrarToast;
    window.alert = mensagem => mostrarToast(mensagem, "error");

    document.addEventListener("click", event => {
        if (event.target.closest(".toast-card__close")) {
            removerToast(event.target.closest(".toast-card"));
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll(".toast-card").forEach(toast => {
            window.setTimeout(() => removerToast(toast), 5500);
        });
    });

    const fetchOriginal = window.fetch.bind(window);
    window.fetch = async function (...args) {
        const response = await fetchOriginal(...args);
        const tipo = response.headers.get("content-type") || "";
        if (tipo.includes("application/json")) {
            response.clone().json().then(dados => {
                if (dados && dados._toast) mostrarToast(dados._toast.message, dados._toast.category);
            }).catch(() => {});
        }
        return response;
    };
}());
