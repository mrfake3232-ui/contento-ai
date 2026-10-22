import { useEffect, useRef, useState } from "react";
import {
  FREE_LIMIT,
  LANGUAGES,
  PLATFORMS,
  TONES,
  addUsage,
  generateContent,
  getUsage,
  type FormData,
  type Result,
  type Tone,
} from "./lib/content";

type Page = "home" | "app" | "pricing";

const EMPTY: FormData = {
  productName: "",
  description: "",
  audience: "",
  platform: "Instagram",
  language: "English",
  tone: "friendly",
};

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const go = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen">
      <Header page={page} go={go} />
      {page === "home" && <Landing go={go} />}
      {page === "app" && <Generator go={go} />}
      {page === "pricing" && <Pricing go={go} />}
      <footer className="px-5 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Contento AI
      </footer>
    </div>
  );
}

function Header({ page, go }: { page: Page; go: (p: Page) => void }) {
  const link = (p: Page, label: string) => (
    <button
      onClick={() => go(p)}
      className={`rounded-full px-3 py-1.5 text-sm font-medium ${
        page === p ? "bg-brand-100 text-brand-800" : "text-slate-600"
      }`}
    >
      {label}
    </button>
  );
  return (
    <header className="safe-top sticky top-0 z-10 border-b border-brand-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <button
          onClick={() => go("home")}
          className="flex items-center gap-2 font-extrabold text-brand-800"
        >
          <img src="/icon.svg" alt="" className="h-7 w-7 rounded-lg" />
          Contento AI
        </button>
        <nav className="flex gap-1">
          {link("app", "Create")}
          {link("pricing", "Pricing")}
        </nav>
      </div>
    </header>
  );
}

function Landing({ go }: { go: (p: Page) => void }) {
  const features = [
    ["✍️", "Captions that stop the scroll", "Ready for Instagram, TikTok and Facebook."],
    ["🛍️", "Product descriptions", "Clear text for your online store."],
    ["📣", "Ad copy", "Short and punchy, made to sell."],
    ["🌍", "12 languages", "Reach customers in their own language."],
  ];
  return (
    <main className="fade-up mx-auto max-w-3xl px-5">
      <section className="py-14 text-center">
        <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          Marketing content, made simple
        </span>
        <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Write marketing content that{" "}
          <span className="text-brand-600">sells</span>, in seconds.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-slate-600">
          Tell us about your product. Get captions, descriptions and ads in
          the tone and language you choose.
        </p>
        <button
          onClick={() => go("app")}
          className="mt-8 w-full rounded-2xl bg-brand-700 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-brand-300 active:scale-95 sm:w-auto"
        >
          Start free
        </button>
        <p className="mt-3 text-sm text-slate-500">
          {FREE_LIMIT} free generations every month. No sign-up.
        </p>
      </section>
      <section className="grid gap-3 pb-10 sm:grid-cols-2">
        {features.map(([icon, title, text]) => (
          <div
            key={title}
            className="rounded-2xl border border-brand-100 bg-white p-5"
          >
            <div className="text-2xl">{icon}</div>
            <h3 className="mt-2 font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

function Generator({ go }: { go: (p: Page) => void }) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [used, setUsed] = useState(getUsage());
  const resultRef = useRef<HTMLDivElement>(null);

  const left = Math.max(0, FREE_LIMIT - used);
  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function run(tone?: Tone) {
    setError("");
    const next = { ...form, tone: tone ?? form.tone };
    if (tone) setForm(next);
    if (!next.productName.trim() || !next.description.trim()) {
      setError("Please enter a product name and a short description.");
      return;
    }
    if (getUsage() >= FREE_LIMIT) {
      setError("You used all your free generations this month.");
      return;
    }
    setLoading(true);
    try {
      const r = await generateContent(next);
      setResult(r);
      setUsed(addUsage());
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";
  const label = "block text-sm font-semibold text-slate-700";

  return (
    <main className="fade-up mx-auto max-w-3xl px-5 py-6">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Create content
        </h2>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          {left} free left
        </span>
      </div>

      <div className="mt-5 space-y-4 rounded-2xl border border-brand-100 bg-white p-5">
        <div>
          <label className={label}>Product name</label>
          <input
            className={field}
            value={form.productName}
            maxLength={100}
            placeholder="e.g. Sunrise Coffee Beans"
            onChange={(e) => set("productName", e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Product description</label>
          <textarea
            className={field}
            rows={4}
            maxLength={800}
            placeholder="What is it? What makes it special?"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Target audience</label>
          <input
            className={field}
            value={form.audience}
            maxLength={150}
            placeholder="e.g. busy students, coffee lovers"
            onChange={(e) => set("audience", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Platform</label>
            <select
              className={field}
              value={form.platform}
              onChange={(e) =>
                set("platform", e.target.value as FormData["platform"])
              }
            >
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Language</label>
            <select
              className={field}
              value={form.language}
              onChange={(e) => set("language", e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <span className={label}>Tone</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => set("tone", t.id)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                  form.tone === t.id
                    ? "border-brand-600 bg-brand-50 text-brand-800"
                    : "border-brand-200 bg-white text-slate-600"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
            {left === 0 && (
              <button
                onClick={() => go("pricing")}
                className="ml-1 font-bold underline"
              >
                See plans
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => run()}
          disabled={loading}
          className="w-full rounded-2xl bg-brand-700 py-4 text-lg font-bold text-white shadow-lg shadow-brand-200 active:scale-95 disabled:opacity-60"
        >
          {loading ? "Writing..." : "Generate content ✨"}
        </button>
      </div>

      <div ref={resultRef} className="mt-6">
        {loading && <Skeleton />}
        {!loading && !result && (
          <div className="rounded-2xl border border-dashed border-brand-200 p-8 text-center text-slate-500">
            <div className="text-3xl">📝</div>
            <p className="mt-2 font-medium">Your content will appear here.</p>
            <p className="text-sm">Fill in the form and tap Generate.</p>
          </div>
        )}
        {!loading && result && (
          <Results
            result={result}
            tone={form.tone}
            onTone={(t) => run(t)}
            onRegenerate={() => run()}
          />
        )}
      </div>
    </main>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-28 rounded-2xl" />
      ))}
    </div>
  );
}

function Results({
  result,
  tone,
  onTone,
  onRegenerate,
}: {
  result: Result;
  tone: Tone;
  onTone: (t: Tone) => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="space-y-3">
      {result.mode === "demo" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <b>DEMO MODE.</b> This text comes from fixed templates, not from AI.
          The site owner must connect an AI service to get real AI writing.
        </div>
      )}
      <Card title="Caption" text={result.caption} />
      <Card title="Product description" text={result.productDescription} />
      <Card title="Ad copy" text={result.adCopy} />

      <div className="rounded-2xl border border-brand-100 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">
          Try another tone
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => onTone(t.id)}
              className={`rounded-full border px-3 py-2 text-sm font-medium ${
                tone === t.id
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-brand-200 text-slate-600"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={onRegenerate}
          className="mt-3 w-full rounded-xl border border-brand-300 py-3 font-semibold text-brand-800 active:scale-95"
        >
          🔄 Regenerate
        </button>
      </div>
    </div>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
  }

  return (
    <div className="fade-up rounded-2xl border border-brand-100 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <button
          onClick={copy}
          className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-800 active:scale-95"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
        {text}
      </p>
    </div>
  );
}

function Pricing({ go }: { go: (p: Page) => void }) {
  const [asked, setAsked] = useState(false);
  return (
    <main className="fade-up mx-auto max-w-3xl px-5 py-8">
      <h2 className="text-center text-3xl font-extrabold text-slate-900">
        Simple pricing
      </h2>
      <p className="mt-2 text-center text-slate-600">
        Start free. Premium is coming soon.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-6">
          <h3 className="text-lg font-bold">Free</h3>
          <p className="mt-1 text-3xl font-extrabold">$0</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>✓ {FREE_LIMIT} generations per month</li>
            <li>✓ All tones and platforms</li>
            <li>✓ 12 languages</li>
          </ul>
          <button
            onClick={() => go("app")}
            className="mt-6 w-full rounded-xl bg-brand-700 py-3 font-bold text-white active:scale-95"
          >
            Start free
          </button>
        </div>
        <div className="rounded-2xl border-2 border-brand-500 bg-white p-6">
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800">
            COMING SOON
          </span>
          <h3 className="mt-2 text-lg font-bold">Premium</h3>
          <p className="mt-1 text-3xl font-extrabold text-slate-400">TBD</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>✓ Many more generations</li>
            <li>✓ Saved history</li>
            <li>✓ Priority support</li>
          </ul>
          <button
            onClick={() => setAsked(true)}
            className="mt-6 w-full rounded-xl border border-brand-300 py-3 font-bold text-brand-800 active:scale-95"
          >
            {asked ? "Thanks! Not available yet." : "Notify me"}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Payments are not active yet. Nothing is charged.
          </p>
        </div>
      </div>
    </main>
  );
}
