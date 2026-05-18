// ============================================================
// Web Search Plugin — 基于 DuckDuckGo 的免费搜索引擎
// 无 API Key 依赖，内置结果缓存（5 分钟）
// ============================================================

const CACHE_TTL = 5 * 60 * 1000
const cache = new Map()

export function setup({ config }) {
  console.log('[Web Search Plugin] ✓ 搜索引擎已就绪 (DuckDuckGo, 无 Key)')
}

export function tools() {
  return [
    {
      name: 'web_search',
      description: '搜索网络信息（DuckDuckGo），支持中文和英文查询，返回标题+摘要+URL',
      inputSchema: {
        type: 'object',
        properties: {
          q: { type: 'string', description: '搜索关键词（支持中文）' },
          count: { type: 'number', description: '返回结果数（1-10，默认5）' },
          region: { type: 'string', description: '区域（如 cn-zh, us-en），默认自动' },
        },
        required: ['q'],
      },
      handler: async ({ q, count = 5, region }) => {
        // 缓存检查
        const cacheKey = `${q}|${count}|${region || 'auto'}`
        const cached = cache.get(cacheKey)
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          return `[缓存结果 - ${q}]\n` + cached.data
        }

        // 调 OpenClaw 的 web_search 工具
        const searchUrl = 'https://html.duckduckgo.com/html/'
        const params = new URLSearchParams({ q })
        const res = await fetch(searchUrl, { method: 'POST', body: params })
        if (!res.ok) throw new Error(`Search failed: ${res.status}`)
        const html = await res.text()

        // 解析 DuckDuckGo HTML 结果
        const results = parseDuckDuckGoResults(html).slice(0, Math.min(count, 10))

        if (results.length === 0) {
          return `🔍 未找到 "${q}" 的相关结果`
        }

        const output = results.map((r, i) =>
          `[${i + 1}] ${r.title}\n    ${r.snippet}\n    ${r.url}`
        ).join('\n\n')

        // 存缓存
        cache.set(cacheKey, { ts: Date.now(), data: output })
        if (cache.size > 50) cache.clear()

        return `🔍 搜索结果 - "${q}" (${results.length}条)\n\n${output}`
      },
    },
  ]
}

function parseDuckDuckGoResults(html) {
  const results = []
  // 匹配 DuckDuckGo HTML 搜索结果条目
  const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*href="[^"]*"[^>]*>([\s\S]*?)<\/a>/g
  let match
  while ((match = resultRegex.exec(html)) !== null) {
    results.push({
      url: match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, '').replace(/&rut=.*$/, ''),
      title: match[2].replace(/<[^>]*>/g, '').trim(),
      snippet: match[3].replace(/<[^>]*>/g, '').trim(),
    })
  }
  return results
}
