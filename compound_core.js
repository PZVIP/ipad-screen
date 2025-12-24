// ==========================================
// ☁️ 云端核心：BTC vs Gold 最终愿景版 (v3.5)
// UI更新：进度条居中，增加 0% 和 100% 刻度
// ==========================================

module.exports.createWidget = async () => {
  const widget = new ListWidget();

  // --- 1. 数据准备 ---
  const GOLD_SUPPLY_OZ = 6720000000; 
  const BTC_SUPPLY = 19800000;

  const prices = await getBinancePrices();
  const btcPrice = prices.btc;   
  const goldPriceOz = prices.gold; 

  const btcMarketCap = btcPrice * BTC_SUPPLY;
  const goldMarketCap = goldPriceOz * GOLD_SUPPLY_OZ;
  
  const progressPercent = (btcMarketCap / goldMarketCap); 
  const upsideMultiplier = (goldMarketCap / btcMarketCap) - 1;
  const targetPrice = goldMarketCap / BTC_SUPPLY;

  // 昼夜判断
  const date = new Date();
  const hour = date.getHours();
  const isDayTime = hour >= 7 && hour < 23;
  
  // --- 2. UI 风格绘制 ---
  let gradient = new LinearGradient();
  gradient.colors = [new Color("#1E2026"), new Color("#0B0E11")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  
  widget.setPadding(16, 16, 16, 16);

  // ===========================================
  // Top：价格信息
  // ===========================================
  let headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  
  // 左侧：当前
  let leftStack = headerStack.addStack();
  leftStack.layoutVertically();
  let titleLeft = leftStack.addText("CURRENT PRICE");
  titleLeft.font = Font.systemFont(9);
  titleLeft.textColor = new Color("#848E9C"); 
  let priceLeft = leftStack.addText("$" + formatNumber(btcPrice));
  priceLeft.font = Font.heavySystemFont(22);
  priceLeft.textColor = new Color("#0ECB81"); 
  
  headerStack.addSpacer();
  
  // 右侧：目标
  let rightStack = headerStack.addStack();
  rightStack.layoutVertically();
  let titleRight = rightStack.addText("TARGET PRICE");
  titleRight.font = Font.systemFont(9);
  titleRight.textColor = new Color("#848E9C");
  let priceRight = rightStack.addText("$" + formatK(targetPrice));
  priceRight.font = Font.heavySystemFont(22);
  priceRight.textColor = new Color("#F0B90B"); 

  widget.addSpacer(10);


  // ===========================================
  // Middle：进度条区域 (重构布局)
  // ===========================================
  
  // 1. 进度文字
  let percentLabelStack = widget.addStack();
  percentLabelStack.centerAlignContent();
  percentLabelStack.addSpacer();
  
  let pctStr = (progressPercent * 100).toFixed(2) + "%";
  let multiplierStr = upsideMultiplier.toFixed(2);
  let infoText = `进度：${pctStr}，还需涨 ${multiplierStr} 倍`;
  
  let pText = percentLabelStack.addText(infoText);
  pText.font = Font.boldSystemFont(11);
  pText.textColor = new Color("#F0B90B"); 
  
  percentLabelStack.addSpacer();

  widget.addSpacer(5);

  // 2. 进度条容器 [0% -- BAR -- 100%]
  let barRowStack = widget.addStack();
  barRowStack.layoutHorizontally();
  barRowStack.centerAlignContent(); // 垂直居中对齐
  
  // 增加弹性Spacer，确保整体居中
  barRowStack.addSpacer(); 

  // 左刻度: 0%
  let startLabel = barRowStack.addText("0%");
  startLabel.font = Font.systemFont(10);
  startLabel.textColor = new Color("#555555");
  
  barRowStack.addSpacer(8);

  // 进度条图片
  let barImage = drawProgressBarWithIcon(progressPercent, isDayTime);
  let img = barRowStack.addImage(barImage);
  // 设定固定尺寸，给左右文字留空间
  // Medium 组件总宽约 330，减去padding(32)和文字空间，给图片约 230
  img.imageSize = new Size(230, 24); 
  img.cornerRadius = 0;

  barRowStack.addSpacer(8);

  // 右刻度: 100%
  let endLabel = barRowStack.addText("100%");
  endLabel.font = Font.systemFont(10);
  endLabel.textColor = new Color("#555555");

  barRowStack.addSpacer(); // 右侧弹性Spacer

  widget.addSpacer(15);


  // ===========================================
  // Bottom：市值对比
  // ===========================================
  let statsStack = widget.addStack();
  statsStack.layoutHorizontally();
  statsStack.centerAlignContent();

  addStatColumn(statsStack, "BTC MARKET CAP", "$" + formatTrillion(btcMarketCap), Color.white());
  statsStack.addSpacer();
  
  // 连接符
  let midStack = statsStack.addStack();
  let midText = midStack.addText("比特币 = 黄金");
  midText.font = Font.boldSystemFont(11); 
  midText.textColor = new Color("#00cc7b"); 
  statsStack.addSpacer();
  
  addStatColumn(statsStack, "GOLD MARKET CAP", "$" + formatTrillion(goldMarketCap), new Color("#FFD700"));

  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 15);
  
  return widget;
};

// =======================
// 🛠 辅助函数库
// =======================

function drawProgressBarWithIcon(pct, isDayTime) {
  // 画布设大一点，保证缩放后高清
  const width = 600; 
  const height = 60; // 高度增加，容纳更大的图标
  const barHeight = 16; // 轨道画粗一点，缩放后才看得清
  
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  
  // 计算垂直偏移，让进度条靠下
  const yBarOffset = height - barHeight - 5; 
  
  // 1. 底槽
  let trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, yBarOffset, width, barHeight), barHeight/2, barHeight/2);
  ctx.addPath(trackPath);
  ctx.setFillColor(new Color("#363A45")); 
  ctx.fillPath();
  
  // 2. 进度
  let safePct = pct > 1 ? 1 : pct;
  let barWidth = Math.max(width * safePct, barHeight + 20);
  
  let barPath = new Path();
  barPath.addRoundedRect(new Rect(0, yBarOffset, barWidth, barHeight), barHeight/2, barHeight/2);
  ctx.addPath(barPath);
  ctx.setFillColor(new Color("#FFD700")); 
  ctx.fillPath();
  
  // 3. 图标 (火箭/床)
  const emoji = isDayTime ? "🚀" : "🛌";
  const emojiSize = 48; // 字体设大，因为我们在230宽的区域显示600宽的图
  
  ctx.setFont(Font.systemFont(emojiSize));
  
  // 图标位置计算
  let iconX = barWidth - (emojiSize / 1.3); 
  // 防止图标跑出左边界
  if(iconX < 0) iconX = 0;
  // 防止图标跑出右边界
  if(iconX > width - emojiSize) iconX = width - emojiSize;

  let iconY = yBarOffset - emojiSize + 10; 
  
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
