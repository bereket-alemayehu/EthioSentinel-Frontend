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
  identifier: string; // email or phone
  passwordHash: string;
  user: User;
  lastLogin: string;
}

/**
 * Normalizes identifiers for consistent lookup.
 */
function normalizeIdentifier(id: string): string {
  let clean = id.toLowerCase().trim().replace(/\s+/g, "");
  if (/^\+?\d+$/.test(clean)) {
    if (clean.startsWith("+251")) clean = "0" + clean.slice(4);
    else if (clean.startsWith("251")) clean = "0" + clean.slice(3);
    else if (clean.length === 9 && (clean.startsWith("9") || clean.startsWith("7"))) clean = "0" + clean;
  }
  return clean;
}

/**
 * Saves or updates offline credentials for a user.
 */
export async function saveOfflineCredentials(user: User, password: string) {
  try {
    const passwordHash = await hashPassword(password);
    const lastLogin = new Date().toISOString();
    
    const ids = [user.email, user.phoneNumber].filter(Boolean) as string[];
    const normalizedIds = [...new Set(ids.map(normalizeIdentifier))];

    console.log(`[OfflineAuth] Saving credentials for: ${normalizedIds.join(", ")}`);

    for (const id of normalizedIds) {
      const credential: OfflineCredential = {
        identifier: id,
        passwordHash,
        user,
        lastLogin,
      };
      await set(id, credential, store);
      console.log(`[OfflineAuth] ✓ Offline credentials saved for: ${id}`);
    }
  } catch (err) {
    console.error("[OfflineAuth] Failed to save credentials:", err);
  }
}

/**
 * Verifies credentials locally when offline.
 */
export async function verifyOfflineCredentials(identifier: string, password: string): Promise<User | null> {
  const nid = normalizeIdentifier(identifier);
  console.log(`[OfflineAuth] Verifying credentials for: "${nid}"`);
  
  try {
    const storedCreds = await get<OfflineCredential>(nid, store);
    
    if (!storedCreds) {
      console.warn(`[OfflineAuth] No cached credentials found for: "${nid}"`);
      return null;
    }

    const inputHash = await hashPassword(password);
    if (inputHash === storedCreds.passwordHash) {
      console.info(`[OfflineAuth] SUCCESS: Verified ${storedCreds.user.username}`);
      return storedCreds.user;
    }

    console.error(`[OfflineAuth] FAILURE: Incorrect password for ${nid}`);
    return null;
  } catch (err) {
    console.error("[OfflineAuth] Error during verification:", err);
    return null;
  }
}
