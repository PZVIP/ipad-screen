// ==========================================
// ☁️ 云端核心：BTC vs Gold 翻转进度条 (修复版 v1.1)
// 修复：更换更稳定的 CoinCap API，增加防崩溃兜底
// ==========================================

module.exports.createWidget = async () => {
  const widget = new ListWidget();

  // --- 1. 配置与数据源 ---
  // 黄金总市值 (单位：万亿美元)
  const GOLD_MARKET_CAP_TRILLION = 17.5; 
  const GOLD_CAP_VALUE = GOLD_MARKET_CAP_TRILLION * 1000000000000;

  // 获取 BTC 详细数据 (价格、市值、流通量)
  // 这里加了 await 确保数据回来再继续
  const data = await getBTCData();
  
  // 核心计算
  const currentPrice = data.price;
  const btcMarketCap = data.market_cap;
  const circulatingSupply = data.circulating_supply; 
  
  // 进度百分比
  const progressPercent = (btcMarketCap / GOLD_CAP_VALUE); 
  // 目标价格
  const targetPrice = GOLD_CAP_VALUE / circulatingSupply;


  // --- 2. UI 风格设置 ---
  let gradient = new LinearGradient();
  gradient.colors = [new Color("#141414"), new Color("#1E1E1E")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  
  widget.setPadding(16, 16, 16, 16);


  // --- 3. 顶部：当前价格 ---
  let headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();
  
  // 左侧标题
  let titleStack = headerStack.addStack();
  titleStack.layoutVertically();
  let title = titleStack.addText("BITCOIN PRICE");
  title.font = Font.systemFont(10);
  title.textColor = new Color("#888888");
  
  let priceText = titleStack.addText("$" + formatNumber(currentPrice));
  priceText.font = Font.heavySystemFont(22);
  priceText.textColor = Color.white();
  
  headerStack.addSpacer();
  
  // 右侧进度
  let percentStack = headerStack.addStack();
  let percentText = percentStack.addText((progressPercent * 100).toFixed(2) + "%");
  percentText.font = Font.boldSystemFont(16);
  percentText.textColor = new Color("#F7931A"); 

  widget.addSpacer(12);


  // --- 4. 中部：可视化进度条 ---
  // 使用图片绘制法，兼容性最好
  let barImage = drawProgressBar(progressPercent);
  let imgStack = widget.addStack();
  let img = imgStack.addImage(barImage);
  img.imageSize = new Size(300, 10); 
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
  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 60); // 1小时刷新
  
  return widget;
};

// =======================
// 🛠 辅助函数库
// =======================

// 修复后的数据获取函数 (使用 CoinCap API)
async function getBTCData() {
  const url = "https://api.coincap.io/v2/assets/bitcoin";
  
  try {
    let req = new Request(url);
    // 设置超时防止卡死
    req.timeoutInterval = 10; 
    let json = await req.loadJSON();
    
    // CoinCap 返回的数据在 json.data 里，且是字符串，需要转数字
    let d = json.data;
    
    if (!d) throw new Error("API Data Empty");

    return {
      price: parseFloat(d.priceUsd),
      market_cap: parseFloat(d.marketCapUsd),
      circulating_supply: parseFloat(d.supply)
    };
  } catch (e) {
    // 🚨 兜底数据：如果API挂了，使用这个数据，防止组件报错白屏
    // 这里填入一个近期的估算值
    return { 
      price: 98000, 
      market_cap: 1950000000000, 
      circulating_supply: 19800000 
    };
  }
}

function drawProgressBar(pct) {
  const width = 600; 
  const height = 20; 
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  
  // 底槽
  let trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, 0, width, height), height/2, height/2);
  ctx.addPath(trackPath);
  ctx.setFillColor(new Color("#333333"));
  ctx.fillPath();
  
  // 进度
  // 限制最大100%，防止溢出画坏了
  let safePct = pct > 1 ? 1 : pct;
  let barWidth = width * safePct;
  if (barWidth < height) barWidth = height; 
  
  let barPath = new Path();
  barPath.addRoundedRect(new Rect(0, 0, barWidth, height), height/2, height/2);
  ctx.addPath(barPath);
  ctx.setFillColor(new Color("#F7931A"));
  ctx.fillPath();
  
  return ctx.getImage();
}

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

function formatNumber(num) {
  return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatTrillion(num) {
  return (num / 1000000000000).toFixed(2) + "T";
}

function formatK(num) {
  return (num / 1000).toFixed(0) + "k";
}
