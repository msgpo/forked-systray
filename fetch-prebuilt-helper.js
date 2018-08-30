// inspired by https://github.com/Hackzzila/node-ffmpeg-binaries
const get = require('request')
const decompress = require('decompress')
const targz = require('decompress-targz')
const unzip = require('decompress-unzip')

const { whereis } = require('./util')

function callback (err, res, body) {
  if (err) throw err

  const { statusCode } = res
  const contentType = res.headers['content-type']

  let error
  if (statusCode !== 200) {
    error = new Error(`Download Request Failed.\nStatus Code: ${statusCode}`)
  } else if (contentType !== 'application/octet-stream') {
    error = new Error('Invalid content-type.\n' +
                      `Expected application/octet-stream but received ${contentType}`)
  }
  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  /*
  const ProgressBar = require('progress')
  const total = parseInt(res.headers['content-length'], 10)
  console.log('helper download started')
  var bar = new ProgressBar('  downloading [:bar] :rate/bps :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: total
  })

  res.setEncoding('utf8')
  let rawData = ''
  body.on('data', (chunk) => {
    rawData += chunk
    bar.tick(chunk.length)
  })

  body.on('end', () => {
    console.log('\nDownload done.')
  })
  */
  const opts = {
    plugins: process.platform === 'win32' ? [unzip()] : [targz()]
    // strip: process.platform === 'linux' ? 0 : 1,
    // filter: x => x.path === (process.platform === 'win32' ? 'systrayhelper.exe' : 'systrayhelper')
  }
  decompress(Buffer.from(body), 'binout', opts).then((files) => {
    console.log('decompress Done!', files)
  }, (err) => {
    console.log('decompress failed:', err)
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
