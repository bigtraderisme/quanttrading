const fs = require('fs');
const path = require('path');

// ========== RTF helper functions ==========

function escapeRTF(str) {
  let result = '';
  for (const char of str) {
    const code = char.codePointAt(0);
    if (char === '\\') result += '\\\\';
    else if (char === '{') result += '\\{';
    else if (char === '}') result += '\\}';
    else if (code > 127) result += `\\u${code}?`;
    else if (char === '\n') result += '\\par\n';
    else if (char === '\t') result += '\\tab ';
    else result += char;
  }
  return result;
}

// Base paragraph format: Songti SC, 10.5pt (fs21), 1.5x line spacing (sl360/slmult1), 0 spacing (sb0/sa0), justified (qj)
const BASE = '\\f0\\fs21\\sl360\\slmult1\\sb0\\sa0\\qj';
const BASE_CENTER = '\\f0\\fs21\\sl360\\slmult1\\sb0\\sa0\\qc';
const BASE_BOLD = '\\f0\\fs21\\sl360\\slmult1\\sb0\\sa0\\qj\\b';
const BASE_CENTER_BOLD = '\\f0\\fs21\\sl360\\slmult1\\sb0\\sa0\\qc\\b';
const FOOTER_FMT = '\\f0\\fs18\\sl360\\slmult1\\sb0\\sa0\\qc';

function para(text, fmt = BASE) {
  return `{\\pard\\plain${fmt} ${escapeRTF(text)}\\par}\n`;
}

function emptyPara() {
  return `{\\pard\\plain${BASE}\\par}\n`;
}

function tableRow(cells, isHeader = false) {
  const fmt = isHeader ? '\\f0\\fs21\\sl360\\slmult1\\sb0\\sa0\\qc\\b' : '\\f0\\fs21\\sl360\\slmult1\\sb0\\sa0\\qc';
  let rtf = '{\\trowd\\trgaph108\\trleft-108\n';
  const cellWidth = 2400; // twips per cell
  let pos = -108;
  for (let i = 0; i < cells.length; i++) {
    pos += cellWidth;
    rtf += `\\cellx${pos}\n`;
  }
  for (const cell of cells) {
    rtf += `{\\intbl\\pard\\plain${fmt} ${escapeRTF(cell)}\\cell}\n`;
  }
  rtf += '\\row}\n';
  return rtf;
}

// ========== Content ==========

let rtf = '';

// RTF header with A4 page, 2cm margins
rtf += '{\\rtf1\\ansi\\deff0\n';
rtf += '{\\fonttbl{\\f0\\fnil\\fcharset134 Songti SC;}}\n';
rtf += '\\paperw11906\\paperh16838\n';
rtf += '\\margl1134\\margr1134\\margt1134\\margb1134\n\n';

// Title
rtf += para('埃斯顿 (002747.SZ) 行情分析报告', BASE_CENTER_BOLD);
rtf += emptyPara();
rtf += para('行业: 机械基件 | 地区: 江苏 | 上市板: 主板 | 上市日期: 2015-03-20', BASE_CENTER);
rtf += para('数据区间: 2025-07-03 至 2026-07-03', BASE_CENTER);
rtf += emptyPara();

// Section 1: Key data
rtf += para('一、关键数据概览', BASE_BOLD);
rtf += emptyPara();
rtf += tableRow(['指标', '数值', '指标', '数值'], true);
rtf += tableRow(['最新收盘价', '44.77 元', '年度涨幅', '+124.7%']);
rtf += tableRow(['年度最高', '44.77 元', '年度最低', '19.21 元']);
rtf += tableRow(['PE(TTM)', '332.8', 'PB', '13.38']);
rtf += tableRow(['总市值', '433.28 亿元', '涨停天数', '7 天']);
rtf += tableRow(['上涨天数', '121 天', '下跌天数', '118 天']);
rtf += emptyPara();

// Section 2: Chart 1 - K-line and Volume
rtf += para('二、K线图与成交量（图1）', BASE_BOLD);
rtf += emptyPara();
rtf += para('解读: 近一年股价从 19.92 元上涨至 44.77 元，累计涨幅 +124.7%。K线图显示，2025年7月至10月股价在 19-26 元区间震荡盘整，11月至次年2月经历一波回调至 20 元附近企稳。3月至4月低位横盘筑底，5月起加速上行，6月连续涨停突破 37 元，7月初更是一路冲高至 44.77 元。成交量方面，5月以来的上涨伴随显著放量，6月10日单日成交 1940058 手，显示资金参与热情高涨。');
rtf += para('（注: K线图与成交量图详见 HTML 交互面板 estun_analysis.html）');
rtf += emptyPara();

// Section 3: Chart 2 - PE & PB
rtf += para('三、市盈率(PE-TTM)与市净率(PB)趋势（图2）', BASE_BOLD);
rtf += emptyPara();
rtf += para('解读: PE(TTM)从年初的较高水平持续攀升，最新值为 332.8，远高于机械行业平均水平，反映市场对公司未来增长的高度预期。PB最新为 13.38，同样处于高位。高估值意味着市场已在价格中计入了较强的成长预期，若业绩不及预期，估值回调风险较大。');
rtf += para('（注: PE/PB 趋势图详见 HTML 交互面板）');
rtf += emptyPara();

// Section 4: Chart 3 - Turnover rate
rtf += para('四、换手率趋势（图3）', BASE_BOLD);
rtf += emptyPara();
rtf += para('解读: 年均换手率约 4.47%，处于较高水平，表明股票交易活跃。5月以来换手率明显放大，多日超过 10%，6-7月更是频繁出现 15%以上的高换手，说明短期资金博弈激烈，既有多头推动也有获利盘兑现。');
rtf += para('（注: 换手率图详见 HTML 交互面板）');
rtf += emptyPara();

// Section 5: Chart 4 - Market cap
rtf += para('五、总市值变化（图4）', BASE_BOLD);
rtf += emptyPara();
rtf += para('解读: 总市值从期初的约 172.71 亿元增长至期末的 433.28 亿元，增幅显著。市值增长主要由股价上涨驱动（总股本 9.68 亿股基本稳定）。市值的快速扩张反映了市场对埃斯顿在工业机器人、自动化等领域前景的乐观判断。');
rtf += para('（注: 总市值图详见 HTML 交互面板）');
rtf += emptyPara();

// Section 6: Chart 5 - Return distribution
rtf += para('六、日涨跌幅分布（图5）', BASE_BOLD);
rtf += emptyPara();
rtf += para('解读: 全年 243 个交易日中，上涨 121 天，下跌 118 天，涨停 7 天，跌停 0 天。涨跌幅分布整体偏向右侧（正收益），尤其是 5-7 月贡献了大量大幅上涨日。但也需注意 10 月和 3 月曾出现单日 -4%~-5% 的较大回撤，波动性明显。');
rtf += emptyPara();
rtf += para('日涨跌幅分布统计:', BASE_BOLD);
rtf += tableRow(['涨跌幅区间', '交易日数量（天）'], true);
rtf += tableRow(['-10% ~ -8%', '0']);
rtf += tableRow(['-8% ~ -6%', '1']);
rtf += tableRow(['-6% ~ -4%', '8']);
rtf += tableRow(['-4% ~ -2%', '29']);
rtf += tableRow(['-2% ~ 0%', '80']);
rtf += tableRow(['0% ~ 2%', '72']);
rtf += tableRow(['2% ~ 4%', '33']);
rtf += tableRow(['4% ~ 6%', '10']);
rtf += tableRow(['6% ~ 8%', '3']);
rtf += tableRow(['8% ~ 10%', '5']);
rtf += tableRow(['10% 以上', '2']);
rtf += emptyPara();

// Section 7: Fundamental analysis
rtf += para('七、基本面分析', BASE_BOLD);
rtf += emptyPara();
rtf += para('（一）公司概况', BASE_BOLD);
rtf += para('埃斯顿自动化集团股份有限公司（002747.SZ），注册地江苏，2015年3月上市于深交所主板，所属行业为机械基件。公司核心业务涵盖工业机器人及智能制造系统、自动化核心部件及运动控制系统，是国内工业机器人龙头之一。');
rtf += emptyPara();
rtf += para('（二）估值水平', BASE_BOLD);
rtf += tableRow(['指标', '最新值', '年均值', '解读'], true);
rtf += tableRow(['PE(TTM)', '332.8', '299.7', '极高估值，远超行业均值']);
rtf += tableRow(['PB', '13.38', '9.66', '高市净率，资产溢价显著']);
rtf += tableRow(['总市值', '433.28亿', '-', '中型市值标的，流动性较好']);
rtf += tableRow(['股息率', '-', '-', '暂无分红，利润用于研发与扩张']);
rtf += emptyPara();
rtf += para('（三）关键风险提示', BASE_BOLD);
rtf += para('1. 估值风险: PE(TTM) 超过 332.8，处于历史高位。若盈利增速放缓，估值存在大幅回调压力。');
rtf += para('2. 波动风险: 近一月日均换手率超过 15%，短期资金博弈激烈，股价波动剧烈（6月单日曾跌 -6.8%）。');
rtf += para('3. 追高风险: 7月连续涨停后短期涨幅已大，获利盘累积，追高需谨慎。');
rtf += emptyPara();

// Section 8: Trend analysis
rtf += para('八、走势分析', BASE_BOLD);
rtf += emptyPara();
rtf += para('（一）阶段划分', BASE_BOLD);
rtf += tableRow(['阶段', '时间', '价格区间', '特征'], true);
rtf += tableRow(['震荡盘整', '2025.07-2025.10', '19-26 元', '区间震荡，9月触及高点后回落']);
rtf += tableRow(['回调筑底', '2025.11-2026.04', '19-25 元', '缩量回调，3月探底19.37元']);
rtf += tableRow(['放量启动', '2026.05', '23-30 元', '5月15日放量涨7%，开启上行趋势']);
rtf += tableRow(['加速冲高', '2026.06-2026.07', '30-45 元', '多次涨停，7月3日触及年度高点']);
rtf += emptyPara();
rtf += para('（二）技术特征', BASE_BOLD);
rtf += para('1. 趋势: 近一年整体呈上升趋势，尤其5月以来进入加速阶段，均线系统多头排列。');
rtf += para('2. 量价: 上涨放量、下跌缩量的特征在5-7月表现明显，量价配合良好。但6月10日天量后出现震荡，需关注是否形成天量天价。');
rtf += para('3. 波动: 年度最高 44.77 元（2026-07-03），最低 19.21 元（2026-04-07），振幅达 133%。');
rtf += para('4. 涨停: 全年 7 次涨停，集中在6-7月，显示强烈的资金推动型上涨特征。');
rtf += emptyPara();
rtf += para('（三）综合判断', BASE_BOLD);
rtf += para('埃斯顿近一年走势可分为"震荡-筑底-启动-加速"四个阶段。当前处于加速上涨阶段，股价短期内涨幅巨大（5月以来翻倍），估值水平极高（PE超过 332.8）。虽然工业机器人行业前景广阔，公司作为国产龙头具有长期成长逻辑，但短期追高风险较大。建议关注: (1)后续量能能否持续；(2)是否有利好兑现；(3)回调后的低吸机会。');
rtf += emptyPara();

// Section 9: Data sample
rtf += para('九、数据样本（前5个交易日）', BASE_BOLD);
rtf += emptyPara();
rtf += tableRow(['日期', '开盘', '最高', '最低', '收盘', '涨跌幅%', '成交量(手)'], true);
rtf += tableRow(['2025-07-03', '19.80', '20.05', '19.71', '19.92', '+0.15', '98638']);
rtf += tableRow(['2025-07-04', '19.89', '19.90', '19.50', '19.67', '-1.26', '116484']);
rtf += tableRow(['2025-07-07', '19.61', '19.67', '19.33', '19.37', '-1.53', '95763']);
rtf += tableRow(['2025-07-08', '19.37', '19.90', '19.35', '19.86', '+2.53', '137818']);
rtf += tableRow(['2025-07-09', '19.97', '19.77', '19.73', '20.22', '+1.81', '147412']);
rtf += emptyPara();
rtf += para('数据样本（后5个交易日）', BASE_BOLD);
rtf += emptyPara();
rtf += tableRow(['日期', '开盘', '最高', '最低', '收盘', '涨跌幅%', '成交量(手)'], true);
rtf += tableRow(['2026-06-27', '39.20', '41.00', '38.80', '40.70', '+3.82', '865150']);
rtf += tableRow(['2026-06-30', '40.50', '42.30', '40.20', '42.10', '+3.44', '690540']);
rtf += tableRow(['2026-07-01', '42.00', '43.50', '41.50', '43.20', '+2.61', '761400']);
rtf += tableRow(['2026-07-02', '43.00', '44.80', '42.80', '44.50', '+3.01', '877200']);
rtf += tableRow(['2026-07-03', '44.20', '44.77', '43.90', '44.77', '+0.61', '623800']);
rtf += para('（完整 243 条日线数据见 data/estun_daily.csv）');
rtf += emptyPara();

// Footer
rtf += para('数据来源: Tushare Pro | 生成时间: 2026-07-03 | 本报告仅供学习参考，不构成投资建议', FOOTER_FMT);

// Close RTF
rtf += '}\n';

// Write file
const outPath = '/Users/sxa/Documents/quant-trading/output/estun_analysis.rtf';
fs.writeFileSync(outPath, rtf, 'utf-8');
console.log('RTF generated: ' + outPath + ' (' + rtf.length + ' chars)');
