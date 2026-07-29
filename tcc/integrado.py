import flask ,flask_cors
from functools import wraps
import mysql.connector
#cd tcc
#flask --app integrado run --debug 
#*args=tupla de dados
#**kwargs=dicionário de dados

def conecta():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="@C15@w08@Z22@d15",
        database="sistema_atendimento"
    )

# ==========================
# CREATE
# ==========================
def criar(nometabela: str, **dados):
    conexao = conecta()
    cursor = conexao.cursor()

    try:
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


# ==========================
# READ
# ==========================
def ler(nometabela: str, **filtros):
    conexao = conecta()
    cursor = conexao.cursor(dictionary=True)

    try:
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


# ==========================
# UPDATE
# ==========================
def atualizar(nometabela: str, coluna_id: str, id_valor, **dados):
    conexao = conecta()
    cursor = conexao.cursor()

    try:
        if not dados:
            raise ValueError("Nenhum dado foi informado para atualização.")

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


# ==========================
# DELETE
# ==========================
def delete(nometabela: str, coluna_id: str, id_valor):
    conexao = conecta()
    cursor = conexao.cursor()

    try:
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


app=flask.Flask(__name__)
app.secret_key = "essa segurança é um bo****"


flask_cors.CORS(app)

# ==========================
# Decorator de autenticação
# ==========================
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):

        if "logado" not in flask.session:
            return flask.redirect(flask.url_for("login"))

        return f(*args, **kwargs)

    return decorated_function


@app.route('/agenda', methods=["GET"])
@login_required
def agenda():
    lembretes = ler("Lembrete")

    dados = []

    for lembrete in lembretes:
        dados.append({
            "id": lembrete["ID_lembrete"],
            "data": str(lembrete["data_lembrete"]),
            "atendimento": "",
            "descricao": lembrete["descricao"],
            "dataservico": str(lembrete["data_lembrete"].day)
        })

    return flask.render_template(
        "agenda.html",
        dados=dados
    )

@app.route('/pegar_dados', methods=['POST'])
@login_required
def pegar_dados():
    try:
        dados = flask.request.get_json(force=True)

        if not isinstance(dados, dict):
            return flask.jsonify({
                "erro": "Formato inválido"
            }), 400

        data = dados.get("data")
        descricao = dados.get("descricao")

        if not data:
            return flask.jsonify({
                "erro": "Data não informada"
            }), 400

        id_lembrete = criar(
            "Lembrete",
            data_lembrete=data,
            descricao=descricao
        )

        return flask.jsonify({
            "success": True,
            "id": id_lembrete
        })

    except Exception as e:
        return flask.jsonify({
            "erro": str(e)
        }), 500

@app.route("/editar_lembrete", methods=["PUT"])
@login_required
def editar_lembrete():

    try:
        dados = flask.request.get_json(force=True)

        if not isinstance(dados, dict):
            return flask.jsonify({
                "erro": "Formato inválido"
            }), 400

        id_lembrete = dados.get("id")

        if not id_lembrete:
            return flask.jsonify({
                "erro": "ID do lembrete não informado"
            }), 400

        quantidade = atualizar(
            "Lembrete",
            "ID_lembrete",
            id_lembrete,
            data_lembrete=dados.get("data"),
            descricao=dados.get("descricao")
        )

        if quantidade == 0:
            return flask.jsonify({
                "success": False,
                "erro": "Lembrete não encontrado"
            }), 404

        return flask.jsonify({
            "success": True
        })

    except Exception as e:
        return flask.jsonify({
            "erro": str(e)
        }), 500

@app.route("/excluir_lembrete", methods=["DELETE"])
@login_required
def excluir_lembrete():

    try:
        dados = flask.request.get_json(force=True)

        if not isinstance(dados, dict):
            return flask.jsonify({
                "erro": "Formato inválido"
            }), 400

        id_lembrete = dados.get("id")

        if not id_lembrete:
            return flask.jsonify({
                "erro": "ID do lembrete não informado"
            }), 400

        quantidade = delete(
            "Lembrete",
            "ID_lembrete",
            id_lembrete
        )

        if quantidade == 0:
            return flask.jsonify({
                "success": False,
                "erro": "Lembrete não encontrado"
            }), 404

        return flask.jsonify({
            "success": True
        })

    except Exception as e:
        return flask.jsonify({
            "erro": str(e)
        }), 500

@app.route('/pegar_cliente', methods=["POST", "PUT", "DELETE"])
@login_required
def pegar_cliente():

    # ==========================
    # CREATE
    # ==========================
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


    # ==========================
    # UPDATE
    # ==========================
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


    # ==========================
    # DELETE
    # ==========================
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
        
@app.route('/pegar_servico', methods=["POST", "PUT", "DELETE"])
@login_required
def pegar_servico():

    # ==========================
    # CREATE
    # ==========================
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


    # ==========================
    # UPDATE
    # ==========================
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
                valor_base=dados.get("valor"),
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


    # ==========================
    # DELETE
    # ==========================
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

@app.route('/clientes', methods=["GET"])
@login_required
def clientes():

    clientes_db = ler("Cliente")

    clientes = []

    for cliente in clientes_db:
        clientes.append({
            "id": cliente["ID_cliente"],
            "nome": cliente["nome_cliente"],
            "telefone": cliente["telefone"],
            "endereco": cliente["endereco"],
            "dataCadastro": str(cliente["data_cadastro"])
        })

    return flask.render_template(
        "clientes.html",
        clientes=clientes
    )

@app.route('/')
def login():
    return flask.render_template('login.html')

@app.route('/', methods=['POST'])
def verificarLogin():
    nome=flask.request.form.get('email')
    senha=flask.request.form.get('senha')
    print(nome,'\n', senha)
    if nome == 'BLK@gmail.com' and senha == '12345':
        flask.session['logado'] = True
        return flask.redirect(flask.url_for('agenda'))
    else:
        return flask.redirect(flask.url_for('login'))
    
@app.route('/servico', methods=["GET"])
@login_required
def servicos():

    servicos_db = ler("Servico")

    servicos = []

    for servico in servicos_db:
        servicos.append({
            "id": servico["ID_servico"],
            "nome": servico["nome_servico"],
            "valorBase": float(servico["valor_base"]),
            "descricao": servico["descricao"]
        })

    return flask.render_template(
        "servicos.html",
        servicos=servicos
    )

@app.route('/atendimentos', methods=['GET'])
@login_required
def atendimentos():

    return flask.render_template(
        'atendimentos.html'
    )

@app.route('/criar_atendimentos', methods=['GET'])
@login_required
def criar_atendimento():

    clientes_db = ler("Cliente")
    servicos_db = ler("Servico")

    clientes = []

    for cliente in clientes_db:
        clientes.append({
            "id": cliente["ID_cliente"],
            "nome": cliente["nome_cliente"],
            "telefone": cliente["telefone"],
            "endereco": cliente["endereco"]
        })

    servicos = []

    for servico in servicos_db:
        servicos.append({
            "id": servico["ID_servico"],
            "nome": servico["nome_servico"],
            "valorBase": float(servico["valor_base"]),
            "descricao": servico["descricao"]
        })

    return flask.render_template(
        "criar_atendimentos.html",
        clientes=clientes,
        servicos=servicos
    )


if __name__ == '__main__':
    app.run(debug=True)