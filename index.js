const db = new Dexie('ShoppingApp');
db.version(1).stores({ items: '++id,name,quantity,price,isPurchased' });

const itemForm = document.getElementById('itemForm');
const itemsDiv = document.getElementById('itemsDiv');
const totalPriceDiv = document.getElementById('totalPrice');

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

window.onload = populateItemsDiv()


itemForm.onsubmit = async (event) => {
    event.preventDefault();
    const name = document.getElementById('nameInput').value;
    const quantity = document.getElementById('quantityInput').value;
    const price = document.getElementById('priceValue').value;

    await db.items.add({ name, quantity, price, isPurchased: false });
    await populateItemsDiv();

    itemForm.reset();
};

const toggleItemStatus = async  (event, id) => {
    await db.items.update(id, { isPurchased: !!event.target.checked });
    await populateItemsDiv();
}

const removeItem = async (id) => {

    await db.items.delete(id)
    await populateItemsDiv();
}