const FALLBACK_TOPICS = [
  {
    title: "Headache Self-Care",
    answer: "Mild headaches may improve with rest, fluids, regular meals, and reducing bright light.",
    self_care: ["Drink water.", "Rest in a quiet room.", "Seek care for sudden severe headache."],
    monitor: ["Pain level", "Fever", "Weakness"],
    red_flags: ["Sudden worst headache", "Weakness", "Confusion"],
    tags: ["headache", "pain"],
    source: { name: "Local fallback", url: "" }
  }
];

const FALLBACK_DRUGS = {
  ibuprofen: {
    aliases: ["advil", "motrin"],
    common_use: "Ibuprofen is used for pain, fever, or inflammation.",
    general_guidance: "Use only as directed on the label or by your prescriber.",
    side_effects: ["stomach upset", "heartburn", "dizziness"],
    warnings: ["Ask a clinician before use if you have ulcers, kidney disease, take blood thinners, are pregnant, or were told to avoid NSAIDs."],
    source: { name: "Local fallback", url: "" }
  }
};

const APPOINTMENTS = [
  {
    id: "apt-001",
    patient_id: "demo-patient",
    when: "2026-07-02T09:30",
    clinician: "Dr. Patel",
    reason: "Primary care follow-up",
    status: "scheduled"
  }
];

const DISCLAIMER = "This is general information, not a diagnosis. Please contact your doctor or care team for personal medical advice.";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "bad", "can", "do", "feel", "feeling", "for", "good", "have", "how", "i", "is", "it", "me", "my", "not", "of", "or", "the", "to", "what", "when", "with", "about"
]);

const TOKEN_EXPANSIONS = {
  bp: ["blood", "pressure", "hypertension"],
  breathless: ["breathing", "shortness"],
  dizzy: ["dizziness", "dehydration"],
  dizziness: ["dizzy", "dehydration"],
  sugar: ["glucose", "diabetes", "blood"],
  tummy: ["stomach", "abdominal"],
  wheeze: ["wheezing", "asthma"],
  wheezing: ["wheeze", "asthma"]
};

const EMERGENCY_PATTERNS = [
  /chest pain|heart attack|stroke|seizure/i,
  /can't breathe|cannot breathe|trouble breathing|shortness of breath/i,
  /severe bleeding|bleeding heavily|blood won't stop/i,
  /fainted|passed out|unconscious|can't wake|cannot wake/i,
  /overdose|took too much|poison/i,
  /(took|swallowed|ate)\s+(\d{2,}|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|many|a lot of|a handful of)\s+(pills?|tablets?|capsules?|doses?)/i,
  /(took|swallowed|ate)\s+(\d{2,}|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|many|a lot of|a handful of)\s+[a-z0-9 -]{2,30}\s+(pills?|tablets?|capsules?|doses?)/i,
  /suicidal|kill myself|self harm|hurt myself|want to die|can't stay safe|cannot stay safe/i,
  /blue lips|face drooping|weakness on one side|slurred speech/i,
  /swelling of (my )?(face|lips|tongue|throat)|anaphylaxis/i,
  /worst headache|sudden confusion|cannot speak|can't speak/i,
  /sudden (numbness|weakness|vision changes?|trouble seeing|loss of balance|trouble walking|severe headache)/i,
  /arm weakness|arm is weak|one arm (is )?(weak|numb|drift(ing)?)|facial droop|face (is )?droop(ing)?|speech difficulty/i,
  /chest (pressure|tightness|(feels )?tight|squeezing|discomfort).*(jaw|neck|back|arm|shoulder|shortness of breath|cold sweat|nausea|light-?headed)/i,
  /(jaw|neck|back|arm|shoulder) pain.*(chest|shortness of breath|cold sweat|nausea|light-?headed)/i,
  /severe allergic reaction|throat closing|tongue swelling/i,
  /chest (pain|pressure|tightness|(feels )?tight|squeezing|discomfort).*(sweat|sweating|cold sweat|nausea|light-?headed|dizzy|faint)/i,
  /(sweat|sweating|cold sweat|nausea|light-?headed|dizzy|faint).*(chest (pain|pressure|tightness|(feels )?tight|squeezing|discomfort))/i,
  /fever.*stiff neck|stiff neck.*fever/i,
  /hives.*(dizzy|faint|trouble breathing|shortness of breath)|(dizzy|faint|trouble breathing|shortness of breath).*hives/i,
  /cannot speak full sentences|can't speak full sentences|rescue inhaler (is )?not helping|inhaler (is )?not helping/i
];

const SCHEDULING_PATTERNS = [
  /appointment|schedule|reschedule|cancel|book|calendar/i,
  /next visit|doctor visit|see my doctor|reminder/i
];

const MEDICATION_PATTERNS = [
  /medicine|medication|drug|pill|prescription|refill/i,
  /dose|dosage|side effect|interaction|allergy|antibiotic/i
];

const SYMPTOM_PATTERNS = [
  /headache|fever|cough|rash|dizzy|dizziness|nausea|vomiting|diarrhea/i,
  /sore throat|back pain|stomach pain|fatigue|anxiety|insomnia/i,
  /wheezing|chills|confusion|weakness|blood sugar|blood pressure|oxygen|spo2/i
];

const URGENT_SYMPTOM_PATTERNS = [
  /severe|worsening|faint|dehydrated|cannot keep fluids|high fever/i,
  /black stools|vomiting blood|blood in (stool|urine)|persistent vomiting|severe abdominal pain/i,
  /pregnant.*(bleeding|severe pain)|bleeding.*pregnant/i,
  /infant.*fever|baby.*fever|newborn.*fever/i
];

const RISK_FACTOR_PATTERNS = [
  /pregnant|pregnancy|breastfeeding/i,
  /kidney disease|kidney problems?|renal disease/i,
  /liver disease|liver problems?|hepatitis/i,
  /stomach ulcers?|ulcers?|stomach bleeding|gi bleeding/i,
  /blood thinners?|warfarin|apixaban|rivaroxaban|clopidogrel/i,
  /heart disease|heart failure|heart condition/i,
  /diabetes|asthma|hypertension|high blood pressure/i,
  /allerg(y|ic) to [a-z0-9 -]{2,40}/i
];

const AGE_GROUP_PATTERNS = [
  /infant|newborn|baby|toddler|child|teen|teenager|older adult|elderly/i
];

const NEGATED_RED_FLAG_TERMS = [
  "chest pain",
  "chest pressure",
  "chest tightness",
  "shortness of breath",
  "trouble breathing",
  "cannot breathe",
  "weakness on one side",
  "face drooping",
  "slurred speech",
  "severe bleeding",
  "fainted",
  "passed out",
  "confusion",
  "hives",
  "swelling"
];

const KNOWN_SYMPTOMS = [
  "headache", "fever", "cough", "sore throat", "chest pain", "shortness of breath",
  "trouble breathing", "chest pressure", "chest tightness", "arm weakness", "face drooping",
  "speech difficulty", "vision changes", "loss of balance", "dizziness", "jaw pain", "neck pain", "rash", "hives", "nausea", "vomiting", "diarrhea",
  "constipation", "back pain", "urinary pain", "burning", "fatigue", "anxiety", "insomnia",
  "wheezing", "chills", "confusion", "weakness", "blood sugar", "blood pressure", "oxygen"
];

const KNOWN_CONDITIONS = [
  "diabetes", "asthma", "hypertension", "high blood pressure", "kidney disease",
  "kidney problems", "liver disease", "liver problems", "pregnant", "pregnancy",
  "breastfeeding", "heart disease", "heart failure", "ulcer", "stomach ulcers",
  "stomach bleeding", "blood thinner", "blood thinners", "warfarin", "apixaban",
  "rivaroxaban", "clopidogrel", "allergy"
];

const elements = {
  launchScreen: document.querySelector("#launchScreen"),
  appShell: document.querySelector("#appShell"),
  loginForm: document.querySelector("#loginForm"),
  loginId: document.querySelector("#loginId"),
  loginCode: document.querySelector("#loginCode"),
  localMode: document.querySelector("#localMode"),
  installApp: document.querySelector("#installApp"),
  downloadLocal: document.querySelector("#downloadLocal"),
  installStatus: document.querySelector("#installStatus"),
  deviceGuide: document.querySelector("#deviceGuide"),
  datasetStatus: document.querySelector("#datasetStatus"),
  mobileNavButtons: document.querySelectorAll(".mobile-nav-button"),
  patientId: document.querySelector("#patientId"),
  riskSummary: document.querySelector("#riskSummary"),
  memorySummary: document.querySelector("#memorySummary"),
  topicSummary: document.querySelector("#topicSummary"),
  medSummary: document.querySelector("#medSummary"),
  profileMedications: document.querySelector("#profileMedications"),
  profileConditions: document.querySelector("#profileConditions"),
  profileAllergies: document.querySelector("#profileAllergies"),
  profileContact: document.querySelector("#profileContact"),
  saveProfile: document.querySelector("#saveProfile"),
  profileSaveStatus: document.querySelector("#profileSaveStatus"),
  librarySearch: document.querySelector("#librarySearch"),
  libraryList: document.querySelector("#libraryList"),
  clearMemory: document.querySelector("#clearMemory"),
  routeBadge: document.querySelector("#routeBadge"),
  workspaceStatus: document.querySelector("#workspaceStatus"),
  newCase: document.querySelector("#newCase"),
  copyPlan: document.querySelector("#copyPlan"),
  exportPlan: document.querySelector("#exportPlan"),
  uiModeButtons: document.querySelectorAll(".display-control"),
  focusRoute: document.querySelector("#focusRoute"),
  focusUrgency: document.querySelector("#focusUrgency"),
  focusNextAction: document.querySelector("#focusNextAction"),
  focusMissing: document.querySelector("#focusMissing"),
  focusClarifiers: document.querySelector("#focusClarifiers"),
  addFocusTask: document.querySelector("#addFocusTask"),
  messages: document.querySelector("#messages"),
  composer: document.querySelector("#composer"),
  prompt: document.querySelector("#prompt"),
  sendButton: document.querySelector("#sendButton"),
  intentMetric: document.querySelector("#intentMetric"),
  confidenceMetric: document.querySelector("#confidenceMetric"),
  urgencyMetric: document.querySelector("#urgencyMetric"),
  safetyMetric: document.querySelector("#safetyMetric"),
  routeScoreList: document.querySelector("#routeScoreList"),
  profileSignals: document.querySelector("#profileSignals"),
  capabilityList: document.querySelector("#capabilityList"),
  slotList: document.querySelector("#slotList"),
  missingList: document.querySelector("#missingList"),
  followupBuilder: document.querySelector("#followupBuilder"),
  caseFactList: document.querySelector("#caseFactList"),
  intakePromptList: document.querySelector("#intakePromptList"),
  actionList: document.querySelector("#actionList"),
  workflowTraceList: document.querySelector("#workflowTraceList"),
  governanceList: document.querySelector("#governanceList"),
  matchTitle: document.querySelector("#matchTitle"),
  matchSummary: document.querySelector("#matchSummary"),
  sourceList: document.querySelector("#sourceList"),
  appointmentSummary: document.querySelector("#appointmentSummary"),
  alertSummary: document.querySelector("#alertSummary"),
  lastTopicSummary: document.querySelector("#lastTopicSummary"),
  taskSummary: document.querySelector("#taskSummary"),
  noteSummary: document.querySelector("#noteSummary"),
  readinessScore: document.querySelector("#readinessScore"),
  readinessLabel: document.querySelector("#readinessLabel"),
  readinessSummary: document.querySelector("#readinessSummary"),
  readinessList: document.querySelector("#readinessList"),
  handoffPocket: document.querySelector("#handoffPocket"),
  copyHandoff: document.querySelector("#copyHandoff"),
  caregiverUpdate: document.querySelector("#caregiverUpdate"),
  copyCaregiverUpdate: document.querySelector("#copyCaregiverUpdate"),
  taskForm: document.querySelector("#taskForm"),
  taskInput: document.querySelector("#taskInput"),
  taskList: document.querySelector("#taskList"),
  noteForm: document.querySelector("#noteForm"),
  noteInput: document.querySelector("#noteInput"),
  saveNote: document.querySelector("#saveNote"),
  clearNoteDraft: document.querySelector("#clearNoteDraft"),
  noteList: document.querySelector("#noteList"),
  timelineList: document.querySelector("#timelineList"),
  copyRecord: document.querySelector("#copyRecord"),
  exportRecord: document.querySelector("#exportRecord"),
  restoreRecord: document.querySelector("#restoreRecord"),
  restorePanel: document.querySelector("#restorePanel"),
  restoreText: document.querySelector("#restoreText"),
  restorePreview: document.querySelector("#restorePreview"),
  applyRestore: document.querySelector("#applyRestore"),
  chooseRecordFile: document.querySelector("#chooseRecordFile"),
  cancelRestore: document.querySelector("#cancelRestore"),
  recordImportInput: document.querySelector("#recordImportInput"),
  recordStatus: document.querySelector("#recordStatus")
};

const state = {
  topics: [],
  drugs: {},
  topicIndex: [],
  drugNameIndex: [],
  drugNames: [],
  recentResult: null,
  deferredInstallPrompt: null,
  localHostStoreAvailable: false,
  localStorageAvailable: false,
  serviceWorkerState: "pending",
  downloadPackageAvailable: null,
  dataLoaded: false,
  dataSource: "loading",
  lastProcessingMs: null,
  runtimeCapabilities: [],
  uiMode: "comfort"
};

const INTENT_ICONS = {
  rag: "book-open-check",
  pharmacy: "pill",
  scheduling: "calendar-clock",
  alert: "siren",
  ready: "circle-dot"
};

const DETAIL_ICONS = {
  "Next Steps": "check-check",
  Monitor: "radar",
  "Urgent Signs": "shield-alert",
  "Follow Up": "list-plus",
  "Still Needed": "circle-help"
};

const WORKFLOW_STEP_LABELS = {
  patient_input: "Patient Input",
  load_memory: "Load Memory",
  intent_classifier: "Intent Classifier",
  specialist_agent: "Specialist Agent",
  response_synthesizer: "Response Synthesizer",
  safety_guardrails: "Safety Guardrails",
  patient_reply: "Patient Reply",
  update_memory: "Update Memory"
};

const TRUSTED_SOURCE_DOMAINS = [
  "cdc.gov",
  "fda.gov",
  "healthit.gov",
  "medlineplus.gov",
  "nih.gov",
  "nlm.nih.gov",
  "who.int"
];

const LOCAL_ICON_MARKUP = {
  default: '<circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l3 2"></path>',
  "activity": '<path d="M3 12h4l2-6 4 12 2-6h6"></path>',
  "archive": '<path d="M4 7h16"></path><path d="M6 7v12h12V7"></path><path d="M9 11h6"></path><path d="M5 4h14v3H5z"></path>',
  "badge": '<rect x="5" y="4" width="14" height="16" rx="3"></rect><path d="M9 9h6M9 13h6"></path>',
  "bell-ring": '<path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"></path><path d="M10 21h4"></path>',
  "bookmark-check": '<path d="M6 4h12v17l-6-3-6 3z"></path><path d="m9 10 2 2 4-5"></path>',
  "book-marked": '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"></path><path d="M15 4v7l-2-1-2 1V4"></path>',
  "book-open-check": '<path d="M4 5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4z"></path><path d="M20 5h-6a3 3 0 0 0-3 3"></path><path d="m15 14 2 2 4-5"></path>',
  "brain": '<path d="M8 6a3 3 0 0 1 5-2 3 3 0 0 1 5 3v8a4 4 0 0 1-4 4h-1"></path><path d="M8 6a4 4 0 0 0-3 4 4 4 0 0 0 2 7h3"></path><path d="M12 4v16"></path>',
  "calendar-clock": '<rect x="4" y="5" width="16" height="15" rx="2"></rect><path d="M8 3v4M16 3v4M4 10h16"></path><circle cx="14" cy="15" r="3"></circle><path d="M14 13v2l1 1"></path>',
  "check-check": '<path d="m3 12 3 3 6-7"></path><path d="m12 13 2 2 7-8"></path>',
  "check-circle": '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path>',
  "circle-alert": '<circle cx="12" cy="12" r="9"></circle><path d="M12 8v5"></path><path d="M12 17h.01"></path>',
  "circle-dot": '<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="2"></circle>',
  "circle-help": '<circle cx="12" cy="12" r="9"></circle><path d="M9.5 9a2.7 2.7 0 0 1 5 1.4c0 2-2.5 2.1-2.5 4.1"></path><path d="M12 18h.01"></path>',
  "clipboard-list": '<rect x="6" y="5" width="12" height="16" rx="2"></rect><path d="M9 5a3 3 0 0 1 6 0"></path><path d="M9 11h6M9 15h6"></path>',
  "clipboard-plus": '<rect x="6" y="5" width="12" height="16" rx="2"></rect><path d="M9 5a3 3 0 0 1 6 0"></path><path d="M12 11v6M9 14h6"></path>',
  "cloud": '<path d="M17 18H8a5 5 0 1 1 1.4-9.8A6 6 0 0 1 21 11a4 4 0 0 1-4 7z"></path>',
  "copy": '<rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
  "download": '<path d="M12 3v11"></path><path d="m7 10 5 5 5-5"></path><path d="M5 20h14"></path>',
  "droplet": '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"></path>',
  "external-link": '<path d="M14 4h6v6"></path><path d="m10 14 10-10"></path><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"></path>',
  "file-down": '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6"></path><path d="M12 12v5"></path><path d="m9 15 3 3 3-3"></path>',
  "file-text": '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6M8 13h8M8 17h6"></path>',
  "gauge": '<path d="M4 14a8 8 0 0 1 16 0"></path><path d="M12 14l4-4"></path><path d="M6 18h12"></path>',
  "hard-drive": '<rect x="4" y="6" width="16" height="12" rx="2"></rect><path d="M7 15h.01M17 15h.01"></path>',
  "info": '<circle cx="12" cy="12" r="9"></circle><path d="M12 10v6"></path><path d="M12 7h.01"></path>',
  "laptop": '<path d="M5 5h14v10H5z"></path><path d="M3 19h18"></path>',
  "library": '<path d="M5 4v16"></path><path d="M9 4v16"></path><path d="M13 5l5 14"></path>',
  "list-plus": '<path d="M8 6h10M8 12h8M8 18h5"></path><path d="M4 6h.01M4 12h.01M4 18h.01"></path><path d="M18 16v6M15 19h6"></path>',
  "log-in": '<path d="M10 17l5-5-5-5"></path><path d="M15 12H3"></path><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"></path>',
  "message-circle": '<path d="M21 11.5a8.5 8.5 0 0 1-12 7.7L4 21l1.8-4.5A8.5 8.5 0 1 1 21 11.5z"></path>',
  "messages-square": '<path d="M5 5h12v8H8l-3 3z"></path><path d="M9 17h7l3 3v-9"></path>',
  "monitor": '<rect x="4" y="5" width="16" height="12" rx="2"></rect><path d="M8 21h8M12 17v4"></path>',
  "network": '<circle cx="6" cy="6" r="2"></circle><circle cx="18" cy="6" r="2"></circle><circle cx="12" cy="18" r="2"></circle><path d="M8 7l3 8M16 7l-3 8M8 6h8"></path>',
  "octagon-alert": '<path d="M7.9 3h8.2L21 7.9v8.2L16.1 21H7.9L3 16.1V7.9z"></path><path d="M12 8v5"></path><path d="M12 17h.01"></path>',
  "package-check": '<path d="m12 3 8 4-8 4-8-4z"></path><path d="M4 7v10l8 4 8-4V7"></path><path d="M12 11v10"></path><path d="m15 15 2 2 4-5"></path>',
  "panel-right": '<rect x="4" y="5" width="16" height="14" rx="2"></rect><path d="M14 5v14"></path>',
  "pill": '<path d="M10 21a6 6 0 0 1-4-10l5-5a6 6 0 0 1 8 8l-5 5a6 6 0 0 1-4 2z"></path><path d="m9 9 6 6"></path>',
  "radar": '<circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="12" r="7"></circle><path d="M12 12 19 5"></path>',
  "route": '<circle cx="6" cy="6" r="2"></circle><circle cx="18" cy="18" r="2"></circle><path d="M8 6h4a4 4 0 0 1 0 8h-1a4 4 0 0 0-4 4h9"></path>',
  "save": '<path d="M5 3h12l2 2v16H5z"></path><path d="M8 3v6h8V3"></path><path d="M8 17h8"></path>',
  "scan-search": '<path d="M7 4H5a1 1 0 0 0-1 1v2M17 4h2a1 1 0 0 1 1 1v2M7 20H5a1 1 0 0 1-1-1v-2M17 20h2a1 1 0 0 0 1-1v-2"></path><circle cx="11" cy="11" r="3"></circle><path d="m14 14 3 3"></path>',
  "search-check": '<circle cx="11" cy="11" r="7"></circle><path d="m16 16 4 4"></path><path d="m8 11 2 2 4-5"></path>',
  "send-horizontal": '<path d="M3 12h14"></path><path d="m13 6 6 6-6 6"></path>',
  "shield-alert": '<path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"></path><path d="M12 8v5M12 17h.01"></path>',
  "shield-check": '<path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"></path><path d="m9 12 2 2 4-5"></path>',
  "siren": '<path d="M7 18V9a5 5 0 0 1 10 0v9"></path><path d="M5 18h14M4 21h16M12 3V1M4 5 2 3M20 5l2-2"></path>',
  "smartphone": '<rect x="7" y="3" width="10" height="18" rx="2"></rect><path d="M11 18h2"></path>',
  "sparkles": '<path d="M12 3 10 9l-6 2 6 2 2 6 2-6 6-2-6-2z"></path><path d="M19 3v4M17 5h4"></path>',
  "split": '<path d="M4 7h6a4 4 0 0 1 4 4v6"></path><path d="M14 7h6"></path><path d="m17 4 3 3-3 3"></path><path d="m11 14 3 3 3-3"></path>',
  "stethoscope": '<path d="M6 3v5a4 4 0 0 0 8 0V3"></path><path d="M10 12v3a4 4 0 0 0 8 0v-1"></path><circle cx="18" cy="13" r="2"></circle>',
  "square-pen": '<rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M9 15l1-4 6-6 3 3-6 6z"></path>',
  "tablet-smartphone": '<rect x="4" y="3" width="10" height="18" rx="2"></rect><rect x="15" y="8" width="6" height="11" rx="1.5"></rect>',
  "trash-2": '<path d="M4 7h16"></path><path d="M10 11v6M14 11v6"></path><path d="M6 7l1 14h10l1-14"></path><path d="M9 7V4h6v3"></path>',
  "upload": '<path d="M12 21V10"></path><path d="m7 15 5-5 5 5"></path><path d="M5 4h14"></path>',
  "workflow": '<rect x="3" y="5" width="6" height="6" rx="1"></rect><rect x="15" y="5" width="6" height="6" rx="1"></rect><rect x="9" y="15" width="6" height="6" rx="1"></rect><path d="M9 8h6M12 11v4"></path>',
  "layout-dashboard": '<rect x="4" y="4" width="7" height="7" rx="1.5"></rect><rect x="13" y="4" width="7" height="5" rx="1.5"></rect><rect x="13" y="11" width="7" height="9" rx="1.5"></rect><rect x="4" y="13" width="7" height="7" rx="1.5"></rect>',
  "rows-3": '<rect x="4" y="5" width="16" height="3" rx="1"></rect><rect x="4" y="11" width="16" height="3" rx="1"></rect><rect x="4" y="17" width="16" height="3" rx="1"></rect>',
  "type": '<path d="M4 7V4h16v3"></path><path d="M9 20h6"></path><path d="M12 4v16"></path>'
};

function renderFallbackIcons(root = document) {
  root.querySelectorAll("i[data-lucide]").forEach((icon) => {
    const name = icon.getAttribute("data-lucide") || "default";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("stroke-width", "2.2");
    svg.classList.add("icon-svg", `icon-${name}`);
    svg.innerHTML = LOCAL_ICON_MARKUP[name] || LOCAL_ICON_MARKUP.default;
    icon.replaceWith(svg);
  });
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        "stroke-width": 2.2
      }
    });
    return;
  }
  renderFallbackIcons();
}

function iconElement(name) {
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", name);
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((token) => token && !STOP_WORDS.has(token));
}

function expandedTokens(text) {
  const tokens = new Set(tokenize(text));
  [...tokens].forEach((token) => {
    (TOKEN_EXPANSIONS[token] || []).forEach((expanded) => tokens.add(expanded));
  });
  return [...tokens];
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function uniqueLower(items) {
  const seen = new Set();
  return items
    .map((item) => String(item || "").trim().toLowerCase())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function topicSearchText(doc) {
  return [
    doc.title,
    doc.question,
    doc.answer,
    ...(doc.tags || []),
    ...(doc.self_care || []),
    ...(doc.monitor || []),
    ...(doc.red_flags || [])
  ].join(" ");
}

function prepareTopicIndex(topics) {
  state.topicIndex = (topics || []).map((doc, index) => {
    const titleTokens = new Set(expandedTokens(doc.title || ""));
    const tokens = new Set(expandedTokens(topicSearchText(doc)));
    const tagTokens = new Set(expandedTokens((doc.tags || []).join(" ")));
    const normalizedTags = (doc.tags || []).map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
    return {
      doc,
      index,
      tokens,
      titleTokens,
      tagTokens,
      normalizedTags
    };
  });
}

function prepareDrugIndex(drugs) {
  const entries = [];
  Object.entries(drugs || {}).forEach(([canonicalName, info]) => {
    [canonicalName, ...(info.aliases || [])].forEach((name) => {
      const normalized = String(name || "").trim().toLowerCase();
      if (!normalized) return;
      entries.push({
        canonicalName,
        info,
        name: normalized,
        pattern: new RegExp(`\\b${escapeRegExp(normalized)}\\b`, "i")
      });
    });
  });

  state.drugNameIndex = entries.sort((a, b) => b.name.length - a.name.length);
  state.drugNames = uniqueLower(state.drugNameIndex.map((entry) => entry.name));
}

function prepareAgentIndexes() {
  prepareTopicIndex(state.topics);
  prepareDrugIndex(state.drugs);
}

function collectKnownTerms(text, terms, skipNegated = false) {
  const source = String(text || "");
  const lower = source.toLowerCase();
  return uniqueLower(
    terms.filter((term) => {
      const pattern = new RegExp(`\\b${escapeRegExp(String(term).toLowerCase())}\\b`);
      const match = lower.match(pattern);
      if (!match) return false;
      return !(skipNegated && isNegatedMatch(source, match.index || 0, (match.index || 0) + match[0].length));
    })
  );
}

function negatedKnownTerms(text, terms) {
  const source = String(text || "");
  const lower = source.toLowerCase();
  return uniqueLower(
    terms.filter((term) => {
      const pattern = new RegExp(`\\b${escapeRegExp(String(term).toLowerCase())}\\b`);
      const match = lower.match(pattern);
      if (!match) return false;
      return isNegatedMatch(source, match.index || 0, (match.index || 0) + match[0].length);
    })
  );
}

function termMatchesAny(value, candidates = []) {
  const term = String(value || "").toLowerCase();
  return candidates.some((candidate) => {
    const current = String(candidate || "").toLowerCase();
    return term === current || term.includes(current) || current.includes(term);
  });
}

function mergeProfile(existing = {}, next = {}) {
  const merged = {};
  ["symptoms", "medications", "conditions", "allergies", "preferences"].forEach((key) => {
    const values = uniqueLower([...(existing[key] || []), ...(next[key] || [])]).slice(-20);
    if (values.length) merged[key] = values;
  });
  const contacts = unique([...(existing.emergency_contacts || []), ...(next.emergency_contacts || [])]
    .map((value) => String(value || "").trim().replace(/\s+/g, " "))
    .filter(Boolean)).slice(-5);
  if (contacts.length) merged.emergency_contacts = contacts;
  return merged;
}

function extractProfile(memory, text) {
  const haystack = `${memory
    .slice(-20)
    .filter((item) => item.role === "patient")
    .map((item) => item.text || "")
    .join(" ")} ${text || ""}`;
  const currentNegatedConditions = negatedKnownTerms(text, KNOWN_CONDITIONS);
  const profile = {
    symptoms: collectKnownTerms(haystack, KNOWN_SYMPTOMS, true),
    medications: collectKnownTerms(haystack, medicationNames()),
    conditions: collectKnownTerms(haystack, KNOWN_CONDITIONS, true)
      .filter((condition) => !termMatchesAny(condition, currentNegatedConditions))
  };
  return Object.fromEntries(Object.entries(profile).filter(([, values]) => values.length));
}

function isNegatedMatch(text, start, end) {
  const source = String(text || "");
  const before = source.slice(Math.max(0, start - 72), start).toLowerCase();
  const matchedWindow = source.slice(Math.max(0, start - 12), Math.min(source.length, end + 36)).toLowerCase();
  const prefixNegation = /\b(no|not|without|denies|deny|negative for|don't have|do not have|doesn't have|does not have|not having|not experiencing)\b[\w\s,;/:-]{0,64}$/.test(before);
  const inlineNegation = /\b(no|not|without|denies|deny|negative for|don't have|do not have|doesn't have|does not have|not having|not experiencing)\b[\w\s,;/:-]{0,48}(chest pain|chest pressure|chest tightness|shortness of breath|trouble breathing|weakness|face droop|slurred speech|hives|swelling)/.test(matchedWindow);
  return prefixNegation || inlineNegation;
}

function patternHits(patterns, text, skipNegated = false) {
  return uniqueLower(
    patterns
      .map((pattern) => {
        const match = String(text || "").match(pattern);
        if (!match) return null;
        const start = match.index || 0;
        if (skipNegated && isNegatedMatch(text, start, start + match[0].length)) return null;
        return match;
      })
      .filter(Boolean)
      .map((match) => match[0])
  );
}

function hasPattern(patterns, text) {
  return patterns.some((pattern) => pattern.test(text));
}

function scoreFromHits(base, hits, weight) {
  return Math.min(1, base + hits.length * weight);
}

function firstCapture(patterns, text) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (match) return String(match[1] || match[0]).replace(/\s+/g, " ").trim().toLowerCase();
  }
  return "";
}

function negatedRedFlags(text) {
  const source = String(text || "");
  return uniqueLower(
    NEGATED_RED_FLAG_TERMS.filter((term) => {
      const pattern = new RegExp(`\\b(no|not|without|denies|deny|negative for|don't have|do not have|doesn't have|does not have|not having|not experiencing)\\b[\\w\\s,;/:-]{0,64}\\b${escapeRegExp(term)}\\b`, "i");
      return pattern.test(source);
    })
  );
}

function extractMeasurements(text) {
  const source = String(text || "");
  const measurements = {};
  const bp = source.match(/\b(?:blood pressure|bp)\s*(?:is|of|reading|:)?\s*(\d{2,3})\s*\/\s*(\d{2,3})\b/i);
  if (bp) {
    measurements.blood_pressure = {
      systolic: Number(bp[1]),
      diastolic: Number(bp[2])
    };
  }
  const temperature = source.match(/\b(?:temperature|temp|fever)\s*(?:is|of|reading|:)?\s*(9[0-9](?:\.\d+)?|10[0-9](?:\.\d+)?)\s*(?:f|fahrenheit)?\b/i);
  if (temperature) measurements.temperature_f = Number(temperature[1]);
  const oxygen = source.match(/\b(?:oxygen saturation|oxygen|o2|spo2|pulse ox)\s*(?:is|of|reading|:)?\s*(\d{2,3})\s*%?\b/i);
  if (oxygen) measurements.oxygen_saturation = Number(oxygen[1]);
  const glucose = source.match(/\b(?:blood sugar|glucose|sugar)\s*(?:is|of|reading|:)?\s*(\d{2,3})\s*(?:mg\s*\/?\s*dl)?\b/i);
  if (glucose) measurements.blood_glucose = Number(glucose[1]);
  const pulse = source.match(/\b(?:heart rate|pulse|hr)\s*(?:is|of|reading|:)?\s*(\d{2,3})\s*(?:bpm)?\b/i);
  if (pulse) measurements.heart_rate = Number(pulse[1]);
  return measurements;
}

function measurementFlags(measurements = {}, text = "") {
  const emergency = [];
  const urgent = [];
  const oxygen = measurements.oxygen_saturation;
  if (Number.isFinite(oxygen)) {
    if (oxygen < 90) emergency.push(`oxygen saturation ${oxygen}%`);
    else if (oxygen <= 93) urgent.push(`oxygen saturation ${oxygen}%`);
  }

  const glucose = measurements.blood_glucose;
  if (Number.isFinite(glucose)) {
    if (glucose <= 54) emergency.push(`blood glucose ${glucose}`);
    else if (glucose < 70 || glucose >= 300) urgent.push(`blood glucose ${glucose}`);
  }

  const temperature = measurements.temperature_f;
  if (Number.isFinite(temperature)) {
    if (temperature >= 105 || temperature < 95) emergency.push(`temperature ${temperature}F`);
    else if (temperature >= 103) urgent.push(`temperature ${temperature}F`);
  }

  const bp = measurements.blood_pressure;
  if (bp && (bp.systolic >= 180 || bp.diastolic >= 120)) {
    if (/\b(chest pain|shortness of breath|trouble breathing|weakness|confusion|vision change|severe headache)\b/i.test(text)) {
      emergency.push(`blood pressure ${bp.systolic}/${bp.diastolic} with concerning symptoms`);
    } else {
      urgent.push(`blood pressure ${bp.systolic}/${bp.diastolic}`);
    }
  }

  const heartRate = measurements.heart_rate;
  if (Number.isFinite(heartRate) && (heartRate >= 140 || heartRate <= 40)) {
    urgent.push(`heart rate ${heartRate}`);
  }

  const flags = {};
  if (emergency.length) flags.emergency = uniqueLower(emergency);
  if (urgent.length) flags.urgent = uniqueLower(urgent);
  return flags;
}

function extractClinicalSlots(text, alertHits, patientProfile) {
  const symptoms = collectKnownTerms(text, KNOWN_SYMPTOMS, true);
  let medications = collectKnownTerms(text, medicationNames());
  const measurements = extractMeasurements(text);
  const measureFlags = measurementFlags(measurements, text);
  const negatedRiskFactors = negatedKnownTerms(text, KNOWN_CONDITIONS);
  const rememberedConditions = (patientProfile.conditions || [])
    .filter((condition) => !termMatchesAny(condition, negatedRiskFactors));
  const riskFactors = uniqueLower([
    ...patternHits(RISK_FACTOR_PATTERNS, text, true),
    ...rememberedConditions
  ]);
  if (!medications.length && patientProfile.medications && /\b(it|that|this|side effects?|dose|dosage|interaction|refill|take|taken)\b/i.test(text)) {
    medications = patientProfile.medications.slice(-3);
  }

  const slots = {};
  if (symptoms.length) slots.symptoms = symptoms;
  if (medications.length) slots.medications = uniqueLower(medications);
  if (riskFactors.length) slots.risk_factors = riskFactors;
  const ageGroup = firstCapture(AGE_GROUP_PATTERNS, text);
  if (ageGroup) slots.age_group = ageGroup;

  const duration = firstCapture([
    /\b(?:for|since|over|past|last)\s+((?:\d+|one|two|three|four|five|six|seven|a|an)\s+(?:minutes?|hours?|days?|weeks?|months?))\b/i,
    /\b(yesterday|today|tonight|this morning|this afternoon|this evening)\b/i
  ], text);
  const severity = firstCapture([
    /\b(\d{1,2}\s*\/\s*10)\b/i,
    /\b(mild|moderate|severe|very severe|worst|unbearable)\b/i
  ], text);
  const dose = firstCapture([
    /\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tablets?|capsules?|puffs?|units?))\b/i,
    /\b((?:one|two|three|four|five)\s+(?:tablets?|capsules?|puffs?|units?))\b/i
  ], text);
  const appointmentTime = firstCapture([
    /\b(20\d{2}-\d{2}-\d{2}(?:[ t]\d{1,2}:\d{2})?)\b/i,
    /\b(tomorrow|next week|next month|today|this week|morning|afternoon|evening)\b/i
  ], text);
  const reasonMatch = String(text || "").match(/\b(?:for|about|because of)\s+([a-z0-9 ,.'-]{3,80})/i);
  const appointmentReason = reasonMatch && hasPattern(SCHEDULING_PATTERNS, text)
    ? reasonMatch[1].replace(/\s+/g, " ").trim().toLowerCase()
    : "";
  const redFlags = uniqueLower([
    ...alertHits,
    ...patternHits(URGENT_SYMPTOM_PATTERNS, text),
    ...((measureFlags.emergency || [])),
    ...((measureFlags.urgent || []))
  ]);
  const negatedFlags = negatedRedFlags(text);

  if (duration) slots.duration = duration;
  if (severity) slots.severity = severity;
  if (dose) slots.dose = dose;
  if (appointmentTime) slots.appointment_time = appointmentTime;
  if (appointmentReason) slots.appointment_reason = appointmentReason;
  if (redFlags.length) slots.red_flags = redFlags;
  if (negatedFlags.length) slots.negated_red_flags = negatedFlags;
  if (negatedRiskFactors.length) slots.negated_risk_factors = negatedRiskFactors;
  if (Object.keys(measurements).length) slots.measurements = measurements;
  if (Object.keys(measureFlags).length) slots.measurement_flags = measureFlags;
  return slots;
}

function urgencyFor(text, alertHits, clinicalSlots = {}) {
  const lower = String(text || "").toLowerCase();
  const measureFlags = clinicalSlots.measurement_flags || {};
  if (alertHits.length || (measureFlags.emergency || []).length) return "emergency";
  if (hasPattern(URGENT_SYMPTOM_PATTERNS, lower) || (measureFlags.urgent || []).length) {
    return "urgent";
  }
  if (/\b(days|week|recurring|keeps happening|not getting better)\b/.test(lower)) {
    return "watch";
  }
  return "routine";
}

function suggestedFollowups(intent, urgency) {
  if (urgency === "emergency") {
    return [
      "Tell the responder when symptoms started.",
      "Share current medicines and allergies.",
      "Stay with someone nearby if possible."
    ];
  }
  if (intent === "pharmacy") {
    return [
      "Confirm the exact medicine name and strength.",
      "Share how much was taken and when.",
      "Mention allergies, pregnancy, kidney disease, liver disease, or blood thinners."
    ];
  }
  if (intent === "scheduling") {
    return ["Share preferred dates.", "Add the visit reason.", "Ask for a reminder if needed."];
  }
  return [
    "When did this start?",
    "How severe is it right now?",
    "Are there fever, breathing problems, chest pain, fainting, confusion, or new weakness?"
  ];
}

function missingInformation(intent, urgency, slots, patientProfile, text) {
  const missing = [];
  const lower = String(text || "").toLowerCase();
  const isAppointmentLookup = intent === "scheduling" && isAppointmentLookupText(lower);

  if (urgency === "emergency") {
    if (!slots.duration) missing.push("When the emergency symptoms started");
    if (!(patientProfile.medications || []).length && !(patientProfile.allergies || []).length) {
      missing.push("Current medications and allergies for responders");
    }
    return missing;
  }

  if (intent === "pharmacy") {
    if (!(slots.medications || []).length) missing.push("Medication name from the label");
    if (!slots.dose) missing.push("Dose or strength and when it was taken");
    const hasRiskContext = Boolean(
      (patientProfile.conditions || []).length
      || (patientProfile.allergies || []).length
      || (slots.risk_factors || []).length
      || (slots.negated_risk_factors || []).length
      || /\b(no|not|without|denies|do not have|don't have)\b.{0,90}\b(pregnan|kidney|liver|ulcer|blood thinner|allerg)/i.test(text)
    );
    if (!hasRiskContext) {
      missing.push("Relevant conditions such as pregnancy, kidney disease, liver disease, ulcers, or blood thinner use");
    }
    return missing;
  }

  if (intent === "scheduling" && !isAppointmentLookup) {
    if (!slots.appointment_time) missing.push("Preferred appointment day or time");
    if (!slots.appointment_reason) missing.push("Reason for the appointment");
    return missing;
  }

  if (intent === "rag") {
    if (!(slots.symptoms || []).length) missing.push("Main symptom or health concern");
    if (!slots.duration) missing.push("When this started or how long it has been happening");
    if (!slots.severity) missing.push("Current severity");
  }

  return missing;
}

function isAppointmentLookupText(text) {
  const lower = String(text || "").toLowerCase();
  const lookupSignal = /\b(?:when|upcoming|check)\b/.test(lower) || /\bnext\s+(?:appointment|visit|doctor visit)\b/.test(lower);
  const createSignal = /\b(?:schedule|book|create|make|request|reschedule)\b/.test(lower);
  return lookupSignal && !createSignal;
}

function qualityGates(intent, urgency, routeScores, confidence, missing) {
  if (urgency === "emergency" || intent === "alert") {
    return {
      gates: [{
        name: "emergency_override",
        status: "passed",
        reason: "Emergency signals override ambiguity and routine route scoring."
      }],
      needsClarification: false
    };
  }

  const gates = [];
  const topRoute = routeScores[0] || null;
  const secondRoute = routeScores[1] || null;

  if (confidence < 0.45) {
    gates.push({
      name: "low_route_confidence",
      status: "blocked",
      reason: "The selected route is below the minimum confidence threshold."
    });
  } else if (confidence < 0.58) {
    gates.push({
      name: "moderate_route_confidence",
      status: "watch",
      reason: "The selected route is usable but should ask for concrete follow-up details."
    });
  }

  if (topRoute && secondRoute) {
    const scoreGap = topRoute.score - secondRoute.score;
    if (secondRoute.score >= 0.34 && scoreGap < 0.12) {
      gates.push({
        name: "ambiguous_route",
        status: "blocked",
        reason: "Two specialist routes are close enough that the agent should clarify before relying on one."
      });
    }
  }

  if (intent === "pharmacy" && missing.some((item) => item.includes("Medication name"))) {
    gates.push({
      name: "missing_medication_name",
      status: "blocked",
      reason: "The Pharmacy Agent needs the exact medication name before lookup."
    });
  }

  if (intent === "pharmacy" && !gates.some((gate) => gate.status === "blocked") && missing.length) {
    gates.push({
      name: "pharmacy_context_gap",
      status: "watch",
      reason: "The Pharmacy Agent can provide general information, but patient-specific dosing and risk review need the missing context."
    });
  }

  if (intent === "scheduling" && missing.length) {
    gates.push({
      name: "missing_scheduling_details",
      status: "blocked",
      reason: "The Scheduling Agent needs a time and reason before creating a request."
    });
  }

  if (!gates.length) {
    gates.push({
      name: "route_quality",
      status: "passed",
      reason: "Route confidence and required fields are sufficient for this turn."
    });
  }

  return {
    gates,
    needsClarification: gates.some((gate) => gate.status === "blocked")
  };
}

function secondaryIntents(selected, urgency, routeScores) {
  const threshold = urgency === "emergency" ? 0.28 : 0.4;
  return (routeScores || [])
    .filter((route) => {
      if (!route || route.intent === selected || route.score < threshold) return false;
      if (route.intent === "rag" && (urgency === "emergency" || route.score < 0.62)) return false;
      if (!(route.evidence || []).length && route.score < 0.55) return false;
      return true;
    })
    .map((route) => route.intent)
    .slice(0, 2);
}

function agentActions(intent, urgency, missing, gates = [], clinicalSlots = {}, memoryCount = 0, secondaryRoutes = []) {
  const blockingGates = gates.filter((gate) => gate.status === "blocked").map((gate) => gate.name);
  const measurements = clinicalSlots.measurements || {};
  const actions = [
    {
      name: "resolve_memory_context",
      status: "completed",
      rationale: "Loaded recent conversation and patient profile before choosing a specialist.",
      details: { memoryMessagesAvailable: memoryCount, recentMessagesUsed: Math.min(memoryCount, 4) }
    },
    {
      name: "parse_patient_context",
      status: "completed",
      rationale: "Extracted symptoms, medications, timing, risk phrases, and profile signals."
    },
    {
      name: "screen_for_emergency",
      status: "completed",
      rationale: `Urgency classified as ${urgency}.`,
      details: {
        urgencyLevel: urgency,
        measurementFlags: clinicalSlots.measurement_flags || {},
        negatedRedFlags: clinicalSlots.negated_red_flags || []
      }
    },
    {
      name: "build_triage_context_packet",
      status: "completed",
      rationale: "Combined extracted slots, vital-style measurements, memory, and profile signals before routing.",
      details: {
        clinicalSlotCount: Object.keys(clinicalSlots || {}).length,
        measurementCount: Object.keys(measurements || {}).length
      }
    },
    {
      name: "quality_gate_review",
      status: blockingGates.length ? "blocked" : "completed",
      rationale: blockingGates.length
        ? `Blocked full automation until clarification: ${blockingGates.join(", ")}.`
        : "Route confidence, ambiguity, and required-field checks passed."
    }
  ];

  if (urgency === "emergency") {
    actions.push({
      name: "activate_alert_workflow",
      status: "completed",
      rationale: "Emergency warning signs bypass routine routing."
    });
  } else if (intent === "pharmacy") {
    const needsMedicationName = missing.some((item) => item.includes("Medication name"));
    actions.push({
      name: "consult_pharmacy_agent",
      status: needsMedicationName ? "blocked" : "completed",
      rationale: "Medication safety questions require a named medicine before lookup."
    });
  } else if (intent === "scheduling") {
    actions.push({
      name: "coordinate_scheduling_agent",
      status: missing.length ? "blocked" : "completed",
      rationale: "Appointment requests need enough detail before creating a request."
    });
  } else {
    actions.push({
      name: "retrieve_health_knowledge",
      status: "completed",
      rationale: "General health questions are answered from the local knowledge library."
    });
  }

  if (secondaryRoutes.length) {
    actions.push({
      name: "track_secondary_routes",
      status: urgency === "emergency" ? "blocked" : "completed",
      rationale: urgency === "emergency"
        ? "Emergency handling stays first; secondary route(s) are saved for follow-up."
        : "Captured additional care needs so the next turn can continue without losing context.",
      details: { secondaryIntents: secondaryRoutes }
    });
    actions.push({
      name: "preview_secondary_specialists",
      status: urgency === "emergency" ? "blocked" : "queued",
      rationale: urgency === "emergency"
        ? "Emergency handling stays first; secondary specialists are deferred."
        : "Run a bounded preview of secondary specialists so mixed patient requests are not lost.",
      details: {
        secondaryIntents: secondaryRoutes,
        maxPreviewCalls: 2,
        sideEffectSafe: true
      }
    });
  }

  actions.push({
    name: "update_patient_memory",
    status: "completed",
    rationale: "Persisted patient-provided context for safer follow-up turns."
  });
  return actions;
}

function workflowStep(step, name, summary, status = "completed") {
  return { step, name, status, summary };
}

function specialistNameForIntent(intent) {
  if (intent === "pharmacy") return "Pharmacy Agent";
  if (intent === "scheduling") return "Scheduling Agent";
  if (intent === "alert") return "Alert Agent";
  return "RAG Agent";
}

function completeAction(actions = [], name) {
  return actions.map((action) => {
    if (action.name === name && action.status === "queued") {
      return { ...action, status: "completed" };
    }
    return action;
  });
}

function buildWorkflowTrace(memoryCount, classification, result) {
  const flags = result.flags || [];
  const blockedGates = (classification.qualityGates || []).filter((gate) => gate.status === "blocked").map((gate) => gate.name);
  const secondaryCount = (result.secondaryOutputs || []).length;
  return [
    workflowStep(1, "patient_input", "Accepted a free-form symptom, question, or request."),
    workflowStep(2, "load_memory", `Loaded ${memoryCount} previous messages and patient profile signals before routing.`),
    workflowStep(
      3,
      "intent_classifier",
      blockedGates.length
        ? `Selected ${classification.intent} with ${Math.round(classification.confidence * 100)}% confidence; quality gates requested clarification.`
        : `Selected ${classification.intent} with ${Math.round(classification.confidence * 100)}% confidence and passed quality gates${(classification.secondaryIntents || []).length ? `; tracked secondary route(s): ${classification.secondaryIntents.join(", ")}` : ""}.`
    ),
    workflowStep(
      4,
      "specialist_agent",
      secondaryCount
        ? `Routed to ${specialistNameForIntent(classification.intent)} and previewed ${secondaryCount} secondary specialist route(s).`
        : `Routed to ${specialistNameForIntent(classification.intent)}.`
    ),
    workflowStep(5, "response_synthesizer", "Prepared a simple, patient-friendly response from specialist output."),
    workflowStep(6, "safety_guardrails", flags.length ? `Applied ${flags.length} safety guardrail checks.` : "Checked for emergency, diagnosis, medication, and disclaimer boundaries."),
    workflowStep(7, "patient_reply", "Prepared the final clean response for the chat UI."),
    workflowStep(8, "update_memory", `Saved this exchange locally; next turn can use ${Math.min(40, memoryCount + 2)} messages of context.`)
  ];
}

function sourceDomain(source) {
  try {
    return new URL(source.url || "").hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isTrustedSource(source) {
  const domain = sourceDomain(source);
  return TRUSTED_SOURCE_DOMAINS.some((trusted) => domain === trusted || domain.endsWith(`.${trusted}`));
}

function sourceQualityFor(sources) {
  if (!sources || !sources.length) return "none";
  return sources.some(isTrustedSource) ? "trusted" : "local_or_unverified";
}

function handoffFor(result, classification, sourceQuality) {
  const missing = classification.missingInformation || [];
  const blockedGates = (classification.qualityGates || []).filter((gate) => gate.status === "blocked");
  if (result.intent === "alert" || classification.urgencyLevel === "emergency") {
    return {
      level: "emergency",
      owner: "Emergency services / caregiver",
      reason: "Emergency warning signs override routine agent routing."
    };
  }
  if (classification.urgencyLevel === "urgent") {
    return {
      level: "prompt_clinician_contact",
      owner: "Care team",
      reason: "Potentially concerning symptoms need timely human review."
    };
  }
  if (result.intent === "pharmacy" && missing.length) {
    return {
      level: "pharmacist_or_prescriber",
      owner: "Pharmacist or prescriber",
      reason: "Medication advice needs exact label details and patient-specific risk factors."
    };
  }
  if (result.intent === "pharmacy" && (classification.clinicalSlots?.risk_factors || []).length) {
    return {
      level: "pharmacist_or_prescriber",
      owner: "Pharmacist or prescriber",
      reason: "Medication risk factors were mentioned, so patient-specific safety should be reviewed by a professional."
    };
  }
  if (blockedGates.length) {
    return {
      level: "clinician_review",
      owner: "Care team",
      reason: "The agent quality gate blocked full confidence and requested clarification."
    };
  }
  if (classification.confidence < 0.45 || sourceQuality === "none") {
    return {
      level: "clinician_review",
      owner: "Care team",
      reason: "The agent has limited source support or low route confidence."
    };
  }
  return {
    level: "routine",
    owner: "Patient / care team as needed",
    reason: "The response is educational and source-supported, with normal safety disclaimers."
  };
}

function clinicalFactItems(classification = {}) {
  const slots = classification.clinicalSlots || {};
  const profile = classification.patientProfile || {};
  const facts = [];
  [
    ["Symptoms", "symptoms"],
    ["Medications", "medications"],
    ["Risk factors", "risk_factors"],
    ["Allergies", "allergies"],
    ["Emergency contact", "emergency_contacts"],
    ["Negated risk factors", "negated_risk_factors"],
    ["Red flags", "red_flags"],
    ["Negated red flags", "negated_red_flags"]
  ].forEach(([label, key]) => {
    const values = slots[key];
    if (Array.isArray(values) && values.length) {
      facts.push(`${label}: ${values.slice(0, 5).join(", ")}`);
    }
  });
  if ((profile.allergies || []).length) {
    facts.push(`Allergies: ${profile.allergies.slice(0, 5).join(", ")}`);
  }
  if ((profile.emergency_contacts || []).length) {
    facts.push(`Emergency contact: ${profile.emergency_contacts[0]}`);
  }

  const measurements = slots.measurements || {};
  const measurementValues = [];
  if (measurements.blood_pressure) {
    measurementValues.push(`blood pressure ${measurements.blood_pressure.systolic}/${measurements.blood_pressure.diastolic}`);
  }
  [
    ["temperature_f", "temperature"],
    ["oxygen_saturation", "oxygen saturation"],
    ["blood_glucose", "blood glucose"],
    ["heart_rate", "heart rate"]
  ].forEach(([key, label]) => {
    if (measurements[key] !== undefined) measurementValues.push(`${label} ${measurements[key]}`);
  });
  if (measurementValues.length) facts.push(`Measurements: ${measurementValues.slice(0, 5).join(", ")}`);

  [
    ["Duration", "duration"],
    ["Severity", "severity"],
    ["Appointment time", "appointment_time"]
  ].forEach(([label, key]) => {
    if (slots[key]) facts.push(`${label}: ${slots[key]}`);
  });
  return facts.slice(0, 8);
}

function routeSummaryItems(classification = {}) {
  return (classification.routeScores || []).slice(0, 4).map((route) => {
    const evidence = Array.isArray(route.evidence) && route.evidence.length
      ? ` (${route.evidence.slice(0, 2).join("; ")})`
      : "";
    return `${route.intent}: ${Number(route.score || 0).toFixed(2)}${evidence}`;
  });
}

function nextBestActionFor(result, classification, handoff) {
  const missing = classification.missingInformation || [];
  const secondaryOutputs = result.secondaryOutputs || [];
  if (result.intent === "alert" || classification.urgencyLevel === "emergency") {
    return "Call emergency services now and share the extracted facts with the responder or caregiver.";
  }
  if (classification.urgencyLevel === "urgent") {
    return "Contact the care team promptly and use the handoff packet to summarize the concern.";
  }
  if (missing.length) {
    return `Ask the patient for: ${missing.slice(0, 3).join("; ")}.`;
  }
  if (result.intent === "scheduling" && result.appointment) {
    return "Confirm the appointment details with the care team and watch for any urgent symptom changes.";
  }
  if (result.intent === "pharmacy") {
    return "Use only label or prescriber directions and escalate medication-specific concerns to a pharmacist or prescriber.";
  }
  if (secondaryOutputs.length) {
    return "Finish the primary response, then continue with the previewed secondary care need.";
  }
  if (handoff?.level && handoff.level !== "routine") {
    return handoff.reason || "Use the care-team handoff guidance.";
  }
  return "Continue self-care education, monitor for red flags, and contact the care team if symptoms worsen.";
}

function buildHandoffPacket(result, classification, handoff) {
  return {
    title: `${capitalize(result.intent || "rag")} handoff packet`,
    urgencyLevel: classification.urgencyLevel || "routine",
    handoffLevel: handoff?.level || "routine",
    handoffOwner: handoff?.owner || "Care team",
    primaryAgent: specialistNameForIntent(result.intent),
    routeSummary: routeSummaryItems(classification),
    knownFacts: clinicalFactItems(classification),
    missingInformation: (classification.missingInformation || []).slice(0, 5),
    secondaryWork: (result.secondaryOutputs || []).slice(0, 2).map((item) => ({
      intent: item.intent,
      status: item.status,
      summary: item.summary
    })),
    nextBestAction: nextBestActionFor(result, classification, handoff),
    safetyFlags: result.flags || [],
    reasoningSnapshot: (classification.reasoningTrace || []).slice(0, 4)
  };
}

function buildGovernanceCard(result, classification) {
  const sourceQuality = sourceQualityFor(result.sources || []);
  const limitations = [
    "Educational support only; not a diagnosis or substitute for a clinician.",
    "Patient-reported text may be incomplete, ambiguous, or inaccurate.",
    "Local demo data can become stale and should be reviewed before production use.",
    "The model informs or augments decisions; it does not replace clinical management."
  ];
  if (sourceQuality === "none") limitations.push("No external source was matched for this turn.");
  if (result.intent === "pharmacy") limitations.push("No personalized dose changes, starts, stops, or interactions are provided.");
  const handoff = handoffFor(result, classification, sourceQuality);
  const handoffPacket = buildHandoffPacket(result, classification, handoff);

  return {
    intendedUse: "General health education, routing, and care-team handoff support.",
    decisionRole: "Informs or augments patient and care-team decisions; does not replace clinical judgment.",
    sourceQuality,
    handoff,
    handoffPacket,
    qualityGates: classification.qualityGates || [],
    secondaryIntents: classification.secondaryIntents || [],
    secondaryOutputs: result.secondaryOutputs || [],
    modelEfficiency: classification.modelEfficiency || {},
    limitations,
    riskControls: [
      "Emergency signal override",
      "Measurement-aware triage",
      "Negation-aware emergency screening",
      "Bounded secondary specialist preview",
      "Secondary route tracking",
      "Structured handoff packet",
      "Agent quality gate review",
      "Medication safety note",
      "Diagnosis language blocking",
      "Source-quality check",
      "Memory trace and workflow audit"
    ]
  };
}

function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "the requested time";
  return parsed.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function patientKeyFor(id) {
  return `healthcare-agent:${id}`;
}

function profileKeyFor(id) {
  return `healthcare-agent-profile:${id}`;
}

function taskKeyFor(id) {
  return `healthcare-agent-tasks:${id}`;
}

function noteKeyFor(id) {
  return `healthcare-agent-notes:${id}`;
}

function patientKey() {
  const id = elements.patientId.value.trim() || "demo-patient";
  return patientKeyFor(id);
}

function profileKey() {
  const id = elements.patientId.value.trim() || "demo-patient";
  return profileKeyFor(id);
}

function taskKey() {
  const id = elements.patientId.value.trim() || "demo-patient";
  return taskKeyFor(id);
}

function noteKey() {
  const id = elements.patientId.value.trim() || "demo-patient";
  return noteKeyFor(id);
}

function isLocalHostRuntime() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function storageIsAvailable(type = "localStorage") {
  try {
    const storage = window[type];
    const key = "__healthcare_agent_storage_test__";
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function isInstalledRuntime() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(window.navigator.standalone);
}

function runtimeModeLabel() {
  if (isInstalledRuntime()) return "installed_app";
  if (isLocalHostRuntime()) return state.localHostStoreAvailable ? "localhost_full_store" : "localhost_browser_store";
  if (window.location.protocol === "file:") return "local_file";
  return "hosted_static";
}

function storageModeLabel() {
  if (state.localHostStoreAvailable) return "localhost_file_store_with_browser_mirror";
  return state.localStorageAvailable ? "browser_storage_with_export_restore" : "session_only_export_required";
}

function packageDownloadUrl() {
  const link = elements.downloadLocal || document.querySelector('[data-package-download][href*="healthcare-agent-local.zip"]');
  return link ? link.href : new URL("downloads/healthcare-agent-local.zip", window.location.href).href;
}

function buildRuntimeCapabilityRows() {
  state.localStorageAvailable = storageIsAvailable();
  const dataReady = state.topicIndex.length > 0 && Object.keys(state.drugs || {}).length > 0;
  const serviceWorkerSupported = "serviceWorker" in navigator;
  const cacheSupported = "caches" in window;
  const serviceWorkerReady = serviceWorkerSupported && (state.serviceWorkerState === "ready" || state.serviceWorkerState === "active" || Boolean(navigator.serviceWorker?.controller));
  const downloadKnown = state.downloadPackageAvailable !== null;
  const downloadReady = state.downloadPackageAvailable === true || window.location.protocol === "file:";
  const installed = isInstalledRuntime();

  return [
    {
      label: "Agent reasoning",
      detail: "Intent routing, specialist selection, safety gates, handoff, and response synthesis run locally in the browser.",
      status: "ok",
      badge: "Full",
      icon: "workflow"
    },
    {
      label: "Knowledge library",
      detail: dataReady
        ? `${state.topicIndex.length} indexed topics and ${Object.keys(state.drugs).length} medication records loaded from ${state.dataSource}.`
        : "Fallback health and medication records are available while data loads.",
      status: dataReady ? "ok" : "watch",
      badge: dataReady ? "Ready" : "Fallback",
      icon: "book-open-check"
    },
    {
      label: "Patient memory",
      detail: state.localHostStoreAvailable
        ? "Localhost file store is active and mirrored to browser storage."
        : state.localStorageAvailable
          ? "Browser storage is active with JSON copy, download, and restore for portability."
          : "Browser storage is blocked, so export records before leaving this session.",
      status: state.localHostStoreAvailable || state.localStorageAvailable ? "ok" : "blocked",
      badge: state.localHostStoreAvailable ? "Local" : state.localStorageAvailable ? "Browser" : "Blocked",
      icon: "hard-drive"
    },
    {
      label: "Offline cache",
      detail: serviceWorkerReady
        ? "Install cache is active for app files, local knowledge, icons, and the local ZIP package."
        : serviceWorkerSupported && cacheSupported
          ? "Install cache is registering. Reload once after installation to use the newest cache."
          : "This browser does not expose the full service-worker cache feature.",
      status: serviceWorkerSupported && cacheSupported ? (serviceWorkerReady ? "ok" : "watch") : "blocked",
      badge: serviceWorkerReady ? "Ready" : serviceWorkerSupported ? "Building" : "Off",
      icon: "package-check"
    },
    {
      label: "Download package",
      detail: downloadReady
        ? "Local app package is reachable from this device."
        : downloadKnown
          ? "Package check did not succeed from this runtime; use the visible download link or hosted files."
          : "Package check is pending.",
      status: downloadReady ? "ok" : "watch",
      badge: downloadReady ? "Ready" : "Check",
      icon: "archive"
    },
    {
      label: "Device install",
      detail: installed ? "The app is running in installed mode." : deviceInstallGuide(),
      status: "ok",
      badge: installed ? "Installed" : "Available",
      icon: "download"
    },
    {
      label: "Hosted boundary",
      detail: state.localHostStoreAvailable
        ? "Full localhost persistence is active on this machine."
        : isLocalHostRuntime()
          ? "Local server is active, but browser storage is handling records because the file-store API is unavailable."
          : "Hosted/static mode cannot write private files to your machine; export and restore keep records portable.",
      status: state.localHostStoreAvailable ? "ok" : "watch",
      badge: state.localHostStoreAvailable ? "Full" : "Portable",
      icon: "shield-check"
    }
  ];
}

function runtimeCapabilityScore(rows = state.runtimeCapabilities) {
  const values = rows && rows.length ? rows : buildRuntimeCapabilityRows();
  if (!values.length) return 0;
  const score = values.reduce((total, item) => total + (item.status === "ok" ? 1 : item.status === "watch" ? 0.5 : 0), 0);
  return Math.round((score / values.length) * 100);
}

function renderCapabilities() {
  if (!elements.capabilityList) return;
  const rows = buildRuntimeCapabilityRows();
  state.runtimeCapabilities = rows;
  elements.capabilityList.innerHTML = "";
  rows.forEach((item) => {
    const row = document.createElement("div");
    row.className = `capability-row ${item.status || "ok"}`;
    const icon = item.icon || (item.status === "blocked" ? "octagon-alert" : item.status === "watch" ? "circle-alert" : "check-circle");
    row.appendChild(iconElement(icon));

    const text = document.createElement("div");
    text.appendChild(createText("strong", "", item.label));
    text.appendChild(createText("span", "", item.detail));
    row.appendChild(text);
    row.appendChild(createText("span", "capability-badge", item.badge || item.status || "ok"));
    elements.capabilityList.appendChild(row);
  });
  refreshIcons();
}

async function verifyDownloadPackage() {
  if (window.location.protocol === "file:") {
    state.downloadPackageAvailable = true;
    renderCapabilities();
    return;
  }

  try {
    const response = await fetch(packageDownloadUrl(), { method: "HEAD", cache: "no-store" });
    state.downloadPackageAvailable = response.ok;
  } catch {
    state.downloadPackageAvailable = false;
  }
  renderCapabilities();
}

function packageDownloadUnavailableMessage() {
  if (window.location.protocol === "file:") {
    return "This copy is already local. Start it with launch_app.cmd or start_local_server.cmd for localhost storage.";
  }
  return "The local app package is not available from this page yet. Rebuild or re-upload the downloads folder, then try again.";
}

function initializePackageDownloads() {
  document.querySelectorAll("[data-package-download]").forEach((link) => {
    link.addEventListener("click", () => {
      const filename = link.getAttribute("download") || "healthcare-agent-local.zip";
      state.downloadPackageAvailable = true;
      setLaunchStatus(`Downloading ${filename}.`);
      setWorkspaceStatus(`Downloading ${filename}.`);
      renderCapabilities();
      window.setTimeout(verifyDownloadPackage, 1000);
    });
  });
}

function capabilityExportRows() {
  const rows = state.runtimeCapabilities.length ? state.runtimeCapabilities : buildRuntimeCapabilityRows();
  return rows.map(({ label, detail, status, badge }) => ({ label, detail, status, badge }));
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(String(value));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToUtf8(value) {
  const binary = atob(String(value || ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function localHostStoreRequest(method, key, value = null) {
  const options = {
    method,
    cache: "no-store"
  };
  if (value !== null) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify({
      value: utf8ToBase64(value),
      updated_at: new Date().toISOString()
    });
  }

  const response = await fetch(`api/local-store?key=${encodeURIComponent(key)}`, options);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Localhost store request failed");
  if (method === "GET") {
    const payload = await response.json();
    return payload && payload.value ? base64ToUtf8(payload.value) : null;
  }
  return true;
}

async function initializeLocalHostStore() {
  if (!isLocalHostRuntime()) return;
  try {
    const response = await fetch("api/local-store/health", { cache: "no-store" });
    state.localHostStoreAvailable = response.ok;
  } catch {
    state.localHostStoreAvailable = false;
  }
}

async function hydrateLocalHostKey(key) {
  if (!state.localHostStoreAvailable) return;
  try {
    const serverValue = await localHostStoreRequest("GET", key);
    if (serverValue !== null) {
      localStorage.setItem(key, serverValue);
      return;
    }

    const browserValue = localStorage.getItem(key);
    if (browserValue !== null) {
      await localHostStoreRequest("PUT", key, browserValue);
    }
  } catch {
    state.localHostStoreAvailable = false;
  }
}

function mirrorLocalHostValue(key, value) {
  if (!state.localHostStoreAvailable) return;
  localHostStoreRequest("PUT", key, value).catch(() => {
    state.localHostStoreAvailable = false;
  });
}

function deleteLocalHostValue(key) {
  if (!state.localHostStoreAvailable) return;
  localHostStoreRequest("DELETE", key).catch(() => {
    state.localHostStoreAvailable = false;
  });
}

async function hydrateAccessStore() {
  await hydrateLocalHostKey(accessKey());
}

async function hydratePatientStore(id) {
  await Promise.all([
    hydrateLocalHostKey(patientKeyFor(id)),
    hydrateLocalHostKey(profileKeyFor(id)),
    hydrateLocalHostKey(taskKeyFor(id)),
    hydrateLocalHostKey(noteKeyFor(id))
  ]);
}

function readMemory() {
  try {
    return JSON.parse(localStorage.getItem(patientKey()) || "[]");
  } catch {
    return [];
  }
}

function writeMemory(memory) {
  const key = patientKey();
  const value = JSON.stringify(memory.slice(-40));
  localStorage.setItem(key, value);
  mirrorLocalHostValue(key, value);
}

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(profileKey()) || "{}");
  } catch {
    return {};
  }
}

function writeProfile(profile) {
  const key = profileKey();
  const value = JSON.stringify(profile || {});
  localStorage.setItem(key, value);
  mirrorLocalHostValue(key, value);
}

function readTasks() {
  try {
    return JSON.parse(localStorage.getItem(taskKey()) || "[]");
  } catch {
    return [];
  }
}

function writeTasks(tasks) {
  const key = taskKey();
  const value = JSON.stringify((tasks || []).slice(0, 50));
  localStorage.setItem(key, value);
  mirrorLocalHostValue(key, value);
}

function readNotes() {
  try {
    return JSON.parse(localStorage.getItem(noteKey()) || "[]");
  } catch {
    return [];
  }
}

function writeNotes(notes) {
  const key = noteKey();
  const value = JSON.stringify((notes || []).slice(0, 50));
  localStorage.setItem(key, value);
  mirrorLocalHostValue(key, value);
}

function parseListInput(value) {
  return uniqueLower(String(value || "").split(/[,;\n]+/));
}

function parseContactInput(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function formatListInput(items) {
  return (items || []).join(", ");
}

function loadProfileForm(profile = readProfile()) {
  if (!elements.profileMedications) return;
  elements.profileMedications.value = formatListInput(profile.medications || []);
  elements.profileConditions.value = formatListInput(profile.conditions || []);
  elements.profileAllergies.value = formatListInput(profile.allergies || []);
  elements.profileContact.value = (profile.emergency_contacts || [])[0] || "";
  elements.profileSaveStatus.textContent = "Saved context improves routing and handoff packets.";
}

function profileFromForm() {
  const profile = {};
  const medications = parseListInput(elements.profileMedications.value);
  const conditions = parseListInput(elements.profileConditions.value);
  const allergies = parseListInput(elements.profileAllergies.value);
  const contact = parseContactInput(elements.profileContact.value);
  if (medications.length) profile.medications = medications;
  if (conditions.length) profile.conditions = conditions;
  if (allergies.length) profile.allergies = allergies;
  if (contact) profile.emergency_contacts = [contact];
  return profile;
}

function saveProfileContext() {
  const existing = readProfile();
  const preserved = {};
  ["symptoms", "preferences"].forEach((key) => {
    if (existing[key] && existing[key].length) preserved[key] = existing[key];
  });
  const next = mergeProfile(preserved, profileFromForm());
  const contact = parseContactInput(elements.profileContact.value);
  if (contact) next.emergency_contacts = [contact];
  writeProfile(next);
  if (state.recentResult) {
    state.recentResult.patientProfile = mergeProfile(state.recentResult.patientProfile || {}, next);
    if (contact) state.recentResult.patientProfile.emergency_contacts = [contact];
    state.recentResult.profileSignals = state.recentResult.patientProfile;
  }
  loadProfileForm(next);
  updateSummary();
  renderProfileSignals(next);
  elements.profileSaveStatus.textContent = "Patient context saved locally.";
  setWorkspaceStatus("Patient context saved for routing.");
}

function openTaskCount(tasks = readTasks()) {
  return tasks.filter((task) => !task.completed).length;
}

function updateTaskSummary(tasks = readTasks()) {
  if (!elements.taskSummary) return;
  const open = openTaskCount(tasks);
  elements.taskSummary.textContent = `${open} open`;
}

function renderTasks(tasks = readTasks()) {
  if (!elements.taskList) return;
  elements.taskList.innerHTML = "";
  updateTaskSummary(tasks);

  if (!tasks.length) {
    elements.taskList.appendChild(createText("span", "empty", "No care tasks yet"));
    return;
  }

  tasks.slice(0, 12).forEach((task) => {
    const row = document.createElement("div");
    row.className = `task-item ${task.completed ? "completed" : ""}`;

    const toggle = document.createElement("button");
    toggle.className = "task-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", task.completed ? "Mark task open" : "Mark task complete");
    toggle.appendChild(iconElement(task.completed ? "check-check" : "circle-dot"));
    toggle.addEventListener("click", () => toggleTask(task.id));
    row.appendChild(toggle);

    row.appendChild(createText("span", "task-text", task.text));

    const remove = document.createElement("button");
    remove.className = "task-delete";
    remove.type = "button";
    remove.setAttribute("aria-label", "Delete task");
    remove.appendChild(iconElement("trash-2"));
    remove.addEventListener("click", () => deleteTask(task.id));
    row.appendChild(remove);

    elements.taskList.appendChild(row);
  });
  refreshIcons();
}

function addTask(text) {
  const value = String(text || "").trim();
  if (!value) return;
  const tasks = readTasks();
  tasks.unshift({
    id: `task-${Date.now()}`,
    text: value,
    completed: false,
    created_at: new Date().toISOString()
  });
  writeTasks(tasks);
  renderTasks(tasks);
  renderReadiness(state.recentResult);
  renderCaregiverUpdate(state.recentResult);
  setWorkspaceStatus("Care task added.");
}

function addFocusTaskFromCurrent() {
  const value = elements.addFocusTask?.dataset.taskText || "";
  if (!value) return;
  addTask(value);
}

function toggleTask(id) {
  const tasks = readTasks().map((task) => {
    if (task.id !== id) return task;
    return { ...task, completed: !task.completed, completed_at: task.completed ? "" : new Date().toISOString() };
  });
  writeTasks(tasks);
  renderTasks(tasks);
  renderReadiness(state.recentResult);
  renderCaregiverUpdate(state.recentResult);
}

function deleteTask(id) {
  const tasks = readTasks().filter((task) => task.id !== id);
  writeTasks(tasks);
  renderTasks(tasks);
  renderReadiness(state.recentResult);
  renderCaregiverUpdate(state.recentResult);
  setWorkspaceStatus("Care task removed.");
}

function updateNoteSummary(notes = readNotes()) {
  if (!elements.noteSummary) return;
  elements.noteSummary.textContent = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
}

function renderNotes(notes = readNotes()) {
  if (!elements.noteList) return;
  elements.noteList.innerHTML = "";
  updateNoteSummary(notes);

  if (!notes.length) {
    elements.noteList.appendChild(createText("span", "empty", "No case notes yet"));
    return;
  }

  notes.slice(0, 8).forEach((note) => {
    const row = document.createElement("div");
    row.className = "note-item";

    const text = document.createElement("div");
    text.appendChild(createText("strong", "", note.text));
    const meta = [
      note.route ? `${capitalize(note.route)} route` : "",
      note.created_at ? timelineTimeLabel(note.created_at) : ""
    ].filter(Boolean).join(" • ");
    text.appendChild(createText("span", "", meta || "Saved note"));
    row.appendChild(text);

    const remove = document.createElement("button");
    remove.className = "task-delete";
    remove.type = "button";
    remove.setAttribute("aria-label", "Delete note");
    remove.appendChild(iconElement("trash-2"));
    remove.addEventListener("click", () => deleteNote(note.id));
    row.appendChild(remove);
    elements.noteList.appendChild(row);
  });
  refreshIcons();
}

function addNote(text) {
  const value = String(text || "").trim();
  if (!value) return;
  const notes = readNotes();
  notes.unshift({
    id: `note-${Date.now()}`,
    text: value,
    route: state.recentResult?.intent || "",
    created_at: new Date().toISOString()
  });
  writeNotes(notes);
  renderNotes(notes);
  renderCaregiverUpdate(state.recentResult);
  renderReadiness(state.recentResult);
  setWorkspaceStatus("Case note saved.");
}

function deleteNote(id) {
  const notes = readNotes().filter((note) => note.id !== id);
  writeNotes(notes);
  renderNotes(notes);
  renderCaregiverUpdate(state.recentResult);
  renderReadiness(state.recentResult);
  setWorkspaceStatus("Case note removed.");
}

function timelineEntries(memory = readMemory()) {
  const entries = [];
  memory.forEach((item, index) => {
    if (!item || item.role !== "patient") return;
    const assistant = memory.slice(index + 1).find((candidate) => candidate.role === "assistant");
    const result = assistant?.result || null;
    entries.push({
      text: item.text || "",
      timestamp: item.created_at || assistant?.created_at || "",
      title: result?.title || "Awaiting response",
      intent: result?.intent || "rag",
      urgency: result?.urgencyLevel || "routine",
      confidence: result?.confidence || 0
    });
  });
  return entries;
}

function timelineTimeLabel(value) {
  if (!value) return "Saved turn";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Saved turn";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderTimeline(memory = readMemory()) {
  if (!elements.timelineList) return;
  elements.timelineList.innerHTML = "";
  const entries = timelineEntries(memory).slice(-6).reverse();

  if (!entries.length) {
    elements.timelineList.appendChild(createText("span", "empty", "No saved patient turns yet"));
    return;
  }

  entries.forEach((entry) => {
    const row = document.createElement("div");
    row.className = `timeline-item ${entry.intent}`;

    const content = document.createElement("div");
    content.className = "timeline-content";
    content.appendChild(createText("strong", "", shortText(entry.text, "Patient message", 84)));

    const meta = document.createElement("div");
    meta.className = "timeline-meta";
    meta.appendChild(createIconText("span", "", INTENT_ICONS[entry.intent] || "route", capitalize(entry.intent)));
    meta.appendChild(createIconText("span", "", "activity", capitalize(entry.urgency)));
    if (entry.confidence) {
      meta.appendChild(createIconText("span", "", "gauge", `${Math.round(entry.confidence * 100)}%`));
    }
    meta.appendChild(createText("span", "", timelineTimeLabel(entry.timestamp)));
    content.appendChild(meta);
    content.appendChild(createText("span", "timeline-title", shortText(entry.title, "Latest route", 80)));
    row.appendChild(content);

    const reuse = document.createElement("button");
    reuse.className = "timeline-reuse";
    reuse.type = "button";
    reuse.appendChild(iconElement("send-horizontal"));
    reuse.appendChild(document.createTextNode("Reuse"));
    reuse.addEventListener("click", () => usePrompt(entry.text));
    row.appendChild(reuse);

    elements.timelineList.appendChild(row);
  });
  refreshIcons();
}

function hasProfileContext(profile = readProfile()) {
  return ["medications", "conditions", "allergies", "emergency_contacts", "symptoms"].some((key) => {
    return Array.isArray(profile[key]) && profile[key].length;
  });
}

function readinessChecks(result = state.recentResult) {
  const profile = readProfile();
  const tasks = readTasks();
  const notes = readNotes();
  const card = result?.governanceCard || {};
  const gates = card.qualityGates || [];
  const blocked = gates.some((gate) => gate.status === "blocked");
  const missing = result?.missingInformation || [];
  const nextAction = card.handoffPacket?.nextBestAction || result?.handoffPacket?.nextBestAction || "";
  return [
    {
      key: "route",
      label: "Route selected",
      done: Boolean(result),
      detail: result ? `${capitalize(result.intent || "rag")} agent is active.` : "Ask the first patient question."
    },
    {
      key: "missing",
      label: "Key details clear",
      done: Boolean(result) && missing.length === 0,
      detail: missing.length ? shortText(missing[0], "More details needed", 90) : "No missing details flagged."
    },
    {
      key: "context",
      label: "Patient context saved",
      done: hasProfileContext(profile),
      detail: hasProfileContext(profile) ? "Profile signals are feeding routing." : "Add medicines, conditions, allergies, or contact."
    },
    {
      key: "guardrails",
      label: "Guardrails passed",
      done: Boolean(result) && !blocked,
      detail: blocked ? "A quality gate is blocking handoff." : "No blocked safety gates."
    },
    {
      key: "action",
      label: "Next action captured",
      done: Boolean(nextAction) || openTaskCount(tasks) > 0,
      detail: nextAction ? shortText(nextAction, "Next action ready", 90) : `${openTaskCount(tasks)} open task(s).`
    },
    {
      key: "notes",
      label: "Human notes saved",
      done: notes.length > 0,
      detail: notes.length ? `${notes.length} case note(s) saved.` : "Add a local note for handoff context."
    }
  ];
}

function readinessSummary(result = state.recentResult) {
  const checks = readinessChecks(result);
  const complete = checks.filter((check) => check.done).length;
  const score = Math.round((complete / checks.length) * 100);
  const label = score >= 80 ? "Ready for handoff" : score >= 55 ? "Needs a few details" : result ? "Early intake" : "Waiting for first message";
  return { checks, complete, score, label };
}

function renderReadiness(result = state.recentResult) {
  if (!elements.readinessList) return;
  const readiness = readinessSummary(result);
  elements.readinessScore.textContent = `${readiness.score}%`;
  elements.readinessScore.parentElement.style.setProperty("--readiness", `${readiness.score}%`);
  elements.readinessLabel.textContent = readiness.label;
  elements.readinessSummary.textContent = `${readiness.complete} of ${readiness.checks.length} readiness checks are complete.`;
  elements.readinessList.innerHTML = "";

  readiness.checks.forEach((check) => {
    const row = document.createElement("div");
    row.className = `readiness-item ${check.done ? "done" : "open"}`;
    row.appendChild(iconElement(check.done ? "check-check" : "circle-help"));

    const text = document.createElement("div");
    text.appendChild(createText("strong", "", check.label));
    text.appendChild(createText("span", "", check.detail));
    row.appendChild(text);
    elements.readinessList.appendChild(row);
  });
  refreshIcons();
}

function handoffText(result = state.recentResult) {
  const patientId = elements.patientId.value.trim() || "demo-patient";
  if (!result) {
    return [
      "Healthcare Agent handoff",
      `Patient ID: ${patientId}`,
      "No active patient route yet."
    ].join("\n");
  }

  const card = result.governanceCard || {};
  const packet = card.handoffPacket || result.handoffPacket || {};
  const tasks = readTasks().filter((task) => !task.completed).slice(0, 5).map((task) => task.text);
  return [
    "Healthcare Agent handoff",
    `Patient ID: ${patientId}`,
    `Route: ${capitalize(result.intent || "rag")}`,
    `Urgency: ${capitalize(result.urgencyLevel || "routine")}`,
    `Owner: ${card.handoff?.owner || "Care team"}`,
    `Reason: ${card.handoff?.reason || result.reason || "Patient support request"}`,
    `Next action: ${packet.nextBestAction || "Continue routine monitoring"}`,
    listBlock("Known facts", packet.knownFacts || []),
    listBlock("Missing details", result.missingInformation || []),
    listBlock("Open care tasks", tasks),
    DISCLAIMER
  ].join("\n");
}

function renderHandoffPocket(result = state.recentResult) {
  if (!elements.handoffPocket) return;
  elements.handoffPocket.innerHTML = "";
  if (!result) {
    elements.handoffPocket.appendChild(createText("span", "empty", "Handoff appears after the first routed response"));
    return;
  }

  const card = result.governanceCard || {};
  const packet = card.handoffPacket || result.handoffPacket || {};
  const rows = [
    ["Owner", card.handoff?.owner || "Care team"],
    ["Route", `${capitalize(result.intent || "rag")} / ${capitalize(result.urgencyLevel || "routine")}`],
    ["Reason", card.handoff?.reason || result.reason || "Patient support request"],
    ["Next", packet.nextBestAction || "Continue routine monitoring"]
  ];

  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "handoff-row";
    row.appendChild(createText("span", "", label));
    row.appendChild(createText("strong", "", value));
    elements.handoffPocket.appendChild(row);
  });
}

function caregiverUpdateText(result = state.recentResult) {
  const patientId = elements.patientId.value.trim() || "demo-patient";
  const profile = readProfile();
  const tasks = readTasks().filter((task) => !task.completed).slice(0, 4).map((task) => task.text);
  const notes = readNotes().slice(0, 4).map((note) => note.text);
  if (!result) {
    return [
      "Caregiver update",
      `Patient ID: ${patientId}`,
      "No active routed response yet.",
      listBlock("Saved notes", notes)
    ].join("\n");
  }

  const packet = result.governanceCard?.handoffPacket || result.handoffPacket || {};
  return [
    "Caregiver update",
    `Patient ID: ${patientId}`,
    `Route: ${capitalize(result.intent || "rag")}`,
    `Urgency: ${capitalize(result.urgencyLevel || "routine")}`,
    `Summary: ${result.title || "Care question"}`,
    `Next action: ${packet.nextBestAction || "Continue routine monitoring"}`,
    listBlock("Medicines", profile.medications),
    listBlock("Conditions", profile.conditions),
    listBlock("Allergies", profile.allergies),
    listBlock("Open tasks", tasks),
    listBlock("Case notes", notes),
    DISCLAIMER
  ].join("\n");
}

function renderCaregiverUpdate(result = state.recentResult) {
  if (!elements.caregiverUpdate) return;
  elements.caregiverUpdate.innerHTML = "";
  const notes = readNotes();
  if (!result && !notes.length) {
    elements.caregiverUpdate.appendChild(createText("span", "empty", "Caregiver update appears after a routed response or case note"));
    return;
  }

  const packet = result?.governanceCard?.handoffPacket || result?.handoffPacket || {};
  const rows = [
    ["Route", result ? `${capitalize(result.intent || "rag")} / ${capitalize(result.urgencyLevel || "routine")}` : "No active route"],
    ["Next", result ? packet.nextBestAction || "Continue routine monitoring" : "Add a patient message"],
    ["Notes", notes.length ? `${notes.length} saved` : "None yet"]
  ];
  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "caregiver-row";
    row.appendChild(createText("span", "", label));
    row.appendChild(createText("strong", "", value));
    elements.caregiverUpdate.appendChild(row);
  });
}

async function copyCaregiverUpdate() {
  const text = caregiverUpdateText();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopyText(text)) {
      throw new Error("Copy unavailable");
    }
    setWorkspaceStatus("Caregiver update copied.");
  } catch {
    setWorkspaceStatus("Caregiver update copy unavailable.");
  }
}

function uniqueFactItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.label}:${item.value}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(item.value);
  });
}

function caseFactItems(result = state.recentResult) {
  if (!result) return [];
  const slots = result.clinicalSlots || {};
  const profile = readProfile();
  const packet = result.governanceCard?.handoffPacket || result.handoffPacket || {};
  const items = [];
  const addList = (icon, label, values) => {
    (values || []).slice(0, 4).forEach((value) => items.push({ icon, label, value }));
  };

  addList("activity", "Symptom", slots.symptoms);
  addList("pill", "Medicine", slots.medications);
  addList("shield-alert", "Risk", slots.risk_factors);
  addList("clipboard-plus", "Condition", profile.conditions);
  addList("shield-check", "Allergy", profile.allergies);
  addList("pill", "Saved med", profile.medications);

  if (slots.duration) items.push({ icon: "calendar-clock", label: "Duration", value: slots.duration });
  if (slots.severity) items.push({ icon: "gauge", label: "Severity", value: slots.severity });
  if (slots.appointment_time) items.push({ icon: "calendar-clock", label: "Time", value: slots.appointment_time });
  if (slots.appointment_reason) items.push({ icon: "clipboard-list", label: "Reason", value: slots.appointment_reason });
  if (slots.measurements) {
    Object.entries(slots.measurements).forEach(([key, value]) => {
      items.push({ icon: "activity", label: humanizeSlotKey(key), value: formatMeasurementValue(key, value) });
    });
  }
  addList("bookmark-check", "Known", packet.knownFacts);
  return uniqueFactItems(items).slice(0, 10);
}

function uniquePromptItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(item.text);
  }).slice(0, 6);
}

function smartIntakePrompts(result = state.recentResult) {
  const profile = readProfile();
  const prompts = [];
  const nextAction = result?.governanceCard?.handoffPacket?.nextBestAction || result?.handoffPacket?.nextBestAction || "";

  if (!result) {
    return [
      { title: "Symptom intake", text: "My symptom started ..., severity is ... out of 10, and I also noticed ...", task: "Collect symptom timing, severity, and related symptoms." },
      { title: "Medication check", text: "The medicine name is ..., the strength is ..., and I took it at ...", task: "Collect medicine name, strength, dose timing, and risk factors." },
      { title: "Appointment request", text: "I need an appointment for ..., and my preferred day or time is ...", task: "Collect appointment reason and preferred time." }
    ];
  }

  (result.missingInformation || []).slice(0, 4).forEach((item) => {
    prompts.push({
      title: "Missing detail",
      text: followupPromptFor(item),
      task: `Collect: ${item}`
    });
  });

  if (result.intent === "pharmacy") {
    prompts.push({
      title: "Medication label",
      text: "The medicine name, strength, dose, and time taken are ...",
      task: "Confirm medication label details before handoff."
    });
    prompts.push({
      title: "Risk check",
      text: "My relevant conditions, allergies, pregnancy status, and other medicines are ...",
      task: "Confirm patient-specific medication risk context."
    });
  } else if (result.intent === "scheduling") {
    prompts.push({
      title: "Schedule details",
      text: "My preferred appointment day or time is ..., and the reason is ...",
      task: "Confirm appointment timing and reason."
    });
  } else if (result.intent === "alert") {
    prompts.push({
      title: "Emergency handoff",
      text: "I am calling emergency services now. My location and contact number are ...",
      task: "Share extracted facts with caregiver or emergency responder."
    });
  } else {
    prompts.push({
      title: "Symptom detail",
      text: "This started ..., severity is ... out of 10, and it is getting better/worse/same.",
      task: "Collect timing, severity, and symptom trend."
    });
  }

  if (!(profile.emergency_contacts || []).length) {
    prompts.push({
      title: "Contact",
      text: "My emergency contact name and phone number are ...",
      task: "Add emergency contact to patient context."
    });
  }
  if (nextAction) {
    prompts.push({
      title: "Next action",
      text: nextAction,
      task: nextAction
    });
  }
  return uniquePromptItems(prompts);
}

function renderSmartIntake(result = state.recentResult) {
  if (!elements.caseFactList || !elements.intakePromptList) return;
  elements.caseFactList.innerHTML = "";
  elements.intakePromptList.innerHTML = "";

  const facts = caseFactItems(result);
  if (!facts.length) {
    elements.caseFactList.appendChild(createText("span", "empty", "No active case facts yet"));
  } else {
    facts.forEach((fact) => {
      const chip = document.createElement("span");
      chip.className = "fact-chip";
      chip.appendChild(iconElement(fact.icon || "circle-dot"));
      const text = document.createElement("span");
      text.appendChild(createText("strong", "", fact.label));
      text.appendChild(document.createTextNode(String(fact.value)));
      chip.appendChild(text);
      elements.caseFactList.appendChild(chip);
    });
  }

  const prompts = smartIntakePrompts(result);
  prompts.forEach((prompt) => {
    const row = document.createElement("div");
    row.className = "intake-prompt";
    const text = document.createElement("div");
    text.appendChild(createText("strong", "", prompt.title));
    text.appendChild(createText("span", "", shortText(prompt.text, "Add detail", 112)));
    row.appendChild(text);

    const actions = document.createElement("div");
    actions.className = "intake-actions";
    const ask = document.createElement("button");
    ask.type = "button";
    ask.appendChild(iconElement("send-horizontal"));
    ask.appendChild(document.createTextNode("Ask"));
    ask.addEventListener("click", () => usePrompt(prompt.text));
    actions.appendChild(ask);

    const task = document.createElement("button");
    task.type = "button";
    task.appendChild(iconElement("list-plus"));
    task.appendChild(document.createTextNode("Task"));
    task.addEventListener("click", () => addTask(prompt.task || prompt.text));
    actions.appendChild(task);
    row.appendChild(actions);
    elements.intakePromptList.appendChild(row);
  });
  refreshIcons();
}

async function copyHandoff() {
  const text = handoffText();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopyText(text)) {
      throw new Error("Copy unavailable");
    }
    setWorkspaceStatus("Handoff copied.");
  } catch {
    setWorkspaceStatus("Handoff copy unavailable.");
  }
}

function safeJsonClone(value) {
  try {
    return value ? JSON.parse(JSON.stringify(value)) : null;
  } catch {
    return null;
  }
}

function localRecordPayload(result = state.recentResult) {
  const access = readAccess() || { mode: "local" };
  const patientId = elements.patientId.value.trim() || access.patient_id || "demo-patient";
  return {
    app: "Healthcare Agent",
    app_version: "20260630-feature37",
    exported_at: new Date().toISOString(),
    patient_id: patientId,
    access_mode: access.mode || "local",
    localhost_store: state.localHostStoreAvailable ? "available" : "browser_only",
    runtime_mode: runtimeModeLabel(),
    storage_mode: storageModeLabel(),
    device_capabilities: capabilityExportRows(),
    memory: readMemory(),
    profile: readProfile(),
    care_tasks: readTasks(),
    case_notes: readNotes(),
    case_facts: caseFactItems(result),
    smart_intake_prompts: smartIntakePrompts(result),
    followup_builder: followupBuilderData(result),
    caregiver_update_text: caregiverUpdateText(result),
    readiness: readinessSummary(result),
    handoff_text: handoffText(result),
    latest_routing_snapshot: safeJsonClone(result)
  };
}

function localRecordJson() {
  return JSON.stringify(localRecordPayload(), null, 2);
}

function setRecordStatus(message) {
  if (elements.recordStatus) elements.recordStatus.textContent = message;
}

function restoreRecordSummary(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Record JSON must be an object.");
  }
  const memory = sanitizeRestoredMemory(payload.memory);
  const profile = sanitizeRestoredProfile(payload.profile);
  const tasks = sanitizeRestoredTasks(payload.care_tasks || payload.tasks);
  const notes = sanitizeRestoredNotes(payload.case_notes || payload.notes);
  return {
    patientId: patientIdFromLogin(payload.patient_id, elements.patientId.value.trim() || "restored-patient"),
    version: payload.app_version || "unknown version",
    turns: memory.filter((item) => item.role === "patient").length,
    tasks: tasks.length,
    notes: notes.length,
    profileSignals: Object.values(profile).reduce((count, value) => count + (Array.isArray(value) ? value.length : 0), 0),
    hasRoute: Boolean(payload.latest_routing_snapshot || resultFromMemory(memory))
  };
}

function setRestorePreview(payload = null, error = "") {
  if (!elements.restorePreview) return;
  elements.restorePreview.innerHTML = "";
  elements.applyRestore.disabled = true;

  if (error) {
    elements.restorePreview.className = "restore-preview error";
    elements.restorePreview.appendChild(createIconText("span", "", "shield-alert", error));
    refreshIcons();
    return;
  }

  if (!payload) {
    elements.restorePreview.className = "restore-preview";
    elements.restorePreview.textContent = "No record loaded.";
    return;
  }

  try {
    const summary = restoreRecordSummary(payload);
    elements.restorePreview.className = "restore-preview ready";
    [
      ["Patient", summary.patientId],
      ["Turns", String(summary.turns)],
      ["Tasks", String(summary.tasks)],
      ["Notes", String(summary.notes)],
      ["Profile", `${summary.profileSignals} signals`],
      ["Route", summary.hasRoute ? "included" : "none"]
    ].forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "restore-preview-row";
      row.appendChild(createText("span", "", label));
      row.appendChild(createText("strong", "", value));
      elements.restorePreview.appendChild(row);
    });
    elements.restorePreview.appendChild(createText("span", "restore-version", summary.version));
    elements.applyRestore.disabled = false;
  } catch {
    setRestorePreview(null, "Record preview failed.");
  }
}

function previewRestoreText() {
  const value = elements.restoreText.value.trim();
  if (!value) {
    setRestorePreview(null);
    return;
  }
  try {
    setRestorePreview(JSON.parse(value));
  } catch {
    setRestorePreview(null, "Invalid JSON.");
  }
}

async function copyLocalRecord() {
  const text = localRecordJson();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopyText(text)) {
      throw new Error("Copy unavailable");
    }
    setRecordStatus("Local record JSON copied.");
    setWorkspaceStatus("Local patient record copied.");
  } catch {
    setRecordStatus("Copy unavailable in this browser. Use Download JSON instead.");
    setWorkspaceStatus("Record copy unavailable.");
  }
}

function exportLocalRecord() {
  const text = localRecordJson();
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `healthcare-agent-record-${safeFilePart(elements.patientId.value)}-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setRecordStatus("Local record JSON downloaded.");
  setWorkspaceStatus("Local patient record downloaded.");
}

function openRestorePanel() {
  if (!elements.restorePanel) return;
  elements.restorePanel.hidden = false;
  elements.restorePanel.setAttribute("aria-hidden", "false");
  elements.restoreText.value = "";
  setRestorePreview(null);
  elements.restoreText.focus();
  setRecordStatus("Paste a copied record JSON or choose a JSON file.");
}

function closeRestorePanel() {
  if (!elements.restorePanel) return;
  elements.restorePanel.hidden = true;
  elements.restorePanel.setAttribute("aria-hidden", "true");
  elements.restoreText.value = "";
  setRestorePreview(null);
  setRecordStatus("Restore closed. Local record tools are ready.");
  elements.restoreRecord?.focus();
}

function sanitizeRestoredMemory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && ["patient", "assistant"].includes(item.role) && typeof item.text === "string")
    .filter((item) => item.role === "patient" || (item.result && typeof item.result === "object"))
    .map((item) => ({
      role: item.role,
      text: item.text,
      created_at: item.created_at || new Date().toISOString(),
      ...(item.role === "assistant" && item.result && typeof item.result === "object" ? { result: item.result } : {})
    }))
    .slice(-40);
}

function sanitizeRestoredProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const profile = {};
  ["medications", "conditions", "allergies", "emergency_contacts", "symptoms", "preferences"].forEach((key) => {
    if (Array.isArray(value[key])) profile[key] = value[key].map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
  });
  return profile;
}

function sanitizeRestoredTasks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((task) => task && typeof task.text === "string" && task.text.trim())
    .map((task, index) => ({
      id: String(task.id || `task-${Date.now()}-${index}`),
      text: task.text.trim(),
      completed: Boolean(task.completed),
      created_at: task.created_at || new Date().toISOString(),
      completed_at: task.completed_at || ""
    }))
    .slice(0, 50);
}

function sanitizeRestoredNotes(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((note) => note && typeof note.text === "string" && note.text.trim())
    .map((note, index) => ({
      id: String(note.id || `note-${Date.now()}-${index}`),
      text: note.text.trim(),
      route: String(note.route || ""),
      created_at: note.created_at || new Date().toISOString()
    }))
    .slice(0, 50);
}

function resultFromMemory(memory) {
  const lastAssistant = [...memory].reverse().find((item) => item.role === "assistant" && item.result);
  return lastAssistant?.result || null;
}

function restoreLocalRecordFromPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Record JSON must be an object.");
  }

  const memory = sanitizeRestoredMemory(payload.memory);
  const profile = sanitizeRestoredProfile(payload.profile);
  const tasks = sanitizeRestoredTasks(payload.care_tasks || payload.tasks);
  const notes = sanitizeRestoredNotes(payload.case_notes || payload.notes);
  const existingAccess = readAccess() || { mode: "local" };
  const patientId = patientIdFromLogin(payload.patient_id, elements.patientId.value.trim() || "restored-patient");
  const mode = payload.access_mode || existingAccess.mode || "local";

  elements.patientId.value = patientId;
  writeAccess({ mode, patient_id: patientId, updated_at: new Date().toISOString() });
  writeMemory(memory);
  writeProfile(profile);
  writeTasks(tasks);
  writeNotes(notes);
  state.recentResult = payload.latest_routing_snapshot || resultFromMemory(memory);
  loadProfileForm(profile);
  renderMemory();
  renderTasks(tasks);
  renderNotes(notes);
  renderTimeline(memory);
  closeRestorePanel();
  setRecordStatus(`Restored ${memory.filter((item) => item.role === "patient").length} turn(s), ${tasks.length} task(s), ${notes.length} note(s), and patient context.`);
  setWorkspaceStatus("Local patient record restored.");
}

function restoreLocalRecordFromText(text) {
  const payload = JSON.parse(String(text || "").trim());
  restoreLocalRecordFromPayload(payload);
}

function applyRestoreFromPanel() {
  try {
    restoreLocalRecordFromText(elements.restoreText.value);
  } catch {
    setRecordStatus("That JSON could not be restored. Check the record text and try again.");
    setWorkspaceStatus("Restore failed.");
  }
}

async function importRecordFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    elements.restorePanel.hidden = false;
    elements.restoreText.value = text;
    previewRestoreText();
    setRecordStatus("Record file loaded. Review the preview before restoring.");
  } catch {
    setRecordStatus("That file could not be read. Use a Healthcare Agent JSON record.");
    setWorkspaceStatus("Record file unavailable.");
  } finally {
    event.target.value = "";
  }
}

function isEmergency(text) {
  return EMERGENCY_PATTERNS.some((pattern) => pattern.test(text));
}

function medicationNames() {
  if (state.drugNames.length) return state.drugNames;
  prepareDrugIndex(state.drugs);
  return state.drugNames;
}

function drugEntryForName(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (state.drugs[normalized]) {
    return { name: normalized, info: state.drugs[normalized] };
  }
  const indexed = state.drugNameIndex.find((entry) => entry.name === normalized);
  return indexed ? { name: indexed.canonicalName, info: indexed.info } : null;
}

function matchDrug(text, patientProfile = null, allowProfileFollowup = false) {
  const lower = text.toLowerCase();
  if (!state.drugNameIndex.length) prepareDrugIndex(state.drugs);
  const directHit = state.drugNameIndex.find((entry) => entry.pattern.test(lower));
  if (directHit) {
    return { name: directHit.canonicalName, info: directHit.info };
  }

  if (allowProfileFollowup && patientProfile) {
    const profileMeds = patientProfile.medications || [];
    const isFollowup = /\b(it|that|this|side effects?|dose|dosage|interaction|refill|take|taken)\b/i.test(lower);
    if (!isFollowup) return null;
    for (const name of profileMeds) {
      const remembered = drugEntryForName(name);
      if (remembered) return { ...remembered, fromProfile: true };
    }
  }
  return null;
}

const MEDICATION_RISK_RULES = {
  ibuprofen: {
    kidney: "Kidney disease or kidney problems make ibuprofen a higher-risk medicine to review with a clinician or pharmacist.",
    ulcer: "A history of ulcers or stomach bleeding can raise the bleeding risk with ibuprofen.",
    "blood thinner": "Blood thinner use can raise bleeding risk with ibuprofen.",
    warfarin: "Warfarin plus ibuprofen can raise bleeding risk and should be reviewed by a clinician or pharmacist.",
    apixaban: "Apixaban plus ibuprofen can raise bleeding risk and should be reviewed by a clinician or pharmacist.",
    rivaroxaban: "Rivaroxaban plus ibuprofen can raise bleeding risk and should be reviewed by a clinician or pharmacist.",
    pregnan: "Pregnancy is a reason to ask a clinician before using ibuprofen."
  },
  aspirin: {
    "blood thinner": "Blood thinner use can raise bleeding risk with aspirin.",
    warfarin: "Warfarin plus aspirin can raise bleeding risk and should be reviewed by a clinician or pharmacist.",
    ulcer: "A history of ulcers or stomach bleeding can raise the bleeding risk with aspirin."
  },
  acetaminophen: {
    liver: "Liver disease or heavy alcohol use makes acetaminophen dosing riskier and should be reviewed with a clinician or pharmacist."
  },
  metformin: {
    kidney: "Kidney disease is important for metformin safety and should be reviewed by the prescriber.",
    liver: "Liver disease or heavy alcohol use is important for metformin safety review."
  },
  diphenhydramine: {
    "older adult": "Diphenhydramine can cause confusion or strong sleepiness in some older adults.",
    elderly: "Diphenhydramine can cause confusion or strong sleepiness in some older adults.",
    asthma: "Breathing conditions can change whether sedating antihistamines are appropriate."
  },
  lisinopril: {
    pregnan: "Pregnancy or possible pregnancy is urgent to discuss with the prescriber for lisinopril.",
    kidney: "Kidney problems are important for lisinopril monitoring and should be reviewed with the prescriber."
  }
};

function medicationRiskNotes(name, classification) {
  const rules = MEDICATION_RISK_RULES[name] || {};
  const profile = classification.patientProfile || {};
  const slots = classification.clinicalSlots || {};
  const negatedRiskFactors = slots.negated_risk_factors || [];
  const terms = uniqueLower([
    ...((profile.conditions || [])),
    ...((slots.risk_factors || []))
  ]).filter((term) => !termMatchesAny(term, negatedRiskFactors));
  const notes = [];
  terms.forEach((term) => {
    Object.entries(rules).forEach(([needle, note]) => {
      if (term.includes(needle) && !notes.includes(note)) notes.push(note);
    });
  });
  return notes;
}

function contextualQuery(text, memory = [], patientProfile = {}) {
  const tokens = tokenize(text);
  const hasDirectSignal = (value) => hasPattern(SYMPTOM_PATTERNS, value)
    || hasPattern(MEDICATION_PATTERNS, value)
    || hasPattern(SCHEDULING_PATTERNS, value)
    || collectKnownTerms(value, [...KNOWN_SYMPTOMS, ...KNOWN_CONDITIONS, ...medicationNames()], true).length > 0;
  const directSignal = hasDirectSignal(text);
  const vagueFollowup = /\b(it|that|this|again|still|same)\b/i.test(text);
  const isFollowup = vagueFollowup || (tokens.length <= 4 && !directSignal);
  if (!isFollowup) return text;

  const recentPatientMessages = memory
    .slice(-10)
    .filter((item) => item.role === "patient")
    .map((item) => item.text || "")
    .filter(Boolean);
  const recentConcreteMessages = recentPatientMessages.filter((message) => hasDirectSignal(message)).slice(-2);
  const recentPatientText = (recentConcreteMessages.length ? recentConcreteMessages : recentPatientMessages.slice(-1)).join(" ");
  const profileTerms = [
    ...((patientProfile.symptoms || []).slice(-5)),
    ...((patientProfile.conditions || []).slice(-5)),
    ...((patientProfile.medications || []).slice(-5))
  ].join(" ");
  return `${text} ${recentPatientText} ${recentConcreteMessages.length ? "" : profileTerms}`.trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function classify(text, memory = readMemory(), storedProfile = readProfile()) {
  const recentContext = memory.slice(-4).map((item) => item.text || "").join(" ");
  const currentNegatedConditions = negatedKnownTerms(text, KNOWN_CONDITIONS);
  const patientProfile = mergeProfile(storedProfile, extractProfile(memory, text));
  if (currentNegatedConditions.length && patientProfile.conditions) {
    patientProfile.conditions = patientProfile.conditions.filter((condition) => !termMatchesAny(condition, currentNegatedConditions));
    if (!patientProfile.conditions.length) delete patientProfile.conditions;
  }
  const alertHits = patternHits(EMERGENCY_PATTERNS, text, true);
  const clinicalSlots = extractClinicalSlots(text, alertHits, patientProfile);
  const measureFlags = clinicalSlots.measurement_flags || {};
  const emergencyMeasurementHits = measureFlags.emergency || [];
  const urgentMeasurementHits = measureFlags.urgent || [];
  const medicationHits = uniqueLower([...patternHits(MEDICATION_PATTERNS, text), ...(clinicalSlots.medications || [])]);
  const schedulingHits = patternHits(SCHEDULING_PATTERNS, text);
  const symptomHits = uniqueLower([...patternHits(SYMPTOM_PATTERNS, text), ...(clinicalSlots.symptoms || [])]);
  const drugMatch = matchDrug(text, patientProfile, true);
  if (drugMatch) medicationHits.push(drugMatch.name);

  const alertEvidence = [];
  if (alertHits.length) alertEvidence.push(`Emergency signal: ${alertHits.join(", ")}`);
  if (emergencyMeasurementHits.length) alertEvidence.push(`Emergency measurement: ${emergencyMeasurementHits.join(", ")}`);
  if (urgentMeasurementHits.length) alertEvidence.push(`Urgent measurement: ${urgentMeasurementHits.join(", ")}`);
  const alertScore = scoreFromHits(0, [...alertHits, ...emergencyMeasurementHits], 0.75);

  const pharmacyEvidence = medicationHits.length ? [`Medication signal: ${uniqueLower(medicationHits).join(", ")}`] : [];
  let pharmacyScore = scoreFromHits(0, uniqueLower(medicationHits), 0.45);
  if (hasPattern(MEDICATION_PATTERNS, recentContext) && /\b(it|that|this)\b/i.test(text)) {
    pharmacyScore += 0.3;
    pharmacyEvidence.push("Recent conversation was medication-related");
  }
  if ((patientProfile.medications || []).length && /\b(side effects?|dose|refill|interaction|it|that)\b/i.test(text)) {
    pharmacyScore += 0.15;
    pharmacyEvidence.push("Patient profile contains medication history");
  }

  const schedulingEvidence = schedulingHits.length ? [`Scheduling signal: ${schedulingHits.join(", ")}`] : [];
  let schedulingScore = scoreFromHits(0, schedulingHits, 0.55);
  if (hasPattern(SCHEDULING_PATTERNS, recentContext) && /\b(it|that|this|next|again)\b/i.test(text)) {
    schedulingScore += 0.25;
    schedulingEvidence.push("Recent conversation was appointment-related");
  }

  const topicQuery = contextualQuery(text, memory, patientProfile);
  const topicMatches = rankTopics(topicQuery);
  const topTopic = topicMatches[0];
  const ragEvidence = symptomHits.length ? [`Symptom or health signal: ${symptomHits.join(", ")}`] : [];
  let ragScore = text.trim() ? 0.28 : 0;
  ragScore = scoreFromHits(ragScore, symptomHits, 0.28);
  if (topTopic && topTopic.score > 0) {
    ragScore += Math.min(0.28, topTopic.score * 0.06);
    ragEvidence.push(`Knowledge topic matched: ${topTopic.doc.title}`);
  }
  if ((patientProfile.symptoms || []).length) {
    ragScore += 0.08;
    ragEvidence.push("Patient profile contains prior symptoms");
  }

  const routeScores = [
    { intent: "alert", score: Math.min(1, alertScore), evidence: alertEvidence },
    { intent: "pharmacy", score: Math.min(1, pharmacyScore), evidence: pharmacyEvidence },
    { intent: "scheduling", score: Math.min(1, schedulingScore), evidence: schedulingEvidence },
    { intent: "rag", score: Math.min(1, ragScore), evidence: ragEvidence }
  ].sort((a, b) => b.score - a.score);

  let intent = routeScores[0] ? routeScores[0].intent : "rag";
  if (alertScore >= 0.75) intent = "alert";
  else if (routeScores[0] && routeScores[0].score < 0.34) intent = "rag";

  const urgencyLevel = urgencyFor(text, alertHits, clinicalSlots);
  const missing = missingInformation(intent, urgencyLevel, clinicalSlots, patientProfile, text);
  const selectedRoute = routeScores.find((route) => route.intent === intent) || routeScores[0];
  const confidence = selectedRoute ? selectedRoute.score : 0.4;
  const secondaryRoutes = secondaryIntents(intent, urgencyLevel, routeScores);
  const gateResult = qualityGates(intent, urgencyLevel, routeScores, confidence, missing);
  const actions = agentActions(intent, urgencyLevel, missing, gateResult.gates, clinicalSlots, memory.length, secondaryRoutes);
  const evidence = selectedRoute && selectedRoute.evidence.length
    ? selectedRoute.evidence.join(" ")
    : "No high-risk or tool-specific signal was stronger than general health retrieval.";
  const blockedGates = gateResult.gates.filter((gate) => gate.status === "blocked").map((gate) => gate.name);
  const gateReason = blockedGates.length
    ? ` Quality gates blocked: ${blockedGates.join(", ")}.`
    : ` Quality gates: ${gateResult.gates.map((gate) => `${gate.name}=${gate.status}`).join(", ")}.`;
  const secondaryReason = secondaryRoutes.length
    ? ` Secondary routes ${urgencyLevel === "emergency" ? "deferred for emergency handling" : "queued for bounded preview"}: ${secondaryRoutes.join(", ")}.`
    : "";
  const measurementReason = [...emergencyMeasurementHits, ...urgentMeasurementHits].length
    ? ` Measurement-aware triage signals: ${[...emergencyMeasurementHits, ...urgentMeasurementHits].join(", ")}.`
    : "";
  const negationReason = (clinicalSlots.negated_red_flags || []).length
    ? ` Negated emergency phrases noted: ${clinicalSlots.negated_red_flags.slice(0, 4).join(", ")}.`
    : "";
  const reason = `Selected ${intent} with ${Math.round(confidence * 100)}% confidence. Urgency: ${urgencyLevel}. ${evidence}${measurementReason}${negationReason}${secondaryReason}${gateReason}`;
  const profileSignalCount = Object.values(patientProfile || {}).reduce((count, values) => {
    return count + (Array.isArray(values) ? values.length : 0);
  }, 0);
  const modelEfficiency = {
    routingMode: "deterministic triage scoring",
    routeCount: routeScores.length,
    secondaryIntents: secondaryRoutes,
    secondarySpecialistStrategy: urgencyLevel === "emergency" ? "defer_for_emergency" : "preview_non_emergency",
    memoryMessagesAvailable: memory.length,
    recentMessagesUsed: Math.min(memory.length, 4),
    profileSignalCount,
    plannedSpecialistCalls: 1 + (urgencyLevel === "emergency" ? 0 : secondaryRoutes.length),
    deferredSpecialistCalls: urgencyLevel === "emergency" ? secondaryRoutes.length : 0,
    clarificationFirst: gateResult.needsClarification,
    clinicalSlotCount: Object.keys(clinicalSlots || {}).length,
    measurementSignalCount: emergencyMeasurementHits.length + urgentMeasurementHits.length,
    negatedRedFlagCount: (clinicalSlots.negated_red_flags || []).length
  };

  return {
    intent,
    reason,
    confidence,
    routeScores,
    urgencyLevel,
    secondaryIntents: secondaryRoutes,
    clinicalSlots,
    missingInformation: missing,
    agentActions: actions,
    qualityGates: gateResult.gates,
    needsClarification: gateResult.needsClarification,
    suggestedFollowups: suggestedFollowups(intent, urgencyLevel),
    patientProfile,
    profileSignals: patientProfile,
    reasoningTrace: [reason],
    modelEfficiency,
    topicMatches,
    topicQuery,
    drugMatch
  };
}

function rankTopics(text, limit = 6) {
  const queryTokens = expandedTokens(text);
  const query = queryTokens.join(" ");
  const index = state.topicIndex.length ? state.topicIndex : state.topics.map((doc, docIndex) => ({
    doc,
    index: docIndex,
    tokens: new Set(expandedTokens(topicSearchText(doc))),
    titleTokens: new Set(expandedTokens(doc.title || "")),
    tagTokens: new Set(expandedTokens((doc.tags || []).join(" "))),
    normalizedTags: (doc.tags || []).map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
  }));

  return index
    .map((entry) => {
      let overlap = 0;
      let titleBoost = 0;
      queryTokens.forEach((token) => {
        if (entry.tokens.has(token)) overlap += 1;
        if (entry.titleTokens.has(token)) titleBoost += 0.35;
      });
      const tagBoost = queryTokens.filter((token) => entry.tagTokens.has(token)).length * 0.3;
      const exactTagBoost = entry.normalizedTags.some((tag) => query.includes(tag)) ? 1.2 : 0;
      const exactTitleBoost = String(entry.doc.title || "").toLowerCase() && String(text || "").toLowerCase().includes(String(entry.doc.title || "").toLowerCase()) ? 1.2 : 0;
      return { doc: entry.doc, score: overlap + titleBoost + tagBoost + exactTagBoost + exactTitleBoost, index: entry.index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit);
}

function sourceFromDoc(doc) {
  return doc && doc.source ? doc.source : null;
}

function buildAlertResult(text, classification) {
  return {
    intent: "alert",
    title: "Urgent Safety Response",
    summary: "This may be an emergency. Call local emergency services now, or ask someone nearby to call for you. If you are in the U.S., call 911. I have started the caregiver alert workflow.",
    details: {
      now: ["Call emergency services now.", "Do not drive yourself.", "If possible, stay with another person while help is arranged."],
      monitor: ["Breathing", "Consciousness", "Chest pain", "Weakness on one side", "Severe bleeding"],
      urgent: ["Emergency warning signs were found in the message."]
    },
    sources: [
      { name: "CDC - Stroke Signs and Symptoms", url: "https://www.cdc.gov/stroke/signs-symptoms/index.html" },
      { name: "CDC - Heart Attack Symptoms", url: "https://www.cdc.gov/heart-disease/about/heart-attack.html" }
    ],
    flags: ["emergency_escalation"],
    confidence: classification.confidence,
    reason: classification.reason,
    rawText: text
  };
}

function buildPharmacyResult(text, classification) {
  const match = classification.drugMatch || matchDrug(text, classification.patientProfile, true);
  if (!match) {
    return {
      intent: "pharmacy",
      title: "Medication Lookup",
      summary: "I can help with general medication information, but I need the medicine name from the label.",
      details: {
        now: ["Check the exact medication name and strength on the package or prescription label.", "Ask a pharmacist if you are unsure which ingredient is active."],
        monitor: ["New symptoms", "Allergy history", "Other medicines or supplements"],
        urgent: ["Trouble breathing", "Swelling of the face, lips, tongue, or throat", "Possible overdose"]
      },
      sources: [],
      flags: ["medical_disclaimer_added", "medication_safety_note_added"],
      confidence: classification.confidence,
      reason: classification.reason
    };
  }

  const { name, info } = match;
  const profileNote = match.fromProfile ? " I used the medication remembered from this conversation." : "";
  const riskNotes = medicationRiskNotes(name, classification);
  const riskSummary = riskNotes.length ? `\n\nExtra caution based on what you shared: ${riskNotes.slice(0, 3).join(" ")}` : "";
  return {
    intent: "pharmacy",
    title: `Medication: ${capitalize(name)}`,
    summary: `${info.common_use} ${info.general_guidance}${profileNote}${riskSummary}\n\n${DISCLAIMER}\n\nUse medication only as directed on the label or by your prescriber. If you notice severe symptoms, an allergic reaction, or took more than directed, seek urgent help.`,
    details: {
      now: ["Confirm the active ingredient on the label.", "Follow your prescriber or package directions.", "Keep a current medication list for your care team."],
      monitor: [...(riskNotes || []), ...(info.side_effects || [])],
      urgent: info.warnings || []
    },
    sources: info.source ? [info.source] : [],
    flags: ["medical_disclaimer_added", "medication_safety_note_added"],
    confidence: classification.confidence,
    reason: classification.reason
  };
}

function buildSchedulingResult(text, classification) {
  const lower = text.toLowerCase();
  const existing = APPOINTMENTS.find((appointment) => appointment.patient_id === "demo-patient");
  if (isAppointmentLookupText(lower) && existing) {
    return {
      intent: "scheduling",
      title: "Upcoming Appointment",
      summary: `Your next appointment is with ${existing.clinician} on ${formatDateTime(existing.when)}.`,
      details: {
        now: ["Bring your medication list.", "Write down symptoms or questions before the visit."],
        monitor: ["Appointment date", "Transportation", "Medication refills"],
        urgent: []
      },
      sources: [],
      flags: [],
      confidence: classification.confidence,
      reason: classification.reason,
      appointment: existing
    };
  }

  if (classification.missingInformation && classification.missingInformation.length) {
    return {
      intent: "scheduling",
      title: "Scheduling Details Needed",
      summary: `Before I create that appointment request, I still need: ${classification.missingInformation.slice(0, 3).join("; ")}.`,
      details: {
        now: ["Share the missing scheduling details so I can draft the request."],
        monitor: ["Preferred time", "Reason for visit", "Transportation"],
        urgent: ["If symptoms become urgent, do not wait for the appointment."]
      },
      sources: [],
      flags: [],
      confidence: classification.confidence,
      reason: classification.reason
    };
  }

  const requested = inferAppointmentTime(lower);
  const appointment = {
    clinician: "Care team",
    when: requested,
    status: "requested"
  };
  return {
    intent: "scheduling",
    title: "Appointment Request",
    summary: `I created an appointment request with ${appointment.clinician} for ${formatDateTime(appointment.when)}. Your care team should confirm it.`,
    details: {
      now: ["Watch for confirmation from the care team.", "If symptoms become urgent, do not wait for the appointment."],
      monitor: ["Preferred time", "Reason for visit", "Transportation"],
      urgent: []
    },
    sources: [],
    flags: [],
    confidence: classification.confidence,
    reason: classification.reason,
    appointment
  };
}

function inferAppointmentTime(lower) {
  const now = new Date();
  const isoMatch = lower.match(/\b(20\d{2}-\d{2}-\d{2})(?:[ t](\d{1,2}:\d{2}))?\b/);
  if (isoMatch) return `${isoMatch[1]}T${isoMatch[2] || "09:00"}`;
  if (lower.includes("tomorrow")) now.setDate(now.getDate() + 1);
  else if (lower.includes("next week")) now.setDate(now.getDate() + 7);
  else now.setDate(now.getDate() + 3);
  now.setHours(9, 0, 0, 0);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T09:00`;
}

function buildRagResult(text, classification) {
  const ranked = classification.topicMatches || rankTopics(text);
  const best = ranked[0];
  const doc = best && best.score > 0 ? best.doc : null;
  const fallback = {
    title: "General Health Information",
    answer: "I do not have a close match in the local health library. A clinician is the right person for personal advice, especially if symptoms are new, severe, or worsening.",
    self_care: ["Share more detail about symptoms, timing, age, medications, and medical conditions.", "Contact your care team for personal advice."],
    monitor: ["New symptoms", "Worsening symptoms", "Duration"],
    red_flags: ["Severe symptoms", "Trouble breathing", "Confusion", "Fainting"],
    source: null
  };
  const selected = doc || fallback;
  const needsClarification = Boolean(classification.needsClarification) || !doc;
  const baseSummary = `${selected.answer}\n\n${DISCLAIMER}`;
  const summary = needsClarification && classification.missingInformation.length
    ? `I can help, but I need a little more detail to route this safely. Please share: ${classification.missingInformation.slice(0, 3).join("; ")}.\n\nClosest local match: ${selected.answer}\n\n${DISCLAIMER}`
    : baseSummary;

  return {
    intent: "rag",
    title: selected.title,
    summary,
    details: {
      now: selected.self_care || [],
      monitor: selected.monitor || [],
      urgent: selected.red_flags || []
    },
    sources: uniqueSources([
      sourceFromDoc(selected),
      ...ranked.slice(1, 3).filter((item) => item.score > 0).map((item) => sourceFromDoc(item.doc))
    ]),
    flags: ["medical_disclaimer_added"],
    confidence: classification.confidence,
    reason: classification.reason,
    needsClarification,
    retrievalScore: best ? best.score : 0,
    related: ranked.slice(1, 4).filter((item) => item.score > 0).map((item) => item.doc.title)
  };
}

function secondarySummary(intent, preview) {
  const missing = preview.missingInformation || [];
  if (missing.length) return `Needs: ${missing.slice(0, 3).join("; ")}.`;
  if (intent === "scheduling" && preview.appointment?.when) {
    const status = preview.appointment.status === "draft_preview" ? "drafted" : "found";
    return `Appointment ${status} for ${formatDateTime(preview.appointment.when)}.`;
  }
  if (intent === "pharmacy" && preview.medications?.length) {
    return `Medication information found for ${preview.medications.slice(0, 3).map((item) => item.name).join(", ")}.`;
  }
  if (intent === "rag" && preview.matchedTopic) return `Closest health topic: ${preview.matchedTopic}.`;
  return preview.summary || "Secondary preview completed.";
}

function buildSecondaryPreview(intent, text, classification) {
  if (intent === "scheduling") {
    const missing = missingInformation("scheduling", classification.urgencyLevel, classification.clinicalSlots || {}, classification.patientProfile || {}, text);
    const lower = text.toLowerCase();
    const existing = APPOINTMENTS.find((appointment) => appointment.patient_id === "demo-patient");
    if (isAppointmentLookupText(lower) && existing) {
      const preview = {
        intent,
        agent: specialistNameForIntent(intent),
        status: "previewed",
        appointment: existing
      };
      return { ...preview, summary: secondarySummary(intent, preview) };
    }
    if (missing.length) {
      const preview = {
        intent,
        agent: specialistNameForIntent(intent),
        status: "needs_clarification",
        missingInformation: missing
      };
      return { ...preview, summary: secondarySummary(intent, preview) };
    }
    const preview = {
      intent,
      agent: specialistNameForIntent(intent),
      status: "previewed",
      appointment: {
        clinician: "Care team",
        when: inferAppointmentTime(lower),
        status: "draft_preview"
      }
    };
    return { ...preview, summary: secondarySummary(intent, preview) };
  }

  if (intent === "pharmacy") {
    const match = matchDrug(text, classification.patientProfile, true);
    if (!match) {
      const preview = {
        intent,
        agent: specialistNameForIntent(intent),
        status: "needs_clarification",
        missingInformation: ["Medication name from the label"]
      };
      return { ...preview, summary: secondarySummary(intent, preview) };
    }
    const preview = {
      intent,
      agent: specialistNameForIntent(intent),
      status: "previewed",
      medications: [{ name: match.name, identifiedFrom: match.fromProfile ? "memory" : "message" }]
    };
    return { ...preview, summary: secondarySummary(intent, preview) };
  }

  if (intent === "rag") {
    const ranked = rankTopics(text);
    const best = ranked.find((item) => item.score > 0);
    const preview = {
      intent,
      agent: specialistNameForIntent(intent),
      status: best ? "previewed" : "needs_clarification",
      matchedTopic: best?.doc?.title || "",
      summary: best?.doc?.answer || "I do not have a close local health topic match yet."
    };
    return { ...preview, summary: secondarySummary(intent, preview) };
  }

  return {
    intent,
    agent: specialistNameForIntent(intent),
    status: "previewed",
    summary: "Secondary preview completed."
  };
}

function buildSecondaryOutputs(text, classification) {
  if (classification.intent === "alert" || classification.urgencyLevel === "emergency") return [];
  return (classification.secondaryIntents || [])
    .filter((intent) => intent !== classification.intent && intent !== "alert")
    .slice(0, 2)
    .map((intent) => buildSecondaryPreview(intent, text, classification));
}

function appendSecondaryOutputNote(summary, secondaryOutputs = []) {
  if (!secondaryOutputs.length) return summary;
  const labels = {
    rag: "health information",
    pharmacy: "medication question",
    scheduling: "appointment need",
    alert: "urgent safety concern"
  };
  const note = secondaryOutputs.slice(0, 2)
    .map((output) => `${labels[output.intent] || output.intent}: ${output.summary}`)
    .join(" ");
  return `${summary}\n\nI also previewed the other care need: ${note}`;
}

function uniqueSources(sources) {
  const seen = new Set();
  return sources.filter((source) => {
    if (!source || !source.name) return false;
    const key = `${source.name}:${source.url || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function enrichResult(result, classification) {
  const flags = [...(result.flags || [])];
  let summary = result.summary;
  if (classification.urgencyLevel === "urgent" && result.intent !== "alert") {
    flags.push("urgent_symptom_watch_added");
    summary = `${summary}\n\nBecause you mentioned a potentially concerning symptom, contact your care team promptly. Seek urgent care now if symptoms are severe, worsening, or feel unsafe.`;
  } else if (classification.urgencyLevel === "watch" && result.intent === "rag") {
    flags.push("watchful_waiting_note_added");
    summary = `${summary}\n\nSince this sounds ongoing or recurring, keep track of timing, severity, and any new symptoms to share with your care team.`;
  }

  return {
    ...result,
    summary,
    flags: unique(flags),
    confidence: classification.confidence,
    reason: classification.reason,
    urgencyLevel: classification.urgencyLevel,
    routeScores: classification.routeScores,
    secondaryIntents: classification.secondaryIntents || [],
    secondaryOutputs: [],
    clinicalSlots: classification.clinicalSlots,
    missingInformation: classification.missingInformation,
    agentActions: classification.agentActions,
    qualityGates: classification.qualityGates,
    needsClarification: classification.needsClarification || result.needsClarification || false,
    suggestedFollowups: classification.suggestedFollowups,
    patientProfile: classification.patientProfile,
    profileSignals: classification.profileSignals,
    reasoningTrace: classification.reasoningTrace,
    modelEfficiency: classification.modelEfficiency
  };
}

function answer(text) {
  const startedAt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  const memory = readMemory();
  const classification = classify(text, memory, readProfile());
  let result;
  if (classification.intent === "alert") result = buildAlertResult(text, classification);
  else if (classification.intent === "pharmacy") result = buildPharmacyResult(text, classification);
  else if (classification.intent === "scheduling") result = buildSchedulingResult(text, classification);
  else result = buildRagResult(text, classification);
  const enriched = enrichResult(result, classification);
  const secondaryOutputs = buildSecondaryOutputs(text, classification);
  enriched.secondaryOutputs = secondaryOutputs;
  if (secondaryOutputs.length) {
    enriched.summary = appendSecondaryOutputNote(enriched.summary, secondaryOutputs);
    enriched.agentActions = completeAction(enriched.agentActions, "preview_secondary_specialists");
  }
  enriched.governanceCard = buildGovernanceCard(enriched, classification);
  const processingMs = Math.max(1, Math.round((typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()) - startedAt));
  state.lastProcessingMs = processingMs;
  enriched.modelEfficiency = {
    ...(enriched.modelEfficiency || {}),
    processingMs,
    runtimeMode: runtimeModeLabel(),
    storageMode: storageModeLabel(),
    knowledgeTopics: state.topicIndex.length,
    medicationEntries: Object.keys(state.drugs || {}).length,
    capabilityScore: runtimeCapabilityScore()
  };
  enriched.governanceCard.modelEfficiency = enriched.modelEfficiency;
  enriched.handoffPacket = enriched.governanceCard.handoffPacket;
  enriched.workflowTrace = buildWorkflowTrace(memory.length, classification, enriched);
  return enriched;
}

function capitalize(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function createText(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function createIconText(tag, className, iconName, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.appendChild(iconElement(iconName));
  node.appendChild(document.createTextNode(text));
  return node;
}

function urgencyTone(value) {
  if (["emergency", "urgent"].includes(value)) return "alert";
  if (value === "watch") return "watch";
  return "good";
}

function shortText(value, fallback, maxLength = 110) {
  const text = String(value || fallback || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function followupPromptFor(item) {
  const text = String(item || "").toLowerCase();
  if (text.includes("dose") || text.includes("strength")) {
    return "The medicine name is ..., the strength is ..., and I took it at ...";
  }
  if (text.includes("condition") || text.includes("pregnancy") || text.includes("kidney") || text.includes("blood thinner")) {
    return "My relevant conditions, allergies, or medicines are ...";
  }
  if (text.includes("appointment") && (text.includes("day") || text.includes("time"))) {
    return "My preferred appointment day or time is ...";
  }
  if (text.includes("reason") && text.includes("appointment")) {
    return "The reason for the appointment is ...";
  }
  if (text.includes("started") || text.includes("duration") || text.includes("how long")) {
    return "This started ... and has lasted ...";
  }
  if (text.includes("severity")) {
    return "My current severity is ... out of 10.";
  }
  if (text.includes("medication name")) {
    return "The medication name on the label is ...";
  }
  return `More detail: ${item}: `;
}

function followupBuilderData(result = state.recentResult) {
  const missing = (result?.missingInformation || []).filter(Boolean);
  const packet = result?.governanceCard?.handoffPacket || result?.handoffPacket || {};
  const nextAction = packet.nextBestAction || "Continue routine monitoring";

  if (!result) {
    return {
      state: "empty",
      tone: "idle",
      title: "Waiting for a routed case",
      route: "Ready",
      detail: "Ask the first patient question to generate a follow-up script.",
      prompt: "I have a symptom or medication question. The details are ...",
      task: "Start patient intake and collect the first care question.",
      missing: []
    };
  }

  const route = `${capitalize(result.intent || "rag")} / ${capitalize(result.urgencyLevel || "routine")}`;
  if (missing.length) {
    const prompt = missing.slice(0, 4).map(followupPromptFor).join(" ");
    return {
      state: "missing",
      tone: result.urgencyLevel === "emergency" ? "alert" : "watch",
      title: "Fill the highest-value gaps",
      route,
      detail: `${missing.length} detail${missing.length === 1 ? "" : "s"} still needed for a cleaner route.`,
      prompt,
      task: `Collect missing details: ${missing.slice(0, 3).join("; ")}`,
      missing
    };
  }

  return {
    state: "ready",
    tone: result.urgencyLevel === "emergency" ? "alert" : "good",
    title: "Case details look clear",
    route,
    detail: "No missing details are currently flagged.",
    prompt: result.intent === "alert"
      ? "I am seeking urgent help now. My location, contact number, and current symptoms are ..."
      : `I can confirm the next action is: ${nextAction}`,
    task: nextAction,
    missing: []
  };
}

function followupExportBlock(data = followupBuilderData()) {
  if (!data) return "Follow-up builder: None";
  return [
    "Follow-up builder:",
    `- State: ${data.state}`,
    `- Route: ${data.route}`,
    `- Detail: ${data.detail}`,
    `- Suggested prompt: ${data.prompt}`,
    listBlock("Missing details", data.missing)
  ].join("\n");
}

async function copyFollowupPrompt(text = followupBuilderData().prompt) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopyText(text)) {
      throw new Error("Copy unavailable");
    }
    setWorkspaceStatus("Follow-up prompt copied.");
  } catch {
    setWorkspaceStatus("Follow-up copy unavailable.");
  }
}

function renderFollowupBuilder(result = state.recentResult) {
  if (!elements.followupBuilder) return;
  elements.followupBuilder.innerHTML = "";
  const data = followupBuilderData(result);

  const card = document.createElement("div");
  card.className = `followup-card ${data.tone}`;

  const status = document.createElement("div");
  status.className = "followup-status";
  status.appendChild(iconElement(data.tone === "good" ? "check-check" : data.tone === "alert" ? "siren" : "circle-help"));
  const statusText = document.createElement("div");
  statusText.appendChild(createText("strong", "", data.title));
  statusText.appendChild(createText("span", "", `${data.route} - ${data.detail}`));
  status.appendChild(statusText);
  card.appendChild(status);

  if (data.missing.length) {
    const missingList = document.createElement("div");
    missingList.className = "followup-missing";
    data.missing.slice(0, 4).forEach((item) => {
      missingList.appendChild(createIconText("span", "followup-chip", "circle-help", shortText(item, "Missing detail", 56)));
    });
    card.appendChild(missingList);
  }

  const promptBox = document.createElement("div");
  promptBox.className = "followup-prompt";
  promptBox.appendChild(createText("span", "", "Suggested patient reply"));
  promptBox.appendChild(createText("strong", "", data.prompt));
  card.appendChild(promptBox);

  const actions = document.createElement("div");
  actions.className = "followup-actions";
  const use = document.createElement("button");
  use.type = "button";
  use.appendChild(iconElement("send-horizontal"));
  use.appendChild(document.createTextNode("Use"));
  use.addEventListener("click", () => usePrompt(data.prompt));
  actions.appendChild(use);

  const copy = document.createElement("button");
  copy.type = "button";
  copy.appendChild(iconElement("copy"));
  copy.appendChild(document.createTextNode("Copy"));
  copy.addEventListener("click", () => copyFollowupPrompt(data.prompt));
  actions.appendChild(copy);

  const task = document.createElement("button");
  task.type = "button";
  task.appendChild(iconElement("list-plus"));
  task.appendChild(document.createTextNode("Task"));
  task.addEventListener("click", () => addTask(data.task));
  actions.appendChild(task);

  card.appendChild(actions);
  elements.followupBuilder.appendChild(card);
  refreshIcons();
}

function renderCareFocus(result = null) {
  if (!elements.focusRoute) return;
  const missing = result?.missingInformation || [];
  const nextAction = result?.governanceCard?.handoffPacket?.nextBestAction
    || result?.handoffPacket?.nextBestAction
    || "Start with a symptom, medication question, or appointment request.";
  const urgency = result?.urgencyLevel || "routine";
  const focusCards = document.querySelectorAll(".focus-card");

  elements.focusRoute.textContent = result ? `${capitalize(result.intent || "rag")} agent` : "Ready";
  elements.focusUrgency.textContent = capitalize(urgency);
  elements.focusNextAction.textContent = shortText(nextAction, "Start with a symptom, medication question, or appointment request.", 145);
  elements.focusMissing.textContent = missing.length ? shortText(missing[0], "More detail needed", 88) : "No missing details";
  if (elements.addFocusTask) {
    elements.addFocusTask.hidden = !result;
    elements.addFocusTask.dataset.taskText = result ? nextAction : "";
  }

  focusCards.forEach((card) => card.removeAttribute("data-tone"));
  if (focusCards[1]) focusCards[1].dataset.tone = urgencyTone(urgency);
  if (focusCards[3]) focusCards[3].dataset.tone = missing.length ? "watch" : "good";

  elements.focusClarifiers.innerHTML = "";
  elements.focusClarifiers.classList.toggle("has-items", Boolean(missing.length));
  missing.slice(0, 4).forEach((item) => {
    const button = document.createElement("button");
    button.className = "clarifier-chip";
    button.type = "button";
    button.appendChild(iconElement("circle-help"));
    button.appendChild(document.createTextNode(shortText(item, "Add detail", 54)));
    button.addEventListener("click", () => usePrompt(followupPromptFor(item)));
    elements.focusClarifiers.appendChild(button);
  });
  refreshIcons();
}

function syncComposerState() {
  const hasText = Boolean(elements.prompt.value.trim());
  if (elements.sendButton) elements.sendButton.disabled = !hasText || !state.dataLoaded;
  elements.prompt.style.height = "auto";
  elements.prompt.style.height = `${Math.min(elements.prompt.scrollHeight, 150)}px`;
}

function renderList(title, items, warning) {
  const box = document.createElement("section");
  box.className = warning ? "detail-box warning" : "detail-box";
  box.appendChild(createIconText("h3", "", DETAIL_ICONS[title] || "list-checks", title));
  const list = document.createElement("ul");
  const values = items && items.length ? items : ["No specific items for this route."];
  values.slice(0, 5).forEach((item) => {
    list.appendChild(createText("li", "", item));
  });
  box.appendChild(list);
  return box;
}

function renderMessage(role, text, result) {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  if (role === "patient") {
    article.appendChild(createText("div", "message-body", text));
    elements.messages.appendChild(article);
    elements.messages.scrollTop = elements.messages.scrollHeight;
    return;
  }

  const titleRow = document.createElement("div");
  titleRow.className = "message-title";
  titleRow.appendChild(createIconText("strong", "", INTENT_ICONS[result.intent] || "message-circle", result.title));
  const chip = createIconText("span", `chip ${result.intent}`, INTENT_ICONS[result.intent] || "circle-dot", result.intent.toUpperCase());
  titleRow.appendChild(chip);
  article.appendChild(titleRow);

  const body = document.createElement("div");
  body.className = "message-body";
  result.summary.split("\n\n").forEach((paragraph) => {
    body.appendChild(createText("p", "", paragraph));
  });
  article.appendChild(body);

  const grid = document.createElement("div");
  grid.className = "detail-grid";
  grid.appendChild(renderList("Next Steps", result.details.now, false));
  grid.appendChild(renderList("Monitor", result.details.monitor, false));
  grid.appendChild(renderList("Urgent Signs", result.details.urgent, true));
  if (result.missingInformation && result.missingInformation.length) {
    grid.appendChild(renderList("Still Needed", result.missingInformation, false));
  } else if (result.suggestedFollowups && result.suggestedFollowups.length) {
    grid.appendChild(renderList("Follow Up", result.suggestedFollowups, false));
  }
  article.appendChild(grid);

  const meta = document.createElement("div");
  meta.className = "meta-row";
  meta.appendChild(createIconText("span", "chip", "gauge", `${Math.round(result.confidence * 100)}% match`));
  meta.appendChild(createIconText("span", "chip", "activity", `${capitalize(result.urgencyLevel || "routine")} urgency`));
  (result.routeScores || []).slice(0, 2).forEach((route) => {
    meta.appendChild(createIconText("span", "chip", INTENT_ICONS[route.intent] || "route", `${route.intent} ${Math.round(route.score * 100)}%`));
  });
  (result.flags || []).forEach((flag) => meta.appendChild(createIconText("span", "chip", "shield-check", flag.replaceAll("_", " "))));
  (result.sources || []).forEach((source) => {
    const link = document.createElement(source.url ? "a" : "span");
    link.className = "chip";
    link.appendChild(iconElement(source.url ? "external-link" : "file-text"));
    link.appendChild(document.createTextNode(source.name));
    if (source.url) {
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noreferrer";
    }
    meta.appendChild(link);
  });
  article.appendChild(meta);

  elements.messages.appendChild(article);
  elements.messages.scrollTop = elements.messages.scrollHeight;
  refreshIcons();
}

function renderMemory() {
  elements.messages.innerHTML = "";
  const memory = readMemory();
  if (!memory.length) {
    renderMessage("assistant", "", {
      intent: "rag",
      title: "Ready",
      summary: "Tell me what is going on, and I will route it to the right care path.",
      details: {
        now: ["Share symptoms, a medication question, or an appointment request."],
        monitor: ["Timing", "Severity", "Current medicines"],
        urgent: ["Chest pain", "Trouble breathing", "Stroke signs", "Severe allergic reaction"]
      },
      sources: [],
      flags: ["safety_ready"],
      confidence: 1,
      reason: "Ready"
    });
  } else {
    memory.forEach((item) => renderMessage(item.role, item.text, item.result));
  }
  updateSummary();
}

function saveTurn(text, result) {
  const memory = readMemory();
  const createdAt = new Date().toISOString();
  memory.push({ role: "patient", text, created_at: createdAt });
  memory.push({ role: "assistant", text: result.summary, result, created_at: createdAt });
  writeMemory(memory);
  writeProfile(result.patientProfile || readProfile());
  updateSummary(result);
}

function updateSummary(result = state.recentResult) {
  const memory = readMemory();
  const turns = Math.floor(memory.length / 2);
  const lastAssistant = [...memory].reverse().find((item) => item.role === "assistant");
  const last = result || (lastAssistant && lastAssistant.result);
  state.recentResult = last || null;

  elements.memorySummary.textContent = `${turns} ${turns === 1 ? "turn" : "turns"}`;
  elements.topicSummary.textContent = String(state.topics.length);
  elements.medSummary.textContent = String(Object.keys(state.drugs).length);

  if (!last) {
    setRoute("ready", "Ready");
    elements.intentMetric.textContent = "None";
    elements.confidenceMetric.textContent = "--";
    elements.urgencyMetric.textContent = "Routine";
    elements.safetyMetric.textContent = "Ready";
    elements.matchTitle.textContent = "No active match";
    elements.matchSummary.textContent = "Ask a question to retrieve a topic or medication entry.";
    elements.sourceList.innerHTML = "";
    elements.riskSummary.textContent = "Routine";
    elements.alertSummary.textContent = "Standby";
    elements.lastTopicSummary.textContent = "None";
    renderRouteScores([]);
    renderProfileSignals(readProfile());
    renderClinicalSlots({});
    renderMissingInformation([]);
    renderFollowupBuilder(null);
    renderAgentActions([]);
    renderWorkflowTrace([]);
    renderGovernance(null);
    renderCareFocus(null);
    renderSmartIntake(null);
    renderReadiness(null);
    renderHandoffPocket(null);
    renderCaregiverUpdate(null);
    loadProfileForm(readProfile());
    renderTasks(readTasks());
    renderNotes(readNotes());
    renderTimeline(memory);
    return;
  }

  setRoute(last.intent, last.intent.toUpperCase());
  elements.intentMetric.textContent = last.intent;
  elements.confidenceMetric.textContent = `${Math.round(last.confidence * 100)}%`;
  elements.urgencyMetric.textContent = capitalize(last.urgencyLevel || "routine");
  const flags = last.flags || [];
  elements.safetyMetric.textContent = flags.length ? flags.map((flag) => flag.replaceAll("_", " ")).join(", ") : "No flags";
  elements.matchTitle.textContent = last.title;
  elements.matchSummary.textContent = last.reason || "";
  elements.riskSummary.textContent = riskLabel(last);
  elements.alertSummary.textContent = last.intent === "alert" ? "Triggered" : "Standby";
  elements.lastTopicSummary.textContent = last.title;
  renderRouteScores(last.routeScores || []);
  renderProfileSignals(last.patientProfile || readProfile());
  renderClinicalSlots(last.clinicalSlots || {});
  renderMissingInformation(last.missingInformation || []);
  renderFollowupBuilder(last);
  renderAgentActions(last.agentActions || []);
  renderWorkflowTrace(last.workflowTrace || []);
  renderGovernance(last.governanceCard || null);
  renderSources(last.sources || []);
  renderCareFocus(last);
  renderSmartIntake(last);
  renderReadiness(last);
  renderHandoffPocket(last);
  renderCaregiverUpdate(last);
  loadProfileForm(readProfile());
  renderTasks(readTasks());
  renderNotes(readNotes());
  renderTimeline(memory);
}

function riskLabel(result) {
  if (result.intent === "alert" || result.urgencyLevel === "emergency") return "Emergency";
  if (result.urgencyLevel === "urgent") return "Urgent";
  if (result.urgencyLevel === "watch") return "Watch";
  return "Routine";
}

function renderRouteScores(routeScores) {
  elements.routeScoreList.innerHTML = "";
  if (!routeScores.length) {
    elements.routeScoreList.appendChild(createIconText("span", "muted", "route", "No active route scores"));
    refreshIcons();
    return;
  }

  routeScores.forEach((route) => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.appendChild(createText("span", "", capitalize(route.intent)));

    const track = document.createElement("div");
    track.className = "score-track";
    const fill = document.createElement("div");
    fill.className = `score-fill ${route.intent}`;
    fill.style.width = `${Math.round(route.score * 100)}%`;
    track.appendChild(fill);
    row.appendChild(track);

    row.appendChild(createText("span", "", `${Math.round(route.score * 100)}%`));
    elements.routeScoreList.appendChild(row);
  });
}

function renderProfileSignals(profile) {
  elements.profileSignals.innerHTML = "";
  const chips = [
    ...((profile.symptoms || []).slice(-4).map((value) => ["activity", value])),
    ...((profile.medications || []).slice(-4).map((value) => ["pill", value])),
    ...((profile.conditions || []).slice(-4).map((value) => ["clipboard-plus", value])),
    ...((profile.allergies || []).slice(-3).map((value) => ["shield-alert", value])),
    ...((profile.emergency_contacts || []).slice(-1).map((value) => ["bell-ring", value]))
  ];

  if (!chips.length) {
    elements.profileSignals.appendChild(createText("span", "empty", "No remembered signals yet"));
    return;
  }

  chips.slice(0, 10).forEach(([icon, label]) => {
    elements.profileSignals.appendChild(createIconText("span", "chip", icon, label));
  });
  refreshIcons();
}

function humanizeSlotKey(key) {
  return String(key || "").replaceAll("_", " ");
}

function formatMeasurementValue(key, value) {
  if (key === "blood_pressure" && value && typeof value === "object") {
    return `blood pressure ${value.systolic}/${value.diastolic}`;
  }
  if (key === "temperature_f") return `temperature ${value}F`;
  if (key === "oxygen_saturation") return `oxygen saturation ${value}%`;
  if (key === "blood_glucose") return `blood glucose ${value}`;
  if (key === "heart_rate") return `heart rate ${value}`;
  return `${humanizeSlotKey(key)} ${value}`;
}

function formatSlotValue(value, key = "") {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") {
    if (key === "measurements") {
      return Object.entries(value).map(([measurementKey, measurementValue]) => {
        return formatMeasurementValue(measurementKey, measurementValue);
      }).join(", ");
    }
    if (key === "measurement_flags") {
      return Object.entries(value).map(([level, flags]) => {
        return `${level}: ${Array.isArray(flags) ? flags.join(", ") : flags}`;
      }).join("; ");
    }
    return Object.entries(value).map(([childKey, childValue]) => {
      return `${humanizeSlotKey(childKey)}: ${formatSlotValue(childValue, childKey)}`;
    }).join("; ");
  }
  return String(value);
}

function renderClinicalSlots(slots) {
  elements.slotList.innerHTML = "";
  const entries = Object.entries(slots || {}).filter(([, value]) => {
    return Array.isArray(value) ? value.length : Boolean(value);
  });

  if (!entries.length) {
    elements.slotList.appendChild(createText("span", "empty", "No extracted slots yet"));
    return;
  }

  entries.slice(0, 8).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "signal-row";
    row.appendChild(createText("span", "", humanizeSlotKey(key)));
    row.appendChild(createText("strong", "", formatSlotValue(value, key)));
    elements.slotList.appendChild(row);
  });
}

function renderMissingInformation(items) {
  elements.missingList.innerHTML = "";
  const values = items || [];
  if (!values.length) return;

  values.slice(0, 5).forEach((item) => {
    const row = document.createElement("div");
    row.className = "missing-row";
    row.appendChild(createText("span", "", "Still needed"));
    row.appendChild(createText("strong", "", item));
    elements.missingList.appendChild(row);
  });
}

function renderAgentActions(actions) {
  elements.actionList.innerHTML = "";
  const values = actions || [];
  if (!values.length) {
    elements.actionList.appendChild(createText("span", "empty", "No actions planned yet"));
    return;
  }

  values.slice(0, 9).forEach((action) => {
    const row = document.createElement("div");
    row.className = "action-row";
    const text = document.createElement("div");
    text.appendChild(createText("strong", "", action.name.replaceAll("_", " ")));
    if (action.rationale) text.appendChild(createText("span", "", action.rationale));
    const status = createText("span", `action-status ${action.status || "queued"}`, action.status || "queued");
    row.appendChild(text);
    row.appendChild(status);
    elements.actionList.appendChild(row);
  });
}

function renderWorkflowTrace(trace) {
  elements.workflowTraceList.innerHTML = "";
  const values = trace || [];
  if (!values.length) {
    elements.workflowTraceList.appendChild(createText("span", "empty", "Loop trace appears after the first patient message"));
    return;
  }

  values.slice(0, 8).forEach((step) => {
    const row = document.createElement("div");
    row.className = `workflow-step ${step.status || "completed"}`;
    row.appendChild(createText("span", "workflow-step-index", String(step.step || "")));

    const text = document.createElement("div");
    text.appendChild(createText("strong", "", WORKFLOW_STEP_LABELS[step.name] || String(step.name || "Workflow step").replaceAll("_", " ")));
    if (step.summary) text.appendChild(createText("span", "", step.summary));
    row.appendChild(text);

    elements.workflowTraceList.appendChild(row);
  });
}

function governanceLabel(value) {
  return String(value || "").replaceAll("_", " ");
}

function renderGovernance(card) {
  elements.governanceList.innerHTML = "";
  if (!card) {
    elements.governanceList.appendChild(createText("span", "empty", "Research guardrails appear after the first patient message"));
    return;
  }

  const efficiency = card.modelEfficiency || {};
  const plannedCalls = efficiency.plannedSpecialistCalls || 1;
  const speedText = efficiency.processingMs ? `; ${efficiency.processingMs}ms local run` : "";
  const dataText = efficiency.knowledgeTopics ? `; ${efficiency.knowledgeTopics} topics/${efficiency.medicationEntries || 0} meds` : "";
  const capabilityText = efficiency.capabilityScore ? `; capability ${efficiency.capabilityScore}%` : "";
  const efficiencyText = efficiency.routingMode
    ? `${efficiency.routingMode}; ${plannedCalls} specialist ${plannedCalls === 1 ? "call" : "calls"}; ${efficiency.recentMessagesUsed || 0} memory messages used${speedText}${dataText}${capabilityText}`
    : "Single-route local workflow";
  const secondaryText = (card.secondaryIntents || []).length
    ? card.secondaryIntents.map(governanceLabel).join(", ")
    : "None";
  const secondaryPreviewText = (card.secondaryOutputs || []).length
    ? card.secondaryOutputs.map((output) => `${governanceLabel(output.intent)}: ${output.status}`).join(", ")
    : "None";
  const packet = card.handoffPacket || {};
  const rows = [
    ["Source quality", governanceLabel(card.sourceQuality)],
    ["Decision role", card.decisionRole],
    ["Handoff", `${governanceLabel(card.handoff?.level)} - ${card.handoff?.owner || "Care team"}`],
    ["Why", card.handoff?.reason || "Routine educational support"],
    ["Next action", packet.nextBestAction || "Continue routine monitoring"],
    ["Secondary routes", secondaryText],
    ["Secondary previews", secondaryPreviewText],
    ["Efficiency", efficiencyText]
  ];

  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "governance-row";
    row.appendChild(createText("span", "", label));
    row.appendChild(createText("strong", "", value));
    elements.governanceList.appendChild(row);
  });

  const controls = document.createElement("div");
  controls.className = "governance-controls";
  (card.qualityGates || []).slice(0, 4).forEach((gate) => {
    const icon = gate.status === "blocked" ? "octagon-alert" : gate.status === "watch" ? "circle-alert" : "check-circle";
    controls.appendChild(createIconText("span", `chip ${gate.status === "blocked" ? "alert" : ""}`, icon, `${gate.name.replaceAll("_", " ")}: ${gate.status}`));
  });
  (card.riskControls || []).slice(0, 6).forEach((control) => {
    controls.appendChild(createIconText("span", "chip", "shield-check", control));
  });
  elements.governanceList.appendChild(controls);
  refreshIcons();
}

function setRoute(intent, label) {
  elements.routeBadge.className = "route-badge";
  if (["rag", "pharmacy", "scheduling", "alert"].includes(intent)) {
    elements.routeBadge.classList.add(intent);
  }
  elements.routeBadge.innerHTML = "";
  elements.routeBadge.appendChild(iconElement(INTENT_ICONS[intent] || "circle-dot"));
  elements.routeBadge.appendChild(createText("span", "", label));
  refreshIcons();
}

function renderSources(sources) {
  elements.sourceList.innerHTML = "";
  if (!sources.length) {
    elements.sourceList.appendChild(createIconText("span", "chip", "workflow", "Local workflow"));
    refreshIcons();
    return;
  }
  sources.forEach((source) => {
    const node = document.createElement(source.url ? "a" : "span");
    node.className = "chip";
    node.appendChild(iconElement(source.url ? "external-link" : "file-text"));
    node.appendChild(document.createTextNode(source.name));
    if (source.url) {
      node.href = source.url;
      node.target = "_blank";
      node.rel = "noreferrer";
    }
    elements.sourceList.appendChild(node);
  });
  refreshIcons();
}

function renderLibrary() {
  const query = elements.librarySearch.value.trim().toLowerCase();
  const docs = state.topics
    .filter((doc) => {
      if (!query) return true;
      const haystack = [doc.title, doc.answer, ...(doc.tags || [])].join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, 18);

  elements.libraryList.innerHTML = "";
  docs.forEach((doc) => {
    const item = document.createElement("button");
    item.className = "library-item";
    item.type = "button";
    item.appendChild(createIconText("strong", "", "book-marked", doc.title));
    item.appendChild(createText("span", "", (doc.tags || []).slice(0, 5).join(", ")));
    item.addEventListener("click", () => {
      usePrompt(`Tell me about ${doc.title}`);
    });
    elements.libraryList.appendChild(item);
  });
  refreshIcons();
}

function accessKey() {
  return "healthcare-agent-access";
}

function readAccess() {
  try {
    return JSON.parse(localStorage.getItem(accessKey()) || "null");
  } catch {
    return null;
  }
}

function writeAccess(access) {
  const key = accessKey();
  const value = JSON.stringify(access);
  localStorage.setItem(key, value);
  mirrorLocalHostValue(key, value);
}

function setLaunchStatus(message) {
  if (elements.installStatus) elements.installStatus.textContent = message;
}

function setWorkspaceStatus(message) {
  if (elements.workspaceStatus) elements.workspaceStatus.textContent = message;
}

function uiPreferenceKey() {
  return "healthcare-agent-ui-mode";
}

function normalizeUiMode(value) {
  return ["comfort", "compact", "large"].includes(value) ? value : "comfort";
}

function readUiMode() {
  try {
    return normalizeUiMode(localStorage.getItem(uiPreferenceKey()));
  } catch {
    return "comfort";
  }
}

function applyUiMode(mode, persist = false) {
  const next = normalizeUiMode(mode);
  state.uiMode = next;
  document.body.classList.remove("ui-comfort", "ui-compact", "ui-large");
  document.body.classList.add(`ui-${next}`);
  document.documentElement.dataset.uiMode = next;
  elements.uiModeButtons.forEach((button) => {
    const active = button.dataset.uiMode === next;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  if (persist) {
    try {
      localStorage.setItem(uiPreferenceKey(), next);
    } catch {
      // Preference is optional; keep the visual state even if storage is unavailable.
    }
  }
  return next;
}

function initializeUiPreferences() {
  applyUiMode(readUiMode());
  elements.uiModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = applyUiMode(button.dataset.uiMode, true);
      setWorkspaceStatus(`${capitalize(next)} interface active.`);
    });
  });
}

function deviceInstallGuide() {
  const ua = navigator.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua)) {
    return "iOS: open in Safari, use Share, then Add to Home Screen.";
  }
  if (/android/i.test(ua)) {
    return "Android: use Chrome or Edge, then choose Install app or Add to Home screen.";
  }
  if (/windows/i.test(ua)) {
    return "Windows: use Install App in Chrome or Edge, or download the local package.";
  }
  if (/macintosh|mac os/i.test(ua)) {
    return "macOS: install from the browser menu, add to Dock, or run the local package.";
  }
  return "Use Install App when your browser offers it, or download the local package.";
}

function updateDeviceGuide() {
  if (elements.deviceGuide) elements.deviceGuide.textContent = deviceInstallGuide();
}

function setMobileView(view) {
  const nextView = ["library", "chat", "insights"].includes(view) ? view : "chat";
  elements.appShell.dataset.mobileView = nextView;
  elements.mobileNavButtons.forEach((button) => {
    const isActive = button.dataset.mobileView === nextView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function listBlock(title, items) {
  const values = (items || []).filter(Boolean);
  if (!values.length) return `${title}: None`;
  return `${title}:\n${values.map((item) => `- ${item}`).join("\n")}`;
}

function actionBlock(actions) {
  const values = (actions || []).filter(Boolean);
  if (!values.length) return "Agent actions: None";
  return `Agent actions:\n${values.map((action) => `- ${action.name.replaceAll("_", " ")} (${action.status || "queued"}): ${action.rationale || "No rationale"}`).join("\n")}`;
}

function workflowBlock(trace) {
  const values = (trace || []).filter(Boolean);
  if (!values.length) return "Agent loop: None";
  return `Agent loop:\n${values.map((step) => {
    const label = WORKFLOW_STEP_LABELS[step.name] || String(step.name || "Workflow step").replaceAll("_", " ");
    return `- ${step.step}. ${label}: ${step.summary || step.status || "completed"}`;
  }).join("\n")}`;
}

function governanceBlock(card) {
  if (!card) return "Research guardrails: None";
  const packet = card.handoffPacket || {};
  return [
    "Research guardrails:",
    `- Intended use: ${card.intendedUse}`,
    `- Decision role: ${card.decisionRole}`,
    `- Source quality: ${governanceLabel(card.sourceQuality)}`,
    `- Handoff: ${governanceLabel(card.handoff?.level)} - ${card.handoff?.owner || "Care team"}`,
    `- Handoff reason: ${card.handoff?.reason || "Routine educational support"}`,
    `- Next best action: ${packet.nextBestAction || "Continue routine monitoring"}`,
    listBlock("Known facts", packet.knownFacts || []),
    listBlock("Route summary", packet.routeSummary || []),
    listBlock("Secondary previews", (card.secondaryOutputs || []).map((output) => `${governanceLabel(output.intent)} (${output.status}): ${output.summary}`)),
    listBlock("Quality gates", (card.qualityGates || []).map((gate) => `${gate.name}: ${gate.status} - ${gate.reason}`)),
    listBlock("Limitations", card.limitations),
    listBlock("Risk controls", card.riskControls)
  ].join("\n");
}

function profileBlock(profile = readProfile()) {
  return [
    "Saved patient context:",
    listBlock("Medicines", profile.medications),
    listBlock("Conditions", profile.conditions),
    listBlock("Allergies", profile.allergies),
    listBlock("Emergency contacts", profile.emergency_contacts)
  ].join("\n");
}

function taskExportBlock(tasks = readTasks()) {
  if (!tasks.length) return "Care tasks: None";
  return [
    "Care tasks:",
    ...tasks.slice(0, 20).map((task) => `- ${task.completed ? "[done]" : "[open]"} ${task.text}`)
  ].join("\n");
}

function noteExportBlock(notes = readNotes()) {
  if (!notes.length) return "Case notes: None";
  return [
    "Case notes:",
    ...notes.slice(0, 20).map((note) => `- ${note.text}`)
  ].join("\n");
}

function buildCarePlanText(result = state.recentResult) {
  const timestamp = new Date().toLocaleString();
  const patientId = elements.patientId.value.trim() || "demo-patient";
  const profile = readProfile();
  const tasks = readTasks();
  const notes = readNotes();
  const followup = followupBuilderData(result);
  if (!result) {
    return [
      "Healthcare Agent care snapshot",
      `Patient ID: ${patientId}`,
      `Created: ${timestamp}`,
      "",
      profileBlock(profile),
      "",
      taskExportBlock(tasks),
      "",
      noteExportBlock(notes),
      "",
      followupExportBlock(followup),
      "",
      "No active care plan yet.",
      "Start with a symptom, medication question, or appointment request."
    ].join("\n");
  }

  const sources = (result.sources || []).map((source) => source.url ? `${source.name} (${source.url})` : source.name);
  return [
    "Healthcare Agent care plan",
    `Patient ID: ${patientId}`,
    `Created: ${timestamp}`,
    `Route: ${capitalize(result.intent || "rag")}`,
    `Urgency: ${capitalize(result.urgencyLevel || "routine")}`,
    `Confidence: ${Math.round((result.confidence || 0) * 100)}%`,
    "",
    profileBlock(profile),
    "",
    taskExportBlock(tasks),
    "",
    noteExportBlock(notes),
    "",
    followupExportBlock(followup),
    "",
    result.title || "Care response",
    result.summary || "",
    "",
    listBlock("Next steps", result.details?.now),
    "",
    listBlock("Monitor", result.details?.monitor),
    "",
    listBlock("Urgent signs", result.details?.urgent),
    "",
    listBlock("Still needed", result.missingInformation),
    "",
    actionBlock(result.agentActions),
    "",
    workflowBlock(result.workflowTrace),
    "",
    governanceBlock(result.governanceCard),
    "",
    listBlock("Sources", sources),
    "",
    DISCLAIMER
  ].join("\n");
}

function fallbackCopyText(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  return copied;
}

async function copyCarePlan() {
  const text = buildCarePlanText();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopyText(text)) {
      throw new Error("Copy unavailable");
    }
    setWorkspaceStatus("Care plan copied.");
  } catch {
    setWorkspaceStatus("Copy unavailable in this browser. Use Export instead.");
  }
}

function safeFilePart(value) {
  return String(value || "patient").replace(/[^a-z0-9_.-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "patient";
}

function exportCarePlan() {
  const text = buildCarePlanText();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `healthcare-agent-${safeFilePart(elements.patientId.value)}-${date}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setWorkspaceStatus("Care plan exported.");
}

function startNewCase() {
  const access = readAccess() || { mode: "local" };
  const suffix = String(Date.now()).slice(-5);
  const id = `${access.mode || "local"}-case-${suffix}`;
  elements.patientId.value = id;
  writeAccess({ mode: access.mode || "local", patient_id: id, updated_at: new Date().toISOString() });
  state.recentResult = null;
  elements.prompt.value = "";
  syncComposerState();
  renderMemory();
  setMobileView("chat");
  setWorkspaceStatus(`Started ${id}.`);
}

function usePrompt(text) {
  elements.prompt.value = text;
  syncComposerState();
  setMobileView("chat");
  elements.prompt.focus();
  setWorkspaceStatus("Prompt ready.");
}

function patientIdFromLogin(value, fallback) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return fallback;
  return cleaned.includes("@") ? cleaned.split("@")[0].replace(/[^a-zA-Z0-9_.-]+/g, "-") : cleaned;
}

async function enterWorkspace(mode, patientId) {
  const id = patientIdFromLogin(patientId, mode === "web" ? "demo-patient" : "local-patient");
  writeAccess({ mode, patient_id: id, updated_at: new Date().toISOString() });
  elements.patientId.value = id;
  document.body.classList.remove("launch-active");
  elements.appShell.setAttribute("aria-hidden", "false");
  setMobileView("chat");
  setWorkspaceStatus(mode === "web" ? "Opening web demo mode..." : "Opening local mode...");
  renderCapabilities();
  syncComposerState();
  refreshIcons();
  elements.prompt.focus();
  await hydratePatientStore(id);
  const storageLabel = state.localHostStoreAvailable ? " Localhost store is saving data to this machine." : "";
  setWorkspaceStatus(mode === "web" ? `Web demo mode active.${storageLabel}` : `Local mode active on this device.${storageLabel}`);
  renderCapabilities();
  renderMemory();
  syncComposerState();
  refreshIcons();
  elements.prompt.focus();
}

async function initializeAccess() {
  const params = new URLSearchParams(window.location.search);
  const saved = readAccess();
  if (params.get("mode") === "chat") {
    params.delete("mode");
    const query = params.toString();
    const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash || ""}`;
    window.history.replaceState(null, "", cleanUrl || "./");
  }

  if (saved?.patient_id && elements.loginId) {
    elements.loginId.value = saved.patient_id;
  }
  document.body.classList.add("launch-active");
  elements.appShell.setAttribute("aria-hidden", "true");
  setLaunchStatus(saved?.patient_id
    ? "Front page ready. Download the app, login, or continue with Local Mode."
    : "Ready for web or local demo access.");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    state.serviceWorkerState = "unsupported";
    renderCapabilities();
    return;
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    state.serviceWorkerState = "active";
    renderCapabilities();
  });
  navigator.serviceWorker.register("service-worker.js").then((registration) => {
    state.serviceWorkerState = navigator.serviceWorker.controller ? "active" : registration.active ? "ready" : "registering";
    renderCapabilities();
    navigator.serviceWorker.ready.then(() => {
      state.serviceWorkerState = "ready";
      renderCapabilities();
    });
  }).catch(() => {
    state.serviceWorkerState = "unavailable";
    renderCapabilities();
    setLaunchStatus("Offline install cache is unavailable in this browser.");
  });
}

function initializeInstallFlow() {
  updateDeviceGuide();

  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
    setLaunchStatus("App is running in installed mode.");
    renderCapabilities();
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    setLaunchStatus("Install is ready for this device.");
    renderCapabilities();
  });

  elements.installApp.addEventListener("click", async () => {
    if (state.deferredInstallPrompt) {
      state.deferredInstallPrompt.prompt();
      const choice = await state.deferredInstallPrompt.userChoice;
      state.deferredInstallPrompt = null;
      setLaunchStatus(choice.outcome === "accepted" ? "Install started." : "Install dismissed.");
      return;
    }
    setLaunchStatus("Use the browser menu to add this app to your home screen or desktop.");
  });
}

async function loadData() {
  try {
    const [topicResponse, drugResponse] = await Promise.all([
      fetch("data/medical_faqs.json", { cache: "no-store" }),
      fetch("data/drugs.json", { cache: "no-store" })
    ]);
    if (!topicResponse.ok || !drugResponse.ok) throw new Error("Knowledge files unavailable");
    state.topics = await topicResponse.json();
    state.drugs = await drugResponse.json();
    state.dataSource = "local data files";
  } catch {
    state.topics = FALLBACK_TOPICS;
    state.drugs = FALLBACK_DRUGS;
    state.dataSource = "fallback records";
  }

  prepareAgentIndexes();
  state.dataLoaded = true;
  elements.datasetStatus.textContent = `${state.topicIndex.length} indexed topics, ${Object.keys(state.drugs).length} medications`;
  renderLibrary();
  renderMemory();
  syncComposerState();
  renderCapabilities();
  verifyDownloadPackage();
  refreshIcons();
}

elements.composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.prompt.value.trim();
  if (!text) return;
  if (!state.dataLoaded) {
    setWorkspaceStatus("Knowledge base is loading. Try again in a moment.");
    syncComposerState();
    return;
  }
  elements.prompt.value = "";
  syncComposerState();
  renderMessage("patient", text);
  const result = answer(text);
  renderMessage("assistant", "", result);
  saveTurn(text, result);
  setMobileView("chat");
  renderCapabilities();
  const speed = result.modelEfficiency?.processingMs;
  setWorkspaceStatus(speed ? `Routed to ${result.intent} in ${speed}ms on this device.` : `Routed to ${result.intent}.`);
});

elements.prompt.addEventListener("input", syncComposerState);

elements.prompt.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (elements.prompt.value.trim()) elements.composer.requestSubmit();
  }
});

document.querySelectorAll(".quick, .prompt-chip").forEach((button) => {
  button.addEventListener("click", () => {
    usePrompt(button.dataset.prompt || button.textContent.trim());
  });
});

elements.mobileNavButtons.forEach((button) => {
  button.addEventListener("click", () => setMobileView(button.dataset.mobileView));
});

elements.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  enterWorkspace("web", elements.loginId.value || "demo-patient").then(() => {
    setLaunchStatus("Logged in to web demo mode.");
  });
});

elements.localMode.addEventListener("click", () => {
  const saved = readAccess();
  const patientId = elements.loginId.value || saved?.patient_id || "local-patient";
  enterWorkspace("local", patientId).then(() => {
    setLaunchStatus(state.localHostStoreAvailable ? "Localhost store is saving data on this machine." : "Local mode is active on this device.");
  });
});

elements.newCase.addEventListener("click", startNewCase);
elements.copyPlan.addEventListener("click", copyCarePlan);
elements.exportPlan.addEventListener("click", exportCarePlan);
elements.addFocusTask.addEventListener("click", addFocusTaskFromCurrent);
elements.copyHandoff.addEventListener("click", copyHandoff);
elements.copyCaregiverUpdate.addEventListener("click", copyCaregiverUpdate);
elements.copyRecord.addEventListener("click", copyLocalRecord);
elements.exportRecord.addEventListener("click", exportLocalRecord);
elements.restoreRecord.addEventListener("click", openRestorePanel);
elements.applyRestore.addEventListener("click", applyRestoreFromPanel);
elements.cancelRestore.addEventListener("click", closeRestorePanel);
elements.chooseRecordFile.addEventListener("click", () => elements.recordImportInput.click());
elements.recordImportInput.addEventListener("change", importRecordFile);
elements.restoreText.addEventListener("input", previewRestoreText);
elements.restorePanel.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeRestorePanel();
  }
});
elements.saveProfile.addEventListener("click", saveProfileContext);
[elements.profileMedications, elements.profileConditions, elements.profileAllergies, elements.profileContact].forEach((input) => {
  input.addEventListener("input", () => {
    elements.profileSaveStatus.textContent = "Unsaved context changes.";
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveProfileContext();
    }
  });
});
elements.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(elements.taskInput.value);
  elements.taskInput.value = "";
});
elements.taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addTask(elements.taskInput.value);
    elements.taskInput.value = "";
  }
});
elements.noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addNote(elements.noteInput.value);
  elements.noteInput.value = "";
});
elements.clearNoteDraft.addEventListener("click", () => {
  elements.noteInput.value = "";
  elements.noteInput.focus();
});
elements.librarySearch.addEventListener("input", renderLibrary);
elements.patientId.addEventListener("change", async () => {
  const access = readAccess() || { mode: "local" };
  const id = elements.patientId.value.trim() || "demo-patient";
  writeAccess({ mode: access.mode || "local", patient_id: id, updated_at: new Date().toISOString() });
  await hydratePatientStore(id);
  state.recentResult = null;
  renderMemory();
  setWorkspaceStatus("Patient context changed.");
});
elements.clearMemory.addEventListener("click", () => {
  const memoryKey = patientKey();
  const patientProfileKey = profileKey();
  const patientTaskKey = taskKey();
  const patientNoteKey = noteKey();
  localStorage.removeItem(memoryKey);
  localStorage.removeItem(patientProfileKey);
  localStorage.removeItem(patientTaskKey);
  localStorage.removeItem(patientNoteKey);
  deleteLocalHostValue(memoryKey);
  deleteLocalHostValue(patientProfileKey);
  deleteLocalHostValue(patientTaskKey);
  deleteLocalHostValue(patientNoteKey);
  state.recentResult = null;
  renderMemory();
  setWorkspaceStatus("Memory cleared for this patient.");
});

async function bootApp() {
  state.localStorageAvailable = storageIsAvailable();
  renderCapabilities();
  registerServiceWorker();
  initializeUiPreferences();
  initializeInstallFlow();
  initializePackageDownloads();
  await initializeLocalHostStore();
  renderCapabilities();
  await hydrateAccessStore();
  if (state.localHostStoreAvailable) {
    setLaunchStatus("Localhost store is ready to save data on this machine.");
  }
  await initializeAccess();
  await loadData();
}

bootApp().catch(async () => {
  state.localHostStoreAvailable = false;
  await initializeAccess();
  await loadData();
});

window.addEventListener("load", refreshIcons);
