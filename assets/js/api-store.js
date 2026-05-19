(() => {
  const API_BASE =
    window.__API_BASE__ ||
    (window.location.hostname === "localhost" ? "http://localhost:8080" : "");
  const SESSION_KEY = "sms_session_v1";

  const loading = (() => {
    if (window.SMISLoading) return window.SMISLoading;

    let count = 0;
    let overlay = null;

    const ensureOverlay = () => {
      if (overlay) return overlay;
      if (!document.body) return null;

      overlay = document.createElement("div");
      overlay.id = "globalLoading";
      overlay.className = "loading-overlay";
      overlay.innerHTML = `
        <div class="loading-card" role="status" aria-live="polite">
          <div class="loading-spinner" aria-hidden="true"></div>
          <div class="loading-text">Loading...</div>
        </div>
      `;
      document.body.appendChild(overlay);
      return overlay;
    };

    const setVisible = (visible, label) => {
      const node = ensureOverlay();
      if (!node) return;
      const textNode = node.querySelector(".loading-text");
      if (label && textNode) textNode.textContent = label;
      if (!label && visible && textNode && !node.classList.contains("show")) {
        textNode.textContent = "Loading...";
      }
      node.classList.toggle("show", visible);
      document.body.classList.toggle("is-loading", visible);
    };

    const start = (label) => {
      count += 1;
      setVisible(true, label || "Loading...");
    };

    const stop = () => {
      count = Math.max(0, count - 1);
      if (!count) setVisible(false);
    };

    const api = { start, stop };
    window.SMISLoading = api;
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", () => ensureOverlay(), { once: true });
    } else {
      ensureOverlay();
    }
    return api;
  })();

  const getSession = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_err) {
      return null;
    }
  };

  const getAuthHeaders = () => {
    const session = getSession();
    if (!session || !session.token) return {};
    return { Authorization: `Bearer ${session.token}` };
  };

  const request = async (path, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      ...getAuthHeaders(),
    };

    if (loading) loading.start();
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status === "error") {
        throw new Error(data.message || "Request failed");
      }
      return data;
    } finally {
      if (loading) loading.stop();
    }
  };

  const getJson = (path) => request(path);
  const postJson = (path, payload) =>
    request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
  const putJson = (path, payload) =>
    request(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
  const deleteJson = (path) =>
    request(path, {
      method: "DELETE",
    });

  let cachedAll = null;
  let cachedAt = 0;

  const setCache = (data) => {
    cachedAll = data;
    cachedAt = Date.now();
    return data;
  };

  const ensure = async () => {
    return true;
  };

  const getAll = async () => {
    const result = await getJson("/api/admin/overview");
    return setCache(result.data);
  };

  const getDepartments = async () => (await getJson("/api/departments")).data;
  const addDepartment = async (payload) => (await postJson("/api/departments", payload)).data;
  const updateDepartment = async (id, payload) =>
    (await putJson(`/api/departments/${id}`, payload)).data;
  const deleteDepartment = async (id) => (await deleteJson(`/api/departments/${id}`)).data;

  const addUser = async (payload) => (await postJson("/api/users", payload)).data;
  const updateUser = async (id, payload) => (await putJson(`/api/users/${id}`, payload)).data;
  const deleteUser = async (id) => (await deleteJson(`/api/users/${id}`)).data;

  const addStudent = async (payload) => (await postJson("/api/students", payload)).data;
  const updateStudent = async (id, payload) =>
    (await putJson(`/api/students/${id}`, payload)).data;
  const deleteStudent = async (id) => (await deleteJson(`/api/students/${id}`)).data;

  const addCourse = async (payload) => (await postJson("/api/courses", payload)).data;
  const updateCourse = async (id, payload) => (await putJson(`/api/courses/${id}`, payload)).data;
  const deleteCourse = async (id) => (await deleteJson(`/api/courses/${id}`)).data;

  const addRegistration = async (payload) => (await postJson("/api/registrations", payload)).data;

  const addResult = async (payload) => (await postJson("/api/results", payload)).data;

  const addSubmission = async (payload) => (await postJson("/api/submissions", payload)).data;
  const reviewSubmission = async (id, payload) =>
    (await putJson(`/api/submissions/${id}/review`, payload)).data;

  const getSubmissions = async (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return (await getJson(`/api/submissions${query}`)).data;
  };

  const getStudentSubmissions = async () => (await getJson("/api/submissions/me")).data;

  const addTask = async (payload) => (await postJson("/api/tasks", payload)).data;
  const toggleTask = async (id) => (await putJson(`/api/tasks/${id}/toggle`, {})).data;
  const deleteTask = async (id) => (await deleteJson(`/api/tasks/${id}`)).data;

  const getDashboardData = async (payload = {}) => {
    const params = new URLSearchParams({
      recent_page: payload.page || 1,
      recent_limit: payload.limit || 3,
    });
    if (payload.studentNo) params.set("recent_student_no", payload.studentNo);
    if (payload.courseCode) params.set("recent_course_code", payload.courseCode);
    const result = await getJson(`/api/admin/dashboard?${params.toString()}`);
    return result.data;
  };

  const queryResults = async (payload = {}) =>
    (await postJson("/api/results/query", payload)).data;

  const getCourseOptions = async () => (await getJson("/api/courses/options")).data;

  const getRegisteredCourses = async (payload = {}) => {
    const params = new URLSearchParams({
      studentNo: payload.studentNo || "",
      academicYear: payload.academicYear || "",
      semester: payload.semester || "",
    });
    const result = await getJson(`/api/registered-courses?${params.toString()}`);
    return result.data;
  };

  const getStudentsByDepartment = async (departmentName) => {
    const params = departmentName
      ? `?department=${encodeURIComponent(departmentName)}`
      : "";
    return (await getJson(`/api/students${params}`)).data;
  };

  const exportData = async () => (await postJson("/api/admin/export", {})).data;

  const importData = async (rawText) => {
    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch (_err) {
      throw new Error("Invalid JSON file");
    }
    return (await postJson("/api/admin/import", payload)).data;
  };

  const resetData = async () => (await postJson("/api/admin/reset", {})).data;

  const withStudentName = (studentNo, students) => {
    const list = Array.isArray(students)
      ? students
      : cachedAll && Array.isArray(cachedAll.students)
      ? cachedAll.students
      : [];
    const student = list.find((item) => item.studentNo === studentNo);
    return student ? student.name : "Unknown Student";
  };

  window.SMISStore = {
    ensure,
    getAll,
    getDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    exportData,
    importData,
    resetData,
    addUser,
    updateUser,
    deleteUser,
    addStudent,
    updateStudent,
    deleteStudent,
    addCourse,
    updateCourse,
    deleteCourse,
    addRegistration,
    addResult,
    addSubmission,
    reviewSubmission,
    getSubmissions,
    getStudentSubmissions,
    addTask,
    toggleTask,
    deleteTask,
    getDashboardData,
    queryResults,
    getCourseOptions,
    getRegisteredCourses,
    getStudentsByDepartment,
    withStudentName,
  };
})();
