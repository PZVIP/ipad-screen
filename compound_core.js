// ==========================================
// ☁️ 云端核心：BTC vs Gold 最终愿景版 (v3.6)
// UI更新：价格格式改为 "x.xx w" (保留3位有效数字)
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
  // Top：价格信息 (修改点：格式化)
  // ===========================================
  let headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  
  // 左侧：当前
  let leftStack = headerStack.addStack();
  leftStack.layoutVertically();
  let titleLeft = leftStack.addText("CURRENT PRICE");
  titleLeft.font = Font.systemFont(9);
  titleLeft.textColor = new Color("#848E9C"); 
  
  // 🔴 修改：使用 formatW
  let priceLeft = leftStack.addText("$" + formatW(btcPrice));
  priceLeft.font = Font.heavySystemFont(22);
  priceLeft.textColor = new Color("#0ECB81"); 
  
  headerStack.addSpacer();
  
  // 右侧：目标
  let rightStack = headerStack.addStack();
  rightStack.layoutVertically();
  let titleRight = rightStack.addText("TARGET PRICE");
  titleRight.font = Font.systemFont(9);
  titleRight.textColor = new Color("#848E9C");
  
  // 🔴 修改：使用 formatW
  let priceRight = rightStack.addText("$" + formatW(targetPrice));
  priceRight.font = Font.heavySystemFont(22);
  priceRight.textColor = new Color("#F0B90B"); 

  widget.addSpacer(10);


  // ===========================================
  // Middle：进度条区域 (保持居中布局)
  // ===========================================
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

  // 进度条容器
  let barRowStack = widget.addStack();
  barRowStack.layoutHorizontally();
  barRowStack.centerAlignContent();
  barRowStack.addSpacer(); 

  let startLabel = barRowStack.addText("0%");
  startLabel.font = Font.systemFont(10);
  startLabel.textColor = new Color("#555555");
  
  barRowStack.addSpacer(8);

  let barImage = drawProgressBarWithIcon(progressPercent, isDayTime);
  let img = barRowStack.addImage(barImage);
  img.imageSize = new Size(230, 24); 
  img.cornerRadius = 0;

  barRowStack.addSpacer(8);

  let endLabel = barRowStack.addText("100%");
  endLabel.font = Font.systemFont(10);
  endLabel.textColor = new Color("#555555");

  barRowStack.addSpacer(); 

  widget.addSpacer(15);


  // ===========================================
  // Bottom：市值对比
  // ===========================================
  let statsStack = widget.addStack();
  statsStack.layoutHorizontally();
  statsStack.centerAlignContent();

  addStatColumn(statsStack, "BTC MARKET CAP", "$" + formatTrillion(btcMarketCap), Color.white());
  statsStack.addSpacer();
  
  let midStack = statsStack.addStack();
  let midText = midStack.addText("比特币 = 黄金");
  midText.font = Font.boldSystemFont(11); 
  midText.textColor = new Color("#00cc7b"); 
  statsStack.addSpacer();
  
  addStatColumn(statsStack, "GOLD MARKET CAP", "$" + formatTrillion(goldMarketCap), new Color("#FFD700"), true);

  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 15);
  
  return widget;
};

// =======================
// 🛠 辅助函数库
// =======================

// 🔴 新增：以"万"为单位，保留3位有效数字
function formatW(num) {
  // 除以 10000 得到万
  let wan = num / 10000;
  // toPrecision(3) 是 JS 自带函数，专门处理有效数字
  // 例如: 8.712 -> 8.71, 88.56 -> 88.6, 153.4 -> 153
  // parseFloat 去掉末尾可能出现的无用0 (如 1.00 -> 1)
  return parseFloat(wan.toPrecision(3)) + "w";
}

function drawProgressBarWithIcon(pct, isDayTime) {
  const width = 600; 
  const height = 60; 
  const barHeight = 16; 
  
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  
  const yBarOffset = height - barHeight - 5; 
  
  let trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, yBarOffset, width, barHeight), barHeight/2, barHeight/2);
  ctx.addPath(trackPath);
  ctx.setFillColor(new Color("#363A45")); 
  ctx.fillPath();
  
  let safePct = pct > 1 ? 1 : pct;
  let barWidth = Math.max(width * safePct, barHeight + 20);
  
  let barPath = new Path();
  barPath.addRoundedRect(new Rect(0, yBarOffset, barWidth, barHeight), barHeight/2, barHeight/2);
  ctx.addPath(barPath);
  ctx.setFillColor(new Color("#FFD700")); 
  ctx.fillPath();
  
  const emoji = isDayTime ? "🚀" : "🛌";
  const emojiSize = 48; 
  
  ctx.setFont(Font.systemFont(emojiSize));
  
  let iconX = barWidth - (emojiSize / 1.3); 
  if(iconX < 0) iconX = 0;
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

function formatTrillion(num) { return (num / 1000000000000).toFixed(2) + "T"; }
