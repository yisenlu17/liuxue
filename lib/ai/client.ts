import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { AIProvider } from '@/types'

export function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export const MODEL_MAP = {
  claude: {
    fast: 'claude-haiku-4-5-20251001',
    main: 'claude-sonnet-4-6',
  },
  openai: {
    fast: 'gpt-4o-mini',
    main: 'gpt-4o',
  },
}

export async function generateText(
  provider: AIProvider,
  model: 'fast' | 'main',
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const modelId = MODEL_MAP[provider][model]

  if (provider === 'claude') {
    const client = getAnthropicClient()
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    const block = response.content[0]
    return block.type === 'text' ? block.text : ''
  } else {
    const client = getOpenAIClient()
    const response = await client.chat.completions.create({
      model: modelId,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
    return response.choices[0]?.message?.content ?? ''
  }
}

export async function streamText(
  provider: AIProvider,
  model: 'fast' | 'main',
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  const modelId = MODEL_MAP[provider][model]
  let fullText = ''

  if (provider === 'claude') {
    const client = getAnthropicClient()
    const stream = await client.messages.stream({
      model: modelId,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullText += chunk.delta.text
        onChunk(chunk.delta.text)
      }
    }
  } else {
    const client = getOpenAIClient()
    const stream = await client.chat.completions.create({
      model: modelId,
      max_tokens: 4096,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? ''
      if (text) {
        fullText += text
        onChunk(text)
      }
    }
  }

  return fullText
}
