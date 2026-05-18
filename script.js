/* =========================
   ESTADO
========================= */

let groups = [];

const STORAGE_KEY =
    "exercise_control";

const DATE_KEY =
    "exercise_control_date";

const FORM_VISIBLE_KEY =
    "exercise_form_visible";

/* =========================
   ELEMENTOS
========================= */

const groupName =
    document.getElementById(
        "groupName"
    );

const exerciseName =
    document.getElementById(
        "exerciseName"
    );

const exerciseTime =
    document.getElementById(
        "exerciseTime"
    );

const addBtn =
    document.getElementById(
        "addBtn"
    );

const resetBtn =
    document.getElementById(
        "resetBtn"
    );

const toggleFormBtn =
    document.getElementById(
        "toggleFormBtn"
    );

const formArea =
    document.getElementById(
        "formArea"
    );

const listElement =
    document.getElementById(
        "list"
    );

/* =========================
   FORM VISIBILITY
========================= */

let formVisible =

    localStorage.getItem(
        FORM_VISIBLE_KEY
    ) !== "false";

/* =========================
   DATA
========================= */

function getToday() {

    return new Date()
        .toLocaleDateString(
            "pt-BR"
        );
}

/* =========================
   STORAGE
========================= */

function saveExercises() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(groups)
    );
}

function loadExercises() {

    try {

        const data =
            localStorage.getItem(
                STORAGE_KEY
            );

        const parsed =
            data
                ? JSON.parse(data)
                : [];

        /* =========================
           NOVO FORMATO
        ========================= */

        if (

            parsed.length === 0 ||

            parsed[0].exercises

        ) {

            groups = parsed;

            /* compatibilidade */

            groups.forEach(group => {

                if (
                    group.collapsed ===
                    undefined
                ) {

                    group.collapsed =
                        false;
                }
            });

            return;
        }

        /* =========================
           MIGRAR FORMATO ANTIGO
        ========================= */

        groups = [

            {

                name: "Geral",

                collapsed: false,

                exercises:
                    parsed.map(
                    exercise => ({

                        ...exercise,

                        paused:
                            exercise.paused
                            ?? false,

                        repeats:
                            exercise.repeats
                            ?? 0
                    }))
            }
        ];

        saveExercises();

    } catch {

        groups = [];
    }
}

/* =========================
   NOVO DIA
========================= */

function checkNewDay() {

    const savedDate =
        localStorage.getItem(
            DATE_KEY
        );

    const today =
        getToday();

    if (savedDate !== today) {

        groups.forEach(group => {

            group.exercises.forEach(
                exercise => {

                exercise.done =
                    false;

                exercise.running =
                    false;

                exercise.paused =
                    false;

                exercise.remaining =
                    exercise.seconds;

                exercise.repeats =
                    0;
            });
        });

        localStorage.setItem(
            DATE_KEY,
            today
        );

        saveExercises();
    }

    groups.forEach(group => {

        group.exercises.forEach(
            exercise => {

            if (
                exercise.repeats ===
                undefined
            ) {

                exercise.repeats = 0;
            }

            if (
                exercise.paused ===
                undefined
            ) {

                exercise.paused =
                    false;
            }
        });
    });

    saveExercises();
}

/* =========================
   FORM VISIBILITY
========================= */

function updateFormVisibility() {

    if (formVisible) {

        formArea.style.display =
            "flex";

        toggleFormBtn.textContent =
            "▲ Cadastro";

    } else {

        formArea.style.display =
            "none";

        toggleFormBtn.textContent =
            "▼ Cadastro";
    }

    localStorage.setItem(
        FORM_VISIBLE_KEY,
        formVisible
    );
}

/* =========================
   GRUPOS
========================= */

function getOrCreateGroup(name) {

    let group =
        groups.find(
            g => g.name === name
        );

    if (!group) {

        group = {

            name,

            collapsed: false,

            exercises: []
        };

        groups.push(group);
    }

    return group;
}

function toggleGroup(
    groupIndex
) {

    groups[groupIndex]
        .collapsed =

        !groups[groupIndex]
            .collapsed;

    saveExercises();

    updateDOM();
}

/* =========================
   ADICIONAR
========================= */

function addExercise(
    groupNameValue,
    name,
    seconds
) {

    const group =
        getOrCreateGroup(
            groupNameValue
        );

    group.exercises.push({

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

function deleteExercise(
    groupIndex,
    exerciseIndex
) {

    const exercise =
        groups[groupIndex]
            .exercises[
                exerciseIndex
            ];

    clearInterval(
        exercise.interval
    );

    groups[groupIndex]
        .exercises
        .splice(
            exerciseIndex,
            1
        );

    /* remover grupo vazio */

    if (

        groups[groupIndex]
            .exercises
            .length === 0

    ) {

        groups.splice(
            groupIndex,
            1
        );
    }

    saveExercises();

    updateDOM();
}

/* =========================
   RESET
========================= */

function resetDay() {

    groups.forEach(group => {

        group.exercises.forEach(
            exercise => {

            clearInterval(
                exercise.interval
            );

            exercise.done =
                false;

            exercise.running =
                false;

            exercise.paused =
                false;

            exercise.remaining =
                exercise.seconds;

            exercise.repeats =
                0;
        });
    });

    saveExercises();

    updateDOM();
}

/* =========================
   REPETIR
========================= */

function repeatExercise(
    groupIndex,
    exerciseIndex
) {

    const exercise =
        groups[groupIndex]
            .exercises[
                exerciseIndex
            ];

    exercise.done = false;

    exercise.remaining =
        exercise.seconds;

    saveExercises();

    updateDOM();
}

/* =========================
   TEMPO
========================= */

function formatTime(
    seconds
) {

    const min =
        Math.floor(
            seconds / 60
        );

    const sec =
        seconds % 60;

    return `
        ${String(min)
            .padStart(2, '0')}
        :
        ${String(sec)
            .padStart(2, '0')}
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
        audioContext
            .createOscillator();

    const gainNode =
        audioContext
            .createGain();

    oscillator.type =
        "sine";

    oscillator.frequency
        .setValueAtTime(
            880,
            audioContext.currentTime
        );

    oscillator.connect(
        gainNode
    );

    gainNode.connect(
        audioContext.destination
    );

    gainNode.gain
        .setValueAtTime(
            0.15,
            audioContext.currentTime
        );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime
        + 0.25
    );
}

/* =========================
   START
========================= */

function startTimer(
    groupIndex,
    exerciseIndex
) {

    const exercise =
        groups[groupIndex]
            .exercises[
                exerciseIndex
            ];

    if (

        exercise.running ||

        exercise.done

    ) return;

    exercise.running =
        true;

    exercise.paused =
        false;

    exercise.interval =
        setInterval(() => {

        exercise.remaining--;

        if (
            exercise.remaining <= 0
        ) {

            clearInterval(
                exercise.interval
            );

            exercise.running =
                false;

            exercise.done =
                true;

            exercise.remaining =
                0;

            exercise.repeats++;

            playFinishSound();

            if (
                navigator.vibrate
            ) {

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
   PAUSE
========================= */

function pauseTimer(
    groupIndex,
    exerciseIndex
) {

    const exercise =
        groups[groupIndex]
            .exercises[
                exerciseIndex
            ];

    if (
        !exercise.running
    ) return;

    clearInterval(
        exercise.interval
    );

    exercise.running =
        false;

    exercise.paused =
        true;

    saveExercises();

    updateDOM();
}

/* =========================
   RESUME
========================= */

function resumeTimer(
    groupIndex,
    exerciseIndex
) {

    const exercise =
        groups[groupIndex]
            .exercises[
                exerciseIndex
            ];

    if (
        !exercise.paused
    ) return;

    exercise.running =
        true;

    exercise.paused =
        false;

    exercise.interval =
        setInterval(() => {

        exercise.remaining--;

        if (
            exercise.remaining <= 0
        ) {

            clearInterval(
                exercise.interval
            );

            exercise.running =
                false;

            exercise.done =
                true;

            exercise.remaining =
                0;

            exercise.repeats++;

            playFinishSound();

            if (
                navigator.vibrate
            ) {

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

    listElement.innerHTML =
        "";

    groups.forEach(
        (
            group,
            groupIndex
        ) => {

        const groupBox =
            document.createElement(
                "div"
            );

        groupBox.classList.add(
            "groupBox"
        );

        /* =========================
           TÍTULO
        ========================= */

        const groupTitle =
            document.createElement(
                "div"
            );

        groupTitle.classList.add(
            "groupTitle"
        );

        groupTitle.textContent =

            `${group.collapsed
                ? "▶"
                : "▼"} ${group.name}`;

        groupTitle
            .addEventListener(
            "click",
            () => toggleGroup(
                groupIndex
            )
        );

        groupBox.appendChild(
            groupTitle
        );

        /* =========================
           COLAPSADO
        ========================= */

        if (
            group.collapsed
        ) {

            listElement
                .appendChild(
                groupBox
            );

            return;
        }

        /* =========================
           EXERCÍCIOS
        ========================= */

        group.exercises.forEach(
            (
                exercise,
                exerciseIndex
            ) => {

            const box =
                document.createElement(
                    "div"
                );

            box.classList.add(
                "box"
            );

            if (
                exercise.running
            ) {

                box.classList.add(
                    "running"
                );
            }

            if (
                exercise.paused
            ) {

                box.classList.add(
                    "paused"
                );
            }

            if (
                exercise.done
            ) {

                box.classList.add(
                    "done"
                );
            }

            /* INFO */

            const info =
                document.createElement(
                    "div"
                );

            info.classList.add(
                "info"
            );

            /* TÍTULO */

            const title =
                document.createElement(
                    "div"
                );

            title.classList.add(
                "title"
            );

            title.textContent =
                exercise.name;

            /* ESTRELAS */

            const repeatBadge =
                document.createElement(
                    "div"
                );

            repeatBadge.classList.add(
                "repeatBadge"
            );

            const stars =
                "⭐".repeat(
                    Math.min(
                        exercise.repeats,
                        20
                    )
                );

            repeatBadge.textContent =
                stars || "☆";

            repeatBadge.classList.toggle(
                "active",
                exercise.repeats > 0
            );

            title.appendChild(
                repeatBadge
            );

            /* TIMER */

            const timer =
                document.createElement(
                    "div"
                );

            timer.classList.add(
                "timer"
            );

            timer.textContent =
                formatTime(
                    exercise.remaining
                );

            info.appendChild(
                title
            );

            info.appendChild(
                timer
            );

            /* ACTIONS */

            const actions =
                document.createElement(
                    "div"
                );

            actions.classList.add(
                "actions"
            );

            /* PLAY */

            const playBtn =
                document.createElement(
                    "button"
                );

            playBtn.classList.add(
                "playBtn"
            );

            if (
                exercise.done
            ) {

                playBtn.textContent =
                    "↻";

            } else if (
                exercise.paused
            ) {

                playBtn.textContent =
                    "▶";

            } else if (
                exercise.running
            ) {

                playBtn.textContent =
                    "⏸";

            } else {

                playBtn.textContent =
                    "▶";
            }

            playBtn
                .addEventListener(
                "click",
                () => {

                if (
                    exercise.done
                ) {

                    repeatExercise(
                        groupIndex,
                        exerciseIndex
                    );

                } else if (
                    exercise.paused
                ) {

                    resumeTimer(
                        groupIndex,
                        exerciseIndex
                    );

                } else if (
                    exercise.running
                ) {

                    pauseTimer(
                        groupIndex,
                        exerciseIndex
                    );

                } else {

                    startTimer(
                        groupIndex,
                        exerciseIndex
                    );
                }
            });

            /* DELETE */

            const deleteBtn =
                document.createElement(
                    "button"
                );

            deleteBtn.classList.add(
                "deleteBtn"
            );

            deleteBtn.textContent =
                "✕";

            if (

                exercise.running ||

                exercise.paused

            ) {

                deleteBtn.disabled =
                    true;
            }

            deleteBtn
                .addEventListener(
                "click",
                () => {

                if (

                    exercise.running ||

                    exercise.paused

                ) return;

                deleteExercise(
                    groupIndex,
                    exerciseIndex
                );
            });

            actions.appendChild(
                playBtn
            );

            actions.appendChild(
                deleteBtn
            );

            box.appendChild(
                info
            );

            box.appendChild(
                actions
            );

            groupBox.appendChild(
                box
            );
        });

        listElement.appendChild(
            groupBox
        );
    });
}

/* =========================
   TOGGLE FORM
========================= */

toggleFormBtn
    .addEventListener(
    "click",
    () => {

    formVisible =
        !formVisible;

    updateFormVisibility();
});

/* =========================
   ADICIONAR
========================= */

addBtn.addEventListener(
    "click",
    () => {

    const group =
        groupName.value.trim();

    const name =
        exerciseName.value.trim();

    const seconds =
        parseInt(
            exerciseTime.value
        );

    if (

        !group ||

        !name ||

        !seconds ||

        seconds <= 0

    ) return;

    addExercise(
        group,
        name,
        seconds
    );

    groupName.value = "";

    exerciseName.value = "";

    exerciseTime.value = "";
});

/* =========================
   ENTER
========================= */

[
    groupName,
    exerciseName,
    exerciseTime
].forEach(input => {

    input.addEventListener(
        "keydown",
        event => {

        if (
            event.key ===
            "Enter"
        ) {

            addBtn.click();
        }
    });
});

/* =========================
   RESET
========================= */

resetBtn.addEventListener(
    "click",
    resetDay
);

/* =========================
   INIT
========================= */

loadExercises();

checkNewDay();

updateFormVisibility();

updateDOM();