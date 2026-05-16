/* =========================
   ESTADO
========================= */

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

/* =========================
   DATA
========================= */

function getToday() {

    return new Date()
        .toLocaleDateString("pt-BR");
}

/* =========================
   STORAGE
========================= */

function saveExercises() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(exercises)
    );
}

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

/* =========================
   NOVO DIA
========================= */

function checkNewDay() {

    const savedDate =
        localStorage.getItem(DATE_KEY);

    const today = getToday();

    if (savedDate !== today) {

        exercises.forEach(exercise => {

            exercise.done = false;

            exercise.running = false;

            exercise.paused = false;

            exercise.remaining =
                exercise.seconds;

            /* RESETAR ESTRELAS */

            exercise.repeats = 0;
        });

        localStorage.setItem(
            DATE_KEY,
            today
        );

        saveExercises();
    }

    /* Compatibilidade */

    exercises.forEach(exercise => {

        if (exercise.repeats === undefined) {

            exercise.repeats = 0;
        }

        if (exercise.paused === undefined) {

            exercise.paused = false;
        }
    });

    saveExercises();
}

/* =========================
   ADICIONAR
========================= */

function addExercise(name, seconds) {

    exercises.push({

        name,

        seconds,

        remaining: seconds,

        done: false,

        running: false,

        paused: false,

        interval: null,

        repeats: 0
    });

    saveExercises();

    updateDOM();
}

/* =========================
   EXCLUIR
========================= */

function deleteExercise(index) {

    clearInterval(
        exercises[index].interval
    );

    exercises.splice(index, 1);

    saveExercises();

    updateDOM();
}

/* =========================
   RESET MANUAL
========================= */

function resetDay() {

    exercises.forEach(exercise => {

        clearInterval(exercise.interval);

        exercise.done = false;

        exercise.running = false;

        exercise.paused = false;

        exercise.remaining =
            exercise.seconds;

        exercise.repeats = 0;
    });

    saveExercises();

    updateDOM();
}

/* =========================
   REPETIR
========================= */

function repeatExercise(index) {

    const exercise = exercises[index];

    exercise.done = false;

    exercise.remaining =
        exercise.seconds;

    saveExercises();

    updateDOM();
}

/* =========================
   FORMATAR TEMPO
========================= */

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

/* =========================
   SOM
========================= */

function playFinishSound() {

    const audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

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

    gainNode.connect(
        audioContext.destination
    );

    gainNode.gain.setValueAtTime(
        0.15,
        audioContext.currentTime
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + 0.25
    );
}

/* =========================
   INICIAR
========================= */

function startTimer(index) {

    const exercise =
        exercises[index];

    if (
        exercise.running ||
        exercise.done
    ) return;

    exercise.running = true;

    exercise.paused = false;

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

                exercise.repeats++;

                playFinishSound();

                if (navigator.vibrate) {

                    navigator.vibrate([
                        200,
                        100,
                        200
                    ]);
                }
            }

            saveExercises();

            updateDOM();

        }, 1000);

    updateDOM();
}

/* =========================
   PAUSAR
========================= */

function pauseTimer(index) {

    const exercise =
        exercises[index];

    if (!exercise.running) return;

    clearInterval(exercise.interval);

    exercise.running = false;

    exercise.paused = true;

    saveExercises();

    updateDOM();
}

/* =========================
   RETOMAR
========================= */

function resumeTimer(index) {

    const exercise =
        exercises[index];

    if (!exercise.paused) return;

    exercise.running = true;

    exercise.paused = false;

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

                exercise.repeats++;

                playFinishSound();

                if (navigator.vibrate) {

                    navigator.vibrate([
                        200,
                        100,
                        200
                    ]);
                }
            }

            saveExercises();

            updateDOM();

        }, 1000);

    updateDOM();
}

/* =========================
   RENDER
========================= */

function updateDOM() {

    listElement.innerHTML = "";

    exercises.forEach((exercise, index) => {

        const box =
            document.createElement("div");

        box.classList.add("box");

        /* DRAG */

        box.draggable = true;

        box.dataset.index = index;

        box.addEventListener("dragstart", () => {

            box.classList.add("dragging");
        });

        box.addEventListener("dragend", () => {

            box.classList.remove("dragging");

            saveExercises();
        });

        box.addEventListener("dragover", event => {

            event.preventDefault();

            const draggingElement =
                document.querySelector(".dragging");

            if (!draggingElement) return;

            const fromIndex =
                Number(draggingElement.dataset.index);

            const toIndex =
                Number(box.dataset.index);

            if (fromIndex === toIndex) return;

            const movedItem =
                exercises.splice(fromIndex, 1)[0];

            exercises.splice(toIndex, 0, movedItem);

            updateDOM();
        });

        /* STATUS */

        if (exercise.running) {

            box.classList.add("running");
        }

        if (exercise.paused) {

            box.classList.add("paused");
        }

        if (exercise.done) {

            box.classList.add("done");
        }

        /* INFO */

        const info =
            document.createElement("div");

        info.classList.add("info");

        /* TÍTULO */

        const title =
            document.createElement("div");

        title.classList.add("title");

        title.textContent =
            exercise.name;

        /* ESTRELAS */

        const repeatBadge =
            document.createElement("div");

        repeatBadge.classList.add(
            "repeatBadge"
        );

        const stars =
            "⭐".repeat(
                Math.min(exercise.repeats, 5)
            );

        repeatBadge.textContent =
            stars || "☆";

        repeatBadge.classList.toggle(
            "active",
            exercise.repeats > 0
        );

        title.appendChild(repeatBadge);

        /* TIMER */

        const timer =
            document.createElement("div");

        timer.classList.add("timer");

        timer.textContent =
            formatTime(
                exercise.remaining
            );

        info.appendChild(title);

        info.appendChild(timer);

        /* AÇÕES */

        const actions =
            document.createElement("div");

        actions.classList.add("actions");

        /* PLAY */

        const playBtn =
            document.createElement("button");

        playBtn.classList.add("playBtn");

        if (exercise.done) {

            playBtn.textContent = "↻";

        } else if (exercise.paused) {

            playBtn.textContent = "▶";

        } else if (exercise.running) {

            playBtn.textContent = "⏸";

        } else {

            playBtn.textContent = "▶";
        }

        playBtn.addEventListener("click", () => {

            if (exercise.done) {

                repeatExercise(index);

            } else if (exercise.paused) {

                resumeTimer(index);

            } else if (exercise.running) {

                pauseTimer(index);

            } else {

                startTimer(index);
            }
        });

        /* DELETE */

        const deleteBtn =
            document.createElement("button");

        deleteBtn.classList.add("deleteBtn");

        deleteBtn.textContent = "✕";

        if (
            exercise.running ||
            exercise.paused
        ) {

            deleteBtn.disabled = true;

            deleteBtn.style.opacity = "0.4";

            deleteBtn.style.cursor =
                "not-allowed";
        }

        deleteBtn.addEventListener("click", () => {

            if (
                exercise.running ||
                exercise.paused
            ) return;

            deleteExercise(index);
        });

        actions.appendChild(playBtn);

        actions.appendChild(deleteBtn);

        box.appendChild(info);

        box.appendChild(actions);

        listElement.appendChild(box);
    });
}

/* =========================
   TOGGLE FORM
========================= */

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

/* =========================
   ADICIONAR
========================= */

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

/* ENTER */

exerciseName.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            addBtn.click();
        }
    }
);

exerciseTime.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            addBtn.click();
        }
    }
);

/* RESET */

resetBtn.addEventListener(
    "click",
    resetDay
);

/* =========================
   INIT
========================= */

loadExercises();

checkNewDay();

updateDOM();