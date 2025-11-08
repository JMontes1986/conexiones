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

async function createChatCompletion({ apiKey, model, prompt }) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está definido.');
  }

  const endpoint = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';

  const body = {
    model: model || DEFAULT_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorPayload = await safeReadJson(response);
    const errorMessage = errorPayload?.error?.message || `OpenAI API error (${response.status})`;
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  const completion = await response.json();

  return completion?.choices?.[0]?.message?.content ?? '';
}

async function safeReadJson(res) {
  try {
    return await res.json();
  } catch (error) {
    return null;
  }
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

  try {
    const storyText = await createChatCompletion({
      apiKey: process.env.OPENAI_API_KEY,
      model,
      prompt,
    });

    if (!storyText) {
      throw new Error('Respuesta vacía del modelo');
    }

    return res.status(200).json({ story: storyText });
  } catch (error) {
    console.error('Error generando historia con OpenAI:', error);
    const statusCode = error.status || (error.message && error.message.includes('no está definido') ? 500 : 502);
    return res.status(statusCode).json({ error: error.message ?? 'Error generando la historia' });
  }
}
