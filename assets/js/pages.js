const API_BASE =
  window.__API_BASE__ ||
  (window.location.hostname === "localhost" ? "http://localhost:8080" : "");
const store = window.SMISStore || null;
if (store) {
  store.ensure();
}

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

  const links = [];
  const isAdmin = role === "admin" || role === "super_admin";
  if (isAdmin) {
    links.push(
      { label: "Dashboard", href: "dashboard.html" },
      { label: "Students", href: "students.html" },
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
    .map((item) => `<a href="${item.href}">${item.label}</a>`)
    .join("");

  if (role && role !== "guest") {
    const logout = document.createElement("a");
    logout.href = "#";
    logout.textContent = "Logout";
    logout.setAttribute("data-logout", "true");
    nav.appendChild(logout);
  }

  const current = getPageName();
  nav.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current) {
      link.classList.add("active");
    }
  });
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
    "reports.html"
  ]);
  const studentPages = new Set([
    "student-dashboard.html",
    "registration.html"
  ]);
  const sharedPages = new Set(["results.html"]);

  if (!page || page === "index.html") return;

  if (page === "login.html" && role) {
    const target = role === "admin" || role === "super_admin" ? "dashboard.html" : "student-dashboard.html";
    window.location.href = target;
    return;
  }

  if (!role) {
    if (adminPages.has(page) || studentPages.has(page) || sharedPages.has(page)) {
      window.location.href = "login.html";
    }
    return;
  }

  if ((role === "admin" || role === "super_admin") && studentPages.has(page)) {
    window.location.href = "dashboard.html";
    return;
  }

  if (role === "student" && adminPages.has(page)) {
    window.location.href = "student-dashboard.html";
  }
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

  try {
    const result = await getJson("/api/admin/activity");
    const items = Array.isArray(result.data) ? result.data : [];
    list.innerHTML = items.length
      ? items.map((item) => `<li>${item}</li>`).join("")
      : '<li class="empty-state">No recent activity yet.</li>';
  } catch (_err) {
    list.innerHTML = '<li class="empty-state">No recent activity yet.</li>';
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

const renderSystemStatus = () => {
  const dataMode = document.getElementById("systemDataMode");
  const onlineStatus = document.getElementById("systemOnline");
  const systemTime = document.getElementById("systemTimestamp");

  if (dataMode) {
    dataMode.textContent = "Backend API";
  }
  if (onlineStatus) {
    onlineStatus.textContent = navigator.onLine ? "Online" : "Offline";
  }
  if (systemTime) {
    systemTime.textContent = new Date().toLocaleString();
  }
};

const renderStudentDashboard = async () => {
  const root = document.getElementById("studentDashboard");
  if (!root) return;

  const session = getSession();
  const studentNo = session ? String(session.username || "") : "";

  let payload;
  try {
    const result = await getJson("/api/students/me/dashboard");
    payload = result.data;
  } catch (_err) {
    return;
  }

  const student = payload.student;
  const registrations = payload.registrations || [];
  const results = payload.results || [];

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  setText("studentName", student ? student.name : "Student");
  setText("studentNo", studentNo || "—");
  setText("studentDepartment", student ? student.department : "—");
  setText("studentLevel", student ? student.level : "—");
  setText("studentStatus", student ? student.status : "—");

  setText("registrationCount", String(registrations.length));
  setText("resultsCount", String(results.length));
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

  const registeredCoursesList = document.getElementById("registeredCoursesList");
  if (registeredCoursesList) {
    if (latestRegistration && latestRegistration.courses.length) {
      registeredCoursesList.innerHTML = latestRegistration.courses
        .slice(0, 4)
        .map((course) => `<li>${course}</li>`)
        .join("");
    } else {
      registeredCoursesList.innerHTML = '<li class="empty-state">No courses registered yet.</li>';
    }
  }

  const recentResultsList = document.getElementById("recentResultsList");
  if (recentResultsList) {
    const recent = Array.isArray(payload.latestResults) ? payload.latestResults : [];
    recentResultsList.innerHTML = recent.length
      ? recent.map((row) => `<li>${row.course} · ${row.total} (${row.grade})</li>`).join("")
      : '<li class="empty-state">No results published yet.</li>';
  }

  const trendList = document.getElementById("gpaTrendList");
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
      ? sorted.map((item) => `<li>${item.term} · GPA ${item.gpa}</li>`).join("")
      : '<li class="empty-state">No GPA history yet.</li>';
  }
};

const bootNavigation = () => {
  const session = getSession();
  const role = session ? session.role : "";
  buildNav(role);
  applyRoleVisibility(role);
  applySessionDetails(session);
  applyRouteGuard(role);
  renderAdminActivity();
  renderSystemStatus();
  renderStudentDashboard();
  initAdminSearch();
};

document.addEventListener("click", (event) => {
  const logout = event.target.closest("[data-logout]");
  if (!logout) return;
  event.preventDefault();
  clearSession();
  window.location.href = "login.html";
});

bootNavigation();

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

const getAuthHeaders = () => {
  const session = getSession();
  if (!session || !session.token) return {};
  return { Authorization: `Bearer ${session.token}` };
};

const postJson = async (path, payload) => {
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
};

const getJson = async (path) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { ...getAuthHeaders() },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status === "error") {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

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
  const session = getSession();
  const studentNo = session ? String(session.username || "").trim() : "";
  if (!studentNo) {
    list.innerHTML = '<li class="empty-state">Log in as a student to view submissions.</li>';
    return;
  }

  const rows = await store.getStudentSubmissions();
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

  const selected = filter ? String(filter.value || "all").toLowerCase() : "all";
  const rows = await store.getSubmissions(selected === "all" ? "" : selected);

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
      const result = await postJson("/api/auth/login", {
        username,
        password: formData.get("password"),
      });
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
      if (courses.length) {
        checklist.innerHTML = courses
          .map(
            (course) =>
              `<label><input type="checkbox" data-course="${course.label}" /> ${course.label}</label>`
          )
          .join("");
      }
    });
  }

  if (checklist && selectedCoursesList) {
    checklist.addEventListener("change", () => {
      const selected = Array.from(
        checklist.querySelectorAll("input[type='checkbox']:checked")
      ).map((input) => input.dataset.course);
      selectedCoursesList.innerHTML = selected
        .map((course) => `<li>${course}</li>`)
        .join("");
    });
  }

  registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(registrationForm);
    const courses = Array.from(
      registrationForm.querySelectorAll("input[type='checkbox']:checked")
    ).map((input) => input.dataset.course);

    try {
      const result = await postJson("/api/registrations", {
        studentNo: formData.get("studentNo"),
        regNo: formData.get("regNo"),
        semester: formData.get("semester"),
        academicYear: formData.get("academicYear"),
        courses,
      });
      flash(result.message || "Registration saved.");
    } catch (err) {
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

let resultsPage = 1;
const resultsLimit = 5;
let lastResultsPayload = null;

const renderResults = (data) => {
  if (!resultsBody) return;
  resultsBody.innerHTML = data.results.length
    ? data.results
        .map(
          (row) => `
          <tr>
            <td>${row.course}</td>
            <td>${row.unit}</td>
            <td>${row.ca}</td>
            <td>${row.exam}</td>
            <td>${row.total}</td>
            <td>${row.grade}</td>
          </tr>`
        )
        .join("")
    : '<tr><td colspan="6">No results found.</td></tr>';

  if (gpaValue) gpaValue.textContent = data.gpa;
  if (cgpaValue) cgpaValue.textContent = data.cgpa;

  if (resultsPageInfo && data.meta) {
    resultsPageInfo.textContent = `Page ${data.meta.page} of ${data.meta.pages}`;
  }
};

const fetchResults = async (payload) => {
  try {
    const result = await postJson("/api/results/query", payload);
    renderResults(result.data);
  } catch (err) {
    flash(err.message);
  }
};

const populateStudentDropdowns = async () => {
  if (!store) return;
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
  if (resultsStudentNo) resultsStudentNo.innerHTML = options;
};

populateStudentDropdowns();

const refreshReportCourseDropdown = async () => {
  if (!store || !reportCourse) return;

  const studentNo = reportStudentNo ? reportStudentNo.value : "";
  const academicYear = reportAcademicYear ? reportAcademicYear.value : "";
  const semester = reportSemester ? reportSemester.value : "";
  const registered = await store.getRegisteredCourses({ studentNo, academicYear, semester });

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
      reportUnit.value = selected ? selected.getAttribute("data-unit") || "" : "";
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
      await postJson("/api/results", payload);
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
      studentNo: formData.get("studentNo"),
      academicYear: formData.get("academicYear"),
      semester: formData.get("semester"),
      course_id: formData.get("courseId") || undefined,
      min_total: formData.get("minTotal") || undefined,
      max_total: formData.get("maxTotal") || undefined,
      sort: formData.get("sort") || "course_code",
      order: formData.get("order") || "asc",
      page: resultsPage,
      limit: resultsLimit,
    };
    await fetchResults(lastResultsPayload);
  });
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
      await store.addSubmission({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        dataUrl,
        note: submissionNote ? submissionNote.value : "",
      });
      if (submissionForm) submissionForm.reset();
      submissionForm.dataset.dataUrl = "";
      renderSubmissionPreview(submissionPreview, null, "");
      await renderStudentSubmissions();
      await renderAdminSubmissions();
      flash("File submitted for admin review.");
    } catch (err) {
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
        await store.reviewSubmission(id, { status: "Accepted", reviewNote: note });
        await renderAdminSubmissions();
        await renderStudentSubmissions();
        flash("Submission accepted.");
      } catch (err) {
        flash(err.message);
      }
    }

    if (rejectBtn) {
      const note = window.prompt("Reason for rejection (optional)", "");
      if (note === null) return;
      try {
        await store.reviewSubmission(id, {
          status: "Rejected",
          reviewNote: note
        });
        await renderAdminSubmissions();
        await renderStudentSubmissions();
        flash("Submission rejected.");
      } catch (err) {
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
  let recentPage = 1;
  const recentLimit = 3;
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
              <li>
                <div class="actions" style="justify-content: space-between; width: 100%;">
                  <label class="inline" style="margin: 0;">
                    <input type="checkbox" data-task-toggle="${item.id}" ${item.completed ? "checked" : ""} ${item.id ? "" : "disabled"} />
                    <span style="${item.completed ? "text-decoration: line-through;" : ""}">${escapeHtml(item.text)}</span>
                  </label>
                  <button class="btn btn-outline" type="button" data-task-delete="${item.id}" ${item.id ? "" : "disabled"}>Delete</button>
                </div>
              </li>`
          )
          .join("")
      : "<li>No tasks yet.</li>";
  };

  const renderDashboard = (data) => {
    document.getElementById("statStudents").textContent = data.activeStudents;
    document.getElementById("statDepartments").textContent = data.departments;
    document.getElementById("statResults").textContent = data.pendingResults;
    document.getElementById("statHolds").textContent = data.registrationHolds;

    const recentList = document.getElementById("recentRegistrations");
    const recentPageInfo = document.getElementById("recentPageInfo");
    if (recentList) {
      recentList.innerHTML = data.recentRegistrations.length
        ? data.recentRegistrations.map((item) => `<li>${item}</li>`).join("")
        : "<li>No recent registrations.</li>";
    }
    renderTaskItems(data.tasks);
    if (recentPageInfo) {
      const meta = data.recentMeta || {
        page: recentPage,
        pages: 1,
      };
      recentPageInfo.textContent = `Page ${meta.page} of ${meta.pages}`;
    }
  };

  const fetchDashboard = async () => {
    const recentStudentNo = document.getElementById("recentStudentNo");
    const recentCourseCode = document.getElementById("recentCourseCode");
    try {
      const data = await store.getDashboardData({
        page: recentPage,
        limit: recentLimit,
        studentNo: recentStudentNo ? recentStudentNo.value.trim() : "",
        courseCode: recentCourseCode ? recentCourseCode.value.trim() : "",
      });
      renderDashboard(data);
    } catch (err) {
      flash(err.message || "Dashboard unavailable.");
    }
  };

  fetchDashboard();

  if (taskForm && taskInput) {
    taskForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await store.addTask({ text: taskInput.value });
        taskForm.reset();
        await fetchDashboard();
        flash("Task added.");
      } catch (error) {
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
        await store.toggleTask(taskId);
        await fetchDashboard();
      } catch (error) {
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
        await store.deleteTask(taskId);
        await fetchDashboard();
        flash("Task deleted.");
      } catch (error) {
        flash(error.message);
      }
    });
  }

  const recentPrev = document.getElementById("recentPrev");
  const recentNext = document.getElementById("recentNext");
  const recentFilterBtn = document.getElementById("recentFilterBtn");

  if (recentPrev) {
    recentPrev.addEventListener("click", () => {
      if (recentPage > 1) {
        recentPage -= 1;
        fetchDashboard();
      }
    });
  }

  if (recentNext) {
    recentNext.addEventListener("click", () => {
      recentPage += 1;
      fetchDashboard();
    });
  }

  if (recentFilterBtn) {
    recentFilterBtn.addEventListener("click", () => {
      recentPage = 1;
      fetchDashboard();
    });
  }
}
