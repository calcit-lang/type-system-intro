'use client';

import { Children, useEffect, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { chapterByMarkdownFile, chapterGroups, chapters } from './content';
import { glossaryAliasToId, glossaryById, glossaryEntries, glossaryPattern } from './glossary';

function chapterFromHash() {
  if (typeof window === 'undefined') return chapters[0].id;
  const id = window.location.hash.replace(/^#\/?/, '');
  return chapters.some(chapter => chapter.id === id) ? id : chapters[0].id;
}

function decorateGlossary(children: ReactNode, onOpen: (id: string) => void) {
  return Children.map(children, child => {
    if (typeof child !== 'string') return child;
    return child.split(glossaryPattern).map((part, index) => {
      const id = glossaryAliasToId.get(part.toLocaleLowerCase('zh-CN'));
      if (!id) return part;
      return <button key={`${id}-${index}`} className="term-link" type="button" onClick={() => onOpen(id)}>{part}</button>;
    });
  });
}

export default function Home() {
  const [selectedId, setSelectedId] = useState(chapters[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [glossaryState, setGlossaryState] = useState<string | null>(null);
  const [glossaryQuery, setGlossaryQuery] = useState('');

  useEffect(() => {
    const syncHash = () => setSelectedId(chapterFromHash());
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGlossaryState(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const index = chapters.findIndex(chapter => chapter.id === selectedId);
  const chapter = chapters[index] ?? chapters[0];
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  const progress = ((index + 1) / chapters.length) * 100;
  const activeGlossary = glossaryState && glossaryState !== 'index' ? glossaryById.get(glossaryState) : undefined;
  const normalizedQuery = glossaryQuery.trim().toLocaleLowerCase('zh-CN');
  const filteredGlossary = normalizedQuery
    ? glossaryEntries.filter(entry => `${entry.term} ${entry.english} ${entry.aliases.join(' ')}`.toLocaleLowerCase('zh-CN').includes(normalizedQuery))
    : glossaryEntries;

  const navigate = (id: string) => {
    window.location.hash = `/${id}`;
    setSelectedId(id);
    setMenuOpen(false);
    setGlossaryState(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const openGlossary = (id: string) => {
    setGlossaryQuery('');
    setGlossaryState(id);
  };

  const markdownComponents = {
    a: ({ node: _node, href = '', children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) => {
      const file = href.split('#')[0].split('/').pop() ?? '';
      const internalId = chapterByMarkdownFile.get(file);
      if (internalId) {
        return <a href={`#/${internalId}`} onClick={(event) => { event.preventDefault(); navigate(internalId); }} {...props}>{children}</a>;
      }
      return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} {...props}>{children}</a>;
    },
    p: ({ node: _node, children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { node?: unknown }) => <p {...props}>{decorateGlossary(children, openGlossary)}</p>,
    li: ({ node: _node, children, ...props }: React.LiHTMLAttributes<HTMLLIElement> & { node?: unknown }) => <li {...props}>{decorateGlossary(children, openGlossary)}</li>,
    td: ({ node: _node, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { node?: unknown }) => <td {...props}>{decorateGlossary(children, openGlossary)}</td>,
  };

  return <main className="textbook-shell">
    <aside className={`course-sidebar ${menuOpen ? 'open' : ''}`}>
      <button className="brand" onClick={() => navigate(chapters[0].id)}>
        <span className="brand-mark">T/S</span>
        <span><b>TYPE / SYSTEM</b><small>给普通程序员的类型系统导论</small></span>
      </button>
      <div className="sidebar-intro">
        <span>INTERACTIVE TEXTBOOK · V0.3</span>
        <p>先把公式读成人话，再把规则写成代码。</p>
      </div>
      <nav aria-label="课程章节">
        {chapterGroups.map(group => <section key={group.label}>
          <h2>{group.label}</h2>
          {group.chapters.map(item => <button key={item.id} className={item.id === chapter.id ? 'active' : ''} onClick={() => navigate(item.id)}>
            <span>{item.number}</span><b>{item.title}</b><i>{item.minutes}′</i>
          </button>)}
        </section>)}
      </nav>
      <div className="sidebar-progress"><span><b>{index + 1}</b> / {chapters.length}</span><div><i style={{ width: `${progress}%` }} /></div></div>
    </aside>

    {menuOpen && <button className="sidebar-scrim" aria-label="关闭目录" onClick={() => setMenuOpen(false)} />}

    <section className="textbook-main">
      <header className="textbook-topbar">
        <button className="menu-button" aria-label="打开目录" onClick={() => setMenuOpen(true)}>☰</button>
        <div><span className="signal-dot" /><b>{chapter.eyebrow}</b><span className="crumb">{chapter.number} · {chapter.title}</span></div>
        <div className="topbar-actions"><span className="reading-time">约 {chapter.minutes} 分钟</span><button className="glossary-button" onClick={() => { setGlossaryQuery(''); setGlossaryState('index'); }}>术语解释</button></div>
      </header>

      <div className="reader-scroll">
        <article className="lesson-page">
          <header className="lesson-header">
            <div className="lesson-meta"><span>{chapter.number}</span><span>{chapter.eyebrow}</span><span>{chapter.minutes} MIN</span></div>
            <div className="formula-orbit" aria-hidden="true"><span>Γ</span><span>⊢</span><span>τ</span><i>∀α</i></div>
          </header>

          <section className="chapter-guide" aria-label="本章学习指南">
            <div className={`chapter-level level-${chapter.level}`}><span>难度</span><b>{chapter.level}</b></div>
            <div><span>开始前应该会</span><ul>{chapter.prerequisites.map(item => <li key={item}>{item}</li>)}</ul></div>
            <div><span>学完能够</span><ul>{chapter.goals.map(item => <li key={item}>{item}</li>)}</ul></div>
          </section>

          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
              {chapter.content}
            </ReactMarkdown>
          </div>

          <nav className="lesson-pagination" aria-label="前后章节">
            {previous ? <button onClick={() => navigate(previous.id)}><span>← 上一章</span><b>{previous.number} {previous.title}</b></button> : <span />}
            {next ? <button onClick={() => navigate(next.id)}><span>下一章 →</span><b>{next.number} {next.title}</b></button> : <span />}
          </nav>
        </article>
      </div>
    </section>

    {glossaryState && <>
      <button className="glossary-scrim" aria-label="关闭术语解释" onClick={() => setGlossaryState(null)} />
      <aside className="glossary-drawer" role="dialog" aria-modal="true" aria-label="术语解释">
        <header>
          <div><span>CONCEPT SIDEBAR</span><b>{activeGlossary ? '术语解释' : '术语索引'}</b></div>
          <button aria-label="关闭术语解释" onClick={() => setGlossaryState(null)}>×</button>
        </header>

        {activeGlossary ? <div className="glossary-detail">
          <button className="glossary-back" onClick={() => setGlossaryState('index')}>← 查看全部术语</button>
          <span className="glossary-english">{activeGlossary.english}</span>
          <h2>{activeGlossary.term}</h2>
          <p className="glossary-summary">{activeGlossary.summary}</p>
          <section><span>从代码理解</span><p>{activeGlossary.codeBridge}</p></section>
          <section className="glossary-caution"><span>容易混淆</span><p>{activeGlossary.caution}</p></section>
          <section className="glossary-related"><span>相关章节</span><div>{activeGlossary.related.map(id => {
            const relatedChapter = chapters.find(item => item.id === id);
            return relatedChapter ? <button key={id} onClick={() => navigate(id)}><i>{relatedChapter.number}</i>{relatedChapter.title}<b>→</b></button> : null;
          })}</div></section>
        </div> : <div className="glossary-index">
          <p>正文中带虚线的关键词都可以点击。解释会留在这里，不打断当前章节的主线。</p>
          <label><span>搜索术语</span><input value={glossaryQuery} onChange={event => setGlossaryQuery(event.target.value)} placeholder="例如：合一、主类型、System F" autoFocus /></label>
          <div className="glossary-list">{filteredGlossary.map(entry => <button key={entry.id} onClick={() => openGlossary(entry.id)}><span>{entry.term}</span><small>{entry.english}</small><i>→</i></button>)}</div>
          {filteredGlossary.length === 0 && <p className="glossary-empty">没有匹配项。可以尝试中文术语或英文名称。</p>}
        </div>}
      </aside>
    </>}
  </main>;
}
