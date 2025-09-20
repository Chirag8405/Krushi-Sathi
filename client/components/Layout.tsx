import { Languages, Leaf, Moon, SunMedium } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: ReactNode }) {
  const { lang, setLang, t } = useLocale();
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggleTheme = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-sky to-background">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-leaf/10 flex items-center justify-center">
              <Leaf className="h-6 w-6 text-brand-leaf" />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-xl tracking-tight text-foreground">
                {t("appName")}
              </div>
              <div className="text-xs text-muted-foreground">AI • Voice • Images</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex rounded-lg overflow-x-auto border max-w-[50vw]">
              {(["ml", "en", "hi", "mr", "kn", "gu", "te"] as const).map((code) => (
                <button
                  key={code}
                  aria-label={`Switch language to ${code}`}
                  onClick={() => setLang(code)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium",
                    lang === code
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-accent"
                  )}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="sm:hidden">
              <label className="sr-only" htmlFor="lang-select">{t("chooseLanguage")}</label>
              <div className="relative">
                <select
                  id="lang-select"
                  className="appearance-none rounded-md border bg-background px-3 py-2 text-sm pr-8"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as any)}
                >
                  {(["ml", "en", "hi", "mr", "kn", "gu", "te"] as const).map((code) => (
                    <option key={code} value={code}>{code.toUpperCase()}</option>
                  ))}
                </select>
                <Languages className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {dark ? <SunMedium /> : <Moon />}
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-6 md:py-10">{children}</main>
      <footer className="border-t mt-8">
        <div className="container py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {t("appName")}</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-leaf" aria-hidden />
            {t("offline")}
          </span>
        </div>
      </footer>
    </div>
  );
}
