import { sql } from './db.js';

export class DatabasePostgres {

  async getLeadByChatId(chatId) {
    const [lead] = await sql`SELECT * FROM leads WHERE chat_id = ${chatId}`;
    return lead;
  }

  async getLeads() {
    const leads = await sql`SELECT * FROM leads`;
    return leads;
  }

  // MÉTODO CORRIGIDO: A palavra "function" foi removida.
  // Dentro de uma classe, métodos são declarados sem ela.
  async createLead(leadData) {
    // 1. Extrair os campos padrão e os campos extras
    const { chatId, name, phone, email, ...outrosCampos } = leadData;

    // 2. O banco de dados vai gerar o 'createdAt' automaticamente.
    //    Usamos a cláusula RETURNING para obter o lead completo de volta.
    const [novoLead] = await sql`
      INSERT INTO leads (chat_id, name, phone, email, custom_fields)
      VALUES (${chatId}, ${name}, ${phone}, ${email}, ${outrosCampos})
      RETURNING chat_id, createdat
    `;

    // 3. Retorna os dados que o banco de dados acabou de criar
    return novoLead;
  }
}
