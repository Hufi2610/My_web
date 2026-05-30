let originalData = [];
let searchIndex = [];
let searchTimer = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  const input = document.getElementById("searchInput");

  if (input) {
    input.addEventListener("input", (e) => {
      clearTimeout(searchTimer);

      searchTimer = setTimeout(() => {
        filterTable(e.target.value);
      }, 250);
    });
  }
});

/* ================= LOAD MULTI JSON ================= */
async function loadData() {
  try {
    const files = [];

    for (let i = 1; i <= 10; i++) {
      files.push(i === 1 ? "./data.json" : `./data_${i}.json`);
    }

    originalData = [];

    for (let file of files) {
      try {
        const res = await fetch(file);
        if (!res.ok) continue;

        const data = await res.json();

        if (Array.isArray(data)) {
          originalData = originalData.concat(data);
        }
      } catch (e) {}
    }

    buildIndex(originalData);
    renderTable([]);

  } catch (err) {
    console.error("Load JSON error:", err);
    alert("Lỗi load data JSON");
  }
}

/* ================= BUILD SEARCH INDEX ================= */
function buildIndex(data) {
  searchIndex = data.map(item => ({
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
    .filter(i => i.search.includes(k))
    .slice(0, 200)
    .map(i => i.data);

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

  // ❗ FIX: bỏ cột cuối
  const cols = allCols.slice(0, -1);

  let html = "<thead><tr>";

  cols.forEach(c => {
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