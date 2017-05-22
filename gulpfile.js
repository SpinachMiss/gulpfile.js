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
    
// gulp在浏览器中打开index.html mac chrome: "Google chrome",
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


// 样式处理任务
gulp.task('styles', function() {
    return gulp.src('dev/css/**/*.css')
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(minifycss())
        .pipe(gulp.dest('dist/css'))
        .pipe(notify({ message: '样式文件处理完成' }));
});

// JS处理任务
gulp.task('scripts', function() {
    return gulp.src(['dev/js/**/*','!dev/js/menus/**/*'])
        .pipe(jshint.reporter('default'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
        .pipe(notify({ message: 'JS文件处理完成' }));
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
                    message: filename +"/"+ path.basename(file.path) + '  JS文件处理完成'
                }));
        }))
})

// 图片处理任务
gulp.task('images', function() {
    return gulp.src('dev/img/**/*')
        .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
        .pipe(gulp.dest('dist/img'))
        .pipe(notify({ message: '图片处理完成' }));
});

// 目标目录清理
gulp.task('clean', function() {
    return gulp.src(['dist/*.html','dist/css','dist/js','dist/fonts','dist/img','dist/data','dist/plugins','dist/premium'], {read: false})
        .pipe(clean())
        .pipe(notify({message:'清除工作已完成'}));
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
                    message: filename +"/"+ path.basename(file.path) + '  HTML模板处理完成'
                }));
        }));
});

// 特殊资源文件转移
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

// 预设任务，执行清理后，
gulp.task('default',gulpSequence('styles','menusScript','scripts','move','images','build','extend'));
gulp.task('build', function() {
    if (process.env.NODE_ENV === 'test') {
        gulp.src(['dev/js/http.js'])
            .pipe(replace(/114.55.234.128:1080/g, 'test.chuangqish.cn:8686'))
            //.pipe(replace(/120.26.233.25:1080/g, '192.168.1.11:8686'))
            .pipe(jshint.reporter('default'))
            .pipe(uglify())
            .pipe(gulp.dest('dist/js'))
            .pipe(notify({ message: '测试环境' }));
    }else if (process.env.NODE_ENV === 'prd') {
        gulp.src(['dev/js/http.js'])
            .pipe(notify({ message: '正式环境' }));
    }
});

// 文档临听
gulp.task('action',gulpSequence('watch','open'))
gulp.task('watch', function() {
    gulp.watch(['dev/js/**/*','!dev/js/menus/**/*'], function(e) {
        var path = e.path;
        gulp.src(path)
            .pipe(jshint.reporter('default'))
            .pipe(uglify())
            .pipe(gulp.dest('dist/js'))
            .pipe(notify({
                message: path + '  JS文件处理完成'
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
                        message: name + '模板处理完成'
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
                message: name + '文件处理完成'
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
                message: name + '  HTML模板处理完成'
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
                message: name + '   样式文件处理完成'
            }));
    });
});
