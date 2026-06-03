const STORAGE_KEY = "series-tracker-shows";

const statusLabels = {
  watching: "A ver",
  paused: "Em pausa",
  wishlist: "Quero ver",
  finished: "Terminada",
};

const frequencyLabels = {
  none: "sem repetição",
  daily: "diária",
  weekly: "semanal",
  biweekly: "a cada 2 semanas",
  monthly: "mensal",
};

const notificationTimers = [];

const state = {
  shows: loadShows(),
  search: "",
  status: "all",
};

const elements = {
  form: document.querySelector("#show-form"),
  formTitle: document.querySelector("#form-title"),
  showId: document.querySelector("#show-id"),
  title: document.querySelector("#title-input"),
  status: document.querySelector("#status-input"),
  season: document.querySelector("#season-input"),
  episode: document.querySelector("#episode-input"),
  totalSeasons: document.querySelector("#total-seasons-input"),
  rating: document.querySelector("#rating-input"),
  nextAirDate: document.querySelector("#next-air-date-input"),
  nextAirTime: document.querySelector("#next-air-time-input"),
  frequency: document.querySelector("#frequency-input"),
  reminder: document.querySelector("#reminder-input"),
  notifications: document.querySelector("#notifications-input"),
  notes: document.querySelector("#notes-input"),
  cancelEdit: document.querySelector("#cancel-edit-button"),
  newShow: document.querySelector("#new-show-button"),
  enableNotifications: document.querySelector("#enable-notifications-button"),
  notificationStatus: document.querySelector("#notification-status"),
  search: document.querySelector("#search-input"),
  statusFilter: document.querySelector("#status-filter"),
  list: document.querySelector("#show-list"),
  empty: document.querySelector("#empty-state"),
  resultCount: document.querySelector("#result-count"),
  template: document.querySelector("#show-card-template"),
  counts: {
    watching: document.querySelector("#watching-count"),
    paused: document.querySelector("#paused-count"),
    wishlist: document.querySelector("#wishlist-count"),
    finished: document.querySelector("#finished-count"),
  },
};

elements.form.addEventListener("submit", handleSubmit);
elements.cancelEdit.addEventListener("click", resetForm);
elements.newShow.addEventListener("click", () => {
  resetForm();
  elements.title.focus();
});
elements.enableNotifications.addEventListener("click", requestNotificationPermission);
elements.search.addEventListener("input", (event) => {
  state.search = event.target.value.trim().toLowerCase();
  render();
});
elements.statusFilter.addEventListener("change", (event) => {
  state.status = event.target.value;
  render();
});

updateNotificationStatus();
render();

function handleSubmit(event) {
  event.preventDefault();

  const now = new Date().toISOString();
  const existingId = elements.showId.value;
  const show = {
    id: existingId || createId(),
    title: elements.title.value.trim(),
    status: elements.status.value,
    season: toNumber(elements.season.value, 0),
    episode: toNumber(elements.episode.value, 0),
    totalSeasons: toOptionalNumber(elements.totalSeasons.value),
    rating: toOptionalNumber(elements.rating.value),
    nextAirDate: elements.nextAirDate.value,
    nextAirTime: elements.nextAirTime.value || "21:00",
    frequency: elements.frequency.value,
    reminderMinutes: toNumber(elements.reminder.value, 0),
    notificationsEnabled: elements.notifications.checked,
    lastNotifiedFor: getExistingNotificationKey(existingId),
    notes: elements.notes.value.trim(),
    updatedAt: now,
  };

  if (!show.title) {
    elements.title.focus();
    return;
  }

  if (existingId) {
    state.shows = state.shows.map((item) => item.id === existingId ? show : item);
  } else {
    state.shows = [show, ...state.shows];
  }

  saveShows();
  resetForm();
  render();
}

function render() {
  renderCounts();
  renderList();
  scheduleNotifications();
}

function renderCounts() {
  Object.keys(elements.counts).forEach((status) => {
    elements.counts[status].textContent = state.shows.filter((show) => show.status === status).length;
  });
}

function renderList() {
  const shows = getFilteredShows();
  elements.list.textContent = "";
  elements.resultCount.textContent = `${shows.length} ${shows.length === 1 ? "série" : "séries"}`;
  elements.empty.classList.toggle("hidden", shows.length > 0);

  shows.forEach((show) => {
    const card = elements.template.content.firstElementChild.cloneNode(true);
    const title = card.querySelector("h3");
    const progress = card.querySelector(".show-progress");
    const status = card.querySelector(".status-pill");
    const notes = card.querySelector(".show-notes");
    const schedule = card.querySelector(".show-schedule");
    const rating = card.querySelector(".rating");
    const updated = card.querySelector(".updated");

    title.textContent = show.title;
    progress.textContent = buildProgressText(show);
    status.textContent = statusLabels[show.status];
    status.classList.add(`status-${show.status}`);
    notes.textContent = show.notes || "Sem notas.";
    schedule.textContent = buildScheduleText(show);
    rating.textContent = show.rating === null || show.rating === undefined ? "Sem nota" : `Nota ${show.rating}/10`;
    updated.textContent = `Atualizada ${formatDate(show.updatedAt)}`;

    card.querySelector(".next-episode").addEventListener("click", () => markNextEpisode(show.id));
    card.querySelector(".edit-show").addEventListener("click", () => editShow(show.id));
    card.querySelector(".delete-show").addEventListener("click", () => deleteShow(show.id));

    elements.list.append(card);
  });
}

function getFilteredShows() {
  return state.shows
    .filter((show) => state.status === "all" || show.status === state.status)
    .filter((show) => show.title.toLowerCase().includes(state.search))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function buildProgressText(show) {
  const total = show.totalSeasons ? ` de ${show.totalSeasons}` : "";
  if (show.status === "wishlist") {
    return show.totalSeasons ? `${show.totalSeasons} temporada(s) para começar` : "Ainda por começar";
  }
  return `T${show.season}${total} · E${show.episode}`;
}

function markNextEpisode(id) {
  state.shows = state.shows.map((show) => {
    if (show.id !== id) {
      return show;
    }

    return {
      ...show,
      status: show.status === "wishlist" ? "watching" : show.status,
      episode: toNumber(show.episode, 0) + 1,
      nextAirDate: advanceAirDate(show),
      lastNotifiedFor: "",
      updatedAt: new Date().toISOString(),
    };
  });
  saveShows();
  render();
}

function editShow(id) {
  const show = state.shows.find((item) => item.id === id);
  if (!show) {
    return;
  }

  elements.formTitle.textContent = "Editar série";
  elements.showId.value = show.id;
  elements.title.value = show.title;
  elements.status.value = show.status;
  elements.season.value = show.season;
  elements.episode.value = show.episode;
  elements.totalSeasons.value = show.totalSeasons ?? "";
  elements.rating.value = show.rating ?? "";
  elements.nextAirDate.value = show.nextAirDate ?? "";
  elements.nextAirTime.value = show.nextAirTime ?? "21:00";
  elements.frequency.value = show.frequency ?? "none";
  elements.reminder.value = show.reminderMinutes ?? "0";
  elements.notifications.checked = Boolean(show.notificationsEnabled);
  elements.notes.value = show.notes;
  elements.cancelEdit.classList.remove("hidden");
  elements.title.focus();
}

function deleteShow(id) {
  const show = state.shows.find((item) => item.id === id);
  if (!show || !confirm(`Apagar "${show.title}"?`)) {
    return;
  }

  state.shows = state.shows.filter((item) => item.id !== id);
  saveShows();
  resetForm();
  render();
}

function resetForm() {
  elements.form.reset();
  elements.formTitle.textContent = "Nova série";
  elements.showId.value = "";
  elements.status.value = "watching";
  elements.season.value = "1";
  elements.episode.value = "1";
  elements.nextAirTime.value = "21:00";
  elements.frequency.value = "none";
  elements.reminder.value = "0";
  elements.notifications.checked = false;
  elements.cancelEdit.classList.add("hidden");
}

function loadShows() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : seedShows();
  } catch {
    return seedShows();
  }
}

function saveShows() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.shows));
}

function seedShows() {
  return [
    {
      id: createId(),
      title: "The Bear",
      status: "watching",
      season: 2,
      episode: 4,
      totalSeasons: 3,
      rating: 8.5,
      nextAirDate: getDateInputValue(daysFromNow(2)),
      nextAirTime: "21:00",
      frequency: "weekly",
      reminderMinutes: 60,
      notificationsEnabled: false,
      lastNotifiedFor: "",
      notes: "Bom ritmo para ver ao fim do dia.",
      updatedAt: new Date().toISOString(),
    },
    {
      id: createId(),
      title: "Severance",
      status: "wishlist",
      season: 1,
      episode: 1,
      totalSeasons: 2,
      rating: null,
      nextAirDate: "",
      nextAirTime: "21:00",
      frequency: "none",
      reminderMinutes: 0,
      notificationsEnabled: false,
      lastNotifiedFor: "",
      notes: "",
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

function toNumber(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildScheduleText(show) {
  if (!show.nextAirDate) {
    return "Sem data de estreia definida.";
  }

  const airDate = getAirDate(show);
  if (!airDate) {
    return "Data de estreia inválida.";
  }

  const frequency = frequencyLabels[show.frequency ?? "none"];
  const reminder = show.notificationsEnabled ? ` · aviso ${formatReminder(show.reminderMinutes ?? 0)}` : "";
  return `Próximo episódio: ${formatDateTime(airDate)} · ${frequency}${reminder}`;
}

function advanceAirDate(show) {
  if (!show.nextAirDate || !show.frequency || show.frequency === "none") {
    return show.nextAirDate ?? "";
  }

  const date = getAirDate(show);
  if (!date) {
    return show.nextAirDate;
  }

  if (show.frequency === "daily") {
    date.setDate(date.getDate() + 1);
  }
  if (show.frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  }
  if (show.frequency === "biweekly") {
    date.setDate(date.getDate() + 14);
  }
  if (show.frequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
  }

  return getDateInputValue(date);
}

function scheduleNotifications() {
  clearNotificationTimers();

  if (!("Notification" in window) || Notification.permission !== "granted") {
    updateNotificationStatus();
    return;
  }

  const now = Date.now();
  const maxDelay = 2147483647;

  state.shows.forEach((show) => {
    if (!show.notificationsEnabled || show.status === "finished") {
      return;
    }

    const airDate = getAirDate(show);
    if (!airDate) {
      return;
    }

    const notificationKey = getNotificationKey(show);
    if (show.lastNotifiedFor === notificationKey) {
      return;
    }

    const reminderMs = toNumber(show.reminderMinutes, 0) * 60000;
    const delay = airDate.getTime() - reminderMs - now;
    if (delay < 0 || delay > maxDelay) {
      return;
    }

    const timer = window.setTimeout(() => {
      showBrowserNotification(show);
    }, delay);
    notificationTimers.push(timer);
  });

  updateNotificationStatus();
}

function clearNotificationTimers() {
  while (notificationTimers.length > 0) {
    window.clearTimeout(notificationTimers.pop());
  }
}

function showBrowserNotification(show) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const notificationKey = getNotificationKey(show);
  const airDate = getAirDate(show);
  new Notification(`Novo episódio: ${show.title}`, {
    body: `${buildProgressText(show)} sai em ${airDate ? formatDateTime(airDate) : "breve"}.`,
  });

  state.shows = state.shows.map((item) => item.id === show.id ? {
    ...item,
    lastNotifiedFor: notificationKey,
  } : item);
  saveShows();
  render();
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    updateNotificationStatus("Este browser não suporta notificações nesta página.");
    return;
  }

  const permission = await Notification.requestPermission();
  updateNotificationStatus();
  if (permission === "granted") {
    scheduleNotifications();
  }
}

function updateNotificationStatus(message) {
  if (message) {
    elements.notificationStatus.textContent = message;
    return;
  }

  if (!("Notification" in window)) {
    elements.notificationStatus.textContent = "Este browser não suporta notificações nesta página.";
    elements.enableNotifications.disabled = true;
    return;
  }

  if (Notification.permission === "granted") {
    elements.notificationStatus.textContent = "Avisos ativos enquanto a app estiver aberta.";
    elements.enableNotifications.textContent = "Avisos ativos";
    elements.enableNotifications.disabled = true;
    return;
  }

  if (Notification.permission === "denied") {
    elements.notificationStatus.textContent = "As notificações estão bloqueadas nas definições do browser.";
    elements.enableNotifications.textContent = "Bloqueado";
    elements.enableNotifications.disabled = true;
    return;
  }

  elements.notificationStatus.textContent = "Podes receber avisos enquanto esta app estiver aberta no browser.";
  elements.enableNotifications.textContent = "Ativar avisos";
  elements.enableNotifications.disabled = false;
}

function getExistingNotificationKey(id) {
  const existing = state.shows.find((show) => show.id === id);
  return existing?.lastNotifiedFor ?? "";
}

function getNotificationKey(show) {
  return `${show.nextAirDate ?? ""}T${show.nextAirTime ?? "21:00"}`;
}

function getAirDate(show) {
  if (!show.nextAirDate) {
    return null;
  }

  const date = new Date(`${show.nextAirDate}T${show.nextAirTime || "21:00"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function getDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReminder(minutes) {
  const value = toNumber(minutes, 0);
  if (value === 0) {
    return "na hora";
  }
  if (value === 15) {
    return "15 min antes";
  }
  if (value === 60) {
    return "1 hora antes";
  }
  if (value === 1440) {
    return "1 dia antes";
  }
  return `${value} min antes`;
}

function toOptionalNumber(value) {
  if (value === "") {
    return null;
  }
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : null;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
