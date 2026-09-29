/* =========================================
   DWAYT SHARED DATA
   Used by BOTH index.html (store) and
   admin.html (inventory).
   Load this file BEFORE script.js / admin.js
========================================= */


/* =========================================
   PRODUCT DATA
   8 PRODUCTS PER CATEGORY
========================================= */

const productsData = [

    /* TOPS */

    {
        id: "product1",
        name: "ROSE QUAD Thermal Long Sleeve in Charcoal",
        category: "Tops",
        price: 899,
        image: "images/product1.jpg",
        stock: 20
    },

    {
        id: "product99",
        name: "MONOGRAM Cuffed Thumbhole Pullover Hoodie",
        category: "Tops",
        price: 699,
        image: "images/product99.jpg",
        stock: 20
    },

    {
        id: "product9",
        name: "TACTICAL CAMO Quilted Bomber Jacket",
        category: "Tops",
        price: 799,
        image: "images/product9.jpg",
        stock: 15
    },

    {
        id: "product10",
        name: "BANDANA UTILITY Snap-Front Overshirt",
        category: "Tops",
        price: 749,
        image: "images/product10.jpg",
        stock: 15
    },

    {
        id: "product11",
        name: "URBAN TAPESTRY Camo Knit Sweater",
        category: "Tops",
        price: 999,
        image: "images/product11.jpg",
        stock: 15
    },

    {
        id: "product12",
        name: "GOTHIC DT Heavyweight Pinstripe Pullover",
        category: "Tops",
        price: 1099,
        image: "images/product12.jpg",
        stock: 15
    },

    {
        id: "product13",
        name: "RECONSTRUCTED Oversized Panel Sweatshirt",
        category: "Tops",
        price: 599,
        image: "images/product13.jpg",
        stock: 15
    },

    {
        id: "product14",
        name: "SACRED SLEEVE Oversized Sun-Faded Sweatshirt",
        category: "Tops",
        price: 949,
        image: "images/product14.jpg",
        stock: 15
    },


    /* BOTTOMS */

    {
        id: "product2",
        name: "COLD NAVY HITTER DWAYT PANTS",
        category: "Bottoms",
        price: 1299,
        image: "images/product2.jpg",
        stock: 15
    },

    {
        id: "product6",
        name: "DWAYT Overpocket Phat Trousers — Charcoal",
        category: "Bottoms",
        price: 1099,
        image: "images/product6.jpg",
        stock: 15
    },

    {
        id: "product15",
        name: "Drift Pants in Sea Gull",
        category: "Bottoms",
        price: 1499,
        image: "images/product15.jpg",
        stock: 15
    },

    {
        id: "product16",
        name: "Trail Pants in Woodland Camo",
        category: "Bottoms",
        price: 1399,
        image: "images/product16.jpg",
        stock: 15
    },

    {
        id: "product17",
        name: "Flare Pants in Mauve",
        category: "Bottoms",
        price: 1099,
        image: "images/product17.jpg",
        stock: 15
    },

    {
        id: "product18",
        name: "Trek Pants Sea Glass",
        category: "Bottoms",
        price: 1299,
        image: "images/product18.jpg",
        stock: 15
    },

    {
        id: "product19",
        name: "LOOSEFIT PANTS iN ICE",
        category: "Bottoms",
        price: 899,
        image: "images/product19.jpg",
        stock: 15
    },

    {
        id: "product20",
        name: "RUSH PHAT SHORTS IN ACID BLUE",
        category: "Bottoms",
        price: 1199,
        image: "images/product20.jpg",
        stock: 15
    },


    /* DRESSES */

    {
        id: "product3",
        name: "VELVET HOUR Mini Dress",
        category: "Dresses",
        price: 1199,
        image: "images/dress-velvet-hour.jpg",
        stock: 12
    },

    {
        id: "product7",
        name: "MIRA SKIRT IN ANTHRACITE",
        category: "Dresses",
        price: 1299,
        image: "images/dress-mira-skirt.jpg",
        stock: 12
    },

    {
        id: "product21",
        name: "ASH ROSE Ribbed Midi Dress",
        category: "Dresses",
        price: 1299,
        image: "images/dress-ash-rose.jpg",
        stock: 12
    },

    {
        id: "product22",
        name: "MIDNIGHT SATIN Slip Dress",
        category: "Dresses",
        price: 1399,
        image: "images/dress-midnight-satin.jpg",
        stock: 12
    },

    {
        id: "product23",
        name: "DUSTED LINEN Day Dress",
        category: "Dresses",
        price: 1349,
        image: "images/dress-dusted-linen.jpg",
        stock: 12
    },

    {
        id: "product24",
        name: "CRIMSON MOTH Ruched Mini Dress",
        category: "Dresses",
        price: 1249,
        image: "images/dress-crimson-moth.jpg",
        stock: 12
    },

    {
        id: "product25",
        name: "VARSITY GHOST Polo Dress",
        category: "Dresses",
        price: 1199,
        image: "images/dress-varsity-ghost.jpg",
        stock: 12
    },

    {
        id: "product26",
        name: "COLD EMBER Soft Knit Dress",
        category: "Dresses",
        price: 1449,
        image: "images/dress-cold-ember.jpg",
        stock: 12
    },


    /* ACCESSORIES */

    {
        id: "product4",
        name: "GOTHIC RELIC Silver Chain & Cross",
        category: "Accessories",
        price: 799,
        image: "images/product4.jpg",
        stock: 18
    },

    {
        id: "product8",
        name: "DOUBLE ICE Tennis Bracelet",
        category: "Accessories",
        price: 899,
        image: "images/product8.jpg",
        stock: 18
    },

    {
        id: "product27",
        name: "OBSIDIAN INLAY Band Ring in Antique Silver",
        category: "Accessories",
        price: 699,
        image: "images/product27.jpg",
        stock: 15
    },

    {
        id: "product28",
        name: "ETERNAL HARMONY Sculptural Ring",
        category: "Accessories",
        price: 1099,
        image: "images/product28.jpg",
        stock: 15
    },

    {
        id: "product29",
        name: "ARCHIVE UTILITY Layered Chain",
        category: "Accessories",
        price: 599,
        image: "images/product29.jpg",
        stock: 15
    },

    {
        id: "product30",
        name: "MONOCHROME TAPESTRY Silk/Cotton Bandana",
        category: "Accessories",
        price: 649,
        image: "images/product30.jpg",
        stock: 15
    },

    {
        id: "product31",
        name: "NEO-TOKYO Goth Monogram Cap",
        category: "Accessories",
        price: 399,
        image: "images/product31.jpg",
        stock: 15
    },

    {
        id: "product32",
        name: "GOLD CREST Six-Panel Hat",
        category: "Accessories",
        price: 599,
        image: "images/product32.jpg",
        stock: 15
    }

];


/* Stock numbers above are only starting values.
   The real stock is loaded from Supabase (see db.js). */
