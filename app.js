// --- DATA ---
var account = "123456789/0100";
var rawMaterials = [{ id: 1, name: "Pivo Sud 12", unit: "ml" }];
var stock = { "1": 50000 };
var recipes = [{ id: 101, name: "Pivo 0.5l", price: 55, ing: [{id: 1, qty: 500}] }];
var tables = [];
for (var i = 1; i <= 12; i++) {
    tables.push({ id: i, name: "Stul " + i, items: [], status: "free" });
}
var logs = [];
var activeTable = null;

// --- FUNKCE ---
function init() {
    var grid = document.getElementById("tables-grid");
    if (!grid) return;
    grid.innerHTML = "";
    tables.forEach(function(t) {
        var div = document.createElement("div");
        div.className = "table-box " + t.status;
        var sum = 0;
        t.items.forEach(function(item) { sum += item.price; });
        div.innerHTML = "<strong>" + t.name + "</strong><span>" + (sum > 0 ? sum + " Kc" : "Volno") + "</span>";
        div.onclick = function() { openOrder(t); };
        grid.appendChild(div);
    });
}

function openOrder(t) {
    activeTable = t;
    document.querySelectorAll(".screen").forEach(function(s) { s.classList.add("hidden"); });
    document.getElementById("screen-order").classList.remove("hidden");
    document.getElementById("active-table-title").innerText = t.name;
    renderMenu();
    updateBill();
}

function renderMenu() {
    var container = document.getElementById("menu-items");
    container.innerHTML = "";
    recipes.forEach(function(r) {
        var btn = document.createElement("button");
        btn.className = "m-btn";
        btn.innerHTML = r.name + "<br><b>" + r.price + " Kc</b>";
        btn.onclick = function() { addItem(r.id); };
        container.appendChild(btn);
    });
}

function addItem(id) {
    var r = recipes.find(function(x) { return x.id === id; });
    activeTable.items.push(Object.assign({}, r));
    activeTable.status = "occupied";
    updateBill();
}

function updateBill() {
    var list = document.getElementById("bill-list");
    var total = 0;
    list.innerHTML = "";
    activeTable.items.forEach(function(item) {
        total += item.price;
        list.innerHTML += "<div>" + item.name + " - " + item.price + " Kc</div>";
    });
    document.getElementById("bill-total").innerText = total;
}

function showTables() {
    document.querySelectorAll(".screen").forEach(function(s) { s.classList.add("hidden"); });
    document.getElementById("screen-tables").classList.remove("hidden");
    init();
}

function showAdmin() {
    document.querySelectorAll(".screen").forEach(function(s) { s.classList.add("hidden"); });
    document.getElementById("screen-admin").classList.remove("hidden");
    document.getElementById("admin-main-content").innerHTML = "<h3>Trzba: " + logs.reduce(function(a,b){return a+b.price}, 0) + " Kc</h3>";
}

function completePayment(method) {
    activeTable.items.forEach(function(item) {
        logs.push({ price: item.price, date: new Date() });
    });
    activeTable.items = [];
    activeTable.status = "free";
    showTables();
}

window.onload = init;
