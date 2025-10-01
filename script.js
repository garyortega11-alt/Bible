document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------
    // --- DECLARACIÓN DE CONSTANTES Y ESTADOS GLOBALES ---
    // --------------------------------------

    // Elementos del DOM
    const preloader = document.getElementById('preloader');
    const loadingBar = document.getElementById('loading-bar');
    const loadingPercentage = document.getElementById('loading-percentage');
    const welcomeSection = document.getElementById('welcome-section');
    const gameSection = document.getElementById('game-section');
    const topBar = document.getElementById('top-bar-container');

    const nameInput = document.getElementById('name-input');
    const playButton = document.getElementById('play-button');
    const rulesModal = document.getElementById('rules-modal');
    const startGameButton = document.getElementById('start-game-button');
    const startLevelModal = document.getElementById('start-level-modal');
    const startGameFromLevelButton = document.getElementById('start-game-from-level-button');

    const profileUsernameSmall = document.getElementById('profile-username-small');
    const profileLevelSmall = document.getElementById('profile-level-small');
    const coinsValueDisplay = document.getElementById('coins-value');
    const quizContainer = document.getElementById('quiz-container');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');

    const answerTooltip = document.getElementById('answer-tooltip');

    const levelUpModal = document.getElementById('level-up-modal');
    const levelUpQuestionDisplay = document.getElementById('level-up-question');
    const levelUpOptionsContainer = document.getElementById('level-up-options');
    const levelUpTitle = document.getElementById('level-up-title');
    const levelUpTimerDisplay = document.getElementById('level-up-timer');

    const successModal = document.getElementById('success-modal');
    const successTitle = document.getElementById('success-title');
    const successMessage = document.getElementById('success-message');
    const successAvatar = document.getElementById('success-avatar');
    const nextLevelButton = document.getElementById('next-level-button');

    const demotionModal = document.getElementById('demotion-modal');
    const penaltyModal = document.getElementById('penalty-modal');
    const shieldAnimationModal = document.getElementById('shield-animation-modal');
    const shieldDisplay = document.getElementById('shield-display');

    const menuIcon = document.getElementById('menu-icon');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const settingsModal = document.getElementById('settings-modal');
    const audioToggle = document.getElementById('audio-toggle');
    const hintTooltip = document.getElementById('hint-tooltip');
    const hintTextDisplay = document.getElementById('hint-text');


    // --------------------------------------
    // --- VARIABLES DE ESTADO DEL JUEGO ---
    // --------------------------------------
    let allQuestions = [];
    let currentQuestionIndex = 0;

    let currentLevelIndex = 0; // Índice del Nivel Principal (Discípulo, Apóstol, etc.)
    let currentSubLevel = 1; // Subnivel actual (I, II, III, IV, V)
    let currentStars = 0;
    let coins = 20;
    let hasShield = false;
    let username = '';
    let isGameRunning = false;
    let isQuestionLocked = false;
    let levelUpTimerInterval = null;
    let isAscensionQuestion = false;

    // Constantes del juego
    const MAX_SUBLEVEL = 5;
    const STARS_TO_ASCEND = 5;
    const COINS_PER_CORRECT_ANSWER = 2;
    const PENALTY_STARS = 0; // Estrellas al fallar la prueba de ascenso


    // --------------------------------------
    // --- CONFIGURACIÓN DE NIVELES Y COMODINES ---
    // --------------------------------------
    const LEVEL_CONFIG = [
        { name: 'Discípulo', avatar: 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/avatar/1759090211738.jpg' },
        { name: 'Apóstol', avatar: 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/avatar/apostol.jpg' },
        { name: 'Profeta', avatar: 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/avatar/profeta.jpg' },
        { name: 'Evangelista', avatar: 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/avatar/evangelista.jpg' },
        { name: 'Pastor', avatar: 'https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/avatar/pastor.jpg' },
    ];

    const WILDCARD_CONFIG = {
        '5050': { cost: 10, element: document.getElementById('wildcard-5050') },
        'skip': { cost: 15, element: document.getElementById('wildcard-skip') },
        'hint': { cost: 20, element: document.getElementById('wildcard-hint') }
    };

    // --------------------------------------
    // --- CONFIGURACIÓN DE AUDIO ---
    // --------------------------------------
    let isAudioEnabled = true;

    const AUDIO_CORRECT = new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/audios/correct.mp3');
    const AUDIO_INCORRECT = new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/audios/incorrect.mp3');
    const AUDIO_LEVEL_UP = new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/audios/levelup.mp3');
    const AUDIO_DEMOTION = new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/audios/demotion.mp3');
    const AUDIO_COIN = new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/audios/coin.mp3');
    const AUDIO_WILDCARD = new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/audios/wildcard.mp3');
    const AUDIO_ASCENSION_FAIL = new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/audios/ascension_fail.mp3');
    const AUDIO_SHIELD = new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/audios/shield.mp3');
    // Audio de reloj/tensión para la pregunta de ascenso
    const AUDIO_TENSION = new Audio('https://raw.githubusercontent.com/garyortega11-alt/Bible/main/assets/audios/tension.mp3');
    AUDIO_TENSION.loop = true; // Asegurar que el audio de tensión se repita

    function playSound(audioElement) {
        if (isAudioEnabled) {
            // Clonar el nodo de audio para permitir múltiples reproducciones rápidas
            const clone = audioElement.cloneNode();
            clone.volume = 0.5;
            clone.play().catch(e => console.error("Error al reproducir audio:", e));
        }
    }

    function startLevelUpAudio() {
        if (isAudioEnabled) {
            AUDIO_TENSION.volume = 0.3; // Volumen más bajo para el loop
            AUDIO_TENSION.play().catch(e => console.error("Error al reproducir audio de tensión:", e));
        }
    }

    function stopLevelUpAudio() {
        AUDIO_TENSION.pause();
        AUDIO_TENSION.currentTime = 0;
    }


    // --------------------------------------
    // --- CÓDIGO ROMANO ---
    // --------------------------------------

    /** Convierte un número arábigo a romano (hasta 5, suficiente para subniveles) */
    function convertToRoman(num) {
        const map = { 5: 'V', 4: 'IV', 1: 'I' };
        let result = '';
        for (const i in map) {
            while (num >= i) {
                result += map[i];
                num -= i;
            }
        }
        return result;
    }

    // --------------------------------------
    // --- GESTIÓN DE DATOS Y CARGA ---
    // --------------------------------------

    /** Simula la carga de datos con preloader y progreso. */
    function loadData() {
        const totalSteps = 5;
        let currentStep = 0;

        const updateProgress = (percentage) => {
            loadingBar.style.width = `${percentage}%`;
            loadingPercentage.textContent = `${Math.round(percentage)}%`;
        };

        const interval = setInterval(() => {
            currentStep++;
            const percentage = (currentStep / totalSteps) * 100;
            updateProgress(percentage);

            if (currentStep >= totalSteps) {
                clearInterval(interval);
                fetchQuestions()
                    .then(() => {
                        updateProgress(100);
                        setTimeout(() => {
                            preloader.style.opacity = '0';
                            preloader.style.visibility = 'hidden';
                            playButton.disabled = false;
                            playButton.textContent = '¡JUGAR!';
                            nameInput.focus();
                        }, 500);
                    })
                    .catch(() => {
                        // Manejo de error si la carga de preguntas falla
                        playButton.textContent = 'Error al cargar preguntas';
                    });
            }
        }, 500);
    }

    /** Carga las preguntas desde el JSON y las mezcla. */
    async function fetchQuestions() {
        // RUTA RELATIVA CORRECTA
        const url = './assets/preguntas.json'; 
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}. Verifique la ruta del archivo.`);
            }
            const data = await response.json();
            allQuestions = shuffleArray(data);
        } catch (error) {
            console.error('No se pudo cargar o parsear el archivo JSON de preguntas:', error);
            alert('Error crítico: No se pudieron cargar las preguntas del juego. (Verifique la ruta y el formato JSON)');
            throw error;
        }
    }

    /** Función de mezcla de Fisher-Yates */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --------------------------------------
    // --- GESTIÓN DE UI/JUEGO ---
    // --------------------------------------

    /** Actualiza todos los elementos de la interfaz relacionados con el perfil y el estado. */
    function updateUI() {
        const levelInfo = LEVEL_CONFIG[currentLevelIndex];
        const currentLevelRoman = convertToRoman(currentSubLevel);
        const levelName = `${levelInfo.name} ${currentLevelRoman}`;

        profileUsernameSmall.textContent = username;
        profileLevelSmall.textContent = `Nivel: ${levelName}`;
        coinsValueDisplay.textContent = coins;
        
        updateStarDisplay();
        updateWildcardButtons();

        // Control de visibilidad del escudo
        if (hasShield) {
            shieldDisplay.classList.remove('faded');
            shieldDisplay.style.color = '#FFD700'; 
        } else {
            shieldDisplay.classList.add('faded');
            shieldDisplay.style.color = '#999999';
        }
    }
    
    /** Muestra el número de estrellas en el contenedor. */
    function updateStarDisplay() {
        const container = document.getElementById('star-counter-container');
        // Elimina todas las estrellas y separador existentes, excepto el escudo
        Array.from(container.children).forEach(child => {
            if (child.classList.contains('star') || child.classList.contains('separator')) {
                child.remove();
            }
        });
        
        // El separador "|" solo se añade si hay estrellas (para evitarlo al inicio)
        if (currentStars > 0) {
            const separator = document.createElement('span');
            separator.classList.add('separator');
            separator.textContent = '|';
            container.appendChild(separator);
        }

        // Añade las estrellas ganadas
        for (let i = 0; i < STARS_TO_ASCEND; i++) {
            const star = document.createElement('span');
            star.classList.add('star');
            star.textContent = '⭐'; // Símbolo de estrella
            star.style.order = i + 2; // Coloca las estrellas después del escudo
            
            if (i >= currentStars) {
                star.classList.add('faded'); 
            }
            container.appendChild(star);
        }
    }

    /** Controla la disponibilidad y el estilo de los botones de comodines. */
    function updateWildcardButtons() {
        for (const type in WILDCARD_CONFIG) {
            const config = WILDCARD_CONFIG[type];
            const button = config.element;
            const costElement = document.getElementById(`cost-${type}`);
            
            button.disabled = coins < config.cost;
            button.title = button.disabled ? `Necesitas ${config.cost} monedas` : `Usar comodín por ${config.cost} monedas`;
            
            // Estilo para el costo
            if (button.disabled) {
                costElement.style.color = '#ccc';
            } else {
                costElement.style.color = '#FFC107';
            }
        }
    }

    /** Muestra la siguiente pregunta del juego. */
    function displayQuestion() {
        if (currentQuestionIndex >= allQuestions.length) {
            // Reinicia el índice de preguntas si se acaban (modo loop)
            currentQuestionIndex = 0;
            allQuestions = shuffleArray(allQuestions);
        }

        const question = allQuestions[currentQuestionIndex];
        
        // Si hay 5 estrellas, la siguiente pregunta es de ascenso
        if (currentStars === STARS_TO_ASCEND) {
            isAscensionQuestion = true;
            // Busca una pregunta de ascenso, si no hay, usa una normal
            const ascensionQuestion = allQuestions.find(q => q.isAscension) || question;
            showLevelUpModal(ascensionQuestion);
            return;
        } else {
            isAscensionQuestion = false;
        }

        // Mostrar la pregunta normal
        quizContainer.style.display = 'block';
        questionText.textContent = question.question;
        optionsContainer.innerHTML = '';
        isQuestionLocked = false;
        
        // Ya no necesitamos 'isCorrect' en la opción, la comparación es directa en checkAnswer
        const options = shuffleArray(question.options.map(opt => ({ text: opt })));

        options.forEach(opt => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            button.textContent = opt.text;
            // Retirado: button.dataset.isCorrect = opt.isCorrect;
            button.onclick = () => checkAnswer(button, question);
            optionsContainer.appendChild(button);
        });
        
        // Reiniciar botones de comodín al inicio de cada pregunta
        document.querySelectorAll('.wildcard-button').forEach(btn => btn.disabled = coins < WILDCARD_CONFIG[btn.id.split('-')[1]].cost);
    }
    
    /** Verifica la respuesta seleccionada por el usuario. */
    function checkAnswer(selectedButton, question) {
        if (isQuestionLocked) return;
        isQuestionLocked = true; // Bloquea las opciones

        // **CORRECCIÓN DE CLAVE JSON**
        // Se usa question.answer en lugar de question.correctAnswer
        const selectedText = selectedButton.textContent.trim().toLowerCase();
        const correctText = question.answer.trim().toLowerCase(); 
        
        const isCorrect = selectedText === correctText; // Comparación insensible a mayúsculas

        // Deshabilita todos los botones para evitar clicks adicionales
        Array.from(optionsContainer.children).forEach(button => button.disabled = true);

        // Muestra la respuesta correcta (buscando el texto que coincida, también insensible)
        const correctButton = Array.from(optionsContainer.children).find(btn => btn.textContent.trim().toLowerCase() === correctText);
            
        if (isCorrect) {
            selectedButton.classList.add('correct');
            handleCorrectAnswer(question);
        } else {
            selectedButton.classList.add('incorrect');
            handleIncorrectAnswer(question);
            
            if (correctButton) {
                correctButton.classList.add('correct');
            }
        }

        // Muestra el tooltip con la referencia
        showAnswerTooltip(isCorrect, question);

        // Pasa a la siguiente pregunta después de un breve delay
        setTimeout(() => {
            currentQuestionIndex++;
            hideAnswerTooltip();
            if (!isAscensionQuestion) { // Solo si no es pregunta de ascenso, pasa a la siguiente
                displayQuestion();
            }
        }, 3000);
    }

    // --------------------------------------
    // --- LÓGICA DE RESPUESTAS ---
    // --------------------------------------

    /** Lógica al responder correctamente. */
    function handleCorrectAnswer(question) {
        playSound(AUDIO_CORRECT);
        gainStar();
        gainCoins(COINS_PER_CORRECT_ANSWER);
    }

    /** Lógica al responder incorrectamente. */
    function handleIncorrectAnswer(question) {
        playSound(AUDIO_INCORRECT);
        // Lógica de descenso/protección
        if (currentStars === 0) {
            // El descenso solo ocurre si no tienes estrellas y fallas, Y si no tienes escudo
            if (currentSubLevel === 1 && currentLevelIndex === 0) {
                // Si estás en Discípulo I, no desciendes más
                showNoDemotionPopup();
            } else if (hasShield) {
                useShieldProtection();
            } else {
                showDemotionPopup();
            }
        } else {
            // Pierde una estrella si la tienes
            loseStar();
        }
    }

    /** Incrementa las monedas y actualiza la UI */
    function gainCoins(amount) {
        coins += amount;
        playSound(AUDIO_COIN);
        updateUI();
    }
    
    /** Gana una estrella si no estás en el máximo. */
    function gainStar() {
        if (currentStars < STARS_TO_ASCEND) {
            currentStars++;
            updateStarDisplay();
        }
        // Si llega a 5, la próxima llamada a displayQuestion activará el ascenso
    }

    /** Pierde una estrella (con animación visual). */
    function loseStar() {
        if (currentStars > 0) {
            currentStars--;
            // Añadir animación de pérdida a la estrella correspondiente
            const stars = document.querySelectorAll('#star-counter-container .star');
            if (stars.length > 0) {
                stars[currentStars].classList.add('lost-star');
                // Quitar la clase de animación después de que termine
                setTimeout(() => {
                    stars[currentStars].classList.remove('lost-star');
                    updateStarDisplay(); // Redibuja para que desaparezca correctamente
                }, 500);
            } else {
                updateStarDisplay();
            }
        }
    }

    /** Muestra el tooltip de referencia bíblica */
    function showAnswerTooltip(isCorrect, question) {
        // Calcular posición: debajo de las opciones, centrado en X
        const rect = optionsContainer.getBoundingClientRect();
        const top = rect.bottom + window.scrollY + 10;
        const left = rect.left + rect.width / 2;
        
        answerTooltip.style.top = `${top}px`;
        answerTooltip.style.left = '50%';
        
        answerTooltip.style.backgroundColor = isCorrect ? '#28a745' : '#dc3545';
        document.getElementById('tooltip-title').textContent = isCorrect ? '¡CORRECTO!' : '¡INCORRECTO!';
        // **CORRECCIÓN DE CLAVE JSON**
        document.getElementById('tooltip-correct-answer-text').textContent = `Respuesta: ${question.answer}`;
        document.getElementById('tooltip-reference').textContent = question.reference || '';
        
        answerTooltip.classList.add('show');
    }

    /** Oculta el tooltip de referencia bíblica */
    function hideAnswerTooltip() {
        answerTooltip.classList.remove('show');
    }

    // --------------------------------------
    // --- LÓGICA DE ASCENSO Y DESCENSO ---
    // --------------------------------------

    /** Muestra el modal para la pregunta de ascenso. */
    function showLevelUpModal(question) {
        levelUpTitle.textContent = '¡PREGUNTA DE ASCENSO!';
        levelUpQuestionDisplay.textContent = question.question;
        levelUpOptionsContainer.innerHTML = '';
        
        // Muestra el quiz container para darle formato a las opciones
        quizContainer.style.display = 'block'; 

        const options = shuffleArray(question.options.map(opt => ({ text: opt })));

        options.forEach(opt => {
            const button = document.createElement('button');
            button.classList.add('option-button');
            button.textContent = opt.text;
            // Retirado: button.dataset.isCorrect = opt.isCorrect;
            button.onclick = () => checkLevelUpAnswer(button, question);
            levelUpOptionsContainer.appendChild(button);
        });

        // Inicia el temporizador y el audio
        startLevelUpTimer(15, question);
        levelUpModal.classList.add('visible');
    }

    /** Inicia el temporizador para la pregunta de ascenso. */
    function startLevelUpTimer(duration, question) {
        let timeLeft = duration;
        levelUpTimerDisplay.textContent = `Tiempo restante: ${timeLeft}s`;
        startLevelUpAudio(); 

        levelUpTimerInterval = setInterval(() => {
            timeLeft--;
            levelUpTimerDisplay.textContent = `Tiempo restante: ${timeLeft}s`;

            if (timeLeft <= 5) {
                levelUpTimerDisplay.style.color = '#dc3545'; 
            } else {
                levelUpTimerDisplay.style.color = '#FFC107';
            }

            if (timeLeft <= 0) {
                clearInterval(levelUpTimerInterval);
                checkLevelUpAnswer(null, question); // Simula una respuesta fallida por tiempo
            }
        }, 1000);
    }
    
    /** Verifica la respuesta seleccionada en el modal de ascenso. */
    function checkLevelUpAnswer(selectedButton, question) {
        if (isQuestionLocked) return;
        isQuestionLocked = true;
        
        clearInterval(levelUpTimerInterval);
        levelUpTimerInterval = null;
        stopLevelUpAudio();

        const options = Array.from(levelUpOptionsContainer.children);
        
        // **CORRECCIÓN DE CLAVE JSON**
        const correctText = question.answer.trim().toLowerCase();
        
        const selectedText = selectedButton ? selectedButton.textContent.trim().toLowerCase() : '';
        const isCorrect = selectedButton && selectedText === correctText;
        
        const correctButton = options.find(btn => btn.textContent.trim().toLowerCase() === correctText);


        if (selectedButton) {
            // Deshabilita todos los botones
            options.forEach(button => button.disabled = true);
            
            if (isCorrect) {
                selectedButton.classList.add('correct');
                // Marcar correcta y luego mostrar éxito
                setTimeout(() => {
                    levelUpModal.classList.remove('visible');
                    handleAscensionSuccess();
                }, 1500);
            } else {
                selectedButton.classList.add('incorrect');
                correctButton.classList.add('correct');
                // Marcar incorrecta y luego mostrar penalización
                setTimeout(() => {
                    levelUpModal.classList.remove('visible');
                    showPenaltyPopup(); 
                }, 1500);
            }
        } else {
            // Caso de tiempo agotado
            if(correctButton) correctButton.classList.add('correct');
            setTimeout(() => {
                levelUpModal.classList.remove('visible');
                showPenaltyPopup(); 
            }, 1500);
        }
    }

    /** Maneja el éxito en la prueba de ascenso. */
    function handleAscensionSuccess() {
        playSound(AUDIO_LEVEL_UP);
        currentStars = 0; // Se pierden las estrellas al ascender
        hasShield = true; // Gana un escudo
        
        const isLevelUp = currentSubLevel === MAX_SUBLEVEL;

        if (isLevelUp) {
            currentLevelIndex++;
            currentSubLevel = 1;
            successTitle.textContent = '¡NIVEL ASCENDIDO! 🏆';
            const newLevelInfo = LEVEL_CONFIG[currentLevelIndex];
            successMessage.innerHTML = `¡Felicidades! Has alcanzado el nivel **${newLevelInfo.name} I**. ¡Tienes un escudo de protección!`;
            successAvatar.src = newLevelInfo.avatar;
            successAvatar.style.display = 'block';

        } else {
            currentSubLevel++;
            successTitle.textContent = '¡SUB NIVEL COMPLETADO! 🌟';
            const levelInfo = LEVEL_CONFIG[currentLevelIndex];
            const newSubLevelRoman = convertToRoman(currentSubLevel);
            successMessage.innerHTML = `¡Bien hecho! Ahora estás en **${levelInfo.name} ${newSubLevelRoman}**. ¡Tienes un escudo de protección!`;
            successAvatar.style.display = 'none';
        }
        
        updateUI();
        successModal.classList.add('visible');

        nextLevelButton.onclick = () => {
            successModal.classList.remove('visible');
            currentQuestionIndex++;
            displayQuestion();
        };
    }
    
    /** Muestra el pop-up de penalización por fallar la prueba de ascenso. */
    function showPenaltyPopup() {
        playSound(AUDIO_ASCENSION_FAIL);
        
        // **ASEGURARSE DE LIMPIAR EL TEMPORIZADOR Y AUDIO**
        clearInterval(levelUpTimerInterval); 
        levelUpTimerInterval = null;
        stopLevelUpAudio(); 
        
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

    /** Muestra el pop-up de descenso (demotion). */
    function showDemotionPopup() {
        playSound(AUDIO_DEMOTION);

        // Descenso de subnivel
        if (currentSubLevel > 1) {
            currentSubLevel--;
            currentStars = 0;
            const levelInfo = LEVEL_CONFIG[currentLevelIndex];
            const newSubLevelRoman = convertToRoman(currentSubLevel);
            document.getElementById('demotion-title').textContent = '¡HAS DESCENDIDO! 🔻';
            document.getElementById('demotion-message').innerHTML = `Fallaste sin estrellas ni escudo. Desciendes a **${levelInfo.name} ${newSubLevelRoman}**.`;
        } 
        // Descenso de nivel principal
        else if (currentLevelIndex > 0) {
            currentLevelIndex--;
            currentSubLevel = MAX_SUBLEVEL; // Desciende al subnivel más alto del nivel anterior
            currentStars = 0;
            const levelInfo = LEVEL_CONFIG[currentLevelIndex];
            const newSubLevelRoman = convertToRoman(currentSubLevel);
            document.getElementById('demotion-title').textContent = '¡NIVEL PERDIDO! 💀';
            document.getElementById('demotion-message').innerHTML = `Fallaste sin escudo. Desciendes al nivel **${levelInfo.name} ${newSubLevelRoman}**.`;
        } 
        
        updateUI();
        demotionModal.classList.add('visible');
        
        document.getElementById('demotion-button').onclick = () => {
            demotionModal.classList.remove('visible');
            currentQuestionIndex++;
            displayQuestion();
        };
    }

    /** Muestra el pop-up cuando no hay descenso (Discípulo I). */
    function showNoDemotionPopup() {
        // En este caso, solo pierdes la moneda que habrías ganado y mantienes 0 estrellas.
        document.getElementById('penalty-title').textContent = '¡PERMISO DIVINO! 😇';
        document.getElementById('penalty-message').innerHTML = `Estás en el nivel **Discípulo I**, no puedes descender más. Mantienes tus **0 estrellas**, ¡pero ten cuidado!`;
        
        penaltyModal.classList.add('visible'); // Usamos el mismo modal de penalización

        document.getElementById('penalty-button').onclick = () => {
            penaltyModal.classList.remove('visible');
            currentQuestionIndex++;
            displayQuestion(); 
        };
    }

    /** Activa la animación y el sonido del escudo al protegerse. */
    function useShieldProtection() {
        playSound(AUDIO_SHIELD);
        hasShield = false; 
        updateUI(); // Esto actualizará el escudo a "faded"
        currentStars = 0; // Pierde las estrellas acumuladas
        updateStarDisplay(); // Muestra 0 estrellas

        shieldAnimationModal.classList.add('visible');
        const animatedShield = document.getElementById('animated-shield');
        animatedShield.classList.add('shatter-active');
        
        // Después de la animación, cierra el modal y continúa
        setTimeout(() => {
            shieldAnimationModal.classList.remove('visible');
            animatedShield.classList.remove('shatter-active');
            currentQuestionIndex++;
            displayQuestion();
        }, 2000); 
    }

    // --------------------------------------
    // --- LÓGICA DE COMODINES ---
    // --------------------------------------

    /** Usa un comodín específico si el jugador tiene suficientes monedas. */
    function useWildcard(type) {
        if (isQuestionLocked) return;
        const config = WILDCARD_CONFIG[type];
        if (coins < config.cost) return;

        coins -= config.cost;
        playSound(AUDIO_WILDCARD);
        updateUI();
        config.element.disabled = true; // Deshabilita el botón después de usar
        
        switch (type) {
            case '5050':
                wildcard5050();
                break;
            case 'skip':
                wildcardSkip();
                break;
            case 'hint':
                wildcardHint();
                break;
        }
    }

    /** Comodín 50/50: Elimina dos opciones incorrectas. */
    function wildcard5050() {
        const options = Array.from(optionsContainer.children);
        
        // **CORRECCIÓN DE CLAVE JSON**
        const correctText = allQuestions[currentQuestionIndex].answer.trim().toLowerCase();
        const incorrectOptions = options.filter(btn => btn.textContent.trim().toLowerCase() !== correctText);
        
        // De las incorrectas, elegimos 2 al azar para ocultar
        const optionsToDisable = shuffleArray(incorrectOptions).slice(0, 2);

        optionsToDisable.forEach(btn => {
            btn.classList.add('wildcard-disabled');
            btn.disabled = true;
        });
    }

    /** Comodín Saltar Pregunta: Pasa a la siguiente pregunta. */
    function wildcardSkip() {
        isQuestionLocked = true; // Bloquea la pregunta actual
        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
        }, 500); 
    }

    /** Comodín Pista: Muestra una pista sobre la pregunta. */
    function wildcardHint() {
        const currentQuestion = allQuestions[currentQuestionIndex];
        const hint = currentQuestion.hint || "Pista no disponible para esta pregunta. ¡Buena suerte!";
        
        hintTextDisplay.textContent = hint;
        hintTooltip.classList.add('visible');
    }

    function hideHintModal() {
        hintTooltip.classList.remove('visible');
    }

    // --------------------------------------
    // --- GESTIÓN DE MODALES DE MENÚ ---
    // --------------------------------------

    /** Muestra el modal de ajustes (Settings). */
    window.showSettingsModal = function() {
        dropdownMenu.classList.remove('open');
        menuIcon.classList.remove('open-icon');
        settingsModal.classList.add('visible');
    }

    /** Oculta el modal de ajustes (Settings). */
    window.hideSettingsModal = function() {
        settingsModal.classList.remove('visible');
    }

    // --------------------------------------
    // --- MANEJO DE EVENTOS ---
    // --------------------------------------

    // Input de Nombre
    nameInput.addEventListener('input', () => {
        if (nameInput.value.trim().length > 0) {
            playButton.disabled = false;
        } else {
            playButton.disabled = true;
        }
    });

    // Botón JUGAR (Muestra las Reglas)
    playButton.addEventListener('click', () => {
        username = nameInput.value.trim() || 'Jugador';
        profileUsernameSmall.textContent = username;
        rulesModal.classList.add('visible');
    });

    // Botón COMENZAR (Muestra el modal de inicio de nivel)
    startGameButton.addEventListener('click', () => {
        rulesModal.classList.remove('visible');
        
        const levelInfo = LEVEL_CONFIG[currentLevelIndex];
        const currentLevelRoman = convertToRoman(currentSubLevel);

        document.querySelector('#start-level-modal h2').textContent = `¡HOLA, ${username.toUpperCase()}!`;
        document.getElementById('start-level-avatar').src = levelInfo.avatar;
        document.querySelector('#start-level-modal p').textContent = `Inicias el nivel ${levelInfo.name} ${currentLevelRoman}`;

        startLevelModal.classList.add('visible');
    });

    // Botón COMENZAR (Inicia el juego principal)
    startGameFromLevelButton.addEventListener('click', () => {
        startLevelModal.classList.remove('visible');
        
        // Transición de secciones
        welcomeSection.classList.remove('active');
        gameSection.classList.add('active');
        topBar.classList.add('visible'); 
        
        isGameRunning = true;
        updateUI();
        displayQuestion();
    });
    
    // Toggle del Menú
    menuIcon.addEventListener('click', () => {
        dropdownMenu.classList.toggle('open');
        menuIcon.classList.toggle('open-icon');
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (event) => {
        if (!dropdownMenu.contains(event.target) && !menuIcon.contains(event.target)) {
            dropdownMenu.classList.remove('open');
            menuIcon.classList.remove('open-icon');
        }
    });

    // Toggle de Audio
    audioToggle.checked = isAudioEnabled;
    audioToggle.addEventListener('change', (event) => {
        isAudioEnabled = event.target.checked;
        if (!isAudioEnabled) {
            stopLevelUpAudio();
        }
    });

    // --------------------------------------
    // --- INICIALIZACIÓN ---
    // --------------------------------------

    // Carga inicial de datos al cargar la página
    loadData();
});
