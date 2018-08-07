const { existsSync } = require('fs')

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
    return ""
}

exports.whereis = whereis;