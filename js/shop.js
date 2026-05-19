// js/shop.js
function initProducts() {
    const items = GAME_CONFIG.shopItemsByLevel[gameState.level];
    if (!items) return;
    const oldProducts = gameState.products.reduce((acc, p) => { acc[p.id] = p.quantity; return acc; }, {});
    gameState.products = [];
    for (let item of items) {
        gameState.products.push({
            ...item,
            userPrice: item.basePrice,
            quantity: oldProducts[item.id] || 5
        });
    }
}

function buySpecificProduct(productId, quantity = 1) {
    const product = gameState.products.find(p => p.id === productId);
    if (!product) return { success: false, message: "Товар не найден на складе оптовиков" };
    const totalCost = product.cost * quantity;

    if (gameState.money >= totalCost) {
        gameState.money -= totalCost;
        product.quantity += quantity;
        addExp(5 * quantity);
        playSound("buy");
        addMailMessage("system", `✅ Закуплен ${product.name} x${quantity} у Вали за ${totalCost}₽`, true);
        saveGameProgress();
        return { success: true, message: `Куплено ${quantity} шт. ${product.name}` };
    }
    return { success: false, message: `Поставщик отказал! Не хватает ${totalCost - gameState.money}₽` };
}

function setProductPriceWithAI(productId, newPrice) {
    const product = gameState.products.find(p => p.id === productId);
    if (!product || newPrice < 5) return { success: false, feedback: "Цена ниже критического лимита!" };
    product.userPrice = Math.floor(newPrice);
    let feedback = "", reputationChange = 0;

    if (newPrice > product.basePrice * 1.5) { feedback = "❌ Ограбление! Слишком дорого"; reputationChange = -2; }
    else if (newPrice > product.basePrice * 1.2) { feedback = "⚠️ Цена завышена"; reputationChange = -1; }
    else if (newPrice < product.basePrice * 0.7) { feedback = "🔥 Сделка века! Отличная скидка"; reputationChange = 3; addExp(5); }
    else if (newPrice < product.basePrice * 0.9) { feedback = "👍 Хорошая скидка"; reputationChange = 1; }
    else { feedback = "⚖️ Оптимальный ценник"; reputationChange = 0; }

    if (reputationChange !== 0) updateReputation(reputationChange);
    addMailMessage("system", `📝 Установлена цена на ${product.name}: ${newPrice}₽. (${feedback})`, true);
    saveGameProgress();
    return { success: true, feedback, reputationChange };
}

async function generateRandomReview() {
    const authors = ["Пепто", "Гриб", "Карась"];
    const author = authors[Math.floor(Math.random() * authors.length)];
    const product = gameState.products[Math.floor(Math.random() * gameState.products.length)];
    if (!product) return;

    let isPositive = gameState.reputation > 60 ? Math.random() > 0.3 : Math.random() > 0.7;
    if (author === "Карась" && gameState.reputation < 60) isPositive = false;

    const reviewText = AIDirector.generateReviewText(author, product.name, isPositive, product.userPrice);
    const rating = isPositive ? 4 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);

    addReview(author, rating, reviewText);
    const repChange = rating - 3;
    if (repChange !== 0) updateReputation(repChange);

    if (author === "Карась" && !isPositive) {
        addCompromat(3);
        addMailMessage("system", "🔍 Перехвачен след бот-панели Карася! Компромат +3%!", true);
    }
    return { author, rating, text: reviewText };
}

function replyToReviews() {
    const unreplied = gameState.reviews.filter(r => !r.responded);
    if (unreplied.length === 0) { addMailMessage("system", "Нет отзывов, требующих ответа.", true); return false; }
    for (let review of unreplied) review.responded = true;

    updateReputation(GAME_CONFIG.replyReputationBonus);
    addExp(GAME_CONFIG.replyExpBonus);
    addMailMessage("system", `💬 Ответили на отзывы (${unreplied.length} шт.)! Получено +${GAME_CONFIG.replyReputationBonus} репутации!`, true);
    playSound("win");
    saveGameProgress();
    return true;
}
