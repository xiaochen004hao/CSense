import { createScrollable } from 'src/util/window'
import { LeaderboardScene } from './leaderboard'

export class AchievementScene {
  static title = '成就'
  constructor(manager, extension) {
    this.manager = manager
    this.extension = extension
    this.achievementList = null
    this.leaderboardList = null
    this.selected = 'achievement' // 'leaderboard'
    this.fetchingAchievement = false
    this.fetchingLeaderboard = false
  }
  renderLeaderboard() {
    const scrollable = createScrollable()
    if (!this.leaderboardList) {
      if (!this.fetchingLeaderboard)
        fetch(
          `https://gandi-main.ccw.site/creation/leaderboards?creationId=${this.extension.runtime.ccwAPI.getProjectUUID()}&perPage=200`,
          {
            credentials: 'include'
          }
        )
          .then(v => v.json())
          .then(v => {
            if (v.body) {
              this.leaderboardList = v.body
              this.fetchingLeaderboard = false
              this.manager.requestUpdate()
            }
          })
      this.fetchingLeaderboard = true
      const loading = document.createElement('strong')
      loading.style.color = '#999'
      loading.textContent = '加载中...'
      loading.style.display = 'block'
      loading.style.textAlign = 'center'
      scrollable.appendChild(loading)
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
      if (this.leaderboardList.length === 0) {
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
      } else {
        this.leaderboardList.forEach(leaderboard => {
          const listItem = document.createElement('li')
          listItem.style.display = 'flex'
          listItem.style.flexDirection = 'column'
          listItem.style.alignItems = 'flex-start'
          listItem.style.marginBottom = '5px'
          listItem.style.padding = '5px'
          listItem.style.border = '1px solid #0e0e0e'
          listItem.style.borderRadius = '4px'
          listItem.style.backgroundColor = '#1e1e1e'

          const nameContainer = document.createElement('div')
          nameContainer.style.display = 'flex'
          nameContainer.style.alignItems = 'center'
          nameContainer.style.width = '100%'

          const nameSpan = document.createElement('span')
          nameSpan.textContent = leaderboard.title
          nameSpan.className = 'item-name'
          nameSpan.title = `创建时间 ${leaderboard.createdAt === null
            ? '未知'
            : new Date(leaderboard.createdAt)
            } / 最后更新 ${new Date(
              leaderboard.updatedAt === null ? '未知' : leaderboard.updatedAt
            )}`
          nameSpan.style.flexGrow = '1'
          nameSpan.style.marginRight = '10px'

          const inspectButton = document.createElement('button')
          inspectButton.textContent = '🔍'
          inspectButton.style.cursor = 'pointer'
          inspectButton.style.marginRight = '5px'
          inspectButton.style.backgroundColor = "#1e1e1e"
          inspectButton.title = '查看排行榜'
          inspectButton.addEventListener('click', () => {
            this.manager.open(
              new LeaderboardScene(
                this.manager,
                this.extension,
                leaderboard.oid
              )
            )
          })

          const extra = document.createElement('span')
          extra.title = extra.textContent = `单位: ${leaderboard.scoreUnit}`
          extra.style.textWrap = 'nowrap'
          extra.style.overflow = 'hidden'
          extra.style.textOverflow = 'ellipsis' // Show ellipsis for overflow text
          extra.style.maxWidth = '400px'
          extra.style.color = '#666'
          extra.style.width = '100%'

          nameContainer.appendChild(nameSpan)
          nameContainer.appendChild(inspectButton)
          listItem.appendChild(nameContainer)
          listItem.appendChild(extra)
          leaderboardList.appendChild(listItem)
        })
      }
      scrollable.appendChild(leaderboardList)
    }
    this.manager.target.appendChild(scrollable)
  }
  renderAchievements() {
    const scrollable = createScrollable()
    if (!this.achievementList) {
      if (!this.fetchingAchievement)
        fetch(
          `https://gandi-main.ccw.site/achievements?creationId=${this.extension.runtime.ccwAPI.getProjectUUID()}&perPage=200`,
          {
            credentials: 'include'
          }
        )
          .then(v => v.json())
          .then(v => {
            if (v.body) {
              this.achievementList = v.body.data
              this.fetchingAchievement = false
              this.manager.requestUpdate()
            }
          })
      this.fetchingAchievement = true
      const loading = document.createElement('strong')
      loading.style.color = '#999'
      loading.textContent = '加载中...'
      loading.style.display = 'block'
      loading.style.textAlign = 'center'
      scrollable.appendChild(loading)
    } else {
      const searchContainer = document.createElement('div')
      searchContainer.style.display = 'flex'
      searchContainer.style.justifyContent = 'center'

      const searchInput = document.createElement('input')
      searchInput.type = 'text'
      searchInput.placeholder = '搜索成就...'
      searchInput.style.padding = '5px'
      searchInput.style.border = '1px solid #0e0e0e'
      searchInput.style.width = '100%'
      searchInput.style.boxSizing = 'border-box'
      searchInput.style.backgroundColor = '#333333'
      searchInput.style.color = '#ffffff'

      searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase()
        const items = achievementList.children
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
          if (!achievementList.querySelector('.no-results')) {
            const noResultsItem = document.createElement('li')
            noResultsItem.textContent = '(无结果)'
            noResultsItem.className = 'no-results'
            noResultsItem.style.display = 'flex'
            noResultsItem.style.justifyContent = 'center'
            noResultsItem.style.alignItems = 'center'
            noResultsItem.style.width = '100%'
            noResultsItem.style.height = '100%'
            noResultsItem.style.color = '#999'
            achievementList.appendChild(noResultsItem)
          }
        } else {
          const noResultsItem = achievementList.querySelector('.no-results')
          if (noResultsItem) {
            achievementList.removeChild(noResultsItem)
          }
        }
      })

      searchContainer.appendChild(searchInput)
      this.manager.target.appendChild(searchContainer)

      const achievementList = document.createElement('ul')
      achievementList.style.marginTop = '10px'
      achievementList.style.padding = '0'
      achievementList.style.margin = '0'
      achievementList.style.listStyleType = 'none'

      if (this.achievementList.length === 0) {
        const noResultsItem = document.createElement('li')
        noResultsItem.textContent = '(无结果)'
        noResultsItem.className = 'no-results'
        noResultsItem.style.display = 'flex'
        noResultsItem.style.justifyContent = 'center'
        noResultsItem.style.alignItems = 'center'
        noResultsItem.style.width = '100%'
        noResultsItem.style.height = '100%'
        noResultsItem.style.color = '#999'
        achievementList.appendChild(noResultsItem)
      } else {
        this.achievementList.forEach(achievement => {
          const listItem = document.createElement('li')
          listItem.style.display = 'flex'
          listItem.style.flexDirection = 'column'
          listItem.style.alignItems = 'flex-start'
          listItem.style.marginBottom = '5px'
          listItem.style.padding = '5px'
          listItem.style.border = '1px solid #0e0e0e'
          listItem.style.borderRadius = '4px'
          listItem.style.backgroundColor = '#1e1e1e'

          const nameContainer = document.createElement('div')
          nameContainer.style.display = 'flex'
          nameContainer.style.alignItems = 'center'
          nameContainer.style.width = '100%'

          const icon = document.createElement('img')
          icon.src = achievement.icon
          icon.title = `创建时间 ${achievement.createdAt === null
            ? '未知'
            : new Date(achievement.createdAt)
            } / 最后更新 ${achievement.updatedAt === null
              ? '未知'
              : new Date(achievement.updatedAt)
            }`
          icon.alt = 'icon'
          icon.style.width = '24px'
          icon.style.height = '24px'
          icon.style.marginRight = '10px'

          const nameSpan = document.createElement('span')
          nameSpan.textContent = achievement.title
          nameSpan.className = 'item-name'
          nameSpan.title = achievement.description
          nameSpan.style.flexGrow = '1'
          nameSpan.style.marginRight = '10px'

          const toggleButton = document.createElement('button')
          toggleButton.textContent = achievement.obtained ? '✅' : '❌'
          toggleButton.style.cursor = achievement.obtained
            ? 'default'
            : 'pointer'
          toggleButton.title = achievement.obtained ? '已获得该成就' : '获得'
          toggleButton.style.marginRight = '5px'
          if (!achievement.obtained) {
            toggleButton.addEventListener(
              'click',
              () => {
                this.extension.apis.obtainAchievement(achievement.oid)
                achievement.obtained = true
                toggleButton.style.cursor = 'default'
                toggleButton.textContent = '✅'
                toggleButton.title = '已获得该成就'
              },
              { once: true }
            )
          }

          const extra = document.createElement('input')
          extra.type = 'text'
          extra.value = achievement.recordExt ?? ''
          extra.placeholder = '(无附加说明)'
          extra.style.color = '#666'
          extra.style.backgroundColor = 'transparent'
          extra.style.width = '100%'
          extra.style.outline = 'none'
          extra.style.border = 'none'
          extra.addEventListener('change', () => {
            if (achievement.recordExt !== extra.value) {
              achievement.recordExt = extra.value
              this.extension.apis.updateAchievementExtra(
                achievement.oid,
                extra.value
              )
            }
          })

          nameContainer.appendChild(icon)
          nameContainer.appendChild(nameSpan)
          nameContainer.appendChild(toggleButton)
          listItem.appendChild(nameContainer)
          listItem.appendChild(extra)
          achievementList.appendChild(listItem)
        })
      }
      scrollable.appendChild(achievementList)
    }
    this.manager.target.appendChild(scrollable)
  }
  render() {
    const tabContainer = document.createElement('div')
    tabContainer.style.display = 'flex'
    tabContainer.style.justifyContent = 'center'

    const achievementTab = document.createElement('button')
    achievementTab.textContent = '成就'
    achievementTab.style.flexGrow = '1'
    achievementTab.style.padding = '10px'
    achievementTab.style.border = '1px solid #0e0e0e'
    achievementTab.style.borderBottom =
      this.selected === 'achievement' ? 'none' : '1px solid #0e0e0e'
    achievementTab.style.backgroundColor =
      this.selected === 'achievement' ? '#333333' : '#1e1e1e'
    achievementTab.style.cursor = 'pointer'
    achievementTab.addEventListener('click', () => {
      this.selected = 'achievement'
      this.manager.requestUpdate()
    })

    const leaderboardTab = document.createElement('button')
    leaderboardTab.textContent = '排行榜'
    leaderboardTab.style.flexGrow = '1'
    leaderboardTab.style.padding = '10px'
    leaderboardTab.style.border = '1px solid #0e0e0e'
    leaderboardTab.style.borderBottom =
      this.selected === 'leaderboard' ? 'none' : '1px solid #0e0e0e'
    leaderboardTab.style.backgroundColor =
      this.selected === 'leaderboard' ? '#333333' : '#1e1e1e'
    leaderboardTab.style.cursor = 'pointer'
    leaderboardTab.addEventListener('click', () => {
      this.selected = 'leaderboard'
      this.manager.requestUpdate()
    })

    tabContainer.appendChild(achievementTab)
    tabContainer.appendChild(leaderboardTab)
    this.manager.target.appendChild(tabContainer)

    if (this.selected === 'achievement') {
      this.renderAchievements()
    } else {
      this.renderLeaderboard()
    }
  }
  dispose() { }
}
