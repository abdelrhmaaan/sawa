export type Role = "employee" | "manager" | "hr";

export type RequestStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "returned";

export type EntryStatus = "draft" | "submitted" | "approved" | "returned";

export interface UserRef {
  id: number;
  name: string;
  email: string;
}

export interface Me {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  department: string;
  manager: UserRef | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface DashboardTeam {
  pending_requests: number;
  pending_timesheets: number;
  team_hours_this_week: string;
}

export interface DashboardOrg {
  pending_requests: number;
  pending_timesheets: number;
  hours_this_week: string;
  users_by_role: Record<Role, number>;
}

export interface DashboardData {
  my_requests: Record<RequestStatus, number>;
  my_entries: Record<EntryStatus, number>;
  my_hours_this_week: string;
  team?: DashboardTeam;
  org?: DashboardOrg;
}

// ── Employee requests (spec 003) ──

export type RequestType = "leave" | "equipment" | "wfh" | "hr_service" | "general";

export const requestTypeLabels: Record<RequestType, string> = {
  leave: "Leave",
  equipment: "Equipment",
  wfh: "Work from home",
  hr_service: "HR service",
  general: "General",
};

// Object `type` aliases (not `interface`) so they satisfy Table's
// `Record<string, unknown>` constraint via implicit index signatures.
export type StatusHistoryItem = {
  id: number;
  actor: UserRef | null;
  from_status: string | null;
  to_status: string;
  comment: string;
  created_at: string;
};

export type EmployeeRequest = {
  id: number;
  owner: UserRef | null;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  decided_at: string | null;
};

export type EmployeeRequestDetail = EmployeeRequest & {
  history: StatusHistoryItem[];
};

// ── Timesheets (spec 004) ──

export type TimesheetEntry = {
  id: number;
  owner: UserRef | null;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM[:SS]
  end_time: string;
  hours: string; // decimal
  note: string;
  status: EntryStatus;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
};

export type TimesheetEntryDetail = TimesheetEntry & {
  history: StatusHistoryItem[];
};

export type TimesheetList = Paginated<TimesheetEntry> & {
  total_hours: string;
};

// ── Users directory (GET /api/users/, manager/HR only) ──

export type UserListItem = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  department: string;
  manager: UserRef | null;
  is_active: boolean;
};

// ── Notifications (spec 005, optional US2) ──

export type AppNotification = {
  id: number;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
};

export type NotificationList = Paginated<AppNotification> & {
  unread_count: number;
};

export function userDisplayName(u: {
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
}): string {
  const full =
    u.name ?? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  return full || u.email;
}
