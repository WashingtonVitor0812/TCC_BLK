# TCC_BLK

## Aplicação estruturada

O arquivo legado `tcc/integrado.py` foi preservado. A aplicação estruturada usa
Flask-SQLAlchemy e deve ser iniciada pelo novo ponto de entrada:

```powershell
.\.venv\Scripts\python.exe -m tcc.run
```

Instale as dependências no ambiente virtual e configure o arquivo `.env` antes
de executar a aplicação:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Copie `.env.example` para `.env`, informe `DATABASE_URL` e `FLASK_SECRET_KEY`.
O `.env` é carregado automaticamente na inicialização e permanece fora do Git.
As rotas utilizadas pelos arquivos JavaScript foram mantidas para compatibilidade.

## Migrações do banco

O banco atual foi registrado na revisão de linha de base do Alembic. A partir de
agora, após alterar os modelos em `tcc/blk_app/models.py`, gere e aplique uma
nova migração:

```powershell
.\.venv\Scripts\flask.exe --app tcc.run:app db migrate -m "descreva a alteração"
.\.venv\Scripts\flask.exe --app tcc.run:app db upgrade
```

Revise o arquivo gerado em `migrations/versions/` antes de executar o comando
`db upgrade` em um banco compartilhado ou de produção.

## Migrações do banco

As alterações do esquema são versionadas em `migrations/`. Para aplicar as
migrações pendentes, execute:

```powershell
.\.venv\Scripts\python.exe -m flask --app tcc.run db upgrade
```

Para criar uma nova migração após alterar os modelos SQLAlchemy:

```powershell
.\.venv\Scripts\python.exe -m flask --app tcc.run db migrate -m "descricao da alteracao"
```
