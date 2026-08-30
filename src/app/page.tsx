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

function Arrow() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--surface-page)] text-[var(--text-body)]">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header
        className="sticky top-0 z-40 border-b border-[var(--border-subtle)]"
        style={{
          background: "rgba(250, 247, 240, 0.9)",
          backdropFilter: "saturate(180%) blur(8px)",
          WebkitBackdropFilter: "saturate(180%) blur(8px)",
        }}
      >
        <nav
          className="fid-nav mx-auto flex items-center gap-[26px] px-6 py-[15px] sm:px-8 lg:px-[56px]"
          style={{
            maxWidth: "1380px",
          }}
        >
          {/* LOGO */}
          <Link
            href="/"
            className="mr-auto flex items-center gap-[11px] no-underline"
          >
            <span className="flex items-center gap-[16px] leading-none">
              <span className="h-[34px] w-[3px] shrink-0 rounded-[1px] bg-[var(--gold)]" />

              <span
                className="whitespace-nowrap text-[30px] font-medium tracking-[0.1em] text-[var(--text-strong)]"
                style={{
                  fontFamily: "var(--font-mark)",
                }}
              >
                F<span className="text-[0.76em] tracking-[0.13em]">IDUVIA</span>
              </span>
            </span>
          </Link>

          {/* NAVIGATION */}
          <Link
            href="#about"
            className="fid-navlink hidden whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors duration-150 hover:text-[var(--brand)] md:block"
          >
            Qui sommes-nous
          </Link>

          <Link
            href="#services"
            className="fid-navlink hidden whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors duration-150 hover:text-[var(--brand)] md:block"
          >
            Nos prestations
          </Link>

          <Link
            href="#steps"
            className="fid-navlink hidden whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors duration-150 hover:text-[var(--brand)] md:block"
          >
            Méthode
          </Link>

          <Link
            href="#tarifs"
            className="fid-navlink hidden whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors duration-150 hover:text-[var(--brand)] md:block"
          >
            Tarifs
          </Link>

          <Link
            href="#faq"
            className="fid-navlink hidden whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors duration-150 hover:text-[var(--brand)] md:block"
          >
            FAQ
          </Link>

          {/* LANGUAGE SWITCHER */}
          <div className="fid-lang hidden items-center gap-[4px] rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[3px] sm:flex">
            <button
              type="button"
              className="cursor-pointer rounded-[7px] border-0 bg-[var(--teal-100)] px-[10px] py-[5px] text-[13px] font-bold text-[var(--brand)]"
              style={{
                fontFamily: "var(--font-text)",
              }}
            >
              FR
            </button>

            <button
              type="button"
              className="cursor-pointer rounded-[7px] border-0 bg-transparent px-[10px] py-[5px] text-[13px] font-medium text-[var(--text-subtle)]"
              style={{
                fontFamily: "var(--font-text)",
              }}
            >
              EN
            </button>
          </div>

          {/* LOGIN */}
          <Link
            href="/login"
            className="flex shrink-0 items-center whitespace-nowrap rounded-[9px] bg-[var(--brand)] px-[18px] py-[10px] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[var(--brand-hover)]"
            style={{
              fontFamily: "var(--font-text)",
            }}
          >
            <span className="hidden sm:inline">Se connecter</span>
            <span className="sm:hidden">Connexion</span>
          </Link>

          {/* MOBILE BURGER */}
          <button
            type="button"
            className="fid-burger flex border-0 bg-transparent p-2 md:hidden"
            aria-label="Menu"
          >
            <span className="flex w-[19px] flex-col gap-[4px]">
              <span className="h-[2px] rounded-[2px] bg-[var(--text-strong)]" />
              <span className="h-[2px] rounded-[2px] bg-[var(--text-strong)]" />
              <span className="h-[2px] rounded-[2px] bg-[var(--text-strong)]" />
            </span>
          </button>
        </nav>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section
        id="home"
        className="relative min-h-[675px] overflow-hidden bg-[var(--surface-page)]"
      >
        {/* =====================================================
            FULL HERO BACKGROUND IMAGE
        ===================================================== */}
        <div className="absolute inset-0">
          <Image
            src="/hero-alpes.jpg"
            alt="Paysage des Alpes suisses"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* LEFT CREAM GRADIENT */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, #FAF7F0 0%, rgba(250,247,240,.99) 25%, rgba(250,247,240,.93) 39%, rgba(250,247,240,.70) 52%, rgba(250,247,240,.30) 70%, rgba(250,247,240,.06) 100%)",
            }}
          />

          {/* TOP/BOTTOM SOFTENING */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(250,247,240,.72) 0%, rgba(250,247,240,.08) 24%, rgba(250,247,240,.02) 65%, rgba(250,247,240,.60) 100%)",
            }}
          />
        </div>

        {/* =====================================================
            HERO CONTENT
        ===================================================== */}
        <div className="relative z-10 mx-auto flex min-h-[675px] w-full max-w-[1380px] items-center gap-[76px] px-6 pb-[62px] pt-[74px] sm:px-8 lg:px-[56px]">
          {/* ===================================================
              LEFT COPY
          =================================================== */}
          <div
            className="hero-copy"
            style={{
              flex: "1.45 1 0%",
              minWidth: "440px",
              paddingTop: "14px",
            }}
          >
            {/* EYEBROW */}
            <span className="fx-eyebrow">
              Fiduciaire en ligne · Vaud / Valais / Fribourg
            </span>

            {/* HEADING */}
            <h1
              className="disp"
              style={{
                fontWeight: 800,
                fontSize: "clamp(40px, 4.6vw, 58px)",
                lineHeight: 1.03,
                marginTop: "16px",
                maxWidth: "720px",
                letterSpacing: "-0.045em",
              }}
            >
              Votre déclaration d’impôts, entre de bonnes mains.
            </h1>

            {/* DESCRIPTION */}
            <div className="mt-5 flex max-w-[640px] flex-col gap-[13px]">
              <p
                className="m-0 text-[17px] leading-[1.55]"
                style={{
                  color: "var(--text-muted)",
                }}
              >
                Fiduvia est un service suisse d’assistance à la déclaration
                fiscale. Nous vous accompagnons dans la préparation de votre
                déclaration d’impôts, de la collecte de vos documents jusqu’à sa
                transmission à l’administration fiscale compétente.
              </p>

              <p
                className="m-0 text-[17px] leading-[1.55]"
                style={{
                  color: "var(--text-muted)",
                }}
              >
                Vous déposez simplement vos documents en ligne. Notre équipe les
                vérifie, prépare votre déclaration et s’occupe de sa
                transmission, en toute sécurité.
              </p>

              <p
                className="m-0 text-[17px] leading-[1.55]"
                style={{
                  color: "var(--text-muted)",
                }}
              >
                Un service simple, humain et sécurisé, conçu pour vous faire
                gagner du temps et éviter les erreurs.
              </p>

              {/* PROCESSING TIME */}
              <div className="mt-[3px] flex items-start gap-[11px]">
                <span
                  className="w-[2px] shrink-0 self-stretch rounded-[1px]"
                  style={{
                    background: "rgb(196, 162, 101)",
                  }}
                />

                <p
                  className="m-0 text-[15px] leading-[1.5]"
                  style={{
                    color: "var(--text-muted)",
                  }}
                >
                  Votre dossier est traité sous 10 jours ouvrables dès réception
                  de l’ensemble des documents nécessaires.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-[30px] flex flex-wrap items-center gap-[18px]">
              <Link
                href="/login"
                className="inline-flex items-center gap-[9px] rounded-[12px] bg-[var(--brand)] px-[26px] py-[15px] text-[16px] font-semibold text-white transition hover:bg-[var(--brand-hover)]"
                style={{
                  fontFamily: "var(--font-text)",
                }}
              >
                Remplir ma déclaration d'impôts
                <span className="text-[18px]">→</span>
              </Link>

              <span
                className="text-[14px]"
                style={{
                  color: "var(--text-muted)",
                }}
              >
                Déjà client ?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[var(--brand)]"
                >
                  Se connecter
                </Link>
              </span>
            </div>
          </div>

          {/* ===================================================
              RIGHT — PRICING SIMULATOR
          =================================================== */}
          <div
            id="pricing"
            className="relative z-10 w-full max-w-[395px] shrink-0 rounded-[18px] border border-[var(--border-subtle)] bg-white p-6 shadow-[0_18px_50px_rgba(15,42,63,.12)]"
          >
            {/* CARD HEADER */}
            <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-5">
              <div>
                <p className="fx-eyebrow text-[10px]">Simulateur de tarif</p>

                <h2
                  className="mt-2 text-[23px] font-bold tracking-[-0.03em]"
                  style={{
                    color: "var(--petrol-900)",
                  }}
                >
                  Votre tarif en quelques clics
                </h2>
              </div>

              <span
                className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.1em]"
                style={{
                  color: "var(--text-subtle)",
                }}
              >
                Sans engagement
              </span>
            </div>

            <div className="mt-5">
              {/* =================================================
                  ÉTAT CIVIL
              ================================================= */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--petrol-800)]">
                  État civil
                </p>

                <label className="flex cursor-pointer items-center gap-2 py-[5px] text-[13px] text-[var(--petrol-900)]">
                  <input
                    type="radio"
                    name="civil"
                    className="h-[17px] w-[17px] accent-[var(--brand)]"
                  />
                  Personne seule
                </label>

                <label className="flex cursor-pointer items-center gap-2 py-[5px] text-[13px] text-[var(--petrol-900)]">
                  <input
                    type="radio"
                    name="civil"
                    className="h-[17px] w-[17px] accent-[var(--brand)]"
                  />
                  Marié·e / partenariat
                </label>
              </div>

              <div className="my-3 h-px bg-[var(--border-subtle)]" />

              {/* =================================================
                  SITUATION PROFESSIONNELLE
              ================================================= */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--petrol-800)]">
                  Situation professionnelle
                </p>

                {[
                  "Étudiant / apprenti",
                  "Salarié·e",
                  "Rentier,ère (AVS, AI, LPP)",
                  "Chômage et/ou APG",
                  "Indépendant·e",
                  "Autre",
                ].map((item) => (
                  <label
                    key={item}
                    className="flex cursor-pointer items-center gap-2 py-[5px] text-[13px] text-[var(--petrol-900)]"
                  >
                    <input
                      type="radio"
                      name="professional"
                      className="h-[17px] w-[17px] accent-[var(--brand)]"
                    />
                    {item}
                  </label>
                ))}
              </div>

              {/* MORE */}
              <div className="mt-4 border-t border-[var(--border-subtle)] pt-4 text-center">
                <button
                  type="button"
                  className="text-[12px] font-semibold text-[var(--brand)]"
                >
                  Développer plus⌄
                </button>
              </div>

              {/* PRICE */}
              <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Total estimé
                    </p>

                    <p className="mt-1 text-[30px] font-semibold tracking-[-0.03em] text-[var(--petrol-900)]">
                      CHF —
                    </p>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 rounded-[10px] bg-[var(--brand)] px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-[var(--brand-hover)]"
                  >
                    Créer mon dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST BAR
      ========================================================= */}
      {/* =========================================================
    TRUST BAR
========================================================= */}
      <section className="bg-[var(--teal-600)]">
        <div
          className="fid-trust mx-auto flex flex-wrap items-center justify-center gap-x-[44px] gap-y-4 px-[34px] py-[22px]"
          style={{
            maxWidth: "1120px",
          }}
        >
          {/* +250 CLIENTS */}
          <span className="flex items-center gap-[10px] text-[14px] font-semibold text-white">
            <span
              className="h-[6px] w-[6px] shrink-0 rounded-full"
              style={{
                background: "var(--teal-300)",
                opacity: 0.75,
              }}
            />

            <span>+250 clients accompagnés</span>
          </span>

          {/* SWITZERLAND */}
          <span className="flex items-center gap-[10px] text-[14px] font-semibold text-white">
            <span
              className="h-[6px] w-[6px] shrink-0 rounded-full"
              style={{
                background: "var(--teal-300)",
                opacity: 0.75,
              }}
            />

            <span>Données hébergées en Suisse</span>
          </span>

          {/* CERTIFIED EXPERTS */}
          <span className="flex items-center gap-[10px] text-[14px] font-semibold text-white">
            <span
              className="h-[6px] w-[6px] shrink-0 rounded-full"
              style={{
                background: "var(--teal-300)",
                opacity: 0.75,
              }}
            />

            <span>Experts fiscaux certifiés</span>
          </span>
        </div>
      </section>

      {/* =========================================================
          ABOUT
      ========================================================= */}
      {/* =========================================================
    ABOUT / QUI SOMMES-NOUS
========================================================= */}
      <section
        id="about"
        className="mx-auto max-w-[1120px] px-[34px] py-[56px]"
      >
        {/* Eyebrow */}
        <span className="fx-eyebrow block text-center text-[var(--text-muted)]">
          Qui sommes-nous ?
        </span>

        {/* Heading */}
        <h2
          className="
      disp
      mt-[6px]
      w-full
      text-center
      text-[clamp(30px,4.4vw,50px)]
      font-extrabold
      leading-[1.05]
      tracking-[-0.035em]
    "
        >
          Une assistance fiscale simple, humaine et entièrement en ligne.
        </h2>

        {/* =======================================================
      KEY STATISTICS
  ======================================================= */}
        <div
          className="
      mt-[34px]
      grid
      w-full
      grid-cols-1
      gap-[32px]
      sm:grid-cols-3
    "
        >
          {/* 10 jours */}
          <div className="flex flex-col items-center gap-[3px] text-center">
            <span
              className="
          disp
          fx-figure
          text-[34px]
          font-extrabold
          leading-none
          text-[var(--brand)]
        "
            >
              10 jours*
            </span>

            <span className="text-center text-[13px] text-[var(--text-muted)]">
              de délai moyen de traitement
            </span>
          </div>

          {/* 3 cantons */}
          <div className="flex flex-col items-center gap-[3px] text-center">
            <span
              className="
          disp
          fx-figure
          text-[34px]
          font-extrabold
          leading-none
          text-[var(--brand)]
        "
            >
              3 cantons
            </span>

            <span className="text-center text-[13px] text-[var(--text-muted)]">
              Vaud · Valais · Fribourg
            </span>
          </div>

          {/* 100% */}
          <div className="flex flex-col items-center gap-[3px] text-center">
            <span
              className="
          disp
          fx-figure
          text-[34px]
          font-extrabold
          leading-none
          text-[var(--brand)]
        "
            >
              100 %
            </span>

            <span className="text-center text-[13px] text-[var(--text-muted)]">
              des échanges en ligne
            </span>
          </div>
        </div>

        {/* =======================================================
      DESCRIPTION
  ======================================================= */}
        <div className="mt-[34px] w-full">
          <p
            className="
        text-[15.5px]
        leading-[1.7]
        text-[var(--text-muted)]
        [text-wrap:pretty]
      "
          >
            Fiduvia est un service suisse d’assistance à la déclaration
            d’impôts, conçu pour simplifier une démarche souvent longue et
            complexe.
          </p>

          <p
            className="
        mt-[14px]
        text-[15.5px]
        leading-[1.7]
        text-[var(--text-muted)]
        [text-wrap:pretty]
      "
          >
            Vous nous transmettez vos documents directement depuis votre espace
            client. Un membre de notre équipe analyse votre dossier, prépare
            votre déclaration d’impôts et, lorsque le service le prévoit, la
            transmet aux autorités fiscales compétentes.
          </p>

          <p
            className="
        mt-[14px]
        text-[15.5px]
        leading-[1.7]
        text-[var(--text-muted)]
        [text-wrap:pretty]
      "
          >
            Notre objectif est simple : vous faire gagner du temps, réduire les
            risques d’erreur et vous permettre de réaliser votre déclaration
            sans rendez-vous, entièrement en ligne.
          </p>
        </div>

        {/* =======================================================
      FEATURE CARDS
  ======================================================= */}
        <div
          className="
      mt-[40px]
      grid
      grid-cols-1
      gap-[16px]
      sm:grid-cols-2
    "
        >
          {/* -------------------------------------------------------
        CARD 1 — Gestionnaire dédié
    ------------------------------------------------------- */}
          <div
            className="
        flex
        flex-col
        gap-[12px]
        rounded-[var(--radius-lg)]
        border
        border-[var(--border-subtle)]
        bg-[var(--surface-card)]
        p-[22px]
        shadow-[var(--shadow-xs)]
      "
          >
            {/* Icon */}
            <div
              className="
          flex
          h-[42px]
          w-[42px]
          shrink-0
          items-center
          justify-center
          rounded-[var(--radius-md)]
          bg-[var(--teal-100)]
          text-[var(--brand)]
        "
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
                <path d="M16 3.6a4 4 0 0 1 0 7.8" />
                <path d="M21.5 21a6.5 6.5 0 0 0-5-6.3" />
              </svg>
            </div>

            <div className="min-w-0">
              <h3
                className="
            disp
            m-0
            text-[17px]
            font-bold
          "
              >
                Un gestionnaire dédié
              </h3>

              <p
                className="
            mt-[5px]
            text-[13.5px]
            leading-[1.55]
            text-[var(--text-muted)]
          "
              >
                Votre dossier est attribué à un membre de notre équipe qui en
                assure le suivi tout au long du traitement.
              </p>
            </div>
          </div>

          {/* -------------------------------------------------------
        CARD 2 — Données traitées avec soin
    ------------------------------------------------------- */}
          <div
            className="
        flex
        flex-col
        gap-[12px]
        rounded-[var(--radius-lg)]
        border
        border-[var(--border-subtle)]
        bg-[var(--surface-card)]
        p-[22px]
        shadow-[var(--shadow-xs)]
      "
          >
            {/* Icon */}
            <div
              className="
          flex
          h-[42px]
          w-[42px]
          shrink-0
          items-center
          justify-center
          rounded-[var(--radius-md)]
          bg-[var(--teal-100)]
          text-[var(--brand)]
        "
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>

            <div className="min-w-0">
              <h3
                className="
            disp
            m-0
            text-[17px]
            font-bold
          "
              >
                Des données traitées avec soin
              </h3>

              <p
                className="
            mt-[5px]
            text-[13.5px]
            leading-[1.55]
            text-[var(--text-muted)]
          "
              >
                Vos documents et informations fiscales sont traités dans un
                environnement sécurisé et hébergés en Suisse.
              </p>
            </div>
          </div>

          {/* -------------------------------------------------------
        CARD 3 — Tarifs annoncés
    ------------------------------------------------------- */}
          <div
            className="
        flex
        flex-col
        gap-[12px]
        rounded-[var(--radius-lg)]
        border
        border-[var(--border-subtle)]
        bg-[var(--surface-card)]
        p-[22px]
        shadow-[var(--shadow-xs)]
      "
          >
            {/* Icon */}
            <div
              className="
          flex
          h-[42px]
          w-[42px]
          shrink-0
          items-center
          justify-center
          rounded-[var(--radius-md)]
          bg-[var(--teal-100)]
          text-[var(--brand)]
        "
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>

            <div className="min-w-0">
              <h3
                className="
            disp
            m-0
            text-[17px]
            font-bold
          "
              >
                Des tarifs annoncés à l’avance
              </h3>

              <p
                className="
            mt-[5px]
            text-[13.5px]
            leading-[1.55]
            text-[var(--text-muted)]
          "
              >
                Vous connaissez le prix de votre prestation avant de commencer.
                Aucun coût caché.
              </p>
            </div>
          </div>

          {/* -------------------------------------------------------
        CARD 4 — Service de A à Z
    ------------------------------------------------------- */}
          <div
            className="
        flex
        flex-col
        gap-[12px]
        rounded-[var(--radius-lg)]
        border
        border-[var(--border-subtle)]
        bg-[var(--surface-card)]
        p-[22px]
        shadow-[var(--shadow-xs)]
      "
          >
            {/* Icon */}
            <div
              className="
          flex
          h-[42px]
          w-[42px]
          shrink-0
          items-center
          justify-center
          rounded-[var(--radius-md)]
          bg-[var(--teal-100)]
          text-[var(--brand)]
        "
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
            </div>

            <div className="min-w-0">
              <h3
                className="
            disp
            m-0
            text-[17px]
            font-bold
          "
              >
                Un service de A à Z
              </h3>

              <p
                className="
            mt-[5px]
            text-[13.5px]
            leading-[1.55]
            text-[var(--text-muted)]
          "
              >
                Vous transmettez vos documents en ligne. Nous nous occupons de
                la préparation, de la saisie et de la transmission de votre
                déclaration.
              </p>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p
          className="
      mt-[16px]
      text-[12.5px]
      leading-[1.6]
      text-[var(--text-muted)]
      opacity-[0.85]
    "
        >
          *Délai moyen indicatif, à compter de la réception de l’ensemble des
          documents nécessaires au traitement du dossier.
        </p>
      </section>

      {/* =========================================================
          SERVICES
      ========================================================= */}
      <section id="services" className="bg-white py-28 sm:py-32">
        <div className="mx-auto w-full max-w-[1380px] px-6 sm:px-8 lg:px-14">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="fx-eyebrow">Nos prestations</p>

              <h2 className="mt-5 max-w-[700px] text-[42px] font-bold leading-[1] tracking-[-0.045em] sm:text-[54px]">
                Tout ce dont vous avez besoin,
                <br />
                <span className="text-[var(--brand)]">au même endroit.</span>
              </h2>
            </div>

            <p className="max-w-[350px] text-[14px] leading-6 text-[var(--text-muted)]">
              Une offre pensée pour simplifier votre quotidien et vous permettre
              de vous concentrer sur l'essentiel.
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-[18px] border border-[var(--border-subtle)] bg-[var(--border-subtle)] md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article
                key={service.number}
                className="group bg-white p-7 transition-colors hover:bg-[var(--surface-page)] sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="fx-figure text-[11px] text-[var(--brand)]">
                    {service.number}
                  </span>

                  <span className="text-[var(--neutral-400)] transition-transform group-hover:translate-x-1">
                    <Arrow />
                  </span>
                </div>

                <h3 className="mt-16 text-[21px] font-bold tracking-[-0.025em] text-[var(--petrol-900)]">
                  {service.title}
                </h3>

                <p className="mt-4 text-[13px] leading-6 text-[var(--text-muted)]">
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
        id="steps"
        className="bg-[var(--petrol-900)] py-28 text-white sm:py-32"
      >
        <div className="mx-auto w-full max-w-[1380px] px-6 sm:px-8 lg:px-14">
          <div className="grid gap-16 lg:grid-cols-[.8fr_1.2fr] lg:gap-28">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-300)]">
                Notre méthode
              </p>

              <h2 className="mt-5 max-w-[500px] text-[42px] font-bold leading-[1] tracking-[-0.045em] text-white sm:text-[55px]">
                Une expérience
                <br />
                <span className="text-[var(--teal-300)]">sans friction.</span>
              </h2>

              <p className="mt-7 max-w-[430px] text-[14px] leading-7 text-white/55">
                De la création de votre espace jusqu'à la finalisation de votre
                dossier, chaque étape est conçue pour être simple, claire et
                transparente.
              </p>
            </div>

            <div>
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="grid gap-5 border-t border-white/15 py-8 sm:grid-cols-[70px_1fr]"
                >
                  <span className="fx-figure text-[11px] text-[var(--teal-300)]">
                    {step.number}
                  </span>

                  <div>
                    <h3 className="text-[22px] font-bold text-white">
                      {step.title}
                    </h3>

                    <p className="mt-3 max-w-[560px] text-[13px] leading-6 text-white/50">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t border-white/15" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRICING
      ========================================================= */}
      <section id="tarifs" className="bg-[var(--surface-page)] py-28 sm:py-32">
        <div className="mx-auto w-full max-w-[1100px] px-6">
          <div className="text-center">
            <p className="fx-eyebrow">Tarifs</p>

            <h2 className="mt-5 text-[42px] font-bold tracking-[-0.045em] sm:text-[54px]">
              Des tarifs clairs.
            </h2>

            <p className="mx-auto mt-5 max-w-[600px] text-[15px] leading-7 text-[var(--text-muted)]">
              Une tarification transparente, adaptée à votre situation et sans
              mauvaise surprise.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {/* INDIVIDUAL */}
            <div className="rounded-[18px] border border-[var(--border-subtle)] bg-white p-7">
              <p className="fx-eyebrow text-[10px]">Particulier</p>

              <p className="fx-figure mt-5 text-[32px] font-semibold text-[var(--petrol-900)]">
                CHF 250.–
              </p>

              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                dès / déclaration
              </p>

              <div className="my-7 h-px bg-[var(--border-subtle)]" />

              <ul className="space-y-3 text-[12px] text-[var(--petrol-800)]">
                <li className="flex items-center gap-2">
                  <Check />
                  Déclaration fiscale
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  Analyse de votre situation
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  Suivi en ligne
                </li>
              </ul>
            </div>

            {/* INDEPENDENT */}
            <div className="relative rounded-[18px] border-2 border-[var(--brand)] bg-white p-7">
              <span className="absolute right-5 top-5 rounded-full bg-[var(--teal-100)] px-3 py-1 font-[var(--font-mono)] text-[9px] uppercase tracking-[0.08em] text-[var(--brand)]">
                Populaire
              </span>

              <p className="fx-eyebrow text-[10px]">Indépendant</p>

              <p className="mt-5 text-[32px] font-bold tracking-[-0.03em] text-[var(--petrol-900)]">
                Sur mesure
              </p>

              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                selon votre activité
              </p>

              <div className="my-7 h-px bg-[var(--border-subtle)]" />

              <ul className="space-y-3 text-[12px] text-[var(--petrol-800)]">
                <li className="flex items-center gap-2">
                  <Check />
                  Comptabilité
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  Fiscalité
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  Déclaration
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  Accompagnement
                </li>
              </ul>
            </div>

            {/* COMPANY */}
            <div className="rounded-[18px] border border-[var(--border-subtle)] bg-white p-7">
              <p className="fx-eyebrow text-[10px]">Entreprise</p>

              <p className="mt-5 text-[32px] font-bold tracking-[-0.03em] text-[var(--petrol-900)]">
                Sur mesure
              </p>

              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                selon vos besoins
              </p>

              <div className="my-7 h-px bg-[var(--border-subtle)]" />

              <ul className="space-y-3 text-[12px] text-[var(--petrol-800)]">
                <li className="flex items-center gap-2">
                  <Check />
                  Comptabilité complète
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  Fiscalité
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  Salaires & RH
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  Conseil
                </li>
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
            <p className="fx-eyebrow">FAQ</p>

            <h2 className="mt-5 text-[42px] font-bold tracking-[-0.045em] sm:text-[54px]">
              Questions fréquentes
            </h2>
          </div>

          <div className="mt-14 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[15px] font-semibold text-[var(--petrol-900)]">
                  {faq.question}

                  <span className="text-[var(--brand)] transition-transform group-open:rotate-45">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>

                <p className="mt-4 max-w-[700px] text-[13px] leading-6 text-[var(--text-muted)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTACT
      ========================================================= */}
      <section className="bg-[var(--surface-page)] px-6 py-28">
        <div className="mx-auto max-w-[900px] rounded-[28px] bg-[var(--petrol-900)] px-7 py-16 text-center sm:px-12 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-300)]">
            Parlons de votre situation
          </p>

          <h2 className="mt-5 text-[42px] font-bold leading-[1] tracking-[-0.045em] text-white sm:text-[56px]">
            Prêt à simplifier
            <br />
            votre fiduciaire ?
          </h2>

          <p className="mx-auto mt-6 max-w-[520px] text-[14px] leading-7 text-white/55">
            Une question ou besoin d'un accompagnement personnalisé ?
            Contactez-nous.
          </p>

          <a
            href="mailto:contact@fiduvia.ch"
            className="mt-8 inline-flex h-[50px] items-center justify-center gap-3 rounded-full bg-white px-7 text-[13px] font-semibold text-[var(--petrol-900)] transition hover:bg-[var(--surface-page)]"
          >
            Nous contacter
            <Arrow />
          </a>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="bg-[var(--petrol-900)] text-white">
        <div className="mx-auto w-full max-w-[1380px] px-6 py-14 sm:px-8 lg:px-14">
          <div className="grid gap-12 md:grid-cols-[1.5fr_.7fr_.7fr]">
            <div>
              <Link
                href="/"
                className="font-[var(--font-mark)] text-[30px] font-medium tracking-[-0.04em]"
              >
                fiduvia
              </Link>

              <p className="mt-5 max-w-[350px] text-[13px] leading-6 text-white/45">
                Votre fiduciaire suisse, entièrement en ligne. Simple,
                transparente et proche de vous.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                Navigation
              </p>

              <div className="mt-5 space-y-3 text-[12px] text-white/55">
                <a href="#about" className="block hover:text-white">
                  Qui sommes-nous ?
                </a>

                <a href="#services" className="block hover:text-white">
                  Nos prestations
                </a>

                <a href="#steps" className="block hover:text-white">
                  Méthode
                </a>

                <a href="#tarifs" className="block hover:text-white">
                  Tarifs
                </a>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                Contact
              </p>

              <div className="mt-5 space-y-3 text-[12px] text-white/55">
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

          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-[10px] text-white/30 sm:flex-row">
            <p>© {new Date().getFullYear()} Fiduvia. Tous droits réservés.</p>

            <div className="flex gap-6">
              <a href="#" className="hover:text-white/60">
                Politique de confidentialité
              </a>

              <a href="#" className="hover:text-white/60">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
