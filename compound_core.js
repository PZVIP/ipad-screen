// ==========================================
// ☁️ 云端核心：BTC vs Gold 昼夜小人版 (v3.0)
// 特性：动态昼夜小人 + 精准倍数计算
// ==========================================

module.exports.createWidget = async () => {
  const widget = new ListWidget();

  // --- 1. 数据准备 ---
  // 黄金总储量：约 67.2 亿盎司 (20.9万吨)
  const GOLD_SUPPLY_OZ = 6720000000; 
  // BTC 流通量：约 1980 万枚
  const BTC_SUPPLY = 19800000;

  // 获取实时价格 (Binance API)
  const prices = await getBinancePrices();
  const btcPrice = prices.btc;   
  const goldPriceOz = prices.gold; 

  // 核心计算
  const btcMarketCap = btcPrice * BTC_SUPPLY;
  const goldMarketCap = goldPriceOz * GOLD_SUPPLY_OZ;
  
  // 进度 (0.0571)
  const progressPercent = (btcMarketCap / goldMarketCap); 
  
  // 还可以涨多少倍 = (目标 / 当前) - 1
  // 例如：当前 1T，目标 10T，还可以涨 9 倍
  const upsideMultiplier = (goldMarketCap / btcMarketCap) - 1;
  
  // 目标单价
  const targetPrice = goldMarketCap / BTC_SUPPLY;


  // --- 2. 昼夜判断逻辑 ---
  const date = new Date();
  const hour = date.getHours();
  // 早上6点到晚上10点是白天，其他是睡觉时间
  const isDayTime = hour >= 6 && hour < 22;
  
  // 🏃 奔跑 / 🛌 躺平
  const iconEmoji = isDayTime ? "🏃" : "🛌";


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
  // 右对齐补丁 (用空字撑开)
  // titleRight.rightAlignText(); 
  
  let priceRight = rightStack.addText("$" + formatK(targetPrice));
  priceRight.font = Font.heavySystemFont(22);
  priceRight.textColor = new Color("#F0B90B"); 

  widget.addSpacer(12);


  // ===========================================
  // 中部：进度条 + 动态小人 (核心)
  // ===========================================
  
  // 1. 进度文字 (居中显示)
  let percentLabelStack = widget.addStack();
  percentLabelStack.centerAlignContent();
  percentLabelStack.addSpacer();
  
  // 格式化：当前进度：5.71%，还可以涨 20.35 倍
  let pctStr = (progressPercent * 100).toFixed(2) + "%";
  let multiplierStr = upsideMultiplier.toFixed(2);
  let infoText = `当前进度：${pctStr}，还可以涨 ${multiplierStr} 倍`;
  
  let pText = percentLabelStack.addText(infoText);
  pText.font = Font.boldSystemFont(12);
  pText.textColor = new Color("#F0B90B"); 
  
  percentLabelStack.addSpacer();

  widget.addSpacer(6);

  // 2. 绘制带小人的进度条图片
  let barImage = drawProgressBarWithIcon(progressPercent, iconEmoji);
  let imgStack = widget.addStack();
  let img = imgStack.addImage(barImage);
  img.imageSize = new Size(300, 24); // 高度给够，防止小人被切头
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

// 🎨 核心绘图函数：画进度条 + 画小人
function drawProgressBarWithIcon(pct, emoji) {
  const width = 600; 
  const height = 40; // 画布高度加大，容纳小人
  const barHeight = 12; // 进度条本身的厚度
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  
  // 计算进度条的垂直中心位置
  const yOffset = (height - barHeight) / 2 + 8; // 稍微靠下一点，给小人留头顶空间
  
  // 1. 画底槽 (灰色)
  let trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, yOffset, width, barHeight), barHeight/2, barHeight/2);
  ctx.addPath(trackPath);
  ctx.setFillColor(new Color("#2B3139"));
  ctx.fillPath();
  
  // 2. 画进度 (橙色)
  let safePct = pct > 1 ? 1 : pct;
  let barWidth = width * safePct;
  if (barWidth < barHeight) barWidth = barHeight; // 最小宽度
  
  let barPath = new Path();
  barPath.addRoundedRect(new Rect(0, yOffset, barWidth, barHeight), barHeight/2, barHeight/2);
  ctx.addPath(barPath);
  ctx.setFillColor(new Color("#F0B90B")); 
  ctx.fillPath();
  
  // 3. 画小人 (Emoji)
  // 计算小人的 x 坐标：就在进度条的最右端
  // 稍微往左修一点点，让小人看起来是站在进度条顶端
  let iconX = barWidth - 15; 
  if (iconX < 0) iconX = 0;
  if (iconX > width - 30) iconX = width - 30; // 防止出界
  
  // 小人的 y 坐标：在进度条上面
  let iconY = yOffset - 22; 
  
  ctx.setFont(Font.systemFont(24)); // Emoji 大小
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
