export type Platform = "Instagram" | "TikTok" | "Facebook" | "Online store";
export type Tone = "professional" | "friendly" | "persuasive" | "funny";

export const PLATFORMS: Platform[] = [
  "Instagram",
  "TikTok",
  "Facebook",
  "Online store",
];

export const TONES: { id: Tone; label: string; emoji: string }[] = [
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "friendly", label: "Friendly", emoji: "😊" },
  { id: "persuasive", label: "Persuasive", emoji: "🎯" },
  { id: "funny", label: "Funny", emoji: "😄" },
];

export const LANGUAGES = [
  "English",
  "Persian (فارسی)",
  "Arabic (العربية)",
  "Spanish (Español)",
  "French (Français)",
  "German (Deutsch)",
  "Turkish (Türkçe)",
  "Portuguese (Português)",
  "Russian (Русский)",
  "Hindi (हन)",
  "Chinese (中文)",
  "Japanese (日本語)",
];

export type FormData = {
  productName: string;
  description: string;
  audience: string;
  platform: Platform;
  language: string;
  tone: Tone;
};

export type Result = {
  caption: string;
  productDescription: string;
  adCopy: string;
  mode: "ai" | "demo";
};

export const FREE_LIMIT = 5;
const USAGE_KEY = "contento_usage";

export function getUsage(): number {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const month = new Date().toISOString().slice(0, 7);
    return data.month === month ? Number(data.count) || 0 : 0;
  } catch {
    return 0;
  }
}

export function addUsage(): number {
  const month = new Date().toISOString().slice(0, 7);
  const next = getUsage() + 1;
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify({ month, count: next }));
  } catch {
    /* storage may be blocked; ignore */
  }
  return next;
}

export async function generateContent(form: FormData): Promise<Result> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  if (res.status === 501) {
    return demoResult(form);
  }
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const data = await res.json();
  return { ...data, mode: "ai" } as Result;
}

// DEMO MODE: fixed templates, NOT written by AI.
function demoResult(f: FormData): Result {
  const name = f.productName.trim();
  const who = f.audience.trim() || "everyone";
  const desc = f.description.trim();

  const openers: Record<Tone, string> = {
    professional: `Introducing ${name}: quality you can rely on.`,
    friendly: `Hey there! Meet ${name}, made with you in mind.`,
    persuasive: `Stop settling. ${name} is the upgrade you deserve.`,
    funny: `${name}: because boring products are so last year.`,
  };
  const closers: Record<Tone, string> = {
    professional: "Learn more today.",
    friendly: "Tap the link and say hi!",
    persuasive: "Order now. Limited stock!",
    funny: "Your future self says thanks.",
  };

  const hashtag = "#" + name.replace(/[^\p{L}\p{N}]/gu, "");
  const tag = f.platform === "Online store" ? "" : `\n\n${hashtag} #new`;

  return {
    mode: "demo",
    caption: `${openers[f.tone]}\n\n${desc}\n\nPerfect for ${who}. ${closers[f.tone]}${tag}`,
    productDescription: `${name} is designed for ${who}. ${desc} Whether you shop on ${f.platform} or anywhere else, ${name} delivers.`,
    adCopy: `${openers[f.tone]} ${closers[f.tone]}`,
  };
}
