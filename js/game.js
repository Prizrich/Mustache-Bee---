function applyMarketing() {
    if (gameState.money >= 500) {
        gameState.money -= 500;
        gameState.marketingBonus = 1.1;
        addMailMessage("system", "📣 Реклама запущена! +10% продаж!", true);
        saveGameProgress();
        return true;
    }
    addMailMessage("system", "💰 Не хватает 500₽!", true);
    return false;
}

function simulateSales() {
    let totalRevenue = 0, totalExp = 0, itemsSold = 0;
    for (let p of gameState.products) {
        if (p.quantity <= 0) continue;
        let priceFactor = 1.0;
        if (p.userPrice > p.basePrice * 1.3) priceFactor = 0.4;
        else if (p.userPrice < p.basePrice * 0.7) priceFactor = 1.5;
        else if (p.userPrice < p.basePrice * 0.9) priceFactor = 1.2;
        const repFactor = 0.5 + (gameState.reputation / 100);
        let salesCount = Math.floor(Math.random() * 4) + 1;
        salesCount = Math.min(salesCount, p.quantity);
        salesCount = Math.floor(salesCount * priceFactor * repFactor);
        salesCount = Math.max(0, Math.min(salesCount, p.quantity));
        if (salesCount === 0) continue;
        let finalPrice = p.userPrice * gameState.marketingBonus * (0.9 + Math.random() * 0.2);
        totalRevenue += salesCount * finalPrice;
        p.quantity -= salesCount;
        itemsSold += salesCount;
        totalExp += salesCount * p.expReward;
        if (finalPrice > p.basePrice * 1.3) updateReputation(-1);
        else if (finalPrice < p.basePrice * 0.8) updateReputation(2);
    }
    updateMoney(totalRevenue);
    addExp(totalExp);
    gameState.marketingBonus = 1.0;
    for (let i = 0; i < Math.min(3, 1 + Math.floor(itemsSold / 3)); i++) generateRandomReview();
    return { revenue: totalRevenue, exp: totalExp, itemsSold };
}

function rivalSabotage() {
    if (gameState.defeatedRival || gameState.suedRival) return;
    const intensity = Math.floor(gameState.rivalPower / 20) + 1;
    let loss = Math.floor(Math.random() * 300 * intensity) + 50;
    gameState.money = Math.max(0, gameState.money - loss);
    updateReputation(-Math.floor(intensity / 2) - 1);
    gameState.rivalPower = Math.min(100, gameState.rivalPower + 3);
    addMailMessage("starlik", `💀 Чёрный пиар! -${loss}₽!`, true);
    if (Math.random() < 0.15 + gameState.rivalPower / 200) { addCompromat(5); addMailMessage("system", "🔍 Компромат +5!", true); }
    saveGameProgress();
}

function confrontRival() {
    if (gameState.defeatedRival || gameState.suedRival) { addMailMessage("system", "Старлик уже побеждён!", true); return false; }
    if (gameState.reputation >= 80) {
        gameState.defeatedRival = true;
        gameState.rivalPower = Math.max(0, gameState.rivalPower - 40);
        addExp(200);
        updateReputation(15);
        addMailMessage("system", "🏆 ВЫ УТЕРЛИ НОС СТАРЛИКУ! +200 опыта!", true);
        playSound("win");
        saveGameProgress();
        return true;
    } else {
        gameState.rivalPower = Math.min(100, gameState.rivalPower + 10);
        updateReputation(-5);
        addMailMessage("starlik", "😤 Ничего не выйдет!", true);
        saveGameProgress();
        return false;
    }
}

function sueRival() {
    if (gameState.suedRival) { addMailMessage("system", "Старлик уже в тюрьме!", true); return false; }
    if (gameState.level < 5) { addMailMessage("system", "Нужен 5 уровень!", true); return false; }
    if (gameState.compromat < 100) { addMailMessage("system", `Нужно ещё ${100 - gameState.compromat}% компромата!`, true); return false; }
    gameState.suedRival = true;
    gameState.defeatedRival = true;
    gameState.rivalPower = 0;
    addExp(1000);
    updateReputation(30);
    updateMoney(10000);
    addMailMessage("system", "⚖️ СУД СОСТОЯЛСЯ! Старлик арестован! ВЫ ПОБЕДИЛИ!", true);
    playSound("win");
    saveGameProgress();
    showVictoryModal();
    return true;
}

function showVictoryModal() {
    const modal = document.getElementById("result-modal");
    if (modal) {
        document.getElementById("result-icon").innerHTML = "🏆👑🏆";
        document.getElementById("result-title").innerHTML = "ВЫ ПОБЕДИЛИ!";
        document.getElementById("result-text").innerHTML = `Старлик арестован!<br>💰 ${Math.floor(gameState.money)}₽<br>⭐ ${gameState.reputation}%<br>📈 ${gameState.level} уровень<br>📅 Дней: ${gameState.daysPassed}`;
        modal.classList.add("active");
    }
}

async function nextDay() {
    if (!gameState.gameActive || gameState.suedRival) { 
        addMailMessage("system", "Игра завершена! Нажмите «Сброс».", true); 
        return false; 
    }
    gameState.daysPassed++;
    const result = simulateSales();
    if (gameState.rivalPower > 0 && !gameState.defeatedRival) rivalSabotage();
    if (!gameState.defeatedRival && gameState.rivalPower > 50 && Math.random() < 0.2) addCompromat(2);
    addMailMessage("system", `📊 День ${gameState.daysPassed}. Выручка: ${Math.floor(result.revenue)}₽, Опыт: +${result.exp}`, true);
    saveGameProgress();
    playSound("match");
    if (gameState.compromat >= 100 && gameState.level >= 5 && !gameState.suedRival) {
        addMailMessage("system", "⚖️ Компромат собран! Нажмите «Подать в суд»!", true);
    }
    return true;
}