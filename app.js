let recipes = JSON.parse(localStorage.getItem('g_recipes')) || [
    { id: 202, name: "Pivo 12", price: 55 }
];
let tables = JSON.parse(localStorage.getItem('g_tables')) || Array.from({length: 8}, (_, i) => ({
    id: i + 1, name: "Stul " + (i + 1), items: [], status: 'free'
}));
let logs = JSON.parse(localStorage.getItem('g_logs')) || [];
let activeTable = null;

function save() {
    localStorage.setItem('g_tables', JSON.stringify(tables));
    localStorage.setItem('g_logs', JSON.stringify(logs));
}

function init() {
    const grid = document.getElementById('tables-grid');
    if (!grid) return;
    grid.innerHTML = '';
    tables.forEach(t => {
        const div = document.createElement('div');
        div.className = "table " + t.status;
        let sum = 0;
        t.items.forEach(i => sum += i.price);
        div.innerHTML = "<b>" + t.name + "</b><br>" + (sum > 0 ? sum + " Kc" : "Volno");
        div.onclick = function() { openTable(t); };
        grid.appendChild(div);
    });
}

function openTable(t) {
    activeTable = t;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-order').classList.remove('hidden');
    document.getElementById('active-table-title').innerText = t.name;
    renderMenu();
    renderBill();
}

function renderMenu() {
    const container = document.getElementById('menu-items');
    container.innerHTML = '';
    recipes.forEach(r => {
        const btn = document.createElement('button');
        btn.className = "menu-item";
        btn.innerHTML = r.name + "<br>" + r.price + " Kc";
        btn.onclick = function() { addItem(r.id); };
        container.appendChild(btn);
    });
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
    let total = 0;
    list.innerHTML = '';
    activeTable.items.forEach(i => {
        total += i.price;
        list.innerHTML += "<div>" + i.name + " - " + i.price + " Kc</div>";
    });
    document.getElementById('bill-total').innerText = total;
}

function payWithPrint() {
    activeTable.items.forEach(item => {
        logs.push({ date: new Date().toISOString(), name: item.name, price: item.price });
    });
    activeTable.items = [];
    activeTable.status = 'free';
    save();
    showTables();
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

function renderDashboard() {
    const cont = document.getElementById('admin-content');
    let total = 0;
    logs.forEach(l => total += l.price);
    cont.innerHTML = "<h3>Trzba: " + total + " Kc</h3><p>Objednavek: " + logs.length + "</p>";
}

function renderInventoryEditor() {
    document.getElementById('admin-content').innerHTML = "<h3>Sklad je v teto verzi automaticky.</h3>";
}

function renderRecipeEditor() {
    document.getElementById('admin-content').innerHTML = "<h3>Recepty lze upravit v kodu app.js.</h3>";
}

window.onload = init;

