CREATE TABLE IF NOT EXISTS leads (
    chat_id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    email TEXT,
    custom_fields JSONB,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protocols (
    id UUID PRIMARY KEY,
    chat_id TEXT NOT NULL,
    human BOOLEAN DEFAULT FALSE,
    hot_lead TEXT,
    status TEXT NOT NULL,
    attendant_id TEXT,
    last_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_id
        FOREIGN KEY(chat_id) 
        REFERENCES leads(chat_id)
        ON DELETE CASCADE
);

-- CREATE TABLE IF NOT EXISTS messages (
--     id UUID PRIMARY KEY,
--     protocol_id UUID NOT NULL,
--     message_text TEXT NOT NULL,
--     sending_type TEXT NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     CONSTRAINT fk_protocol_id
--         FOREIGN KEY(protocol_id) 
--         REFERENCES protocols(id)
--         ON DELETE CASCADE
-- );

CREATE TABLE IF NOT EXISTS imoveis (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(50) UNIQUE NOT NULL,
    titulo TEXT,
    tipo_transacao VARCHAR(50),
    tipo_imovel VARCHAR(100),
    descricao TEXT,
    preco NUMERIC(15,2),
    moeda VARCHAR(10),
    quartos INT,
    banheiros INT,
    suites INT,
    garagem INT,
    area NUMERIC(10,2),
    unidade_area VARCHAR(50),
    pais VARCHAR(50),
    estado VARCHAR(10),
    cidade VARCHAR(100),
    bairro VARCHAR(100),
    endereco TEXT,
    numero VARCHAR(20),
    complemento TEXT,
    cep VARCHAR(20),
    url_imagem_principal TEXT
);
