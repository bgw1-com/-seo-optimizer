import { NextResponse } from 'next/server';

// API Key 从环境变量读取，用户看不到
const API_KEYS = {
  openai: process.env.OPENAI_API_KEY,
  claude: process.env.ANTHROPIC_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY,
  grok: process.env.GROK_API_KEY,
};

const ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  grok: 'https://api.x.ai/v1/chat/completions',
};

// 简单的速率限制：每个 IP 每分钟最多 10 次请求
const rateLimit = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimit.get(ip);
  if (!record || now - record.start > RATE_WINDOW) {
    rateLimit.set(ip, { start: now, count: 1 });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

export async function POST(request) {
  try {
    // 速率限制
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试（每分钟最多10次）' }, { status: 429 });
    }

    const { provider, model, prompt } = await request.json();

    if (!provider || !model || !prompt) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const apiKey = API_KEYS[provider];
    if (!apiKey) {
      return NextResponse.json({ error: `未配置 ${provider} 的 API Key，请联系管理员` }, { status: 500 });
    }

    let responseText;

    if (provider === 'claude') {
      const resp = await fetch(ENDPOINTS.claude, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        return NextResponse.json({ error: `AI 服务请求失败 (${resp.status})` }, { status: resp.status });
      }

      const data = await resp.json();
      responseText = data.content[0].text;
    } else {
      const endpoint = ENDPOINTS[provider];
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: '你是一位资深的SEO专家。请始终以纯JSON格式回复，不要包含任何额外文字或markdown代码块标记。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        return NextResponse.json({ error: `AI 服务请求失败 (${resp.status})` }, { status: resp.status });
      }

      const data = await resp.json();
      responseText = data.choices[0].message.content;
    }

    return NextResponse.json({ result: responseText });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: '服务器内部错误，请稍后再试' }, { status: 500 });
  }
}
