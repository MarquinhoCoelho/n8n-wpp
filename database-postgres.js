import { randomUUID } from "crypto";
import { sql } from './db.js';

export class DatabasePostgres {

  // Métodos para Leads
  async getLeadByChatId(chatId) {
    const [lead] = await sql`SELECT * FROM leads WHERE chat_id = ${chatId}`;
    return lead;
  }

  async saveOrUpdateLead(leadData) {
    const { 
      chatId, 
      name = null,
      phone = null,
      email = null,
      address = null,
      entrada = null,
      salarioBruto = null 
    } = leadData;

    const existingLead = await this.getLeadByChatId(chatId);

    if (existingLead) {
      await sql`
        UPDATE leads SET
          name = ${name !== null ? name : existingLead.name},
          phone = ${phone !== null ? phone : existingLead.phone},
          email = ${email !== null ? email : existingLead.email},
          address = ${address !== null ? address : existingLead.address},
          entrada = ${entrada !== null ? entrada : existingLead.entrada},
          salario_bruto = ${salarioBruto !== null ? salarioBruto : existingLead.salario_bruto}
        WHERE chat_id = ${chatId}
      `;
      return { message: 'Lead atualizado com sucesso.' };
    } else {
      await sql`
        INSERT INTO leads (chat_id, name, phone, email, address, entrada, salario_bruto)
        VALUES (${chatId}, ${name}, ${phone}, ${email}, ${address}, ${entrada}, ${salarioBruto})
      `;
      return { message: 'Lead criado com sucesso.' };
    }
  }

  // Métodos para Protocolos
  async getActiveProtocolByChatId(chatId) {
    const [protocol] = await sql`
      SELECT * FROM protocols WHERE chat_id = ${chatId} AND status = 'ativo'
    `;
    return protocol;
  }

  async createProtocol(protocol) {
    const id = randomUUID();
    const { human, chatId, lastMessage } = protocol;
    const createdAt = new Date().toISOString();

    const hotLeadValue = protocol.hotLead || null;
    const attendantIdValue = protocol.attendantId || null;

    await sql`
      INSERT INTO protocols (id, human, hot_lead, status, chat_id, last_message, attendant_id, created_at)
      VALUES (${id}, ${human}, ${hotLeadValue}, 'ativo', ${chatId}, ${lastMessage}, ${attendantIdValue}, ${createdAt})
    `;
    
    return { idProtocol: id, createdAt };
  }

  async inactivateProtocol(chatId) {
    const protocol = await this.getActiveProtocolByChatId(chatId);
    
    if (!protocol) {
      return { message: 'Nenhum protocolo ativo encontrado para este chatId.' };
    }

    await sql`
      UPDATE protocols SET
        status = 'inativo',
        updated_at = ${new Date().toISOString()}
      WHERE id = ${protocol.id}
    `;
    return { message: 'Protocolo inativado com sucesso.' };
  }

  async updateProtocolLastMessage(idProtocol, lastMessage) {
    await sql`
      UPDATE protocols SET
        last_message = ${lastMessage},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${idProtocol}
    `;
  }

  // Métodos para Mensagens
  async addMessage(messageData) {
    const id = randomUUID();
    const { idProtocol, message, sendingType } = messageData;

    await sql`
      INSERT INTO messages (id, protocol_id, message_text, sending_type)
      VALUES (${id}, ${idProtocol}, ${message}, ${sendingType})
    `;
    return { id };
  }

  // ===== NOVO MÉTODO PARA LIMPAR O BANCO DE DADOS =====
  async clearAllData() {
    // O comando TRUNCATE é rápido e reinicia as sequências de ID.
    // CASCADE garante que as tabelas sejam limpas na ordem correta para evitar erros de chave estrangeira.
    await sql`
      TRUNCATE TABLE leads, protocols, messages RESTART IDENTITY CASCADE
    `;
    return { message: 'Banco de dados limpo com sucesso para um novo teste.' };
  }
}
