"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Helper to safely access storage (sessionStorage or localStorage)
 */
function getStorage(type = "session") {
  if (typeof window === "undefined") return null;
  try {
    return type === "local" ? window.localStorage : window.sessionStorage;
  } catch (e) {
    console.warn("Storage access denied:", e);
    return null;
  }
}

/**
 * Save draft data to storage
 */
export function saveFormDraft(key, data, type = "session") {
  const storage = getStorage(type);
  if (!storage || !key) return;
  try {
    if (data === null || data === undefined) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn(`Failed to save draft for key "${key}":`, e);
  }
}

/**
 * Retrieve draft data from storage
 */
export function getFormDraft(key, fallback = null, type = "session") {
  const storage = getStorage(type);
  if (!storage || !key) return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to read draft for key "${key}":`, e);
    return fallback;
  }
}

/**
 * Clear draft data from storage
 */
export function clearFormDraft(key, type = "session") {
  const storage = getStorage(type);
  if (!storage || !key) return;
  try {
    storage.removeItem(key);
  } catch (e) {
    console.warn(`Failed to clear draft for key "${key}":`, e);
  }
}

/**
 * Hook to manage form state with automatic draft persistence and beforeunload protection
 *
 * @param {string} key - Unique key for this form draft
 * @param {any} initialValue - Initial state or fallback
 * @param {object} options - { storage: 'session' | 'local', enableBeforeUnload: boolean }
 * @returns {[any, Function, Function, boolean]} [state, setState, clearDraft, isDirty]
 */
export function useFormDraft(key, initialValue, options = {}) {
  const { storage = "session", enableBeforeUnload = true } = options;
  const initialRef = useRef(initialValue);

  // Initialize state from existing draft if present
  const [state, setState] = useState(() => {
    if (typeof window === "undefined" || !key) return initialValue;
    const existing = getFormDraft(key, null, storage);
    if (existing !== null && existing !== undefined) {
      // If object, merge with initial value to ensure any newly added fields exist
      if (typeof initialValue === "object" && initialValue !== null && !Array.isArray(initialValue)) {
        return { ...initialValue, ...existing };
      }
      return existing;
    }
    return initialValue;
  });

  const [isDirty, setIsDirty] = useState(false);

  // Check dirtiness and save to storage on change
  useEffect(() => {
    if (!key) return;
    try {
      const isDifferent = JSON.stringify(state) !== JSON.stringify(initialRef.current);
      setIsDirty(isDifferent);

      if (isDifferent) {
        saveFormDraft(key, state, storage);
      }
    } catch (_) {}
  }, [key, state, storage]);

  // Beforeunload protection against accidental refresh or tab close
  useEffect(() => {
    if (!enableBeforeUnload || !isDirty || typeof window === "undefined") return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Ada perubahan data form yang belum disimpan. Yakin ingin meninggalkan halaman?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enableBeforeUnload, isDirty]);

  // Clean clear draft callback
  const clearDraft = useCallback(() => {
    clearFormDraft(key, storage);
    setIsDirty(false);
  }, [key, storage]);

  return [state, setState, clearDraft, isDirty];
}

/**
 * Hook to attach beforeunload protection to any custom dirty state
 */
export function useBeforeUnload(isDirty, message = "Perubahan yang Anda buat belum disimpan.") {
  useEffect(() => {
    if (!isDirty || typeof window === "undefined") return;

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, message]);
}
