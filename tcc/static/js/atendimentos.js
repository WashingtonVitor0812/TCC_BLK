let atendimentos = [];
let clientes = [];
let atendimentoSelecionado = null;

const tbody = document.getElementById("atendimentosTableBody");
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const sortOrder = document.getElementById("sortOrder");
const viewModal = document.getElementById("viewModal");
const editModal = document.getElementById("editModal");
const deleteModal = document.getElementById("deleteModal");
const confirmDelete = document.getElementById("confirmDelete");

const STATUS = {
    PENDENTE: "Pendente",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado"
};

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(data) {
    if (!data) return "Data nao definida";
    if (!data) return "—";
    const [ano, mes, dia] = data.split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function textoStatus(status) {
    return STATUS[status] || status || "—";
}

function obterClasseStatus(status) {
    return {
        PENDENTE: "status-pendente",
        EM_ANDAMENTO: "status-andamento",
        CONCLUIDO: "status-concluido",
        CANCELADO: "status-cancelado"
    }[status] || "";
}

function criarBotao(icone, titulo, aoClicar) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.title = titulo;
    botao.setAttribute("aria-label", titulo);
    botao.innerHTML = `<i class="fa-solid ${icone}"></i>`;
    botao.addEventListener("click", aoClicar);
    return botao;
}

function criarSelectStatus(status, aoAlterar) {
    const select = document.createElement("select");
    select.className = `status-select ${obterClasseStatus(status)}`;

    Object.entries(STATUS).forEach(([valor, texto]) => {
        const opcao = new Option(texto, valor, false, valor === status);
        select.add(opcao);
    });

    select.addEventListener("change", aoAlterar);
    return select;
}

function renderAtendimentos(lista = atendimentos) {
    tbody.innerHTML = "";

    if (lista.length === 0) {
        const linha = tbody.insertRow();
        const celula = linha.insertCell();
        celula.colSpan = 8;
        celula.textContent = "Nenhum atendimento encontrado.";
        return;
    }

    lista.forEach((atendimento) => {
        const linha = tbody.insertRow();
        linha.insertCell().textContent = atendimento.nome || `Atendimento #${atendimento.id}`;
        linha.insertCell().textContent = atendimento.servicos || "Sem serviço informado";
        linha.insertCell().textContent = formatarMoeda(atendimento.desconto);
        linha.insertCell().textContent = formatarMoeda(atendimento.valor_total);
        linha.insertCell().textContent = formatarData(atendimento.data_lembrete);
        linha.insertCell().textContent = atendimento.cliente || "Cliente não encontrado";

        const status = linha.insertCell();
        status.appendChild(criarSelectStatus(atendimento.status, async (evento) => {
            await atualizarStatusAtendimento(atendimento.id, evento.target.value);
        }));

        const acoes = linha.insertCell();
        const grupo = document.createElement("div");
        grupo.className = "actions";
        const botaoConcluir = criarBotao("fa-circle-check", "Marcar como concluído", () => concluirAtendimento(atendimento.id));
        if (atendimento.status === "CONCLUIDO") {
            botaoConcluir.disabled = true;
            botaoConcluir.title = "Atendimento já concluído";
            botaoConcluir.setAttribute("aria-label", "Atendimento já concluído");
        }
        grupo.append(
            criarBotao("fa-pen", "Editar", () => abrirEdicao(atendimento.id)),
            criarBotao("fa-eye", "Visualizar", () => visualizarAtendimento(atendimento.id)),
            botaoConcluir,
            criarBotao("fa-trash", "Excluir", () => confirmarExclusao(atendimento.id))
        );
        acoes.appendChild(grupo);
    });
}

function obterAtendimentosFiltrados() {
    const termo = searchInput.value.trim().toLowerCase();
    const filtro = filterType.value;
    const ordemStatus = {
        PENDENTE: 0,
        EM_ANDAMENTO: 1,
        CONCLUIDO: 2,
        CANCELADO: 3
    };

    return atendimentos.filter((atendimento) => {
        const nome = (atendimento.nome || `Atendimento #${atendimento.id}`).toLowerCase();
        const servicos = (atendimento.servicos || "").toLowerCase();
        const cliente = (atendimento.cliente || "").toLowerCase();
        const status = textoStatus(atendimento.status).toLowerCase();
        if (filtro === "nome") return nome.includes(termo);
        if (filtro === "cliente") return cliente.includes(termo);
        if (filtro === "servicos") return servicos.includes(termo);
        if (filtro === "status") return status.includes(termo);
        return nome.includes(termo) || servicos.includes(termo) ||
            cliente.includes(termo) || status.includes(termo);
    }).sort((primeiro, segundo) => {
        const [campo, direcao] = (sortOrder.value || "criado-desc").split("-");
        const chave = campo === "nome" ? "nome" : campo === "editado" ? "editadoEm" : "criadoEm";
        const resultado = String(primeiro[chave] || "").localeCompare(String(segundo[chave] || ""), "pt-BR");
        return direcao === "asc" ? resultado : -resultado;
    });
}

function filtrarAtendimentos() {
    renderAtendimentos(obterAtendimentosFiltrados());
}

async function carregarAtendimentos() {
    try {
        const resposta = await fetch("/api/atendimentos");
        if (!resposta.ok) throw new Error("Não foi possível carregar os atendimentos.");

        const dados = await resposta.json();
        if (!Array.isArray(dados)) throw new Error("A resposta do servidor é inválida.");

        atendimentos = dados;
        filtrarAtendimentos();
    } catch (erro) {
        console.error("Erro ao carregar atendimentos:", erro);
        alert(erro.message);
    }
}

async function carregarClientes() {
    const resposta = await fetch("/api/clientes");
    if (!resposta.ok) throw new Error("Não foi possível carregar os clientes.");

    const dados = await resposta.json();
    if (!Array.isArray(dados)) throw new Error("A resposta de clientes é inválida.");

    clientes = dados;
}

async function atualizarAtendimento(id, dados) {
    try {
        const resposta = await fetch(`/api/atendimentos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });
        const retorno = await resposta.json();

        if (!resposta.ok || !retorno.success) {
            throw new Error(retorno.erro || "Não foi possível atualizar o atendimento.");
        }

        await carregarAtendimentos();
        return true;
    } catch (erro) {
        console.error("Erro ao atualizar atendimento:", erro);
        alert(erro.message);
        await carregarAtendimentos();
        return false;
    }
}

async function atualizarStatusAtendimento(id, status) {
    try {
        const resposta = await fetch(`/api/atendimentos/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });
        const retorno = await resposta.json();
        if (!resposta.ok || !retorno.success) throw new Error(retorno.erro || "Nao foi possivel atualizar o status.");
        await carregarAtendimentos();
    } catch (erro) {
        console.error("Erro ao atualizar status:", erro);
        alert(erro.message);
        await carregarAtendimentos();
    }
}

async function concluirAtendimento(id) {
    try {
        const resposta = await fetch(`/api/atendimentos/${id}/concluir`, { method: "POST" });
        const retorno = await resposta.json();
        if (!resposta.ok || !retorno.success) {
            throw new Error(retorno.erro || "Não foi possível concluir o atendimento.");
        }
        await carregarAtendimentos();
    } catch (erro) {
        console.error("Erro ao concluir atendimento:", erro);
        alert(erro.message);
    }
}

async function obterAtendimento(id) {
    const resposta = await fetch(`/api/atendimentos/${id}`);
    const retorno = await resposta.json();

    if (!resposta.ok || !retorno.success) {
        throw new Error(retorno.erro || "Não foi possível carregar o atendimento.");
    }

    return retorno.atendimento;
}

async function visualizarAtendimento(id) {
    try {
        const atendimento = await obterAtendimento(id);
        document.getElementById("viewNome").textContent = atendimento.nome || `Atendimento #${atendimento.id}`;
        document.getElementById("viewCliente").textContent = atendimento.cliente;
        document.getElementById("viewData").textContent = formatarData(atendimento.data_lembrete);
        document.getElementById("viewStatus").textContent = textoStatus(atendimento.status);
        document.getElementById("viewDescricao").textContent = atendimento.data_conclusao
            ? `Conclusão: ${formatarData(atendimento.data_conclusao)}`
            : "Sem data de conclusão.";
        document.getElementById("viewTotal").textContent = formatarMoeda(atendimento.valor_total);

        const tabelaServicos = document.getElementById("viewServices");
        tabelaServicos.innerHTML = "";

        atendimento.servicos.forEach((servico) => {
            const linha = tabelaServicos.insertRow();
            linha.insertCell().textContent = servico.nome;
            linha.insertCell().textContent = servico.quantidade;
            linha.insertCell().textContent = formatarMoeda(servico.valorUnitario);
            linha.insertCell().textContent = formatarMoeda(servico.valor);
        });

        if (atendimento.servicos.length === 0) {
            const linha = tabelaServicos.insertRow();
            const celula = linha.insertCell();
            celula.colSpan = 4;
            celula.textContent = "Nenhum serviço vinculado.";
        }

        viewModal.classList.add("active");
    } catch (erro) {
        console.error("Erro ao visualizar atendimento:", erro);
        alert(erro.message);
    }
}

async function abrirEdicao(id) {
    window.location.href = `/criar_atendimentos?editar=${encodeURIComponent(id)}`;
    return;

    try {
        const atendimento = await obterAtendimento(id);
        const clienteSelect = document.getElementById("editCliente");
        clienteSelect.innerHTML = "";

        clientes.forEach((cliente) => {
            clienteSelect.add(new Option(cliente.nome, cliente.id, false,
                Number(cliente.id) === Number(atendimento.id_cliente)));
        });

        document.getElementById("editAtendimentoId").value = atendimento.id;
        document.getElementById("editDataAtendimento").value = atendimento.data_atendimento;
        document.getElementById("editStatus").value = atendimento.status;
        document.getElementById("editDataConclusao").value = atendimento.data_conclusao || "";
        editModal.classList.add("active");
    } catch (erro) {
        console.error("Erro ao abrir edição:", erro);
        alert(erro.message);
    }
}

document.getElementById("editForm").addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const id = Number(document.getElementById("editAtendimentoId").value);
    const atualizado = await atualizarAtendimento(id, {
        id_cliente: Number(document.getElementById("editCliente").value),
        status: document.getElementById("editStatus").value,
        data_atendimento: document.getElementById("editDataAtendimento").value,
        data_conclusao: document.getElementById("editDataConclusao").value || null
    });

    if (atualizado) closeEditModal();
});

function confirmarExclusao(id) {
    atendimentoSelecionado = id;
    deleteModal.classList.add("active");
}

async function excluirAtendimento() {
    if (!atendimentoSelecionado) return;

    try {
        const resposta = await fetch(`/api/atendimentos/${atendimentoSelecionado}`, {
            method: "DELETE"
        });
        const retorno = await resposta.json();

        if (!resposta.ok || !retorno.success) {
            throw new Error(retorno.erro || "Não foi possível excluir o atendimento.");
        }

        closeDeleteModal();
        await carregarAtendimentos();
    } catch (erro) {
        console.error("Erro ao excluir atendimento:", erro);
        alert(erro.message);
    }
}

function closeViewModal() { viewModal.classList.remove("active"); }
function closeEditModal() { editModal.classList.remove("active"); }
function closeDeleteModal() { deleteModal.classList.remove("active"); }

searchInput.addEventListener("input", filtrarAtendimentos);
filterType.addEventListener("change", filtrarAtendimentos);
sortOrder.addEventListener("change", filtrarAtendimentos);
confirmDelete.addEventListener("click", excluirAtendimento);

[viewModal, editModal, deleteModal].forEach((modal) => {
    modal.addEventListener("click", (evento) => {
        if (evento.target === modal) modal.classList.remove("active");
    });
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        closeViewModal();
        closeEditModal();
        closeDeleteModal();
    }
});

function opcoesPdfAtendimentos() {
    const listaFiltrada = obterAtendimentosFiltrados();
    return {
        titulo: "Lista de atendimentos",
        subtitulo: `Total de atendimentos exibidos: ${listaFiltrada.length}`,
        nomeArquivo: "lista_atendimentos.pdf",
        colunas: [
            { titulo: "Atendimento", chave: "nome", largura: 48 },
            { titulo: "Cliente", chave: "cliente", largura: 42 },
            { titulo: "Serviços", chave: "servicos", largura: 65 },
            { titulo: "Desconto", chave: "desconto", largura: 27 },
            { titulo: "Total", chave: "valorTotal", largura: 27 },
            { titulo: "Data", chave: "data", largura: 30 },
            { titulo: "Status", chave: "status", largura: 30 }
        ],
        linhas: listaFiltrada.map(atendimento => ({
            nome: atendimento.nome || `Atendimento #${atendimento.id}`,
            cliente: atendimento.cliente,
            servicos: atendimento.servicos,
            desconto: formatarMoeda(atendimento.desconto),
            valorTotal: formatarMoeda(atendimento.valor_total),
            data: formatarData(atendimento.data_atendimento),
            status: textoStatus(atendimento.status)
        }))
    };
}

document.getElementById("btnGerarPDF").addEventListener("click", () => {
    try {
        window.BLKPDF.baixar(opcoesPdfAtendimentos());
    } catch (erro) {
        alert(erro.message);
    }
});

document.getElementById("btnCompartilharPDF").addEventListener("click", async () => {
    try {
        await window.BLKPDF.compartilhar(opcoesPdfAtendimentos());
    } catch (erro) {
        alert(erro.message);
    }
});

Promise.all([carregarClientes(), carregarAtendimentos()]).catch((erro) => {
    console.error("Erro na inicialização:", erro);
    alert(erro.message);
});
