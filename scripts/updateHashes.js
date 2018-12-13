#! /usr/bin/env node

/*
 * this script updates the hashes of the files
 * right now only github releases works
 * but I also want to add ssb blobs and maybe ipfs?
 */

const fs = require('fs')
const request = require('request')

const { shasum } = require('../util.js')

const prebuildsJSON = './prebuilts.json'
const current = require(prebuildsJSON)

let from = process.argv[2]
if (typeof from === 'undefined') from = 'github'
console.log('fetching from', from)

var i = 0
for (const plat of Object.keys(current)) {
  for (const arch of Object.keys(current[plat])) {
    const f = current[plat][arch][from]
    const shaThrough = shasum((got) => {
      current[plat][arch]['hash'] = got
    })
    i++
    let req = request.get(f)
      .on('error', logErr)
      .pipe(shaThrough)
      .pipe(fs.createWriteStream('/dev/null')) // must write somewhere
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

function logErr(err) {
  console.error(err)
  process.exitCode = 1
}
