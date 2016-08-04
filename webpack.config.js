// For excluding /node_modules/
var webpack = require("webpack");
var nodeExternals = require('webpack-node-externals');
var Fs = require('fs')
var nodeModules = {}
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var cssnext = require('postcss-cssnext');

Fs.readdirSync('node_modules').forEach(function (module) {
  if (module !== '.bin') {
    nodeModules[module] = true
  }
})

module.exports = [{
// Front end
  target: 'node',
  entry: './src/server.js',
  output: {
    path: __dirname,
    filename: "./build/server.js",
  },
  externals: [nodeExternals()],
  resolve: {
    root: __dirname,
    modulesDirectories: [
      'node_modules',
      './src/',
    ],
    alias: {
      applicationStyles: '../styles/main.scss',
    },
    extensions: ['', '.js', '.jsx'],
  },

  plugins: [
    new webpack.OldWatchingPlugin(),
    new ExtractTextPlugin('./static/build/main.css', {
      allChunks: true,
    }),
  ],

  module: {
    preLoaders: [
      /*
       * Linting warnings and errors will be displayed in the console when
       * Webpack is compiled.
       */
      {
        test: /\.jsx$/,
        loaders: ['eslint'],
        exclude: /node_modules/,
      },
    ],
    loaders: [
      {
        loader: 'babel-loader',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        query: {
          plugins: ['lodash'],
          presets: ['es2015', 'react'],
        },
      },

      /*
       * Parse SCSS to minified CSS, then postprocess with postcss autoprefixer plugin
       */
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', ['css?minimize', 'postcss', 'sass']),
      },

      /*
       * Load in files with CSS alone
       */
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=10000',
      },
    ],
  },
  postcss: function () {
    return [cssnext];
  },
  devtool: 'source-map',
}, {
  target: 'web',
  entry: './src/client.js',
  output: {
    filename: "./static/build/client.js",
  },
  resolve: {
    root: __dirname,
    modulesDirectories: [
      'node_modules',
      './src/',
    ],
    alias: {
      applicationStyles: '../styles/main.scss',
    },
    extensions: ['', '.js', '.jsx'],
  },

  plugins: [
    new webpack.OldWatchingPlugin(),
  ],

  module: {
    loaders: [
      {
        loader: 'babel',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        query: {
          plugins: ['lodash'],
          presets: ['es2015', 'react'],
        },
      },
      {
        test: /\.scss$/,
        loader: "null",
      },
    ],
  },
  devtool: 'source-map'
},
// Editor tools copy
{
  target: 'node',
  entry: './src/editor-server.js',
  output: {
    path: __dirname,
    filename: "./build/editor-server.js"
  },
  externals: [nodeExternals()],
  resolve: {
    root: __dirname,
    modulesDirectories: [
      'node_modules',
      './src/',
    ],
    alias: {
    },
    extensions: ['', '.js', '.jsx']
  },

  plugins: [
    new webpack.OldWatchingPlugin(),
  ],

  module: {
    loaders: [
      {
        loader: 'babel-loader',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react'],
        },
      },
    ],
  },
  devtool: 'source-map',
}, {
  target: 'web',
  entry: './src/editor-client.js',
  output: {
    filename: "./static/build/editor-client.js"
  },
  resolve: {
    root: __dirname,
    modulesDirectories: [
      'node_modules',
      './src/',
    ],
    alias: {
    },
    extensions: ['', '.js', '.jsx']
  },

  plugins: [
    new webpack.OldWatchingPlugin(),
  ],

  module: {
    loaders: [
      {
        loader: 'babel',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react'],
        },
      },
    ],
  },
  devtool: 'source-map'
}]
