export const APP_NAME = "EthioSentinel";
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
