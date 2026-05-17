const REVIEWS_DB = {
    Пепто: {
        positive: [
            "Ого, {product} всего за {price} кристаллов! Да это же халява! 🎉",
            "Наконец-то адекватная цена на {product}! Пепто доволен! 👍",
            "{product} - это то, что я искал! И цена {price} - сказка! ✨"
        ],
        negative: [
            "{product} за {price}? Да ты с ума сошёл! Дорого как у Старлика! 😡",
            "Скидку давай на {product}! Я за такие деньги лучше металлолом куплю! 🦊💢"
        ]
    },
    Гриб: {
        positive: [
            "Пчёлы жужжат одобрительно! {product} по цене {price} - успех! 🐝",
            "Берёзовое заражение отступает, видя {product} за {price}! 🍄"
        ],
        negative: [
            "{product} за {price}? По лору это слишком дорого... 😒",
            "Пчёлы недовольно жужжат! {product} по цене {price} - провал! 🐝"
        ]
    },
    Карась: {
        positive: [
            "{product} по {price} - норм, но минус админу всё равно поставлю! 👎",
            "Респект за {product}! Но оценки всё равно снижу! 🐟"
        ],
        negative: [
            "{product} за {price}? ДА ВЫ ОХРЕНЕЛИ! ВЗОРВУ МАГАЗИН! 💣💀",
            "Минус магазину! {price} за {product} - развод чистой воды! 😡"
        ]
    }
};

const MAIL_RESPONSES = {
    supplier: { discount: "Хорошо, скидка 10%! 🎉", default: "Спасибо за заказ! 📦" },
    pepto: { discount: "Ого, скидка! Беру! 🎉", expensive: "Дороговато... 🦊", default: "Норм, возьму 👍" },
    mushroom: { recipe: "Держи рецепт! +5 репутации! 🍄", default: "Отличный выбор! 🐝" },
    karas: { threat: "Всем расскажу! 💢", default: "Ну такое... 🚶" },
    starlik: { threat: "Мои боты завалят тебя! 🤖", default: "Кибер-мёд рулит! 👾" },
    system: { tip: "Отвечайте на отзывы! 💡", default: "Хорошего дня! ☀️" }
};

function generateReview(author, productName, isPositive, currentPrice) {
    const authorReviews = REVIEWS_DB[author];
    if (!authorReviews) return `${productName} за ${currentPrice}? Хорошо! 👍`;
    const reviewList = isPositive ? authorReviews.positive : authorReviews.negative;
    let review = reviewList[Math.floor(Math.random() * reviewList.length)];
    review = review.replace(/{product}/g, productName);
    review = review.replace(/{price}/g, currentPrice);
    return review;
}

function getAIResponse(character, userMessage) {
    const responses = MAIL_RESPONSES[character] || MAIL_RESPONSES.system;
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes("скидк")) return responses.discount || responses.default;
    if (lowerMsg.includes("дорог")) return responses.expensive || responses.default;
    if (lowerMsg.includes("рецепт")) return responses.recipe || responses.default;
    if (lowerMsg.includes("компромат") || lowerMsg.includes("суд")) return responses.threat || responses.default;
    return responses.default;
}

async function getAIResponseAsync(character, userMessage) {
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
    return getAIResponse(character, userMessage);
}

async function initAI() {
    console.log("🤖 ИИ инициализирован");
    return true;
}