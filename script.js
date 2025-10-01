document.addEventListener('DOMContentLoaded', () => {
    const menuIcon = document.getElementById('menu-icon');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    // Función para alternar la visibilidad del menú
    function toggleMenu() {
        dropdownMenu.classList.toggle('open');
        
        // --- Lógica para cambiar el ícono ---
        if (dropdownMenu.classList.contains('open')) {
            menuIcon.innerHTML = '&#215;'; // Símbolo de Multiplicación (X)
            menuIcon.classList.add('open-icon');
        } else {
            menuIcon.innerHTML = '&#9776;'; // Símbolo de Hamburguesa
            menuIcon.classList.remove('open-icon');
        }
    }

    // Abre o cierra el menú al hacer clic en el icono
    menuIcon.addEventListener('click', (event) => {
        event.stopPropagation(); 
        toggleMenu();
    });

    // Cierra el menú si se hace clic fuera de él
    document.addEventListener('click', (event) => {
        if (dropdownMenu.classList.contains('open') && !dropdownMenu.contains(event.target) && event.target !== menuIcon) {
            // Cierre manual también debe actualizar el ícono
            dropdownMenu.classList.remove('open');
            menuIcon.innerHTML = '&#9776;'; 
            menuIcon.classList.remove('open-icon');
        }
    });
    
    // Lógica de juego original (continúa)
    
    // ===============================================
    // *** CAMBIO CRÍTICO: RUTA CORREGIDA DEL JSON ***
    // ===============================================
    const JSON_URL = 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/preguntas.json'; 
    // ===============================================
    
    let questionBank = []; 
    let currentQuestionIndex = 0; 
    let hasAnswered = false;
    let isWildcardActive = false; 
    
    // --- URLs de AUDIO (Rutas revisadas, si provienen del mismo repositorio) ---
    const AUDIO_CORRECT = 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/winner-game-sound-404167.mp3';
    const AUDIO_INCORRECT = 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/fail-144746.mp3';
    const AUDIO_SHIELD = 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/bubble-pops-and-ding-type-3-235798.mp3';
    const AUDIO_DEMOTION = 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/playful-failure-310480.mp3';
    const AUDIO_ASCENSION_FAIL = 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/brass-fail-11-a-207140.mp3';
    
    // Audios para comodines
    const AUDIO_WILDCARD_5050 = 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/bush-cut-103503.mp3';
    const AUDIO_WILDCARD_SKIP = 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/coin-upaif-14631.mp3';
    const AUDIO_WILDCARD_HINT = 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/scale-e6-14577.mp3';
    
    const AUDIO_ASCENSION_SUCCESS = [
        'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/11l-victory_trumpet-1749704501065-358769.mp3',
        'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/11l-victory_trumpet-1749704498589-358767.mp3',
        'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/11l-victory_trumpet-1749704496881-358778.mp3'
    ];
    
    // --- NUEVAS REFERENCIAS DE AUDIO Y AJUSTES ---
    const AUDIO_LEVEL_UP_TIMER = 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/efectos/slow-cinematic-clock-ticking-tension-2-323078.mp3';
    
    // --- LÓGICA DE PROGRESIÓN y MONEDAS ---
    let currentStars = 0;
    let hasShield = false; 
    let currentLevelIndex = 0; 
    let currentSubLevel = 1;
    let currentCoins = 20; 
    const COINS_PER_CORRECT_ANSWER = 2; 

    const LEVEL_CONFIG = [
        { name: "Discípulo", maxSubLevels: 5 },
        { name: "Maestro", maxSubLevels: 7 },
        { name: "Experto", maxSubLevels: 10 }
    ];
    const STAR_THRESHOLD = 5;
    const PENALTY_STARS = 3; 
    const TOTAL_STARS_DISPLAY = STAR_THRESHOLD; 
    
    // Costos de comodines
    const WILDCARD_COSTS = {
        '5050': 10,
        'skip': 15,
        'hint': 20
    };
    
    // --- NUEVAS REFERENCIAS DE AUDIO Y AJUSTES ---
    const audioToggle = document.getElementById('audio-toggle');
    const settingsModal = document.getElementById('settings-modal'); 

    // Carga el estado del audio o usa 'true' por defecto
    let isAudioEnabled = localStorage.getItem('isAudioEnabled') === 'false' ? false : true; 

    // **NUEVA VARIABLE PARA EL TEMPORIZADOR**
    let levelUpTimerInterval = null;
    let timeLeft = 0; 
    const LEVEL_UP_TIME = 15; // Segundos
    
    // --- REFERENCIAS DE ELEMENTOS DE JUEGO ---
    const profileLevelSmall = document.getElementById('profile-level-small');
    const coinsValueElement = document.getElementById('coins-value'); 
    const starCounterContainer = document.getElementById('star-counter-container');
    const shieldDisplay = document.getElementById('shield-display'); 
    const levelUpModal = document.getElementById('level-up-modal');
    const optionsContainer = document.getElementById('options-container');
    const wildcardContainer = document.getElementById('wildcard-container');
    const tooltip = document.getElementById('answer-tooltip');
    const hintTooltip = document.getElementById('hint-tooltip'); 
    const levelUpTimerElement = document.getElementById('level-up-timer'); // **NUEVA REFERENCIA**

    // Referencias de Modales
    const successModal = document.getElementById('success-modal');
    const demotionModal = document.getElementById('demotion-modal');
    const shieldAnimationModal = document.getElementById('shield-animation-modal');
    const penaltyModal = document.getElementById('penalty-modal'); 

    // --- UTILIDADES DE AUDIO (MODIFICADAS) ---
    /** * Reproduce el sonido solo si el audio está habilitado.
     */
    function playSound(url) {
        if (!isAudioEnabled) return; // Nueva verificación
        const audio = new Audio(url);
        audio.play().catch(e => console.error("Error al reproducir audio:", e));
    }

    /** * Sincroniza el estado global (isAudioEnabled) con el checkbox del modal y localStorage. 
     */
    function syncAudioState() {
        isAudioEnabled = audioToggle.checked;
        localStorage.setItem('isAudioEnabled', isAudioEnabled);
    }
    
    /** * Muestra el modal de ajustes y carga el estado actual del audio.
     */
    window.showSettingsModal = function() {
        // 1. Cargar el estado actual desde la variable global
        audioToggle.checked = isAudioEnabled; 
        settingsModal.classList.add('visible');
        
        // Cierra el menú desplegado si está abierto
        dropdownMenu.classList.remove('open');
        menuIcon.innerHTML = '&#9776;'; 
        menuIcon.classList.remove('open-icon');
    }
    
    /** * Oculta el modal de ajustes.
     */
    window.hideSettingsModal = function() {
        settingsModal.classList.remove('visible');
    }
    
    // --- Escuchador de Eventos para el Switch ---
    audioToggle.addEventListener('change', syncAudioState);
    
    function playRandomAscensionSound() {
        if (!isAudioEnabled) return; // Nueva verificación
        const randomIndex = Math.floor(Math.random() * AUDIO_ASCENSION_SUCCESS.length);
        playSound(AUDIO_ASCENSION_SUCCESS[randomIndex]);
    }
    
    // --- UTILIDADES DE JUEGO Y DISPLAY (Sin cambios funcionales) ---

    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    function convertToRoman(num) {
        if (num <= 0) return '';
        const map = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
        return map[num] || num.toString();
    }

    /** Actualiza el texto del nivel del jugador. */
    function updateLevelDisplay() {
        const levelInfo = LEVEL_CONFIG[currentLevelIndex];
        profileLevelSmall.textContent = `Nivel: ${levelInfo.name} ${convertToRoman(currentSubLevel)}`;
    }
    
    /** Actualiza el valor de monedas. */
    function updateCoinDisplay() {
        coinsValueElement.textContent = currentCoins;
        updateWildcardButtons();
    }

    /** Actualiza las estrellas y el escudo visualmente. */
    function updateStarDisplay() {
        let existingStars = starCounterContainer.querySelectorAll('.star');
        if (existingStars.length !== TOTAL_STARS_DISPLAY) {
             // Reconstruir la estructura si es necesario
            starCounterContainer.innerHTML = '<span id="shield-display" class="faded">🛡️</span><span class="separator">|</span>';
            for (let i = 1; i <= TOTAL_STARS_DISPLAY; i++) {
                const star = document.createElement('span');
                star.classList.add('star');
                star.textContent = '🌟'; 
                starCounterContainer.appendChild(star);
            }
        }
        existingStars = starCounterContainer.querySelectorAll('.star'); 

        for (let i = 0; i < TOTAL_STARS_DISPLAY; i++) {
            if (i < currentStars) {
                existingStars[i].classList.remove('faded');
            } else {
                existingStars[i].classList.add('faded');
            }
        }
        
        const shieldElement = document.getElementById('shield-display');
        if (hasShield) {
            shieldElement.classList.remove('faded');
        } else {
            shieldElement.classList.add('faded');
        }
    }
    
    /** Deshabilita comodines si el jugador no tiene suficientes monedas. */
    function updateWildcardButtons() {
        const buttons = document.querySelectorAll('.wildcard-button');
        buttons.forEach(button => {
            const cost = parseInt(button.dataset.cost);
            if (currentCoins < cost) {
                button.disabled = true;
            } else if (!hasAnswered && !isWildcardActive) {
                // Solo habilitar si no se ha respondido Y si no hay un comodín ya activo
                button.disabled = false;
            }
        });
        
        if (hasAnswered || isWildcardActive) {
            // Deshabilitar todos si ya se respondió o hay una pista activa (para evitar más comodines)
            buttons.forEach(button => button.disabled = true);
        }
    }
    
    // --- LÓGICA DE COMODINES (WILDCARDS) (Sin cambios funcionales) ---
    
    /** Manejador principal para el uso de comodines. */
    window.useWildcard = function(type) {
        const cost = WILDCARD_COSTS[type];
        if (currentCoins < cost) {
            alert("¡Monedas insuficientes! Necesitas " + cost + " monedas.");
            return;
        }
        
        if (isWildcardActive) {
             alert("Ya tienes una pista activa. ¡Aprovéchala!");
             return;
        }
        
        currentCoins -= cost;
        updateCoinDisplay();
        isWildcardActive = true; 
        
        const currentQuestion = questionBank[currentQuestionIndex];
        
        switch (type) {
            case '5050':
                playSound(AUDIO_WILDCARD_5050); 
                apply5050(currentQuestion.answer);
                break;
            case 'skip':
                playSound(AUDIO_WILDCARD_SKIP); 
                skipQuestion();
                break;
            case 'hint':
                playSound(AUDIO_WILDCARD_HINT); 
                showHint(currentQuestion.hint);
                break;
        }
        
        updateWildcardButtons(); 
    }

    /** Aplica el comodín 50/50. */
    function apply5050(correctAnswer) {
        const options = Array.from(optionsContainer.children);
        let incorrectOptions = options.filter(btn => btn.textContent !== correctAnswer);
        
        shuffle(incorrectOptions); 
        
        for (let i = 0; i < 2; i++) {
            if (incorrectOptions[i]) {
                incorrectOptions[i].classList.add('wildcard-disabled');
            }
        }
        
        isWildcardActive = false; 
        updateWildcardButtons(); 
    }

    /** Salta la pregunta actual. */
    function skipQuestion() {
        currentQuestionIndex++;
        displayQuestion();
        isWildcardActive = false; 
        updateWildcardButtons(); 
    }

    /** Muestra el modal de pista. */
    function showHint(hintText) {
        document.getElementById('hint-text').textContent = hintText;
        hintTooltip.classList.add('visible'); 
    }
    
    /** Oculta el modal de pista (llamada desde el botón "Entendido"). */
    window.hideHintModal = function() {
        hintTooltip.classList.remove('visible');
    }

    // --- LÓGICA DE CARGA DE DATOS (Sin cambios en la lógica) ---

    async function loadQuestions() {
        try {
            const response = await fetch(JSON_URL);
            if (!response.ok) {
                // Si hay un error 404, se lanza un error y se va al catch
                throw new Error(`Error HTTP: ${response.status} - Verifique la URL: ${JSON_URL}`);
            }
            
            const loadedQuestions = await response.json();
            questionBank = shuffle(loadedQuestions); 
            
            const playButton = document.getElementById('play-button');
            playButton.disabled = false;
            playButton.textContent = "JUGAR";
            
        } catch (error) {
            console.error("❌ Fallo crítico al cargar las preguntas:", error);
            const playButton = document.getElementById('play-button');
            // Mensaje de error más útil para el usuario
            playButton.textContent = "Error de Carga. (Ver Consola)"; 
            playButton.style.backgroundColor = '#dc3545';
        }
    }
    
    // --- DISPLAY DE JUEGO (Sin cambios funcionales) ---

    function displayQuestion() {
        document.querySelectorAll('.level-modal').forEach(modal => {
            modal.classList.remove('visible');
        });

        // **ASEGURARSE DE LIMPIAR EL TEMPORIZADOR**
        clearInterval(levelUpTimerInterval); 
        levelUpTimerInterval = null;

        if (currentQuestionIndex >= questionBank.length) {
            questionBank = shuffle(questionBank);
            currentQuestionIndex = 0;
        }
        
        if (currentStars >= STAR_THRESHOLD) {
            showLevelUpQuestion();
            return; 
        }

        const question = questionBank[currentQuestionIndex];
        document.getElementById('quiz-container').style.display = 'block';
        document.getElementById('question-text').textContent = question.question;
        optionsContainer.innerHTML = '';
        hasAnswered = false; 
        isWildcardActive = false; 
        
        const shuffledOptions = shuffle([...question.options]); 

        shuffledOptions.forEach((option) => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            button.textContent = option;
            
            button.addEventListener('click', () => {
                if (!hasAnswered) {
                    checkAnswer(button, option, question);
                }
            });
            
            optionsContainer.appendChild(button);
        });
        
        updateWildcardButtons(); 
    }
    
    /** Verifica la respuesta de una pregunta normal. */
    function checkAnswer(selectedButton, selectedOption, question) {
        hasAnswered = true; 
        isWildcardActive = false; 
        hintTooltip.classList.remove('visible'); 
        updateWildcardButtons(); 
        
        const correctAnswer = question.answer;
        const reference = question.reference || "No disponible"; 
        const allOptionButtons = document.querySelectorAll('#options-container .option-button');
        
        // 1. Aplicar feedback visual y desactivar botones
        allOptionButtons.forEach(button => {
            button.disabled = true; 
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            } 
            if (button === selectedButton && selectedOption !== correctAnswer) {
                button.classList.add('incorrect');
            }
            if (button !== selectedButton && button.textContent !== correctAnswer && !button.classList.contains('wildcard-disabled')) {
                button.style.opacity = '0.6';
            }
        });

        // 2. Lógica de Estrellas, Monedas y Avance
        if (selectedOption === correctAnswer) {
            // CORRECTO
            playSound(AUDIO_CORRECT); 
            
            currentCoins += COINS_PER_CORRECT_ANSWER;
            updateCoinDisplay();

            const startStarCount = currentStars;
            currentStars = Math.min(startStarCount + 1, STAR_THRESHOLD); 
            
            if (currentStars > startStarCount) {
                animateStar(selectedButton); 
            } else {
                setTimeout(() => {
                    currentQuestionIndex++;
                    displayQuestion();
                }, 1000); 
            }
            
        } else {
            // INCORRECTO: Lógica de penalización y ESCUDO
            
            let nextAction = '';

            if (currentStars > 0) {
                playSound(AUDIO_INCORRECT); 
                currentStars--; 
                animateStarLoss();
                nextAction = 'advance';
                
            } else if (currentStars === 0) {
                
                if (hasShield) {
                    hasShield = false; 
                    updateStarDisplay(); 
                    showShieldShatterAnimation(); 
                    return; 

                } else {
                    const isBaseLevel = currentLevelIndex === 0 && currentSubLevel === 1;
                    playSound(AUDIO_INCORRECT); 
                    
                    if (isBaseLevel) {
                        currentStars = 0; 
                        updateStarDisplay(); 
                        nextAction = 'advance'; 

                    } else {
                        nextAction = 'levelDown'; 
                    }
                }
            }

            showTooltipAboveButton(selectedButton, correctAnswer, reference);
            
            // 3. Lógica de Tooltip y Avance/Descenso
            setTimeout(() => {
                
                tooltip.classList.remove('show');
                
                if (nextAction === 'levelDown') {
                    handleLevelDown(); 
                } else {
                    currentQuestionIndex++;
                    displayQuestion(); 
                }
                
            }, 3000); 
        }
    }
    
    /** Inicia el juego. */
    function startGame() {
        currentStars = 0;
        hasShield = false; 
        currentLevelIndex = 0; 
        currentSubLevel = 1;
        currentQuestionIndex = 0; 
        // Restaurar/Reiniciar monedas a un valor inicial si se quiere empezar desde 0
        currentCoins = parseInt(localStorage.getItem('currentCoins') || 20); 

        updateLevelDisplay();
        updateStarDisplay();
        updateCoinDisplay(); 

        if (questionBank.length > 0) {
            displayQuestion();
        } else {
            alert("Error: Las preguntas no están cargadas.");
        }
    }

    function advanceLevel() {
        playRandomAscensionSound(); 
        
        const levelInfo = LEVEL_CONFIG[currentLevelIndex];
        
        let newLevelName;
        let newSubLevelRoman;

        if (currentSubLevel < levelInfo.maxSubLevels) {
            currentSubLevel++;
            newLevelName = levelInfo.name;
            newSubLevelRoman = convertToRoman(currentSubLevel);
        } else if (currentLevelIndex < LEVEL_CONFIG.length - 1) {
            currentLevelIndex++;
            currentSubLevel = 1; 
            newLevelName = LEVEL_CONFIG[currentLevelIndex].name;
            newSubLevelRoman = 'I';
        } else {
            alert("¡Felicidades! ¡Has alcanzado el nivel MÁXIMO (Experto X)! El juego continuará.");
            currentStars = 0; 
            hasShield = true; 
            currentCoins += 10; 
            updateLevelDisplay();
            updateStarDisplay();
            updateCoinDisplay();
            displayQuestion();
            return;
        }
        
        currentStars = 0; 
        hasShield = true; 
        currentCoins += 10; 
        
        updateLevelDisplay();
        updateStarDisplay();
        updateCoinDisplay(); 
        
        showSuccessPopup(newLevelName, newSubLevelRoman);
    }

    // --- INICIALIZACIÓN DE LA APLICACIÓN ---

    // Mueve la lógica principal del DOMContentLoaded fuera de la anterior para evitar anidación
    (() => {
        const preloader = document.getElementById('preloader');
        const body = document.body;
        const playButton = document.getElementById('play-button');
        const nameInput = document.getElementById('name-input');
        const welcomeSection = document.getElementById('welcome-section');
        const gameSection = document.getElementById('game-section');
        const rulesModal = document.getElementById('rules-modal'); 
        const startGameButton = document.getElementById('start-game-button'); 

        gameSection.style.display = 'none'; 
        
        rulesModal.classList.remove('visible'); 
        
        // Cargar nombre del jugador si existe
        const storedName = localStorage.getItem('playerName');
        if (storedName) {
            nameInput.value = storedName;
            document.getElementById('profile-username-small').textContent = storedName;
        }
        
        // Listeners para botones de juego
        playButton.addEventListener('click', function() {
            const userName = nameInput.value.trim();
            if (playButton.disabled) return;

            if (userName) {
                localStorage.setItem('playerName', userName);
                document.getElementById('profile-username-small').textContent = userName;
                
                welcomeSection.style.display = 'none'; 
                rulesModal.classList.add('visible'); 
            } else {
                alert('Por favor, escribe tu nombre para empezar a jugar.');
                nameInput.focus();
            }
        });
        
        startGameButton.addEventListener('click', function() {
            rulesModal.classList.remove('visible');
            document.getElementById('top-bar-container').classList.add('visible');
            showContentSection('welcome-section', 'game-section'); 
            startGame(); 
        });
        
        // Simulador de carga (Preloader)
        let progress = 0;
        const loadingInterval = setInterval(() => {
            if (progress < 85) progress += 2;
            document.getElementById('loading-bar').style.width = progress + '%';
            document.getElementById('loading-percentage').textContent = progress + '%';

            if (progress >= 85) {
                loadQuestions().finally(() => {
                    clearInterval(loadingInterval);
                    progress = 100;
                    document.getElementById('loading-bar').style.width = '100%';
                    document.getElementById('loading-percentage').textContent = '100%';
                    
                    preloader.style.opacity = '0';
                    
                    setTimeout(() => {
                        preloader.style.display = 'none';
                        body.classList.add('loaded'); 
                        welcomeSection.classList.add('active');
                        welcomeSection.style.display = 'flex';
                        
                        // Inicializar estados al final de la carga
                        audioToggle.checked = isAudioEnabled; 
                        updateLevelDisplay(); 
                        updateStarDisplay(); 
                        updateCoinDisplay(); 
                    }, 500); 
                });
            }
        }, 50);

        updateWildcardButtons(); 
    })();
    
    // --- Pegar funciones restantes (simplificadas) ---
    
    function showContentSection(hideId, showId) {
        document.getElementById(hideId).classList.remove('active');
        setTimeout(() => {
            document.getElementById(hideId).style.display = 'none'; 
            document.getElementById(showId).style.display = 'flex'; 
            document.getElementById(showId).classList.add('active');
        }, 500); 
    }
    
    function showSuccessPopup(newLevelName, newSubLevelRoman) {
        document.getElementById('success-title').textContent = '¡ASCENSO CONSEGUIDO! 🌟';
        document.getElementById('success-message').innerHTML = `Has pasado la prueba. ¡Felicidades! Ahora eres **${newLevelName} ${newSubLevelRoman}** 🎉. ¡Has ganado un **ESCUDO** 🛡️ y **10 monedas** 🪙!`;
        successModal.classList.add('visible');
        
        document.getElementById('next-level-button').onclick = () => {
            successModal.classList.remove('visible');
            displayQuestion(); 
        };
    }
    
    function showPenaltyPopup() {
        playSound(AUDIO_ASCENSION_FAIL); 
        // **ASEGURARSE DE LIMPIAR EL TEMPORIZADOR**
        clearInterval(levelUpTimerInterval); 
        levelUpTimerInterval = null;
        
        const levelInfo = LEVEL_CONFIG[currentLevelIndex];
        const currentLevelRoman = convertToRoman(currentSubLevel);
        currentStars = PENALTY_STARS; 
        updateStarDisplay(); 
        document.getElementById('penalty-title').textContent = '¡PRUEBA FALLIDA! ❌';
        document.getElementById('penalty-message').innerHTML = `No has superado la prueba. Te quedas en **${levelInfo.name} ${currentLevelRoman}** y tu contador de estrellas se ha restablecido a **${PENALTY_STARS}** 🔻.`;
        
        penaltyModal.classList.add('visible');
        
        document.getElementById('penalty-button').onclick = () => {
            penaltyModal.classList.remove('visible');
            currentQuestionIndex++;
            displayQuestion(); 
        };
    }
    
    function handleLevelDown() {
        playSound(AUDIO_DEMOTION); 
        const isBaseLevel = currentLevelIndex === 0 && currentSubLevel === 1;

        if (isBaseLevel) {
            currentStars = 0; 
            updateStarDisplay();
            currentQuestionIndex++;
            displayQuestion(); 
            return;
        }
        
        let oldLevelName = LEVEL_CONFIG[currentLevelIndex].name;
        let oldSubLevelRoman = convertToRoman(currentSubLevel);
        
        let newLevelName;
        let newSubLevelRoman;

        if (currentSubLevel > 1) {
            currentSubLevel--;
            newLevelName = LEVEL_CONFIG[currentLevelIndex].name;
            newSubLevelRoman = convertToRoman(currentSubLevel);
        } else { 
            currentLevelIndex--;
            currentSubLevel = LEVEL_CONFIG[currentLevelIndex].maxSubLevels;
            newLevelName = LEVEL_CONFIG[currentLevelIndex].name;
            newSubLevelRoman = convertToRoman(currentSubLevel);
        }
        
        currentStars = 0; 
        updateLevelDisplay();
        updateStarDisplay();
        
        document.getElementById('demotion-title').textContent = '¡HAS DESCENDIDO! 🔻';
        document.getElementById('demotion-message').innerHTML = `Por agotar tus estrellas, has descendido de **${oldLevelName} ${oldSubLevelRoman}** a **${newLevelName} ${newSubLevelRoman}**. Tu contador se ha reiniciado (0 estrellas).`;
        
        demotionModal.classList.add('visible');
        document.getElementById('demotion-button').onclick = () => {
            demotionModal.classList.remove('visible');
            currentQuestionIndex++;
            displayQuestion(); 
        };
    }

    /**
     * FUNCIÓN PARA GESTIONAR EL TEMPORIZADOR DE ASCENSO
     */
    function startLevelUpTimer() {
        timeLeft = LEVEL_UP_TIME;
        levelUpTimerElement.textContent = `Tiempo restante: ${timeLeft}s`;

        // Reproducir el sonido del temporizador al iniciar
        playSound(AUDIO_LEVEL_UP_TIMER);

        // Variable para almacenar el audio de temporizador
        let timerAudio = null;
        
        // Iniciar el temporizador
        levelUpTimerInterval = setInterval(() => {
            timeLeft--;
            levelUpTimerElement.textContent = `Tiempo restante: ${timeLeft}s`;
            
            if (timeLeft <= 5) { // Advertencia visual en los últimos 5 segundos
                levelUpTimerElement.style.color = '#dc3545'; // Rojo
            } else {
                levelUpTimerElement.style.color = '#FFC107'; // Dorado
            }

            // Reproducir sonido de temporizador cada segundo
            if (isAudioEnabled && timeLeft > 0) {
                // Reutilizar el mismo objeto Audio para evitar múltiples instancias
                if (timerAudio) {
                    timerAudio.pause();
                    timerAudio.currentTime = 0;
                }
                timerAudio = new Audio(AUDIO_LEVEL_UP_TIMER);
                timerAudio.play().catch(e => console.error("Error al reproducir audio:", e));
            }

            if (timeLeft <= 0) {
                clearInterval(levelUpTimerInterval);
                levelUpTimerInterval = null;
                
                // Detener el audio del temporizador cuando llega a cero
                if (timerAudio) {
                    timerAudio.pause();
                    timerAudio.currentTime = 0;
                }
                
                // Deshabilitar botones para evitar respuestas tardías
                document.querySelectorAll('#level-up-options .option-button').forEach(btn => btn.disabled = true);
                
                levelUpModal.classList.remove('visible'); 
                showPenaltyPopup(); // El tiempo se agotó, aplica penalización
            }
        }, 1000);
    }
    
    function showLevelUpQuestion() {
        const question = questionBank[currentQuestionIndex];
        const levelUpQuestionElement = document.getElementById('level-up-question');
        const levelUpOptionsContainer = document.getElementById('level-up-options');
        
        levelUpModal.classList.add('visible');
        levelUpQuestionElement.textContent = question.question;
        levelUpOptionsContainer.innerHTML = '';

        startLevelUpTimer(); // **INICIAR EL TEMPORIZADOR**
        
        const shuffledOptions = shuffle([...question.options]); 
        
        shuffledOptions.forEach((option) => {
            const button = document.createElement('button');
            button.classList.add('option-button'); 
            button.textContent = option;
            
            button.addEventListener('click', () => {
                // Antes de verificar la respuesta, detener el temporizador
                if (levelUpTimerInterval) {
                    clearInterval(levelUpTimerInterval);
                    levelUpTimerInterval = null;
                }
                checkLevelUpAnswer(button, option, question);
            });
            
            levelUpOptionsContainer.appendChild(button);
        });
    }
    
    function checkLevelUpAnswer(selectedButton, selectedOption, question) {
        // **IMPORTANTE: El temporizador ya fue detenido en el listener**
        
        document.querySelectorAll('#level-up-options .option-button').forEach(btn => btn.disabled = true);
        const correctAnswer = question.answer;

        if (selectedOption === correctAnswer) {
            playSound(AUDIO_CORRECT); 
            selectedButton.classList.add('correct');
            setTimeout(() => {
                currentQuestionIndex++;
                advanceLevel(); 
            }, 1500);
        } else {
            playSound(AUDIO_INCORRECT); 
            selectedButton.classList.add('incorrect');
            document.querySelectorAll('#level-up-options .option-button').forEach(btn => {
                if (btn.textContent === correctAnswer) {
                    btn.classList.add('correct');
                }
            });
            setTimeout(() => {
                levelUpModal.classList.remove('visible'); 
                showPenaltyPopup(); 
            }, 1500); 
        }
    }
    
    function animateStar(startElement) {
        const star = document.createElement('span');
        star.textContent = '🌟';
        star.classList.add('animated-star');
        document.body.appendChild(star);

        const startRect = startElement.getBoundingClientRect();
        
        const starElements = Array.from(starCounterContainer.querySelectorAll('.star'));
        const targetStarIndex = currentStars - 1; 
        const targetStarElement = starElements[targetStarIndex];
        
        if (!targetStarElement) {
            star.remove(); 
            currentQuestionIndex++;
            displayQuestion();
            return;
        }
        
        const targetRect = targetStarElement.getBoundingClientRect();

        star.style.left = `${startRect.left + startRect.width / 2 - star.offsetWidth / 2}px`;
        star.style.top = `${startRect.top + startRect.height / 2 - star.offsetHeight / 2}px`;

        star.offsetHeight; 

        star.style.left = `${targetRect.left + targetRect.width / 2 - star.offsetWidth / 2}px`;
        star.style.top = `${targetRect.top + targetRect.height / 2 - star.offsetHeight / 2}px`;
        star.style.transform = 'scale(0.5)'; 

        setTimeout(() => {
            star.remove();
            updateStarDisplay(); 
            
            currentQuestionIndex++;
            displayQuestion();
        }, 1000); 
    }
    
    function animateStarLoss() {
        const starElements = Array.from(starCounterContainer.querySelectorAll('.star'));
        const starToFade = starElements[currentStars]; 
        
        if (starToFade) {
            starToFade.classList.add('lost-star');
            setTimeout(() => {
                starToFade.classList.remove('lost-star');
                updateStarDisplay(); 
            }, 500); 
        } else {
             updateStarDisplay();
        }
    }
    
    function showShieldShatterAnimation() {
        playSound(AUDIO_SHIELD); 
        const animatedShield = document.getElementById('animated-shield');
        
        document.getElementById('answer-tooltip').classList.remove('show');

        shieldAnimationModal.classList.add('visible');
        animatedShield.classList.add('shatter-active');
        
        setTimeout(() => {
            animatedShield.classList.remove('shatter-active');
            shieldAnimationModal.classList.remove('visible');
            currentQuestionIndex++;
            displayQuestion(); 
        }, 1800); 
    }
    
    function showTooltipAboveButton(selectedButton, correctAnswer, reference) {
        const buttonRect = selectedButton.getBoundingClientRect();
        
        document.getElementById('tooltip-title').textContent = "¡INCORRECTO!";
        document.getElementById('tooltip-correct-answer-text').textContent = `Correcta: ${correctAnswer}`;
        document.getElementById('tooltip-reference').textContent = reference ? `(${reference})` : '(Sin Referencia)';
        
        const tooltipWidth = tooltip.offsetWidth || 250; 
        const viewportWidth = window.innerWidth;
        
        let tooltipX = buttonRect.left + buttonRect.width / 2;
        
        if (tooltipX < tooltipWidth / 2 + 10) {
            tooltipX = tooltipWidth / 2 + 10;
        }
        if (tooltipX > viewportWidth - tooltipWidth / 2 - 10) {
            tooltipX = viewportWidth - tooltipWidth / 2 - 10;
        }
        
        const tooltipY = buttonRect.top; 

        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;
        
        tooltip.classList.add('show');
    }
});
