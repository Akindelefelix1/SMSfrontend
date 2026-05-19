const localFlash = (message) => {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2200);
};

const store = window.SMISStore;
if (store) {
  (async () => {
    await store.ensure();

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const loadingRow = (colSpan, label) =>
    `<tr><td colspan="${colSpan}" class="muted">${label || "Loading..."}</td></tr>`;

  const initSectionTabs = () => {
    const buttons = Array.from(document.querySelectorAll("[data-section-tab]"));
    const sections = Array.from(document.querySelectorAll("[data-section-panel]"));
    if (!buttons.length || !sections.length) return;

    const activate = (id) => {
      sections.forEach((section) => {
        const match = section.getAttribute("data-section-panel") === id;
        section.classList.toggle("active", match);
      });
      buttons.forEach((button) => {
        const match = button.getAttribute("data-section-tab") === id;
        button.classList.toggle("active", match);
      });
      if (id) {
        history.replaceState(null, "", `#${id}`);
      }
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.getAttribute("data-section-tab");
        if (!target) return;
        activate(target);
      });
    });

    const initial =
      (window.location.hash || "").replace("#", "") ||
      buttons[0].getAttribute("data-section-tab");
    if (initial) activate(initial);
  };

  const studentFilterInput = document.getElementById("studentFilterInput");
  const studentFilterClear = document.getElementById("studentFilterClear");
  const getStudentFilter = () =>
    String(studentFilterInput ? studentFilterInput.value : "").trim().toLowerCase();

  if (studentFilterInput) {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("student");
    if (fromQuery) {
      studentFilterInput.value = fromQuery;
    }
  }

  const renderUsers = async () => {
    const usersBody = document.getElementById("usersBody");
    if (!usersBody) return;
    usersBody.innerHTML = loadingRow(5, "Loading users...");
    const data = await store.getAll();
    if (!data.users.length) {
      usersBody.innerHTML = '<tr><td colspan="5" class="muted">No users added yet.</td></tr>';
      return;
    }
    usersBody.innerHTML = data.users
      .map(
        (user) => `
          <tr>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.role)}</td>
            <td>${escapeHtml(user.status)}</td>
            <td>${escapeHtml(user.email || "-")}</td>
            <td>
              <div class="actions">
                <button class="btn btn-outline" type="button" data-user-edit="${user.id}">Edit</button>
                <button class="btn btn-outline" type="button" data-user-delete="${user.id}">Delete</button>
              </div>
            </td>
          </tr>`
      )
      .join("");
  };

  const renderStudents = async () => {
    const studentsBody = document.getElementById("studentsBody");
    if (!studentsBody) return;
    studentsBody.innerHTML = loadingRow(6, "Loading students...");
    const data = await store.getAll();
    const filter = getStudentFilter();
    const rows = data.students.filter((student) => {
      if (!filter) return true;
      return (
        String(student.studentNo).toLowerCase().includes(filter) ||
        String(student.name).toLowerCase().includes(filter)
      );
    });
    studentsBody.innerHTML = rows
      .map(
        (student) => `
          <tr>
            <td>${escapeHtml(student.studentNo)}</td>
            <td>${escapeHtml(student.name)}</td>
            <td>${escapeHtml(student.department)}</td>
            <td>${escapeHtml(student.level)}</td>
            <td>${escapeHtml(student.status)}</td>
            <td>
              <div class="actions">
                <button class="btn btn-outline" type="button" data-student-edit="${student.id}">Edit</button>
                <button class="btn btn-outline" type="button" data-student-delete="${student.id}">Delete</button>
              </div>
            </td>
          </tr>`
      )
      .join("");

    if (!rows.length) {
      studentsBody.innerHTML = data.students.length
        ? '<tr><td colspan="6" class="muted">No matching students found.</td></tr>'
        : '<tr><td colspan="6" class="muted">No students added yet.</td></tr>';
    }
  };

  const renderCourses = async () => {
    const coursesBody = document.getElementById("coursesBody");
    if (!coursesBody) return;
    coursesBody.innerHTML = loadingRow(5, "Loading courses...");
    const data = await store.getAll();
    if (!data.courses.length) {
      coursesBody.innerHTML = '<tr><td colspan="5" class="muted">No courses added yet.</td></tr>';
      return;
    }
    coursesBody.innerHTML = data.courses
      .map(
        (course) => `
          <tr>
            <td>${escapeHtml(course.code)}</td>
            <td>${escapeHtml(course.title)}</td>
            <td>${escapeHtml(course.units)}</td>
            <td>${escapeHtml(course.semester)}</td>
            <td>
              <div class="actions">
                <button class="btn btn-outline" type="button" data-course-edit="${course.id}">Edit</button>
                <button class="btn btn-outline" type="button" data-course-delete="${course.id}">Delete</button>
              </div>
            </td>
          </tr>`
      )
      .join("");
  };

  const renderDepartments = async () => {
    const departmentsBody = document.getElementById("departmentsBody");
    if (!departmentsBody) return;
    departmentsBody.innerHTML = loadingRow(2, "Loading departments...");
    try {
      const departments = await store.getDepartments();
      if (!departments.length) {
        departmentsBody.innerHTML =
          '<tr><td colspan="2" class="muted">No departments added yet.</td></tr>';
        return;
      }
      departmentsBody.innerHTML = departments
        .map(
          (department) => `
            <tr>
              <td>${escapeHtml(department.name)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-outline" type="button" data-department-edit="${department.id}">Edit</button>
                  <button class="btn btn-outline" type="button" data-department-delete="${department.id}">Delete</button>
                </div>
              </td>
            </tr>`
        )
        .join("");
    } catch (error) {
      departmentsBody.innerHTML =
        '<tr><td colspan="2" class="muted">Unable to load departments.</td></tr>';
      localFlash(error.message);
    }
  };

  const populateDepartmentSelects = async () => {
    const selects = document.querySelectorAll("select.department-select");
    if (!selects.length) return;
    const departments = await store.getDepartments();
    selects.forEach((select) => {
      const current = select.value;
      select.innerHTML =
        '<option value="">Select department</option>' +
        departments
          .map((department) => `<option value="${department.name}">${department.name}</option>`)
          .join("");
      if (current && departments.some((department) => department.name === current)) {
        select.value = current;
      }
    });
  };

  const refreshAllTables = async () => {
    await renderUsers();
    await renderStudents();
    await renderCourses();
    await renderDepartments();
    await populateDepartmentSelects();
  };

  if (studentFilterInput) {
    studentFilterInput.addEventListener("input", () => {
      renderStudents();
    });
  }

  if (studentFilterClear) {
    studentFilterClear.addEventListener("click", () => {
      if (studentFilterInput) studentFilterInput.value = "";
      renderStudents();
    });
  }

  const userForm = document.getElementById("userForm");
  if (userForm) {
    userForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(userForm);
      try {
        const suggestedUsername = formData.get("email") || formData.get("name");
        const username = window.prompt("Username", suggestedUsername || "");
        if (username === null) return;
        const password = window.prompt("Temporary password");
        if (password === null || !String(password).trim()) {
          localFlash("Password is required.");
          return;
        }
        await store.addUser({
          name: formData.get("name"),
          role: formData.get("role"),
          status: formData.get("status"),
          email: formData.get("email"),
          username: String(username).trim(),
          password: String(password).trim()
        });
        userForm.reset();
        await renderUsers();
        localFlash("User added.");
      } catch (error) {
        localFlash(error.message);
      }
    });
  }

  const studentForm = document.getElementById("studentForm");
  if (studentForm) {
    studentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(studentForm);
      try {
        await store.addStudent({
          studentNo: formData.get("studentNo"),
          name: formData.get("name"),
          department: formData.get("department"),
          level: formData.get("level"),
          status: formData.get("status")
        });
        studentForm.reset();
        await refreshAllTables();
        localFlash("Student added.");
      } catch (error) {
        localFlash(error.message);
      }
    });
  }

  const departmentForm = document.getElementById("departmentForm");
  if (departmentForm) {
    departmentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(departmentForm);
      try {
        await store.addDepartment({ name: formData.get("name") });
        departmentForm.reset();
        await refreshAllTables();
        localFlash("Department added.");
      } catch (error) {
        localFlash(error.message);
      }
    });
  }

  const courseForm = document.getElementById("courseForm");
  if (courseForm) {
    courseForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(courseForm);
      try {
        await store.addCourse({
          code: formData.get("code"),
          title: formData.get("title"),
          units: formData.get("units"),
          semester: formData.get("semester")
        });
        courseForm.reset();
        await renderCourses();
        localFlash("Course added.");
      } catch (error) {
        localFlash(error.message);
      }
    });
  }

  const usersBody = document.getElementById("usersBody");
  if (usersBody) {
    usersBody.addEventListener("click", async (event) => {
      const editBtn = event.target.closest("[data-user-edit]");
      const deleteBtn = event.target.closest("[data-user-delete]");
      const data = await store.getAll();

      if (editBtn) {
        const userId = editBtn.getAttribute("data-user-edit");
        const user = data.users.find((item) => item.id === userId);
        if (!user) {
          localFlash("User not found.");
          return;
        }

        const name = window.prompt("User name", user.name);
        if (name === null) return;
        const role = window.prompt("Role", user.role);
        if (role === null) return;
        const status = window.prompt("Status", user.status);
        if (status === null) return;
        const email = window.prompt("Email", user.email || "");
        if (email === null) return;

        try {
          await store.updateUser(userId, { name, role, status, email, username: user.username });
          await refreshAllTables();
          localFlash("User updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const userId = deleteBtn.getAttribute("data-user-delete");
        if (!window.confirm("Delete this user?")) return;
        try {
          await store.deleteUser(userId);
          await refreshAllTables();
          localFlash("User deleted.");
        } catch (error) {
          localFlash(error.message);
        }
      }
    });
  }

  const studentsBody = document.getElementById("studentsBody");
  if (studentsBody) {
    studentsBody.addEventListener("click", async (event) => {
      const editBtn = event.target.closest("[data-student-edit]");
      const deleteBtn = event.target.closest("[data-student-delete]");
      const data = await store.getAll();
      const departmentNames = (await store.getDepartments()).map((department) => department.name);

      if (editBtn) {
        const studentId = editBtn.getAttribute("data-student-edit");
        const student = data.students.find((item) => item.id === studentId);
        if (!student) {
          localFlash("Student not found.");
          return;
        }

        const studentNo = window.prompt("Student No", student.studentNo);
        if (studentNo === null) return;
        const name = window.prompt("Name", student.name);
        if (name === null) return;
        const department = window.prompt(
          `Department (${departmentNames.join(", ")})`,
          student.department
        );
        if (department === null) return;
        const level = window.prompt("Level", student.level);
        if (level === null) return;
        const status = window.prompt("Status", student.status);
        if (status === null) return;

        try {
          await store.updateStudent(studentId, { studentNo, name, department, level, status });
          await refreshAllTables();
          localFlash("Student updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const studentId = deleteBtn.getAttribute("data-student-delete");
        if (!window.confirm("Delete this student and related records?")) return;
        try {
          await store.deleteStudent(studentId);
          await refreshAllTables();
          localFlash("Student deleted.");
        } catch (error) {
          localFlash(error.message);
        }
      }
    });
  }

  const departmentsBody = document.getElementById("departmentsBody");
  if (departmentsBody) {
    departmentsBody.addEventListener("click", async (event) => {
      const editBtn = event.target.closest("[data-department-edit]");
      const deleteBtn = event.target.closest("[data-department-delete]");
      const departments = await store.getDepartments();

      if (editBtn) {
        const departmentId = editBtn.getAttribute("data-department-edit");
        const target = departments.find((item) => item.id === departmentId);
        if (!target) {
          localFlash("Department not found.");
          return;
        }

        const name = window.prompt("Department name", target.name);
        if (name === null) return;

        try {
          await store.updateDepartment(departmentId, { name });
          await refreshAllTables();
          localFlash("Department updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const departmentId = deleteBtn.getAttribute("data-department-delete");
        if (!window.confirm("Delete this department?")) return;
        try {
          await store.deleteDepartment(departmentId);
          await refreshAllTables();
          localFlash("Department deleted.");
        } catch (error) {
          localFlash(error.message);
        }
      }
    });
  }

  const coursesBody = document.getElementById("coursesBody");
  if (coursesBody) {
    coursesBody.addEventListener("click", async (event) => {
      const editBtn = event.target.closest("[data-course-edit]");
      const deleteBtn = event.target.closest("[data-course-delete]");
      const data = await store.getAll();

      if (editBtn) {
        const courseId = editBtn.getAttribute("data-course-edit");
        const course = data.courses.find((item) => item.id === courseId);
        if (!course) {
          localFlash("Course not found.");
          return;
        }

        const code = window.prompt("Course code", course.code);
        if (code === null) return;
        const title = window.prompt("Course title", course.title);
        if (title === null) return;
        const units = window.prompt("Units", course.units);
        if (units === null) return;
        const semester = window.prompt("Semester", course.semester);
        if (semester === null) return;

        try {
          await store.updateCourse(courseId, { code, title, units, semester });
          await refreshAllTables();
          localFlash("Course updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const courseId = deleteBtn.getAttribute("data-course-delete");
        if (!window.confirm("Delete this course and related records?")) return;
        try {
          await store.deleteCourse(courseId);
          await refreshAllTables();
          localFlash("Course deleted.");
        } catch (error) {
          localFlash(error.message);
        }
      }
    });
  }

  const exportBtn = document.getElementById("exportDataBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      try {
        const payload = await store.exportData();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `smis-local-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        localFlash("Data exported.");
      } catch (error) {
        localFlash(error.message);
      }
    });
  }

  const importFile = document.getElementById("importDataFile");
  if (importFile) {
    importFile.addEventListener("change", async () => {
      const file = importFile.files && importFile.files[0];
      if (!file) return;
      try {
        const rawText = await file.text();
        await store.importData(rawText);
        await refreshAllTables();
        localFlash("Data imported.");
      } catch (error) {
        localFlash(error.message);
      }
      importFile.value = "";
    });
  }

  const resetBtn = document.getElementById("resetDataBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      if (!window.confirm("Reset all local test data to default seed?")) return;
      await store.resetData();
      await refreshAllTables();
      localFlash("Data reset.");
    });
  }

  initSectionTabs();
  await refreshAllTables();
  })();
}
