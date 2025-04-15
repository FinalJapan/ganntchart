// ✅ ユーザーが自由に追加・削除できる配列（ここだけいじればOK！）
const brandOptions = ["BM", "HR", "JS",];
const categoryOptions = ["クーポン", "リモデル", "PUSH"];


// 📅 現在表示中の年月を保持する変数
let currentDate = new Date();

// ✏️ 編集中のキャンペーンのインデックス（-1 は「編集中でない」ことを意味）
let editingIndex = -1;


// 🌟 ページが読み込まれたときの処理
document.addEventListener("DOMContentLoaded", () => {
  // 📆 日付入力欄をカレンダーにする（flatpickr使用）
  flatpickr("#start", { dateFormat: "Y-m-d", locale: "ja" });
  flatpickr("#end", { dateFormat: "Y-m-d", locale: "ja" });
  // セレクトボックスに選択肢を反映（フォームとフィルター両方）

  // ✅ 選択肢の自動反映（これ重要！）
  populateSelect("brand", brandOptions, "ブランド");
  populateSelect("brandFilter", ["すべて", ...brandOptions]);

  populateSelect("category", categoryOptions, "カテゴリ");
  populateSelect("categoryFilter", ["すべて", ...categoryOptions]);


  // 📊 初期表示を更新
  updateView();

  // 🖱 スクロール同期：上と下のスクロールバーを連動させる
  const scrollArea = document.getElementById("scrollArea");
  const topScrollArea = document.getElementById("topScrollArea");

  scrollArea.addEventListener("scroll", () => {
    topScrollArea.scrollLeft = scrollArea.scrollLeft;
  });
  topScrollArea.addEventListener("scroll", () => {
    scrollArea.scrollLeft = topScrollArea.scrollLeft;
  });

  // 🗑 キャンペーン削除ボタン（編集中のみ有効）
  document.getElementById("deleteBtn").addEventListener("click", () => {
    if (editingIndex === -1) return;

    const confirmDelete = confirm("このキャンペーンを削除してもよろしいですか？");
    if (confirmDelete) {
      const campaigns = loadCampaigns();
      campaigns.splice(editingIndex, 1); // 編集中のキャンペーンを削除
      saveCampaigns(campaigns);          // 保存
      editingIndex = -1;
      updateView();                      // 表示更新
      editingIndex = -1; // 編集モード解除
      document.getElementById("campaignForm").reset(); // フォーム初期化
      document.getElementById("editNotice").style.display = "none";
      document.getElementById("deleteArea").style.display = "none";
    }


  });
});

// ❌ キャンセルボタンの処理
document.getElementById("cancelBtn").addEventListener("click", () => {
  // フォームを初期化する
  document.getElementById("campaignForm").reset();

  // 編集モードを解除する
  editingIndex = -1;

  // 編集メッセージと削除・キャンセルボタンを非表示にする
  document.getElementById("editNotice").style.display = "none";
  document.getElementById("deleteArea").style.display = "none";
});

// ▶️ 前の月へ
document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateView();
});

// ▶️ 次の月へ
document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateView();
});

// 🔍 ブランドとカテゴリのフィルター変更時に表示を更新
document.getElementById("brandFilter").addEventListener("change", updateView);
document.getElementById("categoryFilter").addEventListener("change", updateView);

// ➕ キャンペーン追加（または編集）時の処理
document.getElementById("campaignForm").addEventListener("submit", (e) => {
  e.preventDefault();

  // 📝 フォームの値を取得
  const name = document.getElementById("name").value;
  const start = new Date(document.getElementById("start").value);
  const end = new Date(document.getElementById("end").value);
  const brand = document.getElementById("brand").value;
  const category = document.getElementById("category").value;

  const campaign = {
    name,
    start: start.toISOString(),
    end: end.toISOString(),
    brand,
    category
  };

  const campaigns = loadCampaigns();

  if (editingIndex !== -1) {
    campaigns[editingIndex] = campaign; // 編集モード：上書き
    editingIndex = -1;
    document.getElementById("editNotice").style.display = "none";
    document.getElementById("deleteArea").style.display = "none";
  } else {
    campaigns.push(campaign); // 新規モード：追加
  }

  saveCampaigns(campaigns); // 保存
  updateView();             // 表示更新
  e.target.reset();         // フォーム初期化
});

// 📆 表示中の年月ラベルを更新
function updateMonthLabel() {
  document.getElementById("monthLabel").textContent =
    `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`;
}

// 📅 上部の日付ラベルを描画
function renderDateLabels() {
  const container = document.getElementById("dateLabels");
  container.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate(); // 月末日

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day);
    const label = document.createElement("span");
    label.textContent = `${month + 1}/${day}`;
    label.style.display = "inline-block";
    label.style.width = "70px";
    label.style.textAlign = "center";
    label.style.fontSize = "17px";

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) label.style.color = "red";  // 日曜
    else if (dayOfWeek === 6) label.style.color = "blue"; // 土曜

    container.appendChild(label);
  }
}

// 📊 グリッド線（1日ごとの区切り線）を表示
function renderDateLines() {
  const chart = document.getElementById("chartContainer");
  chart.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const line = document.createElement("div");
    line.className = "grid-line";
    line.style.left = `${(day - 1) * 70}px`;
    chart.appendChild(line);
  }

  // スクロール幅を日数に応じて設定
  const scrollWidth = `${lastDay * 70}px`;
  document.querySelector("#topScrollArea .scroll-inner").style.width = scrollWidth;
  document.querySelector("#scrollArea .scroll-inner").style.width = scrollWidth;
}

// 📌 キャンペーンバーを表示（1本ずつ）
function renderCampaignBar(campaign, index) {
  const start = new Date(campaign.start);
  const end = new Date(campaign.end);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 今月に該当しないキャンペーンは表示しない
  if (
    end.getFullYear() < year ||
    (end.getFullYear() === year && end.getMonth() < month) ||
    start.getFullYear() > year ||
    (start.getFullYear() === year && start.getMonth() > month)
  ) return;

  // 当月内での開始・終了日を計算
  const startDay = (start.getFullYear() === year && start.getMonth() === month)
    ? start.getDate()
    : 1;
  const endDay = (end.getFullYear() === year && end.getMonth() === month)
    ? end.getDate()
    : new Date(year, month + 1, 0).getDate();

  const duration = endDay - startDay + 1;

  const bar = document.createElement("div");
  bar.className = "bar";
  bar.style.marginLeft = `${(startDay - 1) * 70}px`;
  bar.style.width = `${duration * 70}px`;

  // 🟩 ブランド別に色分け
  switch (campaign.brand) {
    case "JS":
      bar.style.background = "linear-gradient(to right,rgb(165, 67, 88),rgb(227, 130, 163))"; // 赤系
      break;
    case "BM":
      bar.style.background = "linear-gradient(to right,rgb(156, 88, 165),rgb(187, 58, 172))"; // 紫系
      break;
    case "HR":
      bar.style.background = "linear-gradient(to right,rgb(85, 115, 176),rgb(113, 164, 231))"; // 青系
      break;
    default: bar.style.backgroundColor = "#9e9e9e";
  }

  // 🏷 バー内にテキストを表示
  const startStr = `${start.getMonth() + 1}/${start.getDate()}`;
  const endStr = `${end.getMonth() + 1}/${end.getDate()}`;
  const label = document.createElement("span");
  label.textContent = `【${campaign.brand}】${campaign.name}（${startStr}〜${endStr}）`;

  const categoryTag = document.createElement("span");
  categoryTag.textContent = campaign.category;
  categoryTag.style.marginLeft = "10px";
  categoryTag.style.fontSize = "12px";
  categoryTag.style.color = "#fff";

  const removeBtn = document.createElement("span");
  removeBtn.textContent = "✖";
  removeBtn.className = "remove-btn";
  removeBtn.onclick = () => removeCampaign(index); // 削除機能

  // 🖊 バーをクリックすると編集モードに
  bar.onclick = () => editCampaign(index);

  // バーに要素を追加
  bar.appendChild(label);
  bar.appendChild(categoryTag);
  bar.appendChild(removeBtn);

  document.getElementById("chartContainer").appendChild(bar);
}

// 📄 チャートを再描画（フィルター適用後）
function refreshChart() {
  const chart = document.getElementById("chartContainer");
  chart.innerHTML = "";
  renderDateLines();

  const brand = document.getElementById("brandFilter").value;
  const category = document.getElementById("categoryFilter").value;
  const campaigns = loadCampaigns();

  const filtered = campaigns.filter(c =>
    (brand === "すべて" || c.brand === brand) &&
    (category === "すべて" || c.category === category)
  );

  filtered.forEach((c, i) => renderCampaignBar(c, i));
}

// 📊 全体の画面を更新（年月やチャート含む）
function updateView() {
  updateMonthLabel();
  renderDateLabels();
  refreshChart();
}

// 💾 キャンペーン情報をローカルに保存
function saveCampaigns(campaigns) {
  localStorage.setItem("campaigns", JSON.stringify(campaigns));
}

// 📦 保存されたキャンペーンを読み込み
function loadCampaigns() {
  const saved = localStorage.getItem("campaigns");
  return saved ? JSON.parse(saved) : [];
}

// ❌ キャンペーンを削除
function removeCampaign(index) {
  const campaigns = loadCampaigns();
  campaigns.splice(index, 1);
  saveCampaigns(campaigns);
  updateView();
}

// ✏️ キャンペーンを編集（フォームに値を入れて編集モードに）
function editCampaign(index) {
  const campaigns = loadCampaigns();
  const c = campaigns[index];

  document.getElementById("name").value = c.name;
  document.getElementById("start").value = c.start.slice(0, 10);
  document.getElementById("end").value = c.end.slice(0, 10);
  document.getElementById("brand").value = c.brand;
  document.getElementById("category").value = c.category;

  editingIndex = index;
  document.getElementById("editNotice").style.display = "block";
  document.getElementById("deleteArea").style.display = "block";
}

function populateSelect(id, options, placeholderText = "選択してください") {
  const select = document.getElementById(id);
  if (!select) return;

  select.innerHTML = "";

  // フィルター用にはプレースホルダーを追加しない
  const isFilter = id.includes("Filter");

  if (!isFilter) {
    const placeholder = document.createElement("option");
    placeholder.textContent = placeholderText;
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.hidden = true;
    placeholder.value = "";
    select.appendChild(placeholder);
  }

  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}


