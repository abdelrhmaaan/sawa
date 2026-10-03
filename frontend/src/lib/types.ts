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
