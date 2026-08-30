import Link from "next/link";

const services = [
  {
    number: "01",
    title: "Comptabilité",
    description:
      "Une comptabilité claire et structurée, adaptée à votre activité et à vos besoins.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
      >
        <path d="M5 20V9" />
        <path d="M12 20V4" />
        <path d="M19 20v-7" />
        <path d="M3 20h18" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Fiscalité",
    description:
      "Un accompagnement fiscal adapté aux particuliers, indépendants et entreprises.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
      >
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Gestion administrative",
    description:
      "Nous simplifions vos démarches administratives pour vous permettre de vous concentrer sur votre activité.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
      >
        <path d="M4 7h16" />
        <path d="M7 4v3" />
        <path d="M17 4v3" />
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="m8 14 2 2 5-5" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Salaires & RH",
    description:
      "La gestion des salaires et des obligations administratives liées à vos collaborateurs.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="M16 11a3 3 0 0 1 4 2.8" />
        <path d="M16.5 19a4.5 4.5 0 0 1 4-2.4" />
      </svg>
    ),
  },
];

const steps = [
  {
    number: "01",
    title: "Créez votre espace",
    description:
      "Inscrivez-vous en quelques minutes et renseignez les informations essentielles concernant votre activité.",
  },
  {
    number: "02",
    title: "Déposez vos documents",
    description:
      "Transmettez vos justificatifs directement depuis votre espace client, sans papier ni déplacement.",
  },
  {
    number: "03",
    title: "Nous nous occupons du reste",
    description:
      "Votre dossier est traité par notre équipe et vous gardez une vision claire de son avancement.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F7F8F6] text-[#17231D]">
      {/* NAVIGATION */}
      <header className="absolute left-0 right-0 top-0 z-50">
        <div className="mx-auto flex h-[82px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="text-[25px] font-semibold tracking-[-0.05em]"
          >
            fiduvia
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <a
              href="#services"
              className="text-[13px] font-medium text-[#53615A] transition hover:text-[#17231D]"
            >
              Services
            </a>

            <a
              href="#fonctionnement"
              className="text-[13px] font-medium text-[#53615A] transition hover:text-[#17231D]"
            >
              Fonctionnement
            </a>

            <a
              href="#a-propos"
              className="text-[13px] font-medium text-[#53615A] transition hover:text-[#17231D]"
            >
              À propos
            </a>

            <a
              href="#contact"
              className="text-[13px] font-medium text-[#53615A] transition hover:text-[#17231D]"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2.5 text-[13px] font-medium text-[#3F4D45] transition hover:bg-white sm:block"
            >
              Espace client
            </Link>

            <a
              href="#contact"
              className="rounded-full bg-[#17231D] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#293B31]"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* subtle decorative shapes */}
        <div className="pointer-events-none absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-[#E8EEE9] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-[#EDF1ED] opacity-80 blur-3xl" />

        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-16 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-24 lg:pt-36">
          {/* Hero copy */}
          <div className="max-w-[650px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#DCE3DD] bg-white/70 px-3.5 py-2 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#536B5C]" />
              <span className="text-[12px] font-medium tracking-[0.01em] text-[#53615A]">
                Fiduciaire suisse · 100% en ligne
              </span>
            </div>

            <h1 className="max-w-[680px] text-[48px] font-semibold leading-[1.04] tracking-[-0.055em] text-[#17231D] sm:text-[60px] lg:text-[70px]">
              Votre fiduciaire,
              <br />
              <span className="text-[#536B5C]">simplement.</span>
            </h1>

            <p className="mt-7 max-w-[570px] text-[17px] leading-8 text-[#66726B] sm:text-[18px]">
              Fiduvia vous accompagne dans votre comptabilité, votre fiscalité
              et vos démarches administratives. Une fiduciaire entièrement en
              ligne, pensée pour vous faire gagner du temps.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex h-[52px] items-center justify-center rounded-full bg-[#17231D] px-7 text-[14px] font-medium text-white shadow-[0_8px_25px_rgba(23,35,29,0.12)] transition hover:bg-[#293B31]"
              >
                Commencer avec Fiduvia
                <svg viewBox="0 0 20 20" fill="none" className="ml-2.5 h-4 w-4">
                  <path
                    d="M4 10h11M11 6l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>

              <Link
                href="/login"
                className="inline-flex h-[52px] items-center justify-center rounded-full border border-[#D5DDD7] bg-white/70 px-7 text-[14px] font-medium text-[#334139] transition hover:border-[#BFCAC2] hover:bg-white"
              >
                Accéder à mon espace
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] text-[#7A857E]">
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5ECE6]">
                  ✓
                </span>
                100% en ligne
              </span>

              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5ECE6]">
                  ✓
                </span>
                Accompagnement personnalisé
              </span>

              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5ECE6]">
                  ✓
                </span>
                Pensé pour la Suisse
              </span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-[510px] lg:ml-auto">
            <div className="relative rounded-[28px] border border-[#DCE3DD] bg-white p-3 shadow-[0_30px_80px_rgba(23,35,29,0.10)]">
              <div className="rounded-[21px] bg-[#F5F7F5] p-5 sm:p-7">
                {/* fake dashboard header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A948E]">
                      Espace client
                    </p>
                    <p className="mt-1 text-[18px] font-semibold tracking-[-0.03em]">
                      Bonjour Camille
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17231D] text-[11px] font-medium text-white">
                    CM
                  </div>
                </div>

                {/* status card */}
                <div className="mt-6 rounded-2xl border border-[#DCE3DD] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-[#89938D]">
                        État de votre dossier
                      </p>
                      <p className="mt-1 text-[15px] font-medium">
                        En cours de traitement
                      </p>
                    </div>

                    <span className="rounded-full bg-[#EAF1EB] px-2.5 py-1 text-[10px] font-medium text-[#536B5C]">
                      En cours
                    </span>
                  </div>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#E8ECE9]">
                    <div className="h-full w-[68%] rounded-full bg-[#536B5C]" />
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-[#8B958F]">
                    <span>Dossier reçu</span>
                    <span>68%</span>
                  </div>
                </div>

                {/* cards */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#DCE3DD] bg-white p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF2EE] text-[#536B5C]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-4 w-4"
                      >
                        <path d="M6 3h9l3 3v15H6z" />
                        <path d="M14 3v4h4" />
                        <path d="M9 12h6M9 16h6" />
                      </svg>
                    </div>

                    <p className="mt-3 text-[11px] text-[#8A948E]">Documents</p>
                    <p className="mt-0.5 text-[16px] font-semibold">12</p>
                  </div>

                  <div className="rounded-2xl border border-[#DCE3DD] bg-white p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF2EE] text-[#536B5C]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-4 w-4"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M3 10h18" />
                      </svg>
                    </div>

                    <p className="mt-3 text-[11px] text-[#8A948E]">
                      Prochain paiement
                    </p>
                    <p className="mt-0.5 text-[16px] font-semibold">CHF 450</p>
                  </div>
                </div>

                {/* action */}
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#17231D] px-4 py-3.5 text-white">
                  <div>
                    <p className="text-[11px] text-white/60">Action requise</p>
                    <p className="mt-0.5 text-[12px] font-medium">
                      Ajouter un document
                    </p>
                  </div>

                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                    →
                  </div>
                </div>
              </div>
            </div>

            {/* floating badge */}
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-[#DCE3DD] bg-white px-4 py-3 shadow-[0_15px_35px_rgba(23,35,29,0.10)] sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF1EB] text-[#536B5C]">
                  ✓
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#29342E]">
                    Gestion simplifiée
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#8A948E]">
                    Tout au même endroit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-[#E2E7E3] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-7 sm:px-8 md:flex-row lg:px-10">
          <p className="text-center text-[13px] text-[#78837C] md:text-left">
            Une nouvelle façon de gérer votre fiduciaire.
          </p>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[12px] font-medium text-[#68746C]">
            <span>Simple</span>
            <span>Digital</span>
            <span>Transparent</span>
            <span>Accessible</span>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-[620px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#65796C]">
              Nos services
            </p>

            <h2 className="mt-4 text-[38px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[48px]">
              La gestion de votre activité,
              <br />
              <span className="text-[#68776E]">sans complexité inutile.</span>
            </h2>

            <p className="mt-5 text-[16px] leading-7 text-[#707B74]">
              Nous centralisons les tâches fiduciaires essentielles afin que
              vous puissiez consacrer votre temps à ce qui compte réellement :
              votre activité.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-[#DDE4DF] bg-[#DDE4DF] md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.number}
                className="group bg-white p-7 transition hover:bg-[#F7F9F7] sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3EF] text-[#536B5C]">
                    {service.icon}
                  </div>

                  <span className="text-[11px] font-medium text-[#A0A9A3]">
                    {service.number}
                  </span>
                </div>

                <h3 className="mt-7 text-[18px] font-semibold tracking-[-0.02em]">
                  {service.title}
                </h3>

                <p className="mt-3 text-[13px] leading-6 text-[#768079]">
                  {service.description}
                </p>

                <div className="mt-6 text-[12px] font-medium text-[#536B5C] opacity-0 transition group-hover:opacity-100">
                  En savoir plus →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="fonctionnement" className="bg-[#F1F4F1] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#65796C]">
                Comment ça marche
              </p>

              <h2 className="mt-4 text-[38px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[48px]">
                Tout ce qu'il faut.
                <br />
                <span className="text-[#68776E]">Rien de superflu.</span>
              </h2>

              <p className="mt-5 max-w-[430px] text-[16px] leading-7 text-[#707B74]">
                Votre relation avec Fiduvia se fait en ligne, de manière simple
                et transparente, depuis votre espace personnel.
              </p>

              <a
                href="#contact"
                className="mt-8 inline-flex items-center text-[13px] font-medium text-[#536B5C] hover:text-[#17231D]"
              >
                Découvrir Fiduvia
                <span className="ml-2">→</span>
              </a>
            </div>

            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-[#D9E1DB] bg-white p-6 sm:p-7"
                >
                  <div className="flex gap-5 sm:gap-7">
                    <span className="pt-1 text-[12px] font-semibold text-[#718078]">
                      {step.number}
                    </span>

                    <div>
                      <h3 className="text-[18px] font-semibold tracking-[-0.02em]">
                        {step.title}
                      </h3>

                      <p className="mt-2.5 max-w-[560px] text-[13px] leading-6 text-[#78827C]">
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

      {/* ABOUT / TRUST */}
      <section id="a-propos" className="bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="rounded-[30px] bg-[#17231D] px-7 py-12 text-white sm:px-12 sm:py-16 lg:px-16">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  Pourquoi Fiduvia
                </p>

                <h2 className="mt-5 max-w-[700px] text-[36px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[48px]">
                  Une fiduciaire pensée pour la façon dont vous travaillez
                  aujourd'hui.
                </h2>

                <p className="mt-6 max-w-[620px] text-[15px] leading-7 text-white/60">
                  Plus besoin de multiplier les e-mails, les documents papier et
                  les déplacements. Fiduvia rassemble votre relation fiduciaire
                  dans un espace digital simple et accessible.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[28px] font-semibold tracking-[-0.04em]">
                    100%
                  </p>
                  <p className="mt-1 text-[11px] text-white/50">En ligne</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[28px] font-semibold tracking-[-0.04em]">
                    CH
                  </p>
                  <p className="mt-1 text-[11px] text-white/50">
                    Pensé pour la Suisse
                  </p>
                </div>

                <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-4 w-4"
                      >
                        <rect x="4" y="10" width="16" height="10" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </div>

                    <div>
                      <p className="text-[12px] font-medium">
                        Votre espace personnel
                      </p>
                      <p className="mt-1 text-[11px] text-white/50">
                        Documents, démarches et suivi centralisés.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="bg-[#F7F8F6] py-24 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#65796C]">
            Parlons de votre activité
          </p>

          <h2 className="mt-4 text-[40px] font-semibold leading-[1.08] tracking-[-0.05em] sm:text-[54px]">
            Prêt à simplifier
            <br />
            votre fiduciaire ?
          </h2>

          <p className="mx-auto mt-5 max-w-[540px] text-[16px] leading-7 text-[#707B74]">
            Contactez-nous pour discuter de votre situation et découvrir comment
            Fiduvia peut vous accompagner.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="mailto:contact@fiduvia.ch"
              className="inline-flex h-[52px] items-center justify-center rounded-full bg-[#17231D] px-7 text-[14px] font-medium text-white transition hover:bg-[#293B31]"
            >
              Prendre contact
              <span className="ml-2.5">→</span>
            </a>

            <Link
              href="/login"
              className="inline-flex h-[52px] items-center justify-center rounded-full border border-[#D5DDD7] bg-white px-7 text-[14px] font-medium text-[#334139] transition hover:border-[#BFCAC2]"
            >
              Espace client
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E0E5E1] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div>
              <Link
                href="/"
                className="text-[23px] font-semibold tracking-[-0.05em]"
              >
                fiduvia
              </Link>

              <p className="mt-2 max-w-[280px] text-[12px] leading-5 text-[#858E89]">
                Votre fiduciaire et partenaire comptable, entièrement en ligne.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[12px] text-[#69746D]">
              <a href="#services" className="hover:text-[#17231D]">
                Services
              </a>
              <a href="#fonctionnement" className="hover:text-[#17231D]">
                Fonctionnement
              </a>
              <a href="#a-propos" className="hover:text-[#17231D]">
                À propos
              </a>
              <a href="#contact" className="hover:text-[#17231D]">
                Contact
              </a>
              <Link href="/login" className="hover:text-[#17231D]">
                Espace client
              </Link>
            </div>
          </div>

          <div className="mt-9 flex flex-col justify-between gap-3 border-t border-[#ECEFEC] pt-5 text-[11px] text-[#929A95] sm:flex-row">
            <p>© {new Date().getFullYear()} Fiduvia. Tous droits réservés.</p>

            <div className="flex gap-5">
              <a href="#" className="hover:text-[#536B5C]">
                Politique de confidentialité
              </a>
              <a href="#" className="hover:text-[#536B5C]">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
