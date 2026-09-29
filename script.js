/* =========================================
   DWAYT ORDER + INVENTORY SYSTEM
========================================= */


/* =========================================
   EMAILJS CONFIGURATION
========================================= */

const EMAILJS_PUBLIC_KEY = "KiB2QQmTWLi1BPHps";
const EMAILJS_SERVICE_ID = "service_k02limw";
const EMAILJS_TEMPLATE_ID = "template_n44s76f";


if (typeof emailjs !== "undefined") {

    emailjs.init({
        publicKey: EMAILJS_PUBLIC_KEY
    });

}


/* =========================================
   GCASH PAYMENT SETTINGS
   Change these 3 lines to your own details.
   Save your GCash QR as images/gcash-qr.jpg
========================================= */

const GCASH_ACCOUNT_NAME = "DWAYT";
const GCASH_NUMBER = "0961 623 4628";
const GCASH_QR_IMAGE = "images/gcash-qr.jpg";


/* =========================================
   CART
========================================= */

let cart = [];


/* =========================================
   SIZES, SAVED BAG, SERVER STOCK
========================================= */

const SIZES = ["S", "M", "L", "XL"];
const SIZED_CATEGORIES = ["Tops", "Bottoms", "Dresses"];
const CART_KEY = "dwaytCart";
let pendingSizeProduct = null;


function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (error) {}
}

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        cart = Array.isArray(saved)
            ? saved.filter(i => getProduct(i.productId) && i.quantity > 0)
            : [];
    } catch (error) { cart = []; }
}

function qtyInCart(productId) {
    return cart.filter(i => i.productId === productId)
        .reduce((total, i) => total + i.quantity, 0);
}

/* stock is saved in this browser; new numbers you publish (store-data.json) are picked up here */
async function syncInventory() {
    try {
        await Store.loadPublished();
        const inventory = Store.getStock();
        productsData.forEach(p => {
            if (inventory[p.id] !== undefined) { p.stock = Math.max(0, Number(inventory[p.id])); }
        });
        productsData.forEach(p => {
            let over = qtyInCart(p.id) - p.stock;
            for (let k = cart.length - 1; k >= 0 && over > 0; k--) {
                if (cart[k].productId === p.id) {
                    const cut = Math.min(over, cart[k].quantity);
                    cart[k].quantity -= cut; over -= cut;
                }
            }
        });
        cart = cart.filter(i => i.quantity > 0);
        updateCart();
        updateCheckoutSummary();
        updateProductStockLabels();
    } catch (error) { console.error("Stock sync:", error.message); }
}

function isValidReference(reference) {
    const method = document.querySelector('input[name="paymentMethod"]:checked');
    return method && method.value === "Maya"
        ? /^[A-Za-z0-9-]{6,30}$/.test(reference)
        : /^\d{13}$/.test(reference);
}

function orderPayload(orderNumber, method, e) {
    return {
        orderNumber: orderNumber,
        paymentMethod: method,
        shipping: getShippingFee(),
        items: cart.map(i => ({ productId: i.productId, size: i.size || "", quantity: i.quantity })),
        customerName: e.customer_name,
        customerEmail: e.customer_email,
        customerPhone: e.customer_phone,
        customerAddress: e.customer_address,
        orderNotes: e.order_notes,
        reference: gcashPaymentReference || ""
    };
}

function addToCart(product, size) {
    if (qtyInCart(product.id) >= product.stock) {
        alert(`Only ${product.stock} item(s) available in stock.`);
        return;
    }
    const existing = cart.find(i => i.productId === product.id && i.size === size);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ productId: product.id, name: product.name, price: product.price,
            image: product.image, size: size, quantity: 1 });
    }
    updateCart();
    openCart();
}

function openSizeModal(product) {
    pendingSizeProduct = product;
    document.getElementById("sizeProductName").textContent = product.name;
    document.getElementById("sizeOptions").innerHTML = SIZES.map(size => `
        <label class="payment-option">
            <input type="radio" name="sizeChoice" value="${size}">
            <span>${size}</span>
        </label>`).join("");
    document.getElementById("sizeError").textContent = "";
    document.getElementById("sizeModal").classList.add("active");
}

document.getElementById("closeSize").addEventListener("click", () => {
    document.getElementById("sizeModal").classList.remove("active");
});

document.getElementById("sizeConfirmBtn").addEventListener("click", () => {
    const choice = document.querySelector('input[name="sizeChoice"]:checked');
    if (!choice) {
        document.getElementById("sizeError").textContent = "PLEASE CHOOSE A SIZE.";
        return;
    }
    document.getElementById("sizeModal").classList.remove("active");
    addToCart(pendingSizeProduct, choice.value);
});



/* =========================================
   ELEMENTS
========================================= */

const cartBtn =
    document.getElementById("cartBtn");

const cartDrawer =
    document.getElementById("cartDrawer");

const cartOverlay =
    document.getElementById("cartOverlay");

const closeCart =
    document.getElementById("closeCart");

const cartItems =
    document.getElementById("cartItems");

const cartCount =
    document.getElementById("cartCount");

const cartSubtotal =
    document.getElementById("cartSubtotal");

const checkoutBtn =
    document.getElementById("checkoutBtn");

const checkoutModal =
    document.getElementById("checkoutModal");

const closeCheckout =
    document.getElementById("closeCheckout");

const checkoutItems =
    document.getElementById("checkoutItems");

const checkoutSubtotal =
    document.getElementById("checkoutSubtotal");

const checkoutShipping =
    document.getElementById("checkoutShipping");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const checkoutForm =
    document.getElementById("checkoutForm");

const deliveryOption =
    document.getElementById("deliveryOption");

const successModal =
    document.getElementById("successModal");

const successOrderNumber =
    document.getElementById("successOrderNumber");

const emailConfirmationText =
    document.getElementById("emailConfirmationText");

const closeSuccess =
    document.getElementById("closeSuccess");


/* =========================================
   PRODUCT HELPER
========================================= */

function getProduct(productId) {

    return productsData.find(
        product =>
            product.id === productId
    );

}


/* =========================================
   PRODUCT CARD HELPER
========================================= */

function getProductCards() {

    return document.querySelectorAll(
        ".product-card"
    );

}


function getProductCountText(count) {

    return `${String(count).padStart(2, "0")} PRODUCTS`;

}


/* =========================================
   ADD TO CART
   EVENT DELEGATION
   Works for all 32 products
========================================= */

const productGrid =
    document.getElementById("productGrid");


if (productGrid) {

    productGrid.addEventListener("click", event => {

        const button = event.target.closest(".add-cart");

        if (!button || button.disabled) { return; }

        const product = getProduct(button.dataset.productId);

        if (!product) { return; }

        if (product.stock <= 0) {
            alert("Sorry, this item is currently out of stock.");
            return;
        }

        if (SIZED_CATEGORIES.includes(product.category)) {
            openSizeModal(product);
        } else {
            addToCart(product, "");
        }

    });

}


/* =========================================
   UPDATE CART
========================================= */

function updateCart() {

    if (!cartItems) {

        return;

    }


    cartItems.innerHTML = "";


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <p class="empty-cart">
                Your bag is currently empty.
            </p>
        `;

    } else {

        cart.forEach(
            (item, index) => {

                const itemElement =
                    document.createElement("div");


                itemElement.className =
                    "cart-item";


                itemElement.innerHTML = `

                    <img
                        src="${item.image}"
                        alt="${item.name}"
                    >

                    <div>

                        <h4>
                            ${item.name}${item.size ? " — SIZE " + item.size : ""}
                        </h4>

                        <p>
                            ₱${item.price.toLocaleString()}
                        </p>

                        <div class="quantity-controls">

                            <button
                                type="button"
                                onclick="changeQuantity(${index}, -1)">
                                −
                            </button>

                            <span>
                                ${item.quantity}
                            </span>

                            <button
                                type="button"
                                onclick="changeQuantity(${index}, 1)">
                                +
                            </button>

                        </div>

                    </div>

                    <button
                        type="button"
                        class="remove-item"
                        onclick="removeItem(${index})">
                        REMOVE
                    </button>

                `;


                cartItems.appendChild(
                    itemElement
                );

            }
        );

    }


    const totalQuantity =
        cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );


    cartCount.textContent =
        totalQuantity;


    const subtotal =
        getSubtotal();


    cartSubtotal.textContent =
        `₱${subtotal.toLocaleString()}`;

    saveCart();


    updateProductStockLabels();

}


/* =========================================
   QUANTITY
========================================= */

function changeQuantity(
    index,
    amount
) {

    const item =
        cart[index];


    if (!item) {

        return;

    }


    const product =
        getProduct(
            item.productId
        );


    if (!product) {

        return;

    }


    if (
        amount > 0 &&
        qtyInCart(product.id) >= product.stock
    ) {

        alert(
            `Only ${product.stock} item(s) available in stock.`
        );

        return;

    }


    item.quantity += amount;


    if (item.quantity <= 0) {

        cart.splice(
            index,
            1
        );

    }


    updateCart();

    updateCheckoutSummary();

}


/* =========================================
   REMOVE
========================================= */

function removeItem(index) {

    if (
        index < 0 ||
        index >= cart.length
    ) {

        return;

    }


    cart.splice(
        index,
        1
    );


    updateCart();

    updateCheckoutSummary();

}


/* =========================================
   SUBTOTAL
========================================= */

function getSubtotal() {

    return cart.reduce(
        (total, item) =>
            total +
            item.price *
            item.quantity,
        0
    );

}


/* =========================================
   CART OPEN / CLOSE
========================================= */

function openCart() {

    cartDrawer.classList.add(
        "active"
    );

    cartOverlay.classList.add(
        "active"
    );

}


function closeCartDrawer() {

    cartDrawer.classList.remove(
        "active"
    );

    cartOverlay.classList.remove(
        "active"
    );

}


cartBtn.addEventListener(
    "click",
    openCart
);


closeCart.addEventListener(
    "click",
    closeCartDrawer
);


cartOverlay.addEventListener(
    "click",
    closeCartDrawer
);


/* =========================================
   CHECKOUT
========================================= */

checkoutBtn.addEventListener(
    "click",
    openCheckout
);


function openCheckout() {

    if (cart.length === 0) {

        alert(
            "Your bag is empty."
        );

        return;

    }


    for (
        const item of cart
    ) {

        const product =
            getProduct(
                item.productId
            );


        if (
            !product ||
            item.quantity >
            product.stock
        ) {

            alert(
                `${item.name} no longer has enough stock available.`
            );

            updateCart();

            return;

        }

    }


    closeCartDrawer();

    updateCheckoutSummary();

    checkoutModal.classList.add(
        "active"
    );

}


closeCheckout.addEventListener(
    "click",
    () => {

        checkoutModal.classList.remove(
            "active"
        );

    }
);


/* =========================================
   SHIPPING
========================================= */

function getShippingFee() {

    if (
        deliveryOption.value ===
        "Express Delivery - ₱180"
    ) {

        return 180;

    }


    return 100;

}


deliveryOption.addEventListener(
    "change",
    updateCheckoutSummary
);


/* =========================================
   CHECKOUT SUMMARY
========================================= */

function updateCheckoutSummary() {

    checkoutItems.innerHTML = "";


    cart.forEach(
        item => {

            const itemTotal =
                item.price *
                item.quantity;


            const row =
                document.createElement("div");


            row.className =
                "checkout-item";


            row.innerHTML = `

                <span>
                    ${item.name}${item.size ? " (" + item.size + ")" : ""} × ${item.quantity}
                </span>

                <strong>
                    ₱${itemTotal.toLocaleString()}
                </strong>

            `;


            checkoutItems.appendChild(
                row
            );

        }
    );


    const subtotal =
        getSubtotal();


    const shipping =
        getShippingFee();


    const total =
        subtotal +
        shipping;


    checkoutSubtotal.textContent =
        `₱${subtotal.toLocaleString()}`;


    checkoutShipping.textContent =
        `₱${shipping.toLocaleString()}`;


    checkoutTotal.textContent =
        `₱${total.toLocaleString()}`;

}


/* =========================================
   PRODUCT FILTER + SEARCH
========================================= */

const filterButtons =
    document.querySelectorAll(
        ".filter-btn"
    );


let activeFilter = "All";


function applyProductFilters() {

    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    let visibleCount = 0;


    getProductCards().forEach(
        product => {

            const category =
                product.dataset.category ||
                "";


            const name =
                product.dataset.name
                    ? product.dataset.name.toLowerCase()
                    : "";


            const categoryMatch =
                activeFilter === "All" ||
                category === activeFilter;


            const searchMatch =
                name.includes(search);


            if (
                categoryMatch &&
                searchMatch
            ) {

                product.style.display =
                    "";

                visibleCount++;

            } else {

                product.style.display =
                    "none";

            }

        }
    );


    if (productCount) {

        productCount.textContent =
            getProductCountText(
                visibleCount
            );

    }

}


filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                activeFilter =
                    button.dataset.filter;


                applyProductFilters();

            }
        );

    }
);


/* =========================================
   CATEGORY LINKS
========================================= */

document
    .querySelectorAll(
        "[data-filter-link]"
    )
    .forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    const filter =
                        link.dataset.filterLink;


                    const button =
                        document.querySelector(
                            `.filter-btn[data-filter="${filter}"]`
                        );


                    if (button) {

                        button.click();

                    }

                }
            );

        }
    );


/* =========================================
   SEARCH
========================================= */

const searchBtn =
    document.getElementById(
        "searchBtn"
    );

const searchBox =
    document.getElementById(
        "searchBox"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const productCount =
    document.getElementById(
        "productCount"
    );


searchBtn.addEventListener(
    "click",
    () => {

        searchBox.classList.toggle(
            "active"
        );


        if (
            searchBox.classList.contains(
                "active"
            )
        ) {

            searchInput.focus();

        }

    }
);


searchInput.addEventListener(
    "input",
    applyProductFilters
);


/* =========================================
   FAQ
========================================= */

document
    .querySelectorAll(
        ".faq-question"
    )
    .forEach(
        question => {

            question.addEventListener(
                "click",
                () => {

                    const current =
                        question.parentElement;


                    document
                        .querySelectorAll(
                            ".faq-item"
                        )
                        .forEach(
                            item => {

                                if (
                                    item !==
                                    current
                                ) {

                                    item.classList.remove(
                                        "active"
                                    );

                                }

                            }
                        );


                    current.classList.toggle(
                        "active"
                    );

                }
            );

        }
    );


/* =========================================
   ORDER NUMBER
========================================= */

function generateOrderNumber() {

    const randomNumber =
        Math.floor(
            100000 +
            Math.random() *
            900000
        );


    const number = `DWAYT-${randomNumber}`;

    return Store.orderNumberExists(number)
        ? generateOrderNumber()
        : number;

}


/* =========================================
   ORDER ITEMS FOR EMAIL
========================================= */

function createOrderItemsText() {

    return cart
        .map(
            item => {

                const itemTotal =
                    item.price *
                    item.quantity;


                return `${item.name}${item.size ? " (Size " + item.size + ")" : ""} x ${item.quantity} - ₱${itemTotal.toLocaleString()}`;

            }
        )
        .join("\n");

}


/* =========================================
   GCASH PAYMENT STEP
   1. Customer clicks PLACE ORDER with GCash
   2. GCash screen shows QR, number, amount
   3. Customer pays, enters the 13-digit
      reference number, then confirms
   4. Order is placed as "pending payment
      verification" and the owner checks
      the reference number in GCash
========================================= */

const gcashModal =
    document.getElementById("gcashModal");

const closeGcash =
    document.getElementById("closeGcash");

const gcashAmount =
    document.getElementById("gcashAmount");

const gcashOrderNumber =
    document.getElementById("gcashOrderNumber");

const gcashNumberText =
    document.getElementById("gcashNumberText");

const gcashAccountName =
    document.getElementById("gcashAccountName");

const gcashQrImage =
    document.getElementById("gcashQrImage");

const gcashCopyBtn =
    document.getElementById("gcashCopyBtn");

const gcashReferenceInput =
    document.getElementById("gcashReference");

const gcashError =
    document.getElementById("gcashError");

const gcashConfirmBtn =
    document.getElementById("gcashConfirmBtn");

const successMessage =
    document.getElementById("successMessage");


let gcashPaymentReference = "";

let pendingOrderNumber = null;


function openGcashModal() {

    if (!pendingOrderNumber) {

        pendingOrderNumber =
            generateOrderNumber();

    }


    const total =
        getSubtotal() +
        getShippingFee();


    gcashAmount.textContent =
        `₱${total.toLocaleString()}`;

    gcashOrderNumber.textContent =
        pendingOrderNumber;

    gcashNumberText.textContent =
        GCASH_NUMBER;

    gcashAccountName.textContent =
        GCASH_ACCOUNT_NAME;

    gcashQrImage.src =
        GCASH_QR_IMAGE;

    gcashError.textContent = "";

    gcashModal.classList.add("active");

}


gcashQrImage.addEventListener(
    "error",
    () => {

        gcashQrImage.style.display =
            "none";

    }
);


gcashQrImage.addEventListener(
    "load",
    () => {

        gcashQrImage.style.display =
            "block";

    }
);


closeGcash.addEventListener(
    "click",
    () => {

        gcashModal.classList.remove(
            "active"
        );

    }
);


gcashCopyBtn.addEventListener(
    "click",
    () => {

        const number =
            GCASH_NUMBER.replace(/\s+/g, "");

        if (navigator.clipboard) {

            navigator.clipboard
                .writeText(number)
                .then(
                    () => {

                        gcashCopyBtn.textContent =
                            "COPIED";

                        setTimeout(
                            () => {

                                gcashCopyBtn.textContent =
                                    "COPY NUMBER";

                            },
                            1500
                        );

                    }
                )
                .catch(() => {});

        }

    }
);


gcashConfirmBtn.addEventListener(
    "click",
    () => {

        const reference =
            gcashReferenceInput.value
                .replace(/\s+/g, "");


        if (!isValidReference(reference)) {

            gcashError.textContent =
                "PLEASE ENTER THE REFERENCE NUMBER FROM YOUR RECEIPT (GCASH: 13 DIGITS).";

            return;

        }


        gcashError.textContent = "";

        gcashPaymentReference =
            reference;

        gcashModal.classList.remove(
            "active"
        );

        checkoutForm.requestSubmit();

    }
);


/* =========================================
   PLACE ORDER
========================================= */

checkoutForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        if (cart.length === 0) {

            alert(
                "Your bag is empty."
            );

            return;

        }


        for (
            const item of cart
        ) {

            const product =
                getProduct(
                    item.productId
                );


            if (
                !product ||
                item.quantity >
                product.stock
            ) {

                alert(
                    `Not enough stock available for ${item.name}.`
                );

                updateCart();

                return;

            }

        }


        /* CUSTOMER INFORMATION */

        const customerName =
            document
                .getElementById(
                    "customerName"
                )
                .value
                .trim();


        const customerEmail =
            document
                .getElementById(
                    "customerEmail"
                )
                .value
                .trim();


        const customerPhone =
            document
                .getElementById(
                    "customerPhone"
                )
                .value
                .trim();


        const customerAddress =
            document
                .getElementById(
                    "customerAddress"
                )
                .value
                .trim();


        const customerCity =
            document
                .getElementById(
                    "customerCity"
                )
                .value
                .trim();


        const customerProvince =
            document
                .getElementById(
                    "customerProvince"
                )
                .value
                .trim();


        const postalCode =
            document
                .getElementById(
                    "postalCode"
                )
                .value
                .trim();


        const orderNotes =
            document
                .getElementById(
                    "orderNotes"
                )
                .value
                .trim();


        /* PAYMENT */

        const paymentElement =
            document.querySelector(
                'input[name="paymentMethod"]:checked'
            );


        if (!paymentElement) {

            alert(
                "Please select a payment method."
            );

            return;

        }


        const paymentMethod =
            paymentElement.value;


        /* GCASH / MAYA: customer pays first, then
           enters the reference number */

        if (
            (paymentMethod === "GCash" || paymentMethod === "Maya") &&
            !gcashPaymentReference
        ) {

            openGcashModal();

            return;

        }


        /* TOTALS */

        const shipping =
            getShippingFee();


        const subtotal =
            getSubtotal();


        const total =
            subtotal +
            shipping;


        /* ORDER NUMBER */

        const orderNumber =
            pendingOrderNumber ||
            generateOrderNumber();


        /* ITEMS */

        const orderItems =
            createOrderItemsText();


        /* ADDRESS */

        const fullAddress =
            `${customerAddress}, ${customerCity}, ${customerProvince}, ${postalCode}`;


        /* BUTTON */

        const placeOrderBtn =
            document.getElementById(
                "placeOrderBtn"
            );


        placeOrderBtn.disabled =
            true;


        placeOrderBtn.textContent =
            "PROCESSING ORDER...";


        /* =========================================
           EMAILJS DATA
        ========================================= */

        const emailData = {

            order_number:
                orderNumber,

            customer_name:
                customerName,

            customer_email:
                customerEmail,

            customer_phone:
                customerPhone,

            customer_address:
                fullAddress,

            payment_method:
                (paymentMethod === "GCash" || paymentMethod === "Maya")
                    ? `${paymentMethod} - Ref No. ${gcashPaymentReference} (PENDING PAYMENT VERIFICATION)`
                    : paymentMethod,

            delivery_option:
                deliveryOption.value,

            order_items:
                orderItems,

            subtotal:
                `₱${subtotal.toLocaleString()}`,

            shipping:
                `₱${shipping.toLocaleString()}`,

            total:
                `₱${total.toLocaleString()}`,

            order_notes:
                orderNotes ||
                "None",

            owner_email_1:
                "akiramurata04@gmail.com",

            owner_email_2:
                "ervinmalate806@gmail.com"

        };


        /* =========================================
           SAVE ORDER + SEND EMAIL WITH EMAILJS
        ========================================= */

        try {

            /* saves the order and reserves the stock */
            const saved = Store.placeOrder(orderPayload(orderNumber, paymentMethod, emailData));

            /* the ORDER CODE lets you import this order into admin.html */
            emailData.order_code = saved.code;

            try {
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailData);
            } catch (mailError) {
                console.error("EmailJS Error:", mailError);
            }


            await syncInventory();


            /* SUCCESS */

            checkoutModal.classList.remove(
                "active"
            );


            successOrderNumber.textContent =
                orderNumber;


            emailConfirmationText.textContent =
                `Order confirmation sent to ${customerEmail}.`;


            if (successMessage) {

                successMessage.textContent =
                    (paymentMethod === "GCash" || paymentMethod === "Maya")
                        ? "Your order has been placed. We will verify your payment before shipping."
                        : "Your order has been successfully placed.";

            }


            pendingOrderNumber = null;

            gcashReferenceInput.value = "";


            successModal.classList.add(
                "active"
            );


            /* RESET CART */

            cart = [];


            updateCart();

            checkoutForm.reset();

            updateCheckoutSummary();

            updateProductStockLabels();


        } catch (error) {

            console.error(
                "Order error:",
                error
            );


            alert(
                "Order error: " +
                (
                    error.text ||
                    error.message ||
                    JSON.stringify(error)
                )
            );

        } finally {

            gcashPaymentReference = "";

            placeOrderBtn.disabled =
                false;


            placeOrderBtn.textContent =
                "PLACE ORDER";

        }

    }
);


/* =========================================
   PRODUCT STOCK DISPLAY
========================================= */

function updateProductStockLabels() {

    productsData.forEach(
        product => {

            const stockLabel =
                document.getElementById(
                    `stock-${product.id}`
                );


            const addButton =
                document.querySelector(
                    `.add-cart[data-product-id="${product.id}"]`
                );


            if (stockLabel) {

                if (
                    product.stock <= 0
                ) {

                    stockLabel.textContent =
                        "OUT OF STOCK";

                    stockLabel.className =
                        "stock-label out";

                } else if (
                    product.stock <= 5
                ) {

                    stockLabel.textContent =
                        `ONLY ${product.stock} LEFT`;

                    stockLabel.className =
                        "stock-label low";

                } else {

                    stockLabel.textContent =
                        `${product.stock} IN STOCK`;

                    stockLabel.className =
                        "stock-label";

                }

            }


            if (addButton) {

                if (
                    product.stock <= 0
                ) {

                    addButton.disabled =
                        true;

                    addButton.textContent =
                        "OUT OF STOCK";

                    addButton.style.opacity =
                        "0.5";

                    addButton.style.cursor =
                        "not-allowed";

                } else {

                    addButton.disabled =
                        false;

                    addButton.textContent =
                        "ADD TO BAG";

                    addButton.style.opacity =
                        "";

                    addButton.style.cursor =
                        "";

                }

            }

        }
    );

}


/* =========================================
   SUCCESS CLOSE
========================================= */

closeSuccess.addEventListener(
    "click",
    () => {

        successModal.classList.remove(
            "active"
        );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* =========================================
   ESC KEY
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        cartDrawer.classList.remove(
            "active"
        );

        cartOverlay.classList.remove(
            "active"
        );

        checkoutModal.classList.remove(
            "active"
        );

        successModal.classList.remove(
            "active"
        );

        gcashModal.classList.remove(
            "active"
        );

        searchBox.classList.remove(
            "active"
        );

    }
);


/* =========================================
   INITIALIZE
========================================= */

loadCart();

syncInventory();

setInterval(syncInventory, 30000);

updateCart();

updateCheckoutSummary();

updateProductStockLabels();

applyProductFilters();


/* =========================================
   TRACK ORDER
========================================= */

const STATUS_LABELS = {
    to_ship: "TO SHIP",
    to_receive: "TO RECEIVE",
    completed: "COMPLETED",
    cancelled: "CANCELLED"
};

function closeMenu() {
    document.querySelector(".nav-links").classList.remove("open");
}

document.querySelectorAll("[data-track]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        closeMenu();
        document.getElementById("trackModal").classList.add("active");
    });
});

document.getElementById("closeTrack").addEventListener("click", () => {
    document.getElementById("trackModal").classList.remove("active");
});

document.getElementById("trackForm").addEventListener("submit", async event => {

    event.preventDefault();

    const result = document.getElementById("trackResult");
    const number = document.getElementById("trackOrder").value.trim().toUpperCase();
    const email = document.getElementById("trackEmail").value.trim();

    result.textContent = "CHECKING...";

    try {

        const order = await Store.trackOrder(number, email);

        const payment = order.payment === "paid" ? "PAID"
            : order.payment === "cod" ? "CASH ON DELIVERY" : "UNDER VERIFICATION";

        let text = `ORDER: ${order.orderNumber}\nSTATUS: ${STATUS_LABELS[order.status] || order.status}\nPAYMENT: ${payment}`;

        if (order.items) {
            text += "\n\n" +
                order.items.map(i => `${i.name}${i.size ? " (" + i.size + ")" : ""} × ${i.quantity}`).join("\n") +
                `\n\nTOTAL: ₱${order.total.toLocaleString()}`;
        }

        result.textContent = text;

    } catch (error) {
        result.textContent = (error.message || "Could not check the order.").toUpperCase();
    }

});


/* =========================================
   MOBILE MENU + ESC
========================================= */

document.getElementById("menuBtn").addEventListener("click", () => {
    document.querySelector(".nav-links").classList.toggle("open");
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        document.getElementById("sizeModal").classList.remove("active");
        document.getElementById("trackModal").classList.remove("active");
        closeMenu();
    }
});


