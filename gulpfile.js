let gulp = require('gulp'),
    rename = require('gulp-rename'),
    autoprefixer = require('gulp-autoprefixer'),
    cleanCSS = require('gulp-clean-css'),
    gutil = require('gulp-util'),
    filesize = require('gulp-filesize'),
    uglify = require('gulp-uglify-es').default;

const AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
];

gulp.task('js', function () {
    return gulp.src(['dist/*.js', '!dist/*.min.js'])
        .pipe(filesize())
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(function(file) {
            console.log(file.base);
            return file.base;
        }))
        .pipe(filesize())
        .on('error', gutil.log);
});

gulp.task('css', function () {
    return gulp.src(['dist/*.css', '!dist/*.min.css'])
        .pipe(filesize())
        .pipe(autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
        .pipe(cleanCSS())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(function(file) {
            console.log(file.base);
            return file.base;
        }))
        .pipe(filesize())
        .on('error', gutil.log);
});

gulp.task('docs', function () {
    const jsdoc2md = require('jsdoc-to-markdown');
    const fs = require('fs');

    const inputFile = 'vendor/avtomon/**/dist/*.js';

    const templateData = jsdoc2md.getTemplateDataSync({ files: inputFile });

    const classNames = templateData.reduce((classNames, identifier) => {
        if (identifier.kind === 'class') classNames.push(identifier.name);
        return classNames
    }, []);

    return new Promise(function (resolve) {
        let  output;
        for (const className of classNames) {
            const template = `{{#class name="${className}"}}{{>docs_ru}}{{/class}}`;

            output = jsdoc2md.renderSync({ data: templateData, template: template });
            let dest = `${__dirname}/vendor/avtomon/${className}.js/docs_ru/${className}.md`;
            console.log(dest);
            fs.writeFileSync(dest, output);
        }

        resolve(output);
    });
});

gulp.task('build', gulp.series(
    'js',
    'css',
    'docs',
));