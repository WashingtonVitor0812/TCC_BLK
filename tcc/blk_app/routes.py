from datetime import date
from decimal import Decimal, InvalidOperation
from functools import wraps
import os
from flask import Blueprint, flash, jsonify, redirect, render_template, request, session, url_for
from sqlalchemy import func
from werkzeug.security import check_password_hash
from .extensions import db
from .models import Atendimento, AtendimentoServico, Cliente, Lembrete, Servico

web = Blueprint("web", __name__)
STATUS = {"PENDENTE", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"}
LIMITES = {"cliente_nome": 100, "cliente_telefone": 20, "cliente_endereco": 255,
           "cliente_link_endereco": 255, "servico_nome": 100, "atendimento_nome": 150,
           "texto": 65535}


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        return view(*args, **kwargs) if session.get("logado") else redirect(url_for("web.login"))
    return wrapped


def erro(message, status=400):
    return jsonify(success=False, erro=message), status


def validar_tamanho(valor, limite, campo):
    if valor is not None and len(str(valor)) > limite:
        raise ValueError(f"{campo} deve ter no maximo {limite} caracteres.")


def credenciais_login_validas(email, senha):
    """Compara as credenciais recebidas com os hashes definidos no .env."""
    hash_email = os.getenv("LOGIN_EMAIL_HASH", "")
    hash_senha = os.getenv("LOGIN_PASSWORD_HASH", "")
    if not hash_email or not hash_senha:
        return False
    try:
        return (
            check_password_hash(hash_email, str(email or "").strip().lower())
            and check_password_hash(hash_senha, str(senha or ""))
        )
    except (ValueError, TypeError):
        return False


def cliente_json(cliente):
    return {"id": cliente.id, "nome": cliente.nome, "telefone": cliente.telefone,
            "endereco": cliente.endereco, "dataCadastro": str(cliente.data_cadastro),
            "linkEndereco": cliente.link_endereco,
            "criadoEm": cliente.criado_em.isoformat() if cliente.criado_em else None,
            "editadoEm": cliente.atualizado_em.isoformat() if cliente.atualizado_em else None}


def servico_json(servico):
    return {"id": servico.id, "nome": servico.nome, "valorBase": float(servico.valor_base),
            "descricao": servico.descricao,
            "criadoEm": servico.criado_em.isoformat() if servico.criado_em else None,
            "editadoEm": servico.atualizado_em.isoformat() if servico.atualizado_em else None}


def atendimento_json(atendimento, detalhado=False):
    dados = {"id": atendimento.id, "id_cliente": atendimento.cliente_id,
             "cliente": atendimento.cliente.nome, "nome": atendimento.nome,
             "descricao": atendimento.descricao or "", "status": atendimento.status or "PENDENTE",
             "data_atendimento": str(atendimento.data_atendimento),
             "data_conclusao": str(atendimento.data_conclusao) if atendimento.data_conclusao else None,
             "desconto": float(atendimento.desconto or 0),
             "valor_total": float(atendimento.valor_total or 0),
             "criadoEm": atendimento.criado_em.isoformat() if atendimento.criado_em else None,
             "editadoEm": atendimento.atualizado_em.isoformat() if atendimento.atualizado_em else None}
    lembrete = max(atendimento.lembretes, key=lambda item: item.id, default=None)
    dados["data_lembrete"] = str(lembrete.data) if lembrete else None
    if detalhado:
        dados["servicos"] = [{"id": item.servico_id, "nome": item.servico.nome,
            "quantidade": item.quantidade, "valorUnitario": float(item.servico.valor_base),
            "valor": float(item.valor or item.servico.valor_base * item.quantidade)} for item in atendimento.itens]
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
    validar_tamanho(nome, LIMITES["atendimento_nome"], "Nome do atendimento")
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
    try: desconto = Decimal(str(dados.get("desconto", 0)))
    except (InvalidOperation, TypeError, ValueError): raise ValueError("Desconto inválido.")
    if desconto < 0: raise ValueError("O desconto não pode ser negativo.")
    descricao = dados.get("descricao")
    validar_tamanho(descricao, LIMITES["texto"], "Descricao")
    return nome, cliente, status, data_atendimento, data_conclusao, descricao, desconto, selecionados


@web.get("/")
def login(): return render_template("login.html")

@web.post("/")
def verificar_login():
    if credenciais_login_validas(request.form.get("email"), request.form.get("senha")):
        session.clear()
        session["logado"] = True; flash("Login realizado com sucesso!", "success"); return redirect(url_for("web.agenda"))
    flash("E-mail ou senha inválidos.", "error"); return redirect(url_for("web.login"))


@web.post("/logout")
@login_required
def logout():
    session.clear()
    flash("Sessao encerrada com sucesso.", "success")
    return redirect(url_for("web.login"))


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
        validar_tamanho(cliente.nome, LIMITES["cliente_nome"], "Nome do cliente")
        validar_tamanho(cliente.telefone, LIMITES["cliente_telefone"], "Telefone")
        validar_tamanho(cliente.endereco, LIMITES["cliente_endereco"], "Endereco")
        validar_tamanho(cliente.link_endereco, LIMITES["cliente_link_endereco"], "Link do endereco")
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
        validar_tamanho(servico.nome, LIMITES["servico_nome"], "Nome do servico")
        validar_tamanho(servico.descricao, LIMITES["texto"], "Descricao")
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
        nome, cliente, status, data_atendimento, data_conclusao, descricao, desconto, itens = parse_atendimento(request.get_json(silent=True))
        atendimento = Atendimento(cliente=cliente, nome=nome, descricao=descricao.strip() if isinstance(descricao, str) else None, desconto=desconto, status=status, data_atendimento=data_atendimento, data_conclusao=data_conclusao)
        db.session.add(atendimento); db.session.flush()
        total = Decimal("0")
        for servico, quantidade in itens:
            valor = servico.valor_base * quantidade; total += valor
            db.session.add(AtendimentoServico(atendimento=atendimento, servico=servico, quantidade=quantidade, valor=valor))
        if desconto > total: return erro("O desconto não pode ser maior que o subtotal.")
        atendimento.valor_total = total - desconto; db.session.commit()
        return jsonify(success=True, id=atendimento.id, desconto=float(desconto), valor_total=float(atendimento.valor_total), mensagem="Atendimento cadastrado com sucesso!"), 201
    except (ValueError, LookupError) as exc: return erro(str(exc), 400)
    except Exception as exc: db.session.rollback(); return erro(str(exc), 500)

@web.post("/api/atendimentos/<int:id_atendimento>/concluir")
@login_required
def concluir_atendimento(id_atendimento):
    atendimento = db.session.get(Atendimento, id_atendimento)
    if not atendimento:
        return erro("Atendimento não encontrado.", 404)
    try:
        atendimento.status = "CONCLUIDO"
        atendimento.data_conclusao = date.today()
        db.session.commit()
        return jsonify(success=True, atendimento=atendimento_json(atendimento), mensagem="Atendimento concluído com sucesso!")
    except Exception as exc:
        db.session.rollback()
        return erro(str(exc), 500)

@web.patch("/api/atendimentos/<int:id_atendimento>/status")
@login_required
def atualizar_status_atendimento(id_atendimento):
    atendimento = db.session.get(Atendimento, id_atendimento)
    if not atendimento: return erro("Atendimento nao encontrado.", 404)
    status = str((request.get_json(silent=True) or {}).get("status", "")).strip().upper()
    if status not in STATUS: return erro("Status invalido.")
    try:
        atendimento.status = status
        atendimento.data_conclusao = date.today() if status == "CONCLUIDO" else None
        db.session.commit()
        return jsonify(success=True, atendimento=atendimento_json(atendimento), mensagem="Status atualizado com sucesso!")
    except Exception as exc:
        db.session.rollback()
        return erro(str(exc), 500)


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
        nome, cliente, status, data_atendimento, data_conclusao, descricao, desconto, itens = parse_atendimento(request.get_json(silent=True), atendimento)
        atendimento.nome, atendimento.cliente, atendimento.status = nome, cliente, status
        atendimento.data_atendimento, atendimento.data_conclusao = data_atendimento, data_conclusao
        atendimento.descricao = descricao.strip() if isinstance(descricao, str) else None
        atendimento.desconto = desconto
        atendimento.itens.clear(); total = Decimal("0")
        for servico, quantidade in itens:
            valor = servico.valor_base * quantidade; total += valor
            atendimento.itens.append(AtendimentoServico(servico=servico, quantidade=quantidade, valor=valor))
        if desconto > total: return erro("O desconto não pode ser maior que o subtotal.")
        atendimento.valor_total = total - desconto; db.session.commit()
        return jsonify(success=True, id=atendimento.id, desconto=float(desconto), valor_total=float(atendimento.valor_total), mensagem="Atendimento atualizado com sucesso!")
    except (ValueError, LookupError) as exc: return erro(str(exc), 400)
    except Exception as exc: db.session.rollback(); return erro(str(exc), 500)


def dados_lembrete(dados):
    try: atendimento = db.session.get(Atendimento, int(dados.get("id_atendimento"))); data_lembrete = date.fromisoformat(dados.get("data"))
    except (TypeError, ValueError): raise ValueError("Atendimento ou data inválidos.")
    if not atendimento: raise LookupError("Atendimento não encontrado.")
    descricao = str(dados.get("descricao") or "").strip()
    validar_tamanho(descricao, LIMITES["texto"], "Descricao")
    return atendimento, data_lembrete, descricao

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
