'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const MODELS = {
  openai: [
    { value: 'gpt-5.4', label: 'GPT-5.4 (最新)' },
    { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
    { value: 'gpt-5.3', label: 'GPT-5.3' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
  ],
};

function buildPrompt(title, content, keywords, articleType, lang) {
  const langLabel = lang === 'zh' ? '中文' : 'English';
  return `你是一位资深的 SEO 专家和内容优化顾问。请用${langLabel}回答。

请对以下文章进行全面的 SEO 优化分析。

【文章标题】${title}
【文章类型】${articleType}
【目标关键词】${keywords || '未指定，请自行提取'}
【文章内容】
${content.substring(0, 4000)}

请以严格的 JSON 格式返回分析结果（不要包含任何额外文字，只返回JSON）：

{
  "scores": {
    "overall": <0-100整数>,
    "title": <0-100整数>,
    "readability": <0-100整数>,
    "keyword_usage": <0-100整数>,
    "structure": <0-100整数>
  },
  "optimized_titles": ["<优化标题1>","<优化标题2>","<优化标题3>","<优化标题4>","<优化标题5>"],
  "meta_description": "<150字以内的meta描述>",
  "meta_description_variants": ["<变体1>","<变体2>"],
  "extracted_keywords": {
    "primary": ["<主要关键词1>","<主要关键词2>","<主要关键词3>"],
    "secondary": ["<次要关键词1>","<次要关键词2>","<次要关键词3>"],
    "long_tail": ["<长尾关键词1>","<长尾关键词2>","<长尾关键词3>"]
  },
  "content_suggestions": ["<建议1>","<建议2>","<建议3>","<建议4>","<建议5>"],
  "title_analysis": "<对原标题的简要分析>",
  "structure_suggestions": "<对文章结构的优化建议>",
  "word_count_advice": "<关于文章字数的建议>"
}`;
}

function scoreClass(s) {
  if (s >= 70) return 'good';
  if (s >= 40) return 'ok';
  return 'bad';
}

function ScoreCard({ value, label }) {
  const cls = scoreClass(value);
  return (
    <div className={`score-card ${cls}`}>
      <div className="score-val">{value}</div>
      <div className="score-label">{label}</div>
    </div>
  );
}

export default function Home() {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-5.4');
  const [lang, setLang] = useState('zh');
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [content, setContent] = useState('');
  const [articleType, setArticleType] = useState('blog');
  const [tab, setTab] = useState('overview');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (v) { v.muted = true; v.play().catch(() => {}); }
  }, []);

  const toggleMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      a.pause();
      setPlaying(false);
    }
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板'));
  }

  function loadExample() {
    setTitle('如何在30天内养成健康饮食习惯');
    setContent('很多人都想改善自己的饮食习惯，但往往不知道从何下手。本文将为你提供一套完整的30天饮食改善计划，帮助你循序渐进地建立健康的饮食模式。\n\n第一周：认识你的饮食现状\n首先，我们需要了解自己目前的饮食情况。记录每天吃的食物，包括正餐和零食。这个过程会帮助你发现饮食中的问题。\n\n第二周：逐步替换不健康食物\n不要试图一次性改变所有饮食习惯。每天替换一种不健康的食物，比如用水果代替甜点，用坚果代替薯片。\n\n第三周：建立规律的饮食时间\n固定的用餐时间有助于调节身体的代谢节律。尽量在固定的时间吃早餐、午餐和晚餐。\n\n第四周：巩固和优化\n回顾过去三周的进展，找到适合自己的饮食节奏。这个阶段重点是让健康饮食成为自然而然的习惯。');
    setKeywords('健康饮食, 饮食习惯, 30天计划');
  }

  async function optimize() {
    if (!title && !content) { setError('请至少输入文章标题或内容'); return; }
    setLoading(true); setError(''); setResult(null);

    try {
      const prompt = buildPrompt(title, content, keywords, articleType, lang);
      const resp = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'API 请求失败');

      let text = data.result.trim();
      const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (m) text = m[1].trim();
      const parsed = JSON.parse(text);
      setResult(parsed);
      setTab('overview');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleProviderChange(p) {
    setProvider(p);
    setModel(MODELS[p][0].value);
  }

  const tabs = ['overview', 'titles', 'meta', 'keywords', 'suggestions'];
  const tabLabels = { overview: '总览', titles: '标题', meta: 'Meta', keywords: '关键词', suggestions: '建议' };

  return (
    <>
      <video ref={videoRef} className="video-bg" src="/bg-video.mp4" autoPlay loop muted playsInline />
      <audio ref={audioRef} src="/bg-music.mp3" loop preload="auto" />
      <button className={`music-btn ${playing ? 'playing' : ''}`} onClick={toggleMusic}>
        <span className="music-note">♪</span>
        <span className="music-label">音乐</span>
        <span className="music-play">{playing ? '❚❚' : '▶'}</span>
      </button>
      <style>{`
        :root{--bg:#0f1117;--surface:#1a1d27;--surface2:#242836;--border:#2e3345;--text:#e4e6ed;--text2:#9498a8;--accent:#6c5ce7;--accent2:#a29bfe;--green:#00b894;--orange:#fdcb6e;--red:#fd7979;--blue:#74b9ff}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
        .container{max-width:1200px;margin:0 auto;padding:24px}
        .header{text-align:center;padding:32px 0 24px}
        .header h1{font-size:28px;font-weight:700;margin-bottom:8px}
        .header h1 span{color:var(--accent2)}
        .header p{color:var(--text2);font-size:14px}
        .settings-bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:rgba(26,29,39,.85);backdrop-filter:blur(12px);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:20px}
        .settings-bar label{color:var(--text2);font-size:13px;white-space:nowrap}
        .settings-bar select{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-size:13px;outline:none}
        .main{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        @media(max-width:800px){.main{grid-template-columns:1fr}}
        .panel{background:rgba(26,29,39,.85);backdrop-filter:blur(12px);border:1px solid var(--border);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
        .panel-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border)}
        .panel-header h2{font-size:15px;font-weight:600}
        .panel-body{padding:16px;flex:1;display:flex;flex-direction:column;gap:14px}
        .field label{display:block;font-size:12px;color:var(--text2);margin-bottom:6px;font-weight:500}
        .field input,.field textarea,.field select{width:100%;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:8px;font-size:14px;outline:none;font-family:inherit}
        .field textarea{resize:vertical;min-height:180px;line-height:1.6}
        .char-count{font-size:11px;color:var(--text2);text-align:right;margin-top:4px}
        .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all .2s}
        .btn-primary{background:var(--accent);color:#fff}
        .btn-primary:hover{background:var(--accent2)}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed}
        .btn-secondary{background:var(--surface2);color:var(--text);border:1px solid var(--border)}
        .btn-sm{padding:6px 12px;font-size:12px}
        .btn-group{display:flex;gap:8px}
        .score-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
        .score-card{background:var(--surface2);border-radius:10px;padding:14px;text-align:center;border:1px solid var(--border)}
        .score-card.good{border-color:var(--green)}.score-card.ok{border-color:var(--orange)}.score-card.bad{border-color:var(--red)}
        .score-val{font-size:28px;font-weight:700;margin-bottom:4px}
        .score-card.good .score-val{color:var(--green)}.score-card.ok .score-val{color:var(--orange)}.score-card.bad .score-val{color:var(--red)}
        .score-label{font-size:11px;color:var(--text2)}
        .result-section{margin-bottom:16px}
        .result-section h3{font-size:13px;color:var(--accent2);margin-bottom:10px}
        .title-option{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:8px;cursor:pointer;display:flex;align-items:flex-start;gap:10px;transition:border-color .2s}
        .title-option:hover{border-color:var(--accent)}
        .title-option .num{background:var(--accent);color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
        .title-option .title-text{flex:1;font-size:14px;line-height:1.5}
        .meta-box{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px;font-size:13px;line-height:1.7;cursor:pointer;margin-bottom:8px}
        .keyword-tags{display:flex;flex-wrap:wrap;gap:6px}
        .keyword-tag{padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500}
        .suggestions-list{list-style:none}
        .suggestions-list li{padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;line-height:1.6}
        .suggestions-list li:last-child{border-bottom:none}
        .tabs{display:flex;gap:4px}
        .tab{padding:6px 14px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;color:var(--text2);background:none;border:none}
        .tab.active{background:var(--accent);color:#fff}
        .lang-chips{display:flex;gap:6px}
        .lang-chip{padding:5px 12px;border-radius:20px;font-size:12px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);cursor:pointer}
        .lang-chip.active{background:var(--accent);border-color:var(--accent);color:#fff}
        .spinner{width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .error-msg{background:rgba(253,121,121,.1);border:1px solid var(--red);border-radius:8px;padding:12px;color:var(--red);font-size:13px}
        .toast{position:fixed;bottom:24px;right:24px;background:var(--green);color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:500;transform:translateY(100px);opacity:0;transition:all .3s;z-index:999}
        .toast.show{transform:translateY(0);opacity:1}
        .placeholder{text-align:center;padding:60px 20px;color:var(--text2)}
        .placeholder .icon{font-size:40px;margin-bottom:12px}
        .placeholder p{font-size:13px;line-height:1.6}
        .loading{text-align:center;padding:40px}
        .loading p{color:var(--text2);font-size:13px}
        .video-bg{position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:-1;opacity:.35}
        .music-btn{position:fixed;top:20px;right:20px;z-index:100;display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:20px;background:rgba(0,0,0,.55);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:13px;cursor:pointer;transition:all .3s;box-shadow:0 2px 12px rgba(0,0,0,.3)}
        .music-btn:hover{background:rgba(0,0,0,.7);border-color:rgba(255,255,255,.3)}
        .music-note{font-size:15px}
        .music-label{font-weight:500}
        .music-play{font-size:11px;opacity:.8}
        .music-btn.playing .music-note{animation:note-bounce 1s ease infinite}
        @keyframes note-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
      `}</style>

      <div className="container">
        <div className="header">
          <h1>📝 SEO <span>文章优化助手</span></h1>
          <p>输入文章标题和内容，AI 将为您提供全面的 SEO 优化建议</p>
        </div>

        <div className="settings-bar">
          <label>模型：</label>
          <select value={model} onChange={e => setModel(e.target.value)}>
            {MODELS[provider].map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <label>语言：</label>
          <div className="lang-chips">
            <span className={`lang-chip ${lang==='zh'?'active':''}`} onClick={() => setLang('zh')}>中文</span>
            <span className={`lang-chip ${lang==='en'?'active':''}`} onClick={() => setLang('en')}>English</span>
          </div>
        </div>

        <div className="main">
          {/* Left: Input */}
          <div className="panel">
            <div className="panel-header">
              <h2>📄 输入内容</h2>
              <div className="btn-group">
                <button className="btn btn-sm btn-secondary" onClick={() => { setTitle(''); setContent(''); setKeywords(''); }}>清空</button>
                <button className="btn btn-sm btn-secondary" onClick={loadExample}>示例</button>
              </div>
            </div>
            <div className="panel-body">
              <div className="field">
                <label>文章标题</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="输入文章标题..." maxLength={200} />
                <div className="char-count">{title.length}/200</div>
              </div>
              <div className="field">
                <label>目标关键词（可选，逗号分隔）</label>
                <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="例如：健康饮食, 减肥方法, 营养搭配" />
              </div>
              <div className="field">
                <label>文章内容</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="粘贴或输入文章内容..." rows={10} />
                <div className="char-count">{content.length} 字</div>
              </div>
              <div className="field">
                <label>文章类型</label>
                <select value={articleType} onChange={e => setArticleType(e.target.value)}>
                  <option value="blog">博客文章</option>
                  <option value="news">新闻资讯</option>
                  <option value="tutorial">教程指南</option>
                  <option value="review">评测/测评</option>
                  <option value="listicle">清单文章</option>
                  <option value="opinion">观点/评论</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={optimize} disabled={loading} style={{width:'100%',justifyContent:'center'}}>
                {loading ? '⏳ 分析中...' : '🚀 开始 SEO 优化分析'}
              </button>
            </div>
          </div>

          {/* Right: Results */}
          <div className="panel">
            <div className="panel-header">
              <h2>✨ 优化结果</h2>
              <div className="tabs">
                {tabs.map(t => (
                  <button key={t} className={`tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>{tabLabels[t]}</button>
                ))}
              </div>
            </div>
            <div className="panel-body">
              {error && <div className="error-msg">❌ {error}</div>}
              {loading && (
                <div className="loading">
                  <div className="spinner" />
                  <p>AI 正在分析您的文章...</p>
                  <p style={{marginTop:8,fontSize:12}}>通常需要 10-30 秒</p>
                </div>
              )}
              {!result && !loading && !error && (
                <div className="placeholder">
                  <div className="icon">🔍</div>
                  <p>在左侧输入文章标题和内容<br/>点击「开始 SEO 优化分析」查看结果</p>
                </div>
              )}

              {result && tab === 'overview' && (
                <>
                  <div className="score-grid">
                    <ScoreCard value={result.scores.overall} label="综合评分" />
                    <ScoreCard value={result.scores.title} label="标题评分" />
                    <ScoreCard value={result.scores.readability} label="可读性" />
                    <ScoreCard value={result.scores.keyword_usage} label="关键词使用" />
                    <ScoreCard value={result.scores.structure} label="结构评分" />
                  </div>
                  <div className="result-section"><h3>📊 标题分析</h3><div className="meta-box">{result.title_analysis}</div></div>
                  <div className="result-section"><h3>📐 结构建议</h3><div className="meta-box">{result.structure_suggestions}</div></div>
                  <div className="result-section"><h3>📏 字数建议</h3><div className="meta-box">{result.word_count_advice}</div></div>
                </>
              )}

              {result && tab === 'titles' && (
                <div className="result-section">
                  <h3>🏷️ 优化标题建议</h3>
                  {(result.optimized_titles||[]).map((t,i) => (
                    <div key={i} className="title-option" onClick={() => copy(t)}>
                      <span className="num">{i+1}</span>
                      <span className="title-text">{t}</span>
                    </div>
                  ))}
                </div>
              )}

              {result && tab === 'meta' && (
                <>
                  <div className="result-section">
                    <h3>📝 Meta Description</h3>
                    <div className="meta-box" onClick={() => copy(result.meta_description)}>{result.meta_description}</div>
                  </div>
                  {result.meta_description_variants?.length > 0 && (
                    <div className="result-section">
                      <h3>🔄 描述变体</h3>
                      {result.meta_description_variants.map((v,i) => (
                        <div key={i} className="meta-box" onClick={() => copy(v)}>{v}</div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {result && tab === 'keywords' && (
                <>
                  <div className="result-section">
                    <h3>🎯 主要关键词</h3>
                    <div className="keyword-tags">{(result.extracted_keywords?.primary||[]).map((k,i) => <span key={i} className="keyword-tag" style={{background:'rgba(108,92,231,.15)',color:'var(--accent2)'}}>{k}</span>)}</div>
                  </div>
                  <div className="result-section">
                    <h3>📌 次要关键词</h3>
                    <div className="keyword-tags">{(result.extracted_keywords?.secondary||[]).map((k,i) => <span key={i} className="keyword-tag" style={{background:'rgba(0,184,148,.15)',color:'var(--green)'}}>{k}</span>)}</div>
                  </div>
                  <div className="result-section">
                    <h3>🔗 长尾关键词</h3>
                    <div className="keyword-tags">{(result.extracted_keywords?.long_tail||[]).map((k,i) => <span key={i} className="keyword-tag" style={{background:'rgba(116,185,255,.15)',color:'var(--blue)'}}>{k}</span>)}</div>
                  </div>
                </>
              )}

              {result && tab === 'suggestions' && (
                <div className="result-section">
                  <h3>💡 内容优化建议</h3>
                  <ul className="suggestions-list">
                    {(result.content_suggestions||[]).map((s,i) => <li key={i}>▸ {s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`toast ${toast?'show':''}`}>{toast}</div>
    </>
  );
}
