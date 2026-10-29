/* 문서: 시작하기, API 레퍼런스, 채널별 안내 */
(function () {
  const { T, L, esc } = AL;
  const B = AL.API_BASE;

  function nav() {
    return [
      { group: T('시작하기', 'Get started'), items: [
        ['mcp', T('MCP 연결', 'MCP connection')],
        ['quickstart', 'Quickstart'],
        ['auth', T('인증 (OAuth · API 키)', 'Auth (OAuth · API keys)')],
        ['connect-channels', T('채널 연결', 'Connecting channels')],
        ['agent-publish', T('에이전트로 발행', 'Publishing via agent')]
      ] },
      { group: T('API 레퍼런스', 'API reference'), items: [
        ['api-posts', T('발행', 'Posts')],
        ['api-media', T('미디어', 'Media')],
        ['api-automations', T('자동화', 'Automations'), 'beta'],
        ['api-engagement', T('답글·지표', 'Replies & metrics'), 'beta'],
        ['api-inbox', T('인박스·연락처', 'Inbox & contacts'), 'planned'],
        ['api-platforms', T('플랫폼', 'Platforms')],
        ['errors', T('오류 코드', 'Errors')]
      ] },
      { group: T('채널별 안내', 'Channel guides'), items: AL.CHANNELS.map((c) => [c.id, c.name, c.status !== 'available' ? c.status : null]) }
    ];
  }

  function endpoint(method, path, desc) {
    return `<h3 id="${esc(method + path).replace(/[^a-z0-9]/gi, '-')}"><span class="method m-${method.toLowerCase()}">${method}</span><span class="endpoint">${esc(path)}</span></h3><p>${desc}</p>`;
  }

  const sampleReq = `curl -X POST ${B}/posts \\
  -H "Authorization: Bearer $AGENTLINK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 7c1e-launch-2026-10-29" \\
  -d '{
    "text": "신제품을 소개합니다 ✨",
    "account_ids": ["acc_threads_01", "acc_ig_01", "acc_fb_01"],
    "media_ids": ["med_8f2a"]
  }'`;
  const sampleRes = `{
  "id": "post_91ab",
  "status": "partial",
  "created_at": "2026-10-29T09:12:44Z",
  "results": [
    { "account_id": "acc_threads_01", "channel": "threads",   "status": "success", "url": "https://www.threads.net/@brand/post/..." },
    { "account_id": "acc_ig_01",      "channel": "instagram", "status": "success", "url": "https://www.instagram.com/p/..." },
    { "account_id": "acc_fb_01",      "channel": "facebook",  "status": "failed",
      "error": { "code": "rate_limited", "retryable": true, "retry_after": 60 } }
  ]
}`;

  const PAGES = {
    mcp: () => ({
      title: T('MCP 연결', 'MCP connection'),
      body: `
<p class="lead">${T('agentlink는 원격 MCP 서버를 제공합니다. 에이전트에 서버 주소를 추가하고 브라우저에서 승인하면 소셜 발행 도구를 사용할 수 있습니다.', 'agentlink provides a remote MCP server. Add the URL to your agent and approve in the browser to get social publishing tools.')}</p>
<h2>${T('서버 주소', 'Server URL')}</h2>
${AL.copyField(AL.MCP_URL, 'MCP server URL')}
<p class="small muted" style="margin-top:8px">${T('전송 방식: Streamable HTTP · 인증: OAuth 2.1 (브라우저 승인)', 'Transport: Streamable HTTP · Auth: OAuth 2.1 (browser consent)')}</p>
<h2>${T('연결 흐름', 'Connection flow')}</h2>
<ol class="steps">
  <li>${T('에이전트(클라이언트)에 서버 주소를 등록합니다.', 'Register the server URL in your agent (client).')}</li>
  <li>${T('에이전트가 외부 브라우저로 agentlink 로그인·승인 화면을 엽니다.', 'The agent opens the agentlink login/consent page in a browser.')}</li>
  <li>${T('요청 권한을 확인하고 허용하면 에이전트가 승인된 범위로 연결됩니다.', 'Review and allow the permissions; the agent is connected with that scope.')}</li>
  <li>${T('대시보드에서 소셜 계정을 연결하면 에이전트에서 조회됩니다.', 'Connect social accounts in the dashboard; they appear in your agent.')}</li>
</ol>
<div class="callout warn"><strong>${T('API 키는 필요 없습니다', 'No API key needed')}</strong>${T('에이전트 연결은 OAuth만 사용합니다. REST API 키를 에이전트 설정이나 프롬프트에 넣지 마세요.', 'Agents connect with OAuth only. Never place a REST API key in an agent config or prompt.')} <a href="#/docs/auth">${T('인증 방식 비교', 'Compare auth methods')}</a></div>
<h2>${T('제공 도구', 'Available tools')}</h2>
<div class="table-wrap"><table><thead><tr><th>${T('도구', 'Tool')}</th><th>${T('설명', 'Description')}</th></tr></thead><tbody>
${AL.MCP_TOOLS.map((t) => `<tr><td><code>${t.name}</code></td><td>${L(t.desc)}</td></tr>`).join('')}
</tbody></table></div>
<h2>${T('클라이언트별 가이드', 'Client guides')}</h2>
<div class="chip-row">${AL.AGENTS.map((a) => `<a class="ch-chip" href="#/integrations/${a.id}"><span class="ch-icon" style="background:${a.color}">${a.short}</span>${a.name}</a>`).join('')}</div>`
    }),

    quickstart: () => ({
      title: 'Quickstart',
      body: `
<p class="lead">${T('가입부터 첫 발행까지 5단계입니다.', 'Five steps from sign-up to your first post.')}</p>
<ol class="steps">
  <li><strong>${T('가입 신청과 승인', 'Request access')}</strong><p>${T('가입 신청을 보내고 관리자 승인을 받은 뒤 이메일과 비밀번호로 로그인합니다.', 'Submit an access request; once an admin approves it, log in with your email and password.')} <a href="#/signup">${T('가입 신청', 'Request access')} →</a></p></li>
  <li><strong>${T('소셜 계정 연결', 'Connect a social account')}</strong><p>${T('대시보드 → 소셜 계정에서 채널을 고르고 플랫폼 승인 화면에서 허용합니다.', 'Dashboard → Social accounts: choose a channel and approve on the platform.')}</p></li>
  <li><strong>${T('에이전트 연결', 'Connect your agent')}</strong><p>${T('사용 중인 에이전트에 MCP 서버 주소를 추가합니다.', 'Add the MCP server URL to your agent.')}</p>${AL.code(AL.AGENTS[0].snippet.code, 'Claude Code')}</li>
  <li><strong>${T('연결 확인', 'Verify')}</strong><p>${T('에이전트에게 “연결된 소셜 계정 보여줘”라고 요청합니다.', 'Ask your agent: “Show my connected social accounts.”')}</p></li>
  <li><strong>${T('첫 발행', 'First post')}</strong><p>${T('“오늘 공지 써서 Threads랑 Facebook에 올려줘”처럼 요청합니다. 채널별 결과가 돌아옵니다.', 'Ask e.g. “Write today’s announcement and post to Threads and Facebook.” You get per-channel results.')}</p></li>
</ol>
<div class="callout"><strong>${T('직접 통합하려면', 'Integrating directly?')}</strong>${T('대시보드 → API 키에서 키를 발급한 뒤', 'Create a key in Dashboard → API keys, then see')} <a href="#/docs/api-posts">${T('발행 API', 'Posts API')}</a>${T('를 참고하세요.', '.')}</div>`
    }),

    auth: () => ({
      title: T('인증', 'Authentication'),
      body: `
<p class="lead">${T('agentlink에는 용도가 다른 두 가지 인증 방식이 있습니다. 혼동하지 않도록 화면과 문서에서 항상 구분합니다.', 'agentlink has two auth methods for different purposes. They are always kept separate.')}</p>
<div class="table-wrap"><table><thead><tr><th></th><th>OAuth (MCP)</th><th>${T('API 키 (REST)', 'API key (REST)')}</th></tr></thead><tbody>
<tr><td>${T('용도', 'Use for')}</td><td>${T('AI 에이전트 연결', 'Connecting AI agents')}</td><td>${T('서버·워크플로 직접 통합', 'Server/workflow integrations')}</td></tr>
<tr><td>${T('발급 방법', 'How')}</td><td>${T('브라우저에서 승인', 'Approve in browser')}</td><td>${T('대시보드에서 생성 (1회만 표시)', 'Create in dashboard (shown once)')}</td></tr>
<tr><td>${T('비밀값 복사', 'Copy a secret')}</td><td>${T('없음', 'No')}</td><td>${T('있음 — 환경 변수로만 보관', 'Yes — store in env vars only')}</td></tr>
<tr><td>${T('철회', 'Revoke')}</td><td>${T('대시보드 → MCP 연결', 'Dashboard → MCP')}</td><td>${T('대시보드 → API 키', 'Dashboard → API keys')}</td></tr>
</tbody></table></div>
<h2>${T('API 키 사용', 'Using API keys')}</h2>
${AL.code(`curl ${B}/accounts \\\n  -H "Authorization: Bearer $AGENTLINK_API_KEY"`, 'HTTP')}
<div class="callout err"><strong>${T('비밀값 노출 방지', 'Keep secrets safe')}</strong>${T('API 키를 코드 저장소, 프런트엔드 코드, 에이전트 프롬프트에 넣지 마세요. 노출이 의심되면 즉시 폐기하고 새로 발급하세요.', 'Never put API keys in repos, frontend code or agent prompts. Revoke and reissue immediately if exposed.')}</div>
<h2>${T('소셜 플랫폼 인증', 'Social platform auth')}</h2>
<p>${T('각 소셜 계정은 플랫폼 OAuth로 별도 승인합니다. 플랫폼 토큰은 agentlink가 암호화해 보관·갱신하며 에이전트나 API 응답에 노출되지 않습니다.', 'Each social account is approved via the platform’s OAuth. agentlink stores and refreshes platform tokens encrypted; they are never exposed to agents or API responses.')}</p>`
    }),

    'connect-channels': () => ({
      title: T('채널 연결', 'Connecting channels'),
      body: `
<p class="lead">${T('소셜 계정은 대시보드에서 연결합니다. 연결 직전에 요청 권한과 연결 후 가능한 행동을 요약해 보여줍니다.', 'Connect social accounts in the dashboard. Before connecting you see the requested permissions and what becomes possible.')}</p>
<h2>${T('연결 상태', 'Connection states')}</h2>
<div class="table-wrap"><table><thead><tr><th>${T('상태', 'State')}</th><th>${T('의미', 'Meaning')}</th><th>${T('필요한 조치', 'Action')}</th></tr></thead><tbody>
<tr><td>${AL.statusBadge('connected', T('연결됨', 'Connected'))}</td><td>${T('발행 가능', 'Ready to publish')}</td><td>-</td></tr>
<tr><td>${AL.statusBadge('reauth', T('재인증 필요', 'Re-auth needed'))}</td><td>${T('토큰 만료 또는 권한 변경', 'Token expired or permission changed')}</td><td>${T('재인증 버튼으로 다시 승인', 'Re-approve with Re-authenticate')}</td></tr>
<tr><td>${AL.statusBadge('failed', T('연결 해제됨', 'Disconnected'))}</td><td>${T('토큰 폐기됨', 'Token revoked')}</td><td>${T('다시 연결', 'Connect again')}</td></tr>
</tbody></table></div>
<h2>${T('채널별 연결 방식', 'Per-channel auth')}</h2>
<ul>${AL.CHANNELS.map((c) => `<li><a href="#/docs/${c.id}">${c.name}</a> — ${esc(L(c.auth))}</li>`).join('')}</ul>
<a class="btn btn-primary" href="#/dashboard/accounts">${T('대시보드에서 연결', 'Connect in dashboard')}</a>`
    }),

    'agent-publish': () => ({
      title: T('에이전트로 발행', 'Publishing via agent'),
      body: `
<p class="lead">${T('에이전트에게 자연어로 요청하면 에이전트가 도구를 순서대로 호출합니다.', 'Ask in natural language and your agent calls the tools in order.')}</p>
<h2>${T('요청 예시', 'Example prompts')}</h2>
<ul>
  <li>“${T('이번 주 이벤트 공지 써서 연결된 모든 계정에 올려줘', 'Write this week’s event notice and post to all connected accounts')}”</li>
  <li>“${T('이 영상을 YouTube에 올리고, 요약 글은 Threads에 올려줘', 'Upload this video to YouTube and post a summary to Threads')}”</li>
  <li>“${T('어제 실패한 게시물만 다시 올려줘', 'Retry only the posts that failed yesterday')}”</li>
</ul>
<h2>${T('일반적인 도구 호출 순서', 'Typical tool sequence')}</h2>
${AL.code('list_accounts()\nvalidate_post(text, media, account_ids)   # 채널별 규격 확인 / check rules\ncreate_post(text, media, account_ids)     # 계정별 결과 반환 / per-account results\nretry_post(post_id, failed_only=true)     # 재시도 가능한 실패만 / retryable only', 'MCP')}
<h2>${T('결과 읽기', 'Reading results')}</h2>
<p>${T('전체 상태는 다음 중 하나입니다.', 'Overall status is one of:')}</p>
<div class="chip-row" style="margin-bottom:16px">${AL.statusBadge('publishing', T('발행 중', 'publishing'))}${AL.statusBadge('success', T('성공', 'success'))}${AL.statusBadge('partial', T('부분 성공', 'partial'))}${AL.statusBadge('retrying', T('재시도 중', 'retrying'))}${AL.statusBadge('failed', T('최종 실패', 'failed'))}</div>
<p>${T('부분 성공이면 계정별 결과에서 실패 사유와 재시도 가능 여부를 확인하세요.', 'On partial, check each account’s error and whether it is retryable.')} <a href="#/docs/errors">${T('오류 코드', 'Error codes')}</a></p>`
    }),

    'api-posts': () => ({
      title: T('발행 API', 'Posts API'),
      body: `
<p class="lead">${T('Base URL', 'Base URL')}: <code>${B}</code> · ${T('인증', 'Auth')}: <code>Authorization: Bearer &lt;API_KEY&gt;</code></p>
${endpoint('POST', '/posts', T('하나 이상의 계정에 게시물을 발행합니다. 발행 전 채널 규격을 검사하며, 검증에 실패한 계정은 발행되지 않고 <code>validation_failed</code>로 반환됩니다.', 'Publish to one or more accounts. Rules are validated first; accounts failing validation are not posted and return <code>validation_failed</code>.'))}
<div class="table-wrap"><table><thead><tr><th>${T('필드', 'Field')}</th><th>${T('타입', 'Type')}</th><th>${T('설명', 'Description')}</th></tr></thead><tbody>
<tr><td><code>text</code></td><td>string</td><td>${T('본문. 채널별 글자 수 제한 적용', 'Body. Per-channel limits apply')}</td></tr>
<tr><td><code>account_ids</code></td><td>string[]</td><td>${T('필수. 대상 계정 ID', 'Required. Target account IDs')}</td></tr>
<tr><td><code>media_ids</code></td><td>string[]</td><td>${T('업로드한 미디어 ID', 'Uploaded media IDs')}</td></tr>
<tr><td><code>overrides</code></td><td>object</td><td>${T('채널별 본문 덮어쓰기 (예: <code>{"threads": {"text": "..."}}</code>)', 'Per-channel text overrides')}</td></tr>
<tr><td><code>scheduled_at</code></td><td>datetime</td><td>${AL.statusBadge('beta')} ${T('예약 발행 시각', 'Scheduled time')}</td></tr>
</tbody></table></div>
<p class="small muted">${T('<code>Idempotency-Key</code> 헤더를 보내면 같은 요청의 중복 발행을 막습니다.', 'Send <code>Idempotency-Key</code> to prevent duplicate posts.')}</p>
${AL.code(sampleReq, T('요청', 'Request'))}
${AL.code(sampleRes, T('응답 · 207 Multi-Status', 'Response · 207 Multi-Status'))}
${endpoint('POST', '/posts/validate', T('발행하지 않고 채널 규격만 검사합니다.', 'Validate only, without publishing.'))}
${endpoint('GET', '/posts/{id}', T('게시 요청의 전체 상태와 계정별 결과를 조회합니다.', 'Get overall status and per-account results.'))}
${endpoint('POST', '/posts/{id}/retry', T('재시도 가능한 오류로 실패한 계정만 다시 발행합니다. 성공한 계정은 다시 게시되지 않습니다.', 'Retry only accounts that failed with retryable errors. Successful accounts are never reposted.'))}
${AL.code(`curl -X POST ${B}/posts/post_91ab/retry \\\n  -H "Authorization: Bearer $AGENTLINK_API_KEY" \\\n  -d '{ "account_ids": ["acc_fb_01"] }'`, T('요청', 'Request'))}
${endpoint('GET', '/posts', T('발행 이력을 조회합니다. <code>status</code>, <code>channel</code>, <code>from</code>, <code>to</code>, <code>cursor</code> 필터를 지원합니다.', 'List history. Filters: <code>status</code>, <code>channel</code>, <code>from</code>, <code>to</code>, <code>cursor</code>.'))}
${endpoint('GET', '/accounts', T('연결된 소셜 계정과 상태(<code>connected</code>, <code>reauth_required</code>)를 조회합니다.', 'List connected accounts and status (<code>connected</code>, <code>reauth_required</code>).'))}`
    }),

    'api-media': () => ({
      title: T('미디어 API', 'Media API'),
      body: `
<p class="lead">${T('이미지·동영상을 먼저 업로드하고 받은 <code>media_id</code>를 발행 요청에 사용합니다.', 'Upload images/videos first, then use the returned <code>media_id</code> when posting.')}</p>
${endpoint('POST', '/media', T('파일을 업로드합니다(multipart). 큰 동영상은 <code>/media/uploads</code>로 업로드 URL을 받아 직접 업로드하세요.', 'Upload a file (multipart). For large videos, get an upload URL from <code>/media/uploads</code>.'))}
${AL.code(`curl -X POST ${B}/media \\\n  -H "Authorization: Bearer $AGENTLINK_API_KEY" \\\n  -F "file=@launch.jpg"`, T('요청', 'Request'))}
${AL.code(`{ "id": "med_8f2a", "type": "image", "ext": "jpg", "size": 482113, "status": "ready" }`, T('응답', 'Response'))}
${endpoint('POST', '/media/uploads', T('대용량 업로드용 서명 URL을 발급합니다.', 'Issue a signed URL for large uploads.'))}
${endpoint('GET', '/media/{id}', T('처리 상태(<code>processing</code>, <code>ready</code>, <code>failed</code>)를 조회합니다.', 'Get processing status.'))}
<h2>${T('채널별 허용 형식', 'Allowed formats by channel')}</h2>
<ul>${AL.CHANNELS.map((c) => `<li>${c.name}: ${c.media.types.join(', ')} · ${T('최대', 'max')} ${c.media.max}${T('개', '')}${c.media.required ? ' · <strong>' + T('필수', 'required') + '</strong>' : ''}</li>`).join('')}</ul>`
    }),

    'api-automations': () => ({
      title: T('자동화 API', 'Automations API'),
      status: 'beta',
      body: `
<div class="callout warn"><strong>${AL.L(AL.STATUS.beta)}</strong>${T('자동화는 베타 기능입니다. 요청·응답 형식이 바뀔 수 있습니다.', 'Automations are in beta. Request/response shapes may change.')}</div>
<p>${T('반복 발행 규칙(예: 매주 월요일 9시 공지)을 등록합니다.', 'Register recurring publishing rules (e.g. every Monday 9am).')}</p>
${endpoint('POST', '/automations', T('자동화를 생성합니다.', 'Create an automation.'))}
${AL.code(`{\n  "name": "weekly-notice",\n  "schedule": "0 9 * * MON",\n  "timezone": "Asia/Seoul",\n  "account_ids": ["acc_threads_01"],\n  "template": { "text": "이번 주 소식 …" }\n}`, 'JSON')}
${endpoint('GET', '/automations', T('자동화 목록을 조회합니다.', 'List automations.'))}
${endpoint('PATCH', '/automations/{id}', T('일시정지·재개·수정합니다.', 'Pause, resume or edit.'))}
${endpoint('DELETE', '/automations/{id}', T('자동화를 삭제합니다.', 'Delete an automation.'))}`
    }),

    'api-engagement': () => ({
      title: T('답글·지표 API', 'Replies & metrics API'),
      status: 'beta',
      body: `
<p>${T('채널별 지원 여부가 다릅니다.', 'Support varies by channel.')}</p>
<div class="table-wrap"><table><thead><tr><th>${T('채널', 'Channel')}</th><th>${L(AL.CAP_LABELS.replies)}</th><th>${L(AL.CAP_LABELS.metrics)}</th></tr></thead><tbody>
${AL.CHANNELS.map((c) => `<tr><td>${c.name}</td><td>${AL.statusBadge(c.caps.replies)}</td><td>${AL.statusBadge(c.caps.metrics)}</td></tr>`).join('')}
</tbody></table></div>
${endpoint('GET', '/posts/{id}/replies', `${AL.statusBadge('beta')} ${T('게시물의 답글·댓글을 조회합니다.', 'List replies/comments on a post.')}`)}
${endpoint('POST', '/posts/{id}/replies', `${AL.statusBadge('beta')} ${T('답글을 작성합니다.', 'Post a reply.')}`)}
${endpoint('GET', '/posts/{id}/metrics', `${AL.statusBadge('planned')} ${T('조회수·반응 지표 (예정)', 'Views and engagement (planned)')}`)}`
    }),

    'api-inbox': () => ({
      title: T('인박스·연락처 API', 'Inbox & contacts API'),
      status: 'planned',
      body: `
<div class="callout"><strong>${L(AL.STATUS.planned)}</strong>${T('아직 제공되지 않는 기능입니다. 공개 전까지 아래 명세는 변경될 수 있습니다.', 'Not yet available. The spec below may change before release.')}</div>
${endpoint('GET', '/inbox/threads', T('채널 통합 메시지 스레드 목록', 'Unified message threads'))}
${endpoint('POST', '/inbox/threads/{id}/messages', T('메시지 답장', 'Reply to a message'))}
${endpoint('GET', '/contacts', T('대화한 연락처 목록', 'Contacts list'))}`
    }),

    'api-platforms': () => ({
      title: T('플랫폼 API', 'Platforms API'),
      body: `
<p>${T('지원 채널과 규격을 조회합니다. 이 응답은 사이트의 채널 표·문서와 같은 원천에서 생성됩니다.', 'Get supported channels and rules. Generated from the same source as the site’s channel tables.')}</p>
${endpoint('GET', '/platforms', T('지원 채널 목록과 규격', 'Channels and rules'))}
${AL.code(JSON.stringify(AL.CHANNELS.slice(0, 2).map((c) => ({ id: c.id, status: c.status, text_limit: c.textLimit, media: c.media, capabilities: c.caps })), null, 2), T('응답 (일부)', 'Response (excerpt)'))}`
    }),

    errors: () => ({
      title: T('오류 코드', 'Errors'),
      body: `
<p class="lead">${T('모든 오류는 같은 형식으로 반환됩니다. 다중 채널 발행에서는 계정별 결과 안에 포함됩니다.', 'All errors share one shape. For multi-channel posts they appear inside each account result.')}</p>
${AL.code(`{ "error": { "code": "rate_limited", "message": "...", "retryable": true, "retry_after": 60 } }`, 'JSON')}
<div class="table-wrap"><table><thead><tr><th>${T('코드', 'Code')}</th><th>HTTP</th><th>${T('재시도', 'Retry')}</th><th>${T('의미', 'Meaning')}</th><th>${T('해결', 'Fix')}</th></tr></thead><tbody>
${AL.ERRORS.map((e) => `<tr><td><code>${e.code}</code></td><td>${e.http}</td><td>${e.retry ? AL.statusBadge('available', T('가능', 'Yes')) : AL.statusBadge('unsupported', T('불가', 'No'))}</td><td>${L(e.desc)}</td><td class="small">${L(e.fix)}</td></tr>`).join('')}
</tbody></table></div>`
    })
  };

  function channelDoc(ch) {
    const caps = Object.keys(AL.CAP_LABELS);
    return {
      title: T(`${ch.name} 채널 안내`, `${ch.name} guide`),
      status: ch.status !== 'available' ? ch.status : null,
      body: `
<p class="lead">${AL.chIcon(ch, 'lg')} &nbsp;${T(`${ch.name} 계정 연결 권한, 콘텐츠 형식, 제한과 API 지원 범위입니다.`, `Permissions, content formats, limits and API support for ${ch.name}.`)}</p>
<div class="meta-grid">
  <div class="card"><div class="label">${T('상태', 'Status')}</div><div class="value">${AL.statusBadge(ch.status)}</div></div>
  <div class="card"><div class="label">${T('글자 수', 'Text limit')}</div><div class="value">${AL.num(ch.textLimit)}</div></div>
  <div class="card"><div class="label">${T('미디어', 'Media')}</div><div class="value">${ch.media.required ? T('필수', 'Required') : T('선택', 'Optional')} · ${ch.media.max}</div></div>
  <div class="card"><div class="label">${T('인증', 'Auth')}</div><div class="value small">${esc(L(ch.auth))}</div></div>
</div>
<h2>${T('요청 권한', 'Requested permissions')}</h2>
<ul>${L(ch.scopes).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
<h2>${T('콘텐츠 형식', 'Content formats')}</h2>
<ul>
  <li>${T('본문', 'Text')}: ${T('최대', 'up to')} ${AL.num(ch.textLimit)}${T('자', ' chars')}</li>
  <li>${T('미디어', 'Media')}: ${ch.media.types.join(', ')} · ${T('최대', 'max')} ${ch.media.max}${T('개', '')} ${ch.media.required ? '· <strong>' + T('최소 1개 필수', 'at least 1 required') + '</strong>' : ''}</li>
</ul>
<h2>${T('제한 및 참고', 'Limits & notes')}</h2>
<ul>${L(ch.notes).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
<h2>${T('API 지원 범위', 'API support')}</h2>
<div class="table-wrap"><table><thead><tr>${caps.map((c) => `<th>${L(AL.CAP_LABELS[c])}</th>`).join('')}</tr></thead><tbody><tr>${caps.map((k) => `<td>${AL.statusBadge(ch.caps[k])}</td>`).join('')}</tr></tbody></table></div>
<p style="margin-top:24px"><a class="btn btn-primary" href="#/dashboard/accounts">${T(`${ch.name} 연결하기`, `Connect ${ch.name}`)}</a></p>`
    };
  }

  AL.pages.docs = function ({ page }) {
    page = page || 'mcp';
    const ch = AL.findChannel(page);
    const def = ch ? channelDoc(ch) : PAGES[page] && PAGES[page]();
    if (!def) return AL.pages.notFound();
    const groups = nav();
    const flat = groups.flatMap((g) => g.items);
    const idx = flat.findIndex((i) => i[0] === page);
    const prev = flat[idx - 1];
    const next = flat[idx + 1];
    const href = (id) => (id === 'mcp' ? '#/docs' : '#/docs/' + id);
    const group = groups.find((g) => g.items.some((i) => i[0] === page));
    return {
      title: def.title + ' · ' + T('문서', 'Docs'),
      description: def.title,
      html: `
<div class="container docs-layout">
  <div>
    <button class="btn btn-secondary btn-sm docs-nav-toggle" aria-expanded="false" aria-controls="docs-nav">☰ ${T('문서 목차', 'Docs menu')}</button>
    <nav class="docs-nav" id="docs-nav" aria-label="${T('문서 목차', 'Docs')}">
      ${groups.map((g) => `<h5>${g.group}</h5>${g.items.map(([id, label, st]) => `<a href="${href(id)}" class="${id === page ? 'active' : ''}" ${id === page ? 'aria-current="page"' : ''}>${label}${st ? AL.statusBadge(st) : ''}</a>`).join('')}`).join('')}
    </nav>
  </div>
  <article class="prose">
    <div class="breadcrumb"><a href="#/docs">${T('문서', 'Docs')}</a> / ${group ? group.group : ''}</div>
    <h1>${def.title} ${def.status ? AL.statusBadge(def.status) : ''}</h1>
    ${def.body}
    <div class="doc-pager">
      ${prev ? `<a href="${href(prev[0])}"><small>← ${T('이전', 'Previous')}</small>${prev[1]}</a>` : '<span></span>'}
      ${next ? `<a class="next" href="${href(next[0])}"><small>${T('다음', 'Next')} →</small>${next[1]}</a>` : '<span></span>'}
    </div>
  </article>
</div>`,
      mount() {
        const tog = document.querySelector('.docs-nav-toggle');
        tog.onclick = () => tog.setAttribute('aria-expanded', document.getElementById('docs-nav').classList.toggle('open'));
      }
    };
  };
})();
