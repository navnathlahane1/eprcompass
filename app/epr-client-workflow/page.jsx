"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "epr_workflow_state_v1";
const SESSION_KEY = "epr_workflow_session_v1";

const EPR_CATEGORIES = ["Plastic", "E-Waste", "Battery", "Tyre"];
const FILING_STATUSES = [
  "Pending",
  "Documents Submitted",
  "Under Review",
  "Query Raised",
  "Approved",
  "Certificate Issued",
];
const DOCUMENT_STATUSES = ["Received", "Reviewed", "Approved", "Rejected"];
const AUDIT_MARK_AS = ["Draft", "Final", "Certified Copy"];

const DOC_TYPES_BY_CATEGORY = {
  Plastic: [
    "Sales Invoice",
    "Purchase Invoice",
    "Import Records",
    "Recycler Agreement",
    "Plastic Credit Certificate",
    "Annual Report",
    "Other",
  ],
  "E-Waste": [
    "Sales Register",
    "Collection Data",
    "Dismantler Agreement",
    "Recycler Agreement",
    "E-Waste Certificate",
    "Other",
  ],
  Battery: [
    "Battery Sales Data",
    "Collection Records",
    "Recycler Tie-up",
    "Battery Certificate",
    "Other",
  ],
  Tyre: [
    "Tyre Sales Data",
    "Collection Agreement",
    "Retreader Agreement",
    "Tyre Certificate",
    "Other",
  ],
};

const AUDIT_DOC_TYPES = [
  "Form GSTR-9 Summary",
  "CPCB Filing Acknowledgement",
  "EPR Annual Return",
  "Audit Report",
  "Certificate Copy",
  "Compliance Summary",
  "Third-Party Audit Report",
  "Other",
];

const STATUS_COLORS = {
  Pending: "bg-slate-100 text-slate-700",
  "Documents Submitted": "bg-sky-100 text-sky-700",
  "Under Review": "bg-amber-100 text-amber-700",
  "Query Raised": "bg-red-100 text-red-700",
  Approved: "bg-green-100 text-green-700",
  "Certificate Issued": "bg-emerald-100 text-emerald-700",
  Received: "bg-slate-100 text-slate-700",
  Reviewed: "bg-amber-100 text-amber-700",
  Rejected: "bg-red-100 text-red-700",
};

const STATUS_PROGRESS = {
  Pending: 10,
  "Documents Submitted": 30,
  "Under Review": 55,
  "Query Raised": 70,
  Approved: 88,
  "Certificate Issued": 100,
};

const nowIso = () => new Date().toISOString();

function seedData() {
  return {
    users: [
      {
        id: "u_admin",
        name: "VJ",
        email: "admin@example.com",
        password: "Admin@123",
        role: "admin",
        company: "EPR Compass",
        eprCategories: EPR_CATEGORIES,
        phone: "+91-90000-00001",
      },
      {
        id: "u_client_1",
        name: "Aarav Sharma",
        email: "topgrip@client.com",
        password: "Client@123",
        role: "client",
        company: "Topgrip Industries",
        eprCategories: ["Plastic", "Battery"],
        phone: "+91-90000-00002",
      },
      {
        id: "u_client_2",
        name: "Meera Verma",
        email: "mvindustrial@client.com",
        password: "Client@123",
        role: "client",
        company: "MV Industrial Corporation",
        eprCategories: ["E-Waste"],
        phone: "+91-90000-00003",
      },
    ],
    financialYears: [
      { id: "fy_2023_24", label: "FY 2023-24", isActive: false },
      { id: "fy_2024_25", label: "FY 2024-25", isActive: true },
      { id: "fy_2025_26", label: "FY 2025-26", isActive: false },
    ],
    filingStatuses: [
      {
        id: "fs_1",
        clientId: "u_client_1",
        category: "Plastic",
        fyId: "fy_2024_25",
        currentStatus: "Under Review",
        history: [
          {
            status: "Under Review",
            comment: "Sales invoices verified; recycler agreement under validation.",
            adminId: "u_admin",
            timestamp: "2026-04-10T11:00:00.000Z",
          },
          {
            status: "Documents Submitted",
            comment: "Initial document set received and queued.",
            adminId: "u_admin",
            timestamp: "2026-04-06T09:20:00.000Z",
          },
        ],
      },
      {
        id: "fs_2",
        clientId: "u_client_2",
        category: "E-Waste",
        fyId: "fy_2024_25",
        currentStatus: "Query Raised",
        history: [
          {
            status: "Query Raised",
            comment: "Collection data mismatch for March quarter, please re-upload revised sheet.",
            adminId: "u_admin",
            timestamp: "2026-04-12T13:10:00.000Z",
          },
          {
            status: "Under Review",
            comment: "Dismantler agreement validated.",
            adminId: "u_admin",
            timestamp: "2026-04-08T10:00:00.000Z",
          },
        ],
      },
    ],
    clientDocuments: [
      {
        id: "cd_1",
        clientId: "u_client_1",
        category: "Plastic",
        fyId: "fy_2024_25",
        docType: "Sales Invoice",
        documentName: "Topgrip Q3 Plastic Sales",
        fileName: "topgrip_q3_sales.pdf",
        fileSize: 2482300,
        uploadDate: "2026-04-05T09:30:00.000Z",
        status: "Reviewed",
        adminComment: "Values aligned with monthly return draft.",
        note: "Q3 consolidated statement",
      },
      {
        id: "cd_2",
        clientId: "u_client_2",
        category: "E-Waste",
        fyId: "fy_2024_25",
        docType: "Collection Data",
        documentName: "MV Collection Register",
        fileName: "mv_collection_register.xlsx.pdf",
        fileSize: 1620440,
        uploadDate: "2026-04-09T08:10:00.000Z",
        status: "Received",
        adminComment: "",
        note: "Collection data for Q2 and Q3",
      },
      {
        id: "cd_3",
        clientId: "u_client_1",
        category: "Battery",
        fyId: "fy_2023_24",
        docType: "Battery Certificate",
        documentName: "Battery Compliance Certificate",
        fileName: "battery_certificate_2023_24.png",
        fileSize: 840300,
        uploadDate: "2026-03-22T12:20:00.000Z",
        status: "Approved",
        adminComment: "Approved and mapped in annual submission.",
        note: "Signed by recycler partner",
      },
    ],
    auditDocuments: [
      {
        id: "ad_1",
        clientId: "u_client_1",
        category: "Plastic",
        fyId: "fy_2024_25",
        docType: "Compliance Summary",
        title: "Topgrip FY 2024-25 Compliance Summary",
        fileName: "topgrip_compliance_summary.pdf",
        fileSize: 1203400,
        uploadDate: "2026-04-14T09:45:00.000Z",
        internalNote: "Ready for final sign-off.",
        clientNote: "Please keep this record for statutory audits.",
        markAs: "Final",
        visibleToClient: true,
      },
      {
        id: "ad_2",
        clientId: "u_client_2",
        category: "E-Waste",
        fyId: "fy_2023_24",
        docType: "Audit Report",
        title: "MV External Audit Observations",
        fileName: "mv_external_audit_report.pdf",
        fileSize: 1880600,
        uploadDate: "2026-03-18T15:15:00.000Z",
        internalNote: "Keep hidden until corrective action closeout.",
        clientNote: "",
        markAs: "Draft",
        visibleToClient: false,
      },
    ],
  };
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }) {
  const tone = STATUS_COLORS[status] || "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {status === "Certificate Issued" ? "✓ " : ""}
      {status}
    </span>
  );
}

function DataSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="h-5 animate-pulse rounded bg-slate-200" />
      ))}
    </div>
  );
}

export default function EprClientWorkflowPage() {
  const [booting, setBooting] = useState(true);
  const [appData, setAppData] = useState(seedData);
  const [session, setSession] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loadingSection, setLoadingSection] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedSession = localStorage.getItem(SESSION_KEY);

    if (saved) {
      try {
        setAppData(JSON.parse(saved));
      } catch {
        setAppData(seedData());
      }
    }

    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
        setActiveSection(parsedSession.role === "admin" ? "dashboard" : "my-dashboard");
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    const timer = setTimeout(() => setBooting(false), 550);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  }, [appData]);

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }, [session]);

  const currentUser = useMemo(
    () => appData.users.find((u) => u.id === session?.userId) || null,
    [appData.users, session]
  );

  const activeFinancialYear = useMemo(
    () => appData.financialYears.find((fy) => fy.isActive) || appData.financialYears[0],
    [appData.financialYears]
  );

  const clientUsers = useMemo(
    () => appData.users.filter((u) => u.role === "client"),
    [appData.users]
  );

  function showToast(message, type = "success") {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }

  function switchSection(section) {
    setSidebarOpen(false);
    setLoadingSection(true);
    setActiveSection(section);
    const timer = setTimeout(() => setLoadingSection(false), 340);
    return () => clearTimeout(timer);
  }

  function handleLogin(e) {
    e.preventDefault();
    const found = appData.users.find(
      (u) => u.email.toLowerCase() === loginForm.email.toLowerCase() && u.password === loginForm.password
    );

    if (!found) {
      setLoginError("Invalid credentials. Use seeded demo accounts.");
      return;
    }

    const nextSession = { userId: found.id, role: found.role };
    setSession(nextSession);
    setLoginError("");
    setLoginForm({ email: "", password: "" });
    setActiveSection(found.role === "admin" ? "dashboard" : "my-dashboard");
    showToast(`Welcome back, ${found.name}.`, "success");
  }

  function handleLogout() {
    setSession(null);
    setActiveSection("dashboard");
    localStorage.removeItem(SESSION_KEY);
    showToast("Session cleared. You are logged out.", "info");
  }

  if (booting) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-8 w-72 animate-pulse rounded bg-slate-300" />
          <DataSkeleton />
          <DataSkeleton />
        </div>
      </div>
    );
  }

  if (!session || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-slate-100">
        <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-2xl md:mt-16 md:p-10">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                EPR Compliance Client Portal
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Secure Compliance Workspace</h1>
              <p className="mt-3 text-slate-300">
                Login to manage filing statuses, upload category-wise documents, and review audit records for every
                financial year.
              </p>
              <div className="mt-6 space-y-3 rounded-xl border border-slate-700 bg-slate-800/70 p-4 text-sm">
                <p className="font-semibold text-slate-200">Demo Accounts</p>
                <p>Admin: Use your assigned admin credentials.</p>
                <p>Client: topgrip@client.com / Client@123</p>
                <p>Client: mvindustrial@client.com / Client@123</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
              <h2 className="text-xl font-semibold">Credential Login</h2>
              <p className="mt-1 text-sm text-slate-400">Role is detected automatically and redirected to portal.</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Email</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 outline-none ring-emerald-400 focus:ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Password</label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 outline-none ring-emerald-400 focus:ring"
                  />
                </div>

                {loginError ? <p className="text-sm font-medium text-red-300">{loginError}</p> : null}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === "admin";
  const isClient = currentUser.role === "client";

  const allowedSections = isAdmin
    ? ["dashboard", "clients", "filing-manager", "document-manager", "audit-documents", "settings"]
    : ["my-dashboard", "my-filing-status", "upload-documents", "my-documents", "my-audit-documents", "profile"];

  if (!allowedSections.includes(activeSection)) {
    setActiveSection(isAdmin ? "dashboard" : "my-dashboard");
  }

  const breadcrumbs = isAdmin
    ? ["Home", "Admin", activeSection.replace(/-/g, " ")]
    : ["Home", "Client", activeSection.replace(/-/g, " ")];

  function getFyLabel(fyId) {
    return appData.financialYears.find((f) => f.id === fyId)?.label || "Unknown FY";
  }

  function getUserName(userId) {
    return appData.users.find((u) => u.id === userId)?.name || "Admin";
  }

  function withClientGuard(fn) {
    if (!isClient) {
      showToast("Access denied: client module.", "error");
      return;
    }
    fn();
  }

  function withAdminGuard(fn) {
    if (!isAdmin) {
      showToast("Access denied: admin module.", "error");
      return;
    }
    fn();
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Live portal upgrade banner */}
      <div className="bg-blue-600 text-white text-sm px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
        <span>This is the interactive demo. For live data backed by the real database, use the client portal.</span>
        <div className="flex gap-3 flex-shrink-0">
          <a href="/portal/epr-filings" className="underline font-medium hover:text-blue-100">Filing Status →</a>
          <a href="/portal/epr-documents" className="underline font-medium hover:text-blue-100">Documents →</a>
          <a href="/portal/epr-audit-docs" className="underline font-medium hover:text-blue-100">Audit Docs →</a>
          <a href="/portal/epr-activity-log" className="underline font-medium hover:text-blue-100">Activity Log →</a>
        </div>
      </div>
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${
              toast.type === "error"
                ? "bg-red-600"
                : toast.type === "info"
                ? "bg-slate-700"
                : toast.type === "warning"
                ? "bg-amber-600"
                : "bg-emerald-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="flex">
        <aside
          className={`fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-800 bg-slate-950 p-4 text-slate-100 transition-transform md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">EPR Portal</p>
              <p className="text-xs text-slate-400">EPR Compass</p>
            </div>
            <button className="rounded border border-slate-700 px-2 py-1 text-xs md:hidden" onClick={() => setSidebarOpen(false)}>
              Close
            </button>
          </div>

          {isAdmin ? (
            <div className="mb-4 rounded-lg border border-emerald-700 bg-emerald-900/30 p-3">
              <p className="text-xs text-emerald-300">Active FY</p>
              <p className="font-semibold">{activeFinancialYear?.label}</p>
            </div>
          ) : null}

          <nav className="space-y-2">
            {(isAdmin
              ? [
                  ["dashboard", "Dashboard"],
                  ["clients", "Clients"],
                  ["filing-manager", "Filing Status Manager"],
                  ["document-manager", "Document Manager"],
                  ["audit-documents", "Audit Documents"],
                  ["settings", "Settings / FY Manager"],
                ]
              : [
                  ["my-dashboard", "My Dashboard"],
                  ["my-filing-status", "My Filing Status"],
                  ["upload-documents", "Upload Documents"],
                  ["my-documents", "My Documents"],
                  ["my-audit-documents", "My Audit Documents"],
                  ["profile", "Profile"],
                ]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => switchSection(key)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeSection === key ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-slate-200 hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-8 w-full rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
          >
            Logout
          </button>
        </aside>

        <main className="w-full md:ml-72">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  className="rounded border border-slate-300 px-2 py-1 text-xs md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  Menu
                </button>
                <div>
                  <p className="text-sm text-slate-500">{isAdmin ? "/admin/dashboard" : "/client/dashboard"}</p>
                  <h1 className="text-lg font-semibold text-slate-900">{currentUser.company}</h1>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <div className="mt-1 flex flex-wrap justify-end gap-1">
                  {currentUser.eprCategories.map((cat) => (
                    <span key={cat} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-500">{breadcrumbs.join(" / ")}</div>
          </header>

          <section className="p-4 md:p-6">
            {loadingSection ? <DataSkeleton /> : null}

            {!loadingSection && isAdmin && activeSection === "dashboard" ? (
              <AdminDashboard
                appData={appData}
                clientUsers={clientUsers}
                activeFinancialYear={activeFinancialYear}
              />
            ) : null}

            {!loadingSection && isAdmin && activeSection === "clients" ? (
              <AdminClients users={clientUsers} />
            ) : null}

            {!loadingSection && isAdmin && activeSection === "filing-manager" ? (
              <AdminFilingManager
                appData={appData}
                setAppData={setAppData}
                activeFinancialYear={activeFinancialYear}
                showToast={showToast}
                getFyLabel={getFyLabel}
                getUserName={getUserName}
                withAdminGuard={withAdminGuard}
              />
            ) : null}

            {!loadingSection && isAdmin && activeSection === "document-manager" ? (
              <AdminDocumentManager
                appData={appData}
                setAppData={setAppData}
                showToast={showToast}
                getFyLabel={getFyLabel}
                withAdminGuard={withAdminGuard}
              />
            ) : null}

            {!loadingSection && isAdmin && activeSection === "audit-documents" ? (
              <AdminAuditDocuments
                appData={appData}
                setAppData={setAppData}
                activeFinancialYear={activeFinancialYear}
                showToast={showToast}
                getFyLabel={getFyLabel}
                withAdminGuard={withAdminGuard}
              />
            ) : null}

            {!loadingSection && isAdmin && activeSection === "settings" ? (
              <AdminFinancialYearManager
                appData={appData}
                setAppData={setAppData}
                showToast={showToast}
                withAdminGuard={withAdminGuard}
              />
            ) : null}

            {!loadingSection && isClient && activeSection === "my-dashboard" ? (
              <ClientDashboard appData={appData} currentUser={currentUser} activeFinancialYear={activeFinancialYear} />
            ) : null}

            {!loadingSection && isClient && activeSection === "my-filing-status" ? (
              <ClientFilingStatus
                appData={appData}
                currentUser={currentUser}
                activeFinancialYear={activeFinancialYear}
                getFyLabel={getFyLabel}
                getUserName={getUserName}
              />
            ) : null}

            {!loadingSection && isClient && activeSection === "upload-documents" ? (
              <ClientUploadDocuments
                appData={appData}
                setAppData={setAppData}
                currentUser={currentUser}
                activeFinancialYear={activeFinancialYear}
                showToast={showToast}
                withClientGuard={withClientGuard}
              />
            ) : null}

            {!loadingSection && isClient && activeSection === "my-documents" ? (
              <ClientDocumentLibrary
                appData={appData}
                currentUser={currentUser}
                activeFinancialYear={activeFinancialYear}
                getFyLabel={getFyLabel}
                showToast={showToast}
              />
            ) : null}

            {!loadingSection && isClient && activeSection === "my-audit-documents" ? (
              <ClientAuditDocuments
                appData={appData}
                currentUser={currentUser}
                getFyLabel={getFyLabel}
                showToast={showToast}
              />
            ) : null}

            {!loadingSection && isClient && activeSection === "profile" ? (
              <ClientProfile currentUser={currentUser} activeFinancialYear={activeFinancialYear} />
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action || null}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ title, description, cta }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <p className="text-lg font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  );
}

function AdminDashboard({ appData, clientUsers, activeFinancialYear }) {
  const pendingDocs = appData.clientDocuments.filter((d) => ["Received", "Reviewed"].includes(d.status)).length;
  const queryFilings = appData.filingStatuses.filter((f) => f.currentStatus === "Query Raised").length;
  const visibleAuditDocs = appData.auditDocuments.filter((a) => a.visibleToClient).length;

  const cards = [
    ["Registered Clients", clientUsers.length],
    ["Documents in Queue", pendingDocs],
    ["Filings with Query", queryFilings],
    ["Visible Audit Documents", visibleAuditDocs],
  ];

  return (
    <div className="space-y-4">
      <SectionCard title="Admin Dashboard" subtitle={`Compliance control center | Active FY: ${activeFinancialYear?.label}`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function AdminClients({ users }) {
  return (
    <SectionCard title="Clients" subtitle="All registered producer/importer entities">
      {users.length === 0 ? (
        <EmptyState title="No Clients" description="Client records will appear here after onboarding." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Categories</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-medium">{u.name}</td>
                  <td className="px-3 py-2">{u.company}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.phone}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {u.eprCategories.map((c) => (
                        <span key={c} className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function AdminFinancialYearManager({ appData, setAppData, showToast, withAdminGuard }) {
  const [fyLabel, setFyLabel] = useState("");

  function addYear(e) {
    e.preventDefault();
    withAdminGuard(() => {
      const clean = fyLabel.trim();
      if (!clean) {
        showToast("Financial year label is required.", "error");
        return;
      }
      if (appData.financialYears.some((f) => f.label.toLowerCase() === clean.toLowerCase())) {
        showToast("Financial year already exists.", "warning");
        return;
      }

      setAppData((prev) => ({
        ...prev,
        financialYears: [...prev.financialYears, { id: `fy_${Date.now()}`, label: clean, isActive: false }],
      }));
      setFyLabel("");
      showToast("Financial year added.", "success");
    });
  }

  function setActive(id) {
    withAdminGuard(() => {
      setAppData((prev) => ({
        ...prev,
        financialYears: prev.financialYears.map((f) => ({ ...f, isActive: f.id === id })),
      }));
      showToast("Active financial year updated globally.", "success");
    });
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Financial Year Manager" subtitle="Global FY list used across all filing and document modules">
        <form onSubmit={addYear} className="mb-4 flex flex-col gap-2 md:flex-row">
          <input
            value={fyLabel}
            onChange={(e) => setFyLabel(e.target.value)}
            placeholder="Example: FY 2026-27"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">Add FY</button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {appData.financialYears.map((fy) => (
                <tr key={fy.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-medium">{fy.label}</td>
                  <td className="px-3 py-2">{fy.isActive ? <StatusBadge status="Approved" /> : "Inactive"}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setActive(fy.id)}
                      className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-100"
                    >
                      Set Active
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function AdminFilingManager({
  appData,
  setAppData,
  activeFinancialYear,
  showToast,
  getFyLabel,
  getUserName,
  withAdminGuard,
}) {
  const clientUsers = appData.users.filter((u) => u.role === "client");
  const [selectedClientId, setSelectedClientId] = useState(clientUsers[0]?.id || "");
  const selectedClient = clientUsers.find((c) => c.id === selectedClientId) || null;

  const [fyId, setFyId] = useState(activeFinancialYear?.id || "");
  const [category, setCategory] = useState(selectedClient?.eprCategories[0] || "Plastic");
  const [status, setStatus] = useState("Pending");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (selectedClient && !selectedClient.eprCategories.includes(category)) {
      setCategory(selectedClient.eprCategories[0]);
    }
  }, [selectedClient, category]);

  const currentRecord = appData.filingStatuses.find(
    (f) => f.clientId === selectedClientId && f.category === category && f.fyId === fyId
  );

  useEffect(() => {
    if (currentRecord) {
      setStatus(currentRecord.currentStatus);
    } else {
      setStatus("Pending");
    }
  }, [selectedClientId, category, fyId, currentRecord]);

  function saveStatus(e) {
    e.preventDefault();
    withAdminGuard(() => {
      if (!selectedClientId || !fyId || !category || !status) {
        showToast("Client, category, FY and status are required.", "error");
        return;
      }
      if (!comment.trim()) {
        showToast("Admin comment is mandatory for status update.", "error");
        return;
      }

      const historyEntry = {
        status,
        comment: comment.trim(),
        adminId: "u_admin",
        timestamp: nowIso(),
      };

      setAppData((prev) => {
        const idx = prev.filingStatuses.findIndex(
          (f) => f.clientId === selectedClientId && f.category === category && f.fyId === fyId
        );

        if (idx >= 0) {
          const updated = [...prev.filingStatuses];
          updated[idx] = {
            ...updated[idx],
            currentStatus: status,
            history: [historyEntry, ...(updated[idx].history || [])],
          };
          return { ...prev, filingStatuses: updated };
        }

        const fresh = {
          id: `fs_${Date.now()}`,
          clientId: selectedClientId,
          category,
          fyId,
          currentStatus: status,
          history: [historyEntry],
        };

        return { ...prev, filingStatuses: [...prev.filingStatuses, fresh] };
      });

      setComment("");
      showToast("Filing status updated and timeline appended.", "success");
    });
  }

  const history = [...(currentRecord?.history || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <SectionCard title="Clients" subtitle="Pick a client to manage filing statuses">
        <div className="space-y-2">
          {clientUsers.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left ${
                selectedClientId === client.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p className="font-semibold text-slate-900">{client.company}</p>
              <p className="text-xs text-slate-500">{client.name}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Filing Detail Panel"
        subtitle={selectedClient ? `${selectedClient.company} | status controls by category and FY` : "Select a client"}
      >
        {!selectedClient ? (
          <EmptyState title="No client selected" description="Select a client to begin filing management." />
        ) : (
          <div className="space-y-4">
            <form onSubmit={saveStatus} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Financial Year</label>
                <select value={fyId} onChange={(e) => setFyId(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-2">
                  {appData.financialYears.map((fy) => (
                    <option key={fy.id} value={fy.id}>
                      {fy.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-2"
                >
                  {selectedClient.eprCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Filing Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-2">
                  {FILING_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Admin Comment (required)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-slate-300 px-2 py-2"
                  placeholder="Add a compliance-relevant update for client visibility"
                />
              </div>

              <div className="md:col-span-2">
                <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
                  Save Status Update
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Status Timeline (Newest First)</p>
              {history.length === 0 ? (
                <EmptyState
                  title="No timeline entries"
                  description="Save a status update to initialize compliance timeline for this category and FY."
                />
              ) : (
                <div className="space-y-2">
                  {history.map((h, idx) => (
                    <div key={`${h.timestamp}_${idx}`} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={h.status} />
                        <span className="text-xs text-slate-500">{formatDate(h.timestamp)}</span>
                        <span className="text-xs text-slate-500">by {getUserName(h.adminId)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{h.comment}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {category} | {getFyLabel(fyId)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ClientDashboard({ appData, currentUser, activeFinancialYear }) {
  const myStatuses = appData.filingStatuses.filter(
    (f) => f.clientId === currentUser.id && f.fyId === activeFinancialYear?.id
  );

  const pendingDocs = appData.clientDocuments.filter((d) => d.clientId === currentUser.id && d.status !== "Approved").length;

  return (
    <div className="space-y-4">
      <SectionCard
        title="My Dashboard"
        subtitle={`Company: ${currentUser.company} | Active FY: ${activeFinancialYear?.label}`}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Active Categories</p>
            <p className="text-2xl font-bold text-slate-900">{currentUser.eprCategories.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Open Filings</p>
            <p className="text-2xl font-bold text-slate-900">{myStatuses.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Documents in Review</p>
            <p className="text-2xl font-bold text-slate-900">{pendingDocs}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function ClientFilingStatus({ appData, currentUser, activeFinancialYear, getFyLabel, getUserName }) {
  const [selectedFy, setSelectedFy] = useState(activeFinancialYear?.id || "");

  const recordsForFy = appData.filingStatuses.filter((f) => f.clientId === currentUser.id && f.fyId === selectedFy);

  const cards = currentUser.eprCategories.map((cat) => {
    const rec = recordsForFy.find((r) => r.category === cat);
    return {
      category: cat,
      fyId: selectedFy,
      status: rec?.currentStatus || "Pending",
      lastUpdated: rec?.history?.[0]?.timestamp || null,
      adminComment: rec?.history?.[0]?.comment || "No updates yet",
      history: [...(rec?.history || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    };
  });

  return (
    <div className="space-y-4">
      <SectionCard title="My Filing Status" subtitle="Category-wise status cards with detailed timeline">
        <div className="mb-4 w-full max-w-xs">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Financial Year</label>
          <select value={selectedFy} onChange={(e) => setSelectedFy(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-2">
            {appData.financialYears.map((fy) => (
              <option key={fy.id} value={fy.id}>
                {fy.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {cards.map((card) => (
            <div key={card.category} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-semibold text-slate-900">{card.category}</p>
                <StatusBadge status={card.status} />
              </div>

              <div className="mt-2 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                <p>
                  <span className="font-semibold">Financial Year:</span> {getFyLabel(card.fyId)}
                </p>
                <p>
                  <span className="font-semibold">Last Updated:</span> {card.lastUpdated ? formatDate(card.lastUpdated) : "-"}
                </p>
                <p className="md:col-span-2">
                  <span className="font-semibold">Admin Comment:</span> {card.adminComment}
                </p>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{STATUS_PROGRESS[card.status] || 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${STATUS_PROGRESS[card.status] || 0}%` }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-slate-800">Status History</p>
                {card.history.length === 0 ? (
                  <p className="text-sm text-slate-500">No history available for this category yet.</p>
                ) : (
                  <div className="space-y-2">
                    {card.history.map((entry, idx) => (
                      <div key={`${entry.timestamp}_${idx}`} className="rounded border border-slate-200 bg-white p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={entry.status} />
                          <span className="text-xs text-slate-500">{formatDate(entry.timestamp)}</span>
                          <span className="text-xs text-slate-500">by {getUserName(entry.adminId)}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{entry.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ClientUploadDocuments({
  appData,
  setAppData,
  currentUser,
  activeFinancialYear,
  showToast,
  withClientGuard,
}) {
  const initialCategory = currentUser.eprCategories[0] || "Plastic";
  const [form, setForm] = useState({
    category: initialCategory,
    fyId: activeFinancialYear?.id || "",
    docType: DOC_TYPES_BY_CATEGORY[initialCategory]?.[0] || "Other",
    documentName: "",
    note: "",
    fileName: "",
    fileSize: 0,
  });

  function onCategoryChange(nextCategory) {
    setForm((prev) => ({
      ...prev,
      category: nextCategory,
      docType: DOC_TYPES_BY_CATEGORY[nextCategory]?.[0] || "Other",
    }));
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"];

    if (!allowed.includes(file.type)) {
      showToast("Only PDF, JPG or PNG is allowed.", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("File exceeds 10MB limit.", "error");
      return;
    }

    setForm((prev) => ({
      ...prev,
      fileName: file.name,
      fileSize: file.size,
      documentName: prev.documentName || file.name.replace(/\.[^.]+$/, ""),
    }));
  }

  function submit(e) {
    e.preventDefault();
    withClientGuard(() => {
      if (!form.category || !form.fyId || !form.docType || !form.documentName.trim() || !form.fileName) {
        showToast("Please complete all required fields.", "error");
        return;
      }

      const newDoc = {
        id: `cd_${Date.now()}`,
        clientId: currentUser.id,
        category: form.category,
        fyId: form.fyId,
        docType: form.docType,
        documentName: form.documentName.trim(),
        fileName: form.fileName,
        fileSize: form.fileSize,
        uploadDate: nowIso(),
        status: "Received",
        adminComment: "",
        note: form.note.trim(),
      };

      setAppData((prev) => ({ ...prev, clientDocuments: [newDoc, ...prev.clientDocuments] }));
      showToast("Document uploaded to your compliance library.", "success");

      setForm((prev) => ({
        ...prev,
        docType: DOC_TYPES_BY_CATEGORY[prev.category]?.[0] || "Other",
        documentName: "",
        note: "",
        fileName: "",
        fileSize: 0,
        fyId: activeFinancialYear?.id || prev.fyId,
      }));
    });
  }

  return (
    <SectionCard title="Upload Documents" subtitle="Submit category-wise EPR documents for admin review">
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">EPR Category</label>
          <select
            value={form.category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-2"
          >
            {currentUser.eprCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Financial Year</label>
          <select
            value={form.fyId}
            onChange={(e) => setForm((prev) => ({ ...prev, fyId: e.target.value }))}
            className="w-full rounded border border-slate-300 px-2 py-2"
          >
            {appData.financialYears.map((fy) => (
              <option key={fy.id} value={fy.id}>
                {fy.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Document Type</label>
          <select
            value={form.docType}
            onChange={(e) => setForm((prev) => ({ ...prev, docType: e.target.value }))}
            className="w-full rounded border border-slate-300 px-2 py-2"
          >
            {(DOC_TYPES_BY_CATEGORY[form.category] || ["Other"]).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Document Name</label>
          <input
            value={form.documentName}
            onChange={(e) => setForm((prev) => ({ ...prev, documentName: e.target.value }))}
            className="w-full rounded border border-slate-300 px-2 py-2"
            placeholder="Auto-filled from file name"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">File Upload (PDF/JPG/PNG, max 10MB)</label>
          <input type="file" onChange={onFileChange} className="w-full rounded border border-slate-300 px-2 py-2" />
          {form.fileName ? (
            <p className="mt-1 text-xs text-slate-500">
              Selected: {form.fileName} ({formatFileSize(form.fileSize)})
            </p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Optional Note</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            rows={3}
            className="w-full rounded border border-slate-300 px-2 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500">
            Submit Document
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function ClientDocumentLibrary({ appData, currentUser, activeFinancialYear, getFyLabel, showToast }) {
  const [filters, setFilters] = useState({
    category: "all",
    fyId: activeFinancialYear?.id || "all",
    docType: "all",
    uploadedOn: "",
  });

  const docs = appData.clientDocuments.filter((doc) => {
    if (doc.clientId !== currentUser.id) return false;
    if (filters.category !== "all" && doc.category !== filters.category) return false;
    if (filters.fyId !== "all" && doc.fyId !== filters.fyId) return false;
    if (filters.docType !== "all" && doc.docType !== filters.docType) return false;
    if (filters.uploadedOn && !doc.uploadDate.startsWith(filters.uploadedOn)) return false;
    return true;
  });

  return (
    <SectionCard title="My Documents" subtitle="Document library with compliance-oriented filters">
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <select
          value={filters.category}
          onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
          className="rounded border border-slate-300 px-2 py-2"
        >
          <option value="all">All Categories</option>
          {currentUser.eprCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={filters.fyId}
          onChange={(e) => setFilters((prev) => ({ ...prev, fyId: e.target.value }))}
          className="rounded border border-slate-300 px-2 py-2"
        >
          <option value="all">All Financial Years</option>
          {appData.financialYears.map((fy) => (
            <option key={fy.id} value={fy.id}>
              {fy.label}
            </option>
          ))}
        </select>

        <select
          value={filters.docType}
          onChange={(e) => setFilters((prev) => ({ ...prev, docType: e.target.value }))}
          className="rounded border border-slate-300 px-2 py-2"
        >
          <option value="all">All Document Types</option>
          {[...new Set(Object.values(DOC_TYPES_BY_CATEGORY).flat())].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.uploadedOn}
          onChange={(e) => setFilters((prev) => ({ ...prev, uploadedOn: e.target.value }))}
          className="rounded border border-slate-300 px-2 py-2"
        />
      </div>

      {docs.length === 0 ? (
        <EmptyState title="No documents found" description="Upload a document or change filters to see records." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Document</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">FY</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Uploaded</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">
                    <p className="font-medium">{doc.documentName}</p>
                    <p className="text-xs text-slate-500">{doc.fileName}</p>
                    {doc.adminComment ? <p className="text-xs text-slate-500">Admin: {doc.adminComment}</p> : null}
                  </td>
                  <td className="px-3 py-2">{doc.category}</td>
                  <td className="px-3 py-2">{getFyLabel(doc.fyId)}</td>
                  <td className="px-3 py-2">{doc.docType}</td>
                  <td className="px-3 py-2">{formatDate(doc.uploadDate)}</td>
                  <td className="px-3 py-2">{formatFileSize(doc.fileSize)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                      onClick={() => showToast(`Download started: ${doc.fileName}`, "info")}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function AdminDocumentManager({ appData, setAppData, showToast, getFyLabel, withAdminGuard }) {
  const clients = appData.users.filter((u) => u.role === "client");
  const [filters, setFilters] = useState({ clientId: "all", category: "all", fyId: "all", docType: "all", status: "all" });
  const [rowEdit, setRowEdit] = useState({});

  const rows = appData.clientDocuments.filter((doc) => {
    if (filters.clientId !== "all" && doc.clientId !== filters.clientId) return false;
    if (filters.category !== "all" && doc.category !== filters.category) return false;
    if (filters.fyId !== "all" && doc.fyId !== filters.fyId) return false;
    if (filters.docType !== "all" && doc.docType !== filters.docType) return false;
    if (filters.status !== "all" && doc.status !== filters.status) return false;
    return true;
  });

  function saveRow(docId) {
    withAdminGuard(() => {
      const edit = rowEdit[docId] || {};
      setAppData((prev) => ({
        ...prev,
        clientDocuments: prev.clientDocuments.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: edit.status || d.status,
                adminComment: edit.adminComment ?? d.adminComment,
              }
            : d
        ),
      }));
      showToast("Document review status updated.", "success");
    });
  }

  return (
    <SectionCard title="Document Manager" subtitle="Review and annotate all client uploads">
      <div className="mb-4 grid gap-2 md:grid-cols-5">
        <select value={filters.clientId} onChange={(e) => setFilters((p) => ({ ...p, clientId: e.target.value }))} className="rounded border border-slate-300 px-2 py-2">
          <option value="all">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company}
            </option>
          ))}
        </select>

        <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className="rounded border border-slate-300 px-2 py-2">
          <option value="all">All Categories</option>
          {EPR_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={filters.fyId} onChange={(e) => setFilters((p) => ({ ...p, fyId: e.target.value }))} className="rounded border border-slate-300 px-2 py-2">
          <option value="all">All Financial Years</option>
          {appData.financialYears.map((fy) => (
            <option key={fy.id} value={fy.id}>
              {fy.label}
            </option>
          ))}
        </select>

        <select value={filters.docType} onChange={(e) => setFilters((p) => ({ ...p, docType: e.target.value }))} className="rounded border border-slate-300 px-2 py-2">
          <option value="all">All Doc Types</option>
          {[...new Set(Object.values(DOC_TYPES_BY_CATEGORY).flat())].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="rounded border border-slate-300 px-2 py-2">
          <option value="all">All Statuses</option>
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No documents match filters" description="Adjust filters to inspect submissions." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">FY</th>
                <th className="px-3 py-2">Doc Type</th>
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2">Upload Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Comment</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((doc) => {
                const client = clients.find((c) => c.id === doc.clientId);
                const edit = rowEdit[doc.id] || {};
                return (
                  <tr key={doc.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{client?.company || "-"}</td>
                    <td className="px-3 py-2">{doc.category}</td>
                    <td className="px-3 py-2">{getFyLabel(doc.fyId)}</td>
                    <td className="px-3 py-2">{doc.docType}</td>
                    <td className="px-3 py-2">{doc.fileName}</td>
                    <td className="px-3 py-2">{formatDate(doc.uploadDate)}</td>
                    <td className="px-3 py-2">
                      <select
                        value={edit.status || doc.status}
                        onChange={(e) =>
                          setRowEdit((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], status: e.target.value } }))
                        }
                        className="rounded border border-slate-300 px-2 py-1"
                      >
                        {DOCUMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={edit.adminComment ?? doc.adminComment ?? ""}
                        onChange={(e) =>
                          setRowEdit((prev) => ({ ...prev, [doc.id]: { ...prev[doc.id], adminComment: e.target.value } }))
                        }
                        className="w-52 rounded border border-slate-300 px-2 py-1"
                        placeholder="Add comment"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => saveRow(doc.id)}
                        className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function AdminAuditDocuments({
  appData,
  setAppData,
  activeFinancialYear,
  showToast,
  getFyLabel,
  withAdminGuard,
}) {
  const clients = appData.users.filter((u) => u.role === "client");
  const [filters, setFilters] = useState({ clientId: "all", fyId: "all", category: "all", docType: "all" });
  const [editingDocId, setEditingDocId] = useState("");

  const [form, setForm] = useState({
    clientId: clients[0]?.id || "",
    fyId: activeFinancialYear?.id || "",
    category: "Plastic",
    docType: AUDIT_DOC_TYPES[0],
    title: "",
    fileName: "",
    fileSize: 0,
    internalNote: "",
    clientNote: "",
    markAs: "Draft",
    visibleToClient: true,
  });

  const editingDoc = appData.auditDocuments.find((d) => d.id === editingDocId) || null;

  useEffect(() => {
    if (editingDoc) {
      setForm({
        clientId: editingDoc.clientId,
        fyId: editingDoc.fyId,
        category: editingDoc.category,
        docType: editingDoc.docType,
        title: editingDoc.title,
        fileName: editingDoc.fileName,
        fileSize: editingDoc.fileSize || 0,
        internalNote: editingDoc.internalNote || "",
        clientNote: editingDoc.clientNote || "",
        markAs: editingDoc.markAs || "Draft",
        visibleToClient: !!editingDoc.visibleToClient,
      });
    }
  }, [editingDocId, editingDoc]);

  const rows = appData.auditDocuments.filter((doc) => {
    if (filters.clientId !== "all" && doc.clientId !== filters.clientId) return false;
    if (filters.fyId !== "all" && doc.fyId !== filters.fyId) return false;
    if (filters.category !== "all" && doc.category !== filters.category) return false;
    if (filters.docType !== "all" && doc.docType !== filters.docType) return false;
    return true;
  });

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, fileName: file.name, fileSize: file.size, title: prev.title || file.name }));
  }

  function resetForm() {
    setEditingDocId("");
    setForm((prev) => ({
      ...prev,
      fyId: activeFinancialYear?.id || prev.fyId,
      docType: AUDIT_DOC_TYPES[0],
      title: "",
      fileName: "",
      fileSize: 0,
      internalNote: "",
      clientNote: "",
      markAs: "Draft",
      visibleToClient: true,
    }));
  }

  function saveAudit(e) {
    e.preventDefault();
    withAdminGuard(() => {
      if (!form.clientId || !form.fyId || !form.category || !form.docType || !form.title.trim() || !form.fileName) {
        showToast("Please fill all required audit fields.", "error");
        return;
      }

      if (editingDocId) {
        setAppData((prev) => ({
          ...prev,
          auditDocuments: prev.auditDocuments.map((d) =>
            d.id === editingDocId
              ? {
                  ...d,
                  ...form,
                  title: form.title.trim(),
                  uploadDate: nowIso(),
                }
              : d
          ),
        }));
        showToast("Audit document updated.", "success");
      } else {
        const newDoc = {
          id: `ad_${Date.now()}`,
          ...form,
          title: form.title.trim(),
          uploadDate: nowIso(),
        };
        setAppData((prev) => ({ ...prev, auditDocuments: [newDoc, ...prev.auditDocuments] }));
        showToast("Audit document uploaded.", "success");
      }

      resetForm();
    });
  }

  function deleteDoc(id) {
    withAdminGuard(() => {
      setAppData((prev) => ({ ...prev, auditDocuments: prev.auditDocuments.filter((d) => d.id !== id) }));
      if (editingDocId === id) resetForm();
      showToast("Audit document deleted.", "warning");
    });
  }

  function toggleVisibility(id) {
    withAdminGuard(() => {
      setAppData((prev) => ({
        ...prev,
        auditDocuments: prev.auditDocuments.map((d) =>
          d.id === id ? { ...d, visibleToClient: !d.visibleToClient } : d
        ),
      }));
      showToast("Client visibility toggled.", "info");
    });
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={editingDocId ? "Edit Audit Document" : "Upload Audit Document"}
        subtitle="Client-specific, FY-specific audit records"
      >
        <form onSubmit={saveAudit} className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Client</label>
            <select value={form.clientId} onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-2">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Financial Year</label>
            <select value={form.fyId} onChange={(e) => setForm((p) => ({ ...p, fyId: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-2">
              {appData.financialYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">EPR Category</label>
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-2">
              {EPR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Audit Document Type</label>
            <select value={form.docType} onChange={(e) => setForm((p) => ({ ...p, docType: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-2">
              {AUDIT_DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Document Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Mark As</label>
            <select value={form.markAs} onChange={(e) => setForm((p) => ({ ...p, markAs: e.target.value }))} className="w-full rounded border border-slate-300 px-2 py-2">
              {AUDIT_MARK_AS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">File Upload</label>
            <input type="file" onChange={onFile} className="w-full rounded border border-slate-300 px-2 py-2" />
            {form.fileName ? (
              <p className="mt-1 text-xs text-slate-500">
                Selected: {form.fileName} ({formatFileSize(form.fileSize)})
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Internal Note (admin-only)</label>
            <textarea
              value={form.internalNote}
              onChange={(e) => setForm((p) => ({ ...p, internalNote: e.target.value }))}
              rows={3}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Client Note</label>
            <textarea
              value={form.clientNote}
              onChange={(e) => setForm((p) => ({ ...p, clientNote: e.target.value }))}
              rows={3}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              id="visible"
              type="checkbox"
              checked={form.visibleToClient}
              onChange={(e) => setForm((p) => ({ ...p, visibleToClient: e.target.checked }))}
            />
            <label htmlFor="visible" className="text-sm text-slate-700">
              Visible to Client
            </label>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
              {editingDocId ? "Update Document" : "Upload Document"}
            </button>
            {editingDocId ? (
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100">
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Audit Document Library" subtitle="Filter, edit, delete, re-upload, and control visibility">
        <div className="mb-4 grid gap-2 md:grid-cols-4">
          <select value={filters.clientId} onChange={(e) => setFilters((p) => ({ ...p, clientId: e.target.value }))} className="rounded border border-slate-300 px-2 py-2">
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company}
              </option>
            ))}
          </select>

          <select value={filters.fyId} onChange={(e) => setFilters((p) => ({ ...p, fyId: e.target.value }))} className="rounded border border-slate-300 px-2 py-2">
            <option value="all">All Financial Years</option>
            {appData.financialYears.map((fy) => (
              <option key={fy.id} value={fy.id}>
                {fy.label}
              </option>
            ))}
          </select>

          <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className="rounded border border-slate-300 px-2 py-2">
            <option value="all">All Categories</option>
            {EPR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select value={filters.docType} onChange={(e) => setFilters((p) => ({ ...p, docType: e.target.value }))} className="rounded border border-slate-300 px-2 py-2">
            <option value="all">All Types</option>
            {AUDIT_DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No audit records found" description="Upload an audit document or adjust filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">FY</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Mark As</th>
                  <th className="px-3 py-2">Visibility</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((doc) => {
                  const client = clients.find((c) => c.id === doc.clientId);
                  return (
                    <tr key={doc.id} className="border-t border-slate-200">
                      <td className="px-3 py-2">{client?.company}</td>
                      <td className="px-3 py-2">{getFyLabel(doc.fyId)}</td>
                      <td className="px-3 py-2">{doc.category}</td>
                      <td className="px-3 py-2">{doc.docType}</td>
                      <td className="px-3 py-2">{doc.title}</td>
                      <td className="px-3 py-2">{doc.markAs}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => toggleVisibility(doc.id)}
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            doc.visibleToClient ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {doc.visibleToClient ? "Visible" : "Hidden"}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingDocId(doc.id)}
                            className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                          >
                            Edit / Re-upload
                          </button>
                          <button
                            onClick={() => deleteDoc(doc.id)}
                            className="rounded border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ClientAuditDocuments({ appData, currentUser, getFyLabel, showToast }) {
  const visibleDocs = appData.auditDocuments
    .filter((d) => d.clientId === currentUser.id && d.visibleToClient)
    .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

  const grouped = visibleDocs.reduce((acc, doc) => {
    const fy = getFyLabel(doc.fyId);
    if (!acc[fy]) acc[fy] = {};
    if (!acc[fy][doc.category]) acc[fy][doc.category] = [];
    acc[fy][doc.category].push(doc);
    return acc;
  }, {});

  return (
    <SectionCard title="My Audit Documents" subtitle="Client-visible audit records grouped by financial year and category">
      {visibleDocs.length === 0 ? (
        <EmptyState
          title="No visible audit documents"
          description="Your admin team has not published any audit record for your account yet."
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([fyLabel, categories]) => (
            <div key={fyLabel} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-base font-semibold text-slate-900">{fyLabel}</h3>
              <div className="mt-3 space-y-3">
                {Object.entries(categories).map(([category, docs]) => (
                  <div key={category} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-800">{category}</p>
                    <div className="mt-2 space-y-2">
                      {docs.map((doc) => (
                        <div key={doc.id} className="rounded border border-slate-200 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium text-slate-900">{doc.title}</p>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{doc.markAs}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {doc.docType} | {formatDate(doc.uploadDate)}
                          </p>
                          {doc.clientNote ? <p className="mt-1 text-sm text-slate-700">Note: {doc.clientNote}</p> : null}
                          <button
                            className="mt-2 rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
                            onClick={() => showToast(`Download started: ${doc.fileName}`, "info")}
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function ClientProfile({ currentUser, activeFinancialYear }) {
  return (
    <SectionCard title="Profile" subtitle="Registered client identity and compliance scope">
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Name</p>
          <p className="font-semibold text-slate-900">{currentUser.name}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Company</p>
          <p className="font-semibold text-slate-900">{currentUser.company}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Email</p>
          <p className="font-semibold text-slate-900">{currentUser.email}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Phone</p>
          <p className="font-semibold text-slate-900">{currentUser.phone}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2">
          <p className="text-xs text-slate-500">Mapped EPR Categories</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {currentUser.eprCategories.map((cat) => (
              <span key={cat} className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {cat}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 md:col-span-2">
          <p className="text-xs text-emerald-700">Global Active Financial Year</p>
          <p className="font-semibold text-emerald-800">{activeFinancialYear?.label}</p>
        </div>
      </div>
    </SectionCard>
  );
}
