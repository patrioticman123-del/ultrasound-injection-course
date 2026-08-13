"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const FONT_SCALES = [0.9, 1, 1.15, 1.3, 1.45];
const AUTHOR_MODES = [
  { id: "techniques", label: "技術單元" },
  { id: "bibliography", label: "本人署名文獻" },
];

function normalizeText(value) {
  return String(value || "").toLocaleLowerCase("zh-Hant");
}

function formatDuration(seconds) {
  if (!seconds) return "未標示";
  const total = Math.floor(Number(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours ? `${hours} 小時 ${minutes} 分` : `${minutes} 分鐘`;
}

function youtubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return match?.[1] || null;
}

function vimeoId(url) {
  return url?.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] || null;
}

function InlineMedia({ provider, videoUrl, embedUrl, start = 0, title, onLoaded }) {
  const ytId = provider === "youtube" ? youtubeId(videoUrl) || embedUrl?.split("/").pop() : youtubeId(videoUrl);
  const vmId = provider === "vimeo" ? vimeoId(videoUrl) || embedUrl?.split("/").pop() : vimeoId(videoUrl);

  if (ytId) {
    const src = `https://www.youtube-nocookie.com/embed/${ytId}?start=${Math.floor(start)}&rel=0&playsinline=1${start ? "&autoplay=1" : ""}`;
    return (
      <div className="video-frame">
        <iframe key={`${ytId}-${start}`} src={src} title={title || "YouTube 影片"} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen onLoad={onLoaded} />
      </div>
    );
  }

  if (vmId) {
    const src = `https://player.vimeo.com/video/${vmId}#t=${Math.floor(start)}s`;
    return (
      <div className="video-frame">
        <iframe key={`${vmId}-${start}`} src={src} title={title || "Vimeo 影片"} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen onLoad={onLoaded} />
      </div>
    );
  }

  if (provider === "progressive-mp4" && embedUrl) {
    return <video key={`${embedUrl}-${start}`} className="native-video" controls preload="metadata" src={`${embedUrl}#t=${Math.floor(start)}`} onLoadedData={onLoaded} />;
  }

  return (
    <div className="video-unavailable">
      <strong>此來源無法直接嵌入</strong>
      <span>筆記與時間軸已離線保存；原始影片請由來源頁開啟。</span>
    </div>
  );
}

function SegmentList({ segments, onPlay }) {
  return (
    <div className="segments">
      {segments.map((segment, index) => (
        <details className="segment-card" key={`${segment.id || segment.title}-${index}`}>
          <summary>
            <span className="segment-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="segment-title"><small>{segment.timeLabel}</small><strong>{segment.title}</strong></span>
            <span className="segment-open">＋</span>
          </summary>
          <div className="segment-content">
            {onPlay && <button className="play-segment" onClick={() => onPlay(segment.startSeconds || 0)}>▶ 在上方播放器播放本段</button>}
            {segment.summary?.length > 0 && <InfoList title="速讀摘要" items={segment.summary} />}
            {segment.details?.length > 0 && <InfoList title="完整詳解" items={segment.details} />}
            {segment.tags?.length > 0 && <div className="chips">{segment.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
            {segment.verification && <p className="verification">核對註記：{segment.verification}</p>}
          </div>
        </details>
      ))}
    </div>
  );
}

function InfoList({ title, items }) {
  const values = Array.isArray(items) ? items : items ? [items] : [];
  if (!values.length) return null;
  return <section className="info-list"><h4>{title}</h4><ul>{values.map((item, index) => <li key={index}>{item}</li>)}</ul></section>;
}

function MediaCard({ media, onPlayTimeline }) {
  const href = media.url || media.href || media.sourceUrl;
  const yt = youtubeId(href);
  const vm = vimeoId(href);
  const timeline = media.timeline;
  return (
    <article className="media-card">
      {(media.localImage || media.imageUrl) && <img src={media.localImage || media.imageUrl} alt={media.alt || media.caption || media.title || "引用圖版"} loading="lazy" />}
      <div className="media-copy">
        <span className="media-badge">{media.badge || (media.kind === "figure" ? "原文圖版" : "原文／作者影片")}</span>
        <h4>{media.title || media.caption}</h4>
        {media.note && <p>{media.note}</p>}
        {media.credit && <small>{media.credit}</small>}
        {media.license && <small>{media.license}</small>}
        {href && <a href={href} target="_blank" rel="noreferrer">開啟原始來源 ↗</a>}
      </div>
      {(yt || vm) && <InlineMedia provider={yt ? "youtube" : "vimeo"} videoUrl={href} title={media.title || media.caption} />}
      {timeline?.segments?.length > 0 && (
        <div className="media-timeline">
          <h4>作者影片逐段筆記</h4>
          <SegmentList segments={timeline.segments} onPlay={(seconds) => onPlayTimeline?.(timeline, seconds)} />
        </div>
      )}
    </article>
  );
}

function PublicDetail({ course }) {
  const [start, setStart] = useState(0);
  const playerRef = useRef(null);

  useEffect(() => setStart(0), [course?.id]);
  if (!course) return <div className="empty">請選擇一篇課程。</div>;

  function playAt(seconds) {
    setStart(Number(seconds) || 0);
    requestAnimationFrame(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  return (
    <article className="reader article-reader">
      <div className="detail-kicker"><span>公開課程 {String(course.order).padStart(3, "0")} / 109</span><span>{course.id}</span></div>
      <h1>{course.title}</h1>
      {course.sourceTitle && <p className="original-title">原始標題：{course.sourceTitle}</p>}
      <div className="meta-grid">
        <div><small>來源</small><strong>{course.source}</strong></div>
        <div><small>講者／頻道</small><strong>{course.presenter || "未標示"}</strong></div>
        <div><small>日期</small><strong>{course.date || "未標示"}</strong></div>
        <div><small>長度</small><strong>{formatDuration(course.durationSeconds)}</strong></div>
      </div>
      <div ref={playerRef}>
        <InlineMedia provider={course.provider} videoUrl={course.videoUrl} embedUrl={course.embedUrl} start={start} title={course.title} />
      </div>
      <div className="source-actions">
        {course.videoUrl && <a className="source-link" href={course.videoUrl} target="_blank" rel="noreferrer">原始影片來源 ↗</a>}
        <span>時間軸按鈕會留在本頁播放器內播放。</span>
      </div>
      {course.sourceNote && <p className="source-note">{course.sourceNote}</p>}
      <div className="chips">{[...(course.regions || []), ...(course.techniques || [])].filter(Boolean).map((item) => <span key={item}>{item}</span>)}</div>
      <div className="section-heading"><div><small>TIMELINE</small><h2>完整影片時間軸</h2></div><strong>{course.segments.length} 段</strong></div>
      <SegmentList segments={course.segments} onPlay={course.embedUrl || course.provider === "youtube" || course.provider === "vimeo" ? playAt : null} />
    </article>
  );
}

function TechniqueDetail({ technique }) {
  const [activeTimeline, setActiveTimeline] = useState(null);
  const [start, setStart] = useState(0);
  if (!technique) return <div className="empty">請選擇一個技術單元。</div>;

  function playTimeline(timeline, seconds) {
    setActiveTimeline(timeline);
    setStart(seconds);
    requestAnimationFrame(() => document.querySelector(".author-player")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  return (
    <article className="reader article-reader">
      <div className="detail-kicker"><span>技術單元</span><span>{technique.year} · {technique.region}</span></div>
      <h1>{technique.title}</h1>
      <p className="original-title">主論文：<a href={technique.sourceUrl} target="_blank" rel="noreferrer">{technique.paperTitle} ↗</a></p>
      <div className="meta-grid three">
        <div><small>年份</small><strong>{technique.year}</strong></div>
        <div><small>區域</small><strong>{technique.region}</strong></div>
        <div><small>研究設計</small><strong>{technique.design}</strong></div>
      </div>
      {activeTimeline && <div className="author-player"><InlineMedia provider={activeTimeline.provider} videoUrl={activeTimeline.videoUrl} embedUrl={activeTimeline.embedUrl} start={start} title={technique.title} /></div>}
      <div className="technique-sections">
        <InfoList title="解剖定位" items={technique.anatomy} />
        <InfoList title="掃描方法" items={technique.scan} />
        <InfoList title="動態評估" items={technique.dynamic} />
        <InfoList title="介入技術" items={technique.intervention} />
        {technique.injectate && <InfoList title="注射物與參數" items={[technique.injectate]} />}
        <InfoList title="影像終點" items={technique.endpoint} />
        {technique.evidenceBoundary && <InfoList title="證據界線" items={[technique.evidenceBoundary]} />}
      </div>
      <div className="chips">{technique.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
      {technique.media?.length > 0 && <><div className="section-heading"><div><small>FIGURES & MEDIA</small><h2>原文圖版與影片</h2></div><strong>{technique.media.length} 項</strong></div><div className="media-grid">{technique.media.map((media, index) => <MediaCard key={`${media.contentId || media.title}-${index}`} media={media} onPlayTimeline={playTimeline} />)}</div></>}
    </article>
  );
}

function BibliographyDetail({ paper }) {
  if (!paper) return <div className="empty">請選擇一篇本人署名文獻。</div>;
  return (
    <article className="reader article-reader">
      <div className="detail-kicker"><span>本人署名文獻</span><span>{paper.year} · {paper.region}</span></div>
      <h1 className="paper-heading">{paper.title}</h1>
      <div className="meta-grid three">
        <div><small>年份</small><strong>{paper.year}</strong></div>
        <div><small>區域</small><strong>{paper.region}</strong></div>
        <div><small>類型</small><strong>{paper.type}</strong></div>
      </div>
      <a className="paper-link" href={paper.url} target="_blank" rel="noreferrer">開啟原始論文 ↗</a>
      {paper.note && <div className="paper-note"><h3>原站編輯筆記</h3><p>{paper.note}</p></div>}
      {paper.media && <><div className="section-heading"><div><small>CITED MEDIA</small><h2>引用圖版／影片</h2></div></div><MediaCard media={paper.media} /></>}
    </article>
  );
}

function AuthorDetail({ author, mode, selected }) {
  return (
    <>
      <div className="author-banner reader">
        <span>AUTHOR ARCHIVE</span>
        <h2>{author.name}</h2>
        <p>{author.alias}</p>
        <p>{author.editorial}</p>
      </div>
      {mode === "techniques" ? <TechniqueDetail technique={selected} /> : <BibliographyDetail paper={selected} />}
    </>
  );
}

function PublicList({ courses, selectedId, onSelect }) {
  return <div className="entry-list">{courses.map((course) => <button key={course.id} className={selectedId === course.id ? "selected" : ""} onClick={() => onSelect(course.id)}><small>{String(course.order).padStart(3, "0")} · {course.source}</small><strong>{course.title}</strong><span>{course.region || "未分類"} · {course.segments.length} 段</span></button>)}</div>;
}

function AuthorList({ items, mode, selectedIndex, onSelect }) {
  return <div className="entry-list">{items.map((item, index) => <button key={`${item.id || item.url}-${index}`} className={selectedIndex === index ? "selected" : ""} onClick={() => onSelect(index)}><small>{String(index + 1).padStart(2, "0")} · {item.year} · {item.region}</small><strong>{mode === "techniques" ? item.title : item.title}</strong><span>{mode === "techniques" ? item.design : item.type}</span></button>)}</div>;
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [section, setSection] = useState("public");
  const [authorMode, setAuthorMode] = useState("techniques");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("全部");
  const [publicId, setPublicId] = useState(null);
  const [authorIndex, setAuthorIndex] = useState(0);
  const [fontIndex, setFontIndex] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const saved = Number(localStorage.getItem("echo-font-index"));
    if (Number.isInteger(saved) && saved >= 0 && saved < FONT_SCALES.length) setFontIndex(saved);
    setOnline(navigator.onLine);
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    const installHandler = (event) => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    window.addEventListener("beforeinstallprompt", installHandler);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    fetch("/archive-data.json")
      .then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then((payload) => { setData(payload); setPublicId(payload.publicCourses[0]?.id); })
      .catch((reason) => setError(reason.message || "資料讀取失敗"));
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
      window.removeEventListener("beforeinstallprompt", installHandler);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--reader-scale", FONT_SCALES[fontIndex]);
    localStorage.setItem("echo-font-index", String(fontIndex));
  }, [fontIndex]);

  const activeAuthor = section.startsWith("author-") ? data?.authors[Number(section.split("-")[1])] : null;
  const items = activeAuthor?.[authorMode] || [];
  const regions = useMemo(() => {
    const values = section === "public" ? data?.publicCourses.flatMap((course) => course.regions || [course.region]) : items.map((item) => item.region);
    return ["全部", ...Array.from(new Set((values || []).filter(Boolean)))];
  }, [data, section, items]);

  const filteredPublic = useMemo(() => {
    if (!data) return [];
    const needle = normalizeText(query.trim());
    return data.publicCourses.filter((course) => {
      const regionMatch = region === "全部" || course.regions?.includes(region) || course.region === region;
      return regionMatch && (!needle || normalizeText(JSON.stringify(course)).includes(needle));
    });
  }, [data, query, region]);

  const filteredAuthorItems = useMemo(() => {
    const needle = normalizeText(query.trim());
    return items.map((item, originalIndex) => ({ item, originalIndex })).filter(({ item }) => (region === "全部" || item.region === region) && (!needle || normalizeText(JSON.stringify(item)).includes(needle)));
  }, [items, query, region]);

  const selectedCourse = data?.publicCourses.find((course) => course.id === publicId) || filteredPublic[0];
  const selectedAuthorItem = items[authorIndex] || filteredAuthorItems[0]?.item;

  function changeSection(next) {
    setSection(next); setQuery(""); setRegion("全部"); setAuthorIndex(0); setDrawerOpen(true);
  }

  function changeAuthorMode(next) {
    setAuthorMode(next); setQuery(""); setRegion("全部"); setAuthorIndex(0);
  }

  function choosePublic(id) { setPublicId(id); setDrawerOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function chooseAuthor(index) { setAuthorIndex(index); setDrawerOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function installApp() {
    if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); return; }
    alert("iPhone／iPad：在 Safari 點『分享』→『加入主畫面』。\nAndroid：在 Chrome 選單點『安裝應用程式』或『加到主畫面』。");
  }

  if (error) return <main className="loading"><strong>資料讀取失敗</strong><span>{error}</span></main>;
  if (!data) return <main className="loading"><div className="spinner" /><span>正在載入完整課程庫…</span></main>;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="logo"><span>US</span><div><strong>超音波導引注射課程</strong><small>離線臨床筆記庫</small></div></div>
        <div className="top-actions">
          <span className={`status ${online ? "online" : "offline"}`}>{online ? "已連線" : "離線閱讀"}</span>
          <div className="font-controls" aria-label="文字大小"><button onClick={() => setFontIndex((value) => Math.max(0, value - 1))} aria-label="縮小文字">A−</button><span>{Math.round(FONT_SCALES[fontIndex] * 100)}%</span><button onClick={() => setFontIndex((value) => Math.min(FONT_SCALES.length - 1, value + 1))} aria-label="放大文字">A＋</button></div>
          <button className="install" onClick={installApp}>安裝 App</button>
        </div>
      </header>

      <section className="hero">
        <div><small>ULTRASOUND · INTERVENTION · CLINICAL NOTES</small><h1>超音波導引<br />注射課程</h1><p>完整保存公開課程、作者技術、論文連結、原文圖版與逐段筆記。</p></div>
        <div className="stats"><div><strong>{data.stats.publicCourses}</strong><span>公開課程</span></div><div><strong>29 / 29</strong><span>兩位作者文獻</span></div><div><strong>{data.stats.authorTechniques}</strong><span>作者技術單元</span></div></div>
      </section>

      <nav className="section-tabs" aria-label="資料分類">
        <button className={section === "public" ? "active" : ""} onClick={() => changeSection("public")}><strong>公開課程</strong><span>109 筆</span></button>
        {data.authors.map((author, index) => <button key={author.id} className={section === `author-${index}` ? "active" : ""} onClick={() => changeSection(`author-${index}`)}><strong>{author.name}</strong><span>9 技術 · 29 文獻</span></button>)}
      </nav>

      <button className="mobile-drawer-toggle" onClick={() => setDrawerOpen((value) => !value)}>{drawerOpen ? "關閉清單" : "選擇內容與搜尋"}</button>

      <section className="workspace">
        <aside className={`sidebar ${drawerOpen ? "open" : ""}`}>
          {activeAuthor && <div className="author-mode-tabs">{AUTHOR_MODES.map((mode) => <button key={mode.id} className={authorMode === mode.id ? "active" : ""} onClick={() => changeAuthorMode(mode.id)}>{mode.label}<span>{activeAuthor[mode.id].length}</span></button>)}</div>}
          <label className="search-label" htmlFor="library-search">全文搜尋</label>
          <input id="library-search" className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋標題、解剖、技術、講者…" />
          <div className="region-filters">{regions.map((item) => <button key={item} className={region === item ? "active" : ""} onClick={() => setRegion(item)}>{item}</button>)}</div>
          <p className="result-count">目前顯示 {section === "public" ? filteredPublic.length : filteredAuthorItems.length} 筆</p>
          {section === "public" ? <PublicList courses={filteredPublic} selectedId={selectedCourse?.id} onSelect={choosePublic} /> : <AuthorList items={filteredAuthorItems.map(({ item }) => item)} mode={authorMode} selectedIndex={filteredAuthorItems.findIndex(({ originalIndex }) => originalIndex === authorIndex)} onSelect={(filteredIndex) => chooseAuthor(filteredAuthorItems[filteredIndex].originalIndex)} />}
        </aside>
        <section className="content">
          {section === "public" ? <PublicDetail course={selectedCourse} /> : <AuthorDetail author={activeAuthor} mode={authorMode} selected={selectedAuthorItem} />}
        </section>
      </section>

      <footer><p>{data.archive.notice}</p><a href={data.archive.sourceUrl} target="_blank" rel="noreferrer">原始公開網站 ↗</a></footer>
    </main>
  );
}
