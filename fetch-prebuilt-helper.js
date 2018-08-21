// inspired by https://github.com/Hackzzila/node-ffmpeg-binaries

const get = require('request')
const { cursorTo } = require('readline')
const decompress = require('decompress')
const targz = require('decompress-targz')
const unzip = require('decompress-unzip')

const { whereis } = require('./util')

function callback (err, res) {
  if (err) {
    throw new Error(err)
  }

  console.log('statusCode:', res.statusCode)
  console.log('headers:', res.headers)
  let last
  let complete = 0
  const total = parseInt(res.headers['content-length'], 10)

  let index = 0
  const buf = Buffer.alloc(total)

  res.on('data', (chunk) => {
    chunk.copy(buf, index)
    index += chunk.length

    complete += chunk.length
    const progress = Math.round((complete / total) * 20)

    if (progress !== last) {
      cursorTo(process.stdout, 0, null)

      process.stdout.write(`Downloading systrayhelper: [${'='.repeat(progress)}${[' '.repeat(20 - progress)]}] ${Math.round((complete / total) * 100)}%`)

      last = progress
    }
  })

  res.on('end', () => {
    cursorTo(process.stdout, 0, null)
    console.log(`Downloading systrayhelper: [${'='.repeat(20)}] 100%`)

    decompress(buf, 'bin', {
      plugins: process.platform === 'win32' ? [unzip()] : [targz()]
      // strip: process.platform === 'linux' ? 1 : 2
      // filter: x => x.path === (process.platform === 'win32' ? 'systrayhelper.exe' : 'systrayhelper'),
    }).then((done) => {
      console.log(`decompress Done!`, done)
    }, (err) => {
      console.log(err)
    })
  })
}

const found = whereis('systrayhelper')
if (found !== '') {
  console.warn('systrayhelper already installed')
  process.exit(0)
}

try {
  if (process.platform === 'win32') {
    switch (process.arch) {
      case 'x64':
        get('https://github.com/ssbc/systrayhelper/releases/download/v0.0.0/systrayhelper_0.0.0_windows_amd64.zip', callback)
        break
      case 'ia32':
        get('https://github.com/ssbc/systrayhelper/releases/download/v0.0.0/systrayhelper_0.0.0_windows_386.zip', callback)
        break
      default:
        throw new Error('unsupported architecture:' + process.arch)
    }
  } else if (process.platform === 'linux') {
    switch (process.arch) {
      case 'x64':
        get('https://github.com/ssbc/systrayhelper/releases/download/v0.0.0/systrayhelper_0.0.0_linux_amd64.tar.gz', callback)
        break
      default:
        throw new Error('unsupported architecture:' + process.arch)
    }
  } else if (process.platform === 'darwin') {
    switch (process.arch) {
      case 'x64':
        get('https://github.com/ssbc/systrayhelper/releases/download/v0.0.0/systrayhelper_0.0.0_darwin_amd64.tar.gz', callback)
        break
      default:
        throw new Error('unsupported architecture:' + process.arch)
    }
  } else {
    throw new Error('unsupported platform')
  }
} catch (e) {
  console.error(e)
  console.log(`Tried to install pre-built systrayhelper.

Sorry, You might have to do some console-magic...

1) Install Go - See https://golang.org/doc/install
2) run: go get github.com/ssbc/systrayhelper
3) setup $PATH to contain $HOME/go/bin

TODO: evaluate falling back to https://github.com/chemdrew/npm-golang`)
}
