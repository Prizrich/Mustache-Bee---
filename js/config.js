const GAME_CONFIG = {
    shopItemsByLevel: {
        1: [
            { id: "honeyCandy", name: "🍬 Медовые конфеты", basePrice: 80, cost: 40, expReward: 15 },
            { id: "pumpkinPie", name: "🥧 Тыквенный пирог", basePrice: 150, cost: 80, expReward: 25 },
            { id: "dye", name: "🎨 Пищевой краситель", basePrice: 120, cost: 60, expReward: 20 }
        ],
        2: [
            { id: "soap", name: "🧼 Медовое мыло", basePrice: 250, cost: 130, expReward: 40 },
            { id: "waxCandle", name: "🕯️ Свеча-пчелка", basePrice: 320, cost: 160, expReward: 50 },
            { id: "satelliteToy", name: "🛰️ Медный спутник", basePrice: 450, cost: 200, expReward: 60 }
        ],
        3: [
            { id: "mead", name: "🍾 Медовуха", basePrice: 380, cost: 190, expReward: 55 },
            { id: "marshmallow", name: "🍥 Ягодный зефир", basePrice: 290, cost: 140, expReward: 45 },
            { id: "book", name: "📖 Книга «Почини все»", basePrice: 540, cost: 280, expReward: 80 }
        ],
        4: [
            { id: "dragonEgg", name: "🥚 Драконьи яички", basePrice: 890, cost: 450, expReward: 100 },
            { id: "goldHoney", name: "✨ Липовый мёд с золотом", basePrice: 1250, cost: 700, expReward: 150 },
            { id: "constructor", name: "⚙ Конструктор", basePrice: 990, cost: 520, expReward: 120 }
        ]
    },
    expRequirements: { 1: 0, 2: 1000, 3: 2500, 4: 5000, 5: 10000 },
    startMoney: 5000,
    startReputation: 50,
    compromatNeeded: 100
};

const MAIL_DIALOGS = {
    system: { name: "Система" },
    supplier: { name: "Поставщики" },
    pepto: { name: "Пепто" },
    mushroom: { name: "Гриб" },
    karas: { name: "Карась" },
    starlik: { name: "Старлик" },
    nahida: { name: "Нахида" }
};
