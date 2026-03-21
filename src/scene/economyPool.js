import { createScrollable } from 'src/util/window'

export class EconomyPoolScene {
  static title = '币池管理'
  constructor(manager, extension, pool) {
    this.manager = manager
    this.extension = extension
    this.pool = pool
  }
  static parseRule(str) {
    let state = 0 // NORMAL
    let key = ''
    const res = []
    for (const c of str) {
      if (state === 0) {
        if (c === '[') {
          res.push(key)
          key = ''
          state = 1 // BRACE
        } else {
          key += c
        }
      } else if (state === 1) {
        if (c === ']') {
          state = 0 // NORMAL
          res.push({ name: key })
          key = ''
        } else {
          key += c
        }
      }
    }
    if (state !== 0) throw new Error('Brace unclosed')
    if (key !== '') res.push(key)
    return res
  }
  render() {
    const scrollable = createScrollable()
    const searchContainer = document.createElement('div')
    searchContainer.style.display = 'flex'
    searchContainer.style.justifyContent = 'center'

    const searchInput = document.createElement('input')
    searchInput.type = 'text'
    searchInput.placeholder = '搜索规则...'
    searchInput.style.padding = '5px'
    searchInput.style.border = '1px solid #0e0e0e'
    searchInput.style.width = '100%'
    searchInput.style.boxSizing = 'border-box'
    searchInput.style.backgroundColor = '#333333'
    searchInput.style.color = '#ffffff'

    searchInput.addEventListener('input', () => {
      const filter = searchInput.value.toLowerCase()
      const items = ruleList.children
      let hasResults = false
      Array.from(items).forEach(item => {
        if (
          item.className !== 'no-results' &&
          item.description.toLowerCase().includes(filter)
        ) {
          item.style.display = 'flex'
          hasResults = true
        } else if (item.className !== 'no-results') {
          item.style.display = 'none'
        }
      })

      if (!hasResults) {
        if (!ruleList.querySelector('.no-results')) {
          const noResultsItem = document.createElement('li')
          noResultsItem.textContent = '(无结果)'
          noResultsItem.className = 'no-results'
          noResultsItem.style.display = 'flex'
          noResultsItem.style.justifyContent = 'center'
          noResultsItem.style.alignItems = 'center'
          noResultsItem.style.width = '100%'
          noResultsItem.style.height = '100%'
          noResultsItem.style.color = '#999'
          ruleList.appendChild(noResultsItem)
        }
      } else {
        const noResultsItem = ruleList.querySelector('.no-results')
        if (noResultsItem) {
          ruleList.removeChild(noResultsItem)
        }
      }
    })

    searchContainer.appendChild(searchInput)
    this.manager.target.appendChild(searchContainer)
    const ruleList = document.createElement('ul')
    ruleList.style.marginTop = '10px'
    ruleList.style.padding = '0'
    ruleList.style.margin = '0'
    ruleList.style.listStyleType = 'none'

    if (this.pool.rules.length === 0) {
      const noResultsItem = document.createElement('li')
      noResultsItem.textContent = '(无结果)'
      noResultsItem.className = 'no-results'
      noResultsItem.style.display = 'flex'
      noResultsItem.style.justifyContent = 'center'
      noResultsItem.style.alignItems = 'center'
      noResultsItem.style.width = '100%'
      noResultsItem.style.height = '100%'
      noResultsItem.style.color = '#999'
      ruleList.appendChild(noResultsItem)
    } else {
      this.pool.rules.forEach(rule => {
        const listItem = document.createElement('li')
        listItem.description = rule.rule.funSignature.zh_cn
        listItem.style.display = 'flex'
        listItem.style.flexDirection = 'column'
        listItem.style.alignItems = 'flex-start'
        listItem.style.marginBottom = '5px'
        listItem.style.padding = '5px'
        listItem.style.border = '1px solid #0e0e0e'
        listItem.style.borderRadius = '4px'
        listItem.style.backgroundColor = '#1e1e1e'

        const ruleContainer = document.createElement('div')
        ruleContainer.style.display = 'flex'
        ruleContainer.style.alignItems = 'center'
        ruleContainer.style.width = '100%'

        const parsedRule = EconomyPoolScene.parseRule(
          rule.rule.funSignature.zh_cn
        )
        const inputs = {}
        for (const element of parsedRule) {
          if (typeof element === 'string') {
            const span = document.createElement('span')
            span.textContent = element
            span.style.textWrapMode = 'nowrap'
            span.style.overflow = 'hidden'
            span.style.textOverflow = 'ellipsis'
            ruleContainer.appendChild(span)
          } else {
            const input = document.createElement('input')
            input.type = 'number'
            input.placeholder = element.name
            input.style.border = 'none'
            input.style.outline = 'none'
            input.style.backgroundColor = 'transparent'
            input.style.textWrapMode = 'nowrap'
            input.style.overflow = 'hidden'
            input.style.textOverflow = 'ellipsis'
            input.style.marginRight = '5px'
            input.style.width = '50px' // Make input as small as possible
            ruleContainer.appendChild(input)
            inputs[element.name] = input
          }
        }
        const executeButton = document.createElement('button')
        executeButton.textContent = '执行'
        executeButton.style.cursor = 'pointer'
        executeButton.style.marginLeft = 'auto' // Align to the right
        executeButton.title = rule.rule.title
        executeButton.addEventListener('click', () => {
          let invalid = false
          const params = Object.fromEntries(
            Object.entries(inputs).map(([key, input]) => {
              const value = Number(input.value)
              if (input.value === '' || Number.isNaN(value) || value <= 0) {
                input.animate(
                  [{ backgroundColor: 'red' }, { backgroundColor: '' }],
                  {
                    duration: 300
                  }
                )
                invalid = true
                return [key, 0]
              } else return [key, value]
            })
          )
          if (!invalid) {
            this.extension.apis.requestExecuteSmartContract(
              this.pool.id,
              rule.id,
              rule.rule.code,
              params
            )
          }
        })

        ruleContainer.appendChild(executeButton)
        listItem.appendChild(ruleContainer)
        ruleList.appendChild(listItem)
      })
    }
    scrollable.appendChild(ruleList)
    this.manager.target.appendChild(scrollable)
    const fundPanel = document.createElement('div')
    fundPanel.style.display = 'flex'
    fundPanel.style.flexDirection = 'row'
    fundPanel.style.alignItems = 'flex-start'
    fundPanel.style.padding = '5px'
    fundPanel.style.border = '1px solid #0e0e0e'
    fundPanel.style.borderRadius = '4px'
    fundPanel.style.backgroundColor = '#1e1e1e'
    const detailButton = document.createElement('button')
    detailButton.textContent = '规则详情'
    detailButton.style.cursor = 'pointer'
    detailButton.style.marginRight = '5px'
    detailButton.title = '查看规则详情'
    detailButton.addEventListener('click', () => {
      this.extension.apis.showSmartContractDetail(this.pool.id)
    })
    fundPanel.appendChild(detailButton)
    const fundButton = document.createElement('button')
    fundButton.textContent = '无偿注资'
    fundButton.style.cursor = 'pointer'
    fundButton.title = '进行无偿注资'
    fundButton.addEventListener('click', () => {
      this.extension._requestFund({
        contractId: this.pool.id
      })
    })
    fundPanel.appendChild(fundButton)
    this.manager.target.appendChild(fundPanel)
  }
  dispose() { }
}
