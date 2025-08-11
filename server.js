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
