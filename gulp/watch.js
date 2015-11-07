var gulp = require('gulp'),
    watch = require('gulp-watch');

// Watch for SCSS file changes
gulp.task('watch', function () {
  gulp.watch('./src/scss/**/*.scss', ['sass']);
});
