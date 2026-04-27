import { createStore, get, set } from "idb-keyval";
import type { User } from "../types";

const store = createStore("ethiosentinel-auth", "auth-store");

/**
 * Computes a SHA-256 hash of a string using Web Crypto API.
 */
async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface OfflineCredential {
  email: string;
  passwordHash: string;
  user: User;
  lastLogin: string;
}

/**
 * Saves or updates offline credentials for a user.
 */
export async function saveOfflineCredentials(user: User, password: string) {
  const passwordHash = await hashPassword(password);
  const credential: OfflineCredential = {
    email: user.email.toLowerCase(),
    passwordHash,
    user,
    lastLogin: new Date().toISOString(),
  };
  
  await set(credential.email, credential, store);
}

/**
 * Verifies credentials locally when offline.
 */
export async function verifyOfflineCredentials(email: string, password: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase();
  const storedCreds = await get<OfflineCredential>(normalizedEmail, store);
  
  if (!storedCreds) return null;
  
  const inputHash = await hashPassword(password);
  if (inputHash === storedCreds.passwordHash) {
    return storedCreds.user;
  }
  
  return null;
}
