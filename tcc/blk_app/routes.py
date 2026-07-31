from datetime import date
from decimal import Decimal, InvalidOperation
from functools import wraps
from flask import Blueprint, flash, jsonify, redirect, render_template, request, session, url_for
from sqlalchemy import func
from .extensions import db
from .models import Atendimento, AtendimentoServico, Cliente, Lembrete, Servico

web = Blueprint("web", __name__)
STATUS = {"PENDENTE", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"}


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        return view(*args, **kwargs) if session.get("logado") else redirect(url_for("web.login"))
    return wrapped


def erro(message, status=400):
    return jsonify(success=False, erro=message), status


def cliente_json(cliente):
    return {"id": cliente.id, "nome": cliente.nome, "telefone": cliente.telefone,
            "endereco": cliente.endereco, "dataCadastro": str(cliente.data_cadastro),
            "linkEndereco": cliente.link_endereco}


def servico_json(servico):
    return {"id": servico.id, "nome": servico.nome, "valorBase": float(servico.valor_base),
            "descricao": servico.descricao}


def atendimento_json(atendimento, detalhado=False):
    dados = {"id": atendimento.id, "id_cliente": atendimento.cliente_id,
             "cliente": atendimento.cliente.nome, "nome": atendimento.nome,
             "descricao": atendimento.descricao or "", "status": atendimento.status or "PENDENTE",
             "data_atendimento": str(atendimento.data_atendimento),
             "data_conclusao": str(atendimento.data_conclusao) if atendimento.data_conclusao else None,
             "valor_total": float(atendimento.valor_total or 0)}
    if detalhado:
        dados["servicos"] = [{"id": item.servico_id, "nome": item.servico.nome,
            "quantidade": item.quantidade, "valorUnitario": float(item.servico.valor_base),
            "valor": float(item.valor or item.servico.valor_base * item.quantidade)} for item in atendimento.itens]
        lembrete = max(atendimento.lembretes, key=lambda item: item.id, default=None)
        dados["lembrete"] = {"id": lembrete.id} if lembrete else None
    else:
        dados["servicos"] = ", ".join(item.servico.nome for item in atendimento.itens) or "Sem serviço informado"
        dados["titulo"] = f"{dados['cliente']} — {dados['servicos']}"
    return dados


def parse_atendimento(dados, existente=None):
    if not isinstance(dados, dict):
        raise ValueError("Formato inválido.")
    nome = str(dados.get("nome", "")).strip()
    if not nome: raise ValueError("Nome do atendimento não informado.")
    try: cliente_id = int(dados.get("id_cliente", dados.get("cliente_id")))
    except (TypeError, ValueError): raise ValueError("Cliente não informado.")
    cliente = db.session.get(Cliente, cliente_id)
    if not cliente: raise LookupError("Cliente não encontrado.")
    status = str(dados.get("status", existente.status if existente else "PENDENTE")).strip().upper().replace(" ", "_")
    if status not in STATUS: raise ValueError("Status inválido.")
    try: data_atendimento = date.fromisoformat(dados.get("data_atendimento") or str(existente.data_atendimento if existente else date.today()))
    except ValueError: raise ValueError("Data do atendimento inválida.")
    data_conclusao = dados.get("data_conclusao")
    try: data_conclusao = date.fromisoformat(data_conclusao) if data_conclusao else None
    except ValueError: raise ValueError("Data de conclusão inválida.")
    itens = dados.get("servicos")
    if not isinstance(itens, list) or not itens: raise ValueError("Adicione pelo menos um serviço ao atendimento.")
    selecionados, ids = [], set()
    for item in itens:
        try: servico_id, quantidade = int(item.get("servico_id")), int(item.get("quantidade"))
        except (AttributeError, TypeError, ValueError): raise ValueError("Serviços do atendimento inválidos.")
        if quantidade < 1 or servico_id in ids: raise ValueError("Serviços do atendimento inválidos.")
        servico = db.session.get(Servico, servico_id)
        if not servico: raise LookupError("Um ou mais serviços não foram encontrados.")
        ids.add(servico_id); selecionados.append((servico, quantidade))
    return nome, cliente, status, data_atendimento, data_conclusao, dados.get("descricao"), selecionados


@web.get("/")
def login(): return render_template("login.html")

@web.post("/")
def verificar_login():
    if request.form.get("email") == "BLK@gmail.com" and request.form.get("senha") == "12345":
        session["logado"] = True; flash("Login realizado com sucesso!", "success"); return redirect(url_for("web.agenda"))
    flash("E-mail ou senha inválidos.", "error"); return redirect(url_for("web.login"))


@web.get("/agenda")
@login_required
def agenda():
    dados = [{"id": l.id, "id_atendimento": l.atendimento_id, "data": str(l.data),
              "atendimento": f"{l.atendimento.cliente.nome} — {', '.join(i.servico.nome for i in l.atendimento.itens)}" if l.atendimento else "Atendimento não encontrado",
              "descricao": l.descricao or ""} for l in Lembrete.query.order_by(Lembrete.data).all()]
    return render_template("agenda.html", dados=dados)

@web.get("/clientes")
@login_required
def clientes(): return render_template("clientes.html", clientes=[cliente_json(c) for c in Cliente.query.all()])

@web.get("/servico")
@login_required
def servicos(): return render_template("servicos.html", servicos=[servico_json(s) for s in Servico.query.all()])

@web.get("/atendimentos")
@login_required
def atendimentos(): return render_template("atendimentos.html")

@web.get("/criar_atendimentos")
@login_required
def criar_atendimento():
    return render_template("criar_atendimentos.html", clientes=[cliente_json(c) for c in Cliente.query.all()], servicos=[servico_json(s) for s in Servico.query.all()])

@web.get("/api/clientes")
@login_required
def api_clientes(): return jsonify([cliente_json(c) for c in Cliente.query.order_by(Cliente.nome).all()])

@web.route("/pegar_cliente", methods=["POST", "PUT", "DELETE"])
@login_required
def pegar_cliente():
    dados = request.get_json(silent=True) or {}
    try:
        if request.method == "POST":
            cliente = Cliente(nome=str(dados.get("nome", "")).strip(), telefone=dados.get("telefone"), endereco=dados.get("endereco"), link_endereco=dados.get("linkEndereco"), data_cadastro=date.today())
            if not cliente.nome: return erro("Nome do cliente não informado.")
            db.session.add(cliente); mensagem = "Cliente cadastrado com sucesso!"
        else:
            cliente = db.session.get(Cliente, dados.get("id"))
            if not cliente: return erro("Cliente não encontrado.", 404)
            if request.method == "DELETE": db.session.delete(cliente); mensagem = "Cliente excluído com sucesso!"
            else:
                cliente.nome = str(dados.get("nome", "")).strip(); cliente.telefone = dados.get("telefone"); cliente.endereco = dados.get("endereco"); cliente.link_endereco = dados.get("linkEndereco")
                if not cliente.nome: return erro("Nome do cliente não informado.")
                mensagem = "Cliente atualizado com sucesso!"
        db.session.commit(); return jsonify(success=True, mensagem=mensagem)
    except Exception as exc: db.session.rollback(); return erro(str(exc), 500)

@web.get("/api/servicos")
@login_required
def api_servicos(): return jsonify([servico_json(s) for s in Servico.query.order_by(Servico.nome).all()])

@web.route("/pegar_servico", methods=["POST", "PUT", "DELETE"])
@login_required
def pegar_servico():
    dados = request.get_json(silent=True) or {}
    try:
        if request.method == "POST": servico = Servico(); db.session.add(servico); mensagem = "Serviço cadastrado com sucesso!"
        else:
            servico = db.session.get(Servico, dados.get("id"))
            if not servico: return erro("Serviço não encontrado.", 404)
            if request.method == "DELETE": db.session.delete(servico); db.session.commit(); return jsonify(success=True, mensagem="Serviço excluído com sucesso!")
            mensagem = "Serviço atualizado com sucesso!"
        servico.nome = str(dados.get("nome", "")).strip(); servico.descricao = dados.get("descricao")
        try: servico.valor_base = Decimal(str(dados.get("valorBase")))
        except (InvalidOperation, ValueError): return erro("Valor base inválido.")
        if not servico.nome or servico.valor_base < 0: return erro("Nome ou valor base inválido.")
        db.session.commit(); return jsonify(success=True, mensagem=mensagem)
    except Exception as exc: db.session.rollback(); return erro(str(exc), 500)


@web.get("/api/atendimentos")
@login_required
def api_atendimentos():
    return jsonify([atendimento_json(a) for a in Atendimento.query.order_by(Atendimento.data_atendimento.desc()).all()])

@web.route("/api/atendimentos", methods=["POST"])
@login_required
def criar_atendimento_api():
    try:
        nome, cliente, status, data_atendimento, data_conclusao, descricao, itens = parse_atendimento(request.get_json(silent=True))
        atendimento = Atendimento(cliente=cliente, nome=nome, descricao=descricao.strip() if isinstance(descricao, str) else None, status=status, data_atendimento=data_atendimento, data_conclusao=data_conclusao)
        db.session.add(atendimento); db.session.flush()
        total = Decimal("0")
        for servico, quantidade in itens:
            valor = servico.valor_base * quantidade; total += valor
            db.session.add(AtendimentoServico(atendimento=atendimento, servico=servico, quantidade=quantidade, valor=valor))
        atendimento.valor_total = total; db.session.commit()
        return jsonify(success=True, id=atendimento.id, valor_total=float(total), mensagem="Atendimento cadastrado com sucesso!"), 201
    except (ValueError, LookupError) as exc: return erro(str(exc), 400)
    except Exception as exc: db.session.rollback(); return erro(str(exc), 500)

@web.route("/api/atendimentos/<int:id_atendimento>", methods=["GET", "PUT", "DELETE"])
@login_required
def atendimento_por_id(id_atendimento):
    atendimento = db.session.get(Atendimento, id_atendimento)
    if not atendimento: return erro("Atendimento não encontrado.", 404)
    if request.method == "GET": return jsonify(success=True, atendimento=atendimento_json(atendimento, True))
    try:
        if request.method == "DELETE":
            db.session.delete(atendimento); db.session.commit()
            return jsonify(success=True, mensagem="Atendimento excluído com sucesso!")
        nome, cliente, status, data_atendimento, data_conclusao, descricao, itens = parse_atendimento(request.get_json(silent=True), atendimento)
        atendimento.nome, atendimento.cliente, atendimento.status = nome, cliente, status
        atendimento.data_atendimento, atendimento.data_conclusao = data_atendimento, data_conclusao
        atendimento.descricao = descricao.strip() if isinstance(descricao, str) else None
        atendimento.itens.clear(); total = Decimal("0")
        for servico, quantidade in itens:
            valor = servico.valor_base * quantidade; total += valor
            atendimento.itens.append(AtendimentoServico(servico=servico, quantidade=quantidade, valor=valor))
        atendimento.valor_total = total; db.session.commit()
        return jsonify(success=True, id=atendimento.id, valor_total=float(total), mensagem="Atendimento atualizado com sucesso!")
    except (ValueError, LookupError) as exc: return erro(str(exc), 400)
    except Exception as exc: db.session.rollback(); return erro(str(exc), 500)


def dados_lembrete(dados):
    try: atendimento = db.session.get(Atendimento, int(dados.get("id_atendimento"))); data_lembrete = date.fromisoformat(dados.get("data"))
    except (TypeError, ValueError): raise ValueError("Atendimento ou data inválidos.")
    if not atendimento: raise LookupError("Atendimento não encontrado.")
    return atendimento, data_lembrete, str(dados.get("descricao") or "").strip()

@web.post("/pegar_dados")
@login_required
def criar_lembrete():
    try:
        atendimento, data_lembrete, descricao = dados_lembrete(request.get_json(silent=True) or {})
        lembrete = Lembrete(atendimento=atendimento, data=data_lembrete, descricao=descricao)
        db.session.add(lembrete); db.session.commit()
        return jsonify(success=True, id=lembrete.id, mensagem="Lembrete cadastrado com sucesso!")
    except (ValueError, LookupError) as exc: return erro(str(exc), 400)
    except Exception as exc: db.session.rollback(); return erro(str(exc), 500)

@web.put("/editar_lembrete")
@login_required
def editar_lembrete():
    dados = request.get_json(silent=True) or {}; lembrete = db.session.get(Lembrete, dados.get("id"))
    if not lembrete: return erro("Lembrete não encontrado.", 404)
    try:
        lembrete.atendimento, lembrete.data, lembrete.descricao = dados_lembrete(dados)
        db.session.commit(); return jsonify(success=True, mensagem="Lembrete atualizado com sucesso!")
    except (ValueError, LookupError) as exc: return erro(str(exc), 400)
    except Exception as exc: db.session.rollback(); return erro(str(exc), 500)

@web.delete("/excluir_lembrete")
@login_required
def excluir_lembrete():
    lembrete = db.session.get(Lembrete, (request.get_json(silent=True) or {}).get("id"))
    if not lembrete: return erro("Lembrete não encontrado.", 404)
    try:
        db.session.delete(lembrete); db.session.commit()
        return jsonify(success=True, mensagem="Lembrete excluído com sucesso!")
    except Exception as exc: db.session.rollback(); return erro(str(exc), 500)
