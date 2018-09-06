const { existsSync } = require('fs')
const { join } = require('path')
const { homedir } = require('os')

/* cloned from node-whereis@0.0.1
github repo was removed somehow so no way to give feedback/PRs
therefore copied it here */
const whereis = (filename) => {
  const pathSep = process.platform === 'win32' ? ';' : ':'
  const directories = process.env.PATH.split(pathSep)
  for (var i = 0; i < directories.length; i++) {
    var path = directories[i] + '/' + filename
    if (existsSync(path)) {
      return path
    }
  }
  // impure check if we already fetched the helper
  if (existsSync(helperLocation)) {
    return helperLocation
  }
  return ''
}

exports.whereis = whereis

const helperName = process.platform === 'win32' ? 'systrayhelper.exe' : 'systrayhelper'
exports.helperName = helperName

// this is the fallback location where the prebuilt will be put
const helperLocation = join(homedir(), '.cache', helperName)
exports.helperLocation = helperLocation

exports.errorAndExit = (err) => {
  console.error(err)
  console.warn('\n######\nHello, sorry you had to see this...')
  console.warn(`\nFailed to fetch pre-built systrayhelper.
  Most likely the combination of OS and Architecture isn't currently supported.
  
  To still get this working you will have to do some console-magic...
  
  1) Install Go - See https://golang.org/doc/install
  1.5) On linux: you need two libraries, listed here: https://github.com/getlantern/systray#platform-specific-concerns
  2) run this command: go get github.com/ssbc/systrayhelper
  3) sudo mv $HOME/go/bin/systrayhelper /usr/local/bin (or any other folder, as long as it's in your $PATH)
  
  TODO: evaluate falling back to https://github.com/chemdrew/npm-golang
  TODO: brew.sh and windows snoop templates installing the helper`)
  process.exit(1)
}
