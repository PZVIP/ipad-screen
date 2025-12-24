// ==========================================
// ☁️ 云端核心：BTC vs Gold 翻转进度条
// ==========================================

module.exports.createWidget = async () => {
  const widget = new ListWidget();

  // --- 1. 配置与数据源 ---
  // 黄金总市值 (单位：万亿美元)
  // 注：黄金市值波动极小，免费API很难获取实时总市值，这里设定为最新估值 17.5T
  // 你可以随时在云端修改这个数字
  const GOLD_MARKET_CAP_TRILLION = 17.5; 
  const GOLD_CAP_VALUE = GOLD_MARKET_CAP_TRILLION * 1000000000000;

  // 获取 BTC 详细数据 (价格、市值、流通量)
  const data = await getBTCData();
  
  // 核心计算
  const currentPrice = data.price;
  const btcMarketCap = data.market_cap;
  const circulatingSupply = data.circulating_supply; // 实时流通量
  
  // 进度百分比
  const progressPercent = (btcMarketCap / GOLD_CAP_VALUE); 
  // 目标价格 = 黄金总市值 / 比特币当前流通量
  const targetPrice = GOLD_CAP_VALUE / circulatingSupply;


  // --- 2. UI 风格设置 ---
  // 背景：深空黑灰渐变，衬托橙色
  let gradient = new LinearGradient();
  gradient.colors = [new Color("#141414"), new Color("#1E1E1E")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  
  widget.setPadding(16, 16, 16, 16);


  // --- 3. 顶部：当前价格 ---
  let headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();
  
  // 左侧：Logo 和 标题
  let titleStack = headerStack.addStack();
  titleStack.layoutVertically();
  let title = titleStack.addText("BITCOIN PRICE");
  title.font = Font.systemFont(10);
  title.textColor = new Color("#888888");
  
  let priceText = titleStack.addText("$" + formatNumber(currentPrice));
  priceText.font = Font.heavySystemFont(22);
  priceText.textColor = Color.white();
  
  headerStack.addSpacer();
  
  // 右侧：进度百分比大字
  let percentStack = headerStack.addStack();
  let percentText = percentStack.addText((progressPercent * 100).toFixed(2) + "%");
  percentText.font = Font.boldSystemFont(16);
  percentText.textColor = new Color("#F7931A"); // BTC Orange

  widget.addSpacer(12);


  // --- 4. 中部：可视化进度条 ---
  // 绘制背景槽
  let barStack = widget.addStack();
  barStack.size = new Size(0, 8); // 高度8
  barStack.backgroundColor = new Color("#333333");
  barStack.cornerRadius = 4;
  barStack.layoutHorizontally();
  
  // 绘制进度 (为了防止进度太小看不见，设置最小宽度)
  // 在 Stack 里嵌套 Stack 来模拟进度条
  let progressWidthPct = progressPercent > 1 ? 1 : progressPercent; //以此限制最大100%
  // 注意：Scriptable 的 Stack 宽度较难按百分比精确控制，
  // 这里使用 spacer 挤压法或 DrawContext，为了兼容性使用 Spacer 挤压法
  
  let activeBar = barStack.addStack();
  activeBar.backgroundColor = new Color("#F7931A");
  activeBar.cornerRadius = 4;
  // 这里利用 flex 权重模拟百分比: (进度) vs (1-进度)
  // 但 Scriptable weight 必须是整数，所以乘 1000
  let w1 = Math.max(1, Math.floor(progressPercent * 1000));
  let w2 = 1000 - w1;
  
  // 这是一个特殊的技巧，让 activeBar 占据 w1 的比例
  // 由于 WidgetStack 布局限制，我们用一种视觉欺骗：
  // 这种简单进度条在 listWidget 里很难完美，
  // 建议直接画一条带颜色的线，上面已经画了。
  // 为了让它有长度，我们给 activeBar 设置宽度？不行，Widget 不支持百分比宽。
  // 解决方案：使用 DrawContext 绘制成图片作为背景 (最高级做法)
  let barImage = drawProgressBar(progressPercent);
  // 替换掉上面的 barStack，直接放图片
  let imgStack = widget.addStack();
  let img = imgStack.addImage(barImage);
  img.imageSize = new Size(300, 10); // 这里的宽度只是参考，它会自适应
  img.cornerRadius = 5;

  widget.addSpacer(15);


  // --- 5. 底部：数据三列布局 ---
  let statsStack = widget.addStack();
  statsStack.layoutHorizontally();

  // 列 1: BTC 市值
  addStatColumn(statsStack, "BTC市值", "$" + formatTrillion(btcMarketCap), Color.white());
  
  statsStack.addSpacer();
  
  // 列 2: 黄金市值
  addStatColumn(statsStack, "黄金市值", "$" + GOLD_MARKET_CAP_TRILLION + "T", new Color("#FFD700"));
  
  statsStack.addSpacer();
  
  // 列 3: 目标单价
  addStatColumn(statsStack, "目标单价", "$" + formatK(targetPrice), new Color("#F7931A"));

  // --- 6. 刷新逻辑 ---
  // 每 2 小时刷新一次
  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 120);
  
  return widget;
};

// =======================
// 🛠 辅助函数库
// =======================

// 绘制进度条图片 (UI 核心)
function drawProgressBar(pct) {
  const width = 600; // 画布宽度
  const height = 20; // 画布高度
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  
  // 1. 画底槽 (灰色)
  let trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, 0, width, height), height/2, height/2);
  ctx.addPath(trackPath);
  ctx.setFillColor(new Color("#333333"));
  ctx.fillPath();
  
  // 2. 画进度 (橙色)
  let barWidth = width * pct;
  if (barWidth < height) barWidth = height; // 至少画个圆点
  if (barWidth > width) barWidth = width;
  
  let barPath = new Path();
  barPath.addRoundedRect(new Rect(0, 0, barWidth, height), height/2, height/2);
  ctx.addPath(barPath);
  ctx.setFillColor(new Color("#F7931A"));
  ctx.fillPath();
  
  return ctx.getImage();
}

// 添加底部数据列
function addStatColumn(stack, titleText, valueText, color) {
  let col = stack.addStack();
  col.layoutVertically();
  
  let t = col.addText(titleText);
  t.font = Font.systemFont(8);
  t.textColor = new Color("#888888");
  
  let v = col.addText(valueText);
  v.font = Font.boldSystemFont(11);
  v.textColor = color;
}

// 格式化数字 12345 -> 12,345
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 格式化万亿 1750000000 -> 1.75T
function formatTrillion(num) {
  return (num / 1000000000000).toFixed(2) + "T";
}

// 格式化千位 880000 -> 880k (为了省空间)
function formatK(num) {
  return (num / 1000).toFixed(0) + "k";
}

// 获取 BTC 完整数据
async function getBTCData() {
  const url = "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false";
  try {
    let req = new Request(url);
    let json = await req.loadJSON();
    return {
      price: json.market_data.current_price.usd,
      market_cap: json.market_data.market_cap.usd,
      circulating_supply: json.market_data.circulating_supply
    };
  } catch (e) {
    // 离线兜底数据，防止报错
    return { price: 98000, market_cap: 1950000000000, circulating_supply: 19800000 };
  }
}
