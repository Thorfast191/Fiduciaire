/**
 * French message bundle — the source of truth for the app's copy and for the
 * `Messages` shape every other locale must satisfy.
 *
 * Strings are kept byte-identical to what the pages rendered before i18n was
 * introduced, so the Playwright suite (which pins French labels, `getByLabel`
 * and `getByRole("button", …)`) keeps passing.
 */
export const fr = {
  nav: {
    about: "Qui sommes-nous",
    services: "Nos prestations",
    method: "Méthode",
    pricing: "Tarifs",
    faq: "FAQ",
    login: "Se connecter",
    loginShort: "Connexion",
    menu: "Menu",
  },

  hero: {
    eyebrow: "Fiduciaire en ligne · Vaud / Valais / Fribourg",
    title: "Votre déclaration d’impôts, entre de bonnes mains.",
    p1: "Fiduvia est un service suisse d’assistance à la déclaration fiscale. Nous vous accompagnons dans la préparation de votre déclaration d’impôts, de la collecte de vos documents jusqu’à sa transmission à l’administration fiscale compétente.",
    p2: "Vous déposez simplement vos documents en ligne. Notre équipe les vérifie, prépare votre déclaration et s’occupe de sa transmission, en toute sécurité.",
    p3: "Un service simple, humain et sécurisé, conçu pour vous faire gagner du temps et éviter les erreurs.",
    note: "Votre dossier est traité sous 10 jours ouvrables dès réception de l’ensemble des documents nécessaires.",
    cta: "Remplir ma déclaration d'impôts",
    already: "Déjà client ?",
  },

  sim: {
    eyebrow: "Simulateur de tarif",
    title: "Votre tarif en quelques clics",
    noCommitment: "Sans engagement",
    maritalStatus: "État civil",
    single: "Personne seule",
    couple: "Marié·e / partenariat",
    proSituation: "Situation professionnelle",
    proOptions: [
      "Étudiant / apprenti",
      "Salarié·e",
      "Rentier,ère (AVS, AI, LPP)",
      "Chômage et/ou APG",
      "Indépendant·e",
      "Autre",
    ],
    expand: "Développer plus",
    total: "Total estimé",
    create: "Créer mon dossier",
    breakdown: "Détail du calcul",
    baseLabel: "Tarif de base",
    fromPrefix: "dès",
    indicative:
      "Montant indicatif, hors suppléments éventuels. Le tarif définitif est confirmé à l'ouverture du dossier.",
    pickHint: "Sélectionnez votre situation pour obtenir une estimation.",
  },

  trust: {
    clients: "+250 clients accompagnés",
    hosting: "Données hébergées en Suisse",
    experts: "Experts fiscaux certifiés",
  },

  about: {
    eyebrow: "Qui sommes-nous ?",
    title: "Une assistance fiscale simple, humaine et entièrement en ligne.",
    p1: "Fiduvia est un service suisse d’assistance à la déclaration d’impôts, conçu pour simplifier une démarche souvent longue et complexe.",
    p2: "Vous nous transmettez vos documents directement depuis votre espace client. Un membre de notre équipe analyse votre dossier, prépare votre déclaration d’impôts et, lorsque le service le prévoit, la transmet aux autorités fiscales compétentes.",
    p3: "Notre objectif est simple : vous faire gagner du temps, réduire les risques d’erreur et vous permettre de réaliser votre déclaration sans rendez-vous, entièrement en ligne.",
    stats: [
      { value: "10 jours*", label: "de délai moyen de traitement" },
      { value: "3 cantons", label: "Vaud · Valais · Fribourg" },
      { value: "100 %", label: "des échanges en ligne" },
    ],
    values: [
      {
        title: "Un gestionnaire dédié",
        desc: "Votre dossier est attribué à un membre de notre équipe qui en assure le suivi tout au long du traitement.",
      },
      {
        title: "Des données traitées avec soin",
        desc: "Vos documents et informations fiscales sont traités dans un environnement sécurisé et hébergés en Suisse.",
      },
      {
        title: "Des tarifs annoncés à l’avance",
        desc: "Vous connaissez le prix de votre prestation avant de commencer. Aucun coût caché.",
      },
      {
        title: "Un service de A à Z",
        desc: "Vous transmettez vos documents en ligne. Nous nous occupons de la préparation, de la saisie et de la transmission de votre déclaration.",
      },
    ],
    footnote:
      "*Délai moyen indicatif, à compter de la réception de l’ensemble des documents nécessaires au traitement du dossier.",
  },

  services: {
    eyebrow: "Découvrez nos prestations",
    title: "Ce que nous faisons pour vous",
    items: [
      {
        title: "Déclaration d'impôts",
        desc: "La déclaration annuelle complète, pour salariés, rentiers et indépendants.",
      },
      {
        title: "Départ à l'étranger",
        desc: "En cas de départ à l'étranger en cours d'année qui revient à une période d'imposition limitée.",
      },
      {
        title: "Prestation en capital",
        desc: "Retrait LPP, 3e pilier ou capital-décès imposé séparément.",
      },
      {
        title: "Décès en cours d'année",
        desc: "En cas du décès d'une personne seule ou conjoint durant l'année.",
      },
      {
        title: "Simulation d'impôts",
        desc: "Estimez votre charge fiscale et les possibilités qui s'offrent à vous afin de l'optimiser.",
      },
      {
        title: "Détermination des acomptes",
        desc: "Calcul et ajustement de vos acomptes provisionnels.",
      },
    ],
    /**
     * The same prestations keyed by service type, for the portal and admin
     * where a dossier's type has to be named. `items` above stays an array
     * because the marketing grid renders it in the mockup's order.
     */
    types: {
      declaration: {
        name: "Déclaration d'impôts",
        desc: "La déclaration annuelle complète, pour salariés, rentiers et indépendants.",
      },
      capital: {
        name: "Prestation en capital",
        desc: "Retrait LPP, 3e pilier ou capital-décès imposé séparément.",
      },
      departure: {
        name: "Départ à l'étranger",
        desc: "En cas de départ à l'étranger en cours d'année qui revient à une période d'imposition limitée.",
      },
      deces: {
        name: "Décès en cours d'année",
        desc: "En cas du décès d'une personne seule ou conjoint durant l'année.",
      },
      simulation: {
        name: "Simulation d'impôts",
        desc: "Estimez votre charge fiscale et les possibilités qui s'offrent à vous afin de l'optimiser.",
      },
      acompte: {
        name: "Détermination des acomptes",
        desc: "Calcul et ajustement de vos acomptes provisionnels.",
      },
      relecture: {
        name: "Relecture",
        desc: "Relecture de votre déclaration d'impôt déjà préparée.",
      },
    },
  },

  steps: {
    eyebrow: "Comment ça marche",
    title: "Votre déclaration d'impôts en 3 étapes, entièrement en ligne.",
    items: [
      {
        number: "01",
        title: "Créez votre compte",
        desc: "Créez votre compte Fiduvia en quelques clics et accédez à votre espace client sécurisé. Vous pourrez ensuite choisir la prestation adaptée à votre situation.",
      },
      {
        number: "02",
        title: "Déposez vos informations et documents",
        desc: "Répondez aux questions concernant votre situation fiscale et transmettez directement vos documents depuis votre espace client. Notre équipe dispose ainsi de toutes les informations nécessaires pour traiter votre dossier.",
      },
      {
        number: "03",
        title: "Nous préparons et transmettons votre déclaration",
        desc: "Un membre de notre équipe analyse votre dossier, prépare votre déclaration d'impôts et vérifie les informations fournies. Une fois le dossier finalisé, nous transmettons votre déclaration aux autorités fiscales compétentes lorsque cette prestation est comprise dans votre service.",
      },
    ],
  },


  pricing: {
    eyebrow: "Tarifs",
    title: "Des prix clairs, sans surprise",
    sub: "Un prix fixe annoncé avant de commencer. Pas d'honoraires cachés.",
    from: "Dès",
    choose: "Choisir",
    plans: [
      {
        name: "Personne seule",
        price: "CHF 80",
        features: [
          "Déclaration complète",
          "Vérification par un·e fiduciaire",
          "Dépôt auprès de l'administration",
        ],
      },
      {
        name: "Marié·e / couple",
        price: "CHF 120",
        features: [
          "Déclaration commune",
          "Optimisation des déductions",
          "Suivi jusqu'à la taxation",
        ],
      },
      {
        name: "Indépendant·e",
        price: "CHF 250",
        features: [
          "Revenus d'activité indépendante",
          "Comptes et amortissements",
          "Conseil fiscal personnalisé",
        ],
      },
    ],
  },


  faq: {
    eyebrow: "FAQ",
    title: "Questions fréquentes",
    allButton: "Afficher toutes les questions",
    items: [
      {
        q: "Qu’est-ce que Fiduvia ?",
        a: "Fiduvia est un service suisse d’assistance à la déclaration fiscale. Nous accompagnons les particuliers dans la préparation de leur déclaration d’impôts, entièrement en ligne, sans rendez-vous.",
      },
      {
        q: "Dans quels cantons Fiduvia est-il disponible ?",
        a: "Fiduvia est actuellement disponible pour les contribuables des cantons de Vaud, Fribourg et Valais.",
      },
      {
        q: "Comment fonctionne Fiduvia ?",
        a: "C’est simple : vous créez votre compte, répondez aux questions concernant votre situation fiscale et déposez vos documents directement dans votre espace client. Notre équipe analyse ensuite votre dossier, prépare votre déclaration et la transmet aux autorités fiscales compétentes lorsque cette prestation est comprise dans votre service.",
      },
      {
        q: "Quels documents dois-je fournir ?",
        a: "Les documents nécessaires dépendent de votre situation. Il peut notamment s’agir de certificats de salaire, attestations bancaires, documents liés à votre logement, assurances, prévoyance, dettes, frais professionnels, biens immobiliers ou autres justificatifs fiscaux.\\nNotre questionnaire vous indique les documents nécessaires à votre situation.",
      },
      {
        q: "Dois-je me déplacer ou prendre rendez-vous ?",
        a: "Non. Fiduvia fonctionne entièrement en ligne. Vous pouvez transmettre vos informations et vos documents depuis votre espace client, où que vous soyez.",
      },
      {
        q: "Combien de temps faut-il pour traiter ma déclaration ?",
        a: "Le délai moyen de traitement est d’environ 10 jours ouvrables, à compter de la réception de l’ensemble des informations et documents nécessaires.\\nLes délais peuvent varier selon la complexité du dossier et la période de l’année.",
      },
      {
        q: "Qui traite ma déclaration ?",
        a: "Votre dossier est traité par un membre de l’équipe Fiduvia. Un gestionnaire peut être attribué à votre dossier afin d’en assurer le suivi pendant son traitement.",
      },
      {
        q: "Fiduvia transmet-elle ma déclaration aux autorités fiscales ?",
        a: "Oui. Lorsque votre prestation comprend la transmission, Fiduvia prépare et transmet votre déclaration aux autorités fiscales compétentes, conformément aux instructions et à l’autorisation que vous nous donnez dans le cadre de votre commande.",
      },
      {
        q: "Est-ce que Fiduvia garantit que je paierai moins d’impôts ?",
        a: "Non. Notre objectif est de préparer une déclaration complète et conforme aux informations et justificatifs que vous nous fournissez, en tenant compte des déductions applicables à votre situation.\\nLe montant final de l’impôt relève de la compétence de l’autorité fiscale.",
      },
      {
        q: "Mes données fiscales sont-elles sécurisées ?",
        a: "Nous accordons une attention particulière à la sécurité des données fiscales et financières que vous nous transmettez.\\nLes données et documents sont traités via notre espace client et notre infrastructure d’hébergement prévue en Suisse. L’accès aux dossiers est limité aux personnes autorisées.\\nVous trouverez davantage d’informations dans notre Politique de confidentialité.",
      },
      {
        q: "Où sont stockés mes documents ?",
        a: "Fiduvia prévoit de stocker les données et documents clients sur une infrastructure Infomaniak en Suisse, conformément à notre architecture de production.",
      },
      {
        q: "Combien de temps conservez-vous mes documents ?",
        a: "Nous conservons certaines informations et pièces justificatives pendant la durée nécessaire à la fourniture de nos Services et au respect de nos obligations légales, notamment les obligations de conservation applicables en matière fiscale et comptable.\\nLes modalités précises sont détaillées dans notre Politique de confidentialité.",
      },
      {
        q: "Puis-je supprimer mon compte ?",
        a: "Oui. Vous pouvez demander la suppression de votre compte. Certaines données peuvent toutefois devoir être conservées lorsque la loi nous impose une obligation de conservation.",
      },
      {
        q: "Combien coûte le service ?",
        a: "Le prix dépend de votre situation fiscale et de la complexité de votre dossier. Le tarif applicable vous est communiqué avant le paiement, afin que vous connaissiez le prix de la prestation avant de commencer.",
      },
      {
        q: "Comment puis-je payer ?",
        a: "Le paiement peut être effectué en ligne via les moyens de paiement proposés au moment de la commande, notamment Stripe et, lorsque disponible, TWINT.",
      },
      {
        q: "Puis-je annuler ma commande ?",
        a: "Vous pouvez demander l’annulation et le remboursement tant que Fiduvia n’a pas commencé le traitement de votre dossier. Une fois le traitement commencé, les conditions de remboursement prévues dans nos CGVU s’appliquent.",
      },
      {
        q: "Fiduvia remplace-t-elle l’administration fiscale ?",
        a: "Non. Fiduvia est un prestataire d’assistance à la déclaration fiscale. Les autorités fiscales restent compétentes pour examiner, accepter, modifier ou rectifier votre déclaration.",
      },
      {
        q: "Puis-je contacter Fiduvia si j’ai une question ?",
        a: "Oui. Vous pouvez nous contacter à contact@fiduvia.ch ou utiliser les moyens de contact disponibles sur notre Site.",
      },
    ],
  },

  contact: {
    title: "Une question ? Écrivez-nous",
    sub: "Décrivez votre situation, nous revenons vers vous sous 24 heures ouvrées.",
    emailField: "E-mail",
    hoursTitle: "Horaires",
    hoursDays: "Lundi – Vendredi",
    hoursTime: "08h30 – 12h00 · 13h30 – 17h30",
    lastName: "Nom",
    firstName: "Prénom",
    email: "E-mail",
    phone: "Téléphone",
    message: "Votre message",
    note: "Nous répondons sous 24 heures ouvrées. Merci de ne pas transmettre de documents fiscaux par ce formulaire.",
    send: "Envoyer le message",
    sending: "Envoi en cours...",
    sent: "Message envoyé. Nous vous répondrons rapidement.",
  },


  footer: {
    tagline:
      "Service d'aide à la taxation, pour le canton de Vaud, Valais et Fribourg",
    socialTitle: "Suivez-nous",
    contactTitle: "Comment nous contacter",
    addressLine1: "Rue de Bourg 12",
    addressLine2: "1003 Lausanne",
    phone: "+41 21 000 00 00",
    email: "contact@fiduvia.ch",
    hours: "Lundi – vendredi, 8h30 – 17h30",
    reply: "Réponse sous 24 heures ouvrées",
    legalTitle: "Légal",
    privacy: "Politique de confidentialité",
    legal: "Mentions légales / Impressum",
    terms: "Conditions générales de vente et d'utilisation",
    cookies: "Politique relative aux cookies",
    rights: "Lausanne",
    hosted: "Données hébergées en Suisse",
    clientArea: "Espace client",
  },


  auth: {
    brand: "fiduvia",
    tagline: "Fiduciaire & comptabilité en ligne",
    rights: "Votre fiduciaire, entièrement en ligne.",

    login: {
      title: "Connexion à votre espace",
      sub: "Accédez à vos documents et suivez votre déclaration.",
      emailPlaceholder: "camille@exemple.ch",
      passwordPlaceholder: "••••••••",
      submit: "Se connecter",
      loading: "Connexion...",
      forgot: "Mot de passe oublié ?",
      noAccount: "Pas encore de compte ?",
      createAccount: "Créer un compte",
      secureTitle: "Connexion sécurisée",
      secureBody:
        "Une vérification supplémentaire sera demandée après votre connexion.",
    },

    signup: {
      eyebrow: "Bienvenue chez Fiduvia",
      title: "Créer mon compte",
      sub: "Créez votre espace personnel pour gérer vos documents, démarches et échanges avec Fiduvia.",
      submit: "Créer mon compte",
      loading: "Création du compte...",
      emailHint:
        "Cette adresse sera utilisée pour la vérification de votre compte.",
      passwordTitle: "Votre mot de passe doit contenir :",
      passwordRule: "Au moins 10 caractères",
      passwordMismatch: "Les deux mots de passe ne correspondent pas.",
      termsLabel: "J'accepte les conditions générales et la politique de confidentialité.",
      termsLinkCgv: "conditions générales",
      termsLinkPrivacy: "politique de confidentialité",
      termsRequired: "Vous devez accepter les conditions générales pour créer un compte.",
      hasAccount: "Vous avez déjà un compte ?",
      login: "Se connecter",
      secureTitle: "Création de compte sécurisée",
      secureBody:
        "Votre adresse e-mail sera vérifiée avant l'accès à votre espace client.",
    },

    verify: {
      title: "Vérification de sécurité",
      intro:
        "Pour protéger votre compte, nous avons envoyé un code de vérification à l'adresse suivante :",
      codeLabel: "Code de vérification",
      codeHint: "Entrez les 6 chiffres reçus par e-mail.",
      submit: "Vérifier le code",
      loading: "Vérification...",
      notReceived: "Vous n'avez pas reçu le code ?",
      notReceivedBody:
        "Vérifiez votre dossier courrier indésirable ou revenez en arrière pour recommencer.",
      warning:
        "Ne partagez jamais votre code de vérification avec une autre personne.",
      fallback: "Chargement...",
    },

    forgot: {
      title: "Mot de passe oublié ?",
      sub: "Entrez l'adresse e-mail associée à votre compte. Si elle correspond à un compte Fiduvia, nous vous enverrons un code permettant de réinitialiser votre mot de passe.",
      submit: "Envoyer le code",
      loading: "Envoi en cours...",
      doneTitle: "Vérifiez votre e-mail",
      doneBody:
        "Si un compte existe avec cette adresse, un code de réinitialisation a été envoyé.",
      backToLogin: "Retour à la connexion",
      privacyTitle: "Vos informations restent protégées",
      privacyBody:
        "Pour votre sécurité, nous ne vous indiquons pas si une adresse e-mail possède un compte Fiduvia.",
    },

    reset: {
      title: "Réinitialiser votre mot de passe",
      sub: "Saisissez le code reçu par e-mail et choisissez un nouveau mot de passe pour sécuriser votre compte.",
      submit: "Réinitialiser le mot de passe",
      loading: "Réinitialisation...",
      backToLogin: "Retour à la connexion",
      codeHint:
        "Consultez votre boîte de réception et votre dossier courrier indésirable.",
      passwordTitle: "Votre mot de passe doit contenir :",
      rule1: "Au moins 10 caractères",
      rule2: "Une combinaison difficile à deviner",
      secureTitle: "Réinitialisation sécurisée",
      secureBody:
        "Votre code de vérification est nécessaire pour modifier votre mot de passe.",
    },

    fields: {
      firstName: "Prénom",
      firstNamePlaceholder: "Votre prénom",
      lastName: "Nom",
      lastNamePlaceholder: "Votre nom",
      email: "Adresse e-mail",
      emailPlaceholder: "vous@exemple.ch",
      password: "Mot de passe",
      passwordPlaceholder: "Votre mot de passe",
      newPassword: "Nouveau mot de passe",
      newPasswordPlaceholder: "Choisissez un mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      confirmPasswordPlaceholder: "Saisissez à nouveau le mot de passe",
      resetPasswordPlaceholder: "Choisissez un nouveau mot de passe",
      code: "Code de vérification",
      codePlaceholder: "Entrez le code reçu par e-mail",
      codeShort: "6 chiffres",
    },
  },

  portal: {
    spaceTitle: "Mon espace",
    spaceTag: "Espace client",
    greeting: "Bonjour",
    greetingSub: "Voici où en sont vos démarches fiscales.",
    period: "Période",
    myDossiers: "Mes dossiers fiscaux",
    noDossiers: "Aucun dossier pour le moment.",
    dossier: "Dossier",
    helpDocsTitle: "Documents d'aide",
    helpDoc1: "Liste des documents à fournir",
    helpDoc2: "Marche à suivre du site",
    comingSoon: "Bientôt disponible",
    deadlinesTitle: "Délais",
    deadline1Label: "Première échéance",
    deadline1Note: "Délai légal pour déposer sa déclaration d'impôt.",
    deadline2Label: "Deuxième échéance",
    deadline2Note:
      "Délai de tolérance pour déposer sa déclaration d'impôt sans démarches.",
    accountLabel: "Votre compte",
    accountNote:
      "Votre espace est personnel. Vos documents ne sont accessibles qu'aux personnes autorisées.",
    dossierBack: "Retour à mes dossiers",
    dossierTitle: "Mon dossier fiscal",
    dossierSub:
      "Consultez l'avancement de votre dossier, transmettez vos documents et suivez les prochaines étapes.",
    dossierSecureTitle: "Vos documents sont protégés",
    dossierSecureBody:
      "Les informations et documents transmis à Fiduvia sont accessibles uniquement aux personnes autorisées.",
    declEyebrowTodo: "À COMPLÉTER",
    declEyebrowDone: "TRANSMISE",
    declTitle: "Ma déclaration d'impôts",
    declSub:
      "Déposez vos documents et suivez l'avancement de votre déclaration d'impôt.",
    declOpen: "Ouvrir ma déclaration",
    declNoneTitle: "Aucun dossier pour cette période",
    declNoneSub:
      "Votre dossier sera ouvert par notre équipe. Vous serez averti par e-mail dès qu'il sera disponible.",
    contactsTitle: "Contacts",
    contactsSub: "Écrivez-nous, ou joignez directement votre fiduciaire.",
    contactsFormTitle: "Envoyer un message",
    contactsSubject: "Sujet",
    contactsSubjectPh: "Objet de votre demande",
    contactsMessage: "Message",
    contactsMessagePh: "Votre message...",
    contactsSend: "Envoyer",
    contactsSending: "Envoi en cours…",
    contactsSent: "Merci, votre message a bien été envoyé.",
    contactsNote:
      "Nous répondons sous 24 heures ouvrées. Merci de ne pas transmettre de documents fiscaux via ce formulaire.",
    contactsReach: "Nous joindre",
    contactsEmail: "E-mail",
    contactsPhone: "Téléphone",
    contactsAddress: "Adresse",
    contactsHours: "Horaires",
    contactsHoursDays: "Lundi - Vendredi",
    contactsHoursTime: "08h30 - 12h00 · 13h30 - 17h30",
    contactsErrEmpty: "Merci de renseigner un sujet et un message.",
    noticeDocumentsTitle: "Pièces complémentaires demandées",
    noticeDocumentsBody:
      "Votre fiduciaire vous demande de transmettre des pièces complémentaires pour ce dossier.",
    noticeActionTitle: "Action requise",
    noticeActionBody: "Votre dossier nécessite une action de votre part.",
    noticeAck: "J'ai compris",
    logout: "Se déconnecter",
    nav: {
      servicesHead: "Prestations",
      taxReturns: "Déclarations d'impôts",
      capital: "Prestation en capital",
      simulation: "Simulation d'impôts",
      instalments: "Détermination acomptes",
      review: "Relecture",
      departure: "Départ à l'étranger",
      deces: "Décès en cours d'année",
      otherHead: "Divers",
      assistance: "Fiduvia Assistance",
      payments: "Paiements",
      contacts: "Contacts",
    },

    prestation: {
      newRequest: "Nouvelle demande",
      yearLabel: "Année fiscale",
      creating: "Création en cours...",
      noItems: "Vous n'avez encore aucune demande pour cette prestation.",
      noPeriod:
        "Aucune période fiscale n'est ouverte actuellement. Revenez prochainement ou contactez-nous.",
      itemLabel: "Demande",
      open: "Ouvrir",
      backToPortal: "Retour à mon espace",
      requestFailed:
        "La demande n'a pas pu être créée. Veuillez réessayer.",
    },
  },

  documents: {
    fiscalDossier: "Dossier fiscal",
    title: "Documents",
    statusLabel: "Statut",
    addTitle: "Ajouter un document",
    empty: "Aucun document pour le moment.",
    loading: "Chargement…",
    uploading: "Envoi en cours…",
    download: "Télécharger",
    remove: "Supprimer",
    markSubmitted: "Marquer comme soumis",
    errTooLarge: "Fichier trop volumineux (20 Mo maximum).",
    errType: "Type de fichier non autorisé (PDF, JPG ou PNG uniquement).",
    errStart: "Impossible de démarrer l'envoi.",
    errUpload: "Échec de l'envoi du fichier.",
    errConfirm: "Échec de la confirmation de l'envoi.",
    errDownload: "Impossible de récupérer le lien de téléchargement.",
    errDelete: "Échec de la suppression.",
    errSubmit: "Échec de la soumission du dossier.",
    categories: {
      salaire: "Certificat de salaire",
      releves_bancaires: "Relevés bancaires",
      assurance: "Attestations d'assurance",
      pilier3: "3e pilier",
      justificatifs: "Justificatifs divers",
      autre: "Autre",
    },
  },

  admin: {
    title: "Administration",
    period: "Période",
    fiscalPeriod: "Période fiscale",
    backHome: "Retour à la page d'accueil",
    hub: {
      title: "Dossiers",
      sub: "Les prestations que nous prenons en charge, et les dossiers en cours pour chacune.",
      active: "dossiers actifs",
      declarations: "Déclarations d'impôts",
      declarationsDesc:
        "Tous les dossiers clients, recherche et filtre par statut.",
      capital: "Prestations en capital",
      capitalDesc: "Retraits de 2e / 3e pilier transmis par les clients.",
      simulations: "Simulations d'impôt",
      simulationsDesc: "Simulations d'impôt transmises par les clients.",
      instalments: "Déterminations d'acomptes",
      instalmentsDesc: "Demandes d'acomptes transmises par les clients.",
      reviews: "Relectures de déclaration",
      reviewsDesc: "Relectures de déclaration transmises par les clients.",
    },
    notify: {
      button: "Demander des pièces",
      title: "Notifier le client",
      sub: "Le client reçoit un e-mail et voit la demande dans son espace.",
      kindDocuments: "Demande de pièces complémentaires",
      kindAction: "Action requise sur le dossier",
      messageLabel: "Message (facultatif)",
      messagePlaceholder: "Précisez les pièces attendues…",
      send: "Envoyer la notification",
      sending: "Envoi…",
      sent: "Notification envoyée au client.",
      cancel: "Annuler",
    },
    periods: {
      title: "Périodes fiscales",
      cardTitle: "Périodes fiscales",
      cardSub: "Créez et activez les périodes ouvertes aux clients.",
      create: "Créer la période",
      active: "Active",
      inactive: "Inactive",
      activate: "Activer",
      deactivate: "Désactiver",
      empty: "Aucune période fiscale pour le moment.",
      working: "…",
    },
    users: {
      title: "Gestion des utilisateurs",
      sub: "Comptes administrateurs et comptes clients de la plateforme.",
      adminsTitle: "Comptes administrateurs",
      adminsSub:
        "Ajoutez ou retirez les gestionnaires ayant accès à l'espace administrateur.",
      superBadge: "SUPER ADMIN",
      remove: "Retirer",
      addTitle: "Ajouter un administrateur",
      addBtn: "Ajouter l'administrateur",
      adding: "Ajout…",
      clientsTitle: "Comptes clients",
      clientsSub: "Les personnes disposant d'un espace client.",
      noClients: "Aucun compte client pour le moment.",
      onlySuperAdmin:
        "Seul un super administrateur peut gérer les comptes administrateurs.",
    },
    stats: {
      title: "Statistiques",
      sub: "Activité de l'ensemble des dossiers pour la période sélectionnée.",
      processed: "DOSSIERS TRAITÉS",
      processedSub: "clôturés cette période",
      inProgress: "DOSSIERS EN COURS",
      inProgressSub: "pas encore traités",
      clients: "CLIENTS",
      clientsSub: "comptes actifs",
    },
    dashTitle: "Espace administrateur",
    dashSub: "Vos dossiers pour la période fiscale en cours.",
    roleAdmin: "Administrateur",
    roleSuper: "Super admin",
    kpiDossiers: "DOSSIERS",
    kpiDossiersSub: "toutes prestations confondues",
    kpiCompleted: "DOSSIERS TRAITÉS",
    kpiCompletedSub: "clôturés cette période",
    kpiClients: "CLIENTS",
    kpiClientsSub: "comptes actifs",
    distTitle: "Répartition par statut",
    byYearTitle: "Dossiers par année fiscale",
    byPrestationTitle: "Dossiers par prestation",
    noDossiers: "Aucun dossier.",
    nav: {
      home: "Accueil",
      dossiers: "Dossiers",
      stats: "Statistiques",
      periods: "Périodes",
      users: "Utilisateurs",
    },
    dossiers: {
      title: "Dossiers",
      sub: "Créez et suivez les dossiers fiscaux de vos clients.",
      count: "dossier",
      countPlural: "dossiers",
      empty: "Aucun dossier pour le moment.",
      recentOf: "Les {n} dossiers les plus récents sur {total}.",
      thClient: "Client",
      searchPlaceholder: "Rechercher un client...",
      thReceived: "Date de réception",
      allStatuses: "Tous les statuts",
      noMatch: "Aucun dossier ne correspond à cette recherche.",
      statusSaving: "Enregistrement…",
      thStatus: "Statut",
      thYear: "Année",
      thCreated: "Créé le",
      createTitle: "Créer un dossier",
      createSub: "Créez un nouveau dossier fiscal pour un client.",
      clientIdLabel: "Identifiant du client",
      clientIdPlaceholder: "Ex. cli_8f92...",
      taxYearLabel: "Année fiscale",
      createSubmit: "Créer le dossier",
      creating: "Création...",
      statusTitle: "Modifier le statut",
      statusSub: "Mettez à jour l'état d'avancement d'un dossier.",
      dossierIdLabel: "Identifiant du dossier",
      dossierIdPlaceholder: "Ex. dos_8f92...",
      newStatusLabel: "Nouveau statut",
      statusSubmit: "Mettre à jour le statut",
      updating: "Mise à jour...",
      created: "Dossier créé :",
      statusUpdated: "Le statut du dossier a été mis à jour.",
      errClientId: "Veuillez renseigner l'identifiant du client.",
      errTaxYear: "Veuillez renseigner une année fiscale valide.",
      errCreate: "Échec de la création du dossier.",
      errDossierId: "Veuillez renseigner l'identifiant du dossier.",
      errStatus: "Échec du changement de statut.",
    },
  },

  status: {
    not_started: "Non commencé",
    submitted: "Soumis",
    in_review: "En cours de traitement",
    completed: "Terminé",
  },

  legal: {
    backHome: "Retour à l'accueil",
    pendingTitle: "Document en cours de rédaction",
    pendingBody:
      "Ce document est en cours de rédaction avec notre conseil juridique et sera publié avant la mise en service de la plateforme. Pour toute question sur le traitement de vos données dans l'intervalle, écrivez-nous.",
    controllerTitle: "Responsable du traitement",
    privacyTitle: "Politique de confidentialité",
    privacyIntro:
      "Comment Fiduvia collecte, utilise et protège vos données personnelles.",
    noticeTitle: "Mentions légales",
    noticeIntro: "Informations légales sur l'éditeur du site.",
  },
  common: {
    errTitle: "Une erreur est survenue",
    errBody:
      "Nous n'avons pas pu charger cette page correctement. Veuillez réessayer ou revenir à l'accueil.",
    errRetry: "Réessayer",
    errHome: "Retour à l'accueil",
    errPersists: "Le problème persiste ?",
    errReassure:
      "Vos données et documents restent protégés. Notre équipe peut intervenir si le problème persiste.",
    comingSoonTag: "bientôt",
    comingSoonTitle: "Bientôt disponible",
    genericError:
      "Une erreur est survenue. Veuillez réessayer dans quelques instants.",
    errorTitle: "Une erreur est survenue",
    errorBody:
      "Veuillez réessayer ou revenir à l'accueil. Notre équipe a été informée.",
    close: "Fermer",
  },
};

export type Messages = typeof fr;
