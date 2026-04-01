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
  store.ensure();

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const renderUsers = () => {
    const usersBody = document.getElementById("usersBody");
    if (!usersBody) return;
    const data = store.getAll();
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

  const renderStudents = () => {
    const studentsBody = document.getElementById("studentsBody");
    if (!studentsBody) return;
    const data = store.getAll();
    studentsBody.innerHTML = data.students
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
  };

  const renderCourses = () => {
    const coursesBody = document.getElementById("coursesBody");
    if (!coursesBody) return;
    const data = store.getAll();
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

  const refreshAllTables = () => {
    renderUsers();
    renderStudents();
    renderCourses();
  };

  const userForm = document.getElementById("userForm");
  if (userForm) {
    userForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(userForm);
      try {
        store.addUser({
          name: formData.get("name"),
          role: formData.get("role"),
          status: formData.get("status"),
          email: formData.get("email")
        });
        userForm.reset();
        renderUsers();
        localFlash("User added locally.");
      } catch (error) {
        localFlash(error.message);
      }
    });
  }

  const studentForm = document.getElementById("studentForm");
  if (studentForm) {
    studentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(studentForm);
      try {
        store.addStudent({
          studentNo: formData.get("studentNo"),
          name: formData.get("name"),
          department: formData.get("department"),
          level: formData.get("level"),
          status: formData.get("status")
        });
        studentForm.reset();
        renderStudents();
        localFlash("Student added locally.");
      } catch (error) {
        localFlash(error.message);
      }
    });
  }

  const courseForm = document.getElementById("courseForm");
  if (courseForm) {
    courseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(courseForm);
      try {
        store.addCourse({
          code: formData.get("code"),
          title: formData.get("title"),
          units: formData.get("units"),
          semester: formData.get("semester")
        });
        courseForm.reset();
        renderCourses();
        localFlash("Course added locally.");
      } catch (error) {
        localFlash(error.message);
      }
    });
  }

  const usersBody = document.getElementById("usersBody");
  if (usersBody) {
    usersBody.addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-user-edit]");
      const deleteBtn = event.target.closest("[data-user-delete]");
      const data = store.getAll();

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
          store.updateUser(userId, { name, role, status, email });
          refreshAllTables();
          localFlash("User updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const userId = deleteBtn.getAttribute("data-user-delete");
        if (!window.confirm("Delete this user?")) return;
        try {
          store.deleteUser(userId);
          refreshAllTables();
          localFlash("User deleted.");
        } catch (error) {
          localFlash(error.message);
        }
      }
    });
  }

  const studentsBody = document.getElementById("studentsBody");
  if (studentsBody) {
    studentsBody.addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-student-edit]");
      const deleteBtn = event.target.closest("[data-student-delete]");
      const data = store.getAll();

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
        const department = window.prompt("Department", student.department);
        if (department === null) return;
        const level = window.prompt("Level", student.level);
        if (level === null) return;
        const status = window.prompt("Status", student.status);
        if (status === null) return;

        try {
          store.updateStudent(studentId, { studentNo, name, department, level, status });
          refreshAllTables();
          localFlash("Student updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const studentId = deleteBtn.getAttribute("data-student-delete");
        if (!window.confirm("Delete this student and related records?")) return;
        try {
          store.deleteStudent(studentId);
          refreshAllTables();
          localFlash("Student deleted.");
        } catch (error) {
          localFlash(error.message);
        }
      }
    });
  }

  const coursesBody = document.getElementById("coursesBody");
  if (coursesBody) {
    coursesBody.addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-course-edit]");
      const deleteBtn = event.target.closest("[data-course-delete]");
      const data = store.getAll();

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
          store.updateCourse(courseId, { code, title, units, semester });
          refreshAllTables();
          localFlash("Course updated.");
        } catch (error) {
          localFlash(error.message);
        }
      }

      if (deleteBtn) {
        const courseId = deleteBtn.getAttribute("data-course-delete");
        if (!window.confirm("Delete this course and related records?")) return;
        try {
          store.deleteCourse(courseId);
          refreshAllTables();
          localFlash("Course deleted.");
        } catch (error) {
          localFlash(error.message);
        }
      }
    });
  }

  const exportBtn = document.getElementById("exportDataBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      try {
        const blob = new Blob([store.exportData()], { type: "application/json" });
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
        store.importData(rawText);
        refreshAllTables();
        localFlash("Data imported.");
      } catch (error) {
        localFlash(error.message);
      }
      importFile.value = "";
    });
  }

  const resetBtn = document.getElementById("resetDataBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!window.confirm("Reset all local test data to default seed?")) return;
      store.resetData();
      refreshAllTables();
      localFlash("Local data reset.");
    });
  }

  refreshAllTables();
}
