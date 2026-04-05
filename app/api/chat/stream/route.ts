import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai';
import { DEFAULT_MODEL } from '@/lib/ai/provider/models';
import { rateLimit, createRateLimitResponse, getRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

export const maxDuration = 60;

// System prompts for different roles
const SYSTEM_PROMPTS: Record<string, string> = {
  code: `You are VSCodeux, an expert AI coding assistant. You help developers write, review, and debug code.
Follow best practices, write clean and maintainable code, and explain your solutions clearly.
When writing code, always use proper TypeScript types and follow modern patterns.`,
  
  plan: `You are VSCodeux, an AI architect assistant. You help developers plan and design software architectures.
Focus on scalability, maintainability, and best practices. Create clear plans with actionable steps.`,
  
  debug: `You are VSCodeux, an expert debugging assistant. You help developers find and fix bugs.
Analyze error messages carefully, identify root causes, and suggest precise fixes.`,
  
  review: `You are VSCodeux, a code review expert. You review code for bugs, security issues, and improvements.
Provide constructive feedback with specific suggestions and explain the reasoning.`,
  
  test: `You are VSCodeux, a testing expert. You help developers write comprehensive tests.
Focus on edge cases, coverage, and testing best practices.`,
  
  docs: `You are VSCodeux, a documentation expert. You help write clear and comprehensive documentation.
Focus on clarity, examples, and completeness.`,
  
  ask: `You are VSCodeux, a helpful AI assistant. You answer questions about programming and software development.
Provide clear, accurate, and helpful responses.`,
  
  admin: `You are VSCodeux, a system administration assistant. You help with configuration, deployment, and operations.
Focus on security, reliability, and best practices.`,
};

interface ChatRequestBody {
  messages: UIMessage[];
  model?: string;
  role?: string;
  type?: 'prompt-engine' | 'automation';
}

export async function POST(req: Request) {
  try {
    // Rate limiting - use IP or forwarded IP as identifier
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'anonymous';
    
    const rateLimitResult = await rateLimit(ip, RATE_LIMITS.chat);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body: ChatRequestBody = await req.json();
    const { messages, model = DEFAULT_MODEL, role = 'code', type = 'prompt-engine' } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(rateLimitResult),
        },
      });
    }

    // Get appropriate system prompt
    const systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.code;
    const contextInfo = type === 'automation' 
      ? '\n\nContext: You are in Automation mode, helping configure rules, hooks, skills, and workflows.'
      : '\n\nContext: You are in Prompt Engine mode, helping with code generation and development tasks.';

    const result = streamText({
      model,
      system: systemPrompt + contextInfo,
      messages: await convertToModelMessages(messages),
      abortSignal: req.signal,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: allMessages, isAborted }) => {
        if (isAborted) return;
        // TODO: Save to database when Supabase is integrated
        console.log('[v0] Chat completed, messages count:', allMessages.length);
      },
      consumeSseStream: consumeStream,
    });
  } catch (error) {
    console.error('[v0] Chat stream error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process chat request' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
