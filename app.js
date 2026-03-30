// --- CONFIG & DATA ---
const bankAccount = "123456789/0100"; // ZDE ZMĚŇ NA SVŮJ ÚČET

let rawMaterials = JSON.parse(localStorage.getItem('g_raw')) || [
    { id: 1, name: "Pivo Sud 12", unit: "ml" },
    { id: 2, name: "Hovězí maso", unit: "g" },
    { id: 3, name: "Káva zrnková", unit: "g" }
];

let stock = JSON.parse(localStorage.getItem('g_stock')) || { "1": 50000, "2": 10000, "3": 5000 };

let recipes = JSON.parse(localStorage.getItem('g_recipes')) || [
    { id: 101, name: "Pivo 0.5l", price: 55, ing: [{id: 1, qty: 500}] },
    { id: 102, name: "Steak 200g", price: 390, ing: [{id: 2, qty: 200}] },
    { id: 103, name: "Espresso", price: 45, ing: [{id: 3, qty: 8}] }
];

let tables = JSON.parse(localStorage.getItem('g_tables')) || Array.from({length: 12}, (_, i) => ({
    id: i+1, name: "Stůl " + (i+1), items: [], status: 'free'
}));

let logs = JSON.parse(localStorage.getItem('g_logs')) || [];
let activeTable = null;
let myChart = null;

// --- CORE FUNKCE ---
function save() {
    localStorage.setItem('g_stock', JSON.stringify(stock));
    localStorage.setItem('g_tables', JSON.stringify(tables));
    localStorage.setItem('g_logs', JSON.stringify(logs));
}

function init() {
    const grid = document.getElementById('tables-grid');
    if(!grid) return;
    grid.innerHTML = '';
    tables.forEach(t => {
        const div = document.createElement('div');
        div.className = `table-box ${t.status}`;
        let sum = t.items.reduce((a, b) => a + b.price, 0);
        div.innerHTML = `<strong>${t.name}</strong><span>${sum > 0 ? sum + ' Kč' : 'Volno'}</span>`;
        div.onclick = () => openOrder(t);
        grid.appendChild(div);
    });
    document.getElementById('stat-revenue').innerText = logs.reduce((a, b) => a + b.price, 0);
}

// --- POKLADNA ---
function openOrder(t) {
    activeTable = t;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-order').classList.remove('hidden');
    document.getElementById('active-table-title').innerText = t.name;
    renderMenu();
    updateBill();
}

function renderMenu() {
    const container = document.getElementById('menu-items');
    container.innerHTML = recipes.map(r => `
        <button class="m-btn" onclick="addItem(${r.id})">${r.name}<br><b>${r.price} Kč</b></button>
    `).join('');
}

function addItem(id) {
    const r = recipes.find(x => x.id === id);
    activeTable.items.push({...r});
    activeTable.status = 'occupied';
    save();
    updateBill();
}

function updateBill() {
    const list = document.getElementById('bill-list');
    let total = activeTable.items.reduce((a, b) => a + b.price, 0);
    list.innerHTML = activeTable.items.map(i => `<div class="b-item"><span>${i.name}</span><b>${i.price} Kč</b></div>`).join('');
    document.getElementById('bill-total').innerText = total;
}

// --- PLATBA & QR ---
function openQR() {
    let total = document.getElementById('bill-total').innerText;
    if(total == 0) return;
    document.getElementById('qr-modal').classList.remove('hidden');
    document.getElementById('qrcode').innerHTML = "";
    let spd = `SPD*1.0*ACC:${bankAccount}*AM:${total}*CUR:CZK*MSG:GastroERP`;
    new QRCode(document.getElementById("qrcode"), { text: spd, width: 180, height: 180 });
    document.getElementById('qr-amount-text').innerText = "K úhradě: " + total + " Kč";
}

function completePayment(method) {
    activeTable.items.forEach(item => {
        if(item.ing) item.ing.forEach(i => stock[i.id] -= i.qty);
        logs.push({ date: new Date().toISOString(), price: item.price, name: item.name });
    });
    activeTable.items = [];
    activeTable.status = 'free';
    save();
    closeModal('qr-modal');
    showTables();
}

// --- DASHBOARD ---
function renderDashboard() {
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('inventory-view').classList.add('hidden');
    
    const total = logs.reduce((a, b) => a + b.price, 0);
    document.getElementById('stats-cards').innerHTML = `
        <div class="card"><h3>${total} Kč</h3><p>Tržba</p></div>
        <div class="card"><h3>${logs.length}</h3><p>Prodejů</p></div>
    `;

    const ctx = document.getElementById('revenueChart').getContext('2d');
    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: logs.slice(-10).map(l => new Date(l.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})),
            datasets: [{ label: 'Tržba', data: logs.slice(-10).map(l => l.price), borderColor: '#3b82f6', fill: true }]
        }
    });
}

// --- OCR SKENER ---
document.getElementById('camera-input').onchange = function(e) {
    const file = e.target.files[0];
    const res = document.getElementById('ocr-results');
    res.innerHTML = "🔄 Čtu fakturu...";
    Tesseract.recognize(file, 'ces').then(({ data: { text } }) => {
        res.innerHTML = "<h4>Nalezeno k naskladnění:</h4>";
        rawMaterials.forEach(rm => {
            if(text.toLowerCase().includes(rm.name.toLowerCase())) {
                res.innerHTML += `<div>${rm.name} <input type="number" id="ocr-${rm.id}" placeholder="ks/ml"> <button onclick="addStock(${rm.id})">OK</button></div>`;
            }
        });
    });
};

function addStock(id) {
    let val = parseInt(document.getElementById('ocr-'+id).value);
    stock[id] += val;
    save();
    alert("Přidáno!");
    renderInventory();
}

function renderInventory() {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('inventory-view').classList.remove('hidden');
    document.getElementById('inventory-list').innerHTML = rawMaterials.map(rm => `
        <div class="b-item"><span>${rm.name}</span><b>${stock[rm.id]} ${rm.unit}</b></div>
    `).join('');
}

// --- NAVIGACE ---
function showTables() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-tables').classList.remove('hidden');
    init();
}
function showAdmin() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-admin').classList.remove('hidden');
    renderDashboard();
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

window.onload = init;
