# Task2: 埃斯顿技术指标计算 — 规格说明书

## 一、项目概述

### 1.1 目标

使用埃斯顿（002747.SZ）的日线数据，计算四个技术指标（RSI、MACD、布林带、VWAP），以 Jupyter Notebook 形式展现完整的计算过程、中间步骤和可视化结果。

### 1.2 设计原则

- **过程可见**：每个指标的计算步骤分步展示，不做黑箱调用（不直接用 talib 一行出结果）
- **手写公式**：用 pandas/numpy 从公式逐步实现，让计算逻辑透明可审计
- **中文注释**：每个 cell 用 Markdown 说明该步骤在做什么、为什么这样做
- **可视化**：每个指标计算完成后立即绘图，直观展示结果

---

## 二、数据源

### 2.1 文件

- 路径：`data/estun_daily.csv`
- 标的：埃斯顿 002747.SZ
- 时间范围：2025-07-03 ~ 2026-07-03，共 242 个交易日
- 已验证：无除权除息事件（adj_factor 恒为 6.213），数据无需复权

### 2.2 字段说明

| 字段 | 含义 | 单位 | 本任务是否使用 |
|------|------|------|--------------|
| trade_date | 交易日期 | YYYYMMDD | 是（索引） |
| open | 开盘价 | 元 | 是（VWAP参考） |
| high | 最高价 | 元 | 是（VWAP典型价格） |
| low | 最低价 | 元 | 是（VWAP典型价格） |
| close | 收盘价 | 元 | 是（核心计算字段） |
| pre_close | 前收盘价 | 元 | 否 |
| pct_chg | 涨跌幅 | % | 否 |
| vol | 成交量 | 手 | 是（VWAP权重） |
| amount | 成交额 | 千元 | 否 |
| pe_ttm | 市盈率TTM | - | 否 |
| pb | 市净率 | - | 否 |
| turnover_rate | 换手率 | % | 否 |
| total_mv | 总市值 | 万元 | 否 |
| circ_mv | 流通市值 | 万元 | 否 |

### 2.3 已知数据质量问题

- `pe_ttm` 字段前 179 天缺失（73.66%），本任务不使用该字段，无影响
- 其他字段完整无缺
- 跳空检查已完成：10 天跳空 >3%，最大 -5.98%（2025-10-13），均为正常波动，非除权

---

## 三、指标计算规格

### 3.1 RSI（相对强弱指标）

#### 参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 周期 N | 14 | 标准参数 |

#### 计算步骤

```
步骤1: 计算每日价格变化
       delta = close - close.shift(1)

步骤2: 分离上涨和下跌
       gain = delta.where(delta > 0, 0)    # 下跌日涨幅记0
       loss = (-delta).where(delta < 0, 0) # 上涨日跌幅记0

步骤3: 计算平均涨幅和平均跌幅（EMA平滑法，Wilder's method）
       avg_gain = gain 的 N 日 EMA（alpha = 1/N）
       avg_loss = loss 的 N 日 EMA（alpha = 1/N）

步骤4: 计算RS和RSI
       RS = avg_gain / avg_loss
       RSI = 100 - (100 / (1 + RS))

       特殊情况：avg_loss = 0 时，RSI = 100
```

#### 可视化

- RSI 折线图，叠加 70/30 参考线
- 标注超买区（>70）和超卖区（<30）的区间
- 用红色阴影标记 RSI 顶背离区域（价格新高但 RSI 未新高）

---

### 3.2 MACD（指数平滑异同移动平均线）

#### 参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 快线周期 | 12 | 短期EMA |
| 慢线周期 | 26 | 长期EMA |
| 信号线周期 | 9 | DIF的EMA |

#### 计算步骤

```
步骤1: 计算12日EMA和26日EMA
       ema_fast = close.ewm(span=12, adjust=False).mean()
       ema_slow = close.ewm(span=26, adjust=False).mean()

步骤2: 计算DIF（快线）
       DIF = ema_fast - ema_slow

步骤3: 计算DEA（信号线/慢线）
       DEA = DIF.ewm(span=9, adjust=False).mean()

步骤4: 计算MACD柱
       MACD_hist = (DIF - DEA) * 2

       注：A股习惯乘以2，美股原始公式不乘2
```

#### 可视化

- 上图：收盘价折线
- 下图：DIF 线 + DEA 线 + MACD 柱状图（红绿双色）
- 标注金叉（DIF上穿DEA）和死叉（DIF下穿DEA）的位置点

---

### 3.3 布林带（Bollinger Bands）

#### 参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 周期 N | 20 | 标准参数 |
| 标准差倍数 | 2 | 上下轨距离 |

#### 计算步骤

```
步骤1: 计算中轨（20日简单移动平均）
       middle = close.rolling(window=20).mean()

步骤2: 计算20日标准差
       std = close.rolling(window=20).std()

步骤3: 计算上下轨
       upper = middle + 2 * std
       lower = middle - 2 * std

步骤4: 计算带宽（可选，用于识别收口）
       bandwidth = (upper - lower) / middle

步骤5: 计算%B（可选，位置指标）
       percent_b = (close - lower) / (upper - lower)
```

#### 可视化

- 收盘价折线 + 上轨/中轨/下轨三条线
- 上下轨之间填充浅色区域
- 用辅助图标注带宽收窄的区间（变盘预警）

---

### 3.4 VWAP（成交量加权均价）

#### 参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 滚动窗口 N | 20 | 20日滚动VWAP |

#### 计算步骤

```
步骤1: 计算典型价格
       typical_price = (high + low + close) / 3

步骤2: 计算价×量
       tp_vol = typical_price * vol

步骤3: 计算滚动VWAP
       vwap = tp_vol.rolling(window=20).sum() / vol.rolling(window=20).sum()

步骤4: 计算偏离度
       deviation = (close - vwap) / vwap * 100
```

#### 可视化

- 收盘价折线 + VWAP 折线
- 偏离度柱状图（正偏红色、负偏绿色）
- 标注偏离度超过 ±3% 的异常区间

---

## 四、Notebook 结构设计

### 4.1 文件

- 路径：`task2/estun_indicators.ipynb`
- Kernel：Python 3

### 4.2 Cell 规划

| Cell # | 类型 | 内容 |
|--------|------|------|
| 1 | Markdown | # 标题：埃斯顿技术指标计算 |
| 2 | Markdown | ## 一、环境准备与数据加载 |
| 3 | Code | import pandas, numpy, matplotlib；设置中文字体、绘图风格 |
| 4 | Code | 读取 `data/estun_daily.csv`，转换日期索引，展示前5行 |
| 5 | Markdown | 数据概览说明（字段、时间范围、已知问题） |
| 6 | Markdown | --- |
| 7 | Markdown | ## 二、RSI 计算 |
| 8 | Markdown | ### 2.1 计算方法说明（公式 + 参数） |
| 9 | Code | 步骤1：计算 delta、gain、loss |
| 10 | Code | 步骤2：计算 avg_gain、avg_loss（Wilder EMA） |
| 11 | Code | 步骤3：计算 RS、RSI，展示前10行结果 |
| 12 | Code | 绘制 RSI 图表（含70/30参考线） |
| 13 | Markdown | ### 2.2 结果解读（超买超卖分析、背离检查） |
| 14 | Markdown | --- |
| 15 | Markdown | ## 三、MACD 计算 |
| 16 | Markdown | ### 3.1 计算方法说明（公式 + 参数） |
| 17 | Code | 步骤1：计算 EMA12、EMA26 |
| 18 | Code | 步骤2：计算 DIF、DEA |
| 19 | Code | 步骤3：计算 MACD 柱，展示前10行结果 |
| 20 | Code | 绘制 MACD 图表（DIF+DEA+柱状图+金叉死叉标注） |
| 21 | Markdown | ### 3.2 结果解读（金叉死叉统计、趋势分析） |
| 22 | Markdown | --- |
| 23 | Markdown | ## 四、布林带计算 |
| 24 | Markdown | ### 4.1 计算方法说明（公式 + 参数） |
| 25 | Code | 步骤1：计算中轨 MA(20) |
| 26 | Code | 步骤2：计算标准差、上下轨 |
| 27 | Code | 步骤3：计算带宽、%B，展示前10行结果 |
| 28 | Code | 绘制布林带图表（价格+三轨+填充+带宽副图） |
| 29 | Markdown | ### 4.2 结果解读（收口识别、超买超卖分析） |
| 30 | Markdown | --- |
| 31 | Markdown | ## 五、VWAP 计算 |
| 32 | Markdown | ### 5.1 计算方法说明（公式 + 参数） |
| 33 | Code | 步骤1：计算典型价格 |
| 34 | Code | 步骤2：计算滚动 VWAP |
| 35 | Code | 步骤3：计算偏离度，展示前10行结果 |
| 36 | Code | 绘制 VWAP 图表（价格+VWAP+偏离度柱状图） |
| 37 | Markdown | ### 5.2 结果解读（支撑阻力分析、偏离度评估） |
| 38 | Markdown | --- |
| 39 | Markdown | ## 六、综合分析 |
| 40 | Code | 四指标合并到一个 DataFrame，展示最后10行 |
| 41 | Code | 绘制综合图表：价格 + MACD + RSI + 布林带 + VWAP（多子图） |
| 42 | Markdown | ### 6.1 四指标综合解读 |
| 43 | Markdown | ### 6.2 信号交叉验证（多指标共振点） |
| 44 | Markdown | --- |
| 45 | Markdown | ## 七、结论与备注 |

### 4.3 综合图表布局

```
+------------------------------------------+
|           收盘价 + 布林带 + VWAP          |  主图（高度大）
+------------------------------------------+
|           MACD 柱 + DIF + DEA             |  副图1
+------------------------------------------+
|           RSI（含70/30线）                 |  副图2
+------------------------------------------+
|           VWAP 偏离度柱状图                |  副图3
+------------------------------------------+
```

四个子图共享 X 轴（日期），垂直排列，便于对照分析。

---

## 五、技术环境

### 5.1 Python 环境

- 使用 managed Python 环境：`/Users/sxa/.workbuddy/binaries/python/envs/default/`
- 已有包：pandas 3.0.3, numpy

### 5.2 需要确认的依赖

| 包 | 用途 | 是否已安装 | 备注 |
|----|------|-----------|------|
| pandas | 数据处理 | 已安装 (3.0.3) | - |
| numpy | 数值计算 | 已安装 | - |
| matplotlib | 绑图 | 待确认 | 如未安装需用户同意后安装 |
| jupyter / nbformat | 生成.ipynb | 待确认 | 如未安装需用户同意后安装 |

### 5.3 备选方案

如果环境中没有 jupyter/nbformat，可以用以下方式生成 notebook：
- 用 Python 标准库 json 手动构建 .ipynb 文件（.ipynb 本质是 JSON 格式）
- 零安装，但代码中不能包含执行结果（需要用户在 Jupyter 中运行后才会有输出）

### 5.4 绘图中文字体

matplotlib 默认不支持中文，需要设置：
```python
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS']  # macOS 自带中文字体
plt.rcParams['axes.unicode_minus'] = False
```

---

## 六、输出文件

| 文件 | 路径 | 说明 |
|------|------|------|
| Notebook | `task2/estun_indicators.ipynb` | 主交付物，含计算过程和图表 |
| Spec | `task2/spec.md` | 本文件 |

---

## 七、注意事项

1. **不复权处理**：已验证数据区间内无除权除息事件，直接使用原始价格
2. **EMA 初始值**：使用 `adjust=False` 参数（与 A 股常用软件一致），首日 EMA = 首日收盘价
3. **RSI 平滑方法**：使用 Wilder's method（alpha = 1/N），与通达信/同花顺一致
4. **MACD 柱乘2**：遵循 A 股惯例，原始公式不乘2
5. **NaN 处理**：前 N-1 天（N为周期）因数据不足会产生 NaN，属正常现象，绘图时自动截断
6. **成交量单位**：vol 字段单位为"手"，计算 VWAP 时不影响结果（加权比例不变）

---

## 八、执行计划

| 步骤 | 内容 | 预计操作 |
|------|------|---------|
| 1 | 确认环境依赖（matplotlib, nbformat） | 检查包是否可用 |
| 2 | 与用户确认是否安装缺失依赖 | 如需要，说明装什么、装在哪 |
| 3 | 编写 .ipynb 生成脚本 | 用 Python 脚本构建 notebook JSON |
| 4 | 生成 .ipynb 文件 | 执行脚本 |
| 5 | 在 notebook 中运行所有 cell | 生成计算结果和图表 |
| 6 | 检查输出 | 确认图表正确、中文无乱码 |
| 7 | 交付 | 展示 notebook 文件 |
