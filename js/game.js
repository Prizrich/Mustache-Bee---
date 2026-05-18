// ОБЪЕКТНО-ОРИЕНТИРОВАННЫЙ ДВИЖОК ЭКОНОМИКИ И СУДОВ
class MarketEngine {
    constructor(state) {
        this.state = state;
    }

    applyMarketing() {
        if (this.state.money < 500) {
            addMailMessage("system", "❌ Не хватает 500 💎 на рекламную кампанию!", true);
            return false;
        }
        this.state.money -= 500;
        this.state.marketingBonus = 1.4; // +40% к силе продаж
        addMailMessage("system", "📢 Реклама успешно запущена на всем Спавне! Покупатели повалят завтра!", true);
        return true;
    }

    simulateSales() {
        let report = { revenue: 0, exp: 0, itemsSold: 0 };

        this.state.products.forEach(prod => {
            if (prod.quantity <= 0) return;

            const markup = prod.userPrice / prod.basePrice;
            let priceFactor = 1.0;
            
            if (markup > 1.4) priceFactor = 0.3;        // Грабеж, клиенты недовольны
            else if (markup < 0.8) priceFactor = 1.6;   // Отличная скидка
            else if (markup < 1.1) priceFactor = 1.1;   // Хорошая цена

            const repFactor = 0.4 + (this.state.reputation / 100);
            let potentialSales = Math.floor(Math.random() * 3) + 1;
            
            let finalSales = Math.floor(potentialSales * priceFactor * repFactor * this.state.marketingBonus);
            finalSales = Math.max(0, Math.min(finalSales, prod.quantity));

            if (finalSales > 0) {
                let itemRevenue = finalSales * prod.userPrice;
                report.revenue += itemRevenue;
                report.itemsSold += finalSales;
                report.exp += finalSales * prod.expReward;
                prod.quantity -= finalSales;

                if (markup > 1.4) updateReputation(-3);
                else if (markup <= 1.1) updateReputation(2);
            }
        });

        updateMoney(Math.floor(report.revenue));
        addExp(report.exp);
        this.state.marketingBonus = 1.0; // Сброс баффа рекламы

        // Генерация случайных отзывов от VIP-ов на основе продаж
        const reviewCount = Math.min(3, report.itemsSold);
        for (let i = 0; i < reviewCount; i++) {
            generateRandomReview();
        }

        return report;
    }

    rivalSabotage() {
        if (this.state.defeatedRival) return;

        // Рейд ботов Карася и Старлика
        if (Math.random() < 0.40) {
            let loss = Math.floor(Math.random() * 250) + 50;
            this.state.money = Math.max(0, this.state.money - loss);
            updateReputation(-4);
            
            addMailMessage("starlik", `😈 Ха-ха! Мои кибер-боты обрушили тебе рейтинг! Убытки составили: -${loss} 💎!`, true);
            
            // Шанс перехватить компромат при атаке
            if (Math.random() < 0.50) {
                addCompromat(15);
                addMailMessage("system", "🔍 Внимание! Перехвачены логи бот-атаки KAPACb! Компромат на Старлика +15%!", true);
            }
        }
    }

    sueRival() {
        if (this.state.defeatedRival) return false;
        if (this.state.compromat < GAME_CONFIG.compromatNeeded) {
            alert("⚖️ Недостаточно улик! Накопи 100% компромата, перехватывая набеги KAPACb!");
            return false;
        }

        this.state.defeatedRival = true;
        this.state.rivalPower = 0;
        this.state.compromat = 100;
        
        updateMoney(8000); // Грант от со-создателей
        updateReputation(40);
        
        const courtWindow = document.getElementById("court-window");
        if (courtWindow) {
            courtWindow.innerHTML = `
                <div style="text-align:center; padding:20px;">
                    <h2 style="color:#d62828;">⚖️ СУД СВЕРШИЛСЯ! ⚖️</h2>
                    <p><b>Старлик официально отправлен в бан за коррупцию, кумовство и набеги ботов!</b></p>
                    <p style="font-size:3rem;">⛓️👨‍💼⛓️</p>
                    <p style="color:#2e7d32; font-weight:bold;">Усатый Пчёл утер нос киберпанк-диктатуре! Вы победили!</p>
                </div>
            `;
        }
        
        alert("🎉 ФИНАЛЬНАЯ МИССИЯ ВЫПОЛНЕНА! Папка с компроматом передана высшей инстанции. Старлик забанен!");
        return true;
    }
}

// ИНИЦИАЛИЗАЦИЯ И СТАРТОВОЕ СОСТОЯНИЕ ХАТЫ BBM С СИНХРОННЫМИ КЛЮЧАМИ И НИКАМИ
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
        system: [{ text: "📢 Добро пожаловать в мессенджер BBM! Управляй ульем, закупай товары и развивай свой медовый бизнес без чужой диктатуры! 🛠️🐝", time: "Система", incoming: true }],
        nahida: [{ text: "👋 Здарова! Я тут чекаю рынок Спавна. Если скучно — пиши 'анекдот' или 'что по рынку'!", time: "NAHIDA", incoming: true }],
        pepto: [{ text: "👀 Эй, хозяин! Цены кусаются... Скинь кристаллы за спутник PETPO!", time: "PETPO", incoming: true }],
        mushroom: [{ text: "🍄 Привет-привет! Как там пчёлы? Почкуются у алтаря?", time: "Гриб", incoming: true }],
        karas: [{ text: "🐟 Чё по чем? Дороговато у тебя... Мой клан Антегрия следит за витриной.", time: "KAPACb", incoming: true }],
        starlik: [{ text: "😈 Ха-ха! Твой магазин скоро закроется, мой киберпанк-спавн сожрет этот улей!", time: "Старлик", incoming: true }]
    }
};

const engine = new MarketEngine(gameState);

function loadLevelProducts() {
    gameState.products = [];
    for (let l = 1; l <= gameState.level; l++) {
        if (GAME_CONFIG.shopItemsByLevel[l]) {
            GAME_CONFIG.shopItemsByLevel[l].forEach(item => {
                gameState.products.push({
                    ...item,
                    quantity: 10,
                    userPrice: item.basePrice
                });
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
    if (!box) return;
    box.innerHTML = "";

    gameState.products.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <h4>${p.name}</h4>
            <p style="font-size:0.75rem; margin:2px 0;">Склад: <b id="stock-${p.id}">${p.quantity} шт.</b></p>
            <p style="font-size:0.7rem; color:#666;">Закупка: ${p.cost} 💎</p>
            <input type="number" class="price-input" id="price-of-${p.id}" value="${p.userPrice}" onchange="changeProductPrice('${p.id}', this.value)">
            <button class="small-btn" style="width:100%; margin-top:5px;" onclick="openRestockModal('${p.id}')">📦 Закупка</button>
        `;
        box.appendChild(card);
    });
}

function changeProductPrice(id, newPrice) {
    const item = gameState.products.find(p => p.id === id);
    if (item && newPrice > 0) item.userPrice = parseInt(newPrice);
}

// СИСТЕМА ОТПРАВКИ И ОБРАБОТКИ ОТВЕТОВ ИИ
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

        if (responseType === "discount") replyText = "Ладно, твоя взяла! По старой дружбе оформляю накладные со скидкой 10% на сырье! 🚚";
        else if (responseType === "expensive") replyText = "Ценники ломают LOR Ваниллы! Сбавь кристаллы, или эти спутники улетят обратно на металлолом! 🛰️";
        else if (responseType === "threat") replyText = "Ты мне угрожаешь? Мои боты завалят твою витрину спамом единиц, а базы взорвем динамитом! 😈🔥";
        else if (responseType === "discount_pepto") replyText = "Скииидка! Обожаю халяву! Буду закупаться у тебя медовыми конфетами вагонами! 💰";
        else if (responseType === "joke") {
            const pool = MAIL_RESPONSES.nahida.joke;
            replyText = pool[Math.floor(Math.random() * pool.length)];
        }
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

// ОЧИСТКА ТЕКУЩЕГО ЧАТА
function clearCurrentChat() {
    const contact = gameState.activeContact;
    if (confirm(`Вы уверены, что хотите стереть логи переписки с [${contact.toUpperCase()}]?`)) {
        gameState.chats[contact] = [];
        gameState.chats[contact].push({ 
            text: "🧹 Логи BBM успешно стерты. Хакерская защита активна, Старлик ничего не узнает!", 
            time: "BBM Безопасность", 
            incoming: true 
        });
        renderChatMessages();
    }
}

function renderChatMessages() {
    const box = document.getElementById("chat-messages-box");
    if (!box) return;
    box.innerHTML = "";

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
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    }
    renderChatMessages();
}

function switchTab(tab) {
    const contents = document.querySelectorAll(".window-content");
    const tabs = document.querySelectorAll(".window-tab");
    
    contents.forEach(c => c.classList.remove("active"));
    tabs.forEach(t => t.classList.remove("active"));

    document.getElementById(`${tab}-window`).classList.add("active");
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    }
}

function triggerNextDay() {
    document.getElementById("day-loading-screen").style.display = "flex";

    setTimeout(() => {
        const report = engine.simulateSales();
        engine.rivalSabotage();
        
        updateUI();
        renderShowcaseProducts();
        
        document.getElementById("day-loading-screen").style.display = "none";
        alert(`Новый день настал!\nВыручка: +${Math.floor(report.revenue)} 💎\nОпыт ЛОРА: +${report.exp}`);
    }, 600);
}

function triggerMarketing() { if (engine.applyMarketing()) updateUI(); }
function triggerLawsuit() { engine.sueRival(); updateUI(); }

function updateMoney(amount) { gameState.money += amount; }
function updateReputation(amount) { 
    gameState.reputation = Math.max(0, Math.min(100, gameState.reputation + amount)); 
}
function addExp(amount) {
    gameState.exp += amount;
    if (gameState.exp >= 1000 * gameState.level && gameState.level < 4) {
        gameState.exp = 0;
        gameState.level++;
        loadLevelProducts();
        alert(`Поздравляем! Уровень улья повышен до ${gameState.level}! Открыты новые товары от поставщиков!`);
    }
    if (gameState.exp >= 1000 * gameState.level) gameState.exp = 1000 * gameState.level;
}
function addCompromat(amount) { gameState.compromat = Math.min(100, gameState.compromat + amount); }

// ИСПРАВЛЕННАЯ СИНХРОНИЗИРОВАННАЯ ФУНКЦИЯ СЛУЧАЙНЫХ ОТЗЫВОВ ДЛЯ AI.JS
function generateRandomReview() {
    // Передаем системные строчные английские ID вместо кириллицы!
    const slugs = ["pepto", "mushroom", "karas"];
    const slug = slugs[Math.floor(Math.random() * slugs.length)];
    const prod = gameState.products[Math.floor(Math.random() * gameState.products.length)];
    
    if (!prod) return;
    const isPositive = (prod.userPrice / prod.basePrice) <= 1.35;
    
    // Передаем slug ИИ-директору
    const txt = AIDirector.generateReviewText(slug, prod.name, isPositive, prod.userPrice);
    
    // Достаем красивый каноничный ник капсом из базы ai.js
    const authorName = REVIEWS_DB[slug] ? REVIEWS_DB[slug].authorName : slug.toUpperCase();

    const box = document.getElementById("reviews-container-box");
    if (!box) return;
    
    const card = document.createElement("div");
    card.className = "review-item";
    card.style.borderLeft = isPositive ? "5px solid #4caf50" : "5px solid #f44336";
    card.innerHTML = `
        <div class="review-author">👤 ${authorName} <span class="review-rating">${isPositive?'⭐⭐⭐⭐⭐':'⭐'}</span></div>
        <p class="review-text"><b>[${prod.name}]:</b> ${txt}</p>
        <div class="review-time">Только что на Спавне</div>
    `;
    box.insertBefore(card, box.firstChild);
}

// ИНТЕРАКТИВНАЯ ПОШТУЧНАЯ ЗАКУПКА (1 К 1)
function openRestockModal(id) {
    const p = gameState.products.find(item => item.id === id);
    const box = document.getElementById("supplier-items-list");
    
    box.innerHTML = `
        <div class="purchase-item">
            <div class="purchase-info">
                <span>${p.name}</span>
                <small style="display:block; color:#7a5f33; margin-top:4px;">На складе: ${p.quantity} шт.</small>
            </div>
            <div class="purchase-item-controls">
                <div class="amount-picker">
                    <label>Купить (шт):</label>
                    <input type="number" id="restock-items-count" value="1" min="1" max="100" oninput="recalculateRestockCost('${p.id}')">
                </div>
                <div class="cost-tag">Итого к оплате: <b id="restock-total-cost">${p.cost}</b> 💎</div>
                <button class="small-btn buy-confirm-btn" onclick="buyCustomItems('${p.id}')">📦 Подтвердить закупку</button>
            </div>
        </div>
    `;
    document.getElementById("supplier-modal").classList.add("active");
}

function recalculateRestockCost(id) {
    const p = gameState.products.find(item => item.id === id);
    const input = document.getElementById("restock-items-count");
    let count = parseInt(input.value);
    
    if (isNaN(count) || count < 1) count = 1;
    
    const totalCost = p.cost * count;
    document.getElementById("restock-total-cost").innerText = totalCost;
}

function buyCustomItems(id) {
    const p = gameState.products.find(item => item.id === id);
    const input = document.getElementById("restock-items-count");
    let count = parseInt(input.value);
    
    if (isNaN(count) || count < 1) count = 1;
    
    const totalCost = p.cost * count;

    if (gameState.money >= totalCost) {
        gameState.money -= totalCost;
        p.quantity += count;
        
        updateUI();
        renderShowcaseProducts();
        closeSupplierModal();
        
        alert(`Успешно доставлено ${count} шт. товара со склада Вали! 🚚`);
    } else {
        alert("Не хватает кристаллов на закупку такого количества товара!");
    }
}

function closeSupplierModal() { document.getElementById("supplier-modal").classList.remove("active"); }

// НАДЁЖНЫЙ АВТОЗАПУСК ИГРОВОГО ДВИЖКА
function startGameEngine() {
    console.log("Движок Mustache Bee успешно запущен!");
    loadLevelProducts();
    updateUI();
    renderShowcaseProducts();
    renderChatMessages();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startGameEngine);
} else {
    startGameEngine();
}
