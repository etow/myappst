//initialize all of our variables
var app, base, concat, directory, gulp, gutil, hostname, path, refresh, sass, uglify, imagemin, minifyCSS, del, browserSync, autoprefixer, gulpSequence, shell, sourceMaps, plumber;

var autoPrefixBrowserList = ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];

//load all of our dependencies
//add more here if you want to include more libraries
gulp        = require('gulp');
gutil       = require('gulp-util');
concat      = require('gulp-concat');
uglify      = require('gulp-uglify');
sass        = require('gulp-sass');
sourceMaps  = require('gulp-sourcemaps');
minifyCSS   = require('gulp-minify-css');
browserSync = require('browser-sync');
autoprefixer = require('gulp-autoprefixer');
gulpSequence = require('gulp-sequence').use(gulp);
shell       = require('gulp-shell');
plumber     = require('gulp-plumber');


scripts_src = [ 
    "node_modules/jquery/dist/jquery.js",
    "node_modules/jquery-ui/ui/widget.js",
    "node_modules/blueimp-load-image/js/load-image.all.min.js",
    "node_modules/blueimp-canvas-to-blob/js/canvas-to-blob.min.js",
    "node_modules/blueimp-file-upload/js/jquery.iframe-transport.js",
    "node_modules/blueimp-file-upload/js/jquery.fileupload.js",
    "node_modules/blueimp-file-upload/js/jquery.fileupload-process.js",
    "node_modules/blueimp-file-upload/js/jquery.fileupload-image.js",
    "node_modules/blueimp-file-upload/js/jquery.fileupload-validate.js",
    "node_modules/sortablejs/sortable.js",
    /*"node_modules/firebase/firebase.js",*/
    "node_modules/page/page.js",
    "node_modules/cloudinary-jquery-file-upload/cloudinary-jquery-file-upload.js",
    'app/scripts/src/**/*.js'
];

gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: "app/"
        },
        options: {
            reloadDelay: 250
        },
        notify: false
    });
});


//compiling our Javascripts
gulp.task('scripts', function() {
    //this is where our dev JS scripts are
    return gulp.src(scripts_src)
                //prevent pipe breaking caused by errors from gulp plugins
                .pipe(plumber())
                //this is the filename of the compressed version of our JS
                .pipe(concat('app.js'))
                //catch errors
                .on('error', gutil.log)
                //where we will store our finalized, compressed script
                .pipe(gulp.dest('app/scripts'))
                //notify browserSync to refresh
                .pipe(browserSync.reload({stream: true}));
});

//compiling our Javascripts for deployment
gulp.task('scripts-deploy', function() {
    //this is where our dev JS scripts are
    return gulp.src(scripts_src)
                //prevent pipe breaking caused by errors from gulp plugins
                .pipe(plumber())
                //this is the filename of the compressed version of our JS
                .pipe(concat('app.js'))
                //compress :D
                /*.pipe(uglify())*/
                //where we will store our finalized, compressed script
                .pipe(gulp.dest('docs/scripts'));
});

//compiling our SCSS files
gulp.task('styles', function() {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src('app/styles/scss/init.scss')
                //prevent pipe breaking caused by errors from gulp plugins
                .pipe(plumber({
                  errorHandler: function (err) {
                    console.log(err);
                    this.emit('end');
                  }
                }))
                //get sourceMaps ready
                .pipe(sourceMaps.init())
                //include SCSS and list every "include" folder
                .pipe(sass({
                      errLogToConsole: true,
                      includePaths: [
                          'app/styles/scss/'
                      ]
                }))
                .pipe(autoprefixer({
                   browsers: autoPrefixBrowserList,
                   cascade:  true
                }))
                //catch errors
                .on('error', gutil.log)
                //the final filename of our combined css file
                .pipe(concat('styles.css'))
                //get our sources via sourceMaps
                .pipe(sourceMaps.write())
                //where to save our final, compressed css file
                .pipe(gulp.dest('app/styles'))
                //notify browserSync to refresh
                .pipe(browserSync.reload({stream: true}));
});

//compiling our SCSS files for deployment
gulp.task('styles-deploy', function() {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src('app/styles/scss/init.scss')
                .pipe(plumber())
                //include SCSS includes folder
                .pipe(sass({
                      includePaths: [
                          'app/styles/scss',
                      ]
                }))
                .pipe(autoprefixer({
                  browsers: autoPrefixBrowserList,
                  cascade:  true
                }))
                //the final filename of our combined css file
                .pipe(concat('styles.css'))
                .pipe(minifyCSS())
                //where to save our final, compressed css file
                .pipe(gulp.dest('docs/styles'));
});

//basically just keeping an eye on all HTML files
gulp.task('html', function() {
    //watch any and all HTML files and refresh when something changes
    return gulp.src('app/*.html')
        .pipe(plumber())
        .pipe(browserSync.reload({stream: true}))
        //catch errors
        .on('error', gutil.log);
});

//migrating over all HTML files for deployment
gulp.task('html-deploy', function() {
    //grab everything, which should include htaccess, robots, etc
    gulp.src('app/*')
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('docs'));

    //grab any hidden files too
    gulp.src('app/.*')
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('docs'));

    gulp.src('app/fonts/**/*')
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('docs/fonts'));

    //grab all of the styles
    gulp.src(['app/styles/*.css', '!app/styles/styles.css'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('docs/styles'));
});

//cleans our dist directory in case things got deleted
gulp.task('clean', function() {
    return shell.task([
      'rm -rf dist'
    ]);
});

//create folders using shell
gulp.task('scaffold', function() {
  return shell.task([
      'mkdir docs',
      'mkdir docs/fonts',
      'mkdir docs/images',
      'mkdir docs/scripts',
      'mkdir docs/styles'
    ]
  );
});

//this is our master task when you run `gulp` in CLI / Terminal
//this is the main watcher to use when in active development
//  this will:
//  startup the web server,
//  start up browserSync
//  compress all scripts and SCSS files
gulp.task('default', ['browserSync', 'scripts', 'styles'], function() {
    //a list of watchers, so it will watch all of the following files waiting for changes
    gulp.watch('app/scripts/src/**', ['scripts']);
    gulp.watch('app/styles/scss/**', ['styles']);
    gulp.watch('app/images/**', ['images']);
    gulp.watch('app/*.html', ['html']);
});

//this is our deployment task, it will set everything for deployment-ready files
gulp.task('deploy', gulpSequence('clean', 'scaffold', ['scripts-deploy', 'styles-deploy'], 'html-deploy'));
