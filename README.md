# 毕过AI · biguoai.top

论文写作助手 + ATS 简历体检 + 论文 AIGC 痕迹自查。纯前端，Vite 8 + React 19 + TypeScript。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b 全量类型检查 + vite build → 产物到 docs/
npm run lint     # eslint
```

> **node 不在 PATH**：本机用 `C:\Users\15000\.workbuddy\binaries\node\versions\22.22.2-6\node.exe`。
> 构建报 `spawn EPERM` 是沙箱拦了 vite 的子进程管道，把会话切到完全权限即可。

## 部署

推送 `master` → GitHub Actions（`.github/workflows/deploy-pages.yml`）自动 `npm ci && npm run build` → 部署 GitHub Pages → 自定义域 biguoai.top。

**本地 `docs/` 产物 hash ≠ 线上**，属正常：CI 会用提交版源码重新构建。

### 推送命令（本机网络特殊，必须带参数）

仓库级代理已失效，且 `github.com` 的 DNS 常解析到不通的 IP，所以要清代理 + 钉可用 IP：

```bash
# 先试原样
git -c http.proxy= -c https.proxy= push github master

# 失败就钉 IP（140.82.112.4 / 140.82.114.4 轮换，哪个通用哪个）
git -c http.proxy= -c https.proxy= \
    -c http.curloptResolve="github.com:443:140.82.112.4" push github master
```

## 页面结构

无路由库，`src/Router.tsx` 用 hash 路由：

| 路径 | 组件 | 说明 |
|---|---|---|
| `/` | `App.tsx` | 论文助手（降重/润色/改写/翻译/扩写/公式/图表/盲审/参考文献） |
| `/#resume` | `ResumeChecker.tsx` | ATS 简历体检 |
| `/#aigc` | `AigcChecker.tsx` | AIGC 痕迹自查（纯本地，无需 API） |
| `/#landing` | → 整页跳 `/landing.html` | 落地页（独立静态页，保留自身 SEO） |

## 商业模式

| 产品 | 价格 | 门槛 |
|---|---|---|
| 论文助手 | 每日 5 次免费（分享 +3） | 需自备 DeepSeek API Key |
| 论文助手会员 | 激活码 | 无限次 |
| ATS 简历体检 · 评分/匹配度/前 3 个关键词缺口 | **免费不限次** | 无需 API |
| ATS 简历体检 · 完整报告 | **¥6.9 / 30 天** | 激活码 |
| 人工精修简历 / 人工降 AI 味 | ¥49 起 | 闲鱼「毕过AI」 |

## 激活码机制（重要）

源码**只存 SHA-256 哈希**，不存明文——明文会被打包进 bundle，任何人都能扒出来。

### 换码流程

1. 连点 5 次左上角 logo → 打开管理员后台
2. 点「🎲 随机生成」→ 得到形如 `BIGUO-7K2M-9X4T` 的码
3. 点「📋 复制链接」发买家（`?vip=<码>`，点开即解锁）；或发「📋 复制码」让买家手动输
4. 复制后台显示的那行哈希，粘进 `src/vip.ts` 的 `VIP_CODE_HASHES` 数组
5. 推送部署 → 该码对**所有访客**生效

后台的「✅ 本机启用」只让你自己的浏览器立即认这个码（方便测试），不影响其他访客。

> **当前内置码**：见 `src/vip.ts` 注释。首次上线后建议尽快换成你自己的码。

### 安全边界（诚实说明）

纯前端没有服务器，因此**防不住会改 localStorage 的人**。哈希校验挡的是：
- 「随手输 6 位数字」这类误打误撞（旧版是长度够就放行）
- 从 bundle 里 grep 出明文码
- `?vip=任意内容` 自签会员卡（旧版后门，已修）

要真正防破解，需要后端校验接口 + 服务端发 token。

## 转化埋点

`src/analytics.ts`，零依赖零后端。三条漏斗：

- 论文助手：打开 → 生成结果 → 付费弹窗 → 输码激活
- 简历体检：打开 → 跑检测 → 点解锁 → 弹窗打开 → 输码成功
- AIGC 自查：打开 → 跑检测 → 展开人工服务

数据去向（可全开）：
1. `localStorage` 环形缓冲（300 条）—— 后台面板直接看，仅本机
2. 填 `BAIDU_TONGJI_ID` → 上报百度统计自定义事件，**看全站聚合漏斗（推荐）**
3. 填 `TRACK_ENDPOINT` → POST JSON 到自建/第三方

隐私：只记事件名和匿名属性，不采集论文/简历正文，不采集 API Key。

## 待办

- [ ] **ICP 备案** —— 国内域名未备案随时可能被拦；`landing.html` 已留注释位
- [ ] 填 `BAIDU_TONGJI_ID`（`src/analytics.ts`）才能看全站漏斗
- [ ] 填 `SERVICE_URL`（`src/ResumeChecker.tsx`）换成真实闲鱼商品链接
- [ ] 轮换内置激活码
