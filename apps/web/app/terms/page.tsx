import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Roam terms of use',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-roam-ground text-roam-active">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl">Terms of Use</h1>
        <p className="mt-3 text-sm text-roam-muted">Last updated: April 18, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-roam-active">
          <p>
            These terms govern your use of Roam. By accessing or using the service, you agree to
            these terms.
          </p>

          <section>
            <h2 className="font-serif text-2xl">Use of service</h2>
            <p className="mt-2">
              You agree to use Roam in compliance with applicable laws and not to misuse the
              platform or interfere with other users.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl">Content</h2>
            <p className="mt-2">
              You retain ownership of your content. By uploading content, you grant Roam the rights
              needed to host, process, and display it as part of the service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl">Availability</h2>
            <p className="mt-2">
              We may update, suspend, or discontinue features as we improve the product. We do not
              guarantee uninterrupted availability.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl">Contact</h2>
            <p className="mt-2">Questions about these terms can be sent to hello@roam.app.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
