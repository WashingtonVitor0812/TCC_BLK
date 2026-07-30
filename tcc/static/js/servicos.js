let servicos = [];

const createModal = document.getElementById("createModal");
const editModal = document.getElementById("editModal");
const tabelaServicos = document.getElementById("servicosTableBody");
const searchInput = document.getElementById("searchInput");

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function closeCreateModal() { createModal.classList.remove("active"); }
function closeEditModal() { editModal.classList.remove("active"); }

function criarBotao(classe, icone, rotulo, aoClicar) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = classe;
    botao.setAttribute("aria-label", rotulo);
    botao.innerHTML = `<i class="fa-solid ${icone}"></i>`;
    botao.addEventListener("click", aoClicar);
    return botao;
}

function renderServicos(lista = servicos) {
    tabelaServicos.innerHTML = "";
    if (lista.length === 0) {
        const linha = tabelaServicos.insertRow();
        const celula = linha.insertCell();
        celula.colSpan = 4;
        celula.textContent = "Nenhum serviço encontrado.";
        return;
    }

    lista.forEach((servico) => {
        const linha = tabelaServicos.insertRow();
        linha.insertCell().textContent = servico.nome;
        linha.insertCell().textContent = formatarMoeda(servico.valorBase);
        linha.insertCell().textContent = servico.descricao || "";
        const acoes = linha.insertCell();
        acoes.append(
            criarBotao("edit-btn", "fa-pen", "Editar serviço", () => openEditModal(servico.id)),
            criarBotao("delete-btn", "fa-trash", "Excluir serviço", () => deleteServico(servico.id))
        );
    });
}

async function respostaJson(resposta) {
    const retorno = await resposta.json();
    if (!resposta.ok || !retorno.success) {
        throw new Error(retorno.erro || "Não foi possível concluir a operação.");
    }
    return retorno;
}

async function carregarServicos() {
    try {
        const resposta = await fetch("/api/servicos");
        if (!resposta.ok) throw new Error("Não foi possível carregar os serviços.");
        const dados = await resposta.json();
        if (!Array.isArray(dados)) throw new Error("A resposta do servidor é inválida.");
        servicos = dados;
        filtrarServicos();
    } catch (erro) {
        console.error("Erro ao carregar serviços:", erro);
        alert(erro.message);
    }
}

function filtrarServicos() {
    const termo = searchInput.value.trim().toLowerCase();
    renderServicos(servicos.filter((servico) =>
        servico.nome.toLowerCase().includes(termo) ||
        (servico.descricao || "").toLowerCase().includes(termo)
    ));
}

function dadosFormulario(prefixo) {
    return {
        nome: document.getElementById(`${prefixo}Nome`).value.trim(),
        valorBase: Number(document.getElementById(`${prefixo}Valor`).value),
        descricao: document.getElementById(`${prefixo}Descricao`).value.trim()
    };
}

function validarServico(servico) {
    if (!servico.nome || !Number.isFinite(servico.valorBase) || servico.valorBase < 0) {
        alert("Informe o nome e um valor base válido.");
        return false;
    }
    return true;
}

document.getElementById("btnNovoServico").addEventListener("click", () => {
    document.getElementById("createForm").reset();
    createModal.classList.add("active");
    document.getElementById("createNome").focus();
});

document.getElementById("createForm").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const servico = dadosFormulario("create");
    if (!validarServico(servico)) return;
    try {
        await respostaJson(await fetch("/pegar_servico", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(servico)
        }));
        closeCreateModal();
        evento.target.reset();
        await carregarServicos();
    } catch (erro) {
        console.error("Erro ao cadastrar serviço:", erro);
        alert(erro.message);
    }
});

function openEditModal(id) {
    const servico = servicos.find((item) => Number(item.id) === Number(id));
    if (!servico) return alert("Serviço não encontrado.");
    document.getElementById("editId").value = servico.id;
    document.getElementById("editNome").value = servico.nome;
    document.getElementById("editValor").value = servico.valorBase;
    document.getElementById("editDescricao").value = servico.descricao || "";
    editModal.classList.add("active");
    document.getElementById("editNome").focus();
}

document.getElementById("editForm").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const servico = { id: Number(document.getElementById("editId").value), ...dadosFormulario("edit") };
    if (!validarServico(servico)) return;
    try {
        await respostaJson(await fetch("/pegar_servico", {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(servico)
        }));
        closeEditModal();
        await carregarServicos();
    } catch (erro) {
        console.error("Erro ao atualizar serviço:", erro);
        alert(erro.message);
    }
});

async function deleteServico(id) {
    if (!confirm("Deseja realmente excluir este serviço?")) return;
    try {
        await respostaJson(await fetch("/pegar_servico", {
            method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id })
        }));
        await carregarServicos();
    } catch (erro) {
        console.error("Erro ao excluir serviço:", erro);
        alert(erro.message);
    }
}

createModal.addEventListener("click", (evento) => {
    if (evento.target === createModal) closeCreateModal();
});
editModal.addEventListener("click", (evento) => {
    if (evento.target === editModal) closeEditModal();
});
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        closeCreateModal();
        closeEditModal();
    }
});
searchInput.addEventListener("input", filtrarServicos);

carregarServicos();
