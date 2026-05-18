// ============================================================
// Web Search Plugin — 搜索引擎工具
// ============================================================
export function setup({ config }) { console.log('[Web Search Plugin] Ready') }
export function tools() {
  return [{
    name: 'web_search',
    description: '搜索网络信息',
    inputSchema: { type: 'object', properties: { q: { type: 'string', description: '搜索关键词' } }, required: ['q'] },
    handler: async ({ q }) => { return [Web Search] 搜索 "" 的功能需要部署搜索引擎 API }
  }]
}
