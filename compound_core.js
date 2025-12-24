// ==========================================
// ☁️ 云端核心：BTC vs Gold 翻转进度条 (UI重构版 v2.0)
// 特性：顶部首尾呼应大字，进度数字居中显示
// ==========================================

module.exports.createWidget = async () => {
  const widget = new ListWidget();

  // --- 1. 数据准备 (保持不变) ---
  const GOLD_SUPPLY_OZ = 6720000000; 
  const BTC_SUPPLY = 19800000;

  // 获取实时价格 (Binance API)
  const prices = await getBinancePrices();
  const btcPrice = prices.btc;   
  const goldPriceOz = prices.gold; 

  // 核心计算
  const btcMarketCap = btcPrice * BTC_SUPPLY;
  const goldMarketCap = goldPriceOz * GOLD_SUPPLY_OZ;
  const progressPercent = (btcMarketCap / goldMarketCap); 
  // 目标单价
  const targetPrice = goldMarketCap / BTC_SUPPLY;


  // --- 2. UI 风格绘制 ---
  let gradient = new LinearGradient();
  gradient.colors = [new Color("#1E2026"), new Color("#0B0E11")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  
  widget.setPadding(16, 16, 16, 16);

  // ===========================================
  // 🆕 顶部区域：首尾呼应的“现状 vs 目标”
  // ===========================================
  let headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  // headerStack.centerAlignContent(); // 移除居中，让它们顶部对齐
  
  // >> 左侧：当前价格
  let leftStack = headerStack.addStack();
  leftStack.layoutVertically();
  
  let titleLeft = leftStack.addText("CURRENT PRICE");
  titleLeft.font = Font.systemFont(9);
  titleLeft.textColor = new Color("#848E9C"); 
  
  let priceLeft = leftStack.addText("$" + formatNumber(btcPrice));
  // 统一使用最重的字体
  priceLeft.font = Font.heavySystemFont(22);
  priceLeft.textColor = new Color("#0ECB81"); // 涨幅绿
  
  headerStack.addSpacer();
  
  // >> 右侧：目标价格 (新增，与左侧呼应)
  let rightStack = headerStack.addStack();
  rightStack.layoutVertically();
  // 让右侧文字靠右对齐的 Hack：在文字前加Spacer在Stack里比较麻烦，
  // Scriptable默认左对齐。为了视觉平衡，我们保持左对齐即可，因为有 headerStack.addSpacer() 撑开。
  
  let titleRight = rightStack.addText("TARGET PRICE");
  titleRight.font = Font.systemFont(9);
  titleRight.textColor = new Color("#848E9C");
  // titleRight.rightAlignText(); // Stack内的文本右对齐在某些版本不稳定，暂不强制
  
  // 为了放下大字体，目标价使用 K 格式化 (例如 $885k)
  let priceRight = rightStack.addText("$" + formatK(targetPrice));
  // 🔴 关键要求：字体大小与左侧一致
  priceRight.font = Font.heavySystemFont(22);
  priceRight.textColor = new Color("#F0B90B"); // 黄金黄

  widget.addSpacer(15);


  // ===========================================
  // 🆕 中部区域：进度展示
  // ===========================================
  
  // 1. 进度百分比数字 (放在进度条上方，居中)
  let percentLabelStack = widget.addStack();
  percentLabelStack.centerAlignContent(); // 居中对齐栈
  percentLabelStack.addSpacer(); // 左弹簧
  
  let percentText = percentLabelStack.addText((progressPercent * 100).toFixed(2) + "%");
  percentText.font = Font.boldSystemFont(14);
  percentText.textColor = new Color("#F0B90B"); 
  
  percentLabelStack.addSpacer(); // 右弹簧

  widget.addSpacer(4); // 数字和条之间的间距

  // 2. 进度条图像
  let barImage = drawProgressBar(progressPercent);
  let imgStack = widget.addStack();
  let img = imgStack.addImage(barImage);
  // 高度稍微调高一点点，视觉更饱满
  img.imageSize = new Size(300, 12);
  img.cornerRadius = 6;

  widget.addSpacer(15);


  // ===========================================
  // 🆕 底部区域：核心市值数据
  // ===========================================
  let statsStack = widget.addStack();
  statsStack.layoutHorizontally();

  // 列1: BTC 市值
  addStatColumn(statsStack, "BTC MARKET CAP", "$" + formatTrillion(btcMarketCap), Color.white());
  
  statsStack.addSpacer();
  
  // 列2: 黄金市值 (目标价已移到顶部，这里只留两个对比)
  addStatColumn(statsStack, "GOLD MARKET CAP", "$" + formatTrillion(goldMarketCap), new Color("#FFD700"));

  // --- 刷新逻辑 ---
  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 15);
  
  return widget;
};

// =======================
// 🛠 辅助函数库 (保持不变)
// =======================

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

function drawProgressBar(pct) {
  const width = 600; const height = 24; // 稍微增高画布适应圆角
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

function formatNumber(num) { return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function formatTrillion(num) { return (num / 1000000000000).toFixed(2) + "T"; }
function formatK(num) { return (num / 1000).toFixed(0) + "k"; }
