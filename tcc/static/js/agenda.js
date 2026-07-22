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

const meses = [

"Janeiro",
"Fevereiro",
"Março",
"Abril",
"Maio",
"Junho",
"Julho",
"Agosto",
"Setembro",
"Outubro",
"Novembro",
"Dezembro"

];

let dataAtual = new Date();

let mesAtual = dataAtual.getMonth();

let anoAtual = dataAtual.getFullYear();

function criarCalendario(){

    monthYear.innerHTML =
        meses[mesAtual] + " " + anoAtual;

    const tbody =
        document.getElementById("calendarBody");

    tbody.innerHTML="";

    const primeiroDia =
        new Date(anoAtual,mesAtual,1).getDay();

    const ultimoDia =
        new Date(anoAtual,mesAtual+1,0).getUTCDate();

    let linha=document.createElement("tr");

    for(let i=0;i<primeiroDia;i++){

        linha.appendChild(document.createElement("td"));

    }

    for(let dia=1;dia<=ultimoDia;dia++){

        if(linha.children.length===7){

            tbody.appendChild(linha);

            linha=document.createElement("tr");

        }

        const td=document.createElement("td");

        td.innerHTML=dia;

        const hoje=new Date();

        if(

            dia===hoje.getUTCDate()

            &&

            mesAtual===hoje.getMonth()

            &&

            anoAtual===hoje.getFullYear()

        ){

            td.classList.add("today");

        }

        const possuiEvento = lembretes.some(item=>{

            const d=new Date(item.data);

            return(

                d.getUTCDate()===dia
                &&

                d.getUTCMonth()===mesAtual

                &&

                d.getFullYear()===anoAtual

            );

        });

        if(possuiEvento){

            td.classList.add("event");

        }

        linha.appendChild(td);

    }

    while(linha.children.length<7){

        linha.appendChild(document.createElement("td"));

    }

    tbody.appendChild(linha);

}

function carregarLembretes(){

    remindersList.innerHTML = "";

    const lembretesDoMes = lembretes
        .filter(item => {

            const data = new Date(item.data);

            return (
                data.getUTCMonth() === mesAtual &&
                data.getUTCFullYear() === anoAtual
            );

        })
        .sort((a,b) => new Date(a.data) - new Date(b.data));

    lembretesDoMes.forEach(item => {

        const data = new Date(item.data);

        const reminder = document.createElement("div");

        reminder.classList.add("reminder-item");

        reminder.innerHTML = `
            <div class="day-circle">
                ${String(data.getUTCDate()).padStart(2,"0")}
            </div>

            <div class="reminder-card">
                <h3>${item.titulo}</h3>
                <p>${item.descricao ?? ""}</p>
            </div>
        `;

        remindersList.appendChild(reminder);

    });

}

prevMonth.onclick=()=>{

    mesAtual--;

    if(mesAtual<0){

        mesAtual=11;

        anoAtual--;

    }

    criarCalendario();
    carregarLembretes();

};



nextMonth.onclick=()=>{

    mesAtual++;

    if(mesAtual>11){

        mesAtual=0;

        anoAtual++;

    }

    criarCalendario();
    carregarLembretes();

};

criarCalendario();
carregarLembretes();

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

    
    form.reset();
    closeModal()})

