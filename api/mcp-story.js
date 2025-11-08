import { McpClient } from '@modelcontextprotocol/sdk/client';
import { NodeWsTransport } from '@modelcontextprotocol/sdk/transports/node-ws';

const DEFAULT_MODEL = 'gpt-4.1-mini';

function buildPrompt({ fragments = [], context = '' }) {
  const cleanedFragments = Array.isArray(fragments) ? fragments.filter(Boolean) : [];
  const contextText = typeof context === 'string' && context.trim().length > 0 ? context.trim() : '';

  const sections = [];

  if (contextText) {
    sections.push(`Contexto:\n${contextText}`);
  }

  if (cleanedFragments.length > 0) {
    const formattedFragments = cleanedFragments
      .map((fragment, index) => `${index + 1}. ${fragment}`)
      .join('\n');
    sections.push(`Fragmentos de historia:\n${formattedFragments}`);
  }

  sections.push(
    'Escribe un relato cohesivo y completo que integre los fragmentos proporcionados. '
      + 'Respeta el contexto cuando exista, mantén un tono consistente y añade detalles que conecten las partes.'
  );

  return sections.join('\n\n');
}

async function createClient({ endpoint, apiKey, model }) {
  if (!endpoint) {
    throw new Error('MCP_SERVER_URL no está definido.');
  }

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está definido.');
  }

  const transport = new NodeWsTransport(endpoint, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  });

  const client = new McpClient({
    name: 'conexiones-story-service',
    version: '1.0.0',
    transport,
  });

  await client.connect();

  const targetModel = model || DEFAULT_MODEL;

  await client.setModel(targetModel);

  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let payload = req.body;

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  }

  if (typeof payload !== 'object' || payload === null) {
    return res.status(400).json({ error: 'Payload must be a JSON object' });
  }

  const { fragments = [], context = '', model } = payload;

  if (!Array.isArray(fragments)) {
    return res.status(400).json({ error: '`fragments` must be an array' });
  }

  const prompt = buildPrompt({ fragments, context });

  let client;

  try {
    client = await createClient({
      endpoint: process.env.MCP_SERVER_URL,
      apiKey: process.env.OPENAI_API_KEY,
      model,
    });

    const response = await client.createMessage({
      role: 'user',
      content: prompt,
    });

    const storyText = response?.content ?? '';

    if (!storyText) {
      throw new Error('Respuesta vacía del modelo');
    }

    return res.status(200).json({ story: storyText });
  } catch (error) {
    console.error('Error generando historia vía MCP:', error);
    const statusCode = error.message && error.message.includes('no está definido') ? 500 : 502;
    return res.status(statusCode).json({ error: error.message ?? 'Error generando la historia' });
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error('Error cerrando el cliente MCP:', closeError);
      }
    }
  }
}
