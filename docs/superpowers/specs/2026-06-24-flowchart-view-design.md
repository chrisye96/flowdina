# 流程图视图（Flowchart View）设计文档

- 日期：2026-06-24
- 分支：`feat/flowchart-view`
- 状态：已与用户确认设计，待写实现计划
- 关联文件：`index.html`（单文件应用）

## 1. 背景与目标

现有 `index.html` 是一个单文件「Franchisee Journey」**步骤图**编辑器（列式布局、点击改文字、颜色侧栏、悬停增删、自动保存、JSON 导入导出、分享链接、PNG/PDF 导出）。

本次新增一个独立的**流程图（Flowchart）视图**，与现有步骤图**共存**：

- 顶部加视图切换按钮（`流程图 / 步骤图`），**HTML 默认显示流程图**。
- 两个视图各自独立保存、互不影响。
- 流程图初始内容来自用户提供的三张图（见 §3）。
- 流程图是**自由画布 + SVG 连接线层**的编辑器，组块与连线均可自定义、增、删。

## 2. 范围

### 做（In scope）

- 顶部视图切换，默认流程图。
- 自由画布：组块绝对定位、可拖动、可调整大小、可平移、可缩放。
- 组块：增/删整块、增/删块内条目（文字、状态行、按钮、通知框、图标）、改块底色/标题栏色/文字色。
- 连线（SVG）：见 §4.4，支持指向、箭头类型、线型、路由、粗细、颜色、长度、绑定组块/自由端点、线上文字增删，连线本身增删。
- 上下文工具侧栏（根据选中对象切换属性）。
- 复用现有：自动保存、PNG/PDF 导出、JSON 导入导出、分享链接、点击改文字、划选加粗/改色——均作用于**当前显示的视图**。
- 按三张图预排好初始流程图。

### 不做（Out of scope / YAGNI）

- 不引入重型图编辑库（jsPlumb、mxGraph、draw.io 等）；保持纯 DOM + CDN 工具库，以兼容现有「序列化 DOM」式的保存机制。
- 不做多人协作、不做后端、不做版本历史。
- 不做组块之间的自动布局/自动避让算法（连线走简单路由即可）。

## 3. 源内容提取（三张图，逐字）

主干结构：

```
Application Received（起点）
   ↓
STEP 1：受理申请 / 审核中
   ↓
DECISION POINT（决策点）
   ├──→ STEP 2：财务核查 → Awaiting Financial Submission → Financial Check Completed ┐
   ├──→ STEP 3：直接批准 ──────────────────────────────────────────────────────────┤→ POST-APPROVAL STATE
   └──→ STEP 4：拒绝 → Process Ends（结束）                                          ┘
```

STEP 2 路径与 STEP 3 路径在「Both approval paths converge here」处汇合，进入 POST-APPROVAL STATE。

### 起点节点
- 图标 ▶（play）；文字 **Application Received**；蓝色圆角胶囊。

### STEP 1（琥珀/橙色块）
- 标题栏：`STEP 1: ACCEPT APPLICATION - UNDER REVIEW`
- 🕐 **Franchisor Actions:**
  - Franchisor logs in through their ID
  - Compatibility score is shown from WordPress
  - Accept application for review
  - Provide timeline for decision (7 days wait period)
  - System sends notification to franchisee with expected decision date
- 高亮条：🏛️ **Timeline: 7 Business Days Review Period**

### DECISION POINT（紫色边框 + 淡紫底）
- ⚡ **DECISION POINT**
- After 7-Day Review Period
- Franchisor chooses next action
- 内嵌红框 ⚠️ **DISCLAIMER:**
  - If no action is taken after 7-day review period, application will **AUTO-DECLINE**. Admin will receive email notification that application declined due to no action taken.
  - 内嵌小框：💬 **Sana to share email content for auto-decline notification**

### STEP 2：FINANCIAL CHECK（蓝色块，最长）
- 💲 **Franchisor Actions:**
  - Click **"Financial Health Check Required"** button on dashboard
  - System automatically triggers email notification to franchisee email ID (retrieved from application stored in WordPress). **Subject:** Financial Health Check Required. **Email Content:** "Please submit your financial health check within 5 Business days." ⏰ Timer Active: 5 Business Days to Submit
  - Application declined if no action taken after 5 days. Automated email sent to franchisee notifying application declined due to no financial submission.
  - Once the financial check is complete, franchisor gets notification via email to take further action (either approve or decline application).
- 橙框：✉️ 💬 **Sana to share email content**
- ⓘ **Backend Integration:**
  - 💬 Email ID retrieved from franchisee's WordPress application
  - 🔗 Linked with WordPress backend through **Inverite Financial Health Check**
  - ⏳ When "Financial Health Check Required" button is clicked and email is sent, button is removed and status shows **"In Progress"**
  - ✅ When financial check is completed, data automatically syncs to dashboard via API
- 📄 **Ad-Hoc Action Available:**
  - **On Successful Verification from WordPress:**
    - Button label changes to **"Verification Complete - View Details"**
    - Clicking this button opens franchisee financial details in new window

### STEP 3：APPLICATION APPROVED（绿色块）
- ✅ **Franchisor Actions:**
  - Click "Approve" button (no financial check needed)
  - Application immediately approved
  - System sends approval notification to franchisee
- ✉️ **Automated Email Sent:** Franchisee notified of application approval with next steps
  - 💬 Sana to share email content

### STEP 4：APPLICATION DECLINED（红色块）
- ⊗ **Franchisor Actions:** Click "Decline" button
- ✉️ **Automated Email Sent:**
  - 💬 Sana to share email content
- ↓ 🛑 **Process Ends**（红色结束胶囊）

### Awaiting Financial Submission（蓝框，STEP 2 之后）
- ⏳ **Awaiting Financial Submission**
- Franchisee has 5 business days to submit
- *WordPress → API → Dashboard sync*（斜体）

### Financial Check Completed（绿框）
- ✅ **Financial Check Completed**
- Auto-synced from WordPress via API
- **Status visible on dashboard**

### 汇合标注
- 文字：**Both approval paths converge here ↓**

### POST-APPROVAL STATE（绿色块，最宽）
- ✅ **Application Status: APPROVED**
  - Franchisee can proceed with onboarding process
  - **WITHDRAWAL OPTION AVAILABLE**（红色强调）
  - Franchisor can withdraw approval at ANY point post-approval
  - If "Withdraw Application" button clicked:
    - Email sent to: **Franchisee**
    - Email sent to: **Franchisor** (confirmation)
    - Email sent to: **Admin** (system record)
    - Email sent to: **Partner**
  - All parties notified simultaneously

## 4. 架构

### 4.1 文件结构与视图切换

- 保持单文件 `index.html`。
- 顶部工具栏新增切换控件（两个互斥按钮或分段控件）：`流程图` / `步骤图`。
- DOM 中并列两个根容器：
  - `#flow-view`（新增，流程图，默认显示）
  - `#step-view`（现有步骤图整体，含 `#board`，默认隐藏）
- 切换只改显隐；导出/JSON/分享/自动保存等顶部操作对**当前可见视图**生效。
- 默认视图：流程图。

### 4.2 画布（Canvas）

- `#flow-canvas`：一块可平移、可缩放的工作区。
  - 平移：拖拽空白区域（或按住空格拖拽）。
  - 缩放：滚轮 + 工具栏 `+ / − / 适应` 按钮，缩放范围约 25%–200%。
  - 可选网格吸附（默认开，间距如 8px）。
- 画布内含两层：
  - **组块层**：绝对定位的组块 DOM。
  - **连线层**：一个覆盖全画布的 `<svg id="flow-edges">`，画在组块之下或之上（连线在下、组块在上，避免遮挡文字）。

### 4.3 组块模型（Block）

- 每个组块是绝对定位的 `div.fb`（flow block），带：
  - 唯一 `data-id`（连线绑定用）。
  - inline style 的 `left/top/width/height`（天然可序列化）。
  - 可选「标题栏 + 正文」结构，正文里是可增删的条目（复用步骤图的条目类型：`.card-body` 文字、`.field` 状态行、`.btn` 按钮、`.note` 通知框、`.card-icon` 图标，以及块内嵌套子框/项目符号）。
  - 块类型（视觉变体）：`step`（带标题栏的步骤块）、`decision`（决策块）、`terminal`（起点/结束胶囊）、`status`（Awaiting/Completed 这类小状态框）、`note`（标注文字）。类型主要影响默认样式，结构仍是通用「头+体」。
- 交互：拖动移动、拖右下角手柄改尺寸、点击选中、悬停出现增删/连线锚点。
- 删除：整块删除，或删块内某一最小条目（沿用现有「最小容器」删除逻辑，按需扩展选择器列表）。

### 4.4 连线模型（Connector / Edge）

连线不是 DOM 流内元素，而是一组**记录**，集中存在内存数组并渲染到 `#flow-edges`。每条记录字段：

| 字段 | 取值 | 含义 |
|---|---|---|
| `id` | string | 唯一标识 |
| `from` | `{block, anchor}` 或 `{x, y}` | 起点：绑定组块锚点，或自由坐标 |
| `to` | `{block, anchor}` 或 `{x, y}` | 终点：同上（两端可混用绑定/自由） |
| `anchor` | `top｜right｜bottom｜left｜auto` | 组块上的连接点；`auto` 取最近边 |
| `arrowStart` | bool | 起点是否有箭头 |
| `arrowEnd` | bool | 终点是否有箭头（→ 指向：单向/双向/无） |
| `arrowType` | `solid｜open｜thin` | 箭头样式 |
| `lineStyle` | `solid｜dashed｜dotted` | 线型 |
| `routing` | `straight｜elbow｜curved` | 路由；**默认 elbow（正交）** |
| `width` | number | 线粗 |
| `color` | hex | 线色 |
| `label` | string | 线上文字（可空，可增删可改色） |
| `labelT` | 0–1 | 文字在线段上的位置比例 |

- **几何重算**：任何组块移动/缩放、画布缩放、或载入时，统一遍历连线，按 `from/to`（绑定则读组块当前锚点坐标，自由则读坐标）+ `routing` 生成 `<path d=...>`，并按 `arrowStart/arrowEnd/arrowType` 挂 marker，按 `lineStyle/width/color` 设样式，按 `label/labelT` 放 `<text>`/前景标签。
- **创建**：
  - 绑定连线：悬停组块边缘显示 4 个锚点，从锚点拖到另一块（或其锚点）即建一条 `from/to` 均绑定的连线。
  - 自由线段：工具栏「+ 线段」在画布中央放一条两端均为自由坐标的连线。
- **编辑**：点连线选中 → 侧栏改全部属性；拖端点可改坐标（自由端）或重新吸附到组块锚点（绑定端，即「重新指定连接的组块」）；拖动可改长度/角度。
- **删除**：选中连线后删除；线上文字单独可删（清空 `label`）。

### 4.5 工具侧栏（上下文属性面板）

常驻右侧面板，依据当前选中对象切换内容：

- **选中组块**：块底色、标题栏色、文字色；增删块内条目（复用现有「+」菜单）；删整块；（可选）尺寸/层级。
- **选中连线**：§4.4 全部属性 + 线上文字增删。
- **划选文字**：加粗、改色（复用现有 inline 工具）。
- **未选中**：全局主题色 + 画布设置（网格、缩放复位等）。

本面板按需新建基础设施（不强求只复用现有颜色面板）。

### 4.6 序列化与持久化

- 现有保存格式 `{ v, html, colors }` 扩展为按视图保存：
  - 步骤图：沿用现有 `{ html, colors }`，localStorage 键不变。
  - 流程图：`{ v, blocksHtml, colors, connectors[] }`，新 localStorage 键（如 `flowchart-state-v1`）。
    - `blocksHtml`：组块层 innerHTML（绝对坐标在 inline style 中，可直接还原）。
    - `connectors[]`：§4.4 记录数组。
- 载入流程：先还原组块层 HTML → 应用颜色 → 用 connectors 数组重建并重绘 SVG。
- 分享链接 / JSON 文件：包一层 `{ view: 'flow'|'step', payload }`，导入时进入对应视图；保持向后兼容（旧链接无 `view` 字段时按步骤图处理）。
- 安全：分享/导入内容仍走现有 `safeBoardHtml()` 清洗（去 script/on* 等）。

### 4.7 复用与新增基础设施

- 复用：自动保存（MutationObserver + 防抖；连线变更也触发保存）、PNG/PDF 导出（`html2canvas` 截取当前视图容器，含 SVG 连线）、JSON 导入导出、分享链接、点击改文字、划选加粗/改色、Lucide 图标、撤销 toast。
- 新增（按需）：画布平移缩放、组块拖动/缩放、连线渲染与编辑、上下文属性侧栏、锚点拖拽建连线。
- 导出注意：导出时隐藏所有编辑装饰（锚点、手柄、选中框、网格），沿用 `body.exporting` 思路。

## 5. 初始流程图内容与布局

- 按 §3 在画布上以合理绝对坐标预排整张图：起点居中靠上 → STEP1 → DECISION POINT → 三分支横向展开（STEP2 左、STEP3 中、STEP4 右）→ STEP2 下接 Awaiting → Completed →（与 STEP3 路径）汇合 → POST-APPROVAL STATE 居中靠下；STEP4 下接 Process Ends。
- 连线默认 elbow + 末端实心箭头；颜色随主题。
- 盒内文字照搬 §3 英文（含原样大小写）；UI 文字中文。
- 图标用 Lucide，映射：▶=play、🕐=clock、⚡=zap、💲=dollar-sign、⚠️/⏰=alert-triangle/timer、🛑=octagon、💬=message-square、🔗=link、⏳=hourglass、🏛️=landmark、✅=check-circle、⊗=x-circle、✉️=mail、ⓘ=info、📄=file-text。
- 「Sana to share email content」原样保留为占位备注。

## 6. UX 交互要点

- 选中态清晰（高亮描边）；空白处点击取消选中。
- 组块拖动时连线实时跟随；缩放/平移时连线与组块同步。
- 锚点、手柄、网格仅在编辑时出现，导出与「干净查看」时隐藏。
- 增删均有撤销（复用现有 toast 撤销）。
- 默认进入流程图；切换到步骤图保持其原有体验不变。

## 7. 验证计划

项目无测试框架，采用浏览器实地走查（用预览工具）：

1. 打开默认进入流程图；切换到步骤图、再切回，内容均保留。
2. 拖动组块，绑定连线实时跟随；缩放/平移正常。
3. 新建绑定连线（拖锚点）与自由线段；改方向/箭头类型/线型/路由/粗细/颜色/长度均生效。
4. 线上文字增、删、改色。
5. 增删组块与块内条目；改三种颜色。
6. 自动保存：刷新后流程图结构、连线、颜色保留。
7. 导出 PNG/PDF 含连线且无编辑装饰；JSON 导出再导入一致；分享链接可还原。
8. 步骤图全部原有功能不受影响。

## 8. 已确认的默认项

- 定位模式：自由画布（用户选定）。
- 连线绑定：绑定组块 + 自由线段均支持（用户选定）。
- 图标库 Lucide；盒内英文逐字、UI 中文；「Sana…」占位保留；决策点分财务核查/批准/拒绝三路。
- 侧栏按需新建基础设施；其余复用现有。
