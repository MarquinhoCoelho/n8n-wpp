import fastify from 'fastify'
import { DatabasePostgres } from './database-postgres.js'
import { parseStringPromise } from 'xml2js';
import { sql } from './db.js';
import fastifyMultipart from '@fastify/multipart';

const app = fastify()
const database = new DatabasePostgres()

// LEADS //

app.get('/leads/:chatId', async (request, reply) => {
  const { chatId } = request.params;
  if (!chatId) {
    return reply.code(400).send({ message: 'chatId do chat é obrigatório.' });
  }

  try {
    const lead = await database.getLeadByChatId(chatId);

    if (!lead) {
      return reply.code(200).send({ message: 'Lead não encontrado.', hasProtocol: false });
    }

    let protocol = await database.getProtocolActiveByLead(chatId);
    let hasProtocol = false;

    if (protocol) {
      hasProtocol = true;
    }

    return reply.code(200).send({ lead, protocol, hasProtocol });
  } catch (err) {
    // Erro de banco ou inesperado
    return reply.code(500).send({ message: 'Erro interno do servidor.', error: err.message });
  }
});

app.get('/leads', async (request, reply) => {
    const leads = await database.getLeads();
  return reply.code(200).send(leads);
});

app.get('/attendants', async (request, reply) => {
  
  return reply.code(200).send(
    [
  { "id": "atendente_01", "name": "Marcos", "status": "available" }
]
  );
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

app.delete('/leads/:chatId', async (request, reply) => {
  const { chatId } = request.params;
  if (!chatId) {
    return reply.code(400).send({ message: 'chatId do chat é obrigatório.' });
  }
  try {
    const lead = await database.deleteLead(chatId);
    return reply.code(200).send({message: 'Lead deletado com sucesso.', lead});
  } catch (err) {
    return reply.code(400).send({ message: err.message });
  }
});

// PROTOCOLS //

app.get('/protocols/:id', async (request, reply) => {
  const { id } = request.params;
  if (!id) {
    return reply.code(400).send({ message: 'ID do protocolo é obrigatório.' });
  }
  const protocol = await database.getProtocolById(id);

  if (!protocol) {
    return reply.code(200).send({ message: 'Protocolo não encontrado.' });
  }
  return reply.code(200).send(protocol);
});

app.get('/protocols', async (request, reply) => {
  const protocols = await database.getProtocols();
  return reply.code(200).send(protocols);
});

app.post('/protocols', async (request, reply) => {
  const protocolData = request.body;
  if (!protocolData || !protocolData.chat_id || !protocolData.status) {
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

app.delete('/protocols/:id', async (request, reply) => {
  const { id } = request.params;
  if (!id) {
    return reply.code(400).send({ message: 'ID inválido para deletar protocolo.' });
  }
  try {
    const protocol = await database.deleteProtocol(id);
    return reply.code(200).send({message: 'Protocolo deletado com sucesso.', protocol});
  } catch (err) {
    return reply.code(400).send({ message: err.message });
  }
});

// NOVO ENDPOINT: transbordo / assign
app.post('/protocols/:id/assign', async (request, reply) => {
  const { id } = request.params;
  const { attendant_id } = request.body || {};

  if (!id) {
    return reply.code(400).send({ message: 'ID do protocolo é obrigatório.' });
  }
  if (!attendant_id) {
    return reply.code(400).send({ message: 'attendant_id é obrigatório no corpo da requisição.' });
  }

  try {
    const existingProtocol = await database.getProtocolById(id);
    if (!existingProtocol) {
      return reply.code(404).send({ message: 'Protocolo não encontrado.' });
    }

    const protocolToUpdate = {
      id,
      chat_id: existingProtocol.chat_id,
      status: 'in_progress',
      human: true,
      attendant_id,
      hot_lead: existingProtocol.hot_lead,
      last_message: existingProtocol.last_message
    };

    const updated = await database.editProtocol(protocolToUpdate);
    return reply.code(200).send(updated);
  } catch (err) {
    return reply.code(500).send({ message: 'Erro interno do servidor.', error: err.message });
  }
});

// NOVO ENDPOINT: close
app.post('/protocols/:id/close', async (request, reply) => {
  const { id } = request.params;

  if (!id) {
    return reply.code(400).send({ message: 'ID do protocolo é obrigatório.' });
  }

  try {
    const existingProtocol = await database.getProtocolById(id);
    if (!existingProtocol) {
      return reply.code(404).send({ message: 'Protocolo não encontrado.' });
    }

    const protocolToUpdate = {
      id,
      chat_id: existingProtocol.chat_id,
      status: 'closed',
      human: existingProtocol.human,
      attendant_id: existingProtocol.attendant_id,
      hot_lead: existingProtocol.hot_lead,
      last_message: existingProtocol.last_message
    };

    const updated = await database.editProtocol(protocolToUpdate);
    return reply.code(200).send(updated);
  } catch (err) {
    return reply.code(500).send({ message: 'Erro interno do servidor.', error: err.message });
  }
});

// MESSAGES //

app.get('/messages/:id', async (request, reply) => {
  const { id } = request.params;
  if (!id) {
    return reply.code(400).send({ message: 'ID da mensagem é obrigatório.' });
  }
  const message = await database.getMessageById(id);
  return reply.code(200).send(message);
});

app.get('/messages', async (request, reply) => {
  const messages = await database.getMessages();
  return reply.code(200).send(messages);
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

app.delete('/messages/:id', async (request, reply) => {
  const { id } = request.params;
  if (!id) {
    return reply.code(400).send({ message: 'ID inválido para deletar mensagem.' });
  }
  try {
    const message = await database.deleteMessage(id);
    return reply.code(200).send({message: 'Mensagem deletada com sucesso.', message});
  } catch (err) {
    return reply.code(400).send({ message: err.message });
  }
});



// IMóVEIS
app.register(fastifyMultipart);

app.post('/imoveis', async (request, reply) => {
  const imovelDataFilter = request.body;

  if (!imovelDataFilter) {
    return reply.code(400).send({ message: 'Dados inválidos para consultar um imóvel.' });
  }

  const imoveis = await database.getImoveis(imovelDataFilter);
  return reply.code(200).send(imoveis);
});


app.post('/importar-xml', async (request, reply) => {
  try {
    const data = await request.file(); // precisa do fastify-multipart
    if (!data) {
      return reply.code(400).send({ message: 'Nenhum arquivo enviado.' });
    }

    // Lê o conteúdo do XML
    const xmlBuffer = await data.toBuffer();
    const json = await parseStringPromise(xmlBuffer, { explicitArray: false });

    // Acessa os imóveis do XML
    const listings = json.ListingDataFeed.Listings.Listing;

    let inseridos = 0;
    let ignorados = 0;

    for (const item of (Array.isArray(listings) ? listings : [listings])) {
      const listingId = item.ListingID;

      // Verifica se já existe
      const existentes = await sql`
        SELECT 1 FROM imoveis WHERE listing_id = ${listingId}
      `;
      if (existentes.length > 0) {
        ignorados++;
        continue; // pula se já existir
      }

      // Insere novo
      await sql`
        INSERT INTO imoveis (
          listing_id, titulo, tipo_transacao, tipo_imovel, descricao, preco, moeda,
          quartos, banheiros, suites, garagem, area, unidade_area,
          pais, estado, cidade, bairro, endereco, numero, complemento, cep, url_imagem_principal
        )
        VALUES (
          ${listingId},
          ${item.Title},
          ${item.TransactionType},
          ${item.Details.PropertyType},
          ${item.Details.Description},
          ${item.Details.ListPrice._ || item.Details.ListPrice},
          ${item.Details.ListPrice?.$.currency || 'BRL'},
          ${item.Details.Bedrooms},
          ${item.Details.Bathrooms},
          ${item.Details.Suites},
          ${item.Details.Garage?._ || item.Details.Garage},
          ${item.Details.LivingArea?._ || null},
          ${item.Details.LivingArea?.$.unit || null},
          ${item.Location.Country._ || item.Location.Country},
          ${item.Location.State._ || item.Location.State},
          ${item.Location.City},
          ${item.Location.Neighborhood},
          ${item.Location.Address},
          ${item.Location.StreetNumber},
          ${item.Location.Complement},
          ${item.Location.PostalCode},
          ${Array.isArray(item.Media.Item) 
            ? item.Media.Item.find(i => i.$?.primary === 'true')?._ 
            : item.Media.Item?._
          }
        )
      `;
      inseridos++;
    }

    return reply.code(200).send({
      message: 'Importação concluída.',
      inseridos,
      ignorados
    });

  } catch (err) {
    console.error(err);
    return reply.code(500).send({ message: 'Erro ao processar o XML.' });
  }
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
