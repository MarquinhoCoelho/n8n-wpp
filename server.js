import fastify from 'fastify'
import { DatabasePostgres } from './database-postgres.js'

const app = fastify()
const database = new DatabasePostgres()

// LEADS //

app.get('/leads/:chatId', async (request, reply) => {
  const { chatId } = request.params;
  if (!chatId) {
    return reply.code(400).send({ message: 'chatId do chat é obrigatório.' });
  }
  const lead = await database.getLeadByChatId(chatId);
	return reply.code(200).send(lead);
});

app.get('/leads', async (request, reply) => {
  	const leads = await database.getLeads();
	return reply.code(201).send(leads);
});

app.post('/leads', async (request, reply) => {
  const leadData = request.body;
  if (!leadData || !leadData.chatId || !leadData.name || !leadData.phone || !leadData.email) {
    return reply.code(400).send({ message: 'Dados inválidos para criar lead.' });
  }
  const lead = await database.createLead(leadData);
  return reply.code(201).send(lead);
})

app.put('/leads', async (request, reply) => {
  const leadData = request.body;
  if (!leadData || !leadData.chatId || !leadData.name || !leadData.phone || !leadData.email) {
    return reply.code(400).send({ message: 'Dados inválidos para editar um lead.' });
  }
  const lead = await database.editLead(leadData);
  return reply.code(200).send(lead);
})

app.delete('/leads', async (request, reply) => {
  const leadData = request.body;
  if (!leadData || !leadData.chatId) {
    return reply.code(400).send({ message: 'Dados inválidos para deletar um lead.' });
  }
  const lead = await database.deleteLead(leadData);
  return reply.code(200).send(lead);
})

// Protocols //

// PROTOCOLS //

app.get('/protocols/:id', async (request, reply) => {
  const { id } = request.params;
  if (!id) {
    return reply.code(400).send({ message: 'ID do protocolo é obrigatório.' });
  }
  const protocol = await database.getProtocolById(id);
  return reply.code(201).send(protocol);
});

app.get('/protocols', async (request, reply) => {
  const protocols = await database.getProtocols();
  return reply.code(201).send(protocols);
});

app.post('/protocols', async (request, reply) => {
  const protocolData = request.body;
  if (!protocolData || !protocolData.id || !protocolData.chat_id || !protocolData.status) {
    return reply.code(400).send({ message: 'Dados inválidos para criar protocolo.' });
  }
  const protocol = await database.createProtocol(protocolData);
  return reply.code(201).send(protocol);
});

app.put('/protocols', async (request, reply) => {
  const protocolData = request.body;
  if (!protocolData || !protocolData.id || !protocolData.chat_id || !protocolData.status) {
    return reply.code(400).send({ message: 'Dados inválidos para editar protocolo.' });
  }
  const protocol = await database.editProtocol(protocolData);
  return reply.code(200).send(protocol);
});

app.delete('/protocols', async (request, reply) => {
  const { id } = request.body;
  if (!id) {
    return reply.code(400).send({ message: 'ID inválido para deletar protocolo.' });
  }
  const protocol = await database.deleteProtocol(id);
  return reply.code(200).send(protocol);
});

// MESSAGES //

app.get('/messages/:id', async (request, reply) => {
  const { id } = request.params;
  if (!id) {
    return reply.code(400).send({ message: 'ID da mensagem é obrigatório.' });
  }
  const message = await database.getMessageById(id);
  return reply.code(201).send(message);
});

app.get('/messages', async (request, reply) => {
  const messages = await database.getMessages();
  return reply.code(201).send(messages);
});

app.post('/messages', async (request, reply) => {
  const messageData = request.body;
  if (
    !messageData ||
    !messageData.id ||
    !messageData.protocol_id ||
    !messageData.message_text ||
    !messageData.sending_type
  ) {
    return reply.code(400).send({ message: 'Dados inválidos para criar mensagem.' });
  }
  try {
    const message = await database.createMessage(messageData);
    return reply.code(201).send(message);
  } catch (err) {
    return reply.code(400).send({ message: err.message });
  }
});

app.put('/messages', async (request, reply) => {
  const messageData = request.body;
  if (
    !messageData ||
    !messageData.id ||
    !messageData.protocol_id ||
    !messageData.message_text ||
    !messageData.sending_type
  ) {
    return reply.code(400).send({ message: 'Dados inválidos para editar mensagem.' });
  }
  try {
    const message = await database.editMessage(messageData);
    return reply.code(200).send(message);
  } catch (err) {
    return reply.code(400).send({ message: err.message });
  }
});

app.delete('/messages', async (request, reply) => {
  const { id } = request.body;
  if (!id) {
    return reply.code(400).send({ message: 'ID inválido para deletar mensagem.' });
  }
  const message = await database.deleteMessage(id);
  return reply.code(200).send(message);
});

const start = async () => {
  try {
    await app.listen({ port: 3002, host: '0.0.0.0' })
    console.log('HTTP Server running on')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
