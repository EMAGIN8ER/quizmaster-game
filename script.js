// Game Constants and State
const API_URL = 'https://opentdb.com/api.php';
const TOTAL_QUESTIONS = 10;
const TIME_PER_QUESTION = 15;

let gameState = {
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    timer: null,
    timeLeft: TIME_PER_QUESTION,
    canAnswer: false,
    hintUsedThisQuestion: false
};

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen')
};

const elements = {
    category: document.getElementById('category'),
    difficulty: document.getElementById('difficulty'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    progressFill: document.getElementById('progress-bar'),
    questionCounter: document.getElementById('question-counter'),
    scoreDisplay: document.getElementById('score-display'),
    timerText: document.getElementById('timer-text'),
    timerProgress: document.getElementById('timer-progress'),
    finalScore: document.getElementById('final-score'),
    correctCount: document.getElementById('correct-count'),
    bestStreak: document.getElementById('best-streak'),
    resultTitle: document.getElementById('result-title'),
    particles: document.getElementById('particles'),
    hintBtn: document.getElementById('hint-btn'),
    hintModal: document.getElementById('hint-modal'),
    hintInput: document.getElementById('hint-input'),
    cancelHint: document.getElementById('cancel-hint'),
    secretTrigger: document.getElementById('secret-trigger'),
    secretModal: document.getElementById('secret-modal'),
    secretInput: document.getElementById('secret-input'),
    cancelSecret: document.getElementById('cancel-secret')
};

let unlockState = {
    count: 0,
    target: 10
};

let hintState = {
    count: 0,
    target: 5
};

// --- Initialization ---

function init() {
    createParticles();
    elements.startBtn.addEventListener('click', () => {
        if (elements.category.value === 'brainrot' && unlockState.count < unlockState.target) {
            showUnlockModal();
        } else {
            startQuiz();
        }
    });
    elements.restartBtn.addEventListener('click', () => {
        showScreen('start');
        unlockState.count = 0; // Reset on restart
    });
    
    // Unlock Logic
    const unlockInput = document.getElementById('unlock-input');
    const unlockModal = document.getElementById('unlock-modal');
    const cancelUnlock = document.getElementById('cancel-unlock');
    const unlockCounter = document.getElementById('unlock-counter');

    unlockInput.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase().trim() === 'brainrot') {
            unlockState.count++;
            unlockCounter.innerText = `${unlockState.count}/${unlockState.target}`;
            e.target.value = '';
            
            if (unlockState.count >= unlockState.target) {
                unlockModal.classList.remove('active');
                startQuiz();
            }
        }
    });

    cancelUnlock.addEventListener('click', () => {
        unlockModal.classList.remove('active');
        unlockState.count = 0;
        unlockCounter.innerText = `0/10`;
        unlockInput.value = '';
    });

    [unlockInput, elements.hintInput].forEach(i => i.addEventListener('paste', e => e.preventDefault()));


    // Hint Logic
    const hintCounter = document.getElementById('hint-counter');

    elements.hintBtn.addEventListener('click', () => {
        if (!gameState.canAnswer || gameState.hintUsedThisQuestion) return;
        clearInterval(gameState.timer); // Pause the timer
        elements.hintModal.classList.add('active');
        elements.hintInput.value = '';
        elements.hintInput.focus();
        hintState.count = 0; // Reset count
        hintCounter.innerText = `0/5`;
    });

    elements.hintInput.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase().trim() === 'i want a hint prety pls') {
            hintState.count++;
            hintCounter.innerText = `${hintState.count}/5`;
            e.target.value = '';
            
            if (hintState.count >= hintState.target) {
                elements.hintModal.classList.remove('active');
                applyHint();
                startTimer(); // Resume the timer
            }
        }
    });

    elements.cancelHint.addEventListener('click', () => {
        elements.hintModal.classList.remove('active');
        startTimer(); // Resume the timer
    });

    // Secret Logic
    elements.secretTrigger.addEventListener('click', () => {
        elements.secretModal.classList.add('active');
        elements.secretInput.value = '';
        elements.secretInput.focus();
    });

    elements.secretInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const code = e.target.value.trim().toLowerCase();
            if (code === '67') {
                elements.secretModal.classList.remove('active');
                startQuiz('secret67');
            } else if (code === 'the one piece is real!!!') {
                elements.secretModal.classList.remove('active');
                startQuiz('onepiece');
            } else {
                e.target.value = '';
                e.target.placeholder = 'INVALID CODE';
                setTimeout(() => { e.target.placeholder = 'CODE?'; }, 1000);
            }
        }
    });

    elements.cancelSecret.addEventListener('click', () => {
        elements.secretModal.classList.remove('active');
    });
}

function applyHint() {
    if (gameState.hintUsedThisQuestion) return;
    gameState.hintUsedThisQuestion = true;
    gameState.score -= 50; // Penalty for using a hint
    elements.scoreDisplay.innerText = gameState.score;
    
    const options = Array.from(document.querySelectorAll('.option'));
    const currentQuestion = gameState.questions[gameState.currentIndex];
    const correctAnswerText = decodeHTML(currentQuestion.correct_answer);
    
    // Filter out the correct answer
    const incorrectOptions = options.filter(opt => opt.innerHTML !== correctAnswerText);
    
    // Randomly select 2 incorrect options to remove
    shuffleArray(incorrectOptions);
    incorrectOptions.slice(0, 2).forEach(opt => {
        opt.classList.add('hint-removed');
        opt.classList.add('disabled');
    });

    elements.hintBtn.disabled = true;
    elements.hintBtn.style.opacity = '0.3';
}

function showUnlockModal() {
    document.getElementById('unlock-modal').classList.add('active');
    document.getElementById('unlock-input').focus();
}

function createParticles() {
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 3 + 1;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        // Use standard CSS animation
        p.style.animation = `floatParticle ${Math.random() * 10 + 5}s linear infinite`;
        p.style.opacity = Math.random() * 0.5;
        elements.particles.appendChild(p);
    }
}

// Add particle animation style dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes floatParticle {
        0% { transform: translateY(100vh); }
        100% { transform: translateY(-100px); }
    }
`;
document.head.appendChild(style);

// --- Game Logic ---

// --- Custom Question Banks (Now managed in questions.js) ---

const CUSTOM_CATEGORY_MAP = {
    'radiohead': RADIOHEAD_QUESTIONS,
    'ghibli': GHIBLI_QUESTIONS,
    '3dprinting': PRINTING_QUESTIONS,
    'icecream': ICECREAM_QUESTIONS,
    'astrology': ASTROLOGY_QUESTIONS,
    'space': SPACE_QUESTIONS,
    'mythology': MYTHOLOGY_QUESTIONS,
    'literature': LITERATURE_QUESTIONS,
    '90s': NOSTALGIA_90S_QUESTIONS,
    'gaming': GAMING_QUESTIONS,
    'subnautica': SUBNAUTICA_QUESTIONS,
    'geodash': GEOMETRY_DASH_QUESTIONS,
    'culinary': CULINARY_QUESTIONS,
    'marine': MARINE_QUESTIONS,
    'weather': WEATHER_QUESTIONS,
    'ai': AI_QUESTIONS,
    'brainrot': BRAINROT_QUESTIONS,
    'architecture': ARCHITECTURE_QUESTIONS,
    'secret67': SECRET_67_QUESTIONS,
    'onepiece': ONE_PIECE_QUESTIONS
};

async function startQuiz(forcedCategory = null) {
    const category = forcedCategory || elements.category.value;
    const difficulty = elements.difficulty.value;
    
    elements.startBtn.innerText = 'CALIBRATING...';
    elements.startBtn.disabled = true;

    try {
        let questions;
        if (CUSTOM_CATEGORY_MAP[category]) {
            questions = [...CUSTOM_CATEGORY_MAP[category]];
            shuffleArray(questions);
        } else {
            const response = await fetch(`${API_URL}?amount=${TOTAL_QUESTIONS}&category=${category}&difficulty=${difficulty}&type=multiple`);
            const data = await response.json();
            if (data.response_code !== 0) throw new Error('API Error');
            questions = data.results;
        }

        gameState.questions = questions;
        gameState.currentIndex = 0;
        gameState.score = 0;
        gameState.streak = 0;
        gameState.correctAnswers = 0;
        gameState.hintUsedThisQuestion = false;
        elements.scoreDisplay.innerText = '0';
        
        showScreen('quiz');
        loadQuestion();
    } catch (err) {
        console.error(err);
        alert('Failed to load questions. System offline.');
        elements.startBtn.innerText = 'INITIALIZE SYSTEM';
        elements.startBtn.disabled = false;
    }
}

function loadQuestion() {
    const q = gameState.questions[gameState.currentIndex];
    gameState.canAnswer = true;
    gameState.timeLeft = TIME_PER_QUESTION;
    gameState.hintUsedThisQuestion = false;
    elements.hintBtn.disabled = false;
    elements.hintBtn.style.opacity = '1';
    
    // UI Update
    elements.questionCounter.innerText = `${gameState.currentIndex + 1}/${TOTAL_QUESTIONS}`;
    elements.progressFill.style.width = `${((gameState.currentIndex) / TOTAL_QUESTIONS) * 100}%`;
    elements.scoreDisplay.innerText = gameState.score;
    elements.questionText.innerHTML = decodeHTML(q.question);
    
    // Prepare options
    const options = [...q.incorrect_answers, q.correct_answer];
    shuffleArray(options);
    
    elements.optionsContainer.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option';
        btn.innerHTML = decodeHTML(opt);
        btn.onclick = () => handleAnswer(opt, q.correct_answer, btn);
        elements.optionsContainer.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    clearInterval(gameState.timer);
    updateTimerUI();
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerUI();
        
        if (gameState.timeLeft <= 0) {
            handleAnswer(null, gameState.questions[gameState.currentIndex].correct_answer);
        }
    }, 1000);
}

function updateTimerUI() {
    elements.timerText.innerText = gameState.timeLeft;
    const offset = 176 - (176 * gameState.timeLeft) / TIME_PER_QUESTION;
    elements.timerProgress.style.strokeDashoffset = offset;
    
    if (gameState.timeLeft <= 5) {
        elements.timerProgress.style.stroke = 'var(--error)';
    } else {
        elements.timerProgress.style.stroke = 'var(--primary)';
    }
}

function handleAnswer(selected, correct, btn) {
    if (!gameState.canAnswer) return;
    gameState.canAnswer = false;
    clearInterval(gameState.timer);

    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.add('disabled'));

    if (selected === correct) {
        gameState.score += 100 + (gameState.streak * 20);
        gameState.streak++;
        gameState.correctAnswers++;
        gameState.bestStreak = Math.max(gameState.bestStreak, gameState.streak);
        if (btn) btn.classList.add('correct');
        elements.scoreDisplay.innerText = gameState.score;
    } else {
        gameState.streak = 0;
        document.body.classList.add('flash-red');
        if (btn) btn.classList.add('wrong');
        // Show correct answer
        options.forEach(opt => {
            if (opt.innerHTML === decodeHTML(correct)) {
                opt.classList.add('correct');
            }
        });
    }

    setTimeout(() => {
        document.body.classList.remove('flash-red');
        gameState.currentIndex++;
        if (gameState.currentIndex < TOTAL_QUESTIONS) {
            loadQuestion();
        } else {
            finishQuiz();
        }
    }, 1500);
}

function finishQuiz() {
    const percentage = Math.round((gameState.correctAnswers / TOTAL_QUESTIONS) * 100);
    elements.finalScore.innerText = `${percentage}%`;
    elements.correctCount.innerText = gameState.correctAnswers;
    elements.bestStreak.innerText = gameState.bestStreak;
    
    if (percentage >= 80) elements.resultTitle.innerText = "LEGENDARY STATUS";
    else if (percentage >= 50) elements.resultTitle.innerText = "MISSION SUCCESS";
    else elements.resultTitle.innerText = "SYSTEM FAILURE";

    showScreen('result');
}

// --- Helpers ---

function showScreen(id) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[id].classList.add('active');
    
    if (id === 'start') {
        elements.startBtn.innerText = 'INITIALIZE SYSTEM';
        elements.startBtn.disabled = false;
    }
}

function decodeHTML(html) {
    if (!html) return "";
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

init();
