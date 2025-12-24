// ==========================================
// ☁️ 云端核心：BTC vs Gold 翻转进度条 (最终修复版 v1.3)
// 修复：字体兼容性报错，确保所有 iOS 版本可用
// ==========================================

module.exports.createWidget = async () => {
  const widget = new ListWidget();

  // --- 1. 定义常量 ---
  // 黄金总储量：约 67.2 亿盎司 (20.9万吨)
  const GOLD_SUPPLY_OZ = 6720000000; 
  // BTC 流通量：约 1980 万枚
  const BTC_SUPPLY = 19800000;

  // --- 2. 获取实时价格 (Binance API) ---
  const prices = await getBinancePrices();
  
  const btcPrice = prices.btc;   
  const goldPriceOz = prices.gold; 

  // --- 3. 核心计算 ---
  const btcMarketCap = btcPrice * BTC_SUPPLY;
  const goldMarketCap = goldPriceOz * GOLD_SUPPLY_OZ;

  const progressPercent = (btcMarketCap / goldMarketCap); 
  const targetPrice = goldMarketCap / BTC_SUPPLY;


  // --- 4. UI 风格绘制 ---
  let gradient = new LinearGradient();
  gradient.colors = [new Color("#1E2026"), new Color("#0B0E11")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  
  widget.setPadding(16, 16, 16, 16);

  // >> Top: 标题与实时价格
  let headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();
  
  let titleStack = headerStack.addStack();
  titleStack.layoutVertically();
  
  let title = titleStack.addText("BTC PRICE");
  title.font = Font.systemFont(9);
  title.textColor = new Color("#848E9C"); 
  
  let priceText = titleStack.addText("$" + formatNumber(btcPrice));
  priceText.font = Font.heavySystemFont(22);
  priceText.textColor = new Color("#0ECB81"); 
  
  headerStack.addSpacer();
  
  // >> 右侧进度百分比
  let percentStack = headerStack.addStack();
  let percentText = percentStack.addText((progressPercent * 100).toFixed(2) + "%");
  
  // 🔴 修复：改用最通用的粗体系统字体，防止报错
  percentText.font = Font.boldSystemFont(16); 
  percentText.textColor = new Color("#F0B90B"); 

  widget.addSpacer(12);

  // >> Middle: 黄金进度条
  let barStack = widget.addStack();
  barStack.size = new Size(0, 8);
  barStack.backgroundColor = new Color("#2B3139");
  barStack.cornerRadius = 4;
  barStack.layoutHorizontally();
  
  let barImage = drawProgressBar(progressPercent);
  let imgStack = widget.addStack();
  let img = imgStack.addImage(barImage);
  img.imageSize = new Size(300, 10);
  img.cornerRadius = 5;

  widget.addSpacer(15);

  // >> Bottom: 三列核心数据
  let statsStack = widget.addStack();
  statsStack.layoutHorizontally();

  // 列1: BTC 市值
  addStatColumn(statsStack, "BTC市值", "$" + formatTrillion(btcMarketCap), Color.white());
  statsStack.addSpacer();
  
  // 列2: 黄金市值
  addStatColumn(statsStack, "黄金市值", "$" + formatTrillion(goldMarketCap), new Color("#FFD700"));
  statsStack.addSpacer();
  
  // 列3: 目标单价
  addStatColumn(statsStack, "目标单价", "$" + formatK(targetPrice), new Color("#F0B90B"));

  // --- 5. 刷新逻辑 ---
  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 15);
  
  return widget;
};

// =======================
// 🛠 辅助函数库
// =======================

async function getBinancePrices() {
  const btcUrl = "https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT";
  const goldUrl = "https://data-api.binance.vision/api/v3/ticker/price?symbol=PAXGUSDT";

  try {
    let req1 = new Request(btcUrl);
    let req2 = new Request(goldUrl);
    
    // 超时控制，防止卡死
    req1.timeoutInterval = 10;
    req2.timeoutInterval = 10;
    
    let [res1, res2] = await Promise.all([req1.loadJSON(), req2.loadJSON()]);

    return {
      btc: parseFloat(res1.price),
      gold: parseFloat(res2.price)
    };
  } catch (e) {
    // 兜底数据
    return { btc: 98000, gold: 2600 };
  }
}

function drawProgressBar(pct) {
  const width = 600;
  const height = 20;
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  
  // 轨道
  let trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, 0, width, height), height/2, height/2);
  ctx.addPath(trackPath);
  ctx.setFillColor(new Color("#2B3139"));
  ctx.fillPath();
  
  // 进度
  let safePct = pct > 1 ? 1 : pct;
  let barWidth = width * safePct;
  if (barWidth < height) barWidth = height;
  
  let barPath = new Path();
  barPath.addRoundedRect(new Rect(0, 0, barWidth, height), height/2, height/2);
  ctx.addPath(barPath);
  ctx.setFillColor(new Color("#F0B90B")); 
  ctx.fillPath();
  
  return ctx.getImage();
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

function formatNumber(num) {
  return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatTrillion(num) {
  return (num / 1000000000000).toFixed(2) + "T";
}

function formatK(num) {
  return (num / 1000).toFixed(0) + "k";
}
