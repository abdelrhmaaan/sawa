import type {
  AppNotification,
  DashboardData,
  EmployeeRequest,
  EmployeeRequestDetail,
  EntryStatus,
  Me,
  NotificationList,
  Paginated,
  RequestStatus,
  RequestType,
  TimesheetEntry,
  TimesheetEntryDetail,
  TimesheetList,
  TokenPair,
  UserListItem,
} from "./types";

const API_BASE: string = import.meta.env.VITE_API_URL ?? "";
const REFRESH_KEY = "sawa.refresh";

export class ApiError extends Error {
  status: number;
  detail?: string;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, detail?: string, fieldErrors?: Record<string, string[]>) {
    super(detail ?? `Request failed (${status})`);
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

// ── Token storage: access token in memory, refresh token in localStorage ──

let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(pair: TokenPair) {
  accessToken = pair.access;
  localStorage.setItem(REFRESH_KEY, pair.refresh);
}

export function clearTokens() {
  accessToken = null;
  localStorage.removeItem(REFRESH_KEY);
}

// ── Refresh: one shared in-flight promise so parallel 401s don't race ──

let refreshPromise: Promise<boolean> | null = null;
let onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(fn: () => void) {
  onAuthFailure = fn;
}

async function doRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as TokenPair;
    accessToken = data.access;
    // Rotation: always store the new refresh token if one is returned.
    if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
    return true;
  } catch {
    return false;
  }
}

export function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Core fetch ──

interface FetchOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  retried?: boolean;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, query, retried } = options;

  let url = `${API_BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !retried && !path.startsWith("/api/auth/token")) {
    const ok = await refreshTokens();
    if (ok) return apiFetch<T>(path, { ...options, retried: true });
    clearTokens();
    onAuthFailure?.();
    throw new ApiError(401, "Session expired. Please sign in again.");
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON body
  }

  if (!res.ok) {
    const err = data as Record<string, unknown> | null;
    if (err && typeof err.detail === "string") {
      throw new ApiError(res.status, err.detail);
    }
    if (err && typeof err === "object") {
      const fieldErrors: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(err)) {
        fieldErrors[k] = Array.isArray(v) ? v.map(String) : [String(v)];
      }
      throw new ApiError(res.status, undefined, fieldErrors);
    }
    throw new ApiError(res.status);
  }

  return data as T;
}

// ── Typed helpers ──

export function login(email: string, password: string) {
  return apiFetch<TokenPair>("/api/auth/token/", {
    method: "POST",
    body: { email, password },
  });
}

export function getMe() {
  return apiFetch<Me>("/api/me/");
}

export function updateMe(patch: { first_name?: string; last_name?: string }) {
  return apiFetch<Me>("/api/me/", { method: "PATCH", body: patch });
}

export function getDashboard() {
  return apiFetch<DashboardData>("/api/dashboard/");
}

// ── Requests (spec 003) ──

export type RequestListQuery = {
  status?: RequestStatus;
  type?: RequestType;
  owner?: number;
  created_after?: string;
  created_before?: string;
  pending_my_action?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
};

export function listRequests(query: RequestListQuery = {}) {
  return apiFetch<Paginated<EmployeeRequest>>("/api/requests/", { query });
}

export function getRequest(id: number) {
  return apiFetch<EmployeeRequestDetail>(`/api/requests/${id}/`);
}

export function createRequest(body: {
  type: RequestType;
  title: string;
  description: string;
}) {
  return apiFetch<EmployeeRequest>("/api/requests/", {
    method: "POST",
    body,
  });
}

export function updateRequest(
  id: number,
  patch: { type?: RequestType; title?: string; description?: string }
) {
  return apiFetch<EmployeeRequestDetail>(`/api/requests/${id}/`, {
    method: "PATCH",
    body: patch,
  });
}

export function deleteRequest(id: number) {
  return apiFetch<void>(`/api/requests/${id}/`, { method: "DELETE" });
}

export function submitRequest(id: number) {
  return apiFetch<EmployeeRequestDetail>(`/api/requests/${id}/submit/`, {
    method: "POST",
  });
}

export type RequestAction = "approve" | "reject" | "return";

export function decideRequest(id: number, action: RequestAction, comment = "") {
  return apiFetch<EmployeeRequestDetail>(`/api/requests/${id}/${action}/`, {
    method: "POST",
    body: { comment },
  });
}

// ── Timesheets (spec 004) ──

export type TimesheetListQuery = {
  status?: EntryStatus;
  owner?: number;
  date_from?: string;
  date_to?: string;
  pending_my_action?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
};

export function listTimesheets(query: TimesheetListQuery = {}) {
  return apiFetch<TimesheetList>("/api/timesheets/", { query });
}

export function getTimesheetEntry(id: number) {
  return apiFetch<TimesheetEntryDetail>(`/api/timesheets/${id}/`);
}

export interface TimesheetEntryInput {
  date: string;
  start_time: string;
  end_time: string;
  note?: string;
}

export function createTimesheetEntry(body: TimesheetEntryInput) {
  return apiFetch<TimesheetEntry>("/api/timesheets/", {
    method: "POST",
    body,
  });
}

export function updateTimesheetEntry(id: number, patch: Partial<TimesheetEntryInput>) {
  return apiFetch<TimesheetEntryDetail>(`/api/timesheets/${id}/`, {
    method: "PATCH",
    body: patch,
  });
}

export function deleteTimesheetEntry(id: number) {
  return apiFetch<void>(`/api/timesheets/${id}/`, { method: "DELETE" });
}

export function submitTimesheetEntry(id: number) {
  return apiFetch<TimesheetEntryDetail>(`/api/timesheets/${id}/submit/`, {
    method: "POST",
  });
}

export function bulkSubmitTimesheetEntries(ids: number[]) {
  return apiFetch<{ submitted: number }>("/api/timesheets/submit/", {
    method: "POST",
    body: { ids },
  });
}

export type TimesheetAction = "approve" | "return";

export function decideTimesheetEntry(id: number, action: TimesheetAction, comment = "") {
  return apiFetch<TimesheetEntryDetail>(`/api/timesheets/${id}/${action}/`, {
    method: "POST",
    body: { comment },
  });
}

// ── Users directory (manager/HR only; employees get 403) ──

export function listUsers(query: { page?: number; page_size?: number } = {}) {
  return apiFetch<Paginated<UserListItem>>("/api/users/", { query });
}

// ── Notifications (spec 005, optional) ──

export function listNotifications(query: { page?: number; page_size?: number } = {}) {
  return apiFetch<NotificationList>("/api/notifications/", { query });
}

export function markNotificationRead(id: number) {
  return apiFetch<AppNotification>(`/api/notifications/${id}/read/`, {
    method: "POST",
  });
}

export function markAllNotificationsRead() {
  return apiFetch<{ marked_read: number }>("/api/notifications/read-all/", {
    method: "POST",
  });
}

export type { Paginated };
