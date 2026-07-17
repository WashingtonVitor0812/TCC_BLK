// ======================================================
// DADOS TEMPORÁRIOS
// ======================================================
//
// REMOVER QUANDO O FLASK ESTIVER PRONTO
//
// GET /clientes
// GET /servicos
// GET /atendimentos
//
// ======================================================

let atendimentos = [
    {
        id: 1,
        nome: "Higienização de Sofá",
        cliente: "José Silva",
        data: "08/07/2026",
        valorTotal: 250.00,
        status: "Pendente",
        descricao: "Realizar limpeza completa com impermeabilização.",

        servicos: [
            {
                nome: "Limpeza de Sofá",
                quantidade: 1,
                valorUnitario: 150.00
            },
            {
                nome: "Impermeabilização",
                quantidade: 1,
                valorUnitario: 100.00
            }
        ]
    },

    {
        id: 2,
        nome: "Limpeza de Colchão",
        cliente: "Maria Oliveira",
        data: "09/07/2026",
        valorTotal: 180.00,
        status: "Em andamento",
        descricao: "Colchão Queen Size.",

        servicos: [
            {
                nome: "Limpeza de Colchão",
                quantidade: 1,
                valorUnitario: 180.00
            }
        ]
    },

    {
        id: 3,
        nome: "Limpeza Automotiva",
        cliente: "Carlos Henrique",
        data: "10/07/2026",
        valorTotal: 320.00,
        status: "Concluído",
        descricao: "Interior completo.",

        servicos: [
            {
                nome: "Banco",
                quantidade: 2,
                valorUnitario: 80
            },
            {
                nome: "Carpete",
                quantidade: 1,
                valorUnitario: 160
            }
        ]
    },

    {
        id: 4,
        nome: "Impermeabilização",
        cliente: "Ana Paula",
        data: "12/07/2026",
        valorTotal: 150,
        status: "Cancelado",
        descricao: "Cliente desistiu.",

        servicos: [
            {
                nome: "Impermeabilização",
                quantidade: 1,
                valorUnitario: 150
            }
        ]
    }

];

// ======================================================
// REFERÊNCIAS DA PÁGINA
// ======================================================

const tbody =
    document.getElementById(
        "atendimentosTableBody"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const filterType =
    document.getElementById(
        "filterType"
    );

// ======================================================
// UTILITÁRIOS
// ======================================================

function formatarMoeda(valor){

    return Number(valor)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

}

function obterClasseStatus(status){

    switch(status){

        case "Pendente":
            return "status-pendente";

        case "Em andamento":
            return "status-andamento";

        case "Concluído":
            return "status-concluido";

        case "Cancelado":
            return "status-cancelado";

        default:
            return "";

    }

}

// ======================================================
// RENDERIZAÇÃO DA TABELA
// ======================================================

function renderAtendimentos(
    lista = atendimentos
){

    tbody.innerHTML = "";

    lista.forEach(atendimento => {

        tbody.innerHTML += `

            <tr>

                <td>

                    ${atendimento.nome}

                </td>

                <td>

                    ${formatarMoeda(
                        atendimento.valorTotal
                    )}

                </td>

                <td>

                    ${atendimento.data}

                </td>

                <td>

                    ${atendimento.cliente}

                </td>

                <td>

                    <select

                        class="status-select ${obterClasseStatus(atendimento.status)}"

                        onchange="alterarStatus(${atendimento.id}, this)"

                    >

                        <option
                            value="Pendente"
                            ${atendimento.status==="Pendente"?"selected":""}
                        >

                            Pendente

                        </option>

                        <option
                            value="Em andamento"
                            ${atendimento.status==="Em andamento"?"selected":""}
                        >

                            Em andamento

                        </option>

                        <option
                            value="Concluído"
                            ${atendimento.status==="Concluído"?"selected":""}
                        >

                            Concluído

                        </option>

                        <option
                            value="Cancelado"
                            ${atendimento.status==="Cancelado"?"selected":""}
                        >

                            Cancelado

                        </option>

                    </select>

                </td>

                <td>

                    <div class="actions">

                        <button
                            onclick="editarAtendimento(${atendimento.id})"
                            title="Editar">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            onclick="gerarPDF(${atendimento.id})"
                            title="PDF">

                            <i class="fa-solid fa-file-pdf"></i>

                        </button>

                        <button
                            onclick="visualizarAtendimento(${atendimento.id})"
                            title="Visualizar">

                            <i class="fa-solid fa-eye"></i>

                        </button>

                        <button
                            onclick="confirmarExclusao(${atendimento.id})"
                            title="Excluir">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

renderAtendimentos();

// ======================================================
// PESQUISA E FILTROS
// ======================================================

function filtrarAtendimentos() {

    const termo =
        searchInput.value
        .trim()
        .toLowerCase();

    const filtro =
        filterType.value;

    const listaFiltrada =
        atendimentos.filter(atendimento => {

            switch (filtro) {

                case "nome":

                    return atendimento.nome
                        .toLowerCase()
                        .includes(termo);

                case "cliente":

                    return atendimento.cliente
                        .toLowerCase()
                        .includes(termo);

                case "status":

                    return atendimento.status
                        .toLowerCase()
                        .includes(termo);

                default:

                    return true;

            }

        });

    renderAtendimentos(listaFiltrada);

}

// ======================================================
// EVENTOS DA PESQUISA
// ======================================================

searchInput.addEventListener(

    "input",

    filtrarAtendimentos

);

filterType.addEventListener(

    "change",

    filtrarAtendimentos

);

// ======================================================
// ALTERAÇÃO DE STATUS
// ======================================================

function alterarStatus(id, select){

    const atendimento =

        atendimentos.find(

            atendimento => atendimento.id === id

        );

    if(!atendimento){

        return;

    }

    atendimento.status =

        select.value;

    select.className =

        `status-select ${obterClasseStatus(atendimento.status)}`;

    /*
    =====================================================

    FLASK FUTURO

    PUT /atendimentos/<id>/status

    fetch(`/atendimentos/${id}/status`,{

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            status: atendimento.status

        })

    });

    =====================================================
    */

}

// ======================================================
// BOTÃO NOVO ATENDIMENTO
// ======================================================

const btnNovoAtendimento =

    document.getElementById(

        "btnNovoAtendimento"

    );

btnNovoAtendimento.addEventListener(

    "click",

    () => {

        /*
        ===============================================

        FLASK FUTURO

        window.location.href="/atendimentos/novo";

        ===============================================
        */

        window.location.href =
            "criarAtendimento.html";

    }

);

// ======================================================
// FUNÇÕES PLACEHOLDER
// (SERÃO IMPLEMENTADAS NAS PRÓXIMAS PARTES)
// ======================================================

function visualizarAtendimento(id){

    console.log(

        "Visualizar atendimento",

        id

    );

}

function editarAtendimento(id){

    console.log(

        "Editar atendimento",

        id

    );

    /*
    ===============================================

    FLASK FUTURO

    window.location.href=

    `/editarAtendimento?id=${id}`;

    ===============================================
    */

}

function gerarPDF(id){

    console.log(

        "Gerar PDF",

        id

    );

    /*
    ===============================================

    BIBLIOTECA SUGERIDA

    pdfmake

    https://pdfmake.github.io/docs/

    ===============================================
    */

}

function confirmarExclusao(id){

    console.log(

        "Excluir",

        id

    );

}

// ======================================================
// REFERÊNCIAS DOS MODAIS
// ======================================================

const viewModal =
    document.getElementById(
        "viewModal"
    );

const deleteModal =
    document.getElementById(
        "deleteModal"
    );

const confirmDelete =
    document.getElementById(
        "confirmDelete"
    );

let atendimentoSelecionado = null;

// ======================================================
// VISUALIZAÇÃO
// ======================================================

function visualizarAtendimento(id){

    atendimentoSelecionado =
        atendimentos.find(
            atendimento => atendimento.id === id
        );

    if(!atendimentoSelecionado){

        return;

    }

    document
    .getElementById("viewNome")
    .textContent =
        atendimentoSelecionado.nome;

    document
    .getElementById("viewCliente")
    .textContent =
        atendimentoSelecionado.cliente;

    document
    .getElementById("viewData")
    .textContent =
        atendimentoSelecionado.data;

    document
    .getElementById("viewStatus")
    .textContent =
        atendimentoSelecionado.status;

    document
    .getElementById("viewDescricao")
    .textContent =
        atendimentoSelecionado.descricao;

    document
    .getElementById("viewTotal")
    .textContent =
        formatarMoeda(
            atendimentoSelecionado.valorTotal
        );

    const tbody =
        document.getElementById(
            "viewServices"
        );

    tbody.innerHTML = "";

    atendimentoSelecionado.servicos.forEach(

        servico => {

            tbody.innerHTML += `

                <tr>

                    <td>

                        ${servico.nome}

                    </td>

                    <td>

                        ${servico.quantidade}

                    </td>

                    <td>

                        ${formatarMoeda(
                            servico.valorUnitario
                        )}

                    </td>

                    <td>

                        ${formatarMoeda(
                            servico.quantidade *
                            servico.valorUnitario
                        )}

                    </td>

                </tr>

            `;

        }

    );

    viewModal.classList.add(
        "active"
    );

}

// ======================================================
// FECHAR VISUALIZAÇÃO
// ======================================================

function closeViewModal(){

    viewModal.classList.remove(
        "active"
    );

}

// ======================================================
// EXCLUSÃO
// ======================================================

function confirmarExclusao(id){

    atendimentoSelecionado =
        id;

    deleteModal.classList.add(
        "active"
    );

}

function closeDeleteModal(){

    deleteModal.classList.remove(
        "active"
    );

}

confirmDelete.addEventListener(

    "click",

    () => {

        atendimentos =
            atendimentos.filter(

                atendimento =>

                    atendimento.id !==
                    atendimentoSelecionado

            );

        renderAtendimentos();

        closeDeleteModal();

        /*
        ===============================================

        FLASK FUTURO

        DELETE

        /atendimentos/<id>

        ===============================================

        fetch(

            `/atendimentos/${atendimentoSelecionado}`,

            {

                method:"DELETE"

            }

        );

        */

    }

);

// ======================================================
// EDIÇÃO
// ======================================================

function editarAtendimento(id){

    /*
    ===============================================

    FLASK FUTURO

    Redirecionar para

    /editar-atendimento/<id>

    ===============================================

    */

    window.location.href =
        `editarAtendimento.html?id=${id}`;

}

// ======================================================
// FECHAMENTO DOS MODAIS
// ======================================================

viewModal.addEventListener(

    "click",

    (e)=>{

        if(

            e.target===viewModal

        ){

            closeViewModal();

        }

    }

);

deleteModal.addEventListener(

    "click",

    (e)=>{

        if(

            e.target===deleteModal

        ){

            closeDeleteModal();

        }

    }

);

// ======================================================
// ESC
// ======================================================

document.addEventListener(

    "keydown",

    (e)=>{

        if(

            e.key==="Escape"

        ){

            closeViewModal();

            closeDeleteModal();

        }

    }

);

// ======================================================
// PDF
// ======================================================
//
// Biblioteca sugerida:
//
// pdfmake
// https://pdfmake.github.io/docs/
//
// ou
//
// jsPDF + AutoTable
//
// https://github.com/simonbengtsson/jsPDF-AutoTable
//
// ======================================================

function gerarPDF(id){

    const atendimento =

        atendimentos.find(

            atendimento => atendimento.id === id

        );

    if(!atendimento){

        return;

    }

    /*
    =====================================================

    FLASK FUTURO

    Caso queira gerar PDFs pelo servidor:

    GET

    /atendimentos/<id>/pdf

    window.open(
        `/atendimentos/${id}/pdf`
    );

    =====================================================
    */

    alert(

        "A geração de PDF será implementada futuramente utilizando pdfmake."

    );

}

// ======================================================
// MODAL COMPLETO
// ======================================================

function preencherModalCompleto(atendimento){

    document
    .getElementById("viewNome")
    .textContent =
        atendimento.nome;

    document
    .getElementById("viewCliente")
    .textContent =
        atendimento.cliente;

    document
    .getElementById("viewData")
    .textContent =
        atendimento.data;

    document
    .getElementById("viewStatus")
    .textContent =
        atendimento.status;

    document
    .getElementById("viewDescricao")
    .textContent =
        atendimento.descricao;

    document
    .getElementById("viewTotal")
    .textContent =
        formatarMoeda(
            atendimento.valorTotal
        );

    const tbody =
        document.getElementById(
            "viewServices"
        );

    tbody.innerHTML = "";

    atendimento.servicos.forEach(

        servico=>{

            tbody.innerHTML += `

            <tr>

                <td>${servico.nome}</td>

                <td>${servico.quantidade}</td>

                <td>

                    ${formatarMoeda(

                        servico.valorUnitario

                    )}

                </td>

                <td>

                    ${formatarMoeda(

                        servico.valorUnitario *

                        servico.quantidade

                    )}

                </td>

            </tr>

            `;

        }

    );

}

// ======================================================
// FLASK
// ======================================================
//
// Quando o backend estiver pronto,
// basta substituir o array temporário.
//
// ======================================================

/*

async function carregarAtendimentos(){

    const resposta =

        await fetch(

            "/atendimentos"

        );

    atendimentos =

        await resposta.json();

    renderAtendimentos();

}

window.onload =

    carregarAtendimentos;

*/

// ======================================================
// FLASK
// CADASTRO
// ======================================================

/*

fetch(

    "/atendimentos",

    {

        method:"POST",

        headers:{

            "Content-Type":

            "application/json"

        },

        body:JSON.stringify(

            novoAtendimento

        )

    }

);

*/

// ======================================================
// FLASK
// EDIÇÃO
// ======================================================

/*

fetch(

    `/atendimentos/${id}`,

    {

        method:"PUT",

        headers:{

            "Content-Type":

            "application/json"

        },

        body:JSON.stringify(

            atendimento

        )

    }

);

*/

// ======================================================
// FLASK
// EXCLUSÃO
// ======================================================

/*

fetch(

    `/atendimentos/${id}`,

    {

        method:"DELETE"

    }

);

*/

// ======================================================
// FLASK
// STATUS
// ======================================================

/*

fetch(

    `/atendimentos/${id}/status`,

    {

        method:"PUT",

        headers:{

            "Content-Type":

            "application/json"

        },

        body:JSON.stringify({

            status:status

        })

    }

);

*/

// ======================================================
// ORGANIZAÇÃO DOS DADOS
// ======================================================
//
// A API deverá retornar:
//
// Atendimento
//
// {
//      id,
//      nome,
//      cliente,
//      telefone,
//      endereco,
//      data,
//      hora,
//      status,
//      formaPagamento,
//      desconto,
//      valorEntrada,
//      observacoes,
//      descricao,
//
//      servicos:[
//
//          {
//
//              id,
//              nome,
//              quantidade,
//              valorUnitario
//
//          }
//
//      ]
//
// }
//
// ======================================================

// ======================================================
// REDIRECIONAMENTO
// ======================================================

document

.getElementById(

    "btnNovoAtendimento"

)

.addEventListener(

    "click",

    ()=>{

        window.location.href =

        "criarAtendimento.html";

    }

);

// ======================================================
// INICIALIZAÇÃO
// ======================================================

renderAtendimentos();