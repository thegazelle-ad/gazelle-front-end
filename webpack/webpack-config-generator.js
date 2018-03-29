const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const ROOT_DIRECTORY = path.resolve(__dirname, '..');
const getAbsolute = relativePath => path.resolve(ROOT_DIRECTORY, relativePath);

/**
 * The config option is an object of the form
 * {
 *   NODE_ENV: string,
 *   type: one of 'server', 'admin-client', 'main-client',
 *   compileScss: boolean
 * }
 * @param {Object} config
 * @returns {Object[]}
 */
const generateWebpackConfig = (config) => {
  // Initialized shared config variables based on environment and
  // what type of compilation we're doing. This also simultaneously validates the arguments
  let entry;
  let output;
  let target;
  let MAIN_PORT;
  let ADMIN_PORT;
  switch (config.NODE_ENV) {
    case 'production':
    case 'staging':
      MAIN_PORT = 8001;
      ADMIN_PORT = 8002;
      break;

    default:
      // Validate that it is undefined as expected
      if (config.NODE_ENV !== undefined) {
        throw new Error(
          "webpack config option NODE_ENV is to either be 'production', " +
          "'beta' or undefined"
        );
      }

      MAIN_PORT = 3000;
      ADMIN_PORT = 4000;
  }
  switch (config.type) {
    case 'server':
      entry = getAbsolute('src/index.js');
      output = {
        path: getAbsolute('build'),
        filename: 'server.js',
      };
      target = 'node';
      break;

    case 'main-client':
      entry = getAbsolute('src/client-scripts/main-client.js');
      output = {
        path: getAbsolute('static/build'),
        filename: 'main-client.js',
      };
      target = 'web';
      break;

    case 'admin-client':
      entry = getAbsolute('src/client-scripts/admin-client.js');
      output = {
        path: getAbsolute('static/build'),
        filename: 'admin-client.js',
      };
      target = 'web';
      break;

    default:
      throw new Error(
        "Webpack config option 'type' is supposed to be either 'server', " +
        "'main-client', or 'admin-client'"
      );
  }

  if (config.compileScss) {
    entry = [entry, 'src/styles/main.scss'];
  }

  const extractScss = new ExtractTextPlugin({
    filename: path.relative(getAbsolute(output.path), getAbsolute('static/build/main.css')),
  });


  return {
    entry,

    output,

    target,

    context: ROOT_DIRECTORY,

    // This makes __dirname and __filename act as expected based on the src file
    node: {
      __dirname: true,
      __filename: true,
    },

    resolve: {
      modules: [
        getAbsolute('node_modules'),
        getAbsolute('src'),
        getAbsolute('.'),
      ],
      extensions: ['.js', '.jsx', '.json5'],
    },

    // This makes webpack not bundle in node_modules but leave the require statements
    // since this is unnecessary on the serverside
    externals: (
      config.type === 'server'
        ? [nodeExternals({ modulesDir: getAbsolute('node_modules') })]
        : undefined
    ),

    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          // We use JSON.stringify here to add the extra quotes as webpack does
          // a direct substition of the string value, so "value" would just
          // substitute value, not "value" which is what we want to be in the code
          ROOT_DIRECTORY: JSON.stringify(ROOT_DIRECTORY),
          NODE_ENV: JSON.stringify(config.NODE_ENV),
          MAIN_PORT,
          ADMIN_PORT,
          CI: JSON.stringify(process.env.CI),
          CIRCLECI: JSON.stringify(process.env.CIRCLECI),
        },
      }),
    // Only add the plugin if we include the scss entry point
    ].concat(config.compileScss ? [extractScss] : [])
    // Minimize code in production environments
    .concat(config.NODE_ENV !== undefined ? [
      new UglifyJSPlugin({
        sourceMap: true,
      }),
    ] : []),

    // There are faster sourcemaps to use during development, but it seems it's simpler to
    // get css source maps with this (mostly used for production) setting, and our build
    // time isn't horribly long + we usually use watch so it shouldn't be really bad
    devtool: 'source-map',

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: [
            getAbsolute('node_modules'),
            getAbsolute('config'),
          ],

          use: [
            // Babel for transpiling ESNext and React
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  'react',
                  [
                    'env',
                    {
                      targets: (
                        config.type === 'server'
                          // This is for the node server
                          ? {
                            node: 'current',
                            /**
                             * We want this behaviour but it's only in beta right now,
                             * we can uncomment this when we upgrade to v7 of babel
                             *
                             * // Disable the default behaviour of finding
                             * // browserslist key in package.json
                             * browsers: '',
                             */
                            browsers: '> 1%, last 2 versions, Firefox ESR',
                          }
                          /**
                           * We want this behaviour but it's only in beta right now,
                           * we can uncomment this when we upgrade to v7 of babel
                           *
                           * // If not node, then it is 'web' and therefore our client scripts
                           * // Here we simply let preset-env find the browserlist key
                           * : undefined
                           */
                         : { browsers: '> 1%, last 2 versions, Firefox ESR' }
                      ),
                    },
                  ],
                ],
                plugins: ['transform-object-rest-spread', 'array-includes'],
                minified: config.NODE_ENV !== undefined,
              },
            },
            // Lint all that is compiled, notice the order so eslint runs before babel
            'eslint-loader',
          ],
        },
        {
          test: /\.json5$/,
          exclude: [
            getAbsolute('node_modules'),
          ],
          loader: 'json5-loader',
        },
      // Only add the scss loaders if we're actually compiling it
      ].concat(config.compileScss ? (
        /**
         * Transpile and compile SCSS to one minified, autoprefixed, vanilla css file
         */
      {
        test: /\.scss$/,
        exclude: getAbsolute('node_modules'),

        loader: extractScss.extract([
          // Convert css to JS module which Webpack can handle and we can extract to a file
          {
            loader: 'css-loader',
            options: {
              minimize: config.NODE_ENV !== undefined,
              sourceMap: true,
            },
          },
          // Transpile CSSNext features and autoprefix
          {
            loader: 'postcss-loader',
            options: {
              config: {
                path: getAbsolute('webpack/postcss.config.js'),
              },
              sourceMap: true,
            },
          },
          // Converts scss to css
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ]),
      }) : []),
    },
  };
};

module.exports = generateWebpackConfig;
