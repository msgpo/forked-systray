'use strict'
// inspired by https://github.com/Hackzzila/node-ffmpeg-binaries
const request = require('request')
const progress = require('stream-progressbar')
const ADAMzip = require('adm-zip')
const gunzip = require('gunzip-maybe')
const tarFs = require('tar-fs')

const { execSync } = require('child_process')
const os = require('os')
const fs = require('fs')
const { join } = require('path')

const { whereis, helperName, helperLocation, errorAndExit, shasum } = require('../util')

// cleanup previous versions - should make sure we can write there
if (fs.existsSync(helperLocation)) {
  fs.unlinkSync(helperLocation)
}

const found = whereis(helperName)
if (found !== '') {
  testExecutable(found)
  fs.createReadStream(found).pipe(fs.createWriteStream(helperLocation));
  // we need to copy so it's bundled correctly by electron-builder
  // sorry - i also hate mixing assumptions like this...
  console.warn('systrayhelper already installed - copied', found)
  process.exit(0)
}

const tmpDownload = join(os.tmpdir(), 'node-systray-downloadHelper')
const tmpUnpack = join(os.tmpdir(), 'node-systray-unpack')

console.warn('systrayhelper not installed!')
console.log('trying to fetching prebuilt for:', process.platform)
console.log('donload location:', tmpDownload)

try {
  const locations = require('./prebuilts.json')

  const hasOS = locations[process.platform]
  if (!hasOS) {
    throw new Error('unsupported platform:' + process.platform)
  }
  const urlAndHash = hasOS[process.arch]
  if (!urlAndHash) {
    throw new Error('unsupported architecture:' + process.arch)
  }

  // TODO: add FROM_SSB_BLOBS mode
  const fileUrl = urlAndHash.github

  const shaThrough = shasum((got) => {
    if (got !== urlAndHash.hash) {
      throw new Error(`shasum hash mismatch - want:${want} got:${got}`)
    }
  })

  // unpackPhase
  let req = request.get(fileUrl)
    .on('error', errorAndExit)
    .pipe(progress(':bar'))
    .pipe(shaThrough)
  if (process.platform === 'win32') {
    req
      .pipe(fs.createWriteStream(tmpDownload))
      .on('finish', () => {
        console.log('finished dowloading')
        const zip = new ADAMzip(tmpDownload)
        console.log('start unzip')
        zip.extractAllTo(tmpUnpack, true)
        console.log('finished unzip')
        let p = join(tmpUnpack, helperName)
        testExecutable(p)
        cleanup(p)
      })
  } else {
    req
      .pipe(gunzip())
      .pipe(tarFs.extract(tmpUnpack))
      .on('finish', () => {
        console.log('finished untar')
        const p = join(tmpUnpack, helperName)
        testExecutable(p)
        cleanup(p)
      })
  }
} catch (e) {
  errorAndExit(e)
}

function testExecutable(path) {
  console.log('testing execution')
  try {
    execSync(path + ' --test') // assumptions: exits when invoked with args!=1
  } catch (e) {
    errorAndExit(e)
  }
  console.log('helper started succesful!')
}

function cleanup(path) {
  try {
    fs.createReadStream(path).pipe(fs.createWriteStream(helperLocation));
    fs.unlinkSync(tmpDownload)
    fs.unlinkSync(tmpUnpack)
    console.log('cleanup down. the helper is here:', helperLocation)
  } catch (e) {
    console.error(`Exception ${e}`)
  }
}

