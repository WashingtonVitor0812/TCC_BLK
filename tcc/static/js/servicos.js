let servicos = [
    {
        id: 1,
        nome: "Limpeza Sofá 3 lugares",
        valorBase: 100,
        descricao: "Limpeza completa de sofá."
    },
    {
        id: 2,
        nome: "Limpeza Sofá 5 lugares",
        valorBase: 150,
        descricao: "Limpeza completa de sofá."
    }
];

let nextServicoId = 3;

function renderServicos(lista = servicos){

    const tbody =
        document.getElementById(
            "servicosTableBody"
        );

    tbody.innerHTML = "";

    lista.forEach(servico => {

        tbody.innerHTML += `
            <tr>

                <td>${servico.nome}</td>

                <td>
                    ${formatarMoeda(
                        servico.valorBase
                    )}
                </td>

                <td>
                    ${servico.descricao}
                </td>

                <td>

                    <button
                        class="edit-btn"
                        onclick="openEditModal(${servico.id})">

                        <i class="fa-solid fa-pen"></i>

                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteServico(${servico.id})">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>
        `;
    });

}

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

const createModal =
    document.getElementById(
        "createModal"
    );

document
.getElementById("btnNovoServico")
.addEventListener(
    "click",
    () => {

        createModal.classList.add(
            "active"
        );

    }
);

const editModal =
    document.getElementById(
        "editModal"
    );

function formatarMoeda(valor){

    return valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}

document
.getElementById("createForm")
.addEventListener(
    "submit",
    (e) => {

        e.preventDefault();

        const servico = {

            id: nextServicoId++,

            nome:
                document
                .getElementById("createNome")
                .value,

            valorBase:
                Number(
                    document
                    .getElementById("createValor")
                    .value
                ),

            descricao:
                document
                .getElementById("createDescricao")
                .value
        };

        servicos.push(servico);

    fetch("/pegar_servico", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(servico) // Converte objeto JS para JSON
            })
            .then(response => response.json())
            .then(retorno => {
                console.log("Resposta do servidor:", retorno);
            })
            .catch(err => console.error("Erro:", err));

        renderServicos();

        closeCreateModal();

        e.target.reset();

    }
);

function openEditModal(id){

    const servico =
        servicos.find(
            s => s.id === id
        );

    document
    .getElementById("editId")
    .value = servico.id;

    document
    .getElementById("editNome")
    .value = servico.nome;

    document
    .getElementById("editValor")
    .value = servico.valorBase;

    document
    .getElementById("editDescricao")
    .value = servico.descricao;

    editModal.classList.add(
        "active"
    );
}

document
.getElementById("editForm")
.addEventListener(
    "submit",
    (e) => {

        e.preventDefault();

        const id =
            Number(
                document
                .getElementById("editId")
                .value
            );

        const servico =
            servicos.find(
                s => s.id === id
            );
        servico.nome =
            document
            .getElementById("editNome")
            .value;

        servico.valorBase =
            Number(
                document
                .getElementById("editValor")
                .value
            );

        servico.descricao =
            document
            .getElementById("editDescricao")
            .value;
        const servicoEdit={nome:servico.nome,valor:servico.valorBase,descricao:servico.descricao,id:id}
        fetch("/pegar_servico", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(servicoEdit)
        })
        .then(response => response.json())
        .then(retorno => {
            console.log(retorno);
        })
        .catch(err => console.error(err));

        renderServicos();

        closeEditModal();

    }
);

function deleteServico(id){

    if(
        !confirm(
            "Excluir serviço?"
        )
    ){
        return;
    }

    servicos =
        servicos.filter(
            s => s.id !== id
        );

    renderServicos();

    fetch("/pegar_servico", {
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

const searchInput =
    document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const termo =
                searchInput.value
                .toLowerCase();

            const filtrados =
                servicos.filter(servico =>
                    servico.nome
                    .toLowerCase()
                    .includes(termo)
                );

            renderServicos(filtrados);
        }
    );

}