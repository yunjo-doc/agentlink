/*
 * 단일 관리 원천 (Single source of truth)
 * 지원 채널, 수치, 기능 상태는 이 파일에서만 갱신한다. 홈·채널·문서·대시보드·검증 로직이 모두 이 값을 참조한다.
 * 기획서 11장에 따라 아래 수치는 운영 중인 제품과 대조해 확정해야 하는 기획용 기본값이다.
 */
window.AL = window.AL || {};

AL.MCP_URL = 'https://mcp.agentlink.com/mcp';
AL.API_BASE = 'https://api.agentlink.com/v1';

// 공통 상태 용어 (제공 중 / 베타 / 예정 / 미지원)
AL.STATUS = {
  available: { ko: '제공 중', en: 'Available' },
  beta: { ko: '베타', en: 'Beta' },
  planned: { ko: '예정', en: 'Planned' },
  unsupported: { ko: '미지원', en: 'Not supported' }
};

// 기능별 현재 제공 상태 (홈 데모 하단, 비교 페이지, 문서에 동일하게 노출)
AL.FEATURES = [
  { id: 'publish', status: 'available', name: { ko: '실제 발행', en: 'Publishing' } },
  { id: 'validate', status: 'available', name: { ko: '규격 사전 검증', en: 'Pre-validation' } },
  { id: 'retry', status: 'available', name: { ko: '실패 채널 재시도', en: 'Retry failed channels' } },
  { id: 'schedule', status: 'beta', name: { ko: '예약 발행', en: 'Scheduling' } },
  { id: 'automation', status: 'beta', name: { ko: '자동화', en: 'Automations' } },
  { id: 'metrics', status: 'planned', name: { ko: '지표', en: 'Metrics' } }
];

const MEDIA_IMG = ['jpg', 'jpeg', 'png'];
const MEDIA_VID = ['mp4', 'mov'];

AL.CHANNELS = [
  {
    id: 'threads', name: 'Threads', short: 'Th', color: '#111111', status: 'available',
    textLimit: 500, media: { required: false, max: 10, types: [...MEDIA_IMG, ...MEDIA_VID] },
    auth: 'Meta OAuth',
    scopes: { ko: ['프로필 기본 정보 읽기', '게시물 작성 및 발행', '게시물 답글 읽기'], en: ['Read basic profile', 'Create and publish posts', 'Read replies'] },
    caps: { publish: 'available', schedule: 'beta', replies: 'beta', metrics: 'planned' },
    notes: { ko: ['텍스트만 게시하거나 이미지·동영상을 최대 10개까지 캐러셀로 첨부할 수 있습니다.', '링크는 본문에 포함하면 플랫폼이 미리보기를 생성합니다.', '24시간 내 게시 수에 플랫폼 제한이 있습니다.'], en: ['Post text only, or attach up to 10 images/videos as a carousel.', 'Links in the body get a platform-generated preview.', 'The platform limits posts per 24 hours.'] }
  },
  {
    id: 'instagram', name: 'Instagram', short: 'Ig', color: '#d62976', status: 'available',
    textLimit: 2200, media: { required: true, max: 10, types: [...MEDIA_IMG, ...MEDIA_VID] },
    auth: 'Meta OAuth (Business/Creator)',
    scopes: { ko: ['비즈니스 계정 기본 정보 읽기', '콘텐츠 게시', '댓글 읽기'], en: ['Read business account info', 'Publish content', 'Read comments'] },
    caps: { publish: 'available', schedule: 'beta', replies: 'beta', metrics: 'planned' },
    notes: { ko: ['비즈니스 또는 크리에이터 계정만 연결할 수 있습니다.', '이미지 또는 동영상이 최소 1개 필요합니다. 텍스트 단독 게시는 지원하지 않습니다.', '스토리 게시는 API에서 지원하지 않습니다.'], en: ['Only Business or Creator accounts can be connected.', 'At least one image or video is required. Text-only posts are not supported.', 'Stories are not supported via the API.'] }
  },
  {
    id: 'youtube', name: 'YouTube', short: 'Yt', color: '#e62117', status: 'available',
    textLimit: 5000, media: { required: true, max: 1, types: MEDIA_VID },
    auth: 'Google OAuth',
    scopes: { ko: ['채널 기본 정보 읽기', '동영상 업로드', '동영상 메타데이터 수정'], en: ['Read channel info', 'Upload videos', 'Edit video metadata'] },
    caps: { publish: 'available', schedule: 'beta', replies: 'unsupported', metrics: 'planned' },
    notes: { ko: ['동영상 1개가 필수이며 본문 첫 줄(최대 100자)이 제목, 나머지가 설명으로 사용됩니다.', '커뮤니티 게시물은 API에서 지원하지 않습니다.', '일일 업로드 할당량을 초과하면 다음 날 재시도해야 합니다.'], en: ['One video is required. The first line (max 100 chars) becomes the title, the rest the description.', 'Community posts are not supported via the API.', 'If the daily upload quota is exceeded, retry the next day.'] }
  },
  {
    id: 'facebook', name: 'Facebook', short: 'Fb', color: '#1877f2', status: 'available',
    textLimit: 63206, media: { required: false, max: 10, types: [...MEDIA_IMG, ...MEDIA_VID] },
    auth: 'Meta OAuth (Page)',
    scopes: { ko: ['관리 중인 페이지 목록 읽기', '페이지에 게시', '페이지 댓글 읽기'], en: ['List managed Pages', 'Publish to Pages', 'Read Page comments'] },
    caps: { publish: 'available', schedule: 'beta', replies: 'beta', metrics: 'planned' },
    notes: { ko: ['개인 프로필이 아닌 페이지에만 게시할 수 있습니다.', '페이지 관리자 권한이 변경되면 재인증이 필요합니다.'], en: ['Posts can only be made to Pages, not personal profiles.', 'Re-authentication is required if your Page admin role changes.'] }
  },
  {
    id: 'telegram', name: 'Telegram', short: 'Tg', color: '#229ed9', status: 'available',
    textLimit: 4096, media: { required: false, max: 10, types: [...MEDIA_IMG, ...MEDIA_VID] },
    auth: { ko: '봇 토큰 + 채널 관리자 추가', en: 'Bot token + add as channel admin' },
    scopes: { ko: ['채널에 메시지 게시', '채널 정보 읽기'], en: ['Post messages to channel', 'Read channel info'] },
    caps: { publish: 'available', schedule: 'beta', replies: 'unsupported', metrics: 'unsupported' },
    notes: { ko: ['OAuth 대신 agentlink 봇을 채널 관리자로 추가해 연결합니다.', '미디어 첨부 시 캡션은 1,024자로 제한됩니다.'], en: ['Instead of OAuth, connect by adding the agentlink bot as a channel admin.', 'Captions are limited to 1,024 characters when media is attached.'] }
  },
  {
    id: 'naverblog', name: 'Naver Blog', short: 'N', color: '#03c75a', status: 'beta',
    textLimit: 50000, media: { required: false, max: 20, types: MEDIA_IMG },
    auth: 'Naver OAuth',
    scopes: { ko: ['블로그 기본 정보 읽기', '블로그 글쓰기'], en: ['Read blog info', 'Write blog posts'] },
    caps: { publish: 'beta', schedule: 'unsupported', replies: 'unsupported', metrics: 'unsupported' },
    notes: { ko: ['베타 채널입니다. 서식은 일부만 유지되며 결과를 블로그에서 확인하세요.', '동영상 첨부는 지원하지 않습니다.', '본문 첫 줄이 글 제목으로 사용됩니다.'], en: ['Beta channel. Only some formatting is preserved; check the result on your blog.', 'Video attachments are not supported.', 'The first line of the body is used as the post title.'] }
  }
];

AL.CAP_LABELS = {
  publish: { ko: '발행', en: 'Publish' },
  schedule: { ko: '예약', en: 'Schedule' },
  replies: { ko: '답글', en: 'Replies' },
  metrics: { ko: '지표', en: 'Metrics' }
};

// 에이전트별 설정 가이드 (동일 템플릿: 난이도, 준비물, 단계, 완료 확인)
AL.AGENTS = [
  {
    id: 'claude-code', name: 'Claude Code', short: 'CC', color: '#d97757', difficulty: 'easy', stepsCount: 3,
    prereq: { ko: ['Claude Code CLI 설치', 'agentlink 계정'], en: ['Claude Code CLI installed', 'An agentlink account'] },
    steps: {
      ko: ['터미널에서 아래 명령으로 MCP 서버를 추가합니다.', 'Claude Code에서 /mcp 를 실행하고 agentlink를 선택해 인증합니다. 브라우저가 열리면 승인합니다.', '"연결된 소셜 계정 보여줘"라고 요청해 계정 목록이 나오는지 확인합니다.'],
      en: ['Add the MCP server with the command below.', 'Run /mcp in Claude Code, select agentlink and authenticate. Approve in the browser that opens.', 'Ask "Show my connected social accounts" and check that the list appears.']
    },
    snippet: { label: 'Terminal', code: 'claude mcp add --transport http agentlink ' + AL.MCP_URL }
  },
  {
    id: 'claude', name: 'Claude', short: 'C', color: '#c96442', difficulty: 'easy', stepsCount: 3,
    prereq: { ko: ['Claude 웹 또는 데스크톱 앱', '커스텀 커넥터를 추가할 수 있는 플랜'], en: ['Claude web or desktop app', 'A plan that allows custom connectors'] },
    steps: {
      ko: ['설정 → 커넥터 → 커스텀 커넥터 추가를 엽니다.', '이름에 agentlink, URL에 서버 주소를 붙여넣고 연결을 누른 뒤 브라우저에서 승인합니다.', '새 대화에서 "연결된 소셜 계정 보여줘"라고 요청해 확인합니다.'],
      en: ['Open Settings → Connectors → Add custom connector.', 'Name it agentlink, paste the server URL, click Connect and approve in the browser.', 'In a new chat, ask "Show my connected social accounts".']
    },
    snippet: { label: 'Server URL', code: AL.MCP_URL }
  },
  {
    id: 'chatgpt', name: 'ChatGPT', short: 'G', color: '#10a37f', difficulty: 'normal', stepsCount: 4,
    prereq: { ko: ['ChatGPT 계정', '개발자 모드(커넥터) 사용 가능 여부 확인'], en: ['A ChatGPT account', 'Developer mode (connectors) available'] },
    steps: {
      ko: ['설정 → 앱/커넥터 → 고급에서 개발자 모드를 켭니다.', '커넥터 만들기에서 서버 URL을 입력하고 인증 방식으로 OAuth를 선택합니다.', '브라우저 승인 화면에서 agentlink 권한을 허용합니다.', '대화창에서 agentlink 커넥터를 켜고 계정 목록을 요청해 확인합니다.'],
      en: ['Enable developer mode under Settings → Apps/Connectors → Advanced.', 'Create a connector with the server URL and choose OAuth.', 'Allow agentlink permissions on the browser consent screen.', 'Enable the agentlink connector in a chat and ask for your accounts.']
    },
    snippet: { label: 'Server URL', code: AL.MCP_URL }
  },
  {
    id: 'codex', name: 'Codex', short: 'Cx', color: '#3b3b3b', difficulty: 'normal', stepsCount: 3,
    prereq: { ko: ['Codex CLI 설치', '~/.codex/config.toml 편집 권한'], en: ['Codex CLI installed', 'Ability to edit ~/.codex/config.toml'] },
    steps: {
      ko: ['config.toml에 아래 설정을 추가합니다.', 'Codex를 재시작하고 안내에 따라 브라우저에서 agentlink 로그인을 승인합니다.', '"agentlink로 연결된 계정 조회해줘"라고 요청해 확인합니다.'],
      en: ['Add the config below to config.toml.', 'Restart Codex and approve the agentlink login in the browser.', 'Ask "List my agentlink accounts" to verify.']
    },
    snippet: { label: '~/.codex/config.toml', code: '[mcp_servers.agentlink]\nurl = "' + AL.MCP_URL + '"' }
  },
  {
    id: 'openclaw', name: 'OpenClaw', short: 'OC', color: '#7c3aed', difficulty: 'advanced', stepsCount: 3,
    prereq: { ko: ['OpenClaw 설치 및 설정 파일 접근', '원격 MCP(HTTP) 지원 버전'], en: ['OpenClaw installed with config access', 'A version that supports remote MCP (HTTP)'] },
    steps: {
      ko: ['MCP 서버 설정에 agentlink 항목을 추가합니다.', '에이전트를 다시 시작하고 표시되는 인증 링크를 열어 승인합니다.', '계정 조회 도구(list_accounts)가 목록에 보이는지 확인합니다.'],
      en: ['Add an agentlink entry to your MCP server config.', 'Restart the agent and open the auth link to approve.', 'Check that the list_accounts tool is available.']
    },
    snippet: { label: 'mcp.json', code: '{\n  "mcpServers": {\n    "agentlink": { "type": "http", "url": "' + AL.MCP_URL + '" }\n  }\n}' }
  },
  {
    id: 'hermes', name: 'Hermes', short: 'H', color: '#0891b2', difficulty: 'advanced', stepsCount: 3,
    prereq: { ko: ['Hermes 에이전트 설치', '원격 MCP(HTTP) 지원 버전'], en: ['Hermes agent installed', 'A version that supports remote MCP (HTTP)'] },
    steps: {
      ko: ['설정의 MCP 서버 목록에 agentlink 서버 주소를 추가합니다.', '에이전트 재시작 후 브라우저 인증을 완료합니다.', '"연결된 계정 보여줘"라고 요청해 확인합니다.'],
      en: ['Add the agentlink server URL to the MCP servers in config.', 'Restart the agent and complete browser auth.', 'Ask "Show my connected accounts" to verify.']
    },
    snippet: { label: 'config.yaml', code: 'mcp_servers:\n  agentlink:\n    url: ' + AL.MCP_URL }
  }
];

AL.DIFFICULTY = {
  easy: { ko: '쉬움', en: 'Easy' },
  normal: { ko: '보통', en: 'Medium' },
  advanced: { ko: '고급', en: 'Advanced' }
};

// MCP 도구 (에이전트가 호출하는 공통 인터페이스)
AL.MCP_TOOLS = [
  { name: 'list_accounts', desc: { ko: '연결된 소셜 계정과 상태를 조회합니다.', en: 'List connected social accounts and their status.' } },
  { name: 'validate_post', desc: { ko: '발행 전에 채널별 규격을 검사합니다.', en: 'Check per-channel requirements before publishing.' } },
  { name: 'create_post', desc: { ko: '하나 이상의 계정에 게시물을 발행합니다.', en: 'Publish a post to one or more accounts.' } },
  { name: 'get_post', desc: { ko: '게시 요청의 계정별 결과를 조회합니다.', en: 'Get per-account results of a post request.' } },
  { name: 'retry_post', desc: { ko: '실패한 계정만 다시 발행합니다.', en: 'Retry only the failed accounts.' } },
  { name: 'list_posts', desc: { ko: '발행 이력을 조회합니다.', en: 'List publishing history.' } },
  { name: 'upload_media', desc: { ko: '이미지·동영상을 업로드하고 media_id를 받습니다.', en: 'Upload an image/video and get a media_id.' } }
];

// 오류 코드 (문서·대시보드·시뮬레이션 공통)
AL.ERRORS = [
  { code: 'validation_failed', http: 422, retry: false, desc: { ko: '채널 규격(글자 수, 미디어 수·형식, 필수 미디어)을 충족하지 않습니다.', en: 'Content does not meet channel requirements (length, media count/type, required media).' }, fix: { ko: '검증 결과의 항목을 수정한 뒤 다시 요청하세요.', en: 'Fix the listed items and request again.' } },
  { code: 'token_expired', http: 401, retry: false, desc: { ko: '소셜 계정의 인증이 만료됐거나 권한이 취소됐습니다.', en: 'The social account authorization expired or was revoked.' }, fix: { ko: '대시보드에서 해당 계정을 재인증한 뒤 재시도하세요.', en: 'Re-authenticate the account in the dashboard, then retry.' } },
  { code: 'rate_limited', http: 429, retry: true, desc: { ko: '플랫폼 호출 한도를 초과했습니다.', en: 'Platform rate limit exceeded.' }, fix: { ko: 'retry_after 이후 실패 채널만 재시도하세요.', en: 'Retry failed channels after retry_after.' } },
  { code: 'platform_unavailable', http: 503, retry: true, desc: { ko: '플랫폼 API가 일시적으로 응답하지 않습니다.', en: 'The platform API is temporarily unavailable.' }, fix: { ko: '잠시 후 실패 채널만 재시도하세요.', en: 'Retry failed channels after a moment.' } },
  { code: 'media_processing_failed', http: 422, retry: true, desc: { ko: '플랫폼에서 미디어 처리에 실패했습니다.', en: 'The platform failed to process the media.' }, fix: { ko: '파일 형식·코덱을 확인하고 재시도하세요.', en: 'Check file format/codec and retry.' } },
  { code: 'account_not_found', http: 404, retry: false, desc: { ko: '대상 계정이 워크스페이스에 연결돼 있지 않습니다.', en: 'Target account is not connected to the workspace.' }, fix: { ko: 'list_accounts로 계정 ID를 확인하세요.', en: 'Check account IDs with list_accounts.' } },
  { code: 'unauthorized', http: 401, retry: false, desc: { ko: 'API 키 또는 MCP 액세스 토큰이 없거나 유효하지 않습니다.', en: 'API key or MCP access token missing or invalid.' }, fix: { ko: '키를 다시 발급하거나 에이전트 연결을 재승인하세요.', en: 'Reissue the key or re-approve the agent connection.' } }
];

AL.findChannel = (id) => AL.CHANNELS.find((c) => c.id === id);
AL.findAgent = (id) => AL.AGENTS.find((a) => a.id === id);
AL.findError = (code) => AL.ERRORS.find((e) => e.code === code);

/*
 * 채널 규격 검증 (FR-05). 대시보드 발행, 문서 예시, 홈 데모가 모두 이 함수를 사용한다.
 * post = { text, media: [{ name, ext }] }
 */
AL.validateForChannel = function (channelId, post) {
  const ch = AL.findChannel(channelId);
  const checks = [];
  const len = [...(post.text || '')].length;
  let limit = ch.textLimit;
  if (ch.id === 'telegram' && post.media.length) limit = 1024;
  checks.push({ ok: len <= limit, key: 'length', len, limit });
  if (ch.id === 'youtube' || ch.id === 'naverblog') {
    const first = (post.text || '').split('\n')[0];
    const tlim = 100;
    checks.push({ ok: first.trim().length > 0 && [...first].length <= tlim, key: 'title', len: [...first].length, limit: tlim });
  }
  if (ch.media.required) checks.push({ ok: post.media.length > 0, key: 'mediaRequired' });
  checks.push({ ok: post.media.length <= ch.media.max, key: 'mediaMax', count: post.media.length, limit: ch.media.max });
  const badTypes = post.media.filter((m) => !ch.media.types.includes(m.ext)).map((m) => m.ext);
  checks.push({ ok: badTypes.length === 0, key: 'mediaType', bad: [...new Set(badTypes)], allowed: ch.media.types });
  if (!ch.media.required && !len && !post.media.length) checks.push({ ok: false, key: 'empty' });
  return { ok: checks.every((c) => c.ok), checks };
};
