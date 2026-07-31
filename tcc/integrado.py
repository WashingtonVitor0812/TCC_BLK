import flask
import flask_cors
import json
from functools import wraps
import mysql.connector
from datetime import date
from decimal import Decimal, InvalidOperation



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


def garantir_colunas_atendimento():
    """Atualiza bancos existentes com os campos do atendimento."""

    conexao = conecta()
    cursor = conexao.cursor()

    try:
        cursor.execute("""
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'Atendimento'
        """)

        colunas = {
            registro[0]
            for registro in cursor.fetchall()
        }

        if "nome_atendimento" not in colunas:
            cursor.execute("""
                ALTER TABLE Atendimento
                ADD COLUMN nome_atendimento VARCHAR(150) NULL
                AFTER ID_cliente
            """)

        if "descricao" not in colunas:
            cursor.execute("""
                ALTER TABLE Atendimento
                ADD COLUMN descricao TEXT NULL
                AFTER nome_atendimento
            """)

        conexao.commit()

    except Exception:
        conexao.rollback()
        raise

    finally:
        cursor.close()
        conexao.close()


def validar_dados_servico(dados):
    nome = dados.get("nome")
    descricao = dados.get("descricao")

    if not isinstance(nome, str) or not nome.strip():
        return None, "Nome do serviço não informado."

    try:
        valor_base = Decimal(str(dados.get("valorBase")))
    except (InvalidOperation, TypeError, ValueError):
        return None, "Valor base inválido."

    if valor_base < 0:
        return None, "O valor base não pode ser negativo."

    return {
        "nome": nome.strip(),
        "valorBase": valor_base,
        "descricao": descricao.strip() if isinstance(descricao, str) else None
    }, None


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


@app.after_request
def adicionar_notificacao_a_resposta(response):
    """Registra flash e entrega a notificação para chamadas AJAX."""
    if not response.is_json:
        return response

    try:
        dados = response.get_json()
    except Exception:
        return response

    if not isinstance(dados, dict) or "_toast" in dados:
        return response

    categoria = None
    mensagem = None
    if response.status_code >= 400 or dados.get("success") is False:
        categoria = "error"
        mensagem = dados.get("erro") or dados.get("error")
    elif dados.get("success") is True:
        categoria = "success"
        mensagem = dados.get("mensagem")
        if not mensagem and flask.request.method in {"POST", "PUT", "DELETE"}:
            mensagens_padrao = {
                ("/pegar_cliente", "POST"): "Cliente cadastrado com sucesso!",
                ("/pegar_cliente", "PUT"): "Cliente atualizado com sucesso!",
                ("/pegar_cliente", "DELETE"): "Cliente excluído com sucesso!",
                ("/pegar_servico", "POST"): "Serviço cadastrado com sucesso!",
                ("/pegar_servico", "PUT"): "Serviço atualizado com sucesso!",
                ("/pegar_servico", "DELETE"): "Serviço excluído com sucesso!",
                ("/pegar_dados", "POST"): "Lembrete cadastrado com sucesso!",
                ("/editar_lembrete", "PUT"): "Lembrete atualizado com sucesso!",
                ("/excluir_lembrete", "DELETE"): "Lembrete excluído com sucesso!",
                ("/api/atendimentos", "POST"): "Atendimento cadastrado com sucesso!"
            }
            mensagem = mensagens_padrao.get(
                (flask.request.path, flask.request.method),
                "Operação realizada com sucesso!"
            )

    if not mensagem:
        return response

    quantidade_anterior = len(flask.session.get("_flashes", []))
    flask.flash(mensagem, categoria)

    # A API jÃ¡ entrega o toast na prÃ³pria resposta; remover esta
    # mensagem da sessÃ£o evita que ela reapareÃ§a ao navegar para outra tela.
    flashes = flask.session.get("_flashes", [])
    del flashes[quantidade_anterior:]
    if flashes:
        flask.session["_flashes"] = flashes
    else:
        flask.session.pop("_flashes", None)

    dados["_toast"] = {"category": categoria, "message": mensagem}
    response.set_data(json.dumps(dados, ensure_ascii=False, default=str))
    response.content_type = "application/json; charset=utf-8"
    return response


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

    garantir_colunas_atendimento()

    conexao = conecta()
    cursor = conexao.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                a.ID_atendimento,
                a.ID_cliente,
                a.nome_atendimento,
                a.descricao,
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
                a.nome_atendimento,
                a.descricao,
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

                "nome":
                    atendimento["nome_atendimento"],

                "descricao":
                    atendimento["descricao"] or "",

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

@app.route(
    '/api/atendimentos/<int:id_atendimento>',
    methods=["GET", "PUT", "DELETE"]
)
@login_required
def atendimento_por_id(id_atendimento):

    garantir_colunas_atendimento()

    if flask.request.method == "GET":
        conexao = conecta()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute("""
                SELECT
                    a.ID_atendimento,
                    a.ID_cliente,
                    a.nome_atendimento,
                    a.descricao,
                    a.status,
                    a.data_atendimento,
                    a.data_conclusao,
                    a.valor_total,
                    c.nome_cliente
                FROM Atendimento a
                JOIN Cliente c ON c.ID_cliente = a.ID_cliente
                WHERE a.ID_atendimento = %s
            """, (id_atendimento,))

            atendimento = cursor.fetchone()

            if not atendimento:
                return flask.jsonify({
                    "success": False,
                    "erro": "Atendimento não encontrado."
                }), 404

            cursor.execute("""
                SELECT ID_lembrete
                FROM Lembrete
                WHERE ID_atendimento = %s
                ORDER BY ID_lembrete DESC
                LIMIT 1
            """, (id_atendimento,))
            lembrete = cursor.fetchone()

            cursor.execute("""
                SELECT
                    ats.ID_servico,
                    s.nome_servico,
                    ats.quantidade,
                    s.valor_base,
                    ats.valor
                FROM Atendimento_Servico ats
                JOIN Servico s ON s.ID_servico = ats.ID_servico
                WHERE ats.ID_atendimento = %s
                ORDER BY s.nome_servico
            """, (id_atendimento,))

            servicos = []

            for servico in cursor.fetchall():
                quantidade = servico["quantidade"]
                valor_unitario = float(servico["valor_base"])
                valor = servico["valor"]

                servicos.append({
                    "id": servico["ID_servico"],
                    "nome": servico["nome_servico"],
                    "quantidade": quantidade,
                    "valorUnitario": valor_unitario,
                    "valor": float(valor) if valor is not None else (
                        valor_unitario * quantidade
                    )
                })

            return flask.jsonify({
                "success": True,
                "atendimento": {
                    "id": atendimento["ID_atendimento"],
                    "id_cliente": atendimento["ID_cliente"],
                    "nome": atendimento["nome_atendimento"],
                    "descricao": atendimento["descricao"] or "",
                    "cliente": atendimento["nome_cliente"],
                    "status": atendimento["status"],
                    "data_atendimento": str(atendimento["data_atendimento"]),
                    "data_conclusao": (
                        str(atendimento["data_conclusao"])
                        if atendimento["data_conclusao"] else None
                    ),
                    "valor_total": float(atendimento["valor_total"] or 0),
                    "lembrete": (
                        {"id": lembrete["ID_lembrete"]}
                        if lembrete else None
                    ),
                    "servicos": servicos
                }
            })

        finally:
            cursor.close()
            conexao.close()

    if flask.request.method == "PUT":
        try:
            dados = flask.request.get_json(force=True)

            if not isinstance(dados, dict):
                return flask.jsonify({
                    "success": False,
                    "erro": "Formato inválido."
                }), 400

            if "servicos" in dados:
                return atualizar_atendimento_completo(
                    id_atendimento,
                    dados
                )

            id_cliente = dados.get("id_cliente")
            status = dados.get("status")
            data_atendimento = dados.get("data_atendimento")
            data_conclusao = dados.get("data_conclusao") or None

            status_permitidos = {
                "PENDENTE",
                "EM_ANDAMENTO",
                "CONCLUIDO",
                "CANCELADO"
            }

            if not id_cliente:
                return flask.jsonify({
                    "success": False,
                    "erro": "Cliente não informado."
                }), 400

            if not isinstance(status, str) or status.strip().upper() not in status_permitidos:
                return flask.jsonify({
                    "success": False,
                    "erro": "Status inválido."
                }), 400

            if not data_atendimento:
                return flask.jsonify({
                    "success": False,
                    "erro": "Data do atendimento não informada."
                }), 400

            if not ler("Atendimento", ID_atendimento=id_atendimento):
                return flask.jsonify({
                    "success": False,
                    "erro": "Atendimento não encontrado."
                }), 404

            if not ler("Cliente", ID_cliente=id_cliente):
                return flask.jsonify({
                    "success": False,
                    "erro": "Cliente não encontrado."
                }), 404

            atualizar(
                "Atendimento",
                "ID_atendimento",
                id_atendimento,
                ID_cliente=id_cliente,
                status=status.strip().upper(),
                data_atendimento=data_atendimento,
                data_conclusao=data_conclusao
            )

            return flask.jsonify({
                "success": True,
                "mensagem": "Atendimento atualizado com sucesso."
            })

        except Exception as e:
            return flask.jsonify({
                "success": False,
                "erro": str(e)
            }), 500

    conexao = conecta()
    cursor = conexao.cursor()

    try:
        cursor.execute(
            "SELECT 1 FROM Atendimento WHERE ID_atendimento = %s",
            (id_atendimento,)
        )

        if not cursor.fetchone():
            return flask.jsonify({
                "success": False,
                "erro": "Atendimento não encontrado."
            }), 404

        cursor.execute(
            "DELETE FROM Lembrete WHERE ID_atendimento = %s",
            (id_atendimento,)
        )
        cursor.execute(
            "DELETE FROM Atendimento_Servico WHERE ID_atendimento = %s",
            (id_atendimento,)
        )
        cursor.execute(
            "DELETE FROM Atendimento WHERE ID_atendimento = %s",
            (id_atendimento,)
        )
        conexao.commit()

        return flask.jsonify({
            "success": True,
            "mensagem": "Atendimento excluído com sucesso."
        })

    except Exception as e:
        conexao.rollback()
        return flask.jsonify({
            "success": False,
            "erro": str(e)
        }), 500

    finally:
        cursor.close()
        conexao.close()


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

            servico, erro = validar_dados_servico(dados)

            if erro:
                return flask.jsonify({
                    "success": False,
                    "erro": erro
                }), 400

            id_servico = criar(

                "Servico",

                nome_servico=servico["nome"],

                valor_base=servico["valorBase"],

                descricao=servico["descricao"]

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

            servico, erro = validar_dados_servico(dados)

            if erro:
                return flask.jsonify({
                    "success": False,
                    "erro": erro
                }), 400

            if not ler("Servico", ID_servico=id_servico):
                return flask.jsonify({
                    "success": False,
                    "erro": "Serviço não encontrado."
                }), 404

            quantidade = atualizar(

                "Servico",

                "ID_servico",

                id_servico,

                nome_servico=servico["nome"],

                valor_base=servico["valorBase"],

                descricao=servico["descricao"]

            )

            if quantidade == 0 and not ler("Servico", ID_servico=id_servico):

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

            if not ler("Servico", ID_servico=id_servico):
                return flask.jsonify({
                    "success": False,
                    "erro": "Serviço não encontrado."
                }), 404

            if ler("Atendimento_Servico", ID_servico=id_servico):
                return flask.jsonify({
                    "success": False,
                    "erro": "Este serviço está vinculado a atendimentos e não pode ser excluído."
                }), 409

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
# TELA DE CLIENTES
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

# ============================================================
# API DE CLIENTES
# ============================================================

@app.route('/api/clientes', methods=["GET"])
@login_required
def api_clientes():

    try:

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

    except Exception as e:

        return flask.jsonify({

            "success": False,

            "erro": str(e)

        }), 500


# ============================================================
# CLIENTES - API CRUD
# ============================================================

@app.route(
    '/pegar_cliente',
    methods=["POST", "PUT", "DELETE"]
)
@login_required
def pegar_cliente():

    # ========================================================
    # CREATE - POST
    # ========================================================

    if flask.request.method == "POST":

        try:

            dados = flask.request.get_json(force=True)

            if not isinstance(dados, dict):

                return flask.jsonify({
                    "success": False,
                    "erro": "Formato inválido."
                }), 400

            nome = dados.get("nome")
            telefone = dados.get("telefone")
            endereco = dados.get("endereco")
            

            # --------------------------
            # VALIDAÇÕES
            # --------------------------

            if not nome or not nome.strip():

                return flask.jsonify({
                    "success": False,
                    "erro": "Nome do cliente não informado."
                }), 400

            if not telefone or not telefone.strip():

                return flask.jsonify({
                    "success": False,
                    "erro": "Telefone do cliente não informado."
                }), 400

            if not endereco or not endereco.strip():

                return flask.jsonify({
                    "success": False,
                    "erro": "Endereço do cliente não informado."
                }), 400

            

            id_cliente = criar(

                "Cliente",

                nome_cliente=nome.strip(),

                telefone=telefone.strip(),

                data_cadastro=date.today(),

                endereco=endereco.strip()

            )

            # --------------------------
            # BUSCA O CLIENTE CRIADO
            # --------------------------

            cliente_criado = ler(

                "Cliente",

                ID_cliente=id_cliente

            )

            if not cliente_criado:

                return flask.jsonify({

                    "success": False,

                    "erro": "Cliente criado, mas não foi possível recuperá-lo."

                }), 500

            cliente = cliente_criado[0]

            return flask.jsonify({

                "success": True,

                "cliente": {

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

                }

            }), 201

        except Exception as e:

            return flask.jsonify({

                "success": False,

                "erro": str(e)

            }), 500


    # ========================================================
    # UPDATE - PUT
    # ========================================================

    if flask.request.method == "PUT":

        try:

            dados = flask.request.get_json(force=True)

            if not isinstance(dados, dict):

                return flask.jsonify({

                    "success": False,

                    "erro": "Formato inválido."

                }), 400

            id_cliente = dados.get("id")

            nome = dados.get("nome")
            telefone = dados.get("telefone")
            endereco = dados.get("endereco")

            # --------------------------
            # VALIDAÇÕES
            # --------------------------

            if not id_cliente:

                return flask.jsonify({

                    "success": False,

                    "erro": "ID do cliente não informado."

                }), 400

            if not nome or not nome.strip():

                return flask.jsonify({

                    "success": False,

                    "erro": "Nome do cliente não informado."

                }), 400

            if not telefone or not telefone.strip():

                return flask.jsonify({

                    "success": False,

                    "erro": "Telefone do cliente não informado."

                }), 400

            if not endereco or not endereco.strip():

                return flask.jsonify({

                    "success": False,

                    "erro": "Endereço do cliente não informado."

                }), 400

            # --------------------------
            # VERIFICA SE EXISTE
            # --------------------------

            cliente = ler(

                "Cliente",

                ID_cliente=id_cliente

            )

            if not cliente:

                return flask.jsonify({

                    "success": False,

                    "erro": "Cliente não encontrado."

                }), 404

            # --------------------------
            # ATUALIZA
            # --------------------------

            quantidade = atualizar(

                "Cliente",

                "ID_cliente",

                id_cliente,

                nome_cliente=nome.strip(),

                telefone=telefone.strip(),

                endereco=endereco.strip()

            )

            if quantidade == 0:

                return flask.jsonify({

                    "success": False,

                    "erro": "Nenhum dado foi alterado."

                }), 400

            # --------------------------
            # BUSCA DADOS ATUALIZADOS
            # --------------------------

            cliente_atualizado = ler(

                "Cliente",

                ID_cliente=id_cliente

            )

            cliente = cliente_atualizado[0]

            return flask.jsonify({

                "success": True,

                "mensagem": "Cliente atualizado com sucesso.",

                "cliente": {

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

                }

            })

        except Exception as e:

            return flask.jsonify({

                "success": False,

                "erro": str(e)

            }), 500


    # ========================================================
    # DELETE - DELETE
    # ========================================================

    if flask.request.method == "DELETE":

        try:

            dados = flask.request.get_json(force=True)

            if not isinstance(dados, dict):

                return flask.jsonify({

                    "success": False,

                    "erro": "Formato inválido."

                }), 400

            id_cliente = dados.get("id")

            if not id_cliente:

                return flask.jsonify({

                    "success": False,

                    "erro": "ID do cliente não informado."

                }), 400

            # --------------------------
            # VERIFICA SE EXISTE
            # --------------------------

            cliente = ler(

                "Cliente",

                ID_cliente=id_cliente

            )

            if not cliente:

                return flask.jsonify({

                    "success": False,

                    "erro": "Cliente não encontrado."

                }), 404

            # --------------------------
            # EXCLUI
            # --------------------------

            quantidade = delete(

                "Cliente",

                "ID_cliente",

                id_cliente

            )

            if quantidade == 0:

                return flask.jsonify({

                    "success": False,

                    "erro": "Cliente não encontrado."

                }), 404

            return flask.jsonify({

                "success": True,

                "mensagem": "Cliente excluído com sucesso."

            })

        except Exception as e:

            return flask.jsonify({

                "success": False,

                "erro": str(e)

            }), 500

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
        flask.flash("Login realizado com sucesso!", "success")

        return flask.redirect(
            flask.url_for('agenda')
        )

    else:

        flask.flash("E-mail ou senha inválidos.", "error")

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

def criar_atendimento_completo():

    garantir_colunas_atendimento()

    dados = flask.request.get_json(force=True)

    if not isinstance(dados, dict):
        return flask.jsonify({
            "success": False,
            "erro": "Formato invalido."
        }), 400

    id_cliente = None
    nome_cliente = dados.get("cliente_nome")

    try:
        id_cliente = int(dados.get("id_cliente"))
    except (TypeError, ValueError):
        pass

    if not id_cliente and (
        not isinstance(nome_cliente, str) or not nome_cliente.strip()
    ):
        return flask.jsonify({
            "success": False,
            "erro": "Cliente nao informado."
        }), 400

    nome_atendimento = dados.get("nome")
    descricao = dados.get("descricao")

    if not isinstance(nome_atendimento, str) or not nome_atendimento.strip():
        return flask.jsonify({
            "success": False,
            "erro": "Nome do atendimento nao informado."
        }), 400

    if descricao is not None and not isinstance(descricao, str):
        return flask.jsonify({
            "success": False,
            "erro": "Descricao do atendimento invalida."
        }), 400

    nome_atendimento = nome_atendimento.strip()
    descricao = descricao.strip() if isinstance(descricao, str) else None

    status = str(dados.get("status", "PENDENTE")).strip().upper()
    status = status.replace(" ", "_")

    if status not in {"PENDENTE", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"}:
        return flask.jsonify({
            "success": False,
            "erro": "Status invalido."
        }), 400

    data_atendimento = dados.get("data_atendimento") or str(date.today())

    try:
        data_atendimento = date.fromisoformat(data_atendimento)
    except (TypeError, ValueError):
        return flask.jsonify({
            "success": False,
            "erro": "Data do atendimento invalida."
        }), 400

    itens = dados.get("servicos")

    if not isinstance(itens, list) or not itens:
        return flask.jsonify({
            "success": False,
            "erro": "Adicione pelo menos um servico ao atendimento."
        }), 400

    servicos = []
    ids_servicos = set()

    for item in itens:
        if not isinstance(item, dict):
            return flask.jsonify({
                "success": False,
                "erro": "Formato de servico invalido."
            }), 400

        try:
            id_servico = int(item.get("servico_id"))
            quantidade = int(item.get("quantidade"))
        except (TypeError, ValueError):
            return flask.jsonify({
                "success": False,
                "erro": "Servico ou quantidade invalidos."
            }), 400

        if quantidade < 1:
            return flask.jsonify({
                "success": False,
                "erro": "A quantidade de cada servico deve ser maior que zero."
            }), 400

        if id_servico in ids_servicos:
            return flask.jsonify({
                "success": False,
                "erro": "Um servico foi informado mais de uma vez."
            }), 400

        ids_servicos.add(id_servico)
        servicos.append((id_servico, quantidade))

    conexao = conecta()
    cursor = conexao.cursor(dictionary=True)

    try:
        if id_cliente:
            cursor.execute(
                "SELECT ID_cliente FROM Cliente WHERE ID_cliente = %s",
                (id_cliente,)
            )
            cliente = cursor.fetchone()
        else:
            cursor.execute(
                """
                    SELECT ID_cliente
                    FROM Cliente
                    WHERE LOWER(TRIM(nome_cliente)) = LOWER(TRIM(%s))
                """,
                (nome_cliente.strip(),)
            )
            clientes_encontrados = cursor.fetchall()

            if len(clientes_encontrados) > 1:
                return flask.jsonify({
                    "success": False,
                    "erro": "Mais de um cliente possui este nome. Selecione-o na lista."
                }), 400

            cliente = (
                clientes_encontrados[0]
                if clientes_encontrados else None
            )

        if not cliente:
            return flask.jsonify({
                "success": False,
                "erro": "Cliente nao encontrado."
            }), 404

        id_cliente = cliente["ID_cliente"]

        placeholders = ", ".join(["%s"] * len(ids_servicos))
        cursor.execute(
            f"SELECT ID_servico FROM Servico WHERE ID_servico IN ({placeholders})",
            tuple(ids_servicos)
        )
        ids_existentes = {
            registro["ID_servico"]
            for registro in cursor.fetchall()
        }

        if ids_existentes != ids_servicos:
            return flask.jsonify({
                "success": False,
                "erro": "Um ou mais servicos nao foram encontrados."
            }), 404

        cursor.execute(
            """
                INSERT INTO Atendimento
                    (ID_cliente, nome_atendimento, descricao, status, data_atendimento)
                VALUES (%s, %s, %s, %s, %s)
            """,
            (
                id_cliente,
                nome_atendimento,
                descricao,
                status,
                data_atendimento
            )
        )
        id_atendimento = cursor.lastrowid

        cursor.executemany(
            """
                INSERT INTO Atendimento_Servico
                    (ID_atendimento, ID_servico, quantidade)
                VALUES (%s, %s, %s)
            """,
            [
                (id_atendimento, id_servico, quantidade)
                for id_servico, quantidade in servicos
            ]
        )

        cursor.execute(
            "SELECT valor_total FROM Atendimento WHERE ID_atendimento = %s",
            (id_atendimento,)
        )
        atendimento = cursor.fetchone()
        conexao.commit()

        return flask.jsonify({
            "success": True,
            "id": id_atendimento,
            "valor_total": float(atendimento["valor_total"] or 0)
        }), 201

    except Exception:
        conexao.rollback()
        raise

    finally:
        cursor.close()
        conexao.close()

def atualizar_atendimento_completo(id_atendimento, dados):
    """Atualiza os dados e os serviços de um atendimento em uma transação."""

    nome = dados.get("nome")
    descricao = dados.get("descricao")
    id_cliente = dados.get("id_cliente", dados.get("cliente_id"))
    status = str(dados.get("status", "PENDENTE")).strip().upper().replace(" ", "_")
    data_atendimento = dados.get("data_atendimento")
    data_conclusao = dados.get("data_conclusao") or None
    itens = dados.get("servicos")

    if not isinstance(nome, str) or not nome.strip():
        return flask.jsonify({"success": False, "erro": "Nome do atendimento não informado."}), 400
    if descricao is not None and not isinstance(descricao, str):
        return flask.jsonify({"success": False, "erro": "Descrição do atendimento inválida."}), 400
    if status not in {"PENDENTE", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"}:
        return flask.jsonify({"success": False, "erro": "Status inválido."}), 400

    try:
        id_cliente = int(id_cliente)
        data_atendimento = date.fromisoformat(data_atendimento)
        data_conclusao = date.fromisoformat(data_conclusao) if data_conclusao else None
    except (TypeError, ValueError):
        return flask.jsonify({"success": False, "erro": "Cliente ou data inválidos."}), 400

    if not isinstance(itens, list) or not itens:
        return flask.jsonify({"success": False, "erro": "Adicione pelo menos um serviço ao atendimento."}), 400

    servicos = []
    ids_servicos = set()
    try:
        for item in itens:
            id_servico = int(item.get("servico_id"))
            quantidade = int(item.get("quantidade"))
            if quantidade < 1 or id_servico in ids_servicos:
                raise ValueError
            ids_servicos.add(id_servico)
            servicos.append((id_servico, quantidade))
    except (AttributeError, TypeError, ValueError):
        return flask.jsonify({"success": False, "erro": "Serviços do atendimento inválidos."}), 400

    conexao = conecta()
    cursor = conexao.cursor(dictionary=True)
    try:
        cursor.execute("SELECT 1 FROM Atendimento WHERE ID_atendimento = %s", (id_atendimento,))
        if not cursor.fetchone():
            return flask.jsonify({"success": False, "erro": "Atendimento não encontrado."}), 404

        cursor.execute("SELECT 1 FROM Cliente WHERE ID_cliente = %s", (id_cliente,))
        if not cursor.fetchone():
            return flask.jsonify({"success": False, "erro": "Cliente não encontrado."}), 404

        placeholders = ", ".join(["%s"] * len(ids_servicos))
        cursor.execute(
            f"SELECT ID_servico FROM Servico WHERE ID_servico IN ({placeholders})",
            tuple(ids_servicos)
        )
        if {linha["ID_servico"] for linha in cursor.fetchall()} != ids_servicos:
            return flask.jsonify({"success": False, "erro": "Um ou mais serviços não foram encontrados."}), 404

        cursor.execute("""
            UPDATE Atendimento
            SET ID_cliente = %s, nome_atendimento = %s, descricao = %s,
                status = %s, data_atendimento = %s, data_conclusao = %s
            WHERE ID_atendimento = %s
        """, (id_cliente, nome.strip(), descricao.strip() if isinstance(descricao, str) else None,
              status, data_atendimento, data_conclusao, id_atendimento))
        cursor.execute("DELETE FROM Atendimento_Servico WHERE ID_atendimento = %s", (id_atendimento,))
        cursor.executemany("""
            INSERT INTO Atendimento_Servico (ID_atendimento, ID_servico, quantidade)
            VALUES (%s, %s, %s)
        """, [(id_atendimento, id_servico, quantidade) for id_servico, quantidade in servicos])
        cursor.execute("SELECT valor_total FROM Atendimento WHERE ID_atendimento = %s", (id_atendimento,))
        atendimento = cursor.fetchone()
        conexao.commit()
        return flask.jsonify({
            "success": True,
            "id": id_atendimento,
            "valor_total": float(atendimento["valor_total"] or 0),
            "mensagem": "Atendimento atualizado com sucesso."
        })
    except Exception:
        conexao.rollback()
        raise
    finally:
        cursor.close()
        conexao.close()


@app.route('/api/atendimentos', methods=["POST"])
@login_required
def criar_atendimento_api():

    try:
        return criar_atendimento_completo()
    except Exception as e:
        return flask.jsonify({
            "success": False,
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
