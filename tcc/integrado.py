import flask
import flask_cors
from functools import wraps
import mysql.connector


# ============================================================
# CONEXÃO COM O BANCO
# ============================================================

def conecta():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="@C15@w08@Z22@d15",
        database="sistema_atendimento"
    )


# ============================================================
# TABELAS PERMITIDAS PELO CRUD
# ============================================================

TABELAS_PERMITIDAS = {
    "Cliente",
    "Atendimento",
    "Servico",
    "Atendimento_Servico",
    "Lembrete"
}


# ============================================================
# CRUD - CREATE
# ============================================================

def criar(nometabela: str, **dados):

    conexao = conecta()
    cursor = conexao.cursor()

    try:

        if nometabela not in TABELAS_PERMITIDAS:
            raise ValueError("Tabela não permitida.")

        if not dados:
            raise ValueError("Nenhum dado foi informado.")

        colunas = ", ".join(dados.keys())
        placeholders = ", ".join(["%s"] * len(dados))

        comando = f"""
            INSERT INTO {nometabela} ({colunas})
            VALUES ({placeholders})
        """

        valores = tuple(dados.values())

        cursor.execute(comando, valores)
        conexao.commit()

        return cursor.lastrowid

    except Exception:
        conexao.rollback()
        raise

    finally:
        cursor.close()
        conexao.close()


# ============================================================
# CRUD - READ
# ============================================================

def ler(nometabela: str, **filtros):

    conexao = conecta()
    cursor = conexao.cursor(dictionary=True)

    try:

        if nometabela not in TABELAS_PERMITIDAS:
            raise ValueError("Tabela não permitida.")

        comando = f"SELECT * FROM {nometabela}"
        valores = []

        if filtros:

            condicoes = []

            for coluna, valor in filtros.items():

                condicoes.append(f"{coluna} = %s")
                valores.append(valor)

            comando += " WHERE " + " AND ".join(condicoes)

        cursor.execute(comando, tuple(valores))

        return cursor.fetchall()

    finally:

        cursor.close()
        conexao.close()


# ============================================================
# CRUD - UPDATE
# ============================================================

def atualizar(nometabela: str, coluna_id: str, id_valor, **dados):

    conexao = conecta()
    cursor = conexao.cursor()

    try:

        if not dados:
            raise ValueError(
                "Nenhum dado foi informado para atualização."
            )

        if nometabela not in TABELAS_PERMITIDAS:
            raise ValueError("Tabela não permitida.")

        alteracoes = ", ".join(
            f"{coluna} = %s"
            for coluna in dados.keys()
        )

        comando = f"""
            UPDATE {nometabela}
            SET {alteracoes}
            WHERE {coluna_id} = %s
        """

        valores = list(dados.values())
        valores.append(id_valor)

        cursor.execute(comando, tuple(valores))
        conexao.commit()

        return cursor.rowcount

    except Exception:
        conexao.rollback()
        raise

    finally:

        cursor.close()
        conexao.close()


# ============================================================
# CRUD - DELETE
# ============================================================

def delete(nometabela: str, coluna_id: str, id_valor):

    conexao = conecta()
    cursor = conexao.cursor()

    try:

        if nometabela not in TABELAS_PERMITIDAS:
            raise ValueError("Tabela não permitida.")

        comando = f"""
            DELETE FROM {nometabela}
            WHERE {coluna_id} = %s
        """

        cursor.execute(comando, (id_valor,))
        conexao.commit()

        return cursor.rowcount

    except Exception:
        conexao.rollback()
        raise

    finally:

        cursor.close()
        conexao.close()


# ============================================================
# FLASK
# ============================================================

app = flask.Flask(__name__)

app.secret_key = "essa segurança é um bo****"

flask_cors.CORS(app)


# ============================================================
# AUTENTICAÇÃO
# ============================================================

def login_required(f):

    @wraps(f)
    def decorated_function(*args, **kwargs):

        if "logado" not in flask.session:
            return flask.redirect(
                flask.url_for("login")
            )

        return f(*args, **kwargs)

    return decorated_function


# ============================================================
# AGENDA
# ============================================================

@app.route('/agenda', methods=["GET"])
@login_required
def agenda():

    conexao = conecta()
    cursor = conexao.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                l.ID_lembrete,
                l.ID_atendimento,
                l.data_lembrete,
                l.descricao,

                a.ID_cliente,

                c.nome_cliente,

                GROUP_CONCAT(
                    s.nome_servico
                    SEPARATOR ', '
                ) AS servicos

            FROM Lembrete l

            LEFT JOIN Atendimento a
                ON l.ID_atendimento = a.ID_atendimento

            LEFT JOIN Cliente c
                ON a.ID_cliente = c.ID_cliente

            LEFT JOIN Atendimento_Servico ats
                ON a.ID_atendimento = ats.ID_atendimento

            LEFT JOIN Servico s
                ON ats.ID_servico = s.ID_servico

            GROUP BY
                l.ID_lembrete,
                l.ID_atendimento,
                l.data_lembrete,
                l.descricao,
                a.ID_cliente,
                c.nome_cliente

            ORDER BY
                l.data_lembrete ASC
        """)

        lembretes_db = cursor.fetchall()

        dados = []

        for lembrete in lembretes_db:

            nome_cliente = (
                lembrete["nome_cliente"]
                or "Atendimento não encontrado"
            )

            servicos = (
                lembrete["servicos"]
                or "Sem serviço informado"
            )

            titulo = f"{nome_cliente} — {servicos}"

            dados.append({

                "id": lembrete["ID_lembrete"],

                "id_atendimento":
                    lembrete["ID_atendimento"],

                "data":
                    str(lembrete["data_lembrete"]),

                "atendimento":
                    titulo,

                "descricao":
                    lembrete["descricao"] or ""

            })

        return flask.render_template(
            "agenda.html",
            dados=dados
        )

    finally:

        cursor.close()
        conexao.close()


# ============================================================
# API DE ATENDIMENTOS PARA A AGENDA
# ============================================================

@app.route('/api/atendimentos', methods=["GET"])
@login_required
def api_atendimentos():

    conexao = conecta()
    cursor = conexao.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                a.ID_atendimento,
                a.ID_cliente,
                a.status,
                a.data_atendimento,
                a.data_conclusao,
                a.valor_total,

                c.nome_cliente,

                GROUP_CONCAT(
                    s.nome_servico
                    SEPARATOR ', '
                ) AS servicos

            FROM Atendimento a

            LEFT JOIN Cliente c
                ON a.ID_cliente = c.ID_cliente

            LEFT JOIN Atendimento_Servico ats
                ON a.ID_atendimento = ats.ID_atendimento

            LEFT JOIN Servico s
                ON ats.ID_servico = s.ID_servico

            GROUP BY
                a.ID_atendimento,
                a.ID_cliente,
                a.status,
                a.data_atendimento,
                a.data_conclusao,
                a.valor_total,
                c.nome_cliente

            ORDER BY
                a.data_atendimento DESC
        """)

        atendimentos_db = cursor.fetchall()

        atendimentos = []


        for atendimento in atendimentos_db:

            nome_cliente = (
                atendimento["nome_cliente"]
                or "Cliente não encontrado"
            )


            servicos = (
                atendimento["servicos"]
                or "Sem serviço informado"
            )


            atendimentos.append({

                "id":
                    atendimento["ID_atendimento"],

                "id_cliente":
                    atendimento["ID_cliente"],

                "cliente":
                    nome_cliente,

                "servicos":
                    servicos,

                "titulo":
                    f"{nome_cliente} — {servicos}",

                "status":
                    atendimento["status"]
                    or "SEM STATUS",

                "data_atendimento":
                    str(
                        atendimento["data_atendimento"]
                    )
                    if atendimento["data_atendimento"]
                    else None,

                "data_conclusao":
                    str(
                        atendimento["data_conclusao"]
                    )
                    if atendimento["data_conclusao"]
                    else None,

                "valor_total":
                    float(
                        atendimento["valor_total"]
                    )
                    if atendimento["valor_total"] is not None
                    else None

            })


        return flask.jsonify(
            atendimentos
        )


    finally:

        cursor.close()
        conexao.close()


# ============================================================
# CRIAR LEMBRETE
# ============================================================

@app.route('/pegar_dados', methods=["POST"])
@login_required
def pegar_dados():

    try:

        dados = flask.request.get_json(force=True)

        if not isinstance(dados, dict):

            return flask.jsonify({
                "success": False,
                "erro": "Formato inválido."
            }), 400

        data = dados.get("data")
        descricao = dados.get("descricao")
        id_atendimento = dados.get("id_atendimento")

        if not data:

            return flask.jsonify({
                "success": False,
                "erro": "Data não informada."
            }), 400

        if not id_atendimento:

            return flask.jsonify({
                "success": False,
                "erro": "Atendimento não informado."
            }), 400

        # Verifica se o atendimento realmente existe
        atendimento = ler(
            "Atendimento",
            ID_atendimento=id_atendimento
        )

        if not atendimento:

            return flask.jsonify({
                "success": False,
                "erro": "Atendimento não encontrado."
            }), 404

        id_lembrete = criar(
            "Lembrete",

            ID_atendimento=id_atendimento,

            data_lembrete=data,

            descricao=descricao
        )

        return flask.jsonify({

            "success": True,

            "id": id_lembrete

        })

    except Exception as e:

        return flask.jsonify({

            "success": False,

            "erro": str(e)

        }), 500


# ============================================================
# EDITAR LEMBRETE
# ============================================================

@app.route("/editar_lembrete", methods=["PUT"])
@login_required
def editar_lembrete():

    try:

        dados = flask.request.get_json(force=True)

        if not isinstance(dados, dict):

            return flask.jsonify({
                "success": False,
                "erro": "Formato inválido."
            }), 400

        id_lembrete = dados.get("id")

        data = dados.get("data")

        descricao = dados.get("descricao")

        id_atendimento = dados.get("id_atendimento")

        if not id_lembrete:

            return flask.jsonify({
                "success": False,
                "erro": "ID do lembrete não informado."
            }), 400

        if not data:

            return flask.jsonify({
                "success": False,
                "erro": "Data não informada."
            }), 400

        if not id_atendimento:

            return flask.jsonify({
                "success": False,
                "erro": "Atendimento não informado."
            }), 400

        atendimento = ler(
            "Atendimento",
            ID_atendimento=id_atendimento
        )

        if not atendimento:

            return flask.jsonify({
                "success": False,
                "erro": "Atendimento não encontrado."
            }), 404

        quantidade = atualizar(

            "Lembrete",

            "ID_lembrete",

            id_lembrete,

            ID_atendimento=id_atendimento,

            data_lembrete=data,

            descricao=descricao
        )

        if quantidade == 0:

            return flask.jsonify({

                "success": False,

                "erro": "Lembrete não encontrado."

            }), 404

        return flask.jsonify({

            "success": True,

            "mensagem": "Lembrete atualizado."

        })

    except Exception as e:

        return flask.jsonify({

            "success": False,

            "erro": str(e)

        }), 500


# ============================================================
# EXCLUIR LEMBRETE
# ============================================================

@app.route("/excluir_lembrete", methods=["DELETE"])
@login_required
def excluir_lembrete():

    try:

        dados = flask.request.get_json(force=True)

        if not isinstance(dados, dict):

            return flask.jsonify({
                "success": False,
                "erro": "Formato inválido."
            }), 400

        id_lembrete = dados.get("id")

        if not id_lembrete:

            return flask.jsonify({
                "success": False,
                "erro": "ID do lembrete não informado."
            }), 400

        quantidade = delete(

            "Lembrete",

            "ID_lembrete",

            id_lembrete
        )

        if quantidade == 0:

            return flask.jsonify({

                "success": False,

                "erro": "Lembrete não encontrado."

            }), 404

        return flask.jsonify({

            "success": True,

            "mensagem": "Lembrete excluído."

        })

    except Exception as e:

        return flask.jsonify({

            "success": False,

            "erro": str(e)

        }), 500


# ============================================================
# CLIENTES
# ============================================================

@app.route('/pegar_cliente',
           methods=["POST", "PUT", "DELETE"])
@login_required
def pegar_cliente():

    # --------------------------
    # CREATE
    # --------------------------

    if flask.request.method == "POST":

        try:

            dados = flask.request.get_json(force=True)

            if not isinstance(dados, dict):

                return flask.jsonify({
                    "erro": "Formato inválido"
                }), 400

            id_cliente = criar(

                "Cliente",

                nome_cliente=dados.get("nome"),

                telefone=dados.get("telefone"),

                data_cadastro=dados.get("dataCadastro"),

                endereco=dados.get("endereco")

            )

            return flask.jsonify({

                "success": True,

                "id": id_cliente

            })

        except Exception as e:

            return flask.jsonify({

                "erro": str(e)

            }), 500


    # --------------------------
    # UPDATE
    # --------------------------

    if flask.request.method == "PUT":

        try:

            dados = flask.request.get_json(force=True)

            if not isinstance(dados, dict):

                return flask.jsonify({
                    "erro": "Formato inválido"
                }), 400

            id_cliente = dados.get("id")

            if not id_cliente:

                return flask.jsonify({
                    "erro": "ID do cliente não informado"
                }), 400

            quantidade = atualizar(

                "Cliente",

                "ID_cliente",

                id_cliente,

                nome_cliente=dados.get("nome"),

                telefone=dados.get("telefone"),

                endereco=dados.get("endereco")

            )

            if quantidade == 0:

                return flask.jsonify({

                    "success": False,

                    "erro": "Cliente não encontrado"

                }), 404

            return flask.jsonify({

                "success": True,

                "mensagem": "Cliente atualizado"

            })

        except Exception as e:

            return flask.jsonify({

                "erro": str(e)

            }), 500


    # --------------------------
    # DELETE
    # --------------------------

    if flask.request.method == "DELETE":

        try:

            dados = flask.request.get_json(force=True)

            if not isinstance(dados, dict):

                return flask.jsonify({
                    "erro": "Formato inválido"
                }), 400

            id_cliente = dados.get("id")

            if not id_cliente:

                return flask.jsonify({
                    "erro": "ID do cliente não informado"
                }), 400

            quantidade = delete(

                "Cliente",

                "ID_cliente",

                id_cliente

            )

            if quantidade == 0:

                return flask.jsonify({

                    "success": False,

                    "erro": "Cliente não encontrado"

                }), 404

            return flask.jsonify({

                "success": True,

                "mensagem": "Cliente excluído"

            })

        except Exception as e:

            return flask.jsonify({

                "erro": str(e)

            }), 500


# ============================================================
# SERVIÇOS
# ============================================================

@app.route('/pegar_servico',
           methods=["POST", "PUT", "DELETE"])
@login_required
def pegar_servico():

    # --------------------------
    # CREATE
    # --------------------------

    if flask.request.method == "POST":

        try:

            dados = flask.request.get_json(force=True)

            if not isinstance(dados, dict):

                return flask.jsonify({
                    "erro": "Formato inválido"
                }), 400

            id_servico = criar(

                "Servico",

                nome_servico=dados.get("nome"),

                valor_base=dados.get("valorBase"),

                descricao=dados.get("descricao")

            )

            return flask.jsonify({

                "success": True,

                "id": id_servico

            })

        except Exception as e:

            return flask.jsonify({

                "erro": str(e)

            }), 500


    # --------------------------
    # UPDATE
    # --------------------------

    if flask.request.method == "PUT":

        try:

            dados = flask.request.get_json(force=True)

            if not isinstance(dados, dict):

                return flask.jsonify({
                    "erro": "Formato inválido"
                }), 400

            id_servico = dados.get("id")

            if not id_servico:

                return flask.jsonify({
                    "erro": "ID do serviço não informado"
                }), 400

            quantidade = atualizar(

                "Servico",

                "ID_servico",

                id_servico,

                nome_servico=dados.get("nome"),

                valor_base=dados.get("valorBase"),

                descricao=dados.get("descricao")

            )

            if quantidade == 0:

                return flask.jsonify({

                    "success": False,

                    "erro": "Serviço não encontrado"

                }), 404

            return flask.jsonify({

                "success": True,

                "mensagem": "Serviço atualizado"

            })

        except Exception as e:

            return flask.jsonify({

                "erro": str(e)

            }), 500


    # --------------------------
    # DELETE
    # --------------------------

    if flask.request.method == "DELETE":

        try:

            dados = flask.request.get_json(force=True)

            if not isinstance(dados, dict):

                return flask.jsonify({
                    "erro": "Formato inválido"
                }), 400

            id_servico = dados.get("id")

            if not id_servico:

                return flask.jsonify({
                    "erro": "ID do serviço não informado"
                }), 400

            quantidade = delete(

                "Servico",

                "ID_servico",

                id_servico

            )

            if quantidade == 0:

                return flask.jsonify({

                    "success": False,

                    "erro": "Serviço não encontrado"

                }), 404

            return flask.jsonify({

                "success": True,

                "mensagem": "Serviço excluído"

            })

        except Exception as e:

            return flask.jsonify({

                "erro": str(e)

            }), 500


# ============================================================
# API DE SERVIÇOS
# ============================================================

@app.route('/api/servicos', methods=["GET"])
@login_required
def api_servicos():

    servicos_db = ler("Servico")

    servicos = []

    for servico in servicos_db:

        servicos.append({

            "id":
                servico["ID_servico"],

            "nome":
                servico["nome_servico"],

            "valorBase":
                float(servico["valor_base"]),

            "descricao":
                servico["descricao"]

        })

    return flask.jsonify(servicos)


# ============================================================
# CLIENTES
# ============================================================

@app.route('/clientes', methods=["GET"])
@login_required
def clientes():

    clientes_db = ler("Cliente")

    clientes = []

    for cliente in clientes_db:

        clientes.append({

            "id":
                cliente["ID_cliente"],

            "nome":
                cliente["nome_cliente"],

            "telefone":
                cliente["telefone"],

            "endereco":
                cliente["endereco"],

            "dataCadastro":
                str(cliente["data_cadastro"])

        })

    return flask.render_template(

        "clientes.html",

        clientes=clientes

    )


@app.route('/api/clientes', methods=["GET"])
@login_required
def api_clientes():

    clientes_db = ler("Cliente")

    clientes = []

    for cliente in clientes_db:

        clientes.append({

            "id":
                cliente["ID_cliente"],

            "nome":
                cliente["nome_cliente"],

            "telefone":
                cliente["telefone"],

            "endereco":
                cliente["endereco"],

            "dataCadastro":
                str(cliente["data_cadastro"]),

            "linkEndereco":
                cliente["link_endereco"]

        })

    return flask.jsonify(clientes)


# ============================================================
# LOGIN
# ============================================================

@app.route('/')
def login():

    return flask.render_template(
        'login.html'
    )


@app.route('/', methods=['POST'])
def verificarLogin():

    nome = flask.request.form.get('email')

    senha = flask.request.form.get('senha')

    print(nome, '\n', senha)

    if nome == 'BLK@gmail.com' and senha == '12345':

        flask.session['logado'] = True

        return flask.redirect(
            flask.url_for('agenda')
        )

    else:

        return flask.redirect(
            flask.url_for('login')
        )


# ============================================================
# SERVIÇOS
# ============================================================

@app.route('/servico', methods=["GET"])
@login_required
def servicos():

    servicos_db = ler("Servico")

    servicos = []

    for servico in servicos_db:

        servicos.append({

            "id":
                servico["ID_servico"],

            "nome":
                servico["nome_servico"],

            "valorBase":
                float(servico["valor_base"]),

            "descricao":
                servico["descricao"]

        })

    return flask.render_template(

        "servicos.html",

        servicos=servicos

    )


# ============================================================
# ATENDIMENTOS
# ============================================================

@app.route('/atendimentos', methods=['GET'])
@login_required
def atendimentos():

    return flask.render_template(
        'atendimentos.html'
    )


# ============================================================
# CRIAR ATENDIMENTO
# ============================================================

@app.route('/api/atendimentos', methods=["POST"])
@login_required
def criar_atendimento_api():

    try:

        dados = flask.request.get_json(force=True)

        if not isinstance(dados, dict):

            return flask.jsonify({
                "erro": "Formato inválido"
            }), 400

        id_cliente = dados.get("id_cliente")

        status = dados.get(
            "status",
            "PENDENTE"
        )

        data_atendimento = dados.get(
            "data_atendimento"
        )

        if not id_cliente:

            return flask.jsonify({
                "erro": "Cliente não informado"
            }), 400

        if not data_atendimento:

            return flask.jsonify({
                "erro": "Data do atendimento não informada"
            }), 400

        id_atendimento = criar(

            "Atendimento",

            ID_cliente=id_cliente,

            status=status,

            data_atendimento=data_atendimento

        )

        return flask.jsonify({

            "success": True,

            "id": id_atendimento

        })

    except Exception as e:

        return flask.jsonify({

            "erro": str(e)

        }), 500


# ============================================================
# TELA DE CRIAÇÃO DE ATENDIMENTO
# ============================================================

@app.route('/criar_atendimentos', methods=['GET'])
@login_required
def criar_atendimento():

    clientes_db = ler("Cliente")

    servicos_db = ler("Servico")

    clientes = []

    for cliente in clientes_db:

        clientes.append({

            "id":
                cliente["ID_cliente"],

            "nome":
                cliente["nome_cliente"],

            "telefone":
                cliente["telefone"],

            "endereco":
                cliente["endereco"]

        })

    servicos = []

    for servico in servicos_db:

        servicos.append({

            "id":
                servico["ID_servico"],

            "nome":
                servico["nome_servico"],

            "valorBase":
                float(servico["valor_base"]),

            "descricao":
                servico["descricao"]

        })

    return flask.render_template(

        "criar_atendimentos.html",

        clientes=clientes,

        servicos=servicos

    )


# ============================================================
# EXECUÇÃO
# ============================================================

if __name__ == '__main__':

    app.run(debug=True)