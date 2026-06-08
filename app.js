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

/* ================= CLEAR BUTTON ================= */
const input = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");

if (input) {
  input.addEventListener("input", (e) => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      filterTable(e.target.value);
    }, 250);

    if (clearBtn) {
      clearBtn.style.display = e.target.value ? "block" : "none";
    }
  });
}

function clearInput() {
  const input = document.getElementById("searchInput");

  if (!input) return;

  input.value = "";
  filterTable("");

  const clearBtn = document.getElementById("clearBtn");

  if (clearBtn) {
    clearBtn.style.display = "none";
  }

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

/* ================= LOAD MULTI JSON ================= */
async function loadData() {
  try {
    setLoading(true);

    const files = [];

    for (let i = 1; i <= 10; i++) {
      files.push(i === 1 ? "./data.json" : `./data_${i}.json`);
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

    originalData = jsons.flat();

    buildIndex(originalData);

    console.log(
      `Loaded ${originalData.length} products | Indexed ${searchIndex.length} barcodes`
    );

    setLoading(false);

  } catch (err) {
    console.error("Load JSON error:", err);
    alert("Lỗi load data JSON");
    setLoading(false);
  }
}

/* ================= BUILD SEARCH INDEX ================= */
function buildIndex(data) {
  searchIndex = [];

  data.forEach((item) => {

    const barcodes = Array.isArray(item.BARCODE)
      ? item.BARCODE
      : item.BARCODE
      ? [item.BARCODE]
      : [""];

    barcodes.forEach((barcode) => {

      searchIndex.push({
        data: {
          ...item,
          BARCODE: barcode
        },

        search: (
          String(barcode || "") + " " +
          String(item.ARTCEXR || "") + " " +
          String(item.TSOBDESC || "") + " " +
          String(item["MU/CS"] || "")
        ).toLowerCase()
      });

    });

  });
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
    .filter(item => item.search.includes(k))
    .slice(0, 200)
    .map(item => item.data);

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

  // Giữ nguyên logic bỏ cột cuối
  const cols = allCols.slice(0, -1);

  let html = "<thead><tr>";

  cols.forEach((col) => {
    html += `<th>${escapeHtml(col)}</th>`;
  });

  html += "</tr></thead><tbody>";

  rows.forEach((row) => {

    html += "<tr>";

    cols.forEach((col) => {
      html += `<td>${escapeHtml(row[col] ?? "")}</td>`;
    });

    html += "</tr>";

  });

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

  if (modal) {
    modal.style.display = "flex";
  }

  try {
    html5QrCode = new Html5Qrcode("reader");

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250
      },
      async (decodedText) => {

        const input = document.getElementById("searchInput");

        if (input) {
          input.value = decodedText;
        }

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

  if (modal) {
    modal.style.display = "none";
  }

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
