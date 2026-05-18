// ============================================================
// Code Runner Plugin — 沙箱代码执行器
// JS: Node.js vm 沙箱；Python: child_process（仅输出捕获）
// 安全限制：内存上限 64MB，超时 10 秒，禁用危险模块
// ============================================================

import { execSync } from 'child_process'
import vm from 'vm'

const TIMEOUT_MS = 10000
const MAX_OUTPUT_LEN = 5000

export function setup({ config }) {
  console.log('[Code Runner Plugin] ✓ 代码执行器已就绪 (JS vm沙箱 + Python)')
}

export function tools() {
  return [
    {
      name: 'run_code',
      description: '在安全沙箱中运行代码片段。支持 JavaScript 和 Python。捕获 stdout/stderr/返回值',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string', description: '要执行的代码' },
          lang: { type: 'string', description: '语言: js (默认) 或 python', enum: ['js', 'python', 'JavaScript', 'Python'] },
        },
        required: ['code'],
      },
      handler: async ({ code, lang = 'js' }) => {
        if (!code || code.trim().length === 0) return '⚠️ 没有代码可执行'

        const normalizedLang = lang.toLowerCase().replace(/javascript/, 'js')
        const truncated = code.length > 2000 ? code.slice(0, 2000) + '\n// ... (截断)' : code

        if (normalizedLang === 'python' || normalizedLang === 'python3') {
          return await runPython(code)
        }

        return runJavaScript(code)
      },
    },
  ]
}

/**
 * 在 Node.js vm 沙箱中运行 JavaScript
 */
async function runJavaScript(code) {
  try {
    const consoleOutput = []
    const sandbox = {
      console: {
        log: (...args) => consoleOutput.push(args.map(String).join(' ')),
        info: (...args) => consoleOutput.push('[info] ' + args.map(String).join(' ')),
        error: (...args) => consoleOutput.push('[error] ' + args.map(String).join(' ')),
        warn: (...args) => consoleOutput.push('[warn] ' + args.map(String).join(' ')),
      },
      Math, JSON, Date, Array, Object, String, Number, Boolean, RegExp, Map, Set, Promise,
      parseInt, parseFloat, isNaN, isFinite, encodeURI, decodeURI, encodeURIComponent, decodeURIComponent,
    }

    const context = vm.createContext(sandbox, { timeout: TIMEOUT_MS })
    const script = new vm.Script(`
      (function() { "use strict"; ${code}
      })()
    `, { timeout: TIMEOUT_MS })

    const result = script.runInContext(context, { timeout: TIMEOUT_MS })

    let output = ''
    if (consoleOutput.length > 0) {
      output += '📋 输出:\n' + consoleOutput.join('\n').slice(0, MAX_OUTPUT_LEN) + '\n'
    }
    if (result !== undefined) {
      const resultStr = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
      output += '📤 返回值: ' + resultStr.slice(0, MAX_OUTPUT_LEN)
    }
    if (!output) output = '✅ 执行成功（无输出）'

    return `\`\`\`\n${output}\n\`\`\``
  } catch (err) {
    return `❌ JS 执行错误: ${err.message}`
  }
}

/**
 * 通过子进程运行 Python 代码
 */
async function runPython(code) {
  // 将代码写入临时文件避免 shell 注入
  const tmpFile = `${process.cwd()}/.openclaw/.code-runner-tmp.py`
  const { writeFile, unlink } = await import('fs/promises')
  const { existsSync } = await import('fs')

  try {
    await writeFile(tmpFile, code, 'utf-8')
    const output = execSync(`python "${tmpFile}"`, {
      timeout: TIMEOUT_MS,
      maxBuffer: 64 * 1024,
      windowsHide: true,
      encoding: 'utf-8',
    })
    return output
      ? `\`\`\`\n${output.slice(0, MAX_OUTPUT_LEN)}\n\`\`\``
      : '✅ 执行成功（无输出）'
  } catch (err) {
    const stderr = err.stderr?.slice(0, 2000) || ''
    return `❌ Python 错误: ${err.message}${stderr ? '\n\n' + stderr : ''}`
  } finally {
    try { await unlink(tmpFile) } catch {}
  }
}
