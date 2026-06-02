import { CORS_PROXIES } from '../constants'
import type { Post } from '../types'

export async function fetchWithCORS(url: string, options: RequestInit = {}): Promise<Response> {
  const errors: string[] = []
  for (const proxy of CORS_PROXIES) {
    try {
      const finalUrl = proxy ? proxy + url : url
      const res = await fetch(finalUrl, { ...options })
      if (res.status >= 400 && res.status < 500 && proxy) {
        return res
      }
      return res
    } catch (e: any) {
      errors.push(`${proxy || '直连'}: ${e.message}`)
      continue
    }
  }
  throw new Error(`无法连接到 DeepSeek API（已尝试所有代理）\n${errors.join('\n')}`)
}

export function parseJSONPosts(raw: string): Omit<Post, 'id'>[] {
  let cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim()
  const m = cleaned.match(/\[[\s\S]*\]/)
  if (m) cleaned = m[0]
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1')
  try { return JSON.parse(cleaned) } catch {}
  return extractPostsManually(cleaned)
}

function extractPostsManually(text: string): Omit<Post, 'id'>[] {
  const posts: Omit<Post, 'id'>[] = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue
    let depth = 1, j = i + 1
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth++
      else if (text[j] === '}') depth--
      if (depth > 0) j++
    }
    const block = text.slice(i, j + 1)
    i = j

    const tMatch = block.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/)
    if (!tMatch) continue
    const title = tMatch[1]

    const cStart = block.match(/"content"\s*:\s*"/)
    if (!cStart || cStart.index === undefined) continue
    let pos = cStart.index + cStart[0].length
    let content = '', inEsc = false
    while (pos < block.length) {
      const ch = block[pos]
      if (inEsc) { content += ch; inEsc = false; pos++; continue }
      if (ch === '\\') { content += ch; inEsc = true; pos++; continue }
      if (ch === '"') {
        if (/^\s*,\s*"tags"/.test(block.slice(pos + 1, pos + 20))) { pos++; break }
        content += ch; pos++; continue
      }
      content += ch; pos++
    }

    const tagsRaw = block.match(/"tags"\s*:\s*\[([^\]]*)\]/)
    const tags: string[] = []
    if (tagsRaw) {
      const re = /"([^"]*)"/g
      let t
      while ((t = re.exec(tagsRaw[1])) !== null) tags.push(t[1])
    }

    if (title && content.trim()) posts.push({ title, content, tags })
  }
  if (posts.length > 0) return posts
  throw new Error('无法解析 AI 返回的 JSON，请重试')
}

export function buildThesisPrompt(text: string, intensity: string, mode: string): string {
  const intensityMap: Record<string, string> = {
    mild: '轻度降重：保持原文结构基本不变，仅微调句式，替换少量重复词汇',
    moderate: '中度降重：调整句式结构，替换重复表达，优化语序，保留原意的同时降低重复率',
    strong: '强力降重：大幅改写句式，深度优化表达，用同义替换和句型变换最大化降低重复率',
  }

  let instruction = ''
  switch (mode) {
    case '润色':
      instruction = '请对以下论文段落进行润色，优化语法和表达，使语言更加流畅、规范、学术化。'
      break
    case '改写':
      instruction = '请对以下论文段落进行改写，用不同的表达方式重新组织语言，保持原意不变。'
      break
    case '翻译':
      instruction = '请将以下中文论文段落翻译成英文，保持学术语言的准确性和规范性。'
      break
    case '扩写':
      instruction = '请对以下论文段落进行扩写，在保留原意的基础上补充相关论述，使内容更加充实。'
      break
    case '转为学术':
      instruction = '请将以下论文段落改写得更加学术化，使用更正式、专业的学术表达，提升论文的学术水准。'
      break
    default:
      instruction = `请对以下论文段落进行降重处理。要求：${intensityMap[intensity] || intensityMap.moderate}`
  }

  return `你是一个专业的论文降重和学术写作助手。${instruction}

要求：
1. 保留原文的核心观点和逻辑结构
2. 不改变专业术语和关键数据
3. 仅输出降重/处理后的文本，不要输出额外解释
4. 保持学术写作的规范性和严谨性
5. 如果原文包含引文或参考文献标记，请保留原格式

原文：
${text}`
}

export function buildContinuePrompt(text: string, instruction: string): string {
  return `你是一个专业的论文降重和学术写作助手。

请基于以下文本，${instruction}

要求：
1. 保留核心观点和逻辑结构
2. 不改变专业术语和关键数据
3. 仅输出处理后的文本，不要额外解释
4. 保持学术写作的规范性和严谨性

文本：
${text}`
}
