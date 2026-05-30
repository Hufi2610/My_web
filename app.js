let originalData = [];
let searchIndex = [];
let searchTimer = null;

/* ================= LOADING UI ================= */
function setLoading(isLoading) {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.placeholder = isLoading
    ? "⏳ Đang tải dữ liệu..."
    : "Tìm mã / barcode / mô tả...";
}
const input = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");

if (input) {
  input.addEventListener("input", (e) => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      filterTable(e.target.value);
    }, 250);

    // 👇 hiện/ẩn nút x
    if (clearBtn) {
      clearBtn.style.display = e.target.value ? "block" : "none";
    }
  });
}

function clearInput() {
  const input = document.getElementById("searchInput");

  input.value = "";
  filterTable("");

  const clearBtn = document.getElementById("clearBtn");
  if (clearBtn) clearBtn.style.display = "none";

  input.focus();
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  const input = document.getElementById("searchInput");

  if (input) {
    input.addEventListener("input", (e) => {
      clearTimeout(searchTimer);

      searchTimer = setTimeout(() => {
        filterTable(e.target.value);
      }, 150);
    });
  }
});

/* ================= LOAD MULTI JSON (FAST PARALLEL) ================= */
async function loadData() {
  try {
    setLoading(true);

    const files = [];

    for (let i = 1; i <= 10; i++) {
      files.push(i === 1 ? "./data.json" : `./data_${i}.json`);
    }

    const responses = await Promise.all(
      files.map((f) =>
        fetch(f).catch(() => null)
      )
    );

    const jsons = await Promise.all(
      responses.map((r) =>
        r ? r.json().catch(() => []) : []
      )
    );

    originalData = jsons.flat();

    buildIndex(originalData);

    setLoading(false);

  } catch (err) {
    console.error("Load JSON error:", err);
    alert("Lỗi load data JSON");
    setLoading(false);
  }
}

/* ================= BUILD SEARCH INDEX ================= */
function buildIndex(data) {
  searchIndex = data.map((item) => ({
    data: item,
    search: Object.values(item).join(" ").toLowerCase()
  }));
}

/* ================= SEARCH ================= */
function filterTable(keyword) {
  const k = keyword.trim().toLowerCase();

  if (!k) {
    renderTable([]);
    return;
  }

  if (!searchIndex.length) return;

  const results = searchIndex
    .filter((i) => i.search.includes(k))
    .slice(0, 200)
    .map((i) => i.data);

  renderTable(results);
}

/* ================= RENDER TABLE (BỎ CỘT CUỐI) ================= */
function renderTable(rows) {
  const table = document.getElementById("excelTable");
  if (!table) return;

  if (!originalData.length || !rows.length) {
    table.innerHTML = "";
    return;
  }

  const allCols = Object.keys(originalData[0]);

  // ❗ bỏ cột cuối cùng
  const cols = allCols.slice(0, -1);

  let html = "<thead><tr>";

  cols.forEach((c) => {
    html += `<th>${c}</th>`;
  });

  html += "</tr></thead><tbody>";

  for (let r of rows) {
    html += "<tr>";

    for (let c of cols) {
      html += `<td>${r?.[c] ?? ""}</td>`;
    }

    html += "</tr>";
  }

  html += "</tbody>";

  table.innerHTML = html;
}

/* ================= MENU ================= */
function toggleMenu(e) {
  e.stopPropagation();

  const menu = document.getElementById("menu");
  const overlay = document.getElementById("overlay");

  if (!menu || !overlay) return;

  const open = menu.style.display === "flex";

  menu.style.display = open ? "none" : "flex";
  overlay.style.display = open ? "none" : "block";
}

function closeMenu() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}

/* ================= SCANNER ================= */
let html5QrCode = null;

async function openScanner() {
  document.getElementById("scannerModal").style.display = "flex";

  try {
    html5QrCode = new Html5Qrcode("reader");

    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (text) => {
        document.getElementById("searchInput").value = text;
        filterTable(text);
        await closeScanner();
      }
    );
  } catch (err) {
    console.error(err);
    alert("Không mở được camera");
  }
}

async function closeScanner() {
  document.getElementById("scannerModal").style.display = "none";

  try {
    if (html5QrCode) {
      await html5QrCode.stop();
      await html5QrCode.clear();
      html5QrCode = null;
    }
  } catch (e) {}
}
