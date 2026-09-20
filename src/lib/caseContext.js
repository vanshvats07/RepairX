"use client";

const key = "repairx-active-case";
export function saveCaseContext(context) { if (typeof window !== "undefined") window.sessionStorage.setItem(key, JSON.stringify(context)); }
export function readCaseContext() { if (typeof window === "undefined") return null; try { return JSON.parse(window.sessionStorage.getItem(key) || "null"); } catch { return null; } }
export function clearCaseContext() { if (typeof window !== "undefined") window.sessionStorage.removeItem(key); }
