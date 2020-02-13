let gulp      			= require('gulp'),
sass       				= require('gulp-sass'),
browserSync 			= require('browser-sync'),
uglify					= require('gulp-uglify'),
concat					= require('gulp-concat'),
rename					= require('gulp-rename'),
sourcemaps 				= require('gulp-sourcemaps'),
cssnano 				= require('gulp-cssnano'),
newer					= require('gulp-newer'),
cache					= require('gulp-cache'),
autoprefixer 			= require('gulp-autoprefixer'),
tinyPng					= require('gulp-tinypng'),
imagemin				= require('gulp-imagemin'),
imageminPngquant 		= require('imagemin-pngquant'),
imageminJpegRecompress 	= require('imagemin-jpeg-recompress'),
del 					= require('del');//удаление файлов или директорий,
spritesmith				= require('gulp.spritesmith'), // спрайты

// сравнение исходных фалов и файлов сборки
changed					= require('gulp-changed'),
// проверка исходных файлов на месте
changedInPlace 			= require('gulp-changed-in-place'), 
// изменение размеров картинки
imageResize				= require('gulp-image-resize'),
// параллельное преобразование
parallel				= require('concurrent-transform');




//Преобразование в css и инжектинг при изменении всех sass файлов кроме либов;
gulp.task('sass', function() {
	return gulp.src(['app/sass/*.+(sass|scss)'])
	.pipe(sourcemaps.init())
	.pipe(sass({
		includePaths: require('scss-resets').includePaths // include normilize in sass file by @import 'normalize';
	}).on('error', sass.logError))
	.pipe(rename({
		suffix: ".min"
	}))
	.pipe(sourcemaps.write('./'))
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.stream());
});

// Преобразование либов в css и инжектинг при изменениях;
gulp.task('sass-libs', () => {
	return gulp.src('app/sass/libs/libs.+(scss||sass||css)')
	.pipe(sass().on('error', sass.logError))
	.pipe(rename({
		suffix: ".min",
	}))
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.stream());
});


//Конкатенация и минификация всех js библиотек;
gulp.task('scripts', () => {
	return gulp.src(['app/js/libs/*.js'])
	.pipe(sourcemaps.init())
	.pipe(concat('libs.min.js'))
	.pipe(uglify())
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('app/js'));
});


//=======================Спрайты===================================================

// Подгонка размеров картинок под спрайты
gulp.task('imgResize', function() {
	return gulp.src('app/sprites/originalFiles/*.+(png||jpeg||jpg)')
	// берем только те файлы, которые отличаються от файлов на выходе
	.pipe(changed('app/sprites/readyFiles/', { 
		extension: '.png' // учесть изменение расширения
	}))
	.pipe(parallel(
		imageResize({
			width: 50,
			height: 50,
			format: 'png', // изменить расширение
		})))
	.pipe(gulp.dest('app/sprites/readyFiles/'));
});

//Создание спрайтов и их стилей
/*Алгоритм: 
1). spritesmith принимает измененные параментры; 
2). создается json;
3). с помощью выбранного формата используется нужный шаблон с даными json для соз
дания файла css, scss или др.*/
gulp.task('sprite', gulp.series('imgResize', function(done) {
	let spriteData = gulp.src('app/sprites/readyFiles/*.+(png||jpeg||jpg)')
	.pipe(spritesmith({
		imgName: 'sprite.png',
		imgPath: '../img/sprites/sprite.png',
		cssName: '_sprite-mixin.scss',
		cssFormat: 'scss',
		algorithm: 'binary-tree',
		cssTemplate: 'app/templates/scss-sprite-template.handlebars', // пользовательский шаблон
		cssVarMap: function(sprite) {
			sprite.name = 's-' + sprite.name;
		},
	}));

	spriteData.img.pipe(gulp.dest('app/img/sprites/'));
	spriteData.css.pipe(gulp.dest('app/sass/myLibs/'));

	done();
}));
//=================================================================================

//Создание сервера browserSync;
gulp.task('browser-sync', done => {
	browserSync({
		server: {
			baseDir: "app"
		},
		notify: false
	});
	done();
});


// Наблюдение за изменениями в файлах для обновления;
gulp.task('watch', (done) => {
	gulp.watch(['app/sass/*.+(sass|scss)', 'app/sass/myLibs/*.+(sass|scss)'], gulp.series('sass')); //все sass и scss кроме внешних либов;
	gulp.watch('app/sass/libs/*.+(sass||scss||css)', gulp.series('sass-libs')); // только внешние либы;
	gulp.watch('app/js/**/*.js', (done) => {browserSync.reload(), done()});
	gulp.watch(['app/html/**/*.html', 'app/index.html'], (done) => {browserSync.reload(), done()});
	gulp.watch('app/img/sprites/originalFiles/*.+(png||jpg||jpeg)', gulp.series('sprite'));
	done();
});

/*Инициализация робочего процесса, 
запуск таксов перед наблюдением, 
запуск наблюдения*/
gulp.task('default', gulp.parallel(
	'browser-sync', 'sass', 'sass-libs', 'scripts', 'sprite', 'watch'
	), done => done());


//очистка кеша
gulp.task('clearCache', () => {
	return cache.clearAll();
});

// Ручное удаление ненужных css и js в app
gulp.task('clean-css', done => {del.sync(['app/css/*.*', '!app/css/*main.min.css', '!app/css/*libs.min.css']); done();}); //не необходимо;
gulp.task('clean-js', done => {del.sync(['app/js/*.*', '!app/css/*.min.js', '!app/js/main.js']); done();}); //не необходимо;


//BUILD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//удаление предыдущего каталога prod;
gulp.task('clean', (done) => {
	del.sync(['prod']);
	done();
});



// 1). основной способ сжатия картинок;
gulp.task('compress', (done) => { 

	gulp.src(['app/img/**/*.png', 'app/img/**/*.jpg'])
	.pipe(cache(tinyPng('ejsl52J9UzLtVC4shtRvKIwajsaTxp0J'),
		{name:'images-tinyPng(png/jpg)'}))
	.pipe(gulp.dest('prod/img/'));
	gulp.src(['app/img/**/*.svg', 'app/img/**/*.gif'])
	.pipe(cache(imagemin([
		imagemin.gifsicle({interlaced: true}),
		imagemin.jpegtran({progressive: true}),
		imagemin.optipng({optimizationLevel: 5}),
		imagemin.svgo({
			plugins: [
			{removeViewBox: false},
			{cleanupIDs: false}
			]
		})
		])), {name: 'images-imagemin(svg/gif)'})
	.pipe(gulp.dest('prod/img'));
	done();
});


// 2). альтернативный способ сжатия картинок вместо tinyPng;
gulp.task('altCompress', () => { 
	return gulp.src('app/img/**/*')
	.pipe(cache(imagemin([
		imagemin.gifsicle({interlaced: true}),
		imagemin.jpegtran({progressive: true}),
		imagemin.optipng({optimizationLevel: 5}),
		imagemin.svgo({
			plugins: [
			{removeViewBox: false},
			{cleanupIDs: false}
			]
		}),
		imageminJpegRecompress(),
		imageminPngquant()
		])), {name: 'images-imagemin(all types)'})
	.pipe(gulp.dest('prod/img'));
});

// В css добавляються префиксы, минификация, карты исходного кода и перенос в prod;
gulp.task('css', () => {
	gulp.src('app/css/*.css')
	.pipe(sourcemaps.init())
	.pipe(autoprefixer({
		overrideBrowserslist: ['last 2 versions'],
		cascade: false
	}))
	.pipe(cssnano())
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('prod/css/'));

	return gulp.src('app/css/libs.min.css') // либы уже сжатые, их просто перенести;
	.pipe(gulp.dest('prod/css/'));
});

// сам процесс сборки
gulp.task('build',
	gulp.series(
		'clean',
		'sass', 
		'sass-libs', 
		'scripts', 
		'compress',
		'css',
		(done) => {
			gulp.src('app/fonts/**/*.*')//fonts;
			.pipe(gulp.dest('prod/fonts'));
			gulp.src('app/js/**/*')//js;
			.pipe(gulp.dest('prod/js'));
			gulp.src('app/*.html')//index html;
			.pipe(gulp.dest('prod/'));
			gulp.src('app/html/**/*.html')//the rest of html;
			.pipe(gulp.dest('prod/html'));
			done();}
			)
	);