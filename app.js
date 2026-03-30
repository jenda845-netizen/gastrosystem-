<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Gastro ERP</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <header>
            <div id="user-info">👤 Admin</div>
            <h1 onclick="showTables()">GASTRO ERP</h1>
            <div class="header-btns">
                <button id="btn-connect-prn" onclick="connectPrinter()">🔌 TISKÁRNA</button>
                <button onclick="showAdmin()">⚙️ ADMIN</button>
            </div>
        </header>

        <div id="screen-tables" class="screen">
            <div id="tables-grid"></div>
        </div>

        <div id="screen-order" class="screen hidden">
            <div class="order-container">
                <div class="menu-side">
                    <div id="menu-cats" class="categories"></div>
                    <div id="menu-items"></div>
                </div>
                <div class="bill-side">
                    <div class="bill-header">
                        <h2 id="active-table-title">Stůl</h2>
                        <button onclick="showTables()">Zpět ❌</button>
                    </div>
                    <div id="bill-list"></div>
                    <div class="bill-footer">
                        <div class="total-row">CELKEM: <span id="bill-total">0</span> Kč</div>
                        <button class="btn-pay" onclick="payWithPrint()">ZAPLATIT 💳</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="screen-admin" class="screen hidden">
            <div class="admin-tabs">
                <button onclick="renderDashboard()">📈 DASHBOARD</button>
                <button onclick="renderInventoryEditor()">📦 SKLAD</button>
                <button onclick="renderRecipeEditor()">📜 RECEPTY</button>
            </div>
            <div id="admin-content" class="admin-panel">
                </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
