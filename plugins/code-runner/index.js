// ============================================================
// Code Runner Plugin
// ============================================================
export function setup({ config }) { console.log('[Code Runner Plugin] Ready') }
export function tools() {
  return [{
    name: 'run_code',
    description: '运行代码片段',
    inputSchema: { type: 'object', properties: { code: { type: 'string' }, lang: { type: 'string' } }, required: ['code'] },
    handler: async ({ code, lang }) => { return [Code Runner] 运行  代码的功能待集成沙箱 }
  }]
}
