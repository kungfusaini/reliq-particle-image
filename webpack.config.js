const path = require('path')

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: 'ReliqParticleImage',
    libraryTarget: 'umd',
    globalObject: 'this',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@effects': path.resolve(__dirname, 'src/effects'),
      '@interaction': path.resolve(__dirname, 'src/interaction'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'examples')
    },
    compress: true,
    port: 9000,
    open: 'basic-demo.html'
  }
}