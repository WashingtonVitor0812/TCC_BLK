/* ===========================================================
   AGENDA — BLK HIGIENIZAÇÃO
=========================================================== */


/* ===========================================================
   DADOS ENVIADOS PELO FLASK
=========================================================== */

let lembretes =
    Array.isArray(dadosAgenda)
        ? dadosAgenda.map(normalizarLembrete)
        : [];


/* ===========================================================
   ATENDIMENTOS
=========================================================== */

let atendimentos = [];


/* ===========================================================
   CONFIGURAÇÕES
=========================================================== */

const CONFIG = {

    rotas: {

        criarLembrete:
            "/pegar_dados",

        editarLembrete:
            "/editar_lembrete",

        excluirLembrete:
            "/excluir_lembrete",

        atendimentos:
            "/api/atendimentos",

    }

};


/* ===========================================================
   ESTADO DO CALENDÁRIO
=========================================================== */

const dataAtual =
    new Date();

let mesAtual =
    dataAtual.getMonth();

let anoAtual =
    dataAtual.getFullYear();


/* ===========================================================
   ESTADO DO TOOLTIP
=========================================================== */

let tooltipAtivo = false;

let tooltipTimeout = null;

let celulaTooltipAtual = null;


/* ===========================================================
   ELEMENTOS DO DOM
=========================================================== */


/* -----------------------------------------------------------
   CALENDÁRIO
----------------------------------------------------------- */

const calendarBody =
    document.getElementById(
        "calendarBody"
    );

const monthYear =
    document.getElementById(
        "monthYear"
    );

const prevMonth =
    document.getElementById(
        "prevMonth"
    );

const nextMonth =
    document.getElementById(
        "nextMonth"
    );


/* -----------------------------------------------------------
   MODAL DE CRIAÇÃO
----------------------------------------------------------- */

const modalOverlay =
    document.getElementById(
        "modalOverlay"
    );

const openReminderModal =
    document.getElementById(
        "openReminderModal"
    );

const closeReminderModal =
    document.getElementById(
        "closeReminderModal"
    );

const reminderForm =
    document.getElementById(
        "reminderForm"
    );

const reminderDate =
    document.getElementById(
        "reminderDate"
    );

const appointment =
    document.getElementById(
        "appointment"
    );

const appointmentResultados =
    document.getElementById(
        "appointmentResultados"
    );

const btnPesquisarAtendimento =
    document.getElementById(
        "btnPesquisarAtendimento"
    );

const reminderDescription =
    document.getElementById(
        "reminderDescription"
    );


/* -----------------------------------------------------------
   MODAL DE EDIÇÃO
----------------------------------------------------------- */

const editModal =
    document.getElementById(
        "editModal"
    );

const closeEditModal =
    document.getElementById(
        "closeEditModal"
    );

const editReminderForm =
    document.getElementById(
        "editReminderForm"
    );

const editReminderId =
    document.getElementById(
        "editReminderId"
    );

const editReminderDate =
    document.getElementById(
        "editReminderDate"
    );

const editAppointment =
    document.getElementById(
        "editAppointment"
    );

const editAppointmentResultados =
    document.getElementById(
        "editAppointmentResultados"
    );

const btnPesquisarAtendimentoEdicao =
    document.getElementById(
        "btnPesquisarAtendimentoEdicao"
    );

const editReminderDescription =
    document.getElementById(
        "editReminderDescription"
    );


/* -----------------------------------------------------------
   LISTA / TOOLTIP
----------------------------------------------------------- */

const remindersList =
    document.getElementById(
        "remindersList"
    );

const dayTooltip =
    document.getElementById(
        "dayTooltip"
    );

const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const deleteConfirmName = document.getElementById("deleteConfirmName");
let lembreteParaExcluir = null;


/* ===========================================================
   INICIALIZAÇÃO
=========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        inicializarEventos();

        inicializarPesquisaAtendimentos();

        criarCalendario();

        renderizarListaLembretes();

        carregarAtendimentos();

        verificarNovoLembrete();

        verificarEdicaoLembrete();

        inicializarTooltip();

    }
);


/* ===========================================================
   EVENTOS
=========================================================== */

function inicializarEventos() {

    deleteConfirmModal.addEventListener("click", event => {
        if (event.target === deleteConfirmModal) fecharConfirmacaoExclusao();
    });
    document.getElementById("closeDeleteConfirm").addEventListener("click", fecharConfirmacaoExclusao);
    document.getElementById("cancelDeleteConfirm").addEventListener("click", fecharConfirmacaoExclusao);
    document.getElementById("confirmDeleteAction").addEventListener("click", executarExclusaoLembrete);


    /* -------------------------------------------------------
       CALENDÁRIO — MÊS ANTERIOR
    ------------------------------------------------------- */

    if (prevMonth) {

        prevMonth.addEventListener(
            "click",
            () => {

                esconderTooltip();

                mesAtual--;

                if (mesAtual < 0) {

                    mesAtual = 11;

                    anoAtual--;

                }

                criarCalendario();

                renderizarListaLembretes();

            }
        );

    }


    /* -------------------------------------------------------
       CALENDÁRIO — PRÓXIMO MÊS
    ------------------------------------------------------- */

    if (nextMonth) {

        nextMonth.addEventListener(
            "click",
            () => {

                esconderTooltip();

                mesAtual++;

                if (mesAtual > 11) {

                    mesAtual = 0;

                    anoAtual++;

                }

                criarCalendario();

                renderizarListaLembretes();

            }
        );

    }


    /* -------------------------------------------------------
       NOVO LEMBRETE
    ------------------------------------------------------- */

    if (openReminderModal) {

        openReminderModal.addEventListener(
            "click",
            () => {

                abrirModalCriacao();

            }
        );

    }


    if (closeReminderModal) {

        closeReminderModal.addEventListener(
            "click",
            fecharModalCriacao
        );

    }


    /* -------------------------------------------------------
       EDIÇÃO
    ------------------------------------------------------- */

    if (closeEditModal) {

        closeEditModal.addEventListener(
            "click",
            fecharModalEdicao
        );

    }


    /* -------------------------------------------------------
       FORMULÁRIO DE CRIAÇÃO
    ------------------------------------------------------- */

    if (reminderForm) {

        reminderForm.addEventListener(
            "submit",
            salvarLembrete
        );

    }


    /* -------------------------------------------------------
       FORMULÁRIO DE EDIÇÃO
    ------------------------------------------------------- */

    if (editReminderForm) {

        editReminderForm.addEventListener(
            "submit",
            salvarEdicaoLembrete
        );

    }


    /* -------------------------------------------------------
       FECHAR MODAL DE CRIAÇÃO AO CLICAR FORA
    ------------------------------------------------------- */

    if (modalOverlay) {

        modalOverlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === modalOverlay
                ) {

                    fecharModalCriacao();

                }

            }
        );

    }


    /* -------------------------------------------------------
       FECHAR MODAL DE EDIÇÃO AO CLICAR FORA
    ------------------------------------------------------- */

    if (editModal) {

        editModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === editModal
                ) {

                    fecharModalEdicao();

                }

            }
        );

    }


    /* -------------------------------------------------------
       ESC
    ------------------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                fecharModalCriacao();

                fecharModalEdicao();

                fecharResultadosAtendimentos();

                esconderTooltip();

            }

        }
    );


    /* -------------------------------------------------------
       CLIQUES NA LISTA DE LEMBRETES
    ------------------------------------------------------- */

    if (remindersList) {

        remindersList.addEventListener(
            "click",
            tratarCliqueLembrete
        );

    }


    /* -------------------------------------------------------
       FECHAR PESQUISAS AO CLICAR FORA
    ------------------------------------------------------- */

    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(
                    ".attendance-search-group"
                )
            ) {

                fecharResultadosAtendimentos();

            }

        }
    );


    /* -------------------------------------------------------
       LIMPAR ID DO ATENDIMENTO AO ALTERAR MANUALMENTE
       O TEXTO DO CAMPO
    ------------------------------------------------------- */

    if (appointment) {

        appointment.addEventListener(
            "input",
            () => {

                /*
                   Se o usuário alterar o nome depois de
                   selecionar um atendimento, o ID antigo
                   não pode continuar associado.
                */

                if (
                    appointment.dataset.valorSelecionado !==
                    appointment.value
                ) {

                    appointment.dataset.atendimentoId =
                        "";

                }

                appointment.dataset.valorSelecionado =
                    appointment.value;

            }
        );

    }


    if (editAppointment) {

        editAppointment.addEventListener(
            "input",
            () => {

                if (
                    editAppointment.dataset.valorSelecionado !==
                    editAppointment.value
                ) {

                    editAppointment.dataset.atendimentoId =
                        "";

                }

                editAppointment.dataset.valorSelecionado =
                    editAppointment.value;

            }
        );

    }

}


/* ===========================================================
   PESQUISA DE ATENDIMENTOS
=========================================================== */

function inicializarPesquisaAtendimentos() {


    /* -------------------------------------------------------
       CRIAÇÃO
    ------------------------------------------------------- */

    if (btnPesquisarAtendimento) {

        btnPesquisarAtendimento.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                alternarResultadosAtendimentos(
                    appointmentResultados,
                    appointment
                );

            }
        );

    }


    if (appointment) {

        appointment.addEventListener(
            "input",
            () => {

                filtrarAtendimentos(
                    appointment,
                    appointmentResultados
                );

            }
        );


        appointment.addEventListener(
            "focus",
            () => {

                filtrarAtendimentos(
                    appointment,
                    appointmentResultados
                );

            }
        );

    }


    /* -------------------------------------------------------
       EDIÇÃO
    ------------------------------------------------------- */

    if (btnPesquisarAtendimentoEdicao) {

        btnPesquisarAtendimentoEdicao.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                alternarResultadosAtendimentos(
                    editAppointmentResultados,
                    editAppointment
                );

            }
        );

    }


    if (editAppointment) {

        editAppointment.addEventListener(
            "input",
            () => {

                filtrarAtendimentos(
                    editAppointment,
                    editAppointmentResultados
                );

            }
        );


        editAppointment.addEventListener(
            "focus",
            () => {

                filtrarAtendimentos(
                    editAppointment,
                    editAppointmentResultados
                );

            }
        );

    }


    /* -------------------------------------------------------
       RESULTADOS — CRIAÇÃO
    ------------------------------------------------------- */

    if (appointmentResultados) {

        appointmentResultados.addEventListener(
            "click",
            event => {

                const item =
                    event.target.closest(
                        ".appointment-result"
                    );


                if (!item) {
                    return;
                }


                selecionarAtendimento(
                    item,
                    appointment,
                    appointmentResultados
                );

            }
        );

    }


    /* -------------------------------------------------------
       RESULTADOS — EDIÇÃO
    ------------------------------------------------------- */

    if (editAppointmentResultados) {

        editAppointmentResultados.addEventListener(
            "click",
            event => {

                const item =
                    event.target.closest(
                        ".edit-appointment-result"
                    );


                if (!item) {
                    return;
                }


                selecionarAtendimento(
                    item,
                    editAppointment,
                    editAppointmentResultados
                );

            }
        );

    }

}


/* ===========================================================
   CARREGAR ATENDIMENTOS
=========================================================== */

async function carregarAtendimentos() {

    try {

        const response =
            await fetch(
                CONFIG.rotas.atendimentos,
                {
                    method: "GET",

                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Não foi possível carregar os atendimentos."
            );

        }


        const dados =
            await response.json();


        if (!Array.isArray(dados)) {

            throw new Error(
                "A API retornou dados inválidos."
            );

        }


        atendimentos =
            dados;


        /*
           Os dois campos de pesquisa recebem
           a mesma lista de atendimentos.
        */

        renderizarListaAtendimentos(
            appointmentResultados,
            "appointment-result"
        );


        renderizarListaAtendimentos(
            editAppointmentResultados,
            "edit-appointment-result"
        );


    } catch (error) {

        console.error(
            "Erro ao carregar atendimentos:",
            error
        );


        mostrarErroAtendimentos();

    }

}


/* ===========================================================
   RENDERIZAR LISTA DE ATENDIMENTOS
=========================================================== */

function renderizarListaAtendimentos(
    container,
    classeResultado
) {

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (atendimentos.length === 0) {

        const vazio =
            document.createElement(
                "div"
            );


        vazio.className =
            "search-result-empty";


        vazio.textContent =
            "Nenhum atendimento cadastrado.";


        container.appendChild(
            vazio
        );


        return;

    }


    atendimentos.forEach(
        atendimento => {

            const item =
                document.createElement(
                    "button"
                );


            item.type =
                "button";


            item.className =
                `search-result-item ${classeResultado}`;


            item.dataset.id =
                atendimento.id ?? "";


            item.dataset.name =
                atendimento.titulo
                || "Atendimento";


            item.dataset.cliente =
                atendimento.cliente
                || "";


            item.dataset.servicos =
                atendimento.servicos
                || "";


            item.dataset.status =
                atendimento.status
                || "";


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "search-result-info";


            const nome =
                document.createElement(
                    "span"
                );


            nome.className =
                "search-result-name";


            nome.textContent =
                atendimento.titulo
                || "Atendimento";


            const detalhe =
                document.createElement(
                    "span"
                );


            detalhe.className =
                "search-result-detail";


            let textoDetalhe =
                atendimento.status
                || "Atendimento";


            if (
                atendimento.data_atendimento
            ) {

                textoDetalhe +=
                    " • " +
                    formatarDataAtendimento(
                        atendimento.data_atendimento
                    );

            }


            detalhe.textContent =
                textoDetalhe;


            info.appendChild(
                nome
            );


            info.appendChild(
                detalhe
            );


            const icone =
                document.createElement(
                    "i"
                );


            icone.className =
                "fa-solid fa-chevron-right search-result-icon";


            item.appendChild(
                info
            );


            item.appendChild(
                icone
            );


            container.appendChild(
                item
            );

        }
    );

}


/* ===========================================================
   ERRO AO CARREGAR ATENDIMENTOS
=========================================================== */

function mostrarErroAtendimentos() {

    const containers = [

        appointmentResultados,

        editAppointmentResultados

    ];


    containers.forEach(
        container => {

            if (!container) {
                return;
            }


            container.innerHTML = "";


            const erro =
                document.createElement(
                    "div"
                );


            erro.className =
                "search-result-empty";


            erro.textContent =
                "Não foi possível carregar os atendimentos.";


            container.appendChild(
                erro
            );

        }
    );

}


/* ===========================================================
   FORMATAR DATA DO ATENDIMENTO
=========================================================== */

function formatarDataAtendimento(
    valor
) {

    if (!valor) {
        return "";
    }


    const data =
        converterData(
            valor
        );


    if (!data) {
        return "";
    }


    const dia =
        String(
            data.getDate()
        ).padStart(
            2,
            "0"
        );


    const mes =
        String(
            data.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const ano =
        data.getFullYear();


    return `${dia}/${mes}/${ano}`;

}


/* ===========================================================
   FILTRAR ATENDIMENTOS
=========================================================== */

function filtrarAtendimentos(
    input,
    container
) {

    if (
        !input ||
        !container
    ) {

        return;

    }


    const termo =
        normalizarTexto(
            input.value
        );


    const resultados =
        container.querySelectorAll(
            ".appointment-result, .edit-appointment-result"
        );


    let encontrados = 0;


    resultados.forEach(
        item => {

            const nome =
                normalizarTexto(
                    item.dataset.name
                );


            const cliente =
                normalizarTexto(
                    item.dataset.cliente
                );


            const servicos =
                normalizarTexto(
                    item.dataset.servicos
                );


            const status =
                normalizarTexto(
                    item.dataset.status
                );


            const texto =
                normalizarTexto(
                    item.textContent
                );


            const corresponde =
                !termo
                ||
                nome.includes(termo)
                ||
                cliente.includes(termo)
                ||
                servicos.includes(termo)
                ||
                status.includes(termo)
                ||
                texto.includes(termo);


            if (corresponde) {

                item.style.display =
                    "flex";

                encontrados++;

            } else {

                item.style.display =
                    "none";

            }

        }
    );


    let vazio =
        container.querySelector(
            ".search-result-empty"
        );


    if (!vazio) {

        vazio =
            document.createElement(
                "div"
            );


        vazio.className =
            "search-result-empty";


        container.appendChild(
            vazio
        );

    }


    if (encontrados === 0) {

        vazio.textContent =
            termo
                ? "Nenhum atendimento encontrado."
                : "Nenhum atendimento cadastrado.";


        vazio.style.display =
            "block";

    } else {

        vazio.style.display =
            "none";

    }


    container.classList.add(
        "active"
    );

}


/* ===========================================================
   ABRIR / FECHAR RESULTADOS
=========================================================== */

function alternarResultadosAtendimentos(
    container,
    input
) {

    if (
        !container ||
        !input
    ) {

        return;

    }


    if (
        container.classList.contains(
            "active"
        )
    ) {

        container.classList.remove(
            "active"
        );

        return;

    }


    filtrarAtendimentos(
        input,
        container
    );

}


/* ===========================================================
   SELECIONAR ATENDIMENTO
=========================================================== */

function selecionarAtendimento(
    elemento,
    input,
    container
) {

    if (
        !elemento ||
        !input
    ) {

        return;

    }


    const id =
        elemento.dataset.id
        || "";


    const nome =
        elemento.dataset.name
        || "";


    input.value =
        nome;


    input.dataset.atendimentoId =
        id;


    input.dataset.valorSelecionado =
        nome;


    if (container) {

        container.classList.remove(
            "active"
        );

    }

}


/* ===========================================================
   FECHAR RESULTADOS
=========================================================== */

function fecharResultadosAtendimentos() {

    if (appointmentResultados) {

        appointmentResultados.classList.remove(
            "active"
        );

    }


    if (editAppointmentResultados) {

        editAppointmentResultados.classList.remove(
            "active"
        );

    }

}


/* ===========================================================
   MODAL DE CRIAÇÃO
=========================================================== */

function abrirModalCriacao() {

    if (!modalOverlay) {
        return;
    }


    limparFormularioCriacao();


    modalOverlay.classList.add(
        "active"
    );


    modalOverlay.setAttribute(
        "aria-hidden",
        "false"
    );


    if (reminderDate) {

        reminderDate.focus();

    }

}


function fecharModalCriacao() {

    if (!modalOverlay) {
        return;
    }


    modalOverlay.classList.remove(
        "active"
    );


    modalOverlay.setAttribute(
        "aria-hidden",
        "true"
    );


    fecharResultadosAtendimentos();

}


/* ===========================================================
   LIMPAR FORMULÁRIO DE CRIAÇÃO
=========================================================== */

function limparFormularioCriacao() {

    if (reminderForm) {

        reminderForm.reset();

    }


    if (appointment) {

        appointment.value = "";

        appointment.dataset.atendimentoId =
            "";

        appointment.dataset.valorSelecionado =
            "";

    }


    if (reminderDescription) {

        reminderDescription.value =
            "";

    }


    if (appointmentResultados) {

        appointmentResultados
            .querySelectorAll(
                ".appointment-result"
            )
            .forEach(
                item => {

                    item.style.display =
                        "flex";

                }
            );

    }


    if (appointmentResultados) {

        appointmentResultados.classList.remove(
            "active"
        );

    }

}


/* ===========================================================
   MODAL DE EDIÇÃO
=========================================================== */

function abrirModalEdicao(
    lembrete
) {

    if (
        !editModal ||
        !lembrete
    ) {

        return;

    }


    editReminderId.value =
        lembrete.id || "";


    editReminderDate.value =
        converterDataParaInput(
            lembrete.data
        );


    editAppointment.value =
        lembrete.atendimento || "";


    editAppointment.dataset.atendimentoId =
        lembrete.id_atendimento
        || "";


    editAppointment.dataset.valorSelecionado =
        lembrete.atendimento
        || "";


    editReminderDescription.value =
        lembrete.descricao
        || "";


    editModal.classList.add(
        "active"
    );


    editModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function fecharModalEdicao() {

    if (!editModal) {
        return;
    }


    editModal.classList.remove(
        "active"
    );


    editModal.setAttribute(
        "aria-hidden",
        "true"
    );


    fecharResultadosAtendimentos();

}


/* ===========================================================
   SALVAR NOVO LEMBRETE
=========================================================== */

async function salvarLembrete(
    event
) {

    event.preventDefault();


    if (
        !reminderDate ||
        !reminderDate.value
    ) {

        alert(
            "Informe a data do lembrete."
        );

        return;

    }


    const dados = {

        data:
            reminderDate.value,

        atendimento:
            appointment
                ? appointment.value.trim()
                : "",

        id_atendimento:
            appointment
                ? (
                    appointment.dataset.atendimentoId
                    || null
                )
                : null,

        descricao:
            reminderDescription
                ? reminderDescription.value.trim()
                : ""

    };


    try {

        const response =
            await fetch(
                CONFIG.rotas.criarLembrete,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            dados
                        )

                }
            );


        const resultado =
            await obterRespostaJSON(
                response
            );


        if (!response.ok) {

            throw new Error(
                resultado.erro
                ||
                resultado.error
                ||
                "Não foi possível criar o lembrete."
            );

        }


        if (
            resultado.success === false
        ) {

            throw new Error(
                resultado.erro
                ||
                resultado.error
                ||
                "Erro ao criar lembrete."
            );

        }


        /*
           O Flask deve preferencialmente devolver
           o lembrete recém-criado.

           A função extrairLembreteResposta aceita
           diferentes formatos de resposta.
        */

        const novoLembrete =
            extrairLembreteResposta(
                resultado,
                dados
            );


        if (
            novoLembrete &&
            novoLembrete.id !== null &&
            novoLembrete.id !== undefined &&
            novoLembrete.id !== ""
        ) {

            adicionarLembreteLocal(
                novoLembrete
            );


            fecharModalCriacao();

            atualizarInterfaceAgenda();

            return;

        }


        /*
           Se o backend não devolver o ID, não é seguro
           criar um registro local porque posteriormente
           não haveria como editá-lo ou excluí-lo.

           Nesse caso fazemos um reload como fallback.
        */

        fecharModalCriacao();

        window.location.reload();


    } catch (error) {

        console.error(
            "Erro ao criar lembrete:",
            error
        );


        alert(
            error.message
            ||
            "Não foi possível salvar o lembrete."
        );

    }

}


/* ===========================================================
   SALVAR EDIÇÃO
=========================================================== */

async function salvarEdicaoLembrete(
    event
) {

    event.preventDefault();


    if (
        !editReminderId ||
        !editReminderId.value
    ) {

        alert(
            "ID do lembrete não encontrado."
        );

        return;

    }


    if (
        !editReminderDate ||
        !editReminderDate.value
    ) {

        alert(
            "Informe a data do lembrete."
        );

        return;

    }


    const dados = {

        id:
            editReminderId.value,

        data:
            editReminderDate.value,

        atendimento:
            editAppointment
                ? editAppointment.value.trim()
                : "",

        id_atendimento:
            editAppointment
                ? (
                    editAppointment.dataset.atendimentoId
                    || null
                )
                : null,

        descricao:
            editReminderDescription
                ? editReminderDescription.value.trim()
                : ""

    };


    try {

        const response =
            await fetch(
                CONFIG.rotas.editarLembrete,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            dados
                        )

                }
            );


        const resultado =
            await obterRespostaJSON(
                response
            );


        if (!response.ok) {

            throw new Error(
                resultado.erro
                ||
                resultado.error
                ||
                "Não foi possível editar o lembrete."
            );

        }


        if (
            resultado.success === false
        ) {

            throw new Error(
                resultado.erro
                ||
                resultado.error
                ||
                "Erro ao editar lembrete."
            );

        }


        const lembreteAtualizado =
            extrairLembreteResposta(
                resultado,
                dados
            );


        atualizarLembreteLocal(
            dados.id,
            lembreteAtualizado
        );


        fecharModalEdicao();

        atualizarInterfaceAgenda();


    } catch (error) {

        console.error(
            "Erro ao editar lembrete:",
            error
        );


        alert(
            error.message
            ||
            "Não foi possível editar o lembrete."
        );

    }

}


/* ===========================================================
   EXCLUSÃO
=========================================================== */

async function excluirLembrete(
    id
) {

    if (!id) {
        return;
    }

    const lembrete = lembretes.find(item => Number(item.id) === Number(id));
    if (!lembrete) return;

    lembreteParaExcluir = lembrete;
    deleteConfirmName.textContent = lembrete.atendimento || "este lembrete";
    deleteConfirmModal.classList.add("active");
}

async function executarExclusaoLembrete() {

    if (!lembreteParaExcluir) return;
    const id = lembreteParaExcluir.id;


    try {

        const response =
            await fetch(
                CONFIG.rotas.excluirLembrete,
                {

                    method: "DELETE",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            id: id

                        })

                }
            );


        const resultado =
            await obterRespostaJSON(
                response
            );


        if (!response.ok) {

            throw new Error(
                resultado.erro
                ||
                resultado.error
                ||
                "Não foi possível excluir o lembrete."
            );

        }


        if (
            resultado.success === false
        ) {

            throw new Error(
                resultado.erro
                ||
                resultado.error
                ||
                "Erro ao excluir lembrete."
            );

        }


        removerLembreteLocal(
            id
        );


        atualizarInterfaceAgenda();
        fecharConfirmacaoExclusao();


    } catch (error) {

        console.error(
            "Erro ao excluir lembrete:",
            error
        );


        alert(
            error.message
            ||
            "Não foi possível excluir o lembrete."
        );

    }

}


/* ===========================================================
   CLIQUES NA LISTA DE LEMBRETES
=========================================================== */

function tratarCliqueLembrete(
    event
) {


    /* -------------------------------------------------------
       EXCLUIR
    ------------------------------------------------------- */

    const deleteButton =
        event.target.closest(
            ".delete-reminder-btn"
        );


    if (deleteButton) {

        excluirLembrete(
            deleteButton.dataset.id
        );

        return;

    }


    /* -------------------------------------------------------
       EDITAR
    ------------------------------------------------------- */

    const editButton =
        event.target.closest(
            ".edit-reminder-btn"
        );


    if (editButton) {

        const id =
            editButton.dataset.id;


        const lembrete =
            encontrarLembretePorId(
                id
            );


        if (!lembrete) {

            alert(
                "Não foi possível encontrar os dados deste lembrete."
            );

            return;

        }


        abrirModalEdicao(
            lembrete
        );

    }

}


/* ===========================================================
   LOCALIZAR LEMBRETE
=========================================================== */

function encontrarLembretePorId(
    id
) {

    return lembretes.find(
        lembrete =>
            String(lembrete.id)
            ===
            String(id)
    );

}


/* ===========================================================
   ADICIONAR LEMBRETE LOCALMENTE
=========================================================== */

function adicionarLembreteLocal(
    lembrete
) {

    const novo =
        normalizarLembrete(
            lembrete
        );


    /*
       Evita duplicação caso o backend tenha devolvido
       um registro que já estava no array.
    */

    const indice =
        lembretes.findIndex(
            item =>
                String(item.id)
                ===
                String(novo.id)
        );


    if (indice >= 0) {

        lembretes[indice] =
            novo;

    } else {

        lembretes.push(
            novo
        );

    }

}


/* ===========================================================
   ATUALIZAR LEMBRETE LOCALMENTE
=========================================================== */

function atualizarLembreteLocal(
    id,
    dados
) {

    const indice =
        lembretes.findIndex(
            lembrete =>
                String(lembrete.id)
                ===
                String(id)
        );


    if (indice < 0) {

        /*
           Caso raro: se o lembrete não estiver
           no array, adicionamos.
        */

        adicionarLembreteLocal({

            ...dados,

            id: id

        });

        return;

    }


    const lembreteAnterior =
        lembretes[indice];


    const atualizado =
        normalizarLembrete({

            ...lembreteAnterior,

            ...dados,

            id:
                id

        });


    lembretes[indice] =
        atualizado;

}


/* ===========================================================
   REMOVER LEMBRETE LOCALMENTE
=========================================================== */

function removerLembreteLocal(
    id
) {

    lembretes =
        lembretes.filter(
            lembrete =>
                String(lembrete.id)
                !==
                String(id)
        );

}


/* ===========================================================
   ATUALIZAR TODA A INTERFACE DA AGENDA
=========================================================== */

function atualizarInterfaceAgenda() {

    criarCalendario();

    renderizarListaLembretes();

}


/* ===========================================================
   RENDERIZAR LISTA LATERAL DE LEMBRETES
=========================================================== */

function renderizarListaLembretes() {

    if (!remindersList) {
        return;
    }


    remindersList.innerHTML =
        "";


    /*
       A lista lateral acompanha o mês que está
       atualmente sendo exibido no calendário.
    */

    const lembretesDoMes =
        lembretes
            .filter(
                lembrete =>
                    lembreteTemMes(
                        lembrete,
                        mesAtual,
                        anoAtual
                    )
            )
            .sort(
                (a, b) => {

                    const dataA =
                        converterData(
                            a.data
                        );

                    const dataB =
                        converterData(
                            b.data
                        );


                    if (
                        !dataA ||
                        !dataB
                    ) {

                        return 0;

                    }


                    return (
                        dataA.getTime()
                        -
                        dataB.getTime()
                    );

                }
            );


    if (
        lembretesDoMes.length === 0
    ) {

        const vazio =
            document.createElement(
                "div"
            );


        vazio.className =
            "empty-reminders";


        vazio.textContent =
            "Nenhum lembrete neste mês.";


        remindersList.appendChild(
            vazio
        );


        return;

    }


    lembretesDoMes.forEach(
        lembrete => {

            const item =
                criarElementoLembrete(
                    lembrete
                );


            remindersList.appendChild(
                item
            );

        }
    );

}


/* ===========================================================
   CRIAR ELEMENTO VISUAL DO LEMBRETE
=========================================================== */

function criarElementoLembrete(
    lembrete
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "reminder-item";


    item.dataset.id =
        lembrete.id;


    /*
       Mantemos o HTML genérico e usamos classes que
       normalmente já fazem parte da estrutura da agenda.
    */

    const data =
        converterData(
            lembrete.data
        );


    let dataFormatada =
        "";


    if (data) {

        dataFormatada =
            `${String(data.getDate()).padStart(2, "0")}/` +
            `${String(data.getMonth() + 1).padStart(2, "0")}/` +
            `${data.getFullYear()}`;

    }


    const conteudo =
        document.createElement(
            "div"
        );


    conteudo.className =
        "reminder-content";


    const dataElemento =
        document.createElement(
            "span"
        );


    dataElemento.className =
        "reminder-date";


    dataElemento.textContent =
        dataFormatada;


    const atendimentoElemento =
        document.createElement(
            "span"
        );


    atendimentoElemento.className =
        "reminder-appointment";


    atendimentoElemento.textContent =
        lembrete.atendimento
        ||
        "Sem atendimento";


    const descricaoElemento =
        document.createElement(
            "span"
        );


    descricaoElemento.className =
        "reminder-description";


    descricaoElemento.textContent =
        lembrete.descricao
        ||
        "Sem descrição";


    conteudo.appendChild(
        dataElemento
    );


    conteudo.appendChild(
        atendimentoElemento
    );


    conteudo.appendChild(
        descricaoElemento
    );


    const acoes =
        document.createElement(
            "div"
        );


    acoes.className =
        "reminder-actions";


    const editar =
        document.createElement(
            "button"
        );


    editar.type =
        "button";


    editar.className =
        "edit-reminder-btn";


    editar.dataset.id =
        lembrete.id;


    editar.title =
        "Editar lembrete";


    editar.setAttribute(
        "aria-label",
        "Editar lembrete"
    );


    editar.innerHTML =
        '<i class="fa-solid fa-pen"></i>';


    const excluir =
        document.createElement(
            "button"
        );


    excluir.type =
        "button";


    excluir.className =
        "delete-reminder-btn";


    excluir.dataset.id =
        lembrete.id;


    excluir.title =
        "Excluir lembrete";


    excluir.setAttribute(
        "aria-label",
        "Excluir lembrete"
    );


    excluir.innerHTML =
        '<i class="fa-solid fa-trash"></i>';


    acoes.appendChild(
        editar
    );


    acoes.appendChild(
        excluir
    );


    item.appendChild(
        conteudo
    );


    item.appendChild(
        acoes
    );


    return item;

}


/* ===========================================================
   CALENDÁRIO
=========================================================== */

function criarCalendario() {

    if (
        !calendarBody ||
        !monthYear
    ) {

        return;

    }


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


    monthYear.textContent =
        `${meses[mesAtual]} ${anoAtual}`;


    calendarBody.innerHTML =
        "";


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


    const ultimoDiaAnterior =
        new Date(
            anoAtual,
            mesAtual,
            0
        ).getDate();


    let dia =
        1;


    let proximoMesDia =
        1;


    for (
        let semana = 0;
        semana < 6;
        semana++
    ) {

        const row =
            document.createElement(
                "tr"
            );


        for (
            let coluna = 0;
            coluna < 7;
            coluna++
        ) {

            const cell =
                document.createElement(
                    "td"
                );


            /* ------------------------------------------------
               DIAS DO MÊS ANTERIOR
            ------------------------------------------------ */

            if (
                semana === 0 &&
                coluna < primeiroDia
            ) {

                const numero =
                    ultimoDiaAnterior
                    -
                    primeiroDia
                    +
                    coluna
                    +
                    1;


                cell.textContent =
                    numero;


                cell.classList.add(
                    "other-month"
                );

            }


            /* ------------------------------------------------
               DIAS DO MÊS ATUAL
            ------------------------------------------------ */

            else if (
                dia <= ultimoDia
            ) {

                const numeroDia =
                    dia;


                cell.textContent =
                    numeroDia;


                cell.dataset.day =
                    numeroDia;


                cell.dataset.month =
                    mesAtual;


                cell.dataset.year =
                    anoAtual;


                const hoje =
                    new Date();


                if (

                    numeroDia
                    ===
                    hoje.getDate()

                    &&

                    mesAtual
                    ===
                    hoje.getMonth()

                    &&

                    anoAtual
                    ===
                    hoje.getFullYear()

                ) {

                    cell.classList.add(
                        "today"
                    );

                }


                const possuiLembretes =
                    lembretes.some(
                        lembrete =>
                            lembreteTemData(
                                lembrete,
                                numeroDia,
                                mesAtual,
                                anoAtual
                            )
                    );


                if (
                    possuiLembretes
                ) {

                    cell.classList.add(
                        "has-reminder"
                    );


                    const indicador =
                        document.createElement(
                            "span"
                        );


                    indicador.className =
                        "reminder-dot";


                    cell.appendChild(
                        indicador
                    );

                }


                /*
                   O tooltip usa pointerenter/pointerleave
                   e possui controle próprio para não
                   desaparecer quando o mouse se desloca
                   da célula para o tooltip.
                */

                cell.addEventListener(
                    "mouseenter",
                    () => {

                        mostrarTooltip(
                            cell,
                            numeroDia
                        );

                    }
                );


                cell.addEventListener(
                    "mouseleave",
                    () => {

                        agendarEsconderTooltip();

                    }
                );


                cell.addEventListener(
                    "click",
                    () => {

                        esconderTooltip();

                        abrirModalParaData(
                            numeroDia
                        );

                    }
                );


                dia++;

            }


            /* ------------------------------------------------
               DIAS DO MÊS SEGUINTE
            ------------------------------------------------ */

            else {

                cell.textContent =
                    proximoMesDia;


                cell.classList.add(
                    "other-month"
                );


                proximoMesDia++;

            }


            row.appendChild(
                cell
            );

        }


        calendarBody.appendChild(
            row
        );


        if (
            dia > ultimoDia &&
            semana >= 4
        ) {

            break;

        }

    }

}


/* ===========================================================
   VERIFICAR DATA DO LEMBRETE
=========================================================== */

function lembreteTemData(
    lembrete,
    dia,
    mes,
    ano
) {

    if (
        !lembrete ||
        !lembrete.data
    ) {

        return false;

    }


    const data =
        converterData(
            lembrete.data
        );


    if (!data) {
        return false;
    }


    return (

        data.getDate()
        ===
        Number(dia)

        &&

        data.getMonth()
        ===
        Number(mes)

        &&

        data.getFullYear()
        ===
        Number(ano)

    );

}


/* ===========================================================
   VERIFICAR MÊS DO LEMBRETE
=========================================================== */

function lembreteTemMes(
    lembrete,
    mes,
    ano
) {

    if (
        !lembrete ||
        !lembrete.data
    ) {

        return false;

    }


    const data =
        converterData(
            lembrete.data
        );


    if (!data) {
        return false;
    }


    return (

        data.getMonth()
        ===
        Number(mes)

        &&

        data.getFullYear()
        ===
        Number(ano)

    );

}


/* ===========================================================
   CONVERTER DATA
=========================================================== */

function converterData(
    valor
) {

    if (!valor) {
        return null;
    }


    /*
       Trata YYYY-MM-DD diretamente para evitar
       problemas de fuso horário.
    */

    if (
        /^\d{4}-\d{2}-\d{2}/.test(
            String(valor)
        )
    ) {

        const partes =
            String(valor)
                .substring(
                    0,
                    10
                )
                .split("-");


        return new Date(

            Number(partes[0]),

            Number(partes[1]) - 1,

            Number(partes[2])

        );

    }


    const data =
        new Date(
            valor
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return null;

    }


    return data;

}


/* ===========================================================
   CONVERTER DATA PARA INPUT DATE
=========================================================== */

function converterDataParaInput(
    valor
) {

    const data =
        converterData(
            valor
        );


    if (!data) {
        return "";
    }


    const ano =
        data.getFullYear();


    const mes =
        String(
            data.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            data.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${ano}-${mes}-${dia}`;

}


/* ===========================================================
   ABRIR MODAL PARA UMA DATA DO CALENDÁRIO
=========================================================== */

function abrirModalParaData(
    dia
) {

    abrirModalCriacao();


    if (!reminderDate) {
        return;
    }


    const mes =
        String(
            mesAtual + 1
        ).padStart(
            2,
            "0"
        );


    const diaFormatado =
        String(
            dia
        ).padStart(
            2,
            "0"
        );


    reminderDate.value =
        `${anoAtual}-${mes}-${diaFormatado}`;

}


/* ===========================================================
   TOOLTIP
=========================================================== */

function inicializarTooltip() {

    if (!dayTooltip) {
        return;
    }


    /*
       O tooltip não deve desaparecer quando o mouse
       passa da célula para dentro dele.
    */

    dayTooltip.addEventListener(
        "mouseenter",
        () => {

            tooltipAtivo =
                true;


            cancelarEsconderTooltip();

        }
    );


    dayTooltip.addEventListener(
        "mouseleave",
        () => {

            tooltipAtivo =
                false;


            agendarEsconderTooltip();

        }
    );

}


function mostrarTooltip(
    cell,
    dia
) {

    if (!dayTooltip || !cell) {
        return;
    }


    cancelarEsconderTooltip();


    const eventos =
        lembretes.filter(
            lembrete =>
                lembreteTemData(
                    lembrete,
                    dia,
                    mesAtual,
                    anoAtual
                )
        );


    /*
       Não há tooltip para dias sem lembretes.
    */

    if (
        eventos.length === 0
    ) {

        esconderTooltip();

        return;

    }


    tooltipAtivo =
        true;


    celulaTooltipAtual =
        cell;


    dayTooltip.innerHTML =
        "";


    eventos.forEach(
        lembrete => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "tooltip-item";


            const atendimento =
                document.createElement(
                    "strong"
                );


            atendimento.textContent =
                lembrete.atendimento
                ||
                "Sem atendimento";


            const descricao =
                document.createElement(
                    "span"
                );


            descricao.textContent =
                lembrete.descricao
                ||
                "Sem descrição";


            item.appendChild(
                atendimento
            );


            item.appendChild(
                descricao
            );


            dayTooltip.appendChild(
                item
            );

        }
    );


    /*
       Exibe antes de medir.
    */

    dayTooltip.style.display =
        "block";


    posicionarTooltip(
        cell
    );

}


function posicionarTooltip(
    cell
) {

    if (
        !dayTooltip ||
        !cell
    ) {

        return;

    }


    const rect =
        cell.getBoundingClientRect();


    const tooltipRect =
        dayTooltip.getBoundingClientRect();


    let left =
        rect.left
        +
        (
            rect.width / 2
        )
        -
        (
            tooltipRect.width / 2
        );


    let top =
        rect.top
        -
        tooltipRect.height
        -
        8;


    /*
       Impede que o tooltip saia pela esquerda.
    */

    if (
        left < 10
    ) {

        left =
            10;

    }


    /*
       Impede que o tooltip saia pela direita.
    */

    if (
        left + tooltipRect.width
        >
        window.innerWidth - 10
    ) {

        left =
            window.innerWidth
            -
            tooltipRect.width
            -
            10;

    }


    /*
       Se não houver espaço acima, coloca abaixo.
    */

    if (
        top < 10
    ) {

        top =
            rect.bottom
            +
            8;

    }


    dayTooltip.style.left =
        `${left}px`;


    dayTooltip.style.top =
        `${top}px`;

}


function agendarEsconderTooltip() {

    cancelarEsconderTooltip();


    tooltipTimeout =
        setTimeout(
            () => {

                if (
                    tooltipAtivo
                ) {

                    return;

                }


                esconderTooltip();

            },
            150
        );

}


function cancelarEsconderTooltip() {

    if (
        tooltipTimeout !== null
    ) {

        clearTimeout(
            tooltipTimeout
        );


        tooltipTimeout =
            null;

    }

}


function esconderTooltip() {

    cancelarEsconderTooltip();


    tooltipAtivo =
        false;


    celulaTooltipAtual =
        null;


    if (!dayTooltip) {
        return;
    }


    dayTooltip.style.display =
        "none";

}


/* ===========================================================
   NOVO LEMBRETE VINDO DA TELA DE ATENDIMENTOS
=========================================================== */

function verificarNovoLembrete() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );


    const novoLembrete =
        parametros.get(
            "novoLembrete"
        );


    if (
        novoLembrete !== "1"
    ) {

        return;

    }


    abrirModalCriacao();


    const dados =
        sessionStorage.getItem(
            "atendimentoParaLembrete"
        );


    if (!dados) {

        return;

    }


    try {

        const atendimento =
            JSON.parse(
                dados
            );


        if (reminderDescription) {
            reminderDescription.value =
                atendimento.descricao || "";
        }


        if (
            appointment &&
            atendimento.id
        ) {

            const titulo =
                atendimento.titulo ||
                `Atendimento #${atendimento.id}`;

            appointment.value =
                titulo;


            appointment.dataset.atendimentoId =
                atendimento.id || "";


            appointment.dataset.valorSelecionado =
                titulo;

        }


        sessionStorage.removeItem(
            "atendimentoParaLembrete"
        );


    } catch (error) {

        console.error(
            "Erro ao recuperar atendimento:",
            error
        );

    }

}

function fecharConfirmacaoExclusao() {
    deleteConfirmModal.classList.remove("active");
    lembreteParaExcluir = null;
}

function verificarEdicaoLembrete() {
    if (new URLSearchParams(window.location.search).get("editarLembrete") !== "1") return;

    const dados = sessionStorage.getItem("lembreteParaEdicao");
    sessionStorage.removeItem("lembreteParaEdicao");
    if (!dados) return;

    try {
        const referencia = JSON.parse(dados);
        const lembrete = lembretes.find(item =>
            Number(item.id) === Number(referencia.id_lembrete) ||
            Number(item.id_atendimento) === Number(referencia.id_atendimento)
        );
        if (lembrete) abrirModalEdicao(lembrete);
        else alert("Este atendimento n\u00e3o possui um lembrete associado para atualizar.");
    } catch (error) {
        console.error("Erro ao abrir lembrete para edi\u00e7\u00e3o:", error);
    }
}


/* ===========================================================
   NORMALIZAÇÃO DE LEMBRETE
=========================================================== */

function normalizarLembrete(
    lembrete
) {

    if (!lembrete) {

        return {

            id: null,

            data: "",

            atendimento: "",

            id_atendimento: null,

            descricao: ""

        };

    }


    return {

        ...lembrete,

        id:
            lembrete.id
            ??
            null,

        data:
            lembrete.data
            ??
            lembrete.dataservico
            ??
            "",

        atendimento:
            lembrete.atendimento
            ??
            "",

        id_atendimento:
            lembrete.id_atendimento
            ??
            lembrete.atendimento_id
            ??
            null,

        descricao:
            lembrete.descricao
            ??
            ""

    };

}


/* ===========================================================
   PDF DOS ATENDIMENTOS DO MÊS EXIBIDO
=========================================================== */

function dataPertenceAoMes(data, mes, ano) {
    if (!data) return false;
    const partes = String(data).slice(0, 10).split("-");
    return partes.length === 3 && Number(partes[0]) === ano && Number(partes[1]) === mes + 1;
}

function opcoesPdfAgenda() {
    const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
        .format(new Date(anoAtual, mesAtual, 1));
    const atendimentosDoMes = atendimentos.filter(atendimento =>
        dataPertenceAoMes(atendimento.data_atendimento, mesAtual, anoAtual)
    );

    return {
        titulo: "Agenda de atendimentos",
        subtitulo: `Atendimentos de ${nomeMes}: ${atendimentosDoMes.length}`,
        nomeArquivo: `agenda_atendimentos_${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}.pdf`,
        colunas: [
            { titulo: "Data", chave: "data", largura: 30 },
            { titulo: "Atendimento", chave: "nome", largura: 55 },
            { titulo: "Cliente", chave: "cliente", largura: 43 },
            { titulo: "Serviços", chave: "servicos", largura: 76 },
            { titulo: "Status", chave: "status", largura: 34 },
            { titulo: "Valor total", chave: "valorTotal", largura: 31 }
        ],
        linhas: atendimentosDoMes.map(atendimento => ({
            data: formatarDataAtendimento(atendimento.data_atendimento),
            nome: atendimento.nome || atendimento.titulo || `Atendimento #${atendimento.id}`,
            cliente: atendimento.cliente,
            servicos: atendimento.servicos,
            status: atendimento.status,
            valorTotal: Number(atendimento.valor_total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        }))
    };
}

document.getElementById("btnGerarPDF").addEventListener("click", () => {
    try {
        window.BLKPDF.baixar(opcoesPdfAgenda());
    } catch (erro) {
        alert(erro.message);
    }
});

document.getElementById("btnCompartilharPDF").addEventListener("click", async () => {
    try {
        await window.BLKPDF.compartilhar(opcoesPdfAgenda());
    } catch (erro) {
        alert(erro.message);
    }
});


/* ===========================================================
   EXTRAIR LEMBRETE DA RESPOSTA DO FLASK
=========================================================== */

function extrairLembreteResposta(
    resultado,
    dadosEnviados
) {

    if (!resultado) {

        return normalizarLembrete(
            dadosEnviados
        );

    }


    /*
       Aceita respostas como:

       {
           success: true,
           lembrete: {...}
       }

       ou:

       {
           success: true,
           dados: {...}
       }

       ou diretamente:

       {
           id: 15,
           data: "2026-07-30",
           ...
       }
    */

    let lembrete =
        resultado.lembrete
        ||
        resultado.dados
        ||
        resultado.data
        ||
        null;


    /*
       Caso "data" seja apenas uma string de data,
       não deve ser usada como objeto.
    */

    if (
        typeof lembrete !== "object"
        ||
        lembrete === null
        ||
        Array.isArray(lembrete)
    ) {

        lembrete = null;

    }


    /*
       Se não existe objeto de lembrete, tenta montar
       usando os dados enviados e o ID retornado.
    */

    if (!lembrete) {

        const id =
            resultado.id
            ??
            resultado.id_lembrete
            ??
            resultado.lembrete_id
            ??
            null;


        return normalizarLembrete({

            ...dadosEnviados,

            id:
                id

        });

    }


    return normalizarLembrete({

        ...dadosEnviados,

        ...lembrete

    });

}


/* ===========================================================
   OBTER JSON DA RESPOSTA
=========================================================== */

async function obterRespostaJSON(
    response
) {

    try {

        return await response.json();

    } catch {

        return {};

    }

}


/* ===========================================================
   NORMALIZAÇÃO DE TEXTO
=========================================================== */

function normalizarTexto(
    texto
) {

    return String(
        texto || ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


/* ===========================================================
   FIM DO SCRIPT
=========================================================== */
