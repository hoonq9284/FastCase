const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

async function callClaude(apiKey, systemPrompt, userContent) {
  const client = new Anthropic({ apiKey });

  const messages = [
    {
      role: 'user',
      content: userContent.map((part) => {
        if (part.type === 'text') {
          return { type: 'text', text: part.text };
        }
        if (part.type === 'image') {
          return {
            type: 'image',
            source: {
              type: 'base64',
              media_type: part.mimeType,
              data: part.base64,
            },
          };
        }
        return { type: 'text', text: '' };
      }),
    },
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16384,
    system: systemPrompt,
    messages,
  });

  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

async function callOpenAI(apiKey, systemPrompt, userContent) {
  const client = new OpenAI({ apiKey });

  const userMessages = userContent.map((part) => {
    if (part.type === 'text') {
      return { type: 'text', text: part.text };
    }
    if (part.type === 'image') {
      return {
        type: 'image_url',
        image_url: {
          url: `data:${part.mimeType};base64,${part.base64}`,
        },
      };
    }
    return { type: 'text', text: '' };
  });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 16384,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessages },
    ],
  });

  return response.choices[0].message.content;
}

async function generateWithAI(provider, apiKey, systemPrompt, userContent) {
  if (provider === 'claude') {
    return callClaude(apiKey, systemPrompt, userContent);
  }
  if (provider === 'openai') {
    return callOpenAI(apiKey, systemPrompt, userContent);
  }
  throw new Error(`Unknown provider: ${provider}`);
}

module.exports = { generateWithAI };
