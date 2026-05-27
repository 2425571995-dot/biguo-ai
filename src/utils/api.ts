import { CORS_PROXIES, STYLE_MAP } from '../constants'
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

export function buildPrompt(product: string, features: string, price: string, audienceText: string, style: string): string {
  return `你是小红书爆款文案专家。根据以下产品信息，生成3条小红书风格的种草文案。

产品：${product}
卖点：${features || '请根据产品名称自行提炼'}
价格：${price || '未提供'}
目标人群：${audienceText}
风格要求：${STYLE_MAP[style]}

要求：
- 每条文案包含：吸睛标题、正文（150-300字）、3-5个话题标签
- 语气自然亲切，像真实用户分享而非广告
- 善用emoji，但不能过度
- 包含具体使用场景和真实感受

请严格按照以下JSON格式输出，不要输出其他内容。正文中的双引号必须转义，换行用\n表示：
[{"title":"标题","content":"正文内容","tags":["标签1","标签2","标签3"]}]`
}
