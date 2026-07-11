import flask ,flask_cors
from functools import wraps#,mysql.connector
#cd tcc
#flask --app integrado run --debug 

'''cnx = mysql.connector.connect(
    host="127.0.0.1",
    port=3306,
    user="root",
    password="@C15@w08@Z22@d15")
cur=cnx.cursor()
cur.execute("SELECT * FROM clientes")

dados = cur.fetchall()

for cliente in dados:
    print(cliente)

cur.close()
cnx.close()'''

listaagenda=[]

dicioagenda={
    'data':None,
    'atendimento':None,
    'descricao':None,
    'dataservico':0
}

listacliente=[]

diciocliente={
    'nome':None,
    'telefone':None,
    'endereco':None,
    'dataCadastro':None,
    'id':0
}

listaservico=[]

dicioservico={
    'nome':None,
    'valor':None,
    'descricao':None,
}

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


@app.route('/agenda',methods=["GET",'POST'])
@login_required
def agenda():
    return flask.render_template('agenda.html',dados=listaagenda)

@app.route('/pegar_dados',methods=['POST'])
@login_required
def pegar_dados():
    try:
        dados = flask.request.get_json(force=True)  # Lê JSON enviado
        
        data=dados.get('data')
        
        if not isinstance(dados, dict):
            return flask.jsonify({"erro": "Formato inválido"}), 400
        
        dicioagenda['data'] = dados.get("data")
        dicioagenda['atendimento'] = dados.get("atendimento")
        dicioagenda['descricao'] = dados.get("descricao")
        dicioagenda['dataservico']=f'{data[8]}{data[9]}' 
        listaagenda.append(dicioagenda.copy())
        print(f"Data: {dicioagenda['data']} \nAtendimento: {dicioagenda['atendimento']} \nDescricão: {dicioagenda['descricao']} \n {listaagenda}")

        return flask.jsonify({"sucess": "cadastrado com sucesso"})

    except Exception as e:
        return flask.jsonify({"erro": str(e)}), 500

@app.route('/pegar_cliente', methods=["POST","PUT","DELETE"])
@login_required
def pegar_cliente():
    if flask.request.method == "POST":
        try:
            dados = flask.request.get_json(force=True)  # Lê JSON enviado
            if not isinstance(dados, dict):
                return flask.jsonify({"erro": "Formato inválido"}), 400

            diciocliente['nome'] = dados.get("nome")
            diciocliente['telefone'] = dados.get("telefone")
            diciocliente['endereco'] = dados.get("endereco")
            diciocliente['dataCadastro']=dados.get("dataCadastro")
            diciocliente['id']=dados.get('id') 
            listacliente.append(diciocliente.copy())
            print(f"{diciocliente['nome']}\n{diciocliente['telefone']}\n    {diciocliente['endereco']}\n{diciocliente['dataCadastro']}\n    {diciocliente['id']}\n{listacliente}")

            return flask.jsonify({"sucess": "cadastrado com sucesso"})
        except Exception as e:
            return flask.jsonify({"erro": str(e)}), 500
    if flask.request.method == "PUT":
        try:
            dados2 = flask.request.get_json(force=True)

            if not isinstance(dados2, dict):
                return flask.jsonify({"erro": "Formato inválido"}), 400

            for cliente in listacliente:

                if int(cliente["id"]) == int(dados2["id"]):

                    cliente["nome"] = dados2["nome"]
                    cliente["telefone"] = dados2["telefone"]
                    cliente["endereco"] = dados2["endereco"]

                    print(cliente)

                    print(type(dados2.get("id")))
                    print(type(cliente.get("id")))

                    return flask.jsonify({"success": "Cliente atualizado"})

            return flask.jsonify({"erro": "Cliente não encontrado"}), 404

        except Exception as e:
            print(e)
            
            return flask.jsonify({"erro": str(e)}), 500
    if flask.request.method=="DELETE":
        try:
            dados3 = flask.request.get_json(force=True)
            if not isinstance(dados3, dict):
                    return flask.jsonify({"erro": "Formato inválido"}), 400
            for cliente in listacliente:
                if int(cliente["id"]) == int(dados3['id']):
                    #mudar o valor que subtrai o id 
                    listacliente.pop(cliente["id"]-3)
                    return flask.jsonify({"success": "Cliente atualizado"})

            return flask.jsonify({"erro": "Cliente não encontrado"}), 404

        except Exception as e:
            print(e)
            return flask.jsonify({"erro": str(e)}), 500
@app.route('/pegar_servico',methods=["GET","POST"])
@login_required
def pegar_servico():
    try:
        dados = flask.request.get_json(force=True)  # Lê JSON enviado
        if not isinstance(dados, dict):
            return flask.jsonify({"erro": "Formato inválido"}), 400
        
        dicioservico['nome'] = dados.get("nome")
        dicioservico['valor'] = dados.get("valosBasa")
        dicioservico['descricao'] = dados.get("descricao")
        listaservico.append(dicioservico.copy())
        print(f"Data: {dicioservico['nome']} \nAtendimento: {dicioservico['valor']} \nDescricão: {dicioservico['descricao']} \n {listaservico}")

        return flask.jsonify({"sucess": "cadastrado com sucesso"})

    except Exception as e:
        return flask.jsonify({"erro": str(e)}), 500

@app.route('/clientes',methods=["GET",'POST'])
@login_required
def clientes():
    return flask.render_template('clientes.html')

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
    
@app.route('/servico',methods=['GET','POST'])
@login_required
def servicos():
    return flask.render_template('servicos.html')


if __name__ == '_main_':
    app.run(debug=True)