export const APP_NAME = "EthioSentinel";
const apiHost =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:5001";
export const API_BASE_URL = `${apiHost}/api`;

export const ROUTES = {
  LOGIN: "/login",
  CITIZEN: "/citizen",
  HEW: "/hew",
  ADMIN: "/admin",
  ADVISORY: "/advisory",
};

export const ROLES = {
  ADMIN: "admin",
  HEW: "hew",
  CITIZEN: "citizen",
};
