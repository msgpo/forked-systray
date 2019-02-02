#! /usr/bin/env node

// this script updates the blob keys in the prebuilts.json

const fs = require('fs')
const ssb = require('ssb-client')

const { join } = require('path')

const prebuildsJSON = './prebuilts.json'
const current = require(prebuildsJSON)

const fetchLoc = 'fetches'

var i = 0
for (const plat of Object.keys(current)) {
  for (const arch of Object.keys(current[plat])) {
    i++
    request.get(f)
      .on('error', logErr)
      .pipe(shaThrough)
      .pipe(fs.createWriteStream(join(fetchLoc, plat + '_' + arch)))
      .on('finish', () => { i-- })
  }
}

let done = setInterval(() => {
  if (i === 0) {
    fs.writeFileSync(prebuildsJSON, JSON.stringify(current, null, 2))
    clearInterval(done)
    console.log('done.', prebuildsJSON, 'updated.')
  } else {
    console.log('still waiting for ', i, 'downloads')
  }
}, 2000)
