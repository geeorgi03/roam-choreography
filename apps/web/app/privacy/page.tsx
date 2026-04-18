import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Roam privacy policy',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-roam-ground text-roam-active">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-roam-muted">Last updated: April 18, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-roam-active">
          <p>
            Roam is committed to respecting your privacy. This page explains what information we
            collect, how we use it, and what choices you have.
          </p>

          <section>
            <h2 className="font-serif text-2xl">Information we collect</h2>
            <p className="mt-2">
              We may collect contact details you submit (such as your email), usage data needed to
              operate the service, and content you choose to upload or share.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl">How we use information</h2>
            <p className="mt-2">
              We use data to provide and improve the product, respond to requests, secure the
              platform, and communicate important service updates.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl">Sharing</h2>
            <p className="mt-2">
              We do not sell personal information. We may share data with trusted providers who
              help us run the service, under appropriate safeguards.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl">Your choices</h2>
            <p className="mt-2">
              You can request access, correction, or deletion of personal information by contacting
              us at hello@roam.app.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
