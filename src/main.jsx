import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import yamlLang from 'highlight.js/lib/languages/yaml';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import markdownLang from 'highlight.js/lib/languages/markdown';
import ini from 'highlight.js/lib/languages/ini';
import sqlLang from 'highlight.js/lib/languages/sql';
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml } from 'yaml';
import './style.css';

hljs.registerLanguage('json', json);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('yaml', yamlLang);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('markdown', markdownLang);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('sql', sqlLang);
marked.setOptions({ gfm: true, breaks: false });

const samples = {
  json: `{
  "name": "folio",
  "description": "一个更好看的文件预览器",
  "version": "1.0.0",
  "features": ["即时预览", "多格式识别", "隐私优先"],
  "theme": {
    "background": "#282c34",
    "accent": "#61afef"
  },
  "open": true
}`,
  markdown: `# 写下想法，让它自然呈现 ✨

Folio 为你的文字留出空间。粘贴内容或上传文件，即刻获得**清晰、舒适的预览**。

## 一切恰到好处

- 自动识别常用文件格式
- 保留原始排版与语法高亮
- 内容只在浏览器内处理

> 好的工具，不应该让你分心。

\`\`\`js
const moment = "just right";
console.log("Made for this " + moment + ".");
\`\`\`

[开始探索 →](https://example.com)
`,
  toml: `# Folio 配置
name = "folio"
version = "1.0.0"
description = "一个更好看的文件预览器"
enabled = true
tags = ["simple", "thoughtful", "local"]

[theme]
background = "#282c34"
accent = "#61afef"

[preferences]
font_size = 16
show_line_numbers = true`,
};

function detectFormat(text, filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase();
  const extensions = { json: 'json', jsonc: 'json', md: 'markdown', markdown: 'markdown', mdown: 'markdown', toml: 'toml', yaml: 'yaml', yml: 'yaml', html: 'html', htm: 'html', xml: 'xml', js: 'javascript', mjs: 'javascript', cjs: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'jsx', css: 'css', scss: 'scss', sh: 'bash', bash: 'bash', txt: 'text', log: 'text', csv: 'csv' };
  if (extensions[ext]) return extensions[ext];
  const source = text.trim();
  if (!source) return 'text';
  if (/^(?:\{|\[)[\s\S]*(?:\}|\])$/.test(source)) {
    try { JSON.parse(source); return 'json'; } catch { /* Try another format. */ }
  }
  if (/^\s*(?:---\s*\n)?(?:[\w.-]+\s*:\s*|\s*-\s+\w)/m.test(source)) {
    try { parseYaml(source); return 'yaml'; } catch { /* Keep detection heuristic-based below. */ }
  }
  if (/^\s*\[\s*[\w.-]+\s*\]\s*$/m.test(source) || /^\s*[\w.-]+\s*=\s*(?:"|\[|\{|true\b|false\b|-?\d)/m.test(source)) {
    try { parseToml(source); return 'toml'; } catch { /* Not TOML. */ }
  }
  if (/^\s*#{1,6}\s|^\s*[-*+]\s|^\s*>\s|```|\[[^\]]+\]\([^)]+\)/m.test(source)) return 'markdown';
  if (/^\s*<!doctype html|^\s*<html[\s>]|^\s*<[a-z][\s\S]*>\s*$/i.test(source)) return 'html';
  if (/^\s*<\?xml|^\s*<[\w:-]+(?:\s[^>]*)?>[\s\S]*<\/[\w:-]+>\s*$/i.test(source)) return 'xml';
  if (/^\s*(?:import\s.+from\s|export\s|const\s|let\s|function\s|class\s|console\.)/m.test(source)) return 'javascript';
  if (/^\s*(?:SELECT|INSERT|UPDATE|CREATE TABLE)\b/im.test(source)) return 'sql';
  if (source.includes(',') && source.split('\n').filter(Boolean).length > 1 && source.split('\n').every(line => line.split(',').length > 1)) return 'csv';
  return 'text';
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const shapes = {
    sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.1 2.1L22 17l-1.9.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></>,
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16.5v2A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-2"/></>,
    file: <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z"/><path d="M13 3v7h7M8 14h8M8 17h6"/></>,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    x: <><path d="m18 6-12 12M6 6l12 12"/></>,
    code: <><path d="m8 17-5-5 5-5M16 7l5 5-5 5M14 4l-4 16"/></>,
    down: <path d="m7 10 5 5 5-5"/>,
    expand: <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/>,
    shrink: <path d="M3 8h5V3M21 8h-5V3M16 21v-5h5M8 21v-5H3"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
    moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>,
  };
  return <svg {...common}>{shapes[name]}</svg>;
}

const THEME_STORAGE_KEY = 'folio-theme';
const THEME_COLORS = { dark: '#282c34', light: '#f6f7f9' };

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* Ignore storage access errors. */ }
  return 'dark';
}

const formatNames = { json: 'JSON', markdown: 'Markdown', toml: 'TOML', yaml: 'YAML', html: 'HTML', xml: 'XML', javascript: 'JavaScript', typescript: 'TypeScript', jsx: 'JSX', css: 'CSS', scss: 'SCSS', bash: 'Shell', sql: 'SQL', csv: 'CSV', text: '纯文本' };

function JsonNode({ value, name, root = false }) {
  const [open, setOpen] = useState(true);
  const isObject = value !== null && typeof value === 'object';
  const entries = isObject ? Object.entries(value) : [];
  const isEmpty = entries.length === 0;
  const key = root ? null : <span className="json-key">{typeof name === 'number' ? name : `"${name}"`}</span>;
  if (!isObject) {
    const kind = value === null ? 'null' : typeof value;
    return <div className="json-row">{key && <>{key}<span className="json-punct">: </span></>}<span className={`json-${kind}`}>{typeof value === 'string' ? `"${value}"` : String(value)}</span>{!root && <span className="json-comma">,</span>}</div>;
  }
  const bracket = Array.isArray(value) ? ['[', ']'] : ['{', '}'];
  if (isEmpty) return <div className="json-row">{key && <>{key}<span className="json-punct">: </span></>}{bracket[0]}{bracket[1]}{!root && <span className="json-comma">,</span>}</div>;
  return <div className="json-node">
    <div className="json-row"><button className="json-toggle" onClick={() => setOpen(!open)} aria-label={open ? '折叠' : '展开'}><Icon name="down" size={13}/></button>{key && <>{key}<span className="json-punct">: </span></>}{open ? bracket[0] : <><span className="json-collapsed">{entries.length} 项</span>{bracket[1]}{!root && <span className="json-comma">,</span>}</>}</div>
    {open && <><div className="json-children">{entries.map(([childName, child]) => <JsonNode key={childName} value={child} name={Array.isArray(value) ? Number(childName) : childName}/>)}</div><div className="json-row">{bracket[1]}{!root && <span className="json-comma">,</span>}</div></>}
  </div>;
}

function App() {
  const [content, setContent] = useState(samples.markdown);
  const [filename, setFilename] = useState('');
  const [tab, setTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const inputRef = useRef(null);
  const previewRef = useRef(null);
  const fullscreenButtonRef = useRef(null);
  const format = useMemo(() => detectFormat(content, filename), [content, filename]);
  const lineCount = content ? content.split('\n').length : 0;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', THEME_COLORS[theme]);
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* Ignore storage access errors. */ }
  }, [theme]);

  const toggleTheme = () => setTheme(current => (current === 'dark' ? 'light' : 'dark'));

  const exitPreviewFullscreen = useCallback(() => {
    setPreviewFullscreen(false);
    if (document.fullscreenElement === previewRef.current) {
      document.exitFullscreen().catch(() => {});
    }
    fullscreenButtonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = document.fullscreenElement === previewRef.current;
      setPreviewFullscreen(active);
      if (!active) fullscreenButtonRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!previewFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = event => {
      if (event.key === 'Escape') exitPreviewFullscreen();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [previewFullscreen, exitPreviewFullscreen]);

  const togglePreviewFullscreen = async () => {
    if (previewFullscreen) { exitPreviewFullscreen(); return; }
    setPreviewFullscreen(true);
    // Keep the viewport-filling layout when native fullscreen is unavailable.
    try { await previewRef.current?.requestFullscreen?.(); } catch { /* Use CSS fallback. */ }
  };

  const loadFile = useCallback(file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setContent(String(reader.result ?? '')); setFilename(file.name); setTab('preview'); };
    reader.readAsText(file);
  }, []);

  const onPaste = event => {
    const pasted = event.clipboardData?.getData('text/plain');
    if (pasted) { event.preventDefault(); setContent(pasted); setFilename(''); }
  };

  const rendered = useMemo(() => {
    if (!content.trim()) return null;
    try {
      if (format === 'json') return <div className="json-tree"><JsonNode value={JSON.parse(content)} root/></div>;
      if (format === 'markdown') return <article className="markdown" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content)) }}/>;
      if (format === 'toml') return <pre className="code-view"><code className="hljs" dangerouslySetInnerHTML={{ __html: hljs.highlight(content, { language: 'ini' }).value }}/></pre>;
      if (format === 'yaml') { const value = parseYaml(content); return <div className="json-tree"><JsonNode value={value} root/></div>; }
      if (['text', 'csv'].includes(format)) return <pre className="plain-view">{content}</pre>;
      const aliases = { html: 'xml', jsx: 'javascript', scss: 'css', sql: 'sql', typescript: 'typescript', javascript: 'javascript', xml: 'xml', css: 'css', bash: 'bash' };
      const language = aliases[format] || format;
      const safeCode = hljs.getLanguage(language) ? hljs.highlight(content, { language }).value : DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      return <pre className="code-view"><code className="hljs" dangerouslySetInnerHTML={{ __html: safeCode }}/></pre>;
    } catch (error) {
      return <div className="parse-error"><div className="error-icon">!</div><div><strong>暂时无法解析为 {formatNames[format] || format}</strong><p>{error.message}</p><button onClick={() => setTab('source')}>查看原始内容</button></div></div>;
    }
  }, [content, format]);

  const copyContent = async () => {
    if (!content) return;
    try { await navigator.clipboard.writeText(content); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setTab('source'); }
  };

  const useSample = key => { setContent(samples[key]); setFilename(''); setTab('preview'); };

  return <div className="app-shell">
    <header className="topbar" inert={previewFullscreen}>
      <a className="brand" href="#top" aria-label="Folio 首页"><span className="brand-mark"><Icon name="file" size={18}/></span><span className="brand-name">folio<span className="brand-dot">.</span></span></a>
      <div className="topbar-right">
        <span className="privacy-note"><span className="privacy-dot"/> 所有内容仅在本地处理</span>
        <span className="topbar-divider"/>
        <a className="topbar-link" href="https://vercel.com" target="_blank" rel="noreferrer">一个安静的文件空间</a>
        <span className="topbar-divider"/>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14}/>
          <span className="theme-toggle-label">{theme === 'dark' ? '浅色' : '深色'}</span>
        </button>
      </div>
    </header>

    <main id="top" className="main-content">
      <section className="intro" inert={previewFullscreen}>
        <div className="eyebrow"><Icon name="sparkle" size={14}/> JUST THE WAY IT SHOULD BE</div>
        <h1>文件，恰好如此呈现<span>。</span></h1>
        <p>粘贴内容，或将文件放在这里。<br className="mobile-break"/>格式识别与优雅呈现，交给 Folio。</p>
      </section>

      <section className={`workspace ${dragging ? 'is-dragging' : ''}`} onDragEnter={e => { e.preventDefault(); setDragging(true); }} onDragOver={e => e.preventDefault()} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }} onDrop={e => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files?.[0]); }}>
        <section className="input-panel" aria-label="文件输入" inert={previewFullscreen}>
          <div className="panel-header"><div className="panel-heading"><span className="step-number">01</span><h2>添加内容</h2></div><button className="upload-button" onClick={() => inputRef.current?.click()}><Icon name="upload" size={16}/> 上传文件</button><input ref={inputRef} className="visually-hidden" type="file" onChange={e => loadFile(e.target.files?.[0])} accept=".json,.jsonc,.md,.markdown,.toml,.yaml,.yml,.txt,.log,.html,.htm,.xml,.js,.mjs,.cjs,.ts,.tsx,.jsx,.css,.scss,.sh,.bash,.sql,.csv,.env,.ini,.conf"/></div>
          <div className="editor-wrap"><div className="editor-gutter">{Array.from({ length: Math.max(lineCount, 1) }, (_, index) => <span key={index}>{index + 1}</span>)}</div><textarea value={content} onChange={e => { setContent(e.target.value); setFilename(''); }} onPaste={onPaste} spellCheck="false" aria-label="粘贴或输入文件内容" placeholder="在此粘贴内容…" /></div>
          <div className="input-footer"><span>直接粘贴或拖拽文件到此处</span><span className="format-examples">JSON · Markdown · TOML · YAML</span></div>
        </section>

        <section ref={previewRef} id="preview-panel" className={`preview-panel${previewFullscreen ? ' preview-fullscreen' : ''}`} aria-label="格式化预览">
          <div className="panel-header preview-header"><div className="panel-heading"><span className="step-number">02</span><h2>预览</h2></div><div className="header-actions"><button ref={fullscreenButtonRef} className="icon-button" onClick={togglePreviewFullscreen} aria-label={previewFullscreen ? "退出全屏" : "全屏预览"} title={previewFullscreen ? "退出全屏（Esc）" : "全屏预览"} aria-pressed={previewFullscreen} aria-controls="preview-panel"><Icon name={previewFullscreen ? "shrink" : "expand"} size={16}/></button><button className={`icon-button ${copied ? 'copied' : ''}`} onClick={copyContent} aria-label="复制原始内容" title="复制原始内容"><Icon name={copied ? 'check' : 'copy'} size={16}/></button><button className="icon-button" onClick={() => { setContent(''); setFilename(''); }} aria-label="清空内容" title="清空内容"><Icon name="x" size={17}/></button></div></div>
          <div className="preview-toolbar"><div className="format-pill"><span className="format-indicator"/><span>{formatNames[format] || format.toUpperCase()}</span><span className="auto-label">自动识别</span></div><div className="view-switch" role="tablist" aria-label="预览方式"><button className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')} role="tab" aria-selected={tab === 'preview'}>渲染</button><button className={tab === 'source' ? 'active' : ''} onClick={() => setTab('source')} role="tab" aria-selected={tab === 'source'}>源码</button></div></div>
          <div className={`preview-canvas ${tab === 'source' ? 'source-canvas' : ''}`}>
            {tab === 'source' ? <pre className="source-view"><code>{content || '这里会显示文件内容…'}</code></pre> : rendered || <div className="empty-state"><span className="empty-icon"><Icon name="file" size={22}/></span><p>在左侧粘贴内容<br/>或上传一个文件开始</p></div>}
          </div>
          <div className="preview-footer"><div className="file-meta">{filename ? <><Icon name="file" size={13}/><span className="file-name">{filename}</span><span className="meta-separator">·</span></> : <><span className="local-dot"/><span>浏览器本地预览</span></>}<span className="meta-separator">·</span><span>{lineCount} 行</span></div><span className="preview-ready"><span/>已就绪</span></div>
        </section>
      </section>

      <section className="samples-section" inert={previewFullscreen}><div className="samples-label">或者，试试看</div><div className="sample-list"><button onClick={() => useSample('json')}><span className="sample-icon braces">{ }</span><span>JSON 示例</span><span className="sample-arrow">↗</span></button><button onClick={() => useSample('markdown')}><span className="sample-icon hash">#</span><span>Markdown 示例</span><span className="sample-arrow">↗</span></button><button onClick={() => useSample('toml')}><span className="sample-icon brackets">[ ]</span><span>TOML 示例</span><span className="sample-arrow">↗</span></button></div></section>
      <footer className="page-footer" inert={previewFullscreen}><span>为认真阅读而做。</span><span>一切内容，只在你的设备上。</span></footer>
    </main>
    {dragging && <div className="drop-overlay"><div className="drop-card"><Icon name="upload" size={27}/><strong>放下文件，即刻预览</strong><span>支持 JSON、Markdown、TOML 等多种格式</span></div></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
