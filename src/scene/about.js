import { createScrollable } from 'src/util/window'
import LOGO_IMG from '../asset/logo.svg'

export class AboutScene {
  static title = '关于'
  constructor(manager) {
    this.manager = manager
  }
  pSmall(message) {
    const p = document.createElement('p')
    p.textContent = message
    p.style.textAlign = 'center'
    p.style.fontSize = 'small'
    return p
  }
  render() {
    const scrollable = createScrollable()
    const container = document.createElement('div')
    const logo = document.createElement('img')
    logo.src = LOGO_IMG
    logo.alt = 'C-S-ense'
    logo.style.display = 'block'
    logo.style.margin = '0 auto'
    logo.style.width = '120px'
    logo.style.height = '120px'
    logo.style.marginTop = '30px'
    logo.style.marginBottom = '20px'
    container.appendChild(logo)

    const description = document.createElement('p')
    description.textContent = '一个川菜王 - 安全审计 - 工具。'
    description.style.textAlign = 'center'
    description.style.fontWeight = 'bold'
    description.style.fontSize = 'small'
    container.appendChild(description)

    container.appendChild(this.pSmall('此工具基于 AGPL-3.0 协议发布。'))
    container.appendChild(
      this.pSmall(
        '使用此工具即代表您愿意为您的所有行为负全部责任，与此工具的开发者无关。'
      )
    )
    container.appendChild(
      this.pSmall(
        '在遵循开源协议的前提下，您可以对此工具进行自由修改、分发、二次创作。'
      )
    )
    container.appendChild(this.pSmall('请勿将此工具用于非法用途。'))
    container.appendChild(
      this.pSmall(
        '此工具的源代码位于 https://github.com/xiaochen004hao/CSense。'
      )
    )

    scrollable.appendChild(container)
    this.manager.target.appendChild(scrollable)
  }
  dispose() {}
}
