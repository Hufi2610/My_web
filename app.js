let originalData = [];
let searchIndex = [];
let searchTimer;

/* ================= LOAD MULTI JSON ================= */
async function loadData() {

  try {

    const files = [
      "./data.json",
      "./data_2.json"
    ];

    originalData = [];

    for (let file of files) {
      const res = await fetch(file);
      const data = await res.json();
      originalData = originalData.concat(data);
    }

    buildIndex(originalData);

    renderTable([]);

  } catch (err) {
    console.error(err);
    alert("Lỗi load data JSON");
  }
}

/* ================= BUILD SEARCH INDEX ================= */
function buildIndex(data) {

  searchIndex = data.map(item => ({
    data: item,
    search: Object.values(item)
      .join(" ")
      .toLowerCase()
  }));
}

/* ================= SEARCH ================= */
function filterTable(keyword) {

  const k = keyword.trim().toLowerCase();

  if (!k) {
    renderTable([]);
    return;
  }

  const results = searchIndex
    .filter(i => i.search.includes(k))
    .slice(0, 200)
    .map(i => i.data);

  renderTable(results);
}

/* ================= RENDER TABLE ================= */
function renderTable(rows) {

  const table = document.getElementById("excelTable");

  if (!rows.length) {
    table.innerHTML = "";
    return;
  }

  const cols = Object.keys(originalData[0]);

  let html = "<thead><tr>";

  cols.forEach(c => {
    html += `<th>${c}</th>`;
  });

  html += "</tr></thead><tbody>";

  rows.forEach(r => {

    html += "<tr>";

    cols.forEach(c => {
      html += `<td>${r[c] ?? ""}</td>`;
    });

    html += "</tr>";

  });

  html += "</tbody>";

  table.innerHTML = html;
}

/* ================= INPUT SEARCH (DEBOUNCE) ================= */
document
.getElementById("searchInput")
.addEventListener("input", e => {

  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    filterTable(e.target.value);
  }, 300);

});

/* ================= INIT ================= */
loadData();

/* ================= MENU ================= */
function toggleMenu(e) {

  e.stopPropagation();

  const menu = document.getElementById("menu");
  const overlay = document.getElementById("overlay");

  const open = menu.style.display === "flex";

  menu.style.display = open ? "none" : "flex";
  overlay.style.display = open ? "none" : "block";
}

function closeMenu() {

  document.getElementById("menu").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}

/* ================= SCANNER ================= */
let html5QrCode;

async function openScanner() {

  document.getElementById("scannerModal").style.display = "flex";

  html5QrCode = new Html5Qrcode("reader");

  try {

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250
      },
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