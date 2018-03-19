import escapeHtml from 'escape-html';

export default (page) => {
  return `<!DOCTYPE html>
  <html class="no-js" lang="${page.lang}">
    <head>
      <base href="/">
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <meta name="description" content="${escapeHtml(page.description)}">
      <link rel="icon" href="/favicon.ico">

      <meta name="twitter:card" content="${escapeHtml(page.title)}">

      <meta property="og:title" content="${escapeHtml(page.title)}">
      <meta property="og:site_name" content="JiveCake">
      <meta property="og:description" content="${escapeHtml(page.description)}">
      <meta property="og:image" content="${escapeHtml(page.image)}">
      <meta property="og:image:width" content="144">
      <meta property="og:image:height" content="144">
      <meta property="og:locale" content="${escapeHtml(page.locale)}">
      <title>${escapeHtml(page.title)}</title>

      <link rel="manifest" href="manifest.json">

      <link rel="apple-touch-icon" sizes="180x180" href="/assets/safari/apple-touch-180x180.png">
      <link rel="apple-touch-icon" sizes="167x167" href="/assets/safari/apple-touch-167x167.png">
      <link rel="apple-touch-icon" sizes="152x152" href="/assets/safari/apple-touch-152x152.png">
      <link rel="apple-touch-icon" sizes="120x120" href="/assets/safari/apple-touch-120x120.png">
      <link rel="apple-touch-icon" sizes="76x76" href="/assets/safari/apple-touch-76x76.png">
      <meta name="apple-mobile-web-app-title" content="JiveCake">

      <link rel="stylesheet" href="/dist/index-${page.version}.css">
    </head>
    <body layout="column">
      <ui-view flex layout="row"></ui-view>
      <script src="https://www.paypalobjects.com/api/checkout.min.js" data-version-4></script>
      <script src="https://use.fontawesome.com/4248578432.js"></script>
      <script src="https://www.google-analytics.com/analytics.js"></script>
      <script src="https://js.stripe.com/v3/"></script>
      <script src="https://checkout.stripe.com/checkout.js"></script>
      <script src="https://cdn.auth0.com/js/lock/10.24.1/lock.min.js"></script>
      <script src="/dist/bundle-${page.version}.js"></script>
    </body>
  </html>`
};