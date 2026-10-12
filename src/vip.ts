// ====== 激活码校验（静态站可行范围内的"真校验"）======
//
// 原理：源码里只存激活码的 SHA-256 哈希，不存明文。
//   - 别人无法从打包产物里 grep 出激活码
//   - 输入任意数字/字符串一律不通过（旧版是"长度≥6 就放行"）
//   - 输入会自动归一化（忽略大小写、空格、短横线），用户抄错格式也能过
//
// ⚠️ 诚实说明：这是纯前端站点，没有服务器，因此**无法阻止**懂技术的人
//    直接在控制台改 localStorage 绕过。哈希校验挡的是"随手输 6 位数字"
//    和"从 bundle 里扒码"这两类真实场景。要做到真正防破解，必须上后端
//    （哪怕只是一个校验接口 + 服务端发 token）。
//
// 轮换激活码：连点 5 次 logo 打开后台 → 生成新码 → 把新哈希粘到下面数组。

// 当前有效激活码的 SHA-256（归一化后计算）
// ⚠️ 这里只放哈希，绝不要写明文码——明文会被打包进 bundle，任何人都能扒出来。
// 轮换方式：连点 5 次 logo 打开后台 → 随机生成 → 复制哈希 → 粘到下面数组 → 重新部署
export const VIP_CODE_HASHES: string[] = [
  '4898f1e4a3dd64a4f8cf15d147ef1adb245ab205c2dbd5fc9f83223ca62ad102',
]

/** 归一化：去空白/短横线/下划线，转大写 */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s\-_]/g, '')
}

async function sha256Hex(text: string): Promise<string | null> {
  // SubtleCrypto 仅在安全上下文可用（https / localhost）。
  // 拿不到就返回 null → 校验失败（fail closed，宁可锁死也不误放行）。
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return null
  try {
    const buf = await subtle.digest('SHA-256', new TextEncoder().encode(text))
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return null
  }
}

/** 计算某个明文码的哈希（后台生成新码时用） */
export async function hashCode(plain: string): Promise<string | null> {
  return sha256Hex(normalizeCode(plain))
}

/** 校验激活码是否有效 */
export async function verifyVipCode(input: string): Promise<boolean> {
  const n = normalizeCode(input)
  if (n.length < 8) return false          // 太短直接拒，避免暴力穷举
  if (VIP_CODE_HASHES.length === 0) return false
  const h = await sha256Hex(n)
  if (!h) return false
  return VIP_CODE_HASHES.includes(h)
}

/** 生成一个易抄写的随机激活码，形如 BIGUO-7K2M-9X4T（去除易混字符 0/O/1/I） */
export function generateVipCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const pick = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  return `BIGUO-${pick(4)}-${pick(4)}`
}

// ====== 本机新增的激活码哈希（后台生成后本机立即生效）======
const LOCAL_HASHES_KEY = 'biguoai_vipcode'

function getLocalCodeHashes(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_HASHES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch { return [] }
}

/** 把新激活码的哈希加入本机白名单 */
export function addLocalCodeHash(hash: string): void {
  if (!hash) return
  const list = getLocalCodeHashes()
  if (!list.includes(hash)) list.push(hash)
  try { localStorage.setItem(LOCAL_HASHES_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

/**
 * 校验激活码：源码内置哈希 + 本机后台新增哈希
 * 任一命中即通过。
 */
export async function isCodeValid(input: string): Promise<boolean> {
  if (await verifyVipCode(input)) return true
  const local = getLocalCodeHashes()
  if (local.length === 0) return false
  const h = await hashCode(input)
  return !!h && local.includes(h)
}

// ====== 会员码（本机签发，用于换设备/清缓存后恢复）======
const ISSUED_CODES_KEY = 'resumechecker_issued_codes'

/** 记录一个由有效激活码签发出的会员码 */
export function issueMemberCode(code: string): void {
  try {
    const list = getIssuedMemberCodes()
    const c = code.toUpperCase()
    if (!list.includes(c)) list.push(c)
    localStorage.setItem(ISSUED_CODES_KEY, JSON.stringify(list.slice(-50)))
  } catch { /* ignore */ }
}

/** 读取本机签发过的会员码 */
export function getIssuedMemberCodes(): string[] {
  try {
    const raw = localStorage.getItem(ISSUED_CODES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch { return [] }
}
