"use client";

import { useEffect, useMemo, useState } from "react";

import { copy, type Lang } from "@/app/i18n";

type ReminderHabit = {
  id: string;
  name: string;
  reminderTime: string | null;
  completedToday: boolean;
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTimeValue() {
  return new Date().toTimeString().slice(0, 5);
}

export function ReminderCenter({
  habits,
  lang,
}: {
  habits: ReminderHabit[];
  lang: Lang;
}) {
  const t = copy[lang];
  const reminderTitle = t.remindersEyebrow;
  const reminderBody = t.remindersNotificationBody;
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );

  const activeReminders = useMemo(
    () => habits.filter((habit) => habit.reminderTime && !habit.completedToday),
    [habits]
  );

  useEffect(() => {
    if (permission !== "granted" || activeReminders.length === 0) {
      return;
    }

    const tick = () => {
      const now = getCurrentTimeValue();
      const today = getTodayKey();

      activeReminders.forEach((habit) => {
        if (habit.reminderTime !== now) {
          return;
        }

        const storageKey = `habit-reminder:${habit.id}:${today}:${now}`;

        if (window.localStorage.getItem(storageKey)) {
          return;
        }

        window.localStorage.setItem(storageKey, "sent");
        new Notification(reminderTitle, {
          body: `${reminderBody} "${habit.name}"`,
        });
      });
    };

    tick();
    const interval = window.setInterval(tick, 30000);
    return () => window.clearInterval(interval);
  }, [activeReminders, permission, reminderBody, reminderTitle]);

  async function enable() {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
  }

  return (
    <div className="reminder-box">
      <div className="stack">
        <span className="eyebrow">{t.remindersEyebrow}</span>
        <h3>{t.remindersTitle}</h3>
        <p className="helper">
          {permission === "granted"
            ? t.remindersEnabled
            : permission === "denied"
              ? t.remindersBlocked
              : permission === "unsupported"
                ? t.remindersUnsupported
                : t.remindersPrompt}
        </p>
      </div>

      <div className="pill-row">
        <span className="pill">
          {activeReminders.length} {t.remindersActive}
        </span>
        {permission !== "granted" && permission !== "unsupported" ? (
          <button className="ghost-button" onClick={enable} type="button">
            {t.remindersEnableButton}
          </button>
        ) : null}
      </div>
    </div>
  );
}
