let gameState = {
    level: 1, exp: 0, money: 5000, reputation: 50,
    compromat: 0, rivalPower: 0, products: [],
    marketingBonus: 1.0, mailLogs: {}, reviews: [],
    defeatedRival: false, suedRival: false, gameActive: true,
    currentContact: "system", daysPassed: 0
};

function initMailLogs() {
    for (let contact in MAIL_DIALOGS) {
        if (!gameState.mailLogs[contact] || gameState.mailLogs[contact].length === 0) {
            gameState.mailLogs[contact] = MAIL_DIALOGS[contact].messages.map(msg => ({
                ...msg, time: new Date().toLocaleTimeString()
            }));
        }
    }
}

function addMailMessage(contactId, text, isIncoming = true) {
    if (!gameState.mailLogs[contactId]) gameState.mailLogs[contactId] = [];
    gameState.mailLogs[contactId].unshift({ 
        text, incoming: isIncoming, 
        time: new Date().toLocaleTimeString()
    });
    if (gameState.mailLogs[contactId].length > 100) gameState.mailLogs[contactId].pop();
    saveGameProgress();
}

function addReview(author, rating, text) {
    gameState.reviews.unshift({ 
        author, rating, text, 
        time: new Date().toLocaleString(),
        responded: false 
    });
    if (gameState.reviews.length > 50) gameState.reviews.pop();
    saveGameProgress();
}

function updateAverageRating() {
    if (gameState.reviews.length === 0) return 3.5;
    const sum = gameState.reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / gameState.reviews.length).toFixed(1);
}

function addExp(amount) {
    gameState.exp += amount;
    const nextLevel = gameState.level + 1;
    const required = GAME_CONFIG.expRequirements[nextLevel] || Infinity;
    if (nextLevel <= 5 && gameState.exp >= required) {
        gameState.level++;
        addMailMessage("system", `🏆 ПОЗДРАВЛЯЮ! Вы достигли ${gameState.level} уровня!`, true);
        if (gameState.level === 5) {
            addMailMessage("system", "⚖️ Теперь вы можете подать в суд на Старлика!", true);
        }
    }
    saveGameProgress();
}

function addCompromat(amount) {
    const oldValue = gameState.compromat;
    gameState.compromat = Math.min(100, gameState.compromat + amount);
    if (oldValue < 100 && gameState.compromat >= 100 && gameState.level >= 5) {
        addMailMessage("system", "🎉 Компромат собран! Нажмите «Подать в суд»!", true);
    }
    saveGameProgress();
}

function updateReputation(delta) {
    gameState.reputation = Math.min(100, Math.max(0, gameState.reputation + delta));
    saveGameProgress();
}

function updateMoney(delta) {
    gameState.money = Math.max(0, gameState.money + delta);
    saveGameProgress();
}

function saveGameProgress() {
    const saveData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        level: gameState.level,
        exp: gameState.exp,
        money: gameState.money,
        reputation: gameState.reputation,
        compromat: gameState.compromat,
        rivalPower: gameState.rivalPower,
        products: gameState.products,
        mailLogs: gameState.mailLogs,
        reviews: gameState.reviews,
        defeatedRival: gameState.defeatedRival,
        suedRival: gameState.suedRival,
        daysPassed: gameState.daysPassed
    };
    localStorage.setItem("usatyPchelSave", JSON.stringify(saveData));
    updateSaveSlotDisplay();
    return saveData;
}

function manualSave() {
    const saveData = saveGameProgress();
    addMailMessage("system", `💾 Игра сохранена! День ${saveData.daysPassed}, уровень ${saveData.level}`, true);
    return saveData;
}

function loadGameProgress() {
    const saved = localStorage.getItem("usatyPchelSave");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.level = data.level || 1;
            gameState.exp = data.exp || 0;
            gameState.money = data.money || 5000;
            gameState.reputation = data.reputation || 50;
            gameState.compromat = data.compromat || 0;
            gameState.rivalPower = data.rivalPower || 0;
            gameState.mailLogs = data.mailLogs || {};
            gameState.reviews = data.reviews || [];
            gameState.defeatedRival = data.defeatedRival || false;
            gameState.suedRival = data.suedRival || false;
            gameState.daysPassed = data.daysPassed || 0;
            if (data.products && data.products.length > 0) gameState.products = data.products;
        } catch(e) { console.log("Ошибка загрузки", e); }
    }
    initMailLogs();
    updateSaveSlotDisplay();
}

function updateSaveSlotDisplay() {
    const autoDateSpan = document.getElementById("auto-save-date");
    const autoStatsSpan = document.getElementById("auto-save-stats");
    if (autoDateSpan && autoStatsSpan) {
        const saved = localStorage.getItem("usatyPchelSave");
        if (saved) {
            try {
                const data = JSON.parse(saved);
                const date = data.timestamp ? new Date(data.timestamp).toLocaleString() : "Неизвестно";
                autoDateSpan.innerText = `📅 ${date}`;
                autoStatsSpan.innerHTML = `🎚️ Уровень ${data.level || 1} | 💰 ${Math.floor(data.money || 0)}₽ | ⭐ ${data.reputation || 50}% | 📅 День ${data.daysPassed || 0}`;
            } catch(e) {
                autoDateSpan.innerText = "—";
                autoStatsSpan.innerHTML = "—";
            }
        } else {
            autoDateSpan.innerText = "Нет сохранений";
            autoStatsSpan.innerHTML = "—";
        }
    }
}

function resetGame() {
    localStorage.removeItem("usatyPchelSave");
    gameState = {
        level: 1, exp: 0, money: 5000, reputation: 50,
        compromat: 0, rivalPower: 0, products: [],
        marketingBonus: 1.0, mailLogs: {}, reviews: [],
        defeatedRival: false, suedRival: false, gameActive: true,
        currentContact: "system", daysPassed: 0
    };
    initMailLogs();
    updateSaveSlotDisplay();
    return true;
}

function clearChat(contactId) {
    if (!contactId) return false;
    gameState.mailLogs[contactId] = MAIL_DIALOGS[contactId]?.messages.map(msg => ({
        ...msg, time: new Date().toLocaleTimeString()
    })) || [{ text: "Чат очищен", incoming: true, time: new Date().toLocaleTimeString() }];
    saveGameProgress();
    return true;
}

function getExpNeeded() {
    const nextLevel = gameState.level + 1;
    if (nextLevel > 5) return Infinity;
    return GAME_CONFIG.expRequirements[nextLevel] || Infinity;
}