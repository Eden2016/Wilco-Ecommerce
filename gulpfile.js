'use strict';

var sass         = require('gulp-sass');
var cssmin       = require('gulp-cssmin');
var concat       = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var notify       = require('gulp-notify');
var concatCss    = require('gulp-concat-css');
var gulp         = require('gulp');
var minify       = require('gulp-babel-minify');

gulp.task('styles', function() {
    return gulp.src(['public/app/assets/sass/app.scss'])
        .pipe(sass({style: 'expanded'}).on('error', sass.logError))
        .pipe(autoprefixer('last 2 version'))
        .pipe(concatCss('app.css'))
        .pipe(cssmin())
        .pipe(gulp.dest('public/app/assets/sass'))
        .pipe(notify({message: 'SASS Compiled', sound: false}));
});

gulp.task('watch', ['styles'], function() {
    gulp.watch('public/app/assets/sass/partials/**/*.scss', ['styles']);
});

gulp.task('minify', function () {
    return gulp.src([
        './public/app/app.js',
        './public/app/components/**/*.js',
        './public/app/services/**/*.js',
        './public/app/shared/**/*.js'
    ])
    .pipe(minify({
        mangle: {
            keepClassName: true
        }
    }))
    .pipe(concat('wm-app.min.js'))
    .pipe(gulp.dest('./public/app'))
    .pipe(notify({message: 'JS build was prepared', sound: false}));
});