import type { Messages } from "./fr";

/**
 * English message bundle.
 *
 * Marketing copy is the client's own English, lifted from the mockup's
 * `const EN = Object.assign({}, FR, {…})` block (`Fiduvia.dc.html:4689`) —
 * `aboutP1`–`aboutP3`, `services`, `prestations`, `steps`, `faq`, the hero,
 * the trust band and the footer all come from there verbatim. Strings with no
 * counterpart in the mockup (this platform's dossier/admin screens) are
 * translated to match its register.
 */
export const en: Messages = {
  nav: {
    about: "About us",
    services: "Our services",
    method: "Method",
    pricing: "Pricing",
    faq: "FAQ",
    login: "Log in",
    loginShort: "Log in",
    menu: "Menu",
  },

  hero: {
    eyebrow: "Online accounting firm · Vaud / Valais / Fribourg",
    title: "Your tax return, in good hands.",
    p1: "Fiduvia is a Swiss tax return assistance service. We support you in preparing your tax return, from collecting your documents through to filing it with the competent tax authority.",
    p2: "You simply upload your documents online. Our team checks them, prepares your return and handles the filing, securely.",
    p3: "A simple, human and secure service, designed to save you time and avoid mistakes.",
    note: "Your file is processed within 10 working days of receiving all the required documents.",
    cta: "File my tax return",
    already: "Already a client?",
  },

  sim: {
    eyebrow: "Pricing simulator",
    title: "Your price in a few clicks",
    noCommitment: "No commitment",
    maritalStatus: "Marital status",
    single: "Single person",
    couple: "Married / partnership",
    proSituation: "Employment situation",
    proOptions: [
      "Student / apprentice",
      "Employee",
      "Pensioner (AVS, AI, LPP)",
      "Unemployment and/or APG",
      "Self-employed",
      "Other",
    ],
    expand: "Show more",
    total: "Estimated total",
    create: "Create my file",
    breakdown: "Calculation details",
    baseLabel: "Base price",
    fromPrefix: "from",
    indicative:
      "Indicative amount, excluding any supplements. The final price is confirmed when your file is opened.",
    pickHint: "Select your situation to get an estimate.",
  },

  trust: {
    clients: "250+ clients served",
    hosting: "Data hosted in Switzerland",
    experts: "Certified tax experts",
  },

  about: {
    eyebrow: "About us",
    title: "Tax assistance that is simple, human and fully online.",
    p1: "Fiduvia is a Swiss tax return assistance service, designed to simplify a process that is often long and complex.",
    p2: "You send us your documents directly from your client area. A member of our team reviews your file, prepares your tax return and, where the service provides for it, files it with the competent tax authorities.",
    p3: "Our goal is simple: to save you time, reduce the risk of errors and let you complete your return with no appointment, fully online.",
    stats: [
      { value: "10 days*", label: "average processing time" },
      { value: "3 cantons", label: "Vaud · Valais · Fribourg" },
      { value: "100%", label: "of exchanges online" },
    ],
    values: [
      {
        title: "A dedicated manager",
        desc: "Your file is assigned to a member of our team who follows it throughout the process.",
      },
      {
        title: "Data handled with care",
        desc: "Your documents and tax information are processed in a secure environment and hosted in Switzerland.",
      },
      {
        title: "Prices stated up front",
        desc: "You know the price of your service before you start. No hidden costs.",
      },
      {
        title: "An end-to-end service",
        desc: "You upload your documents online. We handle the preparation, data entry and filing of your return.",
      },
    ],
    footnote:
      "*Indicative average time, from receipt of all documents needed to process the file.",
  },

  services: {
    eyebrow: "Discover our services",
    title: "What we do for you",
    items: [
      {
        title: "Tax return",
        desc: "The complete annual return for employees, pensioners and the self-employed.",
      },
      {
        title: "Move abroad",
        desc: "Departure abroad during the year, which results in a limited tax period.",
      },
      {
        title: "Capital benefit",
        desc: "Pillar 2, pillar 3a or death-capital withdrawal, taxed separately.",
      },
      {
        title: "Death during the year",
        desc: "Where a single person or a spouse dies during the year.",
      },
      {
        title: "Tax simulation",
        desc: "Estimate your tax burden and the options open to you in order to optimise it.",
      },
      {
        title: "Provisional instalments",
        desc: "Calculation and adjustment of your provisional tax instalments.",
      },
    ],
  },

  steps: {
    eyebrow: "How it works",
    titleLine1: "An experience",
    titleLine2: "without friction.",
    sub: "From creating your account through to finalising your file, every step is designed to be simple, clear and transparent.",
    items: [
      {
        number: "01",
        title: "Create your account",
        desc: "Sign up online and provide the information your file requires.",
      },
      {
        number: "02",
        title: "Upload your documents",
        desc: "Send your documents directly from your secure client area.",
      },
      {
        number: "03",
        title: "We process your file",
        desc: "Our team reviews your situation and supports you through to completion.",
      },
    ],
  },

  pricing: {
    eyebrow: "Pricing",
    title: "Clear pricing.",
    sub: "Transparent pricing, matched to your situation, with no unpleasant surprises.",
    popular: "Popular",
    fromPerReturn: "from / return",
    perActivity: "depending on your activity",
    perNeeds: "depending on your needs",
    custom: "Tailored",
    plans: [
      {
        name: "Individual",
        features: ["Tax return", "Review of your situation", "Online tracking"],
      },
      {
        name: "Self-employed",
        features: ["Bookkeeping", "Tax", "Tax return", "Ongoing support"],
      },
      {
        name: "Company",
        features: ["Full bookkeeping", "Payroll & HR", "Tax", "Advisory"],
      },
    ],
  },

  faq: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    items: [
      {
        q: "How does Fiduvia work?",
        a: "Fiduvia lets you manage your relationship with your accounting firm entirely online. You create your account, send your documents and follow your file's progress from your personal area.",
      },
      {
        q: "Are my documents secure?",
        a: "The platform is built around confidentiality and data protection. Documents are sent through your secure client area.",
      },
      {
        q: "Can I follow my file's progress?",
        a: "Yes. Your client area lets you follow your file's status and see the actions or documents that need your attention.",
      },
      {
        q: "Who is Fiduvia for?",
        a: "Fiduvia supports individuals, the self-employed and companies who want to handle their accounting and tax matters simply and digitally.",
      },
    ],
  },

  cta: {
    eyebrow: "Let's talk about your situation",
    titleLine1: "Ready to simplify",
    titleLine2: "your accounting?",
    sub: "A question, or need tailored support? Get in touch.",
    button: "Contact us",
  },

  footer: {
    tagline:
      "Your Swiss accounting firm, entirely online. Simple, transparent and close to you.",
    navigation: "Navigation",
    contact: "Contact",
    clientArea: "Client area",
    privacy: "Privacy policy",
    legal: "Legal notice",
    rights: "All rights reserved.",
  },

  auth: {
    brand: "fiduvia",
    tagline: "Online accounting & bookkeeping",
    rights: "Your accounting firm, entirely online.",

    login: {
      title: "Welcome to your client area",
      sub: "Log in to access your documents, payments and filings.",
      submit: "Log in",
      loading: "Logging in...",
      forgot: "Forgot your password?",
      noAccount: "Don't have an account yet?",
      createAccount: "Create my account",
      secureTitle: "Secure login",
      secureBody:
        "An additional verification will be required after you log in.",
    },

    signup: {
      eyebrow: "Welcome to Fiduvia",
      title: "Create my account",
      sub: "Create your personal space to manage your documents, filings and exchanges with Fiduvia.",
      submit: "Create my account",
      loading: "Creating account...",
      emailHint: "This address will be used to verify your account.",
      passwordTitle: "Your password must contain:",
      passwordRule: "At least 10 characters",
      hasAccount: "Already have an account?",
      login: "Log in",
      secureTitle: "Secure account creation",
      secureBody:
        "Your email address will be verified before you can access your client area.",
    },

    verify: {
      title: "Security verification",
      intro:
        "To protect your account, we have sent a verification code to the following address:",
      codeLabel: "Verification code",
      codeHint: "Enter the 6 digits you received by email.",
      submit: "Verify code",
      loading: "Verifying...",
      notReceived: "Didn't receive the code?",
      notReceivedBody: "Check your spam folder, or go back and start again.",
      warning: "Never share your verification code with anyone.",
      fallback: "Loading...",
    },

    forgot: {
      title: "Forgot your password?",
      sub: "Enter the email address linked to your account. If it matches a Fiduvia account, we will send you a code to reset your password.",
      submit: "Send the code",
      loading: "Sending...",
      doneTitle: "Check your email",
      doneBody:
        "If an account exists with this address, a reset code has been sent.",
      backToLogin: "Back to login",
      privacyTitle: "Your information stays protected",
      privacyBody:
        "For your security, we do not reveal whether an email address has a Fiduvia account.",
    },

    reset: {
      title: "Reset your password",
      sub: "Enter the code you received by email and choose a new password to secure your account.",
      submit: "Reset my password",
      loading: "Resetting...",
      backToLogin: "Back to login",
      codeHint: "Check your inbox and your spam folder.",
      passwordTitle: "Your password must contain:",
      rule1: "At least 10 characters",
      rule2: "A combination that is hard to guess",
      secureTitle: "Secure reset",
      secureBody: "Your verification code is required to change your password.",
    },

    fields: {
      firstName: "First name",
      firstNamePlaceholder: "Your first name",
      lastName: "Last name",
      lastNamePlaceholder: "Your last name",
      email: "Email address",
      emailPlaceholder: "you@example.ch",
      password: "Password",
      passwordPlaceholder: "Your password",
      newPassword: "New password",
      newPasswordPlaceholder: "Choose a password",
      resetPasswordPlaceholder: "Choose a new password",
      code: "Verification code",
      codePlaceholder: "Enter the code received by email",
      codeShort: "6 digits",
    },
  },

  portal: {
    spaceTitle: "My space",
    spaceTag: "Client area",
    greeting: "Hello",
    greetingSub: "Here is where your tax matters stand.",
    period: "Period",
    myDossiers: "My tax files",
    noDossiers: "No file yet.",
    dossier: "File",
    helpDocsTitle: "Help documents",
    helpDoc1: "List of documents to provide",
    helpDoc2: "How to use the site",
    comingSoon: "Available soon",
    deadlinesTitle: "Deadlines",
    deadline1Label: "First deadline",
    deadline1Note: "Legal deadline to file your tax return.",
    deadline2Label: "Second deadline",
    deadline2Note:
      "Tolerance deadline to file your tax return without further steps.",
    accountLabel: "Your account",
    accountNote:
      "Your space is personal. Your documents are only accessible to authorised people.",
    dossierBack: "Back to my files",
    dossierTitle: "My tax file",
    dossierSub:
      "Follow your file's progress, send your documents and see the next steps.",
    dossierSecureTitle: "Your documents are protected",
    dossierSecureBody:
      "The information and documents sent to Fiduvia are only accessible to authorised people.",
    declEyebrowTodo: "TO COMPLETE",
    declEyebrowDone: "SUBMITTED",
    declTitle: "My tax return",
    declSub:
      "Upload your documents and follow the progress of your tax return.",
    declOpen: "Open my return",
    declNoneTitle: "No file for this period",
    declNoneSub:
      "Your file will be opened by our team. You will be notified by email as soon as it is available.",
    contactsTitle: "Contacts",
    contactsSub: "Write to us, or reach your accountant directly.",
    contactsFormTitle: "Send a message",
    contactsSubject: "Subject",
    contactsSubjectPh: "What is your request about",
    contactsMessage: "Message",
    contactsMessagePh: "Your message...",
    contactsSend: "Send",
    contactsSending: "Sending…",
    contactsSent: "Thank you, your message has been sent.",
    contactsNote:
      "We reply within 24 working hours. Please do not send tax documents through this form.",
    contactsReach: "How to reach us",
    contactsEmail: "Email",
    contactsPhone: "Phone",
    contactsAddress: "Address",
    contactsHours: "Opening hours",
    contactsHoursDays: "Monday - Friday",
    contactsHoursTime: "08:30 - 12:00 · 13:30 - 17:30",
    contactsErrEmpty: "Please provide a subject and a message.",
    noticeDocumentsTitle: "Additional documents requested",
    noticeDocumentsBody:
      "Your accountant is asking you to send additional documents for this file.",
    noticeActionTitle: "Action required",
    noticeActionBody: "Your file needs action from you.",
    noticeAck: "Got it",
    logout: "Log out",
    nav: {
      servicesHead: "Services",
      taxReturns: "Tax returns",
      capital: "Capital benefit",
      simulation: "Tax simulation",
      instalments: "Advance payments",
      review: "Review",
      otherHead: "Other",
      assistance: "Fiduvia Assistance",
      payments: "Payments",
      contacts: "Contacts",
    },
  },

  documents: {
    title: "Documents",
    statusLabel: "Status",
    addTitle: "Add a document",
    empty: "No documents yet.",
    loading: "Loading…",
    uploading: "Uploading…",
    download: "Download",
    remove: "Delete",
    markSubmitted: "Mark as submitted",
    errTooLarge: "File too large (20 MB maximum).",
    errType: "File type not allowed (PDF, JPG or PNG only).",
    errStart: "Could not start the upload.",
    errUpload: "Could not upload the file.",
    errConfirm: "Could not confirm the upload.",
    errDownload: "Could not retrieve the download link.",
    errDelete: "Could not delete the document.",
    errSubmit: "Could not submit the file.",
    categories: {
      salaire: "Salary certificate",
      releves_bancaires: "Bank statements",
      assurance: "Insurance certificates",
      pilier3: "Pillar 3a",
      justificatifs: "Miscellaneous supporting documents",
      autre: "Other",
    },
  },

  admin: {
    title: "Administration",
    period: "Period",
    fiscalPeriod: "Tax period",
    backHome: "Back to the home page",
    hub: {
      title: "Files",
      sub: "The services we handle, and the files in progress for each.",
      active: "active files",
      declarations: "Tax returns",
      declarationsDesc:
        "All client files, with search and filtering by status.",
      capital: "Capital benefits",
      capitalDesc: "Pillar 2 / 3a withdrawals submitted by clients.",
      simulations: "Tax simulations",
      simulationsDesc: "Tax simulations submitted by clients.",
      instalments: "Advance payment requests",
      instalmentsDesc: "Advance payment requests submitted by clients.",
      reviews: "Return reviews",
      reviewsDesc: "Return reviews submitted by clients.",
    },
    notify: {
      button: "Request documents",
      title: "Notify the client",
      sub: "The client receives an email and sees the request in their space.",
      kindDocuments: "Request for additional documents",
      kindAction: "Action required on the file",
      messageLabel: "Message (optional)",
      messagePlaceholder: "Say which documents you need…",
      send: "Send the notification",
      sending: "Sending…",
      sent: "Notification sent to the client.",
      cancel: "Cancel",
    },
    periods: {
      title: "Tax periods",
      cardTitle: "Tax periods",
      cardSub: "Create and activate the periods open to clients.",
      create: "Create period",
      active: "Active",
      inactive: "Inactive",
      activate: "Activate",
      deactivate: "Deactivate",
      empty: "No tax periods yet.",
      working: "…",
    },
    users: {
      title: "User management",
      sub: "Administrator and client accounts on the platform.",
      adminsTitle: "Administrator accounts",
      adminsSub:
        "Add or remove the managers who can access the administrator area.",
      superBadge: "SUPER ADMIN",
      remove: "Remove",
      addTitle: "Add an administrator",
      addBtn: "Add administrator",
      adding: "Adding…",
      clientsTitle: "Client accounts",
      clientsSub: "People who have a client area.",
      noClients: "No client accounts yet.",
      onlySuperAdmin:
        "Only a super administrator can manage administrator accounts.",
    },
    stats: {
      title: "Statistics",
      sub: "Activity across all files for the selected period.",
      processed: "FILES PROCESSED",
      processedSub: "closed this period",
      inProgress: "FILES IN PROGRESS",
      inProgressSub: "not yet processed",
      clients: "CLIENTS",
      clientsSub: "active accounts",
    },
    dashTitle: "Administrator area",
    dashSub: "Your files for the current tax period.",
    roleAdmin: "Administrator",
    roleSuper: "Super admin",
    kpiDossiers: "FILES",
    kpiDossiersSub: "all services combined",
    kpiCompleted: "FILES PROCESSED",
    kpiCompletedSub: "closed this period",
    kpiClients: "CLIENTS",
    kpiClientsSub: "active accounts",
    distTitle: "Breakdown by status",
    byYearTitle: "Files by tax year",
    byPrestationTitle: "Files by service",
    noDossiers: "No files.",
    nav: {
      home: "Home",
      dossiers: "Files",
      stats: "Statistics",
      periods: "Periods",
      users: "Users",
    },
    dossiers: {
      title: "Files",
      sub: "Create and track your clients' tax files.",
      count: "file",
      countPlural: "files",
      empty: "No files yet.",
      recentOf: "The {n} most recent files out of {total}.",
      thClient: "Client",
      searchPlaceholder: "Search for a client...",
      thReceived: "Date received",
      allStatuses: "All statuses",
      noMatch: "No file matches this search.",
      statusSaving: "Saving…",
      thStatus: "Status",
      thYear: "Year",
      thCreated: "Created",
      createTitle: "Create a file",
      createSub: "Create a new tax file for a client.",
      clientIdLabel: "Client ID",
      clientIdPlaceholder: "e.g. cli_8f92...",
      taxYearLabel: "Tax year",
      createSubmit: "Create the file",
      creating: "Creating...",
      statusTitle: "Change status",
      statusSub: "Update a file's progress.",
      dossierIdLabel: "File ID",
      dossierIdPlaceholder: "e.g. dos_8f92...",
      newStatusLabel: "New status",
      statusSubmit: "Update status",
      updating: "Updating...",
      created: "File created:",
      statusUpdated: "The file's status has been updated.",
      errClientId: "Please provide the client ID.",
      errTaxYear: "Please provide a valid tax year.",
      errCreate: "Could not create the file.",
      errDossierId: "Please provide the file ID.",
      errStatus: "Could not change the status.",
    },
  },

  status: {
    not_started: "Not started",
    submitted: "Submitted",
    in_review: "In progress",
    completed: "Completed",
  },

  legal: {
    backHome: "Back to home",
    pendingTitle: "Document being prepared",
    pendingBody:
      "This document is being drafted with our legal counsel and will be published before the platform goes live. In the meantime, write to us with any question about how your data is handled.",
    controllerTitle: "Data controller",
    privacyTitle: "Privacy policy",
    privacyIntro: "How Fiduvia collects, uses and protects your personal data.",
    noticeTitle: "Legal notice",
    noticeIntro: "Legal information about the site's publisher.",
  },
  common: {
    errTitle: "Something went wrong",
    errBody:
      "We could not load this page correctly. Please try again or return to the home page.",
    errRetry: "Try again",
    errHome: "Back to home",
    errPersists: "Still not working?",
    errReassure:
      "Your data and documents stay protected. Our team can step in if the problem persists.",
    comingSoonTag: "soon",
    comingSoonTitle: "Available soon",
    genericError: "Something went wrong. Please try again in a moment.",
    errorTitle: "Something went wrong",
    errorBody:
      "Please try again or return to the home page. Our team has been notified.",
  },
};
