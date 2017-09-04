const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = function() {
  return {
    target: 'node',
    externals: [nodeExternals()],
    entry: [
      path.resolve(__dirname, 'server/index.js')
    ],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'server.js',
      library: '',
      libraryTarget: 'commonjs2'
    },
    module: {
      rules: [
        {
          test: /\.(html)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'html-loader',
              options: {
                minimize: true
              }
            }
          ]
        },
        {
          test: /(\.jsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['es2015', 'react']
              }
            },
            {
              loader: 'eslint-loader',
              options: {
                rules: {
                  'no-console': 0
                },
                plugins: [
                  'react'
                ],
                parserOptions: {
                  ecmaVersion: 6,
                  sourceType: 'module',
                  ecmaFeatures: {
                    modules: true,
                    classes: true,
                    jsx: true
                  }
                },
                globals: [
                  'console'
                ],
                baseConfig: {
                  extends: ['eslint:recommended', 'plugin:react/recommended']
                }
              }
            }
          ]
        },
        {
          test: /(\.js)$/,
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
                  'require',
                  'module',
                  'console'
                ],
                baseConfig: {
                  extends: ['eslint:recommended']
                }
              }
            }
          ]
        }
      ]
    }
  };
};