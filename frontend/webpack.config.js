const path = require('path');

module.exports = {
  mode: 'production',
  entry: './components/GanttRoot.jsx',
  output: {
    filename: 'gantt-react-bundle.js',
    path: path.resolve(__dirname, '../backend/static/js'),
    library: 'GanttChartReact',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
}; 