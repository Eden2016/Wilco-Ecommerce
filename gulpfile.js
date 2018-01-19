'use strict';

var gulp         = require('gulp');
var sass         = require('gulp-sass');
var cssmin       = require('gulp-cssmin');
var rename       = require('gulp-rename');
var concat       = require('gulp-concat');
var uglify       = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');
var notify       = require("gulp-notify");
var concatCss    = require('gulp-concat-css');

gulp.task('styles', function() {
    return gulp.src(['public/app/assets/sass/app.scss'])
        .pipe(sass({ style: 'expanded' }).on('error', sass.logError))
        .pipe(autoprefixer('last 2 version'))
        .pipe(concatCss("app.css"))
        .pipe(cssmin())
        .pipe(gulp.dest('public/app/assets/sass'))
        .pipe(notify({ message: 'SASS Compiled', sound: false }));
});


gulp.task('watch', ['styles',], function() {
    gulp.watch('public/app/assets/sass/partials/**/*.scss', ['styles']);
});

gulp.task('default', ['watch']);