import { NextRequest, NextResponse } from "next/server";

type CoachPayload = {
  prompt?: string;
  lang?: "ru" | "en" | "uz";
  stats?: {
    totalHabits?: number;
    completedToday?: number;
    completionRate?: number;
    recentEntries?: number;
  };
};

function buildLocalReply(
  lang: "ru" | "en" | "uz",
  prompt: string,
  stats: NonNullable<CoachPayload["stats"]>
) {
  const q = prompt.toLowerCase();
  const statsLine =
    lang === "ru"
      ? `Контекст: привычек ${stats.totalHabits ?? 0}, сделано сегодня ${stats.completedToday ?? 0}, выполнение ${stats.completionRate ?? 0}%, записей ${stats.recentEntries ?? 0}.`
      : `Context: ${stats.totalHabits ?? 0} habits, ${stats.completedToday ?? 0} done today, ${stats.completionRate ?? 0}% completion, ${stats.recentEntries ?? 0} entries.`;

  if (q.includes("план") || q.includes("plan")) {
    return lang === "ru"
      ? `${statsLine} План: 1) выбери 3 важные задачи, 2) запусти 2 сессии по 25 минут, 3) закрой одну маленькую задачу прямо сейчас.`
      : `${statsLine} Plan: 1) pick 3 important tasks, 2) run two 25-minute sessions, 3) close one tiny task right now.`;
  }

  if (
    q.includes("фокус") ||
    q.includes("focus") ||
    q.includes("прокраст")
  ) {
    return lang === "ru"
      ? `${statsLine} Протокол фокуса: таймер 25:00, одна задача, телефон в беззвучный, после — перерыв 5 минут.`
      : `${statsLine} Focus protocol: 25:00 timer, one task only, phone on silent, then a 5-minute break.`;
  }

  if (q.includes("привыч") || q.includes("habit") || q.includes("idea")) {
    return lang === "ru"
      ? `${statsLine} Идеи микро-привычек: стакан воды утром, 10 минут ходьбы, 5 минут дневника вечером. Начни с одной на 7 дней.`
      : `${statsLine} Micro-habit ideas: morning water, 10-minute walk, 5-minute evening journal. Start with one for 7 days.`;
  }

  return lang === "ru"
    ? `${statsLine} Начни просто: сформулируй одну цель на сегодня и запусти таймер на 25 минут.`
    : `${statsLine} Start simple: set one goal for today and start a 25-minute timer.`;
}

function toReplyText(responseJson: unknown): string {
  if (!responseJson || typeof responseJson !== "object") {
    return "";
  }

  const directText =
    "output_text" in responseJson && typeof responseJson.output_text === "string"
      ? responseJson.output_text
      : "";

  if (directText) {
    return directText.trim();
  }

  if (!("output" in responseJson) || !Array.isArray(responseJson.output)) {
    return "";
  }

  const parts: string[] = [];

  responseJson.output.forEach((item: unknown) => {
    if (!item || typeof item !== "object") {
      return;
    }

    if (!("content" in item) || !Array.isArray(item.content)) {
      return;
    }

    item.content.forEach((contentItem: unknown) => {
      if (
        contentItem &&
        typeof contentItem === "object" &&
        "type" in contentItem &&
        contentItem.type === "output_text" &&
        "text" in contentItem &&
        typeof contentItem.text === "string"
      ) {
        parts.push(contentItem.text);
      }
    });
  });

  return parts.join("\n").trim();
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as CoachPayload;
  const lang =
    payload.lang === "ru" || payload.lang === "uz" ? payload.lang : "en";
  const prompt = (payload.prompt ?? "").trim();
  const stats = payload.stats ?? {};

  if (!prompt) {
    return NextResponse.json(
      { error: lang === "ru" ? "Пустой запрос." : "Empty prompt." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      reply: buildLocalReply(lang, prompt, stats),
      mode: "local",
    });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const systemPrompt =
    lang === "ru"
      ? "Ты краткий и практичный коуч по продуктивности. Отвечай на русском, по шагам."
      : "You are a concise productivity coach. Reply in practical clear steps.";
  const contextLine =
    lang === "ru"
      ? `Контекст: привычек ${stats.totalHabits ?? 0}, сделано сегодня ${stats.completedToday ?? 0}, выполнение ${stats.completionRate ?? 0}%, записей ${stats.recentEntries ?? 0}.`
      : `Context: ${stats.totalHabits ?? 0} habits, ${stats.completedToday ?? 0} done today, ${stats.completionRate ?? 0}% completion, ${stats.recentEntries ?? 0} entries.`;

  try {
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: `${contextLine}\n\n${prompt}` }],
          },
        ],
        max_output_tokens: 350,
      }),
    });

    const json = (await openaiResponse.json()) as unknown;

    if (!openaiResponse.ok) {
      return NextResponse.json({
        reply: buildLocalReply(lang, prompt, stats),
        mode: "local",
      });
    }

    const reply = toReplyText(json);

    if (!reply) {
      return NextResponse.json({
        reply: buildLocalReply(lang, prompt, stats),
        mode: "local",
      });
    }

    return NextResponse.json({ reply, mode: "gpt" });
  } catch {
    return NextResponse.json({
      reply: buildLocalReply(lang, prompt, stats),
      mode: "local",
    });
  }
}
