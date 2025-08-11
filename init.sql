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

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY,
    protocol_id UUID NOT NULL,
    message_text TEXT NOT NULL,
    sending_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_protocol_id
        FOREIGN KEY(protocol_id) 
        REFERENCES protocols(id)
        ON DELETE CASCADE
);