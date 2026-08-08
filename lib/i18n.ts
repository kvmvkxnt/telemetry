// ponytail: three languages and one flat string table — a full i18n library
// would be more config than content. Swap in next-intl if plurals or
// date/number formatting per locale ever show up.

export const LANGUAGES = ["en", "ru", "uz"] as const;
export type Lang = (typeof LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Lang, string> = {
  en: "English",
  ru: "Русский",
  uz: "O'zbekcha",
};

const en = {
  // shell
  admin: "Admin",
  loading: "Loading…",
  live: "Live",
  connecting: "Connecting…",
  reconnecting: "Reconnecting…",
  language: "Language",
  languageHint: "Applies to this panel and the public display.",

  // settings
  winnerMetric: "Winner metric",
  fastestTime: "Fastest time",
  topSpeed: "Top speed",
  logoSize: "Logo size on display",
  logoSizeHint:
    "Set this while watching the actual screen — the right size depends on the projector and how far back the crowd stands.",
  resetBtn: "Reset",

  // setup
  addVehicle: "Add vehicle",
  brandPlaceholder: "Brand (e.g. Toyota)",
  modelPlaceholder: "Model (e.g. Supra)",
  uploadLogo: "Upload logo (optional)",
  uploading: "Uploading…",
  logoWord: "logo",
  createRace: "Create race",
  vehicleA: "Vehicle A…",
  vehicleB: "Vehicle B (optional)…",
  vehicles: "Vehicles",
  deleteVehicle: "Delete vehicle",

  // races
  races: "Races",
  noRaces: "No races yet — add vehicles and pair them above.",
  lineUp: "Line up",
  startRace: "Start race",
  finishRun: "Finish run",
  enterResult: "Enter result",
  editResult: "Edit result",
  clearResult: "Clear result",
  deleteBtn: "Delete",
  confirmSuffix: "— sure?",

  // statuses
  statusPending: "Pending",
  statusStaging: "On the line",
  statusRacing: "Racing",
  statusAwaitingResults: "Awaiting results",
  statusCompleted: "Completed",

  // result form
  distance: "Distance (m)",
  elapsedTimeField: "Elapsed time (s)",
  topSpeedField: "Top speed (mph)",
  zeroTo100Field: "0-100 time (s)",
  hundredTo200Field: "100-200 time (s, optional)",
  pullDragy: "Pull from Dragy",
  pulling: "Pulling…",
  dragyPrefilled: "Pre-filled from Dragy — review before publishing",
  dragyNone: "Dragy has no session available — enter results manually.",
  dragyFailed: "Dragy pull failed — enter results manually.",
  nonNegative: "All values must be non-negative numbers.",
  publishResult: "Publish result",
  publishing: "Publishing…",
  cancel: "Cancel",

  // danger zone
  dangerZone: "Danger zone",
  dangerHint: "Bulk clears. These push to the display immediately and cannot be undone.",
  clearAllResults: "Clear all results",
  deleteAllRaces: "Delete all races",
  resetEverything: "Reset everything",
  wipeConfirm: "Wipe races + vehicles",
  dangerFootnote:
    "Clear results keeps the running order · Delete races keeps the vehicles · Reset everything keeps only the event itself",

  // display
  onTheLine: "On the line",
  awaitingLaunch: "Awaiting launch",
  racingLabel: "Racing",
  runInProgress: "Run in progress",
  awaitingResultsTitle: "Awaiting results",
  awaitingResultsSub: "Timing being confirmed",
  resultTitle: "Result",
  winner: "Winner",
  leaderboard: "Leaderboard",
  standingBy: "Standing by",
  elapsed: "Elapsed",
  topSpeedLabel: "Top speed",
  zeroTo100: "0-100",
  hundredTo200: "100-200",
  unitSeconds: "s",
  unitSpeed: "mph",
} as const;

export type TranslationKey = keyof typeof en;

const ru: Record<TranslationKey, string> = {
  admin: "Админ",
  loading: "Загрузка…",
  live: "В эфире",
  connecting: "Подключение…",
  reconnecting: "Переподключение…",
  language: "Язык",
  languageHint: "Применяется к этой панели и к экрану для зрителей.",

  winnerMetric: "Критерий победы",
  fastestTime: "Лучшее время",
  topSpeed: "Макс. скорость",
  logoSize: "Размер логотипа на экране",
  logoSizeHint:
    "Настраивайте, глядя на реальный экран — нужный размер зависит от проектора и того, как далеко стоят зрители.",
  resetBtn: "Сброс",

  addVehicle: "Добавить автомобиль",
  brandPlaceholder: "Марка (например, Toyota)",
  modelPlaceholder: "Модель (например, Supra)",
  uploadLogo: "Загрузить логотип (необязательно)",
  uploading: "Загрузка…",
  logoWord: "лого",
  createRace: "Создать заезд",
  vehicleA: "Автомобиль A…",
  vehicleB: "Автомобиль B (необязательно)…",
  vehicles: "Автомобили",
  deleteVehicle: "Удалить автомобиль",

  races: "Заезды",
  noRaces: "Заездов пока нет — добавьте автомобили и создайте пару выше.",
  lineUp: "На старт",
  startRace: "Старт",
  finishRun: "Заезд завершён",
  enterResult: "Ввести результат",
  editResult: "Изменить результат",
  clearResult: "Очистить результат",
  deleteBtn: "Удалить",
  confirmSuffix: "— точно?",

  statusPending: "Ожидает",
  statusStaging: "На старте",
  statusRacing: "Заезд идёт",
  statusAwaitingResults: "Ожидание результатов",
  statusCompleted: "Завершён",

  distance: "Дистанция (м)",
  elapsedTimeField: "Время заезда (с)",
  topSpeedField: "Макс. скорость (миль/ч)",
  zeroTo100Field: "Время 0-100 (с)",
  hundredTo200Field: "Время 100-200 (с, необязательно)",
  pullDragy: "Загрузить из Dragy",
  pulling: "Загрузка…",
  dragyPrefilled: "Заполнено из Dragy — проверьте перед публикацией",
  dragyNone: "У Dragy нет доступной сессии — введите результаты вручную.",
  dragyFailed: "Не удалось получить данные Dragy — введите результаты вручную.",
  nonNegative: "Все значения должны быть неотрицательными числами.",
  publishResult: "Опубликовать результат",
  publishing: "Публикация…",
  cancel: "Отмена",

  dangerZone: "Опасная зона",
  dangerHint:
    "Массовое удаление. Изменения сразу попадают на экран и не могут быть отменены.",
  clearAllResults: "Очистить все результаты",
  deleteAllRaces: "Удалить все заезды",
  resetEverything: "Сбросить всё",
  wipeConfirm: "Удалить заезды и автомобили",
  dangerFootnote:
    "Очистка результатов сохраняет порядок заездов · Удаление заездов сохраняет автомобили · Полный сброс оставляет только событие",

  onTheLine: "На старте",
  awaitingLaunch: "Ожидание старта",
  racingLabel: "Заезд",
  runInProgress: "Заезд идёт",
  awaitingResultsTitle: "Ожидание результатов",
  awaitingResultsSub: "Идёт подтверждение времени",
  resultTitle: "Результат",
  winner: "Победитель",
  leaderboard: "Таблица результатов",
  standingBy: "Ожидание",
  elapsed: "Время",
  topSpeedLabel: "Макс. скорость",
  zeroTo100: "0-100",
  hundredTo200: "100-200",
  unitSeconds: "с",
  unitSpeed: "миль/ч",
};

const uz: Record<TranslationKey, string> = {
  admin: "Admin",
  loading: "Yuklanmoqda…",
  live: "Jonli",
  connecting: "Ulanmoqda…",
  reconnecting: "Qayta ulanmoqda…",
  language: "Til",
  languageHint: "Ushbu panelga va tomoshabinlar ekraniga qo'llaniladi.",

  winnerMetric: "G'olib mezoni",
  fastestTime: "Eng tez vaqt",
  topSpeed: "Maks. tezlik",
  logoSize: "Ekrandagi logo o'lchami",
  logoSizeHint:
    "Buni haqiqiy ekranga qarab sozlang — kerakli o'lcham proyektorga va tomoshabinlar qanchalik uzoqda turishiga bog'liq.",
  resetBtn: "Tiklash",

  addVehicle: "Avtomobil qo'shish",
  brandPlaceholder: "Marka (masalan, Toyota)",
  modelPlaceholder: "Model (masalan, Supra)",
  uploadLogo: "Logo yuklash (ixtiyoriy)",
  uploading: "Yuklanmoqda…",
  logoWord: "logo",
  createRace: "Poyga yaratish",
  vehicleA: "Avtomobil A…",
  vehicleB: "Avtomobil B (ixtiyoriy)…",
  vehicles: "Avtomobillar",
  deleteVehicle: "Avtomobilni o'chirish",

  races: "Poygalar",
  noRaces: "Hozircha poyga yo'q — yuqorida avtomobil qo'shing va juftlang.",
  lineUp: "Startga",
  startRace: "Start",
  finishRun: "Yugurish tugadi",
  enterResult: "Natijani kiritish",
  editResult: "Natijani tahrirlash",
  clearResult: "Natijani tozalash",
  deleteBtn: "O'chirish",
  confirmSuffix: "— aniqmi?",

  statusPending: "Kutilmoqda",
  statusStaging: "Startda",
  statusRacing: "Poygada",
  statusAwaitingResults: "Natija kutilmoqda",
  statusCompleted: "Tugallandi",

  distance: "Masofa (m)",
  elapsedTimeField: "Sarflangan vaqt (s)",
  topSpeedField: "Maks. tezlik (mph)",
  zeroTo100Field: "0-100 vaqti (s)",
  hundredTo200Field: "100-200 vaqti (s, ixtiyoriy)",
  pullDragy: "Dragy'dan olish",
  pulling: "Olinmoqda…",
  dragyPrefilled: "Dragy'dan to'ldirildi — chop etishdan oldin tekshiring",
  dragyNone: "Dragy'da mavjud sessiya yo'q — natijalarni qo'lda kiriting.",
  dragyFailed: "Dragy'dan olish muvaffaqiyatsiz — natijalarni qo'lda kiriting.",
  nonNegative: "Barcha qiymatlar manfiy bo'lmagan son bo'lishi kerak.",
  publishResult: "Natijani chop etish",
  publishing: "Chop etilmoqda…",
  cancel: "Bekor qilish",

  dangerZone: "Xavfli hudud",
  dangerHint:
    "Ommaviy tozalash. Bu o'zgarishlar darhol ekranga chiqadi va qaytarib bo'lmaydi.",
  clearAllResults: "Barcha natijalarni tozalash",
  deleteAllRaces: "Barcha poygalarni o'chirish",
  resetEverything: "Hammasini tiklash",
  wipeConfirm: "Poyga va avtomobillarni o'chirish",
  dangerFootnote:
    "Natijalarni tozalash poyga tartibini saqlaydi · Poygalarni o'chirish avtomobillarni saqlaydi · To'liq tiklash faqat tadbirni qoldiradi",

  onTheLine: "Startda",
  awaitingLaunch: "Start kutilmoqda",
  racingLabel: "Poyga",
  runInProgress: "Poyga davom etmoqda",
  awaitingResultsTitle: "Natija kutilmoqda",
  awaitingResultsSub: "Vaqt tasdiqlanmoqda",
  resultTitle: "Natija",
  winner: "G'olib",
  leaderboard: "Reyting",
  standingBy: "Kutilmoqda",
  elapsed: "Vaqt",
  topSpeedLabel: "Maks. tezlik",
  zeroTo100: "0-100",
  hundredTo200: "100-200",
  unitSeconds: "s",
  unitSpeed: "mph",
};

const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { en, ru, uz };

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);
}

/** Returns a lookup bound to one language, falling back to English. */
export function translator(lang: Lang) {
  const dict = DICTIONARIES[lang] ?? en;
  return (key: TranslationKey) => dict[key] ?? en[key];
}
