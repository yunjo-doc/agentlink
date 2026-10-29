/* 라우트 등록 (기획서 4장 사이트맵) */
(function () {
  const P = AL.pages;
  AL.route('/', P.home);
  AL.route('/integrations', P.integrations);
  AL.route('/integrations/:id', P.integration);
  AL.route('/channels', P.channels);
  AL.route('/compare', P.compare);
  AL.route('/blog', P.blog);
  AL.route('/blog/:slug', P.blogPost);
  AL.route('/docs', P.docs);
  AL.route('/docs/:page', P.docs);
  AL.route('/login', P.login);
  AL.route('/signup', P.signup);
  AL.route('/dashboard', P.dashboard);
  AL.route('/dashboard/:tab', P.dashboard);
  AL.route('/legal/:page', P.legal);

  // 로그인 세션을 확인한 뒤 첫 화면을 그린다
  AL.api('GET', '/api/me').then((r) => {
    AL.apiOffline = r.status === 0;
    AL.session = r.ok ? r.data.user : null;
    AL.render();
  });
})();
