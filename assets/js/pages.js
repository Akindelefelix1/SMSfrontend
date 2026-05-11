const API_BASE =
  window.__API_BASE__ ||
  (window.location.hostname === "localhost" ? "http://localhost:8000" : "");
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
  if (role === "admin") {
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
    node.style.display = required === role ? "" : "none";
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
    window.location.href = role === "admin" ? "dashboard.html" : "student-dashboard.html";
    return;
  }

  if (!role) {
    if (adminPages.has(page) || studentPages.has(page) || sharedPages.has(page)) {
      window.location.href = "login.html";
    }
    return;
  }

  if (role === "admin" && studentPages.has(page)) {
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

const renderAdminActivity = () => {
  const list = document.getElementById("adminActivityList");
  if (!list || !store) return;

  const data = store.getAll();
  const items = [];
  const latestStudent = data.students[data.students.length - 1];
  if (latestStudent) {
    items.push(`Student added: ${latestStudent.name} (${latestStudent.studentNo})`);
  }

  const latestUser = data.users[data.users.length - 1];
  if (latestUser) {
    items.push(`User added: ${latestUser.name} (${latestUser.role})`);
  }

  const latestCourse = data.courses[data.courses.length - 1];
  if (latestCourse) {
    items.push(`Course added: ${latestCourse.code} (${latestCourse.title})`);
  }
  const latestRegistration = data.registrations[0];
  if (latestRegistration) {
    const studentName = store.withStudentName(latestRegistration.studentNo, data.students);
    items.push(
      `New registration: ${studentName} (${latestRegistration.studentNo})`
    );
  }

  const latestResult = data.results[data.results.length - 1];
  if (latestResult) {
    const studentName = store.withStudentName(latestResult.studentNo, data.students);
    items.push(`Result added: ${latestResult.course} for ${studentName}`);
  }

  const recentTask = Array.isArray(data.tasks) ? data.tasks[0] : null;
  if (recentTask && recentTask.text) {
    items.push(`Task created: ${recentTask.text}`);
  }

  list.innerHTML = items.length
    ? items.map((item) => `<li>${item}</li>`).join("")
    : '<li class="empty-state">No recent activity yet.</li>';
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
    dataMode.textContent = store ? "Local Offline" : "Backend";
  }
  if (onlineStatus) {
    onlineStatus.textContent = navigator.onLine ? "Online" : "Offline";
  }
  if (systemTime) {
    systemTime.textContent = new Date().toLocaleString();
  }
};

const renderStudentDashboard = () => {
  const root = document.getElementById("studentDashboard");
  if (!root || !store) return;

  const session = getSession();
  const studentNo = session ? String(session.username || "") : "";
  const data = store.getAll();
  const student = data.students.find((item) => item.studentNo === studentNo);

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  setText("studentName", student ? student.name : "Student");
  setText("studentNo", studentNo || "—");
  setText("studentDepartment", student ? student.department : "—");
  setText("studentLevel", student ? student.level : "—");
  setText("studentStatus", student ? student.status : "—");

  const registrations = data.registrations.filter((item) => item.studentNo === studentNo);
  const results = data.results.filter((item) => item.studentNo === studentNo);
  setText("registrationCount", String(registrations.length));
  setText("resultsCount", String(results.length));
  setText("studentGpa", computeGpa(results));
  setText("studentCgpa", computeGpa(results));

  const latestRegistration = registrations[0];
  if (latestRegistration) {
    const courseCodes = latestRegistration.courses.map((course) => String(course).split(" - ")[0]);
    const totalUnits = courseCodes.reduce((total, code) => {
      const match = data.courses.find((course) => course.code === code);
      return total + (match ? Number(match.units) : 0);
    }, 0);
    setText("registeredUnits", String(totalUnits));

    const semesterResults = results.filter(
      (row) =>
        row.academicYear === latestRegistration.academicYear &&
        row.semester === latestRegistration.semester
    );
    const pending = Math.max(0, courseCodes.length - semesterResults.length);
    setText("pendingResults", String(pending));
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
    if (results.length) {
      const recent = results.slice(-3).reverse();
      recentResultsList.innerHTML = recent
        .map((row) => `<li>${row.course} · ${row.total} (${row.grade})</li>`)
        .join("");
    } else {
      recentResultsList.innerHTML = '<li class="empty-state">No results published yet.</li>';
    }
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

const postJson = async (path, payload) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

const postJsonWithFallback = async (path, payload, fallbackFn, fallbackMessage) => {
  try {
    return await postJson(path, payload);
  } catch (err) {
    if (!store || !fallbackFn) {
      throw err;
    }
    const data = fallbackFn(payload);
    return {
      message: fallbackMessage,
      data,
    };
  }
};

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const username = String(formData.get("username") || "").trim();
    const role = resolveRole(username);
    if (!role) {
      flash("Use an admin* username or a student number to continue.");
      return;
    }
    try {
      const result = await postJson("/api/login.php", {
        username,
        password: formData.get("password"),
      });
      flash(result.message);
    } catch (err) {
      if (store) {
        flash("Backend unavailable. Login allowed in local testing mode.");
      } else {
        flash(err.message);
      }
    }

    setSession({ username, role, lastLogin: new Date().toISOString() });
    window.location.href = role === "admin" ? "dashboard.html" : "student-dashboard.html";
  });
}

const registrationForm = document.getElementById("registrationForm");
const selectedCoursesList = document.getElementById("selectedCourses");
if (registrationForm) {
  const checklist = document.getElementById("courseChecklist");
  const registrationDepartment = document.getElementById("registrationDepartment");
  const registrationStudentNo = document.getElementById("registrationStudentNo");

  const populateRegistrationStudents = () => {
    if (!registrationDepartment || !registrationStudentNo || !store) return;
    const selectedDepartment = registrationDepartment.value;
    const students = selectedDepartment
      ? store.getStudentsByDepartment(selectedDepartment)
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
    const departments = store.getDepartments();
    registrationDepartment.innerHTML =
      '<option value="">Select department</option>' +
      departments
        .map((department) => `<option value="${department.name}">${department.name}</option>`)
        .join("");
    registrationDepartment.addEventListener("change", populateRegistrationStudents);
    populateRegistrationStudents();
  }

  if (checklist && store) {
    const localCourses = store.getCourseOptions();
    if (localCourses.length) {
      checklist.innerHTML = localCourses
        .map(
          (course) =>
            `<label><input type="checkbox" data-course="${course.label}" /> ${course.label}</label>`
        )
        .join("");
    }
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
      const result = await postJsonWithFallback(
        "/api/registration.php",
        {
          studentNo: formData.get("studentNo"),
          regNo: formData.get("regNo"),
          semester: formData.get("semester"),
          academicYear: formData.get("academicYear"),
          courses,
        },
        (payload) => store.addRegistration(payload),
        "Registration saved locally (offline mode)."
      );
      flash(result.message);
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
    const result = await postJson("/api/results.php", payload);
    renderResults(result.data);
    flash(result.message);
  } catch (err) {
    if (store) {
      const localData = store.queryResults(payload);
      renderResults(localData);
      flash("Showing local offline results.");
    } else {
      flash(err.message);
    }
  }
};

const populateStudentDropdowns = () => {
  if (!store) return;
  const allData = store.getAll();
  const students = Array.isArray(allData.students) ? allData.students : [];
  const options =
    '<option value="">Select student</option>' +
    students
      .map(
        (student) =>
          `<option value="${student.studentNo}">${student.studentNo} - ${student.name}</option>`
      )
      .join("");

  if (reportStudentNo) {
    reportStudentNo.innerHTML = options;
  }

  if (resultsStudentNo) {
    resultsStudentNo.innerHTML = options;
  }
};

populateStudentDropdowns();

const refreshReportCourseDropdown = () => {
  if (!store || !reportCourse) return;

  const studentNo = reportStudentNo ? reportStudentNo.value : "";
  const academicYear = reportAcademicYear ? reportAcademicYear.value : "";
  const semester = reportSemester ? reportSemester.value : "";
  const registered = store.getRegisteredCourses({ studentNo, academicYear, semester });

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
      await postJsonWithFallback(
        "/api/results-create.php",
        payload,
        (localPayload) => store.addResult(localPayload),
        "Student report saved locally."
      );

      flash("Student report saved locally.");
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
      refreshReportCourseDropdown();
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
  let usingLocalData = false;
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
    const params = new URLSearchParams({
      recent_page: recentPage,
      recent_limit: recentLimit,
    });
    if (recentStudentNo && recentStudentNo.value.trim() !== "") {
      params.set("recent_student_no", recentStudentNo.value.trim());
    }
    if (recentCourseCode && recentCourseCode.value.trim() !== "") {
      params.set("recent_course_code", recentCourseCode.value.trim());
    }

    try {
      const res = await fetch(`${API_BASE}/api/dashboard.php?${params.toString()}`);
      const result = await res.json();
      if (result.status !== "ok") {
        throw new Error("Invalid dashboard response");
      }
      renderDashboard(result.data);
    } catch (_err) {
      if (!store) {
        flash("Dashboard data unavailable (backend not running).");
        return;
      }

      const localData = store.getDashboardData({
        page: recentPage,
        limit: recentLimit,
        studentNo: recentStudentNo ? recentStudentNo.value.trim() : "",
        courseCode: recentCourseCode ? recentCourseCode.value.trim() : "",
      });
      renderDashboard(localData);
      if (!usingLocalData) {
        usingLocalData = true;
        flash("Dashboard switched to local offline data.");
      }
    }
  };

  fetchDashboard();

  if (taskForm && taskInput) {
    taskForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!store) {
        flash("Task storage unavailable.");
        return;
      }

      try {
        store.addTask({ text: taskInput.value });
        taskForm.reset();
        const localData = store.getDashboardData({
          page: recentPage,
          limit: recentLimit,
          studentNo: document.getElementById("recentStudentNo")?.value.trim() || "",
          courseCode: document.getElementById("recentCourseCode")?.value.trim() || "",
        });
        renderDashboard(localData);
        usingLocalData = true;
        flash("Task added.");
      } catch (error) {
        flash(error.message);
      }
    });
  }

  if (taskList) {
    taskList.addEventListener("change", (event) => {
      const toggleInput = event.target.closest("[data-task-toggle]");
      if (!toggleInput || !store) return;

      const taskId = toggleInput.getAttribute("data-task-toggle");
      if (!taskId) return;

      try {
        store.toggleTask(taskId);
        const localData = store.getDashboardData({
          page: recentPage,
          limit: recentLimit,
          studentNo: document.getElementById("recentStudentNo")?.value.trim() || "",
          courseCode: document.getElementById("recentCourseCode")?.value.trim() || "",
        });
        renderDashboard(localData);
      } catch (error) {
        flash(error.message);
      }
    });

    taskList.addEventListener("click", (event) => {
      const deleteBtn = event.target.closest("[data-task-delete]");
      if (!deleteBtn || !store) return;

      const taskId = deleteBtn.getAttribute("data-task-delete");
      if (!taskId) return;

      if (!window.confirm("Delete this task?")) return;

      try {
        store.deleteTask(taskId);
        const localData = store.getDashboardData({
          page: recentPage,
          limit: recentLimit,
          studentNo: document.getElementById("recentStudentNo")?.value.trim() || "",
          courseCode: document.getElementById("recentCourseCode")?.value.trim() || "",
        });
        renderDashboard(localData);
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
