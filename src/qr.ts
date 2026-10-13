// ====== 极简二维码生成器（零依赖，仅支持短文本/URL）======
// 只实现 byte 模式 + 版本 1-10 + 纠错等级 L，足够编码一条 URL。
// 参考 ISO/IEC 18004，刻意写得直白以便维护。

// --- Galois 域 (GF(256)) ---
const EXP: number[] = new Array(512)
const LOG: number[] = new Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
})()

const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]])

// 生成多项式
function genPoly(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= mul(poly[j], 1)
      next[j + 1] ^= mul(poly[j], EXP[i])
    }
    poly = next
  }
  return poly
}

// Reed-Solomon 纠错码字
function rsEncode(data: number[], ecLen: number): number[] {
  const gen = genPoly(ecLen)
  const res = new Array(ecLen).fill(0)
  for (const d of data) {
    const factor = d ^ res[0]
    res.shift()
    res.push(0)
    for (let i = 0; i < ecLen; i++) res[i] ^= mul(gen[i + 1], factor)
  }
  return res
}

// 各版本（1-10）在纠错等级 L 下的 [总码字数, 数据码字数]
const CAP_L: [number, number][] = [
  [26, 19], [44, 34], [70, 55], [100, 80], [134, 108],
  [172, 136], [196, 156], [242, 194], [292, 232], [346, 274],
]

// 对齐图案中心坐标
const ALIGN: number[][] = [
  [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
]

function utf8Bytes(s: string): number[] {
  const out: number[] = []
  for (const ch of s) {
    const cp = ch.codePointAt(0)!
    if (cp < 0x80) out.push(cp)
    else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 63))
    else if (cp < 0x10000) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63))
    else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63))
  }
  return out
}

/** 生成二维码模块矩阵（true = 黑） */
export function makeQR(text: string): boolean[][] {
  const bytes = utf8Bytes(text)

  // 选版本
  let version = 0
  for (let v = 1; v <= 10; v++) {
    const capBytes = CAP_L[v - 1][1] - 2 // 减去模式指示符+字符计数
    if (bytes.length <= capBytes) { version = v; break }
  }
  if (!version) throw new Error('内容过长，二维码仅支持较短 URL')

  const [totalCw, dataCw] = CAP_L[version - 1]
  const size = version * 4 + 17

  // --- 构造数据位流 ---
  const bits: number[] = []
  const push = (val: number, len: number) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1) }

  push(0b0100, 4)                       // byte 模式
  push(bytes.length, version <= 9 ? 8 : 16) // 字符计数
  for (const b of bytes) push(b, 8)

  // 终止符
  const dataCapBits = dataCw * 8
  for (let i = 0; i < 4 && bits.length < dataCapBits; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)

  const dataCws: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j]
    dataCws.push(v)
  }
  // 填充码字
  const PAD = [0xec, 0x11]
  let pi = 0
  while (dataCws.length < dataCw) dataCws.push(PAD[pi++ % 2])

  const ecLen = totalCw - dataCw
  const ecCws = rsEncode(dataCws, ecLen)
  const allCws = dataCws.concat(ecCws)

  // --- 放置模块 ---
  const m: (boolean | null)[][] = Array.from({ length: size }, () => new Array(size).fill(null))
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))

  const setF = (r: number, c: number, v: boolean) => { m[r][c] = v; reserved[r][c] = true }

  // 定位图案
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = r0 + r, cc = c0 + c
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
      const on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                 (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                 (r >= 2 && r <= 4 && c >= 2 && c <= 4)
      setF(rr, cc, on)
    }
  }
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0)

  // 定时图案
  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) setF(6, i, i % 2 === 0)
    if (!reserved[i][6]) setF(i, 6, i % 2 === 0)
  }

  // 对齐图案
  const centers = ALIGN[version]
  for (const r0 of centers) for (const c0 of centers) {
    if ((r0 <= 8 && c0 <= 8) || (r0 <= 8 && c0 >= size - 9) || (r0 >= size - 9 && c0 <= 8)) continue
    for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) {
      const on = Math.max(Math.abs(r), Math.abs(c)) !== 1
      setF(r0 + r, c0 + c, on)
    }
  }

  // 格式信息占位（先保留，稍后写）
  for (let i = 0; i <= 8; i++) {
    if (!reserved[8][i]) { reserved[8][i] = true; m[8][i] = false }
    if (!reserved[i][8]) { reserved[i][8] = true; m[i][8] = false }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true; m[8][size - 1 - i] = false
    reserved[size - 1 - i][8] = true; m[size - 1 - i][8] = false
  }
  setF(size - 8, 8, true) // 固定深色模块

  // --- 数据放置（之字形）---
  let bitIdx = 0
  const totalBits = allCws.length * 8
  const nextBit = () => {
    if (bitIdx >= totalBits) return 0
    const cw = allCws[bitIdx >> 3]
    const bit = (cw >> (7 - (bitIdx & 7))) & 1
    bitIdx++
    return bit
  }
  let up = true
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col-- // 跳过定时列
    for (let i = 0; i < size; i++) {
      const row = up ? size - 1 - i : i
      for (const c of [col, col - 1]) {
        if (reserved[row][c]) continue
        m[row][c] = nextBit() === 1
        reserved[row][c] = true
      }
    }
    up = !up
  }

  // --- 格式信息（纠错等级 L = 01，掩码 0） ---
  const fmt = (() => {
    const data = (0b01 << 3) | 0 // ECC L + mask 0
    let v = data << 10
    const g = 0b10100110111
    for (let i = 14; i >= 10; i--) if ((v >> i) & 1) v ^= g << (i - 10)
    return ((data << 10) | v) ^ 0b101010000010010
  })()
  const fmtBits = (i: number) => ((fmt >> i) & 1) === 1

  for (let i = 0; i <= 5; i++) m[8][i] = fmtBits(i)
  m[8][7] = fmtBits(6); m[8][8] = fmtBits(7); m[7][8] = fmtBits(8)
  for (let i = 9; i <= 14; i++) m[14 - i][8] = fmtBits(i)
  for (let i = 0; i <= 7; i++) m[size - 1 - i][8] = fmtBits(i)
  for (let i = 8; i <= 14; i++) m[8][size - 15 + i] = fmtBits(i)
  m[size - 8][8] = true

  // --- 掩码 0: (r + c) % 2 === 0（只作用于非功能模块）---
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (reserved[r][c] && !isDataArea(r, c, size)) continue
    if ((r + c) % 2 === 0) m[r][c] = !m[r][c]
  }

  return m.map(row => row.map(v => v === true))
}

// 判断是否属于数据区（非功能图案），用于掩码跳过功能模块
function isDataArea(r: number, c: number, size: number): boolean {
  // 定位图案区域
  if (r <= 8 && c <= 8) return false
  if (r <= 8 && c >= size - 8) return false
  if (r >= size - 8 && c <= 8) return false
  // 定时图案
  if (r === 6 || c === 6) return false
  return true
}
