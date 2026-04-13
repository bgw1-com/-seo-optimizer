import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// 模型 fallback 列表：如果第一个不可用，尝试下一个
const MODEL_FALLBACKS = ['gpt-5.4', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini'];

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

async function callOpenAI(model, prompt) {
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
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

  const body = await resp.text();
  return { ok: resp.ok, status: resp.status, body };
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试（每分钟最多10次）' }, { status: 429 });
    }

    const { model, prompt } = await request.json();

    if (!model || !prompt) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: '未配置 OpenAI API Key，请联系管理员' }, { status: 500 });
    }

    // 先用用户选的模型，失败则尝试 fallback
    const modelsToTry = [model, ...MODEL_FALLBACKS.filter(m => m !== model)];
    let lastError = '';

    for (const tryModel of modelsToTry) {
      const result = await callOpenAI(tryModel, prompt);

      if (result.ok) {
        try {
          const data = JSON.parse(result.body);
          return NextResponse.json({ result: data.choices[0].message.content });
        } catch (e) {
          lastError = `响应解析失败`;
        }
      } else {
        lastError = `模型 ${tryModel} 失败 (${result.status}): ${result.body.substring(0, 200)}`;
        console.error(lastError);
        // 认证错误或限额错误，不再重试
        if (result.status === 401 || result.status === 429) {
          return NextResponse.json({ error: lastError }, { status: result.status });
        }
      }
    }

    return NextResponse.json({ error: lastError || 'AI 服务请求失败' }, { status: 500 });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: `服务器错误: ${err.message}` }, { status: 500 });
  }
}
