const QUESTION_INDEX_PATH = "preguntas/index.json";
const MIN_SEED = 1;
const MAX_SEED = 9999;

let QUESTION_FILES = [];

const $ = (selector) => document.querySelector(selector);

const state = {
  allQuestions: [],
  selectedQuestions: [],
  currentIndex: 0,
  score: 0,
  seed: 0,
  selectedFileLabel: "",
  answers: []
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
const nextBtn = $("#nextBtn");
const exitBtn = $("#exitBtn");

const scoreText = $("#scoreText");
const resultDetail = $("#resultDetail");
const reviewList = $("#reviewList");
const restartBtn = $("#restartBtn");

async function init() {
  try {
    setConfigMessage("Cargando lista de bancos de preguntas...", "ok");

    await loadQuestionFileIndex();
    renderFileOptions();

    randomSeedBtn.addEventListener("click", generateRandomSeed);
    startBtn.addEventListener("click", startQuiz);
    submitAnswerBtn.addEventListener("click", submitAnswer);
    nextBtn.addEventListener("click", nextQuestion);
    restartBtn.addEventListener("click", restart);
    exitBtn.addEventListener("click", restart);

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
    if (!file.label || !file.path) {
      throw new Error(`El elemento ${index + 1} de ${QUESTION_INDEX_PATH} debe tener "label" y "path".`);
    }
  });

  QUESTION_FILES = files;
}

function renderFileOptions() {
  questionFileSelect.innerHTML = QUESTION_FILES
    .map((file, index) => `<option value="${index}">${escapeHtml(file.label)}</option>`)
    .join("");
}

function generateRandomSeed() {
  seedInput.value = Math.floor(Math.random() * MAX_SEED) + MIN_SEED;
}

async function startQuiz() {
  setConfigMessage("");

  try {
    const selected = QUESTION_FILES[Number(questionFileSelect.value)];
    state.allQuestions = await fetchQuestions(selected.path);
    validateQuestions(state.allQuestions);

    const count = Number(questionCountInput.value);
    if (!Number.isInteger(count) || count < 1) {
      throw new Error("El total de preguntas debe ser un número mayor o igual a 1.");
    }

    if (count > state.allQuestions.length) {
      throw new Error(`El archivo solo tiene ${state.allQuestions.length} preguntas.`);
    }

    const seed = Number(seedInput.value);
    if (!Number.isInteger(seed) || seed < MIN_SEED || seed > MAX_SEED) {
      throw new Error(`La seed debe ser un número entero entre ${MIN_SEED} y ${MAX_SEED}.`);
    }

    state.seed = seed;
    state.selectedFileLabel = selected.label;

    const shuffled = shuffleWithSeed([...state.allQuestions], state.seed);
    state.selectedQuestions = shuffled.slice(0, count);
    state.currentIndex = 0;
    state.score = 0;
    state.answers = [];

    showView("quiz");
    renderQuestionNav();
    updateSidebar();
    renderQuestion();
  } catch (error) {
    setConfigMessage(error.message);
  }
}

async function fetchQuestions(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el archivo: ${path}`);
  }
  return response.json();
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) {
    throw new Error("El JSON debe ser un arreglo de preguntas.");
  }

  if (questions.length === 0) {
    throw new Error("El archivo no contiene preguntas.");
  }

  questions.forEach((q, index) => {
    if (!q.pregunta || !q.tipo) {
      throw new Error(`La pregunta en posición ${index + 1} no tiene "pregunta" o "tipo".`);
    }

    if (q.tipo === "verdadero-falso" && typeof q.respuesta !== "boolean") {
      throw new Error(`La pregunta ${q.id ?? index + 1} debe tener respuesta true/false.`);
    }

    if (q.tipo === "alternativas") {
      if (!Array.isArray(q.alternativas) || !Array.isArray(q.correctas)) {
        throw new Error(`La pregunta ${q.id ?? index + 1} debe tener alternativas y correctas.`);
      }
    }

    if (q.tipo === "desarrollo" && !q.respuesta_esperada) {
      throw new Error(`La pregunta ${q.id ?? index + 1} debe tener respuesta_esperada.`);
    }
  });
}

// function renderQuestionNav() {
//   questionNav.innerHTML = state.selectedQuestions
//     .map((q) => `<li><span>${escapeHtml(shortLabel(q.tipo))}</span></li>`)
//     .join("");
// }
function renderQuestionNav() {
  questionNav.innerHTML = state.selectedQuestions
    .map((_, index) => `
      <li title="Pregunta ${index + 1}">
        ${index + 1}
      </li>
    `)
    .join("");
}


function updateSidebar() {
  sidebarSeed.textContent = state.seed;
  sidebarFile.textContent = state.selectedFileLabel;
  sidebarScore.textContent = `${state.score} / ${state.selectedQuestions.length}`;
  sidebarProgress.textContent = `${Math.min(state.currentIndex + 1, state.selectedQuestions.length)} / ${state.selectedQuestions.length}`;

  [...questionNav.children].forEach((item, index) => {
    const answer = state.answers[index];

    item.classList.toggle("current", index === state.currentIndex);
    item.classList.toggle("correct", Boolean(answer?.isCorrect));
    item.classList.toggle("incorrect", Boolean(answer && !answer.isCorrect));
  });
}

function shortLabel(tipo) {
  if (tipo === "verdadero-falso") return "V/F";
  if (tipo === "alternativas") return "Alternativas";
  if (tipo === "desarrollo") return "Desarrollo";
  return tipo;
}

function renderQuestion() {
  const q = state.selectedQuestions[state.currentIndex];

  progressText.textContent = `Pregunta ${state.currentIndex + 1} de ${state.selectedQuestions.length}`;
  unitText.textContent = q.unidad ? `Unidad ${q.unidad}` : "";
  questionText.textContent = q.pregunta;
  questionType.textContent = `Tipo: ${q.tipo}`;

  feedbackBox.className = "feedback hidden";
  feedbackBox.innerHTML = "";
  submitAnswerBtn.classList.remove("hidden");
  nextBtn.classList.add("hidden");

  answerForm.innerHTML = "";

  if (q.tipo === "verdadero-falso") {
    answerForm.innerHTML = `
      <label class="option">
        <input type="radio" name="answer" value="true" />
        Verdadero
      </label>
      <label class="option">
        <input type="radio" name="answer" value="false" />
        Falso
      </label>
    `;
  }

  if (q.tipo === "alternativas") {
    answerForm.innerHTML = q.alternativas
      .map((alt, index) => `
        <label class="option" data-option-index="${index}">
          <input type="checkbox" name="answer" value="${index}" />
          ${escapeHtml(alt)}
        </label>
      `)
      .join("");
  }

  if (q.tipo === "desarrollo") {
    answerForm.innerHTML = `
      <label>
        Tu respuesta
        <textarea id="developmentAnswer" placeholder="Escribe tu respuesta aquí..."></textarea>
      </label>
    `;
  }

  updateSidebar();
}

function submitAnswer() {
  const q = state.selectedQuestions[state.currentIndex];

  if (q.tipo === "verdadero-falso") {
    const checked = answerForm.querySelector("input[name='answer']:checked");
    if (!checked) return showTemporaryMessage("Selecciona una opción.");

    const userAnswer = checked.value === "true";
    const isCorrect = userAnswer === q.respuesta;

    saveAnswer(q, userAnswer ? "Verdadero" : "Falso", isCorrect);
    showFeedback(isCorrect, q.justificacion || `Respuesta correcta: ${q.respuesta ? "Verdadero" : "Falso"}`);
    lockInputs();
  }

  if (q.tipo === "alternativas") {
    const checked = [...answerForm.querySelectorAll("input[name='answer']:checked")];
    if (checked.length === 0) return showTemporaryMessage("Selecciona al menos una alternativa.");

    const userIndexes = checked.map(input => Number(input.value)).sort((a, b) => a - b);
    const correctIndexes = [...q.correctas].sort((a, b) => a - b);
    const isCorrect = arraysEqual(userIndexes, correctIndexes);

    paintAlternativeSelections(userIndexes, correctIndexes);

    const userAnswer = userIndexes.map(i => q.alternativas[i]).join(", ");
    const correctAnswer = correctIndexes.map(i => q.alternativas[i]).join(", ");

    saveAnswer(q, userAnswer, isCorrect);
    showFeedback(isCorrect, `Respuesta correcta: ${correctAnswer}`);
    lockInputs();
  }

  if (q.tipo === "desarrollo") {
    const text = $("#developmentAnswer").value.trim();
    if (!text) return showTemporaryMessage("Escribe una respuesta antes de continuar.");

    feedbackBox.className = "feedback";
    feedbackBox.innerHTML = `
      <strong>Respuesta esperada:</strong>
      <p>${escapeHtml(q.respuesta_esperada)}</p>
      <div class="actions">
        <button type="button" onclick="gradeDevelopment(true)">Marcar correcta</button>
        <button type="button" class="secondary" onclick="gradeDevelopment(false)">Marcar incorrecta</button>
      </div>
    `;
    feedbackBox.classList.remove("hidden");
    submitAnswerBtn.classList.add("hidden");

    state.pendingDevelopmentAnswer = { question: q, text };
  }

  updateSidebar();
}

function paintAlternativeSelections(userIndexes, correctIndexes) {
  const correctSet = new Set(correctIndexes);
  const userSet = new Set(userIndexes);

  [...answerForm.querySelectorAll(".option")].forEach(option => {
    const index = Number(option.dataset.optionIndex);

    if (userSet.has(index) && correctSet.has(index)) {
      option.classList.add("correct-selection");
    }

    if (userSet.has(index) && !correctSet.has(index)) {
      option.classList.add("incorrect-selection");
    }

    if (!userSet.has(index) && correctSet.has(index)) {
      option.classList.add("missed-selection");
    }
  });
}

window.gradeDevelopment = function(isCorrect) {
  const pending = state.pendingDevelopmentAnswer;
  if (!pending) return;

  saveAnswer(pending.question, pending.text, isCorrect);

  feedbackBox.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
  feedbackBox.innerHTML = `
    <strong>Respuesta esperada:</strong>
    <p>${escapeHtml(pending.question.respuesta_esperada)}</p>
    <p><strong>Autocorrección:</strong> ${isCorrect ? "correcta" : "incorrecta"}.</p>
  `;

  nextBtn.classList.remove("hidden");
  state.pendingDevelopmentAnswer = null;
  lockInputs();
  updateSidebar();
};

function saveAnswer(question, userAnswer, isCorrect) {
  if (state.answers[state.currentIndex]) return;

  if (isCorrect) state.score++;

  state.answers[state.currentIndex] = {
    id: question.id,
    pregunta: question.pregunta,
    tipo: question.tipo,
    userAnswer,
    isCorrect,
    expected: getExpectedAnswer(question)
  };
}

function getExpectedAnswer(q) {
  if (q.tipo === "verdadero-falso") return q.respuesta ? "Verdadero" : "Falso";
  if (q.tipo === "alternativas") return q.correctas.map(i => q.alternativas[i]).join(", ");
  if (q.tipo === "desarrollo") return q.respuesta_esperada;
  return "";
}

function showFeedback(isCorrect, detail) {
  feedbackBox.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
  feedbackBox.innerHTML = `
    <strong>${isCorrect ? "Correcto" : "Incorrecto"}</strong>
    <p>${escapeHtml(detail)}</p>
  `;
  feedbackBox.classList.remove("hidden");
  submitAnswerBtn.classList.add("hidden");
  nextBtn.classList.remove("hidden");
}

function showTemporaryMessage(message) {
  feedbackBox.className = "feedback incorrect";
  feedbackBox.textContent = message;
  feedbackBox.classList.remove("hidden");
}

function lockInputs() {
  [...answerForm.querySelectorAll("input, textarea")].forEach(input => {
    input.disabled = true;
  });
}

function nextQuestion() {
  state.currentIndex++;

  if (state.currentIndex >= state.selectedQuestions.length) {
    showResults();
    return;
  }

  renderQuestion();
}

function showResults() {
  showView("result");

  const total = state.selectedQuestions.length;
  const percent = Math.round((state.score / total) * 100);

  scoreText.textContent = `${state.score} / ${total} (${percent}%)`;
  resultDetail.textContent = `Archivo: ${state.selectedFileLabel} | Seed usada: ${state.seed}`;

  reviewList.innerHTML = state.answers.map((item, index) => `
    <article class="review-item ${item.isCorrect ? "correct" : "incorrect"}">
      <strong>${index + 1}. ${escapeHtml(item.pregunta)}</strong>
      <p><strong>Tu respuesta:</strong> ${escapeHtml(item.userAnswer)}</p>
      <p><strong>Esperada:</strong> ${escapeHtml(item.expected)}</p>
      <p><strong>Resultado:</strong> ${item.isCorrect ? "Correcta" : "Incorrecta"}</p>
    </article>
  `).join("");
}

function restart() {
  state.allQuestions = [];
  state.selectedQuestions = [];
  state.currentIndex = 0;
  state.score = 0;
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
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
