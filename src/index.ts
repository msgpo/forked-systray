import * as child from 'child_process'
import * as EventEmitter from 'events'


// missing TS definitions
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var pndj = require('pull-ndjson')

const { whereis, helperName } = require('../util')

export type MenuItem = {
  title: string,
  tooltip: string,
  checked: boolean,
  enabled: boolean,
}

export type Menu = {
  icon: string,
  title: string,
  tooltip: string,
  items: MenuItem[],
}

export type ClickEvent = {
  type: 'clicked',
  item: MenuItem,
  seq_id: number,
}

export type ReadyEvent = {
  type: 'ready',
}

export type Event = ClickEvent | ReadyEvent

export type UpdateItemAction = {
  type: 'update-item',
  item: MenuItem,
  seq_id: number,
}

export type UpdateMenuAction = {
  type: 'update-menu',
  menu: Menu,
  seq_id: number,
}

export type UpdateMenuAndItemAction = {
  type: 'update-menu-and-item',
  menu: Menu,
  item: MenuItem,
  seq_id: number,
}

export type Action = UpdateItemAction | UpdateMenuAction | UpdateMenuAndItemAction

export type Conf = {
  menu: Menu,
}

const CHECK_STR = ' (√)'
function updateCheckedInLinux(item: MenuItem) {
  if (process.platform !== 'linux') {
    return item
  }
  if (item.checked) {
    item.title += CHECK_STR
  } else {
    item.title = (item.title || '').replace(RegExp(CHECK_STR + '$'), '')
  }
  return item
}

export default class SysTray extends EventEmitter {
  protected _conf: Conf
  protected _helper: child.ChildProcess
  protected _helperPath: string

  private toHelper = (evt: any) => {
    pull(
      pull.values([evt]),
      pndj.serialize(),
      this.debugPull('hstdin'),
      toPull.sink(this._helper.stdin)
    )
  }

  private debugPull = (from: string) => {
    if (typeof process.env["DEBUG"] === 'undefined') {
      return pull.through()
    }
    return pull.through((data: any) => {
      if (data instanceof Buffer) {
        console.warn(from, ":", data.toString())
      } else {
        console.warn(from, ":", data)
      }
    })
  }


  constructor(conf: Conf) {
    super()
    this._conf = conf
    this._helperPath = whereis(helperName)
    if (this._helperPath === '') {
      console.error('could not locate helper binary:', helperName)
      process.exit(1)
    }
    this._helper = child.spawn(this._helperPath, [], {
      windowsHide: true
    })
    if (typeof process.env["DEBUG"] === 'undefined') {
      pull(toPull.source(this._helper.stderr), toPull.sink(process.stderr))
    }

    // onReady and onClick
    pull(
      toPull.source(this._helper.stdout),
      this.debugPull("hstdout"),
      pndj.parse(),
      pull.drain((v: any) => {
        if (v.type === 'ready') {
          this.emit('ready', v)
        }
        if (v.type === 'clicked') {
          this.emit('click', v)
        }
      })
    )

    conf.menu.items = conf.menu.items.map(updateCheckedInLinux)
    this.toHelper(conf.menu)

    // was onError
    this._helper.on('error', e => {
      this.emit('error', e)
    })

    // was onExit
    this._helper.on('exit', (code, signal) => {
      this.emit('exit', {code, signal})
    })

    // was sendAction
    this.on('action', (action: Action) => {
      // not sure what the point of this is.
      switch (action.type) {
        case 'update-item':
          action.item = updateCheckedInLinux(action.item)
          break
        case 'update-menu':
          action.menu.items = action.menu.items.map(updateCheckedInLinux)
          break
        case 'update-menu-and-item':
          action.menu.items = action.menu.items.map(updateCheckedInLinux)
          action.item = updateCheckedInLinux(action.item)
          break
      }
      this.toHelper(action)
    })
  }

  /**
   * Kill the systray process
   * @param exitNode Exit current node process after systray process is killed, default is true
   */
  kill(exitNode = true) {
    this._helper.kill()
    if (exitNode) {
      this.on('exit', () => process.exit(0))
    }
  }
}
