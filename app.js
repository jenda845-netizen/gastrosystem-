// --- 1. INICIALIZACE DAT (Sklad, Recepty, Stoly, Logy) ---
let rawMaterials = JSON.parse(localStorage.getItem('g_raw')) || [
    { id: 1, name: "Pivo Sud 12", section: "bar", unit: "ml" },
    { id: 2, name: "Hovezi maso", section: "kuchyn", unit: "g" },
    { id: 3, name: "Mouka", section: "kuchyn", unit: "g" }
];

let stockLevels = JSON.parse(localStorage.getItem('g_stock')) || { "1": 50000, "2": 5000, "3": 10000 };

let recipes = JSON.parse(localStorage.getItem('g_recipes')) || [
    { 
        id: 101, name: "Domaci knedlik", type: "sub", 
        ingredients: [{ type: "raw", id: 3, amount: 500 }] 
    },
    { 
        id: 201, name: "Svickova", type: "dish", cat: "jidlo", price: 220,
        ingredients: [{ type: "raw", id: 2, amount: 150 }, { type: "sub", id: 101, amount: 0.25 }] 
    },
    {
        id: 202, name: "Pivo 12", type: "dish", cat: "pivo", price: 55,
        ingredients: [{ type: "raw", id: 1, amount: 500 }]
    }
];

let tables = JSON.parse(localStorage.getItem('g_tables')) || Array.from({length: 8}, (_, i) => ({
    id: i + 1, name: `Stul ${i + 1}`, items: [], status: 'free'
}));

let logs = JSON.parse(localStorage.getItem('g_logs')) || [];
let activeTable = null;
let printerCharacteristic = null;

// --- 2. JÁDRO SYSTÉMU (Ukládání a Navigace) ---
function save() {
    localStorage.setItem('g_raw', JSON.stringify(rawMaterials));
    localStorage.setItem('g_stock', JSON.stringify(stockLevels));
    localStorage.setItem('g_recipes', JSON.stringify(recipes));
    localStorage.setItem('g_tables', JSON.stringify(tables));
    localStorage.setItem('g_logs', JSON.stringify(logs));
}

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

// --- 3. POKLADNA (Stoly a Markování) ---
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

function renderMenu() {
    const container = document.getElementById('menu-items');
    const catsContainer = document.getElementById('menu-cats');
    const dishes = recipes.filter(r => r.type === 'dish');
    const cats = [...new Set(dishes.map(r => r.cat))];

    catsContainer.innerHTML = cats.map(c => `<button onclick="filterMenu('${c}')">${c.toUpperCase()}</button>`).join('');
    filterMenu(cats[0] || '');
}

function filterMenu(cat) {
    const container = document.getElementById('menu-items');
    container.innerHTML = recipes.filter(r => r.type === 'dish' && r.cat === cat).map(r => `
        <button class="menu-item" onclick="addItem(${r.id})">${r.name}<br>${r.price} Kc</button>
    `).join('');
}

function addItem(id) {
    const item = recipes.find(r => r.id === id);
    activeTable.items.push({...item, time: new Date().toISOString()});
    activeTable.status = 'occupied';
    save();
    renderBill();
}

function renderBill() {
    const list = document.getElementById('bill-list');
    let total = 0;
    list.innerHTML = activeTable.items.map(i => {
        total += i.price;
        return `<div class="bill-row"><span>${i.name}</span><b>${i.price} Kc</b></div>`;
    }).join('');
    document.getElementById('bill-total').innerText = total;
}

// --- 4. TISK A PLACENÍ (Odtěžování skladu) ---
async function payWithPrint() {
    if (!activeTable.items.length) return;
    
    activeTable.items.forEach(item => {
        deductStock(item.id);
        logs.push({ date: new Date().toISOString(), name: item.name, price: item.price });
    });

    activeTable.items = [];
    activeTable.status = 'free';
    save();
    showTables();
    alert("Zaplaceno a odtezeno ze skladu.");
}

function deductStock(rid, mult = 1) {
    const r = recipes.find(x => x.id === rid);
    if (!r) return;
    r.ingredients.forEach(ing => {
        if (ing.type === 'sub') deductStock(ing.id, ing.amount * mult);
        else stockLevels[ing.id] = (stockLevels[ing.id] || 0) - (ing.amount * mult);
    });
}

// --- 5. ADMIN SEKCE (Dashboard a Sklad) ---
function renderDashboard() {
    const container = document.getElementById('admin-content');
    const today = new Date().toLocaleDateString();
    const todayTotal = logs.filter(l => new Date(l.date).toLocaleDateString() === today)
                           .reduce((a, b) => a + b.price, 0);

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card"><h3>Trzba dnes</h3><h2>${todayTotal} Kc</h2></div>
            <canvas id="revChart" style="background:#1e293b; padding:10px; border-radius:10px;"></canvas>
        </div>
    `;
    // Zde by prisel Chart.js kod pro grafy
}

function renderInventoryEditor() {
    const container = document.getElementById('admin-content');
    container.innerHTML = `
        <h3>Sklad: Bar a Kuchyn</h3>
        <table>
            <tr><th>Polozka</th><th>Skladem</th><th>Sekce</th></tr>
            ${rawMaterials.map(rm => `
                <tr><td>${rm.name}</td><td>${stockLevels[rm.id] || 0} ${rm.unit}</td><td>${rm.section}</td></tr>
            `).join('')}
        </table>
    `;
}

function renderRecipeEditor() {
    const container = document.getElementById('admin-content');
    container.innerHTML = `
        <h3>Receptury</h3>
        <button class="btn-pay" onclick="alert('Editor receptu v teto verzi zjednodusen.')">+ Nova receptura</button>
        ${recipes.map(r => `<div class="bill-row">${r.name} - ${r.price || 'polotovar'} Kc</div>`).join('')}
    `;
}

// --- 6. BLUETOOTH TISKÁRNA ---
async function connectPrinter() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        const chars = await service.getCharacteristics();
        printerCharacteristic = chars.find(c => c.properties.write);
        document.getElementById('btn-connect-prn').style.background = "#22c55e";
        alert("Tiskarna pripojena!");
    } catch (e) { alert("Chyba tiskarny: " + e.message); }
}

// Start aplikace
init();
