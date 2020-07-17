let gulp = require('gulp'),
	path = require('path'),
	sass = require('gulp-sass'),
	browserSync = require('browser-sync'),
	uglify = require('gulp-uglify-es').default, //es6 supported
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	sourcemaps = require('gulp-sourcemaps'),
	cssnano = require('gulp-cssnano'),
	newer = require('gulp-newer'),
	cache = require('gulp-cache'),
	autoprefixer = require('gulp-autoprefixer'),
	webp = require('gulp-webp'),
	tinyPng = require('gulp-tinypng'),
	imagemin = require('gulp-imagemin'),
	imageminPngquant = require('imagemin-pngquant'),
	imageminJpegRecompress = require('imagemin-jpeg-recompress'),
	del = require('del');//удаление файлов или директорий,
	spritesmith = require('gulp.spritesmith'), // спрайт

	svgmin = require('gulp-svgmin'), // минификация и изменение имени svg перед сборкой в спрайт
	cheerio = require('gulp-cheerio'), // изменение html и xml (используеться для удаления атрибутов style, fill, stroke у svg в данной сборке)
	svgstore = require('gulp-svgstore'), // svg спрайт
	inject = require('gulp-inject'), // подключение потоков файлов в различные форматы файлов 




	// сравнение исходных фалов и файлов сборки
	changed = require('gulp-changed'),
	// проверка исходных файлов на месте
	changedInPlace = require('gulp-changed-in-place'),
	// изменение размеров картинки
	imageResize = require('gulp-image-resize'),
	// параллельное преобразование
	parallel = require('concurrent-transform');




//Преобразование в css и инжектинг при изменении всех sass файлов кроме либов;
gulp.task('sass', function () {
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

// Преобразование сторонних либов в css и инжектинг при изменениях (подразумевается что файлы уже минифицированы);
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

//Создание копий изображений в формате webp
gulp.task('webp', done => {
	gulp.src(['app/img/**/*.+(jpeg|png|jpg|webp)', '!app/img/sprites/**/*.*'])
		.pipe(webp({quality: 90}))
		.pipe(gulp.dest('app/img'));
	done();	
}) 	

//=======================Спрайты===================================================

//Создание спрайтов и их стилей
/*Алгоритм: 
1). spritesmith принимает измененные параментры; 
2). создается json;
3). с помощью выбранного формата используется нужный шаблон с даными json для соз
дания файла css, scss или др.*/
gulp.task('sprite', function (done) {
	let spriteData = gulp.src('app/img/sprites/readyFiles/*.+(png||jpeg||jpg)')
		.pipe(spritesmith({
			imgName: 'sprite.png',
			imgPath: '../img/sprites/sprite.png',
			cssName: '_sprite-mixin.scss',
			cssFormat: 'scss',
			algorithm: 'binary-tree',
			cssTemplate: 'app/templates/scss-sprite-template.handlebars', // пользовательский шаблон
			cssVarMap: function (sprite) {
				sprite.name = 's-' + sprite.name;
			},
		}));

	spriteData.img.pipe(gulp.dest('app/img/'));

	done();
});

// Подгонка размеров картинок под спрайты
gulp.task('imgResize', gulp.series(function () {
	return gulp.src('app/img/sprites/originalFiles/*.+(png||jpeg||jpg)')
		// берем только те файлы, которые отличаються от файлов на выходе
		.pipe(changed('app/img/sprites/readyFiles/', {
			extension: '.png' // учесть изменение расширения
		}))
		.pipe(parallel(
			imageResize({
				width: 50,
				height: 50,
				format: 'png', // изменить расширение
			})))
		.pipe(gulp.dest('app/img/sprites/readyFiles/'));
}, 'sprite'));

//=======================SVG Спрайты===================================================

gulp.task('svgsprite', function () {
	var svgs = gulp.src('app/img/sprites/svg/**/*.svg')
		// если есть файлы во вложенных каталогах, то добавляем названия каталогов в имя файла в начало через разделитель "-", 
		// чтобы не было конфликтов svg файлов с одинаковым названием при преобразовании в id в спрайте
		.pipe(rename(function (file) { 
            var name = file.dirname.split(path.sep);
			name.push(file.basename);
			if(name[0] != '.') {
				file.basename = name.join('-');
			}
            
        }))
		.pipe(svgmin(function getOptions (file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
					removeViewBox: false,
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: true
                    }
                }]
            }
		}))
		// генерация svg спрайта +
		// отключение некоторых элементов(<?xml ?> и DOCTYPE) которые не нужны при инлайновом использовании
		.pipe(svgstore({ inlineSvg: true }))
		// удаление атрибутов fill и style у svg, добавление viewBox
		.pipe(cheerio({
            run: function ($) {
				$('[fill]:not([fill="none"])').removeAttr('fill');
				$('[style]').removeAttr('style');
				//$('symbol').attr('viewBox', '0 0 16 16'); // для растягивания содержимого svg в viewport с сохранение пропорций
            },
            parserOptions: { xmlMode: true }
        }))

		function fileContents (filePath, file) {
			return file.contents.toString();
		}
		// +инлайнового подключения - позволит избежать проблем с градиентами в различных браузерах
		// -инлайнового подключения - отсутствие кеширования
		// можно использовать оба метода: способ внешнего подключения для кеширования и при необходимости использовать инлайновый если есть градиенты?...
		// ...для использования способа с внешним файлом нужно подключить дополнительно svg4everybody для поддержки подключения внешних файлов в IE < 11
		return gulp
        .src('app/index.html')
        .pipe(inject(svgs, { transform: fileContents }))
        .pipe(gulp.dest('app/'));
});

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
	gulp.watch('app/js/**/*.js', (done) => { browserSync.reload(), done() });
	gulp.watch('app/js/libs/*.js', gulp.series('scripts'));
	gulp.watch(['app/html/**/*.html', 'app/index.html'], (done) => { browserSync.reload(), done() });
	//c преобразовынием к одинаковым размерам (выставлено 50*50);
	gulp.watch('app/img/sprites/originalFiles/*.+(png||jpg||jpeg)', gulp.series('imgResize'));
	//без преобразования к одинаковым размерам (как есть);
	gulp.watch('app/img/sprites/readyFiles/*.+(png||jpg||jpeg)', gulp.series('sprite'));
	gulp.watch('app/img/sprites/svg/**/*.svg', gulp.series('svgsprite'));
	done();
});

/*Инициализация робочего процесса, 
запуск таксов перед наблюдением, 
запуск наблюдения*/
gulp.task('default', gulp.parallel(
	'browser-sync', 'sass', 'sass-libs', 'scripts', 'sprite', 'svgsprite', 'watch'
), done => done());


//очистка кеша
gulp.task('clearCache', () => {
	return cache.clearAll();
});

// Ручное удаление ненужных css и js в app
gulp.task('clean-css', done => { del.sync(['app/css/*.*', '!app/css/*main.min.css', '!app/css/*libs.min.css']); done(); }); //не необходимо;
gulp.task('clean-js', done => { del.sync(['app/js/*.*', '!app/css/*.min.js', '!app/js/main.js']); done(); }); //не необходимо;


//BUILD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//удаление предыдущего каталога prod;
gulp.task('clean', (done) => {
	del.sync(['prod']);
	done();
});


gulp.task('replace', done => {
	gulp.src(['app/img/**/*.*', '!app/img/sprites/**/*.*'])
	.pipe(gulp.dest('prod/img/'));
	done();
});


// 1). основной способ сжатия картинок;
gulp.task('compress', (done) => {

	gulp.src(['app/img/**/*.png', 'app/img/**/*.jpg', '!app/img/sprites/**/*.*'])
		.pipe(cache(tinyPng('ejsl52J9UzLtVC4shtRvKIwajsaTxp0J'),
			{ name: 'images-tinyPng(png/jpg)' }))
		.pipe(gulp.dest('prod/img/'));
	gulp.src(['app/img/**/*.gif', 'app/img/**/*.webp', '!app/img/sprites/**/*.*'])
		.pipe(cache(imagemin([
			imagemin.gifsicle({ interlaced: true }),
			imagemin.jpegtran({ progressive: true }),
			imagemin.optipng({ optimizationLevel: 5 }),
			imagemin.svgo({
				plugins: [
					{ removeViewBox: false },
					{ cleanupIDs: false }
				]
			})
		])), { name: 'images-imagemin(svg/gif)' })
		.pipe(gulp.dest('prod/img'));
	done();
});


// 2). альтернативный способ сжатия картинок вместо tinyPng;
gulp.task('altCompress', () => {
	return gulp.src('app/img/**/*')
		.pipe(cache(imagemin([
			imagemin.gifsicle({ interlaced: true }),
			imagemin.jpegtran({ progressive: true }),
			imagemin.optipng({ optimizationLevel: 5 }),
			imagemin.svgo({
				plugins: [
					{ removeViewBox: false },
					{ cleanupIDs: false }
				]
			}),
			imageminJpegRecompress(),
			imageminPngquant()
		])), { name: 'images-imagemin(all types)' })
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
			gulp.src('app/fonts/**/*.*')	//fonts;
				.pipe(gulp.dest('prod/fonts'));
			gulp.src(['app/js/main.js', 'app/js/libs.min.js'])			//js;
				.pipe(gulp.dest('prod/js'));
			gulp.src('app/html/**/*.html')	//the rest of html;
				.pipe(gulp.dest('prod/html'));
			gulp.src('app/*.*')				//the rest of files;	
				.pipe(gulp.dest('prod/'));
			done();
		}
	)
);