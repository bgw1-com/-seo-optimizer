'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const MODELS = {
  xai: [
    { value: 'grok-3', label: 'Grok-3 (最新)' },
    { value: 'grok-3-mini', label: 'Grok-3 Mini' },
    { value: 'grok-2', label: 'Grok-2' },
  ],
};

const I18N = {
  zh: {
    title1: '大德 SEO ',
    title2: '文章优化助手',
    subtitle: '输入文章标题和内容，AI 将为您提供全面的 SEO 优化建议',
    model: '模型：',
    language: '语言：',
    zh: '中文',
    en: 'English',
    input: '📄 输入内容',
    clear: '清空',
    example: '示例',
    articleTitle: '文章标题',
    articleTitlePh: '输入文章标题...',
    keywords: '目标关键词（可选，逗号分隔）',
    keywordsPh: '例如：健康饮食, 减肥方法, 营养搭配',
    content: '文章内容',
    contentPh: '粘贴或输入文章内容...',
    chars: '字',
    articleType: '文章类型',
    types: {
      story: '成人小说/故事',
      venue: '场所推荐/攻略',
      news: '资讯/新闻',
      guide: '生活指南/科普',
      review: '测评/体验',
      listicle: '榜单/合集',
      community: '社区/交友',
    },
    analyzing: '⏳ 分析中...',
    start: '🚀 开始 SEO 优化分析',
    result: '✨ 优化结果',
    tabs: { overview: '总览', titles: '标题', meta: 'Meta', keywords: '关键词', suggestions: '建议' },
    aiAnalyzing: 'AI 正在分析您的文章...',
    aiWait: '通常需要 10-30 秒',
    placeholder: ['在左侧输入文章标题和内容', '点击「开始 SEO 优化分析」查看结果'],
    scores: { overall: '综合评分', title: '标题评分', readability: '可读性', keyword_usage: '关键词使用', structure: '结构评分' },
    titleAnalysis: '📊 标题分析',
    structSuggest: '📐 结构建议',
    wordCount: '📏 字数建议',
    optimizedTitles: '🏷️ 优化标题建议',
    metaDesc: '📝 Meta Description',
    metaVariants: '🔄 描述变体',
    kwPrimary: '🎯 主要关键词',
    kwSecondary: '📌 次要关键词',
    kwLongTail: '🔗 长尾关键词',
    contentSuggest: '💡 内容优化建议',
    copied: '已复制到剪贴板',
    needInput: '请至少输入文章标题或内容',
    music: '音乐',
  },
  en: {
    title1: 'Daqi SEO ',
    title2: 'Article Optimizer',
    subtitle: 'Enter your article title and content — AI will provide comprehensive SEO optimization suggestions',
    model: 'Model:',
    language: 'Language:',
    zh: '中文',
    en: 'English',
    input: '📄 Input',
    clear: 'Clear',
    example: 'Example',
    articleTitle: 'Article Title',
    articleTitlePh: 'Enter article title...',
    keywords: 'Target Keywords (optional, comma separated)',
    keywordsPh: 'e.g. healthy eating, weight loss, nutrition',
    content: 'Article Content',
    contentPh: 'Paste or type your article content...',
    chars: 'chars',
    articleType: 'Article Type',
    types: {
      story: 'Adult Story / Fiction',
      venue: 'Venue Guide / Recommendation',
      news: 'News / Updates',
      guide: 'Lifestyle Guide / How-To',
      review: 'Review / Experience',
      listicle: 'Listicle / Roundup',
      community: 'Community / Social',
    },
    analyzing: '⏳ Analyzing...',
    start: '🚀 Start SEO Optimization',
    result: '✨ Results',
    tabs: { overview: 'Overview', titles: 'Titles', meta: 'Meta', keywords: 'Keywords', suggestions: 'Tips' },
    aiAnalyzing: 'AI is analyzing your article...',
    aiWait: 'Usually takes 10–30 seconds',
    placeholder: ['Enter your article title and content on the left', 'Click "Start SEO Optimization" to see results'],
    scores: { overall: 'Overall', title: 'Title', readability: 'Readability', keyword_usage: 'Keywords', structure: 'Structure' },
    titleAnalysis: '📊 Title Analysis',
    structSuggest: '📐 Structure Suggestions',
    wordCount: '📏 Word Count Advice',
    optimizedTitles: '🏷️ Optimized Title Suggestions',
    metaDesc: '📝 Meta Description',
    metaVariants: '🔄 Description Variants',
    kwPrimary: '🎯 Primary Keywords',
    kwSecondary: '📌 Secondary Keywords',
    kwLongTail: '🔗 Long-Tail Keywords',
    contentSuggest: '💡 Content Optimization Tips',
    copied: 'Copied to clipboard',
    needInput: 'Please enter at least a title or content',
    music: 'Music',
  },
};

function buildPrompt(title, content, keywords, articleType, lang) {
  const langLabel = lang === 'zh' ? '中文' : 'English';
  const typeMap = {
    story: '成人小说/故事',
    venue: '场所推荐/攻略',
    news: '资讯/新闻',
    guide: '生活指南/科普',
    review: '测评/体验',
    listicle: '榜单/合集',
    community: '社区/交友',
  };
  return `你是一位资深的 SEO 专家，专门服务于成人内容领域（以GAY群体为主要受众）。请用${langLabel}回答。

你需要理解这个领域的特殊性：
- 成人内容的SEO需要巧妙使用关键词，既要吸引目标用户又要考虑搜索引擎的内容政策
- 标题要有吸引力和暗示性，但不能过于直白以避免被搜索引擎降权
- 需要善用长尾关键词和隐晦表达来提升搜索可见性
- GAY社区有自己的术语、热门话题和搜索习惯，优化时要考虑这些

请对以下文章进行全面的 SEO 优化分析。

【文章标题】${title}
【文章类型】${typeMap[articleType] || articleType}
【目标受众】GAY群体
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
  const [provider, setProvider] = useState('xai');
  const [model, setModel] = useState('grok-3');
  const [lang, setLang] = useState('zh');
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [content, setContent] = useState('');
  const [articleType, setArticleType] = useState('story');
  const [tab, setTab] = useState('overview');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const t = I18N[lang];

  useEffect(() => {
    const v = videoRef.current;
    if (v) { v.muted = true; v.playbackRate = 1.0; v.play().catch(() => {}); }
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
    navigator.clipboard.writeText(text).then(() => showToast(t.copied));
  }

  function loadExample() {
    if (lang === 'zh') {
      setTitle('2026年全国GAY友好场所推荐指南');
      setContent('随着社会观念的进步，越来越多的城市出现了对GAY群体友好的社交场所。本文整理了2026年最受欢迎的GAY友好场所，涵盖酒吧、咖啡厅、健身房等多种类型。\n\n一、北京地区\n北京作为首都，拥有最丰富的GAY友好场所资源。三里屯、工体周边是传统的聚集区域，近年来五道口、望京等区域也涌现出不少新去处。\n\n二、上海地区\n上海的开放氛围使得GAY场所文化更加多元。从安福路的精品咖啡店到外滩的高端酒吧，选择非常丰富。\n\n三、成都地区\n成都以其包容的城市文化著称，太古里、九眼桥周边是年轻人最爱的社交区域。\n\n四、出行建议\n选择场所时建议提前通过社交平台了解最新信息，注意安全社交。');
      setKeywords('GAY友好场所, 同志酒吧, GAY社交');
    } else {
      setTitle('2026 Guide to Gay-Friendly Venues Across the US');
      setContent('As social attitudes progress, more cities are opening welcoming spaces for the gay community. This guide covers the most popular gay-friendly venues of 2026, including bars, cafes, and gyms.\n\n1. New York\nAs a cultural hub, NYC offers the richest selection of gay-friendly spots. Chelsea and Hell\'s Kitchen remain classic areas, while Bushwick and Astoria have emerged as new favorites.\n\n2. Los Angeles\nLA\'s open atmosphere has made its scene more diverse than ever. From boutique cafes in West Hollywood to rooftop bars downtown, the options are endless.\n\n3. Chicago\nKnown for its inclusive culture, Boystown and Andersonville remain beloved by young travelers.\n\n4. Travel Tips\nBefore visiting, check the latest info on social platforms and practice safe social etiquette.');
      setKeywords('gay friendly venues, gay bars, LGBTQ social');
    }
  }

  async function optimize() {
    if (!title && !content) { setError(t.needInput); return; }
    setLoading(true); setError(''); setResult(null);

    try {
      const prompt = buildPrompt(title, content, keywords, articleType, lang);
      const resp = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'API request failed');

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

  return (
    <>
      <video ref={videoRef} className="video-bg" src="/bg-video.mp4" autoPlay loop muted playsInline />
      <audio ref={audioRef} src="/bg-music.mp3" loop preload="auto" />
      <button className={`music-btn ${playing ? 'playing' : ''}`} onClick={toggleMusic}>
        <span className="music-note">♪</span>
        <span className="music-label">{t.music}</span>
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
          <h1><img src="/logo.gif" alt="logo" style={{height:'40px',verticalAlign:'middle',marginRight:'8px',borderRadius:'50%'}} />{t.title1}<span>{t.title2}</span></h1>
          <p>{t.subtitle}</p>
        </div>

        <div className="main">
          {/* Left: Input */}
          <div className="panel">
            <div className="panel-header">
              <h2>{t.input}</h2>
              <div className="btn-group">
                <button className="btn btn-sm btn-secondary" onClick={() => { setTitle(''); setContent(''); setKeywords(''); }}>{t.clear}</button>
                <button className="btn btn-sm btn-secondary" onClick={loadExample}>{t.example}</button>
              </div>
            </div>
            <div className="panel-body">
              <div className="field">
                <label>{t.articleTitle}</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t.articleTitlePh} maxLength={200} />
                <div className="char-count">{title.length}/200</div>
              </div>
              <div className="field">
                <label>{t.keywords}</label>
                <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder={t.keywordsPh} />
              </div>
              <div className="field">
                <label>{t.content}</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={t.contentPh} rows={10} />
                <div className="char-count">{content.length} {t.chars}</div>
              </div>
              <div className="field">
                <label>{t.articleType}</label>
                <select value={articleType} onChange={e => setArticleType(e.target.value)}>
                  {Object.entries(t.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={optimize} disabled={loading} style={{width:'100%',justifyContent:'center'}}>
                {loading ? t.analyzing : t.start}
              </button>
            </div>
          </div>

          {/* Right: Results */}
          <div className="panel">
            <div className="panel-header">
              <h2>{t.result}</h2>
              <div className="tabs">
                {tabs.map(tk => (
                  <button key={tk} className={`tab ${tab===tk?'active':''}`} onClick={() => setTab(tk)}>{t.tabs[tk]}</button>
                ))}
              </div>
            </div>
            <div className="panel-body">
              {error && <div className="error-msg">❌ {error}</div>}
              {loading && (
                <div className="loading">
                  <div className="spinner" />
                  <p>{t.aiAnalyzing}</p>
                  <p style={{marginTop:8,fontSize:12}}>{t.aiWait}</p>
                </div>
              )}
              {!result && !loading && !error && (
                <div className="placeholder">
                  <div className="icon">🔍</div>
                  <p>{t.placeholder[0]}<br/>{t.placeholder[1]}</p>
                </div>
              )}

              {result && tab === 'overview' && (
                <>
                  <div className="score-grid">
                    <ScoreCard value={result.scores.overall} label={t.scores.overall} />
                    <ScoreCard value={result.scores.title} label={t.scores.title} />
                    <ScoreCard value={result.scores.readability} label={t.scores.readability} />
                    <ScoreCard value={result.scores.keyword_usage} label={t.scores.keyword_usage} />
                    <ScoreCard value={result.scores.structure} label={t.scores.structure} />
                  </div>
                  <div className="result-section"><h3>{t.titleAnalysis}</h3><div className="meta-box">{result.title_analysis}</div></div>
                  <div className="result-section"><h3>{t.structSuggest}</h3><div className="meta-box">{result.structure_suggestions}</div></div>
                  <div className="result-section"><h3>{t.wordCount}</h3><div className="meta-box">{result.word_count_advice}</div></div>
                </>
              )}

              {result && tab === 'titles' && (
                <div className="result-section">
                  <h3>{t.optimizedTitles}</h3>
                  {(result.optimized_titles||[]).map((x,i) => (
                    <div key={i} className="title-option" onClick={() => copy(x)}>
                      <span className="num">{i+1}</span>
                      <span className="title-text">{x}</span>
                    </div>
                  ))}
                </div>
              )}

              {result && tab === 'meta' && (
                <>
                  <div className="result-section">
                    <h3>{t.metaDesc}</h3>
                    <div className="meta-box" onClick={() => copy(result.meta_description)}>{result.meta_description}</div>
                  </div>
                  {result.meta_description_variants?.length > 0 && (
                    <div className="result-section">
                      <h3>{t.metaVariants}</h3>
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
                    <h3>{t.kwPrimary}</h3>
                    <div className="keyword-tags">{(result.extracted_keywords?.primary||[]).map((k,i) => <span key={i} className="keyword-tag" style={{background:'rgba(108,92,231,.15)',color:'var(--accent2)'}}>{k}</span>)}</div>
                  </div>
                  <div className="result-section">
                    <h3>{t.kwSecondary}</h3>
                    <div className="keyword-tags">{(result.extracted_keywords?.secondary||[]).map((k,i) => <span key={i} className="keyword-tag" style={{background:'rgba(0,184,148,.15)',color:'var(--green)'}}>{k}</span>)}</div>
                  </div>
                  <div className="result-section">
                    <h3>{t.kwLongTail}</h3>
                    <div className="keyword-tags">{(result.extracted_keywords?.long_tail||[]).map((k,i) => <span key={i} className="keyword-tag" style={{background:'rgba(116,185,255,.15)',color:'var(--blue)'}}>{k}</span>)}</div>
                  </div>
                </>
              )}

              {result && tab === 'suggestions' && (
                <div className="result-section">
                  <h3>{t.contentSuggest}</h3>
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
