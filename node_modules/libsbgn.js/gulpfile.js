var gulpDocumentation = require('gulp-documentation');
var gulp = require('gulp');

gulp.task('doc', function () {
  return gulp.src('./src/libsbgn.js')
    .pipe(gulpDocumentation('html', { config: "./docs/doc_conf.yml" }, {name: 'libsbgn.js'}))
    .pipe(gulp.dest('docs'));
});
