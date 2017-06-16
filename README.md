## gulp 用自动化构建工具增强你的工作流程！

```
var path = require('path');
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    gulpOpen = require('gulp-open'),
    os = require('os'),
    connect = require('gulp-connect'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-clean-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    extender    = require('gulp-html-extend'),
    replace = require('gulp-replace'),
    gulpSequence = require('gulp-sequence'),
    tap = require('gulp-tap'),
    minifyHtml = require('gulp-minify-html'),
    babel = require('gulp-babel');
    
// open index.html at mac chrome: "Google chrome"

var host = {
  path: 'dist/',
  port: 8868,
  html: 'index.html'
}

var browser = os.platform() === 'linux' ? 'Google chrome' : (
  os.platform() === 'darwin' ? 'Google chrome' : (
  os.platform() === 'win32' ? 'chrome' : 'firefox'));
  
var pkg = require('./package.json');
gulp.task('open', function (done) {
    gulp.src('')
        .pipe(gulpOpen({
            app: browser,
            uri: 'http://localhost:8868'
        }))
        .on('end', done);
});


// style task
gulp.task('styles', function() {
    return gulp.src('dev/css/**/*.css')
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(minifycss())
        .pipe(gulp.dest('dist/css'))
        .pipe(notify({ message: 'Style document was completed' }));
});

// JS task
gulp.task('scripts', function() {
    return gulp.src(['dev/js/**/*','!dev/js/menus/**/*'])
        .pipe(jshint.reporter('default'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
        .pipe(notify({ message: 'JS document was completed' }));
});
gulp.task('menusScript',function(){
    gulp.src(['dev/js/menus/*/*.js'])
        .pipe(tap(function(file,t){
            var filename = file.path.split("/");
            filename = filename[filename.length - 2];
            gulp.src(file.path)
                .pipe(babel({
                    presets:['es2015']
                }))
                .pipe(jshint.reporter('default'))
                .pipe(uglify())
                .pipe(gulp.dest('dist/js/menus/'+filename+"/"))
                .pipe(notify({
                    message: filename +"/"+ path.basename(file.path) + '  JS document was completed'
                }));
        }))
})

// image task
gulp.task('images', function() {
    return gulp.src('dev/img/**/*')
        .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
        .pipe(gulp.dest('dist/img'))
        .pipe(notify({ message: 'image document was completed' }));
});

// target folder  will clean
gulp.task('clean', function() {
    return gulp.src(['dist/*.html','dist/css','dist/js','dist/fonts','dist/img','dist/data','dist/plugins','dist/premium'], {read: false})
        .pipe(clean())
        .pipe(notify({message:'Clean task was completed'}));
});

gulp.task('extend', function () {
    gulp.src(['dev/html/*/*.html'])
        .pipe(tap(function(file, t) {
            var filename = file.path.split("/");
            filename = filename[filename.length-2];
            gulp.src(file.path)
                .pipe(extender({
                    annotations: false,
                    verbose: false
                })) // default options
                .pipe(minifyHtml())
                .pipe(gulp.dest('dist/'+filename+"/"))
                .pipe(notify({
                    message: filename +"/"+ path.basename(file.path) + '  HTML Component was completed'
                }));
        }));
});

// special resource transform task
gulp.task('move', function () {
    gulp.src(['dev/fonts/*.*','dev/fonts/*/*.*'])
        .pipe(gulp.dest('dist/fonts/'));
    gulp.src(['dev/*.json','dev/*/*.json'])
        .pipe(gulp.dest('dist/'));
    gulp.src(['dev/*.html'])
        .pipe(minifyHtml())
        .pipe(gulp.dest('dist/'));
    gulp.src(['dev/premium/**/*'])
        .pipe(gulp.dest('dist/premium'));
    gulp.src(['dev/plugins/**/*'])
        .pipe(gulp.dest('dist/plugins'));
    gulp.src(['dev/css/demo/fonts/**/*'])
        .pipe(gulp.dest('dist/css/demo/fonts'));
});

// initial task
gulp.task('default',gulpSequence('styles','menusScript','scripts','move','images','build','extend'));
gulp.task('build', function() {
    if (process.env.NODE_ENV === 'test') {
        gulp.src(['dev/js/http.js'])
            .pipe(replace(/114.55.234.128:1080/g, 'test.chuangqish.cn:8686'))
            //.pipe(replace(/120.26.233.25:1080/g, '192.168.1.11:8686'))
            .pipe(jshint.reporter('default'))
            .pipe(uglify())
            .pipe(gulp.dest('dist/js'))
            .pipe(notify({ message: 'test environment' }));
    }else if (process.env.NODE_ENV === 'prd') {
        gulp.src(['dev/js/http.js'])
            .pipe(notify({ message: 'develop environment' }));
    }
});

// document watch task
gulp.task('action',gulpSequence('watch','open'))
gulp.task('watch', function() {
    gulp.watch(['dev/js/**/*','!dev/js/menus/**/*'], function(e) {
        var path = e.path;
        gulp.src(path)
            .pipe(jshint.reporter('default'))
            .pipe(uglify())
            .pipe(gulp.dest('dist/js'))
            .pipe(notify({
                message: path + '  JS document was completed'
            }));
    });
    gulp.watch(['dev/js/menus/*/*.js'],function(e){
        var path = e.path;
        var name = (path.split('/'))[path.split('/').length - 1];
        gulp.src(path)
            .pipe(tap(function(file,t){
                var filename = file.path.split("/");
                filename = filename[filename.length - 2];
                gulp.src(file.path)
                    .pipe(babel({
                        presets:['es2015']
                    }))
                    .pipe(jshint.reporter('default'))
                    .pipe(uglify())
                    .pipe(gulp.dest('dist/js/menus/'+filename+"/"))
                    .pipe(notify({
                        message: name + 'component was completed'
                    }));
            }))
    })

    gulp.watch('dev/*.html',function(e){
        var path = e.path;
        var name = (path.split('/'))[path.split('/').length - 1];
        gulp.src(path)
            .pipe(minifyHtml())
            .pipe(gulp.dest('dist/'))
            .pipe(notify({
                message: name + 'document was completed'
            }))
    });
    gulp.watch('dev/html/*/*.html', function(e) {
        var path = e.path.split("/");
        var name = path[path.length - 1];
        var folder = path[path.length - 2];
        gulp.src(e.path)
            .pipe(extender({
                annotations: false,
                verbose: false
            }))
            .pipe(minifyHtml())
            .pipe(gulp.dest('dist/' + folder))
            .pipe(notify({
                message: name + '  HTML component was completed'
            }));
    });
    gulp.watch('dev/css/**/*.css', function(e) {
        var path = e.path;
        var name = path.substr(path.lastIndexOf("/")+1,path.length);
        gulp.src(path)
            .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
            .pipe(minifycss())
            .pipe(gulp.dest('dist/css'))
            .pipe(notify({
                message: name + '   style document was completed'
            }));
    });
});
```
