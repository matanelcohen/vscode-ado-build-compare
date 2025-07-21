const path = require('path');

/** @type {import('webpack').Configuration} */
const config = {
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    clean: true
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'esnext',
                target: 'es2020'
              }
            }
          }
        ]
      }
    ]
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'nosources-source-map',
  infrastructureLogging: {
    level: "warn"
  },
  plugins: process.env.NODE_ENV === 'production' ? [
    new (require('webpack').optimize.ModuleConcatenationPlugin)()
  ] : [],
  optimization: {
    usedExports: true,
    sideEffects: false,
    minimize: process.env.NODE_ENV === 'production'
  },
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxAssetSize: 250000,
    maxEntrypointSize: 250000
  }
};

module.exports = config;
