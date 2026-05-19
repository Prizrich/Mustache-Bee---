let audioEnabled = false;
let soundsVolume = 70;
let audioContext = null;

const soundEffects = {
    match: { frequency: 523.25, duration: 0.15 },
    win: { frequency: 783.99, duration: 0.3 },
    click: { frequency: 440.00, duration: 0.08 },
    mail: { frequency: 659.25, duration: 0.12 },
    buy: { frequency: 349.23, duration: 0.1 }
};

function initAudio() {
    if (audioEnabled) return;
    audioEnabled = true;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {}
    const unlockAudio = () => {
        if (audioContext && audioContext.state === "suspended") audioContext.resume();
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    loadAudioSettings();
}

function playSound(soundName) {
    if (!audioEnabled || soundsVolume === 0 || !audioContext) return;
    const effect = soundEffects[soundName];
    if (!effect) return;
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = effect.frequency;
        oscillator.type = "sine";
        gainNode.gain.value = soundsVolume / 100;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + effect.duration);
        oscillator.stop(audioContext.currentTime + effect.duration);
    } catch(e) {}
}

function updateSoundsVolume(value) { soundsVolume = value; saveAudioSettings(); }
function updateMusicVolume(value) { saveAudioSettings(); }

function saveAudioSettings() {
    localStorage.setItem("usatyPchelAudio", JSON.stringify({ soundsVolume }));
}

function loadAudioSettings() {
    const saved = localStorage.getItem("usatyPchelAudio");
    if (saved) {
        try { soundsVolume = JSON.parse(saved).soundsVolume ?? 70; } catch(e) {}
    }
}