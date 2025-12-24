// ==========================================
// ☁️ 云端核心：BTC vs Gold 最终愿景版 (v3.4)
// UI优化：增强进度条对比度，清晰展示"已完成"vs"未完成"
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
  const upsideMultiplier = (goldMarketCap / btcMarketCap) - 1;
  const targetPrice = goldMarketCap / BTC_SUPPLY;


  // --- 2. 昼夜判断逻辑 ---
  const date = new Date();
  const hour = date.getHours();
  // 早上7点到晚上11点是白天
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
  // 中部：进度条 + 动态图标
  // ===========================================
  
  // 1. 进度文字
  let percentLabelStack = widget.addStack();
  percentLabelStack.centerAlignContent();
  percentLabelStack.addSpacer();
  
  let pctStr = (progressPercent * 100).toFixed(2) + "%";
  let multiplierStr = upsideMultiplier.toFixed(2);
  let infoText = `追平黄金当前进度：${pctStr}，距离目标还要涨 ${multiplierStr} 倍`;
  
  let pText = percentLabelStack.addText(infoText);
  pText.font = Font.boldSystemFont(11);
  pText.textColor = new Color("#F0B90B"); 
  
  percentLabelStack.addSpacer();

  widget.addSpacer(8);

  // 2. 绘制进度条
  let barImage = drawProgressBarWithIcon(progressPercent, isDayTime);
  let imgStack = widget.addStack();
  let img = imgStack.addImage(barImage);
  img.imageSize = new Size(300, 28); 
  img.cornerRadius = 0;

  widget.addSpacer(15);


  // ===========================================
  // 底部：市值对比
  // ===========================================
  let statsStack = widget.addStack();
  statsStack.layoutHorizontally();
  statsStack.centerAlignContent(); // 让内容垂直居中对齐

  // 列1: BTC 市值
  addStatColumn(statsStack, "BTC MARKET CAP", "$" + formatTrillion(btcMarketCap), Color.white());
  
  statsStack.addSpacer();
  
  // 中间：连接符
  let midStack = statsStack.addStack();
  let midText = midStack.addText("比特币 = 黄金");
  midText.font = Font.boldSystemFont(12); 
  midText.textColor = new Color("#00cc7b"); 
  
  statsStack.addSpacer();
  
  // 列2: 黄金市值
  addStatColumn(statsStack, "GOLD MARKET CAP", "$" + formatTrillion(goldMarketCap), new Color("#FFD700"), true);

  // 刷新逻辑
  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 15);
  
  return widget;
};

// =======================
// 🛠 辅助函数库
// =======================

function drawProgressBarWithIcon(pct, isDayTime) {
  const width = 600; 
  const height = 46; 
  const barHeight = 10; // 稍微加粗一点点，更清晰
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  
  const yBarOffset = height - barHeight - 2; 
  
  // 1. 底槽 (Unachieved part) - 颜色修改点
  let trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, yBarOffset, width, barHeight), barHeight/2, barHeight/2);
  ctx.addPath(trackPath);
  // 使用显眼但和谐的深灰蓝色，确保在黑色背景上清晰可见
  ctx.setFillColor(new Color("#363A45")); 
  ctx.fillPath();
  
  // 2. 进度 (Achieved part)
  let safePct = pct > 1 ? 1 : pct;
  let barWidth = Math.max(width * safePct, barHeight + 10);
  
  let barPath = new Path();
  barPath.addRoundedRect(new Rect(0, yBarOffset, barWidth, barHeight), barHeight/2, barHeight/2);
  ctx.addPath(barPath);
  ctx.setFillColor(new Color("#FFD700")); 
  ctx.fillPath();
  
  // 3. 图标
  const emoji = isDayTime ? "🚀" : "🛌";
  const emojiSize = 26; 
  
  ctx.setFont(Font.systemFont(emojiSize));
  let iconX = barWidth - (emojiSize / 1.2); 
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

function addStatColumn(stack, titleText, valueText, color, isRight) {
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
