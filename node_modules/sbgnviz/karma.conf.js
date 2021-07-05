module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai', 'browserify'],
    plugins: ['karma-browserify', 'karma-mocha', 'karma-chai', 'karma-chrome-launcher',],
    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },
    browserify: {
      debug: true,
    },
    files: ['test/**/*.js'],
    reporters: ['progress'],
    port: 9876,  // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    concurrency: Infinity
  })
}