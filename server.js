import fastify from 'fastify'
import { DatabasePostgres } from './database-postgres.js'

const app = fastify()
const database = new DatabasePostgres()

const sending = {
  lead: 'lead',
  ia: 'ia',
  attendant: 'attendant',
  bot: 'bot'
}

// Rotas da API

app.get('/protocols', async (request, reply) => {
  return reply.code(200).send({ message: 'Listagem de protocolos não implementada ainda para todos os protocolos.' });
})

app.get('/lead/:chatId', async (request, reply) => {
  const { chatId } = request.params
  const lead = await database.getLeadByChatId(chatId)
  if (!lead) {
    return reply.code(404).send({ message: 'Lead não encontrado.' })
  }
  return reply.code(200).send(lead)
})

app.post('/saveOrUpdateLead', async (request, reply) => {
  const { chatId, name, phone, email, address, entrada, salarioBruto } = request.body
  if (!chatId) {
    return reply.code(400).send({ message: 'chatId não enviado' })
  }
  const leadData = { chatId, name, phone, email, address, entrada, salarioBruto };
  const result = await database.saveOrUpdateLead(leadData);
  return reply.code(200).send(result);
})

app.post('/inativeProtocol', async (request, reply) => {
  const { chatId } = request.body
  console.log(`[DEBUG] Rota /inativeProtocol chamada para o chatId: ${chatId}`);
  if (!chatId) {
    return reply.code(400).send({ message: 'chatId não enviado' })
  }
  const result = await database.inactivateProtocol(chatId);
  console.log(`[DEBUG] Resultado da inativação:`, result);
  if (result.message === 'Nenhum protocolo ativo encontrado para este chatId') {
    return reply.code(404).send(result);
  }
  return reply.code(200).send(result);
})

// Rota principal para gerenciar protocolos
app.post('/manageProtocols', async (request, reply) => {
  const { chatId, message, sendingType = sending.lead } = request.body
  
  console.log('================================================');
  console.log(`[DEBUG] Rota /manageProtocols chamada para o chatId: ${chatId}`);

  if (!chatId || !message) {
    console.log('[DEBUG] Erro: chatId ou mensagem em falta.');
    return reply.code(400).send({ message: 'chatId e message são obrigatórios' })
  }

  let existingProtocol = await database.getActiveProtocolByChatId(chatId);
  console.log('[DEBUG] Procurando protocolo ativo...');
  
  if (existingProtocol) {
    console.log(`[DEBUG] Protocolo ATIVO encontrado: ${existingProtocol.id}`);
    await database.addMessage({
      idProtocol: existingProtocol.id,
      message: message,
      sendingType: sendingType
    });
    await database.updateProtocolLastMessage(existingProtocol.id, message.slice(0, 20));
    console.log(`[DEBUG] Retornando ID do protocolo existente: ${existingProtocol.id}`);
    console.log('================================================\n');
    return reply
      .code(200)
      .send({
        message: 'Mensagem salva em protocolo existente.',
        idProtocol: existingProtocol.id
      });
  } else {
    console.log('[DEBUG] Nenhum protocolo ATIVO encontrado. Criando um novo...');
    
    // Inativa qualquer protocolo que possa ter ficado para trás (segurança)
    await database.inactivateProtocol(chatId);

    const lead = await database.getLeadByChatId(chatId);
    if (!lead) {
      console.log(`[DEBUG] Lead não encontrado para o chatId ${chatId}. Criando um novo lead.`);
      await database.saveOrUpdateLead({ chatId });
    }
    
    const newProtocolData = await database.createProtocol({
      human: false,
      chatId: chatId,
      lastMessage: message.slice(0, 20),
    });
    
    console.log(`[DEBUG] Novo protocolo criado com o ID: ${newProtocolData.idProtocol}`);

    await database.addMessage({
      idProtocol: newProtocolData.idProtocol,
      message: message,
      sendingType: sendingType
    });

    console.log(`[DEBUG] Retornando ID do NOVO protocolo: ${newProtocolData.idProtocol}`);
    console.log('================================================\n');
    return reply
      .code(200)
      .send({
        message: 'Novo protocolo criado.',
        idProtocol: newProtocolData.idProtocol
      });
  }
})


app.post('/teste', async (request, reply) => {
  return request.body
});


// ===== NOVA ROTA PARA RESETAR O BANCO DE DADOS =====
app.post('/reset-database', async (request, reply) => {
  console.log('[API] Rota /reset-database chamada para limpar dados de teste.');
  try {
    const result = await database.clearAllData();
    return reply.code(200).send(result);
  } catch (error) {
    console.error('[API] Erro ao limpar o banco de dados:', error);
    return reply.code(500).send({ message: 'Erro ao limpar o banco de dados.', error: error.message });
  }
});

const start = async () => {
  try {
    await app.listen({ port: 3002, host: '0.0.0.0' })
    console.log('HTTP Server running on http://localhost:3002')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
