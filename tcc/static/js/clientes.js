// ========================================
// DADOS TEMPORÁRIOS
// ========================================

// REMOVER QUANDO O FLASK ESTIVER PRONTO

let clientes = [
    {
        id: 1,
        nome: "José Silva",
        telefone: "(81) 1111-1111",
        endereco: "Rua Exemplo",
        dataCadastro: "03/06/2026"
    },
    {
        id: 2,
        nome: "Arlindo",
        telefone: "(81) 2222-2222",
        endereco: "Rua Exemplo",
        dataCadastro: "03/06/2026"
    }
];

// Próximo ID disponível
let nextClientId = 3;

function renderClientes(lista = clientes) {

    const tbody =
        document.getElementById(
            "clientesTableBody"
        );

    tbody.innerHTML = "";

    lista.forEach(cliente => {

        tbody.innerHTML += `
            <tr>

                <td>${cliente.nome}</td>

                <td>${cliente.telefone}</td>

                <td>${cliente.dataCadastro}</td>

                <td>${cliente.endereco}</td>

                <td>${cliente.id}</td>

                <td>

                    <button
                        class="edit-btn"
                        onclick="openEditModal(${cliente.id})"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteClient(${cliente.id})"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </td>

            </tr>
        `;
    });

}

const searchInput =
    document.getElementById(
        "searchInput"
    );

searchInput.addEventListener(
    "input",
    () => {

        const termo =
            searchInput.value
            .toLowerCase();

        const filtrados =
            clientes.filter(cliente =>
                cliente.nome
                .toLowerCase()
                .includes(termo)
            );

        renderClientes(filtrados);
    }
);

const createModal =
    document.getElementById(
        "createModal"
    );

document
.getElementById("btnNovoCliente")
.addEventListener("click", () => {

    createModal.classList.add("active");

});

document
.getElementById("createForm")
.addEventListener("submit", (e) => {

    e.preventDefault();

    const novoCliente = {
        id: nextClientId++,
        nome: document.getElementById("createNome").value,
        telefone: document.getElementById("createTelefone").value,
        endereco: document.getElementById("createEndereco").value,
        dataCadastro: new Date().toLocaleDateString("pt-BR")
    };

    fetch("/pegar_cliente", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(novoCliente)
    })
    .then(response => response.json())
    .then(retorno => {
        console.log(retorno);
    })
    .catch(err => console.error(err));

    clientes.push(novoCliente);

    renderClientes();

    createModal.classList.remove("active");

    e.target.reset();

});

function openEditModal(id){

    const cliente =
        clientes.find(
            c => c.id === id
        );

    document
    .getElementById("editId")
    .value = cliente.id;

    document
    .getElementById("editNome")
    .value = cliente.nome;

    document
    .getElementById("editTelefone")
    .value = cliente.telefone;

    document
    .getElementById("editEndereco")
    .value = cliente.endereco;

    document
    .getElementById("editModal")
    .classList.add("active");
}

const editModal =
    document.getElementById(
        "editModal"
    );

function closeCreateModal() {

    createModal.classList.remove(
        "active"
    );

}

function closeEditModal() {

    editModal.classList.remove(
        "active"
    );

}

createModal.addEventListener(
    "click",
    (e) => {

        if (e.target === createModal) {

            closeCreateModal();

        }

    }
);

editModal.addEventListener(
    "click",
    (e) => {

        if (e.target === editModal) {

            closeEditModal();

        }

    }
);

function closeAllModals() {

    createModal.classList.remove(
        "active"
    );

    editModal.classList.remove(
        "active"
    );

}

document.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Escape") {

            closeAllModals();

        }

    }
);

document
.getElementById("editForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const id = Number(
        document.getElementById("editId").value
    );

    const dados = {

        nome:
            document.getElementById("editNome").value,

        telefone:
            document.getElementById("editTelefone").value,

        endereco:
            document.getElementById("editEndereco").value,
        id:
            Number(document.getElementById("editId").value)
    };

    try {
        console.log(dados);
        console.log(JSON.stringify(dados));
        

        var resposta = await fetch('/pegar_cliente', {
            
            
            method: "PUT",
            
            headers: {
                "Content-Type": "application/json"
            },
            
            body: JSON.stringify(dados)

        });

        console.log(resposta);
        
        if (!resposta.ok) {
            
            alert("Erro ao atualizar cliente.");
            return;

        }

        const cliente = clientes.find(c => c.id === id);

        cliente.nome = dados.nome;
        cliente.telefone = dados.telefone;
        cliente.endereco = dados.endereco;

        renderClientes();

        closeEditModal();

    }

    catch (erro) {

        console.error(erro);

    }

});
function deleteClient(id){

    if(
        !confirm(
            "Excluir cliente?"
        )
    ){
        return;
    }

    clientes =
        clientes.filter(
            cliente =>
                cliente.id !== id
        );

    renderClientes();

    /*
    ====================================
    FLASK FUTURO
    ====================================*/

    fetch("/pegar_cliente", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id:id }) 
    })
    .then(response => response.json())
    .then(data => {
        console.log("Resposta do servidor:", data);
    })
    .catch(error => {
        console.error("Erro na requisição:", error);
    });

}

/*
====================================
FLASK FUTURO
====================================*/

async function carregarClientes(){

    const resposta =
        await fetch(
            "/enviar_cliente"
        );

    clientes =await resposta.json();
    console.log(clientes)

    renderClientes();
}

carregarClientes();



renderClientes();