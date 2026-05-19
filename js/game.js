class MarketEngine {
    constructor(state) { this.state = state; }

    applyMarketing() {
        if (this.state.money < 500) {
            addMailMessage("system", "❌ Не хватает 500 💎 на рекламную кампанию!", true);
            return false;
        }
        this.state.money -= 500;
        this.state.marketingBonus = 1.4;
        addMailMessage("system", "📢 Реклама успешно запущена на всем Спавне! Покупатели повалят завтра!", true);
        return true;
    }

    simulateSales() {
        let report = { revenue: 0, exp: 0, itemsSold: 0 };
        this.state.products.forEach(prod => {
            if (prod.quantity <= 0) return;
            const markup = prod.userPrice / prod.basePrice;
            let priceFactor = 1.0;
            if (markup > 1.4) priceFactor = 0.3;
            else if (markup < 0.8) priceFactor = 1.6;
            else if (markup < 1.1) priceFactor = 1.1;

            const repFactor = 0.4 + (this.state.reputation / 100);
            let potentialSales = Math.floor(Math.random() * 3) + 1;
            let finalSales = Math.floor(potentialSales * priceFactor * repFactor * this.state.marketingBonus);
            finalSales = Math.max(0, Math.min(finalSales, prod.quantity));

            if (finalSales > 0) {
                report.revenue += finalSales * prod.userPrice;
                report.itemsSold += finalSales;
                report.exp += finalSales * prod.expReward;
                prod.quantity -= finalSales;
                if (markup > 1.4) updateReputation(-3);
                else if (markup <= 1.1) updateReputation(2);
            }
        });

        updateMoney(Math.floor(report.revenue));
        addExp(report.exp);
        this.state.marketingBonus = 1.0;
        const reviewCount = Math.min(3, report.itemsSold);
        for (let i = 0; i < reviewCount; i++) { generateRandomReview(); }
        return report;
    }

    rivalSabotage() {
        if (this.state.defeatedRival) return;
        if (Math.random() < 0.40) {
            let loss = Math.floor(Math.random() * 250) + 50;
            this.state.money = Math.max(0, this.state.money - loss);
            updateReputation(-4);
            addMailMessage("starlik", `😈 Ха-ха! Мои кибер-боты обрушили тебе рейтинг! Убытки составили: -${loss} 💎!`, true);
            if (Math.random() < 0.50) {
                addCompromat(15);
                addMailMessage("system", "🔍 Внимание! Перехвачены логи бот-атаки KAPACb! Компромат на Старлика +15%!", true);
            }
        }
    }

    sueRival() {
        if (this.state.defeatedRival) return false;
        if (this.state.compromat < GAME_CONFIG.compromatNeeded) {
            alert("⚖️ Недостаточно улик! Накопи 100% компромата!");
            return false;
        }
        this.state.defeatedRival = true;
        this.state.rivalPower = 0;
        updateMoney(8000);
        updateReputation(40);
        const courtWindow = document.getElementById("court-window");
        if (courtWindow) {
            courtWindow.innerHTML = `<div style="text-align:center; padding:20px;"><h2 style="color:#d62828;">⚖️ СУД СВЕРШИЛСЯ! ⚖️</h2><p><b>Старлик официально забанен! Вы победили!</b></p></div>`;
        }
        alert("🎉 Старлик отправлен в бан!");
        return true;
    }
}

let gameState = {
    money: GAME_CONFIG.startMoney,
    level: 1,
    exp: 0,
    reputation: GAME_CONFIG.startReputation,
    compromat: 0,
    rivalPower: 50,
    marketingBonus: 1.0,
    activeContact: "system",
    defeatedRival: false,
    products: [],
    chats: {
        system: [{ text: "📢 Добро пожаловать в мессенджер BBM! Управляй ульем без чужой диктатуры! 🛠️🐝", time: "Система", incoming: true }],
        nahida: [{ text: "👋 Здарова! Я тут чекаю рынок Спавна. Пиши 'анекдот' или 'что по рынку'!", time: "NAHIDA", incoming: true }],
        pepto: [{ text: "👀 Эй, хозяин! Цены кусаются... Скинь кристаллы за спутник PETPO!", time: "PETPO", incoming: true }],
        mushroom: [{ text: "🍄 Привет-привет! Как там пчёлы? Почкуются у алтаря?", time: "Гриб", incoming: true }],
        karas: [{ text: "🐟 Мой клан Антегрия следит за витриной.", time: "KAPACb", incoming: true }],
        starlik: [{ text: "😈 Ха-ха! Твой магазин скоро закроется!", time: "Старлик", incoming: true }]
    }
};

const engine = new MarketEngine(gameState);

function loadLevelProducts() {
    gameState.products = [];
    for (let l = 1; l <= gameState.level; l++) {
        if (GAME_CONFIG.shopItemsByLevel[l]) {
            GAME_CONFIG.shopItemsByLevel[l].forEach(item => {
                gameState.products.push({ ...item, quantity: 10, userPrice: item.basePrice });
            });
        }
    }
}

function updateUI() {
    document.getElementById("stat-money").innerText = Math.floor(gameState.money);
    document.getElementById("stat-level").innerText = gameState.level;
    document.getElementById("stat-exp").innerText = gameState.exp;
    document.getElementById("stat-reputation").innerText = gameState.reputation;
    document.getElementById("rival-progress").value = gameState.rivalPower;
    document.getElementById("compromat-progress").value = gameState.compromat;
}

function renderShowcaseProducts() {
    const box = document.getElementById("products-container");
    if (!box) return; box.innerHTML = "";
    gameState.products.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `<h4>${p.name}</h4><p>Склад: <b>${p.quantity} шт.</b></p><p style="font-size:0.7rem; color:#666;">Закупка: ${p.cost} 💎</p><input type="number" class="price-input" value="${p.userPrice}" onchange="changeProductPrice('${p.id}', this.value)"><button class="small-btn" style="width:100%; margin-top:5px;" onclick="openRestockModal('${p.id}')">📦 Закупка</button>`;
        box.appendChild(card);
    });
}

function changeProductPrice(id, newPrice) {
    const item = gameState.products.find(p => p.id === id);
    if (item && newPrice > 0) item.userPrice = parseInt(newPrice);
}

function sendMailMessage() {
    const input = document.getElementById("mail-input-field");
    if (!input || input.value.trim() === "") return;

    const userText = input.value.trim();
    const contact = gameState.activeContact;
    gameState.chats[contact].push({ text: userText, time: "Вы", incoming: false });
    input.value = "";
    renderChatMessages();

    setTimeout(() => {
        const responseType = AIDirector.getMailResponse(contact, userText);
        let replyText = "";

        if (responseType === "discount") replyText = "Ладно, твоя взяла! Оформляю накладные со скидкой 10%! 🚚";
        else if (responseType === "expensive") replyText = "Ценники ломают LOR Ваниллы! Сбавь кристаллы! 🛰️";
        else if (responseType === "threat") replyText = "Ты мне угрожаешь? Мои боты завалят тебя спамом единиц! 😈🔥";
        else if (responseType === "discount_pepto") replyText = "Скииидка! Обожаю халяву! Беру! 💰";
        else if (responseType === "joke") replyText = MAIL_RESPONSES.nahida.joke[Math.floor(Math.random() * MAIL_RESPONSES.nahida.joke.length)];
        else if (responseType === "market_good") replyText = MAIL_RESPONSES.nahida.market_good;
        else if (responseType === "market_bad") replyText = MAIL_RESPONSES.nahida.market_bad;
        else if (responseType === "default_nahida") replyText = MAIL_RESPONSES.nahida.default;
        else if (responseType === "пасхалка") {
            if (contact === "pepto") replyText = MAIL_RESPONSES.pepto.пасхалка;
            if (contact === "mushroom") replyText = MAIL_RESPONSES.mushroom.пасхалка;
            if (contact === "karas") replyText = MAIL_RESPONSES.karas.пасхалка;
            if (contact === "starlik") replyText = MAIL_RESPONSES.starlik.пасхалка;
            if (contact === "nahida") replyText = MAIL_RESPONSES.nahida.пасхалка;
        }
        else replyText = "Понял тебя. Ну, будет повод — спишемся на сервере. 👌";

        gameState.chats[contact].push({ text: replyText, time: "Только что", incoming: true });
        renderChatMessages();
    }, 800);
}

function clearCurrentChat() {
    const contact = gameState.activeContact;
    if (confirm(`Удалить логи переписки с [${contact.toUpperCase()}]?`)) {
        gameState.chats[contact] = [{ text: "🧹 Логи BBM стерты. Хакерская защита активна!", time: "BBM", incoming: true }];
        renderChatMessages();
    }
}

function renderChatMessages() {
    const box = document.getElementById("chat-messages-box");
    if (!box) return; box.innerHTML = "";
    const activeList = gameState.chats[gameState.activeContact] || [];
    activeList.forEach(m => {
        const msgNode = document.createElement("div");
        msgNode.className = `mail-message ${m.incoming ? "incoming" : "outgoing"}`;
        msgNode.innerHTML = `<div class="message-text">${m.text}</div><div class="message-time">${m.time}</div>`;
        box.appendChild(msgNode);
    });
    box.scrollTop = box.scrollHeight;
}

function selectContact(slug) {
    gameState.activeContact = slug;
    let displayName = slug.toUpperCase();
    if (slug === "karas") displayName = "KAPACb";
    if (slug === "starlik") displayName = "СТАРЛИК";
    if (slug === "nahida") displayName = "NAHIDA";
    if (slug === "pepto") displayName = "PETPO";
    if (slug === "mushroom") displayName = "ГРИБ";

    document.getElementById("current-contact-title").innerText = displayName;
    const nodes = document.querySelectorAll(".mail-contact");
    nodes.forEach(n => n.classList.remove("active"));
    if (event && event.currentTarget) event.currentTarget.classList.add("active");
    renderChatMessages();
}

// ЖЕСТКИЙ ФИКС DISPLAY: GRID ОТ СЛОМА ВЕРСТКИ
function switchTab(tab) {
    const contents = document.querySelectorAll(".window-content");
    const tabs = document.querySelectorAll(".window-tab");
    contents.forEach(c => { c.classList.remove("active"); c.style.display = "none"; });
    tabs.forEach(t => t.classList.remove("active"));

    const activeWindow = document.getElementById(`${tab}-window`);
    if (activeWindow) {
        activeWindow.classList.add("active");
        activeWindow.style.display = ""; // Освобождаем инлайн-стиль, доверяем CSS
    }
    if (event && event.currentTarget) event.currentTarget.classList.add("active");
}

function triggerNextDay() {
    document.getElementById("day-loading-screen").style.display = "flex";
    setTimeout(() => {
        const report = engine.simulateSales(); engine.rivalSabotage();
        updateUI(); renderShowcaseProducts();
        document.getElementById("day-loading-screen").style.display = "none";
    }, 600);
}

function triggerMarketing() { if (engine.applyMarketing()) updateUI(); }
function triggerLawsuit() { engine.sueRival(); updateUI(); }
function updateMoney(amount) { gameState.money += amount; }
function updateReputation(amount) { gameState.reputation = Math.max(0, Math.min(100, gameState.reputation + amount)); }
function addCompromat(amount) { gameState.compromat = Math.min(100, gameState.compromat + amount); }

function addExp(amount) {
    gameState.exp += amount;
    if (gameState.exp >= 1000 * gameState.level && gameState.level < 4) {
        gameState.exp = 0; gameState.level++; loadLevelProducts();
        alert(`Поздравляем! Уровень улья повышен до ${gameState.level}!`);
    }
}

// ИСПРАВЛЕННАЯ БЕЗОПАСНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ ОТЗЫВОВ
function generateRandomReview() {
    const slugs = ["pepto", "mushroom", "karas"];
    const slug = slugs[Math.floor(Math.random() * slugs.length)];
    const prod = gameState.products[Math.floor(Math.random() * gameState.products.length)];
    if (!prod) return;
    
    const isPositive = (prod.userPrice / prod.basePrice) <= 1.35;
    const txt = AIDirector.generateReviewText(slug, prod.name, isPositive, prod.userPrice);
    const authorName = REVIEWS_DB[slug] ? REVIEWS_DB[slug].authorName : slug.toUpperCase();

    const box = document.getElementById("reviews-container-box");
    if (!box) return;
    
    const card = document.createElement("div");
    card.className = "review-item";
    // Жестко и безопасно вшиваем чистый текст без ломания HTML-структуры
    card.innerHTML = `<p><b>[${prod.name}]</b> от <b>${authorName}</b>: ${txt}</p>`;
    box.insertBefore(card, box.firstChild);
}


function openRestockModal(id) {
    const p = gameState.products.find(item => item.id === id);
    const box = document.getElementById("supplier-items-list");
    box.innerHTML = `
        <div class="purchase-item">
            <span>${p.name} (В наличии: ${p.quantity} шт)</span>
            <div class="amount-picker">
                <label>Купить (шт):</label>
                <input type="number" id="restock-items-count" value="1" min="1" max="100" oninput="recalculateRestockCost('${p.id}')">
            </div>
            <div class="cost-tag">Итого: <b id="restock-total-cost">${p.cost}</b> 💎</div>
            <button class="small-btn buy-confirm-btn" onclick="buyCustomItems('${p.id}')">📦 Подтвердить закупку</button>
        </div>
    `;
    document.getElementById("supplier-modal").classList.add("active");
}

function recalculateRestockCost(id) {
    const p = gameState.products.find(item => item.id === id);
    let count = parseInt(document.getElementById("restock-items-count").value);
    if (isNaN(count) || count < 1) count = 1;
    document.getElementById("restock-total-cost").innerText = p.cost * count;
}

function buyCustomItems(id) {
    const p = gameState.products.find(item => item.id === id);
    let count = parseInt(document.getElementById("restock-items-count").value);
    if (isNaN(count) || count < 1) count = 1;
    const cost = p.cost * count;
    if (gameState.money >= cost) {
        gameState.money -= cost; p.quantity += count;
        updateUI(); renderShowcaseProducts(); closeSupplierModal();
    } else { alert("Не хватает кристаллов!"); }
}

function closeSupplierModal() { document.getElementById("supplier-modal").classList.remove("active"); }
function triggerResetGame() { if (confirm("Сбросить прогресс лора?")) { location.reload(); } }

function startGameEngine() { loadLevelProducts(); updateUI(); renderShowcaseProducts(); renderChatMessages(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startGameEngine);
else startGameEngine();
