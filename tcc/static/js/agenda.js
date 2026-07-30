// ============================================================
// ELEMENTOS DA PÁGINA
// ============================================================

const modal = document.getElementById("modalOverlay");

const openBtn = document.getElementById(
    "openReminderModal"
);

const form = document.getElementById(
    "reminderForm"
);

const remindersList = document.getElementById(
    "remindersList"
);

const tooltip = document.getElementById(
    "dayTooltip"
);

const monthYear = document.getElementById(
    "monthYear"
);

const prevMonth = document.getElementById(
    "prevMonth"
);

const nextMonth = document.getElementById(
    "nextMonth"
);

const dateInput = document.getElementById(
    "date"
);

const appointmentInput = document.getElementById(
    "appointment"
);

const descriptionInput = document.getElementById(
    "description"
);

const saveButton = document.querySelector(
    ".save-btn"
);

const modalTitle = document.querySelector(
    ".modal h2"
);

const appointmentSearchButton =
    document.querySelector(".icon-btn");


// ============================================================
// ESTADO
// ============================================================

let lembreteEditando = null;

let atendimentoSelecionado = null;

let atendimentos = [];


// ============================================================
// MODAL
// ============================================================

function openModal() {

    modal.classList.add("active");

    document.body.style.overflow = "hidden";
}


function closeModal() {

    modal.classList.remove("active");

    document.body.style.overflow = "auto";

    fecharSelecaoAtendimento();
}


// ============================================================
// NOVO LEMBRETE
// ============================================================

openBtn.addEventListener("click", () => {

    lembreteEditando = null;

    atendimentoSelecionado = null;

    form.reset();

    modalTitle.textContent =
        "CRIAR LEMBRETE";

    saveButton.textContent =
        "Criar";

    atualizarCampoAtendimento();

    esconderBotaoExcluir();

    openModal();

});


// ============================================================
// FECHAR MODAL CLICANDO FORA
// ============================================================

modal.addEventListener("click", (event) => {

    if (event.target === modal) {

        closeModal();

    }

});


// ============================================================
// ESC
// ============================================================

document.addEventListener("keydown", (event) => {

    if (
        event.key === "Escape" &&
        modal.classList.contains("active")
    ) {

        closeModal();

    }

});


// ============================================================
// MESES
// ============================================================

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


// ============================================================
// DATA ATUAL DO CALENDÁRIO
// ============================================================

let dataAtual = new Date();

let mesAtual =
    dataAtual.getMonth();

let anoAtual =
    dataAtual.getFullYear();


// ============================================================
// CALENDÁRIO
// ============================================================

function criarCalendario() {

    monthYear.textContent =
        `${meses[mesAtual]} ${anoAtual}`;

    const tbody =
        document.getElementById(
            "calendarBody"
        );

    tbody.innerHTML = "";

    const primeiroDia =
        new Date(
            anoAtual,
            mesAtual,
            1
        ).getDay();

    const ultimoDia =
        new Date(
            anoAtual,
            mesAtual + 1,
            0
        ).getDate();

    let linha =
        document.createElement("tr");


    // Espaços antes do primeiro dia

    for (
        let i = 0;
        i < primeiroDia;
        i++
    ) {

        linha.appendChild(
            document.createElement("td")
        );

    }


    // Dias do mês

    for (
        let dia = 1;
        dia <= ultimoDia;
        dia++
    ) {

        if (
            linha.children.length === 7
        ) {

            tbody.appendChild(linha);

            linha =
                document.createElement("tr");

        }

        const td =
            document.createElement("td");

        td.textContent = dia;


        // ----------------------------
        // DIA ATUAL
        // ----------------------------

        const hoje = new Date();

        if (

            dia === hoje.getDate()

            &&

            mesAtual === hoje.getMonth()

            &&

            anoAtual === hoje.getFullYear()

        ) {

            td.classList.add("today");

        }


        // ----------------------------
        // EXISTE LEMBRETE?
        // ----------------------------

        const possuiEvento =
            lembretes.some(item => {

                const data =
                    new Date(
                        `${item.data}T00:00:00Z`
                    );

                return (

                    data.getUTCDate() === dia

                    &&

                    data.getUTCMonth() ===
                        mesAtual

                    &&

                    data.getUTCFullYear() ===
                        anoAtual

                );

            });


        if (possuiEvento) {

            td.classList.add("event");


            td.addEventListener(
                "mouseenter",
                () => {

                    mostrarTooltip(
                        td,
                        dia
                    );

                }
            );


            td.addEventListener(
                "mouseleave",
                () => {

                    setTimeout(() => {

                        if (
                            !tooltip.matches(":hover")
                        ) {

                            esconderTooltip();

                        }

                    }, 100);

                }
            );

        }

        linha.appendChild(td);

    }


    // Completa a última semana

    while (
        linha.children.length < 7
    ) {

        linha.appendChild(
            document.createElement("td")
        );

    }

    tbody.appendChild(linha);

}


// ============================================================
// LISTA DE LEMBRETES
// ============================================================

function carregarLembretes() {

    remindersList.innerHTML = "";

    const lembretesDoMes =
        lembretes

            .filter(item => {

                const data =
                    new Date(
                        `${item.data}T00:00:00Z`
                    );

                return (

                    data.getUTCMonth() ===
                        mesAtual

                    &&

                    data.getUTCFullYear() ===
                        anoAtual

                );

            })

            .sort((a, b) => {

                return (
                    new Date(
                        `${a.data}T00:00:00Z`
                    )
                    -
                    new Date(
                        `${b.data}T00:00:00Z`
                    )
                );

            });


    lembretesDoMes.forEach(item => {

        const data =
            new Date(
                `${item.data}T00:00:00Z`
            );

        const reminder =
            document.createElement("div");

        reminder.classList.add(
            "reminder-item"
        );


        reminder.innerHTML = `

            <div class="day-circle">
                ${String(
                    data.getUTCDate()
                ).padStart(2, "0")}
            </div>

            <div class="reminder-card">

                <h3>
                    ${escaparHTML(
                        item.atendimento ||
                        "Atendimento não informado"
                    )}
                </h3>

                <p>
                    ${escaparHTML(
                        item.descricao || ""
                    )}
                </p>

            </div>

        `;

        remindersList.appendChild(
            reminder
        );

    });

}


// ============================================================
// TOOLTIP
// ============================================================

function mostrarTooltip(td, dia) {

    const lembretesDia =
        lembretes.filter(item => {

            const data =
                new Date(
                    `${item.data}T00:00:00Z`
                );

            return (

                data.getUTCDate() === dia

                &&

                data.getUTCMonth() ===
                    mesAtual

                &&

                data.getUTCFullYear() ===
                    anoAtual

            );

        });


    if (
        lembretesDia.length === 0
    ) {

        return;

    }


    tooltip.innerHTML = "";


    lembretesDia.forEach(item => {

        const div =
            document.createElement("div");

        div.className =
            "tooltip-item";


        div.innerHTML = `

            <div class="tooltip-circle"></div>

            <span>
                ${escaparHTML(
                    item.atendimento ||
                    "Atendimento não informado"
                )}
            </span>

        `;


        div.addEventListener(
            "click",
            () => {

                abrirEdicao(item);

            }
        );


        tooltip.appendChild(div);

    });


    const rect =
        td.getBoundingClientRect();

    tooltip.classList.remove(
        "hidden"
    );


    tooltip.style.left =
        (
            window.scrollX
            +
            rect.left
            +
            rect.width / 2
            -
            tooltip.offsetWidth / 2
        ) + "px";


    tooltip.style.top =
        (
            window.scrollY
            +
            rect.top
            -
            tooltip.offsetHeight
            -
            8
        ) + "px";

}


function esconderTooltip() {

    tooltip.classList.add(
        "hidden"
    );

}


tooltip.addEventListener(
    "mouseleave",
    esconderTooltip
);


// ============================================================
// MUDAR MÊS
// ============================================================

prevMonth.addEventListener(
    "click",
    () => {

        mesAtual--;

        if (mesAtual < 0) {

            mesAtual = 11;

            anoAtual--;

        }

        criarCalendario();

        carregarLembretes();

    }
);


nextMonth.addEventListener(
    "click",
    () => {

        mesAtual++;

        if (mesAtual > 11) {

            mesAtual = 0;

            anoAtual++;

        }

        criarCalendario();

        carregarLembretes();

    }
);


// ============================================================
// BUSCAR ATENDIMENTOS
// ============================================================

async function carregarAtendimentos() {

    try {

        const response =
            await fetch(
                "/api/atendimentos"
            );


        if (!response.ok) {

            throw new Error(
                "Não foi possível carregar os atendimentos."
            );

        }


        atendimentos =
            await response.json();

    }

    catch (erro) {

        console.error(
            erro
        );

    }

}


// ============================================================
// INTERFACE DE SELEÇÃO DE ATENDIMENTO
// ============================================================

let listaAtendimentosElement = null;


function criarListaAtendimentos() {

    if (
        listaAtendimentosElement
    ) {

        return;

    }


    listaAtendimentosElement =
        document.createElement("div");

    listaAtendimentosElement.id =
        "listaAtendimentos";


    appointmentInput.parentElement
        .appendChild(
            listaAtendimentosElement
        );

}


function mostrarSelecaoAtendimento() {

    criarListaAtendimentos();

    listaAtendimentosElement.innerHTML =
        "";


    if (
        atendimentos.length === 0
    ) {

        listaAtendimentosElement.innerHTML = `

            <div>
                Nenhum atendimento cadastrado.
            </div>

        `;

        return;

    }


    atendimentos.forEach(
        atendimento => {

            const item =
                document.createElement("button");

            item.type = "button";


            item.textContent =
                atendimento.titulo;


            item.addEventListener(
                "click",
                () => {

                    selecionarAtendimento(
                        atendimento
                    );

                }
            );


            listaAtendimentosElement
                .appendChild(item);

        }
    );

}


function selecionarAtendimento(
    atendimento
) {

    atendimentoSelecionado =
        atendimento;


    appointmentInput.value =
        atendimento.titulo;


    appointmentInput.dataset.id =
        atendimento.id;


    fecharSelecaoAtendimento();

}


function fecharSelecaoAtendimento() {

    if (
        listaAtendimentosElement
    ) {

        listaAtendimentosElement.remove();

        listaAtendimentosElement =
            null;

    }

}


function atualizarCampoAtendimento() {

    if (
        atendimentoSelecionado
    ) {

        appointmentInput.value =
            atendimentoSelecionado.titulo;

        appointmentInput.dataset.id =
            atendimentoSelecionado.id;

    }

    else {

        appointmentInput.value = "";

        delete appointmentInput.dataset.id;

    }

}


// ============================================================
// BOTÃO DE BUSCA
// ============================================================

if (
    appointmentSearchButton
) {

    appointmentSearchButton.addEventListener(
        "click",
        async () => {

            if (
                atendimentos.length === 0
            ) {

                await carregarAtendimentos();

            }

            mostrarSelecaoAtendimento();

        }
    );

}


// ============================================================
// IMPEDIR DIGITAÇÃO MANUAL DO ATENDIMENTO
// ============================================================

appointmentInput.readOnly = true;


// ============================================================
// SALVAR LEMBRETE
// ============================================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const date =
            dateInput.value;

        const description =
            descriptionInput.value;


        if (!date) {

            alert(
                "Selecione uma data."
            );

            return;

        }


        if (
            !atendimentoSelecionado
        ) {

            alert(
                "Selecione um atendimento."
            );

            return;

        }


        const dados = {

            data: date,

            id_atendimento:
                atendimentoSelecionado.id,

            descricao: description

        };


        try {

            let response;


            // ==================================================
            // EDITAR
            // ==================================================

            if (lembreteEditando) {

                response =
                    await fetch(
                        "/editar_lembrete",
                        {

                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    id:
                                        lembreteEditando.id,

                                    data:
                                        date,

                                    id_atendimento:
                                        atendimentoSelecionado.id,

                                    descricao:
                                        description

                                })

                        }
                    );

            }

            // ==================================================
            // CRIAR
            // ==================================================

            else {

                response =
                    await fetch(
                        "/pegar_dados",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    dados
                                )

                        }
                    );

            }


            const retorno =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    retorno.erro ||
                    "Erro ao salvar lembrete."
                );

            }


            // ==================================================
            // ATUALIZA OBJETO LOCAL
            // ==================================================

            if (lembreteEditando) {

                lembreteEditando.data =
                    date;

                lembreteEditando.id_atendimento =
                    atendimentoSelecionado.id;

                lembreteEditando.atendimento =
                    atendimentoSelecionado.titulo;

                lembreteEditando.descricao =
                    description;

            }

            else {

                lembretes.push({

                    id:
                        retorno.id,

                    id_atendimento:
                        atendimentoSelecionado.id,

                    data:
                        date,

                    atendimento:
                        atendimentoSelecionado.titulo,

                    descricao:
                        description

                });

            }


            // ==================================================
            // ATUALIZA INTERFACE
            // ==================================================

            criarCalendario();

            carregarLembretes();


            form.reset();

            lembreteEditando =
                null;

            atendimentoSelecionado =
                null;

            atualizarCampoAtendimento();

            esconderBotaoExcluir();

            closeModal();

        }

        catch (erro) {

            console.error(
                "Erro:",
                erro
            );

            alert(
                erro.message ||
                "Não foi possível salvar o lembrete."
            );

        }

    }
);


// ============================================================
// EDITAR LEMBRETE
// ============================================================

function abrirEdicao(item) {

    lembreteEditando =
        item;


    atendimentoSelecionado = {

        id:
            item.id_atendimento,

        titulo:
            item.atendimento

    };


    openModal();

    tooltip.classList.add(
        "hidden"
    );


    modalTitle.textContent =
        "EDITAR LEMBRETE";


    saveButton.textContent =
        "Salvar";


    dateInput.value =
        item.data;


    descriptionInput.value =
        item.descricao || "";


    atualizarCampoAtendimento();

    mostrarBotaoExcluir();

}


// ============================================================
// BOTÃO DE EXCLUSÃO
// ============================================================

let deleteButton = null;


function criarBotaoExcluir() {

    if (deleteButton) {

        return;

    }


    deleteButton =
        document.createElement("button");

    deleteButton.type =
        "button";

    deleteButton.textContent =
        "Excluir";

    deleteButton.className =
        "delete-reminder-btn";



    saveButton.parentElement
        .insertBefore(
            deleteButton,
            saveButton
        );


    deleteButton.addEventListener(
        "click",
        excluirLembrete
    );

}


function mostrarBotaoExcluir() {

    criarBotaoExcluir();

    deleteButton.style.display =
        "inline-block";

}


function esconderBotaoExcluir() {

    if (
        deleteButton
    ) {

        deleteButton.style.display =
            "none";

    }

}


// ============================================================
// EXCLUIR LEMBRETE
// ============================================================

async function excluirLembrete() {

    if (
        !lembreteEditando
    ) {

        return;

    }


    const confirmar =
        confirm(
            "Deseja realmente excluir este lembrete?"
        );


    if (!confirmar) {

        return;

    }


    try {

        const response =
            await fetch(
                "/excluir_lembrete",
                {

                    method: "DELETE",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            id:
                                lembreteEditando.id

                        })

                }
            );


        const retorno =
            await response.json();


        if (!response.ok) {

            throw new Error(
                retorno.erro ||
                "Não foi possível excluir o lembrete."
            );

        }


        const indice =
            lembretes.findIndex(
                item =>
                    String(item.id) ===
                    String(
                        lembreteEditando.id
                    )
            );


        if (indice !== -1) {

            lembretes.splice(
                indice,
                1
            );

        }


        criarCalendario();

        carregarLembretes();


        lembreteEditando =
            null;

        atendimentoSelecionado =
            null;


        form.reset();

        atualizarCampoAtendimento();

        esconderBotaoExcluir();

        closeModal();

    }

    catch (erro) {

        console.error(
            erro
        );

        alert(
            erro.message ||
            "Não foi possível excluir o lembrete."
        );

    }

}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(valor) {

    const div =
        document.createElement("div");

    div.textContent =
        valor ?? "";

    return div.innerHTML;

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function inicializarAgenda() {

    await carregarAtendimentos();

    criarCalendario();

    carregarLembretes();

}


inicializarAgenda();