let originalData = [];
let searchIndex = [];
let searchTimer = null;
let lastKeyword = "";

/* ================= LOADING UI ================= */
function setLoading(isLoading) {
  const input = document.getElementById("searchInput");

  if (!input) return;

  input.placeholder = isLoading
    ? "⏳ Đang tải dữ liệu..."
    : "Tìm mã / barcode / mô tả...";
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  const input = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearBtn");

  if (input) {
    input.addEventListener("input", (e) => {
      const value = e.target.value;

      clearTimeout(searchTimer);

      searchTimer = setTimeout(() => {
        filterTable(value);
      }, 80); // giảm lag cảm giác gõ

      if (clearBtn) {
        clearBtn.style.display = value ? "block" : "none";
      }
    });
  }
});

/* ================= CLEAR INPUT ================= */
function clearInput() {
  const input = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearBtn");

  if (!input) return;

  input.value = "";

  if (clearBtn) {
    clearBtn.style.display = "none";
  }

  renderTable([]);

  input.focus();
}

/* ================= LOAD MULTI JSON ================= */
async function loadData() {
  try {
    setLoading(true);

    const files = [];

    for (let i = 1; i <= 10; i++) {
      files.push(
        i === 1
          ? "./data.json"
          : `./data_${i}.json`
      );
    }

    const responses = await Promise.all(
      files.map(async (file) => {
        try {
          const res = await fetch(file);
          if (!res.ok) return null;
          return res;
        } catch {
          return null;
        }
      })
    );

    const jsons = await Promise.all(
      responses.map(async (res) => {
        if (!res) return [];
        try {
          return await res.json();
        } catch {
          return [];
        }
      })
    );

    originalData = [];

    for (const arr of jsons) {
      originalData.push(...arr);
    }

    buildIndex(originalData);

    console.log(
      `Loaded: ${originalData.length} products`
    );

    console.log(
      `Indexed: ${searchIndex.length} barcodes`
    );

    setLoading(false);

  } catch (err) {
    console.error(err);
    alert("Lỗi load dữ liệu");

    setLoading(false);
  }
}

/* ================= BUILD INDEX ================= */
function buildIndex(data) {
  searchIndex = [];

  for (const item of data) {

    const barcodes = Array.isArray(item.BARCODE)
      ? item.BARCODE
      : item.BARCODE
      ? [item.BARCODE]
      : [];

    const artcexr = String(item.ARTCEXR || "");
    const desc = String(item.TSOBDESC || "");
    const mucs = String(item["MU/CS"] || "");

    for (const barcode of barcodes) {

      searchIndex.push({
        item,
        barcode,
        search: (
          barcode + " " +
          artcexr + " " +
          desc + " " +
          mucs
        ).toLowerCase()
      });

    }
  }
}

/* ================= SEARCH ================= */
function filterTable(keyword) {

  const k = keyword.trim().toLowerCase();

  if (k === lastKeyword) return;
  lastKeyword = k;

  if (!k) {
    renderTable([]);
    return;
  }

  if (!searchIndex.length) return;

  const results = [];
  let count = 0;

  for (const row of searchIndex) {

    if (row.search.indexOf(k) !== -1) {

      results.push({
        ...row.item,
        BARCODE: row.barcode
      });

      count++;
      if (count >= 200) break;
    }
  }

  renderTable(results);
}

/* ================= RENDER TABLE ================= */
function renderTable(rows) {

  const table = document.getElementById("excelTable");

  if (!table) return;

  if (!rows.length) {
    table.innerHTML = "";
    return;
  }

  const allCols = Object.keys(rows[0]);

  const cols = allCols.slice(0, -1);

  let html = "<thead><tr>";

  for (const col of cols) {
    html += `<th>${escapeHtml(col)}</th>`;
  }

  html += "</tr></thead><tbody>";

  for (const row of rows) {

    html += "<tr>";

    for (const col of cols) {
      html += `<td>${escapeHtml(row[col] ?? "")}</td>`;
    }

    html += "</tr>";
  }

  html += "</tbody>";

  table.innerHTML = html;
}

/* ================= ESCAPE HTML ================= */
function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ================= MENU ================= */
function toggleMenu(e) {
  e.stopPropagation();

  const menu = document.getElementById("menu");
  const overlay = document.getElementById("overlay");

  if (!menu || !overlay) return;

  const isOpen = menu.style.display === "flex";

  menu.style.display = isOpen ? "none" : "flex";
  overlay.style.display = isOpen ? "none" : "block";
}

function closeMenu() {
  const menu = document.getElementById("menu");
  const overlay = document.getElementById("overlay");

  if (menu) menu.style.display = "none";
  if (overlay) overlay.style.display = "none";
}

/* ================= SCANNER ================= */
let html5QrCode = null;

async function openScanner() {

  const modal = document.getElementById("scannerModal");

  if (modal) modal.style.display = "flex";

  try {

    html5QrCode = new Html5Qrcode("reader");

    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (decodedText) => {

        const input = document.getElementById("searchInput");

        if (input) input.value = decodedText;

        filterTable(decodedText);

        await closeScanner();
      }
    );

  } catch (err) {
    console.error(err);
    alert("Không mở được camera");
  }
}

async function closeScanner() {

  const modal = document.getElementById("scannerModal");

  if (modal) modal.style.display = "none";

  try {

    if (html5QrCode) {
      await html5QrCode.stop();
      await html5QrCode.clear();
      html5QrCode = null;
    }

  } catch (err) {
    console.error(err);
  }
}
