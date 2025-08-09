import fastify from 'fastify'
import { randomUUID } from 'crypto'

const app = fastify()

const protocols = []
const messages = []
const leads = [
  // Exemplo de como um lead ficaria
  // {
  //   chatId: '554899999999@c.us',
  //   name: 'João da Silva',
  //   phone: '4899999999',
  //   email: 'jj@gmail.com',
  //   address: 'Aloisio melo, 50 - campinas SJ',
  //   entrada: 50000,
  //   salarioBruto: 10000
  // }
]

const sending = {
  lead: 'lead',
  ia: 'ia',
  attendante: 'attendante',
  bot: 'bot'
}

const attendance = [
  {
    attendantId: '321',
    name: 'Fulano',
    activeProtocolCount: 2,
    online: true,
    createdAt: new Date().toISOString()
  }
]

// Rota GET
app.get('/protocols', async (request, reply) => {
  return reply.code(200).send(protocols)
})

// Rota para buscar um lead pelo chatId
app.get('/lead/:chatId', async (request, reply) => {
  const { chatId } = request.params

  const lead = leads.find(l => l.chatId === chatId)

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

  // Verifica se o lead já existe
  const existingLeadIndex = leads.findIndex(l => l.chatId === chatId);

  if (existingLeadIndex !== -1) {
    // Se existe, ATUALIZA o lead
    leads[existingLeadIndex] = { ...leads[existingLeadIndex], ...leadData };
    return reply.code(200).send({ message: 'Informações do lead atualizadas com sucesso.' });
  } else {
    // Se não existe, CRIA um novo lead
    leads.push(leadData);
    return reply.code(201).send({ message: 'Novo lead criado com sucesso.' });
  }
})

app.post('/inativeProtocol', async (request, reply) => {
  const { idProtocol } = request.body

  if (!idProtocol) {
    return reply.code(400).send({ message: 'idProtocol não enviado' })
  }

  const protocolo = protocols.find(p => p.idProtocol === idProtocol)

  if (!protocolo) {
    return reply.code(404).send({ message: 'Protocolo não encontrado' })
  }

  protocolo.status = 'inativo'
  protocolo.updatedAt = new Date().toISOString()

  return reply.code(200).send({ message: 'Protocolo inativado com sucesso' })
})

app.post('/manageProtocols', async (request, reply) => {
  const { chatId, message } = request.body

  if (!chatId) {
    return reply.code(400).send({ message: 'chatID não enviado' })
  }

  if (!message) {
    return reply.code(400).send({ message: 'mensagem não enviada' })
  }

  const existingProtocol = protocols.find(
    (p) => p.chatId === chatId && p.status === 'ativo'
  )

  if (existingProtocol) {
    // CORREÇÃO: Busca o nome do lead se o protocolo já existe
    const lead = leads.find(l => l.chatId === chatId)
    const leadName = lead ? lead.name : null;

    // Se a mensagem tiver '#atendente'
    if (message.includes('#atendente')) {
      existingProtocol.human = true

      if (attendance.length === 1) {
        existingProtocol.attendantId = attendance[0].attendantId
      }

      return reply
        .code(200)
        .send({ message: 'Encaminhado para atendimento humano.', nome: leadName })
    }

    // Resposta para um lead que já existe e não pediu atendimento
    return reply
      .code(200)
      .send({ message: 'boas-vindas-lead-existente', nome: leadName })
  } else {
    // Criar novo protocolo e mensagem
    const idMessage = randomUUID()
    const idProtocol = randomUUID()
    const createdAt = new Date().toISOString()

    messages.push({
      idMessage,
      message,
      sending: sending.lead,
      createdAt
    })

    protocols.push({
      human: false,
      hotLead: '',
      chatId,
      idProtocol,
      idMessages: idMessage,
      status: 'ativo',
      attendantId: '',
      lastMessage: message.slice(0, 20),
      createdAt
    })

    return reply
      .code(200)
      .send({ message: 'mensagem de boas-vindas', idProtocol, nome: null })
  }
})

// Inicia o servidor
const start = async () => {
  try {
    await app.listen({ port: 3002, host: '0.0.0.0' })
    app.log.info(`Servidor rodando em http://localhost:3002`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()