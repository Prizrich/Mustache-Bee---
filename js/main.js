let uiElements = {};

document.addEventListener("DOMContentLoaded", async () => {
    loadGameProgress();
    loadAudioSettings();
    if (gameState.products.length === 0) initProducts();
    initAudio();
    
    uiElements = {
        moneySpan: document.getElementById("money"),
        repSpan: document.getElementById("reputation"),
        levelSpan: document.getElementById("level"),
        expSpan: document.getElementById("exp"),
        productsDiv: document.getElementById("products-area"),
        reviewsList: document.getElementById("reviews-list"),
        rivalPowerValue: document.getElementById("rivalPowerValue"),
        compromatProgress: document.getElementById("compromat-progress"),
        compromatValue: document.getElementById("compromatValue"),
        sueBtn: document.getElementById("sue-rival-btn"),
        mailMessagesDiv: document.getElementById("mail-messages"),
        currentContactSpan: document.getElementById("currentContact"),
        mailInput: document.getElementById("mail-input"),
        sendMailBtn: document.getElementById("send-mail-btn"),
        nextDayBtn: document.getElementById("next-day-btn")
    };

    // РЕНДЕР КАРТОЧЕК ВИТРИНЫ
    function renderProducts() {
        if (!uiElements.productsDiv) return;
        uiElements.productsDiv.innerHTML = "";
        
        gameState.products.forEach(prod => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
                <h4>${prod.name}</h4>
                <div class="prod-stat">📦 Склад: <b>${prod.quantity} шт</b></div>
                <div class="prod-stat">💵 Себест: ${prod.cost}💎</div>
                <div class="prod-stat">⚖ Базовая: ${prod.basePrice}💎</div>
                <div class="price-input-row">
                    <input type="number" id="price-${prod.id}" value="${prod.userPrice}" step="5">
                    <button data-id="${prod.id}" class="set-price-btn">Установить</button>
                </div>
                <div id="feedback-${prod.id}" class="price-feedback"></div>
            `;
            uiElements.productsDiv.appendChild(card);
        });

        document.querySelectorAll(".set-price-btn").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const price = parseInt(document.getElementById(`price-${id}`).value);
                const res = setProductPriceWithAI(id, price);
                const fd = document.getElementById(`feedback-${id}`);
                if (fd && res.feedback) {
                    fd.textContent = res.feedback;
                    fd.className = `price-feedback ${res.reputationChange >= 0 ? 'good' : 'bad'}`;
                    setTimeout(() => { fd.textContent = ""; }, 2500);
                }
                fullRefresh();
            };
        });
    }

    function updateStatsUI() {
        if (uiElements.moneySpan) uiElements.moneySpan.innerText = Math.floor(gameState.money);
        if (uiElements.repSpan) uiElements.repSpan.innerText = Math.floor(gameState.reputation);
        if (uiElements.levelSpan) uiElements.levelSpan.innerText = gameState.level;
        if (uiElements.expSpan) uiElements.expSpan.innerText = gameState.exp;
        if (uiElements.rivalPowerValue) uiElements.rivalPowerValue.innerText = gameState.rivalPower;
        if (uiElements.compromatProgress) uiElements.compromatProgress.value = gameState.compromat;
        if (uiElements.compromatValue) uiElements.compromatValue.innerText = gameState.compromat;
        
        if (uiElements.sueBtn) {
            uiElements.sueBtn.style.display = (gameState.level >= 5 && gameState.compromat >= 100 && !gameState.suedRival) ? "block" : "none";
        }
    }

    function renderReviews() {
        if (!uiElements.reviewsList) return;
        uiElements.reviewsList.innerHTML = "";
        gameState.reviews.slice(0, 15).forEach(rev => {
            const div = document.createElement("div");
            div.className = "review-item";
            const stars = "★".repeat(rev.rating) + "☆".repeat(5 - rev.rating);
            div.innerHTML = `
                <div class="review-header"><b>${rev.author}</b> <span class="stars">${stars}</span></div>
                <div class="review-content">"${rev.text}"</div>
                <small>${rev.time}</small>
            `;
            uiElements.reviewsList.appendChild(div);
        });
    }

    function renderMail() {
        if (!uiElements.mailMessagesDiv) return;
        const messages = gameState.mailLogs[gameState.currentContact] || [];
        uiElements.mailMessagesDiv.innerHTML = "";
        messages.forEach(msg => {
            const div = document.createElement("div");
            div.className = `mail-message ${msg.incoming ? 'incoming' : 'outgoing'}`;
            div.innerHTML = `<div class="msg-text">${msg.text}</div><small>${msg.time}</small>`;
            uiElements.mailMessagesDiv.appendChild(div);
        });
    }

    async function sendMessage() {
        const text = uiElements.mailInput?.value.trim();
        if (!text) return;
        const contact = gameState.currentContact;
        
        addMailMessage(contact, text, false);
        renderMail();
        playSound("click");
        uiElements.mailInput.value = "";

        // Плавный ИИ-индикатор "печатает..."
        const placeholder = document.createElement("div");
        placeholder.className = "mail-message incoming processing";
        placeholder.innerHTML = `<div class="msg-text">✍ Собеседник печатает...</div>`;
        uiElements.mailMessagesDiv.insertBefore(placeholder, uiElements.mailMessagesDiv.firstChild);

        const ans = await AIDirector.getMailResponse(contact, text);
        placeholder.remove();
        
        addMailMessage(contact, ans, true);
        renderMail();
        playSound("mail");
    }

    // ТАБЫ И КОНТАКТЫ
    document.querySelectorAll(".window-tab").forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll(".window-tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".window-content").forEach(w => w.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(`${tab.dataset.window}-window`).classList.add("active");
        };
    });

    document.querySelectorAll(".mail-contact").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".mail-contact").forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            gameState.currentContact = btn.dataset.contact;
            uiElements.currentContactSpan.innerText = MAIL_DIALOGS[btn.dataset.contact]?.name || "Чат";
            renderMail();
        };
    });

    // ОБРАБОТКА КНОПКИ СЛЕДУЮЩЕГО ДНЯ С ЭКРАНОМ ЗАГРУЗКИ
    if (uiElements.nextDayBtn) {
        uiElements.nextDayBtn.onclick = async () => {
            const screen = document.getElementById("day-loading-screen");
            if (screen) screen.style.display = "flex";
            playSound("click");

            setTimeout(async () => {
                await engine.nextDay();
                await fullRefresh();
                if (screen) screen.style.display = "none";
            }, 600);
        };
    }

    if (uiElements.sendMailBtn) uiElements.sendMailBtn.onclick = sendMessage;
    if (uiElements.mailInput) uiElements.mailInput.onkeypress = (e) => { if (e.key === "Enter") sendMessage(); };
    
    document.getElementById("marketing-btn").onclick = () => { engine.applyMarketing(); updateStatsUI(); };
    document.getElementById("sue-rival-btn").onclick = () => { engine.sueRival(); updateStatsUI(); };
    document.getElementById("open-purchase-modal").onclick = () => { openPurchaseModal(); };
    document.getElementById("close-purchase-modal").onclick = () => { document.getElementById("purchase-modal").classList.remove("active"); };

    function openPurchaseModal() {
        const list = document.getElementById("purchase-list");
        list.innerHTML = "";
        gameState.products.forEach(p => {
            const row = document.createElement("div");
            row.className = "purchase-row";
            row.innerHTML = `
                <span><b>${p.name}</b> (${p.quantity} шт) - ${p.cost}💎/ед.</span>
                <div class="buy-row-actions">
                    <input type="number" id="buy-qty-${p.id}" value="5" min="1" max="50">
                    <button class="confirm-buy-btn" data-id="${p.id}">Купить</button>
                </div>
            `;
            list.appendChild(row);
        });

        document.querySelectorAll(".confirm-buy-btn").forEach(b => {
            b.onclick = () => {
                const id = b.dataset.id;
                const qty = parseInt(document.getElementById(`buy-qty-${id}`).value) || 5;
                const res = buySpecificProduct(id, qty);
                alert(res.message);
                fullRefresh();
                openPurchaseModal();
            };
        });
        document.getElementById("purchase-modal").classList.add("active");
    }

    async function fullRefresh() {
        updateStatsUI();
        renderProducts();
        renderReviews();
        renderMail();
    }

    window.updateSaveSlotDisplay = () => {}; // Заглушка интерфейса сохранения
    await fullRefresh();
});
