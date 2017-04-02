var gulp = require('gulp');
var less = require('gulp-less');
var bower = require('gulp-bower');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var shell = require('gulp-shell');
var watch = require('gulp-watch');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var connect = require('gulp-connect');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var rev = require('gulp-rev');
var buffer = require('gulp-buffer');
var revCollector = require('gulp-rev-collector');
var htmlmin = require('gulp-htmlmin');
var rename = require('gulp-rename');

var hugoTheme = null;

var lessInput = './static/styles/style.less';
var lessOutput = './public/css';

var jsInput = [
  './static/libs/jquery/dist/jquery.js',
  './static/libs/bootstrap/dist/js/bootstrap.js',
  './static/libs/semantic/dist/semantic.js'
];
var jsOutput = './public/js';


var hugoInput = [
  './archetypes/**/*.*',
  './content/**/*.*',
  './layouts/**/*.*',
  './static/**/*.*',
  './themes/**/*.*',
  './config.toml'
];

var imageInput = './static/img/**/*';
var imageOutput = './public/img';

var configDevFile = './config.dev.toml';
var configDevFileEn = './config.dev_en.toml';
var configProdFile = './config.prod.toml';
var configProdFileEn = './config.prod_en.toml';

gulp.task('default', ['serve']);

// gulp.task('build', ['bower', 'hugo', 'less', 'js', 'img', 'html']);

gulp.task('hugo', function () {
  return buildHugo();
});

gulp.task('less', function () {
  return buildLess();
});

gulp.task('bower', function () {
  return bower();
});

gulp.task('js', function () {
  return buildJs();
});

gulp.task('img', function () {
  return buildImages();
});

gulp.task('html', function () {
  return buildHtml();
});

gulp.task('config-dev', function () {
  gulp.src(configDevFile)
    .pipe(rename('config.toml'))
    .pipe(gulp.dest('./'));

  gulp.src(configDevFileEn)
    .pipe(rename('config_en.toml'))
    .pipe(gulp.dest('./'));
});

gulp.task('config-prod', function () {
  gulp.src(configProdFile)
    .pipe(rename('config.toml'))
    .pipe(gulp.dest('./'));

  gulp.src(configProdFileEn)
    .pipe(rename('config_en.toml'))
    .pipe(gulp.dest('./'));
});

gulp.task('build', function () {
  changeConfigFile(configProdFile);
  buildHugo();
  buildLess();
  buildJs();
  // buildImages();
});

gulp.task('watch', function () {

  changeConfigFile(configDevFile);
  buildHugo();
  buildLess();
  buildJs();

  var allLess = './static/styles/*.less';
  watch(allLess, function (vinyl) {
    gutil.log(gutil.colors.green(vinyl.relative), 'fired', gutil.colors.green(vinyl.event));
    return buildLess().pipe(connect.reload());
  });
  watch(jsInput, function (vinyl) {
    gutil.log(gutil.colors.green(vinyl.relative), 'fired', gutil.colors.green(vinyl.event));
    return buildJs().pipe(connect.reload());
  });
  watch(hugoInput, function (vinyl) {
    gutil.log(gutil.colors.green(vinyl.relative), 'fired', gutil.colors.green(vinyl.event));
    return buildHugo().pipe(connect.reload());
  });
});

gulp.task('serve', function () {
  connect.server({
    'root': 'public',
    'livereload': true,
    'port': 6789
  });
  gulp.start('watch');
});

function buildHugo() {
  var hugoCommand = 'hugo --buildDrafts';

  if (hugoTheme) {
    hugoCommand += ' --theme=' + hugoTheme;
  }

  gulp
    .src('')
    .pipe(plumber({
      errorHandler: handleError
    }))
    .pipe(shell([
      hugoCommand
    ]));

  return buildHugoEn();
}

function buildHugoEn() {
  var hugoCommand = 'hugo --buildDrafts --config="config_en.toml"';

  if (hugoTheme) {
    hugoCommand += ' --theme=' + hugoTheme;
  }

  return gulp
    .src('')
    .pipe(plumber({
      errorHandler: handleError
    }))
    .pipe(shell([
      hugoCommand
    ]));
}

function buildLess() {
  console.log("Building less...");
  return gulp.src(lessInput)
    .pipe(plumber({
      errorHandler: handleError
    }))
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(sourcemaps.write())
    .pipe(autoprefixer())
    .pipe(cssnano())
    .pipe(buffer())
    // .pipe(rev())
    .pipe(gulp.dest(lessOutput));
}

function buildJs() {
  return gulp.src(jsInput)
    .pipe(plumber({
      errorHandler: handleError
    }))
    .pipe(concat('site.js'))
    .pipe(uglify())
    .pipe(buffer())
    .pipe(rev())
    .pipe(gulp.dest(jsOutput))
    .pipe(rev.manifest({
      base: jsOutput,
      merge: true
    }));
}

function buildImages() {
  return gulp.src(imageInput)
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [
        {removeViewBox: false},
        {cleanupIDs: false}
      ]
    }))
    .pipe(gulp.dest(imageOutput));
}

function buildHtml() {
  return gulp
    .src(['./rev-manifest.json', './public/**/*.html'])
    .pipe(revCollector({
      replaceReved: true
    }))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('public'));
}

function handleError(error) {
  gutil.beep();
  var message = null;
  if (error.hasOwnProperty('formatted')) {
    message = error.formatted;
  } else {
    message = error;
  }
  gutil.log(gutil.colors.red(message));
  this.emit('end');
}

function changeConfigFile(newConfigFile) {
  return gulp.src(newConfigFile)
    .pipe(rename('config.toml'))
    .pipe(gulp.dest('./'));
}
