import { sql } from './db.js';

export class DatabasePostgres {

// LEADS //

  async getLeadByChatId(chatId) {
    const [lead] = await sql`SELECT * FROM leads WHERE chat_id = ${chatId}`;
    return lead;
  }

  // tem que fazer uma paginação aqui
  async getLeads() {
    const leads = await sql`SELECT * FROM leads`;
    return leads;
  }

  async createLead(leadData) {
    const { chatId, name, phone, email, ...outrosCampos } = leadData;

    const [novoLead] = await sql`
      INSERT INTO leads (chat_id, name, phone, email, custom_fields)
      VALUES (${chatId}, ${name}, ${phone}, ${email}, ${outrosCampos})
      RETURNING chat_id, createdat
    `;

    return novoLead;
  }

  async editLead(leadData) {
    const { chatId, name, phone, email, ...outrosCampos } = leadData;
    if (!chatId || !name || !phone || !email) {
      throw new Error('Dados obrigatórios ausentes');
    }
    try {
      const [leadExists] = await sql`SELECT 1 FROM leads WHERE chat_id = ${chatId}`;
      if (!leadExists) {
        throw new Error('Lead não encontrado');
      }
      const [updatedLead] = await sql`
        UPDATE leads
        SET
          name = ${name},
          phone = ${phone},
          email = ${email},
          custom_fields = ${outrosCampos}
        WHERE chat_id = ${chatId}
        RETURNING chat_id, createdat
      `;
      return updatedLead;
    } catch (err) {
      throw new Error('Erro ao editar lead: ' + err.message);
    }
  }

  async deleteLead(chatId) {
    if (!chatId) {
      throw new Error('chatId obrigatório');
    }
    try {
      const [leadExists] = await sql`SELECT 1 FROM leads WHERE chat_id = ${chatId}`;
      if (!leadExists) {
        throw new Error('Lead não encontrado');
      }
      const [deletedLead] = await sql`
        DELETE FROM leads
        WHERE chat_id = ${chatId}
        RETURNING chat_id, createdat
      `;
      return deletedLead;
    } catch (err) {
      throw new Error('Erro ao deletar lead: ' + err.message);
    }
  }

  // Protocols //

  // PROTOCOLS //

async getProtocolById(id) {
  const [protocol] = await sql`SELECT * FROM protocols WHERE id = ${id}`;
  return protocol;
}

async getProtocols() {
  const protocols = await sql`SELECT * FROM protocols`;
  return protocols;
}

async createProtocol(protocolData) {
  const {
    id,
    chat_id,
    human = false,
    hot_lead,
    status,
    attendant_id,
    last_message
  } = protocolData;

  const [newProtocol] = await sql`
    INSERT INTO protocols (
      id, chat_id, human, hot_lead, status, attendant_id, last_message
    )
    VALUES (
      ${id}, ${chat_id}, ${human}, ${hot_lead}, ${status}, ${attendant_id}, ${last_message}
    )
    RETURNING id, created_at
  `;
  return newProtocol;
}

async editProtocol(protocolData) {
  const {
    id,
    chat_id,
    human = false,
    hot_lead,
    status,
    attendant_id,
    last_message
  } = protocolData;
  if (!id || !chat_id || !status) {
    throw new Error('Dados obrigatórios ausentes');
  }
  try {
    const [protocolExists] = await sql`SELECT 1 FROM protocols WHERE id = ${id}`;
    if (!protocolExists) {
      throw new Error('Protocolo não encontrado');
    }
    const [updatedProtocol] = await sql`
      UPDATE protocols
      SET
        chat_id = ${chat_id},
        human = ${human},
        hot_lead = ${hot_lead},
        status = ${status},
        attendant_id = ${attendant_id},
        last_message = ${last_message},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, updated_at
    `;
    return updatedProtocol;
  } catch (err) {
    throw new Error('Erro ao editar protocolo: ' + err.message);
  }
}

async deleteProtocol(id) {
  if (!id) {
    throw new Error('ID obrigatório');
  }
  try {
    const [protocolExists] = await sql`SELECT 1 FROM protocols WHERE id = ${id}`;
    if (!protocolExists) {
      throw new Error('Protocolo não encontrado');
    }
    const [deletedProtocol] = await sql`
      DELETE FROM protocols
      WHERE id = ${id}
      RETURNING id, created_at
    `;
    return deletedProtocol;
  } catch (err) {
    throw new Error('Erro ao deletar protocolo: ' + err.message);
  }
}

// MESSAGES //

async getMessageById(id) {
  const [message] = await sql`SELECT * FROM messages WHERE id = ${id}`;
  return message;
}

async getMessages() {
  const messages = await sql`SELECT * FROM messages`;
  return messages;
}

async createMessage(messageData) {
  const {
    id,
    protocol_id,
    message_text,
    sending_type
  } = messageData;

  const [newMessage] = await sql`
    INSERT INTO messages (
      id, protocol_id, message_text, sending_type
    )
    VALUES (
      ${id}, ${protocol_id}, ${message_text}, ${sending_type}
    )
    RETURNING id, created_at
  `;
  return newMessage;
}

async editMessage(messageData) {
  const {
    id,
    protocol_id,
    message_text,
    sending_type
  } = messageData;
  if (!id || !protocol_id || !message_text || !sending_type) {
    throw new Error('Dados obrigatórios ausentes');
  }
  try {
    const [messageExists] = await sql`SELECT 1 FROM messages WHERE id = ${id}`;
    if (!messageExists) {
      throw new Error('Mensagem não encontrada');
    }
    const [updatedMessage] = await sql`
      UPDATE messages
      SET
        protocol_id = ${protocol_id},
        message_text = ${message_text},
        sending_type = ${sending_type}
      WHERE id = ${id}
      RETURNING id, created_at
    `;
    return updatedMessage;
  } catch (err) {
    throw new Error('Erro ao editar mensagem: ' + err.message);
  }
}

async deleteMessage(id) {
  if (!id) {
    throw new Error('ID obrigatório');
  }
  try {
    const [messageExists] = await sql`SELECT 1 FROM messages WHERE id = ${id}`;
    if (!messageExists) {
      throw new Error('Mensagem não encontrada');
    }
    const [deletedMessage] = await sql`
      DELETE FROM messages
      WHERE id = ${id}
      RETURNING id, created_at
    `;
    return deletedMessage;
  } catch (err) {
    throw new Error('Erro ao deletar mensagem: ' + err.message);
  }
}

}
