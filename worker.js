// worker.js
import { DatabasePostgres } from './database-postgres.js';
import { parseStringPromise } from 'xml2js';
import { readFile, unlink } from 'node:fs/promises';
import { sql } from './db.js';

const database = new DatabasePostgres();

async function processarFila() {
  console.log('Verificando novas tarefas de importação...');

  const tarefa = await database.buscarProximaTarefaPendente();

  if (!tarefa) {
    // Nenhuma tarefa, espera um pouco e tenta de novo
    return;
  }

  console.log(`Iniciando processamento da tarefa ${tarefa.id}`);
  await database.atualizarStatusTarefa(tarefa.id, 'processando');

  try {
    const xmlBuffer = await readFile(tarefa.caminho_arquivo);
    const json = await parseStringPromise(xmlBuffer, { explicitArray: false });
    const listings = json.ListingDataFeed.Listings.Listing;

    // AQUI ENTRA A SUA LÓGICA DE LOOP E INSERT QUE JÁ ESTÁ PRONTA
    for (const item of (Array.isArray(listings) ? listings : [listings])) {
      const listingId = item.ListingID;
      const existentes = await sql`SELECT 1 FROM imoveis WHERE listing_id = ${listingId}`;
      if (existentes.length > 0) continue;
      
      // Seu INSERT gigante aqui...
      await sql`
  INSERT INTO imoveis (
    listing_id, titulo, tipo_transacao, tipo_imovel, descricao, preco, moeda,
    quartos, banheiros, suites, garagem, area, unidade_area,
    pais, estado, cidade, bairro, endereco, numero, complemento, cep, url_imagem_principal
  )
  VALUES (
    ${listingId}, ${item.Title}, ${item.TransactionType}, ${item.Details.PropertyType},
    ${item.Details.Description}, ${item.Details.ListPrice._ || item.Details.ListPrice},
    ${item.Details.ListPrice?.$.currency || 'BRL'}, ${item.Details.Bedrooms},
    ${item.Details.Bathrooms}, ${item.Details.Suites}, ${item.Details.Garage?._ || item.Details.Garage},
    ${item.Details.LivingArea?._ || null}, ${item.Details.LivingArea?.$.unit || null},
    ${item.Location.Country._ || item.Location.Country}, ${item.Location.State._ || item.Location.State},
    ${item.Location.City}, ${item.Location.Neighborhood}, ${item.Location.Address},
    ${item.Location.StreetNumber}, ${item.Location.Complement}, ${item.Location.PostalCode},
    ${Array.isArray(item.Media.Item) ? item.Media.Item.find(i => i.$?.primary === 'true')?._ : item.Media.Item?._}
  )
`;
    }

    console.log(`Tarefa ${tarefa.id} concluída com sucesso!`);
    await database.atualizarStatusTarefa(tarefa.id, 'concluido');
    
    // Apaga o arquivo XML temporário
    await unlink(tarefa.caminho_arquivo);

  } catch (err) {
    console.error(`Erro ao processar tarefa ${tarefa.id}:`, err);
    await database.atualizarStatusTarefa(tarefa.id, 'falhou');
  }
}

// Roda o worker a cada 15 segundos
setInterval(processarFila, 15000);