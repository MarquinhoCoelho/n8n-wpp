import { sql } from './db.js'

async function createTables() {
  try {
    // Tabela de Leads
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        chat_id TEXT PRIMARY KEY,
        name TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        entrada NUMERIC,
        salario_bruto NUMERIC
      );
    `;
    console.log('Tabela "leads" criada ou já existente.');

    // Tabela de Protocolos
    await sql`
      CREATE TABLE IF NOT EXISTS protocols (
        id UUID PRIMARY KEY,
        chat_id TEXT NOT NULL UNIQUE,
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
    `;
    console.log('Tabela "protocols" criada ou já existente.');

    // Tabela de Mensagens
    await sql`
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
    `;
    console.log('Tabela "messages" criada ou já existente.');

    console.log('Todas as tabelas verificadas/criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    process.exit(1); // Encerra o processo em caso de erro
  }
}

createTables();
