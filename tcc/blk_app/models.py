from datetime import datetime
from .extensions import db


class Cliente(db.Model):
    __tablename__ = "cliente"
    id = db.Column("ID_cliente", db.Integer, primary_key=True)
    nome = db.Column("nome_cliente", db.String(100), nullable=False)
    telefone = db.Column(db.String(20))
    data_cadastro = db.Column(db.Date, nullable=False)
    endereco = db.Column(db.String(255))
    link_endereco = db.Column("link_endereco", db.String(255))
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    atendimentos = db.relationship("Atendimento", back_populates="cliente")


class Servico(db.Model):
    __tablename__ = "servico"
    id = db.Column("ID_servico", db.Integer, primary_key=True)
    nome = db.Column("nome_servico", db.String(100), nullable=False)
    valor_base = db.Column(db.Numeric(10, 2), nullable=False)
    descricao = db.Column(db.Text)
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Atendimento(db.Model):
    __tablename__ = "atendimento"
    id = db.Column("ID_atendimento", db.Integer, primary_key=True)
    cliente_id = db.Column("ID_cliente", db.Integer, db.ForeignKey("cliente.ID_cliente"), nullable=False)
    nome = db.Column("nome_atendimento", db.String(150))
    descricao = db.Column(db.Text)
    desconto = db.Column(db.Numeric(10, 2), nullable=False, server_default=db.text("0"))
    valor_total = db.Column(db.Numeric(10, 2))
    status = db.Column(db.Enum("PENDENTE", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"))
    data_conclusao = db.Column(db.Date)
    data_atendimento = db.Column(db.Date, nullable=False)
    criado_em = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    cliente = db.relationship("Cliente", back_populates="atendimentos")
    itens = db.relationship("AtendimentoServico", cascade="all, delete-orphan", back_populates="atendimento")
    lembretes = db.relationship("Lembrete", cascade="all, delete-orphan", back_populates="atendimento")


class AtendimentoServico(db.Model):
    __tablename__ = "atendimento_servico"
    atendimento_id = db.Column("ID_atendimento", db.Integer, db.ForeignKey("atendimento.ID_atendimento"), primary_key=True)
    servico_id = db.Column("ID_servico", db.Integer, db.ForeignKey("servico.ID_servico"), primary_key=True)
    quantidade = db.Column(db.Integer, nullable=False, server_default=db.text("1"))
    valor = db.Column(db.Numeric(10, 2), nullable=False, server_default=db.text("0"))
    atendimento = db.relationship("Atendimento", back_populates="itens")
    servico = db.relationship("Servico")


class Lembrete(db.Model):
    __tablename__ = "lembrete"
    id = db.Column("ID_lembrete", db.Integer, primary_key=True)
    atendimento_id = db.Column("ID_atendimento", db.Integer, db.ForeignKey("atendimento.ID_atendimento"))
    data = db.Column("data_lembrete", db.Date, nullable=False)
    descricao = db.Column(db.Text)
    atendimento = db.relationship("Atendimento", back_populates="lembretes")
