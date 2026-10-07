export const correctionMock = {
  attendanceRecordId: "att-rec-1024",
  session: { id: "session-2205-p1-c2", date: "2026-05-22", day: "Monday", period: 1, className: "Class 2", subject: "Mathematics", staff: "Ahmed Mohammed", status: "MARKED" },
  student: { id: "student-204", rollNo: 14, name: "Admo Student" },
  currentAttendance: { status: "ABSENT", absenceType: "Medical", remarks: "Student reported sick during first period.", markedBy: "Ahmed Mohammed", markedAt: "08:52 AM" },
};

export const absenceTypes = [
  { id: "medical", name: "Medical" }, { id: "personal", name: "Personal" },
  { id: "official", name: "Official" }, { id: "other", name: "Other" },
];

export const dashboardMock = {
  date: "2026-05-22",
  periods: [1,2,3,4,5,6,7],
  classes: [
    { id: "class-1", name: "Class 1", sessions: ["MARKED","MARKED","MARKED","MARKED","MARKED","NOT_ARRIVED","NOT_ARRIVED"] },
    { id: "class-2", name: "Class 2", sessions: ["UNMARKED","MARKED","MARKED","MARKED","MARKED","NOT_ARRIVED","NOT_ARRIVED"] },
    { id: "class-3", name: "Class 3", sessions: ["MARKED","MARKED","MARKED","MARKED","MARKED","MARKED","NOT_GENERATED"] },
  ],
};

export const sessionDetails = {
  "class-1-1": {
    id: "session-c1-p1", className: "Class 1", period: 1, subject: "English",
    staff: "Ahmed Mohammed", date: "2026-05-22", status: "MARKED", present: 22, absent: 2,
    students: [
      { id: 1, rollNo: 1, name: "Admo Student", status: "PRESENT" },
      { id: 2, rollNo: 2, name: "Student Hassan", status: "PRESENT" },
      { id: 3, rollNo: 3, name: "Student Ali", status: "ABSENT", absenceType: "Medical", remarks: "Sick" },
      { id: 4, rollNo: 4, name: "Student Umar", status: "PRESENT" },
      { id: 5, rollNo: 5, name: "Student Hamza", status: "ABSENT", absenceType: "Personal", remarks: "Family reason" },
    ],
  },
};

export const unmarkedSessions = [
  { id: "u1", date: "22 May", period: "P1", className: "Class 2", subject: "Mathematics", staff: "Ahmed Mohammed" },
  { id: "u2", date: "22 May", period: "P4", className: "Class 4", subject: "English", staff: "Hassan Ali" },
  { id: "u3", date: "21 May", period: "P6", className: "Class 1", subject: "Science", staff: "Omar Yusuf" },
];
