// --- DATA ---
let recipes = JSON.parse(localStorage.getItem('g_recipes')) || [];
let logs = JSON.parse(localStorage.getItem('g_logs')) || []; // Historie prodejů
let tables = JSON.parse(localStorage.getItem('g_tables')) || Array.from({length: 8}, (_, i) => ({ id: i+1, name: `Stul ${i+1}`, items: [], status: 'free' }));
let activeTable = null;

// --- DASHBOARD LOGIKA ---
function renderDashboard() {
    const container = document.getElementById('admin-content');
    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <h3>Tržba dnes</h3>
                <h2 id="today-total">0 Kč</h2>
            </div>
            <div class="stat-card">
                <h3>Top produkty</h3>
                <canvas id="topProductsChart"></canvas>
            </div>
            <div class="stat-card" style="grid-column: span 2;">
                <h3>Vývoj tržeb (posledních 7 dní)</h3>
                <canvas id="revenueChart"></canvas>
            </div>
        </div>
    `;

    updateStats();
}

function updateStats() {
    const today = new Date().toLocaleDateString();
    const todayLogs = logs.filter(l => new Date(l.date).toLocaleDateString() === today);
    const total = todayLogs.reduce((a, b) => a + b.price, 0);
    document.getElementById('today-total').innerText = `${total} Kč`;

    // Graf top produktů
    const counts = {};
    logs.forEach(l => counts[l.name] = (counts[l.name] || 0) + 1);
    const topLabels = Object.keys(counts).slice(0, 5);
    const topData = Object.values(counts).slice(0, 5);

    new Chart(document.getElementById('topProductsChart'), {
        type: 'doughnut',
        data: {
            labels: topLabels,
            datasets: [{ data: topData, backgroundColor: ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'] }]
        },
        options: { plugins: { legend: { labels: { color: 'white' } } } }
    });

    // Graf vývoje tržeb (zjednodušený demo vývoj)
    const days = [...Array(7).keys()].map(i => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString();
    }).reverse();

    const revenuePerDay = days.map(day => {
        return logs.filter(l => new Date(l.date).toLocaleDateString() === day).reduce((a, b) => a + b.price, 0);
    });

    new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
            labels: days,
            datasets: [{ label: 'Tržba v Kč', data: revenuePerDay, borderColor: '#3b82f6', tension: 0.3 }]
        },
        options: { scales: { y: { ticks: { color: 'white' } }, x: { ticks: { color: 'white' } } } }
    });
}

// --- POKLADNA A TISK ---
function payWithPrint() {
    if (!activeTable.items.length) return;
    const total = activeTable.items.reduce((a, b) => a + b.price, 0);

    // Uložení do historie pro dashboard
    activeTable.items.forEach(item => {
        logs.push({
            date: new Date().toISOString(),
            name: item.name,
            price: item.price
        });
    });

    alert(`Zaplaceno ${total} Kč. Účtenka uložena do statistik.`);
    activeTable.items = [];
    activeTable.status = 'free';
    save();
    showTables();
}

// Pomocné funkce navigace a init
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

function save() {
    localStorage.setItem('g_tables', JSON.stringify(tables));
    localStorage.setItem('g_logs', JSON.stringify(logs));
    localStorage.setItem('g_recipes', JSON.stringify(recipes));
}

function init() {
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = '';
    tables.forEach(t => {
        const div = document.createElement('div');
        div.className = `table ${t.status}`;
        let sum = t.items.reduce((a, b) => a + b.price, 0);
        div.innerHTML = `<b>${t.name}</b><br>${sum > 0 ? sum + ' Kč' : 'Volno'}`;
        div.onclick = () => openTable(t);
        grid.appendChild(div);
    });
    renderMenu();
}

function renderMenu() {
    const container = document.getElementById('menu-items');
    container.innerHTML = recipes.filter(r => r.type === 'dish').map(r => `
        <button class="menu-item" onclick="addItem(${r.id})">${r.name}<br>${r.price} Kč</button>
    `).join('');
    
    const cats = [...new Set(recipes.filter(r => r.type === 'dish').map(r => r.cat))];
    document.getElementById('menu-cats').innerHTML = cats.map(c => `<button onclick="renderMenuCat('${c}')">${c.toUpperCase()}</button>`).join('');
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
    list.innerHTML = activeTable.items.map(i => {
        total += i.price;
        return `<div class="bill-row"><span>${i.name}</span><b>${i.price} Kč</b></div>`;
    }).join('');
    document.getElementById('bill-total').innerText = total;
}

init();
