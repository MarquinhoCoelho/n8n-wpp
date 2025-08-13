// worker.js (versão final com correção de Namespace)
import { DatabasePostgres } from './database-postgres.js';
import { Readable } from 'node:stream';
import { readFile, unlink } from 'node:fs/promises';
import { sql } from './db.js';
import XmlStream from 'xml-stream';

const database = new DatabasePostgres();

// Função auxiliar para processar um único imóvel (sem alterações)
async function processarImovel(item) {
    try {
        const listingId = item.ListingID;
        // ... (resto da função de insert continua igual)
        const existentes = await sql`SELECT 1 FROM imoveis WHERE listing_id = ${listingId}`;
        if (existentes.length > 0) {
            console.log(`Imóvel ${listingId} já existe, ignorando.`);
            return;
        }

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
            Array.isArray(item.Media.Item) ? item.Media.Item.find(i => i.$?.primary === 'true')?._ : item.Media.Item?._
          )
        `;
        console.log(`Imóvel ${listingId} inserido com sucesso.`);
    } catch (dbError) {
        console.error(`Erro ao processar o imóvel ${item.ListingID}:`, dbError);
    }
}

// Função principal que verifica a fila
async function processarFila() {
    console.log('Verificando novas tarefas de importação...');
    const tarefa = await database.buscarProximaTarefaPendente();

    if (!tarefa) {
        return;
    }

    console.log(`Iniciando processamento da tarefa ${tarefa.id}...`);
    await database.atualizarStatusTarefa(tarefa.id, 'processando');

    try {
        // --- INÍCIO DA MUDANÇA ---
        // 1. Lê o arquivo XML para a memória como texto
        const xmlContent = await readFile(tarefa.caminho_arquivo, 'utf-8');

        // 2. Remove todos os atributos xmlns (o "sobrenome") do XML usando uma expressão regular
        const xmlSemNamespace = xmlContent.replace(/xmlns="[^"]*"/g, '');

        // 3. Cria um novo fluxo de leitura a partir do XML modificado que está na memória
        const fileStream = Readable.from(xmlSemNamespace);
        // --- FIM DA MUDANÇA ---

        await new Promise((resolve, reject) => {
            const xml = new XmlStream(fileStream);
            
            // Agora o seletor vai funcionar, pois as tags não têm mais "sobrenome"
            xml.on('endElement: Listing', async (item) => {
                xml.pause();
                await processarImovel(item);
                xml.resume();
            });

            xml.on('end', async () => {
                console.log(`Tarefa ${tarefa.id} concluída com sucesso!`);
                await database.atualizarStatusTarefa(tarefa.id, 'concluido');
                await unlink(tarefa.caminho_arquivo);
                resolve();
            });

            xml.on('error', (err) => {
                console.error(`Erro de streaming na tarefa ${tarefa.id}:`, err);
                reject(err); // Rejeita a Promise para ser capturada pelo catch
            });
        });
    } catch (err) {
        console.error(`Erro geral ao processar tarefa ${tarefa.id}:`, err);
        await database.atualizarStatusTarefa(tarefa.id, 'falhou');
    }
}

console.log('Worker de importação iniciado.');
setInterval(processarFila, 15000);