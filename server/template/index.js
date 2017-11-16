export default (page) => {
  return `<!DOCTYPE html>
  <html class="no-js" lang="${page.lang}">
    <head>
      <base href="/">
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <meta name="description" content="${page.description}">
      <link rel="icon" href="/favicon.ico">

      <meta name="twitter:card" content="${page.title}">

      <meta property="og:title" content="${page.title}">
      <meta property="og:site_name" content="JiveCake">
      <meta property="og:description" content="${page.description}">
      <meta property="og:image" content="${page.image}">
      <meta property="og:image:width" content="144">
      <meta property="og:image:height" content="144">
      <meta property="og:locale" content="${page.locale}">
      <title>${page.title}</title>

      <link rel="manifest" href="manifest.json">

      <link rel="apple-touch-icon" sizes="180x180" href="/assets/safari/apple-touch-180x180.png">
      <link rel="apple-touch-icon" sizes="167x167" href="/assets/safari/apple-touch-167x167.png">
      <link rel="apple-touch-icon" sizes="152x152" href="/assets/safari/apple-touch-152x152.png">
      <link rel="apple-touch-icon" sizes="120x120" href="/assets/safari/apple-touch-120x120.png">
      <link rel="apple-touch-icon" sizes="76x76" href="/assets/safari/apple-touch-76x76.png">
      <meta name="apple-mobile-web-app-title" content="JiveCake">

      <link href="/assets/advent-v1.2/assets/css/bootstrap.min.css" rel="stylesheet" type="text/css" media="all" />
      <link href="https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700%7CRoboto%7CJosefin+Sans:100,300,400,500" rel="stylesheet" type="text/css">
      <link rel="stylesheet" href="/assets/advent-v1.2/assets/css/animate.css"> <!-- Resource style -->
      <link rel="stylesheet" href="/assets/advent-v1.2/assets/css/owl.carousel.css">
      <link rel="stylesheet" href="/assets/advent-v1.2/assets/css/owl.theme.css">
      <link rel="stylesheet" href="/assets/advent-v1.2/assets/css/ionicons.min.css"> <!-- Resource style -->
      <link href="/assets/advent-v1.2/assets/css/style.css" rel="stylesheet" type="text/css" media="all" />
      <link href="/dist/landingcss-${page.version}.css" rel="stylesheet" type="text/css" />
    </head>
    <body>
      <div class="wrapper">
        ${page.header}
        ${page.content}
        <div class="footer">
          <div class="container">
            <div class="col-md-6">
              <div class="footer-text">

                <p>
                  <a href="https://facebook.com/jivecake" class="btn btn-social-icon btn-facebook">
                  <span class="fa fa-facebook"></span>
                  </a>
                  <a href="https://github.com/troisio" class="btn btn-social-icon btn-github">
                    <span class="fa fa-github"></span>
                  </a>
                  <a href="https://twitter.com/jivecake" class="btn btn-social-icon btn-twitter">
                    <span class="fa fa-twitter"></span>
                  </a>
                </p>
                <p><a href="/terms">Terms of Service</a> / <a href="/privacy">Privacy</a> / <a href="/faq">Frequently Asked Questions</a></p>
                <p>Copyright 2017 <a href="http://trois.io">Trois Inc</a>. All Rights Reserved.</p>
              </div>
            </div>
            <div class="col-md-6">
              <div id="contact" class="contact text-center">
                <i class="ion-ios-chatboxes-outline"></i>
                <h1>Need Help?</h1>
                <p>Send us a message on <a href="https://facebook.com/jivecake">facebook</a></p>
                <a href="mailto:contact@jivecake.com">contact@jivecake.com</a>\
              </div>
            </div>
          </div>
        </div>
        <script src="/assets/advent-v1.2/assets/js/jquery-2.1.1.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.16.0/jquery.validate.min.js"></script>
        <script src="/assets/advent-v1.2/assets/js/bootstrap.min.js"></script>
        <script src="/assets/advent-v1.2/assets/js/plugins.js"></script>
        <script src="/assets/advent-v1.2/assets/js/menu.js"></script>
        <script src="/assets/advent-v1.2/assets/js/custom.js"></script>
        <script src="https://use.fontawesome.com/4248578432.js"></script>
      </div>
      <div>
        <script src="https://cdn.auth0.com/js/lock/10.20.0/lock.min.js"></script>
        <script src="/dist/landingjs-${page.version}.js"></script>
        <script>
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
          ga('create', 'UA-81919203-1', 'auto');
          ga('send', 'pageview');
        </script>
        <script>
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:692418,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        </script>
      </div>
    </body>
  </html>`
};