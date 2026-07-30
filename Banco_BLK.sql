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
    nome_atendimento VARCHAR(150),
    descricao TEXT,
    valor_total DECIMAL(10,2),
    status ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'),
    data_conclusao DATE,
    data_atendimento DATE NOT NULL,

    CONSTRAINT fk_atendimento_cliente
        FOREIGN KEY (ID_cliente)
        REFERENCES Cliente(ID_cliente)
);

-- Migração para bancos criados antes dos campos acima.
SET @tem_nome_atendimento = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Atendimento'
      AND COLUMN_NAME = 'nome_atendimento'
);
SET @sql_nome_atendimento = IF(
    @tem_nome_atendimento = 0,
    'ALTER TABLE Atendimento ADD COLUMN nome_atendimento VARCHAR(150) NULL AFTER ID_cliente',
    'SELECT 1'
);
PREPARE stmt_nome_atendimento FROM @sql_nome_atendimento;
EXECUTE stmt_nome_atendimento;
DEALLOCATE PREPARE stmt_nome_atendimento;

SET @tem_descricao_atendimento = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Atendimento'
      AND COLUMN_NAME = 'descricao'
);
SET @sql_descricao_atendimento = IF(
    @tem_descricao_atendimento = 0,
    'ALTER TABLE Atendimento ADD COLUMN descricao TEXT NULL AFTER nome_atendimento',
    'SELECT 1'
);
PREPARE stmt_descricao_atendimento FROM @sql_descricao_atendimento;
EXECUTE stmt_descricao_atendimento;
DEALLOCATE PREPARE stmt_descricao_atendimento;

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

-- 1. Adiciona a coluna "valor" na tabela Atendimento_Servico
ALTER TABLE Atendimento_Servico
ADD COLUMN valor DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 2. Remove as triggers antigas
DROP TRIGGER IF EXISTS trg_calcular_valor_total_insert;
DROP TRIGGER IF EXISTS trg_calcular_valor_total_update;
DROP TRIGGER IF EXISTS trg_calcular_valor_total_delete;

DELIMITER $$

-- ==========================================
-- INSERT
-- Calcula o valor do serviço e o valor total
-- ==========================================
CREATE TRIGGER trg_calcular_valor_total_insert
BEFORE INSERT ON Atendimento_Servico
FOR EACH ROW
BEGIN
    DECLARE v_valor_base DECIMAL(10,2);

    SELECT valor_base
    INTO v_valor_base
    FROM Servico
    WHERE ID_servico = NEW.ID_servico;

    SET NEW.valor = v_valor_base * NEW.quantidade;
END$$

CREATE TRIGGER trg_atualizar_total_insert
AFTER INSERT ON Atendimento_Servico
FOR EACH ROW
BEGIN
    UPDATE Atendimento
    SET valor_total = (
        SELECT IFNULL(SUM(valor),0)
        FROM Atendimento_Servico
        WHERE ID_atendimento = NEW.ID_atendimento
    )
    WHERE ID_atendimento = NEW.ID_atendimento;
END$$

-- ==========================================
-- UPDATE
-- ==========================================
CREATE TRIGGER trg_calcular_valor_total_update
BEFORE UPDATE ON Atendimento_Servico
FOR EACH ROW
BEGIN
    DECLARE v_valor_base DECIMAL(10,2);

    SELECT valor_base
    INTO v_valor_base
    FROM Servico
    WHERE ID_servico = NEW.ID_servico;

    SET NEW.valor = v_valor_base * NEW.quantidade;
END$$

CREATE TRIGGER trg_atualizar_total_update
AFTER UPDATE ON Atendimento_Servico
FOR EACH ROW
BEGIN
    UPDATE Atendimento
    SET valor_total = (
        SELECT IFNULL(SUM(valor),0)
        FROM Atendimento_Servico
        WHERE ID_atendimento = NEW.ID_atendimento
    )
    WHERE ID_atendimento = NEW.ID_atendimento;
END$$

-- ==========================================
-- DELETE
-- ==========================================
CREATE TRIGGER trg_calcular_valor_total_delete
AFTER DELETE ON Atendimento_Servico
FOR EACH ROW
BEGIN
    UPDATE Atendimento
    SET valor_total = (
        SELECT IFNULL(SUM(valor),0)
        FROM Atendimento_Servico
        WHERE ID_atendimento = OLD.ID_atendimento
    )
    WHERE ID_atendimento = OLD.ID_atendimento;
END$$

DELIMITER ;

ALTER TABLE Lembrete
ADD COLUMN ID_atendimento INT NULL,
ADD CONSTRAINT fk_lembrete_atendimento
    FOREIGN KEY (ID_atendimento)
    REFERENCES Atendimento(ID_atendimento);
