const db = new Dexie('ShoppingApp');
db.version(1).stores({ items: '++id,name,quantity,price,isPurchased', products: '++id,name,price', sales: '++id,cartItems,totalSalePrice,timestamp' });

const itemForm = document.getElementById('itemForm');
const productForm = document.getElementById('productForm');
const productsDiv = document.getElementById('productsDiv');
const productNameInput = document.getElementById('productNameInput');
const productPriceInput = document.getElementById('productPriceInput');
const itemsDiv = document.getElementById('itemsDiv');
const totalPriceDiv = document.getElementById('totalPrice');
const productSelect = document.getElementById('productSelect');
const priceValueInput = document.getElementById('priceValue');
const finalizeSaleButton = document.getElementById('finalizeSaleButton');
const receiptDiv = document.getElementById('receiptDiv');
const salesHistoryDiv = document.getElementById('salesHistoryDiv');

const populateItemsDiv = async () => {
    const allItems = await db.items.reverse().toArray();

    itemsDiv.innerHTML = allItems.map(item => `
     <div class="item ${item.isPurchased && 'purchased'}">
        <label> <input type="checkbox" class="checkbox" 
        onchange="toggleItemStatus(event, ${item.id}) " ${item.isPurchased && 'checked'}> </label>
        <div id="itemInfo">
            <p>${item.name}</p>
            <p>KES${item.price} * ${item.quantity}</p>
        </div>
        <button class="deleteButton" onclick="removeItem(${item.id})">X</button>
    </div>
`).join('');

    const arrayOfPrices = allItems.map( item => item.price * item.quantity);
    const totalPrice = arrayOfPrices.reduce((a,b) => a +b, 0);
    totalPriceDiv.innerText = 'Total price: KES' + totalPrice;
};

const populateProductsDiv = async () => {
    const allProducts = await db.products.toArray();
    productsDiv.innerHTML = allProducts.map(product => `
        <div class="product-item">
            <p>${product.name}</p>
            <p>Price: KES${product.price}</p>
        </div>
    `).join('');
};

const populateProductSelect = async () => {
    if (!productSelect) return;
    const allProducts = await db.products.toArray();
    // Clear existing options except the first one
    while (productSelect.options.length > 1) {
        productSelect.remove(1);
    }
    allProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
};

window.onload = async () => {
    await populateItemsDiv();
    await populateProductsDiv();
    await populateProductSelect();
    await populateSalesHistoryDiv();
};

const populateSalesHistoryDiv = async () => {
    if (!salesHistoryDiv) return;

    const allSales = await db.sales.reverse().toArray();

    if (allSales.length === 0) {
        salesHistoryDiv.innerHTML = "<p>No sales recorded yet.</p>";
        return;
    }

    let historyHTML = "";
    allSales.forEach(sale => {
        historyHTML += `<div class="sale-record">`;
        historyHTML += `<h4>Sale ID: ${sale.id}</h4>`;
        historyHTML += `<p>Timestamp: ${new Date(sale.timestamp).toLocaleString()}</p>`;
        historyHTML += `<p><strong>Total Sale Price: KES${sale.totalSalePrice.toFixed(2)}</strong></p>`;
        historyHTML += `<h5>Items:</h5><ul>`;
        sale.cartItems.forEach(item => {
            historyHTML += `<li>${item.name} - Qty: ${item.quantity}, Price: KES${item.price}</li>`;
        });
        historyHTML += `</ul></div><hr>`;
    });
    salesHistoryDiv.innerHTML = historyHTML;
};

if (productSelect && priceValueInput) {
    productSelect.onchange = async () => {
        const selectedProductId = productSelect.value;
        if (selectedProductId) {
            try {
                const product = await db.products.get(parseInt(selectedProductId));
                if (product) {
                    priceValueInput.value = product.price;
                } else {
                    priceValueInput.value = '';
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                priceValueInput.value = '';
            }
        } else {
            priceValueInput.value = '';
        }
    };
}

itemForm.onsubmit = async (event) => {
    event.preventDefault();
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const name = selectedOption.textContent; // Get name from selected option text
    const productId = productSelect.value;
    const quantity = document.getElementById('quantityInput').value;
    const price = document.getElementById('priceValue').value;

    if (!productId) {
        alert("Please select a product.");
        return;
    }

    await db.items.add({ name, quantity, price: parseFloat(price), isPurchased: false });
    await populateItemsDiv();

    itemForm.reset();
    priceValueInput.value = ''; // Clear price field after adding
};

if (productForm) {
    productForm.onsubmit = async (event) => {
        event.preventDefault();
        const name = productNameInput.value;
        const price = productPriceInput.value;

        await db.products.add({ name, price: parseFloat(price) });
        await populateProductsDiv();
        await populateProductSelect(); // Update dropdown after adding new product
        productForm.reset();
    };
}

const toggleItemStatus = async  (event, id) => {
    await db.items.update(id, { isPurchased: !!event.target.checked });
    await populateItemsDiv();
}

const removeItem = async (id) => {

    await db.items.delete(id)
    await populateItemsDiv();
}

const finalizeSale = async () => {
    if (!receiptDiv) return;

    const cartItems = await db.items.toArray();

    if (cartItems.length === 0) {
        receiptDiv.innerHTML = "<p>Cart is empty. Add items to make a sale.</p>";
        return;
    }

    const currentSaleTotalPrice = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);

    const saleRecord = {
        cartItems: cartItems,
        totalSalePrice: currentSaleTotalPrice,
        timestamp: new Date().toISOString()
    };

    try {
        await db.sales.add(saleRecord);
        await db.items.clear();
        await populateItemsDiv(); // Refreshes cart display and total price
        await populateSalesHistoryDiv(); // Refresh sales history

        let receiptHTML = `<h3>Sale Finalized!</h3>`;
        receiptHTML += `<p>Timestamp: ${new Date(saleRecord.timestamp).toLocaleString()}</p>`;
        receiptHTML += `<h4>Items:</h4><ul>`;
        saleRecord.cartItems.forEach(item => {
            receiptHTML += `<li>${item.name} - Qty: ${item.quantity}, Price: KES${item.price} (Total: KES${parseFloat(item.price) * parseInt(item.quantity)})</li>`;
        });
        receiptHTML += `</ul>`;
        receiptHTML += `<p><strong>Total Sale Price: KES${saleRecord.totalSalePrice.toFixed(2)}</strong></p>`;
        receiptDiv.innerHTML = receiptHTML;

    } catch (error) {
        console.error("Error finalizing sale:", error);
        receiptDiv.innerHTML = "<p>Error finalizing sale. Please try again.</p>";
    }
};

if (finalizeSaleButton) {
    finalizeSaleButton.onclick = finalizeSale;
}