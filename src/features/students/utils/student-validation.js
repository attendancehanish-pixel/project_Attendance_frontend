const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{6,20}$/;

export function validateStudent(s) {
  const errs = {};
  if (!String(s.admissionNo || "").trim()) errs.admissionNo = "Required";
  if (!String(s.name || "").trim()) errs.name = "Required";
  const email = String(s.email || "").trim();
  if (email && !EMAIL_RE.test(email)) errs.email = "Invalid email";
  const phone = String(s.phone || "").trim();
  if (phone && !PHONE_RE.test(phone)) errs.phone = "Invalid phone";
  return errs;
}
