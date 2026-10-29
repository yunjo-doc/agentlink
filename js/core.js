/* 공통: 언어(FR-01), 라우터, 레이아웃, UI 유틸 */
(function () {
  const LANG_KEY = 'al_lang';

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  AL.store = store;

  const savedLang = store(LANG_KEY);
  AL.lang = savedLang === 'ko' || savedLang === 'en' ? savedLang : ((navigator.language || 'ko').startsWith('ko') ? 'ko' : 'en');
  document.documentElement.lang = AL.lang;
  AL.setLang = function (lang) {
    AL.lang = lang;
    store(LANG_KEY, lang);
    document.documentElement.lang = lang;
    AL.render();
  };

  // T('한국어', 'English') / L({ko, en})
  AL.T = (ko, en) => (AL.lang === 'en' ? en : ko);
  AL.L = (v) => (v && typeof v === 'object' && !Array.isArray(v) && ('ko' in v) ? v[AL.lang] : v);

  AL.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  AL.statusBadge = (status, label) => `<span class="badge st-${status}">${AL.esc(label || AL.L(AL.STATUS[status]) || status)}</span>`;
  AL.chIcon = (ch, cls = '') => `<span class="ch-icon ${cls}" style="background:${ch.color}" aria-hidden="true">${ch.short}</span>`;
  AL.num = (n) => n.toLocaleString(AL.lang === 'en' ? 'en-US' : 'ko-KR');

  AL.code = (code, label) => `<div class="code">${label ? `<div class="code-label">${AL.esc(label)}</div>` : ''}<button class="copy-btn" data-copy="${AL.esc(code)}">${AL.T('복사', 'Copy')}</button><pre><code>${AL.esc(code)}</code></pre></div>`;
  AL.copyField = (val, label) => `<div class="copy-field"><code aria-label="${AL.esc(label || '')}">${AL.esc(val)}</code><button class="btn btn-secondary btn-sm" data-copy="${AL.esc(val)}">${AL.T('복사', 'Copy')}</button></div>`;

  // 서버 API 호출. 정적 호스팅(서버 없음)이면 status 0으로 돌려준다.
  AL.session = null;
  AL.apiOffline = false;
  AL.api = async function (method, url, body) {
    try {
      const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      if (!isJson) return { ok: false, status: 0, data: { error: 'offline' } };
      return { ok: res.ok, status: res.status, data: await res.json() };
    } catch (e) {
      return { ok: false, status: 0, data: { error: 'offline' } };
    }
  };

  AL.toast = function (msg) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  };

  // 모달: 접근성을 위해 포커스 이동, ESC 닫기, 닫힌 뒤 원래 위치로 포커스 복귀
  AL.modal = function ({ title, body, actions }) {
    const prev = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${title}</h2>${body}<div class="btn-row"></div></div>`;
    const row = wrap.querySelector('.btn-row');
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); prev && prev.focus && prev.focus(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    (actions || [{ label: AL.T('닫기', 'Close'), cls: 'btn-secondary' }]).forEach((a) => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.cls || 'btn-secondary');
      b.textContent = a.label;
      b.onclick = () => { if (a.onClick && a.onClick(wrap) === false) return; close(); };
      row.appendChild(b);
    });
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    (row.querySelector('.btn-primary') || row.querySelector('.btn')).focus();
    return { close, el: wrap };
  };

  /* ---------- Router ---------- */
  const routes = [];
  AL.route = (pattern, handler) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    routes.push({ re, keys, handler });
  };
  AL.go = (path) => { location.hash = '#' + path; };
  AL.current = () => {
    const raw = location.hash.slice(1) || '/';
    const [path, qs] = raw.split('?');
    return { path, query: new URLSearchParams(qs || '') };
  };

  // 페이지 전환 시 정리할 타이머 (데모 애니메이션, 발행 시뮬레이션)
  AL.timers = [];
  AL.later = (fn, ms) => { const id = setTimeout(fn, ms); AL.timers.push(id); return id; };

  AL.render = function () {
    AL.timers.forEach(clearTimeout);
    AL.timers = [];
    const { path, query } = AL.current();
    let page = null;
    for (const r of routes) {
      const m = path.match(r.re);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        page = r.handler(params, query);
        break;
      }
    }
    if (!page) page = AL.pages.notFound();
    document.title = page.title ? `${page.title} | agentlink` : 'agentlink';
    const desc = document.querySelector('meta[name="description"]');
    if (desc && page.description) desc.setAttribute('content', page.description);
    document.getElementById('app').innerHTML = (page.bare ? '' : header(path)) + `<main id="main" tabindex="-1">${page.html}</main>` + (page.bare || page.noFooter ? '' : footer());
    if (!page.bare) bindHeader();
    page.mount && page.mount();
    const hashTarget = query.get('s');
    if (hashTarget) document.getElementById(hashTarget)?.scrollIntoView();
    else window.scrollTo(0, 0);
  };

  window.addEventListener('hashchange', AL.render);

  // 전역 복사 버튼 처리
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const val = btn.getAttribute('data-copy');
    const done = () => AL.toast(AL.T('클립보드에 복사했습니다.', 'Copied to clipboard.'));
    if (navigator.clipboard) navigator.clipboard.writeText(val).then(done, done);
    else done();
  });

  /* ---------- Layout ---------- */
  function header(path) {
    const T = AL.T;
    const nav = [
      ['/integrations', T('에이전트 연결', 'Agents')],
      ['/channels', T('지원 채널', 'Channels')],
      ['/docs', T('문서', 'Docs')],
      ['/docs/api-posts', T('API 레퍼런스', 'API')],
      ['/compare', T('비교', 'Compare')],
      ['/blog', T('블로그', 'Blog')]
    ];
    const isActive = (p) => (p === '/docs' ? path.startsWith('/docs') && !path.startsWith('/docs/api') : path.startsWith(p.replace(/-posts$/, '')));
    const user = AL.session;
    return `
<a class="skip-link" href="#main" onclick="event.preventDefault();document.getElementById('main').focus()">${T('본문 바로가기', 'Skip to content')}</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="logo" href="#/" aria-label="agentlink ${T('홈', 'home')}"><span class="logo-mark">al</span>agentlink</a>
    <nav class="main-nav" id="main-nav" aria-label="${T('주요 메뉴', 'Main')}">
      ${nav.map(([href, label]) => `<a href="#${href}" class="${isActive(href) ? 'active' : ''}">${label}</a>`).join('')}
    </nav>
    <div class="header-actions">
      <div class="lang-switch" role="group" aria-label="${T('언어 선택', 'Language')}">
        <button data-lang="ko" aria-pressed="${AL.lang === 'ko'}">KO</button>
        <button data-lang="en" aria-pressed="${AL.lang === 'en'}">EN</button>
      </div>
      ${user && user.role === 'admin' ? `<a class="btn btn-ghost btn-sm" href="#/dashboard/admin">${T('관리자', 'Admin')}</a>` : ''}
      <a class="btn btn-ghost btn-sm" href="#/dashboard">${user ? T('대시보드', 'Dashboard') : T('로그인', 'Log in')}</a>
      <a class="btn btn-primary btn-sm" href="#/dashboard/mcp">${T('에이전트 연결', 'Connect agent')}</a>
      <button class="nav-toggle" aria-label="${T('메뉴 열기', 'Open menu')}" aria-expanded="false" aria-controls="main-nav">☰</button>
    </div>
  </div>
</header>`;
  }

  function bindHeader() {
    document.querySelectorAll('[data-lang]').forEach((b) => (b.onclick = () => AL.setLang(b.dataset.lang)));
    const tog = document.querySelector('.nav-toggle');
    if (tog) tog.onclick = () => {
      const nav = document.getElementById('main-nav');
      const open = nav.classList.toggle('open');
      tog.setAttribute('aria-expanded', open);
    };
  }

  function footer() {
    const T = AL.T;
    return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="logo" href="#/"><span class="logo-mark">al</span>agentlink</a>
        <p class="muted small" style="margin-top:12px;max-width:300px">${T('이미 쓰는 AI 에이전트를 소셜 계정에 연결하고, 말 한마디나 API 호출로 여러 채널에 발행하세요.', 'Connect the AI agent you already use to your social accounts and publish everywhere with one request or API call.')}</p>
      </div>
      <div><h4>${T('제품', 'Product')}</h4><ul>
        <li><a href="#/integrations">${T('에이전트 연결', 'Agents')}</a></li>
        <li><a href="#/channels">${T('지원 채널', 'Channels')}</a></li>
        <li><a href="#/compare">${T('비교', 'Compare')}</a></li>
        <li><a href="#/blog">${T('블로그', 'Blog')}</a></li>
      </ul></div>
      <div><h4>${T('문서', 'Docs')}</h4><ul>
        <li><a href="#/docs">${T('MCP 연결', 'MCP connection')}</a></li>
        <li><a href="#/docs/quickstart">Quickstart</a></li>
        <li><a href="#/docs/auth">${T('인증', 'Authentication')}</a></li>
        <li><a href="#/docs/api-posts">${T('API 레퍼런스', 'API reference')}</a></li>
        <li><a href="#/docs/errors">${T('오류 코드', 'Errors')}</a></li>
      </ul></div>
      <div><h4>${T('채널별 안내', 'Channel guides')}</h4><ul>
        ${AL.CHANNELS.map((c) => `<li><a href="#/docs/${c.id}">${c.name}</a></li>`).join('')}
      </ul></div>
      <div><h4>${T('신뢰/법무', 'Trust & legal')}</h4><ul>
        <li><a href="#/legal/privacy">${T('개인정보 처리방침', 'Privacy policy')}</a></li>
        <li><a href="#/legal/terms">${T('이용약관', 'Terms of service')}</a></li>
        <li><a href="#/legal/data-deletion">${T('데이터 삭제', 'Data deletion')}</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 agentlink</span>
      <span>${T('한국어 / English', 'English / 한국어')}</span>
    </div>
  </div>
</footer>`;
  }

  AL.pages = AL.pages || {};
})();
