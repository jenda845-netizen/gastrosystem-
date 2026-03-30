// --- 1. DATA ---
let rawMaterials = JSON.parse(localStorage.getItem('g_raw')) || [
    { id: 1, name: "Pivo Sud 12", section: "bar", unit: "ml" }
];
let stockLevels = JSON.parse(localStorage.getItem('g_stock')) || { "1": 50000 };
let recipes = JSON.parse(localStorage.getItem('g_recipes')) || [
    { id: 202, name: "Pivo 12", type: "dish", cat: "pivo", price: 55, ingredients: [{ type: "raw", id: 1, amount: 500 }] }
];
let tables = JSON.parse(localStorage.getItem('g_tables')) || Array.from({length: 8}, (_, i) => ({
    id: i + 1, name: `Stul ${i + 1}`, items: [], status: 'free'
}));
let logs = JSON.parse(localStorage.getItem('g_logs')) || [];
let activeTable = null;

// --- 2. FUNKCE ---
function save() {
    localStorage.setItem('g_raw', JSON.stringify(rawMaterials));
    localStorage.setItem('g_stock', JSON.stringify(stockLevels));
    localStorage.setItem('g_recipes', JSON.stringify(recipes));
    localStorage.setItem('g_tables', JSON.stringify(tables));
    localStorage.setItem('g_logs', JSON.stringify(logs));
}

function init() {
    const grid = document.getElementById('tables-grid');
    if (!grid) return;
    grid.innerHTML = '';
    tables.forEach(t => {
        const div = document.createElement('div');
        div.className = `table ${t.status}`;
        let sum = t.items.reduce((a, b) => a + b.price, 0);
        div.innerHTML = `<b>${t.name}</b><br>${sum > 0 ? sum + ' Kc' : 'Volno'}`;
        div.onclick = () => openTable(t);
        grid.appendChild(div);
    });
}

function openTable(t) {
    activeTable = t;
    document.getElementById('screen-tables').classList.add('hidden');
    document.getElementById('screen-order').classList.remove('hidden');
    document.getElementById('active-table-title').innerText = t.name;
    renderMenu();
    renderBill();
}

function showTables() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-tables').classList.remove('hidden');
    init();
}

function showAdmin() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-admin').classList.remove('hidden');
    renderInventoryEditor();
}

function renderMenu() {
    const container = document.getElementById('menu-items');
    container.innerHTML = recipes.filter(r => r.type === 'dish').map(r => `
        <button class="menu-item" onclick="addItem(${r.id})">${r.name}<br>${r.price} Kc</button>
    `).join('');
}

function addItem(id) {
    const item = recipes.find(r => r.id === id);
    activeTable.items.push(item);
    activeTable.status = 'occupied';
    save();
    renderBill();
}

function renderBill() {
    const list = document.getElementById('bill-list');
    let total = activeTable.items.reduce((a, b) => a + b.price, 0);
    list.innerHTML = activeTable.items.map(i => `<div class="bill-row"><span>${i.name}</span><b>${i.price} Kc</b></div>`).join('');
    document.getElementById('bill-total').innerText = total;
}

function payWithPrint() {
    if (!activeTable.items.length) return;
    activeTable.items.forEach(item => {
        logs.push({ date: new Date().toISOString(), name: item.name, price: item.price });
    });
    activeTable.items = [];
    activeTable.status = 'free';
    save();
    showTables();
}

function renderInventoryEditor() {
    const container = document.getElementById('admin-content');
    container.innerHTML = `<h3>Sklad</h3>` + rawMaterials.map(rm => `<div>${rm.name}: ${stockLevels[rm.id] || 0}</div>`).join('');
}

// DŮLEŽITÉ: Spuštění hned po načtení
window.onload = init;
