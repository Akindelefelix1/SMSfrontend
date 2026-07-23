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

const manageStore = window.SMISStore;
if (manageStore) {
  (async () => {
    await manageStore.ensure();

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const loadingRow = (colSpan, label) =>
    `<tr><td colspan="${colSpan}" class="muted">${label || "Loading..."}</td></tr>`;

  const withOverlay = async (work, label) => {
    const loading = window.SMISLoading;
    if (loading) loading.start(label || "Working...");
    try {
      return await work();
    } finally {
      if (loading) loading.stop();
    }
  };

  const openModal = ({ title, body, confirmText, cancelText }) => {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";

      const card = document.createElement("div");
      card.className = "modal-card";

      const header = document.createElement("div");
      header.className = "modal-header";
      const heading = document.createElement("h3");
      heading.textContent = title || "Confirm";
      header.appendChild(heading);

      const content = document.createElement("div");
      content.className = "modal-body";
      if (typeof body === "string") {
        content.innerHTML = body;
      } else if (body) {
        content.appendChild(body);
      }

      const actions = document.createElement("div");
      actions.className = "modal-actions";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn btn-outline";
      cancelBtn.textContent = cancelText || "Cancel";
      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className = "btn";
      confirmBtn.textContent = confirmText || "Confirm";
      actions.append(cancelBtn, confirmBtn);

      card.append(header, content, actions);
      backdrop.appendChild(card);
      document.body.appendChild(backdrop);
      document.body.classList.add("modal-open");

      const cleanup = () => {
        document.body.classList.remove("modal-open");
        backdrop.remove();
        document.removeEventListener("keydown", onKeydown);
      };

      const onKeydown = (event) => {
        if (event.key === "Escape") {
          cleanup();
          resolve(false);
        }
      };

      cancelBtn.addEventListener("click", () => {
        cleanup();
        resolve(false);
      });

      confirmBtn.addEventListener("click", () => {
        cleanup();
        resolve(true);
      });

      document.addEventListener("keydown", onKeydown);
      confirmBtn.focus();
    });
  };

  const confirmModal = async (title, message, confirmText) => {
    const body = `<p class="muted">${escapeHtml(message || "Are you sure?")}</p>`;
    return openModal({ title, body, confirmText, cancelText: "Cancel" });
  };

  const formModal = async (title, fields, confirmText) => {
    const form = document.createElement("form");
    form.className = "modal-form";

    fields.forEach((field) => {
      const label = document.createElement("label");
      label.textContent = field.label || field.name;
      const input = field.type === "select" ? document.createElement("select") : document.createElement("input");
      input.name = field.name;
      if (field.type && field.type !== "select") input.type = field.type;
      if (field.required) input.required = true;
      if (field.placeholder) input.placeholder = field.placeholder;

      if (field.type === "select") {
        (field.options || []).forEach((option) => {
          const opt = document.createElement("option");
          opt.value = option.value;
          opt.textContent = option.label;
          input.appendChild(opt);
        });
      }

      if (field.value !== undefined && field.value !== null) {
        input.value = String(field.value);
      }

      label.appendChild(input);
      form.appendChild(label);
    });

    const ok = await openModal({ title, body: form, confirmText: confirmText || "Save" });
    if (!ok) return null;

    const data = {};
    fields.forEach((field) => {
      const input = form.querySelector(`[name="${field.name}"]`);
      data[field.name] = input ? input.value : "";
    });
    return data;
  };

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
  const studentFilterDepartment = document.getElementById("studentFilterDepartment");
  const studentFilterLevel = document.getElementById("studentFilterLevel");
  const courseFilterDepartment = document.getElementById("courseFilterDepartment");
  const studentFilterClear = document.getElementById("studentFilterClear");
  const getStudentFilter = () =>
    String(studentFilterInput ? studentFilterInput.value : "").trim().toLowerCase();
  const getDepartmentFilter = () =>
    String(studentFilterDepartment ? studentFilterDepartment.value : "").trim();
  const getLevelFilter = () =>
    String(studentFilterLevel ? studentFilterLevel.value : "").trim();

  const getDepartmentName = (value) => {
    if (!value) return "-";
    if (typeof value === "string") return value;
    if (typeof value === "object") return value.name || value.department || "-";
    return "-";
  };

  const getCourseDepartmentName = (course) =>
    getDepartmentName(course && course.department ? course.department : course && course.departmentName);

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
    const data = await manageStore.getAll();
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
                  <button class="btn btn-outline btn-danger" type="button" data-user-delete="${user.id}">Delete</button>
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
    const data = await manageStore.getAll();
    const filter = getStudentFilter();
    const departmentFilter = getDepartmentFilter();
    const levelFilter = getLevelFilter();
    const rows = data.students.filter((student) => {
      if (!filter) return true;
      return (
        String(student.studentNo).toLowerCase().includes(filter) ||
        String(student.name).toLowerCase().includes(filter)
      );
    });
    const filtered = rows.filter((student) => {
      if (departmentFilter && getDepartmentName(student.department) !== departmentFilter) {
        return false;
      }
      if (levelFilter && String(student.level) !== levelFilter) {
        return false;
      }
      return true;
    });
    studentsBody.innerHTML = filtered
      .map(
        (student) => `
          <tr>
            <td>${escapeHtml(student.studentNo)}</td>
            <td>${escapeHtml(student.name)}</td>
            <td>${escapeHtml(getDepartmentName(student.department))}</td>
            <td>${escapeHtml(student.level)}</td>
            <td>${escapeHtml(student.status)}</td>
            <td>
              <div class="actions">
                <button class="btn btn-outline" type="button" data-student-edit="${student.id}">Edit</button>
                  <button class="btn btn-outline btn-danger" type="button" data-student-delete="${student.id}">Delete</button>
              </div>
            </td>
          </tr>`
      )
      .join("");

    if (!filtered.length) {
      studentsBody.innerHTML = data.students.length
        ? '<tr><td colspan="6" class="muted">No matching students found.</td></tr>'
        : '<tr><td colspan="6" class="muted">No students added yet.</td></tr>';
    }
  };

  const renderCourses = async () => {
    const coursesBody = document.getElementById("coursesBody");
    if (!coursesBody) return;
    coursesBody.innerHTML = loadingRow(6, "Loading courses...");
    const data = await manageStore.getAll();
    const departmentFilter = courseFilterDepartment ? courseFilterDepartment.value : "";
    const courses = Array.isArray(data.courses) ? data.courses : [];
    const filtered = departmentFilter
      ? courses.filter((course) => getCourseDepartmentName(course) === departmentFilter)
      : courses;
    if (!filtered.length) {
      coursesBody.innerHTML = courses.length
        ? '<tr><td colspan="6" class="muted">No matching courses found.</td></tr>'
        : '<tr><td colspan="6" class="muted">No courses added yet.</td></tr>';
      return;
    }
    coursesBody.innerHTML = filtered
      .map(
        (course) => `
          <tr>
            <td>${escapeHtml(course.code)}</td>
            <td>${escapeHtml(course.title)}</td>
            <td>${escapeHtml(getCourseDepartmentName(course))}</td>
            <td>${escapeHtml(course.units)}</td>
            <td>${escapeHtml(course.semester)}</td>
            <td>
              <div class="actions">
                <button class="btn btn-outline" type="button" data-course-edit="${course.id}">Edit</button>
                <button class="btn btn-outline btn-danger" type="button" data-course-delete="${course.id}">Delete</button>
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
      const departments = await manageStore.getDepartments();
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
                    <button class="btn btn-outline btn-danger" type="button" data-department-delete="${department.id}">Delete</button>
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
    const departments = await manageStore.getDepartments();
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

    if (studentFilterDepartment) {
      const current = studentFilterDepartment.value;
      studentFilterDepartment.innerHTML =
        '<option value="">All departments</option>' +
        departments
          .map((department) => `<option value="${department.name}">${department.name}</option>`)
          .join("");
      if (current && departments.some((department) => department.name === current)) {
        studentFilterDepartment.value = current;
      }
    }

    if (courseFilterDepartment) {
      const current = courseFilterDepartment.value;
      courseFilterDepartment.innerHTML =
        '<option value="">All departments</option>' +
        departments
          .map((department) => `<option value="${department.name}">${department.name}</option>`)
          .join("");
      if (current && departments.some((department) => department.name === current)) {
        courseFilterDepartment.value = current;
      }
    }
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

  if (studentFilterDepartment) {
    studentFilterDepartment.addEventListener("change", () => {
      renderStudents();
    });
  }

  if (studentFilterLevel) {
    studentFilterLevel.addEventListener("change", () => {
      renderStudents();
    });
  }

  if (courseFilterDepartment) {
    courseFilterDepartment.addEventListener("change", () => {
      renderCourses();
    });
  }

  if (studentFilterClear) {
    studentFilterClear.addEventListener("click", () => {
      if (studentFilterInput) studentFilterInput.value = "";
      if (studentFilterDepartment) studentFilterDepartment.value = "";
      if (studentFilterLevel) studentFilterLevel.value = "";
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
        await withOverlay(
          () =>
            manageStore.addUser({
              name: formData.get("name"),
              role: formData.get("role"),
              status: formData.get("status"),
              email: formData.get("email"),
              username: String(username).trim(),
              password: String(password).trim()
            }),
          "Adding user..."
        );
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
        await withOverlay(
          () =>
            manageStore.addStudent({
              studentNo: formData.get("studentNo"),
              name: formData.get("name"),
              department: formData.get("department"),
              level: formData.get("level"),
              status: formData.get("status")
            }),
          "Adding student..."
        );
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
        await withOverlay(
          () => manageStore.addDepartment({ name: formData.get("name") }),
          "Adding department..."
        );
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
        await withOverlay(
          () =>
            manageStore.addCourse({
              department: formData.get("department"),
              code: formData.get("code"),
              title: formData.get("title"),
              units: formData.get("units"),
              semester: formData.get("semester")
            }),
          "Adding course..."
        );
        courseForm.reset();
        await refreshAllTables();
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
      const data = await manageStore.getAll();

      if (editBtn) {
        const userId = editBtn.getAttribute("data-user-edit");
        const user = data.users.find((item) => item.id === userId);
        if (!user) {
          localFlash("User not found.");
          return;
        }

        const updated = await formModal("Edit user", [
          { name: "name", label: "Full name", value: user.name, required: true },
          {
            name: "role",
            label: "Role",
            type: "select",
            value: user.role,
            options: [
              { label: "Admin", value: "admin" },
              { label: "Lecturer", value: "lecturer" },
              { label: "Support", value: "support" },
              { label: "Super admin", value: "super_admin" }
            ],
            required: true
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            value: user.status,
            options: [
              { label: "Active", value: "Active" },
              { label: "Pending", value: "Pending" },
              { label: "Suspended", value: "Suspended" }
            ],
            required: true
          },
          { name: "email", label: "Email", type: "email", value: user.email || "" }
        ], "Save changes");

        if (!updated) return;

        try {
          await withOverlay(
            () =>
              manageStore.updateUser(userId, {
                name: updated.name,
                role: updated.role,
                status: updated.status,
                email: updated.email,
                username: user.username
              }),
            "Updating user..."
          );
          await refreshAllTables();
          localFlash("User updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const userId = deleteBtn.getAttribute("data-user-delete");
        const confirmed = await confirmModal("Delete user", "Delete this user?", "Delete");
        if (!confirmed) return;
        try {
          await withOverlay(() => manageStore.deleteUser(userId), "Deleting user...");
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
      const data = await manageStore.getAll();
      const departmentNames = (await manageStore.getDepartments()).map((department) => department.name);

      if (editBtn) {
        const studentId = editBtn.getAttribute("data-student-edit");
        const student = data.students.find((item) => item.id === studentId);
        if (!student) {
          localFlash("Student not found.");
          return;
        }

        const updated = await formModal("Edit student", [
          { name: "studentNo", label: "Student No", value: student.studentNo, required: true },
          { name: "name", label: "Full name", value: student.name, required: true },
          {
            name: "department",
            label: "Department",
            type: "select",
            value: getDepartmentName(student.department),
            options: departmentNames.map((dept) => ({ label: dept, value: dept })),
            required: true
          },
          {
            name: "level",
            label: "Level",
            type: "select",
            value: student.level,
            options: ["100", "200", "300", "400", "500"].map((levelValue) => ({
              label: levelValue,
              value: levelValue
            })),
            required: true
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            value: student.status,
            options: [
              { label: "Active", value: "Active" },
              { label: "Pending", value: "Pending" },
              { label: "On Hold", value: "On Hold" }
            ],
            required: true
          }
        ], "Save changes");

        if (!updated) return;

        try {
          await withOverlay(
            () =>
              manageStore.updateStudent(studentId, {
                studentNo: updated.studentNo,
                name: updated.name,
                department: updated.department,
                level: updated.level,
                status: updated.status
              }),
            "Updating student..."
          );
          await refreshAllTables();
          localFlash("Student updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const studentId = deleteBtn.getAttribute("data-student-delete");
        const confirmed = await confirmModal(
          "Delete student",
          "Delete this student and related records?",
          "Delete"
        );
        if (!confirmed) return;
        try {
          await withOverlay(() => manageStore.deleteStudent(studentId), "Deleting student...");
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
      const departments = await manageStore.getDepartments();

      if (editBtn) {
        const departmentId = editBtn.getAttribute("data-department-edit");
        const target = departments.find((item) => item.id === departmentId);
        if (!target) {
          localFlash("Department not found.");
          return;
        }

        const updated = await formModal("Edit department", [
          { name: "name", label: "Department name", value: target.name, required: true }
        ], "Save changes");

        if (!updated) return;

        try {
          await withOverlay(
            () => manageStore.updateDepartment(departmentId, { name: updated.name }),
            "Updating department..."
          );
          await refreshAllTables();
          localFlash("Department updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const departmentId = deleteBtn.getAttribute("data-department-delete");
        const confirmed = await confirmModal("Delete department", "Delete this department?", "Delete");
        if (!confirmed) return;
        try {
          await withOverlay(() => manageStore.deleteDepartment(departmentId), "Deleting department...");
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
      const data = await manageStore.getAll();

      if (editBtn) {
        const courseId = editBtn.getAttribute("data-course-edit");
        const course = data.courses.find((item) => item.id === courseId);
        if (!course) {
          localFlash("Course not found.");
          return;
        }

        const departments = await manageStore.getDepartments();
        const updated = await formModal("Edit course", [
          {
            name: "department",
            label: "Department",
            type: "select",
            value: getCourseDepartmentName(course),
            options: departments.map((dept) => ({ label: dept.name, value: dept.name })),
            required: true
          },
          { name: "code", label: "Course code", value: course.code, required: true },
          { name: "title", label: "Course title", value: course.title, required: true },
          { name: "units", label: "Units", type: "number", value: course.units, required: true },
          {
            name: "semester",
            label: "Semester",
            type: "select",
            value: course.semester,
            options: [
              { label: "First Semester", value: "First Semester" },
              { label: "Second Semester", value: "Second Semester" }
            ],
            required: true
          }
        ], "Save changes");

        if (!updated) return;

        try {
          await withOverlay(
            () =>
              manageStore.updateCourse(courseId, {
                department: updated.department,
                code: updated.code,
                title: updated.title,
                units: updated.units,
                semester: updated.semester
              }),
            "Updating course..."
          );
          await refreshAllTables();
          localFlash("Course updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const courseId = deleteBtn.getAttribute("data-course-delete");
        const confirmed = await confirmModal(
          "Delete course",
          "Delete this course and related records?",
          "Delete"
        );
        if (!confirmed) return;
        try {
          await withOverlay(() => manageStore.deleteCourse(courseId), "Deleting course...");
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
        const payload = await manageStore.exportData();
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `sms-backend-data-${new Date().toISOString().slice(0, 10)}.json`;
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
        await manageStore.importData(rawText);
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
      if (!window.confirm("Reset backend data? This removes departments, students, courses, registrations, results, submissions, and tasks.")) return;
      try {
        await withOverlay(() => manageStore.resetData(), "Resetting backend data...");
        await refreshAllTables();
        localFlash("Backend data reset.");
      } catch (error) {
        localFlash(error.message);
      }
    });
  }

  initSectionTabs();
  await refreshAllTables();
  })();
}
