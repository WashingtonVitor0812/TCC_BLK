document.addEventListener("DOMContentLoaded", () => {
    const senha = document.getElementById("senha");
    const botao = document.querySelector(".eye-btn");

    if (!senha || !botao) return;

    const icone = botao.querySelector("i");

    botao.addEventListener("click", () => {
        const visivel = senha.type === "text";
        senha.type = visivel ? "password" : "text";
        botao.setAttribute("aria-pressed", String(!visivel));
        botao.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
        icone.classList.toggle("fa-eye", visivel);
        icone.classList.toggle("fa-eye-slash", !visivel);
        senha.focus({ preventScroll: true });
    });
});
