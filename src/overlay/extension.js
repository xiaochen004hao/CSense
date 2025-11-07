import { ExtensionScene } from 'src/scene/extension'
import globalState from '../base/state'

export class ExtensionOverlay {
  /**
   * @param {import('../base/scene.js').SceneManager} manager
   * @param {import('jszip')} input
   * @param {object} projectJson
   * @param {PromiseWithResolvers<import('jszip')>} resolver
   */
  constructor(manager, input, projectJson, resolver) {
    this.manager = manager
    this.input = input
    this.projectJson = projectJson
    this.resolver = resolver
    this.showOverlay = true
    this.resolver.promise.then(() => {
      manager.removeOverlay(this)
    })
    globalState.button.style.filter = 'invert(1) hue-rotate(180deg)'
    globalState.button.title = 'C-S-ense 拦截了扩展的加载，请点击进行处理。'

    this.scene = new ExtensionScene(this.manager, this)
  }
  render() {
    if (
      this.manager.scene.at(-1).constructor.title !== '主页' ||
      !this.showOverlay
    ) {
      return
    }
    const target = this.manager.target
    const warningDiv = document.createElement('div')
    warningDiv.style.cursor = 'pointer'
    warningDiv.textContent = '请处理项目扩展'
    warningDiv.title =
      '该项目自带了一些扩展。在您确认之前，项目将不会加载。点击此处进行处理。'
    warningDiv.style.width = '100%'
    warningDiv.style.backgroundColor = 'orange'
    warningDiv.style.color = 'black'
    warningDiv.style.textAlign = 'center'
    warningDiv.style.padding = '5px'
    warningDiv.style.fontSize = '12px'
    warningDiv.style.boxSizing = 'border-box'
    warningDiv.addEventListener('click', async () => {
      this.manager.open(this.scene)
    })
    target.appendChild(warningDiv)
  }
  dispose() {
    globalState.button.style.filter = 'none'
    globalState.button.title = '川菜王？脆弱性？的根本证明？'
  }
}
