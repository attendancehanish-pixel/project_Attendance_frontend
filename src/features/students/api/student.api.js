import { get, post, patch, del } from "../../../shared/api/client";

export const studentApi = {
  list: () => get("/students"),
  create: (data) => post("/students", data),
  update: (id, data) => patch(`/students/${id}`, data),
  remove: (id) => del(`/students/${id}`),
  bulkCreate: (students) => post("/students/bulk", { students }),
};
