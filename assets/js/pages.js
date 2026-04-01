const API_BASE =
  window.__API_BASE__ ||
  (window.location.hostname === "localhost" ? "http://localhost:8000" : "");
const store = window.SMISStore || null;
if (store) {
  store.ensure();
}

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
    try {
      const result = await postJson("/api/login.php", {
        username: formData.get("username"),
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
  });
}

const registrationForm = document.getElementById("registrationForm");
const selectedCoursesList = document.getElementById("selectedCourses");
if (registrationForm) {
  const checklist = document.getElementById("courseChecklist");
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

  const renderDashboard = (data) => {
    document.getElementById("statStudents").textContent = data.activeStudents;
    document.getElementById("statDepartments").textContent = data.departments;
    document.getElementById("statResults").textContent = data.pendingResults;
    document.getElementById("statHolds").textContent = data.registrationHolds;

    const recentList = document.getElementById("recentRegistrations");
    const taskList = document.getElementById("taskList");
    const recentPageInfo = document.getElementById("recentPageInfo");
    if (recentList) {
      recentList.innerHTML = data.recentRegistrations.length
        ? data.recentRegistrations.map((item) => `<li>${item}</li>`).join("")
        : "<li>No recent registrations.</li>";
    }
    if (taskList) {
      taskList.innerHTML = data.tasks.map((item) => `<li>${item}</li>`).join("");
    }
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
