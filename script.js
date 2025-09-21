document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const preloader = document.getElementById('preloader');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const endGameScreen = document.getElementById('endGameScreen');
    const rulesScreen = document.getElementById('rulesScreen');
    const startBtn = document.getElementById('startBtn');
    const showRulesBtn = document.getElementById('showRulesBtn');
    const startGameFromRulesBtn = document.getElementById('startGameFromRulesBtn');
    const exitRulesBtn = document.getElementById('exitRulesBtn');
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('opcionesContainer');
    const levelDisplay = document.getElementById('levelDisplay');
    const totalScoreDisplay = document.getElementById('totalScoreDisplay');
    const timerDisplay = document.getElementById('timer');
    const preloaderText = document.getElementById('preloaderText');
    const loadingBar = document.getElementById('loadingBar');
    const nameInputSection = document.getElementById('nameInputSection');
    const playerNameInput = document.getElementById('playerNameInput');
    const nameErrorMsg = document.getElementById('nameErrorMsg');
    const submitNameBtn = document.getElementById('submitNameBtn');
    const feedbackEmoji = document.getElementById('feedbackEmoji');
    const thinkingEmoji = document.getElementById('thinkingEmoji');
    const starsDisplay = document.getElementById('starsDisplay');
    const shieldIcon = document.getElementById('shieldIcon');
    const shieldEffectPopup = document.getElementById('shieldEffectPopup');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPopup = document.getElementById('settingsPopup');
    const soundRange = document.getElementById('soundRange');
    const musicRange = document.getElementById('musicRange');
    const promoTimerDisplay = document.getElementById('promotionTimer');
    const promotionPopup = document.getElementById('promotionPopup');
    const promotionFailPopup = document.getElementById('promotionFailPopup');
    const demotionPopup = document.getElementById('demotionPopup');
    const endGameStats = document.getElementById('endGameStats');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const welcomeOptions = document.querySelector('.welcome-options');

    // Estado del juego
    let playerName = '';
    let currentLevel = 0;
    let totalScore = 0;
    let questionsData = [];
    let currentQuestionIndex = 0;
    let timeLeft = 10;
    let promotionTimeLeft = 10;
    let timerInterval;
    let promotionTimerInterval;
    let shieldActive = false;
    let shieldCooldown = 0;
    let canUseShield = false;
    let isShielding = false;
    let questionsAnsweredThisLevel = 0;
    const QUESTIONS_PER_LEVEL = 10;
    const PROMOTION_TIMER_INITIAL = 30; // 30 segundos para ascenso
    const promotionQuestions = 3; // Nro de preguntas para el ascenso
    let correctPromotionAnswers = 0;
    let consecutiveCorrect = 0; // Contador de respuestas correctas consecutivas
    const SHIELD_COOLDOWN_ROUNDS = 5;
    let shieldRoundCounter = 0;
    let backgroundMusic;
    const MAX_SHIELDS = 1;
    let availableShields = MAX_SHIELDS;

    // Sonidos del juego
    const sounds = {
        correct: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/correct.mp3'),
        incorrect: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/incorrect.mp3'),
        gameOver: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/gameover.mp3'),
        shield: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/shield.mp3'),
        levelUp: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/levelup.mp3'),
        backgroundMusic: new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/music.mp3')
    };

    const maxLoadingSteps = 10;
    let currentLoadingStep = 0;
    
    // Función de precarga
    async function preloadAssets() {
        preloader.classList.remove('hidden');
        preloaderText.textContent = "Cargando preguntas...";

        await fetchQuestions();
        await preloadSounds();
        
        preloaderText.textContent = "¡Carga completa!";
        loadingBar.style.width = '100%';

        // Transición y ocultar preloader
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.classList.add('hidden');
                showScreen(welcomeScreen);
            }, 1000);
        }, 500);
    }
    
    // Simular carga de datos
    async function fetchQuestions() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/bible-questions.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            questionsData = await response.json();
            console.log('Preguntas cargadas:', questionsData.length);
        } catch (error) {
            console.error('Error fetching questions:', error);
            alert('Hubo un error al cargar las preguntas. Por favor, recarga la página.');
        }
    }

    // Precargar sonidos
    function preloadSounds() {
        return Promise.all(
            Object.values(sounds).map(audio => {
                return new Promise(resolve => {
                    audio.addEventListener('canplaythrough', () => {
                        currentLoadingStep++;
                        loadingBar.style.width = `${(currentLoadingStep / maxLoadingSteps) * 100}%`;
                        resolve();
                    }, { once: true });
                    audio.load();
                });
            })
        );
    }

    // Función para cambiar de pantalla
    function showScreen(screen) {
        document.querySelectorAll('.screen-container').forEach(s => {
            s.classList.remove('visible');
            s.classList.add('hidden');
        });
        screen.classList.remove('hidden');
        screen.classList.add('visible');
        if (screen === welcomeScreen) {
            settingsBtn.classList.remove('hidden');
        } else {
            settingsBtn.classList.add('hidden');
        }
    }

    // Inicializar el juego
    function initGame() {
        currentLevel = 0;
        totalScore = 0;
        questionsAnsweredThisLevel = 0;
        correctPromotionAnswers = 0;
        consecutiveCorrect = 0;
        availableShields = MAX_SHIELDS;
        canUseShield = true;
        isShielding = false;
        shieldRoundCounter = 0;
        shuffleQuestions();
        updateUI();
        showScreen(gameScreen);
        playMusic();
        loadNextQuestion();
    }

    // Iniciar el juego desde la pantalla de reglas
    startGameFromRulesBtn.addEventListener('click', () => {
        initGame();
    });

    // Iniciar el juego desde el botón de inicio
    startBtn.addEventListener('click', () => {
        showScreen(rulesScreen);
    });

    // Evento del botón para mostrar reglas
    showRulesBtn.addEventListener('click', () => {
        showScreen(rulesScreen);
    });

    // Evento del botón para salir de las reglas
    exitRulesBtn.addEventListener('click', () => {
        showScreen(welcomeScreen);
    });

    // Validación del nombre
    submitNameBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name.length > 2 && name.length <= 15) {
            playerName = name;
            welcomeOptions.style.display = 'block';
            nameInputSection.style.display = 'none';
        } else {
            nameErrorMsg.classList.add('visible');
            setTimeout(() => {
                nameErrorMsg.classList.remove('visible');
            }, 3000);
        }
    });

    // Cargar la siguiente pregunta
    function loadNextQuestion() {
        resetState();
        if (currentQuestionIndex >= questionsData.length) {
            endGame();
            return;
        }

        const question = questionsData[currentQuestionIndex];
        questionText.textContent = question.question;

        const shuffledOptions = shuffleArray([...question.options]);
        optionsContainer.innerHTML = '';
        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('opcion-btn');
            button.textContent = option.text;
            button.dataset.correct = option.correct;
            button.addEventListener('click', selectAnswer);
            if (option.tip) {
                const tooltip = document.createElement('span');
                tooltip.classList.add('tooltip');
                tooltip.textContent = option.tip;
                button.appendChild(tooltip);
            }
            optionsContainer.appendChild(button);
        });

        // Lógica para el cronómetro del juego normal o el de ascenso
        if (currentLevel > 0 && questionsAnsweredThisLevel > 0 && questionsAnsweredThisLevel % QUESTIONS_PER_LEVEL === 0) {
            startPromotionTimer();
        } else {
            startTimer();
        }

        updateUI();
        thinkingEmoji.style.display = 'block';
    }

    // Barajar preguntas
    function shuffleQuestions() {
        questionsData = shuffleArray(questionsData);
    }

    // Reiniciar el estado para la nueva pregunta
    function resetState() {
        clearInterval(timerInterval);
        clearInterval(promotionTimerInterval);
        optionsContainer.querySelectorAll('.opcion-btn').forEach(btn => {
            btn.classList.remove('correcta', 'incorrecta');
            btn.disabled = false;
        });
        feedbackEmoji.style.display = 'none';
        thinkingEmoji.style.display = 'none';
        const promoTimer = document.querySelector('.promotion-timer-container');
        if (promoTimer) {
            promoTimer.classList.add('hidden');
        }
        timerDisplay.classList.remove('running-out');
        promoTimerDisplay.classList.remove('running-out');
    }

    // Iniciar temporizador normal
    function startTimer() {
        timeLeft = 10;
        timerDisplay.textContent = `Tiempo: ${timeLeft}s`;
        timerDisplay.parentElement.classList.remove('hidden');
        promoTimerDisplay.classList.add('hidden');

        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Tiempo: ${timeLeft}s`;
            if (timeLeft <= 5) {
                timerDisplay.parentElement.classList.add('running-out');
            }
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleAnswer(false);
            }
        }, 1000);
    }

    // Iniciar temporizador de ascenso
    function startPromotionTimer() {
        promotionTimeLeft = PROMOTION_TIMER_INITIAL;
        promoTimerDisplay.textContent = `Ascenso: ${promotionTimeLeft}s`;
        promoTimerDisplay.classList.remove('hidden');
        timerDisplay.parentElement.classList.add('hidden');

        promotionTimerInterval = setInterval(() => {
            promotionTimeLeft--;
            promoTimerDisplay.textContent = `Ascenso: ${promotionTimeLeft}s`;
            if (promotionTimeLeft <= 10) {
                promoTimerDisplay.classList.add('running-out');
            }
            if (promotionTimeLeft <= 0) {
                clearInterval(promotionTimerInterval);
                handleAnswer(false);
                questionsAnsweredThisLevel++;
            }
        }, 1000);
    }

    // Manejar la selección de respuesta
    function selectAnswer(e) {
        clearInterval(timerInterval);
        clearInterval(promotionTimerInterval);
        const selectedBtn = e.target;
        const isCorrect = selectedBtn.dataset.correct === 'true';

        optionsContainer.querySelectorAll('.opcion-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.correct === 'true') {
                btn.classList.add('correcta');
            }
        });

        handleAnswer(isCorrect, selectedBtn);
    }

    // Manejar la respuesta
    function handleAnswer(isCorrect, selectedBtn = null) {
        const questionContainer = document.querySelector('.pregunta-container');
        thinkingEmoji.style.display = 'none';
        
        if (isShielding && !isCorrect) {
            isShielding = false;
            showShieldEffect();
            playAudio(sounds.shield);
            showFeedback('🛡️', '#3498db');
            if (selectedBtn) {
                selectedBtn.classList.add('incorrecta');
                showTooltip(selectedBtn);
            }
            setTimeout(() => {
                nextQuestionLogic();
            }, 2000);
        } else {
            if (isCorrect) {
                totalScore += 10;
                consecutiveCorrect++;
                showFeedback('✅', '#2ecc71');
                playAudio(sounds.correct);
                if (isPromotionRound()) {
                    correctPromotionAnswers++;
                }
            } else {
                consecutiveCorrect = 0;
                questionContainer.classList.add('shake-animation');
                if (selectedBtn) {
                    selectedBtn.classList.add('incorrecta');
                    showTooltip(selectedBtn);
                }
                showFeedback('❌', '#e74c3c');
                playAudio(sounds.incorrect);
                // Si la respuesta es incorrecta, pierdes un escudo si lo tenías disponible
                if (availableShields > 0) {
                    availableShields--;
                    updateShieldIcon();
                }
            }

            setTimeout(() => {
                questionContainer.classList.remove('shake-animation');
                nextQuestionLogic();
            }, 2000);
        }
    }

    function showTooltip(button) {
        const tooltip = button.querySelector('.tooltip');
        if (tooltip) {
            tooltip.classList.add('show');
            setTimeout(() => {
                tooltip.classList.remove('show');
            }, 2000);
        }
    }

    // Lógica para la siguiente pregunta
    function nextQuestionLogic() {
        questionsAnsweredThisLevel++;
        currentQuestionIndex++;
        updateUI();

        if (isPromotionRound()) {
            if (questionsAnsweredThisLevel % QUESTIONS_PER_LEVEL === promotionQuestions) {
                handlePromotionResult();
            } else {
                loadNextQuestion();
            }
        } else {
            if (questionsAnsweredThisLevel % QUESTIONS_PER_LEVEL === 0) {
                // Termina el nivel normal, vamos a ronda de ascenso
                questionsAnsweredThisLevel = 0;
                correctPromotionAnswers = 0;
                showPromotionPopup();
            } else {
                loadNextQuestion();
            }
        }
    }

    // Mostrar pop-up de ascenso
    function showPromotionPopup() {
        showScreen(promotionPopup);
        promotionPopup.querySelector('.popup-title').textContent = `¡Felicidades, ${playerName}!`;
        promotionPopup.querySelector('.popup-message').textContent = `Has respondido ${QUESTIONS_PER_LEVEL} preguntas. ¡Prepárate para tu prueba de ascenso! Responde correctamente ${promotionQuestions} preguntas en ${PROMOTION_TIMER_INITIAL} segundos para subir de nivel.`;
        promotionPopup.querySelector('.btn-main').onclick = () => {
            showScreen(gameScreen);
            loadNextQuestion();
        };
    }

    // Manejar el resultado de la promoción
    function handlePromotionResult() {
        if (correctPromotionAnswers === promotionQuestions) {
            currentLevel++;
            playAudio(sounds.levelUp);
            showPromotionSuccessPopup();
        } else {
            showPromotionFailPopup();
            playAudio(sounds.gameOver);
            if (currentLevel > 0) {
                showDemotionPopup();
            } else {
                endGame();
            }
        }
    }
    
    // Mostrar pop-up de éxito en el ascenso
    function showPromotionSuccessPopup() {
        promotionPopup.querySelector('.popup-icon').textContent = '🏆';
        promotionPopup.querySelector('.popup-title').textContent = `¡Ascenso Completado, ${playerName}!`;
        promotionPopup.querySelector('.popup-message').textContent = `Has ascendido al Nivel ${currentLevel}. ¡Sigue así y demuestra tu sabiduría!`;
        promotionPopup.querySelector('.btn-main').textContent = 'Siguiente Nivel';
        promotionPopup.querySelector('.btn-main').onclick = () => {
            showScreen(gameScreen);
            questionsAnsweredThisLevel = 0; // Reiniciar contador para el nuevo nivel
            loadNextQuestion();
        };
        showScreen(promotionPopup);
    }
    
    // Mostrar pop-up de fallo en el ascenso
    function showPromotionFailPopup() {
        promotionFailPopup.querySelector('.popup-icon').textContent = '😞';
        promotionFailPopup.querySelector('.popup-title').textContent = `¡Intento Fallido, ${playerName}!`;
        promotionFailPopup.querySelector('.popup-message').textContent = `No respondiste correctamente las ${promotionQuestions} preguntas de ascenso. Puedes intentarlo de nuevo en el próximo nivel o jugar una nueva partida.`;
        promotionFailPopup.querySelector('.btn-main').textContent = 'Reintentar Ascenso';
        promotionFailPopup.querySelector('.btn-main').onclick = () => {
            showScreen(gameScreen);
            correctPromotionAnswers = 0;
            questionsAnsweredThisLevel = 0;
            loadNextQuestion();
        };
        showScreen(promotionFailPopup);
    }

    // Mostrar pop-up de descenso
    function showDemotionPopup() {
        demotionPopup.querySelector('.popup-icon').textContent = '📉';
        demotionPopup.querySelector('.popup-title').textContent = `¡Has descendido de nivel!`;
        demotionPopup.querySelector('.popup-message').textContent = `Tu puntaje es bajo y has perdido tu puesto en el ranking. ¡Pero no te rindas, puedes volver a subir!`;
        demotionPopup.querySelector('.btn-main').textContent = 'Jugar de Nuevo';
        demotionPopup.querySelector('.btn-main').onclick = () => {
            initGame();
        };
        showScreen(demotionPopup);
    }

    // Comprobar si es una ronda de ascenso
    function isPromotionRound() {
        return questionsAnsweredThisLevel > 0 && questionsAnsweredThisLevel <= promotionQuestions;
    }

    // Finalizar el juego
    function endGame() {
        clearInterval(timerInterval);
        clearInterval(promotionTimerInterval);
        playAudio(sounds.gameOver);
        showScreen(endGameScreen);
        endGameScreen.querySelector('h1').textContent = `¡Fin del Juego, ${playerName}!`;
        document.getElementById('finalLevel').textContent = `Nivel Final: ${currentLevel}`;
        document.getElementById('finalScore').textContent = `Puntaje Total: ${totalScore}`;
        document.getElementById('finalQuestions').textContent = `Preguntas Respondidas: ${currentQuestionIndex}`;
        
        playAgainBtn.onclick = () => {
            showScreen(welcomeScreen);
            welcomeOptions.style.display = 'block';
            nameInputSection.style.display = 'none';
        };
    }

    // Actualizar la interfaz de usuario
    function updateUI() {
        levelDisplay.textContent = `Nivel: ${currentLevel}`;
        totalScoreDisplay.textContent = `Puntaje: ${totalScore}`;
        updateStars();
        updateShieldIcon();
    }

    // Actualizar estrellas
    function updateStars() {
        let starsHTML = '';
        for (let i = 0; i < currentLevel + 1; i++) {
            starsHTML += `<span class="star-icon">⭐️</span>`;
        }
        starsDisplay.innerHTML = starsHTML;
    }

    // Actualizar el icono del escudo
    function updateShieldIcon() {
        if (availableShields > 0) {
            shieldIcon.textContent = '🛡️';
            shieldIcon.classList.remove('hidden');
        } else {
            shieldIcon.textContent = '';
            shieldIcon.classList.add('hidden');
        }
    }

    // Efecto del escudo
    function showShieldEffect() {
        shieldEffectPopup.classList.add('visible');
        setTimeout(() => {
            shieldEffectPopup.classList.remove('visible');
        }, 1500);
    }
    
    // Activar escudo
    shieldIcon.addEventListener('click', () => {
        if (availableShields > 0 && !isShielding) {
            isShielding = true;
            availableShields--;
            updateShieldIcon();
            // Mostrar un pop-up o mensaje de escudo activado
            const popup = document.createElement('div');
            popup.classList.add('popup-overlay', 'visible');
            popup.innerHTML = `
                <div class="popup-card">
                    <div class="popup-icon">🛡️</div>
                    <div class="popup-title">¡Escudo Activado!</div>
                    <div class="popup-message">Tu próxima respuesta incorrecta será anulada.</div>
                </div>
            `;
            document.body.appendChild(popup);
            setTimeout(() => {
                popup.remove();
            }, 2000);
        }
    });

    // Mostrar feedback visual
    function showFeedback(emoji, color) {
        feedbackEmoji.textContent = emoji;
        feedbackEmoji.style.color = color;
        feedbackEmoji.style.display = 'block';
        feedbackEmoji.style.animation = 'bounce 1s forwards';
    }

    // Barajar array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Reproducir audio
    function playAudio(audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Error playing audio:", e));
    }

    // Control de música de fondo
    function playMusic() {
        if (!backgroundMusic) {
            backgroundMusic = sounds.backgroundMusic;
            backgroundMusic.loop = true;
            backgroundMusic.volume = musicRange.value;
        }
        backgroundMusic.play().catch(e => console.error("Error playing music:", e));
    }

    function stopMusic() {
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }
    }

    // Controles de sonido
    settingsBtn.addEventListener('click', () => {
        showScreen(settingsPopup);
    });

    // Cerrar pop-up de ajustes
    document.querySelector('#settingsPopup .cancel-btn').addEventListener('click', () => {
        settingsPopup.classList.remove('visible');
        settingsPopup.classList.add('hidden');
    });

    // Cambiar volumen de efectos de sonido
    soundRange.addEventListener('input', (e) => {
        Object.values(sounds).forEach(audio => {
            if (audio !== sounds.backgroundMusic) {
                audio.volume = e.target.value;
            }
        });
    });

    // Cambiar volumen de música
    musicRange.addEventListener('input', (e) => {
        if (backgroundMusic) {
            backgroundMusic.volume = e.target.value;
        }
    });

    // Iniciar la precarga al cargar la página
    preloadAssets();
});
