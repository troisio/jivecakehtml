'use strict';

var fs = require('fs');
var gulp = require('gulp');
var browserify = require('browserify');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

var vendorCSS = function() {
  return gulp.src([
    './node_modules/angular-material/angular-material.min.css',
    './node_modules//angular-material-data-table/dist/md-data-table.min.css',
    './node_modules/font-awesome/css/font-awesome.min.css'
  ])
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('./app/dist'))
};

var vendorJS = function(minified) {
    return gulp.src([
      './node_modules/angular/angular.min.js',
      './node_modules/angular-animate/angular-animate.min.js',
      './node_modules/angular-aria/angular-aria.min.js',
      './node_modules/angular-messages/angular-messages.min.js',
      './node_modules/angular-sanitize/angular-sanitize.min.js',
      './node_modules/angular-ui-router/release/angular-ui-router.min.js',
      './node_modules/angular-material-icons/angular-material-icons.js',
      './node_modules/angular-material/angular-material.min.js',
      './node_modules/angular-material-data-table/dist/md-data-table.min.js',
      './node_modules/angular-jwt/dist/angular-jwt.js',
      './node_modules/angular-lock/dist/angular-lock.js',
      './node_modules/qrcode-generator/js/qrcode.js',
      './node_modules/angular-qrcode/angular-qrcode.js',
      './node_modules/lovefield/dist/lovefield.min.js',
      './node_modules/event-source-polyfill/eventsource.min.js'
    ])
      .pipe(concat('vendor.js'))
      .pipe(gulp.dest('./app/dist'));
};

var buildJS = function(sourcemap) {
  gulp.src('./app/src/**/*.js')
    .pipe(jshint({esversion: 6}))
    .pipe(jshint.reporter(stylish));

  var stream = browserify('app/src/module.js')
    .transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(source('dist.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify())

    if (sourcemap) {
      return stream.pipe(sourcemaps.write('./'))
                   .pipe(gulp.dest('./app/dist/'))
    } else {
      return stream.pipe(gulp.dest('./app/dist/'));
    }
};

var warnHTML = function(htmlhint, file) {
  return gulp.src(file)
    .pipe(plumber())
    .pipe(htmlhint({
      'doctype-first': false
    }))
    .pipe(htmlhint.reporter());
};

var buildSass = function () {
  return gulp.src('./app/assets/sass/index.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(concat('dist.css'))
    .pipe(gulp.dest('./app/dist/'))
    .on('error', gutil.log);
};

gulp.task('production', function() {
  vendorCSS();
  vendorJS();
  buildJS(false);
  buildSass();
});

gulp.task('watch', function() {
  var livereload = require('gulp-livereload');
  var htmlhint = require("gulp-htmlhint");
  livereload.listen();

  vendorCSS();
  vendorJS();

  gulp.watch(['./app/src/**/*.html', './index.html'], function(change) {
    warnHTML(htmlhint, change.path).pipe(livereload());
  });

  gulp.watch(['./app/src/**/*.js', './index.html'], function(argument) {
    buildJS(true).pipe(livereload());
  });

  gulp.watch(['./app/assets/sass/**/*.scss', './index.html'], function() {
    buildSass().pipe(livereload());
  });
});

gulp.task('default', ['watch']);
