import flask , plotly.express as px , pandas,mysql.connector
#flask --app integrado run --debug 
cnx = mysql.connector.connect(
    host="127.0.0.1",
    port=3306,
    user="root",
    password="@C15@w08@Z22@d15")
cur=cnx.cursor()
cur.execute("USE sistema_atendimento")
cur.execute("SELECT * FROM cliente")

# insert into cliente (nome_cliente, telefone, data_cadastro, endereco) values ('Caio', '81909928922', '2026-06-15', 'rua 12')

dados = cur.fetchall()

for cliente in dados:
    print(cliente)

cur.close()
cnx.close()

app=flask.Flask(__name__)


@app.route('/',methods=["GET"])
def agenda():
    data=flask.request.form.get('data')
    atendimento=flask.request.form.get('atendimento')
    descricao=flask.request.form.get('descricao')
    return flask.render_template('agenda.html')



@app.route('/clientes',methods=["GET"])
def clientes():
    nome=flask.request.form.get('nome')
    telefone=flask.request.form.get('telefone')
    endereco=flask.request.form.get('endereco')
    novo_nome=flask.request.form.get('nomeedit')
    novo_telefone=flask.request.form.get('telefoneedit')
    novo_endereco=flask.request.form.get('enderecoedit')
    return flask.render_template('clientes.html')


@app.route('/login',methods=['GET'])
def login():
    nome=flask.request.form.get('emailuser')
    senha=str(flask.request.form.get('senhauser'))
    if nome == 'BLK@gmail.com' and senha == '12345':
        return flask.render_template('agenda.html')
    else:
        return flask.render_template('login.html')
    
    
@app.route('/servico',methods=['GET'])
def servicos():
    servico_nome=flask.request.form.get('servinome')
    servico_valor=flask.request.form.get('servivalor')
    servico_descricao=flask.request.form.get('servidescricao')
    return flask.render_template('servicos.html')
if __name__ == '__main__':
    app.run(debug=True)