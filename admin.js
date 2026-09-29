/* =========================================
   DWAYT ADMIN — INVENTORY + ORDERS
   Requires config.js, products.js, store.js.
   Login = ADMIN_EMAIL / ADMIN_PASSWORD in config.js
========================================= */

const adminLoginModal = document.getElementById("adminLoginModal");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminUsername = document.getElementById("adminUsername");
const adminPassword = document.getElementById("adminPassword");
const adminLoginError = document.getElementById("adminLoginError");
const adminDashboard = document.getElementById("adminDashboard");
const adminLogout = document.getElementById("adminLogout");
const inventoryTableBody = document.getElementById("inventoryTableBody");
const adminTotalProducts = document.getElementById("adminTotalProducts");
const adminTotalStock = document.getElementById("adminTotalStock");
const adminLowStock = document.getElementById("adminLowStock");
const adminOutOfStock = document.getElementById("adminOutOfStock");

const STATUSES = [
    ["to_ship", "TO SHIP"],
    ["to_receive", "TO RECEIVE"],
    ["completed", "COMPLETED"],
    ["cancelled", "CANCELLED"]
];


function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function getProduct(productId) {
    return productsData.find(product => product.id === productId);
}

/* SHOW / HIDE */

function showDashboard() {
    adminLoginModal.classList.remove("active");
    adminDashboard.classList.add("active");
    document.body.classList.remove("admin-locked");
    refreshAll();
}

function showLogin() {
    adminDashboard.classList.remove("active");
    adminLoginError.textContent = "";
    adminLoginForm.reset();
    adminLoginModal.classList.add("active");
    document.body.classList.add("admin-locked");
    adminUsername.focus();
}


/* LOGIN */

adminLoginForm.addEventListener("submit", event => {

    event.preventDefault();

    try {
        Store.adminLogin(adminUsername.value, adminPassword.value);
        showDashboard();
    } catch (error) {
        adminLoginError.textContent = error.message.toUpperCase();
        adminPassword.value = "";
    }

});

adminLogout.addEventListener("click", () => {
    Store.adminLogout();
    showLogin();
});


/* STOCK (saved in this browser) */

function loadStock() {
    const inventory = Store.getStock();
    productsData.forEach(p => { if (inventory[p.id] !== undefined) { p.stock = inventory[p.id]; } });
}

function renderInventory() {

    inventoryTableBody.innerHTML = "";

    let totalStock = 0, lowStockCount = 0, outOfStockCount = 0;

    productsData.forEach(product => {

        totalStock += product.stock;

        let statusText = "IN STOCK", statusClass = "in-stock";

        if (product.stock === 0) {
            outOfStockCount++; statusText = "OUT OF STOCK"; statusClass = "out-of-stock";
        } else if (product.stock <= 5) {
            lowStockCount++; statusText = "LOW STOCK"; statusClass = "low-stock";
        }

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="inventory-product">
                    <img src="${esc(product.image)}" alt="${esc(product.name)}">
                    <span class="inventory-product-name">${esc(product.name)}</span>
                </div>
            </td>
            <td><span class="inventory-category">${esc(product.category)}</span></td>
            <td>₱${product.price.toLocaleString()}</td>
            <td>
                <input type="number" class="stock-input" min="0"
                    value="${product.stock}" id="stock-input-${esc(product.id)}">
            </td>
            <td><span class="inventory-status ${statusClass}">${statusText}</span></td>
            <td>
                <button type="button" class="save-stock-btn"
                    onclick="saveProductStock('${esc(product.id)}')">SAVE</button>
            </td>`;

        inventoryTableBody.appendChild(row);

    });

    adminTotalProducts.textContent = productsData.length;
    adminTotalStock.textContent = totalStock;
    adminLowStock.textContent = lowStockCount;
    adminOutOfStock.textContent = outOfStockCount;

}

function saveProductStock(productId) {

    const product = getProduct(productId);
    const input = document.getElementById(`stock-input-${productId}`);

    if (!product || !input) { return; }

    const newStock = Number(input.value);

    if (!Number.isFinite(newStock) || newStock < 0) {
        alert("Please enter a valid stock quantity.");
        input.value = product.stock;
        return;
    }

    try {
        Store.setStock(productId, Math.floor(newStock));
        loadStock();
        renderInventory();
        alert(`${product.name} stock updated to ${product.stock}.`);
    } catch (error) {
        alert(error.message);
    }

}


/* ORDERS */

function paymentLabel(order) {
    if (order.payment === "paid") { return "PAID ✓"; }
    if (order.payment === "cod") { return "CASH ON DELIVERY"; }
    return "VERIFY IN GCASH/MAYA";
}

function loadOrders() {

    const body = document.getElementById("ordersTableBody");

    try {

        const orders = Store.listOrders();

        body.innerHTML = orders.length ? "" : '<tr><td colspan="6">No orders yet.</td></tr>';

        orders.forEach(order => {

            const paid = order.payment === "paid";
            const locked = order.status === "cancelled";

            const items = order.items.map(i =>
                `${esc(i.name)}${i.size ? " — <strong>SIZE " + esc(i.size) + "</strong>" : ""} × ${i.quantity}`
            ).join("<br>");

            const options = STATUSES.map(([value, label]) =>
                `<option value="${value}" ${order.status === value ? "selected" : ""}>${label}</option>`
            ).join("");

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${esc(order.orderNumber)}<br><small>${new Date(order.createdAt).toLocaleString()}</small></td>
                <td>${esc(order.customerName)}<br>${esc(order.customerEmail)}<br>${esc(order.customerPhone)}<br><small>${esc(order.customerAddress)}</small></td>
                <td class="order-items">${items}</td>
                <td>₱${order.total.toLocaleString()}<br><small>${esc(order.method)}</small></td>
                <td>
                    <span class="inventory-status ${paid ? "in-stock" : "low-stock"}">${paymentLabel(order)}</span>
                    ${order.reference ? `<br><small>REF: ${esc(order.reference)}</small>` : ""}
                    ${order.payment === "submitted" && !locked ? `<br>
                        <button type="button" class="save-stock-btn" onclick="verifyPayment('${esc(order.orderNumber)}')">MARK PAID</button>
                        <button type="button" class="save-stock-btn" onclick="editReference('${esc(order.orderNumber)}')">EDIT REF</button>` : ""}
                </td>
                <td>
                    <select class="order-select" ${locked ? "disabled" : ""}
                        onchange="changeOrderStatus('${esc(order.orderNumber)}', this)">${options}</select>
                </td>`;

            body.appendChild(row);

        });

    } catch (error) {
        body.innerHTML = `<tr><td colspan="6">${esc(error.message)}</td></tr>`;
    }

}

function verifyPayment(orderNumber) {

    if (!confirm(`Mark ${orderNumber} as PAID?\n\nOnly do this after you see this reference number AND the exact amount in your GCash/Maya history.`)) {
        return;
    }

    try {
        Store.markPaid(orderNumber);
    } catch (error) {
        alert(error.message);
    }

    refreshAll();

}

function editReference(orderNumber) {

    const reference = prompt("Enter the corrected reference number (from the customer's receipt):");

    if (!reference) { return; }

    try {
        Store.editReference(orderNumber, reference);
    } catch (error) {
        alert(error.message);
    }

    refreshAll();

}

function changeOrderStatus(orderNumber, select) {

    const status = select.value;

    if (status === "cancelled" &&
        !confirm(`Cancel ${orderNumber}? The items go back into stock. This can't be undone.`)) {
        loadOrders();
        return;
    }

    try {
        Store.setStatus(orderNumber, status);
    } catch (error) {
        alert(error.message);
    }

    refreshAll();

}


function refreshAll() {
    loadStock();
    renderInventory();
    loadOrders();
}


/* IMPORT ORDERS (from the order emails) */

document.getElementById("importOrderBtn").addEventListener("click", () => {

    const box = document.getElementById("importCode");
    const message = document.getElementById("importMessage");

    const result = Store.importOrders(box.value);

    message.textContent =
        `IMPORTED: ${result.added}  |  ALREADY HERE: ${result.skipped}  |  INVALID: ${result.failed}`;

    if (result.added && !result.failed) { box.value = ""; }

    refreshAll();

});


/* PUBLISH (download store-data.json, then upload it to GitHub) */

document.getElementById("publishBtn").addEventListener("click", () => {

    const data = Store.buildPublishData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "store-data.json";
    document.body.appendChild(link);
    link.click();
    link.remove();

    alert("Downloaded store-data.json.\n\nUpload it to your GitHub repo (same folder as index.html) and replace the old file. Customers see the update after GitHub finishes publishing (about 1 minute).");

});

setInterval(() => {
    const active = document.activeElement;
    if (adminDashboard.classList.contains("active") &&
        !(active && (active.tagName === "INPUT" || active.tagName === "SELECT" || active.tagName === "TEXTAREA"))) {
        refreshAll();
    }
}, 15000);


/* INITIALIZE */

if (Store.isAdmin()) {
    showDashboard();
} else {
    showLogin();
}
