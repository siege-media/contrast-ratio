var gulp = require('gulp'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat');

// Preprocess SCSS into CSS
gulp.task('sass', function() {
    gulp
	    .src('./src/scss/**/*.scss')
	    .pipe(sass())
	    .pipe(concat('style.css'))
	    .pipe(gulp.dest('./'));
});