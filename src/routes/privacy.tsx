import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Titan Solutions" },
      { name: "description", content: "How Titan Solutions collects, uses, and protects information from supervisors, clients, and administrators using our cleaning operations platform." },
      { property: "og:title", content: "Privacy Policy — Titan Solutions" },
      { property: "og:description", content: "How Titan Solutions handles your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const updated = "May 14, 2026";
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
        <h1 className="font-display text-3xl md:text-5xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>

        <div className="prose prose-invert mt-8 max-w-none space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-xl text-gold">1. Who we are</h2>
            <p className="mt-2">
              Titan Solutions ("Titan", "we", "us") provides a cleaning operations platform used by
              hospitality clients, supervisors, and administrators to schedule cleanings, capture
              proof-of-work, and manage issues. This policy describes what information we collect
              when you use the Titan web app or mobile app, how we use it, and the choices you have.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold">2. Information we collect</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li><strong>Account information</strong> — name, email address, role (admin, supervisor, client), and the organization or property you are associated with.</li>
              <li><strong>Authentication data</strong> — encrypted password and session tokens managed by our authentication provider.</li>
              <li><strong>Operational content</strong> — properties, service areas, scheduled cleanings, completion status, comments, and issue threads you create or participate in.</li>
              <li><strong>Media uploads</strong> — photos and videos you upload as proof-of-work or as attachments to issues.</li>
              <li><strong>Device and usage data</strong> — IP address, browser or mobile OS, app version, timestamps of actions, and basic diagnostic logs used to keep the service reliable.</li>
            </ul>
            <p className="mt-3">We do not knowingly collect data from anyone under 18.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold">3. How we use your information</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Provide the core features of the platform (scheduling, proof-of-work, issue tracking).</li>
              <li>Authenticate users and protect accounts.</li>
              <li>Send transactional emails such as account invitations, password resets, and notifications about issues that involve you.</li>
              <li>Maintain analytics on aggregate platform health (e.g. number of properties completed, open issues).</li>
              <li>Detect, prevent, and respond to abuse, fraud, or security incidents.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell your personal information, and we do <strong>not</strong> use your operational
              content or uploaded media to train third-party AI models.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold">4. Camera, photos, and storage permissions</h2>
            <p className="mt-2">
              The mobile app may request access to your camera and photo library so you can attach
              proof-of-work and issue documentation. Media is uploaded only when you explicitly
              choose a file or capture a photo. You can revoke these permissions at any time in
              your device settings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold">5. How we share information</h2>
            <p className="mt-2">We share information only with:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li><strong>Other users in your organization</strong> — supervisors and clients assigned to a property can see relevant cleanings, comments, issues, and uploaded media for that property.</li>
              <li><strong>Service providers</strong> — infrastructure partners that host our database, storage, and email delivery, bound by contractual confidentiality.</li>
              <li><strong>Legal requirements</strong> — when required by law, legal process, or to protect the rights, safety, or property of Titan, our users, or the public.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold">6. Data retention</h2>
            <p className="mt-2">
              We retain account and operational data for as long as your account is active.
              When an account is deleted, we remove personal information and associated property
              assignments within 30 days, except where we are required to retain certain records
              for legal, accounting, or security purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold">7. Security</h2>
            <p className="mt-2">
              We use encryption in transit (HTTPS), encrypted storage, scoped access controls
              (row-level security), and breached-password screening for new passwords. No system is
              perfectly secure — please use a strong, unique password and notify us immediately if
              you suspect unauthorized access to your account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold">8. Your rights</h2>
            <p className="mt-2">
              Depending on where you live, you may have the right to access, correct, export, or
              delete your personal information, or to object to certain processing. To exercise
              these rights, contact us at the address below. Administrators of your organization
              can also delete user accounts and unassign properties from within the admin portal.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold">9. International users</h2>
            <p className="mt-2">
              Titan is operated from the United States. By using the service you understand that
              your information may be processed in the United States and other countries that may
              have different data protection rules than your own.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold">10. Changes to this policy</h2>
            <p className="mt-2">
              We may update this policy from time to time. Material changes will be communicated
              through the app or by email. The "Last updated" date at the top of this page always
              reflects the current version.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-gold">11. Contact us</h2>
            <p className="mt-2">
              Questions, requests, or concerns about this policy? Email{" "}
              <a className="text-gold underline" href="mailto:frank@titansolutionsco.com">
                frank@titansolutionsco.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Titan Solutions. All rights reserved.
        </div>
      </main>
    </div>
  );
}
