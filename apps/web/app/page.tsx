import Link from 'next/link';

const highlights = [
  {
    title: 'Capture moments quickly',
    description:
      'Turn practice, rehearsal, and performance clips into a timeline you can actually review.',
  },
  {
    title: 'Share with context',
    description:
      'Send sessions and clips with notes, targets, and feedback states so collaborators stay aligned.',
  },
  {
    title: 'Track creative growth',
    description:
      'Organize your work in one place and come back to key moments without digging through files.',
  },
];

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-roam-ground text-roam-active">
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <p className="inline-flex rounded-full border border-roam-border bg-roam-chrome px-3 py-1 text-xs font-medium uppercase tracking-wide text-roam-muted">
          Roam
        </p>

        <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
          Creative sessions, organized and shareable.
        </h1>

        <p className="mt-6 max-w-2xl text-base text-roam-muted md:text-lg">
          Roam helps creators review clips, shape feedback, and keep momentum between ideas and
          execution. This page is a simple web presence while the full product keeps evolving.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="mailto:hello@roam.app"
            className="rounded-lg bg-roam-active px-5 py-3 text-sm font-medium text-roam-ground transition hover:opacity-90"
          >
            Contact us
          </Link>
          <Link
            href="/s/demo"
            className="rounded-lg border border-roam-border bg-roam-chrome px-5 py-3 text-sm font-medium text-roam-active transition hover:border-roam-muted"
          >
            View shared session format
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-20 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="rounded-2xl border border-roam-border bg-roam-chrome p-6">
            <h2 className="font-serif text-2xl">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-roam-muted">{item.description}</p>
          </article>
        ))}
      </section>

      <footer className="border-t border-roam-border bg-roam-chrome/70">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-sm text-roam-muted">
          <p>© {new Date().getFullYear()} Roam</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition hover:text-roam-active">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-roam-active">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
