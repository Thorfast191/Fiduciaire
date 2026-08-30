import Image from "next/image";
import Link from "next/link";

const services = [
  {
    number: "01",
    title: "Déclaration fiscale",
    description:
      "Une prise en charge simple et rigoureuse de votre déclaration fiscale.",
  },
  {
    number: "02",
    title: "Comptabilité",
    description:
      "Une comptabilité claire et structurée, adaptée à votre situation.",
  },
  {
    number: "03",
    title: "Fiscalité",
    description:
      "Des conseils fiscaux adaptés aux particuliers, indépendants et entreprises.",
  },
  {
    number: "04",
    title: "Gestion administrative",
    description:
      "Nous simplifions vos démarches administratives et vos obligations.",
  },
];

const steps = [
  {
    number: "01",
    title: "Créez votre espace",
    description:
      "Inscrivez-vous en ligne et renseignez les informations nécessaires à votre dossier.",
  },
  {
    number: "02",
    title: "Déposez vos documents",
    description:
      "Transmettez vos documents directement depuis votre espace client sécurisé.",
  },
  {
    number: "03",
    title: "Nous traitons votre dossier",
    description:
      "Notre équipe analyse votre situation et vous accompagne jusqu'à la finalisation.",
  },
];

const faqs = [
  {
    question: "Comment fonctionne Fiduvia ?",
    answer:
      "Fiduvia vous permet de gérer votre relation fiduciaire entièrement en ligne. Vous créez votre espace, transmettez vos documents et suivez l'avancement de votre dossier depuis votre espace personnel.",
  },
  {
    question: "Mes documents sont-ils sécurisés ?",
    answer:
      "La plateforme est conçue autour de la confidentialité et de la protection des données. Les documents sont transmis via votre espace client sécurisé.",
  },
  {
    question: "Puis-je suivre l'avancement de mon dossier ?",
    answer:
      "Oui. Votre espace client vous permet de suivre l'état de votre dossier et de voir les actions ou documents qui nécessitent votre attention.",
  },
  {
    question: "À qui s'adresse Fiduvia ?",
    answer:
      "Fiduvia accompagne les particuliers, indépendants et entreprises qui souhaitent gérer leurs démarches comptables et fiscales de manière simple et digitale.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--sand-100)] text-[var(--ink)]">
      {/* =========================================================
          NAVIGATION
      ========================================================= */}
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-[88px] w-full max-w-[1190px] items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-[var(--font-display)] text-[27px] font-semibold tracking-[-0.045em] text-[var(--petrol-900)]"
          >
            fiduvia
          </Link>

          {/* Navigation + right controls */}
          <div className="flex items-center gap-8">
            <nav className="hidden items-center gap-8 lg:flex">
              <a
                href="#about"
                className="text-[13px] font-medium text-[var(--petrol-700)] transition hover:text-[var(--teal-600)]"
              >
                À propos
              </a>

              <a
                href="#services"
                className="text-[13px] font-medium text-[var(--petrol-700)] transition hover:text-[var(--teal-600)]"
              >
                Services
              </a>

              <a
                href="#method"
                className="text-[13px] font-medium text-[var(--petrol-700)] transition hover:text-[var(--teal-600)]"
              >
                Méthode
              </a>

              <a
                href="#pricing"
                className="text-[13px] font-medium text-[var(--petrol-700)] transition hover:text-[var(--teal-600)]"
              >
                Tarifs
              </a>

              <a
                href="#faq"
                className="text-[13px] font-medium text-[var(--petrol-700)] transition hover:text-[var(--teal-600)]"
              >
                FAQ
              </a>
            </nav>

            {/* Language */}
            <button
              type="button"
              className="hidden text-[13px] font-medium text-[var(--petrol-700)] sm:block"
            >
              FR / EN
            </button>

            {/* Client area */}
            <Link
              href="/login"
              className="rounded-full bg-[var(--teal-600)] px-6 py-3 text-[12px] font-semibold text-white transition hover:bg-[var(--teal-500)]"
            >
              Espace client
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative min-h-[760px] overflow-hidden bg-[var(--sand-100)]">
        {/* Mountain background */}
        <div className="absolute inset-0">
          <Image
            src="/hero-alpes.jpg"
            alt="Paysage des Alpes suisses"
            fill
            priority
            className="object-cover object-center"
          />

          {/* Left readability overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,244,236,0.98)_0%,rgba(248,244,236,0.91)_36%,rgba(248,244,236,0.35)_66%,rgba(248,244,236,0.05)_100%)]" />

          {/* Top/bottom fade */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,244,236,0.86)_0%,transparent_22%,transparent_75%,rgba(248,244,236,0.72)_100%)]" />
        </div>

        {/* Hero content */}
        <div className="relative mx-auto grid min-h-[760px] w-full max-w-[1190px] items-center gap-[90px] pb-20 pt-32 lg:grid-cols-[1fr_395px]">
          {/* Hero copy */}
          <div className="max-w-[700px]">
            {/* Eyebrow */}
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--teal-600)]" />

              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-600)]">
                Fiduciaire suisse
              </span>
            </div>

            {/* Main heading */}
            <h1 className="max-w-[700px] text-[52px] font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--petrol-900)] sm:text-[68px] lg:text-[60px]">
              Votre déclaration d’impôts,
              <br />
              <span className="text-[var(--teal-600)]">
                entre de bonnes mains.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-7 max-w-[540px] text-[17px] leading-8 text-[var(--petrol-700)]">
              Fiduvia vous accompagne dans vos démarches fiscales et comptables,
              entièrement en ligne, avec la simplicité et la proximité d'une
              fiduciaire suisse.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#pricing"
                className="inline-flex h-[52px] items-center justify-center rounded-full bg-[var(--teal-600)] px-7 text-[13px] font-semibold text-white shadow-[0_12px_30px_rgba(20,124,140,0.18)] transition hover:bg-[var(--teal-500)]"
              >
                Estimer mon tarif
                <span className="ml-3">→</span>
              </a>

              <Link
                href="/login"
                className="inline-flex h-[52px] items-center justify-center rounded-full border border-[var(--petrol-900)]/15 bg-white/60 px-7 text-[13px] font-semibold text-[var(--petrol-900)] backdrop-blur transition hover:bg-white"
              >
                Espace client
              </Link>
            </div>

            {/* Trust points */}
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
              <span className="flex items-center gap-2 text-[12px] text-[var(--petrol-700)]">
                <span className="text-[var(--teal-600)]">✓</span>
                100% en ligne
              </span>

              <span className="flex items-center gap-2 text-[12px] text-[var(--petrol-700)]">
                <span className="text-[var(--teal-600)]">✓</span>
                Données en Suisse
              </span>

              <span className="flex items-center gap-2 text-[12px] text-[var(--petrol-700)]">
                <span className="text-[var(--teal-600)]">✓</span>
                Experts suisses
              </span>
            </div>
          </div>

          {/* =====================================================
              PRICING SIMULATOR
          ===================================================== */}
          <div
            id="pricing"
            className="relative z-10 rounded-[24px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_70px_rgba(13,38,56,0.16)] backdrop-blur-md"
          >
            {/* Card header */}
            <div className="border-b border-[var(--sand-300)] pb-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--teal-600)]">
                  Estimation
                </p>

                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  Sans engagement
                </span>
              </div>

              <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.025em] text-[var(--petrol-900)]">
                Votre tarif en quelques clics
              </h2>

              <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">
                Une estimation simple et transparente adaptée à votre situation.
              </p>
            </div>

            {/* Form */}
            <div className="mt-6 space-y-5">
              {/* Profile */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--petrol-700)]">
                  Profil
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-[var(--teal-600)] bg-[var(--teal-100)] px-3 py-3 text-left text-[12px] font-semibold text-[var(--petrol-900)]"
                  >
                    Particulier
                  </button>

                  <button
                    type="button"
                    className="rounded-xl border border-[var(--sand-300)] bg-white px-3 py-3 text-left text-[12px] text-[var(--muted)] transition hover:border-[var(--teal-400)]"
                  >
                    Indépendant
                  </button>
                </div>
              </div>

              {/* Situation */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--petrol-700)]">
                  Situation
                </label>

                <select className="h-[46px] w-full rounded-xl border border-[var(--sand-300)] bg-white px-3 text-[13px] text-[var(--petrol-900)] outline-none focus:border-[var(--teal-600)]">
                  <option>Déclaration fiscale simple</option>
                  <option>Déclaration avec biens immobiliers</option>
                  <option>Déclaration avec activité indépendante</option>
                </select>
              </div>

              {/* Canton */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--petrol-700)]">
                  Canton
                </label>

                <select className="h-[46px] w-full rounded-xl border border-[var(--sand-300)] bg-white px-3 text-[13px] text-[var(--petrol-900)] outline-none focus:border-[var(--teal-600)]">
                  <option>Genève</option>
                  <option>Vaud</option>
                  <option>Valais</option>
                  <option>Fribourg</option>
                  <option>Neuchâtel</option>
                  <option>Autre canton</option>
                </select>
              </div>

              {/* Price */}
              <div className="rounded-2xl bg-[var(--sand-100)] p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] text-[var(--muted)]">
                      Tarif estimatif
                    </p>

                    <p className="mt-1 font-mono text-[28px] font-semibold tracking-[-0.04em] text-[var(--petrol-900)]">
                      CHF 250.–
                    </p>
                  </div>

                  <span className="text-[11px] text-[var(--muted)]">
                    / dossier
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                className="h-[48px] w-full rounded-full bg-[var(--petrol-900)] text-[12px] font-semibold text-white transition hover:bg-[var(--petrol-800)]"
              >
                Obtenir mon estimation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST STRIP
      ========================================================= */}
      <section className="bg-[var(--teal-600)] text-white">
        <div className="mx-auto grid w-full max-w-[1190px] divide-y divide-white/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-7 text-center sm:text-left">
            <p className="font-mono text-[23px] font-medium">250+</p>

            <p className="mt-1 text-[11px] text-white/70">
              clients accompagnés
            </p>
          </div>

          <div className="px-5 py-7 text-center sm:text-left">
            <p className="font-mono text-[23px] font-medium">CH</p>

            <p className="mt-1 text-[11px] text-white/70">
              Données hébergées en Suisse
            </p>
          </div>

          <div className="px-5 py-7 text-center sm:text-left">
            <p className="font-mono text-[23px] font-medium">100%</p>

            <p className="mt-1 text-[11px] text-white/70">Processus en ligne</p>
          </div>
        </div>
      </section>

      {/* =========================================================
          ABOUT
      ========================================================= */}
      <section id="about" className="bg-[var(--sand-100)] py-28 sm:py-36">
        <div className="mx-auto w-full max-w-[1190px] px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-600)]">
            À propos de Fiduvia
          </p>

          <h2 className="mt-5 text-[40px] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--petrol-900)] sm:text-[56px]">
            Une fiduciaire moderne,
            <br />
            <span className="text-[var(--teal-600)]">
              pensée pour vous simplifier la vie.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-[680px] text-[16px] leading-8 text-[var(--petrol-700)]">
            Nous croyons que la relation avec une fiduciaire ne devrait pas être
            compliquée. Fiduvia rassemble votre comptabilité, votre fiscalité et
            vos démarches dans une expérience digitale simple, transparente et
            accessible.
          </p>
        </div>
      </section>

      {/* =========================================================
          SERVICES
      ========================================================= */}
      <section id="services" className="bg-white py-28 sm:py-32">
        <div className="mx-auto w-full max-w-[1190px] px-6">
          <div className="max-w-[650px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-600)]">
              Nos services
            </p>

            <h2 className="mt-4 text-[40px] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--petrol-900)] sm:text-[52px]">
              L'essentiel de votre
              <br />
              gestion fiduciaire.
            </h2>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-[24px] border border-[var(--sand-300)] bg-[var(--sand-300)] md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article
                key={service.number}
                className="bg-white p-7 transition hover:bg-[var(--sand-100)] sm:p-9"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[var(--teal-600)]">
                    {service.number}
                  </span>

                  <span className="text-[var(--sand-500)]">↗</span>
                </div>

                <h3 className="mt-12 text-[21px] font-semibold tracking-[-0.025em] text-[var(--petrol-900)]">
                  {service.title}
                </h3>

                <p className="mt-4 text-[13px] leading-6 text-[var(--muted)]">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          METHOD
      ========================================================= */}
      <section
        id="method"
        className="bg-[var(--petrol-900)] py-28 text-white sm:py-32"
      >
        <div className="mx-auto w-full max-w-[1190px] px-6">
          <div className="grid gap-16 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-400)]">
                Notre méthode
              </p>

              <h2 className="mt-5 text-[40px] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
                Simple.
                <br />
                Transparent.
                <br />
                Digital.
              </h2>

              <p className="mt-6 max-w-[420px] text-[15px] leading-7 text-white/60">
                Tout ce dont vous avez besoin, sans les complications
                traditionnelles d'une relation fiduciaire.
              </p>
            </div>

            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="border-t border-white/15 py-7 last:border-b"
                >
                  <div className="grid gap-5 sm:grid-cols-[70px_1fr]">
                    <span className="font-mono text-[12px] text-[var(--teal-400)]">
                      {step.number}
                    </span>

                    <div>
                      <h3 className="text-[22px] font-semibold text-white">
                        {step.title}
                      </h3>

                      <p className="mt-3 max-w-[550px] text-[13px] leading-6 text-white/55">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRICING
      ========================================================= */}
      <section
        id="pricing-section"
        className="bg-[var(--sand-100)] py-28 sm:py-32"
      >
        <div className="mx-auto w-full max-w-[1050px] px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-600)]">
              Tarifs
            </p>

            <h2 className="mt-4 text-[40px] font-semibold tracking-[-0.045em] text-[var(--petrol-900)] sm:text-[52px]">
              Des tarifs simples et transparents.
            </h2>

            <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-7 text-[var(--muted)]">
              Pas de mauvaise surprise. Votre tarif dépend de votre situation et
              de la complexité de votre dossier.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {/* Particulier */}
            <div className="rounded-[22px] border border-[var(--sand-300)] bg-white p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--teal-600)]">
                Particulier
              </p>

              <p className="mt-5 font-mono text-[34px] font-semibold text-[var(--petrol-900)]">
                CHF 250.–
              </p>

              <p className="mt-2 text-[12px] text-[var(--muted)]">
                dès / déclaration
              </p>

              <div className="my-7 h-px bg-[var(--sand-300)]" />

              <ul className="space-y-3 text-[12px] text-[var(--petrol-700)]">
                <li>✓ Déclaration fiscale</li>
                <li>✓ Analyse de votre situation</li>
                <li>✓ Suivi en ligne</li>
              </ul>
            </div>

            {/* Indépendant */}
            <div className="relative rounded-[22px] border-2 border-[var(--teal-600)] bg-white p-7">
              <span className="absolute right-5 top-5 rounded-full bg-[var(--teal-100)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--teal-600)]">
                Populaire
              </span>

              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--teal-600)]">
                Indépendant
              </p>

              <p className="mt-5 font-mono text-[34px] font-semibold text-[var(--petrol-900)]">
                Sur mesure
              </p>

              <p className="mt-2 text-[12px] text-[var(--muted)]">
                selon votre activité
              </p>

              <div className="my-7 h-px bg-[var(--sand-300)]" />

              <ul className="space-y-3 text-[12px] text-[var(--petrol-700)]">
                <li>✓ Comptabilité</li>
                <li>✓ Fiscalité</li>
                <li>✓ Déclaration</li>
                <li>✓ Accompagnement personnalisé</li>
              </ul>
            </div>

            {/* Entreprise */}
            <div className="rounded-[22px] border border-[var(--sand-300)] bg-white p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--teal-600)]">
                Entreprise
              </p>

              <p className="mt-5 font-mono text-[34px] font-semibold text-[var(--petrol-900)]">
                Sur mesure
              </p>

              <p className="mt-2 text-[12px] text-[var(--muted)]">
                selon vos besoins
              </p>

              <div className="my-7 h-px bg-[var(--sand-300)]" />

              <ul className="space-y-3 text-[12px] text-[var(--petrol-700)]">
                <li>✓ Comptabilité complète</li>
                <li>✓ Fiscalité</li>
                <li>✓ Salaires & RH</li>
                <li>✓ Conseil</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ
      ========================================================= */}
      <section id="faq" className="bg-white py-28 sm:py-32">
        <div className="mx-auto w-full max-w-[900px] px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-600)]">
              FAQ
            </p>

            <h2 className="mt-4 text-[40px] font-semibold tracking-[-0.045em] text-[var(--petrol-900)] sm:text-[52px]">
              Questions fréquentes
            </h2>
          </div>

          <div className="mt-14 divide-y divide-[var(--sand-300)] border-y border-[var(--sand-300)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-semibold text-[var(--petrol-900)]">
                  {faq.question}

                  <span className="text-[var(--teal-600)] transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-[700px] text-[13px] leading-6 text-[var(--muted)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTACT CTA
      ========================================================= */}
      <section className="bg-[var(--sand-100)] px-6 py-28">
        <div className="mx-auto w-full max-w-[900px] rounded-[28px] bg-[var(--teal-600)] px-7 py-14 text-center text-white sm:px-12 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Parlons de votre situation
          </p>

          <h2 className="mt-5 text-[40px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[55px]">
            Prêt à simplifier
            <br />
            votre fiduciaire ?
          </h2>

          <p className="mx-auto mt-5 max-w-[520px] text-[15px] leading-7 text-white/70">
            Une question ou besoin d'un accompagnement personnalisé ?
            Contactez-nous.
          </p>

          <a
            href="mailto:contact@fiduvia.ch"
            className="mt-8 inline-flex h-[52px] items-center rounded-full bg-white px-7 text-[13px] font-semibold text-[var(--petrol-900)] transition hover:bg-[var(--sand-100)]"
          >
            Nous contacter
            <span className="ml-3">→</span>
          </a>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="bg-[var(--petrol-900)] text-white">
        <div className="mx-auto w-full max-w-[1190px] px-6 py-14">
          <div className="grid gap-12 md:grid-cols-[1.4fr_.6fr_.6fr]">
            {/* Brand */}
            <div>
              <Link
                href="/"
                className="font-[var(--font-display)] text-[27px] font-semibold tracking-[-0.045em]"
              >
                fiduvia
              </Link>

              <p className="mt-4 max-w-[340px] text-[13px] leading-6 text-white/50">
                Votre fiduciaire suisse, entièrement en ligne. Simple,
                transparente et proche de vous.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
                Navigation
              </p>

              <div className="mt-5 space-y-3 text-[12px] text-white/60">
                <a href="#about" className="block hover:text-white">
                  À propos
                </a>

                <a href="#services" className="block hover:text-white">
                  Services
                </a>

                <a href="#method" className="block hover:text-white">
                  Méthode
                </a>

                <a href="#pricing" className="block hover:text-white">
                  Tarifs
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
                Contact
              </p>

              <div className="mt-5 space-y-3 text-[12px] text-white/60">
                <a
                  href="mailto:contact@fiduvia.ch"
                  className="block hover:text-white"
                >
                  contact@fiduvia.ch
                </a>

                <Link href="/login" className="block hover:text-white">
                  Espace client
                </Link>
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-[10px] text-white/35 sm:flex-row">
            <p>© {new Date().getFullYear()} Fiduvia. Tous droits réservés.</p>

            <div className="flex gap-6">
              <a href="#" className="hover:text-white/70">
                Politique de confidentialité
              </a>

              <a href="#" className="hover:text-white/70">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
