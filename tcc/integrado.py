import flask #,mysql.connector
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
app=flask.Flask(__name__)
app.config["SECRET_KEY"] = "chave_temporária"

@app.route('/agenda',methods=["GET",'POST'])
def agenda():
    return flask.render_template('agenda.html',dados=listaagenda)

@app.route('/pegar_dados',methods=['POST'])
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

        return flask.render_template('agenda.html',dado=listaagenda)

    except Exception as e:
        return flask.jsonify({"erro": str(e)}), 500
     

@app.route('/clientes',methods=["GET",'POST'])
def clientes():
    nome=flask.request.form.get('nome')
    telefone=flask.request.form.get('telefone')
    endereco=flask.request.form.get('endereco')
    novo_nome=flask.request.form.get('nome2')
    novo_telefone=flask.request.form.get('telefone2')
    novo_endereco=flask.request.form.get('endereco2')
    print(f'{nome}\n{telefone}\n{endereco}\n{novo_nome}\n{novo_telefone}\n{novo_endereco}')
    return flask.render_template('clientes.html')

@app.route('/',methods=['GET','POST'])
def login():
    nome=flask.request.form.get('email')
    senha=flask.request.form.get('senha')
    print(nome,'\n', senha)
    if nome == 'BLK@gmail.com' and senha == '12345':
        return flask.redirect('/agenda')
    else:
        return flask.render_template('login.html')

@app.route('/servico',methods=['GET','POST'])
def servicos():
    servico_nome=flask.request.form.get('nomeservico')
    servico_valor=flask.request.form.get('valorservico')
    servico_descricao=flask.request.form.get('descricaoservico')
    edit_nome=flask.request.form.get('nomeedit')
    edit_valor=flask.request.form.get('valoredit')
    edit_descricao=flask.request.form.get('descricaoedit')
    print(f'{servico_nome}\n{servico_valor}\n{servico_descricao}\n{edit_nome}\n{edit_valor}\n{edit_descricao}')
    return flask.render_template('servicos.html')
if __name__ == '_main_':
    app.run(debug=True)