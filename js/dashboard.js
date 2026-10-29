/*
 * 로그인 + 대시보드 프로토타입
 * 서버가 없으므로 상태는 브라우저 localStorage에 저장하고, OAuth·플랫폼 호출은 시뮬레이션한다.
 */
(function () {
  const { T, L, esc } = AL;
  const KEY = 'al_state';

  const empty = () => ({ user: null, workspace: 'My workspace', mcpClients: [], accounts: [], posts: [], apiKeys: [] });
  let cache = null;
  AL.state = function () {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(KEY)) || empty(); } catch (e) { cache = empty(); }
    return cache;
  };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* 저장 불가 환경에서는 메모리 상태만 유지 */ } }
  const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 8);
  const fmtTime = (iso) => new Date(iso).toLocaleString(AL.lang === 'en' ? 'en-US' : 'ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  /* ---------- 로그인 ---------- */
  AL.pages.login = function (_, query) {
    const next = query.get('next') || '/dashboard';
    return {
      title: T('로그인', 'Log in'),
      noFooter: true,
      html: `
<div class="auth-wrap"><div class="card auth-card">
  <h1 style="font-size:1.5rem">${T('agentlink에 로그인', 'Log in to agentlink')}</h1>
  <p class="muted small">${T('계정이 없으면 자동으로 가입됩니다. 로그인 후 요청한 화면으로 돌아갑니다.', 'New here? An account is created automatically. You will return to where you were.')}</p>
  <button class="btn btn-secondary" data-provider="Google">G&nbsp; ${T('Google로 계속하기', 'Continue with Google')}</button>
  <button class="btn btn-secondary" data-provider="GitHub">⌥&nbsp; ${T('GitHub로 계속하기', 'Continue with GitHub')}</button>
  <div class="divider">${T('또는', 'or')}</div>
  <form id="email-form">
    <div class="field"><label for="email">${T('이메일', 'Email')}</label><input id="email" type="email" required placeholder="you@example.com" autocomplete="email"></div>
    <button class="btn btn-primary" type="submit">${T('이메일로 로그인 링크 받기', 'Email me a login link')}</button>
  </form>
  <p class="small muted" style="margin-top:12px">${T('계속하면', 'By continuing you agree to the')} <a href="#/legal/terms">${T('이용약관', 'Terms')}</a>${T('과', ' and')} <a href="#/legal/privacy">${T('개인정보 처리방침', 'Privacy policy')}</a>${T('에 동의합니다.', '.')}</p>
</div></div>`,
      mount() {
        const done = (provider, email) => {
          const s = AL.state();
          s.user = { provider, email: email || (provider.toLowerCase() + '.user@example.com') };
          save();
          AL.go(next.startsWith('/') ? next : '/dashboard');
        };
        document.querySelectorAll('[data-provider]').forEach((b) => (b.onclick = () => done(b.dataset.provider)));
        document.getElementById('email-form').onsubmit = (e) => { e.preventDefault(); done('Email', document.getElementById('email').value); };
      }
    };
  };

  /* ---------- 대시보드 ---------- */
  const TABS = () => [
    ['overview', '◧', T('개요', 'Overview')],
    ['publish', '✎', T('발행', 'Publish')],
    ['history', '☰', T('발행 기록', 'History')],
    ['accounts', '⚭', T('소셜 계정', 'Social accounts')],
    ['mcp', '⌬', T('MCP 연결', 'MCP')],
    ['keys', '⚿', T('API 키', 'API keys')],
    ['settings', '⚙', T('설정', 'Settings')]
  ];

  AL.pages.dashboard = function ({ tab }) {
    tab = tab || 'overview';
    const s = AL.state();
    if (!s.user) {
      location.replace('#/login?next=' + encodeURIComponent('/dashboard' + (tab !== 'overview' ? '/' + tab : '')));
      return { html: '' };
    }
    const view = VIEWS[tab];
    if (!view) return AL.pages.notFound();
    const v = view(s);
    return {
      title: v.title + ' · ' + T('대시보드', 'Dashboard'),
      noFooter: true,
      html: `
<div class="dash">
  <aside class="dash-side">
    <div class="ws"><strong>${esc(s.workspace)}</strong><small>${esc(s.user.email)}</small></div>
    <nav aria-label="${T('대시보드 메뉴', 'Dashboard')}">
      ${TABS().map(([id, ic, label]) => `<a href="#/dashboard${id === 'overview' ? '' : '/' + id}" class="${id === tab ? 'active' : ''}" ${id === tab ? 'aria-current="page"' : ''}><span aria-hidden="true">${ic}</span>${label}</a>`).join('')}
    </nav>
  </aside>
  <div class="dash-main">
    <header><div><h1>${v.title}</h1>${v.sub ? `<p>${v.sub}</p>` : ''}</div>${v.actions || ''}</header>
    ${v.html}
  </div>
</div>`,
      mount: v.mount
    };
  };

  /* ----- 공통: 상태 계산과 결과 렌더링 ----- */
  function overall(post) {
    const st = post.results.map((r) => r.status);
    if (st.some((x) => x === 'retrying')) return 'retrying';
    if (st.some((x) => x === 'publishing' || x === 'queued')) return 'publishing';
    if (st.every((x) => x === 'success')) return 'success';
    if (st.every((x) => x === 'failed')) return 'failed';
    return 'partial';
  }
  const OVERALL_LABEL = {
    publishing: { ko: '발행 중', en: 'Publishing' }, retrying: { ko: '재시도 중', en: 'Retrying' },
    success: { ko: '성공', en: 'Success' }, partial: { ko: '부분 성공', en: 'Partial' }, failed: { ko: '최종 실패', en: 'Failed' }
  };
  const RESULT_LABEL = {
    queued: { ko: '대기', en: 'Queued' }, publishing: { ko: '발행 중', en: 'Publishing' }, retrying: { ko: '재시도 중', en: 'Retrying' },
    success: { ko: '게시됨', en: 'Posted' }, failed: { ko: '실패', en: 'Failed' }
  };
  const overallBadge = (p) => AL.statusBadge(overall(p), L(OVERALL_LABEL[overall(p)]));

  function resultsHtml(post) {
    const st = overall(post);
    const retryable = post.results.filter((r) => r.status === 'failed' && r.error && AL.findError(r.error.code).retry);
    const ok = post.results.filter((r) => r.status === 'success').length;
    return `
<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px">
  <div>${overallBadge(post)} <span class="small muted">${T(`${post.results.length}개 중 ${ok}개 게시`, `${ok} of ${post.results.length} posted`)}</span></div>
  ${retryable.length && st !== 'retrying' ? `<button class="btn btn-primary btn-sm" data-retry="${post.id}">↻ ${T(`실패한 ${retryable.length}개 채널만 재시도`, `Retry ${retryable.length} failed`)}</button>` : ''}
</div>
${post.results.map((r) => {
  const ch = AL.findChannel(r.channel);
  const e = r.error && AL.findError(r.error.code);
  return `<div class="result-row">${AL.chIcon(ch)}<div class="grow"><strong>${ch.name}</strong> <span class="small muted">${esc(r.handle)}</span>
    ${r.status === 'success' ? `<div class="sub">${esc(r.url)}</div>` : ''}
    ${e && r.status === 'failed' ? `<div class="err-text"><code>${e.code}</code> · ${L(e.desc)}${r.error.detail ? ` (${esc(r.error.detail)})` : ''}<br>${e.retry ? T('재시도 가능', 'Retryable') : T('재시도 불가', 'Not retryable')} — ${L(e.fix)}${e.code === 'token_expired' ? ` <a href="#/dashboard/accounts">${T('재인증하기', 'Re-authenticate')}</a>` : ''}</div>` : ''}
  </div>${AL.statusBadge(r.status, L(RESULT_LABEL[r.status]))}</div>`;
}).join('')}`;
  }

  function refreshPostViews(post) {
    document.querySelectorAll(`[data-post="${post.id}"]`).forEach((el) => { el.innerHTML = resultsHtml(post); });
    document.querySelectorAll(`[data-post-badge="${post.id}"]`).forEach((el) => { el.innerHTML = overallBadge(post); });
  }

  // 전역 재시도 버튼 (발행 화면, 발행 기록 공통)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-retry]');
    if (b) retryPost(b.dataset.retry);
  });

  /* ----- 발행 시뮬레이션 (FR-06, FR-07) ----- */
  function simulate(post, forceFail) {
    const s = AL.state();
    post.results.forEach((r, i) => {
      if (r.status !== 'queued') return;
      setTimeout(() => { r.status = 'publishing'; save(); refreshPostViews(post); }, 300 + i * 150);
      setTimeout(() => {
        const acc = s.accounts.find((a) => a.id === r.accountId);
        if (acc && acc.status === 'reauth') {
          r.status = 'failed'; r.error = { code: 'token_expired' };
        } else if ((forceFail && i === post.results.length - 1) || Math.random() < 0.08) {
          const pool = post.media.length ? ['rate_limited', 'platform_unavailable', 'media_processing_failed'] : ['rate_limited', 'platform_unavailable'];
          r.status = 'failed';
          r.error = { code: forceFail && i === post.results.length - 1 ? 'rate_limited' : pool[Math.floor(Math.random() * pool.length)] };
        } else {
          r.status = 'success'; r.url = fakeUrl(r.channel, r.handle);
        }
        r.at = new Date().toISOString();
        save(); refreshPostViews(post);
      }, 1200 + i * 600);
    });
  }
  function fakeUrl(ch, handle) {
    const h = handle.replace('@', '');
    const id = Math.random().toString(36).slice(2, 9);
    return { threads: `threads.net/@${h}/post/${id}`, instagram: `instagram.com/p/${id}`, youtube: `youtu.be/${id}`, facebook: `facebook.com/${h}/posts/${id}`, telegram: `t.me/${h}/${Math.floor(Math.random() * 900 + 100)}`, naverblog: `blog.naver.com/${h}/${Date.now()}` }[ch];
  }
  function retryPost(id) {
    const s = AL.state();
    const post = s.posts.find((p) => p.id === id);
    if (!post) return;
    const targets = post.results.filter((r) => r.status === 'failed' && r.error && AL.findError(r.error.code).retry);
    targets.forEach((r) => { r.status = 'retrying'; r.attempts = (r.attempts || 1) + 1; });
    save(); refreshPostViews(post);
    targets.forEach((r, i) => setTimeout(() => {
      if (Math.random() < 0.9) { r.status = 'success'; r.error = null; r.url = fakeUrl(r.channel, r.handle); }
      else { r.status = 'failed'; }
      r.at = new Date().toISOString();
      save(); refreshPostViews(post);
    }, 1400 + i * 500));
  }

  /* ----- OAuth 승인 전 권한 요약 모달 (기획서 9장) ----- */
  function consentModal({ title, scopes, after, onAllow, allowLabel }) {
    AL.modal({
      title,
      body: `<p class="small muted">${T('승인하면 외부 브라우저(플랫폼) 승인 화면으로 이동합니다. 아래 내용을 먼저 확인하세요.', 'Approving opens the platform consent page. Review the details first.')}</p>
        <h3 style="font-size:.95rem">${T('요청 권한', 'Requested permissions')}</h3><ul>${scopes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3 style="font-size:.95rem">${T('연결 후 가능한 행동', 'After connecting you can')}</h3><ul>${after.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <div class="callout" style="margin:12px 0 0"><p class="small">${T('비밀번호는 agentlink에 저장되지 않으며, 언제든 연결을 해제하면 토큰이 즉시 폐기됩니다.', 'Passwords are never stored. Disconnect anytime to revoke tokens immediately.')}</p></div>`,
      actions: [
        { label: T('취소', 'Cancel'), cls: 'btn-secondary' },
        { label: allowLabel || T('승인하고 계속', 'Approve & continue'), cls: 'btn-primary', onClick: onAllow }
      ]
    });
  }

  function confirmModal(title, body, danger, onOk) {
    AL.modal({ title, body: `<p>${body}</p>`, actions: [{ label: T('취소', 'Cancel') }, { label: danger, cls: 'btn-danger', onClick: onOk }] });
  }

  /* ----- 화면들 ----- */
  const VIEWS = {
    overview(s) {
      const firstSuccess = s.posts.some((p) => p.results.some((r) => r.status === 'success'));
      const steps = [
        [s.accounts.length > 0, T('소셜 계정 연결', 'Connect a social account'), '#/dashboard/accounts'],
        [s.mcpClients.length > 0, T('AI 에이전트 연결 (MCP)', 'Connect an AI agent (MCP)'), '#/dashboard/mcp'],
        [firstSuccess, T('첫 게시물 발행', 'Publish your first post'), '#/dashboard/publish']
      ];
      const results = s.posts.flatMap((p) => p.results);
      const okCount = results.filter((r) => r.status === 'success').length;
      const partial = s.posts.filter((p) => overall(p) === 'partial').length;
      const doneAll = steps.every((x) => x[0]);
      return {
        title: T('개요', 'Overview'),
        sub: T(`안녕하세요, ${s.user.email}`, `Welcome, ${s.user.email}`),
        actions: `<a class="btn btn-primary" href="#/dashboard/publish">✎ ${T('새 게시물', 'New post')}</a>`,
        html: `
${doneAll ? '' : `<div class="card" style="margin-bottom:20px"><h3>${T('시작하기', 'Get started')}</h3><ul class="checklist">
  ${steps.map(([d, label, href]) => `<li class="${d ? 'done' : ''}"><span class="tick">${d ? '✓' : ''}</span><span class="t">${label}</span>${d ? '' : `<a class="btn btn-secondary btn-sm" href="${href}">${T('시작', 'Start')}</a>`}</li>`).join('')}
</ul></div>`}
<div class="grid grid-4" style="margin-bottom:20px">
  <div class="card stat"><div class="num">${s.accounts.filter((a) => a.status === 'connected').length}</div><div class="label">${T('연결된 계정', 'Connected accounts')}</div></div>
  <div class="card stat"><div class="num">${s.posts.length}</div><div class="label">${T('발행 요청', 'Post requests')}</div></div>
  <div class="card stat"><div class="num">${results.length ? Math.round((okCount / results.length) * 100) + '%' : '-'}</div><div class="label">${T('게시 성공률', 'Success rate')}</div></div>
  <div class="card stat"><div class="num">${partial}</div><div class="label">${T('부분 실패', 'Partial failures')}</div></div>
</div>
${s.accounts.some((a) => a.status === 'reauth') ? `<div class="callout warn"><strong>${T('재인증이 필요한 계정이 있습니다', 'Some accounts need re-authentication')}</strong><a href="#/dashboard/accounts">${T('소셜 계정에서 확인', 'Review in Social accounts')} →</a></div>` : ''}
<div class="card" style="padding:0"><div style="padding:16px 16px 0"><h3>${T('최근 발행', 'Recent posts')}</h3></div>
  ${s.posts.length ? s.posts.slice(0, 5).map((p) => `<div class="list-row"><div class="grow"><div>${esc(p.text.slice(0, 60) || T('(미디어만)', '(media only)'))}</div><div class="sub">${fmtTime(p.createdAt)} · ${p.results.map((r) => AL.findChannel(r.channel).name).join(', ')}</div></div><span data-post-badge="${p.id}">${overallBadge(p)}</span></div>`).join('') + `<div style="padding:12px 16px"><a href="#/dashboard/history">${T('전체 기록 보기', 'View all')} →</a></div>` : `<div class="empty">${T('아직 발행한 게시물이 없습니다.', 'No posts yet.')}</div>`}
</div>`
      };
    },

    accounts(s) {
      const after = (ch) => [T(`${ch.name}에 게시물 발행`, `Publish to ${ch.name}`), T('발행 결과와 링크 확인', 'See results and links'), ...(ch.caps.replies !== 'unsupported' ? [T('답글 읽기 (베타)', 'Read replies (beta)')] : [])];
      return {
        title: T('소셜 계정', 'Social accounts'),
        sub: T('연결한 계정은 에이전트와 API에서 바로 조회됩니다.', 'Connected accounts are available to your agents and the API.'),
        html: `
<div class="card" style="padding:0;margin-bottom:24px">
  ${s.accounts.length ? s.accounts.map((a) => {
    const ch = AL.findChannel(a.channel);
    return `<div class="list-row">${AL.chIcon(ch)}<div class="grow"><strong>${ch.name}</strong> <span class="muted">${esc(a.handle)}</span><div class="sub">${T('연결일', 'Connected')} ${fmtTime(a.connectedAt)}</div></div>
      ${a.status === 'connected' ? AL.statusBadge('connected', T('연결됨', 'Connected')) : AL.statusBadge('reauth', T('재인증 필요', 'Re-auth needed'))}
      ${a.status === 'reauth' ? `<button class="btn btn-primary btn-sm" data-reauth="${a.id}">${T('재인증', 'Re-authenticate')}</button>` : `<button class="btn btn-ghost btn-sm" data-expire="${a.id}" title="${T('데모용', 'Demo only')}">${T('만료 테스트', 'Simulate expiry')}</button>`}
      <button class="btn btn-danger btn-sm" data-disconnect="${a.id}">${T('연결 해제', 'Disconnect')}</button></div>`;
  }).join('') : `<div class="empty">${T('연결된 계정이 없습니다. 아래에서 채널을 선택하세요.', 'No accounts yet. Choose a channel below.')}</div>`}
</div>
<h3>${T('계정 추가', 'Add an account')}</h3>
<div class="grid grid-3">
  ${AL.CHANNELS.map((ch) => `<div class="card"><div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">${AL.chIcon(ch, 'lg')}<div><strong>${ch.name}</strong><div>${AL.statusBadge(ch.status)}</div></div></div>
    <p class="small muted">${esc(L(ch.auth))}</p>
    <div class="btn-row"><button class="btn btn-secondary btn-sm" data-connect="${ch.id}">${T('연결', 'Connect')}</button><a class="btn btn-ghost btn-sm" href="#/docs/${ch.id}">${T('안내', 'Guide')}</a></div></div>`).join('')}
</div>`,
        mount() {
          const rerender = () => AL.render();
          document.querySelectorAll('[data-connect]').forEach((b) => (b.onclick = () => {
            const ch = AL.findChannel(b.dataset.connect);
            consentModal({
              title: T(`${ch.name} 계정 연결`, `Connect ${ch.name}`),
              scopes: L(ch.scopes), after: after(ch),
              allowLabel: T(`${ch.name}에서 승인`, `Approve on ${ch.name}`),
              onAllow: () => {
                const n = s.accounts.filter((a) => a.channel === ch.id).length;
                s.accounts.push({ id: uid('acc'), channel: ch.id, handle: '@my_' + ch.id + (n ? n + 1 : ''), status: 'connected', connectedAt: new Date().toISOString() });
                save(); rerender();
                AL.toast(T(`${ch.name} 계정을 연결했습니다.`, `${ch.name} connected.`));
              }
            });
          }));
          document.querySelectorAll('[data-reauth]').forEach((b) => (b.onclick = () => {
            const a = s.accounts.find((x) => x.id === b.dataset.reauth);
            const ch = AL.findChannel(a.channel);
            consentModal({ title: T(`${ch.name} 재인증`, `Re-authenticate ${ch.name}`), scopes: L(ch.scopes), after: after(ch), onAllow: () => { a.status = 'connected'; save(); rerender(); AL.toast(T('재인증했습니다. 실패한 게시물을 재시도할 수 있습니다.', 'Re-authenticated. You can now retry failed posts.')); } });
          }));
          document.querySelectorAll('[data-expire]').forEach((b) => (b.onclick = () => {
            s.accounts.find((x) => x.id === b.dataset.expire).status = 'reauth'; save(); rerender();
          }));
          document.querySelectorAll('[data-disconnect]').forEach((b) => (b.onclick = () => {
            const a = s.accounts.find((x) => x.id === b.dataset.disconnect);
            confirmModal(T('계정 연결 해제', 'Disconnect account'), T(`${esc(a.handle)} 연결을 해제하면 저장된 토큰이 즉시 폐기되고 에이전트와 API에서 더 이상 이 계정에 발행할 수 없습니다. 이미 게시된 글은 삭제되지 않습니다.`, `Disconnecting ${esc(a.handle)} revokes its token immediately; agents and the API can no longer post to it. Existing posts are not deleted.`), T('연결 해제', 'Disconnect'), () => {
              s.accounts = s.accounts.filter((x) => x.id !== a.id); save(); rerender(); AL.toast(T('연결을 해제하고 토큰을 폐기했습니다.', 'Disconnected and token revoked.'));
            });
          }));
        }
      };
    },

    mcp(s) {
      return {
        title: T('MCP 연결', 'MCP connection'),
        sub: T('AI 에이전트는 OAuth로 연결됩니다. API 키가 필요하지 않습니다.', 'AI agents connect via OAuth. No API key needed.'),
        html: `
<div class="card" style="margin-bottom:20px">
  <h3>1. ${T('서버 주소 복사', 'Copy the server URL')}</h3>
  ${AL.copyField(AL.MCP_URL, 'MCP server URL')}
  <h3 style="margin-top:22px">2. ${T('에이전트 선택', 'Choose your agent')}</h3>
  <div class="field"><label for="agent-sel" class="sr-only">${T('에이전트', 'Agent')}</label>
    <select id="agent-sel">${AL.AGENTS.map((a) => `<option value="${a.id}">${a.name} — ${L(AL.DIFFICULTY[a.difficulty])}</option>`).join('')}</select></div>
  <div id="agent-guide"></div>
  <h3 style="margin-top:22px">3. ${T('브라우저에서 승인', 'Approve in the browser')}</h3>
  <p class="small muted">${T('에이전트가 승인 화면을 열면 권한을 확인하고 허용하세요. 아래 버튼은 그 과정을 시연합니다.', 'When your agent opens the consent page, review and allow. The button below demonstrates it.')}</p>
  <button class="btn btn-primary" id="simulate-oauth">${T('승인 화면 열기 (시연)', 'Open consent page (demo)')}</button>
</div>
<div class="card" style="padding:0">
  <div style="padding:16px 16px 0"><h3>${T('연결된 에이전트', 'Connected agents')}</h3></div>
  ${s.mcpClients.length ? s.mcpClients.map((c) => {
    const a = AL.findAgent(c.agentId);
    return `<div class="list-row"><span class="ch-icon" style="background:${a.color}">${a.short}</span><div class="grow"><strong>${a.name}</strong><div class="sub">${T('승인일', 'Approved')} ${fmtTime(c.connectedAt)} · ${T('권한', 'Scope')}: accounts.read, posts.write, posts.read</div></div>${AL.statusBadge('connected', T('연결됨', 'Connected'))}<button class="btn btn-danger btn-sm" data-revoke="${c.id}">${T('접근 철회', 'Revoke')}</button></div>`;
  }).join('') : `<div class="empty">${T('아직 연결된 에이전트가 없습니다.', 'No agents connected yet.')}</div>`}
</div>`,
        mount() {
          const sel = document.getElementById('agent-sel');
          const showGuide = () => {
            const a = AL.findAgent(sel.value);
            document.getElementById('agent-guide').innerHTML = `${AL.code(a.snippet.code, a.snippet.label)}<p class="small"><a href="#/integrations/${a.id}">${T(`${a.name} 전체 가이드`, `Full ${a.name} guide`)} →</a></p>`;
          };
          sel.onchange = showGuide; showGuide();
          document.getElementById('simulate-oauth').onclick = () => {
            const a = AL.findAgent(sel.value);
            consentModal({
              title: T(`${a.name}이(가) agentlink 접근을 요청합니다`, `${a.name} wants to access agentlink`),
              scopes: [T('연결된 소셜 계정 목록 조회 (accounts.read)', 'List connected social accounts (accounts.read)'), T('게시물 발행 및 재시도 (posts.write)', 'Publish and retry posts (posts.write)'), T('발행 이력 조회 (posts.read)', 'Read publishing history (posts.read)')],
              after: [T('에이전트에게 말로 게시 요청', 'Ask your agent to post'), T('채널별 결과와 실패 사유 확인', 'See per-channel results and failure reasons')],
              allowLabel: T('허용', 'Allow'),
              onAllow: () => {
                s.mcpClients.push({ id: uid('mcp'), agentId: a.id, connectedAt: new Date().toISOString() });
                save(); AL.render(); AL.toast(T(`${a.name}이(가) 연결됐습니다.`, `${a.name} connected.`));
              }
            });
          };
          document.querySelectorAll('[data-revoke]').forEach((b) => (b.onclick = () => confirmModal(T('에이전트 접근 철회', 'Revoke agent access'), T('철회하면 이 에이전트의 액세스 토큰이 즉시 폐기됩니다. 다시 사용하려면 재승인이 필요합니다.', 'The agent’s access token is revoked immediately. Re-approval is required to use it again.'), T('철회', 'Revoke'), () => {
            s.mcpClients = s.mcpClients.filter((x) => x.id !== b.dataset.revoke); save(); AL.render();
          })));
        }
      };
    },

    publish(s) {
      const usable = s.accounts;
      return {
        title: T('발행', 'Publish'),
        sub: T('에이전트 없이 직접 발행하거나, 에이전트가 할 요청을 미리 확인할 수 있습니다.', 'Publish directly, or preview what your agent will send.'),
        html: usable.length ? `
<div class="composer">
  <div class="card">
    <div class="field"><label for="post-text">${T('본문', 'Text')}</label>
      <textarea id="post-text" placeholder="${T('무엇을 게시할까요? YouTube·Naver Blog는 첫 줄이 제목이 됩니다.', 'What do you want to post? First line becomes the title on YouTube/Naver Blog.')}"></textarea>
      <div class="counter" id="counter">0${T('자', ' chars')}</div></div>
    <div class="field"><label>${T('미디어', 'Media')}</label>
      <div class="btn-row">
        <label class="btn btn-secondary btn-sm" style="margin:0">📎 ${T('파일 선택', 'Choose files')}<input type="file" id="file-in" multiple accept="image/*,video/*" hidden></label>
        <button class="btn btn-ghost btn-sm" id="add-img">+ ${T('샘플 이미지', 'Sample image')}</button>
        <button class="btn btn-ghost btn-sm" id="add-vid">+ ${T('샘플 동영상', 'Sample video')}</button>
      </div>
      <div class="media-list" id="media-list"></div></div>
    <fieldset class="field" style="border:0;padding:0;margin:0 0 16px"><legend style="font-weight:600;font-size:.9rem;margin-bottom:6px">${T('대상 계정', 'Target accounts')}</legend>
      <div class="grid grid-2" style="gap:8px">
        ${usable.map((a) => { const ch = AL.findChannel(a.channel); return `<label class="check" ${a.status === 'reauth' ? 'aria-disabled="true"' : ''}><input type="checkbox" value="${a.id}" ${a.status === 'reauth' ? 'disabled' : 'checked'}>${AL.chIcon(ch)}<span>${ch.name} <span class="small muted">${esc(a.handle)}</span>${a.status === 'reauth' ? `<br><span class="small" style="color:var(--warn)">${T('재인증 필요', 'Re-auth needed')}</span>` : ''}</span></label>`; }).join('')}
      </div></fieldset>
    <label class="check" style="margin-bottom:16px"><input type="checkbox" id="force-fail"> <span class="small">${T('데모: 마지막 채널 일시 오류(rate_limited) 시뮬레이션', 'Demo: simulate a temporary error (rate_limited) on the last channel')}</span></label>
    <button class="btn btn-primary btn-lg" id="publish-btn" style="width:100%">${T('발행', 'Publish')}</button>
  </div>
  <div>
    <div class="card" style="margin-bottom:20px"><h3>${T('채널별 사전 검증', 'Pre-validation')}</h3><div id="validation" aria-live="polite"></div></div>
    <div class="card" id="result-card" hidden><h3>${T('발행 결과', 'Results')}</h3><div id="result-box"></div></div>
  </div>
</div>` : `<div class="card empty"><p>${T('먼저 소셜 계정을 연결하세요.', 'Connect a social account first.')}</p><a class="btn btn-primary" href="#/dashboard/accounts">${T('계정 연결', 'Connect account')}</a></div>`,
        mount() {
          if (!usable.length) return;
          const media = [];
          const text = document.getElementById('post-text');
          const draftKey = 'al_draft';
          try { text.value = sessionStorage.getItem(draftKey) || ''; } catch (e) { /* ignore */ }
          const selected = () => [...document.querySelectorAll('fieldset input:checked')].map((i) => s.accounts.find((a) => a.id === i.value));
          const extOf = (name) => (name.split('.').pop() || '').toLowerCase();
          const renderMedia = () => {
            document.getElementById('media-list').innerHTML = media.map((m, i) => `<span class="media-item">${m.ext.match(/mp4|mov/) ? '🎬' : '🖼'} ${esc(m.name)}<button aria-label="${T('삭제', 'Remove')} ${esc(m.name)}" data-rm="${i}">×</button></span>`).join('');
            document.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { media.splice(+b.dataset.rm, 1); renderMedia(); validate(); }));
          };
          const checkText = (c) => ({
            length: () => T(`글자 수 ${AL.num(c.len)} / ${AL.num(c.limit)}`, `Length ${AL.num(c.len)} / ${AL.num(c.limit)}`),
            title: () => T(`첫 줄(제목) ${c.len} / ${c.limit}자, 비어 있으면 안 됨`, `First line (title) ${c.len} / ${c.limit}, must not be empty`),
            mediaRequired: () => T('미디어 최소 1개 필요', 'At least one media required'),
            mediaMax: () => T(`미디어 ${c.count} / 최대 ${c.limit}개`, `Media ${c.count} / max ${c.limit}`),
            mediaType: () => c.ok ? T(`허용 형식: ${c.allowed.join(', ')}`, `Allowed: ${c.allowed.join(', ')}`) : T(`허용되지 않는 형식: ${c.bad.join(', ')}`, `Unsupported: ${c.bad.join(', ')}`),
            empty: () => T('본문 또는 미디어가 필요합니다', 'Text or media required')
          }[c.key]());
          let lastValid = [];
          const validate = () => {
            const post = { text: text.value, media };
            document.getElementById('counter').textContent = AL.num([...text.value].length) + T('자', ' chars');
            const accs = selected();
            lastValid = accs.map((a) => ({ a, v: AL.validateForChannel(a.channel, post) }));
            document.getElementById('validation').innerHTML = accs.length ? lastValid.map(({ a, v }) => {
              const ch = AL.findChannel(a.channel);
              return `<div class="val-item"><header>${AL.chIcon(ch)}<span class="grow">${ch.name}</span>${v.ok ? AL.statusBadge('success', T('통과', 'Pass')) : AL.statusBadge('failed', T('수정 필요', 'Fix needed'))}</header>
                <ul>${v.checks.map((c) => `<li class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✕'} ${checkText(c)}</li>`).join('')}</ul></div>`;
            }).join('') : `<p class="muted small">${T('대상 계정을 선택하세요.', 'Select target accounts.')}</p>`;
            const pass = lastValid.filter((x) => x.v.ok).length;
            const btn = document.getElementById('publish-btn');
            btn.disabled = pass === 0;
            btn.textContent = pass === lastValid.length ? T(`${pass}개 계정에 발행`, `Publish to ${pass} account(s)`) : T(`검증 통과한 ${pass}개 계정만 발행 (${lastValid.length - pass}개 제외)`, `Publish to ${pass} passing account(s) (${lastValid.length - pass} excluded)`);
            try { sessionStorage.setItem(draftKey, text.value); } catch (e) { /* ignore */ }
          };
          text.oninput = validate;
          document.querySelectorAll('fieldset input').forEach((i) => (i.onchange = validate));
          document.getElementById('file-in').onchange = (e) => { [...e.target.files].forEach((f) => media.push({ name: f.name, ext: extOf(f.name) })); e.target.value = ''; renderMedia(); validate(); };
          document.getElementById('add-img').onclick = () => { media.push({ name: `photo_${media.length + 1}.jpg`, ext: 'jpg' }); renderMedia(); validate(); };
          document.getElementById('add-vid').onclick = () => { media.push({ name: `clip_${media.length + 1}.mp4`, ext: 'mp4' }); renderMedia(); validate(); };
          document.getElementById('publish-btn').onclick = () => {
            const passing = lastValid.filter((x) => x.v.ok).map((x) => x.a);
            if (!passing.length) return;
            const post = {
              id: uid('post'), text: text.value, media: media.slice(), createdAt: new Date().toISOString(), source: 'dashboard',
              results: passing.map((a) => ({ accountId: a.id, channel: a.channel, handle: a.handle, status: 'queued' }))
            };
            s.posts.unshift(post); save();
            const card = document.getElementById('result-card');
            card.hidden = false;
            document.getElementById('result-box').setAttribute('data-post', post.id);
            refreshPostViews(post);
            simulate(post, document.getElementById('force-fail').checked && passing.length > 1);
            text.value = ''; media.length = 0; renderMedia(); validate();
            try { sessionStorage.removeItem(draftKey); } catch (e) { /* ignore */ }
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          };
          validate();
        }
      };
    },

    history(s) {
      const filters = ['all', 'success', 'partial', 'failed'];
      return {
        title: T('발행 기록', 'History'),
        sub: T('게시 요청, 대상 계정, 결과, 시각과 오류 정보를 확인합니다.', 'Requests, target accounts, results, times and errors.'),
        html: `
<div class="btn-row" style="margin-bottom:16px" role="group" aria-label="${T('상태 필터', 'Status filter')}">
  ${filters.map((f, i) => `<button class="btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-secondary'}" data-filter="${f}">${f === 'all' ? T('전체', 'All') : L(OVERALL_LABEL[f])}</button>`).join('')}
</div>
<div class="card" style="padding:0" id="history-list">
  ${s.posts.length ? s.posts.map((p) => `<details class="history-item" data-status="${overall(p)}">
    <summary><span data-post-badge="${p.id}">${overallBadge(p)}</span><div class="grow"><div>${esc(p.text.split('\n')[0].slice(0, 80) || T('(미디어만)', '(media only)'))}</div><div class="small muted">${fmtTime(p.createdAt)} · ${p.id} · ${p.media.length ? T(`미디어 ${p.media.length}개`, `${p.media.length} media`) : T('텍스트', 'Text')}</div></div>
      <div class="chip-row">${p.results.map((r) => AL.chIcon(AL.findChannel(r.channel))).join('')}</div></summary>
    <div class="detail" data-post="${p.id}">${resultsHtml(p)}</div>
  </details>`).join('') : `<div class="empty">${T('기록이 없습니다.', 'No history yet.')} <a href="#/dashboard/publish">${T('첫 게시물 발행', 'Publish your first post')}</a></div>`}
</div>`,
        mount() {
          document.querySelectorAll('[data-filter]').forEach((b) => (b.onclick = () => {
            document.querySelectorAll('[data-filter]').forEach((x) => (x.className = 'btn btn-sm btn-secondary'));
            b.className = 'btn btn-sm btn-primary';
            document.querySelectorAll('.history-item').forEach((it) => {
              const post = s.posts.find((p) => it.querySelector('[data-post]').dataset.post === p.id);
              it.hidden = !(b.dataset.filter === 'all' || overall(post) === b.dataset.filter);
            });
          }));
        }
      };
    },

    keys(s) {
      return {
        title: T('API 키', 'API keys'),
        sub: T('서버·워크플로에서 REST API를 직접 호출할 때 사용합니다.', 'For calling the REST API from servers and workflows.'),
        html: `
<div class="callout warn"><strong>${T('에이전트 연결에는 API 키를 쓰지 않습니다', 'Agents do not use API keys')}</strong>${T('AI 에이전트는', 'AI agents connect via')} <a href="#/dashboard/mcp">${T('MCP 연결(OAuth)', 'MCP (OAuth)')}</a>${T('로 연결하세요. API 키를 에이전트 설정·프롬프트·코드 저장소에 넣지 마세요.', '. Never put API keys in agent configs, prompts or repos.')}</div>
<div id="new-key"></div>
<div class="card" style="margin-bottom:20px"><form id="key-form" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
  <div style="flex:1;min-width:200px"><label for="key-name">${T('키 이름', 'Key name')}</label><input id="key-name" type="text" required placeholder="${T('예: production-server', 'e.g. production-server')}"></div>
  <button class="btn btn-primary" type="submit">${T('새 키 생성', 'Create key')}</button></form></div>
<div class="card" style="padding:0">
  ${s.apiKeys.length ? s.apiKeys.map((k) => `<div class="list-row"><div class="grow"><strong>${esc(k.name)}</strong><div class="sub"><code>${k.prefix}••••••••••••</code> · ${T('생성', 'Created')} ${fmtTime(k.createdAt)}</div></div><button class="btn btn-danger btn-sm" data-revoke-key="${k.id}">${T('폐기', 'Revoke')}</button></div>`).join('') : `<div class="empty">${T('발급된 키가 없습니다.', 'No keys yet.')}</div>`}
</div>
<p class="small muted" style="margin-top:12px"><a href="#/docs/auth">${T('인증 문서', 'Auth docs')}</a> · <a href="#/docs/api-posts">${T('발행 API', 'Posts API')}</a></p>`,
        mount() {
          document.getElementById('key-form').onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('key-name').value.trim();
            const secret = 'al_live_' + Array.from({ length: 32 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join('');
            s.apiKeys.unshift({ id: uid('key'), name, prefix: secret.slice(0, 12), createdAt: new Date().toISOString() });
            save(); AL.render();
            document.getElementById('new-key').innerHTML = `<div class="secret-once" role="alert"><strong>${T('지금 복사하세요. 이 키는 다시 표시되지 않습니다.', 'Copy it now. This key will not be shown again.')}</strong><div style="margin-top:8px">${AL.copyField(secret, 'API key')}</div></div>`;
          };
          document.querySelectorAll('[data-revoke-key]').forEach((b) => (b.onclick = () => confirmModal(T('API 키 폐기', 'Revoke API key'), T('폐기하면 이 키를 사용하는 모든 요청이 즉시 unauthorized로 실패합니다.', 'All requests using this key will fail with unauthorized immediately.'), T('폐기', 'Revoke'), () => {
            s.apiKeys = s.apiKeys.filter((k) => k.id !== b.dataset.revokeKey); save(); AL.render();
          })));
        }
      };
    },

    settings(s) {
      return {
        title: T('설정', 'Settings'),
        html: `
<div class="card" style="margin-bottom:20px"><h3>${T('워크스페이스', 'Workspace')}</h3>
  <form id="ws-form" style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end"><div style="flex:1;min-width:200px"><label for="ws-name">${T('이름', 'Name')}</label><input id="ws-name" type="text" value="${esc(s.workspace)}" required></div><button class="btn btn-secondary" type="submit">${T('저장', 'Save')}</button></form>
  <p class="small muted" style="margin-top:12px">${T('로그인', 'Signed in with')} ${esc(s.user.provider)} · ${esc(s.user.email)}</p>
  <button class="btn btn-secondary btn-sm" id="logout">${T('로그아웃', 'Log out')}</button>
</div>
<div class="card"><h3>${T('보안 및 데이터 삭제', 'Security & data deletion')}</h3>
  <p class="small muted">${T('권한 범위와 삭제 경로는', 'See')} <a href="#/legal/data-deletion">${T('데이터 삭제 안내', 'Data deletion')}</a>${T('를 참고하세요.', ' for details.')}</p>
  <div class="list-row" style="padding-left:0;padding-right:0"><div class="grow"><strong>${T('모든 소셜 계정 연결 해제', 'Disconnect all social accounts')}</strong><div class="sub">${T('모든 플랫폼 토큰을 즉시 폐기합니다.', 'Revokes all platform tokens immediately.')}</div></div><button class="btn btn-danger btn-sm" data-wipe="accounts">${T('해제', 'Disconnect')}</button></div>
  <div class="list-row" style="padding-left:0;padding-right:0"><div class="grow"><strong>${T('모든 에이전트·API 키 철회', 'Revoke all agents & API keys')}</strong><div class="sub">${T('MCP 액세스 토큰과 API 키를 폐기합니다.', 'Revokes MCP tokens and API keys.')}</div></div><button class="btn btn-danger btn-sm" data-wipe="access">${T('철회', 'Revoke')}</button></div>
  <div class="list-row" style="padding-left:0;padding-right:0"><div class="grow"><strong>${T('발행 기록 삭제', 'Delete history')}</strong><div class="sub">${T('플랫폼에 게시된 글은 삭제되지 않습니다.', 'Published posts on platforms are not deleted.')}</div></div><button class="btn btn-danger btn-sm" data-wipe="history">${T('삭제', 'Delete')}</button></div>
  <div class="list-row" style="padding-left:0;padding-right:0"><div class="grow"><strong>${T('워크스페이스와 계정 삭제', 'Delete workspace & account')}</strong><div class="sub">${T('모든 데이터와 연결 정보를 삭제하고 로그아웃합니다.', 'Deletes all data and connections and logs out.')}</div></div><button class="btn btn-danger btn-sm" data-wipe="all">${T('전체 삭제', 'Delete all')}</button></div>
</div>`,
        mount() {
          document.getElementById('ws-form').onsubmit = (e) => { e.preventDefault(); s.workspace = document.getElementById('ws-name').value.trim() || s.workspace; save(); AL.render(); AL.toast(T('저장했습니다.', 'Saved.')); };
          document.getElementById('logout').onclick = () => { s.user = null; save(); AL.go('/'); };
          const wipe = {
            accounts: () => { s.accounts = []; },
            access: () => { s.mcpClients = []; s.apiKeys = []; },
            history: () => { s.posts = []; },
            all: () => { Object.assign(s, empty()); }
          };
          document.querySelectorAll('[data-wipe]').forEach((b) => (b.onclick = () => confirmModal(T('되돌릴 수 없는 작업', 'This cannot be undone'), b.closest('.list-row').querySelector('.sub').textContent + ' ' + T('계속할까요?', 'Continue?'), b.textContent, () => {
            wipe[b.dataset.wipe](); save();
            if (b.dataset.wipe === 'all') AL.go('/'); else AL.render();
            AL.toast(T('처리했습니다.', 'Done.'));
          })));
        }
      };
    }
  };
})();
