const REVIEWS_DB = {
    pepto: {
        authorName: "PETPO",
        positive: [
            "Ого, {product} всего за {price} кристаллов! Да это же халява! 💰",
            "Наконец-то адекватная цена на {product}! PETPO доволен! 👍",
            "Сделка века! Раскупаем {product}, пока ценник не улетел в космос! 🚀"
        ],
        negative: [
            "{product} за {price}? Да ты с ума сошёл! Дорого, как у Старлика! 😡",
            "Скидку давай на {product}! Я за такие деньги лучше металлолом куплю! 🛰️"
        ]
    },
    mushroom: {
        authorName: "Гриб",
        positive: [
            "Пчёлы жужжат одобрительно! {product} по цене {price} — успех! 🐝",
            "Берёзовое заражение отступает, видя {product} за {price}! 🌲"
        ],
        negative: [
            "{product} за {price}? По лору это слишком дорого... 🕦",
            "Пчёлы недовольно жужжат! {product} по цене {price} — провал! 🛑"
        ]
    },
    karas: {
        authorName: "KAPACb",
        positive: [
            "{product} по {price} — норм, но минус админу всё равно поставлю! ✍",
            "Контора временно не говна. {product} куплен, но я слежу за тобой... 👁️"
        ],
        negative: [
            "{product} за {price}? ДА ВЫ ОХРЕНЕЛИ! ВЗОРВУ МАГАЗИН! 💥💀",
            "Антегрия за такое объявляет вам бойкот! Разнесу тут всё! 💣"
        ]
    }
};

const MAIL_RESPONSES = {
    supplier: { discount: "Хорошо, скидка 10%! 🚚", default: "Спасибо за заказ! Склады полны. 📦" },
    pepto: { 
        discount: "Ого, скидка! Беру! 💰", 
        expensive: "Дороговато... Сдай лучше на металлолом! 🛰️", 
        default: "Норм, возьму пару штук. 👌", 
        пасхалка: "Сам иди нафиг! Я вообще-то VIP-покупатель и единственный, кто твои ржавые спутники PETPO за кристаллы оценивал! 😡" 
    },
    mushroom: { 
        recipe: "Держи рецепт пчелиного почкования! +5 репутации! 🔬", 
        default: "Отличный выбор для ЛОРА! 🌲", 
        пасхалка: "Ассимиляция березовым 5G завершена. Я ухожу в изолятор, с токсинами на коленях общаться не намерен. 🕦" 
    },
    karas: { 
        threat: "Всем расскажу, что ты читер! 🐟", 
        default: "Ну такое... Пойду наковальню переименую. 🔨", 
        пасхалка: "ЧЁ СКАЗАЛ?! Всё, твоему улью хана! Мой клан Антегрия уже заходит на сервер со стаками динамита и X-Ray! 💥💀" 
    },
    starlik: { 
        threat: "Мои боты завалят твою витрину спамом единиц! 😈", 
        default: "Кибер-мёд рулит, твой бамбук устарел! 🏙️", 
        пасхалка: "Удалить этот магазин со Спавна немедленно! Бан по айпи и железу за жесткое неуважение к администрации проекта! ⛓️❌" 
    },
    nahida: {
        joke: [
            "🤖 Заходит Старлик в киберпанк-бар, а бармен ему говорит: 'Мы модераторов с синдромом вахтёра не обслуживаем!'. А Старлик отвечает: 'Я сам этот бар удалю!'",
            "🐟 Знаешь, почему KAPACb играет с Иксреем? Потому что без читов он не может найти даже собственную совесть!",
            "🐝 Купил Гриб пчелу, пытается её отпочковать, а она ему говорит: 'Березовый 5G не ловит, подсоби извне по-братски!'"
        ],
        market_good: "📈 Рынок стабилен! Цены оптимальные, репутация держится. Пчёлы работают отлично, доход идёт!",
        market_bad: "📉 Шухер! KAPACb вовсю спамит гневные отзывы, а Старлик душит налогами. Срочно снижай цены или запускай листовки!",
        default: "🤙 Я на связи! Пиши 'анекдот' — поржём, или 'что по рынку' — раскидаю за экономику.",
        пасхалка: "Ахахаха! Хорош! Напиши это Старлику в ЛС, у него вся серверная консоль синим пламенем сгорит! 😂🔥"
    }
};

class AIDirector {
    static generateReviewText(slug, productName, isPositive, currentPrice) {
        const character = REVIEWS_DB[slug];
        if (!character) return `${productName} за ${currentPrice} 💎? Норм!`;
        const pool = isPositive ? character.positive : character.negative;
        return pool[Math.floor(Math.random() * pool.length)].replace(/{product}/g, productName).replace(/{price}/g, currentPrice);
    }

    static getMailResponse(character, message) {
        const lower = message.toLowerCase();
        if (lower.includes("пошел нахуй") || lower.includes("пошла нахуй") || lower.includes("пшел нахуй")) return "пасхалка";

        if (character === "nahida") {
            if (lower.includes("анекдот") || lower.includes("рофл")) return "joke";
            if (lower.includes("рынок") || lower.includes("что по рынку")) return "market_good";
            return "default_nahida";
        }

        const triggers = { "скидк": "discount", "дорог": "expensive", "цена": "expensive", "бан": "threat", "взрыв": "threat" };
        for (let key in triggers) { if (lower.includes(key)) return triggers[key]; }
        return "default";
    }
}
