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
  AL.route('/dashboard', P.dashboard);
  AL.route('/dashboard/:tab', P.dashboard);
  AL.route('/legal/:page', P.legal);
  AL.render();
})();
