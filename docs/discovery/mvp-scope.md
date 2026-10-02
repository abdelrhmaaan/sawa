# MVP Scope & Exclusions

## MVP Scope (What We're Building)

### Core Modules

1. **Authentication & Users**
   - Email/password sign-in
   - User profiles with role assignment (Employee, Manager, HR)
   - Employee records managed by HR
   - Reporting lines (manager-employee relationships)

2. **Role-Based Access Control**
   - Server-side RBAC enforced in Django
   - Ownership checks (employees see only their own data)
   - Managers see only their direct reports
   - HR sees everything

3. **Employee Requests**
   - Create requests with type, title, and description (no attachments — see Out of Scope)
   - Request types: Leave, Equipment, Work-from-Home, HR Service, General
   - Submit, track status, and view activity history
   - Edit draft requests before submission

4. **Request Approvals**
   - Manager reviews requests from direct reports
   - Approve, reject, or return for correction
   - HR can review any request in the organization
   - Full status history with timestamps and comments

5. **Timesheets**
   - Create daily time entries (date, start-end time or hours)
   - Save as draft, edit, and submit
   - Submitted timesheets become read-only unless returned
   - View personal timesheet history and approval status

6. **Timesheet Review**
   - Manager reviews submitted timesheets from direct reports
   - Approve or return for correction
   - HR can review any timesheet organization-wide

7. **Dashboards**
   - Employee: my requests summary, my timesheets summary, quick actions
   - Manager: team pending requests, team timesheets pending review, team hours
   - HR: org-wide stats, pending work overview, compliance indicators

8. **Search & Filters**
   - Filter requests by type, status, date range, employee
   - Filter timesheets by status, date range, employee
   - Sort by date and status
   - Pagination for large result sets

9. **Notifications (In-App)**
   - Notify on request submission, approval, rejection, return
   - Notify on timesheet submission, approval, return
   - In-app notification feed (no email/SMS in MVP)

10. **Reporting**
    - Working-hour summaries by employee, team, or period
    - Request activity reports (volume, approval rate, average resolution time)
    - Exportable views for HR

---

## Out of Scope (What We're NOT Building in MVP)

| Feature | Reason |
|---------|--------|
| Email/SMS notifications | In-app notifications are sufficient for MVP; external integrations add complexity |
| Mobile native app | Responsive web covers mobile; native app is a future enhancement |
| Payroll integration | Out of scope; timesheets provide data but payroll processing is separate |
| Calendar integration (Google/Outlook) | Nice-to-have but not essential for MVP |
| Multi-language support | English first; Arabic support can be added post-MVP |
| Custom workflow builder | Fixed approval flows (Employee → Manager → HR if needed) are sufficient |
| File upload/attachment storage | Notes and descriptions in MVP; file attachments require object storage setup |
| Advanced analytics/BI | Basic reporting covers MVP; advanced analytics is a future phase |
| API rate limiting / API keys for external consumers | Internal application only in MVP |
| SSO (Google/Microsoft) | Email/password auth is sufficient for MVP |
