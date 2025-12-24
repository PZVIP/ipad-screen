// ==========================================
// ☁️ 云端核心：BTC vs Gold 昼夜火箭版 (v3.1)
// 修复：解决图标方向问题，白天火箭领航，晚上躺平
// UI升级：更具科技感的极细进度条
// ==========================================

module.exports.createWidget = async () => {
  const widget = new ListWidget();

  // --- 1. 数据准备 ---
  const GOLD_SUPPLY_OZ = 6720000000; 
  const BTC_SUPPLY = 19800000;

  // 获取实时价格
  const prices = await getBinancePrices();
  const btcPrice = prices.btc;   
  const goldPriceOz = prices.gold; 

  // 核心计算
  const btcMarketCap = btcPrice * BTC_SUPPLY;
  const goldMarketCap = goldPriceOz * GOLD_SUPPLY_OZ;
  
  // 进度
  const progressPercent = (btcMarketCap / goldMarketCap); 
  // 还可以涨倍数
  const upsideMultiplier = (goldMarketCap / btcMarketCap) - 1;
  // 目标单价
  const targetPrice = goldMarketCap / BTC_SUPPLY;


  // --- 2. 昼夜判断逻辑 ---
  const date = new Date();
  const hour = date.getHours();
  // 早上7点到晚上11点是白天 (调整了一下作息时间)
  const isDayTime = hour >= 7 && hour < 23;
  

  // --- 3. UI 风格绘制 ---
  let gradient = new LinearGradient();
  gradient.colors = [new Color("#1E2026"), new Color("#0B0E11")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  
  widget.setPadding(16, 16, 16, 16);

  // ===========================================
  // 顶部：首尾呼应价格
  // ===========================================
  let headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  
  // >> 左侧：当前
  let leftStack = headerStack.addStack();
  leftStack.layoutVertically();
  let titleLeft = leftStack.addText("CURRENT PRICE");
  titleLeft.font = Font.systemFont(9);
  titleLeft.textColor = new Color("#848E9C"); 
  let priceLeft = leftStack.addText("$" + formatNumber(btcPrice));
  priceLeft.font = Font.heavySystemFont(22);
  priceLeft.textColor = new Color("#0ECB81"); 
  
  headerStack.addSpacer();
  
  // >> 右侧：目标
  let rightStack = headerStack.addStack();
  rightStack.layoutVertically();
  let titleRight = rightStack.addText("TARGET PRICE");
  titleRight.font = Font.systemFont(9);
  titleRight.textColor = new Color("#848E9C");
  
  let priceRight = rightStack.addText("$" + formatK(targetPrice));
  priceRight.font = Font.heavySystemFont(22);
  priceRight.textColor = new Color("#F0B90B"); 

  widget.addSpacer(12);


  // ===========================================
  // 中部：进度条 + 动态图标 (核心修改点)
  // ===========================================
  
  // 1. 进度文字 (居中显示)
  let percentLabelStack = widget.addStack();
  percentLabelStack.centerAlignContent();
  percentLabelStack.addSpacer();
  
  let pctStr = (progressPercent * 100).toFixed(2) + "%";
  let multiplierStr = upsideMultiplier.toFixed(2);
  // 文案：当前进度：5.71%，还可以涨 20.35 倍
  let infoText = `当前进度：${pctStr}，还可以涨 ${multiplierStr} 倍`;
  
  let pText = percentLabelStack.addText(infoText);
  pText.font = Font.boldSystemFont(11); // 稍微调小字体以放下更多内容
  pText.textColor = new Color("#F0B90B"); 
  
  percentLabelStack.addSpacer();

  widget.addSpacer(8);

  // 2. 绘制带图标的进度条图片
  // 🔴 这里传入 isDayTime 布尔值，让绘图函数决定画什么
  let barImage = drawProgressBarWithIcon(progressPercent, isDayTime);
  let imgStack = widget.addStack();
  let img = imgStack.addImage(barImage);
  // 调整画布高度，让图标显示完整
  img.imageSize = new Size(300, 28); 
  img.cornerRadius = 0;

  widget.addSpacer(15);


  // ===========================================
  // 底部：市值对比
  // ===========================================
  let statsStack = widget.addStack();
  statsStack.layoutHorizontally();

  addStatColumn(statsStack, "BTC MARKET CAP", "$" + formatTrillion(btcMarketCap), Color.white());
  statsStack.addSpacer();
  addStatColumn(statsStack, "GOLD MARKET CAP", "$" + formatTrillion(goldMarketCap), new Color("#FFD700"));

  // 刷新逻辑
  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 15);
  
  return widget;
};

// =======================
// 🛠 辅助函数库
// =======================

// 🎨 核心绘图函数：画重新设计的进度条 + 昼夜图标
function drawProgressBarWithIcon(pct, isDayTime) {
  const width = 600; 
  const height = 46; // 画布高度
  const barHeight = 8; // 进度条变细，更精致
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  
  // 计算进度条的垂直Y坐标 (让它靠下，给上面留出图标位置)
  const yBarOffset = height - barHeight - 2; 
  
  // 1. 画底槽 (更深的太空黑)
  let trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, yBarOffset, width, barHeight), barHeight/2, barHeight/2);
  ctx.addPath(trackPath);
  ctx.setFillColor(new Color("#1A1A1A"));
  ctx.fillPath();
  
  // 2. 画进度 (亮金色火焰)
  let safePct = pct > 1 ? 1 : pct;
  // 限制最小宽度，防止进度太小时图标重叠
  let barWidth = Math.max(width * safePct, barHeight + 10);
  
  let barPath = new Path();
  barPath.addRoundedRect(new Rect(0, yBarOffset, barWidth, barHeight), barHeight/2, barHeight/2);
  ctx.addPath(barPath);
  ctx.setFillColor(new Color("#FFD700")); // 更亮的金色
  ctx.fillPath();
  
  // 3. 画图标 (昼夜切换)
  const emoji = isDayTime ? "🚀" : "🛌";
  const emojiSize = 26; // 图标大小
  
  ctx.setFont(Font.systemFont(emojiSize));
  
  // 计算图标位置：
  // X: 在进度条的最右端，稍微往左缩一点，让它看起来是“领头”的
  let iconX = barWidth - (emojiSize / 1.2); 
  // Y: 在进度条的上方
  let iconY = yBarOffset - emojiSize + 4; 
  
  ctx.drawText(emoji, new Point(iconX, iconY));
  
  return ctx.getImage();
}

async function getBinancePrices() {
  const btcUrl = "https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT";
  const goldUrl = "https://data-api.binance.vision/api/v3/ticker/price?symbol=PAXGUSDT";
  try {
    let req1 = new Request(btcUrl); req1.timeoutInterval = 10;
    let req2 = new Request(goldUrl); req2.timeoutInterval = 10;
    let [res1, res2] = await Promise.all([req1.loadJSON(), req2.loadJSON()]);
    return { btc: parseFloat(res1.price), gold: parseFloat(res2.price) };
  } catch (e) { return { btc: 98000, gold: 2600 }; }
}

function addStatColumn(stack, titleText, valueText, color) {
  let col = stack.addStack();
  col.layoutVertically();
  let t = col.addText(titleText);
  t.font = Font.systemFont(8);
  t.textColor = new Color("#848E9C");
  let v = col.addText(valueText);
  v.font = Font.boldSystemFont(11);
  v.textColor = color;
}

function formatNumber(num) { return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function formatTrillion(num) { return (num / 1000000000000).toFixed(2) + "T"; }
function formatK(num) { return (num / 1000).toFixed(0) + "k"; }
