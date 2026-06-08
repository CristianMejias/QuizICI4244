const QUESTION_INDEX_PATH = "preguntas/index.json";
const MIN_SEED = 1;
const MAX_SEED = 9999;
const VALID_TYPES = new Set(["vf", "alt", "des"]);

let QUESTION_FILES = [];

const $ = (selector) => document.querySelector(selector);

const state = {
  allQuestions: [],
  selectedQuestions: [],
  currentIndex: 0,
  seed: 0,
  selectedFileLabel: "",
  answers: [],
  pendingDevelopmentAnswer: null
};

const configView = $("#configView");
const quizView = $("#quizView");
const resultView = $("#resultView");

const questionFileSelect = $("#questionFileSelect");
const questionCountInput = $("#questionCountInput");
const seedInput = $("#seedInput");
const randomSeedBtn = $("#randomSeedBtn");
const startBtn = $("#startBtn");
const configMessage = $("#configMessage");

const sidebarSeed = $("#sidebarSeed");
const sidebarFile = $("#sidebarFile");
const sidebarScore = $("#sidebarScore");
const sidebarProgress = $("#sidebarProgress");
const questionNav = $("#questionNav");

const progressText = $("#progressText");
const unitText = $("#unitText");
const questionText = $("#questionText");
const questionType = $("#questionType");
const answerForm = $("#answerForm");
const feedbackBox = $("#feedbackBox");
const submitAnswerBtn = $("#submitAnswerBtn");
const skipQuestionBtn = $("#skipQuestionBtn");
const nextBtn = $("#nextBtn");
const exitBtn = $("#exitBtn");

const scoreText = $("#scoreText");
const resultDetail = $("#resultDetail");
const resultStats = $("#resultStats");
const reviewList = $("#reviewList");
const restartBtn = $("#restartBtn");
const exportPdfBtn = $("#exportPdfBtn");

async function init() {
  try {
    setConfigMessage("Cargando lista de bancos de preguntas...", "ok");

    await loadQuestionFileIndex();
    renderFileOptions();

    randomSeedBtn.addEventListener("click", generateRandomSeed);
    startBtn.addEventListener("click", startQuiz);
    submitAnswerBtn.addEventListener("click", submitAnswer);
    skipQuestionBtn.addEventListener("click", skipQuestion);
    nextBtn.addEventListener("click", goToNextPendingOrResults);
    restartBtn.addEventListener("click", restart);
    exitBtn.addEventListener("click", restart);
    exportPdfBtn.addEventListener("click", exportReviewPdf);

    setConfigMessage(`Se cargaron ${QUESTION_FILES.length} banco(s) de preguntas.`, "ok");
  } catch (error) {
    setConfigMessage(error.message);
    startBtn.disabled = true;
  }
}

async function loadQuestionFileIndex() {
  const response = await fetch(QUESTION_INDEX_PATH);

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${QUESTION_INDEX_PATH}. Revisa que exista y que estés usando Live Server o python -m http.server.`);
  }

  const files = await response.json();

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error(`${QUESTION_INDEX_PATH} debe contener un arreglo con al menos un archivo.`);
  }

  files.forEach((file, index) => {
    if (!isNonEmptyString(file.label) || !isNonEmptyString(file.path)) {
      throw new Error(`El elemento ${index + 1} de ${QUESTION_INDEX_PATH} debe tener "label" y "path" como textos no vacíos.`);
    }
  });

  QUESTION_FILES = files;
}

function renderFileOptions() {
  questionFileSelect.innerHTML = QUESTION_FILES
    .map((file, index) => `<option value="${index}" ${index === 0 ? "selected" : ""}>${escapeHtml(file.label)}</option>`)
    .join("");
}

function generateRandomSeed() {
  seedInput.value = Math.floor(Math.random() * MAX_SEED) + MIN_SEED;
}

async function startQuiz() {
  setConfigMessage("");

  try {
    const selectedFiles = getSelectedQuestionFiles();

    if (selectedFiles.length === 0) {
      throw new Error("Selecciona al menos un archivo de preguntas.");
    }

    const questionGroups = await Promise.all(
      selectedFiles.map(async (file) => {
        const questions = await fetchQuestions(file.path);
        validateQuestions(questions, file.label);
        return questions.map((question) => ({ ...question, fuente: file.label }));
      })
    );

    state.allQuestions = questionGroups.flat();

    const count = Number(questionCountInput.value);
    if (!Number.isInteger(count) || count < 1) {
      throw new Error("El total de preguntas debe ser un número mayor o igual a 1.");
    }

    if (count > state.allQuestions.length) {
      throw new Error(`Los archivos seleccionados solo tienen ${state.allQuestions.length} preguntas en total.`);
    }

    const seed = Number(seedInput.value);
    if (!Number.isInteger(seed) || seed < MIN_SEED || seed > MAX_SEED) {
      throw new Error(`La seed debe ser un número entero entre ${MIN_SEED} y ${MAX_SEED}.`);
    }

    state.seed = seed;
    state.selectedFileLabel = selectedFiles.map((file) => file.label).join(", ");

    const shuffled = shuffleWithSeed([...state.allQuestions], state.seed);
    state.selectedQuestions = shuffled.slice(0, count);
    state.currentIndex = 0;
    state.answers = Array(count).fill(null);
    state.pendingDevelopmentAnswer = null;

    showView("quiz");
    renderQuestionNav();
    updateSidebar();
    renderQuestion();
  } catch (error) {
    setConfigMessage(error.message);
  }
}

function getSelectedQuestionFiles() {
  return [...questionFileSelect.selectedOptions]
    .map((option) => QUESTION_FILES[Number(option.value)])
    .filter(Boolean);
}

async function fetchQuestions(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el archivo: ${path}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`El archivo ${path} no contiene JSON válido.`);
  }
}

function validateQuestions(questions, fileLabel = "archivo seleccionado") {
  if (!Array.isArray(questions)) {
    throw new Error(`El JSON de ${fileLabel} debe ser un arreglo de preguntas.`);
  }

  if (questions.length === 0) {
    throw new Error(`El archivo ${fileLabel} no contiene preguntas.`);
  }

  const seenKeys = new Set();

  questions.forEach((q, index) => {
    const questionName = getQuestionName(q, index);

    if (!isPlainObject(q)) {
      throw new Error(`La pregunta ${index + 1} de ${fileLabel} debe ser un objeto.`);
    }

    if (!isNonEmptyString(q.pregunta)) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} debe tener "pregunta" como texto no vacío.`);
    }

    if (!VALID_TYPES.has(q.tipo)) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} usa tipo inválido "${q.tipo}". El formato nuevo solo acepta "vf", "alt" o "des".`);
    }

    if (!Number.isInteger(q.unidad) || q.unidad < 1) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} debe tener "unidad" como número entero positivo.`);
    }

    if (!Number.isInteger(q.numero) || q.numero < 1) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} debe tener "numero" como número entero positivo.`);
    }

    if (q.ramo !== undefined && !isNonEmptyString(q.ramo)) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} tiene "ramo" inválido.`);
    }

    if (q.justificacion !== undefined && typeof q.justificacion !== "string") {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} debe tener "justificacion" como texto si se incluye.`);
    }

    const uniqueKey = `${q.ramo ?? "sin-ramo"}|${q.unidad}|${q.tipo}|${q.numero}`;
    if (seenKeys.has(uniqueKey)) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} está duplicada según ramo/unidad/tipo/numero.`);
    }
    seenKeys.add(uniqueKey);

    validateQuestionByType(q, questionName, fileLabel);
  });
}

function validateQuestionByType(q, questionName, fileLabel) {
  if (q.tipo === "vf") {
    if (typeof q.respuesta !== "boolean") {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} debe tener "respuesta" booleana para tipo "vf".`);
    }
    return;
  }

  if (q.tipo === "alt") {
    if (!Array.isArray(q.opciones) || q.opciones.length < 2) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} debe tener "opciones" con al menos dos alternativas.`);
    }

    q.opciones.forEach((option, optionIndex) => {
      if (!isNonEmptyString(option)) {
        throw new Error(`La opción ${optionIndex + 1} de la pregunta ${questionName} de ${fileLabel} debe ser texto no vacío.`);
      }
    });

    if (!Array.isArray(q.respuesta)) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} debe tener "respuesta" como arreglo de índices para tipo "alt".`);
    }

    const responseSet = new Set(q.respuesta);
    if (responseSet.size !== q.respuesta.length) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} tiene índices repetidos en "respuesta".`);
    }

    q.respuesta.forEach((answerIndex) => {
      if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= q.opciones.length) {
        throw new Error(`La pregunta ${questionName} de ${fileLabel} tiene un índice de respuesta fuera de rango: ${answerIndex}.`);
      }
    });

    if (q.ningunaCorrecta !== undefined && typeof q.ningunaCorrecta !== "boolean") {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} debe tener "ningunaCorrecta" como booleano si se incluye.`);
    }

    if (q.ningunaCorrecta === true && q.respuesta.length !== 0) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} marca "ningunaCorrecta", pero también incluye índices en "respuesta".`);
    }
    return;
  }

  if (q.tipo === "des") {
    if (!isNonEmptyString(q.respuesta)) {
      throw new Error(`La pregunta ${questionName} de ${fileLabel} debe tener "respuesta" como texto no vacío para tipo "des".`);
    }
  }
}

function renderQuestionNav() {
  questionNav.innerHTML = state.selectedQuestions
    .map((_, index) => `
      <li>
        <button type="button" class="question-dot" data-index="${index}" title="Ir a pregunta ${index + 1}" aria-label="Ir a pregunta ${index + 1}">
          ${index + 1}
        </button>
      </li>
    `)
    .join("");

  [...questionNav.querySelectorAll(".question-dot")].forEach((button) => {
    button.addEventListener("click", () => goToQuestion(Number(button.dataset.index)));
  });
}

function updateSidebar() {
  const stats = getAnswerStats();

  sidebarSeed.textContent = state.seed;
  sidebarFile.textContent = state.selectedFileLabel;
  sidebarScore.textContent = `${stats.correct} / ${state.selectedQuestions.length}`;
  sidebarProgress.textContent = `${stats.answered} respondidas, ${stats.unanswered} sin contestar`;

  [...questionNav.querySelectorAll(".question-dot")].forEach((item, index) => {
    const answer = state.answers[index];
    const status = getAnswerStatus(answer);

    item.classList.toggle("current", index === state.currentIndex);
    item.classList.toggle("correct", status === "correct");
    item.classList.toggle("incorrect", status === "incorrect");
    item.classList.toggle("skipped", status === "unanswered" && Boolean(answer?.skipped));
  });
}

function getAnswerStats() {
  const correct = state.answers.filter((answer) => answer?.status === "correct").length;
  const incorrect = state.answers.filter((answer) => answer?.status === "incorrect").length;
  const answered = correct + incorrect;
  const unanswered = state.selectedQuestions.length - answered;

  return { correct, incorrect, answered, unanswered };
}

function shortLabel(tipo) {
  if (tipo === "vf") return "V/F";
  if (tipo === "alt") return "Alternativas";
  if (tipo === "des") return "Desarrollo";
  return tipo;
}

function renderQuestion() {
  const q = state.selectedQuestions[state.currentIndex];
  const currentAnswer = state.answers[state.currentIndex];
  const isAnswered = currentAnswer?.status === "correct" || currentAnswer?.status === "incorrect";

  progressText.textContent = `Pregunta ${state.currentIndex + 1} de ${state.selectedQuestions.length}`;
  unitText.textContent = getUnitLabel(q);
  questionText.textContent = q.pregunta;
  questionType.textContent = `Tipo: ${shortLabel(q.tipo)} | N° ${q.numero}${q.fuente ? ` | Archivo: ${q.fuente}` : ""}`;

  feedbackBox.className = "feedback hidden";
  feedbackBox.innerHTML = "";
  submitAnswerBtn.classList.toggle("hidden", isAnswered);
  skipQuestionBtn.classList.toggle("hidden", isAnswered);
  nextBtn.classList.toggle("hidden", !isAnswered);

  answerForm.innerHTML = "";

  if (q.tipo === "vf") {
    renderTrueFalseQuestion(currentAnswer);
  }

  if (q.tipo === "alt") {
    renderAlternativeQuestion(q);
  }

  if (q.tipo === "des") {
    answerForm.innerHTML = `
      <label>
        Tu respuesta
        <textarea id="developmentAnswer" placeholder="Escribe tu respuesta aquí..."></textarea>
      </label>
    `;
  }

  if (isAnswered) {
    restoreAnsweredQuestion(currentAnswer, q);
  }

  updateSidebar();
}

function renderTrueFalseQuestion() {
  answerForm.innerHTML = `
    <label class="option">
      <input type="radio" name="answer" value="true" />
      Verdadero
    </label>
    <label class="option">
      <input type="radio" name="answer" value="false" />
      Falso
    </label>
    <label id="vfJustificationGroup" class="vf-justification disabled">
      Justificación si marcas Falso
      <textarea id="vfJustification" placeholder="Explica por qué la afirmación es falsa..." disabled></textarea>
    </label>
  `;

  const radios = [...answerForm.querySelectorAll("input[name='answer']")];
  const justification = $("#vfJustification");
  const justificationGroup = $("#vfJustificationGroup");

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      const isFalseSelected = radio.value === "false" && radio.checked;
      justification.disabled = !isFalseSelected;
      justificationGroup.classList.toggle("disabled", !isFalseSelected);

      if (!isFalseSelected) {
        justification.value = "";
      }
    });
  });
}

function renderAlternativeQuestion(q) {
  const noCorrectAnswer = q.respuesta.length === 0;
  const noneOption = noCorrectAnswer
    ? `
      <label class="option" data-option-none="true">
        <input type="checkbox" name="answer" value="__none__" />
        Ninguna alternativa es correcta
      </label>
    `
    : "";

  answerForm.innerHTML = q.opciones
    .map((alt, index) => `
      <label class="option" data-option-index="${index}">
        <input type="checkbox" name="answer" value="${index}" />
        ${escapeHtml(alt)}
      </label>
    `)
    .join("") + noneOption;

  const noneCheckbox = answerForm.querySelector("input[value='__none__']");
  const alternativeCheckboxes = [...answerForm.querySelectorAll("input[name='answer']")]
    .filter((input) => input.value !== "__none__");

  if (noneCheckbox) {
    noneCheckbox.addEventListener("change", () => {
      if (noneCheckbox.checked) {
        alternativeCheckboxes.forEach((input) => { input.checked = false; });
      }
    });

    alternativeCheckboxes.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) noneCheckbox.checked = false;
      });
    });
  }
}

function restoreAnsweredQuestion(answer, question) {
  if (question.tipo === "vf") {
    const radioValue = answer.rawAnswer === true ? "true" : "false";
    const radio = answerForm.querySelector(`input[name='answer'][value='${radioValue}']`);
    if (radio) radio.checked = true;

    const justification = $("#vfJustification");
    const justificationGroup = $("#vfJustificationGroup");
    if (answer.rawAnswer === false) {
      justification.value = answer.userJustification || "";
      justification.disabled = false;
      justificationGroup.classList.remove("disabled");
    }
  }

  if (question.tipo === "alt") {
    const userIndexes = answer.rawAnswer ?? [];
    const correctIndexes = getCorrectIndexes(question);

    userIndexes.forEach((index) => {
      const checkbox = answerForm.querySelector(`input[name='answer'][value='${index}']`);
      if (checkbox) checkbox.checked = true;
    });

    const noneCheckbox = answerForm.querySelector("input[name='answer'][value='__none__']");
    if (noneCheckbox && answer.selectedNone) noneCheckbox.checked = true;

    paintAlternativeSelections(userIndexes, correctIndexes, answer.selectedNone);
  }

  if (question.tipo === "des") {
    const textarea = $("#developmentAnswer");
    if (textarea) textarea.value = answer.userAnswer;
  }

  showFeedback(answer.status === "correct", answer.feedbackDetail, false);
  lockInputs();
}

function submitAnswer() {
  const q = state.selectedQuestions[state.currentIndex];

  if (isCurrentQuestionAnswered()) {
    return showTemporaryMessage("Esta pregunta ya fue respondida.");
  }

  if (q.tipo === "vf") {
    submitTrueFalseAnswer(q);
  }

  if (q.tipo === "alt") {
    submitAlternativeAnswer(q);
  }

  if (q.tipo === "des") {
    submitDevelopmentAnswer(q);
  }

  updateSidebar();
}

function submitTrueFalseAnswer(q) {
  const checked = answerForm.querySelector("input[name='answer']:checked");
  if (!checked) return showTemporaryMessage("Selecciona una opción.");

  const userAnswer = checked.value === "true";
  const userJustification = userAnswer ? "" : $("#vfJustification").value.trim();

  if (!userAnswer && !userJustification) {
    return showTemporaryMessage("Escribe una justificación al marcar Falso.");
  }

  const isCorrect = userAnswer === q.respuesta;
  const visibleAnswer = userAnswer
    ? "Verdadero"
    : `Falso. Justificación: ${userJustification}`;
  const feedbackDetail = q.justificacion || `Respuesta correcta: ${q.respuesta ? "Verdadero" : "Falso"}`;

  saveAnswer(q, visibleAnswer, isCorrect, {
    rawAnswer: userAnswer,
    userJustification,
    feedbackDetail
  });
  showFeedback(isCorrect, feedbackDetail);
  lockInputs();
}

function submitAlternativeAnswer(q) {
  const checked = [...answerForm.querySelectorAll("input[name='answer']:checked")];
  const selectedNone = checked.some((input) => input.value === "__none__");
  const userIndexes = checked
    .filter((input) => input.value !== "__none__")
    .map((input) => Number(input.value))
    .sort((a, b) => a - b);
  const correctIndexes = getCorrectIndexes(q);

  if (selectedNone && userIndexes.length > 0) {
    return showTemporaryMessage("No combines alternativas con 'Ninguna alternativa es correcta'.");
  }

  if (checked.length === 0) {
    return showTemporaryMessage("Selecciona al menos una alternativa o usa Saltar pregunta.");
  }

  const isCorrect = correctIndexes.length === 0
    ? selectedNone && userIndexes.length === 0
    : arraysEqual(userIndexes, correctIndexes);

  paintAlternativeSelections(userIndexes, correctIndexes, selectedNone);

  const userAnswer = selectedNone
    ? "Ninguna alternativa es correcta"
    : userIndexes.map((i) => q.opciones[i]).join(", ");
  const correctAnswer = getExpectedAnswer(q);
  const feedbackDetail = q.justificacion
    ? `Respuesta correcta: ${correctAnswer}. ${q.justificacion}`
    : `Respuesta correcta: ${correctAnswer}`;

  saveAnswer(q, userAnswer, isCorrect, {
    rawAnswer: userIndexes,
    selectedNone,
    feedbackDetail
  });
  showFeedback(isCorrect, feedbackDetail);
  lockInputs();
}

function submitDevelopmentAnswer(q) {
  const text = $("#developmentAnswer").value.trim();
  if (!text) return showTemporaryMessage("Escribe una respuesta antes de continuar o usa Saltar pregunta.");

  feedbackBox.className = "feedback";
  feedbackBox.innerHTML = `
    <strong>Respuesta esperada:</strong>
    <p>${escapeHtml(q.respuesta)}</p>
    <div class="actions">
      <button type="button" onclick="gradeDevelopment(true)">Marcar correcta</button>
      <button type="button" class="secondary" onclick="gradeDevelopment(false)">Marcar incorrecta</button>
    </div>
  `;
  feedbackBox.classList.remove("hidden");
  submitAnswerBtn.classList.add("hidden");
  skipQuestionBtn.classList.add("hidden");

  state.pendingDevelopmentAnswer = { question: q, text };
}

function isCurrentQuestionAnswered() {
  const answer = state.answers[state.currentIndex];
  return answer?.status === "correct" || answer?.status === "incorrect";
}

function paintAlternativeSelections(userIndexes, correctIndexes, selectedNone = false) {
  const correctSet = new Set(correctIndexes);
  const userSet = new Set(userIndexes);

  [...answerForm.querySelectorAll(".option[data-option-index]")].forEach((option) => {
    const index = Number(option.dataset.optionIndex);

    option.classList.toggle("correct-selection", userSet.has(index) && correctSet.has(index));
    option.classList.toggle("incorrect-selection", userSet.has(index) && !correctSet.has(index));
    option.classList.toggle("missed-selection", !userSet.has(index) && correctSet.has(index));
  });

  const noneOption = answerForm.querySelector(".option[data-option-none='true']");
  if (noneOption) {
    noneOption.classList.toggle("correct-selection", selectedNone && correctIndexes.length === 0);
    noneOption.classList.toggle("missed-selection", !selectedNone && correctIndexes.length === 0);
  }
}

window.gradeDevelopment = function (isCorrect) {
  const pending = state.pendingDevelopmentAnswer;
  if (!pending) return;

  const feedbackDetail = pending.question.respuesta;
  saveAnswer(pending.question, pending.text, isCorrect, {
    rawAnswer: pending.text,
    feedbackDetail
  });

  feedbackBox.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
  feedbackBox.innerHTML = `
    <strong>Respuesta esperada:</strong>
    <p>${escapeHtml(pending.question.respuesta)}</p>
    <p><strong>Autocorrección:</strong> ${isCorrect ? "correcta" : "incorrecta"}.</p>
  `;

  nextBtn.classList.remove("hidden");
  state.pendingDevelopmentAnswer = null;
  lockInputs();
  updateSidebar();
};

function saveAnswer(question, userAnswer, isCorrect, extra = {}) {
  state.answers[state.currentIndex] = {
    id: getQuestionId(question),
    pregunta: question.pregunta,
    tipo: question.tipo,
    numero: question.numero,
    unidad: question.unidad,
    ramo: question.ramo,
    fuente: question.fuente,
    userAnswer,
    isCorrect,
    status: isCorrect ? "correct" : "incorrect",
    expected: getExpectedAnswer(question),
    ...extra
  };
}

function getExpectedAnswer(q) {
  if (q.tipo === "vf") return q.respuesta ? "Verdadero" : "Falso";
  if (q.tipo === "alt") {
    const correctIndexes = getCorrectIndexes(q);
    if (correctIndexes.length === 0) return "Ninguna alternativa es correcta";
    return correctIndexes.map((i) => q.opciones[i]).join(", ");
  }
  if (q.tipo === "des") return q.respuesta;
  return "";
}

function getCorrectIndexes(q) {
  return [...q.respuesta].sort((a, b) => a - b);
}

function showFeedback(isCorrect, detail, toggleButtons = true) {
  feedbackBox.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
  feedbackBox.innerHTML = `
    <strong>${isCorrect ? "Correcto" : "Incorrecto"}</strong>
    <p>${escapeHtml(detail)}</p>
  `;
  feedbackBox.classList.remove("hidden");

  if (toggleButtons) {
    submitAnswerBtn.classList.add("hidden");
    skipQuestionBtn.classList.add("hidden");
    nextBtn.classList.remove("hidden");
  }
}

function showTemporaryMessage(message) {
  feedbackBox.className = "feedback incorrect";
  feedbackBox.textContent = message;
  feedbackBox.classList.remove("hidden");
}

function lockInputs() {
  [...answerForm.querySelectorAll("input, textarea")].forEach((input) => {
    input.disabled = true;
  });
}

function skipQuestion() {
  if (isCurrentQuestionAnswered()) {
    return showTemporaryMessage("Esta pregunta ya fue respondida; no se puede cambiar a sin contestar.");
  }

  state.answers[state.currentIndex] = {
    status: "unanswered",
    skipped: true
  };

  goToNextPendingOrResults();
}

function goToQuestion(index) {
  if (index < 0 || index >= state.selectedQuestions.length) return;
  state.pendingDevelopmentAnswer = null;
  state.currentIndex = index;
  renderQuestion();
}

function goToNextPendingOrResults() {
  const nextIndex = findNextUntouchedIndex(state.currentIndex + 1);

  if (nextIndex !== -1) {
    goToQuestion(nextIndex);
    return;
  }

  const previousIndex = findNextUntouchedIndex(0);

  if (previousIndex !== -1) {
    goToQuestion(previousIndex);
    return;
  }

  showResults();
}

function findNextUntouchedIndex(startIndex) {
  for (let i = startIndex; i < state.selectedQuestions.length; i++) {
    if (!state.answers[i]) return i;
  }

  return -1;
}

function getAnswerStatus(answer) {
  if (answer?.status === "correct") return "correct";
  if (answer?.status === "incorrect") return "incorrect";
  return "unanswered";
}

function showResults() {
  showView("result");

  const stats = getAnswerStats();
  const total = state.selectedQuestions.length;
  const percent = Math.round((stats.correct / total) * 100);

  scoreText.textContent = `${stats.correct} / ${total} (${percent}%)`;
  resultDetail.textContent = `Archivo(s): ${state.selectedFileLabel} | Seed usada: ${state.seed}`;
  resultStats.textContent = `Buenas: ${stats.correct} | Malas: ${stats.incorrect} | Sin contestar: ${stats.unanswered}`;

  renderReviewList();
}

function renderReviewList() {
  const items = getReviewItems(["correct", "incorrect", "unanswered"]);

  reviewList.innerHTML = items.map((item) => renderReviewItem(item)).join("");
}

function getReviewItems(statuses) {
  return state.selectedQuestions
    .map((question, index) => {
      const answer = state.answers[index];
      const status = getAnswerStatus(answer);

      return {
        index,
        question,
        answer,
        status
      };
    })
    .filter((item) => statuses.includes(item.status));
}

function renderReviewItem(item) {
  const { question, answer, status, index } = item;
  const statusLabel = getStatusLabel(status);
  const userAnswer = status === "unanswered" ? "Sin contestar" : answer.userAnswer;
  const expected = getExpectedAnswer(question);
  const extraJustification = answer?.userJustification
    ? `<p><strong>Justificación del usuario:</strong> ${escapeHtml(answer.userJustification)}</p>`
    : "";
  const explanation = question.justificacion
    ? `<p><strong>Justificación oficial:</strong> ${escapeHtml(question.justificacion)}</p>`
    : "";

  return `
    <article class="review-item ${status}">
      <strong>${index + 1}. ${escapeHtml(question.pregunta)}</strong>
      <p><strong>Tipo:</strong> ${escapeHtml(shortLabel(question.tipo))} | <strong>Unidad:</strong> ${escapeHtml(question.unidad)} | <strong>N°:</strong> ${escapeHtml(question.numero)}${question.fuente ? ` | <strong>Archivo:</strong> ${escapeHtml(question.fuente)}` : ""}</p>
      <p><strong>Tu respuesta:</strong> ${escapeHtml(userAnswer)}</p>
      ${extraJustification}
      <p><strong>Esperada:</strong> ${escapeHtml(expected)}</p>
      ${explanation}
      <p><strong>Resultado:</strong> ${statusLabel}</p>
    </article>
  `;
}

function getStatusLabel(status) {
  if (status === "correct") return "Correcta";
  if (status === "incorrect") return "Incorrecta";
  return "Sin contestar";
}

function exportReviewPdf() {
  const selectedStatuses = getSelectedPdfStatuses();

  if (selectedStatuses.length === 0) {
    return alert("Selecciona al menos una categoría para guardar en PDF.");
  }

  const items = getReviewItems(selectedStatuses);

  if (items.length === 0) {
    return alert("No hay preguntas en las categorías seleccionadas.");
  }

  const stats = getAnswerStats();
  const statusNames = selectedStatuses.map(getStatusLabel).join(", ");
  const html = buildPrintableHtml(items, stats, statusNames);
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    return alert("El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para generar el PDF.");
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function getSelectedPdfStatuses() {
  return [...document.querySelectorAll("input[name='pdfFilter']:checked")].map((input) => input.value);
}

function buildPrintableHtml(items, stats, statusNames) {
  const reviewHtml = items.map((item) => renderReviewItem(item)).join("");
  const title = "Resumen de cuestionario";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #172033; padding: 28px; line-height: 1.45; }
        h1 { margin-bottom: 6px; }
        .muted { color: #5f6b7a; }
        .review { display: grid; gap: 12px; margin-top: 20px; }
        .review-item { border: 1px solid #dfe4ee; border-radius: 10px; padding: 14px; break-inside: avoid; }
        .review-item.correct { border-left: 8px solid #22a06b; }
        .review-item.incorrect { border-left: 8px solid #d93025; }
        .review-item.unanswered { border-left: 8px solid #8a94a6; }
        @media print { button { display: none; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="muted">Archivo(s): ${escapeHtml(state.selectedFileLabel)} | Seed: ${escapeHtml(state.seed)}</p>
      <p><strong>Filtro:</strong> ${escapeHtml(statusNames)}</p>
      <p><strong>Buenas:</strong> ${stats.correct} | <strong>Malas:</strong> ${stats.incorrect} | <strong>Sin contestar:</strong> ${stats.unanswered}</p>
      <section class="review">${reviewHtml}</section>
    </body>
    </html>
  `;
}

function restart() {
  state.allQuestions = [];
  state.selectedQuestions = [];
  state.currentIndex = 0;
  state.seed = 0;
  state.selectedFileLabel = "";
  state.answers = [];
  state.pendingDevelopmentAnswer = null;
  setConfigMessage("");
  showView("config");
}

function showView(view) {
  configView.classList.toggle("hidden", view !== "config");
  quizView.classList.toggle("hidden", view !== "quiz");
  resultView.classList.toggle("hidden", view !== "result");
}

function setConfigMessage(message, type = "error") {
  configMessage.textContent = message;
  configMessage.classList.toggle("ok", type === "ok");
}

function shuffleWithSeed(array, seed) {
  const random = mulberry32(seed);

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

// Generador pseudoaleatorio determinista usando seed numérica.
function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function getQuestionName(q, fallbackIndex) {
  if (q && Number.isInteger(q.numero)) return `número ${q.numero}`;
  return fallbackIndex + 1;
}

function getQuestionId(q) {
  return [q.ramo, q.unidad, q.tipo, q.numero].filter((value) => value !== undefined && value !== null).join("-");
}

function getUnitLabel(q) {
  const ramo = q.ramo ? `${capitalize(q.ramo)} · ` : "";
  return `${ramo}Unidad ${q.unidad}`;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function capitalize(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
