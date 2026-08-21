'use strict'
import jsforce from 'jsforce'
import fs from 'fs'
import { exec } from 'child_process'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

export default function(alias) {
    return new Promise((resolve, reject) => {
        if (alias) {
            exec(`sfdx force:org:display --json -u ${alias}`, {}, (err, stdout) => {
                if (err) { reject(err); return; }
                const { instanceUrl, accessToken } = JSON.parse(stdout).result
                const conn = new jsforce.Connection({ instanceUrl, accessToken })
                conn.identity((e) => e ? reject(e) : resolve(conn))
            })
        } else if (fs.existsSync('./sfCredentials.json')) {
            const creds = require('../sfCredentials.json')
            const conn  = new jsforce.Connection({ loginUrl: creds.loginUrl || 'https://test.salesforce.com' })
            conn.login(creds.username, creds.password + (creds.token || ''), (err) =>
                err ? reject(err) : resolve(conn))
        } else {
            reject('Provide -u alias or fill sfCredentials.json')
        }
    })
}
