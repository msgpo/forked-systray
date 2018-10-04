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

const { whereis, helperName, helperLocation, errorAndExit } = require('../util')

const found = whereis(helperName)
if (found !== '') {
  testExecutable(found)
  fs.symlinkSync(found, helperLocation)
  console.warn('systrayhelper already installed. - created symlink to', found)
  process.exit(0)
}

const tmpDownload = join(os.tmpdir(), 'node-systray-downloadHelper')
const tmpUnpack = join(os.tmpdir(), 'node-systray-unpack')

console.warn('systrayhelper not installed!')
console.log('trying to fetching prebuilt for:', process.platform)
console.log('donload location:', tmpDownload)

try {
  const urls = {
    'win32': {
      'x64': 'https://github.com/ssbc/systrayhelper/releases/download/v0.0.3/systrayhelper_0.0.3_windows_amd64.zip',
      'ia32': 'https://github.com/ssbc/systrayhelper/releases/download/v0.0.3/systrayhelper_0.0.3_windows_386.zip'
    },
    'linux': {
      'x64': 'https://github.com/ssbc/systrayhelper/releases/download/v0.0.3/systrayhelper_0.0.3_linux_amd64.tar.gz'
    },
    'darwin': {
      'x64': 'https://github.com/ssbc/systrayhelper/releases/download/v0.0.3/systrayhelper_0.0.3_darwin_amd64.tar.gz'
    }
  }
  const hasOS = urls[process.platform]
  if (!hasOS) {
    throw new Error('unsupported platform:' + process.platform)
  }
  const fileUrl = hasOS[process.arch]
  if (!fileUrl) {
    throw new Error('unsupported architecture:' + process.arch)
  }

  // unpackPhase
  let req = request.get(fileUrl)
    .on('error', errorAndExit)
    .pipe(progress(':bar'))
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

function testExecutable (path) {
  console.log('testing execution')
  try {
    execSync(path + ' --test') // assumptions: exits when invoked with args!=1
  } catch (e) {
    errorAndExit(e)
  }
  console.log('helper started succesful!')
}

function cleanup (path) {
  try {
    fs.renameSync(path, helperLocation)
    fs.chmodSync(helperLocation, '500')
    fs.unlinkSync(tmpDownload)
    fs.unlinkSync(tmpUnpack)
    console.log('cleanup down. the helper is here:', helperLocation)
  } catch (e) {
    console.error(`Exception ${e}`)
  }
}
