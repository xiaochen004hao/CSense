import { createScrollable, windowOpen } from 'src/util/window'

export class LeaderboardScene {
  static title = '排行榜'
  constructor(manager, extension, leaderboardId) {
    this.manager = manager
    this.extension = extension
    this.leaderboardId = leaderboardId
    this.leaderboard = null
    this.fetching = false
  }
  render() {
    const scrollable = createScrollable()
    if (!this.leaderboard) {
      if (!this.fetching)
        fetch(
          `https://gandi-main.ccw.site/creation/leaderboards/${this.leaderboardId}/records`,
          {
            credentials: 'include'
          }
        )
          .then(v => v.json())
          .then(v => {
            if (v.body) {
              this.leaderboard = v.body
              this.fetching = false
              this.manager.requestUpdate()
            }
          })
      this.fetching = true
      const loading = document.createElement('strong')
      loading.style.color = '#999'
      loading.textContent = '加载中...'
      loading.style.display = 'block'
      loading.style.textAlign = 'center'
      scrollable.appendChild(loading)
      this.manager.target.appendChild(scrollable)
    } else {
      const searchContainer = document.createElement('div')
      searchContainer.style.display = 'flex'
      searchContainer.style.justifyContent = 'center'

      const searchInput = document.createElement('input')
      searchInput.type = 'text'
      searchInput.placeholder = '搜索排行榜...'
      searchInput.style.padding = '5px'
      searchInput.style.border = '1px solid #0e0e0e'
      searchInput.style.width = '100%'
      searchInput.style.boxSizing = 'border-box'
      searchInput.style.backgroundColor = '#333333'
      searchInput.style.color = '#ffffff'

      searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase()
        const items = leaderboardList.children
        let hasResults = false
        Array.from(items).forEach(item => {
          if (
            item.className !== 'no-results' &&
            item
              .querySelector('.item-name')
              .textContent.toLowerCase()
              .includes(filter)
          ) {
            item.style.display = 'flex'
            hasResults = true
          } else if (item.className !== 'no-results') {
            item.style.display = 'none'
          }
        })

        if (!hasResults) {
          if (!leaderboardList.querySelector('.no-results')) {
            const noResultsItem = document.createElement('li')
            noResultsItem.textContent = '(无结果)'
            noResultsItem.className = 'no-results'
            noResultsItem.style.display = 'flex'
            noResultsItem.style.justifyContent = 'center'
            noResultsItem.style.alignItems = 'center'
            noResultsItem.style.width = '100%'
            noResultsItem.style.height = '100%'
            noResultsItem.style.color = '#999'
            leaderboardList.appendChild(noResultsItem)
          }
        } else {
          const noResultsItem = leaderboardList.querySelector('.no-results')
          if (noResultsItem) {
            leaderboardList.removeChild(noResultsItem)
          }
        }
      })

      searchContainer.appendChild(searchInput)
      this.manager.target.appendChild(searchContainer)
      const leaderboardList = document.createElement('ul')
      leaderboardList.style.marginTop = '10px'
      leaderboardList.style.padding = '0'
      leaderboardList.style.margin = '0'
      leaderboardList.style.listStyleType = 'none'

      this.leaderboard.leaderboardRecords.forEach(record => {
        const listItem = document.createElement('li')
        listItem.style.display = 'flex'
        listItem.style.flexDirection = 'column'
        listItem.style.alignItems = 'flex-start'
        listItem.style.padding = '5px'
        listItem.style.border = '1px solid #0e0e0e'
        listItem.style.borderRadius = '4px'
        listItem.style.backgroundColor = '#1e1e1e'

        const rankSpan = document.createElement('span')
        rankSpan.textContent = `${record.ranking}`
        rankSpan.style.marginRight = '10px'

        const nameContainer = document.createElement('div')
        nameContainer.style.display = 'flex'
        nameContainer.style.alignItems = 'center'
        nameContainer.style.width = '100%'

        const avatar = document.createElement('img')
        avatar.src = record.user.avatar
        avatar.alt = 'avatar'
        avatar.style.width = '24px'
        avatar.style.height = '24px'
        avatar.style.marginRight = '10px'
        avatar.style.cursor = 'pointer'
        avatar.style.borderRadius = '50%'
        avatar.title = '查看主页'
        avatar.addEventListener('click', () => {
          windowOpen(
            `https://www.ccw.site/student/${record.user.id}`,
            'window',
            'left=100,top=100,width=640,height=640'
          )
        })

        const nameSpan = document.createElement('span')
        nameSpan.textContent = record.user.nickname
        nameSpan.className = 'item-name'
        nameSpan.style.flexGrow = '1'
        nameSpan.style.marginRight = '10px'
        nameSpan.style.textWrapMode = 'nowrap'
        nameSpan.style.overflow = 'hidden'
        nameSpan.style.textOverflow = 'ellipsis'
        nameSpan.title = `创建时间 ${record.createdAt === null ? '未知' : new Date(record.createdAt)
          } / 最后更新 ${record.updatedAt === null ? '未知' : new Date(record.updatedAt)
          }`

        const scoreSpan = document.createElement('span')
        scoreSpan.textContent = `${record.score} ${this.leaderboard.scoreUnit}`
        scoreSpan.style.color = '#666'
        scoreSpan.style.textWrapMode = 'nowrap'
        scoreSpan.style.overflow = 'hidden'
        scoreSpan.style.textOverflow = 'ellipsis'

        nameContainer.appendChild(rankSpan)
        nameContainer.appendChild(avatar)
        nameContainer.appendChild(nameSpan)
        nameContainer.appendChild(scoreSpan)

        listItem.appendChild(nameContainer)
        leaderboardList.appendChild(listItem)
      })

      scrollable.appendChild(leaderboardList)

      this.manager.target.appendChild(scrollable)

      if (this.leaderboard.curUserLeaderboardRecord) {
        // this.extension.apis.insertLeaderboard(oid, value, extra)
        const record = this.leaderboard.curUserLeaderboardRecord
        const userItem = document.createElement('div')
        userItem.style.display = 'flex'
        userItem.style.flexDirection = 'column'
        userItem.style.alignItems = 'flex-start'
        userItem.style.padding = '5px'
        userItem.style.border = '1px solid #0e0e0e'
        userItem.style.borderRadius = '4px'
        userItem.style.backgroundColor = '#1e1e1e'

        const rankSpan = document.createElement('span')
        rankSpan.textContent = `${record.ranking}`
        rankSpan.style.marginRight = '10px'

        const nameContainer = document.createElement('div')
        nameContainer.style.display = 'flex'
        nameContainer.style.alignItems = 'center'
        nameContainer.style.width = '100%'

        const avatar = document.createElement('img')
        avatar.src = record.user.avatar
        avatar.alt = 'avatar'
        avatar.style.width = '24px'
        avatar.style.height = '24px'
        avatar.style.marginRight = '10px'
        avatar.style.cursor = 'default'
        avatar.style.borderRadius = '50%'

        const nameSpan = document.createElement('span')
        nameSpan.textContent = record.user.nickname
        nameSpan.style.flexGrow = '1'
        nameSpan.style.marginRight = '10px'
        nameSpan.style.textWrapMode = 'nowrap'
        nameSpan.style.overflow = 'hidden'
        nameSpan.style.textOverflow = 'ellipsis'
        nameSpan.title = `创建时间 ${record.createdAt === null ? '未知' : new Date(record.createdAt)
          } / 最后更新 ${record.updatedAt === null ? '未知' : new Date(record.updatedAt)
          }`

        const scoreInput = document.createElement('input')
        scoreInput.value = record.score
        scoreInput.type = 'number'
        scoreInput.style.border = 'none'
        scoreInput.style.outline = 'none'
        scoreInput.style.direction = 'rtl'
        scoreInput.style.color = '#666'
        scoreInput.style.width = '100%'
        scoreInput.style.backgroundColor = 'transparent'
        scoreInput.placeholder = '(无分数)'
        scoreInput.style.marginRight = '5px'
        scoreInput.addEventListener('change', () => {
          const v = Number(scoreInput.value)
          if (Number.isNaN(v)) {
            scoreInput.value = record.score
          } else if (record.value !== v) {
            record.score = v
            this.extension.apis.insertLeaderboard(
              this.leaderboardId,
              record.score,
              record.ext
            )
          }
        })

        const unitSpan = document.createElement('span')
        unitSpan.textContent = `${this.leaderboard.scoreUnit}`
        unitSpan.style.color = '#666'
        unitSpan.style.textWrapMode = 'nowrap'
        unitSpan.style.textOverflow = 'ellipsis'

        nameContainer.appendChild(rankSpan)
        nameContainer.appendChild(avatar)
        nameContainer.appendChild(nameSpan)
        nameContainer.append(scoreInput)
        nameContainer.appendChild(unitSpan)

        userItem.appendChild(nameContainer)
        this.manager.target.appendChild(userItem)
      }
    }
  }
  dispose() { }
}
