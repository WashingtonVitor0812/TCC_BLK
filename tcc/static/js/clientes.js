// ============================================================
// DADOS
// ============================================================

// Esta variável representa os clientes atualmente
// carregados do banco de dados através do Flask.

let clientes = [];


// ============================================================
// ELEMENTOS DA PÁGINA
// ============================================================

const searchInput =
    document.getElementById("searchInput");

const filterType =
    document.getElementById("filterType");

const createModal =
    document.getElementById("createModal");

const editModal =
    document.getElementById("editModal");

const clientesTableBody =
    document.getElementById("clientesTableBody");

const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const deleteConfirmName = document.getElementById("deleteConfirmName");
let clienteParaExcluir = null;


// ============================================================
// RENDERIZAÇÃO DOS CLIENTES
// ============================================================

function renderClientes(lista = clientes) {

    clientesTableBody.innerHTML = "";


    // Caso não existam clientes

    if (lista.length === 0) {

        const tr =
            document.createElement("tr");

        const td =
            document.createElement("td");

        td.colSpan = 6;

        td.textContent =
            "Nenhum cliente encontrado.";

        tr.appendChild(td);

        clientesTableBody.appendChild(tr);

        return;
    }


    // Cria cada linha da tabela

    lista.forEach(cliente => {

        const tr =
            document.createElement("tr");


        // ----------------------------------------
        // Nome
        // ----------------------------------------

        const tdNome =
            document.createElement("td");

        tdNome.textContent =
            cliente.nome || "";

        tr.appendChild(tdNome);


        // ----------------------------------------
        // Telefone
        // ----------------------------------------

        const tdTelefone =
            document.createElement("td");

        tdTelefone.textContent =
            cliente.telefone || "";

        tr.appendChild(tdTelefone);


        // ----------------------------------------
        // Data de cadastro
        // ----------------------------------------

        const tdData =
            document.createElement("td");

        tdData.textContent =
            formatarData(cliente.dataCadastro);

        tr.appendChild(tdData);


        // ----------------------------------------
        // Endereço
        // ----------------------------------------

        const tdEndereco =
            document.createElement("td");

        tdEndereco.textContent =
            cliente.endereco || "";

        tr.appendChild(tdEndereco);


        // ----------------------------------------
        // ID
        // ----------------------------------------

        const tdId =
            document.createElement("td");

        tdId.textContent =
            cliente.id;

        tr.appendChild(tdId);


        // ----------------------------------------
        // Ações
        // ----------------------------------------

        const tdAcoes =
            document.createElement("td");


        // Botão editar

        const botaoEditar =
            document.createElement("button");

        botaoEditar.type = "button";

        botaoEditar.className =
            "edit-btn";

        botaoEditar.setAttribute(
            "aria-label",
            "Editar cliente"
        );


        const iconeEditar =
            document.createElement("i");

        iconeEditar.className =
            "fa-solid fa-pen";


        botaoEditar.appendChild(
            iconeEditar
        );


        botaoEditar.addEventListener(
            "click",
            () => {

                openEditModal(
                    cliente.id
                );

            }
        );


        // Botão excluir

        const botaoExcluir =
            document.createElement("button");

        botaoExcluir.type = "button";

        botaoExcluir.className =
            "delete-btn";

        botaoExcluir.setAttribute(
            "aria-label",
            "Excluir cliente"
        );


        const iconeExcluir =
            document.createElement("i");

        iconeExcluir.className =
            "fa-solid fa-trash";


        botaoExcluir.appendChild(
            iconeExcluir
        );


        botaoExcluir.addEventListener(
            "click",
            () => {

                deleteClient(
                    cliente.id
                );

            }
        );


        tdAcoes.appendChild(
            botaoEditar
        );

        tdAcoes.appendChild(
            botaoExcluir
        );


        tr.appendChild(tdAcoes);


        // Adiciona a linha à tabela

        clientesTableBody.appendChild(tr);

    });

}


// ============================================================
// FORMATAÇÃO DA DATA
// ============================================================

function formatarData(data) {

    if (!data) {
        return "";
    }


    /*
        O Flask envia a data como:

        YYYY-MM-DD

        Exemplo:

        2026-07-30

        A função transforma para:

        30/07/2026
    */

    const partes =
        data.split("-");


    if (partes.length !== 3) {

        return data;

    }


    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );

}


// ============================================================
// CARREGAR CLIENTES
// ============================================================

async function carregarClientes() {

    try {

        const resposta =
            await fetch(
                "/api/clientes"
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao carregar clientes."
            );

        }


        clientes =
            await resposta.json();


        renderClientes();

    }

    catch (erro) {

        console.error(
            "Erro:",
            erro
        );


        alert(
            "Não foi possível carregar os clientes."
        );

    }

}


// ============================================================
// PESQUISA
// ============================================================

searchInput.addEventListener(
    "input",
    () => {

        const termo =
            searchInput.value
                .trim()
                .toLowerCase();

        const filtro =
            filterType.value;


        const filtrados =
            clientes.filter(
                cliente => {

                    const nome =
                        (
                            cliente.nome || ""
                        ).toLowerCase();


                    const telefone =
                        (
                            cliente.telefone || ""
                        ).toLowerCase();


                    const endereco =
                        (
                            cliente.endereco || ""
                        ).toLowerCase();


                    const id =
                        String(
                            cliente.id || ""
                        );


                    if (filtro === "nome") {
                        return nome.includes(termo);
                    }

                    if (filtro === "telefone") {
                        return telefone.includes(termo);
                    }

                    if (filtro === "dataCadastro") {
                        return formatarData(cliente.dataCadastro)
                            .toLowerCase()
                            .includes(termo);
                    }

                    if (filtro === "endereco") {
                        return endereco.includes(termo);
                    }

                    if (filtro === "id") {
                        return id.includes(termo);
                    }

                    return nome.includes(termo) ||
                        telefone.includes(termo) ||
                        endereco.includes(termo) ||
                        id.includes(termo) ||
                        formatarData(cliente.dataCadastro)
                            .toLowerCase()
                            .includes(termo);

                }
            );


        renderClientes(
            filtrados
        );

    }
);

filterType.addEventListener(
    "change",
    () => searchInput.dispatchEvent(new Event("input"))
);


// ============================================================
// ABRIR MODAL DE CRIAÇÃO
// ============================================================

document
    .getElementById("btnNovoCliente")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("createForm")
                .reset();


            createModal.classList.add(
                "active"
            );


            document
                .getElementById("createNome")
                .focus();

        }
    );


// ============================================================
// CREATE — CADASTRAR CLIENTE
// ============================================================

document
    .getElementById("createForm")
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            // ----------------------------------------
            // Coleta os dados
            // ----------------------------------------

            const dados = {

                nome:
                    document
                        .getElementById("createNome")
                        .value
                        .trim(),

                telefone:
                    document
                        .getElementById("createTelefone")
                        .value
                        .trim(),

                endereco:
                    document
                        .getElementById("createEndereco")
                        .value
                        .trim()

            };


            // ----------------------------------------
            // Validação básica
            // ----------------------------------------

            if (
                !dados.nome ||
                !dados.telefone ||
                !dados.endereco
            ) {

                alert(
                    "Preencha todos os campos."
                );

                return;

            }


            try {

                // ------------------------------------
                // Envia para o Flask
                // ------------------------------------

                const resposta =
                    await fetch(
                        "/pegar_cliente",
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


                // ------------------------------------
                // Lê resposta
                // ------------------------------------

                const retorno =
                    await resposta.json();


                // ------------------------------------
                // Verifica erro
                // ------------------------------------

                if (
                    !resposta.ok ||
                    !retorno.success
                ) {

                    alert(
                        retorno.erro ||
                        "Erro ao cadastrar cliente."
                    );

                    return;

                }


                // ------------------------------------
                // Sucesso
                // ------------------------------------

                closeCreateModal();


                document
                    .getElementById("createForm")
                    .reset();


                // Recarrega os dados do banco

                await carregarClientes();

            }

            catch (erro) {

                console.error(
                    "Erro ao cadastrar:",
                    erro
                );


                alert(
                    "Erro de comunicação com o servidor."
                );

            }

        }
    );


// ============================================================
// ABRIR MODAL DE EDIÇÃO
// ============================================================

function openEditModal(id) {

    const cliente =
        clientes.find(
            c => Number(c.id) === Number(id)
        );


    if (!cliente) {

        alert(
            "Cliente não encontrado."
        );

        return;

    }


    // ----------------------------------------
    // Preenche os campos
    // ----------------------------------------

    document
        .getElementById("editId")
        .value =
            cliente.id;


    document
        .getElementById("editNome")
        .value =
            cliente.nome || "";


    document
        .getElementById("editTelefone")
        .value =
            cliente.telefone || "";


    document
        .getElementById("editEndereco")
        .value =
            cliente.endereco || "";


    // ----------------------------------------
    // Abre modal
    // ----------------------------------------

    editModal.classList.add(
        "active"
    );


    document
        .getElementById("editNome")
        .focus();

}


// ============================================================
// UPDATE — EDITAR CLIENTE
// ============================================================

document
    .getElementById("editForm")
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            // ----------------------------------------
            // ID
            // ----------------------------------------

            const id =
                Number(
                    document
                        .getElementById("editId")
                        .value
                );


            // ----------------------------------------
            // Dados
            // ----------------------------------------

            const dados = {

                id: id,

                nome:
                    document
                        .getElementById("editNome")
                        .value
                        .trim(),

                telefone:
                    document
                        .getElementById("editTelefone")
                        .value
                        .trim(),

                endereco:
                    document
                        .getElementById("editEndereco")
                        .value
                        .trim()

            };


            // ----------------------------------------
            // Validação
            // ----------------------------------------

            if (
                !dados.nome ||
                !dados.telefone ||
                !dados.endereco
            ) {

                alert(
                    "Preencha todos os campos."
                );

                return;

            }


            try {

                // ------------------------------------
                // Envia para o Flask
                // ------------------------------------

                const resposta =
                    await fetch(
                        "/pegar_cliente",
                        {

                            method: "PUT",

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


                // ------------------------------------
                // Resposta
                // ------------------------------------

                const retorno =
                    await resposta.json();


                // ------------------------------------
                // Erro
                // ------------------------------------

                if (
                    !resposta.ok ||
                    !retorno.success
                ) {

                    alert(
                        retorno.erro ||
                        "Erro ao atualizar cliente."
                    );

                    return;

                }


                // ------------------------------------
                // Sucesso
                // ------------------------------------

                closeEditModal();


                // Recarrega diretamente do banco

                await carregarClientes();

            }

            catch (erro) {

                console.error(
                    "Erro ao atualizar:",
                    erro
                );


                alert(
                    "Erro de comunicação com o servidor."
                );

            }

        }
    );


// ============================================================
// DELETE — EXCLUIR CLIENTE
// ============================================================

async function deleteClient(id) {

    const cliente = clientes.find(item => Number(item.id) === Number(id));
    if (!cliente) return;

    clienteParaExcluir = cliente;
    deleteConfirmName.textContent = cliente.nome || "este cliente";
    deleteConfirmModal.classList.add("active");
}

async function executarExclusaoCliente() {

    if (!clienteParaExcluir) return;
    const id = clienteParaExcluir.id;

    // ----------------------------------------
    // Confirmação
    // ----------------------------------------

    try {

        // ------------------------------------
        // Envia DELETE para o Flask
        // ------------------------------------

        const resposta =
            await fetch(
                "/pegar_cliente",
                {

                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            id: id
                        })

                }
            );


        // ------------------------------------
        // Resposta
        // ------------------------------------

        const retorno =
            await resposta.json();


        // ------------------------------------
        // Erro
        // ------------------------------------

        if (
            !resposta.ok ||
            !retorno.success
        ) {

            alert(
                retorno.erro ||
                "Erro ao excluir cliente."
            );

            return;

        }


        // ------------------------------------
        // Sucesso
        // ------------------------------------

        await carregarClientes();
        fecharConfirmacaoExclusao();

    }

    catch (erro) {

        console.error(
            "Erro ao excluir:",
            erro
        );


        alert(
            "Erro de comunicação com o servidor."
        );

    }

}

function fecharConfirmacaoExclusao() {
    deleteConfirmModal.classList.remove("active");
    clienteParaExcluir = null;
}

deleteConfirmModal.addEventListener("click", event => {
    if (event.target === deleteConfirmModal) fecharConfirmacaoExclusao();
});
document.getElementById("closeDeleteConfirm").addEventListener("click", fecharConfirmacaoExclusao);
document.getElementById("cancelDeleteConfirm").addEventListener("click", fecharConfirmacaoExclusao);
document.getElementById("confirmDeleteAction").addEventListener("click", executarExclusaoCliente);


// ============================================================
// FECHAR MODAL DE CRIAÇÃO
// ============================================================

function closeCreateModal() {

    createModal.classList.remove(
        "active"
    );

}


// ============================================================
// FECHAR MODAL DE EDIÇÃO
// ============================================================

function closeEditModal() {

    editModal.classList.remove(
        "active"
    );

}


// ============================================================
// FECHAR TODOS OS MODAIS
// ============================================================

function closeAllModals() {

    closeCreateModal();

    closeEditModal();

}


// ============================================================
// CLICAR FORA DO MODAL
// ============================================================

createModal.addEventListener(
    "click",
    (e) => {

        if (
            e.target === createModal
        ) {

            closeCreateModal();

        }

    }
);


editModal.addEventListener(
    "click",
    (e) => {

        if (
            e.target === editModal
        ) {

            closeEditModal();

        }

    }
);


// ============================================================
// TECLA ESC
// ============================================================

document.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Escape") {

            closeAllModals();

        }

    }
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

carregarClientes();
