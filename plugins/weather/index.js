// ============================================================
// Weather Plugin — 天气查询工具
// 基于 wttr.in 免费 API，无需 API Key
// ============================================================

/** 插件导出接口 */
export function setup({ config, registry }) {
  console.log(`[Weather Plugin] Setup with defaultCity: ${config.defaultCity || 'Beijing'}`)
}

export function tools() {
  return [
    {
      name: 'get_weather',
      description: '查询指定城市的天气情况',
      inputSchema: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: '城市名称，如 Beijing、Shanghai、Tokyo',
          },
          format: {
            type: 'string',
            enum: ['simple', 'full', 'forecast'],
            description: '输出格式：simple=一句话，full=详细，forecast=3天预报',
            default: 'simple',
          },
        },
        required: ['city'],
      },
      handler: async ({ city, format = 'simple' }) => {
        try {
          // wttr.in 格式参数
          const fmt = format === 'simple' ? '?format=%C+%t+%w+%h' 
            : format === 'forecast' ? '?format=j1' 
            : ''

          const url = `https://wttr.in/${encodeURIComponent(city)}${fmt}`
          const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
          const text = await response.text()

          if (format === 'forecast') {
            // JSON 格式的预报数据
            try {
              const data = JSON.parse(text)
              const current = data.current_condition?.[0]
              const forecast = data.weather?.slice(0, 3).map(d => 
                `${d.date}: ${d.astronomy?.[0]?.sunrise || ''} 日出, ${d.mintempC}°C ~ ${d.maxtempC}°C`
              ).join('\n')

              return JSON.stringify({
                city,
                temperature: `${current?.temp_C || '?'}°C`,
                humidity: `${current?.humidity || '?'}%`,
                wind: current?.windspeedKmph ? `${current.windspeedKmph} km/h` : '?',
                forecast,
              }, null, 2)
            } catch {
              return text.slice(0, 1500)
            }
          }

          return `🌍 ${city}: ${text.trim()}`
        } catch (err) {
          return `❌ 查询失败: ${err.message}`
        }
      },
    },
  ]
}
