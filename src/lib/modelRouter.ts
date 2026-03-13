import Groq from 'groq-sdk';

export type ModelConfig = {
  id: string;
  provider: 'groq' | 'openrouter';
  contextWindow: number;
  bestFor: string[];
  rateLimitTier: 'high' | 'medium' | 'low';
};

// 48 OpenRouter free models + 4 Groq models = 52 total
export const MODELS: ModelConfig[] = [
  // Groq models (fast, rate-limited)
  { id: 'llama-3.3-70b-versatile', provider: 'groq', contextWindow: 128000, bestFor: ['code', 'complex'], rateLimitTier: 'high' },
  { id: 'llama-3.1-8b-instant', provider: 'groq', contextWindow: 128000, bestFor: ['fast', 'draft'], rateLimitTier: 'high' },
  { id: 'mixtral-8x7b-32768', provider: 'groq', contextWindow: 32768, bestFor: ['analysis'], rateLimitTier: 'medium' },
  { id: 'gemma2-9b-it', provider: 'groq', contextWindow: 8192, bestFor: ['simple', 'fast'], rateLimitTier: 'high' },
  
  // OpenRouter free models (no rate limit, fallback chain)
  { id: 'meta-llama/llama-4-scout:free', provider: 'openrouter', contextWindow: 256000, bestFor: ['code', 'reasoning'], rateLimitTier: 'high' },
  { id: 'meta-llama/llama-4-maverick:free', provider: 'openrouter', contextWindow: 256000, bestFor: ['code', 'complex'], rateLimitTier: 'high' },
  { id: 'deepseek/deepseek-r1:free', provider: 'openrouter', contextWindow: 64000, bestFor: ['reasoning', 'math'], rateLimitTier: 'high' },
  { id: 'deepseek/deepseek-v3-base:free', provider: 'openrouter', contextWindow: 64000, bestFor: ['code', 'general'], rateLimitTier: 'high' },
  { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['code', 'analysis'], rateLimitTier: 'high' },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['code', 'complex'], rateLimitTier: 'high' },
  { id: 'qwen/qwq-32b:free', provider: 'openrouter', contextWindow: 131072, bestFor: ['reasoning', 'math'], rateLimitTier: 'high' },
  { id: 'qwen/qwen2.5-vl-72b-instruct:free', provider: 'openrouter', contextWindow: 32768, bestFor: ['vision', 'multimodal'], rateLimitTier: 'medium' },
  { id: 'google/gemini-2.5-pro-exp-03-25:free', provider: 'openrouter', contextWindow: 1000000, bestFor: ['code', 'analysis'], rateLimitTier: 'high' },
  { id: 'google/gemini-2.5-flash-preview:free', provider: 'openrouter', contextWindow: 1000000, bestFor: ['fast', 'general'], rateLimitTier: 'high' },
  { id: 'google/gemma-3-27b-it:free', provider: 'openrouter', contextWindow: 131072, bestFor: ['code', 'general'], rateLimitTier: 'high' },
  { id: 'moonshotai/kimi-k2.5:free', provider: 'openrouter', contextWindow: 256000, bestFor: ['code', 'long-context'], rateLimitTier: 'high' },
  { id: 'moonshotai/moonlight-16b-a3b-instruct:free', provider: 'openrouter', contextWindow: 8192, bestFor: ['simple'], rateLimitTier: 'medium' },
  { id: 'mistralai/mistral-small-24b-instruct-2501:free', provider: 'openrouter', contextWindow: 32768, bestFor: ['code', 'general'], rateLimitTier: 'high' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['code'], rateLimitTier: 'high' },
  { id: 'mistralai/devstral-small-2505:free', provider: 'openrouter', contextWindow: 32000, bestFor: ['code', 'dev'], rateLimitTier: 'medium' },
  { id: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['code', 'reasoning'], rateLimitTier: 'medium' },
  { id: 'cognitivecomputations/dolphin3.0-mistral-24b:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['code'], rateLimitTier: 'medium' },
  { id: 'opengvlab/internvl3-14b:free', provider: 'openrouter', contextWindow: 32000, bestFor: ['vision', 'code'], rateLimitTier: 'medium' },
  { id: 'huggingfaceh4/zephyr-7b-beta:free', provider: 'openrouter', contextWindow: 32768, bestFor: ['chat'], rateLimitTier: 'medium' },
  { id: 'microsoft/phi-4-reasoning-plus:free', provider: 'openrouter', contextWindow: 32000, bestFor: ['reasoning', 'math'], rateLimitTier: 'medium' },
  { id: 'microsoft/phi-4-reasoning:free', provider: 'openrouter', contextWindow: 32000, bestFor: ['reasoning'], rateLimitTier: 'medium' },
  { id: 'microsoft/phi-4-multimodal-instruct:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['vision', 'multimodal'], rateLimitTier: 'medium' },
  { id: 'microsoft/phi-4-mini-instruct:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['simple', 'fast'], rateLimitTier: 'high' },
  { id: 'opengvlab/internvl2.5-26b:free', provider: 'openrouter', contextWindow: 32000, bestFor: ['vision', 'code'], rateLimitTier: 'medium' },
  { id: 'opengvlab/internvl2_5-4b:free', provider: 'openrouter', contextWindow: 32000, bestFor: ['vision', 'simple'], rateLimitTier: 'medium' },
  { id: 'thudm/glm-4-32b:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['code', 'general'], rateLimitTier: 'medium' },
  { id: 'thudm/glm-4-9b-chat:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['chat', 'simple'], rateLimitTier: 'medium' },
  { id: 'thudm/glm-z1-32b:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['reasoning'], rateLimitTier: 'medium' },
  { id: 'thudm/glm-z1-rumination-32b:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['reasoning', 'complex'], rateLimitTier: 'medium' },
  { id: 'thudm/glm-z1-9b:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['reasoning', 'simple'], rateLimitTier: 'medium' },
  { id: 'ai21/jamba-1-5-mini:free', provider: 'openrouter', contextWindow: 256000, bestFor: ['long-context'], rateLimitTier: 'medium' },
  { id: 'ai21/jamba-1-5-large:free', provider: 'openrouter', contextWindow: 256000, bestFor: ['long-context'], rateLimitTier: 'medium' },
  { id: 'yijing-ai/mistral-7b-v0.3-umich-bafa-v0.2-4bit:free', provider: 'openrouter', contextWindow: 32768, bestFor: ['general'], rateLimitTier: 'low' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', provider: 'openrouter', contextWindow: 128000, bestFor: ['code', 'complex'], rateLimitTier: 'medium' },
  { id: 'liquid/lfm-40b:free', provider: 'openrouter', contextWindow: 32768, bestFor: ['general'], rateLimitTier: 'medium' },
  { id: 'liquid/lfm-40b-moe:free', provider: 'openrouter', contextWindow: 32768, bestFor: ['general'], rateLimitTier: 'medium' },
  { id: 'liuhaotian/llava-yi-34b:free', provider: 'openrouter', contextWindow: 4096, bestFor: ['vision'], rateLimitTier: 'low' },
  { id: 'microsoft/wizardlm-2-8x22b:free', provider: 'openrouter', contextWindow: 65536, bestFor: ['code', 'general'], rateLimitTier: 'medium' },
  { id: 'mistralai/mixtral-8x22b-instruct:free', provider: 'openrouter', contextWindow: 65536, bestFor: ['code', 'analysis'], rateLimitTier: 'medium' },
  { id: 'openchat/openchat-7b:free', provider: 'openrouter', contextWindow: 8192, bestFor: ['chat'], rateLimitTier: 'medium' },
  { id: 'gryphe/mythomax-l2-13b:free', provider: 'openrouter', contextWindow: 8192, bestFor: ['creative', 'story'], rateLimitTier: 'high' },
  { id: 'google/gemini-2.0-flash-exp:free', provider: 'openrouter', contextWindow: 1000000, bestFor: ['fast', 'analysis'], rateLimitTier: 'high' },
  { id: 'google/gemini-2.0-flash-thinking-exp-1219:free', provider: 'openrouter', contextWindow: 1000000, bestFor: ['reasoning', 'analysis'], rateLimitTier: 'high' },
  { id: 'google/gemini-2.0-flash-thinking-exp-01-21:free', provider: 'openrouter', contextWindow: 1000000, bestFor: ['reasoning'], rateLimitTier: 'high' },
  { id: 'google/gemini-2.0-pro-exp-02-05:free', provider: 'openrouter', contextWindow: 2000000, bestFor: ['code', 'complex', 'analysis'], rateLimitTier: 'high' },
  { id: 'google/gemini-2.0-flash-001:free', provider: 'openrouter', contextWindow: 1000000, bestFor: ['fast'], rateLimitTier: 'high' },
  { id: 'google/gemini-2.5-flash-preview-05-20:free', provider: 'openrouter', contextWindow: 1000000, bestFor: ['fast', 'code'], rateLimitTier: 'high' },
  { id: 'google/gemini-2.5-pro-preview-06-05:free', provider: 'openrouter', contextWindow: 1000000, bestFor: ['code', 'complex'], rateLimitTier: 'high' },
];

// Rate limit tracking
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function recordRateLimit(modelId: string) {
  const now = Date.now();
  rateLimitMap.set(modelId, { count: 1, resetAt: now + 60000 }); // 1 min cooldown
}

function isRateLimited(modelId: string): boolean {
  const entry = rateLimitMap.get(modelId);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    rateLimitMap.delete(modelId);
    return false;
  }
  return true;
}

// Fallback chains by task type
const FALLBACK_CHAINS: Record<string, string[]> = {
  code: [
    'llama-3.3-70b-versatile',
    'meta-llama/llama-4-scout:free',
    'meta-llama/llama-4-maverick:free',
    'deepseek/deepseek-v3-base:free',
    'google/gemini-2.5-pro-exp-03-25:free',
    'moonshotai/kimi-k2.5:free',
  ],
  reasoning: [
    'llama-3.3-70b-versatile',
    'deepseek/deepseek-r1:free',
    'qwen/qwq-32b:free',
    'thudm/glm-z1-32b:free',
    'microsoft/phi-4-reasoning:free',
    'google/gemini-2.0-flash-thinking-exp-1219:free',
  ],
  fast: [
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'microsoft/phi-4-mini-instruct:free',
    'google/gemini-2.5-flash-preview:free',
    'gryphe/mythomax-l2-13b:free',
  ],
  vision: [
    'qwen/qwen2.5-vl-72b-instruct:free',
    'microsoft/phi-4-multimodal-instruct:free',
    'opengvlab/internvl3-14b:free',
  ],
  long: [
    'meta-llama/llama-4-scout:free',
    'ai21/jamba-1-5-large:free',
    'google/gemini-2.0-pro-exp-02-05:free',
  ],
};

export function getModelChain(taskType: string): string[] {
  return FALLBACK_CHAINS[taskType] || FALLBACK_CHAINS.code;
}

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

export async function callModel(
  modelId: string,
  systemPrompt: string,
  messages: Message[],
  temperature: number = 0.2
): Promise<string> {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);

  if (isRateLimited(modelId)) {
    throw new Error(`Rate limited: ${modelId}`);
  }

  const endpoint =
    model.provider === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

  const apiKey =
    model.provider === 'groq'
      ? process.env.GROQ_API_KEY!
      : process.env.OPENROUTER_API_KEY!;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (model.provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ops-ai-dev.vercel.app';
    headers['X-Title'] = 'OPS AI DEV';
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: false,
      temperature,
    }),
  });

  if (res.status === 429) {
    recordRateLimit(modelId);
    throw new Error(`Rate limited: ${modelId}`);
  }

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error (${res.status}): ${error}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

export async function callWithFallback(
  taskType: string,
  systemPrompt: string,
  messages: Message[],
  temperature: number = 0.2
): Promise<{ content: string; modelUsed: string }> {
  const chain = getModelChain(taskType);

  for (const modelId of chain) {
    try {
      const content = await callModel(modelId, systemPrompt, messages, temperature);
      return { content, modelUsed: modelId };
    } catch (err) {
      console.warn(`Model ${modelId} failed:`, err);
      continue;
    }
  }

  throw new Error('All models in fallback chain failed');
}

// Voice transcription via Groq Whisper
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  const file = new File([new Uint8Array(audioBuffer)], 'audio.webm', { type: 'audio/webm' });

  const result = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'verbose_json',
  });

  return (result as { text: string }).text || '';
}
