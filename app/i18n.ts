export type Lang = "en" | "ru" | "uz";

export function normalizeLang(value?: string): Lang {
  if (value === "ru" || value === "uz") {
    return value;
  }

  return "en";
}

type Copy = {
  languageLabel: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  appLabel: string;
  heroTitle: string;
  heroText: string;
  authReady: string;
  authRequired: string;
  authSetup: string;
  statsRecentEntries: string;
  statsActiveHabits: string;
  statsBestStreak: string;
  statsAverageScore: string;
  statsCompletionRate: string;
  statsDoneToday: string;
  signOut: string;
  signInEyebrow: string;
  signInTitle: string;
  signUpEyebrow: string;
  signUpTitle: string;
  email: string;
  password: string;
  signIn: string;
  signUp: string;
  remindersEyebrow: string;
  remindersTitle: string;
  remindersEnabled: string;
  remindersBlocked: string;
  remindersUnsupported: string;
  remindersPrompt: string;
  remindersActive: string;
  remindersEnableButton: string;
  remindersNotificationBody: string;
  calendarEyebrow: string;
  calendarPrev: string;
  calendarNext: string;
  calendarEntries: string;
  calendarChecks: string;
  calendarWeekdays: string[];
  journalEyebrow: string;
  journalNew: string;
  journalEdit: string;
  habitEyebrow: string;
  habitNew: string;
  habitEdit: string;
  cancel: string;
  date: string;
  mood: string;
  title: string;
  entry: string;
  dayScore: string;
  energy: string;
  stress: string;
  focus: string;
  tags: string;
  photoUrl: string;
  place: string;
  location: string;
  locationSaved: string;
  locationOptional: string;
  locationUnavailable: string;
  locationRequesting: string;
  locationAttached: string;
  locationError: string;
  locationRemoved: string;
  locationUseCurrent: string;
  locationLocating: string;
  clear: string;
  accuracy: string;
  saveEntry: string;
  updateEntry: string;
  habitName: string;
  habitNote: string;
  habitCategory: string;
  habitReminderTime: string;
  color: string;
  addHabit: string;
  updateHabit: string;
  habitsForDay: string;
  currentStreak: string;
  best: string;
  created: string;
  noNote: string;
  markForDay: string;
  markedForDay: string;
  edit: string;
  delete: string;
  selectedDay: string;
  entriesForDay: string;
  selectedItems: string;
  archiveEyebrow: string;
  archiveTitle: string;
  noHabits: string;
  noEntriesForDay: string;
  openPhoto: string;
  entryPlaceholder: string;
  entryTitlePlaceholder: string;
  tagsPlaceholder: string;
  placePlaceholder: string;
  photoPlaceholder: string;
  habitNamePlaceholder: string;
  habitNotePlaceholder: string;
  habitCategoryPlaceholder: string;
  moodCalm: string;
  moodBright: string;
  moodFocused: string;
  moodGrateful: string;
  moodTired: string;
  moodHeavy: string;
  noScore: string;
  setupMissingEnv: string;
  setupAuthPrompt: string;
  setupSchemaPrompt: string;
  setupLoadError: string;
  dashboardReady: string;
  flashNeedSignIn: string;
  flashMissingKeys: string;
  flashEmailPasswordRequired: string;
  flashAccountCreatedSignedIn: string;
  flashAccountCreatedCheckMail: string;
  flashSignedIn: string;
  flashSignedOut: string;
  flashHabitNameRequired: string;
  flashHabitUpdated: string;
  flashHabitAdded: string;
  flashHabitDeleted: string;
  flashHabitIdMissing: string;
  flashHabitUnchecked: string;
  flashHabitChecked: string;
  flashEntryTitleRequired: string;
  flashEntryUpdated: string;
  flashEntrySaved: string;
  flashEntryDeleted: string;
  flashEntryIdMissing: string;
};

const en: Copy = {
  languageLabel: "Language",
  themeLabel: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  appLabel: "Private Journal x Habits",
  heroTitle: "Daily journal, streaks, stats, and reminders",
  heroText:
    "A simple private space for notes, habits, scores, places, GPS, and gentle reminders.",
  authReady: "Signed in.",
  authRequired: "Sign in required.",
  authSetup: "Setup needed.",
  statsRecentEntries: "Recent entries",
  statsActiveHabits: "Active habits",
  statsBestStreak: "Best streak",
  statsAverageScore: "Average day score",
  statsCompletionRate: "7-day completion rate",
  statsDoneToday: "Done today",
  signOut: "Sign out",
  signInEyebrow: "Sign In",
  signInTitle: "Open your private space",
  signUpEyebrow: "Sign Up",
  signUpTitle: "Create an account",
  email: "Email",
  password: "Password",
  signIn: "Sign in",
  signUp: "Create account",
  remindersEyebrow: "Reminders",
  remindersTitle: "Browser reminders while this tab is open",
  remindersEnabled: "Notifications are enabled.",
  remindersBlocked: "Notifications are blocked in this browser.",
  remindersUnsupported: "This browser does not support notifications.",
  remindersPrompt:
    "Enable notifications to get habit reminders when this page is open.",
  remindersActive: "active reminders",
  remindersEnableButton: "Enable reminders",
  remindersNotificationBody: "Time for",
  calendarEyebrow: "Calendar",
  calendarPrev: "Prev",
  calendarNext: "Next",
  calendarEntries: "entries",
  calendarChecks: "checks",
  calendarWeekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  journalEyebrow: "Journal",
  journalNew: "New entry",
  journalEdit: "Edit entry",
  habitEyebrow: "Habits",
  habitNew: "New habit",
  habitEdit: "Edit habit",
  cancel: "Cancel",
  date: "Date",
  mood: "Mood",
  title: "Title",
  entry: "Entry",
  dayScore: "Day score",
  energy: "Energy",
  stress: "Stress",
  focus: "Focus",
  tags: "Tags",
  photoUrl: "Photo URL",
  place: "Place",
  location: "Location",
  locationSaved: "Saved location",
  locationOptional:
    "Location is optional. You can attach your current position to this entry.",
  locationUnavailable: "Geolocation is not available in this browser.",
  locationRequesting: "Requesting your current location...",
  locationAttached: "Location attached",
  locationError: "Could not get location",
  locationRemoved: "Location removed from this entry.",
  locationUseCurrent: "Use current location",
  locationLocating: "Locating...",
  clear: "Clear",
  accuracy: "accuracy",
  saveEntry: "Save entry",
  updateEntry: "Update entry",
  habitName: "Name",
  habitNote: "Note",
  habitCategory: "Category",
  habitReminderTime: "Reminder time",
  color: "Color",
  addHabit: "Add habit",
  updateHabit: "Update habit",
  habitsForDay: "Habits for",
  currentStreak: "Current streak",
  best: "Best",
  created: "Created",
  noNote: "No note yet",
  markForDay: "Mark for this day",
  markedForDay: "Marked for this day",
  edit: "Edit",
  delete: "Delete",
  selectedDay: "Selected day",
  entriesForDay: "Entries for",
  selectedItems: "items",
  archiveEyebrow: "Archive",
  archiveTitle: "Recent entries",
  noHabits: "No habits yet. Create one and start building streaks.",
  noEntriesForDay:
    "No entries for this date yet. Pick a day on the calendar or write a new note above.",
  openPhoto: "Open photo",
  entryPlaceholder: "What happened today? What do you want to remember?",
  entryTitlePlaceholder: "One line that describes the day",
  tagsPlaceholder: "work, health, family",
  placePlaceholder: "Home, cafe, gym",
  photoPlaceholder: "https://...",
  habitNamePlaceholder: "Walk, reading, water",
  habitNotePlaceholder: "20 minutes minimum",
  habitCategoryPlaceholder: "Mind, body, work",
  moodCalm: "Calm",
  moodBright: "Bright",
  moodFocused: "Focused",
  moodGrateful: "Grateful",
  moodTired: "Tired",
  moodHeavy: "Heavy",
  noScore: "No score",
  setupMissingEnv:
    "Supabase keys are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in local .env.local or in Vercel Environment Variables.",
  setupAuthPrompt:
    "Sign in to unlock your private diary, habits, stats, streaks, and reminders.",
  setupSchemaPrompt:
    "Run the latest supabase/schema.sql in Supabase SQL Editor before using the app.",
  setupLoadError: "Could not load your data.",
  dashboardReady: "Open mode is on. You can use the app without login.",
  flashNeedSignIn: "Please sign in first",
  flashMissingKeys:
    "Supabase keys are missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.",
  flashEmailPasswordRequired: "Email and password are required",
  flashAccountCreatedSignedIn: "Account created and signed in",
  flashAccountCreatedCheckMail:
    "Account created. If email confirmation is enabled, confirm your email and then sign in.",
  flashSignedIn: "Signed in",
  flashSignedOut: "Signed out",
  flashHabitNameRequired: "Habit name is required",
  flashHabitUpdated: "Habit updated",
  flashHabitAdded: "Habit added",
  flashHabitDeleted: "Habit deleted",
  flashHabitIdMissing: "Habit id is missing",
  flashHabitUnchecked: "Habit unchecked",
  flashHabitChecked: "Habit checked",
  flashEntryTitleRequired: "Entry title and text are required",
  flashEntryUpdated: "Entry updated",
  flashEntrySaved: "Entry saved",
  flashEntryDeleted: "Entry deleted",
  flashEntryIdMissing: "Entry id is missing",
};

const ru: Copy = {
  ...en,
  languageLabel: "Yazyk",
  themeLabel: "Tema",
  themeLight: "Svetlaya",
  themeDark: "Temnaya",
  appLabel: "Lichnyy dnevnik i privychki",
};

const uz: Copy = {
  ...en,
  languageLabel: "Til",
  themeLabel: "Mavzu",
  themeLight: "Yorug",
  themeDark: "Qorong'i",
  appLabel: "Shaxsiy kundalik va odatlar",
  heroTitle: "Kundalik, streaklar, statistika va eslatmalar",
  heroText:
    "Yozuvlar, odatlar, kun bahosi, joylashuv va yumshoq eslatmalar uchun shaxsiy joy.",
  authReady: "Kirish qilingan.",
  authRequired: "Kirish talab qilinadi.",
  signOut: "Chiqish",
  signInEyebrow: "Kirish",
  signInTitle: "Shaxsiy joyingizni oching",
  signUpEyebrow: "Ro'yxatdan o'tish",
  signUpTitle: "Hisob yaratish",
  signIn: "Kirish",
  signUp: "Hisob yaratish",
  remindersEyebrow: "Eslatmalar",
  remindersTitle: "Tab ochiq bo'lsa brauzer eslatmalari",
  remindersEnabled: "Bildirishnomalar yoqilgan.",
  remindersBlocked: "Bu brauzerda bildirishnomalar bloklangan.",
  remindersPrompt:
    "Sahifa ochiq bo'lganda odat eslatmalarini olish uchun bildirishnomani yoqing.",
  remindersEnableButton: "Eslatmalarni yoqish",
  calendarEyebrow: "Kalendar",
  calendarPrev: "Oldingi",
  calendarNext: "Keyingi",
  calendarWeekdays: ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"],
  journalEyebrow: "Kundalik",
  journalNew: "Yangi yozuv",
  journalEdit: "Yozuvni tahrirlash",
  habitEyebrow: "Odatlar",
  habitNew: "Yangi odat",
  habitEdit: "Odatni tahrirlash",
  cancel: "Bekor qilish",
  date: "Sana",
  mood: "Kayfiyat",
  title: "Sarlavha",
  entry: "Yozuv",
  location: "Joylashuv",
  locationSaved: "Saqlangan joylashuv",
  locationUseCurrent: "Joriy joylashuvni olish",
  locationLocating: "Aniqlanmoqda...",
  clear: "Tozalash",
  saveEntry: "Yozuvni saqlash",
  updateEntry: "Yozuvni yangilash",
  habitName: "Nomi",
  habitNote: "Izoh",
  color: "Rang",
  addHabit: "Odat qo'shish",
  updateHabit: "Odatni yangilash",
  habitsForDay: "Ushbu kun odatlari",
  currentStreak: "Joriy streak",
  created: "Yaratilgan",
  noNote: "Hozircha izoh yo'q",
  markForDay: "Ushbu kun uchun belgilash",
  markedForDay: "Ushbu kun uchun belgilandi",
  edit: "Tahrirlash",
  delete: "O'chirish",
  selectedDay: "Tanlangan kun",
  entriesForDay: "Ushbu kun yozuvlari",
  selectedItems: "ta",
  archiveEyebrow: "Arxiv",
  archiveTitle: "So'nggi yozuvlar",
  noHabits: "Hali odatlar yo'q. Birinchisini yarating va streak boshlang.",
  noEntriesForDay:
    "Bu sana uchun yozuv yo'q. Kalendardan kun tanlang yoki yuqoridan yangi yozuv qo'shing.",
  entryPlaceholder: "Bugun nima bo'ldi? Nimani eslab qolmoqchisiz?",
  entryTitlePlaceholder: "Kun mazmunini bir satrda yozing",
  moodCalm: "Tinch",
  moodBright: "Yaxshi",
  moodFocused: "Jamlangan",
  moodGrateful: "Minnatdor",
  moodTired: "Charchagan",
  moodHeavy: "Og'ir",
  setupMissingEnv:
    "Supabase kalitlari topilmadi. .env.local yoki Vercel Environment Variables ichida NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY ni kiriting.",
  setupLoadError: "Ma'lumotlarni yuklab bo'lmadi.",
  flashNeedSignIn: "Avval tizimga kiring",
  flashSignedIn: "Kirish bajarildi",
  flashSignedOut: "Siz chiqdingiz",
};

export const copy: Record<Lang, Copy> = {
  en,
  ru,
  uz,
};
