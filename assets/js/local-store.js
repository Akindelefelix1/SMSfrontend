(() => {
  const STORAGE_KEY = "smis_local_data_v1";

  const seed = {
    departments: [
      { id: "d1", name: "Computer Science" },
      { id: "d2", name: "Mathematics" },
      { id: "d3", name: "Biology" }
    ],
    users: [
      { id: "u1", name: "Ada Nwosu", role: "Admin", status: "Active", email: "ada@sms.local" },
      { id: "u2", name: "Femi Ajayi", role: "Lecturer", status: "Active", email: "femi@sms.local" },
      { id: "u3", name: "Chioma Eze", role: "Student", status: "Pending", email: "chioma@sms.local" }
    ],
    students: [
      { id: "s1", studentNo: "20/1234", name: "Chioma Eze", department: "Computer Science", level: "200", status: "Active" },
      { id: "s2", studentNo: "20/4521", name: "Uche Danladi", department: "Mathematics", level: "200", status: "Active" },
      { id: "s3", studentNo: "21/9832", name: "Amina Bello", department: "Biology", level: "100", status: "Pending" }
    ],
    courses: [
      { id: "c1", code: "CSC 201", title: "Data Structures", units: 3, semester: "First Semester" },
      { id: "c2", code: "CSC 203", title: "Web Development", units: 2, semester: "First Semester" },
      { id: "c3", code: "MTH 201", title: "Linear Algebra", units: 3, semester: "First Semester" },
      { id: "c4", code: "GST 201", title: "Entrepreneurship", units: 2, semester: "First Semester" }
    ],
    tasks: [
      { id: "t1", text: "Approve course add/drop requests" },
      { id: "t2", text: "Publish semester results" },
      { id: "t3", text: "Update academic year settings" }
    ],
    registrations: [
      {
        id: "r1",
        studentNo: "20/1234",
        regNo: "REG/CS/2026/014",
        semester: "First Semester",
        academicYear: "2025/2026",
        courses: ["CSC 201 - Data Structures", "GST 201 - Entrepreneurship"],
        createdAt: "2026-04-01T09:00:00.000Z"
      }
    ],
    results: [
      {
        id: "res1",
        studentNo: "20/1234",
        academicYear: "2025/2026",
        semester: "First Semester",
        course: "CSC 201",
        unit: 3,
        ca: 25,
        exam: 62,
        total: 87,
        grade: "A"
      },
      {
        id: "res2",
        studentNo: "20/1234",
        academicYear: "2025/2026",
        semester: "First Semester",
        course: "CSC 203",
        unit: 2,
        ca: 22,
        exam: 58,
        total: 80,
        grade: "A"
      },
      {
        id: "res3",
        studentNo: "20/1234",
        academicYear: "2025/2026",
        semester: "First Semester",
        course: "MTH 201",
        unit: 3,
        ca: 18,
        exam: 52,
        total: 70,
        grade: "B"
      }
    ]
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const read = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return clone(seed);
    }

    try {
      const parsed = JSON.parse(raw);
      const students = Array.isArray(parsed.students) ? parsed.students : [];
      const seededDepartments = Array.isArray(parsed.departments) ? parsed.departments : [];
      const fromStudents = Array.from(
        new Set(students.map((student) => String(student.department || "").trim()).filter(Boolean))
      ).map((name) => ({
        id: `d-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name,
      }));
      const mergedDepartments = [...seededDepartments];
      fromStudents.forEach((dept) => {
        const exists = mergedDepartments.some(
          (item) => String(item.name || "").toLowerCase() === dept.name.toLowerCase()
        );
        if (!exists) {
          mergedDepartments.push(dept);
        }
      });

      const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : seed.tasks;
      const normalizedTasks = rawTasks
        .map((item, index) => {
          if (typeof item === "string") {
            const text = item.trim();
            if (!text) return null;
            return {
              id: `t-${index + 1}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              text,
            };
          }

          const text = String(item.text || "").trim();
          if (!text) return null;
          return {
            id: String(item.id || `t-${index + 1}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`),
            text,
          };
        })
        .filter(Boolean);

      return {
        departments: mergedDepartments,
        users: Array.isArray(parsed.users) ? parsed.users : [],
        students,
        courses: Array.isArray(parsed.courses) ? parsed.courses : [],
        tasks: normalizedTasks,
        registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
        results: Array.isArray(parsed.results) ? parsed.results : []
      };
    } catch (error) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return clone(seed);
    }
  };

  const mountModeBadge = () => {
    if (document.getElementById("smsDataModeBadge")) return;
    const topbarContainer = document.querySelector(".topbar .container");
    if (!topbarContainer) return;

    const badge = document.createElement("span");
    badge.id = "smsDataModeBadge";
    badge.className = "mode-badge";
    badge.textContent = "Data Mode: Local Offline";
    topbarContainer.appendChild(badge);
  };

  const write = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  };

  const gradePoint = (grade) => {
    if (grade === "A") return 5;
    if (grade === "B") return 4;
    if (grade === "C") return 3;
    if (grade === "D") return 2;
    if (grade === "E") return 1;
    return 0;
  };

  const scoreToGrade = (total) => {
    if (total >= 70) return "A";
    if (total >= 60) return "B";
    if (total >= 50) return "C";
    if (total >= 45) return "D";
    if (total >= 40) return "E";
    return "F";
  };

  const computeGpa = (rows) => {
    if (!rows.length) return "0.00";
    const totals = rows.reduce(
      (acc, row) => {
        const units = Number(row.unit) || 0;
        return {
          quality: acc.quality + gradePoint(row.grade) * units,
          units: acc.units + units
        };
      },
      { quality: 0, units: 0 }
    );

    if (!totals.units) return "0.00";
    return (totals.quality / totals.units).toFixed(2);
  };

  const withStudentName = (studentNo, students) => {
    const student = students.find((item) => item.studentNo === studentNo);
    return student ? student.name : "Unknown Student";
  };

  const ensure = () => read();

  mountModeBadge();

  const addUser = (payload) => {
    const data = read();
    const name = String(payload.name || "").trim();
    const role = String(payload.role || "User").trim();
    const status = String(payload.status || "Active").trim();
    const email = String(payload.email || "").trim();

    if (!name) {
      throw new Error("User name is required");
    }

    const duplicate = data.users.some(
      (user) => user.name.toLowerCase() === name.toLowerCase() && user.role.toLowerCase() === role.toLowerCase()
    );
    if (duplicate) {
      throw new Error("User already exists");
    }

    data.users.push({ id: uid("u"), name, role, status, email });
    write(data);
    return data.users;
  };

  const getDepartments = () => {
    const data = read();
    return data.departments || [];
  };

  const addDepartment = (payload) => {
    const data = read();
    const name = String(payload.name || "").trim();
    if (!name) {
      throw new Error("Department name is required");
    }

    const duplicate = data.departments.some(
      (item) => String(item.name || "").toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      throw new Error("Department already exists");
    }

    data.departments.push({ id: uid("d"), name });
    write(data);
    return data.departments;
  };

  const updateDepartment = (id, payload) => {
    const data = read();
    const dept = data.departments.find((item) => item.id === id);
    if (!dept) {
      throw new Error("Department not found");
    }

    const name = String(payload.name || "").trim();
    if (!name) {
      throw new Error("Department name is required");
    }

    const duplicate = data.departments.some(
      (item) => item.id !== id && String(item.name || "").toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      throw new Error("Another department already uses this name");
    }

    const oldName = dept.name;
    dept.name = name;
    data.students = data.students.map((student) => ({
      ...student,
      department: student.department === oldName ? name : student.department
    }));
    write(data);
    return data.departments;
  };

  const deleteDepartment = (id) => {
    const data = read();
    const dept = data.departments.find((item) => item.id === id);
    if (!dept) {
      throw new Error("Department not found");
    }

    const inUse = data.students.some((student) => student.department === dept.name);
    if (inUse) {
      throw new Error("Cannot delete department assigned to students");
    }

    data.departments = data.departments.filter((item) => item.id !== id);
    write(data);
    return data.departments;
  };

  const updateUser = (id, payload) => {
    const data = read();
    const user = data.users.find((item) => item.id === id);
    if (!user) {
      throw new Error("User not found");
    }

    const name = String(payload.name || user.name).trim();
    const role = String(payload.role || user.role).trim();
    const status = String(payload.status || user.status).trim();
    const email = String(payload.email || user.email || "").trim();

    if (!name) {
      throw new Error("User name is required");
    }

    const duplicate = data.users.some(
      (item) =>
        item.id !== id &&
        item.name.toLowerCase() === name.toLowerCase() &&
        item.role.toLowerCase() === role.toLowerCase()
    );
    if (duplicate) {
      throw new Error("Another user with same name and role already exists");
    }

    user.name = name;
    user.role = role;
    user.status = status;
    user.email = email;
    write(data);
    return data.users;
  };

  const deleteUser = (id) => {
    const data = read();
    const before = data.users.length;
    data.users = data.users.filter((item) => item.id !== id);
    if (data.users.length === before) {
      throw new Error("User not found");
    }
    write(data);
    return data.users;
  };

  const addStudent = (payload) => {
    const data = read();
    const studentNo = String(payload.studentNo || "").trim();
    const name = String(payload.name || "").trim();
    const department = String(payload.department || "General").trim();
    const level = String(payload.level || "100").trim();
    const status = String(payload.status || "Active").trim();

    if (!studentNo || !name) {
      throw new Error("Student number and name are required");
    }

    const validDepartment = data.departments.some(
      (item) => String(item.name || "").toLowerCase() === department.toLowerCase()
    );
    if (!validDepartment) {
      throw new Error("Please select a valid department");
    }

    const duplicate = data.students.some((student) => student.studentNo.toLowerCase() === studentNo.toLowerCase());
    if (duplicate) {
      throw new Error("Student number already exists");
    }

    data.students.push({ id: uid("s"), studentNo, name, department, level, status });
    write(data);
    return data.students;
  };

  const updateStudent = (id, payload) => {
    const data = read();
    const student = data.students.find((item) => item.id === id);
    if (!student) {
      throw new Error("Student not found");
    }

    const studentNo = String(payload.studentNo || student.studentNo).trim();
    const name = String(payload.name || student.name).trim();
    const department = String(payload.department || student.department || "General").trim();
    const level = String(payload.level || student.level || "100").trim();
    const status = String(payload.status || student.status || "Active").trim();

    if (!studentNo || !name) {
      throw new Error("Student number and name are required");
    }

    const validDepartment = data.departments.some(
      (item) => String(item.name || "").toLowerCase() === department.toLowerCase()
    );
    if (!validDepartment) {
      throw new Error("Please select a valid department");
    }

    const duplicate = data.students.some(
      (item) => item.id !== id && item.studentNo.toLowerCase() === studentNo.toLowerCase()
    );
    if (duplicate) {
      throw new Error("Another student already uses this number");
    }

    student.studentNo = studentNo;
    student.name = name;
    student.department = department;
    student.level = level;
    student.status = status;
    write(data);
    return data.students;
  };

  const deleteStudent = (id) => {
    const data = read();
    const target = data.students.find((item) => item.id === id);
    if (!target) {
      throw new Error("Student not found");
    }

    data.students = data.students.filter((item) => item.id !== id);
    data.registrations = data.registrations.filter((item) => item.studentNo !== target.studentNo);
    data.results = data.results.filter((item) => item.studentNo !== target.studentNo);
    write(data);
    return data.students;
  };

  const addCourse = (payload) => {
    const data = read();
    const code = String(payload.code || "").trim();
    const title = String(payload.title || "").trim();
    const units = Number(payload.units || 0);
    const semester = String(payload.semester || "First Semester").trim();

    if (!code || !title || !units) {
      throw new Error("Course code, title, and units are required");
    }

    const duplicate = data.courses.some((course) => course.code.toLowerCase() === code.toLowerCase());
    if (duplicate) {
      throw new Error("Course code already exists");
    }

    data.courses.push({ id: uid("c"), code, title, units, semester });
    write(data);
    return data.courses;
  };

  const updateCourse = (id, payload) => {
    const data = read();
    const course = data.courses.find((item) => item.id === id);
    if (!course) {
      throw new Error("Course not found");
    }

    const code = String(payload.code || course.code).trim();
    const title = String(payload.title || course.title).trim();
    const units = Number(payload.units || course.units || 0);
    const semester = String(payload.semester || course.semester || "First Semester").trim();

    if (!code || !title || !units) {
      throw new Error("Course code, title, and units are required");
    }

    const duplicate = data.courses.some(
      (item) => item.id !== id && item.code.toLowerCase() === code.toLowerCase()
    );
    if (duplicate) {
      throw new Error("Another course already uses this code");
    }

    const previousLabel = `${course.code} - ${course.title}`;
    const newLabel = `${code} - ${title}`;

    course.code = code;
    course.title = title;
    course.units = units;
    course.semester = semester;

    data.registrations = data.registrations.map((item) => ({
      ...item,
      courses: item.courses.map((label) => (label === previousLabel ? newLabel : label))
    }));

    write(data);
    return data.courses;
  };

  const deleteCourse = (id) => {
    const data = read();
    const target = data.courses.find((item) => item.id === id);
    if (!target) {
      throw new Error("Course not found");
    }

    const label = `${target.code} - ${target.title}`;
    data.courses = data.courses.filter((item) => item.id !== id);
    data.registrations = data.registrations.map((item) => ({
      ...item,
      courses: item.courses.filter((courseLabel) => courseLabel !== label)
    }));
    data.results = data.results.filter((item) => item.course !== target.code);
    write(data);
    return data.courses;
  };

  const addRegistration = (payload) => {
    const data = read();
    const studentNo = String(payload.studentNo || "").trim();
    const regNo = String(payload.regNo || "").trim();
    const semester = String(payload.semester || "").trim();
    const academicYear = String(payload.academicYear || "").trim();
    const courses = Array.isArray(payload.courses) ? payload.courses : [];

    if (!studentNo || !regNo || !semester || !academicYear) {
      throw new Error("Registration fields are incomplete");
    }

    data.registrations.unshift({
      id: uid("r"),
      studentNo,
      regNo,
      semester,
      academicYear,
      courses,
      createdAt: new Date().toISOString()
    });

    write(data);
    return data.registrations;
  };

  const addResult = (payload) => {
    const data = read();
    const studentNo = String(payload.studentNo || "").trim();
    const academicYear = String(payload.academicYear || "").trim();
    const semester = String(payload.semester || "").trim();
    const course = String(payload.course || "").trim().toUpperCase();
    const unit = Number(payload.unit || 0);
    const ca = Number(payload.ca || 0);
    const exam = Number(payload.exam || 0);
    const total = Number(
      payload.total !== undefined && payload.total !== "" ? payload.total : ca + exam
    );
    const grade = String(payload.grade || scoreToGrade(total)).trim().toUpperCase();

    if (!studentNo || !academicYear || !semester || !course) {
      throw new Error("Student report fields are incomplete");
    }
    if (!unit || Number.isNaN(unit)) {
      throw new Error("Course unit is required");
    }
    if (Number.isNaN(ca) || Number.isNaN(exam) || Number.isNaN(total)) {
      throw new Error("Scores must be valid numbers");
    }

    const duplicate = data.results.some(
      (item) =>
        item.studentNo === studentNo &&
        item.academicYear === academicYear &&
        item.semester === semester &&
        item.course.toUpperCase() === course
    );
    if (duplicate) {
      throw new Error("Result already exists for this student/course/semester");
    }

    data.results.push({
      id: uid("res"),
      studentNo,
      academicYear,
      semester,
      course,
      unit,
      ca,
      exam,
      total,
      grade,
    });

    write(data);
    return data.results;
  };

  const addTask = (payload) => {
    const data = read();
    const text = String(payload.text || "").trim();
    if (!text) {
      throw new Error("Task text is required");
    }

    if (!Array.isArray(data.tasks)) {
      data.tasks = [];
    }

    data.tasks.unshift({ id: uid("t"), text });
    write(data);
    return data.tasks;
  };

  const getDashboardData = (payload = {}) => {
    const data = read();
    const page = Number(payload.page || 1);
    const limit = Number(payload.limit || 3);
    const studentFilter = String(payload.studentNo || "").trim().toLowerCase();
    const courseFilter = String(payload.courseCode || "").trim().toLowerCase();

    const filtered = data.registrations.filter((item) => {
      const byStudent = !studentFilter || item.studentNo.toLowerCase().includes(studentFilter);
      const byCourse =
        !courseFilter ||
        item.courses.some((course) => String(course).toLowerCase().includes(courseFilter));
      return byStudent && byCourse;
    });

    const pages = Math.max(1, Math.ceil(filtered.length / limit));
    const safePage = Math.min(Math.max(page, 1), pages);
    const start = (safePage - 1) * limit;
    const list = filtered.slice(start, start + limit).map((item) => {
      const firstCourse = item.courses[0] || "No course selected";
      return `${item.studentNo} - ${firstCourse}`;
    });

    const departments = new Set(data.students.map((student) => student.department || "General")).size;
    const pendingResults = Math.max(0, data.registrations.length - data.results.length);
    const registrationHolds = data.students.filter((student) => student.status.toLowerCase() !== "active").length;

    return {
      activeStudents: data.students.length,
      departments,
      pendingResults,
      registrationHolds,
      recentRegistrations: list,
      recentMeta: { page: safePage, pages },
      tasks: Array.isArray(data.tasks) ? data.tasks : []
    };
  };

  const queryResults = (payload = {}) => {
    const data = read();
    const page = Number(payload.page || 1);
    const limit = Number(payload.limit || 5);
    const studentNo = String(payload.studentNo || "").trim();
    const academicYear = String(payload.academicYear || "").trim();
    const semester = String(payload.semester || "").trim();
    const minTotal = payload.min_total !== undefined ? Number(payload.min_total) : null;
    const maxTotal = payload.max_total !== undefined ? Number(payload.max_total) : null;
    const sort = payload.sort || "course_code";
    const order = payload.order === "desc" ? "desc" : "asc";

    let rows = data.results.filter((row) => {
      const byStudent = !studentNo || row.studentNo === studentNo;
      const byYear = !academicYear || row.academicYear === academicYear;
      const bySemester = !semester || row.semester === semester;
      const byMin = minTotal === null || Number(row.total) >= minTotal;
      const byMax = maxTotal === null || Number(row.total) <= maxTotal;
      return byStudent && byYear && bySemester && byMin && byMax;
    });

    const fieldMap = {
      course_code: "course",
      course_unit: "unit",
      course_work: "ca",
      exam: "exam",
      total: "total"
    };
    const sortField = fieldMap[sort] || "course";

    rows.sort((a, b) => {
      const left = a[sortField];
      const right = b[sortField];
      if (typeof left === "number" && typeof right === "number") {
        return order === "asc" ? left - right : right - left;
      }
      return order === "asc"
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });

    const pages = Math.max(1, Math.ceil(rows.length / limit));
    const safePage = Math.min(Math.max(page, 1), pages);
    const start = (safePage - 1) * limit;
    const pageRows = rows.slice(start, start + limit);

    const allStudentRows = studentNo
      ? data.results.filter((row) => row.studentNo === studentNo)
      : rows;

    return {
      results: pageRows,
      gpa: computeGpa(pageRows),
      cgpa: computeGpa(allStudentRows),
      meta: {
        page: safePage,
        pages,
        total: rows.length
      }
    };
  };

  const getCourseOptions = () => {
    const data = read();
    return data.courses.map((course) => ({
      id: course.id,
      label: `${course.code} - ${course.title}`,
      semester: course.semester
    }));
  };

  const getRegisteredCourses = (payload = {}) => {
    const data = read();
    const studentNo = String(payload.studentNo || "").trim();
    const academicYear = String(payload.academicYear || "").trim();
    const semester = String(payload.semester || "").trim();

    if (!studentNo || !academicYear || !semester) {
      return [];
    }

    const labels = new Set();
    data.registrations
      .filter(
        (item) =>
          item.studentNo === studentNo &&
          item.academicYear === academicYear &&
          item.semester === semester
      )
      .forEach((item) => {
        item.courses.forEach((label) => labels.add(label));
      });

    return Array.from(labels).map((label) => {
      const code = String(label).split(" - ")[0].trim();
      const matched = data.courses.find((course) => course.code === code);
      return {
        code,
        label,
        unit: matched ? Number(matched.units) : null,
      };
    });
  };

  const getStudentsByDepartment = (departmentName) => {
    const data = read();
    const target = String(departmentName || "").trim().toLowerCase();
    if (!target) return [];
    return data.students.filter(
      (student) => String(student.department || "").trim().toLowerCase() === target
    );
  };

  const getAll = () => read();

  const exportData = () => JSON.stringify(read(), null, 2);

  const importData = (rawText) => {
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (_err) {
      throw new Error("Invalid JSON file");
    }

    const students = Array.isArray(parsed.students) ? parsed.students : [];
    const seededDepartments = Array.isArray(parsed.departments) ? parsed.departments : [];
    const fromStudents = Array.from(
      new Set(students.map((student) => String(student.department || "").trim()).filter(Boolean))
    ).map((name) => ({
      id: `d-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name,
    }));
    const mergedDepartments = [...seededDepartments];
    fromStudents.forEach((dept) => {
      const exists = mergedDepartments.some(
        (item) => String(item.name || "").toLowerCase() === dept.name.toLowerCase()
      );
      if (!exists) {
        mergedDepartments.push(dept);
      }
    });

    const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : seed.tasks;
    const normalizedTasks = rawTasks
      .map((item, index) => {
        if (typeof item === "string") {
          const text = item.trim();
          if (!text) return null;
          return {
            id: `t-${index + 1}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            text,
          };
        }

        const text = String(item.text || "").trim();
        if (!text) return null;
        return {
          id: String(item.id || `t-${index + 1}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`),
          text,
        };
      })
      .filter(Boolean);

    const normalized = {
      departments: mergedDepartments,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      students,
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
      tasks: normalizedTasks,
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
      results: Array.isArray(parsed.results) ? parsed.results : []
    };

    write(normalized);
    return normalized;
  };

  const resetData = () => {
    const fresh = clone(seed);
    write(fresh);
    return fresh;
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
    addTask,
    getDashboardData,
    queryResults,
    getCourseOptions,
    getRegisteredCourses,
    getStudentsByDepartment,
    withStudentName
  };
})();
