import Link from "next/link";

import {
  createOrUpdateHabitAction,
  createOrUpdateJournalEntryAction,
  deleteHabitAction,
  deleteJournalEntryAction,
  signInAction,
  signInWithAppleAction,
  signInWithGoogleAction,
  signOutAction,
  signUpAction,
  toggleHabitCompletionAction,
} from "@/app/actions";
import { AiCoach } from "@/app/components/ai-coach";
import { CleanUrlBar } from "@/app/components/clean-url-bar";
import { FocusTimer } from "@/app/components/focus-timer";
import { LocationField } from "@/app/components/location-field";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { copy, normalizeLang, type Lang } from "@/app/i18n";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  createSupabaseDataClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

type HabitRow = {
  id: string;
  name: string;
  note: string | null;
  color: string;
  created_at: string;
};

type HabitLogRow = {
  habit_id: string;
  completed_on: string;
};

type MotivationQuote = {
  text: string;
  author: string;
};


type JournalEntryRow = {
  id: string;
  title: string;
  body: string | null;
  content: string | null;
  mood: string;
  entry_date: string;
  latitude: number | null;
  longitude: number | null;
  location_accuracy_meters: number | null;
  created_at: string;
};

type HabitView = HabitRow & {
  completedToday: boolean;
  completedOnSelectedDate: boolean;
  currentStreak: number;
  bestStreak: number;
};

type CalendarCell = {
  iso: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  entryCount: number;
  completionCount: number;
};

type BaseDashboard = {
  user: { id: string; email: string | null } | null;
  habits: HabitView[];
  entries: JournalEntryRow[];
  selectedEntries: JournalEntryRow[];
  recentEntries: JournalEntryRow[];
  selectedDate: string;
  selectedMonth: string;
  calendarCells: CalendarCell[];
  totalHabits: number;
  completedToday: number;
  averageScore: number | null;
  completionRate: number;
  bestStreak: number;
  message: string;
};

type DashboardData = BaseDashboard & {
  status: "missing-env" | "error" | "ready";
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(
  lang: Lang,
  values: Record<string, string | null | undefined>
) {
  const params = new URLSearchParams({ lang });

  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return `/?${params.toString()}`;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDate(value?: string) {
  if (value && isValidDate(value)) {
    return value;
  }

  return getTodayIso();
}

function normalizeMonth(value: string | undefined, fallbackDate: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  return fallbackDate.slice(0, 7);
}

function startOfMonth(isoMonth: string) {
  return `${isoMonth}-01`;
}

function endOfMonth(isoMonth: string) {
  const [year, month] = isoMonth.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${isoMonth}-${String(lastDay).padStart(2, "0")}`;
}

function addMonths(isoMonth: string, delta: number) {
  const [year, month] = isoMonth.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(
    shifted.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

function getLocale(lang: Lang) {
  if (lang === "ru") {
    return "ru-RU";
  }

  if (lang === "uz") {
    return "uz-UZ";
  }

  return "en-US";
}

function formatShortDate(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(getLocale(lang), {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatLongDate(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(getLocale(lang), {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatMonthLabel(month: string, lang: Lang) {
  return new Intl.DateTimeFormat(getLocale(lang), {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function moodLabel(mood: string, lang: Lang) {
  const t = copy[lang];
  const moods: Record<string, string> = {
    calm: t.moodCalm,
    bright: t.moodBright,
    tired: t.moodTired,
    grateful: t.moodGrateful,
    focused: t.moodFocused,
    heavy: t.moodHeavy,
  };

  return moods[mood] ?? mood;
}

function formatCoordinate(value: number) {
  return value.toFixed(4);
}

function getEntryText(entry: JournalEntryRow) {
  return entry.body ?? entry.content ?? "";
}

const motivationQuotes: Record<Lang, MotivationQuote[]> = {
  ru: [
    {
      text: "Маленький шаг сегодня сильнее идеального плана завтра.",
      author: "Действуй спокойно",
    },
    {
      text: "Твоя дисциплина тише мотивации, но она приводит дальше.",
      author: "Фокус дня",
    },
    {
      text: "Не жди вдохновения, начни с двух минут и продолжай.",
      author: "Правило старта",
    },
    {
      text: "Каждая отметка привычки это голос в пользу твоего будущего.",
      author: "Личный прогресс",
    },
    {
      text: "Стабильность рождается из простых повторений.",
      author: "Ритм важнее рывка",
    },
    {
      text: "Сделай немного сейчас, и завтра станет легче.",
      author: "Шаг за шагом",
    },
  ],
  en: [
    {
      text: "A small step today beats a perfect plan tomorrow.",
      author: "Keep moving",
    },
    {
      text: "Discipline is quieter than motivation, but it lasts longer.",
      author: "Daily focus",
    },
    {
      text: "Do not wait for inspiration. Start for two minutes.",
      author: "Start rule",
    },
    {
      text: "Every checked habit is a vote for your future self.",
      author: "Personal progress",
    },
    {
      text: "Consistency grows from simple repeats.",
      author: "Rhythm over rush",
    },
    {
      text: "Do a little now, and tomorrow gets easier.",
      author: "One step at a time",
    },
  ],
  uz: [
    {
      text: "Bugungi kichik qadam ertangi mukammal rejadan yaxshiroq.",
      author: "Harakatda qoling",
    },
    {
      text: "Intizom motivatsiyadan sokinroq, lekin uzoqroq ishlaydi.",
      author: "Kundalik fokus",
    },
    {
      text: "Ilhomni kutmang. Ikki daqiqadan boshlang.",
      author: "Boshlash qoidasi",
    },
    {
      text: "Har bir belgilangan odat kelajakdagi o'zingizga ovozdir.",
      author: "Shaxsiy o'sish",
    },
    {
      text: "Barqarorlik oddiy takrorlardan tug'iladi.",
      author: "Ritm muhimroq",
    },
    {
      text: "Hozir ozgina qiling, ertaga yengil bo'ladi.",
      author: "Qadam-baqadam",
    },
  ],
};

function getMotivationQuote(lang: Lang, seedDate: string) {
  const list = motivationQuotes[lang];
  const seed = Number(seedDate.replaceAll("-", ""));
  const safeSeed = Number.isFinite(seed) ? seed : 0;
  return list[safeSeed % list.length];
}

function getStreakInfo(logs: string[], anchorDate: string) {
  const unique = Array.from(new Set(logs)).sort();
  const set = new Set(unique);
  const previousDay = (date: string) => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  let current = 0;
  let cursor = anchorDate;

  while (set.has(cursor)) {
    current += 1;
    cursor = previousDay(cursor);
  }

  let best = 0;
  let running = 0;
  let previous: string | null = null;

  unique.forEach((date) => {
    if (!previous) {
      running = 1;
    } else {
      const next = new Date(`${previous}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      running = next.toISOString().slice(0, 10) === date ? running + 1 : 1;
    }

    best = Math.max(best, running);
    previous = date;
  });

  return { current, best };
}

function buildCalendarCells(
  month: string,
  selectedDate: string,
  entryCountByDate: Map<string, number>,
  completionCountByDate: Map<string, number>
) {
  const firstDate = new Date(`${month}-01T00:00:00Z`);
  const monthIndex = firstDate.getUTCMonth();
  const startOffset = (firstDate.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstDate);
  gridStart.setUTCDate(gridStart.getUTCDate() - startOffset);
  const today = getTodayIso();

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setUTCDate(gridStart.getUTCDate() + index);
    const iso = cellDate.toISOString().slice(0, 10);

    return {
      iso,
      dayNumber: cellDate.getUTCDate(),
      inMonth: cellDate.getUTCMonth() === monthIndex,
      isToday: iso === today,
      isSelected: iso === selectedDate,
      entryCount: entryCountByDate.get(iso) ?? 0,
      completionCount: completionCountByDate.get(iso) ?? 0,
    };
  });
}

function emptyDashboard(
  status: "missing-env" | "error" | "ready",
  selectedDate: string,
  selectedMonth: string,
  message: string
): DashboardData {
  return {
    status,
    message,
    user: null,
    habits: [],
    entries: [],
    selectedEntries: [],
    recentEntries: [],
    selectedDate,
    selectedMonth,
    calendarCells: buildCalendarCells(selectedMonth, selectedDate, new Map(), new Map()),
    totalHabits: 0,
    completedToday: 0,
    averageScore: null,
    completionRate: 0,
    bestStreak: 0,
  };
}

async function adoptLegacyRowsForUser(
  supabase: Awaited<ReturnType<typeof createSupabaseDataClient>>,
  userId: string
) {
  const [ownedHabits, ownedEntries] = await Promise.all([
    supabase
      .from("habits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (!ownedHabits.error && (ownedHabits.count ?? 0) === 0) {
    await supabase
      .from("habits")
      .update({ user_id: userId })
      .is("user_id", null);
  }

  if (!ownedEntries.error && (ownedEntries.count ?? 0) === 0) {
    await supabase
      .from("journal_entries")
      .update({ user_id: userId })
      .is("user_id", null);
  }
}

async function loadDashboard(
  selectedDate: string,
  selectedMonth: string,
  lang: Lang
): Promise<DashboardData> {
  const t = copy[lang];

  if (!hasSupabaseEnv()) {
    return emptyDashboard("missing-env", selectedDate, selectedMonth, t.setupMissingEnv);
  }

  try {
    const authClient = await createSupabaseServerClient();
    const {
      data: { user: authUser },
      error: userError,
    } = await authClient.auth.getUser();

    const isMissingAuthSession =
      userError?.name === "AuthSessionMissingError" ||
      (userError?.message ?? "").toLowerCase().includes("auth session missing");

    if (userError && !isMissingAuthSession) {
      return emptyDashboard("error", selectedDate, selectedMonth, userError.message);
    }

    const user = authUser
      ? { id: authUser.id, email: authUser.email ?? null }
      : null;

    if (!user) {
      const empty = emptyDashboard("ready", selectedDate, selectedMonth, t.authRequired);
      return {
        ...empty,
        status: "ready",
        message: t.authRequired,
        user: null,
      };
    }

    const supabase = await createSupabaseDataClient();
    await adoptLegacyRowsForUser(supabase, user.id);
    const logsStartDate = `${addMonths(selectedMonth, -11)}-01`;
    const logsEndDate = endOfMonth(selectedMonth);
    const today = getTodayIso();

    const [habitsResult, entriesResult] = await Promise.all([
      supabase
        .from("habits")
        .select("id, name, note, color, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("journal_entries")
        .select(
          "id, title, body, content, mood, entry_date, latitude, longitude, location_accuracy_meters, created_at"
        )
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(120),
    ]);

    const errors = [habitsResult.error, entriesResult.error].filter(Boolean);

    const hasMissingSchema = errors.some((error) => {
      const code = error?.code ?? "";
      const message = error?.message?.toLowerCase() ?? "";

      return (
        code === "42P01" ||
        code === "42703" ||
        code === "PGRST204" ||
        message.includes("does not exist")
      );
    });

    if (hasMissingSchema) {
      return emptyDashboard("error", selectedDate, selectedMonth, t.setupSchemaPrompt);
    }

    if (errors.length > 0) {
      return emptyDashboard(
        "error",
        selectedDate,
        selectedMonth,
        errors[0]?.message ?? t.setupLoadError
      );
    }

    const habits = (habitsResult.data ?? []) as HabitRow[];
    const entries = (entriesResult.data ?? []) as JournalEntryRow[];
    let logs: HabitLogRow[] = [];
    const logsByHabit = new Map<string, string[]>();
    const completedLookup = new Set<string>();
    const entryCountByDate = new Map<string, number>();
    const completionCountByDate = new Map<string, number>();

    if (habits.length > 0) {
      const habitIds = habits.map((habit) => habit.id);
      const logsResult = await supabase
        .from("habit_logs")
        .select("habit_id, completed_on")
        .in("habit_id", habitIds)
        .gte("completed_on", logsStartDate)
        .lte("completed_on", logsEndDate)
        .order("completed_on", { ascending: false });

      if (logsResult.error) {
        return emptyDashboard(
          "error",
          selectedDate,
          selectedMonth,
          logsResult.error.message
        );
      }

      logs = (logsResult.data ?? []) as HabitLogRow[];
    }

    logs.forEach((log) => {
      const current = logsByHabit.get(log.habit_id) ?? [];
      current.push(log.completed_on);
      logsByHabit.set(log.habit_id, current);
      completedLookup.add(`${log.habit_id}:${log.completed_on}`);
      completionCountByDate.set(
        log.completed_on,
        (completionCountByDate.get(log.completed_on) ?? 0) + 1
      );
    });

    entries.forEach((entry) => {
      entryCountByDate.set(
        entry.entry_date,
        (entryCountByDate.get(entry.entry_date) ?? 0) + 1
      );
    });

    const habitsWithView: HabitView[] = habits.map((habit) => {
      const streak = getStreakInfo(logsByHabit.get(habit.id) ?? [], today);

      return {
        ...habit,
        completedToday: completedLookup.has(`${habit.id}:${today}`),
        completedOnSelectedDate: completedLookup.has(`${habit.id}:${selectedDate}`),
        currentStreak: streak.current,
        bestStreak: streak.best,
      };
    });

    const selectedEntries = entries.filter(
      (entry) => entry.entry_date === selectedDate
    );
    const recentEntries = entries.slice(0, 8);
    const averageScore = null;
    const completedToday = habitsWithView.filter((habit) => habit.completedToday)
      .length;
    const bestStreak = habitsWithView.reduce(
      (best, habit) => Math.max(best, habit.bestStreak),
      0
    );
    const last7Dates = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(`${today}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - index);
      return d.toISOString().slice(0, 10);
    });
    const completionRate =
      habitsWithView.length > 0
        ? Math.round(
            (logs.filter((log) => last7Dates.includes(log.completed_on)).length /
              (habitsWithView.length * 7)) *
              100
          )
        : 0;

    return {
      status: "ready",
      message: t.authReady,
      user,
      habits: habitsWithView,
      entries,
      selectedEntries,
      recentEntries,
      selectedDate,
      selectedMonth,
      calendarCells: buildCalendarCells(
        selectedMonth,
        selectedDate,
        entryCountByDate,
        completionCountByDate
      ),
      totalHabits: habitsWithView.length,
      completedToday,
      averageScore,
      completionRate,
      bestStreak,
    };
  } catch (error) {
    return emptyDashboard(
      "error",
      selectedDate,
      selectedMonth,
      error instanceof Error ? error.message : t.setupLoadError
    );
  }
}

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const lang = normalizeLang(readParam(params, "lang"));
  const t = copy[lang];
  const flashMessage = readParam(params, "message");
  const flashError = readParam(params, "error");
  const selectedDate = normalizeDate(readParam(params, "date"));
  const selectedMonth = normalizeMonth(readParam(params, "month"), selectedDate);
  const editEntryId = readParam(params, "editEntry");
  const editHabitId = readParam(params, "editHabit");
  const dashboard = await loadDashboard(selectedDate, selectedMonth, lang);
  const previousMonth = addMonths(selectedMonth, -1);
  const nextMonth = addMonths(selectedMonth, 1);
  const editingEntry =
    dashboard.status === "ready"
      ? dashboard.entries.find((entry) => entry.id === editEntryId) ?? null
      : null;
  const editingHabit =
    dashboard.status === "ready"
      ? dashboard.habits.find((habit) => habit.id === editHabitId) ?? null
      : null;
  const baseSelectionHref = buildHref(lang, {
    date: selectedDate,
    month: selectedMonth,
  });
  const motivationQuote = getMotivationQuote(lang, getTodayIso());
  const sideCopy =
    lang === "uz"
      ? {
          profileEyebrow: "Profil",
          onlineStatus: "Onlayn",
          roleLabel: "Rol",
          roleValue: "Flow Builder",
          streakLabel: "Eng yaxshi streak",
          gamesEyebrow: "O'yinlar",
          gamesTitle: "Faoliyat",
          emptyText: "Profil bo'sh. Kirganingizdan keyin bu yerda status va faoliyat ko'rinadi.",
          gameProgress: "Daily Quest",
          gameJournal: "Story Mode",
          gameMomentum: "Streak Arena",
          doneLabel: "bajarildi",
          entriesLabel: "yozuv",
          daysLabel: "kun",
          playingLabel: "Faol",
          idleLabel: "Pauza",
        }
      : lang === "ru"
        ? {
            profileEyebrow: "Профиль",
            onlineStatus: "В сети",
            roleLabel: "Роль",
            roleValue: "Flow Builder",
            streakLabel: "Лучший стрик",
            gamesEyebrow: "Игры",
            gamesTitle: "Активности",
            emptyText:
              "Профиль пока пустой. После входа здесь появятся статус и активности.",
            gameProgress: "Daily Quest",
            gameJournal: "Story Mode",
            gameMomentum: "Streak Arena",
            doneLabel: "сделано",
            entriesLabel: "записей",
            daysLabel: "дней",
            playingLabel: "Активно",
            idleLabel: "Пауза",
          }
        : {
            profileEyebrow: "Profile",
            onlineStatus: "Online",
            roleLabel: "Role",
            roleValue: "Flow Builder",
            streakLabel: "Best streak",
            gamesEyebrow: "Games",
            gamesTitle: "Activities",
            emptyText:
              "Profile panel is empty for now. Sign in to show status and activity.",
            gameProgress: "Daily Quest",
            gameJournal: "Story Mode",
            gameMomentum: "Streak Arena",
            doneLabel: "done",
            entriesLabel: "entries",
            daysLabel: "days",
            playingLabel: "Active",
            idleLabel: "Idle",
          };
  const profileName =
    dashboard.user?.email?.split("@")[0] ?? dashboard.user?.id.slice(0, 8) ?? "user";
  const profileTag = dashboard.user
    ? `#${dashboard.user.id.replaceAll("-", "").slice(0, 4)}`
    : "";
  const sideGames =
    dashboard.status === "ready" && dashboard.user
      ? [
          {
            name: sideCopy.gameProgress,
            details: `${dashboard.completedToday}/${dashboard.totalHabits} ${sideCopy.doneLabel}`,
            active:
              dashboard.totalHabits > 0 && dashboard.completedToday < dashboard.totalHabits,
          },
          {
            name: sideCopy.gameJournal,
            details: `${dashboard.recentEntries.length} ${sideCopy.entriesLabel}`,
            active: dashboard.recentEntries.length > 0,
          },
          {
            name: sideCopy.gameMomentum,
            details: `${dashboard.bestStreak} ${sideCopy.daysLabel}`,
            active: dashboard.bestStreak > 0,
          },
        ]
      : [];

  return (
    <main className="workspace-layout">
      <CleanUrlBar />
      <aside className="side-rail">
        <div className="side-avatar" aria-hidden />
        {dashboard.status === "ready" && dashboard.user ? (
          <>
            <section className="card side-profile side-profile-discord">
              <div className="side-profile-head">
                <div className="side-profile-presence" aria-hidden />
                <div className="stack">
                  <span className="eyebrow">{sideCopy.profileEyebrow}</span>
                  <h2>
                    {profileName}
                    <small>{profileTag}</small>
                  </h2>
                  <p className="helper side-profile-status">{sideCopy.onlineStatus}</p>
                </div>
              </div>
              <div className="side-profile-meta">
                <span className="pill">
                  {sideCopy.roleLabel}: {sideCopy.roleValue}
                </span>
                <span className="pill">
                  {sideCopy.streakLabel}: {dashboard.bestStreak}
                </span>
              </div>
              <form action={signOutAction}>
                <input name="lang" type="hidden" value={lang} />
                <button className="ghost-button" type="submit">
                  {t.signOut}
                </button>
              </form>
            </section>

            <section className="card side-games">
              <span className="eyebrow">{sideCopy.gamesEyebrow}</span>
              <h3>{sideCopy.gamesTitle}</h3>
              <div className="side-games-list">
                {sideGames.map((game) => (
                  <article className="side-game" key={game.name}>
                    <div>
                      <strong>{game.name}</strong>
                      <p className="helper">{game.details}</p>
                    </div>
                    <span className={`pill ${game.active ? "is-game-active" : ""}`}>
                      {game.active ? sideCopy.playingLabel : sideCopy.idleLabel}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="card side-placeholder">
            <p className="helper">
              {sideCopy.emptyText}
            </p>
          </section>
        )}
      </aside>

      <div className="page-shell">
      <section className="hero">
        <div className="hero-top">
          <div className="stack">
            <span className="eyebrow">{t.appLabel}</span>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroText}</p>
          </div>

          <div className="hero-actions">
            <div className="language-switch" role="group" aria-label={t.languageLabel}>
              <Link
                className={`lang-chip${lang === "ru" ? " is-active" : ""}`}
                href={buildHref("ru", {
                  date: selectedDate,
                  month: selectedMonth,
                  editEntry: editEntryId,
                  editHabit: editHabitId,
                })}
              >
                RU
              </Link>
              <Link
                className={`lang-chip${lang === "uz" ? " is-active" : ""}`}
                href={buildHref("uz", {
                  date: selectedDate,
                  month: selectedMonth,
                  editEntry: editEntryId,
                  editHabit: editHabitId,
                })}
              >
                UZ
              </Link>
              <Link
                className={`lang-chip${lang === "en" ? " is-active" : ""}`}
                href={buildHref("en", {
                  date: selectedDate,
                  month: selectedMonth,
                  editEntry: editEntryId,
                  editHabit: editHabitId,
                })}
              >
                EN
              </Link>
            </div>
            <ThemeToggle lang={lang} />
          </div>
        </div>

        <p className="hero-status">{dashboard.message}</p>

        <div className="stats-grid">
          <article className="stat-card">
            <strong>{dashboard.recentEntries.length}</strong>
            <span>{t.statsRecentEntries}</span>
          </article>
          <article className="stat-card">
            <strong>{dashboard.totalHabits}</strong>
            <span>{t.statsActiveHabits}</span>
          </article>
          <article className="stat-card">
            <strong>{dashboard.bestStreak}</strong>
            <span>{t.statsBestStreak}</span>
          </article>
          <article className="stat-card">
            <strong>
              {dashboard.averageScore === null ? "-" : dashboard.averageScore}
            </strong>
            <span>{t.statsAverageScore}</span>
          </article>
          <article className="stat-card">
            <strong>{dashboard.completionRate}%</strong>
            <span>{t.statsCompletionRate}</span>
          </article>
          <article className="stat-card">
            <strong>{dashboard.completedToday}</strong>
            <span>{t.statsDoneToday}</span>
          </article>
        </div>
      </section>

      {flashMessage ? <p className="notice success">{flashMessage}</p> : null}
      {flashError ? <p className="notice error">{flashError}</p> : null}

      {dashboard.status === "ready" && !dashboard.user ? (
        <section className="card auth-shell">
          <div className="auth-intro">
            <div>
              <span className="eyebrow">
                {lang === "ru" ? "Your private space" : lang === "uz" ? "Shaxsiy hududingiz" : "Your private space"}
              </span>
              <h2>
                {lang === "ru" ? "Return to your goals today" : lang === "uz" ? "Bugun maqsadlaringizga qayting" : "Return to your goals today"}
              </h2>
            </div>
            <p className="helper">
              {lang === "ru" ? "One quick sign-in and you are back in flow." : lang === "uz" ? "Bitta tez kirish va siz yana ritmdasiz." : "One quick sign-in and you are back in flow."}
            </p>
          </div>

          <blockquote className="auth-quote">
            <p>{motivationQuote.text}</p>
            <cite>{motivationQuote.author}</cite>
          </blockquote>

          <div className="auth-grid">
            <div className="card stack auth-card">
              <span className="eyebrow">{t.signInEyebrow}</span>
              <h3>{t.signInTitle}</h3>
              <form action={signInAction} className="stack">
                <input name="lang" type="hidden" value={lang} />
                <label className="field">
                  <span>{t.email}</span>
                  <input name="email" type="email" required />
                </label>
                <label className="field">
                  <span>{t.password}</span>
                  <input name="password" type="password" required />
                </label>
                <button className="button" type="submit">
                  {t.signIn}
                </button>
              </form>
              <div className="oauth-row">
                <form action={signInWithGoogleAction} className="oauth-form">
                  <input name="lang" type="hidden" value={lang} />
                  <button className="ghost-button oauth-button" type="submit">
                    {lang === "ru" ? "Continue with Google" : lang === "uz" ? "Google orqali kirish" : "Continue with Google"}
                  </button>
                </form>
                <form action={signInWithAppleAction} className="oauth-form">
                  <input name="lang" type="hidden" value={lang} />
                  <button className="ghost-button oauth-button" type="submit">
                    {lang === "ru" ? "Continue with Apple" : lang === "uz" ? "Apple orqali kirish" : "Continue with Apple"}
                  </button>
                </form>
              </div>
            </div>

            <form action={signUpAction} className="card stack auth-card">
              <input name="lang" type="hidden" value={lang} />
              <span className="eyebrow">{t.signUpEyebrow}</span>
              <h3>{t.signUpTitle}</h3>
              <label className="field">
                <span>{t.email}</span>
                <input name="email" type="email" required />
              </label>
              <label className="field">
                <span>{t.password}</span>
                <input name="password" type="password" required />
              </label>
              <button className="button" type="submit">
                {t.signUp}
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {dashboard.status === "ready" && dashboard.user ? (
        <>
          <section className="tools-grid">
            <FocusTimer lang={lang} />
            <AiCoach
              completionRate={dashboard.completionRate}
              completedToday={dashboard.completedToday}
              lang={lang}
              recentEntries={dashboard.recentEntries.length}
              totalHabits={dashboard.totalHabits}
            />
          </section>

          <section className="calendar-card">
            <div className="section-header">
              <div>
                <span className="eyebrow">{t.calendarEyebrow}</span>
                <h2>{formatMonthLabel(selectedMonth, lang)}</h2>
              </div>
              <div className="calendar-nav">
                <Link
                  className="ghost-button"
                  href={buildHref(lang, {
                    month: previousMonth,
                    date: startOfMonth(previousMonth),
                  })}
                >
                  {t.calendarPrev}
                </Link>
                <Link
                  className="ghost-button"
                  href={buildHref(lang, {
                    month: nextMonth,
                    date: startOfMonth(nextMonth),
                  })}
                >
                  {t.calendarNext}
                </Link>
              </div>
            </div>

            <div className="calendar-weekdays">
              {t.calendarWeekdays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {dashboard.calendarCells.map((cell) => (
                <Link
                  key={cell.iso}
                  href={buildHref(lang, {
                    month: cell.iso.slice(0, 7),
                    date: cell.iso,
                  })}
                  className={`calendar-cell${
                    cell.inMonth ? "" : " is-muted"
                  }${cell.isSelected ? " is-selected" : ""}${
                    cell.isToday ? " is-today" : ""
                  }`}
                >
                  <span>{cell.dayNumber}</span>
                  <small>
                    {cell.entryCount} {t.calendarEntries}
                  </small>
                  <small>
                    {cell.completionCount} {t.calendarChecks}
                  </small>
                </Link>
              ))}
            </div>
          </section>

          <section className="editor-grid">
            <section className="card stack" id="entry-form">
              <div className="section-header">
                <div>
                  <span className="eyebrow">{t.journalEyebrow}</span>
                  <h2>{editingEntry ? t.journalEdit : t.journalNew}</h2>
                </div>
                {editingEntry ? (
                  <Link className="ghost-button" href={baseSelectionHref}>
                    {t.cancel}
                  </Link>
                ) : null}
              </div>

              <form action={createOrUpdateJournalEntryAction} className="stack">
                <input name="lang" type="hidden" value={lang} />
                <input name="entry_id" type="hidden" value={editingEntry?.id ?? ""} />
                <input name="selected_date" type="hidden" value={selectedDate} />
                <input name="selected_month" type="hidden" value={selectedMonth} />

                <div className="split-fields">
                  <label className="field">
                    <span>{t.date}</span>
                    <input
                      name="entry_date"
                      type="date"
                      defaultValue={editingEntry?.entry_date ?? selectedDate}
                      required
                    />
                  </label>

                  <label className="field">
                    <span>{t.mood}</span>
                    <select name="mood" defaultValue={editingEntry?.mood ?? "calm"}>
                      <option value="calm">{t.moodCalm}</option>
                      <option value="bright">{t.moodBright}</option>
                      <option value="focused">{t.moodFocused}</option>
                      <option value="grateful">{t.moodGrateful}</option>
                      <option value="tired">{t.moodTired}</option>
                      <option value="heavy">{t.moodHeavy}</option>
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span>{t.title}</span>
                  <input
                    name="title"
                    type="text"
                    defaultValue={editingEntry?.title ?? ""}
                    placeholder={t.entryTitlePlaceholder}
                    required
                  />
                </label>

                <label className="field">
                  <span>{t.entry}</span>
                  <textarea
                    name="body"
                    defaultValue={editingEntry ? getEntryText(editingEntry) : ""}
                    placeholder={t.entryPlaceholder}
                    required
                  />
                </label>

                <LocationField
                  key={editingEntry?.id ?? "new-entry"}
                  initialLatitude={editingEntry?.latitude}
                  initialLongitude={editingEntry?.longitude}
                  initialAccuracy={editingEntry?.location_accuracy_meters}
                  lang={lang}
                />

                <button className="button" type="submit">
                  {editingEntry ? t.updateEntry : t.saveEntry}
                </button>
              </form>
            </section>

            <section className="card stack" id="habit-form">
              <div className="section-header">
                <div>
                  <span className="eyebrow">{t.habitEyebrow}</span>
                  <h2>{editingHabit ? t.habitEdit : t.habitNew}</h2>
                </div>
                {editingHabit ? (
                  <Link className="ghost-button" href={baseSelectionHref}>
                    {t.cancel}
                  </Link>
                ) : null}
              </div>

              <form action={createOrUpdateHabitAction} className="stack">
                <input name="lang" type="hidden" value={lang} />
                <input name="habit_id" type="hidden" value={editingHabit?.id ?? ""} />
                <input name="selected_date" type="hidden" value={selectedDate} />
                <input name="selected_month" type="hidden" value={selectedMonth} />

                <label className="field">
                  <span>{t.habitName}</span>
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingHabit?.name ?? ""}
                    placeholder={t.habitNamePlaceholder}
                    required
                  />
                </label>

                <label className="field">
                  <span>{t.habitNote}</span>
                  <input
                    name="note"
                    type="text"
                    defaultValue={editingHabit?.note ?? ""}
                    placeholder={t.habitNotePlaceholder}
                  />
                </label>

                <label className="field">
                  <span>{t.color}</span>
                  <input
                    name="color"
                    type="color"
                    defaultValue={editingHabit?.color ?? "#D9844D"}
                  />
                </label>

                <button className="button" type="submit">
                  {editingHabit ? t.updateHabit : t.addHabit}
                </button>
              </form>
            </section>
          </section>

          <section className="content-grid">
            <section className="card">
              <div className="section-header">
                <div>
                  <span className="eyebrow">{t.habitEyebrow}</span>
                  <h2>
                    {t.habitsForDay} {formatLongDate(selectedDate, lang)}
                  </h2>
                </div>
                <span className="pill">
                  {
                    dashboard.habits.filter((habit) => habit.completedOnSelectedDate)
                      .length
                  }
                  /{dashboard.habits.length}
                </span>
              </div>
              <div className="habit-list">
                {dashboard.habits.length > 0 ? (
                  dashboard.habits.map((habit) => (
                    <article className="habit-card" key={habit.id}>
                      <div className="habit-head">
                        <div className="habit-title-wrap">
                          <span
                            className="habit-dot"
                            style={{ backgroundColor: habit.color }}
                          />
                          <div className="stack">
                            <h3 className="habit-title">{habit.name}</h3>
                            <p className="meta">{habit.note || t.noNote}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pill-row">
                        <span className="pill">
                          {t.currentStreak} {habit.currentStreak}
                        </span>
                        <span className="pill">
                          {t.best} {habit.bestStreak}
                        </span>
                        <span className="pill">
                          {t.created} {formatShortDate(habit.created_at.slice(0, 10), lang)}
                        </span>
                      </div>

                      <form action={toggleHabitCompletionAction}>
                        <input name="lang" type="hidden" value={lang} />
                        <input name="habit_id" type="hidden" value={habit.id} />
                        <input
                          name="completed"
                          type="hidden"
                          value={String(habit.completedOnSelectedDate)}
                        />
                        <input
                          name="selected_date"
                          type="hidden"
                          value={selectedDate}
                        />
                        <input
                          name="selected_month"
                          type="hidden"
                          value={selectedMonth}
                        />
                        <button
                          className={`toggle-button${
                            habit.completedOnSelectedDate ? " is-done" : ""
                          }`}
                          type="submit"
                        >
                          {habit.completedOnSelectedDate
                            ? t.markedForDay
                            : t.markForDay}
                        </button>
                      </form>

                      <div className="row-actions">
                        <Link
                          className="ghost-button"
                          href={`${buildHref(lang, {
                            date: selectedDate,
                            month: selectedMonth,
                            editHabit: habit.id,
                          })}#habit-form`}
                        >
                          {t.edit}
                        </Link>
                        <form action={deleteHabitAction}>
                          <input name="lang" type="hidden" value={lang} />
                          <input name="habit_id" type="hidden" value={habit.id} />
                          <input
                            name="selected_date"
                            type="hidden"
                            value={selectedDate}
                          />
                          <input
                            name="selected_month"
                            type="hidden"
                            value={selectedMonth}
                          />
                          <button className="danger-button" type="submit">
                            {t.delete}
                          </button>
                        </form>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">
                    {t.noHabits}
                  </p>
                )}
              </div>
            </section>

            <section className="card">
              <div className="section-header">
                <div>
                  <span className="eyebrow">{t.selectedDay}</span>
                  <h2>
                    {t.entriesForDay} {formatLongDate(selectedDate, lang)}
                  </h2>
                </div>
                <span className="pill">
                  {dashboard.selectedEntries.length} {t.selectedItems}
                </span>
              </div>

              <div className="entry-list">
                {dashboard.selectedEntries.length > 0 ? (
                  dashboard.selectedEntries.map((entry) => (
                    <article className="entry-card" key={entry.id}>
                      <div className="pill-row">
                        <span className="pill">{moodLabel(entry.mood, lang)}</span>
                        {entry.latitude !== null && entry.longitude !== null ? (
                          <span className="pill">
                            {formatCoordinate(entry.latitude)}, {formatCoordinate(entry.longitude)}
                          </span>
                        ) : null}
                      </div>

                      <h3>{entry.title}</h3>
                      <p>{getEntryText(entry)}</p>

                      <div className="row-actions">
                        <Link
                          className="ghost-button"
                          href={`${buildHref(lang, {
                            date: entry.entry_date,
                            month: entry.entry_date.slice(0, 7),
                            editEntry: entry.id,
                          })}#entry-form`}
                        >
                          {t.edit}
                        </Link>
                        <form action={deleteJournalEntryAction}>
                          <input name="lang" type="hidden" value={lang} />
                          <input name="entry_id" type="hidden" value={entry.id} />
                          <input
                            name="entry_date"
                            type="hidden"
                            value={entry.entry_date}
                          />
                          <input
                            name="selected_month"
                            type="hidden"
                            value={entry.entry_date.slice(0, 7)}
                          />
                          <button className="danger-button" type="submit">
                            {t.delete}
                          </button>
                        </form>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">
                    {t.noEntriesForDay}
                  </p>
                )}
              </div>
            </section>
          </section>

          <section className="card">
            <div className="section-header">
              <div>
                <span className="eyebrow">{t.archiveEyebrow}</span>
                <h2>{t.archiveTitle}</h2>
              </div>
            </div>

            <div className="entry-list compact-list">
              {dashboard.recentEntries.length > 0 ? (
                dashboard.recentEntries.map((entry) => (
                  <article className="entry-card compact-card" key={entry.id}>
                    <div className="section-header">
                      <div>
                        <h3>{entry.title}</h3>
                        <p className="meta">{formatLongDate(entry.entry_date, lang)}</p>
                      </div>
                      <div className="pill-row">
                        <span className="pill">{moodLabel(entry.mood, lang)}</span>
                      </div>
                    </div>
                    <p>{getEntryText(entry)}</p>
                  </article>
                ))
              ) : (
                <p className="empty-state">{t.noEntriesForDay}</p>
              )}
            </div>
          </section>
        </>
      ) : null}
      </div>
    </main>
  );
}


