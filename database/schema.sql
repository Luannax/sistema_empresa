-- Schema do banco de dados PostgreSQL para Supabase

-- Tabela de usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    nome_usuario VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    prioridade VARCHAR(20) CHECK (prioridade IN ('ADM', 'VENDEDOR')) DEFAULT 'VENDEDOR',
    status VARCHAR(20) CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_login TIMESTAMP WITH TIME ZONE,
    session_id VARCHAR(255), -- ID único da sessão para controle de acesso
    session_created_at TIMESTAMP WITH TIME ZONE, -- Quando a sessão foi criada
    device_info TEXT, -- Informações do dispositivo (opcional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20) UNIQUE NOT NULL,
    celular VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    endereco TEXT NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('ativo', 'inativo')) DEFAULT 'ativo',
    observacoes TEXT,
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inscricao_estadual VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    vendedor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    vendedor VARCHAR(255) NOT NULL, -- Manter para compatibilidade
    discriminacao TEXT,
    quantidade DECIMAL(10,2) DEFAULT 0,
    unidade VARCHAR(50),
    valor_unitario DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    data_pedido TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comando para migração (caso a tabela já exista):
-- ALTER TABLE pedidos ALTER COLUMN data_pedido TYPE TIMESTAMP WITH TIME ZONE;

-- Índices para melhor performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_prioridade ON usuarios(prioridade);
CREATE INDEX idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_vendedor_id ON pedidos(vendedor_id);
CREATE INDEX idx_pedidos_data ON pedidos(data_pedido);
CREATE INDEX idx_pedidos_vendedor ON pedidos(vendedor);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at 
    BEFORE UPDATE ON pedidos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Política de segurança (RLS) - Ajustar conforme necessário
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajustar para seu caso)
CREATE POLICY "Permitir acesso total" ON usuarios FOR ALL USING (true);
CREATE POLICY "Permitir acesso total" ON clientes FOR ALL USING (true);
CREATE POLICY "Permitir acesso total" ON pedidos FOR ALL USING (true);

-- Dados de exemplo (opcional)

-- Inserir usuários padrão
INSERT INTO usuarios (nome, nome_usuario, email, senha, prioridade, status) VALUES
('Administrador', 'admin', 'admin@soma.com', '123', 'ADM', 'ativo');