/* ===========================================================
   CRIAÇÃO DE ATENDIMENTO
   criar_atendimento.js
=========================================================== */


/* ===========================================================
   CONFIGURAÇÕES
=========================================================== */

const CONFIG = {

    // -------------------------------------------------------
    // Rotas do Flask
    // -------------------------------------------------------
    // Quando o Flask for integrado, altere somente estas
    // rotas, se necessário.
    // -------------------------------------------------------

    rotas: {

        clientes: "/api/clientes",

        servicos: "/api/servicos",

        criarAtendimento: "/api/atendimentos",

        agenda: "/agenda",

        atendimentos: "/atendimentos"

    }

};


/* ===========================================================
   ESTADO DA PÁGINA
=========================================================== */


/*
   Cliente atualmente selecionado.
*/

const clientesDisponiveis =
    Array.isArray(clientesFlask)
        ? clientesFlask
        : [];


const servicosDisponiveis =
    Array.isArray(servicosFlask)
        ? servicosFlask
        : [];


let clienteSelecionado = null;


/*
   Lista de serviços adicionados ao atendimento.

   Estrutura:

   [
       {
           id,
           nome,
           custoBase,
           quantidade,
           valor
       }
   ]
*/

let servicosSelecionados = [];


/*
   Atendimento criado no último salvamento.

   Será utilizado caso o usuário escolha criar um lembrete.
*/

let atendimentoCriado = null;


/* ===========================================================
   ELEMENTOS DO DOM
=========================================================== */

const atendimentoForm =
    document.getElementById("atendimentoForm");


const nomeAtendimento =
    document.getElementById("nomeAtendimento");


const clienteInput =
    document.getElementById("clienteInput");


const clienteIdInput =
    document.getElementById("clienteId");


const servicoInput =
    document.getElementById("servicoInput");


const descricaoAtendimento =
    document.getElementById("descricaoAtendimento");


const clienteResultados =
    document.getElementById("clienteResultados");


const servicoResultados =
    document.getElementById("servicoResultados");


const servicosTableBody =
    document.getElementById("servicosTableBody");


const valorTotal =
    document.getElementById("valorTotal");


const servicosSelecionadosInput =
    document.getElementById("servicosSelecionados");


const btnPesquisarCliente =
    document.getElementById("btnPesquisarCliente");


const btnPesquisarServico =
    document.getElementById("btnPesquisarServico");


const btnGerarPDF =
    document.getElementById("btnGerarPDF");


const btnCompartilharPDF =
    document.getElementById("btnCompartilharPDF");


const agendaModal =
    document.getElementById("agendaModal");


const btnNaoCriarLembrete =
    document.getElementById("btnNaoCriarLembrete");


const btnCriarLembrete =
    document.getElementById("btnCriarLembrete");

const btnFecharAgendaModal =
    document.getElementById("btnFecharAgendaModal");

const attendanceServiceActions =
    document.getElementById("attendanceServiceActions");


/* ===========================================================
   INICIALIZAÇÃO
=========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    inicializarEventos();

    atualizarTabela();

});


/* ===========================================================
   EVENTOS
=========================================================== */

function inicializarEventos() {


    /* -------------------------------------------------------
       PESQUISA DE CLIENTE
    ------------------------------------------------------- */

    if (btnPesquisarCliente) {

        btnPesquisarCliente.addEventListener(
            "click",
            abrirPesquisaCliente
        );

    }


    if (clienteInput) {

        clienteInput.addEventListener(
            "input",
            () => {

                clienteSelecionado = null;
                clienteIdInput.value = "";

                pesquisarClientes(clienteInput.value);

            }
        );

        clienteInput.addEventListener(
            "focus",
            () => {

                pesquisarClientes(clienteInput.value);

            }
        );

    }


    /* -------------------------------------------------------
       PESQUISA DE SERVIÇO
    ------------------------------------------------------- */

    if (btnPesquisarServico) {

        btnPesquisarServico.addEventListener(
            "click",
            abrirPesquisaServico
        );

    }


    if (servicoInput) {

        servicoInput.addEventListener(
            "input",
            () => {

                pesquisarServicos(servicoInput.value);

            }
        );

        servicoInput.addEventListener(
            "focus",
            () => {

                pesquisarServicos(servicoInput.value);

            }
        );

    }


    /* -------------------------------------------------------
       FORMULÁRIO
    ------------------------------------------------------- */

    if (atendimentoForm) {

        atendimentoForm.addEventListener(
            "submit",
            salvarAtendimento
        );

    }


    /* -------------------------------------------------------
       BOTÃO PDF
    ------------------------------------------------------- */

    if (btnGerarPDF) {

        btnGerarPDF.addEventListener(
            "click",
            gerarPDF
        );

    }


    /* -------------------------------------------------------
       COMPARTILHAR PDF
    ------------------------------------------------------- */

    if (btnCompartilharPDF) {

        btnCompartilharPDF.addEventListener(
            "click",
            compartilharPDF
        );

    }


    /* -------------------------------------------------------
       MODAL DE AGENDA
    ------------------------------------------------------- */

    if (btnNaoCriarLembrete) {

        btnNaoCriarLembrete.addEventListener(
            "click",
            () => {

                fecharModalAgenda();

                window.location.href =
                    CONFIG.rotas.atendimentos;

            }

        );

    }


    if (btnCriarLembrete) {

        btnCriarLembrete.addEventListener(
            "click",
            redirecionarParaAgenda
        );

    }


    if (btnFecharAgendaModal) {

        btnFecharAgendaModal.addEventListener(
            "click",
            fecharModalAgenda
        );

    }


    if (agendaModal) {

        agendaModal.addEventListener(
            "click",
            (event) => {

                if (event.target === agendaModal) {
                    fecharModalAgenda();
                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {
                fecharModalAgenda();
            }

        }
    );


    /* -------------------------------------------------------
       FECHAR RESULTADOS AO CLICAR FORA
    ------------------------------------------------------- */

    document.addEventListener(
        "click",
        (event) => {

            /*
            O clique só deve fechar os resultados
            quando acontecer fora de qualquer
            grupo de pesquisa.
            */

            if (!event.target.closest(".attendance-search-group")) {
                fecharResultados();
            }

        }
    );

}


/* ===========================================================
   CLIENTES
=========================================================== */


/*
   Abre a pesquisa de cliente.

   Atualmente utiliza dados de exemplo.
*/

function abrirPesquisaCliente() {

    pesquisarClientes(
        clienteInput ? clienteInput.value : ""
    );

}


/*
   Pesquisa clientes pelo nome.
*/

function pesquisarClientes(termo) {

    if (!clienteResultados) {
        return;
    }


    const busca =
        normalizarTexto(termo);


    const resultados =
        clientesDisponiveis.filter(cliente => {

            return normalizarTexto(cliente.nome)
                .includes(busca);

        });


    mostrarResultadosClientes(resultados);

}


/*
   Renderiza os resultados dos clientes.
*/

function mostrarResultadosClientes(clientes) {

    clienteResultados.innerHTML = "";

    if (clientes.length === 0) {

        clienteResultados.innerHTML = `
            <div class="search-result-empty">
                Nenhum cliente encontrado.
            </div>
        `;

        clienteResultados.classList.add("active");

        return;
    }


    clientes.forEach(cliente => {

        const item = document.createElement("button");

        item.type = "button";

        item.className = "search-result-item";

        item.innerHTML = `

            <div class="search-result-info">

                <span class="search-result-name">
                    ${cliente.nome}
                </span>

                <span class="search-result-detail">
                    ${cliente.telefone || "Telefone não informado"}
                </span>

            </div>

            <i class="fa-solid fa-chevron-right search-result-icon"></i>

        `;


        item.addEventListener("click", () => {

            selecionarCliente(cliente);

        });


        clienteResultados.appendChild(item);

    });


    clienteResultados.classList.add("active");

}


/*
   Seleciona um cliente.
*/

function selecionarCliente(cliente) {

    clienteSelecionado = cliente;


    clienteInput.value =
        cliente.nome;


    clienteIdInput.value =
        cliente.id;


    fecharResultados();

}


/* ===========================================================
   SERVIÇOS
=========================================================== */


/*
   Abre a pesquisa de serviço.
*/

function abrirPesquisaServico() {

    pesquisarServicos(
        servicoInput ? servicoInput.value : ""
    );

}


/*
   Pesquisa serviços.
*/

function pesquisarServicos(termo) {

    if (!servicoResultados) {
        return;
    }


    const busca =
        normalizarTexto(termo);


    const resultados =
        servicosDisponiveis.filter(servico => {

            return normalizarTexto(servico.nome)
                .includes(busca);

        });


    mostrarResultadosServicos(resultados);

}


/*
   Renderiza os serviços encontrados.
*/

function mostrarResultadosServicos(servicos) {

    servicoResultados.innerHTML = "";

    if (servicos.length === 0) {

        servicoResultados.innerHTML = `
            <div class="search-result-empty">
                Nenhum serviço encontrado.
            </div>
        `;

        servicoResultados.classList.add("active");

        return;
    }


    servicos.forEach(servico => {

        const item = document.createElement("button");

        item.type = "button";

        item.className = "search-result-item";

        item.innerHTML = `

            <div class="search-result-info">

                <span class="search-result-name">
                    ${servico.nome}
                </span>

                <span class="search-result-detail">
                    ${servico.descricao || "Serviço"}
                </span>

            </div>

            <span class="service-result-price">
                R$ ${Number(servico.valorBase).toFixed(2).replace(".", ",")}
            </span>

        `;


        item.addEventListener("click", () => {

            adicionarServico(servico);

            servicoInput.value = "";

            servicoResultados.innerHTML = "";

            servicoResultados.classList.remove("active");

        });


        servicoResultados.appendChild(item);

    });


    servicoResultados.classList.add("active");

}


/*
   Adiciona um serviço à tabela.
*/

function adicionarServico(servico) {


    /* -------------------------------------------------------
       Impede duplicação do mesmo serviço.
    ------------------------------------------------------- */

    const jaExiste =
        servicosSelecionados.some(
            item => item.id === servico.id
        );


    if (jaExiste) {

        alert(
            "Este serviço já foi adicionado ao atendimento."
        );

        return;

    }


    const novoServico = {

        id: servico.id,

        nome: servico.nome,

        custoBase:
            Number(servico.valorBase) || 0,

        quantidade: 1,

        valor:
            Number(servico.valorBase) || 0

    };


    servicosSelecionados.push(
        novoServico
    );


    servicoInput.value = "";


    fecharResultados();


    atualizarTabela();

}


/* ===========================================================
   TABELA DE SERVIÇOS
=========================================================== */


/*
   Atualiza completamente a tabela.
*/

function atualizarTabela() {

    if (!servicosTableBody) {
        return;
    }

    attendanceServiceActions.innerHTML = "";


    servicosTableBody.innerHTML = "";


    servicosSelecionados.forEach(
        (servico, index) => {

            const row =
                document.createElement("tr");


            row.dataset.index = index;


            row.innerHTML = `

                <td>

                    <span class="service-name">

                        ${escapeHTML(servico.nome)}

                    </span>

                </td>


                <td>

                    <input
                        type="number"
                        class="service-cost"
                        data-index="${index}"
                        value="${servico.custoBase}"
                        min="0"
                        step="0.01"
                        aria-label="Custo base"
                    >

                </td>


                <td>

                    <input
                        type="number"
                        class="service-quantity"
                        data-index="${index}"
                        value="${servico.quantidade}"
                        min="1"
                        step="1"
                        aria-label="Quantidade"
                    >

                </td>


                <td>

                    <span
                        class="service-total-value"
                        data-index="${index}"
                    >

                        ${formatarMoeda(servico.valor)}

                    </span>

                </td>

            `;


            servicosTableBody.appendChild(row);

            const action = document.createElement("div");

            action.className =
                "attendance-service-action";

            action.innerHTML = `
                <button
                    type="button"
                    title="Remover serviço"
                    aria-label="Remover serviço"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            action.querySelector("button")
                .addEventListener("click", () => {
                    removerServico(index);
                });

            attendanceServiceActions.appendChild(action);

        }
    );


    configurarEventosTabela();


    calcularTotal();


    atualizarCampoServicos();

}

/*
   Configura os eventos dos campos editáveis.
*/

function configurarEventosTabela() {


    /* -------------------------------------------------------
       CUSTO BASE
    ------------------------------------------------------- */

    document
        .querySelectorAll(".service-cost")
        .forEach(input => {

            input.addEventListener(
                "input",
                () => {

                    const index =
                        Number(input.dataset.index);


                    let custo =
                        Number(input.value);


                    if (
                        Number.isNaN(custo) ||
                        custo < 0
                    ) {

                        custo = 0;

                    }


                    servicosSelecionados[index]
                        .custoBase = custo;


                    recalcularServico(index);

                }

            );

        });


    /* -------------------------------------------------------
       QUANTIDADE
    ------------------------------------------------------- */

    document
        .querySelectorAll(".service-quantity")
        .forEach(input => {

            input.addEventListener(
                "input",
                () => {

                    const index =
                        Number(input.dataset.index);


                    let quantidade =
                        parseInt(input.value);


                    if (
                        Number.isNaN(quantidade) ||
                        quantidade < 1
                    ) {

                        quantidade = 1;

                        input.value = 1;

                    }


                    servicosSelecionados[index]
                        .quantidade = quantidade;


                    recalcularServico(index);

                }

            );

        });


    /* -------------------------------------------------------
       REMOÇÃO
    ------------------------------------------------------- */

    document
        .querySelectorAll(
            "[data-remove-index]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.removeIndex
                        );


                    removerServico(index);

                }

            );

        });

}


/*
   Recalcula o valor de um serviço.

   Fórmula:

   custo base × quantidade
*/

function recalcularServico(index) {

    const servico =
        servicosSelecionados[index];


    if (!servico) {
        return;
    }


    servico.valor =
        servico.custoBase *
        servico.quantidade;


    const valorElemento =
        document.querySelector(
            `.service-total-value[data-index="${index}"]`
        );


    if (valorElemento) {

        valorElemento.textContent =
            formatarMoeda(servico.valor);

    }


    calcularTotal();


    atualizarCampoServicos();

}


/*
   Remove um serviço.
*/

function removerServico(index) {

    if (
        index < 0 ||
        index >= servicosSelecionados.length
    ) {

        return;

    }


    servicosSelecionados.splice(
        index,
        1
    );


    atualizarTabela();

}


/*
   Calcula o valor total do atendimento.
*/

function calcularTotal() {

    const total =
        servicosSelecionados.reduce(
            (soma, servico) => {

                return soma + (
                    Number(servico.valor) || 0
                );

            },
            0
        );


    if (valorTotal) {

        valorTotal.textContent =
            formatarMoeda(total);

    }


    return total;

}


/*
   Atualiza o campo hidden com os serviços.

   Isso será útil para o Flask.
*/

function atualizarCampoServicos() {

    if (!servicosSelecionadosInput) {
        return;
    }


    servicosSelecionadosInput.value =
        JSON.stringify(
            servicosSelecionados.map(servico => ({

                servico_id: servico.id,

                quantidade: servico.quantidade,

                custo_base: servico.custoBase,

                valor: servico.valor

            }))
        );

}


/* ===========================================================
   SALVAMENTO
=========================================================== */

async function salvarAtendimento(event) {

    event.preventDefault();


    /* -------------------------------------------------------
       VALIDAÇÕES
    ------------------------------------------------------- */

    const nome =
        nomeAtendimento.value.trim();


    const descricao =
        descricaoAtendimento.value.trim();


    const textoCliente = normalizarTexto(clienteInput.value);

    const clientePeloId = clientesDisponiveis.find(
        cliente => Number(cliente.id) === Number(clienteIdInput.value)
    );

    const clientesComMesmoNome = clientesDisponiveis.filter(
        cliente => normalizarTexto(cliente.nome) === textoCliente
    );

    if (clientePeloId) {
        clienteSelecionado = clientePeloId;
    } else if (!clienteSelecionado && clientesComMesmoNome.length === 1) {
        selecionarCliente(clientesComMesmoNome[0]);
    }


    if (!nome) {

        alert(
            "Informe o nome do atendimento."
        );

        nomeAtendimento.focus();

        return;

    }


    if (!clienteSelecionado) {

        /*
           Como o usuário pode digitar manualmente no campo,
           verificamos também se existe um ID selecionado.
        */

        if (!clienteIdInput.value) {

            alert(
                "Selecione um cliente."
            );

            clienteInput.focus();

            return;

        }

    }


    if (
        servicosSelecionados.length === 0
    ) {

        alert(
            "Adicione pelo menos um serviço ao atendimento."
        );

        servicoInput.focus();

        return;

    }


    /* -------------------------------------------------------
       DADOS DO ATENDIMENTO
    ------------------------------------------------------- */

    const dadosAtendimento = {

        nome: nome,

        cliente_id:
            clienteSelecionado
                ? clienteSelecionado.id
                : clienteIdInput.value,

        cliente_nome:
            clienteSelecionado
                ? clienteSelecionado.nome
                : clienteInput.value.trim(),

        descricao: descricao,

        servicos:
            servicosSelecionados.map(servico => ({

                servico_id: servico.id,

                nome: servico.nome,

                quantidade: servico.quantidade,

                custo_base: servico.custoBase,

                valor: servico.valor

            })),

        valor_total:
            calcularTotal(),

        status: "Pendente"

    };


    try {

        const response = await fetch(
            CONFIG.rotas.criarAtendimento,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dadosAtendimento)
            }
        );

        const resultado = await response.json();

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.erro ||
                "Nao foi possivel salvar o atendimento."
            );
        }

        atendimentoCriado = {
            id: resultado.id,
            ...dadosAtendimento,
            titulo: `${dadosAtendimento.cliente_nome} — ${dadosAtendimento.servicos.map(servico => servico.nome).join(", ")}`,
            valor_total: resultado.valor_total
        };

    } catch (error) {

        console.error(error);
        alert(error.message || "Nao foi possivel salvar o atendimento.");
        return;

    }

    console.log(
        "Atendimento criado:",
        atendimentoCriado
    );


    /*
       Salva temporariamente o atendimento.

       Isso permite que a tela da Agenda receba os dados
       quando o usuário clicar em "Sim".
    */

    sessionStorage.setItem(
        "atendimentoParaLembrete",
        JSON.stringify(
            atendimentoCriado
        )
    );


    /* -------------------------------------------------------
       MOSTRA O MODAL
    ------------------------------------------------------- */

    abrirModalAgenda();

}


/* ===========================================================
   MODAL DE AGENDA
=========================================================== */

function abrirModalAgenda() {

    if (!agendaModal) {
        return;
    }


    agendaModal.classList.add(
        "active"
    );


    agendaModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


function fecharModalAgenda() {

    if (!agendaModal) {
        return;
    }


    agendaModal.classList.remove(
        "active"
    );


    agendaModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* ===========================================================
   REDIRECIONAMENTO PARA AGENDA
=========================================================== */

function redirecionarParaAgenda() {

    /*
       O atendimento já está no sessionStorage.
       
       A Agenda poderá ler:

       sessionStorage.getItem(
           "atendimentoParaLembrete"
       );

       e preencher automaticamente o campo "Atendimento"
       do modal de criação de lembrete.
    */


    window.location.href =
        CONFIG.rotas.agenda +
        "?novoLembrete=1";

}


/* ===========================================================
   PDF
=========================================================== */


/*
   Gera os dados do atendimento em formato PDF.

   Biblioteca recomendada:
   jsPDF.

   Ela será carregada no HTML posteriormente.

   Exemplo:

   <script
       src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js">
   </script>
*/


function gerarPDF() {

    if (
        typeof window.jspdf === "undefined"
    ) {

        alert(
            "A biblioteca de PDF ainda não foi carregada."
        );

        return;

    }


    const dados =
        coletarDadosAtendimento();


    const {
        jsPDF
    } = window.jspdf;


    const pdf =
        new jsPDF();


    pdf.setFontSize(20);

    pdf.setTextColor(
        13,
        61,
        140
    );


    pdf.text(
        "BLK HIGIENIZAÇÃO",
        20,
        20
    );


    pdf.setFontSize(16);

    pdf.text(
        "ATENDIMENTO",
        20,
        35
    );


    pdf.setFontSize(11);

    pdf.setTextColor(
        40,
        40,
        40
    );


    let y = 50;


    pdf.text(
        `Nome: ${dados.nome}`,
        20,
        y
    );


    y += 8;


    pdf.text(
        `Cliente: ${dados.cliente_nome}`,
        20,
        y
    );


    y += 8;


    if (dados.descricao) {

        pdf.text(
            "Descrição:",
            20,
            y
        );

        y += 7;


        const linhas =
            pdf.splitTextToSize(
                dados.descricao,
                170
            );


        pdf.text(
            linhas,
            20,
            y
        );


        y +=
            (linhas.length * 5) +
            5;

    }


    y += 5;


    pdf.setFontSize(10);

    pdf.setTextColor(
        13,
        61,
        140
    );


    pdf.text(
        "Serviço",
        20,
        y
    );


    pdf.text(
        "Qtd.",
        100,
        y
    );


    pdf.text(
        "Custo",
        125,
        y
    );


    pdf.text(
        "Valor",
        160,
        y
    );


    y += 7;


    pdf.setTextColor(
        40,
        40,
        40
    );


    dados.servicos.forEach(
        servico => {

            pdf.text(
                servico.nome,
                20,
                y
            );


            pdf.text(
                String(servico.quantidade),
                100,
                y
            );


            pdf.text(
                formatarMoeda(
                    servico.custo_base
                ),
                125,
                y
            );


            pdf.text(
                formatarMoeda(
                    servico.valor
                ),
                160,
                y
            );


            y += 7;

        }
    );


    y += 8;


    pdf.setFontSize(13);

    pdf.setTextColor(
        13,
        61,
        140
    );


    pdf.text(
        `TOTAL: ${formatarMoeda(dados.valor_total)}`,
        125,
        y
    );


    y += 15;


    pdf.setFontSize(10);

    pdf.setTextColor(
        100,
        100,
        100
    );


    pdf.text(
        `Status: ${dados.status}`,
        20,
        y
    );


    pdf.save(
        gerarNomeArquivoPDF(dados)
    );

}


/* ===========================================================
   COMPARTILHAMENTO DO PDF
=========================================================== */

async function compartilharPDF() {

    if (
        typeof window.jspdf === "undefined"
    ) {

        alert(
            "A biblioteca de PDF ainda não foi carregada."
        );

        return;

    }


    const dados =
        coletarDadosAtendimento();


    const {
        jsPDF
    } = window.jspdf;


    const pdf =
        criarDocumentoPDF(
            dados
        );


    const blob =
        pdf.output("blob");


    const arquivo =
        new File(
            [
                blob
            ],
            gerarNomeArquivoPDF(dados),
            {
                type: "application/pdf"
            }
        );


    /* -------------------------------------------------------
       Web Share API com arquivo
    ------------------------------------------------------- */

    if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
            files: [arquivo]
        })
    ) {

        try {

            await navigator.share({

                title:
                    dados.nome,

                text:
                    "Atendimento BLK Higienização",

                files: [
                    arquivo
                ]

            });

        } catch (error) {

            /*
               Cancelamento pelo usuário não é considerado
               um erro relevante.
            */

            console.log(
                "Compartilhamento cancelado.",
                error
            );

        }

        return;

    }


    /* -------------------------------------------------------
       Caso o navegador não aceite compartilhamento de
       arquivos, gera o PDF normalmente.
    ------------------------------------------------------- */

    pdf.save(
        gerarNomeArquivoPDF(dados)
    );


    alert(
        "Seu navegador não permite compartilhar arquivos diretamente. O PDF foi gerado para você compartilhar manualmente."
    );

}


/* ===========================================================
   CRIA DOCUMENTO PDF
=========================================================== */

function criarDocumentoPDF(dados) {

    const {
        jsPDF
    } = window.jspdf;


    const pdf =
        new jsPDF();


    pdf.setFontSize(20);

    pdf.setTextColor(
        13,
        61,
        140
    );


    pdf.text(
        "BLK HIGIENIZAÇÃO",
        20,
        20
    );


    pdf.setFontSize(16);

    pdf.text(
        "ATENDIMENTO",
        20,
        35
    );


    pdf.setFontSize(11);

    pdf.setTextColor(
        40,
        40,
        40
    );


    let y = 50;


    pdf.text(
        `Nome: ${dados.nome}`,
        20,
        y
    );


    y += 8;


    pdf.text(
        `Cliente: ${dados.cliente_nome}`,
        20,
        y
    );


    y += 8;


    if (dados.descricao) {

        pdf.text(
            "Descrição:",
            20,
            y
        );


        y += 7;


        const linhas =
            pdf.splitTextToSize(
                dados.descricao,
                170
            );


        pdf.text(
            linhas,
            20,
            y
        );


        y +=
            (linhas.length * 5) +
            5;

    }


    y += 5;


    pdf.setFontSize(10);

    pdf.setTextColor(
        13,
        61,
        140
    );


    pdf.text(
        "Serviço",
        20,
        y
    );


    pdf.text(
        "Qtd.",
        100,
        y
    );


    pdf.text(
        "Custo",
        125,
        y
    );


    pdf.text(
        "Valor",
        160,
        y
    );


    y += 7;


    pdf.setTextColor(
        40,
        40,
        40
    );


    dados.servicos.forEach(
        servico => {

            pdf.text(
                servico.nome,
                20,
                y
            );


            pdf.text(
                String(
                    servico.quantidade
                ),
                100,
                y
            );


            pdf.text(
                formatarMoeda(
                    servico.custo_base
                ),
                125,
                y
            );


            pdf.text(
                formatarMoeda(
                    servico.valor
                ),
                160,
                y
            );


            y += 7;

        }
    );


    y += 8;


    pdf.setFontSize(13);

    pdf.setTextColor(
        13,
        61,
        140
    );


    pdf.text(
        `TOTAL: ${formatarMoeda(dados.valor_total)}`,
        125,
        y
    );


    y += 15;


    pdf.setFontSize(10);

    pdf.setTextColor(
        100,
        100,
        100
    );


    pdf.text(
        `Status: ${dados.status}`,
        20,
        y
    );


    return pdf;

}


/* ===========================================================
   COLETA DOS DADOS
=========================================================== */

function coletarDadosAtendimento() {

    return {

        nome:
            nomeAtendimento
                ? nomeAtendimento.value.trim()
                : "",

        cliente_id:
            clienteSelecionado
                ? clienteSelecionado.id
                : clienteIdInput.value,

        cliente_nome:
            clienteSelecionado
                ? clienteSelecionado.nome
                : clienteInput.value.trim(),

        descricao:
            descricaoAtendimento
                ? descricaoAtendimento.value.trim()
                : "",

        servicos:
            servicosSelecionados.map(
                servico => ({

                    id: servico.id,

                    servico_id: servico.id,

                    nome: servico.nome,

                    quantidade:
                        servico.quantidade,

                    custo_base:
                        servico.custoBase,

                    valor:
                        servico.valor

                })
            ),

        valor_total:
            calcularTotal(),

        status:
            "Pendente"

    };

}


/* ===========================================================
   UTILITÁRIOS
=========================================================== */


/*
   Formata valores monetários no padrão brasileiro.
*/

function formatarMoeda(valor) {

    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    ).format(
        Number(valor) || 0
    );

}


/*
   Normaliza texto para pesquisa.

   Exemplo:

   "Limpeza Sofá"

   vira algo comparável a:

   "limpeza sofa"
*/

function normalizarTexto(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


/*
   Escapa HTML para evitar que dados vindos do banco
   sejam interpretados como HTML.
*/

function escapeHTML(texto) {

    const div =
        document.createElement("div");


    div.textContent =
        String(texto ?? "");


    return div.innerHTML;

}


/*
   Fecha os resultados de pesquisa.
*/

function fecharResultados() {

    if (clienteResultados) {

        clienteResultados.classList.remove("active");

    }

    if (servicoResultados) {

        servicoResultados.classList.remove("active");

    }

}


/*
   Nome do arquivo PDF.
*/

function gerarNomeArquivoPDF(dados) {

    const nome =
        normalizarTexto(
            dados.nome
        )
        .replace(
            /\s+/g,
            "_"
        );


    return `atendimento_${nome || "novo"}.pdf`;

}


/* ===========================================================
   EXPORTAÇÃO PARA DEBUG
   -----------------------------------------------------------
   Útil durante o desenvolvimento.
=========================================================== */

window.Atendimento = {

    servicosSelecionados,

    adicionarServico,

    removerServico,

    calcularTotal,

    coletarDadosAtendimento,

    gerarPDF,

    compartilharPDF

};
