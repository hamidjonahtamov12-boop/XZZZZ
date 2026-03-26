"use client";

import { FormEvent, useMemo, useState } from "react";

import { type Lang } from "@/app/i18n";

type Message = {
  role: "assistant" | "user";
  text: string;
};

type AiCoachProps = {
  lang: Lang;
  totalHabits: number;
  completedToday: number;
  completionRate: number;
  recentEntries: number;
};

function getCopy(lang: Lang) {
  if (lang === "ru") {
    return {
      title: "AI помощник",
      subtitle:
        "Работает с GPT при наличии ключа. Без ключа — бесплатный локальный режим.",
      placeholder: "Спроси: как составить план, как держать фокус...",
      send: "Отправить",
      quick1: "Составь план на день",
      quick2: "Как войти в фокус",
      quick3: "Дай идеи привычек",
      intro: "Готов помочь с планированием, фокусом и привычками.",
      thinking: "Думаю...",
      fallbackError:
        "Не удалось получить ответ. Попробуй ещё раз через пару секунд.",
    };
  }

  if (lang === "uz") {
    return {
      title: "AI yordamchi",
      subtitle:
        "Kalit bo'lsa GPT ishlaydi. Kalitsiz bepul lokal rejim ishlaydi.",
      placeholder: "So'rang: kun rejasini tuz, fokusni yaxshila, odatlar taklif qil...",
      send: "Yuborish",
      quick1: "Kunimni rejalashtir",
      quick2: "Qanday fokusga kiraman",
      quick3: "Odatlar bo'yicha g'oyalar ber",
      intro: "Reja, fokus va odatlar bo'yicha yordam bera olaman.",
      thinking: "O'ylayapman...",
      fallbackError: "Javob olib bo'lmadi. Bir necha soniyadan keyin yana urinib ko'ring.",
    };
  }

  return {
    title: "AI coach",
    subtitle:
      "Uses GPT when key is set. Without a key it switches to free local mode.",
    placeholder: "Ask: plan my day, improve focus, suggest habits...",
    send: "Send",
    quick1: "Plan my day",
    quick2: "How to get focused",
    quick3: "Suggest habit ideas",
    intro: "I can help with planning, focus, and habits.",
    thinking: "Thinking...",
    fallbackError: "Could not get a reply. Please try again in a few seconds.",
  };
}

export function AiCoach(props: AiCoachProps) {
  const t = useMemo(() => getCopy(props.lang), [props.lang]);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: t.intro },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [t.quick1, t.quick2, t.quick3];

  async function submitPrompt(rawText: string) {
    const text = rawText.trim();

    if (!text || loading) {
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          lang: props.lang,
          stats: {
            totalHabits: props.totalHabits,
            completedToday: props.completedToday,
            completionRate: props.completionRate,
            recentEntries: props.recentEntries,
          },
        }),
      });

      const payload = (await response.json()) as { reply?: string; error?: string };

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: payload.reply || payload.error || t.fallbackError,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: t.fallbackError,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitPrompt(input);
  }

  return (
    <section className="card ai-card">
      <div className="section-header">
        <div>
          <span className="eyebrow">AI</span>
          <h2>{t.title}</h2>
        </div>
      </div>

      <p className="helper">{t.subtitle}</p>

      <div className="ai-quick">
        {quickPrompts.map((item) => (
          <button
            key={item}
            className="ghost-button"
            onClick={() => void submitPrompt(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="ai-chat-log" aria-live="polite">
        {messages.map((message, index) => (
          <p
            className={`ai-message ${message.role === "user" ? "is-user" : "is-assistant"}`}
            key={`${message.role}-${index}`}
          >
            {message.text}
          </p>
        ))}
        {loading ? <p className="ai-message is-assistant">{t.thinking}</p> : null}
      </div>

      <form className="ai-form" onSubmit={onSubmit}>
        <input
          onChange={(event) => setInput(event.target.value)}
          placeholder={t.placeholder}
          value={input}
        />
        <button className="button" disabled={loading} type="submit">
          {t.send}
        </button>
      </form>
    </section>
  );
}
