# 🚀 AI 算力出海 & API 中转站搭建 — 完整学习手册

> **整理时间：** 2026-05-30  
> **说明：** 本手册基于公开技术文档整理，涵盖主流 API 中转站搭建、AI 工具站运营及跨境变现的实操教程。  
> **建议：** 按模块顺序学习，从基础到进阶。

---

## 📋 目录

1. [模块一：API 中转站核心架构理解](#模块一api-中转站核心架构理解)
2. [模块二：Sub2API 中转站完整搭建](#模块二sub2api-中转站完整搭建)
3. [模块三：NEW API + CLIProxyAPI 联合部署](#模块三new-api--cliproxyapi-联合部署)
4. [模块四：CLIProxyAPI 独立部署与配置](#模块四cliproxyapi-独立部署与配置)
5. [模块五：AI 工具站从 0 到 1 运营](#模块五ai-工具站从-0-到-1-运营)
6. [模块六：AI 建站工具全流程攻略](#模块六ai-建站工具全流程攻略)
7. [模块七：算力出海变现策略](#模块七算力出海变现策略)
8. [模块八：Fiverr 接单与跨境变现](#模块八fiverr-接单与跨境变现)
9. [附录：资源链接汇总](#附录资源链接汇总)

---

## 模块一：API 中转站核心架构理解

### 1.1 三个核心项目的定位

搭建前先分清楚 **new-api**、**sub2api** 和 **CLIProxyAPI** 的定位。它们不是完全同一类工具，更像是中转站里的不同层：

| 项目 | 定位 | 核心功能 |
|------|------|----------|
| **CLIProxyAPI** | 账号能力层 | 把账号能力整理成可调用的 API |
| **new-api** | 用户管理层 | 负责用户、令牌和计费 |
| **sub2api** | 中间层 | 组号池 + 计费 + 订阅转换 |

### 1.2 整体架构流程

```
上游订阅账号 → CLIProxyAPI → Sub2API/new-api 网关 → 你的 API Key → 客户端
                    ↑
         FlowPilot 自动注册并导入账号
                    ↑
    Cloudflare Temp Email（邮箱） + HeroSMS（短信）
```

### 1.3 推荐渠道（参考）

| 项目 | 地址 |
|------|------|
| 案例网站 | [lztoken.top](https://lztoken.top) |
| 易支付渠道 | z-pay 易支付 |
| Claude 上游渠道 | [derouter.ai](https://derouter.ai) |

---

## 模块二：Sub2API 中转站完整搭建

### 2.1 你需要准备什么

| 类别 | 建议 |
|------|------|
| **服务器** | Linux VPS（amd64/arm64），建议 2C4G 及以上；海外机房更利于访问 OpenAI |
| **域名** | 用于 HTTPS 反代 Sub2API 面板（生产环境务必上 TLS） |
| **面板** | Sub2API（Go + PostgreSQL + Redis） |
| **自动化** | Chrome + FlowPilot 扩展 |
| **邮箱** | Cloudflare Temp Email（Worker 部署） |
| **接码** | HeroSMS（OpenAI 建议巴西号 + API） |
| **代理（可选）** | 干净 IP，降低注册与登录风控 |

### 2.2 Docker Compose 一键部署

> **前置：** 已安装 Docker 20.10+ 与 Docker Compose v2+

```bash
mkdir -p sub2api-deploy && cd sub2api-deploy

curl -sSL https://raw.githubusercontent.com/Wei-Shaw/sub2api/main/deploy/docker-deploy.sh | bash

docker compose up -d
docker compose logs -f sub2api
```

脚本会下载 `docker-compose.local.yml`、生成 `.env`（含 JWT_SECRET、POSTGRES_PASSWORD 等），数据落在本地目录，便于备份迁移。

**首次访问：** `http://你的服务器IP:8080`，按向导完成 PostgreSQL、Redis、管理员账号配置。

若密码为自动生成，可在日志中查找：

```bash
docker compose logs sub2api | grep "admin password"
```

### 2.3 生产环境：Nginx 反代注意事项

若通过 Nginx 反代 Sub2API，且搭配 Codex CLI 使用粘性会话，需在 `http` 块加入：

```nginx
underscores_in_headers on;
```

Nginx 默认会丢弃带下划线的请求头（如 `session_id`），会导致多账号粘性会话失效。

### 2.4 面板里建议先完成的配置

1. **创建分组**：例如 `codex`、`claude`，与 FlowPilot 侧「分组名」保持一致
2. **配置代理（可选）**：在管理后台添加出站代理
3. **生成用户 API Key**：给 Claude Code、Codex CLI 等客户端使用
4. **简易模式**：个人自用可设 `RUN_MODE=simple` 跳过 SaaS 计费

**升级：** 管理后台左上角「检测更新」或执行：

```bash
docker compose pull && docker compose up -d
```

### 2.5 配置 Cloudflare Temp Email

#### 2.5.1 部署 Temp Email 后端

你需要准备：

- 一个已接入 Cloudflare 的域名
- 部署好的 Cloudflare Temp Email Worker 地址
- 后端 admin auth（以及站点若启用了访问密码，则还有 custom auth）

#### 2.5.2 FlowPilot 中的填写项

| 配置项 | 说明 |
|--------|------|
| **Temp API** | Worker 地址，邮箱生成/收信都依赖此项 |
| **Admin Auth** | 对应后端 admin auth；仅作「邮箱生成」时必填 |
| **Custom Auth** | 仅站点额外设了访问密码时填写 |
| **Temp 域名** | 允许创建邮箱的基础域名（不是随机子域） |
| **随机子域** | 需后端配置 `RANDOM_SUBDOMAIN_DOMAINS`，且 DNS 已设 `MX *` |
| **邮件接收** | 作「邮箱服务」时填写真实收件邮箱（一般可留空） |

**推荐组合：** 邮箱生成 = Cloudflare Temp Email，邮箱服务 = Cloudflare Temp Email。两边字段都配齐后，Step 4 / Step 8 可全自动拉取注册码与登录码。

### 2.6 HeroSMS 接码：OpenAI 注册建议

OpenAI / ChatGPT 注册流程中，部分节点会要求手机号验证。推荐使用国际接码平台 **HeroSMS**。

| 项目 | 说明 |
|------|------|
| 官网 | [https://hero-sms.com/?ref=509318](https://hero-sms.com/?ref=509318) |
| 促销码 | `obvps`（充值约 15% 折扣，以官网为准） |
| 能力 | 180+ 国家、网页 + API、兼容 SMS-Activate 类流程 |

**为什么 OpenAI 建议用巴西号码？**  
经验上，OpenAI 注册对巴西等拉美号段的成功率与单价更均衡：

- 平台展示 OpenAI / ChatGPT 类服务起步价约 \$0.01–0.05
- 在 HeroSMS 下单页选择服务 **OpenAI** 或 **ChatGPT**，国家选 **Brazil**
- 优先选「库存充足 + 单价低」的组合

### 2.7 安装 FlowPilot 并对接 Sub2API

FlowPilot 是 Chrome 扩展，用于批量跑通 ChatGPT OAuth 注册/登录，并在 Step 10 将 localhost 回调提交回管理面板。

#### 2.7.1 安装扩展

1. 打开 `chrome://extensions/`，开启「开发者模式」
2. 「加载已解压的扩展程序」，选择 FlowPilot 项目目录
3. 打开扩展侧边栏

#### 2.7.2 来源选择：SUB2API（核心）

在侧边栏将来源设为 **SUB2API**，填写：

| 字段 | 说明 |
|------|------|
| **SUB2API** | 后台账号管理页地址，如 `https://你的域名/admin/accounts` |
| **账号/密码** | Sub2API 管理员登录信息 |
| **分组** | 目标 OpenAI 分组，留空默认 `codex` |
| **默认代理** | 可选，填代理名称或 ID；留空则不附带 `proxy_id` |

**流程要点：**

- **Step 1：** 在 Sub2API 后台生成 OAuth 授权链接
- **Step 2–9：** 自动注册、收邮箱验证码、登录、OAuth 同意
- **Step 10：** 将 localhost 回调中的 code/state 提交回 Sub2API，直接创建 OpenAI 账号记录

#### 2.7.3 推荐配置模板

| 配置项 | 推荐值 |
|--------|--------|
| 来源 | SUB2API |
| 邮箱生成 | Cloudflare Temp Email |
| 邮箱服务 | Cloudflare Temp Email |
| Mail | 按你接码/收信方案配置 |

**操作顺序建议：**

1. 先单步跑通 Step 1 → Step 4（确认邮箱验证码能收到）
2. 若出现手机号验证，确认 HeroSMS 巴西号 + API 正常
3. 再开右上角 **Auto** 多轮批量

### 2.8 端到端操作流程

#### 阶段 A：基础设施（约 30–60 分钟）

1. VPS 安装 Docker，部署 Sub2API，记录管理员账号
2. 域名 + Nginx/Caddy 配置 HTTPS，反代到 8080
3. 部署 Cloudflare Temp Email Worker，记下 API 地址与 Admin Auth
4. 注册 HeroSMS，充值并保存 API Key

#### 阶段 B：面板与代理（约 15 分钟）

1. 登录 Sub2API，创建分组 `codex`
2. 添加出站代理
3. 创建测试用户，生成一条 API Key 备用

#### 阶段 C：单账号试跑（约 10–20 分钟）

1. FlowPilot：来源 = SUB2API，填面板地址与管理员账号
2. 配齐 Cloudflare Temp Email 各项
3. 配置 HeroSMS
4. 单步执行 Step 1–4，确认注册邮件验证码成功
5. 若触发手机验证，用巴西号码完成
6. 跑完 Step 10，确认账号已入库且 OAuth 状态正常

#### 阶段 D：批量与交付

1. 设置 Auto 轮数与步间随机延迟
2. 批量完成后，在 Sub2API 为用户分发 API Key
3. 客户端示例（Claude Code）：

```bash
export ANTHROPIC_BASE_URL="https://你的域名"
export ANTHROPIC_AUTH_TOKEN="sk-你在面板生成的Key"
```

### 2.9 常见问题

| 问题 | 排查 |
|------|------|
| Sub2API 启动后无法访问？ | 检查防火墙是否放行 8080、容器是否 healthy、`docker compose logs sub2api` 是否有数据库连接错误 |
| FlowPilot Step 4 一直收不到验证码？ | 核对 Temp API、Admin Auth、Temp 域名；随机子域需 DNS `MX *` |
| OpenAI 要求手机号，HeroSMS 没收到短信？ | 换巴西以外的备用国家试单；检查订单是否超时释放 |
| Step 10 提交回调失败？ | 确认 Sub2API 地址、管理员 session 有效 |
| Codex CLI 粘性会话不生效？ | 检查 Nginx 是否开启 `underscores_in_headers on` |

---

## 模块三：NEW API + CLIProxyAPI 联合部署

### 3.1 准备工作

```bash
mkdir -p /opt/proxy/{cpa/{logs,auths},newapi/{data,logs}} && cd /opt/proxy && touch docker-compose.yml cpa/config.yaml
```

**目录结构：**

```
/opt/proxy/
├── docker-compose.yml
├── cpa/
│   ├── logs/
│   ├── auths/
│   └── config.yaml
└── newapi/
    ├── data/
    └── logs/
```

### 3.2 CPA 目录下的 config.yaml 文件

```yaml
host: ""
port: 8317
tls:
  enable: false
remote-management:
  allow-remote: true
  secret-key: "$2a$10$5dHykttqHWAU.WcYFg0qgOXhDoxC1P7wpZ7i2T8Kj9xqwvVRfTUm2"
  disable-control-panel: false
auth-dir: "~/.cli-proxy-api"
api-keys:
  - sk-8SGCShq021BAFgpBE
debug: true
logging-to-file: true
logs-max-total-size-mb: 100
request-retry: 3
max-retry-interval: 30
routing:
  strategy: "round-robin"
  ws-auth: false
  usage-statistics-enabled: false
```

> ⚠️ **请修改：** `secret-key`（管理密钥）和 `api-keys`（API 访问密钥）。

### 3.3 proxy 目录下的 docker-compose.yml 文件

```yaml
services:
  new-api:
    image: calciumion/new-api:latest
    container_name: new-api
    restart: always
    command: --log-dir /app/logs
    ports:
      - '3000:3000'
    volumes:
      - ./newapi/data:/data
      - ./newapi/logs:/app/logs
    environment:
      - SQL_DSN=postgresql://root:123456@postgres:5432/new-api
      - REDIS_CONN_STRING=redis://redis
      - TZ=Asia/Shanghai
      - ERROR_LOG_ENABLED=true
      - BATCH_UPDATE_ENABLED=true
    depends_on:
      - redis
      - postgres
      - cpa
    healthcheck:
      test: ['CMD-SHELL', "wget -q -O - http://localhost:3000/api/status | grep -o '\\\"success\\\":\\s*true' || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:latest
    container_name: redis
    restart: always

  postgres:
    image: postgres:15
    container_name: postgres
    restart: always
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: new-api
    volumes:
      - pg_data:/var/lib/postgresql/data

  cpa:
    image: eceasy/cli-proxy-api:latest
    container_name: cpa
    volumes:
      - ./cpa/config.yaml:/CLIProxyAPI/config.yaml
      - ./cpa/auths:/root/.cli-proxy-api
      - ./cpa/logs:/CLIProxyAPI/logs
    restart: always

volumes:
  pg_data:
```

> ⚠️ **请修改：** `SQL_DSN` 中的密码、`POSTGRES_PASSWORD` 中的密码、`api-keys` 中的密钥。

### 3.4 把认证文件放进认证目录

将 `.json` 格式的认证文件放入 `/opt/proxy/cpa/auths/` 目录。

### 3.5 防火墙放行 3000 端口

```bash
# 查看防火墙状态
systemctl status firewalld
systemctl start firewalld
systemctl enable firewalld
firewall-cmd --list-services
firewall-cmd --list-ports

# 开放 3000 端口
firewall-cmd --zone=public --add-port=3000/tcp --permanent && firewall-cmd --reload && firewall-cmd --list-ports
```

### 3.6 云服务器安全组配置

以腾讯云为例：

1. 进入控制台，选择服务器
2. 选择防火墙并添加规则
3. 配置来源（全部 IPv4 地址 `0.0.0.0/0`）和端口号（3000）
4. 确认后新增规则

### 3.7 启动服务

```bash
cd /opt/proxy
docker compose up -d
```

### 3.8 首次访问初始化

访问 `http://ip:3000`，进入系统初始化向导：

1. 数据库检查 → 下一步
2. 管理员账号 → 设置用户名密码（建议复杂）
3. 使用模式 → 选择「对外运营模式」（自用选「自用模式」）
4. 完成初始化

### 3.9 NEW API 配置

#### 3.9.1 渠道管理

登录管理员账号后，在左侧菜单找到「渠道管理」→「添加渠道」：

- **类型选择：** OpenAI / Claude / Gemini 等
- **名称：** 自定义
- **分组：** 选择或创建
- **密钥：** 填入上游 API Key
- **代理地址：** 填入 CPA 地址 `http://cpa:8317`

#### 3.9.2 令牌管理

在「令牌管理」中创建令牌，设置：

- **名称：** 自定义
- **分组：** 对应渠道分组
- **额度：** 设置可用额度
- **过期时间：** 设置有效期

---

## 模块四：CLIProxyAPI 独立部署与配置

### 4.1 服务器选型与环境初始化

选择美国区域云服务器（2 核 CPU + 2GB 内存），确保能稳定访问上游模型服务商。

```bash
apt update && apt upgrade -y
apt install -y curl wget nano vim
```

### 4.2 CLIProxyAPI 自动化安装

```bash
curl -fsSL https://raw.githubusercontent.com/brokechubb/cliproxyapi-installer/refs/heads/master/cliproxyapi-installer | bash
```

安装完成后，程序位于 `/root/cliproxyapi` 目录。

### 4.3 核心配置文件 config.yaml 深度定制

```bash
cd /root/cliproxyapi
nano config.yaml
```

**关键配置项：**

```yaml
host: ""
port: 8317
tls:
  enable: false
  cert: ""
  key: ""
remote-management:
  allow-remote: true
  secret-key: ""
  disable-control-panel: false
auth-dir: "~/.cli-proxy-api"
api-keys:
  - "sk-你的自定义密钥"
debug: true
logging-to-file: true
logs-max-total-size-mb: 100
request-retry: 3
max-retry-interval: 30
routing:
  strategy: "round-robin"
  ws-auth: false
  usage-statistics-enabled: false
commercial-mode: false
```

### 4.4 系统服务化管理（Systemd）

**创建服务文件：**

```bash
cat > /etc/systemd/system/cliproxyapi.service << 'EOF'
[Unit]
Description=CLIProxyAPI Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/cliproxyapi
ExecStart=/root/cliproxyapi/cli-proxy-api
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

**启动服务：**

```bash
systemctl daemon-reload
systemctl enable cliproxyapi
systemctl start cliproxyapi
systemctl status cliproxyapi
```

### 4.5 网络防火墙配置

```bash
firewall-cmd --zone=public --add-port=8317/tcp --permanent
firewall-cmd --reload
```

同时在云服务器安全组中放行 8317 端口。

### 4.6 Web 管理界面访问

访问 `http://你的服务器IP:8317/v0/management`，输入管理密钥后进入仪表盘。

### 4.7 OAuth 认证流程

| 命令 | 说明 |
|------|------|
| `./cli-proxy-api --login` | Gemini 认证 |
| `./cli-proxy-api --codex-login` | OpenAI 认证 |
| `./cli-proxy-api --claude-login` | Claude 认证 |
| `./cli-proxy-api --qwen-login` | Qwen 认证 |
| `./cli-proxy-api --iflow-login` | iFlow 认证 |

### 4.8 基于 Docker 的数据持久化与 New API 部署

#### 4.8.1 MySQL 数据库容器化部署

```yaml
services:
  mysql:
    image: mysql:8.2
    container_name: mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: 你的密码
      MYSQL_DATABASE: new-api
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

#### 4.8.2 New API 中台系统部署

```yaml
services:
  new-api:
    image: calciumion/new-api:latest
    container_name: new-api
    restart: always
    command: --log-dir /app/logs
    ports:
      - '3000:3000'
    volumes:
      - ./newapi/data:/data
      - ./newapi/logs:/app/logs
    environment:
      - SQL_DSN=root:密码@tcp(mysql:3306)/new-api
      - REDIS_CONN_STRING=redis://redis
      - TZ=Asia/Shanghai
    depends_on:
      - redis
      - mysql
      - cpa
```

### 4.9 New API 初始化配置与渠道映射

#### 4.9.1 系统初始化

访问 `http://ip:3000`，完成数据库检查、管理员账号设置、使用模式选择。

#### 4.9.2 添加 CLIProxyAPI 渠道

在「渠道管理」中添加：

- **类型：** OpenAI 兼容
- **名称：** CLIProxyAPI
- **密钥：** sk-你在 `config.yaml` 中设置的密钥
- **代理地址：** `http://cpa:8317` 或 `http://你的服务器IP:8317`

#### 4.9.3 创建访问令牌（Token）

在「令牌管理」中创建，设置分组、额度、过期时间。

### 4.10 客户端集成（Cherry Studio 示例）

1. 打开 Cherry Studio → 设置 → 模型
2. 添加自定义提供商：
   - **名称：** 你的中转站
   - **API 地址：** `https://你的域名`
   - **API Key：** sk-你在面板生成的 Key
3. **模型列表同步：** 点击刷新，获取可用模型列表
4. **倍率修正：** 根据实际消耗调整倍率

---

## 模块五：AI 工具站从 0 到 1 运营

### 5.1 环境准备：启动前必须想清楚的三件事

#### 1️⃣ 赛道选择（垂直 vs 综合）

- **新手千万别做"第二个 ChatGPT 大全"**
- 建议 All in 一个极度垂直的赛道：
  - AI 生成特定风格头像
  - AI 周报生成器
  - 小红书爆款标题生成
  - 外贸邮件润色
- 从你熟悉或感兴趣的细分领域切入

#### 2️⃣ 技术栈评估（自己造轮子 vs 用 API）

- 除非核心是模型微调，否则别从头训练模型
- 核心体验自己把控，底层能力调用 API
- **初期技术栈：**
  - **后端：** FastAPI（轻量，异步支持好）或 Node.js + Express
  - **前端：** Next.js（SEO 友好，全栈能力）或 Vite + React
  - **AI 能力：** 调用 OpenAI / Claude / Gemini API

#### 3️⃣ 变现模式预设

| 模式 | 说明 |
|------|------|
| 积分墙 | 按次付费 |
| 订阅制 | 按月/年付费 |
| 广告变现 | 展示广告 |
| 联盟营销 | 推荐返佣 |

### 5.2 分步操作：从开发到上线的核心流程

#### 第一步：搭建基础产品框架

1. 确定 MVP 功能：只做最核心的 1–2 个功能
2. 设计用户流程：注册 → 试用 → 付费 → 使用
3. 搭建基础架构：
   - 用户系统（注册/登录/找回密码）
   - 积分/余额系统
   - 调用记录系统

#### 第二步：部署与基础 SEO 设置

1. **域名与服务器：**
   - 购买域名（建议 `.com` / `.ai`）
   - 选择海外服务器（Vercel / Cloudflare / AWS）

2. **SEO 基础设置：**
   - **标题（Title）：** 包含核心关键词
   - **描述（Description）：** 150 字内说明网站价值
   - **关键词（Keywords）：** 3–5 个核心词
   - **Sitemap.xml：** 提交到 Google Search Console

3. **性能优化：**
   - 图片压缩（WebP 格式）
   - CDN 加速
   - 首屏加载 < 3 秒

#### 第三步：冷启动与初始流量获取

1. **内容营销：**
   - 在 Reddit / Twitter / 小红书 分享使用案例
   - 写教程文章（SEO 长尾词）
   - 制作短视频（TikTok / YouTube Shorts）

2. **社区运营：**
   - 加入相关 Discord / Telegram 群组
   - 在 Product Hunt 发布
   - 在 Indie Hackers 分享经验

3. **免费引流：**
   - 提供有限免费额度（如每天 3 次免费使用）
   - 邀请返利机制（邀请 1 人得 10 积分）

### 5.3 完整代码示例：一个简单的积分墙实现

```python
# FastAPI 后端示例
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import hashlib
import time

app = FastAPI()
Base = declarative_base()

# 用户模型
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    password = Column(String)
    credits = Column(Float, default=10.0)  # 初始赠送 10 积分
    api_key = Column(String, unique=True)

# 使用记录模型
class UsageLog(Base):
    __tablename__ = "usage_logs"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    feature = Column(String)
    cost = Column(Float)
    created_at = Column(Integer)

# 数据库连接
engine = create_engine("sqlite:///./app.db")
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 生成 API Key
def generate_api_key(email: str):
    return "sk-" + hashlib.sha256(f"{email}{time.time()}".encode()).hexdigest()[:32]

# 注册接口
@app.post("/register")
def register(email: str, password: str, db: Session = Depends(get_db)):
    api_key = generate_api_key(email)
    user = User(email=email, password=password, api_key=api_key)
    db.add(user)
    db.commit()
    return {"api_key": api_key, "credits": 10.0}

# 使用功能接口（扣除积分）
@app.post("/use")
def use_feature(feature: str, api_key: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.api_key == api_key).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 查询功能价格
    prices = {"image_gen": 2.0, "text_gen": 0.5, "code_gen": 1.0}
    cost = prices.get(feature, 1.0)
    
    if user.credits < cost:
        raise HTTPException(status_code=402, detail="积分不足，请充值")
    
    # 扣除积分并记录
    user.credits -= cost
    log = UsageLog(user_id=user.id, feature=feature, cost=cost, created_at=int(time.time()))
    db.add(log)
    db.commit()
    
    return {"success": True, "remaining_credits": user.credits}

# 查询余额接口
@app.get("/credits")
def get_credits(api_key: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.api_key == api_key).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"credits": user.credits}
```

### 5.4 踩坑提示

1. **别一开始就追求完美：** MVP 上线比完美产品更重要
2. **API 成本要算清楚：** 按 Token 计费，设置好倍率，避免亏损
3. **风控很重要：** 设置 IP 限制、频率限制，防止被刷
4. **数据备份：** 数据库每日自动备份到云存储
5. **合规性：** 明确服务条款，禁止用于违法用途

---

## 模块六：AI 建站工具全流程攻略

### 6.1 为什么需要 AI 建站工具

- 不需要懂 HTML、CSS、服务器
- 只需要"说清楚你想要什么"
- 十几分钟生成完整网站

### 6.2 从 0 到上线的通用流程

#### 第一步：明确网站目标

想清楚三件事：

- **你是谁？** 品牌名称、核心业务、目标客户
- **你要干嘛？** 纯展示品牌？在线卖货？收集销售线索？
- **你偏好啥？** 有没有参考网站？喜欢什么配色？

#### 第二步：选择合适的工具并注册

| 类型 | 代表工具 | 特点 | 适合人群 |
|------|----------|------|----------|
| AI 生成式 | LynxCode | 对话式生成，可视化编辑 | 完全零基础 |
| 模板建站 | Wix, Squarespace | 模板库大，手动拖拽 | 有一定设计能力 |
| 开源系统 | WordPress | 灵活性最高，需技术 | 有开发基础 |

#### 第三步：与 AI 对话，生成网站雏形

回答 AI 的问题：

- **"你的网站需要哪些页面？"** → "首页、关于我们、产品介绍、案例展示、联系我们"
- **"描述一下你的品牌风格"** → "现代简约，主色调用蓝色和白色，偏商务"

#### 第四步：内容微调与视觉优化

- 品牌故事换成自己的真实经历
- 调整模块顺序，替换配图
- 修改按钮颜色

#### 第五步：配置域名与基础设置

- 购买域名或绑定已有域名
- 国内服务器需备案（约 1 周）
- 海外服务器无需备案

#### 第六步：SEO 基础设置

- 确认每个页面的标题和描述包含核心业务词
- 检查图片 Alt 标签
- 确保 H1、H2 层级结构
- 生成 sitemap.xml

#### 第七步：测试、预览、正式发布

**检查清单：**

- [ ] 所有链接能点开
- [ ] 不同屏幕尺寸显示正常
- [ ] 表单能正常提交
- [ ] 没有错别字或排版错位

### 6.3 不同阶段关注点

- **刚接触时：** 先注册免费版跑一遍流程，感受能力边界
- **选工具时：** 重点关注"生成后的可编辑程度"和"SEO 功能是否完善"
- **上线后：** 持续优化，看后台数据，调整文案和模块

### 6.4 成本与风险

**费用：**

- 免费版：通常有功能限制或品牌标识
- 专业版：几百到上千元/年
- 注意：带宽限制、域名绑定、SEO 功能是否完整

**数据所有权：**

- 确认能否导出数据（文章、产品列表、整站 HTML）
- 正规平台数据归用户所有

---

## 模块七：算力出海变现策略

### 7.1 启动清单

#### 阶段一：基础设施（第 1–3 天）

- [ ] 购买海外 VPS（推荐美国/新加坡节点）
- [ ] 购买域名并配置 DNS
- [ ] 部署 Sub2API / NEW API 中转站
- [ ] 配置 SSL 证书（Let's Encrypt）
- [ ] 注册 Cloudflare 账号并配置 CDN

#### 阶段二：账号准备（第 4–7 天）

- [ ] 部署 Cloudflare Temp Email Worker
- [ ] 注册 HeroSMS 并充值
- [ ] 安装 FlowPilot Chrome 扩展
- [ ] 批量注册 OpenAI / Claude 账号（10–20 个起步）
- [ ] 将账号导入中转站面板

#### 阶段三：产品上线（第 8–14 天）

- [ ] 设计网站 UI（landing page + 用户面板）
- [ ] 接入支付系统（z-pay 易支付 / Stripe）
- [ ] 设置定价策略（按 Token / 按次 / 包月）
- [ ] 配置用户注册和 API Key 分发
- [ ] 上线测试并修复 bug

#### 阶段四：流量获取（第 15–30 天）

- [ ] 在 Reddit / Twitter 发布产品
- [ ] 在 Product Hunt 上线
- [ ] 写 SEO 文章（长尾关键词）
- [ ] 加入相关 Discord / Telegram 社群推广
- [ ] 设置邀请返利机制

### 7.2 30 分钟每日执行表

| 时间段 | 任务 | 目的 |
|--------|------|------|
| 0–5 min | 检查服务器状态 + 账号健康度 | 确保服务稳定 |
| 5–10 min | 查看昨日数据（注册/充值/用量） | 了解业务状况 |
| 10–15 min | 处理用户反馈和工单 | 提升用户体验 |
| 15–20 min | 发布 1 条社交媒体内容 | 获取流量 |
| 20–25 min | 优化 1 个 SEO 页面或写 1 篇文章 | 长期流量 |
| 25–30 min | 学习 1 个新技术或行业动态 | 保持竞争力 |

### 7.3 免费算力获取渠道

| 渠道 | 说明 |
|------|------|
| **GitHub Student Pack** | 包含 Azure、AWS、DigitalOcean 等免费额度；需要学生邮箱或 GitHub 学生认证 |
| **Cloudflare Workers** | 免费边缘计算，每天 10 万次请求免费 |
| **Vercel / Netlify** | 免费托管前端，Serverless 函数；适合 Next.js / React 项目 |
| **Oracle Cloud** | 永久免费 tier：2 台 AMD + 4 台 ARM |
| **Google Cloud** | \$300 新用户赠金，有效期 90 天 |
| **AWS** | \$300–\$1000 新用户赠金（视活动而定），有效期 12 个月 |
| **OpenRouter** | 免费 tier 额度，可测试不同模型 |

---

## 模块八：Fiverr 接单与跨境变现

### 8.1 Fiverr 平台入门

#### 8.1.1 注册与设置

1. 访问 [https://www.fiverr.com](https://www.fiverr.com) 注册账号
2. 完善个人资料：
   - 专业头像
   - 英文自我介绍（突出 AI 技能）
   - 技能标签（AI Tools, API Integration, ChatGPT, Automation）

#### 8.1.2 创建 Gig（服务）

**Gig 标题公式：**

```
I will [服务] using [工具] for [结果]
```

**示例：**

- "I will build a custom AI chatbot for your website using GPT-4"
- "I will create an AI API proxy service for your business"
- "I will automate your workflow using AI tools and APIs"

**Gig 定价策略：**

| 套餐 | 基础版 | 标准版 | 高级版 |
|------|--------|--------|--------|
| 价格 | \$50 | \$150 | \$500 |
| 包含 | 基础配置 | 完整部署 | 定制开发 |
| 交付时间 | 3 天 | 7 天 | 14 天 |
| 修改次数 | 1 次 | 3 次 | 无限 |

### 8.2 英文推广话术模板

#### 8.2.1 主动提案（Buyer Request 回复）

```
Hi [Name],

I noticed you're looking for [service]. I specialize in building 
AI-powered solutions and have successfully completed [X] similar projects.

Here's what I can deliver:
✅ [Feature 1]
✅ [Feature 2]
✅ [Feature 3]

Why choose me?
- [X]+ years of experience in AI/ML
- 100% satisfaction guarantee
- 24/7 support during the project

Let's discuss your requirements in detail. 
I'm ready to start immediately.

Best regards,
[Your Name]
```

#### 8.2.2 客户沟通话术

**初次接触：**

```
Thank you for reaching out! To provide the best solution, 
could you please clarify:

1. What's your main goal with this project?
2. Do you have any specific requirements or preferences?
3. What's your timeline?

Looking forward to working with you!
```

**交付后跟进：**

```
Hi [Name],

I've completed your order and delivered all files. 
Here's a quick summary:

📦 Deliverables: [List]
📖 Documentation: [Link]
🎥 Tutorial Video: [Link]

Please review and let me know if you need any adjustments. 
I'm here to help!

If everything looks good, I'd greatly appreciate your review. 
It helps me grow my business.

Best,
[Your Name]
```

### 8.3 Reddit 推广帖子模板

#### 8.3.1 产品发布帖（r/SideProject / r/IndieHackers）

```
[Showoff Saturday] I built an AI API proxy that saves you 70% on API costs

Hey everyone!

Over the past 3 months, I've been building [产品名] - an AI API 
aggregation platform that helps developers and businesses:

🚀 Access multiple AI models through a single API
💰 Save up to 70% on API costs through smart routing
🔑 Manage all your API keys in one dashboard
📊 Track usage and optimize spending

How it works:
Instead of managing multiple API keys for OpenAI, Claude, Gemini, etc., 
you get one unified API endpoint. We handle the routing, load balancing, 
and failover automatically.

Pricing:
- Free tier: 1,000 requests/month
- Pro: $29/month for 100K requests
- Business: Custom pricing

Tech stack:
- Backend: Go + PostgreSQL + Redis
- Frontend: Next.js + Tailwind
- Infrastructure: Docker + Nginx + Cloudflare

Would love your feedback! What features would you like to see?

[链接]
```

#### 8.3.2 价值分享帖（r/ChatGPT / r/LocalLLaMA）

```
[Guide] How I built a profitable AI API proxy business (with numbers)

I've been running an AI API proxy service for 6 months. 
Here's what I've learned:

The Problem:
Managing multiple AI API keys is a pain. Different providers, 
different pricing, different rate limits.

The Solution:
A unified API gateway that:
1. Aggregates multiple providers
2. Smart routes based on cost/performance
3. Handles failover automatically

The Numbers:
- Setup cost: $200 (VPS + domain + initial accounts)
- Monthly revenue: $2,500-$4,000
- Monthly cost: $800-$1,200 (API usage + server)
- Profit margin: ~60%

How to start:
1. Deploy Sub2API/NEW API (open source)
2. Register 10-20 OpenAI accounts (using temp email + SMS)
3. Set up payment (Stripe/PayPal)
4. Launch on Product Hunt/Reddit

Lessons learned:
- Start with one model, expand later
- Focus on reliability over features
- Customer support is your moat

Happy to answer questions!
```

### 8.4 API 代理全套话术

#### 8.4.1 销售话术（面向企业客户）

```
Hi [Name],

I hope this email finds you well. I'm reaching out because I noticed 
[Company] is using AI in [specific area].

We help companies like yours reduce AI API costs by 50-70% while 
improving reliability. Here's how:

Current challenges you might face:
❌ Managing multiple API providers is complex
❌ Rate limits disrupt your operations
❌ API costs scale unpredictably

Our solution:
✅ Single API endpoint for all major models (GPT-4, Claude, Gemini, etc.)
✅ Smart load balancing across multiple accounts
✅ Real-time cost optimization
✅ 99.9% uptime guarantee

Case study:
[Similar Company] reduced their monthly AI spend from $5,000 to $1,800 
while doubling their API capacity.

Would you be open to a 15-minute call to discuss how this could work 
for [Company]?

Best regards,
[Your Name]
[Title]
[Website] | [LinkedIn]
```

#### 8.4.2 工具站引流文案

**首页 Hero Section：**

```
One API. All AI Models. 70% Cost Savings.

Access GPT-4, Claude, Gemini, and 20+ models through a single API 
endpoint. Smart routing, automatic failover, and real-time cost 
optimization.

[Get Started Free] [View Pricing]
```

**Feature Section：**

```
Why developers choose us:

🚀 Unified API
One endpoint, all models. No more managing multiple API keys.

💰 Cost Optimization
Smart routing to the cheapest available provider. Save up to 70%.

🔒 Enterprise Security
SOC 2 compliant, encrypted in transit and at rest.

📊 Real-time Analytics
Track usage, costs, and performance in one dashboard.

⚡ 99.9% Uptime
Multi-provider failover ensures your app never goes down.
```

**CTA Section：**

```
Start building with AI today

Free tier includes 1,000 requests/month. No credit card required.

[Start Free] [Contact Sales]
```

---

## 附录：资源链接汇总

### 开源项目

| 项目 | 链接 | 说明 |
|------|------|------|
| **Sub2API** | GitHub · Wei-Shaw/sub2api | AI API 网关平台 |
| **Sub2API 演示** | [demo.sub2api.org](https://demo.sub2api.org) | 在线演示 |
| **FlowPilot** | GitHub · QLHazyCoder/FlowPilot | 批量账号注册工具 |
| **FlowPilot 教程** | [flowpilot.qlhazycoder.top/tutorial](https://flowpilot.qlhazycoder.top/tutorial) | 官方教程站 |
| **NEW API** | GitHub · calciumion/new-api | 用户管理与计费 |
| **CLIProxyAPI** | GitHub · brokechubb/cliproxyapi-installer | CLI 代理工具 |

### 工具与服务

| 服务 | 链接 | 说明 |
|------|------|------|
| **HeroSMS** | [hero-sms.com](https://hero-sms.com/?ref=509318) | 国际接码平台（促销码：obvps） |
| **Cloudflare** | [cloudflare.com](https://cloudflare.com) | CDN + Temp Email Worker |
| **Fiverr** | [fiverr.com](https://fiverr.com) | 自由职业接单平台 |
| **Product Hunt** | [producthunt.com](https://producthunt.com) | 产品发布平台 |
| **Vercel** | [vercel.com](https://vercel.com) | 前端托管 |
| **Stripe** | [stripe.com](https://stripe.com) | 支付处理 |

### 社区与论坛

| 平台 | 推荐频道 |
|------|----------|
| **Reddit** | r/ChatGPT, r/LocalLLaMA, r/SideProject, r/IndieHackers |
| **Discord** | Midjourney, OpenAI, Claude 官方及第三方社群 |
| **Telegram** | AI 工具分享群组 |
| **国内** | linux.do, v2ex |

---

## ⚠️ 合规提示

使用 Sub2API、批量注册 OpenAI 账号可能涉及上游服务条款与当地法律。本文仅供技术学习与正当业务场景参考，请自行评估风险。

**关键原则：**

1. 技术再完善，也无法替代合规使用
2. 请再次确认使用场景符合各平台服务条款与当地法规
3. 勿将本方案用于欺诈、滥发或其他违法行为

---

## 学习建议

按模块顺序学习，先掌握 **模块二（Sub2API 搭建）** 或 **模块三（NEW API + CPA）**，这是整个业务的技术基础。然后再学习 **模块五（AI 工具站运营）** 和 **模块七（变现策略）**，最后结合 **模块八（Fiverr 接单）** 拓展收入来源。

---

> 祝学习顺利，早日实现技术变现！🚀
