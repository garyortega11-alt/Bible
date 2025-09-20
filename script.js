// Módulo de Estado del Juego
const divisiones = ['Discípulo', 'Maestro', 'Experto'];
const subnivelesPorDivision = [5, 5, 10];
const starsToPromote = 5;

let gameState = {
    playerName: "Jugador",
    currentDivision: 0,
    currentSublevel: 1,
    divisionStars: 0,
    totalScore: 0,
    currentQuestionIndex: 0,
    questions: [],
    isPromotionQuestion: false,
    hasDemotionShield: false,
    usedQuestions: [],
    isTimerRunning: false,
    timer: null,
    timeElapsed: 0,
};

let questionsData = [];

// Módulo de Audio y Sonido
const audio = {
    correct: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/winner-game-sound-404167.mp3'),
    incorrect: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/fail-144746.mp3'),
    promotion: [
        new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/11l-victory_trumpet-1749704501065-358769.mp3'),
        new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/11l-victory_trumpet-1749704498589-358767.mp3'),
        new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/11l-victory_trumpet-1749704496881-358778.mp3')
    ],
    shieldUsed: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/bubble-pops-and-ding-type-3-235798.mp3'),
    promotionFail: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/brass-fail-11-a-207140.mp3'),
    demotionSound: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/negative-484803.mp3'),

    volume: parseFloat(localStorage.getItem('audioVolume')) || 1,
    isMuted: localStorage.getItem('isAudioMuted') === 'true',
    init() {
        this.updateVolume(this.volume);
        if (this.isMuted) {
            this.mute();
        }
    },
    playCorrect() {
        if (!this.isMuted) {
            this.correct.volume = this.volume;
            this.correct.currentTime = 0;
            this.correct.play();
        }
    },
    playIncorrect() {
        if (!this.isMuted) {
            this.incorrect.volume = this.volume;
            this.incorrect.currentTime = 0;
            this.incorrect.play();
        }
    },
    playPromotion() {
        if (!this.isMuted) {
            const randomPromotionSound = this.promotion[Math.floor(Math.random() * this.promotion.length)];
            randomPromotionSound.volume = this.volume;
            randomPromotionSound.currentTime = 0;
            randomPromotionSound.play();
        }
    },
    playShieldUsed() {
        if (!this.isMuted) {
            this.shieldUsed.volume = this.volume;
            this.shieldUsed.currentTime = 0;
            this.shieldUsed.play();
        }
    },
    playPromotionFail() {
        if (!this.isMuted) {
            this.promotionFail.volume = this.volume;
            this.promotionFail.currentTime = 0;
            this.promotionFail.play();
        }
    },
    playDemotion() {
        if (!this.isMuted) {
            this.promotionFail.volume = this.volume;
            this.promotionFail.currentTime = 0;
            this.promotionFail.play();
        }
    },
    updateVolume(newVolume) {
        this.volume = newVolume;
        this.correct.volume = newVolume;
        this.incorrect.volume = newVolume;
        this.promotion.forEach(sound => sound.volume = newVolume);
        this.shieldUsed.volume = newVolume;
        this.promotionFail.volume = newVolume;
        this.demotionSound.volume = newVolume;
        localStorage.setItem('audioVolume', newVolume);
    },
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('isAudioMuted', this.isMuted);
        if (this.isMuted) {
            this.mute();
        } else {
            this.unmute();
        }
    },
    mute() {
        this.correct.volume = 0;
        this.incorrect.volume = 0;
        this.promotion.forEach(sound => sound.volume = 0);
        this.shieldUsed.volume = 0;
        this.promotionFail.volume = 0;
        this.demotionSound.volume = 0;
    },
    unmute() {
        this.correct.volume = this.volume;
        this.incorrect.volume = this.volume;
        this.promotion.forEach(sound => sound.volume = this.volume);
        this.shieldUsed.volume = this.volume;
        this.promotionFail.volume = this.volume;
        this.demotionSound.volume = this.volume;
    }
};

// Módulo de Lógica del Juego
const gameActions = {
    startGame() {
        gameState.currentDivision = 0;
        gameState.currentSublevel = 1;
        gameState.divisionStars = 0;
        gameState.totalScore = 0;
        gameState.currentQuestionIndex = 0;
        gameState.hasDemotionShield = false;
        gameState.usedQuestions = [];
        gameActions.loadNewQuestionSet();

        ui.showScreen(ui.elements.gameScreen);
        ui.updateGameUI();
        ui.displayQuestion();
    },
    loadNewQuestionSet() {
        if (gameState.usedQuestions.length === questionsData.length) {
            gameState.usedQuestions = [];
        }
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * questionsData.length);
        } while (gameState.usedQuestions.includes(randomIndex));
        gameState.usedQuestions.push(randomIndex);
        gameState.currentQuestionIndex = randomIndex;
    },
    handleAnswer(selectedOption, buttonElement) {
        ui.elements.opcionesContainer.classList.add('disabled-container');
        gameActions.stopTimer();

        const currentQuestion = questionsData[gameState.currentQuestionIndex];
        const isCorrect = selectedOption.trim().toLowerCase() === currentQuestion.respuesta_correcta.trim().toLowerCase();

        Array.from(ui.elements.opcionesContainer.children).forEach(btn => btn.disabled = true);
        
        if (isCorrect) {
            if (gameState.isPromotionQuestion) {
                audio.playPromotion();
                gameActions.promotePlayer();
            } else {
                audio.playCorrect();
                gameState.divisionStars++;
            }
            
            buttonElement.classList.add('correcta');
            ui.showFeedbackEmoji('🥳');
            
            const points = 100;
            gameState.totalScore += points;

            ui.updateGameUI();
            
            if (!gameState.isPromotionQuestion) { 
                 gameActions.checkPromotion();
                setTimeout(() => {
                   gameActions.loadNextQuestion();
                }, 1500);
            } else {
                setTimeout(() => {
                     gameActions.loadNextQuestion();
                }, 3000); 
            }

        } else {
            
            if (gameState.isPromotionQuestion) {
                audio.playPromotionFail();
                gameState.isPromotionQuestion = false;
                if (gameState.divisionStars > 0) {
                    gameState.divisionStars--;
                }
                ui.updateGameUI();
                ui.showPopup(`¡Fallaste la pregunta de ascenso!`, 'promotion-fail');
                setTimeout(() => gameActions.loadNextQuestion(), 2500);
            } else if (gameState.divisionStars > 0) {
                audio.playIncorrect();
                gameState.divisionStars--;
                ui.updateGameUI();
                setTimeout(() => gameActions.loadNextQuestion(), 2500);
            } else if (gameState.divisionStars === 0 && gameState.hasDemotionShield) {
                audio.playShieldUsed();
                ui.showShieldEffect();
                gameState.hasDemotionShield = false;
                ui.updateGameUI(); 
                setTimeout(() => gameActions.loadNextQuestion(), 2500);
            } else {
                if (gameState.currentDivision === 0 && gameState.currentSublevel === 1) {
                    audio.playIncorrect();
                    gameState.divisionStars = 0; 
                    ui.updateGameUI();
                    setTimeout(() => gameActions.loadNextQuestion(), 2500);
                } else {
                    gameActions.demotePlayer();
                }
            }

            if(buttonElement) {
                buttonElement.classList.add('incorrecta');
            }
            ui.showFeedbackEmoji('😟');
            ui.elements.preguntaContainer.classList.add('shake-animation');
            
            const correctButton = Array.from(ui.elements.opcionesContainer.children).find(btn => btn.textContent === currentQuestion.respuesta_correcta);
            if (correctButton) {
                correctButton.classList.add('correcta');
            }
            
            const tooltipSpan = buttonElement ? buttonElement.querySelector('.tooltip') : null;
            if (tooltipSpan) {
                 tooltipSpan.textContent = `Incorrecto: ${currentQuestion.respuesta_correcta}. (Referencia: ${currentQuestion.referencia})`;
                 tooltipSpan.classList.add('show');
            }
        }
    },
    checkPromotion() {
        if (gameState.divisionStars >= starsToPromote) {
            gameState.isPromotionQuestion = true;
        }
    },
    promotePlayer() {
        const currentDivisionName = divisiones[gameState.currentDivision];
        const maxSublevels = subnivelesPorDivision[gameState.currentDivision];

        if (gameState.currentSublevel < maxSublevels) {
            gameState.currentSublevel++;
            gameState.hasDemotionShield = true;
            ui.createConfetti();
            ui.showPopup(`¡Ascendiste a ${currentDivisionName} ${ui.toRoman(gameState.currentSublevel)}!`, 'promotion');
        } else if (gameState.currentDivision < divisiones.length - 1) {
            gameState.currentDivision++;
            gameState.currentSublevel = 1;
            gameState.hasDemotionShield = true;
            ui.createConfetti();
            ui.showPopup(`¡Felicitaciones! Has ascendido a la división de ${divisiones[gameState.currentDivision]} ${ui.toRoman(gameState.currentSublevel)}!`, 'promotion');
        } else {
            ui.createConfetti();
            ui.endGame('¡Has alcanzado la cima! ¡Felicidades!');
            return;
        }
        
        gameState.divisionStars = 0;
        gameState.isPromotionQuestion = false;
        ui.updateGameUI();
    },
    demotePlayer() {
        audio.playDemotion(); 
        const currentDivisionName = divisiones[gameState.currentDivision];
        
        if (gameState.currentSublevel > 1) {
            gameState.currentSublevel--;
            gameState.divisionStars = starsToPromote - 1;
            ui.showPopup(`¡Has descendido a ${currentDivisionName} ${ui.toRoman(gameState.currentSublevel)}!`, 'demotion');
        } else if (gameState.currentDivision > 0) {
            gameState.currentDivision--;
            gameState.currentSublevel = subnivelesPorDivision[gameState.currentDivision];
            gameState.divisionStars = starsToPromote - 1;
            ui.showPopup(`¡Has descendido a ${divisiones[gameState.currentDivision]} ${ui.toRoman(gameState.currentSublevel)}!`, 'demotion');
        } else {
            gameState.divisionStars = 0;
            ui.updateGameUI();
            setTimeout(() => gameActions.loadNextQuestion(), 2500);
            return;
        }
        gameState.hasDemotionShield = false;
        ui.updateGameUI();
    },
    loadNextQuestion() {
        ui.elements.preguntaContainer.classList.remove('shake-animation');
        gameActions.loadNewQuestionSet();
        ui.displayQuestion();
    },
    saveProgress() {
        const progressData = {
            playerName: gameState.playerName,
            currentDivision: gameState.currentDivision,
            currentSublevel: gameState.currentSublevel,
            divisionStars: gameState.divisionStars,
            totalScore: gameState.totalScore,
            hasDemotionShield: gameState.hasDemotionShield,
            usedQuestions: gameState.usedQuestions
        };
        localStorage.setItem('bibleGameProgress', JSON.stringify(progressData));
    },
    loadProgress() {
        const savedProgress = localStorage.getItem('bibleGameProgress');
        if (savedProgress) {
            const progressData = JSON.parse(savedProgress);
            Object.assign(gameState, progressData);
            ui.updateGameUI();
            ui.displayQuestion();
            ui.showScreen(ui.elements.gameScreen);
            return true;
        }
        return false;
    },
    restartGameKeepingName() {
        gameState.currentDivision = 0;
        gameState.currentSublevel = 1;
        gameState.divisionStars = 0;
        gameState.totalScore = 0;
        gameState.currentQuestionIndex = 0;
        gameState.hasDemotionShield = false;
        gameState.usedQuestions = [];
        gameActions.loadNewQuestionSet();

        ui.updateGameUI();
        ui.displayQuestion();
        ui.showScreen(ui.elements.gameScreen);
    },
    startTimer() {
        gameActions.stopTimer();
        gameState.timeElapsed = 0;
        gameState.isTimerRunning = true;
        ui.elements.thinkingEmoji.style.display = 'none';

        gameState.timer = setInterval(() => {
            gameState.timeElapsed++;
            if (gameState.timeElapsed >= 10 && !ui.elements.opcionesContainer.classList.contains('disabled-container')) {
                ui.elements.thinkingEmoji.style.display = 'block';
            }
        }, 1000);
    },
    stopTimer() {
        clearInterval(gameState.timer);
        gameState.isTimerRunning = false;
        ui.elements.thinkingEmoji.style.display = 'none';
    },
};

// Módulo de Interfaz de Usuario
const ui = {
    elements: {
        preloader: document.getElementById('preloader'),
        loadingBar: document.getElementById('loadingBar'),
        homeScreen: document.getElementById('homeScreen'),
        playerNameInput: document.getElementById('playerNameInput'),
        gameScreen: document.getElementById('gameScreen'),
        jugarBtn: document.getElementById('jugarBtn'),
        preguntaTexto: document.getElementById('preguntaTexto'),
        opcionesContainer: document.getElementById('opcionesContainer'),
        feedbackEmoji: document.getElementById('feedbackEmoji'),
        starsDisplay: document.getElementById('starsDisplay'),
        confettiScreen: document.getElementById('confettiScreen'),
        thinkingEmoji: document.getElementById('thinkingEmoji'),
        totalScoreDisplay: document.getElementById('totalScoreDisplay'),
        levelDisplay: document.getElementById('levelDisplay'),
        welcomeMessage: document.getElementById('welcomeMessage'),
        welcomePlayerName: document.getElementById('welcomePlayerName'),
        continueBtn: document.getElementById('continueBtn'),
        newGameBtn: document.getElementById('newGameBtn'),
        nameInputSection: document.getElementById('nameInputSection'),
        popupContainer: document.getElementById('popupContainer'),
        popupContent: document.getElementById('popupContent'),
        preguntaContainer: document.getElementById('preguntaContainer'),
        shieldIcon: document.getElementById('shieldIcon'),
        settingsBtn: document.getElementById('settingsBtn'),
        rulesScreen: document.getElementById('rulesScreen'),
        startGameBtn: document.getElementById('startGameBtn'),
        nameErrorMsg: document.getElementById('nameErrorMsg'),
        shieldEffectPopup: document.getElementById('shieldEffectPopup'),
        
        promotionPopup: document.getElementById('promotionPopup'),
        promotionMessage: document.getElementById('promotionMessage'),
        demotionPopup: document.getElementById('demotionPopup'),
        demotionMessage: document.getElementById('demotionMessage'),
        promotionFailPopup: document.getElementById('promotionFailPopup'),
        promotionFailMessage: document.getElementById('promotionFailMessage'),
    },
    animatePreloader() {
        this.elements.preloader.style.display = 'flex';
        this.elements.loadingBar.style.width = '0%';
        let currentWidth = 0;
        const targetWidth = 100;
        const duration = 1000;
        const interval = 10;
        const step = (targetWidth / (duration / interval));

        const animate = () => {
            if (currentWidth < targetWidth) {
                currentWidth += step;
                this.elements.loadingBar.style.width = `${currentWidth}%`;
                requestAnimationFrame(animate);
            } else {
                setTimeout(() => {
                    this.elements.preloader.style.opacity = '0';
                    this.elements.preloader.addEventListener('transitionend', () => {
                        this.elements.preloader.style.display = 'none';
                        this.showHomeScreenLogic();
                    }, { once: true });
                }, 500);
            }
        };
        animate();
    },
    toRoman(num) {
        const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        return roman[num] || num;
    },
    showScreen(screenToShow) {
        const allScreens = [this.elements.homeScreen, this.elements.rulesScreen, this.elements.gameScreen];
        allScreens.forEach(screen => {
            screen.classList.add('hidden');
        });
        
        screenToShow.classList.remove('hidden');
        
        if (screenToShow === this.elements.gameScreen) {
            this.elements.settingsBtn.classList.remove('hidden');
            this.elements.shieldIcon.classList.toggle('hidden', !gameState.hasDemotionShield);
        } else {
            this.elements.settingsBtn.classList.add('hidden');
            this.elements.shieldIcon.classList.add('hidden');
        }
    },
    showHomeScreenLogic() {
        if (localStorage.getItem('bibleGameProgress')) {
            this.elements.nameInputSection.style.display = 'none';
            this.elements.welcomeMessage.style.display = 'block';
            const savedData = JSON.parse(localStorage.getItem('bibleGameProgress'));
            this.elements.welcomePlayerName.textContent = `¡Bienvenido de nuevo, ${savedData.playerName}!`;
            gameState.playerName = savedData.playerName;
        } else {
            this.elements.nameInputSection.style.display = 'flex';
            this.elements.welcomeMessage.style.display = 'none';
        }
        this.showScreen(this.elements.homeScreen);
    },
    displayQuestion() {
        ui.elements.feedbackEmoji.style.display = 'none';
        ui.elements.opcionesContainer.classList.remove('disabled-container');
        
        const currentQuestion = questionsData[gameState.currentQuestionIndex];
        
        ui.elements.preguntaTexto.textContent = currentQuestion.pregunta;

        if (gameState.isPromotionQuestion) {
             ui.elements.preguntaTexto.innerHTML = `
                <span style="color: yellow; text-shadow: 1px 1px 2px black;">¡Pregunta de Ascenso!</span>
                <br>${currentQuestion.pregunta}
            `;
        } else {
            ui.elements.preguntaTexto.textContent = currentQuestion.pregunta;
        }
        
        ui.elements.opcionesContainer.innerHTML = '';
        const shuffledOptions = [...currentQuestion.opciones].sort(() => Math.random() - 0.5);
        shuffledOptions.forEach(opcion => {
            const button = document.createElement('button');
            button.className = 'opcion-btn';
            button.textContent = opcion;
            button.addEventListener('click', () => {
                gameActions.stopTimer();
                gameActions.handleAnswer(opcion, button);
            });
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip';
            button.appendChild(tooltip);
            ui.elements.opcionesContainer.appendChild(button);
        });
        ui.elements.opcionesContainer.classList.remove('disabled-container');
        gameActions.startTimer();
    },
    updateGameUI() {
        const divisionName = divisiones[gameState.currentDivision];
        const sublevelRoman = ui.toRoman(gameState.currentSublevel);
        ui.elements.levelDisplay.textContent = `${divisionName} ${sublevelRoman}`;
        ui.elements.totalScoreDisplay.textContent = `Puntuación: ${gameState.totalScore}`;
        ui.elements.starsDisplay.innerHTML = '';
        
        const starsToDisplay = gameState.isPromotionQuestion ? '⬆️' : '🌟'.repeat(gameState.divisionStars);
        
        const starElement = document.createElement('span');
        starElement.innerHTML = starsToDisplay;
        starElement.className = 'star-icon';
        ui.elements.starsDisplay.appendChild(starElement);

        ui.elements.shieldIcon.classList.toggle('hidden', !gameState.hasDemotionShield);
    },
    showFeedbackEmoji(emoji) {
        ui.elements.feedbackEmoji.textContent = emoji;
        ui.elements.feedbackEmoji.style.display = 'block';
        setTimeout(() => {
            ui.elements.feedbackEmoji.style.display = 'none';
        }, 1000);
    },
    showPopup(message, type) {
        this.elements.promotionPopup.classList.add('hidden');
        this.elements.demotionPopup.classList.add('hidden');
        this.elements.promotionFailPopup.classList.add('hidden');

        if (type === 'promotion') {
            this.elements.promotionMessage.textContent = message;
            this.elements.promotionPopup.classList.remove('hidden');
        } else if (type === 'demotion') {
            this.elements.demotionMessage.textContent = message;
            this.elements.demotionPopup.classList.remove('hidden');
        } else if (type === 'promotion-fail') {
            this.elements.promotionFailMessage.textContent = message;
            this.elements.promotionFailPopup.classList.remove('hidden');
        }
    },
    showShieldEffect() {
        this.elements.shieldEffectPopup.classList.remove('hidden');
        setTimeout(() => {
            this.elements.shieldEffectPopup.classList.add('hidden');
        }, 1500); 
    },
    showNoNameError() {
        this.elements.nameErrorMsg.textContent = "¡Por favor, introduce tu nombre para comenzar!";
        this.elements.nameErrorMsg.style.display = 'block';
    },
    showExitPopup() {
        gameActions.stopTimer();
        const exitPopupContent = `
            <h3>¿Estás seguro de que quieres salir?</h3>
            <p>Puedes guardar tu progreso para continuar más tarde.</p>
            <div class="button-container">
                <button id="saveExitBtn">Guardar y Salir</button>
                <button id="exitWithoutSaveBtn">Salir sin Guardar</button>
                <button id="cancelExitBtn" class="cancel-btn">Cancelar</button>
            </div>
        `;
        ui.elements.popupContent.innerHTML = exitPopupContent;
        ui.elements.popupContainer.classList.remove('hidden');

        document.getElementById('saveExitBtn').addEventListener('click', () => {
            gameActions.saveProgress();
            ui.elements.popupContainer.classList.add('hidden');
            ui.showHomeScreenLogic();
        });

        document.getElementById('exitWithoutSaveBtn').addEventListener('click', () => {
            localStorage.removeItem('bibleGameProgress');
            ui.elements.popupContainer.classList.add('hidden');
            ui.showHomeScreenLogic();
        });

        document.getElementById('cancelExitBtn').addEventListener('click', () => {
            ui.elements.popupContainer.classList.add('hidden');
            gameActions.startTimer();
        });
    },
    showNewGamePopup() {
        const newGamePopupContent = `
            <h3>¿Estás seguro de que quieres empezar una nueva partida?</h3>
            <p>Tu partida actual se perderá.</p>
            <div class="button-container">
                <button id="confirmNewGameBtn">Sí, Empezar</button>
                <button id="cancelNewGameBtn" class="cancel-btn">Cancelar</button>
            </div>
        `;
        ui.elements.popupContent.innerHTML = newGamePopupContent;
        ui.elements.popupContainer.classList.remove('hidden');

        document.getElementById('confirmNewGameBtn').addEventListener('click', () => {
            localStorage.removeItem('bibleGameProgress');
            ui.elements.popupContainer.classList.add('hidden');
            ui.showScreen(ui.elements.rulesScreen);
        });

        document.getElementById('cancelNewGameBtn').addEventListener('click', () => {
            ui.elements.popupContainer.classList.add('hidden');
        });
    },
    showSettingsPopup() {
        gameActions.stopTimer();
        const settingsPopupContent = `
            <h3>Ajustes</h3>
            <div class="settings-popup-content">
                <div class="controls">
                    <div class="control-group">
                        <label for="volumeRange">Volumen</label>
                        <input type="range" id="volumeRange" min="0" max="1" step="0.1" value="${audio.volume}">
                    </div>
                    <div class="control-group">
                        <label for="muteToggle">Silenciar</label>
                        <input type="checkbox" id="muteToggle" ${audio.isMuted ? 'checked' : ''}>
                    </div>
                </div>
                <div class="exit-btn-wrapper">
                    <button id="exitGameBtn" class="btn-main">Salir del Juego</button>
                </div>
            </div>
            <button id="closeSettingsBtn" style="margin-top: 3vh;">Cerrar</button>
        `;
        ui.elements.popupContent.innerHTML = settingsPopupContent;
        ui.elements.popupContainer.classList.remove('hidden');

        const volumeRange = document.getElementById('volumeRange');
        const muteToggle = document.getElementById('muteToggle');
        const exitGameBtn = document.getElementById('exitGameBtn');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');

        volumeRange.value = audio.volume;
        muteToggle.checked = audio.isMuted;
        
        volumeRange.addEventListener('input', (e) => {
            audio.updateVolume(e.target.value);
            if (e.target.value > 0) {
                muteToggle.checked = false;
                audio.isMuted = false;
                localStorage.setItem('isAudioMuted', 'false');
            } else {
                muteToggle.checked = true;
                audio.isMuted = true;
                localStorage.setItem('isAudioMuted', 'true');
            }
        });

        muteToggle.addEventListener('change', () => {
            audio.toggleMute();
            if (audio.isMuted) {
                volumeRange.value = 0;
            } else {
                volumeRange.value = audio.volume;
            }
        });

        exitGameBtn.addEventListener('click', () => {
            ui.elements.popupContainer.classList.add('hidden');
            ui.showExitPopup();
        });

        closeSettingsBtn.addEventListener('click', () => {
            ui.elements.popupContainer.classList.add('hidden');
            gameActions.startTimer();
        });
    },
    createConfetti() {
        const confettiColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
        const confettiCount = 100;

        for (let i = 0; i < confettiCount; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            const randomColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            piece.style.setProperty('--color', randomColor);
            piece.style.setProperty('--left', `${Math.random() * 100}vw`);
            piece.style.setProperty('--duration', `${Math.random() * 2 + 1}s`);
            ui.elements.confettiScreen.appendChild(piece);
        }

        ui.elements.confettiScreen.classList.remove('hidden');
        setTimeout(() => {
    ui.elements.confettiScreen.classList.add('hidden');
    ui.elements.confettiScreen.innerHTML = '';
        }, 3000);
    },
    endGame(message) {
        const endGamePopup = `
            <div class="end-game-popup">
                <h1>¡Fin del Juego!</h1>
                <p>${message}</p>
                <div id="endGameStats">
                    <span>Puntuación Final: ${gameState.totalScore}</span>
                    <span>División Alcanzada: ${divisiones[gameState.currentDivision]} ${ui.toRoman(gameState.currentSublevel)}</span>
                </div>
                <button id="endGameRestartBtn" class="btn-main" style="margin-top: 4vh;">Volver a Jugar</button>
            </div>
        `;
        ui.elements.popupContent.innerHTML = endGamePopup;
        ui.elements.popupContainer.classList.remove('hidden');
        
        document.getElementById('endGameRestartBtn').addEventListener('click', () => {
            localStorage.removeItem('bibleGameProgress');
            ui.elements.popupContainer.classList.add('hidden');
            ui.showHomeScreenLogic();
        });
    }
};

function closePopup(popupId) {
    document.getElementById(popupId).classList.add('hidden');
    gameActions.loadNextQuestion();
}

// Función para cargar las preguntas desde el archivo JSON
async function loadQuestions() {
    try {
        const response = await fetch('preguntas.json'); 
        if (!response.ok) {
            throw new Error('Error al cargar las preguntas: ' + response.statusText);
        }
        questionsData = await response.json();
        console.log(`¡${questionsData.length} preguntas cargadas con éxito!`);
        ui.animatePreloader();
    } catch (error) {
        console.error(error);
        alert('No se pudieron cargar las preguntas del juego. Por favor, verifica que el archivo preguntas.json esté en el directorio correcto.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    audio.init();
    loadQuestions(); // Inicia la carga de las preguntas
});

ui.elements.jugarBtn.addEventListener('click', () => {
    const playerName = ui.elements.playerNameInput.value.trim();
    if (playerName) {
        gameState.playerName = playerName;
        gameActions.saveProgress();
        ui.showScreen(ui.elements.rulesScreen);
    } else {
        ui.showNoNameError();
    }
});

ui.elements.startGameBtn.addEventListener('click', () => {
    gameActions.startGame();
});

ui.elements.continueBtn.addEventListener('click', () => {
    if (gameActions.loadProgress()) {
        ui.showScreen(ui.elements.gameScreen);
    } else {
        alert("No se encontró una partida guardada.");
    }
});

ui.elements.newGameBtn.addEventListener('click', () => {
    ui.showNewGamePopup();
});

ui.elements.settingsBtn.addEventListener('click', () => {
    ui.showSettingsPopup();
});

window.addEventListener('beforeunload', () => {
    gameActions.saveProgress();
});
