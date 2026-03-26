"use client";

import { useMemo, useState, useEffect } from "react";

import { type Lang } from "@/app/i18n";

type TimerKey = "focus" | "deep" | "break";

type TimerMode = {
  key: TimerKey;
  label: string;
  seconds: number;
};

function getCopy(lang: Lang) {
  if (lang === "ru") {
    return {
      badge: "Таймер",
      title: "Таймер фокуса",
      subtitle: "Помодоро и короткие перерывы.",
      start: "Старт",
      pause: "Пауза",
      reset: "Сброс",
      completed: "Завершено сессий",
      customLabel: "Свое время (мин)",
      applyCustom: "Применить",
      invalidCustom: "Введи от 1 до 240 минут",
      modeFocus: "Фокус 25",
      modeDeep: "Глубокая 50",
      modeBreak: "Перерыв 5",
    };
  }

  if (lang === "uz") {
    return {
      badge: "Taymer",
      title: "Fokus taymeri",
      subtitle: "Pomodoro va qisqa tanaffuslar.",
      start: "Boshlash",
      pause: "Pauza",
      reset: "Qayta",
      completed: "Tugatilgan sessiyalar",
      customLabel: "Mos vaqt (daq)",
      applyCustom: "Qo'llash",
      invalidCustom: "1 dan 240 daqiqagacha kiriting",
      modeFocus: "Fokus 25",
      modeDeep: "Chuqur 50",
      modeBreak: "Tanaffus 5",
    };
  }

  return {
    badge: "Timer",
    title: "Focus timer",
    subtitle: "Pomodoro and short breaks.",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    completed: "Sessions completed",
    customLabel: "Custom time (min)",
    applyCustom: "Apply",
    invalidCustom: "Enter 1 to 240 minutes",
    modeFocus: "Focus 25",
    modeDeep: "Deep 50",
    modeBreak: "Break 5",
  };
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const restSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${restSeconds}`;
}

export function FocusTimer({ lang }: { lang: Lang }) {
  const t = useMemo(() => getCopy(lang), [lang]);
  const modes = useMemo<TimerMode[]>(
    () => [
      { key: "focus", label: t.modeFocus, seconds: 25 * 60 },
      { key: "deep", label: t.modeDeep, seconds: 50 * 60 },
      { key: "break", label: t.modeBreak, seconds: 5 * 60 },
    ],
    [t.modeFocus, t.modeDeep, t.modeBreak]
  );

  const [activeKey, setActiveKey] = useState<TimerKey>("focus");
  const activeMode = modes.find((item) => item.key === activeKey) ?? modes[0];
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [customMinutes, setCustomMinutes] = useState("25");
  const [customError, setCustomError] = useState("");

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setCompletedSessions((count) => count + 1);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  function pickMode(mode: TimerMode) {
    setActiveKey(mode.key);
    setSecondsLeft(mode.seconds);
    setCustomMinutes(String(Math.max(1, Math.round(mode.seconds / 60))));
    setRunning(false);
    setCustomError("");
  }

  function resetTimer() {
    setSecondsLeft(activeMode.seconds);
    setRunning(false);
  }

  function applyCustomMinutes() {
    const parsed = Number(customMinutes);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 240) {
      setCustomError(t.invalidCustom);
      return;
    }

    setRunning(false);
    setSecondsLeft(parsed * 60);
    setCustomError("");
  }

  return (
    <section className="card timer-card">
      <div className="section-header">
        <div>
          <span className="eyebrow">{t.badge}</span>
          <h2>{t.title}</h2>
        </div>
      </div>

      <p className="helper">{t.subtitle}</p>

      <div className="timer-presets">
        {modes.map((mode) => (
          <button
            className={`ghost-button ${activeMode.key === mode.key ? "is-active-mode" : ""}`}
            key={mode.key}
            onClick={() => pickMode(mode)}
            type="button"
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="timer-custom">
        <label className="field">
          <span>{t.customLabel}</span>
          <input
            inputMode="numeric"
            max={240}
            min={1}
            onChange={(event) => setCustomMinutes(event.target.value)}
            value={customMinutes}
          />
        </label>
        <button className="ghost-button" onClick={applyCustomMinutes} type="button">
          {t.applyCustom}
        </button>
      </div>

      {customError ? <p className="notice error">{customError}</p> : null}

      <div className="timer-display">{formatTime(secondsLeft)}</div>

      <div className="timer-controls">
        <button className="button" onClick={() => setRunning((v) => !v)} type="button">
          {running ? t.pause : t.start}
        </button>
        <button className="ghost-button" onClick={resetTimer} type="button">
          {t.reset}
        </button>
      </div>

      <p className="helper">
        {t.completed}: <strong>{completedSessions}</strong>
      </p>
    </section>
  );
}
