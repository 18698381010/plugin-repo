// ============================================================
// RSS Reader Plugin — RSS 订阅源读取与摘要
// 无需依赖，原生 XML 解析，支持 RSS 2.0 / Atom
// ============================================================

const cache = new Map()
const CACHE_TTL = 10 * 60 * 1000  // 10 分钟缓存

export function setup({ config }) {
  console.log('[RSS Reader Plugin] ✓ RSS 阅读器已就绪')
}

export function tools() {
  return [
    {
      name: 'read_rss',
      description: '读取 RSS/Atom 订阅源，返回最新文章列表（标题+摘要+链接+日期）',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'RSS/Atom Feed URL' },
          count: { type: 'number', description: '返回文章数（1-20，默认10）' },
        },
        required: ['url'],
      },
      handler: async ({ url, count = 10 }) => {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return '❌ 请输入有效的 URL（以 http:// 或 https:// 开头）'
        }

        // 缓存检查
        const cached = cache.get(url)
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          return `[缓存 - ${new Date(cached.ts).toLocaleString('zh-CN')}]\n\n${cached.data}`
        }

        const res = await fetch(url, {
          headers: { 'User-Agent': 'cc-engine/RSS-Reader/1.0' },
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        const xml = await res.text()

        const items = parseFeed(xml).slice(0, Math.min(count, 20))

        if (items.length === 0) {
          return `📡 已连接 "${url}"，但未找到文章条目`
        }

        const now = Date.now()
        const output = items.map((item, i) => {
          let meta = [`#${i + 1} ${item.title}`]
          if (item.date) {
            const days = Math.round((now - new Date(item.date).getTime()) / 86400000)
            meta.push(`   📅 ${days <= 1 ? '今天' : days + '天前'} (${item.date})`)
          }
          if (item.author) meta.push(`   👤 ${item.author}`)
          if (item.summary) meta.push(`   ${item.summary.slice(0, 200)}`)
          meta.push(`   🔗 ${item.link}`)
          return meta.join('\n')
        }).join('\n\n')

        cache.set(url, { ts: Date.now(), data: output })
        if (cache.size > 30) cache.clear()

        return `📡 RSS Feed - ${url}\n共 ${items.length} 篇文章\n\n${output}`
      },
    },
  ]
}

/**
 * 解析 RSS 2.0 或 Atom 格式 XML
 */
function parseFeed(xml) {
  const items = []

  // RSS 2.0 格式
  const rssItemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = rssItemRegex.exec(xml)) !== null) {
    items.push(extractRssItem(match[1]))
  }

  // Atom 格式
  if (items.length === 0) {
    const atomRegex = /<entry>([\s\S]*?)<\/entry>/g
    while ((match = atomRegex.exec(xml)) !== null) {
      items.push(extractAtomEntry(match[1]))
    }
  }

  return items
}

function extractRssItem(xml) {
  return {
    title: extractTag(xml, 'title'),
    link: extractTag(xml, 'link'),
    summary: extractTag(xml, 'description').replace(/<[^>]*>/g, '').trim(),
    date: extractTag(xml, 'pubDate') || extractTag(xml, 'dc:date'),
    author: extractTag(xml, 'author') || extractTag(xml, 'dc:creator'),
  }
}

function extractAtomEntry(xml) {
  const linkMatch = xml.match(/<link[^>]*href="([^"]*)"[^>]*\/>/)
  return {
    title: extractTag(xml, 'title'),
    link: linkMatch ? linkMatch[1] : '',
    summary: extractTag(xml, 'summary') || extractTag(xml, 'content').replace(/<[^>]*>/g, '').trim(),
    date: extractTag(xml, 'published') || extractTag(xml, 'updated'),
    author: xml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/)?.[1] || '',
  }
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = xml.match(regex)
  return (m?.[1] || m?.[2] || '').trim()
}
