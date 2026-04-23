const WORKER_URL = "https://github-metadata.zhandapengpeng.workers.dev/write";

const form = document.getElementById("logForm");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");
const recentList = document.getElementById("recentList");

function setStatus(message, kind = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`.trim();
}

function getNowIso() {
  return new Date().toISOString();
}

function parseTags(input) {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function saveRecent(record) {
  const key = "metadata_recent_logs";
  const oldValue = localStorage.getItem(key);
  const list = oldValue ? JSON.parse(oldValue) : [];
  list.unshift(record);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
  renderRecent();
}

function renderRecent() {
  const key = "metadata_recent_logs";
  const oldValue = localStorage.getItem(key);
  const list = oldValue ? JSON.parse(oldValue) : [];
  recentList.innerHTML = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.textContent = "还没有记录";
    recentList.appendChild(li);
    return;
  }

  for (const item of list) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="recent-time">${new Date(item.ts).toLocaleString()}</span>
      <div>${item.content}</div>
    `;
    recentList.appendChild(li);
  }
}

function getCurrentPositionSafe() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 60000,
      }
    );
  });
}

async function submitLog(event) {
  event.preventDefault();

  const source = document.getElementById("source").value;
  const type = document.getElementById("type").value;
  const content = document.getElementById("content").value.trim();
  const withLocation = document.getElementById("withLocation").checked;
  const tags = parseTags(document.getElementById("tags").value);

  if (!content) {
    setStatus("请输入内容", "error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("正在提交...");

  const location = withLocation ? await getCurrentPositionSafe() : null;

  const payload = {
    id: `raw_${Date.now()}`,
    ts: getNowIso(),
    source,
    type,
    content,
    meta: {
      tags,
      location: location
        ? {
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
          }
        : null,
    },
  };

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "提交失败");
    }

    saveRecent(payload);
    form.reset();
    document.getElementById("source").value = "pwa";
    document.getElementById("type").value = "text";
    document.getElementById("withLocation").checked = true;
    setStatus("提交成功", "success");
  } catch (error) {
    console.error(error);
    setStatus(`提交失败：${error.message}`, "error");
  } finally {
    submitBtn.disabled = false;
  }
}

form.addEventListener("submit", submitLog);
renderRecent();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (error) {
      console.error("service worker 注册失败", error);
    }
  });
}
