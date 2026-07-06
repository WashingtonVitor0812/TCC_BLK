const modal = document.getElementById("modalOverlay");
const openBtn = document.getElementById("openReminderModal");
const form = document.getElementById("reminderForm");
const remindersList = document.getElementById("remindersList");

// Abre modal
function openModal() {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

// Fecha modal
function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
}

openBtn.addEventListener("click", openModal);

// Fecha clicando fora
modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

// Fecha com ESC
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("active")) {
        closeModal();
    }
});

// Submit
form.addEventListener("submit", (event) => {

    event.preventDefault();

    const date = document.getElementById("date").value;
    const appointment = document.getElementById("appointment").value;
    const description = document.getElementById("description").value;
    const dados={data:date,atendimento:appointment,descricao:description}

    if (!date) {
        alert("Selecione uma data.");
        return;
    }
    console.log(date)
    console.log(Date(date))
    const day = new Date(date).getUTCDate();

    // Simulação visual até integrar com Flask
    const reminder = document.createElement("div");

    reminder.classList.add("reminder-item");

    console.log(String(day).padStart(2, '0'))
    reminder.innerHTML = `
        <div class="day-circle">
            ${String(day).padStart(2, '0')}
        </div>

        <div class="reminder-card">
            <h3>${appointment || "Novo Lembrete"}</h3>
            <p>${description || "Sem descrição."}</p>
        </div>
    `;

    remindersList.prepend(reminder);

    /*
    ==========================
    INTEGRAÇÃO FLASK FUTURA
    ==========================*/

    fetch("/pegar_dados", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados) // Converte objeto JS para JSON
            })
            .then(response => response.json())
            .then(retorno => {
                console.log("Resposta do servidor:", retorno);
            })
            .catch(err => console.error("Erro:", err));
        });

    
    form.reset();
    closeModal();