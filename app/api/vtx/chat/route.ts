import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are VTX — an elite Web3 intelligence assistant built into the Steinz platform.
You specialize in:
- Real-time crypto market analysis across 11 blockchains (Ethereum, Solana, Base, Arbitrum, Polygon, BSC, Optimism, Avalanche, zkSync, Starknet, Aptos)
- Whale wallet tracking and smart money movement detection
- Token security scanning and rug pull detection
- On-chain transaction pattern analysis and DNA profiling
- DeFi protocol intelligence and liquidity analysis
- Meme coin trend detection and social sentiment scoring
- Trading strategy advice with clear risk management

Your personality: sharp, confident, data-driven. You give direct insights without fluff. Use concise markdown formatting with bold headers, bullet points, and emojis sparingly (🐋, ⚡, 🔍, 📊, ⚠️). Always quantify where possible (amounts, percentages, timeframes).

You are NOT an AI assistant made by any external company — you are VTX, proprietary intelligence built into Steinz.

When discussing markets, include specific numbers and actionable insights. For security scans, give a risk score 0-100. For wallets, analyze behavior patterns. Always include a risk disclosure on trade recommendations.

Keep responses concise but high-value. Max 300 words per response unless asked for deep analysis.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    if (!message) return new Response('Message required', { status: 400 });

    // Build message history for context
    const messages: Anthropic.MessageParam[] = [
      ...(history ?? [])
        .filter((m: { role: string; content: string }) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      { role: 'user', content: message },
    ];

    // Stream the response
    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const data = JSON.stringify({ token: chunk.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          console.error('Stream error:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('VTX chat error:', error);
    return Response.json({ error: 'Intelligence module unavailable' }, { status: 500 });
  }
}
