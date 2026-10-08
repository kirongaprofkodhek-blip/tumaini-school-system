import { FormEvent, useEffect, useMemo, useState } from "react";

type UserRole =
  | "admin"
  | "head_teacher"
  | "teacher"
  | "class_teacher"
  | "subject_teacher"
  | "librarian"
  | "parent"
  | "visitor";

type LoginResponse = {
  access_token: string;
  token_type: string;
  role: UserRole;
  full_name: string;
};

type CurrentUser = {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
};

type PortalNotice = {
  kind: "success" | "error";
  text: string;
};

type ClassRoom = {
  id: number;
  name: string;
  stream: string | null;
};

type LearningArea = {
  id: number;
  class_id: number;
  name: string;
  min_marks: number;
  max_marks: number;
  cbc_formula: string;
};

type DirectoryUser = {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active?: boolean;
};

type Learner = {
  id: number;
  admission_no: string;
  full_name: string;
  class_id: number;
  class_name: string | null;
  boarding_status: string;
  transport_mode: string;
  parent_contact_id: number | null;
  parent_full_name: string | null;
  parent_phone_number: string | null;
};

type Assignment = {
  id: number;
  teacher_user_id: number;
  class_id: number;
  learning_area_id: number;
  is_class_teacher: boolean;
};

type ClassResponsibility = {
  id: number;
  teacher_user_id: number;
  class_id: number;
};

type TimetableRoom = {
  id: number;
  name: string;
  room_type: string | null;
  capacity: number | null;
};

type TimetablePeriod = {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  is_break: boolean;
};

type TimetableSlot = {
  id: number;
  day_of_week: string;
  period_id: number;
  class_id: number;
  learning_area_id: number;
  teacher_user_id: number;
  room_id: number | null;
  requirement_id: number | null;
  is_locked: boolean;
  notes: string | null;
};

type TimetableRequirement = {
  id: number;
  class_id: number;
  learning_area_id: number;
  teacher_user_id: number;
  periods_per_week: number;
  max_periods_per_day: number;
  preferred_room_id: number | null;
  allow_double_periods: boolean;
  notes: string | null;
};

type TimetableCheck = {
  severity: "error" | "warning" | "info";
  message: string;
  requirement_id?: number;
  slot_id?: number;
};

type Exam = {
  id: number;
  name: string;
  exam_type: string;
  exam_month: string | null;
  term: string;
  year: number;
  marks_deadline: string | null;
  status: "active" | "paused" | "ended";
  cbc_formula: string;
  class_id: number;
  learning_area_id: number;
  created_by_user_id: number | null;
};

type MarkEntry = {
  id: number;
  exam_id: number;
  learner_id: number;
  marks: number;
  level: string | null;
  entered_by_user_id: number | null;
  entered_at: string | null;
  class_id: number;
  learning_area_id: number;
  learner_name: string;
  admission_no: string;
};

type ExamCycle = {
  key: string;
  name: string;
  exam_type: string;
  exam_month: string | null;
  term: string;
  year: number;
  marks_deadline: string | null;
  status: "active" | "paused" | "ended";
  exams: Exam[];
  classIds: number[];
  learningAreaIds: number[];
};

type RecentArrival = {
  report_id: number;
  admission_no: string;
  learner_name: string;
  class_name: string | null;
  boarding_status: string;
  accompanied_source: string;
  report_time: string;
  accompanied_by: string;
  accompanied_phone: string | null;
  arrival_transport_mode: string | null;
  sms_status: string;
};

type CreateLearnerResponse = {
  message: string;
  learner_id: number;
  admission_no: string;
  full_name: string;
};

type SmsTemplate = {
  id: number;
  name: string;
  scope: string;
  message_body: string;
};

type SmsDeliveryLog = {
  id: number;
  phone_number: string;
  audience_type: string;
  message_body: string;
  provider: string;
  status: string;
  created_at: string;
};

type MeritItem = {
  learner_id: number;
  admission_no: string;
  learner_name: string;
  total_marks: number;
  subject_count: number;
  position: number;
};

type MeritListResponse = {
  class_id: number;
  exam_id: number;
  learning_area_id: number | null;
  items: MeritItem[];
};

type ExamAnalysisSubject = {
  exam_id: number;
  learning_area_id: number;
  learning_area_name: string;
  entered_count: number;
  missing_count: number;
  average_marks: number;
  highest_marks: number;
  lowest_marks: number;
  cbc_distribution: Record<string, number>;
};

type ExamAnalysisLearner = {
  learner_id: number;
  admission_no: string;
  learner_name: string;
  total_marks: number;
  average_percent: number;
  cbc_level: string | null;
  subject_count: number;
  missing_count: number;
  missing_subjects: string[];
  position: number;
};

type ExamAnalysisResponse = {
  exam: {
    id: number;
    name: string;
    exam_type: string;
    exam_month: string | null;
    term: string;
    year: number;
    cbc_formula: string;
  };
  class_id: number;
  learning_area_id: number | null;
  summary: {
    learner_count: number;
    learning_area_count: number;
    marks_entered: number;
    completion_rate: number;
    class_average: number;
  };
  subject_analysis: ExamAnalysisSubject[];
  learner_analysis: ExamAnalysisLearner[];
  support_learners: ExamAnalysisLearner[];
  insights: string[];
};

type WebsitePage = {
  id: number;
  slug: string;
  title: string;
  body?: string;
  is_published?: boolean;
  updated_at?: string;
};

type Book = {
  id: number;
  accession_no: string;
  title: string;
  author: string | null;
  category: string | null;
  total_copies: number;
  available_copies: number;
};

type Loan = {
  id: number;
  book_id: number;
  learner_id: number | null;
  teacher_user_id: number | null;
  class_id: number | null;
  issued_at: string;
  due_at: string | null;
  returned_at: string | null;
};

type ParentSummary = {
  learner: {
    admission_no: string;
    full_name: string;
    class_id: number;
    boarding_status: string;
  };
  parent: {
    full_name: string;
    phone_number: string;
  };
  recent_reporting: Array<{
    report_time: string;
    accompanied_by: string;
    sms_status: string;
  }>;
  recent_messages: Array<{
    created_at: string;
    message_body: string;
    status: string;
  }>;
};

type CsvRow = Record<string, string | number | boolean | null | undefined>;

function resolveApiBaseUrl() {
  if (typeof window !== "undefined" && window.location.hostname === "tumaini-frontend-pmyn.onrender.com") {
    return "https://tumaini-backend-vnry.onrender.com";
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return typeof window !== "undefined" && window.location.hostname.endsWith(".onrender.com")
    ? "https://tumaini-backend-vnry.onrender.com"
    : "http://127.0.0.1:8000";
}

const API_BASE_URL = resolveApiBaseUrl().replace(/\/$/, "");
const TOKEN_STORAGE_KEY = "tumaini_access_token";
const ROLE_STORAGE_KEY = "tumaini_staff_role";
const NAME_STORAGE_KEY = "tumaini_staff_name";
const SESSION_EXPIRES_STORAGE_KEY = "tumaini_session_expires_at";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function getStoredSessionToken(): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiresAt = Number(localStorage.getItem(SESSION_EXPIRES_STORAGE_KEY));
  if (!token) {
    return null;
  }
  if (!expiresAt || expiresAt <= Date.now()) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
    localStorage.removeItem(NAME_STORAGE_KEY);
    localStorage.removeItem(SESSION_EXPIRES_STORAGE_KEY);
    return null;
  }
  return token;
}

function extendStoredSession() {
  localStorage.setItem(SESSION_EXPIRES_STORAGE_KEY, String(Date.now() + SESSION_TIMEOUT_MS));
}

const roleCatalog: Array<{ value: UserRole; label: string; detail: string }> = [
  { value: "admin", label: "Admin", detail: "Full setup, users, reporting, messaging, website, and library." },
  { value: "head_teacher", label: "School Principal", detail: "Academic oversight, school leadership coordination, and merit monitoring." },
  { value: "teacher", label: "Teacher", detail: "Learning area marks, merit work, and class responsibility where assigned." },
  { value: "librarian", label: "Librarian", detail: "Book registry, issue and return, overdue tracking, and stock visibility." },
  { value: "parent", label: "Parent", detail: "Learner reporting history, messages, and summary lookup." },
  { value: "visitor", label: "Visitor", detail: "Public-facing school information and website content." },
];

const learningStages = [
  {
    star: "White Star",
    title: "ECDE",
    description: "The first foundation of growth, care, language, and early faith-based formation.",
  },
  {
    star: "Red Star",
    title: "Primary School",
    description: "Daily academic grounding with discipline, community life, and steady learner development.",
  },
  {
    star: "Gold Star",
    title: "Junior School",
    description: "Expanded learning areas, structured guidance, and stronger preparation for the next level.",
  },
  {
    star: "Blue Star",
    title: "Senior School",
    description: "The newest step in the Tumaini journey, added to reflect the school's expanded pathway.",
  },
];

const schoolFacts = [
  "Catholic parish school under Saint Mark Catholic Parish, Ol Moran.",
  "Comprehensive, mixed, day and boarding learning environment.",
  "Started in 2013 and counted 375 learners and 18 teachers in 2025.",
  "Boarding launched in 2020 for learners from far areas or vulnerable situations.",
];

const systemAreas = [
  {
    title: "Learner Reporting + SMS",
    text: "Daily arrival reporting, parent contact confirmation, and automatic message delivery to guardians.",
  },
  {
    title: "Academics + Merit Lists",
    text: "Teacher assignment by class and learning area, marks entry, CBC levels, and merit list downloads.",
  },
  {
    title: "Class Lists + Boarders",
    text: "Fast downloads for class registers, boarder registers, and operational school records.",
  },
  {
    title: "Messaging Portal",
    text: "Teachers with class responsibility can message parents by class, and admin can broadcast by filters such as boarders, day scholars, or whole school.",
  },
  {
    title: "Library Management",
    text: "Book registry, borrowing, returns, and tracking of books assigned to learners, teachers, and classes.",
  },
  {
    title: "Public Website + Parent Access",
    text: "One public website for visitors, with a clear staff entry point and a parent-facing information path.",
  },
];

const contactItems = [
  {
    label: "Address",
    value: "Saint Mark Catholic Parish - Ol Moran, Catholic Diocese of Nyahururu, Laikipia, Kenya, P.O. Box 20, 20320 Kinamba",
  },
  { label: "Email", value: "saintmark@olmoran.org" },
  { label: "Website", value: "www.olmoran.org" },
  { label: "Office Line & WhatsApp", value: "+254 720 924 153" },
  { label: "Fr. Giacomo WhatsApp", value: "+254 720 169 257" },
];

const campusHighlights = [
  { value: "375+", label: "Learners", detail: "Across the Tumaini learning journey from ECDE to senior school." },
  { value: "18+", label: "Teachers", detail: "Dedicated teachers serving academics, mentoring, and community life." },
  { value: "4", label: "School Stars", detail: "ECDE, Primary, Junior School, and Senior School growth path." },
  { value: "1", label: "Connected Platform", detail: "One website, one portal, one shared school database." },
];

type EventGalleryItem = {
  title: string;
  label: string;
  imageSrc: string;
  imageAlt: string;
  description: string;
  sourceLabel: string;
  images: string[];
};

type PublicSection = "home" | "about" | "journey" | "events" | "system" | "news" | "links" | "contact";

const publicNavItems: Array<{ id: PublicSection; label: string }> = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "journey", label: "Learning Journey" },
  { id: "events", label: "Events" },
  { id: "system", label: "School System" },
  { id: "news", label: "News" },
  { id: "links", label: "Quick Links" },
  { id: "contact", label: "Contact" },
];

const eventGallery: EventGalleryItem[] = [
  {
    title: "Corpus Christi Sunday",
    label: "Faith and parish life",
    imageSrc: "/gallery/tumaini-events/corpus-christi-sunday/718043364_1052169840666760_6396057020241100245_n.jpg",
    imageAlt: "Corpus Christi Sunday procession at Saint Mark Catholic Parish, Ol Moran",
    description:
      "A parish celebration showing Tumaini learners and the wider Saint Mark community gathered around worship, service, and Catholic identity.",
    sourceLabel: "8 photos",
    images: [
      "/gallery/tumaini-events/corpus-christi-sunday/718868142_1052166307333780_8771027307289728130_n.jpg",
      "/gallery/tumaini-events/corpus-christi-sunday/719160171_1052166097333801_4964797322641801337_n.jpg",
      "/gallery/tumaini-events/corpus-christi-sunday/720721747_1052166967333714_3924575298038616347_n.jpg",
    ],
  },
  {
    title: "Red Cross Event",
    label: "Safety and community care",
    imageSrc: "/gallery/tumaini-events/redcross-event/IMG_8997.JPG",
    imageAlt: "Tumaini Academy learners during a Red Cross community event",
    description:
      "Learners taking part in a community safety and awareness event, building responsibility, confidence, teamwork, and care for others.",
    sourceLabel: "30 photos",
    images: [
      "/gallery/tumaini-events/redcross-event/IMG_9010.JPG",
      "/gallery/tumaini-events/redcross-event/IMG_9282.JPG",
      "/gallery/tumaini-events/redcross-event/IMG_9650.JPG",
    ],
  },
  {
    title: "Scout Activities",
    label: "Outdoor formation",
    imageSrc: "/gallery/tumaini-events/scout/716431209_1050418017508609_428552511529268468_n.jpg",
    imageAlt: "Tumaini Academy learners during scout activities",
    description:
      "Scouting moments that show discipline, outdoor learning, leadership, teamwork, and the learner formation that happens beyond class.",
    sourceLabel: "13 photos",
    images: [
      "/gallery/tumaini-events/scout/716776064_1050418084175269_5403310222480233720_n.jpg",
      "/gallery/tumaini-events/scout/716809811_1050418804175197_4203930849758203528_n.jpg",
      "/gallery/tumaini-events/scout/719613099_1050418254175252_5442658235695391120_n.jpg",
    ],
  },
];

const fallbackNews = [
  {
    category: "School System",
    title: "Tumaini rolls out one connected school platform for reporting, marks, library, and messaging.",
    summary:
      "The school is moving from scattered tools into one shared system where administration, classroom work, parent messaging, and public communication meet in one place.",
  },
  {
    category: "Academics",
    title: "Teachers now work through assigned learning areas and downloadable merit list workflows.",
    summary:
      "The updated academic portal supports learning area marks entry, class merit views where assigned, and downloadable ranking from the same backend.",
  },
  {
    category: "Community",
    title: "Parent communication and reporting continue to improve with direct SMS and cleaner learner registration.",
    summary:
      "Reporting now leans on registered learner and parent records so the school can reduce repeated entry and improve communication accuracy.",
  },
];

const quickLinkGroups = [
  {
    title: "Portal Links",
    links: ["Staff Login", "Parent Lookup", "Reporting Desk", "Merit Lists"],
  },
  {
    title: "School Links",
    links: ["Admissions", "Learning Journey", "Events Gallery", "Boarding Life", "Library Services"],
  },
  {
    title: "Resources",
    links: ["Class Lists", "Parent SMS", "Website Updates", "Contact Office"],
  },
];

function formatRoleLabel(role: string): string {
  if (role === "head_teacher") {
    return "School Principal";
  }
  if (role === "teacher" || role === "class_teacher" || role === "subject_teacher") {
    return "Teacher";
  }
  return role
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function normalizeUserRole(role: UserRole | null | undefined): UserRole | null {
  if (!role) {
    return null;
  }
  if (role === "class_teacher" || role === "subject_teacher") {
    return "teacher";
  }
  return role;
}

function isTeacherRole(role: UserRole | null | undefined): boolean {
  const normalizedRole = normalizeUserRole(role);
  return normalizedRole === "teacher";
}

function EventPhoto({ event, className = "" }: { event: EventGalleryItem; className?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = event.imageSrc && !imageFailed;

  return (
    <div className={`event-photo-frame ${className}`}>
      {showImage ? (
        <img src={event.imageSrc} alt={event.imageAlt} onError={() => setImageFailed(true)} />
      ) : (
        <div className="event-photo-placeholder" aria-label={`${event.title} photo awaiting approval`}>
          <span>{event.label}</span>
        </div>
      )}
    </div>
  );
}

const CBC_FORMULA_OPTIONS = [
  {
    id: "standard",
    label: "Standard CBC",
    detail: "EE 80+, ME 65+, AE 50+, BE below 50",
    formula: "80:EE,65:ME,50:AE,0:BE",
  },
  {
    id: "strict",
    label: "Strict CBC",
    detail: "EE 85+, ME 70+, AE 50+, BE below 50",
    formula: "85:EE,70:ME,50:AE,0:BE",
  },
  {
    id: "supportive",
    label: "Supportive CBC",
    detail: "EE 75+, ME 60+, AE 40+, BE below 40",
    formula: "75:EE,60:ME,40:AE,0:BE",
  },
];

const SCHOOL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function buildQuery(params: Record<string, string | number | null | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

function csvEscape(value: CsvRow[string]): string {
  const stringValue = value === null || value === undefined ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function downloadCsv(fileName: string, rows: CsvRow[]) {
  if (!rows.length) {
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map((header) => csvEscape(header)).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "Not set";
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return value;
  }
  return date.toLocaleString();
}

function getExamCycleKey(exam: Exam): string {
  return [exam.name, exam.exam_type, exam.exam_month ?? "", exam.term, exam.year].join("|");
}

function buildExamCycles(exams: Exam[]): ExamCycle[] {
  const cycleMap = new Map<string, ExamCycle>();
  exams.forEach((exam) => {
    const key = getExamCycleKey(exam);
    const existing = cycleMap.get(key);
    if (existing) {
      existing.exams.push(exam);
      existing.classIds = Array.from(new Set([...existing.classIds, exam.class_id]));
      existing.learningAreaIds = Array.from(new Set([...existing.learningAreaIds, exam.learning_area_id]));
      if (!existing.marks_deadline || (exam.marks_deadline && exam.marks_deadline < existing.marks_deadline)) {
        existing.marks_deadline = exam.marks_deadline;
      }
      if (existing.status !== "ended") {
        existing.status = exam.status === "ended" ? "ended" : exam.status === "paused" ? "paused" : existing.status;
      }
      return;
    }
    cycleMap.set(key, {
      key,
      name: exam.name,
      exam_type: exam.exam_type,
      exam_month: exam.exam_month,
      term: exam.term,
      year: exam.year,
      marks_deadline: exam.marks_deadline,
      status: exam.status,
      exams: [exam],
      classIds: [exam.class_id],
      learningAreaIds: [exam.learning_area_id],
    });
  });
  return Array.from(cycleMap.values()).sort((first, second) => {
    if (first.year !== second.year) {
      return second.year - first.year;
    }
    return first.name.localeCompare(second.name);
  });
}

function getModulesForRole(role: UserRole | null, teacherHasClassResponsibility = false): Array<{ id: string; label: string }> {
  switch (normalizeUserRole(role)) {
    case "admin":
      return [
        { id: "setup", label: "Setup" },
        { id: "reporting", label: "Reporting" },
        { id: "academics", label: "Academics" },
        { id: "exams", label: "Exams" },
        { id: "timetable", label: "Timetable" },
        { id: "messaging", label: "Messaging" },
        { id: "website", label: "Website" },
      ];
    case "head_teacher":
      return [
        { id: "academics", label: "Academics" },
        { id: "exams", label: "Exams" },
        { id: "timetable", label: "Timetable" },
      ];
    case "teacher":
      return teacherHasClassResponsibility
        ? [
            { id: "reporting", label: "Reporting" },
            { id: "messaging", label: "Messaging" },
            { id: "academics", label: "Academics" },
            { id: "exams", label: "Exams" },
            { id: "timetable", label: "Timetable" },
          ]
        : [
            { id: "exams", label: "Exams" },
            { id: "timetable", label: "Timetable" },
          ];
    case "class_teacher":
    case "subject_teacher":
      return [{ id: "exams", label: "Exams" }];
    case "librarian":
      return [{ id: "library", label: "Library" }];
    case "parent":
      return [{ id: "parent", label: "Parent Space" }];
    default:
      return [];
  }
}

type DashboardTheme = {
  shellClassName: string;
  kicker: string;
  title: string;
  detail: string;
  spotlightLabel: string;
  spotlightTitle: string;
  spotlightDetail: string;
  lanes: Array<{
    label: string;
    title: string;
    detail: string;
  }>;
};

function getDashboardTheme(role: UserRole | null, teacherHasClassResponsibility = false): DashboardTheme {
  switch (normalizeUserRole(role)) {
    case "admin":
      return {
        shellClassName: "portal-admin",
        kicker: "School command center",
        title: "Admin dashboard",
        detail: "Run the school structure, keep reporting moving, coordinate messaging, and keep the public website current from one operations space.",
        spotlightLabel: "Primary mode",
        spotlightTitle: "Management cards and whole-school oversight",
        spotlightDetail:
          "This workspace is built for setup, approvals, and school-wide monitoring so the rest of the roles can work from a clean system.",
        lanes: [
          {
            label: "Structure",
            title: "Users, classes, and assignments",
            detail: "Manage staff accounts, class setup, learning areas, and teacher allocations without leaving the admin desk.",
          },
          {
            label: "Operations",
            title: "Reporting, SMS, and registers",
            detail: "Track arrivals, send messages by filter, and download operational school lists for daily management.",
          },
          {
            label: "Public face",
            title: "Website and school communication",
            detail: "Keep published pages, updates, and visitor information aligned with what the school is doing internally.",
          },
        ],
      };
    case "head_teacher":
      return {
        shellClassName: "portal-teacher",
        kicker: "Academic command desk",
        title: "School principal dashboard",
        detail: "Focus on assessment quality, teacher allocation visibility, results coordination, and whole-academics follow-through.",
        spotlightLabel: "Primary mode",
        spotlightTitle: "Academic oversight workspace",
        spotlightDetail:
          "This view keeps the attention on learning areas, marks, merit coordination, and the academic health of the school.",
        lanes: [
          {
            label: "Oversight",
            title: "Academic structures",
            detail: "Review class setup, assignments, and learning area organization with a cleaner academics-first layout.",
          },
          {
            label: "Assessment",
            title: "Marks and exam flow",
            detail: "Coordinate exams, ensure entries are complete, and keep assessment work moving across classes.",
          },
          {
            label: "Results",
            title: "Merit lists and progress",
            detail: "Watch performance trends and prepare class or learning area merit outputs where needed.",
          },
        ],
      };
    case "teacher":
      return {
        shellClassName: "portal-teacher",
        kicker: teacherHasClassResponsibility ? "Teacher class and learning area workspace" : "Teacher learning area workspace",
        title: "Teacher dashboard",
        detail: teacherHasClassResponsibility
          ? "Handle class reporting, parent communication, and learning area marks from one teacher workspace shaped by your assignments."
          : "Stay inside your assigned learning areas, enter marks, and prepare merit outputs with a cleaner teacher workspace.",
        spotlightLabel: "Primary mode",
        spotlightTitle: teacherHasClassResponsibility
          ? "Class responsibility and learning area work"
          : "Learning area teaching desk",
        spotlightDetail: teacherHasClassResponsibility
          ? "This workspace combines class follow-through with the learning areas you teach in other classes."
          : "This workspace stays focused on the learning areas you teach, without opening class-responsibility tools you do not need.",
        lanes: teacherHasClassResponsibility
          ? [
              {
                label: "Class desk",
                title: "Reporting and learner follow-up",
                detail: "Record learner reporting and manage class-level follow-through where you hold class responsibility.",
              },
              {
                label: "Communication",
                title: "Class messaging",
                detail: "Send updates to parents for the class assigned under your class responsibility.",
              },
              {
                label: "Learning areas",
                title: "Marks and merit work",
                detail: "Enter marks and prepare class or learning area merit outputs across the classes you teach.",
              },
            ]
          : [
              {
                label: "Assignments",
                title: "Allocated learning areas",
                detail: "Keep attention on the learning areas and classes already assigned from the admin side.",
              },
              {
                label: "Assessment",
                title: "Marks entry desk",
                detail: "Enter learner marks cleanly and follow the exam flow for the areas you teach.",
              },
              {
                label: "Results",
                title: "Learning area merit output",
                detail: "Download and review learning area ranking without carrying unrelated class tools.",
              },
            ],
      };
    case "class_teacher":
    case "subject_teacher":
      return getDashboardTheme("teacher", teacherHasClassResponsibility);
    case "librarian":
      return {
        shellClassName: "portal-librarian",
        kicker: "Library registry workbench",
        title: "Librarian dashboard",
        detail: "Work from a calmer registry-style desk built for accession records, circulation, returns, and overdue follow-up.",
        spotlightLabel: "Primary mode",
        spotlightTitle: "Book registry and circulation bench",
        spotlightDetail:
          "The library view is arranged like a workbench so records, borrowers, and stock movement stay easy to trace.",
        lanes: [
          {
            label: "Registry",
            title: "Book accession and stock",
            detail: "Register titles, keep copies accurate, and maintain a dependable view of the collection.",
          },
          {
            label: "Circulation",
            title: "Issue, return, and track",
            detail: "Follow books borrowed by learners, teachers, or classes from one circulation-centered panel.",
          },
          {
            label: "Follow-up",
            title: "Overdue and availability",
            detail: "See what is out, what is back, and where action is needed without academic or admin distractions.",
          },
        ],
      };
    case "parent":
      return {
        shellClassName: "portal-parent",
        kicker: "Family portal",
        title: "Parent dashboard",
        detail: "Keep things simple: view learner details, recent reporting, and communication history in a lighter family-facing space.",
        spotlightLabel: "Primary mode",
        spotlightTitle: "Simple learner summary and follow-up",
        spotlightDetail:
          "This view removes school operations noise so parents only see what concerns their learner and communication trail.",
        lanes: [
          {
            label: "Learner",
            title: "Admission and class details",
            detail: "Confirm the learner record, class information, and boarding status from one easy summary area.",
          },
          {
            label: "Reporting",
            title: "Recent arrivals history",
            detail: "See when reporting happened and who accompanied the learner without moving through office screens.",
          },
          {
            label: "Messages",
            title: "Parent communication trail",
            detail: "Review recent school messages in a cleaner, family-friendly dashboard.",
          },
        ],
      };
    default:
      return {
        shellClassName: "portal-parent",
        kicker: "Portal workspace",
        title: "Role dashboard",
        detail: "Work only within the responsibilities of this role.",
        spotlightLabel: "Primary mode",
        spotlightTitle: "Focused role access",
        spotlightDetail: "Only the work connected to this role is shown here.",
        lanes: [],
      };
  }
}

function getErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const record = payload as { detail?: unknown; message?: unknown };
    if (typeof record.detail === "string") {
      return record.detail;
    }
    if (typeof record.message === "string") {
      return record.message;
    }
  }
  return `Request failed (${status}).`;
}

function EmptyState({ text }: { text: string }) {
  return <p className="empty-state">{text}</p>;
}

function PortalSection({
  id,
  kicker,
  title,
  detail,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section className="portal-panel" id={id}>
      <div className="section-heading">
        <p className="section-kicker">{kicker}</p>
        <h2>{title}</h2>
        <p className="portal-detail">{detail}</p>
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article className="stat-card">
      <p className="section-kicker">{label}</p>
      <h3>{value}</h3>
      <p>{detail}</p>
    </article>
  );
}

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [portalNotice, setPortalNotice] = useState<PortalNotice | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() => getStoredSessionToken());
  const [loggedInUser, setLoggedInUser] = useState<CurrentUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState("setup");
  const [activePublicSection, setActivePublicSection] = useState<PublicSection>("home");

  const [publicPages, setPublicPages] = useState<WebsitePage[]>([]);
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [areas, setAreas] = useState<LearningArea[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classResponsibilities, setClassResponsibilities] = useState<ClassResponsibility[]>([]);
  const [recentArrivals, setRecentArrivals] = useState<RecentArrival[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
  const [timetableRooms, setTimetableRooms] = useState<TimetableRoom[]>([]);
  const [timetablePeriods, setTimetablePeriods] = useState<TimetablePeriod[]>([]);
  const [timetableRequirements, setTimetableRequirements] = useState<TimetableRequirement[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [timetableChecks, setTimetableChecks] = useState<TimetableCheck[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<SmsDeliveryLog[]>([]);
  const [managedPages, setManagedPages] = useState<WebsitePage[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<Loan[]>([]);
  const [meritList, setMeritList] = useState<MeritListResponse | null>(null);
  const [examAnalysis, setExamAnalysis] = useState<ExamAnalysisResponse | null>(null);
  const [parentSummary, setParentSummary] = useState<ParentSummary | null>(null);
  const [reportingView, setReportingView] = useState<"report" | "register">("report");
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [editingLearnerId, setEditingLearnerId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showLearnerDatabase, setShowLearnerDatabase] = useState(false);
  const [showClassLearnerSummary, setShowClassLearnerSummary] = useState(false);
  const [showLearningAreaList, setShowLearningAreaList] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showTeacherMap, setShowTeacherMap] = useState(false);
  const [showAssignmentList, setShowAssignmentList] = useState(false);
  const [selectedExamCycleKey, setSelectedExamCycleKey] = useState("");
  const [selectedExamClassId, setSelectedExamClassId] = useState("");
  const [selectedExamAreaId, setSelectedExamAreaId] = useState("");
  const [markLearnerSearch, setMarkLearnerSearch] = useState("");
  const [markEntryTab, setMarkEntryTab] = useState<"enter" | "entered">("enter");
  const [examPageView, setExamPageView] = useState<"overview" | "enter" | "entered">("overview");
  const [learnerMarkDrafts, setLearnerMarkDrafts] = useState<Record<string, string>>({});
  const [liveMeritList, setLiveMeritList] = useState<MeritListResponse | null>(null);

  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "teacher" as UserRole,
    isActive: true,
  });
  const [classForm, setClassForm] = useState({ name: "", stream: "" });
  const [areaForm, setAreaForm] = useState({
    classIds: [] as string[],
    name: "",
    minMarks: "0",
    maxMarks: "100",
  });
  const [assignmentForm, setAssignmentForm] = useState({
    teacherUserId: "",
    classId: "",
    learningAreaId: "",
  });
  const [classTeacherForm, setClassTeacherForm] = useState({
    teacherUserId: "",
    classId: "",
  });
  const [learnerForm, setLearnerForm] = useState({
    admissionNo: "",
    fullName: "",
    classId: "",
    parentFullName: "",
    parentPhoneNumber: "",
    boardingStatus: "Day Scholar",
    transportMode: "School Bus",
  });
  const [arrivalForm, setArrivalForm] = useState({
    learnerId: "",
    accompaniedSource: "parent",
    accompaniedBy: "",
    accompaniedPhone: "",
    arrivalTransportMode: "School Bus",
    sendSms: true,
  });
  const [listClassId, setListClassId] = useState("");
  const [examForm, setExamForm] = useState({
    name: "",
    examType: "Opener",
    examMonth: new Date().toLocaleString("en-US", { month: "long" }),
    term: "Term 1",
    year: String(new Date().getFullYear()),
    scope: "single" as "single" | "multiple" | "whole_school",
    classIds: [] as string[],
    learningAreaName: "",
    learningAreaScope: "specific" as "all" | "specific",
    learningAreaNames: [] as string[],
    maxMarks: "100",
    cbcFormulaOption: "standard",
    marksDeadline: "",
  });
  const [examFilters, setExamFilters] = useState({
    year: "",
    term: "",
    month: "",
    type: "",
    classId: "",
  });
  const [learnerFilters, setLearnerFilters] = useState({
    search: "",
    classId: "",
    status: "",
    transportMode: "",
  });
  const [classSplitForm, setClassSplitForm] = useState({
    sourceClassId: "",
    firstClassName: "",
    secondClassName: "",
    learnerPlacements: {} as Record<string, "first" | "second">,
  });
  const [markForm, setMarkForm] = useState({
    learnerId: "",
    marks: "",
  });
  const [meritForm, setMeritForm] = useState({
    classId: "",
    examId: "",
    learningAreaId: "",
  });
  const [timetableRoomForm, setTimetableRoomForm] = useState({
    name: "",
    roomType: "",
    capacity: "",
  });
  const [timetablePeriodForm, setTimetablePeriodForm] = useState({
    name: "",
    startTime: "",
    endTime: "",
    sortOrder: "1",
    isBreak: false,
  });
  const [timetableRequirementForm, setTimetableRequirementForm] = useState({
    classId: "",
    learningAreaId: "",
    teacherUserId: "",
    periodsPerWeek: "5",
    maxPeriodsPerDay: "1",
    preferredRoomId: "",
    allowDoublePeriods: false,
    notes: "",
  });
  const [timetableSlotForm, setTimetableSlotForm] = useState({
    dayOfWeek: "Monday",
    periodId: "",
    classId: "",
    learningAreaId: "",
    teacherUserId: "",
    roomId: "",
    requirementId: "",
    isLocked: false,
    notes: "",
  });
  const [timetableClassFilter, setTimetableClassFilter] = useState("");
  const [timetableTeacherFilter, setTimetableTeacherFilter] = useState("");
  const [templateForm, setTemplateForm] = useState({
    name: "",
    scope: "admin",
    messageBody: "",
  });
  const [broadcastForm, setBroadcastForm] = useState({
    audienceFilter: "whole_school",
    classId: "",
    messageBody: "",
    templateId: "",
  });
  const [classMessageForm, setClassMessageForm] = useState({
    classId: "",
    messageBody: "",
  });
  const [pageForm, setPageForm] = useState({
    slug: "",
    title: "",
    body: "",
    isPublished: false,
  });
  const [bookForm, setBookForm] = useState({
    accessionNo: "",
    title: "",
    author: "",
    category: "",
    totalCopies: "1",
  });
  const [loanForm, setLoanForm] = useState({
    bookId: "",
    borrowerType: "learner" as "learner" | "teacher" | "class",
    learnerId: "",
    teacherUserId: "",
    classId: "",
    dueAt: "",
  });
  const [parentLookupForm, setParentLookupForm] = useState({
    admissionNo: "",
    phoneNumber: "",
  });

  const normalizedLoggedInRole = useMemo(() => normalizeUserRole(loggedInUser?.role ?? null), [loggedInUser?.role]);
  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const areaMap = useMemo(() => new Map(areas.map((item) => [item.id, item])), [areas]);
  const userMap = useMemo(() => new Map(directory.map((item) => [item.id, item])), [directory]);
  const timetableRoomMap = useMemo(() => new Map(timetableRooms.map((item) => [item.id, item])), [timetableRooms]);
  const timetablePeriodMap = useMemo(() => new Map(timetablePeriods.map((item) => [item.id, item])), [timetablePeriods]);
  const timetableRequirementMap = useMemo(
    () => new Map(timetableRequirements.map((item) => [item.id, item])),
    [timetableRequirements],
  );
  const learnerMap = useMemo(() => new Map(learners.map((item) => [item.id, item])), [learners]);
  const bookMap = useMemo(() => new Map(books.map((item) => [item.id, item])), [books]);
  const selectedArrivalLearner = useMemo(
    () => learners.find((item) => item.id === Number(arrivalForm.learnerId)) ?? null,
    [arrivalForm.learnerId, learners],
  );
  const publicNewsItems = useMemo(
    () =>
      publicPages.length
        ? publicPages.slice(0, 3).map((page) => ({
            category: "School Update",
            title: page.title,
            summary: page.body ? `${page.body.slice(0, 170)}...` : "New update from the Tumaini website.",
          }))
        : fallbackNews,
    [publicPages],
  );
  const headlineFeed = useMemo(() => publicNewsItems.map((item) => item.title), [publicNewsItems]);
  const selectedLoginRoleMeta = useMemo(
    () => roleCatalog.find((item) => item.value === loginRole) ?? null,
    [loginRole],
  );
  const showLoginScreen = !loggedInUser && isLoginOpen;
  const showPublicWebsite = !loggedInUser && !isLoginOpen;
  const classResponsibilityAssignments = useMemo(
    () => [
      ...classResponsibilities.map((item) => ({
        id: item.id,
        teacher_user_id: item.teacher_user_id,
        class_id: item.class_id,
        learning_area_id: 0,
        is_class_teacher: true,
      })),
      ...assignments.filter((item) => item.is_class_teacher),
    ],
    [assignments, classResponsibilities],
  );
  const teacherHasClassResponsibility = isTeacherRole(normalizedLoggedInRole) && classResponsibilityAssignments.length > 0;
  const roleModules = useMemo(
    () => getModulesForRole(normalizedLoggedInRole, teacherHasClassResponsibility),
    [normalizedLoggedInRole, teacherHasClassResponsibility],
  );
  const activeModuleLabel = roleModules.find((module) => module.id === activeModule)?.label ?? "Dashboard";
  const portalUserInitial = loggedInUser?.full_name.trim().charAt(0).toUpperCase() || "T";
  const dashboardTheme = useMemo(
    () => getDashboardTheme(normalizedLoggedInRole, teacherHasClassResponsibility),
    [normalizedLoggedInRole, teacherHasClassResponsibility],
  );
  const classMessageOptions = useMemo(() => {
    if (normalizedLoggedInRole === "admin" || normalizedLoggedInRole === "head_teacher") {
      return classes.map((classRoom) => ({ id: classRoom.id, label: classRoom.name }));
    }

    const seen = new Set<number>();
    return classResponsibilityAssignments
      .filter((assignment) => {
        if (seen.has(assignment.class_id)) {
          return false;
        }
        seen.add(assignment.class_id);
        return true;
      })
      .map((assignment) => ({
        id: assignment.class_id,
        label: classMap.get(assignment.class_id)?.name ?? `Class ${assignment.class_id}`,
      }));
  }, [classMap, classResponsibilityAssignments, classes, normalizedLoggedInRole]);

  const canManageSetup = normalizedLoggedInRole === "admin";
  const canManageReporting = normalizedLoggedInRole === "admin" || teacherHasClassResponsibility;
  const canManageAcademics =
    normalizedLoggedInRole === "admin" ||
    normalizedLoggedInRole === "head_teacher" ||
    isTeacherRole(normalizedLoggedInRole);
  const canManageTimetable = normalizedLoggedInRole === "admin" || normalizedLoggedInRole === "head_teacher";
  const canViewTimetable = canManageAcademics;
  const canManageMessaging = normalizedLoggedInRole === "admin" || teacherHasClassResponsibility;
  const canManageBroadcasts = normalizedLoggedInRole === "admin";
  const canManageLibrary = normalizedLoggedInRole === "librarian";
  const canManageWebsite = normalizedLoggedInRole === "admin";

  const teacherOptions = useMemo(
    () => directory.filter((person) => normalizeUserRole(person.role) === "teacher"),
    [directory],
  );
  const timetableLearningAreaOptions = useMemo(
    () =>
      timetableSlotForm.classId
        ? areas
            .filter((area) => area.class_id === Number(timetableSlotForm.classId))
            .sort((first, second) => first.name.localeCompare(second.name))
        : [],
    [areas, timetableSlotForm.classId],
  );
  const timetableTeacherOptions = useMemo(() => {
    if (!timetableSlotForm.classId || !timetableSlotForm.learningAreaId) {
      return teacherOptions;
    }
    const assignedTeacherIds = new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.class_id === Number(timetableSlotForm.classId) &&
            assignment.learning_area_id === Number(timetableSlotForm.learningAreaId),
        )
        .map((assignment) => assignment.teacher_user_id),
    );
    return teacherOptions.filter((teacher) => assignedTeacherIds.has(teacher.id));
  }, [assignments, teacherOptions, timetableSlotForm.classId, timetableSlotForm.learningAreaId]);
  const timetableRequirementLearningAreaOptions = useMemo(
    () =>
      timetableRequirementForm.classId
        ? areas
            .filter((area) => area.class_id === Number(timetableRequirementForm.classId))
            .sort((first, second) => first.name.localeCompare(second.name))
        : [],
    [areas, timetableRequirementForm.classId],
  );
  const timetableRequirementTeacherOptions = useMemo(() => {
    if (!timetableRequirementForm.classId || !timetableRequirementForm.learningAreaId) {
      return teacherOptions;
    }
    const assignedTeacherIds = new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.class_id === Number(timetableRequirementForm.classId) &&
            assignment.learning_area_id === Number(timetableRequirementForm.learningAreaId),
        )
        .map((assignment) => assignment.teacher_user_id),
    );
    return teacherOptions.filter((teacher) => assignedTeacherIds.has(teacher.id));
  }, [assignments, teacherOptions, timetableRequirementForm.classId, timetableRequirementForm.learningAreaId]);
  const requirementCards = useMemo(
    () =>
      timetableRequirements.map((requirement) => {
        const placedCount = timetableSlots.filter((slot) => slot.requirement_id === requirement.id).length;
        return {
          requirement,
          placedCount,
          remainingCount: Math.max(requirement.periods_per_week - placedCount, 0),
        };
      }),
    [timetableRequirements, timetableSlots],
  );
  const filteredTimetableSlots = useMemo(
    () =>
      timetableSlots.filter((slot) => {
        const matchesClass = !timetableClassFilter || slot.class_id === Number(timetableClassFilter);
        const matchesTeacher =
          normalizedLoggedInRole === "teacher"
            ? true
            : !timetableTeacherFilter || slot.teacher_user_id === Number(timetableTeacherFilter);
        return matchesClass && matchesTeacher;
      }),
    [normalizedLoggedInRole, timetableClassFilter, timetableSlots, timetableTeacherFilter],
  );
  const timetableSlotsByCell = useMemo(() => {
    const map = new Map<string, TimetableSlot[]>();
    filteredTimetableSlots.forEach((slot) => {
      const key = `${slot.day_of_week}:${slot.period_id}`;
      map.set(key, [...(map.get(key) ?? []), slot]);
    });
    return map;
  }, [filteredTimetableSlots]);
  const areasForAssignmentClass = useMemo(
    () => (assignmentForm.classId ? areas.filter((item) => item.class_id === Number(assignmentForm.classId)) : areas),
    [assignmentForm.classId, areas],
  );
  const learnersByClass = useMemo(
    () =>
      [...learners].sort((first, second) => {
        const firstClass = first.class_name ?? "";
        const secondClass = second.class_name ?? "";
        if (firstClass !== secondClass) {
          return firstClass.localeCompare(secondClass);
        }
        return first.full_name.localeCompare(second.full_name);
      }),
    [learners],
  );
  const filteredLearners = useMemo(() => {
    const search = learnerFilters.search.trim().toLowerCase();
    return learnersByClass.filter((learner) => {
      const matchesSearch =
        !search ||
        learner.full_name.toLowerCase().includes(search) ||
        learner.admission_no.toLowerCase().includes(search) ||
        (learner.parent_full_name ?? "").toLowerCase().includes(search);
      const matchesClass = !learnerFilters.classId || learner.class_id === Number(learnerFilters.classId);
      const matchesStatus = !learnerFilters.status || learner.boarding_status === learnerFilters.status;
      const matchesTransport = !learnerFilters.transportMode || learner.transport_mode === learnerFilters.transportMode;
      return matchesSearch && matchesClass && matchesStatus && matchesTransport;
    });
  }, [learnerFilters, learnersByClass]);
  const learnersForSplitSource = useMemo(
    () =>
      classSplitForm.sourceClassId
        ? learnersByClass.filter((learner) => learner.class_id === Number(classSplitForm.sourceClassId))
        : [],
    [classSplitForm.sourceClassId, learnersByClass],
  );
  const splitFirstLearnerIds = useMemo(
    () =>
      learnersForSplitSource
        .filter((learner) => classSplitForm.learnerPlacements[String(learner.id)] === "first")
        .map((learner) => String(learner.id)),
    [classSplitForm.learnerPlacements, learnersForSplitSource],
  );
  const splitSecondLearnerIds = useMemo(
    () =>
      learnersForSplitSource
        .filter((learner) => classSplitForm.learnerPlacements[String(learner.id)] === "second")
        .map((learner) => String(learner.id)),
    [classSplitForm.learnerPlacements, learnersForSplitSource],
  );
  const examClassIds = useMemo(() => {
    if (examForm.scope === "whole_school") {
      return classes.map((classRoom) => String(classRoom.id));
    }
    return examForm.classIds;
  }, [classes, examForm.classIds, examForm.scope]);
  const learningAreaNameOptions = useMemo(
    () => Array.from(new Set(areas.map((area) => area.name))).sort((first, second) => first.localeCompare(second)),
    [areas],
  );
  const assignedExamOptions = useMemo(() => {
    if (normalizedLoggedInRole === "admin" || normalizedLoggedInRole === "head_teacher") {
      return exams;
    }
    const allowedPairs = new Set(assignments.map((assignment) => `${assignment.class_id}:${assignment.learning_area_id}`));
    const responsibleClassIds = new Set(classResponsibilityAssignments.map((assignment) => assignment.class_id));
    return exams.filter(
      (exam) => allowedPairs.has(`${exam.class_id}:${exam.learning_area_id}`) || responsibleClassIds.has(exam.class_id),
    );
  }, [assignments, classResponsibilityAssignments, exams, normalizedLoggedInRole]);
  const markableExamOptions = useMemo(() => {
    if (normalizedLoggedInRole === "admin" || normalizedLoggedInRole === "head_teacher") {
      return exams;
    }
    const allowedPairs = new Set(assignments.map((assignment) => `${assignment.class_id}:${assignment.learning_area_id}`));
    return exams.filter((exam) => allowedPairs.has(`${exam.class_id}:${exam.learning_area_id}`));
  }, [assignments, exams, normalizedLoggedInRole]);
  const runningExamOptions = useMemo(
    () =>
      markableExamOptions.filter(
        (exam) => exam.status === "active" && (!exam.marks_deadline || new Date(exam.marks_deadline).getTime() >= Date.now()),
      ),
    [markableExamOptions],
  );
  const filteredExams = useMemo(
    () =>
      assignedExamOptions.filter((exam) => {
        const matchesYear = !examFilters.year || exam.year === Number(examFilters.year);
        const matchesTerm = !examFilters.term || exam.term === examFilters.term;
        const matchesMonth = !examFilters.month || exam.exam_month === examFilters.month;
        const matchesType = !examFilters.type || exam.exam_type === examFilters.type;
        const matchesClass = !examFilters.classId || exam.class_id === Number(examFilters.classId);
        return matchesYear && matchesTerm && matchesMonth && matchesType && matchesClass;
      }),
    [assignedExamOptions, examFilters],
  );
  const filteredExamCycles = useMemo(() => buildExamCycles(filteredExams), [filteredExams]);
  const runningExamCycles = useMemo(() => buildExamCycles(runningExamOptions), [runningExamOptions]);
  const generatedExamCbcFormula = useMemo(
    () => CBC_FORMULA_OPTIONS.find((option) => option.id === examForm.cbcFormulaOption)?.formula ?? CBC_FORMULA_OPTIONS[0].formula,
    [examForm.cbcFormulaOption],
  );
  const markExamSource = normalizedLoggedInRole === "admin" || normalizedLoggedInRole === "head_teacher" ? markableExamOptions : runningExamOptions;
  const markExamCycles = useMemo(() => buildExamCycles(markExamSource), [markExamSource]);
  const selectedMarkCycle = useMemo(
    () => markExamCycles.find((cycle) => cycle.key === selectedExamCycleKey) ?? null,
    [markExamCycles, selectedExamCycleKey],
  );
  const selectedMarkClassIdNumber = selectedExamClassId ? Number(selectedExamClassId) : null;
  const selectedMarkAreaIdNumber = selectedExamAreaId ? Number(selectedExamAreaId) : null;
  const classesForSelectedMarkCycle = useMemo(() => {
    if (!selectedMarkCycle) {
      return [];
    }
    return selectedMarkCycle.classIds
      .map((classId) => classMap.get(classId))
      .filter((classRoom): classRoom is ClassRoom => Boolean(classRoom))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [classMap, selectedMarkCycle]);
  const areasForSelectedMarkClass = useMemo(() => {
    if (!selectedMarkCycle || selectedMarkClassIdNumber === null) {
      return [];
    }
    const areaIds = selectedMarkCycle.exams
      .filter((exam) => exam.class_id === selectedMarkClassIdNumber)
      .map((exam) => exam.learning_area_id);
    return Array.from(new Set(areaIds))
      .map((areaId) => areaMap.get(areaId))
      .filter((area): area is LearningArea => Boolean(area))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [areaMap, selectedMarkClassIdNumber, selectedMarkCycle]);
  const selectedMarkExam = useMemo(() => {
    if (!selectedMarkCycle || selectedMarkClassIdNumber === null || selectedMarkAreaIdNumber === null) {
      return null;
    }
    return (
      selectedMarkCycle.exams.find(
        (exam) => exam.class_id === selectedMarkClassIdNumber && exam.learning_area_id === selectedMarkAreaIdNumber,
      ) ?? null
    );
  }, [selectedMarkAreaIdNumber, selectedMarkClassIdNumber, selectedMarkCycle]);
  const enteredMarksForSelectedExam = useMemo(
    () => (selectedMarkExam ? markEntries.filter((entry) => entry.exam_id === selectedMarkExam.id) : []),
    [markEntries, selectedMarkExam],
  );
  const enteredLearnerIdsForSelectedExam = useMemo(
    () => new Set(enteredMarksForSelectedExam.map((entry) => entry.learner_id)),
    [enteredMarksForSelectedExam],
  );
  const learnersForSelectedMarkClass = useMemo(
    () =>
      selectedMarkClassIdNumber === null
        ? []
        : learners
            .filter((learner) => learner.class_id === selectedMarkClassIdNumber)
            .sort((first, second) => first.full_name.localeCompare(second.full_name)),
    [learners, selectedMarkClassIdNumber],
  );
  const learnersForMarkEntry = useMemo(() => {
    const search = markLearnerSearch.trim().toLowerCase();
    return learnersForSelectedMarkClass.filter((learner) => {
      const hasNoMarksYet = !enteredLearnerIdsForSelectedExam.has(learner.id);
      const matchesSearch =
        !search ||
        learner.full_name.toLowerCase().includes(search) ||
        learner.admission_no.toLowerCase().includes(search);
      return hasNoMarksYet && matchesSearch;
    });
  }, [enteredLearnerIdsForSelectedExam, learnersForSelectedMarkClass, markLearnerSearch]);
  const canViewSelectedClassMerit = useMemo(() => {
    if (selectedMarkClassIdNumber === null) {
      return false;
    }
    if (normalizedLoggedInRole === "admin" || normalizedLoggedInRole === "head_teacher") {
      return true;
    }
    return classResponsibilityAssignments.some((assignment) => assignment.class_id === selectedMarkClassIdNumber);
  }, [classResponsibilityAssignments, normalizedLoggedInRole, selectedMarkClassIdNumber]);
  const examsForMeritClass = useMemo(
    () =>
      meritForm.classId
        ? assignedExamOptions.filter((item) => item.class_id === Number(meritForm.classId))
        : assignedExamOptions,
    [assignedExamOptions, meritForm.classId],
  );
  const areasForMeritClass = useMemo(
    () => (meritForm.classId ? areas.filter((item) => item.class_id === Number(meritForm.classId)) : areas),
    [meritForm.classId, areas],
  );

  async function apiRequest<T>(
    path: string,
    init: RequestInit = {},
    tokenOverride: string | null | undefined = undefined,
  ): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    const activeToken = tokenOverride === undefined ? sessionToken : tokenOverride;

    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (activeToken) {
      headers.set("Authorization", `Bearer ${activeToken}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      throw new Error(getErrorMessage(payload, response.status));
    }

    return payload as T;
  }

  async function safeLoad<T>(path: string, fallback: T, tokenOverride: string | null | undefined = undefined) {
    try {
      return await apiRequest<T>(path, {}, tokenOverride);
    } catch {
      return fallback;
    }
  }

  function resetPortalData() {
    setUsers([]);
    setDirectory([]);
    setClasses([]);
    setAreas([]);
    setLearners([]);
    setAssignments([]);
    setRecentArrivals([]);
    setExams([]);
    setMarkEntries([]);
    setTimetableRooms([]);
    setTimetablePeriods([]);
    setTimetableSlots([]);
    setTemplates([]);
    setDeliveryLogs([]);
    setManagedPages([]);
    setBooks([]);
    setLoans([]);
    setOverdueLoans([]);
    setMeritList(null);
    setExamAnalysis(null);
    setLiveMeritList(null);
    setParentSummary(null);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
    localStorage.removeItem(NAME_STORAGE_KEY);
    localStorage.removeItem(SESSION_EXPIRES_STORAGE_KEY);
    setSessionToken(null);
    setLoggedInUser(null);
    setIsLoginOpen(false);
    setLoginRole("");
    setFeedback(null);
    setPortalNotice(null);
    setReportingView("report");
    setActiveModule("setup");
    resetPortalData();
  }

  function openLoginScreen() {
    setFeedback(null);
    setPassword("");
    setIsLoginOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeLoginScreen() {
    setFeedback(null);
    setPassword("");
    setIsLoginOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function restoreSession(token: string) {
    const expiresAt = Number(localStorage.getItem(SESSION_EXPIRES_STORAGE_KEY));
    if (!expiresAt || expiresAt <= Date.now()) {
      clearSession();
      setSessionChecked(true);
      return;
    }
    try {
      const me = await apiRequest<CurrentUser>("/api/auth/me", {}, token);
      extendStoredSession();
      setLoggedInUser({ ...me, role: normalizeUserRole(me.role) ?? me.role });
    } catch {
      clearSession();
    } finally {
      setSessionChecked(true);
    }
  }

  async function loadPublicPages() {
    const pages = await safeLoad<WebsitePage[]>("/api/website/public/pages", [], null);
    setPublicPages(pages);
  }

  async function loadPortalData(role: UserRole, token: string) {
    setPortalLoading(true);

    const normalizedRole = normalizeUserRole(role);
    const roleCanManageSetup = normalizedRole === "admin";
    const roleCanManageAcademics =
      normalizedRole === "admin" || normalizedRole === "head_teacher" || isTeacherRole(normalizedRole);
    const roleCanViewTimetable = roleCanManageAcademics;
    const roleMayNeedTeacherMessaging = normalizedRole === "admin" || isTeacherRole(normalizedRole);
    const roleCanManageLibrary = normalizedRole === "librarian";
    const roleCanManageWebsite = normalizedRole === "admin";

    const commonClasses =
      normalizedRole === "parent" ? Promise.resolve([] as ClassRoom[]) : safeLoad<ClassRoom[]>("/api/academics/classes", [], token);
    const commonAreas =
      normalizedRole === "parent" ? Promise.resolve([] as LearningArea[]) : safeLoad<LearningArea[]>("/api/academics/learning-areas", [], token);
    const commonLearners =
      normalizedRole === "parent" ? Promise.resolve([] as Learner[]) : safeLoad<Learner[]>("/api/reporting/learners", [], token);
    const commonDirectory =
      normalizedRole === "parent" ? Promise.resolve([] as DirectoryUser[]) : safeLoad<DirectoryUser[]>("/api/auth/directory", [], token);
    const commonArrivals =
      normalizedRole === "parent" ? Promise.resolve([] as RecentArrival[]) : safeLoad<RecentArrival[]>("/api/reporting/arrivals/recent", [], token);
    const commonExams =
      normalizedRole === "parent" ? Promise.resolve([] as Exam[]) : safeLoad<Exam[]>("/api/academics/exams", [], token);
    const commonMarks =
      roleCanManageAcademics ? safeLoad<MarkEntry[]>("/api/academics/marks", [], token) : Promise.resolve([] as MarkEntry[]);
    const timetableRoomsPromise =
      roleCanViewTimetable ? safeLoad<TimetableRoom[]>("/api/timetable/rooms", [], token) : Promise.resolve([] as TimetableRoom[]);
    const timetablePeriodsPromise =
      roleCanViewTimetable ? safeLoad<TimetablePeriod[]>("/api/timetable/periods", [], token) : Promise.resolve([] as TimetablePeriod[]);
    const timetableRequirementsPromise =
      roleCanViewTimetable
        ? safeLoad<TimetableRequirement[]>("/api/timetable/requirements", [], token)
        : Promise.resolve([] as TimetableRequirement[]);
    const timetableSlotsPromise =
      roleCanViewTimetable ? safeLoad<TimetableSlot[]>("/api/timetable/slots", [], token) : Promise.resolve([] as TimetableSlot[]);
    const timetableChecksPromise =
      normalizedRole === "admin" || normalizedRole === "head_teacher"
        ? safeLoad<{ checks: TimetableCheck[] }>("/api/timetable/check", { checks: [] }, token)
        : Promise.resolve({ checks: [] as TimetableCheck[] });

    const usersPromise = roleCanManageSetup ? safeLoad<DirectoryUser[]>("/api/auth/users", [], token) : Promise.resolve([] as DirectoryUser[]);
    const assignmentsPromise = roleCanManageAcademics
      ? safeLoad<Assignment[]>("/api/academics/assignments/my", [], token)
      : Promise.resolve([] as Assignment[]);
    const classResponsibilitiesPromise = roleCanManageAcademics
      ? safeLoad<ClassResponsibility[]>("/api/academics/class-responsibilities", [], token)
      : Promise.resolve([] as ClassResponsibility[]);
    const templatesPromise = roleMayNeedTeacherMessaging
      ? safeLoad<SmsTemplate[]>("/api/messaging/templates", [], token)
      : Promise.resolve([] as SmsTemplate[]);
    const logsPromise =
      roleMayNeedTeacherMessaging || normalizedRole === "head_teacher"
        ? safeLoad<SmsDeliveryLog[]>("/api/messaging/delivery-logs", [], token)
        : Promise.resolve([] as SmsDeliveryLog[]);
    const booksPromise = roleCanManageLibrary ? safeLoad<Book[]>("/api/library/books", [], token) : Promise.resolve([] as Book[]);
    const loansPromise = roleCanManageLibrary ? safeLoad<Loan[]>("/api/library/loans", [], token) : Promise.resolve([] as Loan[]);
    const overduePromise =
      roleCanManageLibrary ? safeLoad<Loan[]>("/api/library/loans/overdue", [], token) : Promise.resolve([] as Loan[]);
    const pagesPromise =
      roleCanManageWebsite ? safeLoad<WebsitePage[]>("/api/website/pages", [], token) : Promise.resolve([] as WebsitePage[]);

    const [
      loadedClasses,
      loadedAreas,
      loadedLearners,
      loadedDirectory,
      loadedArrivals,
      loadedExams,
      loadedMarks,
      loadedTimetableRooms,
      loadedTimetablePeriods,
      loadedTimetableRequirements,
      loadedTimetableSlots,
      loadedTimetableChecks,
      loadedUsers,
      loadedAssignments,
      loadedClassResponsibilities,
      loadedTemplates,
      loadedLogs,
      loadedBooks,
      loadedLoans,
      loadedOverdue,
      loadedPages,
    ] = await Promise.all([
      commonClasses,
      commonAreas,
      commonLearners,
      commonDirectory,
      commonArrivals,
      commonExams,
      commonMarks,
      timetableRoomsPromise,
      timetablePeriodsPromise,
      timetableRequirementsPromise,
      timetableSlotsPromise,
      timetableChecksPromise,
      usersPromise,
      assignmentsPromise,
      classResponsibilitiesPromise,
      templatesPromise,
      logsPromise,
      booksPromise,
      loansPromise,
      overduePromise,
      pagesPromise,
    ]);

    setClasses(loadedClasses);
    setAreas(loadedAreas);
    setLearners(loadedLearners);
    setDirectory(loadedDirectory.map((item) => ({ ...item, role: normalizeUserRole(item.role) ?? item.role })));
    setRecentArrivals(loadedArrivals);
    setExams(loadedExams);
    setMarkEntries(loadedMarks);
    setTimetableRooms(loadedTimetableRooms);
    setTimetablePeriods(loadedTimetablePeriods);
    setTimetableRequirements(loadedTimetableRequirements);
    setTimetableSlots(loadedTimetableSlots);
    setTimetableChecks(loadedTimetableChecks.checks);
    setUsers(loadedUsers.map((item) => ({ ...item, role: normalizeUserRole(item.role) ?? item.role })));
    setAssignments(loadedAssignments);
    setClassResponsibilities(loadedClassResponsibilities);
    setTemplates(loadedTemplates);
    setDeliveryLogs(loadedLogs);
    setBooks(loadedBooks);
    setLoans(loadedLoans);
    setOverdueLoans(loadedOverdue);
    setManagedPages(loadedPages);
    setPortalLoading(false);
  }

  async function refreshPortalData() {
    if (sessionToken && loggedInUser) {
      await loadPortalData(loggedInUser.role, sessionToken);
    }
  }

  async function runAction<T>(key: string, action: () => Promise<T>, successText?: string) {
    setActionBusy(key);
    setPortalNotice(null);
    try {
      const result = await action();
      if (successText) {
        setPortalNotice({ kind: "success", text: successText });
      }
      return result;
    } catch (error) {
      setPortalNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
      return null;
    } finally {
      setActionBusy(null);
    }
  }

  function scrollToModule(moduleId: string) {
    setActiveModule(moduleId);
    document.getElementById(`portal-${moduleId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    void loadPublicPages();
  }, []);

  useEffect(() => {
    if (sessionToken) {
      void restoreSession(sessionToken);
      return;
    }
    setSessionChecked(true);
  }, []);

  useEffect(() => {
    if (!sessionToken || !loggedInUser) {
      return;
    }
    setIsLoginOpen(false);
    setActiveModule(getModulesForRole(normalizeUserRole(loggedInUser.role), teacherHasClassResponsibility)[0]?.id ?? "portal");
    void loadPortalData(loggedInUser.role, sessionToken);
  }, [loggedInUser, sessionToken, teacherHasClassResponsibility]);

  useEffect(() => {
    if (!sessionToken || !loggedInUser) {
      return;
    }

    let activityThrottle: number | null = null;
    let timeoutId: number | null = null;

    const scheduleLogout = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      const expiresAt = Number(localStorage.getItem(SESSION_EXPIRES_STORAGE_KEY));
      const delay = expiresAt - Date.now();
      if (!expiresAt || delay <= 0) {
        clearSession();
        setFeedback("Your session expired after 30 minutes. Please sign in again.");
        return;
      }
      timeoutId = window.setTimeout(() => {
        clearSession();
        setFeedback("Your session expired after 30 minutes. Please sign in again.");
      }, delay);
    };

    const handleActivity = () => {
      if (activityThrottle) {
        return;
      }
      activityThrottle = window.setTimeout(() => {
        activityThrottle = null;
      }, 1000);
      extendStoredSession();
      scheduleLogout();
    };

    extendStoredSession();
    scheduleLogout();
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (activityThrottle) {
        window.clearTimeout(activityThrottle);
      }
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [sessionToken, loggedInUser]);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setPortalNotice(null);
    setActionBusy("login");

    try {
      if (!loginRole) {
        throw new Error("Choose the dashboard role you want to enter.");
      }

      const loginPayload = await apiRequest<LoginResponse>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
        null,
      );

      const me = await apiRequest<CurrentUser>("/api/auth/me", {}, loginPayload.access_token);
      const normalizedMe = { ...me, role: normalizeUserRole(me.role) ?? me.role };
      if (me.role !== loginRole) {
        setPassword("");
        if (normalizedMe.role !== loginRole) {
          throw new Error(`This account belongs to the ${formatRoleLabel(normalizedMe.role)} dashboard. Choose that role to continue.`);
        }
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, loginPayload.access_token);
      localStorage.setItem(ROLE_STORAGE_KEY, normalizedMe.role);
      localStorage.setItem(NAME_STORAGE_KEY, normalizedMe.full_name);
      extendStoredSession();
      setSessionToken(loginPayload.access_token);
      setLoggedInUser(normalizedMe);
      setFeedback(`Signed in successfully as ${normalizedMe.full_name}.`);
      setPassword("");
      setSessionChecked(true);
    } catch (error) {
      setLoggedInUser(null);
      setFeedback(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setActionBusy(null);
    }
  };

  const submitUserCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      editingUserId ? "update-user" : "create-user",
      () =>
        apiRequest(editingUserId ? `/api/auth/users/${editingUserId}` : "/api/auth/users", {
          method: editingUserId ? "PUT" : "POST",
          body: JSON.stringify({
            full_name: userForm.fullName,
            email: userForm.email,
            password: editingUserId && !userForm.password ? null : userForm.password,
            role: userForm.role,
            is_active: userForm.isActive,
          }),
        }),
      editingUserId ? `${userForm.fullName} was updated.` : `${userForm.fullName} is now in the system.`,
    );
    if (result) {
      setUserForm({ fullName: "", email: "", password: "", role: "teacher", isActive: true });
      setEditingUserId(null);
      await refreshPortalData();
    }
  };

  const submitClassCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      editingClassId ? "update-class" : "create-class",
      () =>
        apiRequest(editingClassId ? `/api/academics/classes/${editingClassId}` : "/api/academics/classes", {
          method: editingClassId ? "PUT" : "POST",
          body: JSON.stringify({
            name: classForm.name,
            stream: classForm.stream || null,
          }),
        }),
      editingClassId ? `${classForm.name} was updated.` : `${classForm.name} is ready for the portal.`,
    );
    if (result) {
      setClassForm({ name: "", stream: "" });
      setEditingClassId(null);
      await refreshPortalData();
    }
  };

  const submitLearningArea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedClassIds = areaForm.classIds.map(Number);
    const normalizedAreaName = areaForm.name.trim().toLowerCase();
    const classIdsNeedingArea = selectedClassIds.filter(
      (classId) =>
        !areas.some((area) => area.class_id === classId && area.name.trim().toLowerCase() === normalizedAreaName),
    );

    if (!classIdsNeedingArea.length) {
      setPortalNotice({
        kind: "error",
        text: selectedClassIds.length
          ? "That learning area already exists for the selected class or classes."
          : "Select at least one class doing this learning area.",
      });
      return;
    }

    const result = await runAction(
      "create-area",
      () =>
        Promise.all(
          classIdsNeedingArea.map((classId) =>
            apiRequest("/api/academics/learning-areas", {
              method: "POST",
              body: JSON.stringify({
                class_id: classId,
                name: areaForm.name,
                min_marks: Number(areaForm.minMarks),
                max_marks: Number(areaForm.maxMarks),
              }),
            }),
          ),
        ),
      `${areaForm.name} was added to ${classIdsNeedingArea.length} class${classIdsNeedingArea.length === 1 ? "" : "es"}.`,
    );
    if (result) {
      setAreaForm({
        classIds: [],
        name: "",
        minMarks: "0",
        maxMarks: "100",
      });
      await refreshPortalData();
    }
  };

  function toggleLearningAreaClass(classId: number, checked: boolean) {
    setAreaForm((current) => {
      const value = String(classId);
      const classIds = checked
        ? Array.from(new Set([...current.classIds, value]))
        : current.classIds.filter((item) => item !== value);
      return { ...current, classIds };
    });
  }

  function toggleExamLearningArea(areaName: string, checked: boolean) {
    setExamForm((current) => {
      const learningAreaNames = checked
        ? Array.from(new Set([...current.learningAreaNames, areaName]))
        : current.learningAreaNames.filter((item) => item !== areaName);
      return { ...current, learningAreaNames };
    });
  }

  const submitAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      editingAssignmentId ? "update-assignment" : "create-assignment",
      () =>
        apiRequest(editingAssignmentId ? `/api/academics/assignments/${editingAssignmentId}` : "/api/academics/assignments", {
          method: editingAssignmentId ? "PUT" : "POST",
          body: JSON.stringify({
            teacher_user_id: Number(assignmentForm.teacherUserId),
            class_id: Number(assignmentForm.classId),
            learning_area_id: Number(assignmentForm.learningAreaId),
            is_class_teacher: false,
          }),
        }),
      "Teaching assignment saved.",
    );
    if (result) {
      setAssignmentForm({ teacherUserId: "", classId: "", learningAreaId: "" });
      setEditingAssignmentId(null);
      await refreshPortalData();
    }
  };

  const submitClassTeacher = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "save-class-teacher",
      () =>
        apiRequest("/api/academics/class-responsibilities", {
          method: "POST",
          body: JSON.stringify({
            teacher_user_id: Number(classTeacherForm.teacherUserId),
            class_id: Number(classTeacherForm.classId),
          }),
        }),
      "Class teacher responsibility saved.",
    );
    if (result) {
      setClassTeacherForm({ teacherUserId: "", classId: "" });
      await refreshPortalData();
    }
  };

  const submitLearner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction<CreateLearnerResponse>(
      editingLearnerId ? "update-learner" : "create-learner",
      () =>
        apiRequest(editingLearnerId ? `/api/reporting/learners/${editingLearnerId}` : "/api/reporting/learners", {
          method: editingLearnerId ? "PUT" : "POST",
          body: JSON.stringify({
            admission_no: learnerForm.admissionNo,
            full_name: learnerForm.fullName,
            class_id: Number(learnerForm.classId),
            parent_full_name: learnerForm.parentFullName,
            parent_phone_number: learnerForm.parentPhoneNumber,
            boarding_status: learnerForm.boardingStatus,
            transport_mode: learnerForm.transportMode,
          }),
        }),
      editingLearnerId
        ? `${learnerForm.fullName} was updated.`
        : `${learnerForm.fullName} was added and linked to a parent contact.`,
    );
    if (result) {
      setLearnerForm({
        admissionNo: "",
        fullName: "",
        classId: "",
        parentFullName: "",
        parentPhoneNumber: "",
        boardingStatus: "Day Scholar",
        transportMode: "School Bus",
      });
      setEditingLearnerId(null);
      await refreshPortalData();
      if (!editingLearnerId) {
        setReportingView("report");
        setArrivalForm({
          learnerId: String(result.learner_id),
          accompaniedSource: "parent",
          accompaniedBy: "",
          accompaniedPhone: "",
          arrivalTransportMode: "School Bus",
          sendSms: true,
        });
      }
    }
  };

  function editClass(classRoom: ClassRoom) {
    setEditingClassId(classRoom.id);
    setClassForm({ name: classRoom.name, stream: classRoom.stream ?? "" });
    scrollToModule("setup");
  }

  function cancelClassEdit() {
    setEditingClassId(null);
    setClassForm({ name: "", stream: "" });
  }

  function editUser(person: DirectoryUser) {
    setEditingUserId(person.id);
    setUserForm({
      fullName: person.full_name,
      email: person.email,
      password: "",
      role: person.role,
      isActive: person.is_active ?? true,
    });
    scrollToModule("setup");
  }

  function cancelUserEdit() {
    setEditingUserId(null);
    setUserForm({ fullName: "", email: "", password: "", role: "teacher", isActive: true });
  }

  function toggleExamClass(classId: number, checked: boolean) {
    setExamForm((current) => {
      const value = String(classId);
      const classIds = checked
        ? Array.from(new Set([...current.classIds, value]))
        : current.classIds.filter((item) => item !== value);
      return { ...current, classIds };
    });
  }

  function placeSplitLearner(learnerId: number, placement: "first" | "second") {
    setClassSplitForm((current) => {
      const value = String(learnerId);
      return {
        ...current,
        learnerPlacements: {
          ...current.learnerPlacements,
          [value]: placement,
        },
      };
    });
  }

  const submitClassSplit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "split-class",
      () =>
        apiRequest(`/api/academics/classes/${classSplitForm.sourceClassId}/split`, {
          method: "POST",
          body: JSON.stringify({
            first_class_name: classSplitForm.firstClassName,
            second_class_name: classSplitForm.secondClassName,
            first_class_learner_ids: splitFirstLearnerIds.map(Number),
            second_class_learner_ids: splitSecondLearnerIds.map(Number),
          }),
        }),
      "Class split saved and learner mappings updated.",
    );
    if (result) {
      setClassSplitForm({ sourceClassId: "", firstClassName: "", secondClassName: "", learnerPlacements: {} });
      await refreshPortalData();
    }
  };

  function editAssignment(assignment: Assignment) {
    setEditingAssignmentId(assignment.id);
    setAssignmentForm({
      teacherUserId: String(assignment.teacher_user_id),
      classId: String(assignment.class_id),
      learningAreaId: String(assignment.learning_area_id),
    });
    scrollToModule("setup");
  }

  function cancelAssignmentEdit() {
    setEditingAssignmentId(null);
    setAssignmentForm({ teacherUserId: "", classId: "", learningAreaId: "" });
  }

  function editLearner(learner: Learner) {
    setEditingLearnerId(learner.id);
    setLearnerForm({
      admissionNo: learner.admission_no,
      fullName: learner.full_name,
      classId: String(learner.class_id),
      parentFullName: learner.parent_full_name ?? "",
      parentPhoneNumber: learner.parent_phone_number ?? "",
      boardingStatus: learner.boarding_status,
      transportMode: learner.transport_mode === "N/A" ? "School Bus" : learner.transport_mode || "School Bus",
    });
    setReportingView("register");
    scrollToModule("reporting");
  }

  function selectExamForMarks(exam: Exam) {
    setSelectedExamCycleKey(getExamCycleKey(exam));
    setSelectedExamClassId(String(exam.class_id));
    setSelectedExamAreaId(String(exam.learning_area_id));
    setMarkForm({ learnerId: "", marks: "" });
    setMarkEntryTab("enter");
    setExamPageView("overview");
    window.setTimeout(() => document.getElementById("marks-entry-card")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function cancelLearnerEdit() {
    setEditingLearnerId(null);
    setLearnerForm({
      admissionNo: "",
      fullName: "",
      classId: "",
      parentFullName: "",
      parentPhoneNumber: "",
      boardingStatus: "Day Scholar",
      transportMode: "School Bus",
    });
  }

  const submitArrival = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "report-arrival",
      () =>
        apiRequest("/api/reporting/arrivals", {
          method: "POST",
          body: JSON.stringify({
            learner_id: Number(arrivalForm.learnerId),
            accompanied_source: arrivalForm.accompaniedSource,
            accompanied_by: arrivalForm.accompaniedSource === "other_person" ? arrivalForm.accompaniedBy : null,
            accompanied_phone: arrivalForm.accompaniedSource === "other_person" ? arrivalForm.accompaniedPhone || null : null,
            arrival_transport_mode:
              selectedArrivalLearner && selectedArrivalLearner.boarding_status.toLowerCase().includes("board")
                ? null
                : arrivalForm.arrivalTransportMode,
            send_sms: arrivalForm.sendSms,
          }),
        }),
      "Arrival recorded and SMS workflow processed.",
    );
    if (result) {
      setArrivalForm({
        learnerId: "",
        accompaniedSource: "parent",
        accompaniedBy: "",
        accompaniedPhone: "",
        arrivalTransportMode: "School Bus",
        sendSms: true,
      });
      await refreshPortalData();
    }
  };

  const handleDownloadClassList = async () => {
    if (!listClassId) {
      setPortalNotice({ kind: "error", text: "Pick a class first." });
      return;
    }
    const result = await runAction<{ class_id: number; total: number; items: Array<Record<string, string | number>> }>(
      "download-class-list",
      () => apiRequest(`/api/reporting/lists/class${buildQuery({ class_id: Number(listClassId) })}`),
      "Class list downloaded.",
    );
    if (result) {
      downloadCsv(
        `class-list-${classMap.get(Number(listClassId))?.name.toLowerCase().replace(/\s+/g, "-") ?? "learners"}.csv`,
        result.items,
      );
    }
  };

  const handleDownloadBoarders = async () => {
    const result = await runAction<{ total: number; items: Array<Record<string, string | number>> }>(
      "download-boarders",
      () => apiRequest("/api/reporting/lists/boarders"),
      "Boarders list downloaded.",
    );
    if (result) {
      downloadCsv("boarding-learners.csv", result.items);
    }
  };

  const submitExam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!examClassIds.length) {
      setPortalNotice({ kind: "error", text: "Select at least one class for this exam." });
      return;
    }
    if (examForm.learningAreaScope === "specific" && !examForm.learningAreaNames.length) {
      setPortalNotice({ kind: "error", text: "Select at least one learning area for this exam." });
      return;
    }
    const result = await runAction(
      "create-exam",
      () =>
        apiRequest("/api/academics/exams/batch", {
          method: "POST",
          body: JSON.stringify({
            name: examForm.name,
            exam_type: examForm.examType,
            exam_month: examForm.examMonth,
            term: examForm.term,
            year: Number(examForm.year),
            marks_deadline: examForm.marksDeadline ? new Date(examForm.marksDeadline).toISOString() : null,
            class_ids: examClassIds.map(Number),
            learning_area_scope: examForm.learningAreaScope,
            learning_area_names: examForm.learningAreaScope === "all" ? [] : examForm.learningAreaNames,
            learning_area_name: examForm.learningAreaNames[0] ?? examForm.learningAreaName,
            max_marks: Number(examForm.maxMarks),
            min_marks: 0,
            cbc_formula: generatedExamCbcFormula,
          }),
        }),
      `${examForm.name} was created for ${examClassIds.length} class${examClassIds.length === 1 ? "" : "es"}.`,
    );
    if (result) {
      setExamForm({
        name: "",
        examType: "Opener",
        examMonth: new Date().toLocaleString("en-US", { month: "long" }),
        term: "Term 1",
        year: String(new Date().getFullYear()),
        scope: "single",
        classIds: [],
        learningAreaName: "",
        learningAreaScope: "specific",
        learningAreaNames: [],
        maxMarks: "100",
        cbcFormulaOption: "standard",
        marksDeadline: "",
      });
      await refreshPortalData();
    }
  };

  const submitMarks = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMarkExam) {
      setPortalNotice({ kind: "error", text: "Pick an exam, class, and learning area first." });
      return;
    }
    const result = await runAction(
      "save-marks",
      () =>
        apiRequest("/api/academics/marks", {
          method: "POST",
          body: JSON.stringify({
            exam_id: selectedMarkExam.id,
            learner_id: Number(markForm.learnerId),
            marks: Number(markForm.marks),
          }),
        }),
      "Marks saved successfully.",
    );
    if (result) {
      setMarkForm({ learnerId: "", marks: "" });
      await refreshPortalData();
      if (canViewSelectedClassMerit) {
        await refreshLiveMeritList();
      }
    }
  };

  async function saveLearnerMarks(learnerId: number, marks: string) {
    if (!selectedMarkExam) {
      setPortalNotice({ kind: "error", text: "Pick an exam, class, and learning area first." });
      return;
    }
    if (!marks) {
      setPortalNotice({ kind: "error", text: "Enter marks first." });
      return;
    }
    const result = await runAction(
      `save-marks-${learnerId}`,
      () =>
        apiRequest("/api/academics/marks", {
          method: "POST",
          body: JSON.stringify({
            exam_id: selectedMarkExam.id,
            learner_id: learnerId,
            marks: Number(marks),
          }),
        }),
      "Marks saved successfully.",
    );
    if (result) {
      setMarkForm({ learnerId: "", marks: "" });
      setLearnerMarkDrafts((current) => {
        const next = { ...current };
        delete next[String(learnerId)];
        return next;
      });
      await refreshPortalData();
    }
  }

  async function updateExamCycleStatus(exam: Exam, action: "pause" | "end" | "restart") {
    const result = await runAction(
      `exam-${action}-${exam.id}`,
      () =>
        apiRequest(`/api/academics/exams/${exam.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ action }),
        }),
      action === "pause" ? "Exam paused." : action === "end" ? "Exam ended." : "Exam restarted.",
    );
    if (result) {
      await refreshPortalData();
    }
  }

  async function refreshLiveMeritList() {
    if (!selectedMarkExam || selectedMarkClassIdNumber === null || !canViewSelectedClassMerit) {
      setLiveMeritList(null);
      return;
    }
    const result = await runAction<MeritListResponse>(
      "refresh-live-merit",
      () =>
        apiRequest("/api/academics/merit-lists", {
          method: "POST",
          body: JSON.stringify({
            class_id: selectedMarkClassIdNumber,
            exam_id: selectedMarkExam.id,
            learning_area_id: null,
          }),
        }),
    );
    if (result) {
      setLiveMeritList(result);
    }
  }

  function downloadScoreSheetPdf() {
    if (!selectedMarkExam) {
      setPortalNotice({ kind: "error", text: "Pick a learning area first." });
      return;
    }
    const className = classMap.get(selectedMarkExam.class_id)?.name ?? `Class ${selectedMarkExam.class_id}`;
    const areaName = areaMap.get(selectedMarkExam.learning_area_id)?.name ?? `Learning area ${selectedMarkExam.learning_area_id}`;
    const rows = enteredMarksForSelectedExam
      .map(
        (entry) =>
          `<tr><td>${entry.admission_no}</td><td>${entry.learner_name}</td><td>${entry.marks}</td><td>${entry.level ?? ""}</td></tr>`,
      )
      .join("");
    const printable = window.open("", "_blank");
    if (!printable) {
      setPortalNotice({ kind: "error", text: "Allow popups to print the score sheet." });
      return;
    }
    printable.document.write(`
      <html>
        <head>
          <title>${selectedMarkCycle?.name ?? "Score sheet"} - ${className} - ${areaName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2a24; }
            h1 { font-size: 22px; margin: 0 0 8px; }
            p { margin: 0 0 18px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; border-bottom: 1px solid #d8ded8; padding: 9px; }
          </style>
        </head>
        <body>
          <h1>${selectedMarkCycle?.name ?? "Score sheet"}</h1>
          <p>${className} - ${areaName} - ${selectedMarkExam.term} ${selectedMarkExam.year}</p>
          <table>
            <thead><tr><th>Admission</th><th>Learner</th><th>Marks</th><th>Level</th></tr></thead>
            <tbody>${rows || "<tr><td colspan='4'>No marks entered yet.</td></tr>"}</tbody>
          </table>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  }

  const handleMeritDownload = async (mode: "full" | "subject") => {
    if (!meritForm.classId || !meritForm.examId) {
      setPortalNotice({ kind: "error", text: "Pick a class and exam first." });
      return;
    }
    if (mode === "subject" && !meritForm.learningAreaId) {
      setPortalNotice({ kind: "error", text: "Pick a learning area for the learning area merit list." });
      return;
    }
    const result = await runAction<MeritListResponse>(
      mode === "full" ? "download-full-merit" : "download-subject-merit",
      () =>
        apiRequest("/api/academics/merit-lists", {
          method: "POST",
          body: JSON.stringify({
            class_id: Number(meritForm.classId),
            exam_id: Number(meritForm.examId),
            learning_area_id: mode === "subject" ? Number(meritForm.learningAreaId) : null,
          }),
        }),
      mode === "full" ? "Class merit list downloaded." : "Subject merit list downloaded.",
    );
    if (result) {
      setMeritList(result);
      downloadCsv(
        mode === "full" ? "class-merit-list.csv" : "subject-merit-list.csv",
        result.items.map((item) => ({
          position: item.position,
          admission_no: item.admission_no,
          learner_name: item.learner_name,
          total_marks: item.total_marks,
          subject_count: item.subject_count,
        })),
      );
    }
  };

  const submitTimetableRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "create-timetable-room",
      () =>
        apiRequest("/api/timetable/rooms", {
          method: "POST",
          body: JSON.stringify({
            name: timetableRoomForm.name,
            room_type: timetableRoomForm.roomType || null,
            capacity: timetableRoomForm.capacity ? Number(timetableRoomForm.capacity) : null,
          }),
        }),
      `${timetableRoomForm.name} was added to timetable rooms.`,
    );
    if (result) {
      setTimetableRoomForm({ name: "", roomType: "", capacity: "" });
      await refreshPortalData();
    }
  };

  const submitTimetablePeriod = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "create-timetable-period",
      () =>
        apiRequest("/api/timetable/periods", {
          method: "POST",
          body: JSON.stringify({
            name: timetablePeriodForm.name,
            start_time: timetablePeriodForm.startTime,
            end_time: timetablePeriodForm.endTime,
            sort_order: Number(timetablePeriodForm.sortOrder),
            is_break: timetablePeriodForm.isBreak,
          }),
        }),
      `${timetablePeriodForm.name} was added to the school day.`,
    );
    if (result) {
      setTimetablePeriodForm({ name: "", startTime: "", endTime: "", sortOrder: "1", isBreak: false });
      await refreshPortalData();
    }
  };

  const submitTimetableRequirement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "create-timetable-requirement",
      () =>
        apiRequest("/api/timetable/requirements", {
          method: "POST",
          body: JSON.stringify({
            class_id: Number(timetableRequirementForm.classId),
            learning_area_id: Number(timetableRequirementForm.learningAreaId),
            teacher_user_id: Number(timetableRequirementForm.teacherUserId),
            periods_per_week: Number(timetableRequirementForm.periodsPerWeek),
            max_periods_per_day: Number(timetableRequirementForm.maxPeriodsPerDay),
            preferred_room_id: timetableRequirementForm.preferredRoomId ? Number(timetableRequirementForm.preferredRoomId) : null,
            allow_double_periods: timetableRequirementForm.allowDoublePeriods,
            notes: timetableRequirementForm.notes || null,
          }),
        }),
      "Weekly lesson requirement created.",
    );
    if (result) {
      setTimetableRequirementForm({
        classId: "",
        learningAreaId: "",
        teacherUserId: "",
        periodsPerWeek: "5",
        maxPeriodsPerDay: "1",
        preferredRoomId: "",
        allowDoublePeriods: false,
        notes: "",
      });
      await refreshPortalData();
    }
  };

  async function deleteTimetableRequirement(requirementId: number) {
    const result = await runAction(
      `delete-timetable-requirement-${requirementId}`,
      () => apiRequest(`/api/timetable/requirements/${requirementId}`, { method: "DELETE" }),
      "Lesson requirement removed.",
    );
    if (result) {
      await refreshPortalData();
    }
  }

  async function runTimetableCheck() {
    const result = await runAction<{ checks: TimetableCheck[] }>(
      "check-timetable",
      () => apiRequest("/api/timetable/check"),
      "Timetable checked.",
    );
    if (result) {
      setTimetableChecks(result.checks);
    }
  }

  async function generateTimetableCards() {
    const result = await runAction<{ checks: TimetableCheck[]; created_count: number }>(
      "generate-timetable",
      () => apiRequest("/api/timetable/generate", { method: "POST" }),
      "Timetable cards generated.",
    );
    if (result) {
      setTimetableChecks(result.checks);
      await refreshPortalData();
    }
  }

  const submitTimetableSlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "create-timetable-slot",
      () =>
        apiRequest("/api/timetable/slots", {
          method: "POST",
          body: JSON.stringify({
            day_of_week: timetableSlotForm.dayOfWeek,
            period_id: Number(timetableSlotForm.periodId),
            class_id: Number(timetableSlotForm.classId),
            learning_area_id: Number(timetableSlotForm.learningAreaId),
            teacher_user_id: Number(timetableSlotForm.teacherUserId),
            room_id: timetableSlotForm.roomId ? Number(timetableSlotForm.roomId) : null,
            requirement_id: timetableSlotForm.requirementId ? Number(timetableSlotForm.requirementId) : null,
            is_locked: timetableSlotForm.isLocked,
            notes: timetableSlotForm.notes || null,
          }),
        }),
      "Lesson added to the timetable.",
    );
    if (result) {
      setTimetableSlotForm((current) => ({
        ...current,
        learningAreaId: "",
        teacherUserId: "",
        roomId: "",
        requirementId: "",
        isLocked: false,
        notes: "",
      }));
      await refreshPortalData();
    }
  };

  async function deleteTimetableSlot(slotId: number) {
    const result = await runAction(
      `delete-timetable-slot-${slotId}`,
      () => apiRequest(`/api/timetable/slots/${slotId}`, { method: "DELETE" }),
      "Lesson removed from timetable.",
    );
    if (result) {
      await refreshPortalData();
    }
  }

  const handleExamAnalysis = async () => {
    if (!meritForm.classId || !meritForm.examId) {
      setPortalNotice({ kind: "error", text: "Pick a class and exam first." });
      return;
    }
    const result = await runAction<ExamAnalysisResponse>(
      "exam-analysis",
      () =>
        apiRequest("/api/academics/exam-analysis", {
          method: "POST",
          body: JSON.stringify({
            class_id: Number(meritForm.classId),
            exam_id: Number(meritForm.examId),
            learning_area_id: meritForm.learningAreaId ? Number(meritForm.learningAreaId) : null,
          }),
        }),
      "CBC exam analysis generated.",
    );
    if (result) {
      setExamAnalysis(result);
    }
  };

  function downloadExamAnalysisCsv() {
    if (!examAnalysis) {
      return;
    }
    downloadCsv(
      "cbc-exam-analysis.csv",
      examAnalysis.learner_analysis.map((item) => ({
        position: item.position,
        admission_no: item.admission_no,
        learner_name: item.learner_name,
        total_marks: item.total_marks,
        average_percent: item.average_percent,
        cbc_level: item.cbc_level ?? "",
        subject_count: item.subject_count,
        missing_count: item.missing_count,
        missing_subjects: item.missing_subjects.join("; "),
      })),
    );
  }

  useEffect(() => {
    if (!selectedMarkExam || !canViewSelectedClassMerit) {
      setLiveMeritList(null);
      return;
    }
    void refreshLiveMeritList();
  }, [selectedMarkExam?.id, canViewSelectedClassMerit, markEntries.length]);

  const submitTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "create-template",
      () =>
        apiRequest("/api/messaging/templates", {
          method: "POST",
          body: JSON.stringify({
            name: templateForm.name,
            scope: templateForm.scope,
            message_body: templateForm.messageBody,
          }),
        }),
      `${templateForm.name} is now ready for reuse.`,
    );
    if (result) {
      setTemplateForm({ name: "", scope: "admin", messageBody: "" });
      await refreshPortalData();
    }
  };

  const submitBroadcast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (broadcastForm.audienceFilter === "class" && !broadcastForm.classId) {
      setPortalNotice({ kind: "error", text: "Pick a class when sending to one class." });
      return;
    }
    if (!broadcastForm.templateId && !broadcastForm.messageBody.trim()) {
      setPortalNotice({ kind: "error", text: "Write a message or choose a saved template first." });
      return;
    }
    const result = await runAction(
      "send-broadcast",
      () =>
        apiRequest(
          `/api/messaging/broadcasts${buildQuery({
            class_id: broadcastForm.audienceFilter === "class" ? Number(broadcastForm.classId) : null,
          })}`,
          {
            method: "POST",
            body: JSON.stringify({
              audience_filter: broadcastForm.audienceFilter,
              message_body: broadcastForm.messageBody,
              template_id: broadcastForm.templateId ? Number(broadcastForm.templateId) : null,
            }),
          },
        ),
      "Broadcast processed successfully.",
    );
    if (result) {
      setBroadcastForm({ audienceFilter: "whole_school", classId: "", messageBody: "", templateId: "" });
      await refreshPortalData();
    }
  };

  const submitClassMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "send-class-message",
      () =>
        apiRequest("/api/messaging/class-teacher", {
          method: "POST",
          body: JSON.stringify({
            class_id: Number(classMessageForm.classId),
            message_body: classMessageForm.messageBody,
          }),
        }),
      "Class message processed successfully.",
    );
    if (result) {
      setClassMessageForm({ classId: "", messageBody: "" });
      await refreshPortalData();
    }
  };

  const submitBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "create-book",
      () =>
        apiRequest("/api/library/books", {
          method: "POST",
          body: JSON.stringify({
            accession_no: bookForm.accessionNo,
            title: bookForm.title,
            author: bookForm.author || null,
            category: bookForm.category || null,
            total_copies: Number(bookForm.totalCopies),
          }),
        }),
      `${bookForm.title} was added to the registry.`,
    );
    if (result) {
      setBookForm({ accessionNo: "", title: "", author: "", category: "", totalCopies: "1" });
      await refreshPortalData();
    }
  };

  const submitLoan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "issue-book",
      () =>
        apiRequest("/api/library/loans", {
          method: "POST",
          body: JSON.stringify({
            book_id: Number(loanForm.bookId),
            learner_id: loanForm.borrowerType === "learner" ? Number(loanForm.learnerId) : null,
            teacher_user_id: loanForm.borrowerType === "teacher" ? Number(loanForm.teacherUserId) : null,
            class_id: loanForm.borrowerType === "class" ? Number(loanForm.classId) : null,
            due_at: loanForm.dueAt ? new Date(loanForm.dueAt).toISOString() : null,
          }),
        }),
      "Book issued successfully.",
    );
    if (result) {
      setLoanForm({ bookId: "", borrowerType: "learner", learnerId: "", teacherUserId: "", classId: "", dueAt: "" });
      await refreshPortalData();
    }
  };

  const returnBook = async (loanId: number) => {
    const result = await runAction(
      `return-book-${loanId}`,
      () =>
        apiRequest(`/api/library/loans/${loanId}/return`, {
          method: "POST",
        }),
      "Book returned successfully.",
    );
    if (result) {
      await refreshPortalData();
    }
  };

  const submitPage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction(
      "create-page",
      () =>
        apiRequest("/api/website/pages", {
          method: "POST",
          body: JSON.stringify({
            slug: pageForm.slug,
            title: pageForm.title,
            body: pageForm.body,
            is_published: pageForm.isPublished,
          }),
        }),
      `${pageForm.title} was added to the website pages.`,
    );
    if (result) {
      setPageForm({ slug: "", title: "", body: "", isPublished: false });
      await refreshPortalData();
      await loadPublicPages();
    }
  };

  const submitParentLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await runAction<ParentSummary>(
      "parent-lookup",
      () =>
        apiRequest(
          `/api/website/parent/learner-summary${buildQuery({
            admission_no: parentLookupForm.admissionNo,
            phone_number: parentLookupForm.phoneNumber,
          })}`,
          {},
          null,
        ),
      "Parent summary loaded successfully.",
    );
    if (result) {
      setParentSummary(result);
    }
  };

  const openPortal = () => {
    if (loggedInUser) {
      scrollToModule(activeModule);
      return;
    }
    if (isLoginOpen) {
      closeLoginScreen();
      return;
    }
    openLoginScreen();
  };

  const selectedMarkHeader = selectedMarkExam
    ? `${selectedMarkCycle?.name ?? selectedMarkExam.name} - ${
        classMap.get(selectedMarkExam.class_id)?.name ?? `Class ${selectedMarkExam.class_id}`
      } - ${areaMap.get(selectedMarkExam.learning_area_id)?.name ?? `Learning area ${selectedMarkExam.learning_area_id}`}`
    : "";

  if (loggedInUser && activeModule === "exams" && selectedMarkExam && examPageView === "enter") {
    return (
      <div className="site-shell">
        <main className="portal-shell marks-only-page">
          <section className="portal-section marks-only-section">
            <div className="portal-section-heading">
              <div>
                <p className="section-kicker">Marks entry</p>
                <h2>{selectedMarkHeader}</h2>
                <p>Enter learner marks for this class and learning area only.</p>
              </div>
              <button className="ghost-button" type="button" onClick={() => setExamPageView("overview")}>
                Back to exams
              </button>
            </div>
            <article className="module-card">
              <label className="field">
                <span>Search learner</span>
                <input
                  value={markLearnerSearch}
                  onChange={(event) => setMarkLearnerSearch(event.target.value)}
                  placeholder="Type learner name or admission number"
                />
              </label>
              {learnersForMarkEntry.length ? (
                <div className="learner-mark-grid">
                  {learnersForMarkEntry.map((learner) => (
                    <div className="summary-block learner-mark-row" key={learner.id}>
                      <div>
                        <p>
                          <strong>{learner.full_name}</strong>
                        </p>
                        <p className="helper-copy">{learner.admission_no}</p>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={learnerMarkDrafts[String(learner.id)] ?? ""}
                        onChange={(event) =>
                          setLearnerMarkDrafts((current) => ({
                            ...current,
                            [String(learner.id)]: event.target.value,
                          }))
                        }
                        placeholder="Marks"
                      />
                      <button
                        className="primary-button"
                        type="button"
                        disabled={actionBusy === `save-marks-${learner.id}`}
                        onClick={() => void saveLearnerMarks(learner.id, learnerMarkDrafts[String(learner.id)] ?? "")}
                      >
                        {actionBusy === `save-marks-${learner.id}` ? "Saving..." : "Save"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="You have entered marks for all learners in this class and learning area." />
              )}
            </article>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`site-shell ${loggedInUser ? "portal-mode" : ""}`}>
      <div className="glow glow-green" />
      <div className="glow glow-gold" />
      <div className="glow glow-blue" />

      <div className="utility-bar">
        <div className="utility-inner">
          <p className="utility-brand">Tumaini Academy Ol Moran</p>
          <div className="utility-links">
            <span>Parent Support: saintmark@olmoran.org</span>
            <span>Inquiries: 0795888710</span>
          </div>
        </div>
      </div>

      <header className="topbar">
        <a
          className="brand-lockup"
          href={loggedInUser ? "#portal" : "#home"}
          onClick={() => {
            if (showLoginScreen) {
              closeLoginScreen();
            }
            if (!loggedInUser) {
              setActivePublicSection("home");
            }
          }}
        >
          <img className="brand-logo" src="/Tumaini logo.jpeg" alt="Tumaini Academy logo" />
          <div className="brand-copy">
            <p className="brand-name">TUMAINI ACADEMY</p>
            <div className="brand-identity" aria-label="Tumaini Academy school identity">
              <p>Whole, Mixed, Day &amp; Boarding</p>
              <p className="brand-identity-strong">Catholic School</p>
              <p>
                Ngare Narok <span aria-hidden="true">|</span> Ol Moran <span aria-hidden="true">|</span> Laikipia
              </p>
              <p>
                <span className="brand-parish">Saint Mark</span> Catholic Parish
              </p>
              <p>Catholic Diocese of Nyahururu</p>
            </div>
          </div>
        </a>

        {loggedInUser ? (
          <div className="header-role-badge">
            <p className="section-kicker">Signed In</p>
            <strong>{formatRoleLabel(loggedInUser.role)} Dashboard</strong>
          </div>
        ) : showLoginScreen ? (
          <div className="header-role-badge">
            <p className="section-kicker">Dashboard Login</p>
            <strong>Choose role and sign in</strong>
          </div>
        ) : (
          <nav className="primary-nav" aria-label="Main navigation">
            {publicNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activePublicSection === item.id ? "active" : ""}
                onClick={() => setActivePublicSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <button className="staff-trigger" type="button" onClick={openPortal}>
          {loggedInUser ? "Open Dashboard" : showLoginScreen ? "Back to Website" : "Staff Login"}
        </button>
      </header>

      {showPublicWebsite ? (
        <section className="headline-strip" aria-label="Tumaini news and highlights">
          <div className="headline-label">News Desk</div>
          <div className="headline-track">
            {headlineFeed.map((item) => (
              <span className="headline-item" key={item}>
                {item}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {showLoginScreen ? (
        <main className="dashboard-login-view" id="staff-login">
          <section className="dashboard-login-shell">
            <div className="dashboard-login-copy">
              <p className="section-kicker">Dashboard Login</p>
              <h1>Choose your role, then sign in to the correct portal.</h1>
              <p>
                Staff login now opens in its own dashboard access screen so the public website stays separate from the
                internal system.
              </p>
              <div className="login-helper-grid">
                <article className="login-helper-card">
                  <strong>1. Choose role</strong>
                  <span>Select the dashboard you want to enter.</span>
                </article>
                <article className="login-helper-card">
                  <strong>2. Enter username</strong>
                  <span>Use your school email or staff username.</span>
                </article>
                <article className="login-helper-card">
                  <strong>3. Enter password</strong>
                  <span>Sign in and the system opens that role workspace only.</span>
                </article>
              </div>
            </div>

            <form className="dashboard-login-card" onSubmit={submitLogin}>
              <p className="section-kicker">Portal access</p>
              <h2>Staff and dashboard sign-in</h2>

              <label className="field">
                <span>Role</span>
                <select value={loginRole} onChange={(event) => setLoginRole(event.target.value as UserRole | "")} required>
                  <option value="" disabled>
                    Select your role
                  </option>
                  {roleCatalog
                    .filter((role) => role.value !== "visitor")
                    .map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                </select>
              </label>

              <p className="role-detail">
                {selectedLoginRoleMeta?.detail ?? "Choose the dashboard role first, then enter your login details."}
              </p>

              <label className="field">
                <span>Username or email</span>
                <input
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@tumaini.ac.ke"
                  required
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </label>

              <div className="staff-actions">
                <button className="primary-button" type="submit" disabled={actionBusy === "login"}>
                  {actionBusy === "login" ? "Signing in..." : "Open dashboard"}
                </button>
                <button className="ghost-button" type="button" onClick={closeLoginScreen}>
                  Back to website
                </button>
              </div>

              {feedback ? <p className="feedback">{feedback}</p> : null}
            </form>
          </section>
        </main>
      ) : null}

      {loggedInUser ? (
        <section className={`portal-shell ${dashboardTheme.shellClassName}`} id="portal">
          <aside className="portal-sidebar" aria-label="Staff portal navigation">
            <div className="portal-sidebar-brand">
              <img src="/Tumaini logo.jpeg" alt="Tumaini Academy logo" />
              <div>
                <p className="portal-sidebar-kicker">Tumaini Academy</p>
                <span className="portal-role-name">{formatRoleLabel(loggedInUser.role)}</span>
              </div>
            </div>

            <p className="portal-menu-label">Menu</p>
            <nav className="portal-side-nav">
              {roleModules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  className={module.id === activeModule ? "portal-side-link active" : "portal-side-link"}
                  onClick={() => scrollToModule(module.id)}
                >
                  <span className="portal-side-icon" aria-hidden="true">
                    {module.label.slice(0, 1)}
                  </span>
                  <span>{module.label}</span>
                </button>
              ))}
            </nav>

            <div className="portal-sidebar-footer">
              <button className="portal-side-link portal-logout" type="button" onClick={clearSession}>
                <span className="portal-side-icon" aria-hidden="true">
                  L
                </span>
                <span>Logout</span>
              </button>
              <p>Copyright 2026 Tumaini Academy</p>
            </div>
          </aside>

          <main className="portal-workspace">
            <header className="portal-workspace-topbar">
              <div className="portal-topbar-title">
                <p className="portal-sidebar-kicker">{dashboardTheme.kicker}</p>
                <h1>{activeModuleLabel}</h1>
              </div>
              <div className="portal-topbar-actions">
                <div className="portal-context-pill">
                  <span>{dashboardTheme.title}</span>
                  <span className="portal-context-value">{activeModuleLabel}</span>
                </div>
                <div className="portal-account-pill">
                  <span>
                    <span className="portal-account-name">{loggedInUser.full_name}</span>
                    {formatRoleLabel(loggedInUser.role)}
                  </span>
                  <span className="portal-account-avatar">{portalUserInitial}</span>
                </div>
              </div>
            </header>

            <div className="portal-workspace-body">
              <div className="portal-app-summary">
                <p className="portal-hero-panel-label">{dashboardTheme.spotlightLabel}</p>
                <h2>{dashboardTheme.spotlightTitle}</h2>
                <p>{dashboardTheme.spotlightDetail}</p>
              </div>

              {portalNotice ? <p className={`notice ${portalNotice.kind}`}>{portalNotice.text}</p> : null}
              {portalLoading ? <p className="helper-copy">Refreshing portal data...</p> : null}

          {canManageSetup && activeModule === "setup" ? (
            <PortalSection
              id="portal-setup"
              kicker="Setup"
              title="Users, classes, learning areas, and assignments"
              detail="This is where the core structure of the whole school system is prepared."
            >
              <div className="portal-grid portal-grid-3">
                <form className="module-card" onSubmit={submitUserCreate}>
                  <h3>{editingUserId ? "Edit user" : "Create user"}</h3>
                  <label className="field">
                    <span>Full name</span>
                    <input
                      value={userForm.fullName}
                      onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Password</span>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
                      minLength={8}
                      required={!editingUserId}
                    />
                  </label>
                  <label className="field">
                    <span>Role</span>
                    <select
                      value={userForm.role}
                      onChange={(event) =>
                        setUserForm((current) => ({ ...current, role: event.target.value as UserRole }))
                      }
                    >
                      {roleCatalog.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {editingUserId ? (
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={userForm.isActive}
                        onChange={(event) => setUserForm((current) => ({ ...current, isActive: event.target.checked }))}
                      />
                      <span>Account is active</span>
                    </label>
                  ) : null}
                  <div className="staff-actions">
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={actionBusy === "create-user" || actionBusy === "update-user"}
                    >
                      {actionBusy === "create-user" || actionBusy === "update-user"
                        ? "Saving..."
                        : editingUserId
                          ? "Update user"
                          : "Create user"}
                    </button>
                    {editingUserId ? (
                      <button className="ghost-button" type="button" onClick={cancelUserEdit}>
                        Cancel edit
                      </button>
                    ) : null}
                  </div>
                </form>

                <form className="module-card" onSubmit={submitClassCreate}>
                  <h3>{editingClassId ? "Edit class" : "Create class"}</h3>
                  <label className="field">
                    <span>Class name</span>
                    <input
                      value={classForm.name}
                      onChange={(event) => setClassForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="GRADE 7"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Stream</span>
                    <input
                      value={classForm.stream}
                      onChange={(event) => setClassForm((current) => ({ ...current, stream: event.target.value }))}
                      placeholder="North Stream"
                    />
                  </label>
                  <div className="staff-actions">
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={actionBusy === "create-class" || actionBusy === "update-class"}
                    >
                      {actionBusy === "create-class" || actionBusy === "update-class"
                        ? "Saving..."
                        : editingClassId
                          ? "Update class"
                          : "Create class"}
                    </button>
                    {editingClassId ? (
                      <button className="ghost-button" type="button" onClick={cancelClassEdit}>
                        Cancel edit
                      </button>
                    ) : null}
                  </div>
                </form>

                <form className="module-card" onSubmit={submitLearningArea}>
                  <h3>Create learning area</h3>
                  <label className="field">
                    <span>Learning area</span>
                    <input
                      value={areaForm.name}
                      onChange={(event) => setAreaForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Mathematics"
                      required
                    />
                  </label>
                  <div className="two-field-row">
                    <label className="field">
                      <span>Min marks</span>
                      <input
                        type="number"
                        value={areaForm.minMarks}
                        onChange={(event) => setAreaForm((current) => ({ ...current, minMarks: event.target.value }))}
                      />
                    </label>
                    <label className="field">
                      <span>Max marks</span>
                      <input
                        type="number"
                        value={areaForm.maxMarks}
                        onChange={(event) => setAreaForm((current) => ({ ...current, maxMarks: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="field">
                    <span>Classes doing this learning area</span>
                    {classes.length ? (
                      <div className="checkbox-grid compact-checkbox-grid">
                        {classes.map((classRoom) => (
                          <label className="check-row" key={classRoom.id}>
                            <input
                              type="checkbox"
                              checked={areaForm.classIds.includes(String(classRoom.id))}
                              onChange={(event) => toggleLearningAreaClass(classRoom.id, event.target.checked)}
                            />
                            <span>{classRoom.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="helper-copy">Create classes first, then attach learning areas to those classes.</p>
                    )}
                  </div>
                  <button className="primary-button" type="submit" disabled={actionBusy === "create-area"}>
                    {actionBusy === "create-area" ? "Saving..." : "Create learning area"}
                  </button>
                </form>
              </div>

              <article className="module-card">
                <h3>Learning areas by class</h3>
                <button className="ghost-button inline-button" type="button" onClick={() => setShowLearningAreaList((current) => !current)}>
                  {showLearningAreaList ? "Hide learning areas" : "View learning areas"}
                </button>
                {showLearningAreaList && areas.length ? (
                  <div className="table-wrap">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Learning area</th>
                          <th>Class doing it</th>
                          <th>Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {areas.map((area) => (
                          <tr key={area.id}>
                            <td>{area.name}</td>
                            <td>{classMap.get(area.class_id)?.name ?? `Class ${area.class_id}`}</td>
                            <td>
                              {area.min_marks} - {area.max_marks}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : showLearningAreaList ? (
                  <EmptyState text="No learning areas have been created yet." />
                ) : null}
              </article>

              <form className="module-card" onSubmit={submitClassSplit}>
                <h3>Split a class</h3>
                <div className="portal-grid portal-grid-3">
                  <label className="field">
                    <span>Class to split</span>
                    <select
                      value={classSplitForm.sourceClassId}
                      onChange={(event) => {
                        const classRoom = classMap.get(Number(event.target.value));
                        setClassSplitForm({
                          sourceClassId: event.target.value,
                          firstClassName: classRoom ? `${classRoom.name} EAST` : "",
                          secondClassName: classRoom ? `${classRoom.name} WEST` : "",
                          learnerPlacements: learners
                            .filter((learner) => learner.class_id === Number(event.target.value))
                            .reduce<Record<string, "first" | "second">>((placements, learner) => {
                              placements[String(learner.id)] = "first";
                              return placements;
                            }, {}),
                        });
                      }}
                      required
                    >
                      <option value="">Select class</option>
                      {classes.map((classRoom) => (
                        <option key={classRoom.id} value={classRoom.id}>
                          {classRoom.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>First class name</span>
                    <input
                      value={classSplitForm.firstClassName}
                      onChange={(event) => setClassSplitForm((current) => ({ ...current, firstClassName: event.target.value }))}
                      placeholder="GRADE 8 EAST"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Second class name</span>
                    <input
                      value={classSplitForm.secondClassName}
                      onChange={(event) => setClassSplitForm((current) => ({ ...current, secondClassName: event.target.value }))}
                      placeholder="GRADE 8 WEST"
                      required
                    />
                  </label>
                </div>
                {learnersForSplitSource.length ? (
                  <div className="checkbox-grid">
                    {learnersForSplitSource.map((learner) => (
                      <div className="split-learner-row" key={learner.id}>
                        <span>
                          {learner.full_name} ({learner.admission_no})
                        </span>
                        <div className="split-choice-row">
                          <label className="check-row">
                            <input
                              type="radio"
                              name={`split-learner-${learner.id}`}
                              checked={classSplitForm.learnerPlacements[String(learner.id)] === "first"}
                              onChange={() => placeSplitLearner(learner.id, "first")}
                            />
                            <span>East</span>
                          </label>
                          <label className="check-row">
                            <input
                              type="radio"
                              name={`split-learner-${learner.id}`}
                              checked={classSplitForm.learnerPlacements[String(learner.id)] === "second"}
                              onChange={() => placeSplitLearner(learner.id, "second")}
                            />
                            <span>West</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="helper-copy">Select a class, then tick learners who should move to the second split class.</p>
                )}
                {learnersForSplitSource.length ? (
                  <p className="helper-copy">
                    East: {splitFirstLearnerIds.length} learners. West: {splitSecondLearnerIds.length} learners.
                  </p>
                ) : null}
                <button className="primary-button" type="submit" disabled={actionBusy === "split-class"}>
                  {actionBusy === "split-class" ? "Saving..." : "Save class split"}
                </button>
              </form>

              <div className="portal-grid portal-grid-2">
                <form className="module-card" onSubmit={submitAssignment}>
                  <h3>{editingAssignmentId ? "Edit subject teaching" : "Assign subject and class"}</h3>
                  <label className="field">
                    <span>Teacher</span>
                    <select
                      value={assignmentForm.teacherUserId}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({ ...current, teacherUserId: event.target.value }))
                      }
                      required
                    >
                      <option value="">Select teacher</option>
                      {teacherOptions.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.full_name} - {formatRoleLabel(person.role)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Class</span>
                    <select
                      value={assignmentForm.classId}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({
                          ...current,
                          classId: event.target.value,
                          learningAreaId: "",
                        }))
                      }
                      required
                    >
                      <option value="">Select class</option>
                      {classes.map((classRoom) => (
                        <option key={classRoom.id} value={classRoom.id}>
                          {classRoom.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Learning area</span>
                    <select
                      value={assignmentForm.learningAreaId}
                      onChange={(event) =>
                        setAssignmentForm((current) => ({ ...current, learningAreaId: event.target.value }))
                      }
                      required
                    >
                      <option value="">Select learning area</option>
                      {areasForAssignmentClass.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="staff-actions">
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={actionBusy === "create-assignment" || actionBusy === "update-assignment"}
                    >
                      {actionBusy === "create-assignment" || actionBusy === "update-assignment"
                        ? "Saving..."
                        : editingAssignmentId
                          ? "Update assignment"
                          : "Save assignment"}
                    </button>
                    {editingAssignmentId ? (
                      <button className="ghost-button" type="button" onClick={cancelAssignmentEdit}>
                        Cancel edit
                      </button>
                    ) : null}
                  </div>
                </form>

                <form className="module-card" onSubmit={submitClassTeacher}>
                  <h3>Assign class teacher</h3>
                  <label className="field">
                    <span>Class teacher</span>
                    <select
                      value={classTeacherForm.teacherUserId}
                      onChange={(event) => setClassTeacherForm((current) => ({ ...current, teacherUserId: event.target.value }))}
                      required
                    >
                      <option value="">Select teacher</option>
                      {teacherOptions.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.full_name} - {formatRoleLabel(person.role)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Responsible class</span>
                    <select
                      value={classTeacherForm.classId}
                      onChange={(event) => setClassTeacherForm((current) => ({ ...current, classId: event.target.value }))}
                      required
                    >
                      <option value="">Select class</option>
                      {classes.map((classRoom) => (
                        <option key={classRoom.id} value={classRoom.id}>
                          {classRoom.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="primary-button" type="submit" disabled={actionBusy === "save-class-teacher"}>
                    {actionBusy === "save-class-teacher" ? "Saving..." : "Save class teacher"}
                  </button>
                </form>
              </div>

              <div className="portal-grid portal-grid-2">
                <article className="module-card">
                  <h3>Current accounts</h3>
                  <button className="ghost-button inline-button" type="button" onClick={() => setShowUserList((current) => !current)}>
                    {showUserList ? "Hide accounts" : "View accounts"}
                  </button>
                  {showUserList && users.length ? (
                    <div className="table-wrap">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((person) => (
                            <tr key={person.id}>
                              <td>{person.full_name}</td>
                              <td>{formatRoleLabel(person.role)}</td>
                              <td>{person.email}</td>
                              <td>{person.is_active === false ? "Inactive" : "Active"}</td>
                              <td>
                                <button className="ghost-button inline-button" type="button" onClick={() => editUser(person)}>
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : showUserList ? (
                    <EmptyState text="No user accounts have been loaded yet." />
                  ) : null}
                </article>
              </div>

              <article className="module-card">
                <h3>Teacher teaching map</h3>
                <button className="ghost-button inline-button" type="button" onClick={() => setShowTeacherMap((current) => !current)}>
                  {showTeacherMap ? "Hide teacher map" : "View teacher map"}
                </button>
                {showTeacherMap && (assignments.length || classResponsibilities.length) ? (
                  <div className="mapping-card-grid">
                    {classResponsibilities.map((responsibility) => (
                      <div className="summary-block" key={`class-${responsibility.id}`}>
                        <p>
                          <strong>{userMap.get(responsibility.teacher_user_id)?.full_name ?? `Teacher ${responsibility.teacher_user_id}`}</strong>
                        </p>
                        <p>{classMap.get(responsibility.class_id)?.name ?? `Class ${responsibility.class_id}`}</p>
                        <p className="helper-copy">Class teacher</p>
                      </div>
                    ))}
                    {assignments.map((assignment) => (
                      <div className="summary-block" key={assignment.id}>
                        <p>
                          <strong>{userMap.get(assignment.teacher_user_id)?.full_name ?? `Teacher ${assignment.teacher_user_id}`}</strong>
                        </p>
                        <p>{classMap.get(assignment.class_id)?.name ?? `Class ${assignment.class_id}`}</p>
                        <p>{areaMap.get(assignment.learning_area_id)?.name ?? `Learning area ${assignment.learning_area_id}`}</p>
                        {assignment.is_class_teacher ? <p className="helper-copy">Class responsibility</p> : null}
                      </div>
                    ))}
                  </div>
                ) : showTeacherMap ? (
                  <EmptyState text="Map teachers to classes and learning areas here, then their marks page will only show those mapped exams." />
                ) : null}
              </article>

              <article className="module-card">
                <h3>Teacher class and learning-area assignments</h3>
                <button className="ghost-button inline-button" type="button" onClick={() => setShowAssignmentList((current) => !current)}>
                  {showAssignmentList ? "Hide assignments" : "View assignments"}
                </button>
                {showAssignmentList && assignments.length ? (
                  <div className="table-wrap">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Teacher</th>
                          <th>Class</th>
                          <th>Learning area</th>
                          <th>Class teacher</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((assignment) => (
                          <tr key={assignment.id}>
                            <td>{userMap.get(assignment.teacher_user_id)?.full_name ?? `Teacher ${assignment.teacher_user_id}`}</td>
                            <td>{classMap.get(assignment.class_id)?.name ?? `Class ${assignment.class_id}`}</td>
                            <td>{areaMap.get(assignment.learning_area_id)?.name ?? `Learning area ${assignment.learning_area_id}`}</td>
                            <td>{assignment.is_class_teacher ? "Yes" : "No"}</td>
                            <td>
                              <button className="ghost-button inline-button" type="button" onClick={() => editAssignment(assignment)}>
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : showAssignmentList ? (
                  <EmptyState text="No teacher assignments have been saved yet." />
                ) : null}
              </article>
            </PortalSection>
          ) : null}

          {canManageReporting && activeModule === "reporting" ? (
            <PortalSection
              id="portal-reporting"
              kicker="Reporting"
              title="Learners, reporting, lists, and parent SMS"
              detail="Registration stays separate from reporting, but reporting now reuses the learner and parent data that was captured earlier."
            >
              {canManageSetup ? (
                <div className="section-tab-row">
                  <button
                    className={reportingView === "report" ? "portal-nav-chip active" : "portal-nav-chip"}
                    type="button"
                    onClick={() => setReportingView("report")}
                  >
                    Report existing learner
                  </button>
                  <button
                    className={reportingView === "register" ? "portal-nav-chip active" : "portal-nav-chip"}
                    type="button"
                    onClick={() => setReportingView("register")}
                  >
                    Register new learner
                  </button>
                </div>
              ) : null}

              <div className="portal-grid portal-grid-3">
                {reportingView === "register" && canManageSetup ? (
                  <>
                    <form className="module-card" onSubmit={submitLearner}>
                      <h3>{editingLearnerId ? "Edit learner" : "Register learner"}</h3>
                      <label className="field">
                        <span>Admission number</span>
                        <input
                          value={learnerForm.admissionNo}
                          onChange={(event) =>
                            setLearnerForm((current) => ({ ...current, admissionNo: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Full names</span>
                        <input
                          value={learnerForm.fullName}
                          onChange={(event) =>
                            setLearnerForm((current) => ({ ...current, fullName: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Class</span>
                        <select
                          value={learnerForm.classId}
                          onChange={(event) =>
                            setLearnerForm((current) => ({ ...current, classId: event.target.value }))
                          }
                          required
                        >
                          <option value="">Select class</option>
                          {classes.map((classRoom) => (
                            <option key={classRoom.id} value={classRoom.id}>
                              {classRoom.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Parent full name</span>
                        <input
                          value={learnerForm.parentFullName}
                          onChange={(event) =>
                            setLearnerForm((current) => ({ ...current, parentFullName: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Parent phone number</span>
                        <input
                          value={learnerForm.parentPhoneNumber}
                          onChange={(event) =>
                            setLearnerForm((current) => ({ ...current, parentPhoneNumber: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Boarding status</span>
                        <select
                          value={learnerForm.boardingStatus}
                          onChange={(event) =>
                            setLearnerForm((current) => ({ ...current, boardingStatus: event.target.value }))
                          }
                        >
                          <option>Day Scholar</option>
                          <option>Boarder</option>
                        </select>
                      </label>
                      {learnerForm.boardingStatus.toLowerCase().includes("board") ? null : (
                        <label className="field">
                          <span>Default transport mode</span>
                          <select
                            value={learnerForm.transportMode}
                            onChange={(event) =>
                              setLearnerForm((current) => ({ ...current, transportMode: event.target.value }))
                            }
                          >
                            <option>School Bus</option>
                            <option>Bicycle</option>
                            <option>Walking</option>
                            <option>Not Set</option>
                          </select>
                        </label>
                      )}
                      <div className="staff-actions">
                        <button
                          className="primary-button"
                          type="submit"
                          disabled={actionBusy === "create-learner" || actionBusy === "update-learner"}
                        >
                          {actionBusy === "create-learner" || actionBusy === "update-learner"
                            ? "Saving..."
                            : editingLearnerId
                              ? "Update learner"
                              : "Register learner"}
                        </button>
                        {editingLearnerId ? (
                          <button className="ghost-button" type="button" onClick={cancelLearnerEdit}>
                            Cancel edit
                          </button>
                        ) : null}
                      </div>
                    </form>

                    <article className="module-card">
                      <h3>Learner mapping note</h3>
                      <p>
                        Admin can update the learner's admission details, parent contact, boarding status, and class
                        from this screen.
                      </p>
                      <p className="helper-copy">
                        Changing the class here immediately remaps that learner to the selected class across reporting,
                        lists, messaging, library, and academics.
                      </p>
                      <button className="ghost-button" type="button" onClick={() => setReportingView("report")}>
                        Back to reporting
                      </button>
                    </article>
                  </>
                ) : (
                  <>
                    <form className="module-card" onSubmit={submitArrival}>
                      <h3>Report learner arrival</h3>
                      <label className="field">
                        <span>Learner name</span>
                        <select
                          value={arrivalForm.learnerId}
                          onChange={(event) =>
                            setArrivalForm((current) => ({ ...current, learnerId: event.target.value }))
                          }
                          required
                        >
                          <option value="">Click and select learner</option>
                          {learners.map((learner) => (
                            <option key={learner.id} value={learner.id}>
                              {learner.full_name} - {learner.admission_no}
                              {learner.class_name ? ` - ${learner.class_name}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>

                      {canManageSetup ? (
                        <button className="ghost-button inline-button" type="button" onClick={() => setReportingView("register")}>
                          New learner? Open registration
                        </button>
                      ) : null}

                      <label className="field">
                        <span>Accompanied by</span>
                        <select
                          value={arrivalForm.accompaniedSource}
                          onChange={(event) =>
                            setArrivalForm((current) => ({
                              ...current,
                              accompaniedSource: event.target.value,
                              accompaniedBy: "",
                              accompaniedPhone: "",
                            }))
                          }
                        >
                          <option value="parent">Parent</option>
                          <option value="other_person">Other person</option>
                        </select>
                      </label>

                      {arrivalForm.accompaniedSource === "parent" && selectedArrivalLearner ? (
                        <div className="summary-stack summary-block">
                          <p>
                            <strong>Parent:</strong> {selectedArrivalLearner.parent_full_name ?? "Not registered"}
                          </p>
                          <p>
                            <strong>Phone:</strong> {selectedArrivalLearner.parent_phone_number ?? "Not registered"}
                          </p>
                        </div>
                      ) : null}

                      {arrivalForm.accompaniedSource === "other_person" ? (
                        <>
                          <label className="field">
                            <span>Name of accompanying person</span>
                            <input
                              value={arrivalForm.accompaniedBy}
                              onChange={(event) =>
                                setArrivalForm((current) => ({ ...current, accompaniedBy: event.target.value }))
                              }
                              required
                            />
                          </label>
                          <label className="field">
                            <span>Phone number of accompanying person</span>
                            <input
                              value={arrivalForm.accompaniedPhone}
                              onChange={(event) =>
                                setArrivalForm((current) => ({ ...current, accompaniedPhone: event.target.value }))
                              }
                            />
                          </label>
                        </>
                      ) : null}

                      {selectedArrivalLearner ? (
                        selectedArrivalLearner.boarding_status.toLowerCase().includes("board") ? (
                          <p className="helper-copy">
                            This learner is a boarder, so the transport step is skipped and you can report directly.
                          </p>
                        ) : (
                          <label className="field">
                            <span>Arrival transport for day scholar</span>
                            <select
                              value={arrivalForm.arrivalTransportMode}
                              onChange={(event) =>
                                setArrivalForm((current) => ({
                                  ...current,
                                  arrivalTransportMode: event.target.value,
                                }))
                              }
                            >
                              <option>School Bus</option>
                              <option>Bicycle</option>
                              <option>Walking</option>
                            </select>
                          </label>
                        )
                      ) : null}

                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={arrivalForm.sendSms}
                          onChange={(event) =>
                            setArrivalForm((current) => ({ ...current, sendSms: event.target.checked }))
                          }
                        />
                        <span>Send SMS to the registered parent immediately</span>
                      </label>
                      <button className="primary-button" type="submit" disabled={actionBusy === "report-arrival"}>
                        {actionBusy === "report-arrival" ? "Saving..." : "Reported"}
                      </button>
                    </form>

                    <article className="module-card">
                      <h3>Selected learner details</h3>
                      {selectedArrivalLearner ? (
                        <div className="summary-stack">
                          <p>
                            <strong>Learner:</strong> {selectedArrivalLearner.full_name}
                          </p>
                          <p>
                            <strong>Admission no:</strong> {selectedArrivalLearner.admission_no}
                          </p>
                          <p>
                            <strong>Class:</strong> {selectedArrivalLearner.class_name ?? `Class ${selectedArrivalLearner.class_id}`}
                          </p>
                          <p>
                            <strong>Boarding status:</strong> {selectedArrivalLearner.boarding_status}
                          </p>
                          <p>
                            <strong>Registered parent:</strong> {selectedArrivalLearner.parent_full_name ?? "Not set"}
                          </p>
                          <p>
                            <strong>Parent phone:</strong> {selectedArrivalLearner.parent_phone_number ?? "Not set"}
                          </p>
                        </div>
                      ) : (
                        <EmptyState text="Choose a registered learner first so the system can fill the reporting details for you." />
                      )}
                    </article>
                  </>
                )}

                <article className="module-card">
                  <h3>Download lists</h3>
                  <label className="field">
                    <span>Class</span>
                    <select value={listClassId} onChange={(event) => setListClassId(event.target.value)}>
                      <option value="">Select class</option>
                      {classes.map((classRoom) => (
                        <option key={classRoom.id} value={classRoom.id}>
                          {classRoom.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="stack-actions">
                    <button className="primary-button" type="button" onClick={handleDownloadClassList}>
                      Download class list
                    </button>
                    <button className="ghost-button" type="button" onClick={handleDownloadBoarders}>
                      Download boarders list
                    </button>
                  </div>
                  <p className="helper-copy">
                    These downloads come straight from the shared school data, so reporting and list printing stay in
                    the same system.
                  </p>
                </article>
              </div>

              {canManageSetup ? (
                <article className="module-card">
                  <h3>Learner database and class mapping</h3>
                  <div className="section-tab-row">
                    <button className="primary-button" type="button" onClick={() => setShowLearnerDatabase((current) => !current)}>
                      {showLearnerDatabase ? "Hide learners" : "View all learners"}
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setShowClassLearnerSummary((current) => !current)}
                    >
                      {showClassLearnerSummary ? "Hide class summary" : "View class summary"}
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setLearnerFilters({ search: "", classId: "", status: "", transportMode: "" });
                        setShowLearnerDatabase(true);
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                  {showClassLearnerSummary ? (
                    classes.length ? (
                      <div className="mapping-card-grid">
                        {classes.map((classRoom) => (
                          <div className="summary-block" key={classRoom.id}>
                            <p>
                              <strong>{classRoom.name}</strong>
                            </p>
                            <p>{classRoom.stream ?? "No stream set"}</p>
                            <p>{learners.filter((learner) => learner.class_id === classRoom.id).length} learners</p>
                            <button className="ghost-button inline-button" type="button" onClick={() => editClass(classRoom)}>
                              Edit class
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="No classes have been loaded yet." />
                    )
                  ) : null}
                  {showLearnerDatabase ? (
                    <>
                      <div className="filter-grid">
                        <label className="field">
                          <span>Search</span>
                          <input
                            value={learnerFilters.search}
                            onChange={(event) => setLearnerFilters((current) => ({ ...current, search: event.target.value }))}
                            placeholder="Name, admission, or parent"
                          />
                        </label>
                        <label className="field">
                          <span>Class</span>
                          <select
                            value={learnerFilters.classId}
                            onChange={(event) => setLearnerFilters((current) => ({ ...current, classId: event.target.value }))}
                          >
                            <option value="">All classes</option>
                            {classes.map((classRoom) => (
                              <option key={classRoom.id} value={classRoom.id}>
                                {classRoom.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span>Status</span>
                          <select
                            value={learnerFilters.status}
                            onChange={(event) => setLearnerFilters((current) => ({ ...current, status: event.target.value }))}
                          >
                            <option value="">All statuses</option>
                            <option>Day Scholar</option>
                            <option>Boarder</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>Transport / dorm filter</span>
                          <select
                            value={learnerFilters.transportMode}
                            onChange={(event) =>
                              setLearnerFilters((current) => ({ ...current, transportMode: event.target.value }))
                            }
                          >
                            <option value="">All</option>
                            <option>N/A</option>
                            <option>School Bus</option>
                            <option>Bicycle</option>
                            <option>Walking</option>
                            <option>Not Set</option>
                          </select>
                        </label>
                      </div>
                      <p className="helper-copy">
                        Showing {filteredLearners.length} of {learners.length} learners.
                      </p>
                      {filteredLearners.length ? (
                        <div className="table-wrap">
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Learner</th>
                                <th>Admission</th>
                                <th>Class</th>
                                <th>Parent</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Transport</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredLearners.map((learner) => (
                                <tr key={learner.id}>
                                  <td>{learner.full_name}</td>
                                  <td>{learner.admission_no}</td>
                                  <td>{learner.class_name ?? `Class ${learner.class_id}`}</td>
                                  <td>{learner.parent_full_name ?? "Not set"}</td>
                                  <td>{learner.parent_phone_number ?? "Not set"}</td>
                                  <td>{learner.boarding_status}</td>
                                  <td>{learner.transport_mode}</td>
                                  <td>
                                    <button className="ghost-button inline-button" type="button" onClick={() => editLearner(learner)}>
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <EmptyState text="No learners match the selected filters." />
                      )}
                    </>
                  ) : (
                    <div className="summary-stack">
                      <p>
                        <strong>Total learners:</strong> {learners.length}
                      </p>
                      <p>
                        Use the button above only when you need to search, filter, or update the learner database.
                      </p>
                    </div>
                  )}
                </article>
              ) : null}

              <article className="module-card">
                <h3>Recent arrivals</h3>
                {recentArrivals.length ? (
                  <div className="table-wrap">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Learner</th>
                          <th>Admission</th>
                          <th>Class</th>
                          <th>Status</th>
                          <th>Reported at</th>
                          <th>Accompanied by</th>
                          <th>Transport</th>
                          <th>SMS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentArrivals.map((arrival) => (
                          <tr key={arrival.report_id}>
                            <td>{arrival.learner_name}</td>
                            <td>{arrival.admission_no}</td>
                            <td>{arrival.class_name ?? "-"}</td>
                            <td>{arrival.boarding_status}</td>
                            <td>{formatDateTime(arrival.report_time)}</td>
                            <td>
                              {arrival.accompanied_by}
                              {arrival.accompanied_source === "parent" ? " (Parent)" : " (Other person)"}
                            </td>
                            <td>{arrival.arrival_transport_mode ?? "Bypassed for boarder"}</td>
                            <td>{arrival.sms_status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text="No reporting records yet." />
                )}
              </article>
            </PortalSection>
          ) : null}

          {canManageAcademics && activeModule === "academics" ? (
            <PortalSection
              id="portal-academics"
              kicker="Academics"
              title="Teaching map and class responsibility"
              detail="This page keeps teaching assignments and class responsibility visible. Exam creation, marks entry, and merit lists now live on the Exams page."
            >
              {assignments.length ? (
                <article className="module-card">
                  <h3>Your assignments</h3>
                  <div className="pill-list">
                    {assignments.map((assignment) => (
                      <div className="pill" key={assignment.id}>
                        <strong>{classMap.get(assignment.class_id)?.name ?? `Class ${assignment.class_id}`}</strong>
                        <span>{areaMap.get(assignment.learning_area_id)?.name ?? `Learning area ${assignment.learning_area_id}`}</span>
                        {assignment.is_class_teacher ? <em>Class responsibility</em> : null}
                      </div>
                    ))}
                  </div>
                </article>
              ) : (
                <EmptyState text="No teaching assignments have been mapped yet." />
              )}
            </PortalSection>
          ) : null}

          {canManageAcademics && activeModule === "exams" ? (
            <PortalSection
              id="portal-exams"
              kicker="Exams"
              title="Exam control, marks entry, and merit lists"
              detail="Open an exam once, choose the class and learning area, then enter marks, review entered marks, or download merit lists from here."
            >
              {assignments.length ? (
                <article className="module-card">
                  <h3>Your assignments</h3>
                  <div className="pill-list">
                    {assignments.map((assignment) => (
                      <div className="pill" key={assignment.id}>
                        <strong>{classMap.get(assignment.class_id)?.name ?? `Class ${assignment.class_id}`}</strong>
                        <span>{areaMap.get(assignment.learning_area_id)?.name ?? `Learning area ${assignment.learning_area_id}`}</span>
                        {assignment.is_class_teacher ? <em>Class responsibility</em> : null}
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              {normalizedLoggedInRole !== "admin" && normalizedLoggedInRole !== "head_teacher" ? (
                <article className="module-card">
                  <h3>Currently running exams</h3>
                  {runningExamCycles.length ? (
                    <div className="mapping-card-grid">
                      {runningExamCycles.map((cycle) => (
                        <button
                          className="summary-block map-button"
                          type="button"
                          key={cycle.key}
                          onClick={() => selectExamForMarks(cycle.exams[0])}
                        >
                          <p>
                            <strong>{cycle.name}</strong>
                          </p>
                          <p>
                            {cycle.classIds.length} class{cycle.classIds.length === 1 ? "" : "es"} doing{" "}
                            {cycle.learningAreaIds.length} learning area{cycle.learningAreaIds.length === 1 ? "" : "s"}
                          </p>
                          <p className="helper-copy">
                            Deadline: {cycle.marks_deadline ? formatDateTime(cycle.marks_deadline) : "Not set"}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="No currently running exams are open for your mapped subjects." />
                  )}
                </article>
              ) : null}

              <article className="module-card">
                <h3>Exam database</h3>
                <div className="filter-grid">
                  <label className="field">
                    <span>Year</span>
                    <input
                      type="number"
                      value={examFilters.year}
                      onChange={(event) => setExamFilters((current) => ({ ...current, year: event.target.value }))}
                      placeholder="2026"
                    />
                  </label>
                  <label className="field">
                    <span>Term</span>
                    <select
                      value={examFilters.term}
                      onChange={(event) => setExamFilters((current) => ({ ...current, term: event.target.value }))}
                    >
                      <option value="">All terms</option>
                      <option>Term 1</option>
                      <option>Term 2</option>
                      <option>Term 3</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Month</span>
                    <select
                      value={examFilters.month}
                      onChange={(event) => setExamFilters((current) => ({ ...current, month: event.target.value }))}
                    >
                      <option value="">All months</option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((month) => (
                        <option key={month}>{month}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Exam type</span>
                    <select
                      value={examFilters.type}
                      onChange={(event) => setExamFilters((current) => ({ ...current, type: event.target.value }))}
                    >
                      <option value="">All types</option>
                      <option>Opener</option>
                      <option>Midterm</option>
                      <option>End Term</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Class</span>
                    <select
                      value={examFilters.classId}
                      onChange={(event) => setExamFilters((current) => ({ ...current, classId: event.target.value }))}
                    >
                      <option value="">All classes</option>
                      {classes.map((classRoom) => (
                        <option key={classRoom.id} value={classRoom.id}>
                          {classRoom.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {filteredExamCycles.length ? (
                  <div className="exam-cycle-list">
                    {filteredExamCycles.map((cycle) => (
                      <details className="summary-block" key={cycle.key}>
                        <summary>
                          <strong>{cycle.name}</strong>
                          <span>
                            {cycle.exam_type} - {cycle.exam_month ?? cycle.term} - {cycle.term} {cycle.year}
                          </span>
                          <em>
                            {cycle.status} - {cycle.classIds.length} class{cycle.classIds.length === 1 ? "" : "es"}
                          </em>
                        </summary>
                        {canManageSetup ? (
                          <div className="staff-actions">
                            <button
                              className="ghost-button inline-button"
                              type="button"
                              onClick={() => void updateExamCycleStatus(cycle.exams[0], "pause")}
                            >
                              Pause exam
                            </button>
                            <button
                              className="ghost-button inline-button"
                              type="button"
                              onClick={() => void updateExamCycleStatus(cycle.exams[0], "restart")}
                            >
                              Restart exam
                            </button>
                            <button
                              className="ghost-button inline-button"
                              type="button"
                              onClick={() => void updateExamCycleStatus(cycle.exams[0], "end")}
                            >
                              End exam
                            </button>
                          </div>
                        ) : null}
                        <div className="mapping-card-grid nested-map-grid">
                          {cycle.classIds.map((classId) => {
                            const classExams = cycle.exams.filter((exam) => exam.class_id === classId);
                            return (
                              <div className="summary-block" key={classId}>
                                <p>
                                  <strong>{classMap.get(classId)?.name ?? `Class ${classId}`}</strong>
                                </p>
                                <div className="pill-list">
                                  {classExams.map((exam) => (
                                    <span className="mini-pill" key={exam.id}>
                                      {areaMap.get(exam.learning_area_id)?.name ?? `Learning area ${exam.learning_area_id}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No exams match those filters yet." />
                )}
              </article>

              <div className={`academics-action-grid ${canManageSetup ? "academics-action-grid-admin" : ""}`}>
                {canManageSetup ? (
                  <form className="module-card academics-exam-card" onSubmit={submitExam}>
                    <h3>Create exam batch</h3>
                    <label className="field">
                      <span>Exam name</span>
                      <input
                        value={examForm.name}
                        onChange={(event) => setExamForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Term 1 Midterm Mathematics"
                        required
                      />
                    </label>
                    <div className="two-field-row">
                      <label className="field">
                        <span>Exam type</span>
                        <select
                          value={examForm.examType}
                          onChange={(event) => setExamForm((current) => ({ ...current, examType: event.target.value }))}
                        >
                          <option>Opener</option>
                          <option>Midterm</option>
                          <option>End Term</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Month done</span>
                        <select
                          value={examForm.examMonth}
                          onChange={(event) => setExamForm((current) => ({ ...current, examMonth: event.target.value }))}
                        >
                          {[
                            "January",
                            "February",
                            "March",
                            "April",
                            "May",
                            "June",
                            "July",
                            "August",
                            "September",
                            "October",
                            "November",
                            "December",
                          ].map((month) => (
                            <option key={month}>{month}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="two-field-row">
                      <label className="field">
                        <span>Term</span>
                        <select
                          value={examForm.term}
                          onChange={(event) => setExamForm((current) => ({ ...current, term: event.target.value }))}
                        >
                          <option>Term 1</option>
                          <option>Term 2</option>
                          <option>Term 3</option>
                        </select>
                      </label>
                      <label className="field">
                        <span>Year</span>
                        <input
                          type="number"
                          value={examForm.year}
                          onChange={(event) => setExamForm((current) => ({ ...current, year: event.target.value }))}
                          required
                        />
                      </label>
                    </div>
                    <label className="field">
                      <span>Marks entry deadline</span>
                      <input
                        type="datetime-local"
                        value={examForm.marksDeadline}
                        onChange={(event) => setExamForm((current) => ({ ...current, marksDeadline: event.target.value }))}
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Learning areas included</span>
                      <select
                        value={examForm.learningAreaScope}
                        onChange={(event) =>
                          setExamForm((current) => ({
                            ...current,
                            learningAreaScope: event.target.value as "all" | "specific",
                            learningAreaNames: [],
                          }))
                        }
                      >
                        <option value="all">All learning areas</option>
                        <option value="specific">Specific learning areas</option>
                      </select>
                    </label>
                    {examForm.learningAreaScope === "specific" ? (
                      <div className="field">
                        <span>Pick learning areas</span>
                        <div className="checkbox-grid compact-checkbox-grid">
                          {learningAreaNameOptions.map((areaName) => (
                            <label className="check-row" key={areaName}>
                              <input
                                type="checkbox"
                                checked={examForm.learningAreaNames.includes(areaName)}
                                onChange={(event) => toggleExamLearningArea(areaName, event.target.checked)}
                              />
                              <span>{areaName}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="helper-copy">This creates one exam entry for every learning area already mapped to each selected class.</p>
                    )}
                    <label className="field">
                      <span>Max marks</span>
                      <input
                        type="number"
                        value={examForm.maxMarks}
                        onChange={(event) => setExamForm((current) => ({ ...current, maxMarks: event.target.value }))}
                        required
                      />
                    </label>
                    <div className="field">
                      <span>CBC formula options</span>
                      <div className="formula-option-grid">
                        {CBC_FORMULA_OPTIONS.map((option) => (
                          <label className="check-row formula-option" key={option.id}>
                            <input
                              type="radio"
                              name="cbc-formula-option"
                              checked={examForm.cbcFormulaOption === option.id}
                              onChange={() => setExamForm((current) => ({ ...current, cbcFormulaOption: option.id }))}
                            />
                            <span>
                              <strong>{option.label}</strong>
                              <em>{option.detail}</em>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="generated-formula-row">
                      <span>Generated CBC formula</span>
                      <strong>{generatedExamCbcFormula}</strong>
                    </div>
                    <label className="field">
                      <span>Classes doing this exam</span>
                      <select
                        value={examForm.scope}
                        onChange={(event) =>
                          setExamForm((current) => ({
                            ...current,
                            scope: event.target.value as "single" | "multiple" | "whole_school",
                            classIds: [],
                          }))
                        }
                      >
                        <option value="single">One class</option>
                        <option value="multiple">Several classes</option>
                        <option value="whole_school">Whole school</option>
                      </select>
                    </label>
                    {examForm.scope === "whole_school" ? (
                      <p className="helper-copy">This will create the exam for every class currently in the system.</p>
                    ) : (
                      <div className="checkbox-grid">
                        {classes.map((classRoom) => (
                          <label className="check-row" key={classRoom.id}>
                            <input
                              type={examForm.scope === "single" ? "radio" : "checkbox"}
                              name="exam-class"
                              checked={examForm.classIds.includes(String(classRoom.id))}
                              onChange={(event) => {
                                if (examForm.scope === "single") {
                                  setExamForm((current) => ({ ...current, classIds: [String(classRoom.id)] }));
                                  return;
                                }
                                toggleExamClass(classRoom.id, event.target.checked);
                              }}
                            />
                            <span>{classRoom.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <button className="primary-button" type="submit" disabled={actionBusy === "create-exam"}>
                      {actionBusy === "create-exam" ? "Saving..." : "Create exam"}
                    </button>
                  </form>
                ) : null}

                <article className="module-card academics-marks-card" id="marks-entry-card">
                  <h3>Enter marks</h3>
                  <div className="section-tab-row">
                    <button
                      className={markEntryTab === "enter" ? "portal-nav-chip active" : "portal-nav-chip"}
                      type="button"
                      onClick={() => {
                        setMarkEntryTab("enter");
                        if (selectedMarkExam) {
                          setExamPageView("enter");
                        }
                      }}
                    >
                      Enter marks
                    </button>
                    <button
                      className={markEntryTab === "entered" ? "portal-nav-chip active" : "portal-nav-chip"}
                      type="button"
                      onClick={() => {
                        setMarkEntryTab("entered");
                        if (selectedMarkExam) {
                          setExamPageView("entered");
                        }
                      }}
                    >
                      Entered marks
                    </button>
                  </div>
                  <label className="field">
                    <span>Running exam</span>
                    <select
                      value={selectedExamCycleKey}
                      onChange={(event) => {
                        setSelectedExamCycleKey(event.target.value);
                        setSelectedExamClassId("");
                        setSelectedExamAreaId("");
                        setMarkForm({ learnerId: "", marks: "" });
                        setExamPageView("overview");
                      }}
                      required
                    >
                      <option value="">Select running exam</option>
                      {markExamCycles.map((cycle) => (
                        <option key={cycle.key} value={cycle.key}>
                          {cycle.name} - {cycle.exam_type} - {cycle.exam_month ?? cycle.term} - {cycle.term} {cycle.year}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!markExamCycles.length ? (
                    <p className="helper-copy">
                      No continuing exams are available for your mapped class and learning-area assignments yet.
                    </p>
                  ) : null}
                  {selectedMarkCycle ? (
                    <div className="mapping-card-grid">
                      {classesForSelectedMarkCycle.map((classRoom) => (
                        <button
                          className={
                            selectedExamClassId === String(classRoom.id)
                              ? "summary-block map-button selected-map-button"
                              : "summary-block map-button"
                          }
                          type="button"
                          key={classRoom.id}
                          onClick={() => {
                            setSelectedExamClassId(String(classRoom.id));
                            setSelectedExamAreaId("");
                            setMarkForm({ learnerId: "", marks: "" });
                            setExamPageView("overview");
                          }}
                        >
                          <p>
                            <strong>{classRoom.name}</strong>
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {selectedExamClassId ? (
                    <div className="pill-list">
                      {areasForSelectedMarkClass.map((area) => (
                        <button
                          className={selectedExamAreaId === String(area.id) ? "mini-pill active-mini-pill" : "mini-pill"}
                          type="button"
                          key={area.id}
                          onClick={() => {
                            setSelectedExamAreaId(String(area.id));
                            setMarkForm({ learnerId: "", marks: "" });
                            setExamPageView("overview");
                          }}
                        >
                          {area.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {selectedMarkExam && examPageView === "overview" ? (
                    <div className="staff-actions">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => {
                          setMarkEntryTab("enter");
                          setExamPageView("enter");
                        }}
                      >
                        Enter marks for this learning area
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => {
                          setMarkEntryTab("entered");
                          setExamPageView("entered");
                        }}
                      >
                        View entered marks
                      </button>
                    </div>
                  ) : null}
                  {selectedMarkExam && examPageView === "enter" ? (
                    <>
                      <button className="ghost-button inline-button" type="button" onClick={() => setExamPageView("overview")}>
                        Back to learning areas
                      </button>
                      <label className="field">
                        <span>Search learner</span>
                        <input
                          value={markLearnerSearch}
                          onChange={(event) => setMarkLearnerSearch(event.target.value)}
                          placeholder="Type learner name or admission number"
                        />
                      </label>
                      {learnersForMarkEntry.length ? (
                        <div className="learner-mark-grid">
                          {learnersForMarkEntry.map((learner) => (
                            <div className="summary-block learner-mark-row" key={learner.id}>
                              <div>
                                <p>
                                  <strong>{learner.full_name}</strong>
                                </p>
                                <p className="helper-copy">{learner.admission_no}</p>
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                value={learnerMarkDrafts[String(learner.id)] ?? ""}
                                onChange={(event) =>
                                  setLearnerMarkDrafts((current) => ({
                                    ...current,
                                    [String(learner.id)]: event.target.value,
                                  }))
                                }
                                placeholder="Marks"
                              />
                              <button
                                className="primary-button"
                                type="button"
                                disabled={actionBusy === `save-marks-${learner.id}`}
                                onClick={() => void saveLearnerMarks(learner.id, learnerMarkDrafts[String(learner.id)] ?? "")}
                              >
                                {actionBusy === `save-marks-${learner.id}` ? "Saving..." : "Save"}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState text="You have entered marks for all learners in this class and learning area." />
                      )}
                    </>
                  ) : null}
                  {selectedMarkExam && examPageView === "entered" ? (
                    <>
                      <button className="ghost-button inline-button" type="button" onClick={() => setExamPageView("overview")}>
                        Back to learning areas
                      </button>
                      <button className="ghost-button inline-button" type="button" onClick={downloadScoreSheetPdf}>
                        Download learning area score sheet
                      </button>
                      {enteredMarksForSelectedExam.length ? (
                        <div className="table-wrap">
                          <table className="portal-table">
                            <thead>
                              <tr>
                                <th>Learner</th>
                                <th>Admission</th>
                                <th>Marks</th>
                                <th>Level</th>
                              </tr>
                            </thead>
                            <tbody>
                              {enteredMarksForSelectedExam.map((entry) => (
                                <tr key={entry.id}>
                                  <td>{entry.learner_name}</td>
                                  <td>{entry.admission_no}</td>
                                  <td>{entry.marks}</td>
                                  <td>{entry.level ?? "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <EmptyState text="No marks have been entered for this learning area yet." />
                      )}
                    </>
                  ) : null}
                </article>

                <article className="module-card academics-merit-card">
                  <h3>Download merit lists</h3>
                  <label className="field">
                    <span>Class</span>
                    <select
                      value={meritForm.classId}
                      onChange={(event) => {
                        setExamAnalysis(null);
                        setMeritForm((current) => ({
                          ...current,
                          classId: event.target.value,
                          examId: "",
                          learningAreaId: "",
                        }));
                      }}
                    >
                      <option value="">Select class</option>
                      {classes.map((classRoom) => (
                        <option key={classRoom.id} value={classRoom.id}>
                          {classRoom.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Exam</span>
                    <select
                      value={meritForm.examId}
                      onChange={(event) => {
                        setExamAnalysis(null);
                        setMeritForm((current) => ({ ...current, examId: event.target.value }));
                      }}
                    >
                      <option value="">Select exam</option>
                      {examsForMeritClass.map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.name} - {exam.exam_type} - {areaMap.get(exam.learning_area_id)?.name ?? exam.learning_area_id}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Learning area for merit list</span>
                    <select
                      value={meritForm.learningAreaId}
                      onChange={(event) => {
                        setExamAnalysis(null);
                        setMeritForm((current) => ({ ...current, learningAreaId: event.target.value }));
                      }}
                    >
                      <option value="">Select learning area</option>
                      {areasForMeritClass.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="stack-actions">
                    <button className="primary-button" type="button" onClick={() => void handleMeritDownload("full")}>
                      Download class merit list
                    </button>
                    <button className="ghost-button" type="button" onClick={() => void handleMeritDownload("subject")}>
                      Download learning area merit list
                    </button>
                    <button className="ghost-button" type="button" onClick={() => void handleExamAnalysis()}>
                      Generate CBC analysis
                    </button>
                  </div>
                </article>
              </div>

              {examAnalysis ? (
                <article className="module-card analysis-card">
                  <div className="section-heading compact-heading">
                    <p className="section-kicker">CBC exam analysis</p>
                    <h3>
                      {examAnalysis.exam.name} - {classMap.get(examAnalysis.class_id)?.name ?? `Class ${examAnalysis.class_id}`}
                    </h3>
                  </div>
                  <div className="analysis-stat-grid">
                    <div>
                      <span>Class average</span>
                      <strong>{examAnalysis.summary.class_average}%</strong>
                    </div>
                    <div>
                      <span>Completion</span>
                      <strong>{examAnalysis.summary.completion_rate}%</strong>
                    </div>
                    <div>
                      <span>Learning areas</span>
                      <strong>{examAnalysis.summary.learning_area_count}</strong>
                    </div>
                    <div>
                      <span>Marks entered</span>
                      <strong>{examAnalysis.summary.marks_entered}</strong>
                    </div>
                  </div>
                  <div className="insight-list">
                    {examAnalysis.insights.map((insight) => (
                      <span className="mini-pill" key={insight}>
                        {insight}
                      </span>
                    ))}
                  </div>
                  <button className="ghost-button inline-button" type="button" onClick={downloadExamAnalysisCsv}>
                    Download CBC broadsheet
                  </button>
                  <div className="table-wrap">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Learning area</th>
                          <th>Average</th>
                          <th>High</th>
                          <th>Low</th>
                          <th>Missing</th>
                          <th>CBC levels</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examAnalysis.subject_analysis.map((subject) => (
                          <tr key={subject.exam_id}>
                            <td>{subject.learning_area_name}</td>
                            <td>{subject.average_marks}</td>
                            <td>{subject.highest_marks}</td>
                            <td>{subject.lowest_marks}</td>
                            <td>{subject.missing_count}</td>
                            <td>
                              {Object.entries(subject.cbc_distribution)
                                .map(([level, count]) => `${level}: ${count}`)
                                .join(", ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {examAnalysis.support_learners.length ? (
                    <div className="intervention-panel">
                      <h3>Intervention watchlist</h3>
                      <div className="pill-list">
                        {examAnalysis.support_learners.map((learner) => (
                          <span className="mini-pill" key={learner.learner_id}>
                            {learner.learner_name} - {learner.cbc_level ?? "Unrated"} - {learner.average_percent}%
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="table-wrap">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Pos</th>
                          <th>Learner</th>
                          <th>Total</th>
                          <th>Average</th>
                          <th>CBC</th>
                          <th>Missing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examAnalysis.learner_analysis.slice(0, 20).map((learner) => (
                          <tr key={learner.learner_id}>
                            <td>{learner.position}</td>
                            <td>{learner.learner_name}</td>
                            <td>{learner.total_marks}</td>
                            <td>{learner.average_percent}%</td>
                            <td>{learner.cbc_level ?? "-"}</td>
                            <td>{learner.missing_subjects.join(", ") || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ) : null}

              {liveMeritList?.items.length && canViewSelectedClassMerit ? (
                <article className="module-card">
                  <div className="section-heading compact-heading">
                    <p className="section-kicker">Live class merit list</p>
                    <h3>{classMap.get(liveMeritList.class_id)?.name ?? `Class ${liveMeritList.class_id}`}</h3>
                  </div>
                  <button
                    className="ghost-button inline-button"
                    type="button"
                    onClick={() =>
                      downloadCsv(
                        "class-merit-list.csv",
                        liveMeritList.items.map((item) => ({
                          position: item.position,
                          admission_no: item.admission_no,
                          learner_name: item.learner_name,
                          total_marks: item.total_marks,
                          subject_count: item.subject_count,
                        })),
                      )
                    }
                  >
                    Download class merit list
                  </button>
                  <div className="table-wrap">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Position</th>
                          <th>Learner</th>
                          <th>Admission</th>
                          <th>Total marks</th>
                          <th>Subjects</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveMeritList.items.slice(0, 12).map((item) => (
                          <tr key={item.learner_id}>
                            <td>{item.position}</td>
                            <td>{item.learner_name}</td>
                            <td>{item.admission_no}</td>
                            <td>{item.total_marks}</td>
                            <td>{item.subject_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ) : null}

              {meritList?.items.length ? (
                <article className="module-card">
                  <h3>Last generated merit list</h3>
                  <div className="table-wrap">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Position</th>
                          <th>Learner</th>
                          <th>Admission</th>
                          <th>Total marks</th>
                          <th>Subjects</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meritList.items.slice(0, 10).map((item) => (
                          <tr key={item.learner_id}>
                            <td>{item.position}</td>
                            <td>{item.learner_name}</td>
                            <td>{item.admission_no}</td>
                            <td>{item.total_marks}</td>
                            <td>{item.subject_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ) : null}
            </PortalSection>
          ) : null}

          {canViewTimetable && activeModule === "timetable" ? (
            <PortalSection
              id="portal-timetable"
              kicker="Timetable"
              title="School timetable planning"
              detail="Build the school week from existing classes, teachers, and learning areas while preventing class, teacher, and room clashes."
            >
              <div className="portal-grid portal-grid-3">
                {canManageTimetable ? (
                  <>
                    <form className="module-card" onSubmit={submitTimetablePeriod}>
                      <h3>School periods</h3>
                      <label className="field">
                        <span>Period name</span>
                        <input
                          value={timetablePeriodForm.name}
                          onChange={(event) => setTimetablePeriodForm((current) => ({ ...current, name: event.target.value }))}
                          placeholder="Lesson 1"
                          required
                        />
                      </label>
                      <div className="two-field-row">
                        <label className="field">
                          <span>Start time</span>
                          <input
                            type="time"
                            value={timetablePeriodForm.startTime}
                            onChange={(event) => setTimetablePeriodForm((current) => ({ ...current, startTime: event.target.value }))}
                            required
                          />
                        </label>
                        <label className="field">
                          <span>End time</span>
                          <input
                            type="time"
                            value={timetablePeriodForm.endTime}
                            onChange={(event) => setTimetablePeriodForm((current) => ({ ...current, endTime: event.target.value }))}
                            required
                          />
                        </label>
                      </div>
                      <div className="two-field-row">
                        <label className="field">
                          <span>Order</span>
                          <input
                            type="number"
                            value={timetablePeriodForm.sortOrder}
                            onChange={(event) => setTimetablePeriodForm((current) => ({ ...current, sortOrder: event.target.value }))}
                            required
                          />
                        </label>
                        <label className="check-row timetable-check-row">
                          <input
                            type="checkbox"
                            checked={timetablePeriodForm.isBreak}
                            onChange={(event) => setTimetablePeriodForm((current) => ({ ...current, isBreak: event.target.checked }))}
                          />
                          <span>Break or lunch</span>
                        </label>
                      </div>
                      <button className="primary-button" type="submit" disabled={actionBusy === "create-timetable-period"}>
                        {actionBusy === "create-timetable-period" ? "Saving..." : "Add period"}
                      </button>
                    </form>

                    <form className="module-card" onSubmit={submitTimetableRoom}>
                      <h3>Rooms and spaces</h3>
                      <label className="field">
                        <span>Room name</span>
                        <input
                          value={timetableRoomForm.name}
                          onChange={(event) => setTimetableRoomForm((current) => ({ ...current, name: event.target.value }))}
                          placeholder="Grade 7 Room"
                          required
                        />
                      </label>
                      <label className="field">
                        <span>Room type</span>
                        <input
                          value={timetableRoomForm.roomType}
                          onChange={(event) => setTimetableRoomForm((current) => ({ ...current, roomType: event.target.value }))}
                          placeholder="Classroom, Lab, Hall"
                        />
                      </label>
                      <label className="field">
                        <span>Capacity</span>
                        <input
                          type="number"
                          value={timetableRoomForm.capacity}
                          onChange={(event) => setTimetableRoomForm((current) => ({ ...current, capacity: event.target.value }))}
                        />
                      </label>
                      <button className="primary-button" type="submit" disabled={actionBusy === "create-timetable-room"}>
                        {actionBusy === "create-timetable-room" ? "Saving..." : "Add room"}
                      </button>
                    </form>

                    <form className="module-card" onSubmit={submitTimetableRequirement}>
                      <h3>Weekly lesson cards</h3>
                      <label className="field">
                        <span>Class</span>
                        <select
                          value={timetableRequirementForm.classId}
                          onChange={(event) =>
                            setTimetableRequirementForm((current) => ({
                              ...current,
                              classId: event.target.value,
                              learningAreaId: "",
                              teacherUserId: "",
                            }))
                          }
                          required
                        >
                          <option value="">Select class</option>
                          {classes.map((classRoom) => (
                            <option key={classRoom.id} value={classRoom.id}>
                              {classRoom.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Learning area</span>
                        <select
                          value={timetableRequirementForm.learningAreaId}
                          onChange={(event) =>
                            setTimetableRequirementForm((current) => ({
                              ...current,
                              learningAreaId: event.target.value,
                              teacherUserId: "",
                            }))
                          }
                          required
                        >
                          <option value="">Select learning area</option>
                          {timetableRequirementLearningAreaOptions.map((area) => (
                            <option key={area.id} value={area.id}>
                              {area.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Teacher</span>
                        <select
                          value={timetableRequirementForm.teacherUserId}
                          onChange={(event) =>
                            setTimetableRequirementForm((current) => ({ ...current, teacherUserId: event.target.value }))
                          }
                          required
                        >
                          <option value="">Select assigned teacher</option>
                          {timetableRequirementTeacherOptions.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.full_name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="two-field-row">
                        <label className="field">
                          <span>Periods per week</span>
                          <input
                            type="number"
                            min="1"
                            value={timetableRequirementForm.periodsPerWeek}
                            onChange={(event) =>
                              setTimetableRequirementForm((current) => ({ ...current, periodsPerWeek: event.target.value }))
                            }
                            required
                          />
                        </label>
                        <label className="field">
                          <span>Max per day</span>
                          <input
                            type="number"
                            min="1"
                            value={timetableRequirementForm.maxPeriodsPerDay}
                            onChange={(event) =>
                              setTimetableRequirementForm((current) => ({ ...current, maxPeriodsPerDay: event.target.value }))
                            }
                            required
                          />
                        </label>
                      </div>
                      <label className="field">
                        <span>Preferred room</span>
                        <select
                          value={timetableRequirementForm.preferredRoomId}
                          onChange={(event) =>
                            setTimetableRequirementForm((current) => ({ ...current, preferredRoomId: event.target.value }))
                          }
                        >
                          <option value="">Any room</option>
                          {timetableRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="check-row timetable-check-row">
                        <input
                          type="checkbox"
                          checked={timetableRequirementForm.allowDoublePeriods}
                          onChange={(event) =>
                            setTimetableRequirementForm((current) => ({ ...current, allowDoublePeriods: event.target.checked }))
                          }
                        />
                        <span>Allow double lessons</span>
                      </label>
                      <label className="field">
                        <span>Notes</span>
                        <input
                          value={timetableRequirementForm.notes}
                          onChange={(event) =>
                            setTimetableRequirementForm((current) => ({ ...current, notes: event.target.value }))
                          }
                          placeholder="Practical, library, lab preference"
                        />
                      </label>
                      <button className="primary-button" type="submit" disabled={actionBusy === "create-timetable-requirement"}>
                        {actionBusy === "create-timetable-requirement" ? "Saving..." : "Create cards"}
                      </button>
                    </form>
                  </>
                ) : null}

                {canManageTimetable ? (
                  <form className="module-card" onSubmit={submitTimetableSlot}>
                    <h3>Add lesson</h3>
                    <label className="field">
                      <span>Lesson card</span>
                      <select
                        value={timetableSlotForm.requirementId}
                        onChange={(event) => {
                          const requirement = timetableRequirementMap.get(Number(event.target.value));
                          setTimetableSlotForm((current) => ({
                            ...current,
                            requirementId: event.target.value,
                            classId: requirement ? String(requirement.class_id) : current.classId,
                            learningAreaId: requirement ? String(requirement.learning_area_id) : current.learningAreaId,
                            teacherUserId: requirement ? String(requirement.teacher_user_id) : current.teacherUserId,
                            roomId: requirement?.preferred_room_id ? String(requirement.preferred_room_id) : current.roomId,
                            notes: requirement?.notes ?? current.notes,
                          }));
                        }}
                      >
                        <option value="">Manual lesson</option>
                        {requirementCards.map(({ requirement, remainingCount }) => (
                          <option key={requirement.id} value={requirement.id}>
                            {classMap.get(requirement.class_id)?.name ?? "Class"} -{" "}
                            {areaMap.get(requirement.learning_area_id)?.name ?? "Learning area"} ({remainingCount} left)
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="two-field-row">
                      <label className="field">
                        <span>Day</span>
                        <select
                          value={timetableSlotForm.dayOfWeek}
                          onChange={(event) => setTimetableSlotForm((current) => ({ ...current, dayOfWeek: event.target.value }))}
                        >
                          {SCHOOL_DAYS.map((day) => (
                            <option key={day}>{day}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Period</span>
                        <select
                          value={timetableSlotForm.periodId}
                          onChange={(event) => setTimetableSlotForm((current) => ({ ...current, periodId: event.target.value }))}
                          required
                        >
                          <option value="">Select period</option>
                          {timetablePeriods
                            .filter((period) => !period.is_break)
                            .map((period) => (
                              <option key={period.id} value={period.id}>
                                {period.name} ({period.start_time}-{period.end_time})
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                    <label className="field">
                      <span>Class</span>
                      <select
                        value={timetableSlotForm.classId}
                        onChange={(event) =>
                          setTimetableSlotForm((current) => ({
                            ...current,
                            classId: event.target.value,
                            learningAreaId: "",
                            teacherUserId: "",
                          }))
                        }
                        required
                      >
                        <option value="">Select class</option>
                        {classes.map((classRoom) => (
                          <option key={classRoom.id} value={classRoom.id}>
                            {classRoom.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Learning area</span>
                      <select
                        value={timetableSlotForm.learningAreaId}
                        onChange={(event) =>
                          setTimetableSlotForm((current) => ({
                            ...current,
                            learningAreaId: event.target.value,
                            teacherUserId: "",
                          }))
                        }
                        required
                      >
                        <option value="">Select learning area</option>
                        {timetableLearningAreaOptions.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Teacher</span>
                      <select
                        value={timetableSlotForm.teacherUserId}
                        onChange={(event) => setTimetableSlotForm((current) => ({ ...current, teacherUserId: event.target.value }))}
                        required
                      >
                        <option value="">Select assigned teacher</option>
                        {timetableTeacherOptions.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.full_name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Room</span>
                      <select
                        value={timetableSlotForm.roomId}
                        onChange={(event) => setTimetableSlotForm((current) => ({ ...current, roomId: event.target.value }))}
                      >
                        <option value="">No fixed room</option>
                        {timetableRooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Notes</span>
                      <input
                        value={timetableSlotForm.notes}
                        onChange={(event) => setTimetableSlotForm((current) => ({ ...current, notes: event.target.value }))}
                        placeholder="Lab, double lesson, practical"
                      />
                    </label>
                    <label className="check-row timetable-check-row">
                      <input
                        type="checkbox"
                        checked={timetableSlotForm.isLocked}
                        onChange={(event) => setTimetableSlotForm((current) => ({ ...current, isLocked: event.target.checked }))}
                      />
                      <span>Lock card on this position</span>
                    </label>
                    <button className="primary-button" type="submit" disabled={actionBusy === "create-timetable-slot"}>
                      {actionBusy === "create-timetable-slot" ? "Saving..." : "Add lesson"}
                    </button>
                  </form>
                ) : null}
              </div>

              {canManageTimetable ? (
                <div className="portal-grid portal-grid-2 timetable-control-grid">
                  <article className="module-card timetable-card-list">
                    <div className="section-heading compact-heading">
                      <p className="section-kicker">Unplaced cards</p>
                      <h3>Weekly load</h3>
                    </div>
                    {requirementCards.length ? (
                      <div className="timetable-requirement-list">
                        {requirementCards.map(({ requirement, placedCount, remainingCount }) => (
                          <div className="timetable-requirement-card" key={requirement.id}>
                            <strong>{areaMap.get(requirement.learning_area_id)?.name ?? "Learning area"}</strong>
                            <span>{classMap.get(requirement.class_id)?.name ?? `Class ${requirement.class_id}`}</span>
                            <span>{userMap.get(requirement.teacher_user_id)?.full_name ?? "Teacher"}</span>
                            <em>
                              {placedCount}/{requirement.periods_per_week} placed
                              {remainingCount ? ` - ${remainingCount} left` : " - complete"}
                            </em>
                            {requirement.preferred_room_id ? (
                              <span>{timetableRoomMap.get(requirement.preferred_room_id)?.name ?? "Preferred room"}</span>
                            ) : null}
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => void deleteTimetableRequirement(requirement.id)}
                              disabled={actionBusy === `delete-timetable-requirement-${requirement.id}`}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="Create weekly lesson cards from class, learning area, teacher, and periods per week." />
                    )}
                  </article>

                  <article className="module-card timetable-check-panel">
                    <div className="section-heading compact-heading">
                      <p className="section-kicker">Checks and generation</p>
                      <h3>Timetable test</h3>
                    </div>
                    <div className="staff-actions">
                      <button className="primary-button" type="button" onClick={() => void runTimetableCheck()} disabled={actionBusy === "check-timetable"}>
                        {actionBusy === "check-timetable" ? "Checking..." : "Check timetable"}
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => void generateTimetableCards()}
                        disabled={actionBusy === "generate-timetable"}
                      >
                        {actionBusy === "generate-timetable" ? "Generating..." : "Generate missing cards"}
                      </button>
                    </div>
                    {timetableChecks.length ? (
                      <div className="timetable-check-list">
                        {timetableChecks.map((check, index) => (
                          <p className={`timetable-check-item ${check.severity}`} key={`${check.message}-${index}`}>
                            <strong>{check.severity}</strong>
                            <span>{check.message}</span>
                          </p>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="Run the timetable test to find missing cards and clashes before publishing." />
                    )}
                  </article>
                </div>
              ) : null}

              <article className="module-card timetable-board-card">
                <div className="section-heading compact-heading">
                  <p className="section-kicker">Weekly grid</p>
                  <h3>Timetable board</h3>
                </div>
                <div className="filter-grid timetable-filter-grid">
                  <label className="field">
                    <span>Class view</span>
                    <select value={timetableClassFilter} onChange={(event) => setTimetableClassFilter(event.target.value)}>
                      <option value="">All classes</option>
                      {classes.map((classRoom) => (
                        <option key={classRoom.id} value={classRoom.id}>
                          {classRoom.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {normalizedLoggedInRole === "admin" || normalizedLoggedInRole === "head_teacher" ? (
                    <label className="field">
                      <span>Teacher view</span>
                      <select value={timetableTeacherFilter} onChange={(event) => setTimetableTeacherFilter(event.target.value)}>
                        <option value="">All teachers</option>
                        {teacherOptions.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.full_name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
                {timetablePeriods.length ? (
                  <div className="timetable-grid-wrap">
                    <table className="portal-table timetable-grid">
                      <thead>
                        <tr>
                          <th>Day</th>
                          {timetablePeriods.map((period) => (
                            <th key={period.id}>
                              {period.name}
                              <span>{period.start_time}-{period.end_time}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {SCHOOL_DAYS.map((day) => (
                          <tr key={day}>
                            <th>{day}</th>
                            {timetablePeriods.map((period) => {
                              const cellSlots = timetableSlotsByCell.get(`${day}:${period.id}`) ?? [];
                              return (
                                <td className={period.is_break ? "break-cell" : ""} key={period.id}>
                                  {period.is_break ? (
                                    <span className="break-label">Break</span>
                                  ) : cellSlots.length ? (
                                    <div className="timetable-cell-stack">
                                      {cellSlots.map((slot) => (
                                        <div className="timetable-lesson" key={slot.id}>
                                          <strong>{areaMap.get(slot.learning_area_id)?.name ?? "Learning area"}</strong>
                                          <span>{classMap.get(slot.class_id)?.name ?? `Class ${slot.class_id}`}</span>
                                          <span>{userMap.get(slot.teacher_user_id)?.full_name ?? "Teacher"}</span>
                                          {slot.room_id ? <em>{timetableRoomMap.get(slot.room_id)?.name ?? "Room"}</em> : null}
                                          {slot.is_locked ? <em>Locked</em> : null}
                                          {canManageTimetable ? (
                                            <button
                                              className="text-button"
                                              type="button"
                                              onClick={() => void deleteTimetableSlot(slot.id)}
                                              disabled={actionBusy === `delete-timetable-slot-${slot.id}`}
                                            >
                                              Remove
                                            </button>
                                          ) : null}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="empty-timetable-cell">Free</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text="Create periods first, then place lessons into the weekly timetable." />
                )}
              </article>
            </PortalSection>
          ) : null}

          {canManageMessaging && activeModule === "messaging" ? (
            <PortalSection
              id="portal-messaging"
              kicker="Messaging"
              title="Templates, class messages, and admin broadcasts"
              detail="Teachers with class responsibility message their own classes, while admin and the school principal can broadcast by school filters."
            >
              <div className="portal-grid portal-grid-3">
                <form className="module-card" onSubmit={submitTemplate}>
                  <h3>Create SMS template</h3>
                  <label className="field">
                    <span>Template name</span>
                    <input
                      value={templateForm.name}
                      onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Scope</span>
                    <select
                      value={templateForm.scope}
                      onChange={(event) => setTemplateForm((current) => ({ ...current, scope: event.target.value }))}
                    >
                      <option value="admin">Admin</option>
                      <option value="head_teacher">School principal</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Message body</span>
                    <textarea
                      value={templateForm.messageBody}
                      onChange={(event) =>
                        setTemplateForm((current) => ({ ...current, messageBody: event.target.value }))
                      }
                      rows={5}
                      required
                    />
                  </label>
                  <button className="primary-button" type="submit" disabled={actionBusy === "create-template"}>
                    {actionBusy === "create-template" ? "Saving..." : "Save template"}
                  </button>
                </form>

                <form className="module-card" onSubmit={submitClassMessage}>
                  <h3>Send class message</h3>
                  <label className="field">
                    <span>Class</span>
                    <select
                      value={classMessageForm.classId}
                      onChange={(event) =>
                        setClassMessageForm((current) => ({ ...current, classId: event.target.value }))
                      }
                      required
                    >
                      <option value="">Select class</option>
                      {classMessageOptions.map((classOption) => (
                        <option key={classOption.id} value={classOption.id}>
                          {classOption.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Message</span>
                    <textarea
                      rows={5}
                      value={classMessageForm.messageBody}
                      onChange={(event) =>
                        setClassMessageForm((current) => ({ ...current, messageBody: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <button className="primary-button" type="submit" disabled={actionBusy === "send-class-message"}>
                    {actionBusy === "send-class-message" ? "Sending..." : "Send to class parents"}
                  </button>
                </form>

                {canManageBroadcasts ? (
                  <form className="module-card" onSubmit={submitBroadcast}>
                    <h3>Send broadcast</h3>
                    <label className="field">
                      <span>Audience filter</span>
                      <select
                        value={broadcastForm.audienceFilter}
                        onChange={(event) =>
                          setBroadcastForm((current) => ({
                            ...current,
                            audienceFilter: event.target.value,
                            classId: event.target.value === "class" ? current.classId : "",
                          }))
                        }
                      >
                        <option value="whole_school">Whole school</option>
                        <option value="boarding">Boarding parents</option>
                        <option value="day_scholars">Day scholars</option>
                        <option value="class">Single class</option>
                      </select>
                    </label>
                    {broadcastForm.audienceFilter === "class" ? (
                      <label className="field">
                        <span>Class</span>
                        <select
                          value={broadcastForm.classId}
                          onChange={(event) =>
                            setBroadcastForm((current) => ({ ...current, classId: event.target.value }))
                          }
                        >
                          <option value="">Select class</option>
                          {classes.map((classRoom) => (
                            <option key={classRoom.id} value={classRoom.id}>
                              {classRoom.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <label className="field">
                      <span>Use template</span>
                      <select
                        value={broadcastForm.templateId}
                        onChange={(event) =>
                          setBroadcastForm((current) => ({ ...current, templateId: event.target.value }))
                        }
                      >
                        <option value="">Write a fresh message</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Message</span>
                      <textarea
                        rows={5}
                        value={broadcastForm.messageBody}
                        onChange={(event) =>
                          setBroadcastForm((current) => ({ ...current, messageBody: event.target.value }))
                        }
                        placeholder="Leave this empty if you are using a saved template."
                      />
                    </label>
                    <button className="primary-button" type="submit" disabled={actionBusy === "send-broadcast"}>
                      {actionBusy === "send-broadcast" ? "Sending..." : "Send broadcast"}
                    </button>
                  </form>
                ) : null}
              </div>

              <article className="module-card">
                <h3>Recent delivery logs</h3>
                {deliveryLogs.length ? (
                  <div className="table-wrap">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Audience</th>
                          <th>Phone</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryLogs.slice(0, 12).map((log) => (
                          <tr key={log.id}>
                            <td>{formatDateTime(log.created_at)}</td>
                            <td>{log.audience_type}</td>
                            <td>{log.phone_number}</td>
                            <td>{log.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState text="No SMS delivery logs yet." />
                )}
              </article>
            </PortalSection>
          ) : null}

          {canManageLibrary && activeModule === "library" ? (
            <PortalSection
              id="portal-library"
              kicker="Library"
              title="Book registry, issue, return, and overdue tracking"
              detail="The librarian station now lives in the same school system, with stock and assignment visibility."
            >
              <div className="portal-grid portal-grid-3">
                <form className="module-card" onSubmit={submitBook}>
                  <h3>Add book</h3>
                  <label className="field">
                    <span>Accession number</span>
                    <input
                      value={bookForm.accessionNo}
                      onChange={(event) => setBookForm((current) => ({ ...current, accessionNo: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Title</span>
                    <input
                      value={bookForm.title}
                      onChange={(event) => setBookForm((current) => ({ ...current, title: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Author</span>
                    <input
                      value={bookForm.author}
                      onChange={(event) => setBookForm((current) => ({ ...current, author: event.target.value }))}
                    />
                  </label>
                  <label className="field">
                    <span>Category</span>
                    <input
                      value={bookForm.category}
                      onChange={(event) => setBookForm((current) => ({ ...current, category: event.target.value }))}
                    />
                  </label>
                  <label className="field">
                    <span>Total copies</span>
                    <input
                      type="number"
                      value={bookForm.totalCopies}
                      onChange={(event) =>
                        setBookForm((current) => ({ ...current, totalCopies: event.target.value }))
                      }
                    />
                  </label>
                  <button className="primary-button" type="submit" disabled={actionBusy === "create-book"}>
                    {actionBusy === "create-book" ? "Saving..." : "Add book"}
                  </button>
                </form>

                <form className="module-card" onSubmit={submitLoan}>
                  <h3>Issue book</h3>
                  <label className="field">
                    <span>Book</span>
                    <select
                      value={loanForm.bookId}
                      onChange={(event) => setLoanForm((current) => ({ ...current, bookId: event.target.value }))}
                      required
                    >
                      <option value="">Select book</option>
                      {books.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} ({book.available_copies}/{book.total_copies} available)
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Borrower type</span>
                    <select
                      value={loanForm.borrowerType}
                      onChange={(event) =>
                        setLoanForm((current) => ({
                          ...current,
                          borrowerType: event.target.value as "learner" | "teacher" | "class",
                          learnerId: "",
                          teacherUserId: "",
                          classId: "",
                        }))
                      }
                    >
                      <option value="learner">Learner</option>
                      <option value="teacher">Teacher</option>
                      <option value="class">Class</option>
                    </select>
                  </label>
                  {loanForm.borrowerType === "learner" ? (
                    <label className="field">
                      <span>Learner</span>
                      <select
                        value={loanForm.learnerId}
                        onChange={(event) => setLoanForm((current) => ({ ...current, learnerId: event.target.value }))}
                      >
                        <option value="">Select learner</option>
                        {learners.map((learner) => (
                          <option key={learner.id} value={learner.id}>
                            {learner.full_name} ({learner.admission_no})
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {loanForm.borrowerType === "teacher" ? (
                    <label className="field">
                      <span>Teacher</span>
                      <select
                        value={loanForm.teacherUserId}
                        onChange={(event) =>
                          setLoanForm((current) => ({ ...current, teacherUserId: event.target.value }))
                        }
                      >
                        <option value="">Select teacher</option>
                        {teacherOptions.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.full_name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {loanForm.borrowerType === "class" ? (
                    <label className="field">
                      <span>Class</span>
                      <select
                        value={loanForm.classId}
                        onChange={(event) => setLoanForm((current) => ({ ...current, classId: event.target.value }))}
                      >
                        <option value="">Select class</option>
                        {classes.map((classRoom) => (
                          <option key={classRoom.id} value={classRoom.id}>
                            {classRoom.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="field">
                    <span>Due date</span>
                    <input
                      type="datetime-local"
                      value={loanForm.dueAt}
                      onChange={(event) => setLoanForm((current) => ({ ...current, dueAt: event.target.value }))}
                    />
                  </label>
                  <button className="primary-button" type="submit" disabled={actionBusy === "issue-book"}>
                    {actionBusy === "issue-book" ? "Saving..." : "Issue book"}
                  </button>
                </form>

                <article className="module-card">
                  <h3>Overdue loans</h3>
                  {overdueLoans.length ? (
                    <div className="pill-list">
                      {overdueLoans.map((loan) => (
                        <div className="pill" key={loan.id}>
                          <strong>{bookMap.get(loan.book_id)?.title ?? `Book ${loan.book_id}`}</strong>
                          <span>Due: {formatDateTime(loan.due_at)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="No overdue loans right now." />
                  )}
                </article>
              </div>

              <div className="portal-grid portal-grid-2">
                <article className="module-card">
                  <h3>Book registry</h3>
                  {books.length ? (
                    <div className="table-wrap">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Accession</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Available</th>
                          </tr>
                        </thead>
                        <tbody>
                          {books.map((book) => (
                            <tr key={book.id}>
                              <td>{book.accession_no}</td>
                              <td>{book.title}</td>
                              <td>{book.category ?? "-"}</td>
                              <td>
                                {book.available_copies}/{book.total_copies}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState text="No books have been added yet." />
                  )}
                </article>

                <article className="module-card">
                  <h3>Active loans</h3>
                  {loans.length ? (
                    <div className="table-wrap">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Book</th>
                            <th>Holder</th>
                            <th>Due</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loans.map((loan) => (
                            <tr key={loan.id}>
                              <td>{bookMap.get(loan.book_id)?.title ?? `Book ${loan.book_id}`}</td>
                              <td>
                                {loan.learner_id
                                  ? learnerMap.get(loan.learner_id)?.full_name ?? `Learner ${loan.learner_id}`
                                  : loan.teacher_user_id
                                    ? userMap.get(loan.teacher_user_id)?.full_name ?? `Teacher ${loan.teacher_user_id}`
                                    : loan.class_id
                                      ? classMap.get(loan.class_id)?.name ?? `Class ${loan.class_id}`
                                      : "Unknown"}
                              </td>
                              <td>{formatDateTime(loan.due_at)}</td>
                              <td>
                                {loan.returned_at ? (
                                  "Returned"
                                ) : (
                                  <button className="table-action" type="button" onClick={() => void returnBook(loan.id)}>
                                    Return
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState text="No loan records yet." />
                  )}
                </article>
              </div>
            </PortalSection>
          ) : null}

          {canManageWebsite && activeModule === "website" ? (
            <PortalSection
              id="portal-website"
              kicker="Website"
              title="Public pages and school website publishing"
              detail="Visitors read the public side, while school leadership updates the content from inside the same system."
            >
              <div className="portal-grid portal-grid-2">
                <form className="module-card" onSubmit={submitPage}>
                  <h3>Create website page</h3>
                  <label className="field">
                    <span>Slug</span>
                    <input
                      value={pageForm.slug}
                      onChange={(event) => setPageForm((current) => ({ ...current, slug: event.target.value }))}
                      placeholder="admissions"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Title</span>
                    <input
                      value={pageForm.title}
                      onChange={(event) => setPageForm((current) => ({ ...current, title: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Body</span>
                    <textarea
                      rows={8}
                      value={pageForm.body}
                      onChange={(event) => setPageForm((current) => ({ ...current, body: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={pageForm.isPublished}
                      onChange={(event) =>
                        setPageForm((current) => ({ ...current, isPublished: event.target.checked }))
                      }
                    />
                    <span>Publish immediately</span>
                  </label>
                  <button className="primary-button" type="submit" disabled={actionBusy === "create-page"}>
                    {actionBusy === "create-page" ? "Saving..." : "Create page"}
                  </button>
                </form>

                <article className="module-card">
                  <h3>Website pages</h3>
                  {managedPages.length ? (
                    <div className="table-wrap">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Slug</th>
                            <th>Status</th>
                            <th>Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {managedPages.map((page) => (
                            <tr key={page.id}>
                              <td>{page.title}</td>
                              <td>{page.slug}</td>
                              <td>{page.is_published ? "Published" : "Draft"}</td>
                              <td>{formatDateTime(page.updated_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState text="No website pages have been created yet." />
                  )}
                </article>
              </div>
            </PortalSection>
          ) : null}

          {loggedInUser.role === "parent" && activeModule === "parent" ? (
            <PortalSection
              id="portal-parent"
              kicker="Parent Space"
              title="Learner summary and message history"
              detail="This part gives parents a secure way to see reporting and SMS history using the registered learner details."
            >
              <div className="portal-grid portal-grid-2">
                <form className="module-card" onSubmit={submitParentLookup}>
                  <h3>Open learner summary</h3>
                  <label className="field">
                    <span>Admission number</span>
                    <input
                      value={parentLookupForm.admissionNo}
                      onChange={(event) =>
                        setParentLookupForm((current) => ({ ...current, admissionNo: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Registered phone number</span>
                    <input
                      value={parentLookupForm.phoneNumber}
                      onChange={(event) =>
                        setParentLookupForm((current) => ({ ...current, phoneNumber: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <button className="primary-button" type="submit" disabled={actionBusy === "parent-lookup"}>
                    {actionBusy === "parent-lookup" ? "Loading..." : "Load learner summary"}
                  </button>
                </form>

                <article className="module-card">
                  <h3>Lookup result</h3>
                  {parentSummary ? (
                    <div className="summary-stack">
                      <p>
                        <strong>Learner:</strong> {parentSummary.learner.full_name}
                      </p>
                      <p>
                        <strong>Admission:</strong> {parentSummary.learner.admission_no}
                      </p>
                      <p>
                        <strong>Boarding status:</strong> {parentSummary.learner.boarding_status}
                      </p>
                      <p>
                        <strong>Parent:</strong> {parentSummary.parent.full_name}
                      </p>
                    </div>
                  ) : (
                    <EmptyState text="Run a learner summary lookup to see the parent-side record." />
                  )}
                </article>
              </div>

              {parentSummary ? (
                <div className="portal-grid portal-grid-2">
                  <article className="module-card">
                    <h3>Recent reporting</h3>
                    <div className="table-wrap">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Accompanied by</th>
                            <th>SMS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parentSummary.recent_reporting.map((item, index) => (
                            <tr key={`${item.report_time}-${index}`}>
                              <td>{formatDateTime(item.report_time)}</td>
                              <td>{item.accompanied_by}</td>
                              <td>{item.sms_status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>

                  <article className="module-card">
                    <h3>Recent messages</h3>
                    <div className="table-wrap">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Message</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parentSummary.recent_messages.map((item, index) => (
                            <tr key={`${item.created_at}-${index}`}>
                              <td>{formatDateTime(item.created_at)}</td>
                              <td>{item.message_body}</td>
                              <td>{item.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
              ) : null}
            </PortalSection>
          ) : null}
            </div>
          </main>
        </section>
      ) : null}

      {showPublicWebsite ? (
        <>
          <main className="public-page-shell">
            {activePublicSection === "home" ? (
            <section className="hero-section" id="home">
              <div className="hero-copy">
                <p className="section-kicker">Saint Mark Catholic Parish - Ol Moran</p>
                <h1>
                  <span className="brand-inline">TUMAINI ACADEMY</span> is a growing Catholic school shaped by faith,
                  learning, service, and community life.
                </h1>
                <p className="hero-text">
                  The website now opens with real school moments, while staff, parents, and administrators enter the
                  secure portal when they need to work with records, communication, academics, and reporting.
                </p>
                <div className="hero-actions">
                  <button className="primary-button" type="button" onClick={() => setActivePublicSection("about")}>
                    Explore the school
                  </button>
                  <button className="ghost-button" type="button" onClick={() => setActivePublicSection("events")}>
                    View gallery
                  </button>
                  <button className="ghost-button" type="button" onClick={openLoginScreen}>
                    Staff Login
                  </button>
                </div>
                <div className="quote-card">
                  <p className="quote-label">Motto</p>
                  <p className="quote-text">Furahini katika Tumaini</p>
                  <p className="quote-note">Be joyful in hope.</p>
                </div>

                <div className="hero-metrics">
                  {campusHighlights.map((item) => (
                    <article className="metric-chip" key={item.label}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="hero-aside">
                <div className="hero-photo-card">
                  <EventPhoto event={eventGallery[1]} className="hero-photo-frame" />
                  <div className="hero-photo-caption">
                    <p className="section-kicker">School life</p>
                    <h2>Community events, learner formation, and care beyond the classroom.</h2>
                  </div>
                  <div className="hero-logo-badge">
                    <img src="/Tumaini logo.jpeg" alt="Tumaini Academy logo" />
                  </div>
                </div>
                <div className="hero-note">
                  <p className="section-kicker">Portal status</p>
                  <p>
                    The same platform now supports admin, teachers, librarian, parents, and the public website from one
                    connected product line.
                  </p>
                </div>
              </aside>
            </section>
            ) : null}

            {activePublicSection === "about" ? (
            <section className="facts-section" id="about">
              <div className="section-heading">
                <p className="section-kicker">School identity</p>
                <h2>A Catholic parish school serving the Ol Moran community with hope, discipline, and growth.</h2>
              </div>

              <div className="facts-grid">
                {schoolFacts.map((fact) => (
                  <article className="fact-card" key={fact}>
                    <p>{fact}</p>
                  </article>
                ))}
              </div>

              <div className="mission-card">
                <div>
                  <p className="section-kicker">What shapes the school</p>
                  <h3>
                    <span className="brand-inline">TUMAINI ACADEMY</span> is part of the mission of Saint Mark Catholic
                    Parish and continues to grow in both education and pastoral care.
                  </h3>
                </div>
                <p>
                  Alongside classroom learning, the school story includes boarding support, protection for vulnerable
                  learners, sports development, a school farm, science and computer facilities, and preparation for
                  senior school expansion.
                </p>
              </div>
            </section>
            ) : null}

            {activePublicSection === "journey" ? (
            <section className="journey-section" id="journey">
              <div className="section-heading">
                <p className="section-kicker">Learning journey</p>
                <h2>The four stars now reflect the full Tumaini path from ECDE to Senior School.</h2>
              </div>

              <div className="stage-grid">
                {learningStages.map((stage) => (
                  <article className="stage-card" key={stage.title}>
                    <p className="stage-star">{stage.star}</p>
                    <h3>{stage.title}</h3>
                    <p>{stage.description}</p>
                  </article>
                ))}
              </div>
            </section>
            ) : null}

            {activePublicSection === "events" ? (
            <section className="events-section" id="events">
              <div className="events-intro">
                <div className="section-heading">
                  <p className="section-kicker">Events Gallery</p>
                  <h2>School life in pictures, from parish celebrations to community events and outdoor formation.</h2>
                </div>
                <p>
                  These albums use the approved photos stored in <span className="inline-path">assets/Tumaini Images</span>.
                  They help visitors understand Tumaini as a school shaped by faith, service, discipline, and learner growth.
                </p>
              </div>

              <div className="event-gallery-grid">
                {eventGallery.map((event) => (
                  <article className="event-card" key={event.title}>
                    <EventPhoto event={event} />
                    <div className="event-card-copy">
                      <p className="contact-label">{event.label}</p>
                      <h3>{event.title}</h3>
                      <p>{event.description}</p>
                      <div className="event-thumbnail-row" aria-label={`${event.title} preview photos`}>
                        {event.images.map((image) => (
                          <img src={image} alt="" key={image} loading="lazy" />
                        ))}
                      </div>
                      <span className="event-source">{event.sourceLabel}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            ) : null}

            {activePublicSection === "system" ? (
            <section className="system-section" id="system">
              <div className="section-heading">
                <p className="section-kicker">Connected operations</p>
                <h2>The platform is now arranged so each portal focuses on its own work instead of repeating roles and tasks.</h2>
              </div>

              <div className="system-grid">
                {systemAreas.map((area) => (
                  <article className="system-card" key={area.title}>
                    <h3>{area.title}</h3>
                    <p>{area.text}</p>
                  </article>
                ))}
              </div>

              {publicPages.length ? (
                <div className="public-pages-grid">
                  {publicPages.slice(0, 6).map((page) => (
                    <article className="contact-card" key={page.id}>
                      <p className="contact-label">Published page</p>
                      <h3>{page.title}</h3>
                      <p className="helper-copy">{page.slug}</p>
                      {page.body ? <p>{page.body.slice(0, 140)}...</p> : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
            ) : null}

            {activePublicSection === "news" ? (
            <section className="news-section" id="news">
              <div className="section-heading">
                <p className="section-kicker">Latest News and Updates</p>
                <h2>School news, notices, and important updates now have a proper place near the bottom of the site.</h2>
              </div>

              <div className="news-grid">
                {publicNewsItems.map((item) => (
                  <article className="news-card" key={item.title}>
                    <p className="contact-label">{item.category}</p>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <a href="#contact">Read more</a>
                  </article>
                ))}
              </div>
            </section>
            ) : null}

            {activePublicSection === "links" ? (
            <section className="links-section" id="links">
              <div className="section-heading">
                <p className="section-kicker">Quick Links</p>
                <h2>Useful paths for visitors, parents, and staff.</h2>
              </div>

              <div className="links-grid">
                {quickLinkGroups.map((group) => (
                  <article className="link-group" key={group.title}>
                    <h3>{group.title}</h3>
                    <div className="footer-links">
                      {group.links.map((link) => (
                        <a
                          key={link}
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            if (link === "Staff Login") {
                              openLoginScreen();
                              return;
                            }
                            if (link === "Learning Journey") {
                              setActivePublicSection("journey");
                              return;
                            }
                            if (link === "Events Gallery") {
                              setActivePublicSection("events");
                              return;
                            }
                            setActivePublicSection("contact");
                          }}
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
            ) : null}

            {activePublicSection === "contact" ? (
            <section className="contact-section" id="contact">
              <div className="section-heading">
                <p className="section-kicker">Contact and location</p>
                <h2>Visitors see the school story here, while staff and parents move into secure spaces when needed.</h2>
              </div>

              <div className="contact-grid">
                {contactItems.map((item) => (
                  <article className="contact-card" key={item.label}>
                    <p className="contact-label">{item.label}</p>
                    <p>{item.value}</p>
                  </article>
                ))}
              </div>
            </section>
            ) : null}
          </main>

          <footer className="compact-footer">
            <span>Copyright 2026 Tumaini Academy</span>
            <span>Furahini katika Tumaini</span>
          </footer>
        </>
      ) : null}
    </div>
  );
}

export default App;
