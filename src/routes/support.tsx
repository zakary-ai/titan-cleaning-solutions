import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Mail, MessageCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Titan Solutions" },
      { name: "description", content: "Get help with the Titan Solutions cleaning operations platform." },
      { property: "og:title", content: "Support — Titan Solutions" },
      { property: "og:description", content: "Get help with Titan Solutions." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gold/10 text-gold">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg">Titan</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-gold">Solutions</span>
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
        <h1 className="font-display text-3xl md:text-5xl">Support</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Need help? We’re here for you.
        </p>

        <div className="mt-8 space-y-6">
          <section className="rounded-2xl bg-card p-6 gold-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg">Email us</h2>
                <p className="text-sm text-muted-foreground">For general questions and technical issues</p>
              </div>
            </div>
            <p className="mt-4 text-sm">
              <a className="text-gold underline" href="mailto:frank@titansolutionsco.com">
                frank@titansolutionsco.com
              </a>
            </p>
          </section>

          <section className="rounded-2xl bg-card p-6 gold-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg">Comments</h2>
                <p className="text-sm text-muted-foreground">Report a problem directly inside the app</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-foreground/90">
              Log in and visit the <strong>Comments</strong> tab from any property to start a conversation with your team. Administrators and supervisors can view and reply to all threads.
            </p>
          </section>

          <section className="rounded-2xl bg-card p-6 gold-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg">Response times</h2>
                <p className="text-sm text-muted-foreground">How quickly we typically respond</p>
              </div>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-foreground/90">
              <li>Email: within 1 business day</li>
              <li>Urgent app issues: same day</li>
              <li>Feature requests: added to our roadmap — we’ll follow up when it ships</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Titan Solutions. All rights reserved.
        </div>
      </main>
    </div>
  );
}
