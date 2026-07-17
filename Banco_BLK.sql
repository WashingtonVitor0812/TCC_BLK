CREATE DATABASE IF NOT EXISTS sistema_atendimento;
USE sistema_atendimento;

-- =========================
-- TABELA: Cliente
-- =========================
CREATE TABLE Cliente (
    ID_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome_cliente VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    data_cadastro DATE NOT NULL,
    endereco VARCHAR(255),
    link_endereco VARCHAR(255)
);

-- =========================
-- TABELA: Atendimento
-- =========================
CREATE TABLE Atendimento (
    ID_atendimento INT AUTO_INCREMENT PRIMARY KEY,
    ID_cliente INT NOT NULL,
    valor_total DECIMAL(10,2),
    status ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'),
    data_conclusao DATE,
    data_atendimento DATE NOT NULL,

    CONSTRAINT fk_atendimento_cliente
        FOREIGN KEY (ID_cliente)
        REFERENCES Cliente(ID_cliente)
);

-- =========================
-- TABELA: Serviço
-- =========================
CREATE TABLE Servico (
    ID_servico INT AUTO_INCREMENT PRIMARY KEY,
    nome_servico VARCHAR(100) NOT NULL,
    valor_base DECIMAL(10,2) NOT NULL,
    descricao TEXT
);

-- =========================
-- TABELA ASSOCIATIVA:
-- Atendimento_Servico
-- (Relacionamento Contém)
-- =========================
CREATE TABLE Atendimento_Servico (
    ID_atendimento INT NOT NULL,
    ID_servico INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,

    PRIMARY KEY (ID_atendimento, ID_servico),

    CONSTRAINT fk_at_servico_atendimento
        FOREIGN KEY (ID_atendimento)
        REFERENCES Atendimento(ID_atendimento),

    CONSTRAINT fk_at_servico_servico
        FOREIGN KEY (ID_servico)
        REFERENCES Servico(ID_servico)
);

-- =========================
-- TABELA: Lembrete
-- =========================
CREATE TABLE Lembrete (
    ID_lembrete INT AUTO_INCREMENT PRIMARY KEY,
    data_lembrete DATE NOT NULL,
    descricao TEXT
);

-- =========================
-- VALOR_TOTAL DERIVADO
-- (valor_base * quantidade)
-- =========================

DELIMITER $$

CREATE TRIGGER trg_calcular_valor_total_insert
AFTER INSERT ON Atendimento_Servico
FOR EACH ROW
BEGIN
    UPDATE Atendimento
    SET valor_total = (
        SELECT SUM(s.valor_base * ats.quantidade)
        FROM Atendimento_Servico ats
        JOIN Servico s
            ON ats.ID_servico = s.ID_servico
        WHERE ats.ID_atendimento = NEW.ID_atendimento
    )
    WHERE ID_atendimento = NEW.ID_atendimento;
END$$

CREATE TRIGGER trg_calcular_valor_total_update
AFTER UPDATE ON Atendimento_Servico
FOR EACH ROW
BEGIN
    UPDATE Atendimento
    SET valor_total = (
        SELECT SUM(s.valor_base * ats.quantidade)
        FROM Atendimento_Servico ats
        JOIN Servico s
            ON ats.ID_servico = s.ID_servico
        WHERE ats.ID_atendimento = NEW.ID_atendimento
    )
    WHERE ID_atendimento = NEW.ID_atendimento;
END$$

CREATE TRIGGER trg_calcular_valor_total_delete
AFTER DELETE ON Atendimento_Servico
FOR EACH ROW
BEGIN
    UPDATE Atendimento
    SET valor_total = (
        SELECT IFNULL(SUM(s.valor_base * ats.quantidade), 0)
        FROM Atendimento_Servico ats
        JOIN Servico s
            ON ats.ID_servico = s.ID_servico
        WHERE ats.ID_atendimento = OLD.ID_atendimento
    )
    WHERE ID_atendimento = OLD.ID_atendimento;
END$$

DELIMITER ;
