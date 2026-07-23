const API_BASE =
  window.__API_BASE__ ||
  (window.location.hostname === "localhost" ? "http://localhost:8080" : "");
const store = window.SMISStore || null;
if (store) {
  store.ensure();
}

const withLoading = async (work, label, options = {}) => {
  const loading = window.SMISLoading;
  const overlay = Boolean(options.overlay);
  if (loading && overlay) loading.start(label || "Loading...");
  try {
    return await work();
  } finally {
    if (loading && overlay) loading.stop();
  }
};

const SESSION_KEY = "sms_session_v1";

const getSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
};

const setSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

const resolveRole = (username) => {
  const normalized = String(username || "").trim();
  if (!normalized) return "";
  if (/^admin\d*$/i.test(normalized)) return "admin";
  if (/^\d/.test(normalized)) return "student";
  return "";
};

const formatSessionDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const getPageName = () => {
  const path = window.location.pathname.split("/");
  return path[path.length - 1] || "";
};

const buildNav = (role) => {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const useSidebar = Boolean(role && role !== "guest");
  const navIcons = {
    "dashboard.html": '<svg viewBox="0 0 24 24"><path d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z" /></svg>',
    "student-dashboard.html": '<svg viewBox="0 0 24 24"><path d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z" /></svg>',
    "students.html": '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-4h4m-2-2v4" /></svg>',
    "registrations.html": '<svg viewBox="0 0 24 24"><path d="M6 2v4m12-4v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm4 10 2 2 4-4" /></svg>',
    "registration.html": '<svg viewBox="0 0 24 24"><path d="M6 2v4m12-4v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm4 10 2 2 4-4" /></svg>',
    "users.html": '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6m3-3h-6" /></svg>',
    "catalog.html": '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Zm0 0A2.5 2.5 0 0 0 6.5 22H20v-5" /></svg>',
    "reports.html": '<svg viewBox="0 0 24 24"><path d="M4 20V10m6 10V4m6 16v-7m4 7H2" /></svg>',
    "results.html": '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8l-6-6Zm0 0v6h6M8 13h8m-8 4h6" /></svg>',
    "login.html": '<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5m5 5H3m11-9h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>',
  };
  const links = [];
  const isAdmin = role === "admin" || role === "super_admin";
  if (isAdmin) {
    links.push(
      { label: "Dashboard", href: "dashboard.html" },
      { label: "Students", href: "students.html" },
      { label: "Registrations", href: "registrations.html" },
      { label: "Users", href: "users.html" },
      { label: "Catalog", href: "catalog.html" },
      { label: "Reports", href: "reports.html" },
      { label: "Results", href: "results.html" }
    );
  } else if (role === "student") {
    links.push(
      { label: "Dashboard", href: "student-dashboard.html" },
      { label: "Registration", href: "registration.html" },
      { label: "Results", href: "results.html" }
    );
  } else {
    links.push({ label: "Login", href: "login.html" });
  }

  nav.innerHTML = links
    .map(
      (item) =>
        `<a href="${item.href}">${useSidebar ? `<span class="nav-icon" aria-hidden="true">${navIcons[item.href] || ""}</span>` : ""}<span>${item.label}</span></a>`
    )
    .join("");

  if (role && role !== "guest") {
    const logout = document.createElement("a");
    logout.href = "#";
    logout.className = "nav-logout";
    logout.innerHTML = `
      <span class="nav-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5m5 5H3m11-9h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>
      </span>
      <span>Logout</span>
    `;
    logout.setAttribute("data-logout", "true");
    nav.appendChild(logout);
  }

  const current = getPageName();
  nav.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  document.body.classList.toggle("has-sidebar", useSidebar);
  if (!useSidebar) return;

  const topbar = document.querySelector(".topbar");
  if (!topbar || document.querySelector(".sidebar-toggle")) return;

  topbar.id = "appSidebar";
  const toggle = document.createElement("button");
  toggle.className = "sidebar-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Open navigation menu");
  toggle.setAttribute("aria-controls", "appSidebar");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "<span></span><span></span><span></span>";

  const overlay = document.createElement("button");
  overlay.className = "sidebar-overlay";
  overlay.type = "button";
  overlay.setAttribute("aria-label", "Close navigation menu");

  const setSidebarOpen = (isOpen) => {
    document.body.classList.toggle("sidebar-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  };

  toggle.addEventListener("click", () => {
    setSidebarOpen(!document.body.classList.contains("sidebar-open"));
  });
  overlay.addEventListener("click", () => setSidebarOpen(false));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setSidebarOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setSidebarOpen(false);
  });

  document.body.append(toggle, overlay);
};

const applyRoleVisibility = (role) => {
  document.querySelectorAll("[data-role]").forEach((node) => {
    const required = node.getAttribute("data-role");
    if (!required || !role) {
      node.style.display = "none";
      return;
    }
    if (required === role) {
      node.style.display = "";
      return;
    }
    if (required === "admin" && role === "super_admin") {
      node.style.display = "";
      return;
    }
    node.style.display = "none";
  });
};

const applyRouteGuard = (role) => {
  const page = getPageName();
  const adminPages = new Set([
    "dashboard.html",
    "students.html",
    "users.html",
    "catalog.html",
    "reports.html",
    "registrations.html"
  ]);
  const studentPages = new Set([
    "student-dashboard.html",
    "registration.html"
  ]);
  const sharedPages = new Set(["results.html"]);

  if (!page || page === "index.html") return;

  if (page === "login.html" && role) {
    const target = role === "admin" || role === "super_admin" ? "dashboard.html" : "student-dashboard.html";
    window.location.replace(target);
    return;
  }

  if (!role) {
    if (adminPages.has(page) || studentPages.has(page) || sharedPages.has(page)) {
      window.location.replace("login.html");
    }
    return;
  }

  if ((role === "admin" || role === "super_admin") && studentPages.has(page)) {
    window.location.replace("dashboard.html");
    return;
  }

  if (role === "student" && adminPages.has(page)) {
    window.location.replace("student-dashboard.html");
  }
};

const isProtectedPage = () => {
  const page = getPageName();
  return new Set([
    "dashboard.html",
    "students.html",
    "users.html",
    "catalog.html",
    "reports.html",
    "student-dashboard.html",
    "registration.html",
    "results.html",
  ]).has(page);
};

const applySessionDetails = (session) => {
  document.querySelectorAll("[data-session='username']").forEach((node) => {
    node.textContent = session && session.username ? session.username : "Guest";
  });

  document.querySelectorAll("[data-session='lastLogin']").forEach((node) => {
    node.textContent = formatSessionDate(session && session.lastLogin);
  });
};

const computeGpa = (rows) => {
  if (!rows.length) return "0.00";
  const gradePoint = (grade) => {
    if (grade === "A") return 5;
    if (grade === "B") return 4;
    if (grade === "C") return 3;
    if (grade === "D") return 2;
    if (grade === "E") return 1;
    return 0;
  };
  const totals = rows.reduce(
    (acc, row) => {
      const units = Number(row.unit) || 0;
      return {
        quality: acc.quality + gradePoint(row.grade) * units,
        units: acc.units + units,
      };
    },
    { quality: 0, units: 0 }
  );
  if (!totals.units) return "0.00";
  return (totals.quality / totals.units).toFixed(2);
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatBytes = (value) => {
  const size = Number(value || 0);
  if (!size || Number.isNaN(size)) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(size) / Math.log(1024)));
  const scaled = size / Math.pow(1024, index);
  return `${scaled.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const renderAdminActivity = async () => {
  const list = document.getElementById("adminActivityList");
  if (!list) return;

  list.innerHTML = loadingListItem("Loading activity...");

  try {
    const result = await getJson("/api/admin/activity", "Loading activity...");
    const items = Array.isArray(result.data) ? result.data : [];
    list.innerHTML = items.length
      ? items
          .map(
            (item, index) => `
              <li>
                <span class="activity-marker" aria-hidden="true">${index + 1}</span>
                <span>${escapeHtml(item)}</span>
              </li>`
          )
          .join("")
      : '<li class="empty-state">No recent activity yet.</li>';
    clearError();
  } catch (_err) {
    list.innerHTML = '<li class="empty-state">No recent activity yet.</li>';
    showError("Unable to load recent activity.");
  }
};

const initAdminSearch = () => {
  const input = document.getElementById("adminStudentSearch");
  const button = document.getElementById("adminStudentSearchBtn");
  if (!input || !button) return;

  const go = () => {
    const value = String(input.value || "").trim();
    if (!value) return;
    window.location.href = `students.html?student=${encodeURIComponent(value)}`;
  };

  button.addEventListener("click", go);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      go();
    }
  });
};

const renderStudentDashboard = async () => {
  const root = document.getElementById("studentDashboard");
  if (!root) return;

  const registeredCoursesBody = document.getElementById("registeredCoursesBody");
  if (registeredCoursesBody) {
    registeredCoursesBody.innerHTML = loadingTableRow(4, "Loading courses...");
  }

  const recentResultsBody = document.getElementById("recentResultsBody");
  if (recentResultsBody) {
    recentResultsBody.innerHTML = loadingTableRow(4, "Loading results...");
  }

  const trendList = document.getElementById("gpaTrendList");
  if (trendList) {
    trendList.innerHTML = loadingListItem("Loading GPA trend...");
  }

  const session = getSession();
  const studentNo = session ? String(session.username || "") : "";

  let payload;
  try {
    const result = await getJson("/api/students/me/dashboard", "Loading dashboard...");
    payload = result.data;
    clearError();
  } catch (_err) {
    showError("Unable to load your dashboard. Please refresh.");
    return;
  }

  const student = payload.student;
  const profile = payload.profile || student || {};
  const registrations = payload.registrations || [];
  const results = payload.results || [];

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  const studentName = profile.name || "Student";
  const initials = studentName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  setText("studentName", studentName);
  setText("studentNo", studentNo || "—");
  setText("studentProfileNo", studentNo || "—");
  setText("studentDepartment", profile.department || "—");
  setText("studentLevel", profile.level || "—");
  setText("studentStatus", profile.status || "—");
  setText("studentProfileStatus", profile.status || "—");
  setText("studentInitials", initials || "ST");

  setText("registrationCount", String(registrations.length || 0));
  setText("resultsCount", String(results.length || 0));
  setText("studentGpa", payload.gpa || "0.00");
  setText("studentCgpa", payload.cgpa || "0.00");

  const latestRegistration = payload.latestRegistration;
  if (latestRegistration) {
    setText("registeredUnits", String(payload.registeredUnits || 0));
    setText("pendingResults", String(payload.pendingResults || 0));
  } else {
    setText("registeredUnits", "0");
    setText("pendingResults", "0");
  }

  const registrationStatus = document.getElementById("registrationStatus");
  if (registrationStatus) {
    if (latestRegistration) {
      registrationStatus.textContent = `${latestRegistration.regNo} · ${latestRegistration.academicYear} ${latestRegistration.semester}`;
    } else {
      registrationStatus.textContent = "No registration submitted yet.";
    }
  }

  if (registeredCoursesBody) {
    if (latestRegistration && latestRegistration.courses.length) {
      registeredCoursesBody.innerHTML = latestRegistration.courses
        .map((course, index) => {
          const parts = String(course).split(" - ");
          const code = parts.shift() || course;
          const title = parts.join(" - ") || "Course";
          return `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${escapeHtml(code)}</strong></td>
              <td>${escapeHtml(title)}</td>
              <td><span class="status-badge status-accepted">Registered</span></td>
            </tr>`;
        })
        .join("");
    } else {
      registeredCoursesBody.innerHTML =
        '<tr><td colspan="4" class="empty-state student-table-empty">No courses registered for the current semester.</td></tr>';
    }
  }

  if (recentResultsBody) {
    const recent = Array.isArray(payload.latestResults) ? payload.latestResults : [];
    recentResultsBody.innerHTML = recent.length
      ? recent
          .map(
            (row) => `
              <tr>
                <td><strong>${escapeHtml(row.course)}</strong></td>
                <td>${escapeHtml(`${row.academicYear} · ${row.semester}`)}</td>
                <td>${escapeHtml(row.total)}</td>
                <td><span class="student-grade grade-${escapeHtml(String(row.grade).toLowerCase())}">${escapeHtml(row.grade)}</span></td>
              </tr>`
          )
          .join("")
      : '<tr><td colspan="4" class="empty-state student-table-empty">No results have been published yet.</td></tr>';
  }

  if (trendList) {
    const byTerm = new Map();
    results.forEach((row) => {
      const key = `${row.academicYear} ${row.semester}`;
      if (!byTerm.has(key)) byTerm.set(key, []);
      byTerm.get(key).push(row);
    });

    const sorted = Array.from(byTerm.entries())
      .map(([term, rows]) => ({ term, gpa: computeGpa(rows) }))
      .slice(-3)
      .reverse();

    trendList.innerHTML = sorted.length
      ? sorted
          .map(
            (item) => `
              <li>
                <span><strong>${escapeHtml(item.term)}</strong><small>Semester performance</small></span>
                <b>${escapeHtml(item.gpa)}</b>
              </li>`
          )
          .join("")
      : '<li class="empty-state">No GPA history available yet.</li>';
  }
};

const bootNavigation = () => {
  const session = getSession();
  const role = session ? session.role : "";
  buildNav(role);
  applyRoleVisibility(role);
  applySessionDetails(session);
  applyRouteGuard(role);
};

// Build the authenticated application shell before page-specific API work.
// This keeps the sidebar available even when a page request or widget fails.
bootNavigation();

const confirmLogout = () =>
  new Promise((resolve) => {
    const previousFocus = document.activeElement;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop logout-modal-backdrop";
    backdrop.setAttribute("role", "presentation");
    backdrop.innerHTML = `
      <section
        class="modal-card logout-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logoutModalTitle"
        aria-describedby="logoutModalDescription"
      >
        <button class="logout-modal-close" type="button" aria-label="Close logout confirmation">&times;</button>
        <div class="logout-modal-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
          </svg>
        </div>
        <div class="logout-modal-copy">
          <h3 id="logoutModalTitle">Log out of your account?</h3>
          <p id="logoutModalDescription">You will need to sign in again to access your dashboard and academic information.</p>
        </div>
        <div class="modal-actions logout-modal-actions">
          <button class="btn btn-outline" type="button" data-logout-cancel>Stay logged in</button>
          <button class="btn logout-confirm-btn" type="button" data-logout-confirm>Yes, log out</button>
        </div>
      </section>
    `;

    const finish = (confirmed) => {
      document.removeEventListener("keydown", handleKeydown);
      backdrop.remove();
      document.body.classList.remove("modal-open");
      if (!confirmed && previousFocus instanceof HTMLElement) previousFocus.focus();
      resolve(confirmed);
    };

    const handleKeydown = (event) => {
      if (event.key === "Escape") finish(false);
      if (event.key !== "Tab") return;

      const controls = Array.from(
        backdrop.querySelectorAll("button:not([disabled]), [href], input, select, textarea")
      );
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    backdrop.addEventListener("click", (event) => {
      if (
        event.target === backdrop ||
        event.target.closest("[data-logout-cancel], .logout-modal-close")
      ) {
        finish(false);
      } else if (event.target.closest("[data-logout-confirm]")) {
        finish(true);
      }
    });

    document.body.appendChild(backdrop);
    document.body.classList.add("modal-open");
    document.addEventListener("keydown", handleKeydown);
    backdrop.querySelector("[data-logout-cancel]").focus();
  });

document.addEventListener("click", async (event) => {
  const logout = event.target.closest("[data-logout]");
  if (!logout) return;
  event.preventDefault();
  const confirmed = await confirmLogout();
  if (!confirmed) return;
  clearSession();
  window.location.replace("login.html");
});

window.addEventListener("pageshow", () => {
  if (!getSession() && isProtectedPage()) {
    window.location.replace("login.html");
  }
});

const flash = (message) => {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
};

let errorTimer = null;

const ensureErrorBanner = () => {
  let banner = document.getElementById("errorBanner");
  if (banner) return banner;

  const container = document.querySelector("main.container");
  if (!container) return null;

  banner = document.createElement("div");
  banner.id = "errorBanner";
  banner.className = "error-banner";
  banner.style.display = "none";
  container.prepend(banner);
  return banner;
};

const showError = (message) => {
  if (!message) return;
  const banner = ensureErrorBanner();
  if (!banner) return;
  banner.textContent = String(message);
  banner.style.display = "block";
  if (errorTimer) {
    clearTimeout(errorTimer);
  }
  errorTimer = setTimeout(() => {
    clearError();
  }, 4500);
};

const clearError = () => {
  const banner = document.getElementById("errorBanner");
  if (!banner) return;
  banner.textContent = "";
  banner.style.display = "none";
  if (errorTimer) {
    clearTimeout(errorTimer);
    errorTimer = null;
  }
};

const loadingListItem = (label) =>
  `<li class="loading-inline">${label || "Loading..."}</li>`;

const loadingTableRow = (colSpan, label) =>
  `<tr><td class="loading-inline" colspan="${colSpan || 1}">${label || "Loading..."}</td></tr>`;

const getAuthHeaders = () => {
  const session = getSession();
  if (!session || !session.token) return {};
  return { Authorization: `Bearer ${session.token}` };
};

const postJson = async (path, payload, label, options) =>
  withLoading(async () => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload || {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status === "error") {
      throw new Error(data.message || "Request failed");
    }
    return data;
  }, label, options);

const getJson = async (path, label, options) =>
  withLoading(async () => {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status === "error") {
      throw new Error(data.message || "Request failed");
    }
    return data;
  }, label, options);

const renderSubmissionPreview = (container, file, dataUrl) => {
  if (!container) return;
  if (!file) {
    container.innerHTML = '<p class="muted">No file selected yet.</p>';
    return;
  }

  const meta = `
    <div>
      <strong>${escapeHtml(file.name)}</strong>
      <div class="muted">${escapeHtml(file.type || "Unknown type")} · ${formatBytes(file.size)}</div>
    </div>`;

  if (dataUrl && file.type.startsWith("image/")) {
    container.innerHTML = `${meta}<img src="${dataUrl}" alt="File preview" />`;
    return;
  }

  if (dataUrl && file.type === "application/pdf") {
    container.innerHTML = `${meta}<iframe src="${dataUrl}" title="PDF preview"></iframe>`;
    return;
  }

  container.innerHTML = `${meta}<p class="muted">Preview not available for this file type.</p>`;
};

const renderStudentSubmissions = async () => {
  const list = document.getElementById("submissionList");
  if (!list || !store) return;
  const isTable = list.tagName === "TBODY";
  const session = getSession();
  const studentNo = session ? String(session.username || "").trim() : "";
  if (!studentNo) {
    list.innerHTML = isTable
      ? '<tr><td colspan="3" class="empty-state student-table-empty">Log in as a student to view submissions.</td></tr>'
      : '<li class="empty-state">Log in as a student to view submissions.</li>';
    return;
  }

  list.innerHTML = isTable
    ? loadingTableRow(3, "Loading submissions...")
    : loadingListItem("Loading submissions...");
  const rows = await withLoading(() => store.getStudentSubmissions(), "Loading submissions...");
  if (isTable) {
    list.innerHTML = rows.length
      ? rows
          .slice(0, 6)
          .map((item) => {
            const statusClass = `status-${String(item.status || "pending").toLowerCase()}`;
            return `
              <tr>
                <td>
                  <strong>${escapeHtml(item.fileName)}</strong>
                  <small class="table-secondary">${escapeHtml(item.fileType)} · ${formatBytes(item.fileSize)}</small>
                </td>
                <td>${escapeHtml(formatSessionDate(item.submittedAt))}</td>
                <td>
                  <span class="status-badge ${statusClass}">${escapeHtml(item.status || "Pending")}</span>
                  ${item.reviewNote ? `<small class="table-secondary">${escapeHtml(item.reviewNote)}</small>` : ""}
                </td>
              </tr>`;
          })
          .join("")
      : '<tr><td colspan="3" class="empty-state student-table-empty">No documents submitted yet.</td></tr>';
    return;
  }
  list.innerHTML = rows.length
    ? rows
        .map((item) => {
          const statusClass = `status-${String(item.status || "pending").toLowerCase()}`;
          const reviewNote = item.reviewNote
            ? `<div class="muted">Admin note: ${escapeHtml(item.reviewNote)}</div>`
            : "";
          const reviewedAt = item.reviewedAt
            ? `<div class="muted">Reviewed ${formatSessionDate(item.reviewedAt)}</div>`
            : "";
          return `
            <li>
              <div class="submission-row">
                <div>
                  <strong>${escapeHtml(item.fileName)}</strong>
                  <div class="muted">${escapeHtml(item.fileType)} · ${formatBytes(item.fileSize)}</div>
                  <div class="muted">Submitted ${formatSessionDate(item.submittedAt)}</div>
                  ${reviewedAt}
                  ${reviewNote}
                </div>
                <span class="status-badge ${statusClass}">${escapeHtml(item.status || "Pending")}</span>
              </div>
            </li>`;
        })
        .join("")
    : '<li class="empty-state">No submissions yet.</li>';
};

const renderAdminSubmissions = async () => {
  const body = document.getElementById("submissionTableBody");
  const empty = document.getElementById("submissionEmpty");
  const filter = document.getElementById("submissionStatusFilter");
  if (!body || !store) return;

  body.innerHTML = loadingTableRow(5, "Loading submissions...");
  if (empty) empty.style.display = "none";

  const selected = filter ? String(filter.value || "all").toLowerCase() : "all";
  const rows = await withLoading(
    () => store.getSubmissions(selected === "all" ? "" : selected),
    "Loading submissions..."
  );

  body.innerHTML = rows
    .map((item) => {
      const studentNo = item.student ? item.student.studentNo : item.studentNo;
      const statusClass = `status-${String(item.status || "pending").toLowerCase()}`;
      const reviewNote = item.reviewNote
        ? `<div class="muted">Review: ${escapeHtml(item.reviewNote)}</div>`
        : "";
      return `
        <tr>
          <td>${escapeHtml(studentNo || "-")}</td>
          <td>
            <div><strong>${escapeHtml(item.fileName)}</strong></div>
            <div class="muted">${escapeHtml(item.fileType)} · ${formatBytes(item.fileSize)}</div>
            ${item.note ? `<div class="muted">Note: ${escapeHtml(item.note)}</div>` : ""}
            ${reviewNote}
          </td>
          <td>${formatSessionDate(item.submittedAt)}</td>
          <td><span class="status-badge ${statusClass}">${escapeHtml(item.status || "Pending")}</span></td>
          <td>
            <div class="actions">
              <button class="btn btn-outline btn-sm" type="button" data-submission-preview="${item.id}">Preview</button>
              <button class="btn btn-sm" type="button" data-submission-accept="${item.id}">Accept</button>
              <button class="btn btn-outline btn-sm btn-danger" type="button" data-submission-reject="${item.id}">Reject</button>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  if (empty) {
    empty.style.display = rows.length ? "none" : "block";
  }
};

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const username = String(formData.get("username") || "").trim();
    try {
      const result = await postJson(
        "/api/auth/login",
        {
          username,
          password: formData.get("password"),
        },
        "Signing in...",
        { overlay: true }
      );
      clearError();
      const user = result.data.user;
      setSession({
        token: result.data.token,
        username: user.username,
        role: user.role,
        name: user.name,
        studentNo: user.studentNo,
        lastLogin: new Date().toISOString(),
      });
      flash(result.message);
      const target = user.role === "admin" || user.role === "super_admin"
        ? "dashboard.html"
        : "student-dashboard.html";
      window.location.href = target;
    } catch (err) {
      showError(err.message);
      flash(err.message);
    }
  });
}

const registrationForm = document.getElementById("registrationForm");
const selectedCoursesList = document.getElementById("selectedCourses");
if (registrationForm) {
  const checklist = document.getElementById("courseChecklist");
  const registrationDepartment = document.getElementById("registrationDepartment");
  const registrationStudentNo = document.getElementById("registrationStudentNo");
  const generatedRegNo = document.getElementById("generatedRegNo");
  const registrationDeadline = document.getElementById("registrationDeadline");

  if (store && registrationDeadline) {
    store
      .getRegistrationSettings()
      .then((settings) => {
        const deadline = settings && settings.registrationDeadline;
        if (!deadline) {
          registrationDeadline.textContent = "Deadline: Not set";
          return;
        }
        const formatted = new Date(`${deadline}T00:00:00`).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        registrationDeadline.textContent = `Deadline: ${formatted}`;
      })
      .catch(() => {
        registrationDeadline.textContent = "Deadline: Unavailable";
      });
  }

  const populateRegistrationStudents = async () => {
    if (!registrationDepartment || !registrationStudentNo || !store) return;
    const selectedDepartment = registrationDepartment.value;
    const students = selectedDepartment
      ? await store.getStudentsByDepartment(selectedDepartment)
      : [];
    registrationStudentNo.innerHTML =
      '<option value="">Select student</option>' +
      students
        .map(
          (student) =>
            `<option value="${student.studentNo}">${student.studentNo} - ${student.name}</option>`
        )
        .join("");
  };

  if (registrationDepartment && store) {
    store.getDepartments().then((departments) => {
      registrationDepartment.innerHTML =
        '<option value="">Select department</option>' +
        departments
          .map((department) => `<option value="${department.name}">${department.name}</option>`)
          .join("");
      registrationDepartment.addEventListener("change", populateRegistrationStudents);
      populateRegistrationStudents();
    });
  }

  const session = getSession();
  if (session && session.role === "student" && store && registrationDepartment) {
    store.getStudentsByDepartment("").then((students) => {
      const me = students[0];
      if (!me) return;
      registrationDepartment.value = me.department?.name || me.department || "";
      registrationDepartment.setAttribute("disabled", "disabled");
      populateRegistrationStudents().then(() => {
        if (registrationStudentNo) {
          registrationStudentNo.value = me.studentNo;
          registrationStudentNo.setAttribute("disabled", "disabled");
        }
      });
    });
  }

  if (checklist && store) {
    store.getCourseOptions().then((courses) => {
      checklist.innerHTML = courses.length
        ? courses
            .map(
              (course) =>
                `<label><input type="checkbox" data-course="${escapeHtml(course.label)}" /> ${escapeHtml(course.label)}</label>`
            )
            .join("")
        : '<p class="empty-state">No courses are currently available.</p>';
    });
  }

  if (checklist && selectedCoursesList) {
    checklist.addEventListener("change", () => {
      const selected = Array.from(
        checklist.querySelectorAll("input[type='checkbox']:checked")
      ).map((input) => input.dataset.course);
      selectedCoursesList.innerHTML = selected.length
        ? selected.map((course) => `<li>${escapeHtml(course)}</li>`).join("")
        : '<li class="empty-state">No courses selected yet.</li>';
    });
  }

  registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(registrationForm);
    const courses = Array.from(
      registrationForm.querySelectorAll("input[type='checkbox']:checked")
    ).map((input) => input.dataset.course);
    const studentNo = formData.get("studentNo") || (registrationStudentNo ? registrationStudentNo.value : "");

    if (!courses.length) {
      const message = "Select at least one course before submitting.";
      showError(message);
      flash(message);
      return;
    }

    try {
      const result = await postJson(
        "/api/registrations",
        {
          studentNo,
          semester: formData.get("semester"),
          academicYear: formData.get("academicYear"),
          courses,
        },
        "Submitting registration...",
        { overlay: true }
      );
      const regNo = result.data && result.data.regNo ? result.data.regNo : "";
      if (generatedRegNo && regNo) generatedRegNo.value = regNo;
      clearError();
      flash(regNo ? `Registration saved. No: ${regNo}` : result.message || "Registration saved.");
    } catch (err) {
      showError(err.message);
      flash(err.message);
    }
  });
}

const registrationDeadlineForm = document.getElementById("registrationDeadlineForm");
if (registrationDeadlineForm && store) {
  const deadlineInput = document.getElementById("adminRegistrationDeadline");

  store
    .getRegistrationSettings()
    .then((settings) => {
      if (deadlineInput) {
        deadlineInput.value = settings && settings.registrationDeadline
          ? settings.registrationDeadline
          : "";
      }
    })
    .catch((err) => showError(err.message || "Unable to load registration deadline."));

  registrationDeadlineForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const deadline = deadlineInput ? deadlineInput.value : "";
    try {
      await store.updateRegistrationSettings({ registrationDeadline: deadline });
      clearError();
      flash("Registration deadline updated.");
    } catch (err) {
      showError(err.message);
      flash(err.message);
    }
  });
}

const resultsForm = document.getElementById("resultsForm");
const reportEntryForm = document.getElementById("reportEntryForm");
const reportStudentNo = document.getElementById("reportStudentNo");
const reportAcademicYear = document.getElementById("reportAcademicYear");
const reportSemester = document.getElementById("reportSemester");
const reportCourse = document.getElementById("reportCourse");
const reportUnit = document.getElementById("reportUnit");
const reportCa = document.getElementById("reportCa");
const reportExam = document.getElementById("reportExam");
const reportTotal = document.getElementById("reportTotal");
const resultsStudentNo = document.getElementById("resultsStudentNo");
const resultsBody = document.getElementById("resultsBody");
const gpaValue = document.getElementById("gpaValue");
const cgpaValue = document.getElementById("cgpaValue");
const resultsPrev = document.getElementById("resultsPrev");
const resultsNext = document.getElementById("resultsNext");
const resultsPageInfo = document.getElementById("resultsPageInfo");
const resultsStudentField = document.getElementById("resultsStudentField");
const resultsSubmitButton = document.getElementById("resultsSubmitButton");
const resultsSession = getSession();
const isStudentResults =
  Boolean(resultsSession && resultsSession.role === "student" && resultsForm);

if (isStudentResults) {
  document.body.classList.add("student-results-mode");
  if (resultsStudentField) resultsStudentField.hidden = true;
  if (resultsStudentNo) {
    resultsStudentNo.innerHTML = `<option value="${escapeHtml(resultsSession.username)}">${escapeHtml(resultsSession.username)}</option>`;
    resultsStudentNo.value = resultsSession.username;
    resultsStudentNo.removeAttribute("required");
  }
  if (resultsSubmitButton) resultsSubmitButton.textContent = "Apply Filters";
} else if (resultsBody) {
  resultsBody.innerHTML =
    '<tr><td colspan="6" class="empty-state">Select a student and fetch their results.</td></tr>';
}

let resultsPage = 1;
const resultsLimit = 10000;
let lastResultsPayload = null;

const renderResults = (data) => {
  if (!resultsBody) return;
  const rows = Array.isArray(data && data.results) ? data.results : [];
  resultsBody.innerHTML = rows.length
    ? rows
        .map(
          (row) => `
          <tr>
            <td>${escapeHtml(row.course)}</td>
            <td>${escapeHtml(row.unit)}</td>
            <td>${escapeHtml(row.ca)}</td>
            <td>${escapeHtml(row.exam)}</td>
            <td>${escapeHtml(row.total)}</td>
            <td>${escapeHtml(row.grade)}</td>
          </tr>`
        )
        .join("")
    : '<tr><td colspan="6">No saved results found for this student and semester.</td></tr>';

  if (gpaValue) gpaValue.textContent = rows.length && data.gpa != null ? data.gpa : "—";
  if (cgpaValue) cgpaValue.textContent = rows.length && data.cgpa != null ? data.cgpa : "—";

  if (resultsPageInfo && data.meta) {
    resultsPageInfo.textContent = `Page ${data.meta.page} of ${data.meta.pages}`;
  }
};

const fetchResults = async (payload) => {
  if (resultsBody) {
    resultsBody.innerHTML = loadingTableRow(6, "Loading results...");
  }
  if (gpaValue) {
    gpaValue.innerHTML = '<span class="stat-loading" aria-label="Loading GPA"></span>';
  }
  if (cgpaValue) {
    cgpaValue.innerHTML = '<span class="stat-loading" aria-label="Loading CGPA"></span>';
  }
  try {
    const result = await postJson("/api/results/query", payload, "Loading results...");
    renderResults(result.data);
    clearError();
  } catch (err) {
    if (resultsBody) {
      resultsBody.innerHTML =
        '<tr><td colspan="6">Unable to load saved results.</td></tr>';
    }
    if (gpaValue) gpaValue.textContent = "—";
    if (cgpaValue) cgpaValue.textContent = "—";
    showError(err.message);
    flash(err.message);
  }
};

const populateStudentDropdowns = async () => {
  if (!store) return;
  if (isStudentResults) return;
  const students = await store.getStudentsByDepartment("");
  const options =
    '<option value="">Select student</option>' +
    students
      .map(
        (student) =>
          `<option value="${student.studentNo}">${student.studentNo} - ${student.name}</option>`
      )
      .join("");

  if (reportStudentNo) reportStudentNo.innerHTML = options;
  if (resultsStudentNo && !isStudentResults) resultsStudentNo.innerHTML = options;
};

populateStudentDropdowns();

const refreshReportCourseDropdown = async () => {
  if (!store || !reportCourse) return;
  if (isStudentResults) return;

  const studentNo = reportStudentNo ? reportStudentNo.value : "";
  const registered = await store.getRegisteredCourses({ studentNo });

  reportCourse.innerHTML =
    '<option value="">Select registered course</option>' +
    registered
      .map(
        (item) =>
          `<option value="${item.code}" data-unit="${item.unit || ""}">${item.label}</option>`
      )
      .join("");

  if (reportUnit) {
    reportUnit.value = "";
    reportUnit.readOnly = false;
    reportUnit.title = "Enter the course unit.";
  }
};

const syncReportTotal = () => {
  if (!reportTotal) return;
  const ca = Number(reportCa && reportCa.value ? reportCa.value : 0);
  const exam = Number(reportExam && reportExam.value ? reportExam.value : 0);
  reportTotal.value = String(ca + exam);
};

if (reportCourse) {
  reportCourse.addEventListener("change", () => {
    const selected = reportCourse.options[reportCourse.selectedIndex];
    if (reportUnit) {
      const courseUnit = selected ? selected.getAttribute("data-unit") : "";
      reportUnit.value = courseUnit || "";
      reportUnit.readOnly = Boolean(courseUnit);
      reportUnit.title = courseUnit
        ? "This unit is set by the selected course."
        : "Enter the course unit.";
    }
  });
}

if (reportStudentNo) {
  reportStudentNo.addEventListener("change", refreshReportCourseDropdown);
}

if (reportAcademicYear) {
  reportAcademicYear.addEventListener("change", refreshReportCourseDropdown);
}

if (reportSemester) {
  reportSemester.addEventListener("change", refreshReportCourseDropdown);
}

if (reportCa) {
  reportCa.addEventListener("input", syncReportTotal);
}

if (reportExam) {
  reportExam.addEventListener("input", syncReportTotal);
}

refreshReportCourseDropdown();
syncReportTotal();

if (reportEntryForm) {
  reportEntryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(reportEntryForm);

    const payload = {
      studentNo: formData.get("studentNo"),
      academicYear: formData.get("academicYear"),
      semester: formData.get("semester"),
      course: formData.get("course"),
      unit: formData.get("unit"),
      ca: formData.get("ca"),
      exam: formData.get("exam"),
      total: formData.get("total") || undefined,
      grade: formData.get("grade") || undefined,
    };

    try {
      await postJson("/api/results", payload, "Saving result...", { overlay: true });
      clearError();
      flash("Student report saved.");
      reportEntryForm.reset();

      resultsPage = 1;
      lastResultsPayload = {
        studentNo: payload.studentNo,
        academicYear: payload.academicYear,
        semester: payload.semester,
        sort: "course_code",
        order: "asc",
        page: resultsPage,
        limit: resultsLimit,
      };

      await fetchResults(lastResultsPayload);
      await refreshReportCourseDropdown();
      syncReportTotal();
    } catch (err) {
      showError(err.message);
      flash(err.message);
    }
  });
}

if (resultsForm) {
  resultsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(resultsForm);
    resultsPage = 1;
    lastResultsPayload = {
      studentNo: isStudentResults
        ? String(resultsSession.username || "")
        : formData.get("studentNo"),
      academicYear: formData.get("academicYear"),
      semester: formData.get("semester"),
      sort: formData.get("sort") || "course_code",
      order: formData.get("order") || "asc",
      page: resultsPage,
      limit: resultsLimit,
    };
    await fetchResults(lastResultsPayload);
  });

  if (isStudentResults) {
    const formData = new FormData(resultsForm);
    lastResultsPayload = {
      studentNo: String(resultsSession.username || ""),
      academicYear: formData.get("academicYear"),
      semester: formData.get("semester"),
      sort: formData.get("sort") || "course_code",
      order: formData.get("order") || "asc",
      page: 1,
      limit: resultsLimit,
    };
    fetchResults(lastResultsPayload);
  }
}

if (resultsPrev) {
  resultsPrev.addEventListener("click", () => {
    if (!lastResultsPayload || resultsPage <= 1) return;
    resultsPage -= 1;
    lastResultsPayload.page = resultsPage;
    fetchResults(lastResultsPayload);
  });
}

const submissionForm = document.getElementById("submissionForm");
const submissionFile = document.getElementById("submissionFile");
const submissionPreview = document.getElementById("submissionPreview");
const submissionNote = document.getElementById("submissionNote");

if (submissionFile) {
  submissionFile.addEventListener("change", () => {
    const file = submissionFile.files && submissionFile.files[0];
    if (!file) {
      if (submissionForm) submissionForm.dataset.dataUrl = "";
      renderSubmissionPreview(submissionPreview, null, "");
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      flash("Please upload files under 2 MB.");
      submissionFile.value = "";
      if (submissionForm) submissionForm.dataset.dataUrl = "";
      renderSubmissionPreview(submissionPreview, null, "");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (submissionForm) {
        submissionForm.dataset.dataUrl = String(reader.result || "");
      }
      renderSubmissionPreview(submissionPreview, file, String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  });
}

if (submissionForm) {
  submissionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const session = getSession();
    const studentNo = session ? String(session.username || "").trim() : "";
    if (!studentNo) {
      flash("Log in as a student to submit files.");
      return;
    }

    const file = submissionFile && submissionFile.files ? submissionFile.files[0] : null;
    const dataUrl = String(submissionForm.dataset.dataUrl || "");
    if (!file || !dataUrl) {
      flash("Please select a file to submit.");
      return;
    }

    try {
      await withLoading(
        () =>
          store.addSubmission({
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size,
            dataUrl,
            note: submissionNote ? submissionNote.value : "",
          }),
        "Submitting file...",
        { overlay: true }
      );
      clearError();
      if (submissionForm) submissionForm.reset();
      submissionForm.dataset.dataUrl = "";
      renderSubmissionPreview(submissionPreview, null, "");
      await renderStudentSubmissions();
      await renderAdminSubmissions();
      flash("File submitted for admin review.");
    } catch (err) {
      showError(err.message);
      flash(err.message);
    }
  });
}

const submissionTableBody = document.getElementById("submissionTableBody");
const submissionStatusFilter = document.getElementById("submissionStatusFilter");

if (submissionStatusFilter) {
  submissionStatusFilter.addEventListener("change", () => {
    renderAdminSubmissions();
  });
}

if (submissionTableBody) {
  submissionTableBody.addEventListener("click", async (event) => {
    const previewBtn = event.target.closest("[data-submission-preview]");
    const acceptBtn = event.target.closest("[data-submission-accept]");
    const rejectBtn = event.target.closest("[data-submission-reject]");
    if (!store) return;

    const id = previewBtn
      ? previewBtn.getAttribute("data-submission-preview")
      : acceptBtn
      ? acceptBtn.getAttribute("data-submission-accept")
      : rejectBtn
      ? rejectBtn.getAttribute("data-submission-reject")
      : "";
    if (!id) return;

    const submissions = await store.getSubmissions();
    const submission = submissions.find((item) => item.id === id);
    if (!submission) {
      flash("Submission not found.");
      return;
    }

    if (previewBtn) {
      if (!submission.dataUrl) {
        flash("Preview not available for this submission.");
        return;
      }
      window.open(submission.dataUrl, "_blank", "noopener");
      return;
    }

    const session = getSession();
    const reviewer = session ? String(session.username || "Admin") : "Admin";
    if (acceptBtn) {
      const note = window.prompt("Approval note (optional)", "");
      if (note === null) return;
      try {
        await withLoading(
          () => store.reviewSubmission(id, { status: "Accepted", reviewNote: note }),
          "Updating submission...",
          { overlay: true }
        );
        clearError();
        await renderAdminSubmissions();
        await renderStudentSubmissions();
        flash("Submission accepted.");
      } catch (err) {
        showError(err.message);
        flash(err.message);
      }
    }

    if (rejectBtn) {
      const note = window.prompt("Reason for rejection (optional)", "");
      if (note === null) return;
      try {
        await withLoading(
          () =>
            store.reviewSubmission(id, {
              status: "Rejected",
              reviewNote: note
            }),
          "Updating submission...",
          { overlay: true }
        );
        clearError();
        await renderAdminSubmissions();
        await renderStudentSubmissions();
        flash("Submission rejected.");
      } catch (err) {
        showError(err.message);
        flash(err.message);
      }
    }
  });
}

renderSubmissionPreview(submissionPreview, null, "");
renderStudentSubmissions();
renderAdminSubmissions();

if (resultsNext) {
  resultsNext.addEventListener("click", () => {
    if (!lastResultsPayload) return;
    resultsPage += 1;
    lastResultsPayload.page = resultsPage;
    fetchResults(lastResultsPayload);
  });
}

const dashboardStats = document.getElementById("statStudents");
if (dashboardStats) {
  const recentLimit = 6;
  const taskForm = document.getElementById("taskForm");
  const taskInput = document.getElementById("taskInput");
  const taskList = document.getElementById("taskList");

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const renderTaskItems = (tasks) => {
    if (!taskList) return;

    const normalized = (Array.isArray(tasks) ? tasks : [])
      .map((item) => {
        if (typeof item === "string") {
          return { id: "", text: item };
        }
        return {
          id: String(item.id || ""),
          text: String(item.text || "").trim(),
          completed: Boolean(item.completed),
        };
      })
      .filter((item) => item.text);

    taskList.innerHTML = normalized.length
      ? normalized
          .map(
            (item) => `
              <tr class="${item.completed ? "task-row-completed" : ""}">
                <td>
                  <label class="task-complete-control">
                    <input
                      type="checkbox"
                      data-task-toggle="${item.id}"
                      aria-label="${item.completed ? "Mark task as pending" : "Mark task as complete"}"
                      ${item.completed ? "checked" : ""}
                      ${item.id ? "" : "disabled"}
                    />
                  </label>
                </td>
                <td><span class="task-title">${escapeHtml(item.text)}</span></td>
                <td>
                  <span class="status-badge ${item.completed ? "status-accepted" : "status-pending"}">
                    ${item.completed ? "Completed" : "Pending"}
                  </span>
                </td>
                <td class="task-action-cell">
                  <button class="btn btn-outline btn-danger btn-sm" type="button" data-task-delete="${item.id}" ${item.id ? "" : "disabled"}>Delete</button>
                </td>
              </tr>`
          )
          .join("")
      : '<tr><td colspan="4" class="empty-state dashboard-task-empty">No tasks yet. Add one using the form above.</td></tr>';
  };

  const renderDashboard = (data) => {
    const safeNumber = (value) => {
      if (value === null || value === undefined || value === "") return "—";
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric.toLocaleString() : "—";
    };

    const setStat = (id, value) => {
      const node = document.getElementById(id);
      if (!node) return;
      node.textContent = safeNumber(value);
      node.removeAttribute("aria-label");
    };

    setStat("statStudents", data.activeStudents);
    setStat("statDepartments", data.departments);
    setStat("statResults", data.pendingResults);
    setStat("statHolds", data.registrationHolds);

    const recentList = document.getElementById("recentRegistrations");
    if (recentList) {
      recentList.innerHTML = data.recentRegistrations.length
        ? data.recentRegistrations
            .map((item, index) => {
              const label = typeof item === "string"
                ? item
                : `${item.studentNo} - ${(item.courses && item.courses[0]) || "No course selected"}`;
              const parts = label.split(" - ");
              const studentNo = parts.shift() || "Unknown student";
              const course = parts.join(" - ") || "No course selected";
              return `
                <li class="recent-registration-item">
                  <span class="recent-registration-number">${String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <strong>${escapeHtml(studentNo)}</strong>
                    <small>${escapeHtml(course)}</small>
                  </span>
                  <span class="status-badge status-accepted">Registered</span>
                </li>`;
            })
            .join("")
        : '<li class="empty-state recent-registration-empty">No recent registrations yet.</li>';
    }
    renderTaskItems(data.tasks);
  };

  const fetchDashboard = async () => {
    const recentList = document.getElementById("recentRegistrations");
    ["statStudents", "statDepartments", "statResults", "statHolds"].forEach((id) => {
      const node = document.getElementById(id);
      if (!node) return;
      node.setAttribute("aria-label", "Loading statistic");
      node.innerHTML = '<span class="stat-loading" aria-hidden="true"></span>';
    });
    if (recentList) {
      recentList.innerHTML = loadingListItem("Loading registrations...");
    }
    if (taskList) {
      taskList.innerHTML = loadingTableRow(4, "Loading tasks...");
    }
    try {
      const data = await withLoading(
        () =>
          store.getDashboardData({
            page: 1,
            limit: recentLimit,
          }),
        "Loading dashboard..."
      );
      renderDashboard(data);
      clearError();
    } catch (err) {
      ["statStudents", "statDepartments", "statResults", "statHolds"].forEach((id) => {
        const node = document.getElementById(id);
        if (!node) return;
        node.textContent = "—";
        node.setAttribute("aria-label", "Statistic unavailable");
      });
      showError(err.message || "Dashboard unavailable.");
      flash(err.message || "Dashboard unavailable.");
      if (taskList) {
        taskList.innerHTML =
          '<tr><td colspan="4" class="empty-state dashboard-task-empty">Unable to load tasks.</td></tr>';
      }
    }
  };

  fetchDashboard();

  if (taskForm && taskInput) {
    taskForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await withLoading(() => store.addTask({ text: taskInput.value }), "Adding task...", {
          overlay: true,
        });
        taskForm.reset();
        await fetchDashboard();
        flash("Task added.");
      } catch (error) {
        showError(error.message);
        flash(error.message);
      }
    });
  }

  if (taskList) {
    taskList.addEventListener("change", async (event) => {
      const toggleInput = event.target.closest("[data-task-toggle]");
      if (!toggleInput || !store) return;

      const taskId = toggleInput.getAttribute("data-task-toggle");
      if (!taskId) return;

      try {
        await withLoading(() => store.toggleTask(taskId), "Updating task...", {
          overlay: true,
        });
        await fetchDashboard();
      } catch (error) {
        showError(error.message);
        flash(error.message);
      }
    });

    taskList.addEventListener("click", async (event) => {
      const deleteBtn = event.target.closest("[data-task-delete]");
      if (!deleteBtn || !store) return;

      const taskId = deleteBtn.getAttribute("data-task-delete");
      if (!taskId) return;

      if (!window.confirm("Delete this task?")) return;

      try {
        await withLoading(() => store.deleteTask(taskId), "Deleting task...", {
          overlay: true,
        });
        await fetchDashboard();
        flash("Task deleted.");
      } catch (error) {
        showError(error.message);
        flash(error.message);
      }
    });
  }

}

const allRegistrationsBody = document.getElementById("allRegistrationsBody");
if (allRegistrationsBody && store) {
  const filterForm = document.getElementById("allRegistrationsFilter");
  const studentInput = document.getElementById("allRegistrationStudent");
  const courseInput = document.getElementById("allRegistrationCourse");
  const clearButton = document.getElementById("clearRegistrationFilters");
  const previousButton = document.getElementById("allRegistrationsPrev");
  const nextButton = document.getElementById("allRegistrationsNext");
  const pageInfo = document.getElementById("allRegistrationsPageInfo");
  const recordCount = document.getElementById("registrationRecordCount");
  let currentPage = 1;
  let totalPages = 1;

  const formatRegistrationDate = (value) => {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderRegistrations = (payload) => {
    const rows = Array.isArray(payload.registrations) ? payload.registrations : [];
    const meta = payload.meta || {};
    currentPage = Number(meta.page || 1);
    totalPages = Number(meta.pages || 1);

    allRegistrationsBody.innerHTML = rows.length
      ? rows
          .map((registration) => {
            const courses = Array.isArray(registration.courses) ? registration.courses : [];
            const studentName = registration.student && registration.student.name
              ? registration.student.name
              : "Student";
            return `
              <tr>
                <td><strong>${escapeHtml(registration.studentNo)}</strong><small class="table-secondary">${escapeHtml(studentName)}</small></td>
                <td>${escapeHtml(registration.regNo)}</td>
                <td>${escapeHtml(registration.academicYear)}</td>
                <td>${escapeHtml(registration.semester)}</td>
                <td><span class="course-count">${courses.length} course${courses.length === 1 ? "" : "s"}</span><small class="table-secondary">${escapeHtml(courses.join(", ") || "No courses")}</small></td>
                <td>${escapeHtml(formatRegistrationDate(registration.createdAt))}</td>
              </tr>`;
          })
          .join("")
      : '<tr><td colspan="6" class="empty-state registrations-empty">No registrations match your search.</td></tr>';

    if (recordCount) {
      const total = Number(meta.total || 0);
      recordCount.textContent = `${total.toLocaleString()} registration${total === 1 ? "" : "s"} found`;
    }
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (previousButton) previousButton.disabled = currentPage <= 1;
    if (nextButton) nextButton.disabled = currentPage >= totalPages;
  };

  const loadRegistrations = async () => {
    allRegistrationsBody.innerHTML =
      '<tr><td colspan="6" class="loading-inline">Loading registrations...</td></tr>';
    try {
      const payload = await store.getRegistrations({
        page: currentPage,
        limit: 10,
        studentNo: studentInput ? studentInput.value.trim() : "",
        courseCode: courseInput ? courseInput.value.trim() : "",
      });
      renderRegistrations(payload);
      clearError();
    } catch (error) {
      allRegistrationsBody.innerHTML =
        '<tr><td colspan="6" class="empty-state registrations-empty">Unable to load registrations.</td></tr>';
      showError(error.message || "Unable to load registrations.");
    }
  };

  if (filterForm) {
    filterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      currentPage = 1;
      loadRegistrations();
    });
  }
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (filterForm) filterForm.reset();
      currentPage = 1;
      loadRegistrations();
    });
  }
  if (previousButton) {
    previousButton.addEventListener("click", () => {
      if (currentPage <= 1) return;
      currentPage -= 1;
      loadRegistrations();
    });
  }
  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (currentPage >= totalPages) return;
      currentPage += 1;
      loadRegistrations();
    });
  }

  loadRegistrations();
}

renderAdminActivity();
renderStudentDashboard();
initAdminSearch();
