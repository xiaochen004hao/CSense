import { VMAPI } from 'src/api/vmapi'
import { vm } from 'src/util/inject'
import { ResultOverlay } from 'src/overlay/result'
import { Monaco } from 'src/base/monaco'
import globalState from 'src/base/state'

export class ScriptScene {
  static title = '高级'
  constructor(manager) {
    this.manager = manager
    this.Monaco = null
    Monaco.then(v => {
      this.Monaco = v
      this.manager.requestUpdate()
    })
    this.editor = null
    this.overlay = null
  }
  run(code) {
    const engine = {
      async vm() {
        const v = await vm
        return new VMAPI(v)
      },
      get ccwdata() {
        return globalThis.ccwdata
      }
    }
    return new async function () {}.constructor('engine', code)(engine)
  }
  render() {
    if (!this.Monaco) {
      const loading = document.createElement('strong')
      loading.style.color = '#999'
      loading.textContent = '加载中...'
      loading.style.display = 'block'
      loading.style.textAlign = 'center'
      this.manager.target.appendChild(loading)
    } else {
      if (this.editor) this.editor.dispose()
      const container = document.createElement('div')
      container.style.display = 'flex'
      container.style.flexDirection = 'column'
      container.style.alignItems = 'center'
      container.style.padding = '10px'

      const description = document.createElement('p')
      description.textContent =
        '你可以指定一个自定义脚本用于进行自动化操作。可使用命令面板运行脚本。'
      description.style.marginBottom = '10px'
      container.appendChild(description)

      const editor = document.createElement('div')
      editor.style.width = '100%'
      editor.style.height = '300px'
      editor.style.marginBottom = '10px'
      const editorValue =
        window.localStorage.getItem('__csense-storaged-script') ??
        `// 这是 CSense Scripting API 的使用示例。
const vm = await engine.vm()
const target = vm.sprite('Stage').clones[0]
target.var('我的变量').set('你好').watch(function (before, after) {
  return '你好，' + after
}) // .freezing = true
`
      this.editor = this.Monaco.editor.create(editor, {
        value: editorValue,
        automaticLayout: true,
        language: 'javascript',
        tabSize: 2,
        insertSpaces: true,
        theme: 'vs-dark',
        "semanticHighlighting.enabled": true,
      })

      this.editor.addAction({
        id: 'csense.execute',
        label: `运行脚本`,
        contextMenuGroupId: 'csense',
        run: () => {
          const v = this.run(this.editor.getValue())
          this.overlay = new ResultOverlay(this.manager, true, '脚本已运行。')
          this.manager.addOverlay(this.overlay)
          v.then(
            () => {},
            err => {
              console.error(err)
              if (this.overlay) {
                this.overlay.isSuccess = false
                this.overlay.message = '发生错误。请检查 DevTools 控制台。'
                this.manager.requestUpdate()
              }
            }
          )
        }
      })

      this.editor.onDidChangeModelContent(() => {
        window.localStorage.setItem(
          '__csense-storaged-script',
          this.editor.getValue()
        )
      })

      container.appendChild(editor)
      this.manager.target.appendChild(container)
    }
  }
  dispose() {
    this.editor.dispose()
    this.manager.removeOverlay(this.overlay)
    this.overlay = null
  }
}
