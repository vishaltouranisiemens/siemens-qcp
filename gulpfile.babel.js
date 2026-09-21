'use strict'

import gulp from 'gulp'
import * as migrate from './scripts/migrate.js'

const arg = (argList => {

    let arg = {}, a, opt, thisOpt, curOpt;
    for (a = 0; a < argList.length; a++) {

        thisOpt = argList[a].trim();
        opt = thisOpt.replace(/^\-+/, '');

        if (opt === thisOpt) {
            if (curOpt) arg[curOpt] = opt;
            curOpt = null;
        } else {
            curOpt = opt;
            arg[curOpt] = true;
        }

    }

    return arg;

})(process.argv);

gulp.task('build', function(cb) {
    migrate.build()
        .then((resp) => { cb(null); }, (err) => { cb(err) })
})

gulp.task('buildDev', function(cb) {
    migrate.buildDev()
        .then((resp) => { cb(null); }, (err) => { cb(err) })
})

gulp.task('minify', function(cb) {
    migrate.minify()
        .then((resp) => { cb(null); }, (err) => { cb(err) })
})

gulp.task('buildAll', gulp.series('build', 'minify'))
