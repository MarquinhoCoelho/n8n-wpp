import { sql } from './db.js';
import { randomUUID } from 'node:crypto';

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

  // PROTOCOLS //

  async getProtocolById(id) {
    const [protocol] = await sql`SELECT * FROM protocols WHERE id = ${id}`;
    return protocol;
  }

  async getProtocols() {
    const protocols = await sql`SELECT * FROM protocols`;
    return protocols;
  }

  async getProtocolActiveByLead(chatId) {
    const [protocol] = await sql`
      SELECT * FROM protocols
      WHERE chat_id = ${chatId}
        AND status = 'open'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    return protocol;
  }

  async createProtocol(protocolData) {
    const id = randomUUID();
    const {
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
      RETURNING id, created_at, status
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


  // IMOVEIS //

  
  async getImoveis(filter) {
    let query = sql`SELECT * FROM imoveis WHERE 1=1`;

    if (filter.cidade) {
      query = sql`${query} AND cidade ILIKE ${'%' + filter.cidade + '%'}`;
    }
    if (filter.bairro) {
      query = sql`${query} AND bairro ILIKE ${'%' + filter.bairro + '%'}`;
    }
    if (filter.preco_min) {
      query = sql`${query} AND preco >= ${filter.preco_min}`;
    }
    if (filter.preco_max) {
      query = sql`${query} AND preco <= ${filter.preco_max}`;
    }

    const imoveis = await query;
    return imoveis;
  }

  async agendarImportacaoXML(caminhoArquivo) {
  const taskId = randomUUID();
  await sql`
    INSERT INTO importacao_xml (id, caminho_arquivo, status) 
    VALUES (${taskId}, ${caminhoArquivo}, 'pendente')
  `;
}

async buscarProximaTarefaPendente() {
  const result = await sql`
    SELECT * FROM importacao_xml 
    WHERE status = 'pendente' 
    ORDER BY criado_em 
    LIMIT 1
  `;
  return result[0];
}

async atualizarStatusTarefa(taskId, status) {
  await sql`
    UPDATE importacao_xml SET status = ${status} WHERE id = ${taskId}
  `;
}
}
