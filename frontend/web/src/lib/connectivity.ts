'use client';

import { useSyncExternalStore } from 'react';
import { API_URL } from './api';

// navigator.onLine alone gives false alarms (some VPNs, Docker bridges and captive networks report
// "offline" with a working connection), so an offline report is confirmed by reaching the server.

const PROBE_TIMEOUT_MS = 4000;
const RECHECK_MS = 15000;

let online = true;
let started = false;
let recheck: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (next === online) return;
  online = next;
  listeners.forEach(l => l());
}

// Any answer from the API counts, even an opaque one; only a network failure means offline
async function reachable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    await fetch(`${API_URL}/api/health`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function confirm() {
  const ok = await reachable();
  set(ok);
  if (ok && recheck) {
    clearInterval(recheck);
    recheck = null;
  } else if (!ok && !recheck) {
    recheck = setInterval(confirm, RECHECK_MS);
  }
}

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('online', () => void confirm());
  window.addEventListener('offline', () => void confirm());
  if (!navigator.onLine) void confirm();
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** true while the app can reach the internet (server-confirmed) */
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, () => online, () => true);
}
