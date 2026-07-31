from .extensions import db


class Cliente(db.Model):
    __tablename__ = "Cliente"
    id = db.Column("ID_cliente", db.Integer, primary_key=True)
    nome = db.Column("nome_cliente", db.String(100), nullable=False)
    telefone = db.Column(db.String(20))
    data_cadastro = db.Column(db.Date, nullable=False)
    endereco = db.Column(db.String(255))
    link_endereco = db.Column("link_endereco", db.String(255))
    atendimentos = db.relationship("Atendimento", back_populates="cliente")


class Servico(db.Model):
    __tablename__ = "Servico"
    id = db.Column("ID_servico", db.Integer, primary_key=True)
    nome = db.Column("nome_servico", db.String(100), nullable=False)
    valor_base = db.Column(db.Numeric(10, 2), nullable=False)
    descricao = db.Column(db.Text)


class Atendimento(db.Model):
    __tablename__ = "Atendimento"
    id = db.Column("ID_atendimento", db.Integer, primary_key=True)
    cliente_id = db.Column("ID_cliente", db.Integer, db.ForeignKey("Cliente.ID_cliente"), nullable=False)
    nome = db.Column("nome_atendimento", db.String(150))
    descricao = db.Column(db.Text)
    valor_total = db.Column(db.Numeric(10, 2))
    status = db.Column(db.String(20))
    data_conclusao = db.Column(db.Date)
    data_atendimento = db.Column(db.Date, nullable=False)
    cliente = db.relationship("Cliente", back_populates="atendimentos")
    itens = db.relationship("AtendimentoServico", cascade="all, delete-orphan", back_populates="atendimento")
    lembretes = db.relationship("Lembrete", cascade="all, delete-orphan", back_populates="atendimento")


class AtendimentoServico(db.Model):
    __tablename__ = "Atendimento_Servico"
    atendimento_id = db.Column("ID_atendimento", db.Integer, db.ForeignKey("Atendimento.ID_atendimento"), primary_key=True)
    servico_id = db.Column("ID_servico", db.Integer, db.ForeignKey("Servico.ID_servico"), primary_key=True)
    quantidade = db.Column(db.Integer, nullable=False, default=1)
    valor = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    atendimento = db.relationship("Atendimento", back_populates="itens")
    servico = db.relationship("Servico")


class Lembrete(db.Model):
    __tablename__ = "Lembrete"
    id = db.Column("ID_lembrete", db.Integer, primary_key=True)
    atendimento_id = db.Column("ID_atendimento", db.Integer, db.ForeignKey("Atendimento.ID_atendimento"))
    data = db.Column("data_lembrete", db.Date, nullable=False)
    descricao = db.Column(db.Text)
    atendimento = db.relationship("Atendimento", back_populates="lembretes")
