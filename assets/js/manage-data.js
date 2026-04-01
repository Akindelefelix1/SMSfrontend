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

  const renderUsers = () => {
    const usersBody = document.getElementById("usersBody");
    if (!usersBody) return;
    const data = store.getAll();
    usersBody.innerHTML = data.users
      .map(
        (user) => `
          <tr>
            <td>${user.name}</td>
            <td>${user.role}</td>
            <td>${user.status}</td>
            <td>${user.email || "-"}</td>
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
            <td>${student.studentNo}</td>
            <td>${student.name}</td>
            <td>${student.department}</td>
            <td>${student.level}</td>
            <td>${student.status}</td>
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
            <td>${course.code}</td>
            <td>${course.title}</td>
            <td>${course.units}</td>
            <td>${course.semester}</td>
          </tr>`
      )
      .join("");
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

  renderUsers();
  renderStudents();
  renderCourses();
}
