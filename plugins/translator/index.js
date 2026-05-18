// ============================================================
// Translator Plugin — 基于 LibreTranslate 的免费翻译
// 无 API Key，支持 30+ 语言，自动检测源语言
// ============================================================

const DEFAULT_API = 'https://libretranslate.de'
const cache = new Map()

const LANG_NAMES = {
  zh: '中文', en: '英文', ja: '日文', ko: '韩文', fr: '法文', de: '德文',
  es: '西班牙文', pt: '葡萄牙文', ru: '俄文', ar: '阿拉伯文', it: '意大利文',
  nl: '荷兰文', pl: '波兰文', tr: '土耳其文', th: '泰文', vi: '越南文',
}

export function setup({ config }) {
  console.log('[Translator Plugin] ✓ 翻译引擎已就绪 (LibreTranslate, 无 Key)')
}

export function tools() {
  return [
    {
      name: 'translate',
      description: '翻译文本到目标语言，支持 30+ 语言。自动检测源语言',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要翻译的文本' },
          target: { type: 'string', description: '目标语言代码（如 zh, en, ja, fr, de）, 默认 en' },
          source: { type: 'string', description: '源语言代码（留空自动检测）' },
        },
        required: ['text'],
      },
      handler: async ({ text, target = 'zh', source = 'auto' }) => {
        if (!text || text.trim().length === 0) return '⚠️ 没有需要翻译的文本'

        const cacheKey = `${text}|${source}|${target}`
        const cached = cache.get(cacheKey)
        if (cached) return cached

        // 主要后端: LibreTranslate
        try {
          const res = await fetch(`${DEFAULT_API}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: text, source, target, format: 'text' }),
            signal: AbortSignal.timeout(10000),
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          const detected = data.detectedLanguage?.language || source
          const output = `[${LANG_NAMES[detected] || detected} → ${LANG_NAMES[target] || target}]\n${data.translatedText}`
          cache.set(cacheKey, output)
          if (cache.size > 100) cache.clear()
          return output
        } catch {
          // 回退: MyMemory API (更大的免费额度)
          try {
            const pair = source === 'auto' ? `${target}|${target}` : `${source}|${target}`
            const res2 = await fetch(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`,
              { signal: AbortSignal.timeout(8000) }
            )
            if (!res2.ok) throw new Error(`HTTP ${res2.status}`)
            const data2 = await res2.json()
            if (data2.responseStatus === 200 && data2.responseData?.translatedText) {
              const output = `[翻译结果]\n${data2.responseData.translatedText}`
              cache.set(cacheKey, output)
              return output
            }
            throw new Error('API returned no result')
          } catch (e) {
            return `❌ 翻译失败: ${e.message}。请稍后重试`
          }
        }
      },
    },
  ]
}
