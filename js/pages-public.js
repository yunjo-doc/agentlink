/* 공개 페이지: 홈, 에이전트 연동, 지원 채널, 비교, 블로그, 법무 */
(function () {
  const { T, L, esc } = AL;

  /* ---------- 홈 (기획서 6장: 10개 섹션) ---------- */
  function channelTable() {
    return `<div class="table-wrap"><table>
      <thead><tr><th>${T('채널', 'Channel')}</th><th>${T('상태', 'Status')}</th><th>${T('글자 수', 'Text limit')}</th><th>${T('미디어', 'Media')}</th><th>${T('형식', 'Formats')}</th><th></th></tr></thead>
      <tbody>${AL.CHANNELS.map((c) => `<tr>
        <td><span class="ch-name">${AL.chIcon(c)}${c.name}</span></td>
        <td>${AL.statusBadge(c.status)}</td>
        <td>${AL.num(c.textLimit)}${T('자', '')}</td>
        <td>${c.media.required ? `<strong>${T('필수', 'Required')}</strong>` : T('선택', 'Optional')} · ${T('최대', 'max')} ${c.media.max}${T('개', '')}</td>
        <td class="small">${c.media.types.join(', ')}</td>
        <td><a href="#/docs/${c.id}">${T('상세', 'Details')} →</a></td>
      </tr>`).join('')}</tbody></table></div>`;
  }
  AL.channelTable = channelTable;

  function featureStatusLine() {
    return `<div class="feature-status" aria-label="${T('기능 제공 상태', 'Feature availability')}">
      ${AL.FEATURES.map((f) => `<span>${L(f.name)} ${AL.statusBadge(f.status)}</span>`).join('')}
    </div>`;
  }

  const faqs = () => [
    [T('agentlink는 어떤 역할을 하나요?', 'What does agentlink do?'),
      T('AI 에이전트와 소셜 플랫폼 사이의 발행 중계 서비스입니다. 에이전트는 공통 도구(계정 조회, 발행, 이력 조회)만 호출하고, 채널별 인증 토큰 관리·규격 검증·플랫폼 호출·실패 처리는 agentlink가 담당합니다. 글 자체는 사용 중인 에이전트가 작성합니다.',
        'It is a publishing relay between AI agents and social platforms. Your agent calls a common set of tools (list accounts, publish, history) while agentlink handles per-channel tokens, validation, platform calls and failure handling. Your agent writes the content.')],
    [T('API 키와 OAuth는 무엇이 다른가요?', 'How is an API key different from OAuth?'),
      T('OAuth는 AI 에이전트(MCP)를 연결할 때 브라우저에서 승인하는 방식으로, 비밀값을 복사할 필요가 없습니다. API 키는 직접 개발한 서버·워크플로에서 REST API를 호출할 때 사용합니다. API 키는 에이전트 설정에 붙여넣지 마세요.',
        'OAuth is used to connect AI agents (MCP) by approving in the browser — no secret to copy. API keys are for calling the REST API from your own servers or workflows. Never paste an API key into an agent config.')],
    [T('어떤 에이전트를 지원하나요?', 'Which agents are supported?'),
      T(`원격 MCP를 지원하는 에이전트라면 연결할 수 있습니다. 단계별 가이드는 ${AL.AGENTS.map((a) => a.name).join(', ')}에 제공됩니다.`,
        `Any agent that supports remote MCP. Step-by-step guides exist for ${AL.AGENTS.map((a) => a.name).join(', ')}.`)],
    [T('채널마다 글자 수나 미디어 규칙이 다르면 어떻게 되나요?', 'What if channels have different length or media rules?'),
      T('발행 전에 채널별 규격(글자 수, 미디어 수·형식, 필수 미디어)을 검사하고 문제가 있는 채널과 이유를 알려줍니다. 에이전트는 이를 보고 채널에 맞게 글을 고쳐 다시 요청할 수 있습니다.',
        'Before publishing, agentlink checks each channel’s rules (length, media count/type, required media) and reports which channel fails and why, so your agent can adjust and retry.')],
    [T('일부 채널만 실패하면요?', 'What if only some channels fail?'),
      T('성공한 채널은 그대로 두고 실패한 채널만 사유와 함께 표시합니다. 재시도 가능한 오류는 실패 채널만 다시 발행할 수 있어 중복 게시가 생기지 않습니다.',
        'Successful channels are kept and only failed ones are reported with a reason. Retryable errors can be retried for failed channels only, avoiding duplicates.')],
    [T('연결을 끊거나 데이터를 삭제하려면?', 'How do I disconnect or delete data?'),
      T('대시보드에서 소셜 계정·에이전트 연결을 언제든 해제할 수 있으며, 해제 시 저장된 토큰은 즉시 폐기됩니다. 전체 데이터 삭제 절차는 데이터 삭제 페이지를 참고하세요.',
        'You can disconnect social accounts and agents anytime in the dashboard; stored tokens are revoked immediately. See the Data deletion page for full deletion.')]
  ];

  AL.pages.home = function () {
    const demoAccounts = ['threads', 'instagram', 'facebook'].map(AL.findChannel);
    const html = `
<section class="hero">
  <div class="container hero-inner">
    <span class="eyebrow">MCP · REST API</span>
    <h1>${T('에이전트에게 말하면,<br><span>연결한 모든 채널에 게시</span>', 'Tell your agent.<br><span>Post to every connected channel.</span>')}</h1>
    <p class="lead">${T('이미 쓰는 AI 에이전트를 소셜 계정에 연결하세요. 한 번의 요청으로 채널별 규격을 검사하고, 여러 채널에 발행하고, 실패한 채널만 다시 시도합니다.', 'Connect the AI agent you already use to your social accounts. One request validates per-channel rules, publishes everywhere, and retries only what failed.')}</p>
    <div class="chip-row" aria-label="${T('지원 채널', 'Supported channels')}">
      ${AL.CHANNELS.map((c) => `<a class="ch-chip" href="#/docs/${c.id}">${AL.chIcon(c)}${c.name}${c.status !== 'available' ? ' ' + AL.statusBadge(c.status) : ''}</a>`).join('')}
    </div>
    <div class="btn-row">
      <a class="btn btn-primary btn-lg" href="#/dashboard/mcp">${T('에이전트 연결 시작', 'Connect your agent')}</a>
      <a class="btn btn-secondary btn-lg" href="#/docs/quickstart">${T('문서 보기', 'Read the docs')}</a>
    </div>
  </div>
</section>

<section class="section" id="demo" aria-labelledby="demo-h">
  <div class="container">
    <div class="section-head center">
      <span class="eyebrow">${T('제품 데모', 'Demo')}</span>
      <h2 id="demo-h">${T('자연어 요청 → 도구 실행 → 다중 채널 게시', 'Natural language → tool calls → multi-channel post')}</h2>
    </div>
    <div class="demo">
      <div class="demo-pane">
        <div class="demo-title"><span>${T('에이전트 대화', 'Agent chat')}</span><button class="btn btn-ghost btn-sm" id="demo-replay">↻ ${T('다시 보기', 'Replay')}</button></div>
        <div id="demo-chat" aria-live="polite"></div>
      </div>
      <div class="demo-pane">
        <div class="demo-title"><span>${T('채널별 발행 결과', 'Per-channel results')}</span><span id="demo-overall"></span></div>
        <div id="demo-results">
          ${demoAccounts.map((c) => `<div class="result-row" data-ch="${c.id}">${AL.chIcon(c)}<div class="grow"><strong>${c.name}</strong><div class="sub">@brand_studio</div></div><span class="st">${AL.statusBadge('pending', T('대기', 'Queued'))}</span></div>`).join('')}
        </div>
        <p class="small muted" style="margin-top:12px">${T('* 시연용 화면이며 실제 계정에 게시되지 않습니다.', '* Illustrative demo. Nothing is posted.')}</p>
      </div>
    </div>
    ${featureStatusLine()}
  </div>
</section>

<section class="section soft" aria-labelledby="how-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">${T('작동 원리', 'How it works')}</span>
      <h2 id="how-h">${T('에이전트는 요청만, 나머지는 agentlink가', 'Your agent asks. agentlink handles the rest.')}</h2>
    </div>
    <div class="flow">
      <div class="flow-node"><h3>${T('AI 에이전트', 'AI agent')}</h3><p class="small muted">Claude, ChatGPT, Codex …</p><ul><li>${T('글 작성', 'Writes content')}</li><li>${T('공통 도구 호출', 'Calls common tools')}</li></ul></div>
      <div class="flow-arrow">→<small>MCP / REST</small></div>
      <div class="flow-node center"><h3>agentlink</h3><ul>
        <li>${T('채널별 인증 토큰 보관·갱신', 'Stores & refreshes channel tokens')}</li>
        <li>${T('채널 규격 사전 검증', 'Pre-validates channel rules')}</li>
        <li>${T('플랫폼 API 호출', 'Calls platform APIs')}</li>
        <li>${T('계정별 결과·실패 채널 재시도', 'Per-account results & retries')}</li></ul></div>
      <div class="flow-arrow">→<small>OAuth</small></div>
      <div class="flow-node"><h3>${T('소셜 플랫폼', 'Social platforms')}</h3><p class="small muted">${AL.CHANNELS.map((c) => c.name).join(', ')}</p></div>
    </div>
    <p style="margin-top:20px"><a href="#/docs">${T('연결 방법 보기', 'See how to connect')} →</a></p>
  </div>
</section>

<section class="section" aria-labelledby="agents-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">${T('에이전트 연결', 'Connect an agent')}</span>
      <h2 id="agents-h">${T('쓰고 있는 에이전트를 고르세요', 'Pick the agent you already use')}</h2>
      <p class="lead">${T('서버 주소를 추가하고 브라우저에서 승인하면 끝납니다. API 키를 복사할 필요가 없습니다.', 'Add the server URL and approve in your browser. No API key to copy.')}</p>
    </div>
    <div class="grid grid-3">
      ${AL.AGENTS.map((a) => `<a class="card hover" href="#/integrations/${a.id}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span class="ch-icon lg" style="background:${a.color}">${a.short}</span>
          <span class="badge plain st-planned">${L(AL.DIFFICULTY[a.difficulty])} · ${a.stepsCount}${T('단계', ' steps')}</span>
        </div>
        <h3>${a.name}</h3><p class="small muted">${T('클라이언트별 설정 가이드', 'Setup guide')} →</p></a>`).join('')}
    </div>
  </div>
</section>

<section class="section soft" aria-labelledby="feat-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">${T('활용 기능', 'Features')}</span>
      <h2 id="feat-h">${T('여러 채널 발행을 안전하게', 'Multi-channel publishing, done safely')}</h2>
    </div>
    <div class="grid grid-4">
      <div class="card"><div class="icon-badge">⇉</div><h3>${T('다중 채널 발행', 'Multi-channel publish')}</h3><p class="small muted">${T('한 요청으로 선택한 모든 계정에 게시하고 계정별 결과를 돌려받습니다.', 'Post to all selected accounts in one request with per-account results.')}</p></div>
      <div class="card"><div class="icon-badge">✓</div><h3>${T('규격 사전 검증', 'Pre-validation')}</h3><p class="small muted">${T('글자 수, 미디어 수·형식, 필수 미디어를 발행 전에 확인합니다.', 'Checks length, media count/type and required media before posting.')}</p></div>
      <div class="card"><div class="icon-badge">↻</div><h3>${T('실패 채널 재시도', 'Retry failed only')}</h3><p class="small muted">${T('부분 실패를 성공 건과 분리하고 실패 채널만 다시 시도합니다.', 'Separates partial failures and retries only the failed channels.')}</p></div>
      <div class="card"><div class="icon-badge">{ }</div><h3>REST API</h3><p class="small muted">${T('에이전트 없이도 서버·워크플로에서 직접 통합할 수 있습니다.', 'Integrate directly from your servers and workflows.')}</p></div>
    </div>
    <div class="btn-row" style="margin-top:24px"><a class="btn btn-secondary" href="#/channels">${T('채널 살펴보기', 'Explore channels')}</a><a class="btn btn-ghost" href="#/docs/api-posts">${T('API 문서', 'API docs')} →</a></div>
  </div>
</section>

<section class="section" aria-labelledby="ch-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">${T('지원 채널', 'Channels')}</span>
      <h2 id="ch-h">${T('채널별 규격 한눈에 보기', 'Channel requirements at a glance')}</h2>
    </div>
    ${channelTable()}
  </div>
</section>

<section class="section soft faq" aria-labelledby="faq-h">
  <div class="container" style="max-width:860px">
    <div class="section-head center"><span class="eyebrow">FAQ</span><h2 id="faq-h">${T('자주 묻는 질문', 'Frequently asked questions')}</h2></div>
    ${faqs().map(([q, a]) => `<details><summary>${q}</summary><div>${a}</div></details>`).join('')}
    <p class="center muted small" style="text-align:center;margin-top:20px">${T('더 궁금한 점은', 'More questions?')} <a href="#/docs">${T('문서', 'Docs')}</a> ${T('또는', 'or')} <a href="mailto:support@agentlink.com">${T('지원 문의', 'Contact support')}</a></p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="cta-band">
      <h2>${T('지금 쓰는 에이전트로 첫 게시물을 올려보세요', 'Publish your first post with the agent you already use')}</h2>
      <p style="opacity:.9">${T('연결부터 첫 발행까지 몇 분이면 충분합니다.', 'From connection to first post in a few minutes.')}</p>
      <div class="btn-row"><a class="btn btn-primary btn-lg" href="#/dashboard/mcp">${T('에이전트 연결 시작', 'Connect your agent')}</a><a class="btn btn-secondary btn-lg" href="#/docs/quickstart">${T('문서 보기', 'Read the docs')}</a></div>
    </div>
  </div>
</section>`;
    return {
      title: T('AI 에이전트로 여러 소셜 채널에 발행', 'Publish to every social channel from your AI agent'),
      description: T('이미 쓰는 AI 에이전트를 소셜 계정에 연결하고 여러 채널에 발행하세요.', 'Connect your AI agent to social accounts and publish everywhere.'),
      html,
      mount: runDemo
    };
  };

  function runDemo() {
    const chat = document.getElementById('demo-chat');
    if (!chat) return;
    const setSt = (id, st, label, sub) => {
      const row = document.querySelector(`#demo-results [data-ch="${id}"]`);
      row.querySelector('.st').innerHTML = AL.statusBadge(st, label);
      if (sub !== undefined) row.querySelector('.sub').innerHTML = sub;
    };
    const overall = document.getElementById('demo-overall');
    const add = (cls, html) => { chat.insertAdjacentHTML('beforeend', `<div class="msg ${cls}">${html}</div>`); };
    const reset = () => {
      AL.timers.forEach(clearTimeout); AL.timers = [];
      chat.innerHTML = ''; overall.innerHTML = '';
      ['threads', 'instagram', 'facebook'].forEach((id) => setSt(id, 'pending', T('대기', 'Queued'), '@brand_studio'));
    };
    const seq = [
      [300, () => add('user', T('신제품 출시 소식 써서 Threads, Instagram, Facebook에 올려줘. 첨부한 사진 써줘.', 'Write a launch post and publish it to Threads, Instagram and Facebook with the attached photo.'))],
      [900, () => add('tool', `<b>list_accounts</b>()  → 3 accounts`)],
      [800, () => { add('tool', `<b>validate_post</b>(text: 182${T('자', ' chars')}, media: 1 jpg)  → ok`); ['threads', 'instagram', 'facebook'].forEach((id) => setSt(id, 'validating', T('검증 완료', 'Validated'))); }],
      [900, () => { add('tool', `<b>create_post</b>(accounts: 3)`); ['threads', 'instagram', 'facebook'].forEach((id) => setSt(id, 'publishing', T('발행 중', 'Publishing'))); }],
      [1100, () => setSt('threads', 'success', T('게시됨', 'Posted'), 'threads.net/@brand_studio/post/…')],
      [500, () => setSt('instagram', 'success', T('게시됨', 'Posted'), 'instagram.com/p/…')],
      [500, () => { setSt('facebook', 'failed', T('실패', 'Failed'), `<span class="err-text">rate_limited · ${T('재시도 가능', 'retryable')}</span>`); overall.innerHTML = AL.statusBadge('partial', T('부분 성공', 'Partial')); }],
      [900, () => { add('tool', `<b>retry_post</b>(failed_only: true)`); setSt('facebook', 'retrying', T('재시도 중', 'Retrying')); }],
      [1200, () => { setSt('facebook', 'success', T('게시됨', 'Posted'), 'facebook.com/brandstudio/posts/…'); overall.innerHTML = AL.statusBadge('success', T('전체 성공', 'All posted')); }],
      [600, () => add('agent', T('3개 채널에 모두 게시했어요. Facebook은 일시적인 호출 한도로 처음에 실패해 해당 채널만 다시 시도했습니다.', 'Posted to all 3 channels. Facebook briefly hit a rate limit, so I retried that channel only.'))]
    ];
    const play = () => {
      reset();
      let t = 0;
      seq.forEach(([d, fn]) => { t += d; AL.later(fn, t); });
    };
    document.getElementById('demo-replay').onclick = play;
    play();
  }

  /* ---------- 에이전트 연동 ---------- */
  AL.pages.integrations = function () {
    return {
      title: T('에이전트 연결', 'Agent integrations'),
      description: T('Claude, ChatGPT, Codex 등 원격 MCP를 지원하는 에이전트 연결 가이드', 'Guides for connecting MCP-capable agents'),
      html: `
<section class="page-hero"><div class="container">
  <span class="eyebrow">${T('에이전트 연결', 'Integrations')}</span>
  <h1>${T('쓰고 있는 AI 에이전트에 agentlink 추가하기', 'Add agentlink to the agent you use')}</h1>
  <p class="lead">${T('모든 에이전트는 같은 서버 주소와 브라우저 OAuth 승인으로 연결됩니다.', 'Every agent connects with the same server URL and browser OAuth approval.')}</p>
  <div style="max-width:560px">${AL.copyField(AL.MCP_URL, 'MCP server URL')}</div>
</div></section>
<section class="section"><div class="container">
  <div class="table-wrap"><table>
    <thead><tr><th>${T('에이전트', 'Agent')}</th><th>${T('난이도', 'Difficulty')}</th><th>${T('준비물', 'Prerequisites')}</th><th>${T('단계', 'Steps')}</th><th></th></tr></thead>
    <tbody>${AL.AGENTS.map((a) => `<tr>
      <td><span class="ch-name"><span class="ch-icon" style="background:${a.color}">${a.short}</span>${a.name}</span></td>
      <td>${L(AL.DIFFICULTY[a.difficulty])}</td>
      <td class="small">${L(a.prereq).join(' · ')}</td>
      <td>${a.stepsCount}</td>
      <td><a href="#/integrations/${a.id}">${T('가이드', 'Guide')} →</a></td></tr>`).join('')}</tbody>
  </table></div>
  <div class="callout" style="margin-top:24px"><strong>${T('목록에 없는 에이전트도 연결할 수 있나요?', 'Agent not listed?')}</strong>${T('원격 MCP(Streamable HTTP)와 OAuth를 지원하면 같은 서버 주소로 연결할 수 있습니다.', 'If it supports remote MCP (Streamable HTTP) with OAuth, use the same server URL.')} <a href="#/docs">${T('MCP 연결 문서', 'MCP docs')}</a></div>
</div></section>`
    };
  };

  // 에이전트별 설정 페이지: 난이도·준비물·단계·완료 확인을 동일 템플릿으로 (기획서 9장)
  AL.pages.integration = function ({ id }) {
    const a = AL.findAgent(id);
    if (!a) return AL.pages.notFound();
    const steps = L(a.steps);
    return {
      title: T(`${a.name}에 agentlink 연결`, `Connect agentlink to ${a.name}`),
      html: `
<div class="container" style="padding-top:40px;padding-bottom:80px">
  <div class="prose">
    <div class="breadcrumb"><a href="#/integrations">${T('에이전트 연결', 'Integrations')}</a> / ${a.name}</div>
    <h1><span class="ch-icon lg" style="background:${a.color};vertical-align:middle;margin-right:10px">${a.short}</span>${T(`${a.name} 연결 가이드`, `${a.name} setup guide`)}</h1>
    <div class="meta-grid">
      <div class="card"><div class="label">${T('난이도', 'Difficulty')}</div><div class="value">${L(AL.DIFFICULTY[a.difficulty])}</div></div>
      <div class="card"><div class="label">${T('소요 단계', 'Steps')}</div><div class="value">${a.stepsCount}${T('단계', '')}</div></div>
      <div class="card"><div class="label">${T('인증 방식', 'Auth')}</div><div class="value">OAuth</div></div>
      <div class="card"><div class="label">${T('API 키', 'API key')}</div><div class="value">${T('불필요', 'Not needed')}</div></div>
    </div>
    <h2>${T('준비물', 'Prerequisites')}</h2>
    <ul>${L(a.prereq).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    <h2>${T('설정 단계', 'Steps')}</h2>
    <ol class="steps">
      ${steps.map((s, i) => `<li><p>${esc(s)}</p>${i === 0 ? AL.code(a.snippet.code, a.snippet.label) : ''}${i === 1 ? oauthNote() : ''}</li>`).join('')}
    </ol>
    <h2>${T('완료 확인', 'Verify')}</h2>
    <div class="callout ok"><strong>${T('이렇게 나오면 성공입니다', 'You are done when')}</strong>${T('에이전트가 list_accounts 도구를 호출하고 연결된 소셜 계정 목록을 보여줍니다. 계정이 없다면 대시보드에서 소셜 계정을 먼저 연결하세요.', 'Your agent calls list_accounts and shows your connected accounts. If none, connect a social account in the dashboard first.')}</div>
    <h3>${T('문제가 생기면', 'Troubleshooting')}</h3>
    <ul>
      <li>${T('브라우저 승인 창이 열리지 않으면 에이전트를 다시 시작하고 MCP 서버 목록에서 agentlink를 다시 인증하세요.', 'If the consent window does not open, restart the agent and re-authenticate agentlink.')}</li>
      <li>${T('<code>unauthorized</code> 오류가 나면 대시보드 → MCP 연결에서 해당 클라이언트를 해제 후 다시 연결하세요.', 'On <code>unauthorized</code>, disconnect and reconnect the client under Dashboard → MCP.')}</li>
      <li>${T('API 키를 에이전트 설정에 넣지 마세요. 에이전트 연결은 OAuth만 사용합니다.', 'Do not put an API key in the agent config. Agents use OAuth only.')}</li>
    </ul>
    <div class="btn-row" style="margin-top:28px"><a class="btn btn-primary" href="#/dashboard/mcp">${T('대시보드에서 연결 상태 확인', 'Check connection in dashboard')}</a><a class="btn btn-secondary" href="#/docs/agent-publish">${T('첫 발행 요청 예시', 'First post examples')}</a></div>
  </div>
</div>`
    };
  };

  function oauthNote() {
    return `<div class="callout"><strong>${T('승인 화면에서 요청하는 권한', 'Permissions requested on the consent screen')}</strong>
      <ul style="margin:6px 0 0"><li>${T('연결된 소셜 계정 목록 조회', 'List your connected social accounts')}</li><li>${T('선택한 계정에 게시물 발행 및 재시도', 'Publish and retry posts to selected accounts')}</li><li>${T('발행 이력 조회', 'Read publishing history')}</li></ul>
      <p class="small" style="margin-top:6px">${T('소셜 계정 비밀번호나 플랫폼 토큰은 에이전트에 전달되지 않습니다. 대시보드에서 언제든 연결을 해제할 수 있습니다.', 'Your social passwords and platform tokens are never shared with the agent. Disconnect anytime in the dashboard.')}</p></div>`;
  }

  /* ---------- 지원 채널 ---------- */
  AL.pages.channels = function () {
    const caps = Object.keys(AL.CAP_LABELS);
    return {
      title: T('지원 채널', 'Supported channels'),
      html: `
<section class="page-hero"><div class="container">
  <span class="eyebrow">${T('지원 채널', 'Channels')}</span>
  <h1>${T('채널별 지원 범위와 규격', 'Channel support and requirements')}</h1>
  <p class="lead">${T('모든 화면과 문서는 같은 상태 용어(제공 중 · 베타 · 예정 · 미지원)를 사용합니다.', 'All pages use the same status terms: Available · Beta · Planned · Not supported.')}</p>
  <div class="chip-row">${Object.keys(AL.STATUS).map((s) => AL.statusBadge(s)).join('')}</div>
</div></section>
<section class="section"><div class="container">
  <h2>${T('콘텐츠 규격', 'Content requirements')}</h2>
  ${channelTable()}
  <h2 style="margin-top:48px">${T('기능 지원 범위', 'Capability matrix')}</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>${T('채널', 'Channel')}</th><th>${T('인증', 'Auth')}</th>${caps.map((c) => `<th>${L(AL.CAP_LABELS[c])}</th>`).join('')}</tr></thead>
    <tbody>${AL.CHANNELS.map((c) => `<tr><td><span class="ch-name">${AL.chIcon(c)}<a href="#/docs/${c.id}">${c.name}</a></span></td><td class="small">${esc(L(c.auth))}</td>${caps.map((k) => `<td>${AL.statusBadge(c.caps[k])}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>
  <p class="small muted" style="margin-top:12px">${T('API로 지원하지 않는 기능은 각 채널 문서에 명시합니다.', 'Features not supported by platform APIs are listed in each channel guide.')}</p>
</div></section>`
    };
  };

  /* ---------- 비교 (가격 정보 제외) ---------- */
  AL.pages.compare = function () {
    const rows = [
      [T('기존 AI 에이전트에서 바로 사용', 'Use from your existing AI agent'), 'available', 'unsupported', 'unsupported'],
      [T('채널별 OAuth·토큰 갱신 관리', 'Per-channel OAuth & token refresh'), 'available', 'unsupported', 'available'],
      [T('발행 전 채널 규격 검증', 'Pre-publish validation'), 'available', 'unsupported', 'beta'],
      [T('계정별 결과와 실패 채널만 재시도', 'Per-account results, retry failed only'), 'available', 'unsupported', 'beta'],
      [T('REST API 제공', 'REST API'), 'available', 'available', 'beta'],
      [T('예약 발행', 'Scheduling'), AL.FEATURES.find((f) => f.id === 'schedule').status, 'unsupported', 'available'],
      [T('지표 조회', 'Metrics'), AL.FEATURES.find((f) => f.id === 'metrics').status, 'available', 'available']
    ];
    return {
      title: T('비교', 'Compare'),
      html: `
<section class="page-hero"><div class="container">
  <span class="eyebrow">${T('비교', 'Compare')}</span>
  <h1>${T('agentlink가 나에게 맞을까?', 'Is agentlink right for you?')}</h1>
  <p class="lead">${T('플랫폼 API를 직접 연동하거나 일반 예약 도구를 쓰는 방식과 비교합니다. 상태 표기는 채널 문서와 동일한 기준입니다.', 'Compared with integrating platform APIs directly or using a general scheduling tool. Status uses the same terms as the channel docs.')}</p>
</div></section>
<section class="section"><div class="container">
  <div class="table-wrap"><table>
    <thead><tr><th>${T('항목', 'Capability')}</th><th>agentlink</th><th>${T('플랫폼 API 직접 연동', 'Direct platform APIs')}</th><th>${T('일반 예약 도구', 'Scheduling tools')}</th></tr></thead>
    <tbody>${rows.map(([n, a, b, c]) => `<tr><td>${n}</td><td>${AL.statusBadge(a)}</td><td>${AL.statusBadge(b)}</td><td>${AL.statusBadge(c)}</td></tr>`).join('')}</tbody>
  </table></div>
  <p class="small muted" style="margin-top:12px">${T('타 방식 항목은 일반적인 경우를 기준으로 한 예시이며, 제품마다 다를 수 있습니다.', 'Other columns reflect typical cases and vary by product.')}</p>
  <div class="grid grid-2" style="margin-top:40px">
    <div class="card"><h3>${T('이런 분께 잘 맞습니다', 'Great fit if you')}</h3><ul>
      <li>${T('AI에게 글 작성과 게시를 함께 맡기고 싶은 창작자', 'Want your AI to write and post for you')}</li>
      <li>${T('여러 브랜드 계정을 반복 운영하는 마케팅 담당자', 'Run several brand accounts repeatedly')}</li>
      <li>${T('채널별 API를 각각 붙이지 않고 하나로 통합하려는 개발자', 'Want one API instead of six')}</li></ul></div>
    <div class="card"><h3>${T('다른 방식을 고려하세요', 'Consider alternatives if you')}</h3><ul>
      <li>${T('캘린더 기반 콘텐츠 기획·승인 워크플로가 핵심인 경우', 'Need a calendar-based planning/approval workflow')}</li>
      <li>${T('채널 지표 분석이 주목적인 경우 (현재 예정 기능)', 'Mainly need analytics (currently planned)')}</li></ul></div>
  </div>
</div></section>`
    };
  };

  /* ---------- 블로그 ---------- */
  const POSTS = [
    { slug: 'mcp-social-publishing', date: '2026-10-20', tag: { ko: '가이드', en: 'Guide' },
      title: { ko: 'MCP로 AI 에이전트에 소셜 발행 능력 더하기', en: 'Give your AI agent social publishing with MCP' },
      excerpt: { ko: '원격 MCP 서버를 추가하는 것만으로 에이전트가 여러 소셜 채널에 글을 올리는 방법을 소개합니다.', en: 'How adding one remote MCP server lets your agent post to multiple social channels.' },
      body: { ko: ['MCP(Model Context Protocol)는 AI 에이전트가 외부 도구를 같은 방식으로 호출하도록 하는 표준입니다. agentlink는 소셜 발행에 필요한 도구를 원격 MCP 서버로 제공합니다.', '에이전트에 서버 주소를 추가하고 브라우저에서 승인하면, 에이전트는 list_accounts, validate_post, create_post 같은 도구를 사용할 수 있습니다.', '채널별 인증 토큰과 규격 차이는 agentlink가 처리하므로, 에이전트는 무엇을 쓸지에만 집중하면 됩니다.'], en: ['MCP (Model Context Protocol) is a standard for agents to call external tools the same way. agentlink exposes social publishing tools as a remote MCP server.', 'Add the server URL to your agent and approve in the browser. Your agent can then use tools like list_accounts, validate_post and create_post.', 'agentlink handles per-channel tokens and rules, so your agent can focus on what to write.'] } },
    { slug: 'partial-failure', date: '2026-10-08', tag: { ko: '제품', en: 'Product' },
      title: { ko: '여러 채널 발행에서 부분 실패를 다루는 법', en: 'Handling partial failures in multi-channel publishing' },
      excerpt: { ko: '5개 채널 중 1개가 실패했을 때 중복 게시 없이 안전하게 재시도하는 설계.', en: 'Retrying safely without duplicates when 1 of 5 channels fails.' },
      body: { ko: ['여러 채널에 동시에 발행하면 일부 채널만 실패하는 일이 흔합니다. 호출 한도, 만료된 토큰, 미디어 처리 오류가 대표적입니다.', 'agentlink는 게시 요청을 계정별 결과로 나누어 기록합니다. 성공한 채널은 다시 건드리지 않고, 재시도 가능한 오류로 실패한 채널만 retry 할 수 있습니다.', '토큰 만료처럼 사용자 조치가 필요한 오류는 재시도 대신 재인증 안내를 표시합니다.'], en: ['When publishing to many channels at once, some may fail: rate limits, expired tokens, media processing errors.', 'agentlink records per-account results. Successful channels are never touched again; only channels that failed with retryable errors can be retried.', 'Errors that need user action, like expired tokens, show a re-auth prompt instead of a retry.'] } },
    { slug: 'oauth-vs-api-key', date: '2026-09-25', tag: { ko: '보안', en: 'Security' },
      title: { ko: 'OAuth와 API 키, 언제 무엇을 써야 할까', en: 'OAuth vs. API keys: when to use which' },
      excerpt: { ko: '에이전트 연결과 직접 통합에서 인증 방식을 구분하는 이유.', en: 'Why agent connections and direct integrations use different auth.' },
      body: { ko: ['AI 에이전트 연결에는 OAuth를 사용합니다. 사용자가 브라우저에서 직접 승인하므로 비밀값을 복사·붙여넣기 할 일이 없고, 언제든 철회할 수 있습니다.', 'REST API 키는 서버 간 통합용입니다. 키는 생성 시 한 번만 표시되며, 코드 저장소나 에이전트 프롬프트에 넣지 않아야 합니다.', '두 방식 모두 대시보드에서 연결 해제·폐기할 수 있습니다.'], en: ['Agents connect with OAuth: you approve in the browser, nothing secret is copied, and you can revoke anytime.', 'REST API keys are for server-to-server integrations. Keys are shown once and must never go in repos or agent prompts.', 'Both can be revoked from the dashboard.'] } }
  ];
  AL.pages.blog = function () {
    return {
      title: T('블로그', 'Blog'),
      html: `
<section class="page-hero"><div class="container"><span class="eyebrow">${T('블로그', 'Blog')}</span><h1>${T('소식과 가이드', 'News & guides')}</h1></div></section>
<section class="section"><div class="container"><div class="grid grid-3">
  ${POSTS.map((p) => `<a class="card hover post-card" href="#/blog/${p.slug}"><div class="meta">${L(p.tag)} · ${p.date}</div><h3>${L(p.title)}</h3><p class="small muted">${L(p.excerpt)}</p></a>`).join('')}
</div></div></section>`
    };
  };
  AL.pages.blogPost = function ({ slug }) {
    const p = POSTS.find((x) => x.slug === slug);
    if (!p) return AL.pages.notFound();
    return {
      title: L(p.title), description: L(p.excerpt),
      html: `<div class="container" style="padding:48px 20px 80px"><article class="prose" style="margin:0 auto">
        <div class="breadcrumb"><a href="#/blog">${T('블로그', 'Blog')}</a> / ${L(p.tag)}</div>
        <h1>${L(p.title)}</h1><p class="muted small">${p.date}</p>
        ${L(p.body).map((b) => `<p>${esc(b)}</p>`).join('')}
        <div class="callout"><a href="#/docs/quickstart">Quickstart →</a></div>
      </article></div>`
    };
  };

  /* ---------- 법무 ---------- */
  const LEGAL = {
    privacy: {
      title: { ko: '개인정보 처리방침', en: 'Privacy policy' },
      sections: [
        [{ ko: '수집하는 정보', en: 'Information we collect' }, { ko: '계정 정보(이메일, 로그인 제공자), 연결된 소셜 계정의 식별자와 OAuth 토큰, 발행 요청 내용과 결과, 서비스 이용 기록.', en: 'Account info (email, login provider), identifiers and OAuth tokens of connected social accounts, publish request content and results, usage logs.' }],
        [{ ko: '이용 목적', en: 'How we use it' }, { ko: '사용자가 요청한 게시물 발행, 발행 결과·이력 제공, 오류 처리와 보안 유지.', en: 'Publishing requested posts, providing results and history, error handling and security.' }],
        [{ ko: '토큰 보관', en: 'Token storage' }, { ko: '플랫폼 토큰은 암호화해 저장하며 AI 에이전트나 제3자에게 전달하지 않습니다. 연결 해제 시 즉시 폐기합니다.', en: 'Platform tokens are stored encrypted and never shared with AI agents or third parties. They are revoked immediately on disconnect.' }],
        [{ ko: '보존 기간', en: 'Retention' }, { ko: '발행 이력은 워크스페이스가 유지되는 동안 보관하며, 삭제 요청 시 데이터 삭제 절차에 따라 처리합니다. (세부 기간은 제품 담당자 검토 후 확정)', en: 'History is kept while the workspace exists and deleted per the data deletion process. (Exact periods to be confirmed.)' }]
      ]
    },
    terms: {
      title: { ko: '이용약관', en: 'Terms of service' },
      sections: [
        [{ ko: '서비스 내용', en: 'Service' }, { ko: 'agentlink는 사용자가 연결한 소셜 계정에 사용자 또는 사용자의 AI 에이전트가 요청한 콘텐츠를 발행하는 중계 서비스를 제공합니다.', en: 'agentlink relays content requested by you or your AI agent to the social accounts you connect.' }],
        [{ ko: '사용자 책임', en: 'Your responsibilities' }, { ko: '게시 콘텐츠와 각 플랫폼 정책 준수에 대한 책임은 사용자에게 있습니다. 에이전트가 작성한 글도 사용자의 요청으로 발행된 것으로 봅니다.', en: 'You are responsible for posted content and complying with each platform’s policies, including content written by your agent.' }],
        [{ ko: '플랫폼 제약', en: 'Platform limits' }, { ko: '각 플랫폼의 API 제한·정책 변경으로 일부 기능이 제한될 수 있으며, 변경 사항은 채널 문서에 반영합니다.', en: 'Platform API limits or policy changes may restrict features; changes are reflected in channel docs.' }]
      ]
    },
    'data-deletion': {
      title: { ko: '데이터 삭제', en: 'Data deletion' },
      sections: [
        [{ ko: '소셜 계정 연결 해제', en: 'Disconnect a social account' }, { ko: '대시보드 → 소셜 계정에서 해제를 누르면 해당 계정의 토큰이 즉시 폐기되고 이후 발행이 중단됩니다.', en: 'Dashboard → Social accounts → Disconnect revokes the token immediately and stops publishing.' }],
        [{ ko: '에이전트 연결 해제', en: 'Disconnect an agent' }, { ko: '대시보드 → MCP 연결에서 클라이언트별로 접근 권한을 철회할 수 있습니다.', en: 'Dashboard → MCP lets you revoke each client’s access.' }],
        [{ ko: '전체 데이터 삭제', en: 'Delete all data' }, { ko: '대시보드 → 설정 → 데이터 삭제에서 워크스페이스와 발행 이력, 연결 정보를 모두 삭제할 수 있습니다. 플랫폼에 이미 게시된 글은 각 플랫폼에서 직접 삭제해야 합니다.', en: 'Dashboard → Settings → Delete data removes the workspace, history and connections. Posts already published must be deleted on each platform.' }],
        [{ ko: '플랫폼 측 권한 철회', en: 'Revoke on the platform' }, { ko: 'Meta, Google, Naver 계정 설정의 “연결된 앱”에서도 agentlink 권한을 직접 철회할 수 있습니다.', en: 'You can also revoke agentlink under “connected apps” in your Meta, Google or Naver settings.' }]
      ]
    }
  };
  AL.pages.legal = function ({ page }) {
    const d = LEGAL[page];
    if (!d) return AL.pages.notFound();
    return {
      title: L(d.title),
      html: `<div class="container" style="padding:48px 20px 80px"><article class="prose">
        <div class="breadcrumb">${T('신뢰/법무', 'Trust & legal')}</div>
        <h1>${L(d.title)}</h1>
        <p class="muted small">${T('시행일 2026-10-29 · 기획용 초안', 'Effective 2026-10-29 · Planning draft')}</p>
        ${d.sections.map(([h, b]) => `<h2>${L(h)}</h2><p>${L(b)}</p>`).join('')}
        ${page === 'data-deletion' ? `<a class="btn btn-primary" href="#/dashboard/settings">${T('대시보드에서 삭제하기', 'Delete in dashboard')}</a>` : ''}
      </article></div>`
    };
  };

  AL.pages.notFound = function () {
    return {
      title: T('페이지를 찾을 수 없음', 'Not found'),
      html: `<div class="container empty" style="padding:120px 20px"><h1>404</h1><p>${T('요청한 페이지가 없습니다.', 'This page does not exist.')}</p><a class="btn btn-primary" href="#/">${T('홈으로', 'Go home')}</a></div>`
    };
  };
})();
