let originalData = [];
let searchIndex = [];
let searchTimer;

/* ================= LOAD JSON ================= */
async function loadData() {

  const res = await fetch("./data.json");
  originalData = await res.json();

  searchIndex = originalData.map(item => ({
    data: item,
    search: Object.values(item).join(" ").toLowerCase()
  }));

  renderTable([]);
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

  document.getElementById("resultInfo").innerText =
    `Tìm thấy ${results.length} kết quả`;
}

/* ================= RENDER ================= */
function renderTable(rows) {

  const table = document.getElementById("excelTable");

  if (!rows.length) {
    table.innerHTML = "";
    return;
  }

  const cols = Object.keys(originalData[0]);

  let html = "<thead><tr>";
  cols.forEach(c => html += `<th>${c}</th>`);
  html += "</tr></thead><tbody>";

  rows.forEach(r => {
    html += "<tr>";
    cols.forEach(c => html += `<td>${r[c] ?? ""}</td>`);
    html += "</tr>";
  });

  html += "</tbody>";
  table.innerHTML = html;
}

/* ================= INPUT ================= */
document.getElementById("searchInput")
.addEventListener("input", e => {

  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    filterTable(e.target.value);
  }, 300);

});

/* ================= INIT ================= */
loadData();

/* ================= MENU ================= */
function toggleMenu(e){
  e.stopPropagation();

  const menu = document.getElementById("menu");
  const overlay = document.getElementById("overlay");

  const open = menu.style.display === "flex";

  menu.style.display = open ? "none" : "flex";
  overlay.style.display = open ? "none" : "block";
}

function closeMenu(){
  document.getElementById("menu").style.display="none";
  document.getElementById("overlay").style.display="none";
}

/* ================= SCANNER ================= */
let html5QrCode;

async function openScanner() {

  document.getElementById("scannerModal").style.display = "flex";

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
}

async function closeScanner() {

  document.getElementById("scannerModal").style.display = "none";

  if (html5QrCode) {
    await html5QrCode.stop();
    await html5QrCode.clear();
  }
}