"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { copy, normalizeLang } from "@/app/i18n";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  createSupabaseDataClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function cloneFormData(formData: FormData) {
  const clone = new FormData();

  formData.forEach((value, key) => {
    clone.append(key, value);
  });

  return clone;
}

function getOptionalValue(formData: FormData, key: string) {
  const value = getValue(formData, key);
  return value || null;
}

function getNumberValue(formData: FormData, key: string) {
  const value = getValue(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getLang(formData?: FormData) {
  return normalizeLang(formData ? getValue(formData, "lang") : undefined);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isIsoMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

function getNavigationExtras(formData: FormData) {
  const selectedDateValue = getValue(formData, "selected_date");
  const entryDateValue = getValue(formData, "entry_date");
  const selectedMonthValue = getValue(formData, "selected_month");

  const date = isIsoDate(selectedDateValue)
    ? selectedDateValue
    : isIsoDate(entryDateValue)
      ? entryDateValue
      : undefined;
  const month = isIsoMonth(selectedMonthValue)
    ? selectedMonthValue
    : date
      ? date.slice(0, 7)
      : undefined;

  return { date, month };
}

function redirectWith(
  type: "message" | "error",
  text: string,
  extras?: Record<string, string | null | undefined>
): never {
  const params = new URLSearchParams({
    [type]: text.slice(0, 200),
  });

  Object.entries(extras ?? {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const lang = extras?.lang;
  if (lang) {
    params.set("lang", lang);
  }

  redirect(`/?${params.toString()}`);
}

function getNoRowsAffectedMessage(entity: "habit" | "entry") {
  return entity === "habit"
    ? "Could not change habit. It may not belong to your account anymore."
    : "Could not change journal entry. It may not belong to your account anymore.";
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const explicitOrigin = headerStore.get("origin");

  if (explicitOrigin) {
    return explicitOrigin;
  }

  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (host) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

async function signInWithOAuth(
  provider: "google" | "apple",
  formData: FormData
) {
  const lang = getLang(formData);
  const t = copy[lang];

  if (!hasSupabaseEnv()) {
    redirectWith("error", t.flashMissingKeys, { lang });
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", "/");
  callbackUrl.searchParams.set("lang", lang);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    redirectWith("error", error.message, { lang });
  }

  if (!data.url) {
    redirectWith("error", "OAuth provider URL is missing.", { lang });
  }

  redirect(data.url);
}

async function getAuthContext(lang: ReturnType<typeof getLang>) {
  const t = copy[lang];

  if (!hasSupabaseEnv()) {
    redirectWith("error", t.flashMissingKeys, { lang });
  }

  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error) {
    redirectWith("error", error.message, { lang });
  }

  if (!user) {
    redirectWith("error", t.flashNeedSignIn, { lang });
  }

  const supabase = await createSupabaseDataClient();
  return { supabase, user };
}

export async function signUpAction(formData: FormData) {
  const lang = getLang(formData);
  const t = copy[lang];

  if (!hasSupabaseEnv()) {
    redirectWith("error", t.flashMissingKeys, { lang });
  }

  const email = getValue(formData, "email");
  const password = getValue(formData, "password");

  if (!email || !password) {
    redirectWith("error", t.flashEmailPasswordRequired, { lang });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirectWith("error", error.message, { lang });
  }

  if (data.session) {
    redirectWith("message", t.flashAccountCreatedSignedIn, { lang });
  }

  redirectWith("message", t.flashAccountCreatedCheckMail, { lang });
}

export async function signInAction(formData: FormData) {
  const lang = getLang(formData);
  const t = copy[lang];

  if (!hasSupabaseEnv()) {
    redirectWith("error", t.flashMissingKeys, { lang });
  }

  const email = getValue(formData, "email");
  const password = getValue(formData, "password");

  if (!email || !password) {
    redirectWith("error", t.flashEmailPasswordRequired, { lang });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWith("error", error.message, { lang });
  }

  redirectWith("message", t.flashSignedIn, { lang });
}

export async function signOutAction(formData: FormData) {
  const lang = getLang(formData);
  const t = copy[lang];

  if (!hasSupabaseEnv()) {
    redirectWith("error", t.flashMissingKeys, { lang });
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirectWith("message", t.flashSignedOut, { lang });
}

export async function signInWithGoogleAction(formData: FormData) {
  return signInWithOAuth("google", formData);
}

export async function signInWithAppleAction(formData: FormData) {
  return signInWithOAuth("apple", formData);
}

export async function createOrUpdateHabitAction(formData: FormData) {
  const lang = getLang(formData);
  const t = copy[lang];
  const { supabase, user } = await getAuthContext(lang);
  const habitId = getValue(formData, "habit_id") || getValue(formData, "id");
  const name = getValue(formData, "name");
  const note = getOptionalValue(formData, "note");
  const color = getValue(formData, "color") || "#D9844D";
  const nav = getNavigationExtras(formData);

  if (!name) {
    redirectWith("error", t.flashHabitNameRequired, { ...nav, lang });
  }

  const payload = {
    name,
    note,
    color,
  };

  if (habitId) {
    const { data, error } = await supabase
      .from("habits")
      .update(payload)
      .eq("id", habitId)
      .eq("user_id", user.id)
      .select("id");

    if (error) {
      redirectWith("error", error.message, { ...nav, lang });
    }

    if (!data || data.length === 0) {
      redirectWith("error", getNoRowsAffectedMessage("habit"), { ...nav, lang });
    }
  } else {
    const { error } = await supabase.from("habits").insert({
      ...payload,
      user_id: user.id,
    });

    if (error) {
      redirectWith("error", error.message, { ...nav, lang });
    }
  }

  revalidatePath("/");
  redirectWith("message", habitId ? t.flashHabitUpdated : t.flashHabitAdded, {
    ...nav,
    lang,
  });
}

export async function deleteHabitAction(formData: FormData) {
  const lang = getLang(formData);
  const t = copy[lang];
  const { supabase, user } = await getAuthContext(lang);
  const habitId = getValue(formData, "habit_id") || getValue(formData, "id");
  const nav = getNavigationExtras(formData);

  if (!habitId) {
    redirectWith("error", t.flashHabitIdMissing, { ...nav, lang });
  }

  const { data: ownedHabit, error: ownedHabitError } = await supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedHabitError) {
    redirectWith("error", ownedHabitError.message, { ...nav, lang });
  }

  if (!ownedHabit) {
    redirectWith("error", getNoRowsAffectedMessage("habit"), { ...nav, lang });
  }

  const { error: logsError } = await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", habitId);

  if (logsError) {
    redirectWith("error", logsError.message, { ...nav, lang });
  }

  const { data, error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    redirectWith("error", error.message, { ...nav, lang });
  }

  if (!data || data.length === 0) {
    redirectWith("error", getNoRowsAffectedMessage("habit"), { ...nav, lang });
  }

  revalidatePath("/");
  redirectWith("message", t.flashHabitDeleted, { ...nav, lang });
}

export async function toggleHabitCompletionAction(formData: FormData) {
  const lang = getLang(formData);
  const t = copy[lang];
  const { supabase, user } = await getAuthContext(lang);
  const habitId = getValue(formData, "habit_id");
  const completed = getValue(formData, "completed") === "true";
  const selectedDate = getValue(formData, "selected_date");
  const selectedMonth = getValue(formData, "selected_month");
  const targetDate = selectedDate || new Date().toISOString().slice(0, 10);
  const month = isIsoMonth(selectedMonth) ? selectedMonth : targetDate.slice(0, 7);

  if (!habitId) {
    redirectWith("error", t.flashHabitIdMissing, {
      date: targetDate,
      month,
      lang,
    });
  }

  const { data: ownedHabit, error: ownedHabitError } = await supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownedHabitError) {
    redirectWith("error", ownedHabitError.message, {
      date: targetDate,
      month,
      lang,
    });
  }

  if (!ownedHabit) {
    redirectWith("error", getNoRowsAffectedMessage("habit"), {
      date: targetDate,
      month,
      lang,
    });
  }

  if (completed) {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("completed_on", targetDate);

    if (error) {
      redirectWith("error", error.message, {
        date: targetDate,
        month,
        lang,
      });
    }

    revalidatePath("/");
    redirectWith("message", t.flashHabitUnchecked, {
      date: targetDate,
      month,
      lang,
    });
  }

  const { error } = await supabase.from("habit_logs").upsert(
    {
      habit_id: habitId,
      completed_on: targetDate,
    },
    {
      onConflict: "habit_id,completed_on",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    redirectWith("error", error.message, {
      date: targetDate,
      month,
      lang,
    });
  }

  revalidatePath("/");
  redirectWith("message", t.flashHabitChecked, {
    date: targetDate,
    month,
    lang,
  });
}

export async function createOrUpdateJournalEntryAction(formData: FormData) {
  const lang = getLang(formData);
  const t = copy[lang];
  const { supabase, user } = await getAuthContext(lang);
  const entryId = getValue(formData, "entry_id");
  const title = getValue(formData, "title");
  const body = getValue(formData, "body");
  const mood = getValue(formData, "mood") || "calm";
  const entryDate = getValue(formData, "entry_date") || new Date().toISOString().slice(0, 10);
  const selectedMonth = getValue(formData, "selected_month");
  const month = isIsoMonth(selectedMonth) ? selectedMonth : entryDate.slice(0, 7);
  const latitude = getNumberValue(formData, "latitude");
  const longitude = getNumberValue(formData, "longitude");
  const locationAccuracyMeters = getNumberValue(formData, "location_accuracy_meters");

  if (!title || !body) {
    redirectWith("error", t.flashEntryTitleRequired, {
      date: entryDate,
      month,
      lang,
    });
  }

  const payload = {
    title,
    body,
    content: body,
    mood,
    entry_date: entryDate,
    latitude,
    longitude,
    location_accuracy_meters: locationAccuracyMeters,
  };

  if (entryId) {
    const { data, error } = await supabase
      .from("journal_entries")
      .update(payload)
      .eq("id", entryId)
      .eq("user_id", user.id)
      .select("id");

    if (error) {
      redirectWith("error", error.message, { date: entryDate, month, lang });
    }

    if (!data || data.length === 0) {
      redirectWith("error", getNoRowsAffectedMessage("entry"), {
        date: entryDate,
        month,
        lang,
      });
    }
  } else {
    const { error } = await supabase.from("journal_entries").insert({
      ...payload,
      user_id: user.id,
    });

    if (error) {
      redirectWith("error", error.message, { date: entryDate, month, lang });
    }
  }

  revalidatePath("/");
  redirectWith("message", entryId ? t.flashEntryUpdated : t.flashEntrySaved, {
    date: entryDate,
    month,
    lang,
  });
}

export async function deleteJournalEntryAction(formData: FormData) {
  const lang = getLang(formData);
  const t = copy[lang];
  const { supabase, user } = await getAuthContext(lang);
  const entryId = getValue(formData, "entry_id");
  const entryDate = getValue(formData, "entry_date");
  const selectedMonth = getValue(formData, "selected_month");
  const month = isIsoMonth(selectedMonth)
    ? selectedMonth
    : isIsoDate(entryDate)
      ? entryDate.slice(0, 7)
      : undefined;

  if (!entryId) {
    redirectWith("error", t.flashEntryIdMissing, { date: entryDate, month, lang });
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    redirectWith("error", error.message, { date: entryDate, month, lang });
  }

  if (!data || data.length === 0) {
    redirectWith("error", getNoRowsAffectedMessage("entry"), {
      date: entryDate,
      month,
      lang,
    });
  }

  revalidatePath("/");
  redirectWith("message", t.flashEntryDeleted, { date: entryDate, month, lang });
}

export async function updateHabit(formData: FormData) {
  const adapted = cloneFormData(formData);

  if (!getValue(adapted, "habit_id")) {
    const legacyId = getValue(formData, "id");

    if (legacyId) {
      adapted.set("habit_id", legacyId);
    }
  }

  return createOrUpdateHabitAction(adapted);
}

export async function deleteHabit(formData: FormData) {
  const adapted = cloneFormData(formData);

  if (!getValue(adapted, "habit_id")) {
    const legacyId = getValue(formData, "id");

    if (legacyId) {
      adapted.set("habit_id", legacyId);
    }
  }

  return deleteHabitAction(adapted);
}
