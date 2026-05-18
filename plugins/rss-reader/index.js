// ============================================================
// RSS Reader Plugin
// ============================================================
export function setup({ config }) { console.log('[RSS Reader Plugin] Ready') }
export function tools() {
  return [{
    name: 'read_rss',
    description: '读取 RSS 订阅源',
    inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
    handler: async ({ url }) => { return [RSS] 读取  的功能待集成 RSS 解析库 }
  }]
}
