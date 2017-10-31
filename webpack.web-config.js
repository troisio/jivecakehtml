const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const packageJson = require('./package.json');
const fs = require('fs');

const indexFile = `
<!DOCTYPE html>
<html class="no-js" lang="en">
  <head>
    <base href="/">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="description" content="Event registration">
    <link rel="icon" href="/favicon.ico">

    <meta name="twitter:card" content="JiveCake">

    <meta property="og:title" content="JiveCake">
    <meta property="og:site_name" content="JiveCake">
    <meta property="og:description" content="Event registration">
    <meta property="og:image" content="https://jivecake.com/assets/chrome/icon144.png">
    <meta property="og:image:width" content="144">
    <meta property="og:image:height" content="144">
    <meta property="og:locale" content="en_US">
    <title>JiveCake</title>

    <link rel="manifest" href="manifest.json">

    <link rel="apple-touch-icon" sizes="180x180" href="/assets/safari/apple-touch-180x180.png">
    <link rel="apple-touch-icon" sizes="167x167" href="/assets/safari/apple-touch-167x167.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/assets/safari/apple-touch-152x152.png">
    <link rel="apple-touch-icon" sizes="120x120" href="/assets/safari/apple-touch-120x120.png">
    <link rel="apple-touch-icon" sizes="76x76" href="/assets/safari/apple-touch-76x76.png">
    <meta name="apple-mobile-web-app-title" content="JiveCake">

    <link rel="stylesheet" href="/dist/index-${packageJson.version}.css">
  </head>
  <body layout="column">
    <ui-view flex layout="row"></ui-view>
    <script src="https://www.paypalobjects.com/api/checkout.min.js" data-version-4></script>
    <script src="https://use.fontawesome.com/4248578432.js"></script>
    <script src="https://www.google-analytics.com/analytics.js"></script>
    <script src="https://js.stripe.com/v3/"></script>
    <script src="https://checkout.stripe.com/checkout.js"></script>
    <script src="https://cdn.auth0.com/js/lock/10.23.1/lock.min.js"></script>
    <script src="/dist/bundle-${packageJson.version}.js"></script>
  </body>
</html>
`;

fs.writeFile(path.resolve(__dirname, 'web/index.html'), indexFile);

module.exports = function(env) {
  const sourceMap = typeof env !== 'undefined' && typeof env.sourceMap !== 'undefined';
  return {
    entry: {
      bundle: path.resolve(__dirname, 'web/src/index.js'),
      index: path.resolve(__dirname, 'web/assets/sass/index.scss'),
      landingcss: path.resolve(__dirname, 'web/assets/sass/landing.scss'),
      landingjs: path.resolve(__dirname, 'web/src/landing.js')
    },
    output: {
      path: path.resolve(__dirname, 'web/dist'),
      filename: `[name]-${packageJson.version}.js`
    },
    module: {
      rules: [
        {
          test: /\.(js)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['es2015']
              }
            },
            {
              loader: 'eslint-loader',
              options: {
                rules: {
                  'no-console': 0
                },
                parserOptions: {
                  ecmaVersion: 7,
                  sourceType: 'module',
                  ecmaFeatures: {
                    modules: true,
                    classes: true
                  }
                },
                globals: [
                  '$',
                  'document',
                  'window',
                  'console',
                  'location',
                  'localStorage',
                  'fetch',
                  'Headers',
                  'Promise',
                  'URLSearchParams',
                  'Auth0Lock',
                  'Set',
                  'StripeCheckout',
                  'EventSource',
                  'Uint8Array',
                  'ArrayBuffer',
                  'atob',
                  'FileReader',
                  'ga',
                  'paypal'
                ],
                baseConfig: {
                  extends: ['eslint:recommended']
                }
              }
            }
          ]
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'sass-loader']
          }),
        }
      ]
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: sourceMap
      }),
      new ExtractTextPlugin(`[name]-${packageJson.version}.css`),
      new LiveReloadPlugin({
        ignore: /node_modules/
      })
    ]
  };
};