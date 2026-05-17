let uiElements = {};

document.addEventListener("DOMContentLoaded", async () => {
    loadGameProgress();
    loadAudioSettings();
    initProducts();
    initAudio();
    await initAI();
    
    uiElements = {
        moneySpan: document.getElementById("money"),
        repSpan: document.getElementById("reputation"),
        levelSpan: document.getElementById("level"),
        expSpan: document.getElementById("exp"),
        expNeededSpan: document.getElementById("expNeeded"),
        productsDiv: document.getElementById("products-area"),
        reviewsList: document.getElementById("reviews-list"),
        avgRatingSpan: document.getElementById("avgRating"),
        reviewsCountSpan: document.getElementById("reviewsCount"),
        rivalProgress: document.getElementById("rival-progress"),
        rivalPowerValue: document.getElementById("rivalPowerValue"),
        compromatProgress: document.getElementById("compromat-progress"),
        compromatValue: document.getElementById("compromatValue"),
        compromatMax: document.getElementById("compromatMax"),
        confrontBtn: document.getElementById("confront-rival-btn"),
        sueBtn: document.getElementById("sue-rival-btn"),
        mailMessagesDiv: document.getElementById("mail-messages"),
        currentContactSpan: document.getElementById("currentContact"),
        mailInput: document.getElementById("mail-input"),
        sendMailBtn: document.getElementById("send-mail-btn"),
        refreshMailBtn: document.getElementById("refresh-mail-btn"),
        clearChatBtn: document.getElementById("clear-chat-btn"),
        respondReviewsBtn: document.getElementById("respond-to-reviews-btn"),
        openPurchaseBtn: document.getElementById("open-purchase-modal"),
        closePurchaseBtn: document.getElementById("close-purchase-modal"),
        purchaseModal: document.getElementById("purchase-modal"),
        resultModal: document.getElementById("result-modal"),
        resultCloseBtn: document.getElementById("result-close-btn"),
        marketingBtn: document.getElementById("marketing-btn"),
        nextDayBtn: document.getElementById("next-day-btn"),
        saveGameBtn: document.getElementById("save-game-btn"),
        resetGameBtn: document.getElementById("reset-game-btn"),
        manualSaveBtn: document.getElementById("manual-save-btn"),
        hardResetBtn: document.getElementById("hard-reset-btn"),
        confirmModal: document.getElementById("confirm-modal"),
        confirmYes: document.getElementById("confirm-yes"),
        confirmNo: document.getElementById("confirm-no"),
        confirmText: document.getElementById("confirm-text")
    };
    
    function renderProducts() {
        if (!uiElements.productsDiv) return;
        uiElements.productsDiv.innerHTML = "";
        for (let prod of gameState.products) {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
                <h4>${prod.name}</h4>
                <div>📦 ${prod.quantity} шт</div>
                <div>💰 Себест: ${prod.cost}₽</div>
                <div>💵 База: ${prod.basePrice}₽</div>
                <input type="number" id="price-${prod.id}" class="price-input" value="${prod.userPrice}" step="5">
                <button data-id="${prod.id}" class="set-price-btn action-btn" style="margin-top:8px;">💲 Установить</button>
                <div id="feedback-${prod.id}" class="price-feedback"></div>
            `;
            uiElements.productsDiv.appendChild(card);
        }
        document.querySelectorAll(".set-price-btn").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const newPrice = parseInt(document.getElementById(`price-${id}`).value);
                const result = setProductPriceWithAI(id, newPrice);
                const fd = document.getElementById(`feedback-${id}`);
                if (fd && result.feedback) {
                    fd.textContent = result.feedback;
                    fd.className = `price-feedback ${result.reputationChange > 0 ? 'good' : (result.reputationChange < 0 ? 'bad' : '')}`;
                    setTimeout(() => { fd.textContent = ""; fd.className = "price-feedback"; }, 3000);
                }
                renderProducts();
                updateStatsUI();
            };
        });
    }
    
    function updateStatsUI() {
        if (uiElements.moneySpan) uiElements.moneySpan.innerText = Math.floor(gameState.money);
        if (uiElements.repSpan) uiElements.repSpan.innerText = Math.floor(gameState.reputation);
        if (uiElements.levelSpan) uiElements.levelSpan.innerText = gameState.level;
        if (uiElements.expSpan) uiElements.expSpan.innerText = gameState.exp;
        if (uiElements.expNeededSpan) {
            const needed = getExpNeeded();
            uiElements.expNeededSpan.innerText = needed === Infinity ? "MAX" : needed;
        }
        if (uiElements.rivalProgress) uiElements.rivalProgress.value = gameState.rivalPower;
        if (uiElements.rivalPowerValue) uiElements.rivalPowerValue.innerText = gameState.rivalPower;
        if (uiElements.compromatProgress) uiElements.compromatProgress.value = gameState.compromat;
        if (uiElements.compromatValue) uiElements.compromatValue.innerText = gameState.compromat;
        if (uiElements.compromatMax) uiElements.compromatMax.innerText = GAME_CONFIG.compromatNeeded;
        if (uiElements.sueBtn) {
            uiElements.sueBtn.style.display = (gameState.level >= 5 && gameState.compromat >= 100 && !gameState.suedRival) ? "inline-block" : "none";
        }
        if (uiElements.avgRatingSpan) uiElements.avgRatingSpan.innerText = updateAverageRating();
        if (uiElements.reviewsCountSpan) uiElements.reviewsCountSpan.innerText = gameState.reviews.length;
        updateSaveSlotDisplay();
    }
    
    async function renderReviews() {
        if (!uiElements.reviewsList) return;
        uiElements.reviewsList.innerHTML = "";
        for (let review of gameState.reviews.slice(0, 20)) {
            const div = document.createElement("div");
            div.className = "review-item";
            const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
            div.innerHTML = `
                <div class="review-author"><span><b>${review.author}</b></span><span class="review-rating">${stars}</span></div>
                <div class="review-text">"${review.text}"</div>
                <div class="review-time">${review.time}</div>
                ${review.responded ? '<span class="review-responded">✅ Ответ получен</span>' : '<span class="review-responded" style="background:#ffcc66;">⏳ Ожидает ответа</span>'}
            `;
            uiElements.reviewsList.appendChild(div);
        }
        uiElements.reviewsList.scrollTop = 0;
    }
    
    function renderMail() {
        if (!uiElements.mailMessagesDiv) return;
        const messages = gameState.mailLogs[gameState.currentContact] || [];
        uiElements.mailMessagesDiv.innerHTML = "";
        for (let msg of messages) {
            const div = document.createElement("div");
            div.className = `mail-message ${msg.incoming ? 'incoming' : 'outgoing'}`;
            div.innerHTML = `<div class="message-text">${msg.text}</div><div class="message-time">${msg.time}</div>`;
            uiElements.mailMessagesDiv.appendChild(div);
        }
        uiElements.mailMessagesDiv.scrollTop = 0;
    }
    
    function showConfirmModal(message, onConfirm) {
        if (uiElements.confirmText) uiElements.confirmText.innerText = message;
        if (uiElements.confirmModal) uiElements.confirmModal.classList.add("active");
        const confirmHandler = () => {
            onConfirm();
            uiElements.confirmModal.classList.remove("active");
            if (uiElements.confirmYes) uiElements.confirmYes.removeEventListener("click", confirmHandler);
            if (uiElements.confirmNo) uiElements.confirmNo.removeEventListener("click", cancelHandler);
        };
        const cancelHandler = () => {
            uiElements.confirmModal.classList.remove("active");
            if (uiElements.confirmYes) uiElements.confirmYes.removeEventListener("click", confirmHandler);
            if (uiElements.confirmNo) uiElements.confirmNo.removeEventListener("click", cancelHandler);
        };
        uiElements.confirmYes.addEventListener("click", confirmHandler);
        uiElements.confirmNo.addEventListener("click", cancelHandler);
    }
    
    async function sendMessage() {
        const text = uiElements.mailInput?.value.trim();
        if (!text) return;
        const contact = gameState.currentContact;
        addMailMessage(contact, text, false);
        const indicator = document.createElement("div");
        indicator.className = "mail-message incoming";
        indicator.style.opacity = "0.5";
        indicator.style.fontStyle = "italic";
        indicator.innerHTML = `<div class="message-text">✍️ ${MAIL_DIALOGS[contact]?.name || contact} печатает...</div>`;
        uiElements.mailMessagesDiv.insertBefore(indicator, uiElements.mailMessagesDiv.firstChild);
        uiElements.mailMessagesDiv.scrollTop = 0;
        const response = await getAIResponseAsync(contact, text);
        indicator.remove();
        if (response) addMailMessage(contact, response, true);
        renderMail();
        playSound("mail");
        uiElements.mailInput.value = "";
    }
    
    // Вкладки
    document.querySelectorAll(".window-tab").forEach(tab => {
        tab.onclick = () => {
            const windowId = tab.dataset.window;
            document.querySelectorAll(".window-tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".window-content").forEach(w => w.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(`${windowId}-window`).classList.add("active");
            if (windowId === "reviews") renderReviews();
            if (windowId === "mail") renderMail();
            if (windowId === "save") updateSaveSlotDisplay();
        };
    });
    
    // Контакты
    document.querySelectorAll(".mail-contact").forEach(contact => {
        contact.onclick = () => {
            const contactId = contact.dataset.contact;
            document.querySelectorAll(".mail-contact").forEach(c => c.classList.remove("active"));
            contact.classList.add("active");
            gameState.currentContact = contactId;
            uiElements.currentContactSpan.innerText = MAIL_DIALOGS[contactId]?.name || contactId;
            renderMail();
        };
    });
    
    // Обработчики кнопок
    if (uiElements.sendMailBtn) uiElements.sendMailBtn.onclick = sendMessage;
    if (uiElements.mailInput) uiElements.mailInput.onkeypress = (e) => { if (e.key === "Enter") sendMessage(); };
    if (uiElements.refreshMailBtn) uiElements.refreshMailBtn.onclick = renderMail;
    if (uiElements.clearChatBtn) {
        uiElements.clearChatBtn.onclick = () => {
            showConfirmModal(`Очистить чат с ${MAIL_DIALOGS[gameState.currentContact]?.name || gameState.currentContact}?`, () => {
                clearChat(gameState.currentContact);
                renderMail();
                playSound("click");
            });
        };
    }
    if (uiElements.respondReviewsBtn) {
        uiElements.respondReviewsBtn.onclick = async () => {
            replyToReviews();
            renderReviews();
            updateStatsUI();
        };
    }
    if (uiElements.confrontBtn) {
        uiElements.confrontBtn.onclick = () => {
            confrontRival();
            updateStatsUI();
            renderMail();
        };
    }
    if (uiElements.sueBtn) {
        uiElements.sueBtn.onclick = () => {
            sueRival();
            updateStatsUI();
        };
    }
    if (uiElements.marketingBtn) {
        uiElements.marketingBtn.onclick = () => {
            applyMarketing();
            updateStatsUI();
        };
    }
    if (uiElements.nextDayBtn) {
        uiElements.nextDayBtn.onclick = async () => {
            if (!gameState.suedRival) {
                await nextDay();
                updateStatsUI();
                renderProducts();
                await renderReviews();
                renderMail();
                playSound("click");
            }
        };
    }
    if (uiElements.saveGameBtn) uiElements.saveGameBtn.onclick = () => { manualSave(); updateStatsUI(); };
    if (uiElements.manualSaveBtn) uiElements.manualSaveBtn.onclick = () => { manualSave(); updateStatsUI(); };
    if (uiElements.resetGameBtn) {
        uiElements.resetGameBtn.onclick = () => {
            showConfirmModal("Сбросить прогресс? Всё будет потеряно!", () => {
                resetGame();
                initProducts();
                updateStatsUI();
                renderProducts();
                renderReviews();
                renderMail();
                playSound("click");
            });
        };
    }
    if (uiElements.hardResetBtn) {
        uiElements.hardResetBtn.onclick = () => {
            showConfirmModal("ПОЛНЫЙ СБРОС! Вы уверены?", () => {
                resetGame();
                initProducts();
                updateStatsUI();
                renderProducts();
                renderReviews();
                renderMail();
                playSound("click");
            });
        };
    }
    if (uiElements.openPurchaseBtn) {
        uiElements.openPurchaseBtn.onclick = () => {
            const list = document.getElementById("purchase-list");
            if (list) {
                list.innerHTML = "";
                for (let prod of gameState.products) {
                    const item = document.createElement("div");
                    item.className = "purchase-item";
                    item.innerHTML = `
                        <div><b>${prod.name}</b><br>💰 ${prod.cost}₽<br>📦 ${prod.quantity} шт</div>
                        <div class="purchase-item-controls">
                            <input type="number" id="qty-${prod.id}" value="1" min="1" max="99">
                            <button data-id="${prod.id}" class="purchase-confirm-btn action-btn">КУПИТЬ</button>
                        </div>
                    `;
                    list.appendChild(item);
                }
                document.querySelectorAll(".purchase-confirm-btn").forEach(btn => {
                    btn.onclick = () => {
                        const id = btn.dataset.id;
                        const qty = parseInt(document.getElementById(`qty-${id}`).value) || 1;
                        const result = buySpecificProduct(id, qty);
                        addMailMessage("system", result.message, true);
                        renderMail();
                        updateStatsUI();
                        renderProducts();
                        playSound("buy");
                    };
                });
            }
            uiElements.purchaseModal.classList.add("active");
        };
    }
    if (uiElements.closePurchaseBtn) uiElements.closePurchaseBtn.onclick = () => { uiElements.purchaseModal.classList.remove("active"); };
    if (uiElements.resultCloseBtn) uiElements.resultCloseBtn.onclick = () => { uiElements.resultModal.classList.remove("active"); };
    
    async function fullRefresh() {
        updateStatsUI();
        renderProducts();
        await renderReviews();
        renderMail();
    }
    
    gameState.currentContact = "system";
    if (uiElements.currentContactSpan) uiElements.currentContactSpan.innerText = "Система";
    await fullRefresh();
    updateSaveSlotDisplay();
    renderMail();
});