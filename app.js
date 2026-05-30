const STORAGE_KEY = "life-rhythm-journal-v1";
const FIREBASE_CONFIG_KEY = "gods-note-firebase-config-v1";
const FIREBASE_SDK_VERSION = "10.12.5";

const DEFAULT_ACTIVITIES = [
  { id: "stretch", label: "ストレッチ" },
  { id: "spinBike", label: "スピンバイク" },
  { id: "walking", label: "散歩" },
  { id: "shadowBoxing", label: "シャドーボクシング" },
  { id: "medicineBallSlam", label: "メディシンボールスラム" },
  { id: "mittWork", label: "ミット打ち" },
  { id: "sparring", label: "マススパーリング" },
  { id: "running", label: "ランニング" },
  { id: "strength", label: "筋トレ" },
  { id: "other", label: "その他" },
];

const DEFAULT_SUPPLEMENTS = [
  "すべて",
  "マルチビタミン",
  "フィッシュオイル",
  "シトルリンアルギニン",
  "マグネシウム",
];

const METS = {
  stretch: { light: 2.0, moderate: 2.5, hard: 3.0 },
  spinBike: { light: 4.0, moderate: 6.8, hard: 10.0 },
  walking: { light: 2.8, moderate: 3.5, hard: 4.8 },
  shadowBoxing: { light: 4.5, moderate: 6.0, hard: 8.0 },
  medicineBallSlam: { light: 5.0, moderate: 7.0, hard: 9.0 },
  mittWork: { light: 5.5, moderate: 7.8, hard: 10.0 },
  sparring: { light: 6.0, moderate: 8.5, hard: 11.0 },
  running: { light: 6.0, moderate: 8.3, hard: 11.0 },
  strength: { light: 3.0, moderate: 4.5, hard: 6.0 },
  other: { light: 2.5, moderate: 4.0, hard: 6.0 },
};

const state = loadState();
let selectedDate = todayKey();
let calendarMonth = selectedDate.slice(0, 7);
let reportRange = "week";

const els = {
  selectedDateText: document.querySelector("#selectedDateText"),
  selectedDateLabel: document.querySelector("#selectedDateLabel"),
  datePicker: document.querySelector("#datePicker"),
  dateButton: document.querySelector("#dateButton"),
  prevDay: document.querySelector("#prevDay"),
  nextDay: document.querySelector("#nextDay"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  calendarMonth: document.querySelector("#calendarMonth"),
  calendarGrid: document.querySelector("#calendarGrid"),
  dailyForm: document.querySelector("#dailyForm"),
  settingsForm: document.querySelector("#settingsForm"),
  checkinNowButton: document.querySelector("#checkinNowButton"),
  checkoutNowButton: document.querySelector("#checkoutNowButton"),
  morningStatus: document.querySelector("#morningStatus"),
  checkoutStatus: document.querySelector("#checkoutStatus"),
  caloriePreview: document.querySelector("#caloriePreview"),
  supplementStatus: document.querySelector("#supplementStatus"),
  exerciseList: document.querySelector("#exerciseList"),
  exerciseTemplate: document.querySelector("#exerciseTemplate"),
  addExerciseButton: document.querySelector("#addExerciseButton"),
  supplementList: document.querySelector("#supplementList"),
  supplementTemplate: document.querySelector("#supplementTemplate"),
  addSupplementButton: document.querySelector("#addSupplementButton"),
  activityList: document.querySelector("#activityList"),
  activityTemplate: document.querySelector("#activityTemplate"),
  addActivityButton: document.querySelector("#addActivityButton"),
  supplementCandidateList: document.querySelector("#supplementCandidateList"),
  supplementCandidateTemplate: document.querySelector("#supplementCandidateTemplate"),
  addSupplementCandidateButton: document.querySelector("#addSupplementCandidateButton"),
  addJournalButton: document.querySelector("#addJournalButton"),
  journalTitle: document.querySelector("#journalTitle"),
  journalBody: document.querySelector("#journalBody"),
  journalMood: document.querySelector("#journalMood"),
  journalCategory: document.querySelector("#journalCategory"),
  journalList: document.querySelector("#journalList"),
  statsGrid: document.querySelector("#statsGrid"),
  chartLegend: document.querySelector("#chartLegend"),
  moodChart: document.querySelector("#moodChart"),
  insightsList: document.querySelector("#insightsList"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importFile: document.querySelector("#importFile"),
  firebaseStatus: document.querySelector("#firebaseStatus"),
  firebaseConfigInput: document.querySelector("#firebaseConfigInput"),
  saveFirebaseConfigButton: document.querySelector("#saveFirebaseConfigButton"),
  firebaseLoginButton: document.querySelector("#firebaseLoginButton"),
  firebaseSyncNowButton: document.querySelector("#firebaseSyncNowButton"),
  firebaseLogoutButton: document.querySelector("#firebaseLogoutButton"),
  firebaseDebug: document.querySelector("#firebaseDebug"),
  toast: document.querySelector("#toast"),
};

const cloud = {
  app: null,
  auth: null,
  db: null,
  user: null,
  modules: null,
  ready: false,
  syncing: false,
};

const sliderValueMap = {
  morningMood: document.querySelector("#morningMoodValue"),
  sleepiness: document.querySelector("#sleepinessValue"),
  motivation: document.querySelector("#motivationValue"),
  directionScore: document.querySelector("#directionScoreValue"),
};

init();

function init() {
  els.datePicker.value = selectedDate;
  migrateExistingDays();
  bindEvents();
  renderAll();
  initializeFirebase();
  registerServiceWorker();
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  document.querySelectorAll("[data-range]").forEach((button) => {
    button.addEventListener("click", () => {
      reportRange = button.dataset.range;
      document.querySelectorAll("[data-range]").forEach((item) => item.classList.toggle("active", item === button));
      renderReport();
    });
  });

  els.dateButton.addEventListener("click", () => els.datePicker.showPicker ? els.datePicker.showPicker() : els.datePicker.click());
  els.datePicker.addEventListener("change", () => {
    selectedDate = els.datePicker.value || todayKey();
    calendarMonth = selectedDate.slice(0, 7);
    renderAll();
  });

  els.prevDay.addEventListener("click", () => moveDay(-1));
  els.nextDay.addEventListener("click", () => moveDay(1));
  els.prevMonth.addEventListener("click", () => moveMonth(-1));
  els.nextMonth.addEventListener("click", () => moveMonth(1));

  els.checkinNowButton.addEventListener("click", () => {
    setMorningTimeNow();
    saveCurrentSection("朝チェックイン");
  });

  els.checkoutNowButton.addEventListener("click", () => {
    setCheckoutTimeNow();
    els.dailyForm.dataset.checkoutTouchedDate = selectedDate;
    saveCurrentSection("夜チェックアウト");
  });

  els.addExerciseButton.addEventListener("click", () => {
    addExerciseRow(blankExercise());
    saveDailyFromForm();
  });

  els.addSupplementButton.addEventListener("click", () => {
    addSupplementRow(blankSupplement());
    saveDailyFromForm();
  });

  els.addActivityButton.addEventListener("click", () => {
    addActivityRow({ id: "", label: "" });
    saveActivitiesFromRows();
  });

  els.addSupplementCandidateButton.addEventListener("click", () => {
    addSupplementCandidateRow("");
    saveSupplementCandidatesFromRows();
  });

  document.querySelectorAll("[data-save-section]").forEach((button) => {
    button.addEventListener("click", () => saveCurrentSection(button.dataset.saveSection));
  });

  els.dailyForm.addEventListener("input", (event) => {
    if (event.target.matches("[data-checkout-field]")) {
      els.dailyForm.dataset.checkoutTouchedDate = selectedDate;
    }
    saveDailyFromForm();
    renderDailyMeta();
    renderReport();
    renderCalendar();
  });

  els.exerciseList.addEventListener("input", () => {
    saveDailyFromForm();
    renderDailyMeta();
    renderReport();
    renderCalendar();
  });

  els.exerciseList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-exercise");
    if (!removeButton) return;
    removeButton.closest(".exercise-item").remove();
    if (!els.exerciseList.children.length) addExerciseRow(blankExercise());
    saveDailyFromForm();
    renderDailyMeta();
    renderReport();
    renderCalendar();
  });

  els.supplementList.addEventListener("input", () => {
    saveDailyFromForm();
    renderDailyMeta();
    renderCalendar();
  });

  els.supplementList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-supplement");
    if (!removeButton) return;
    removeButton.closest(".supplement-item").remove();
    if (!els.supplementList.children.length) renderSupplementRows(defaultSupplements());
    saveDailyFromForm();
    renderDailyMeta();
    renderCalendar();
  });

  els.activityList.addEventListener("input", () => {
    saveActivitiesFromRows();
    refreshExerciseTypeOptions();
  });

  els.activityList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-activity");
    if (!removeButton) return;
    removeButton.closest(".activity-item").remove();
    saveActivitiesFromRows();
    refreshExerciseTypeOptions();
  });

  els.supplementCandidateList.addEventListener("input", () => {
    saveSupplementCandidatesFromRows();
    refreshSupplementNameOptions();
  });

  els.supplementCandidateList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-supplement-candidate");
    if (!removeButton) return;
    removeButton.closest(".candidate-item").remove();
    saveSupplementCandidatesFromRows();
    refreshSupplementNameOptions();
  });

  els.settingsForm.addEventListener("input", () => {
    state.settings.weightKg = numberOrNull(new FormData(els.settingsForm).get("weightKg"));
    saveState();
    renderDailyMeta();
    renderReport();
  });

  els.addJournalButton.addEventListener("click", addJournal);
  els.exportButton.addEventListener("click", exportData);
  els.importButton.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", importData);
  els.saveFirebaseConfigButton.addEventListener("click", saveFirebaseConfigFromInput);
  els.firebaseLoginButton.addEventListener("click", signInToFirebase);
  els.firebaseLogoutButton.addEventListener("click", signOutFromFirebase);
  els.firebaseSyncNowButton.addEventListener("click", () => syncToCloud({ showDone: true }));
}

function activateTab(tab) {
  document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab));
  if (tab === "report") renderReport();
}

function moveDay(delta) {
  const date = parseDateKey(selectedDate);
  date.setDate(date.getDate() + delta);
  selectedDate = toDateKey(date);
  calendarMonth = selectedDate.slice(0, 7);
  els.datePicker.value = selectedDate;
  renderAll();
}

function moveMonth(delta) {
  const [year, month] = calendarMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  calendarMonth = toDateKey(date).slice(0, 7);
  renderCalendar();
}

function renderAll() {
  renderDateHeader();
  renderCalendar();
  renderDailyForm();
  renderJournalList();
  renderSettings();
  renderReport();
}

function renderDateHeader() {
  const date = parseDateKey(selectedDate);
  const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "long" }).format(date);
  els.selectedDateText.textContent = selectedDate;
  els.selectedDateLabel.textContent = `${date.getMonth() + 1}月${date.getDate()}日 ${weekday}`;
}

function renderCalendar() {
  const [year, month] = calendarMonth.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  els.calendarMonth.textContent = `${year}年${month}月`;

  els.calendarGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    const isCurrentMonth = date.getMonth() === month - 1;
    const hasEntry = hasDailyEntry(state.days[key]);
    return `
      <button class="calendar-day ${isCurrentMonth ? "" : "muted"} ${key === selectedDate ? "selected" : ""} ${key === todayKey() ? "today" : ""} ${hasEntry ? "has-entry" : ""}"
        type="button" data-date="${key}" aria-label="${key}${hasEntry ? " 記録あり" : ""}">
        ${date.getDate()}
      </button>`;
  }).join("");

  els.calendarGrid.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedDate = button.dataset.date;
      calendarMonth = selectedDate.slice(0, 7);
      els.datePicker.value = selectedDate;
      renderAll();
    });
  });
}

function renderDailyForm() {
  const daily = getDaily(selectedDate);
  setFormValue("morningCheckedAt", daily.morningCheckedAt ?? "");
  setFormValue("morningMood", daily.morningMood ?? 5);
  setFormValue("sleepiness", daily.sleepiness ?? 5);
  setFormValue("motivation", daily.motivation ?? 5);
  setFormValue("badEnd", daily.badEnd ?? "");
  setFormValue("happyEnd", daily.happyEnd ?? "");
  setFormValue("oneMove", daily.oneMove ?? "");
  setFormValue("sleepHours", daily.sleepHours ?? "");
  setFormValue("mainWorkHours", daily.mainWorkHours ?? "");
  setFormValue("sideWorkHours", daily.sideWorkHours ?? "");
  setFormValue("mainWorkNote", daily.mainWorkNote ?? "");
  setFormValue("sideWorkNote", daily.sideWorkNote ?? "");
  setFormValue("gratitude", daily.gratitude ?? "");
  setFormValue("checkoutCheckedAt", daily.checkoutCheckedAt ?? "");
  setFormValue("directionScore", daily.directionScore ?? 5);
  setFormValue("checkoutNote", daily.checkoutNote ?? "");
  renderExerciseRows(normalizeExercises(daily));
  renderSupplementRows(normalizeSupplements(daily));
  renderDailyMeta();
}

function setFormValue(name, value) {
  const field = els.dailyForm.elements[name];
  if (field) field.value = value;
}

function saveDailyFromForm() {
  const data = Object.fromEntries(new FormData(els.dailyForm).entries());
  state.days[selectedDate] = {
    ...getDaily(selectedDate),
    morningCheckedAt: data.morningCheckedAt,
    morningMood: numberOrNull(data.morningMood),
    sleepiness: numberOrNull(data.sleepiness),
    motivation: numberOrNull(data.motivation),
    badEnd: data.badEnd.trim(),
    happyEnd: data.happyEnd.trim(),
    oneMove: data.oneMove.trim(),
    sleepHours: numberOrNull(data.sleepHours),
    mainWorkHours: numberOrNull(data.mainWorkHours),
    sideWorkHours: numberOrNull(data.sideWorkHours),
    mainWorkNote: data.mainWorkNote.trim(),
    sideWorkNote: data.sideWorkNote.trim(),
    exercises: readExerciseRows(),
    supplements: readSupplementRows(),
    gratitude: data.gratitude.trim(),
    checkoutCheckedAt: data.checkoutCheckedAt,
    directionScore: numberOrNull(data.directionScore),
    checkoutNote: data.checkoutNote.trim(),
    checkoutTouchedAt: getCheckoutTouchedAt(),
    updatedAt: new Date().toISOString(),
  };
  saveState();
}

function setMorningTimeNow() {
  const field = els.dailyForm.elements.morningCheckedAt;
  field.value = currentTimeValue();
}

function setCheckoutTimeNow() {
  const field = els.dailyForm.elements.checkoutCheckedAt;
  field.value = currentTimeValue();
}

function saveCurrentSection(sectionName) {
  if (sectionName === "夜チェックアウト") {
    els.dailyForm.dataset.checkoutTouchedDate = selectedDate;
  }
  saveDailyFromForm();
  renderDailyMeta();
  renderReport();
  renderCalendar();
  showToast(`${sectionName}を保存しました`);
}

function renderExerciseRows(exercises) {
  els.exerciseList.innerHTML = "";
  const rows = exercises.length ? exercises : [blankExercise()];
  rows.forEach((exercise) => addExerciseRow(exercise));
}

function addExerciseRow(exercise) {
  const node = els.exerciseTemplate.content.firstElementChild.cloneNode(true);
  fillExerciseOptions(node.querySelector('[data-exercise-field="type"]'), exercise.type || "");
  node.querySelector('[data-exercise-field="minutes"]').value = exercise.minutes ?? "";
  node.querySelector('[data-exercise-field="timing"]').value = exercise.timing || "morning";
  node.querySelector('[data-exercise-field="intensity"]').value = exercise.intensity || "";
  node.querySelector('[data-exercise-field="note"]').value = exercise.note || "";
  els.exerciseList.append(node);
}

function readExerciseRows() {
  return Array.from(els.exerciseList.querySelectorAll(".exercise-item"))
    .map((item) => ({
      type: item.querySelector('[data-exercise-field="type"]').value,
      minutes: numberOrNull(item.querySelector('[data-exercise-field="minutes"]').value),
      timing: item.querySelector('[data-exercise-field="timing"]').value,
      intensity: item.querySelector('[data-exercise-field="intensity"]').value,
      note: item.querySelector('[data-exercise-field="note"]').value.trim(),
    }))
    .filter((exercise) => exercise.type || exercise.minutes || exercise.note);
}

function fillExerciseOptions(select, selectedValue) {
  select.innerHTML = `<option value="">選択</option>` + getActivities()
    .map((activity) => `<option value="${escapeHtml(activity.id)}">${escapeHtml(activity.label)}</option>`)
    .join("");
  select.value = selectedValue;
}

function refreshExerciseTypeOptions() {
  els.exerciseList.querySelectorAll('[data-exercise-field="type"]').forEach((select) => {
    fillExerciseOptions(select, select.value);
  });
}

function renderSupplementRows(supplements) {
  els.supplementList.innerHTML = "";
  const rows = supplements.length ? supplements : defaultSupplements();
  rows.forEach((supplement) => addSupplementRow(supplement));
}

function addSupplementRow(supplement) {
  const node = els.supplementTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector('[data-supplement-field="taken"]').checked = Boolean(supplement.taken);
  fillSupplementOptions(node.querySelector('[data-supplement-field="name"]'), supplement.name || "");
  node.querySelector('[data-supplement-field="timing"]').value = supplement.timing || "morning";
  node.querySelector('[data-supplement-field="note"]').value = supplement.note || "";
  els.supplementList.append(node);
}

function readSupplementRows() {
  return Array.from(els.supplementList.querySelectorAll(".supplement-item"))
    .map((item) => ({
      taken: item.querySelector('[data-supplement-field="taken"]').checked,
      name: item.querySelector('[data-supplement-field="name"]').value.trim(),
      timing: item.querySelector('[data-supplement-field="timing"]').value,
      note: item.querySelector('[data-supplement-field="note"]').value.trim(),
    }))
    .filter((supplement) => supplement.name || supplement.taken || supplement.note);
}

function fillSupplementOptions(select, selectedValue) {
  select.innerHTML = `<option value="">選択</option>` + getSupplementCandidates()
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");
  select.value = selectedValue;
}

function refreshSupplementNameOptions() {
  els.supplementList.querySelectorAll('[data-supplement-field="name"]').forEach((select) => {
    fillSupplementOptions(select, select.value);
  });
}

function renderSettings() {
  els.settingsForm.elements.weightKg.value = state.settings.weightKg ?? "";
  els.firebaseConfigInput.value = getFirebaseConfigText();
  updateFirebaseStatus();
  renderActivityRows();
  renderSupplementCandidateRows();
}

function renderActivityRows() {
  els.activityList.innerHTML = "";
  getActivities().forEach((activity) => addActivityRow(activity));
}

function addActivityRow(activity) {
  const node = els.activityTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector('[data-activity-field="label"]').value = activity.label || "";
  node.querySelector('[data-activity-field="id"]').value = activity.id || "";
  els.activityList.append(node);
}

function saveActivitiesFromRows() {
  const activities = Array.from(els.activityList.querySelectorAll(".activity-item"))
    .map((item) => {
      const label = item.querySelector('[data-activity-field="label"]').value.trim();
      const rawId = item.querySelector('[data-activity-field="id"]').value.trim();
      return { id: sanitizeActivityId(rawId || label), label };
    })
    .filter((activity) => activity.id && activity.label);
  state.settings.activities = dedupeActivities(activities);
  saveState();
}

function renderSupplementCandidateRows() {
  els.supplementCandidateList.innerHTML = "";
  getSupplementCandidates().forEach((name) => addSupplementCandidateRow(name));
}

function addSupplementCandidateRow(name) {
  const node = els.supplementCandidateTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector('[data-supplement-candidate-field="name"]').value = name || "";
  els.supplementCandidateList.append(node);
}

function saveSupplementCandidatesFromRows() {
  const candidates = Array.from(els.supplementCandidateList.querySelectorAll(".candidate-item"))
    .map((item) => item.querySelector('[data-supplement-candidate-field="name"]').value.trim())
    .filter(Boolean);
  state.settings.supplements = [...new Set(candidates)];
  saveState();
}

function renderDailyMeta() {
  const daily = getDaily(selectedDate);
  Object.entries(sliderValueMap).forEach(([name, label]) => {
    label.textContent = els.dailyForm.elements[name].value;
  });

  const hasMorning = Boolean(daily.morningCheckedAt || daily.badEnd || daily.happyEnd || daily.oneMove);
  const hasCheckout = Boolean(daily.checkoutCheckedAt || daily.gratitude || daily.checkoutNote || daily.checkoutTouchedAt);
  els.morningStatus.textContent = hasMorning ? `保存済み ${daily.morningCheckedAt || ""}` : "未入力";
  els.checkoutStatus.textContent = hasCheckout ? `保存済み ${daily.checkoutCheckedAt || ""}` : "未入力";
  els.supplementStatus.textContent = supplementStatusText(daily);
  els.caloriePreview.textContent = `${Math.round(estimateCalories(daily))} kcal`;
}

function getCheckoutTouchedAt() {
  const daily = getDaily(selectedDate);
  if (daily.checkoutTouchedAt) return daily.checkoutTouchedAt;
  if (els.dailyForm.dataset.checkoutTouchedDate === selectedDate) return new Date().toISOString();
  return "";
}

function addJournal() {
  const body = els.journalBody.value.trim();
  if (!body) {
    showToast("本文を書いてから追加します");
    return;
  }

  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    title: els.journalTitle.value.trim(),
    body,
    mood: numberOrNull(els.journalMood.value),
    category: els.journalCategory.value.trim(),
  };

  const daily = getDaily(selectedDate);
  daily.journals = [entry, ...(daily.journals || [])];
  state.days[selectedDate] = daily;
  saveState();

  els.journalTitle.value = "";
  els.journalBody.value = "";
  els.journalMood.value = "";
  els.journalCategory.value = "";
  renderJournalList();
  renderReport();
  renderCalendar();
  showToast("雑記を追加しました");
}

function renderJournalList() {
  const journals = getDaily(selectedDate).journals || [];
  if (!journals.length) {
    els.journalList.innerHTML = `<article class="journal-item"><p class="note">この日の雑記はまだありません。</p></article>`;
    return;
  }

  els.journalList.innerHTML = journals.map((entry) => {
    const title = escapeHtml(entry.title || "無題");
    const time = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date(entry.createdAt));
    const mood = entry.mood ? `気分 ${entry.mood}` : "";
    const category = entry.category ? escapeHtml(entry.category) : "";
    const meta = [mood, category].filter(Boolean).join(" / ");
    return `
      <article class="journal-item">
        <header>
          <h3>${title}</h3>
          <time>${time}</time>
        </header>
        <p>${escapeHtml(entry.body)}</p>
        ${meta ? `<div class="meta">${meta}</div>` : ""}
      </article>`;
  }).join("");
}

function renderReport() {
  const dates = getRangeDates(selectedDate, reportRange);
  const rows = dates.map((date) => ({ date, daily: state.days[date] || {} }));
  const moods = rows.map((row) => row.daily.morningMood).filter(isNumber);
  const sleepiness = rows.map((row) => row.daily.sleepiness).filter(isNumber);
  const motivations = rows.map((row) => row.daily.motivation).filter(isNumber);
  const sleeps = rows.map((row) => row.daily.sleepHours).filter(isNumber);
  const mainWork = sum(rows.map((row) => row.daily.mainWorkHours));
  const sideWork = sum(rows.map((row) => row.daily.sideWorkHours));
  const exerciseMinutes = sum(rows.map((row) => totalExerciseMinutes(row.daily)));
  const calories = sum(rows.map((row) => estimateCalories(row.daily)));

  const stats = [
    ["平均気分", averageText(moods)],
    ["平均眠気", averageText(sleepiness)],
    ["平均やる気", averageText(motivations)],
    ["平均睡眠", sleeps.length ? `${average(sleeps).toFixed(1)}h` : "-"],
    ["本業合計", `${mainWork.toFixed(1)}h`],
    ["副業合計", `${sideWork.toFixed(1)}h`],
    ["運動合計", `${Math.round(exerciseMinutes)}分`],
    ["消費推定", `${Math.round(calories)}kcal`],
  ];
  els.statsGrid.innerHTML = stats.map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`).join("");
  renderLegend();
  drawMorningChart(rows);
  renderInsights(rows);
}

function renderLegend() {
  const items = [["気分", "#0f766e"], ["眠気", "#b45309"], ["やる気", "#be123c"]];
  els.chartLegend.innerHTML = items.map(([label, color]) => `<span><i style="background:${color}"></i>${label}</span>`).join("");
}

function drawMorningChart(rows) {
  const canvas = els.moodChart;
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fffdf8";
  context.fillRect(0, 0, width, height);

  const padding = { top: 26, right: 18, bottom: 42, left: 34 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  context.strokeStyle = "#ded7c9";
  context.lineWidth = 1;
  context.fillStyle = "#697276";
  context.font = "12px system-ui";
  for (let score = 1; score <= 10; score += 3) {
    const y = padding.top + chartHeight - ((score - 1) / 9) * chartHeight;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.fillText(String(score), 8, y + 4);
  }

  const series = [
    { key: "morningMood", color: "#0f766e" },
    { key: "sleepiness", color: "#b45309" },
    { key: "motivation", color: "#be123c" },
  ];
  const hasAnyPoint = series.some((item) => rows.some((row) => isNumber(row.daily[item.key])));
  if (!hasAnyPoint) {
    context.fillStyle = "#697276";
    context.font = "16px system-ui";
    context.fillText("この期間の朝データはまだありません", padding.left, height / 2);
    return;
  }

  const xFor = (index) => padding.left + (rows.length === 1 ? chartWidth / 2 : (index / (rows.length - 1)) * chartWidth);
  const yFor = (value) => padding.top + chartHeight - ((value - 1) / 9) * chartHeight;

  series.forEach((item) => {
    const points = rows.map((row, index) => ({ index, value: row.daily[item.key] })).filter((point) => isNumber(point.value));
    if (!points.length) return;
    context.strokeStyle = item.color;
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    points.forEach((point, index) => {
      const x = xFor(point.index);
      const y = yFor(point.value);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
    points.forEach((point) => {
      context.fillStyle = "#fffdf8";
      context.beginPath();
      context.arc(xFor(point.index), yFor(point.value), 5, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = item.color;
      context.lineWidth = 2;
      context.stroke();
    });
  });

  context.fillStyle = "#697276";
  context.font = "12px system-ui";
  rows.forEach((row, index) => {
    if (reportRange === "month" && index % 5 !== 0 && index !== rows.length - 1) return;
    const date = parseDateKey(row.date);
    context.fillText(`${date.getMonth() + 1}/${date.getDate()}`, xFor(index) - 12, height - 14);
  });
}

function renderInsights(rows) {
  const filledDays = rows.filter((row) => Object.keys(row.daily).length);
  const sleepRows = rows.filter((row) => isNumber(row.daily.sleepHours) && isNumber(row.daily.morningMood));
  const exerciseRows = rows.filter((row) => totalExerciseMinutes(row.daily) > 0 && isNumber(row.daily.morningMood));
  const checkoutScores = rows.map((row) => row.daily.directionScore).filter(isNumber);
  const insights = [`${reportRange === "week" ? "この週" : "この月"}は ${filledDays.length} 日分の記録があります。`];

  if (sleepRows.length >= 2) {
    const enoughSleep = sleepRows.filter((row) => row.daily.sleepHours >= 7).map((row) => row.daily.morningMood);
    const shortSleep = sleepRows.filter((row) => row.daily.sleepHours < 7).map((row) => row.daily.morningMood);
    if (enoughSleep.length && shortSleep.length) {
      insights.push(`7時間以上寝た日の平均気分は ${average(enoughSleep).toFixed(1)}、短い日は ${average(shortSleep).toFixed(1)} です。`);
    }
  }
  if (exerciseRows.length >= 2) {
    insights.push(`運動した日の平均気分は ${average(exerciseRows.map((row) => row.daily.morningMood)).toFixed(1)} です。`);
  }
  if (checkoutScores.length) {
    insights.push(`夜の方向スコア平均は ${average(checkoutScores).toFixed(1)} です。10に近いほどハッピーエンド寄りです。`);
  }
  if (insights.length === 1) {
    insights.push("数日分たまると、睡眠・運動・仕事量と朝の状態の関係が見え始めます。");
  }
  els.insightsList.innerHTML = insights.map((text) => `<li>${escapeHtml(text)}</li>`).join("");
}

function estimateCalories(daily) {
  if (!daily || !state.settings.weightKg) return 0;
  return normalizeExercises(daily).reduce((total, exercise) => {
    if (!exercise.type || !exercise.minutes) return total;
    const intensity = exercise.intensity || "moderate";
    const mets = METS[exercise.type]?.[intensity] ?? METS.other[intensity] ?? METS.other.moderate;
    return total + mets * state.settings.weightKg * (exercise.minutes / 60) * 1.05;
  }, 0);
}

function totalExerciseMinutes(daily) {
  return sum(normalizeExercises(daily).map((exercise) => exercise.minutes));
}

function normalizeExercises(daily) {
  if (!daily) return [];
  if (Array.isArray(daily.exercises)) return daily.exercises;
  if (daily.exerciseType || daily.exerciseMinutes || daily.exerciseNote) {
    return [{
      type: daily.exerciseType || "",
      minutes: daily.exerciseMinutes ?? null,
      timing: "anytime",
      intensity: daily.exerciseIntensity || "",
      note: daily.exerciseNote || "",
    }];
  }
  return [];
}

function normalizeSupplements(daily) {
  if (!daily) return [];
  if (Array.isArray(daily.supplements)) return daily.supplements;
  return [];
}

function migrateExistingDays() {
  let changed = false;
  Object.entries(state.days).forEach(([date, daily]) => {
    if (!Array.isArray(daily.exercises) && (daily.exerciseType || daily.exerciseMinutes || daily.exerciseNote)) {
      state.days[date] = { ...daily, exercises: normalizeExercises(daily) };
      changed = true;
    }
  });
  if (changed) saveState();
}

function getActivities() {
  return state.settings.activities?.length ? state.settings.activities : DEFAULT_ACTIVITIES;
}

function getSupplementCandidates() {
  return mergeDefaultSupplements(state.settings.supplements?.length ? state.settings.supplements : DEFAULT_SUPPLEMENTS);
}

function mergeDefaultSupplements(supplements) {
  return [...new Set([...DEFAULT_SUPPLEMENTS, ...supplements])];
}

function dedupeActivities(activities) {
  const seen = new Set();
  return activities.filter((activity) => {
    if (seen.has(activity.id)) return false;
    seen.add(activity.id);
    return true;
  });
}

function sanitizeActivityId(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .slice(0, 40);
}

function blankExercise() {
  return { type: "", minutes: null, timing: "morning", intensity: "", note: "" };
}

function blankSupplement() {
  return { taken: false, name: "", timing: "morning", note: "" };
}

function defaultSupplements() {
  return [{ taken: false, name: "すべて", timing: "morning", note: "" }];
}

function supplementStatusText(daily) {
  const supplements = normalizeSupplements(daily);
  if (!supplements.length) return "未チェック";
  const named = supplements.filter((supplement) => supplement.name);
  const taken = supplements.filter((supplement) => supplement.taken);
  if (!named.length && !taken.length) return "未チェック";
  return `${taken.length}/${named.length || supplements.length} 済み`;
}

function getDaily(date) {
  return state.days[date] || {};
}

function hasDailyEntry(daily) {
  if (!daily) return false;
  return Object.entries(daily).some(([key, value]) => key !== "updatedAt" && value !== null && value !== "" && !(Array.isArray(value) && !value.length));
}

function getRangeDates(anchorKey, range) {
  const anchor = parseDateKey(anchorKey);
  const length = range === "month" ? 30 : 7;
  return Array.from({ length }, (_, index) => {
    const date = new Date(anchor);
    date.setDate(anchor.getDate() - (length - 1 - index));
    return toDateKey(date);
  });
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      settings: {
        weightKg: parsed?.settings?.weightKg ?? null,
        activities: parsed?.settings?.activities || DEFAULT_ACTIVITIES,
        supplements: mergeDefaultSupplements(parsed?.settings?.supplements || DEFAULT_SUPPLEMENTS),
      },
      days: parsed?.days || {},
    };
  } catch {
    return { settings: { weightKg: null, activities: DEFAULT_ACTIVITIES, supplements: DEFAULT_SUPPLEMENTS }, days: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  syncToCloud();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gods-note-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("JSONを書き出しました");
}

function importData() {
  const file = els.importFile.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed || typeof parsed !== "object" || !parsed.days || !parsed.settings) {
        throw new Error("Invalid backup");
      }
      state.settings = {
        weightKg: parsed.settings.weightKg ?? null,
        activities: parsed.settings.activities || DEFAULT_ACTIVITIES,
        supplements: mergeDefaultSupplements(parsed.settings.supplements || DEFAULT_SUPPLEMENTS),
      };
      state.days = parsed.days || {};
      saveState();
      renderAll();
      showToast("バックアップを復元しました");
    } catch {
      showToast("復元できないJSONです");
    } finally {
      els.importFile.value = "";
    }
  });
  reader.readAsText(file);
}

function getFirebaseConfigText() {
  return localStorage.getItem(FIREBASE_CONFIG_KEY) || "";
}

function saveFirebaseConfigFromInput() {
  const raw = els.firebaseConfigInput.value.trim();
  if (!raw) {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
    showToast("Firebase設定を削除しました");
    updateFirebaseStatus();
    return;
  }

  try {
    const config = JSON.parse(raw);
    if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
      throw new Error("Missing required fields");
    }
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config, null, 2));
    showToast("Firebase設定を保存しました");
    initializeFirebase();
  } catch {
    showToast("Firebase configのJSONを確認してください");
  }
}

async function loadFirebaseModules() {
  if (cloud.modules) return cloud.modules;
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`),
  ]);
  cloud.modules = { appModule, authModule, firestoreModule };
  return cloud.modules;
}

async function initializeFirebase() {
  const raw = getFirebaseConfigText();
  if (!raw) {
    updateFirebaseStatus("未設定");
    return false;
  }

  try {
    const config = JSON.parse(raw);
    const { appModule, authModule, firestoreModule } = await loadFirebaseModules();
    cloud.app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(config);
    cloud.auth = authModule.getAuth(cloud.app);
    cloud.db = firestoreModule.getFirestore(cloud.app);
    cloud.ready = true;
    authModule.onAuthStateChanged(cloud.auth, async (user) => {
      cloud.user = user;
      updateFirebaseStatus();
      if (user) await loadFromCloudThenSync();
    });
    await authModule.getRedirectResult(cloud.auth).catch(() => null);
    updateFirebaseStatus();
    return true;
  } catch (error) {
    cloud.ready = false;
    updateFirebaseStatus("接続エラー");
    reportFirebaseError(error);
    return false;
  }
}

async function signInToFirebase() {
  const ready = cloud.ready || await initializeFirebase();
  if (!ready) {
    showToast("Firebase設定を先に保存してください");
    return;
  }

  const { authModule } = cloud.modules;
  const provider = new authModule.GoogleAuthProvider();
  try {
    showToast("Googleログインへ移動します");
    await authModule.signInWithRedirect(cloud.auth, provider);
  } catch (error) {
    reportFirebaseError(error);
  }
}

async function signOutFromFirebase() {
  if (!cloud.auth || !cloud.modules) return;
  await cloud.modules.authModule.signOut(cloud.auth);
  cloud.user = null;
  updateFirebaseStatus();
  showToast("Firebaseからログアウトしました");
}

function reportFirebaseError(error) {
  const code = error?.code || "no-code";
  const message = error?.message || String(error || "no-message");
  const text = `${firebaseErrorMessage(error)} / ${code} / ${message}`;
  if (els.firebaseDebug) els.firebaseDebug.textContent = text;
  showToast(firebaseErrorMessage(error));
  window.alert(text);
}

function firebaseErrorMessage(error) {
  const code = error?.code || "";
  if (code.includes("unauthorized-domain")) {
    return "Firebaseの承認済みドメインにcranely3150.github.ioを追加してください";
  }
  if (code.includes("invalid-api-key")) {
    return "Firebase configのapiKeyを確認してください";
  }
  if (code.includes("operation-not-allowed")) {
    return "Firebase AuthenticationでGoogleログインを有効にしてください";
  }
  if (code.includes("popup-blocked")) {
    return "ポップアップがブロックされました";
  }
  if (code.includes("popup-closed-by-user")) {
    return "ログイン画面が閉じられました";
  }
  if (code.includes("permission-denied")) {
    return "Firestoreルールを確認してください";
  }
  return code ? `Firebaseエラー: ${code}` : "Firebaseエラー: 詳細なし";
}

function getCloudDocRef() {
  const { firestoreModule } = cloud.modules;
  return firestoreModule.doc(cloud.db, "users", cloud.user.uid, "backups", "state");
}

async function loadFromCloudThenSync() {
  if (!cloud.user || !cloud.modules) return;
  try {
    const { firestoreModule } = cloud.modules;
    const snapshot = await firestoreModule.getDoc(getCloudDocRef());
    if (snapshot.exists()) {
      const remote = snapshot.data();
      if (remote?.state?.days && remote?.state?.settings) {
        const localUpdated = latestLocalUpdatedAt();
        const remoteUpdated = remote.updatedAt || "";
        if (remoteUpdated > localUpdated) {
          state.settings = remote.state.settings;
          state.days = remote.state.days;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          renderAll();
          showToast("Firebaseから復元しました");
        }
      }
    }
    await syncToCloud({ showDone: true });
  } catch {
    showToast("Firebaseから読み込めませんでした");
  }
}

async function syncToCloud(options = {}) {
  if (!cloud.ready || !cloud.user || !cloud.modules || cloud.syncing) return;
  cloud.syncing = true;
  updateFirebaseStatus("同期中");
  try {
    const { firestoreModule } = cloud.modules;
    await firestoreModule.setDoc(getCloudDocRef(), {
      state,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    updateFirebaseStatus();
    if (options.showDone) showToast("Firebaseに同期しました");
  } catch {
    updateFirebaseStatus("同期エラー");
  } finally {
    cloud.syncing = false;
  }
}

function latestLocalUpdatedAt() {
  return Object.values(state.days || {}).reduce((latest, day) => {
    const value = day?.updatedAt || "";
    return value > latest ? value : latest;
  }, "");
}

function updateFirebaseStatus(override) {
  if (!els.firebaseStatus) return;
  if (override) {
    els.firebaseStatus.textContent = override;
    return;
  }
  if (!getFirebaseConfigText()) els.firebaseStatus.textContent = "未設定";
  else if (!cloud.ready) els.firebaseStatus.textContent = "未接続";
  else if (!cloud.user) els.firebaseStatus.textContent = "未ログイン";
  else els.firebaseStatus.textContent = cloud.syncing ? "同期中" : "同期済み";
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (["127.0.0.1", "localhost"].includes(location.hostname)) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    }).catch(() => {});
    return;
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 1800);
}

function todayKey() {
  return toDateKey(new Date());
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function currentTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function sum(values) {
  return values.reduce((total, value) => total + (isNumber(value) ? value : 0), 0);
}

function average(values) {
  if (!values.length) return 0;
  return sum(values) / values.length;
}

function averageText(values) {
  return values.length ? average(values).toFixed(1) : "-";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
