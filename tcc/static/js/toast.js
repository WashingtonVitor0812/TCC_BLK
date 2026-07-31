(function () {
    let ultimaMensagem = "";
    let ultimoToastEm = 0;

    function removerToast(toast) {
        if (!toast || toast.classList.contains("toast-out")) return;
        window.clearTimeout(toast._timer);
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
        const toastExistente = [...document.querySelectorAll(".toast-card")].find(toast =>
            toast.querySelector(".toast-card__message")?.textContent === mensagem &&
            !toast.classList.contains("toast-out")
        );
        if (toastExistente) {
            window.clearTimeout(toastExistente._timer);
            toastExistente.classList.remove("toast-out");
            toastExistente.classList.remove("toast-reiniciado");
            toastExistente.classList.add("toast-timer-pausado");
            void toastExistente.offsetWidth;
            toastExistente.classList.remove("toast-timer-pausado");
            toastExistente.classList.add("toast-reiniciado");
            toastExistente._timer = window.setTimeout(() => removerToast(toastExistente), 5500);
            return;
        }
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
        toast._timer = window.setTimeout(() => removerToast(toast), 5500);
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
            toast._timer = window.setTimeout(() => removerToast(toast), 5500);
        });

        document.addEventListener("input", event => {
            const campo = event.target;
            if (!(campo instanceof HTMLInputElement || campo instanceof HTMLTextAreaElement)) return;
            const limite = Number(campo.maxLength);
            if (limite > 0 && campo.value.length >= limite) {
                mostrarToast("Limite máximo de caracteres atingido!", "error");
            }
        });

        document.addEventListener("keydown", event => {
            const campo = event.target;
            if (!(campo instanceof HTMLInputElement || campo instanceof HTMLTextAreaElement)) return;
            const limite = Number(campo.maxLength);
            const teclaDeTexto = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
            if (limite > 0 && teclaDeTexto && campo.value.length >= limite && campo.selectionStart === campo.selectionEnd) {
                mostrarToast("Limite máximo de caracteres atingido!", "error");
            }
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
