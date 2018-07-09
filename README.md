# forked-systray

> SysTray library for nodejs using [ssbc/systrayhelper](https://github.com/ssbc/systrayhelper) (a portable version of [the go systray library](https://github.com/getlantern/systray)).

## forked why?

The [original version built by zaaack](https://github.com/zaaack/node-systray) contianed the compiled helper binaries inside the npm package. I didn't like this approach and therefore added a prebuild fetcher as a npm [postinstall hook](https://docs.npmjs.com/misc/scripts).

## Install

```sh
npm i forked-systray
```

## Usage

```ts
import SysTray from 'forked-systray'

const systray = new SysTray({
    menu: {
        // you should using .png icon in macOS/Linux, but .ico format in windows
        icon: "<base64 image string>",
        title: "标题",
        tooltip: "Tips",
        items: [{
            title: "aa",
            tooltip: "bb",
            // checked is implement by plain text in linux
            checked: true,
            enabled: true
        }, {
            title: "aa2",
            tooltip: "bb",
            checked: false,
            enabled: true
        }, {
            title: "Exit",
            tooltip: "bb",
            checked: false,
            enabled: true
        }]
    },
    debug: false,
    copyDir: true, // copy go tray binary to outside directory, useful for packing tool like pkg.
})

systray.onClick(action => {
    if (action.seq_id === 0) {
        systray.sendAction({
            type: 'update-item',
            item: {
            ...action.item,
            checked: !action.item.checked,
            },
            seq_id: action.seq_id,
        })
    } else if (action.seq_id === 1) {
        // open the url
        console.log('open the url', action)
    } else if (action.seq_id === 2) {
        systray.kill()
    }
})

```

For more API info please see https://zaaack.github.io/node-systray/

Here is also a demo project you might want to check out, it shows how to integrate this library with [opn](https://github.com/sindresorhus/opn), [node-notifier](https://github.com/mikaelbr/node-notifier) and [node-packer](https://github.com/pmq20/node-packer):

> https://github.com/zaaack/aria2c-node-gui

## License
MIT
