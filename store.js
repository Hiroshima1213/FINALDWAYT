/* =========================================
   DWAYT STORE DATA  (replaces db.js + Supabase)
   No server. Orders and stock are saved in
   this browser (localStorage). Owner and
   customers are connected through:
     1) the order email (contains an ORDER CODE)
     2) store-data.json (uploaded to GitHub)
   Requires config.js and products.js.
========================================= */

const Store = (function () {

    const cfg = window.DWAYT_CONFIG || {};

    const ORDERS_KEY = "dwaytOrders";
    const STOCK_KEY = "dwaytStock";
    const VERSION_KEY = "dwaytDataVersion";
    const ADMIN_KEY = "dwaytAdminOK";

    const STATUSES = ["to_ship", "to_receive", "completed", "cancelled"];
    const SIZES = ["S", "M", "L", "XL"];
    const SIZED = ["Tops", "Bottoms", "Dresses"];
    const CODE_PREFIX = "DWAYT1:";

    /* starting stock from products.js (captured once) */
    const DEFAULT_STOCK = {};
    productsData.forEach(function (p) { DEFAULT_STOCK[p.id] = p.stock; });


    /* ---------- tiny helpers ---------- */

    function read(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value === null || value === undefined ? fallback : value;
        } catch (e) { return fallback; }
    }

    function write(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; }
        catch (e) { return false; }
    }

    function clean(value, max) {
        return String(value == null ? "" : value).trim().slice(0, max || 300);
    }

    function findProduct(id) {
        return productsData.find(function (p) { return p.id === id; });
    }

    /* SHA-256 (used to hide customer emails in store-data.json) */
    function sha256(ascii) {
        ascii = unescape(encodeURIComponent(ascii));
        const rr = function (v, a) { return (v >>> a) | (v << (32 - a)); };
        const maxWord = Math.pow(2, 32);
        const hash = [], k = [];
        const isComposite = {};
        let primeCounter = 0, i, j, result = "";
        for (let candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (i = 0; i < 313; i += candidate) { isComposite[i] = candidate; }
                hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
                k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
            }
        }
        const bitLength = ascii.length * 8;
        ascii += "\x80";
        while (ascii.length % 64 - 56) { ascii += "\x00"; }
        const words = [];
        for (i = 0; i < ascii.length; i++) {
            words[i >> 2] |= ascii.charCodeAt(i) << ((3 - i) % 4) * 8;
        }
        words[words.length] = (bitLength / maxWord) | 0;
        words[words.length] = bitLength;
        let h = hash.slice(0, 8);
        for (j = 0; j < words.length;) {
            const w = words.slice(j, j += 16);
            const old = h;
            h = h.slice(0, 8);
            for (i = 0; i < 64; i++) {
                const w15 = w[i - 15], w2 = w[i - 2];
                const a = h[0], e = h[4];
                const t1 = h[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & h[5]) ^ (~e & h[6])) + k[i] +
                    (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] +
                        (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
                const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]));
                h = [(t1 + t2) | 0].concat(h);
                h[4] = (h[4] + t1) | 0;
            }
            for (i = 0; i < 8; i++) { h[i] = (h[i] + old[i]) | 0; }
        }
        for (i = 0; i < 8; i++) {
            for (j = 3; j + 1; j--) {
                const b = (h[i] >> (j * 8)) & 255;
                result += (b < 16 ? "0" : "") + b.toString(16);
            }
        }
        return result;
    }

    function trackHash(number, email) {
        return sha256(String(number).toUpperCase() + "|" + String(email).trim().toLowerCase());
    }


    /* ---------- reference numbers ---------- */

    function checkRef(method, ref) {
        if (method === "Maya") {
            if (!/^[A-Za-z0-9-]{6,30}$/.test(ref)) {
                throw new Error("Please enter a valid reference number from your payment receipt.");
            }
        } else if (!/^\d{13}$/.test(ref)) {
            throw new Error("Please enter a valid reference number from your payment receipt (GCash: 13 digits).");
        }
    }

    function refInUse(orders, ref, exceptNumber) {
        return orders.some(function (o) {
            return o.orderNumber !== exceptNumber && o.status !== "cancelled" &&
                o.reference && o.reference.toLowerCase() === ref.toLowerCase();
        });
    }


    /* ---------- stock ---------- */

    function getStock() {
        const saved = read(STOCK_KEY, {});
        const out = {};
        productsData.forEach(function (p) {
            const n = Number(saved[p.id]);
            out[p.id] = (saved[p.id] !== undefined && Number.isFinite(n))
                ? Math.max(0, Math.floor(n)) : DEFAULT_STOCK[p.id];
        });
        return out;
    }

    function setStock(productId, amount) {
        if (!findProduct(productId)) { throw new Error("Invalid product."); }
        amount = Math.floor(Number(amount));
        if (!Number.isFinite(amount) || amount < 0) { throw new Error("Invalid stock."); }
        const stock = getStock();
        stock[productId] = amount;
        write(STOCK_KEY, stock);
        return stock;
    }


    /* ---------- order codes (sent to you in the order email) ---------- */

    function encodeOrder(order) {
        return CODE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(order))));
    }

    function decodeOrder(text) {

        let raw;
        try {
            raw = JSON.parse(decodeURIComponent(escape(atob(text.replace(/\s+/g, "")))));
        } catch (e) { throw new Error("Invalid order code."); }

        if (!raw || !/^DWAYT-\d{6}$/.test(String(raw.orderNumber)) ||
            !Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > 50) {
            throw new Error("Invalid order code.");
        }

        /* prices and names are rebuilt from products.js, payment is never trusted */
        let subtotal = 0;
        const items = raw.items.map(function (it) {
            const prod = findProduct(it.productId);
            const q = Math.floor(Number(it.quantity));
            if (!prod || !(q >= 1) || q > 20) { throw new Error("Invalid order code."); }
            subtotal += prod.price * q;
            return {
                productId: prod.id, name: prod.name, price: prod.price,
                size: SIZED.indexOf(prod.category) !== -1 && SIZES.indexOf(it.size) !== -1 ? it.size : "",
                quantity: q
            };
        });

        const method = raw.method === "GCash" || raw.method === "Maya" ? raw.method : "Cash on Delivery";
        const shipping = Number(raw.shipping) === 180 ? 180 : 100;
        const created = new Date(raw.createdAt);

        return {
            orderNumber: raw.orderNumber,
            items: items,
            shipping: shipping,
            total: subtotal + shipping,
            method: method,
            payment: method === "Cash on Delivery" ? "cod" : "submitted",
            reference: method === "Cash on Delivery" ? "" : clean(raw.reference, 30),
            status: "to_ship",
            createdAt: isNaN(created) ? new Date().toISOString() : created.toISOString(),
            updatedAt: Date.now(),
            paidAt: null,
            cancelledAt: null,
            customerName: clean(raw.customerName),
            customerEmail: clean(raw.customerEmail).toLowerCase(),
            customerPhone: clean(raw.customerPhone),
            customerAddress: clean(raw.customerAddress),
            orderNotes: clean(raw.orderNotes)
        };
    }

    /* paste one or many codes (from the order emails) */
    function importOrders(text) {

        const result = { added: 0, skipped: 0, failed: 0 };
        const chunks = String(text || "").split(CODE_PREFIX).slice(1);
        const orders = read(ORDERS_KEY, []);
        const stock = getStock();

        chunks.forEach(function (chunk) {
            try {
                const order = decodeOrder(chunk);
                if (orders.some(function (o) { return o.orderNumber === order.orderNumber; })) {
                    result.skipped++;
                    return;
                }
                order.items.forEach(function (it) {
                    stock[it.productId] = Math.max(0, stock[it.productId] - it.quantity);
                });
                orders.unshift(order);
                result.added++;
            } catch (e) { result.failed++; }
        });

        if (!chunks.length) { result.failed = 1; }

        if (result.added) {
            orders.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
            write(ORDERS_KEY, orders);
            write(STOCK_KEY, stock);
        }

        return result;
    }


    /* ---------- CUSTOMER: place an order ---------- */

    function orderNumberExists(number) {
        return read(ORDERS_KEY, []).some(function (o) { return o.orderNumber === number; });
    }

    function placeOrder(p) {

        const orders = read(ORDERS_KEY, []);
        const number = String(p.orderNumber || "");

        if (!/^DWAYT-\d{6}$/.test(number)) { throw new Error("Bad order number."); }
        if (orders.some(function (o) { return o.orderNumber === number; })) {
            throw new Error("Order number already used, please try again.");
        }

        const name = clean(p.customerName);
        const email = clean(p.customerEmail).toLowerCase();
        if (!name || !email) { throw new Error("Please fill in your name and email."); }

        if (!Array.isArray(p.items) || p.items.length < 1 || p.items.length > 50) {
            throw new Error("Your bag is empty.");
        }

        const method = p.paymentMethod === "GCash" || p.paymentMethod === "Maya"
            ? p.paymentMethod : "Cash on Delivery";

        let reference = "";
        if (method !== "Cash on Delivery") {
            reference = String(p.reference || "").replace(/\s+/g, "");
            checkRef(method, reference);
            if (refInUse(orders, reference, number)) {
                throw new Error("This reference number was already used on another order.");
            }
        }

        /* check everything first, then reserve stock (all or nothing) */
        const stock = getStock();
        const need = {};
        let subtotal = 0;

        const lines = p.items.map(function (it) {
            const prod = findProduct(it.productId);
            const q = Math.floor(Number(it.quantity));
            if (!prod || !(q >= 1) || q > 20) { throw new Error("Invalid item in bag."); }
            let size = String(it.size || "");
            if (SIZED.indexOf(prod.category) !== -1) {
                if (SIZES.indexOf(size) === -1) { throw new Error("Please choose a size for " + prod.name + "."); }
            } else { size = ""; }
            need[prod.id] = (need[prod.id] || 0) + q;
            subtotal += prod.price * q;
            return { productId: prod.id, name: prod.name, price: prod.price, size: size, quantity: q };
        });

        Object.keys(need).forEach(function (id) {
            if (stock[id] < need[id]) { throw new Error("Not enough stock for " + findProduct(id).name + "."); }
        });
        Object.keys(need).forEach(function (id) { stock[id] -= need[id]; });

        const shipping = Number(p.shipping) === 180 ? 180 : 100;

        const order = {
            orderNumber: number,
            items: lines,
            shipping: shipping,
            total: subtotal + shipping,
            method: method,
            payment: method === "Cash on Delivery" ? "cod" : "submitted",
            reference: reference,
            status: "to_ship",
            createdAt: new Date().toISOString(),
            updatedAt: Date.now(),
            paidAt: null,
            cancelledAt: null,
            customerName: name,
            customerEmail: email,
            customerPhone: clean(p.customerPhone),
            customerAddress: clean(p.customerAddress),
            orderNotes: clean(p.orderNotes)
        };

        orders.unshift(order);

        if (!write(ORDERS_KEY, orders) || !write(STOCK_KEY, stock)) {
            throw new Error("Your browser blocked saving the order. Turn off private browsing and try again.");
        }

        return { order: order, code: encodeOrder(order) };
    }


    /* ---------- published data (store-data.json on GitHub) ---------- */

    async function fetchPublished() {
        const response = await fetch("store-data.json?t=" + Date.now(), { cache: "no-store" });
        if (!response.ok) { return null; }
        return response.json();
    }

    /* customers pick up the stock the owner published */
    async function loadPublished() {
        try {
            const data = await fetchPublished();
            if (data && data.version && String(data.version) !== String(read(VERSION_KEY, ""))) {
                if (data.stock && typeof data.stock === "object") { write(STOCK_KEY, data.stock); }
                write(VERSION_KEY, data.version);
            }
        } catch (e) { /* file not uploaded yet: that's fine */ }
    }

    /* owner: builds the file to upload to GitHub */
    function buildPublishData() {
        const version = Date.now();
        const orders = {};
        read(ORDERS_KEY, []).forEach(function (o) {
            orders[o.orderNumber] = {
                s: o.status, p: o.payment, u: o.updatedAt,
                eh: trackHash(o.orderNumber, o.customerEmail)
            };
        });
        write(VERSION_KEY, version);
        return { version: version, stock: getStock(), orders: orders };
    }


    /* ---------- CUSTOMER: track an order ---------- */

    async function trackOrder(number, email) {

        number = clean(number).toUpperCase();
        email = clean(email).toLowerCase();

        const local = read(ORDERS_KEY, []).find(function (o) {
            return o.orderNumber === number && o.customerEmail === email;
        });

        let published = null;
        try {
            const data = await fetchPublished();
            const record = data && data.orders && data.orders[number];
            if (record && record.eh === trackHash(number, email)) { published = record; }
        } catch (e) { /* offline or no file yet */ }

        if (!local && !published) {
            throw new Error("We couldn't find that order. Check the order number and email.");
        }

        /* whichever copy changed last wins */
        const usePublished = published && (!local || Number(published.u) > Number(local.updatedAt || 0));

        return {
            orderNumber: number,
            status: usePublished ? published.s : local.status,
            payment: usePublished ? published.p : local.payment,
            items: local ? local.items : null,
            total: local ? local.total : null
        };
    }


    /* ---------- ADMIN ---------- */

    function adminLogin(email, password) {
        if (!cfg.ADMIN_EMAIL || !cfg.ADMIN_PASSWORD) {
            throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in config.js first.");
        }
        const ok = clean(email).toLowerCase() === String(cfg.ADMIN_EMAIL).trim().toLowerCase() &&
                   password === cfg.ADMIN_PASSWORD;
        if (!ok) { throw new Error("Invalid email or password."); }
        try { sessionStorage.setItem(ADMIN_KEY, "1"); } catch (e) {}
    }

    function adminLogout() {
        try { sessionStorage.removeItem(ADMIN_KEY); } catch (e) {}
    }

    function isAdmin() {
        try { return sessionStorage.getItem(ADMIN_KEY) === "1"; } catch (e) { return false; }
    }

    function listOrders() {
        return read(ORDERS_KEY, []);
    }

    function change(number, action) {
        const orders = read(ORDERS_KEY, []);
        const order = orders.find(function (o) { return o.orderNumber === number; });
        if (!order) { throw new Error("Order not found."); }
        action(order);
        order.updatedAt = Date.now();
        write(ORDERS_KEY, orders);
    }

    function setStatus(number, status) {

        if (STATUSES.indexOf(status) === -1) { throw new Error("Bad status."); }

        change(number, function (order) {

            if (order.status === "cancelled") { throw new Error("Cancelled orders can't be changed."); }
            if (order.status === status) { return; }

            if (status === "cancelled") {          /* cancelling puts the stock back */
                const stock = getStock();
                order.items.forEach(function (it) { stock[it.productId] += it.quantity; });
                write(STOCK_KEY, stock);
                order.cancelledAt = new Date().toISOString();
            }

            order.status = status;
        });
    }

    /* owner confirmed the money arrived in GCash / Maya */
    function markPaid(number) {
        change(number, function (order) {
            if (order.status === "cancelled" || order.payment !== "submitted") {
                throw new Error("Nothing to verify on this order.");
            }
            order.payment = "paid";
            order.paidAt = new Date().toISOString();
        });
    }

    function editReference(number, ref) {
        ref = String(ref || "").replace(/\s+/g, "");
        change(number, function (order) {
            if (order.payment !== "submitted") { throw new Error("This order has no reference to edit."); }
            checkRef(order.method, ref);
            if (refInUse(read(ORDERS_KEY, []), ref, number)) {
                throw new Error("Reference already used on another order.");
            }
            order.reference = ref;
        });
    }


    return {
        getStock: getStock,
        setStock: setStock,
        placeOrder: placeOrder,
        orderNumberExists: orderNumberExists,
        importOrders: importOrders,
        loadPublished: loadPublished,
        buildPublishData: buildPublishData,
        trackOrder: trackOrder,
        adminLogin: adminLogin,
        adminLogout: adminLogout,
        isAdmin: isAdmin,
        listOrders: listOrders,
        setStatus: setStatus,
        markPaid: markPaid,
        editReference: editReference,
        _sha256: sha256
    };

})();
