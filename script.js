let exercises = [];

const STORAGE_KEY = "exercise_control";

const DATE_KEY = "exercise_control_date";

const exerciseName =
    document.getElementById("exerciseName");

const exerciseTime =
    document.getElementById("exerciseTime");

const addBtn =
    document.getElementById("addBtn");

const resetBtn =
    document.getElementById("resetBtn");

const toggleFormBtn =
    document.getElementById("toggleFormBtn");

const formArea =
    document.getElementById("formArea");

const listElement =
    document.getElementById("list");

let formVisible = true;

/* Data atual */

function getToday() {

    return new Date()
        .toLocaleDateString("pt-BR");
}

/* Salvar */

function saveExercises() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(exercises)
    );
}

/* Carregar */

function loadExercises() {

    try {

        const data =
            localStorage.getItem(STORAGE_KEY);

        exercises =
            data
                ? JSON.parse(data)
                : [];

    } catch {

        exercises = [];
    }
}

/* Novo dia */

function checkNewDay() {

    const savedDate =
        localStorage.getItem(DATE_KEY);

    const today = getToday();

    if (savedDate !== today) {

        exercises.forEach(exercise => {

            exercise.done = false;

            exercise.running = false;

            exercise.remaining =
                exercise.seconds;
        });

        localStorage.setItem(
            DATE_KEY,
            today
        );

        saveExercises();
    }
}

/* Adicionar */

function addExercise(name, seconds) {

    exercises.push({

        name,

        seconds,

        remaining: seconds,

        done: false,

        running: false,

        interval: null
    });

    saveExercises();

    updateDOM();
}

/* Excluir */

function deleteExercise(index) {

    clearInterval(
        exercises[index].interval
    );

    exercises.splice(index, 1);

    saveExercises();

    updateDOM();
}

/* Reset */

function resetDay() {

    exercises.forEach(exercise => {

        clearInterval(exercise.interval);

        exercise.done = false;

        exercise.running = false;

        exercise.remaining =
            exercise.seconds;
    });

    saveExercises();

    updateDOM();
}

/* Formatar tempo */

function formatTime(seconds) {

    const min =
        Math.floor(seconds / 60);

    const sec =
        seconds % 60;

    return `
        ${String(min).padStart(2, '0')}
        :
        ${String(sec).padStart(2, '0')}
    `.replace(/\s/g, '');
}

/* SOM DE FINALIZAÇÃO */

function playFinishSound() {

    const audioContext =
        new (window.AudioContext || window.webkitAudioContext)();

    const oscillator =
        audioContext.createOscillator();

    const gainNode =
        audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
        880,
        audioContext.currentTime
    );

    oscillator.connect(gainNode);

    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(
        0.15,
        audioContext.currentTime
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + 0.25
    );
}

/* Iniciar */

function startTimer(index) {

    const exercise =
        exercises[index];

    if (
        exercise.running ||
        exercise.done
    ) return;

    exercise.running = true;

    exercise.interval =
        setInterval(() => {

            exercise.remaining--;

            if (exercise.remaining <= 0) {

                clearInterval(
                    exercise.interval
                );

                exercise.running = false;

                exercise.done = true;

                exercise.remaining = 0;

                /* Som */

                playFinishSound();

                /* Vibração */

                if (navigator.vibrate) {

                    navigator.vibrate([200, 100, 200]);
                }
            }

            saveExercises();

            updateDOM();

        }, 1000);

    updateDOM();
}

/* Render */

function updateDOM() {

    listElement.innerHTML = "";

    exercises.forEach((exercise, index) => {

        const box =
            document.createElement("div");

        box.classList.add("box");

        /* Rodando */

        if (exercise.running) {

            box.classList.add("running");
        }

        /* Finalizado */

        if (exercise.done) {

            box.classList.add("done");
        }

        /* Info */

        const info =
            document.createElement("div");

        info.classList.add("info");

        /* Nome */

        const title =
            document.createElement("div");

        title.classList.add("title");

        title.textContent =
            exercise.name;

        /* Timer */

        const timer =
            document.createElement("div");

        timer.classList.add("timer");

        timer.textContent =
            formatTime(exercise.remaining);

        info.appendChild(title);

        info.appendChild(timer);

        /* Ações */

        const actions =
            document.createElement("div");

        actions.classList.add("actions");

        /* Play */

        const playBtn =
            document.createElement("button");

        playBtn.classList.add("playBtn");

        if (exercise.done) {

            playBtn.textContent = "✔";

        } else if (exercise.running) {

            playBtn.textContent = "⏳";

        } else {

            playBtn.textContent = "▶";
        }

        playBtn.addEventListener("click", () => {

            startTimer(index);
        });

        /* Delete */

        const deleteBtn =
            document.createElement("button");

        deleteBtn.classList.add("deleteBtn");

        deleteBtn.textContent = "✕";

        /* Bloquear exclusão */

        if (exercise.running) {

            deleteBtn.disabled = true;

            deleteBtn.style.opacity = "0.4";

            deleteBtn.style.cursor =
                "not-allowed";
        }

        deleteBtn.addEventListener("click", () => {

            if (exercise.running) return;

            deleteExercise(index);
        });

        actions.appendChild(playBtn);

        actions.appendChild(deleteBtn);

        box.appendChild(info);

        box.appendChild(actions);

        listElement.appendChild(box);
    });
}

/* Mostrar / ocultar */

toggleFormBtn.addEventListener("click", () => {

    formVisible = !formVisible;

    if (formVisible) {

        formArea.style.display = "flex";

        toggleFormBtn.textContent =
            "▲ Cadastro";

    } else {

        formArea.style.display = "none";

        toggleFormBtn.textContent =
            "▼ Cadastro";
    }
});

/* Adicionar */

addBtn.addEventListener("click", () => {

    const name =
        exerciseName.value.trim();

    const seconds =
        parseInt(exerciseTime.value);

    if (
        !name ||
        !seconds ||
        seconds <= 0
    ) return;

    addExercise(name, seconds);

    exerciseName.value = "";

    exerciseTime.value = "";
});

/* Enter nome */

exerciseName.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        addBtn.click();
    }
});

/* Enter tempo */

exerciseTime.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        addBtn.click();
    }
});

/* Reset */

resetBtn.addEventListener(
    "click",
    resetDay
);

/* Inicialização */

loadExercises();

checkNewDay();

updateDOM();