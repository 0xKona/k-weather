import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — K-Weather",
  description: "How K-Weather handles your personal data.",
};

const EMAIL = "konarobinson@proton.me";

export default function PrivacyPage() {
  return (
    <div className="h-dvh overflow-y-auto bg-black text-foreground">
      <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Effective date: 15 August 2026
        </p>

        <section className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              1. Who we are
            </h2>
            <p>
              The data controller is Connor Robinson, contactable at {EMAIL}.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              2. What we process, and why
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Your device&rsquo;s location, if you use the &ldquo;Use my
                location&rdquo; button — on the basis of your consent
                (Article 6(1)(a)), which you can withdraw in your
                browser&rsquo;s settings.
              </li>
              <li>
                The location you search for or select, and your IP address —
                needed to provide weather data (Article 6(1)(f)).
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              3. Who we share with
            </h2>
            <p>
              Open-Meteo (weather and geocoding), BigDataCloud (reverse
              geocoding), and Amazon Web Services (hosting). They receive only
              what is needed for their task. Data may be processed outside the
              UK under appropriate safeguards.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              4. Retention and cookies
            </h2>
            <p>
              We store nothing on our servers. This site uses no cookies.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              5. Your rights
            </h2>
            <p>
              You have the right to access, rectify, or erase your data, to
              restrict or object to processing, to data portability, to
              withdraw consent, and to complain to the Information
              Commissioner&rsquo;s Office (ico.org.uk). Email {EMAIL} to make a
              request.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
