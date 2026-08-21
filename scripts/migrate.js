'use strict'
import fs from 'fs'
import { exec } from 'child_process'

export function build() {
    return new Promise((resolve, reject) => {
        var cmd = 'rollup -c'
        exec(cmd, {}, (err, stdout, stderr) => {
            if (err) { console.log(stderr); reject(err) }
            else { console.log(stdout); resolve(stdout) }
        })
    })
}

export function buildDev() {
    return new Promise((resolve, reject) => {
        var cmd = 'npx rollup -c rollup.config.dev.mjs'
        exec(cmd, {}, (err, stdout, stderr) => {
            if (err) { console.log(stderr); reject(err) }
            else { console.log(stdout); resolve(stdout) }
        })
    })
}

export function copyBundle() {
    return new Promise((resolve, reject) => {
        fs.copyFile('./dist/bundle.js', './dist/bundle copy.js', (err) => {
            if (err) { reject(err) }
            else { console.log('bundle copy.js created'); resolve() }
        })
    })
}

export function minify() {
    return new Promise((resolve, reject) => {
        var cmd = 'npx uglifyjs dist/bundle.js -c -m -o dist/bundle-minified.js'
        exec(cmd, {}, (err, stdout, stderr) => {
            if (err) { console.log(stderr); reject(err) }
            else { console.log('UglifyJS second pass complete'); resolve(stdout) }
        })
    })
}
