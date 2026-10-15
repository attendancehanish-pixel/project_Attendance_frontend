import { get, post, patch, del } from "../../../shared/api/client";

export const usersApi = {
  list: () => get("/users"),
  create: (body) => post("/users", body),
  update: (id, body) => patch(`/users/${id}`, body),
  setStatus: (id, isActive) => patch(`/users/${id}/status`, { isActive }),
};

export const rolesApi = {
  list: () => get("/roles"),
  create: (body) => post("/roles", body),
  update: (id, body) => patch(`/roles/${id}`, body),
  remove: (id) => del(`/roles/${id}`),
};

export const permissionsApi = {
  catalog: () => get("/permissions"),
};
