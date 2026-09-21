import { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Download,
  MoreHorizontal,
  Clock,
  Users,
  ClipboardList,
  CheckCircle,
  TrendingUp,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  Button,
  Input,
  SearchInput,
  Select,
  Textarea,
  DateInput,
  FileUpload,
  Checkbox,
  Radio,
  Badge,
  StatusBadge,
  Avatar,
  AvatarGroup,
  Card,
  CardHeader,
  Table,
  Tabs,
  Alert,
  EmptyState,
  LoadingState,
  ErrorState,
  Skeleton,
  Divider,
  StatCard,
  Toggle,
  FormField,
} from "@/components/ui";
import { Modal, Drawer, Dropdown } from "@/components/overlays";
import { useToast } from "@/components/overlays";
import { PageHeader } from "@/shell/Shell";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="mb-5">
        <h2 className="text-h2 text-text-primary">{title}</h2>
        {description && <p className="text-body-sm text-text-secondary mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-body-sm font-semibold text-text-muted uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Preview({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-page border border-border rounded-xl p-5 ${className ?? ""}`}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE TABLE DATA
// ─────────────────────────────────────────────────────────────────────────────

type RequestRow = { name: string; type: string; from: string; to: string; status: string; submitted: string };

const sampleRequests: RequestRow[] = [
  { name: "Layla Hassan",   type: "Annual Leave",    from: "2026-09-15", to: "2026-09-17", status: "approved",  submitted: "Sep 10" },
  { name: "Omar Khalid",   type: "Work From Home",  from: "2026-09-18", to: "2026-09-18", status: "pending",   submitted: "Sep 11" },
  { name: "Nour Saleh",    type: "Sick Leave",      from: "2026-09-12", to: "2026-09-13", status: "returned",  submitted: "Sep 12" },
  { name: "Sara Al-Amin",  type: "Annual Leave",    from: "2026-10-01", to: "2026-10-05", status: "pending",   submitted: "Sep 11" },
  { name: "Yusuf Nasser",  type: "Unpaid Leave",   from: "2026-09-20", to: "2026-09-22", status: "rejected",  submitted: "Sep 09" },
];

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DesignSystem() {
  const { toast } = useToast();

  // Interactive state
  const [tab, setTab] = useState("foundation");
  const [tableTab, setTableTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState("option-a");
  const [toggle, setToggle] = useState(true);
  const [inputError, setInputError] = useState(false);

  const pageTabs = [
    { key: "foundation", label: "Foundation" },
    { key: "components", label: "Components" },
    { key: "feedback",   label: "Feedback" },
    { key: "patterns",   label: "Patterns" },
  ];

  return (
    <div>
      <PageHeader
        title="Design System"
        description="SAWA's visual foundation — Azure direction. All tokens, components, and patterns for building product screens."
        breadcrumb={[{ label: "SAWA" }, { label: "Design System" }]}
      />

      <div className="mb-8">
        <Tabs tabs={pageTabs} active={tab} onChange={setTab} variant="underline" />
      </div>

      {/* ── FOUNDATION ── */}
      {tab === "foundation" && (
        <div>
          {/* Color System */}
          <Section title="Color System" description="The Azure brand palette and semantic colors. Semantic colors are always independent of the brand.">
            <Subsection title="Brand — Azure">
              <Preview>
                <div className="flex gap-2 flex-wrap">
                  {[
                    ["50", "#EFF6FF"],
                    ["100", "#DBEAFE"],
                    ["200", "#BFDBFE"],
                    ["300", "#93C5FD"],
                    ["400", "#60A5FA"],
                    ["500", "#3B82F6"],
                    ["600", "#2563EB"],
                    ["700", "#1D4ED8"],
                    ["800", "#1E40AF"],
                    ["900", "#1E3A8A"],
                  ].map(([shade, hex]) => (
                    <div key={shade} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-10 h-10 rounded-lg border border-black/5"
                        style={{ background: hex }}
                        title={hex}
                      />
                      <span className="text-[10px] font-mono text-text-muted">{shade}</span>
                    </div>
                  ))}
                </div>
              </Preview>
            </Subsection>

            <Subsection title="Semantic Colors">
              <Preview>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Success", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" },
                    { label: "Warning", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
                    { label: "Error",   color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", text: "#991B1B" },
                    { label: "Info",    color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD", text: "#0C4A6E" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border overflow-hidden" style={{ borderColor: s.border }}>
                      <div className="h-8" style={{ background: s.color }} />
                      <div className="p-3" style={{ background: s.bg }}>
                        <p className="text-small font-semibold" style={{ color: s.text }}>{s.label}</p>
                        <p className="text-[10px] font-mono mt-0.5 text-text-muted">{s.color}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Preview>
            </Subsection>

            <Subsection title="Neutral & Surface">
              <Preview>
                <div className="flex gap-3 flex-wrap">
                  {[
                    ["Page",    "#F8FAFC"],
                    ["Surface", "#FFFFFF"],
                    ["Alt",     "#F1F5F9"],
                    ["Border",  "#E2E8F0"],
                    ["Strong",  "#CBD5E1"],
                  ].map(([label, hex]) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-lg border border-border" style={{ background: hex }} />
                      <span className="text-[10px] text-text-muted text-center">{label}</span>
                      <span className="text-[9px] font-mono text-text-muted">{hex}</span>
                    </div>
                  ))}
                  {[
                    ["Primary",   "#0F172A"],
                    ["Secondary", "#475569"],
                    ["Muted",     "#94A3B8"],
                    ["Disabled",  "#CBD5E1"],
                  ].map(([label, hex]) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-lg border border-border" style={{ background: hex }} />
                      <span className="text-[10px] text-text-muted text-center">{label}</span>
                      <span className="text-[9px] font-mono text-text-muted">{hex}</span>
                    </div>
                  ))}
                </div>
              </Preview>
            </Subsection>
          </Section>

          {/* Typography */}
          <Section title="Typography" description="Plus Jakarta Sans across all weights and sizes.">
            <Preview>
              <div className="space-y-5">
                <div><p className="text-overline text-text-muted mb-1">Display — 36px · 800</p>
                  <p className="text-display text-text-primary">Work better, together.</p></div>
                <Divider />
                <div><p className="text-overline text-text-muted mb-1">H1 — 30px · 700</p>
                  <p className="text-h1 text-text-primary">Employee Operations</p></div>
                <div><p className="text-overline text-text-muted mb-1">H2 — 24px · 700</p>
                  <p className="text-h2 text-text-primary">Leave Requests</p></div>
                <div><p className="text-overline text-text-muted mb-1">H3 — 20px · 600</p>
                  <p className="text-h3 text-text-primary">Pending Approvals</p></div>
                <Divider />
                <div><p className="text-overline text-text-muted mb-1">Body — 15px · 400</p>
                  <p className="text-body text-text-primary max-w-lg">SAWA helps teams manage requests, timesheets, and approvals across the organization in one centralized workspace.</p></div>
                <div><p className="text-overline text-text-muted mb-1">Body SM — 14px · 400</p>
                  <p className="text-body-sm text-text-secondary max-w-lg">Request submitted on September 12, 2026. Pending manager approval.</p></div>
                <div><p className="text-overline text-text-muted mb-1">Small — 13px · 400</p>
                  <p className="text-small text-text-secondary">Last updated 2 hours ago</p></div>
                <div><p className="text-overline text-text-muted mb-1">Caption — 12px · 400</p>
                  <p className="text-caption">Submitted by Layla Hassan · HR Department</p></div>
                <div><p className="text-overline text-text-muted mb-1">Label — 12px · 600</p>
                  <p className="text-label text-text-primary">Request Type</p></div>
                <div><p className="text-overline text-text-muted mb-1">Overline — 11px · 700 · CAPS</p>
                  <p className="text-overline text-text-muted">Employee Name</p></div>
              </div>
            </Preview>
          </Section>

          {/* Spacing & Radius & Shadow */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div>
              <h2 className="text-h2 text-text-primary mb-1">Spacing</h2>
              <p className="text-body-sm text-text-secondary mb-5">4px base scale</p>
              <Preview>
                <div className="space-y-3">
                  {[["1", "4px"], ["2", "8px"], ["3", "12px"], ["4", "16px"], ["5", "20px"], ["6", "24px"], ["8", "32px"], ["10", "40px"], ["12", "48px"], ["16", "64px"]].map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="bg-brand-200 rounded" style={{ width: val, height: 16, minWidth: 4 }} />
                      <span className="text-caption font-mono">{val}</span>
                    </div>
                  ))}
                </div>
              </Preview>
            </div>
            <div>
              <h2 className="text-h2 text-text-primary mb-1">Radius</h2>
              <p className="text-body-sm text-text-secondary mb-5">Friendly, not bubbly</p>
              <Preview>
                <div className="space-y-4">
                  {[
                    ["xs · 4px",  "rounded", 4],
                    ["sm · 6px",  "rounded-sm", 6],
                    ["md · 8px",  "rounded-md", 8],
                    ["lg · 12px", "rounded-lg", 12],
                    ["xl · 16px", "rounded-xl", 16],
                    ["2xl · 20px","rounded-2xl", 20],
                    ["full",      "rounded-full", 999],
                  ].map(([label, , r]) => (
                    <div key={String(label)} className="flex items-center gap-3">
                      <div
                        className="w-12 h-8 bg-brand-100 border border-brand-200 shrink-0"
                        style={{ borderRadius: r }}
                      />
                      <span className="text-caption font-mono">{label}</span>
                    </div>
                  ))}
                </div>
              </Preview>
            </div>
            <div>
              <h2 className="text-h2 text-text-primary mb-1">Elevation</h2>
              <p className="text-body-sm text-text-secondary mb-5">Minimal shadow system</p>
              <Preview className="space-y-4">
                {[
                  ["xs", "0 1px 2px rgb(0 0 0 / 0.05)"],
                  ["sm", "0 1px 3px rgb(0 0 0 / 0.08)"],
                  ["md", "0 4px 12px rgb(0 0 0 / 0.08)"],
                  ["lg", "0 8px 24px rgb(0 0 0 / 0.10)"],
                  ["xl", "0 16px 48px rgb(0 0 0 / 0.12)"],
                ].map(([label, shadow]) => (
                  <div
                    key={label}
                    className="h-12 bg-white rounded-lg flex items-center px-4"
                    style={{ boxShadow: shadow }}
                  >
                    <span className="text-small text-text-muted font-mono">shadow-{label}</span>
                  </div>
                ))}
              </Preview>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPONENTS ── */}
      {tab === "components" && (
        <div>
          {/* Buttons */}
          <Section title="Buttons" description="Four variants × three sizes. All support loading and icon states.">
            <Subsection title="Variants">
              <Preview className="flex flex-wrap gap-3">
                <Button variant="primary">Submit Request</Button>
                <Button variant="secondary">View Details</Button>
                <Button variant="tertiary">Cancel</Button>
                <Button variant="destructive">Delete</Button>
              </Preview>
            </Subsection>
            <Subsection title="Sizes">
              <Preview className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </Preview>
            </Subsection>
            <Subsection title="States">
              <Preview className="flex flex-wrap gap-3">
                <Button variant="primary" loading>Submitting…</Button>
                <Button variant="primary" disabled>Disabled</Button>
                <Button variant="primary" iconLeft={<Plus size={15} />}>New Request</Button>
                <Button variant="secondary" iconLeft={<Download size={15} />}>Export</Button>
                <Button variant="destructive" iconLeft={<Trash2 size={15} />}>Delete</Button>
              </Preview>
            </Subsection>
          </Section>

          {/* Form Inputs */}
          <Section title="Form Controls" description="Inputs, selects, checkboxes, radios, and more — all with consistent states.">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card>
                <Subsection title="Text Input">
                  <div className="space-y-4">
                    <Input label="Full Name" placeholder="e.g. Layla Hassan" />
                    <Input label="Email" placeholder="layla@company.com" hint="We'll never share your email." />
                    <Input label="Search" placeholder="Search requests…" iconLeft={<Search size={14} />} />
                    <Input label="With Error" placeholder="Enter value" error="This field is required." value="" onChange={() => {}} />
                    <Input label="Disabled" placeholder="Not editable" disabled />
                  </div>
                </Subsection>
              </Card>
              <Card>
                <Subsection title="Select & Textarea">
                  <div className="space-y-4">
                    <Select label="Request Type" placeholder="Choose type…">
                      <option>Annual Leave</option>
                      <option>Sick Leave</option>
                      <option>Work From Home</option>
                      <option>Unpaid Leave</option>
                    </Select>
                    <DateInput label="Start Date" />
                    <Textarea label="Reason" placeholder="Briefly describe your request…" hint="Optional. Visible to your manager." />
                  </div>
                </Subsection>
              </Card>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <Subsection title="Checkbox & Radio">
                  <div className="space-y-3 mb-5">
                    <Checkbox label="Annual Leave" checked={checked} onChange={setChecked} />
                    <Checkbox label="Sick Leave" defaultChecked />
                    <Checkbox label="Disabled option" disabled />
                    <Checkbox label="With hint" hint="Requires medical documentation" />
                  </div>
                  <Divider className="mb-4" />
                  <div className="space-y-3">
                    <Radio name="leave" value="option-a" label="Full Day" checked={radio === "option-a"} onChange={setRadio} />
                    <Radio name="leave" value="option-b" label="Half Day (AM)" checked={radio === "option-b"} onChange={setRadio} />
                    <Radio name="leave" value="option-c" label="Half Day (PM)" checked={radio === "option-c"} onChange={setRadio} />
                    <Radio name="leave" value="option-d" label="Disabled" disabled checked={false} onChange={() => {}} />
                  </div>
                </Subsection>
                <Subsection title="Toggle">
                  <div className="space-y-3">
                    <Toggle checked={toggle} onChange={setToggle} label="Email notifications" />
                    <Toggle checked={false} onChange={() => {}} label="SMS alerts" />
                    <Toggle checked={true} onChange={() => {}} label="Disabled" disabled />
                  </div>
                </Subsection>
              </Card>
              <Card>
                <Subsection title="File Upload">
                  <FileUpload
                    label="Attachment"
                    hint="PDF, DOC, PNG up to 10MB"
                    accept=".pdf,.doc,.docx,.png,.jpg"
                  />
                </Subsection>
              </Card>
            </div>
          </Section>

          {/* Badges & Avatars */}
          <Section title="Badges & Avatars">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Badges" />
                <Subsection title="Variants">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="brand">Brand</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="info">Info</Badge>
                    <Badge variant="neutral">Neutral</Badge>
                    <Badge variant="default">Default</Badge>
                  </div>
                </Subsection>
                <Subsection title="With dot">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success" dot>Active</Badge>
                    <Badge variant="warning" dot>Pending</Badge>
                    <Badge variant="error" dot>Overdue</Badge>
                  </div>
                </Subsection>
                <Subsection title="Status Badges">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status="draft" />
                    <StatusBadge status="pending" />
                    <StatusBadge status="approved" />
                    <StatusBadge status="rejected" />
                    <StatusBadge status="returned" />
                    <StatusBadge status="active" />
                    <StatusBadge status="inactive" />
                  </div>
                </Subsection>
              </Card>
              <Card>
                <CardHeader title="Avatars" />
                <Subsection title="Sizes">
                  <div className="flex items-end gap-3">
                    <Avatar name="Layla Hassan" size="xs" />
                    <Avatar name="Omar Khalid" size="sm" />
                    <Avatar name="Nour Saleh" size="md" />
                    <Avatar name="Sara Al-Amin" size="lg" />
                    <Avatar name="Yusuf Nasser" size="xl" />
                  </div>
                </Subsection>
                <Subsection title="Color assignment">
                  <div className="flex gap-2 flex-wrap">
                    {["Layla Hassan", "Omar Khalid", "Nour Saleh", "Sara Al-Amin", "Yusuf Nasser", "Hana Bakr", "Rima Faris"].map((n) => (
                      <Avatar key={n} name={n} size="md" />
                    ))}
                  </div>
                </Subsection>
                <Subsection title="Avatar Group">
                  <AvatarGroup names={["Layla Hassan", "Omar Khalid", "Nour Saleh", "Sara Al-Amin", "Yusuf Nasser", "Hana Bakr"]} max={4} />
                </Subsection>
              </Card>
            </div>
          </Section>

          {/* Tabs */}
          <Section title="Tabs">
            <div className="space-y-6">
              <Card>
                <Subsection title="Underline variant">
                  <Tabs
                    tabs={[
                      { key: "all", label: "All Requests", count: 24 },
                      { key: "pending", label: "Pending", count: 5 },
                      { key: "approved", label: "Approved", count: 18 },
                      { key: "rejected", label: "Rejected", count: 1 },
                    ]}
                    active={tableTab}
                    onChange={setTableTab}
                    variant="underline"
                  />
                </Subsection>
                <Subsection title="Pills variant">
                  <Tabs
                    tabs={[
                      { key: "week", label: "This week" },
                      { key: "month", label: "This month" },
                      { key: "quarter", label: "Quarter" },
                    ]}
                    active="month"
                    onChange={() => {}}
                    variant="pills"
                  />
                </Subsection>
              </Card>
            </div>
          </Section>

          {/* Table */}
          <Section title="Table" description="Responsive data table with status rendering and row interaction.">
            <Table<RequestRow>
              columns={[
                {
                  key: "name", header: "Employee",
                  render: (r) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.name} size="sm" />
                      <span className="font-medium">{r.name}</span>
                    </div>
                  ),
                },
                { key: "type", header: "Type" },
                {
                  key: "from", header: "Period",
                  render: (r) => <span className="text-text-muted">{r.from} → {r.to}</span>,
                },
                { key: "submitted", header: "Submitted", align: "center" },
                {
                  key: "status", header: "Status", align: "center",
                  render: (r) => <StatusBadge status={r.status as "approved" | "pending" | "returned" | "rejected"} />,
                },
                {
                  key: "actions", header: "", align: "right", width: "40px",
                  render: () => (
                    <Dropdown
                      trigger={
                        <button className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:bg-surface-alt hover:text-text-secondary transition-colors">
                          <MoreHorizontal size={15} />
                        </button>
                      }
                      items={[
                        { key: "view",    label: "View",    icon: <FileText size={14} /> },
                        { key: "edit",    label: "Edit",    icon: <Edit size={14} /> },
                        { key: "divider", label: "", divider: true },
                        { key: "delete",  label: "Delete",  icon: <Trash2 size={14} />, destructive: true },
                      ]}
                      onSelect={() => {}}
                    />
                  ),
                },
              ]}
              data={sampleRequests}
              onRowClick={() => {}}
            />
          </Section>

          {/* Overlays */}
          <Section title="Overlays" description="Modal and Drawer with configurable sizes and footer slots.">
            <Preview className="flex gap-3">
              <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
              <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
            </Preview>

            <Modal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Submit Leave Request"
              description="Your request will be sent to your manager for approval."
              footer={
                <>
                  <Button variant="tertiary" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button onClick={() => { setModalOpen(false); toast({ variant: "success", title: "Request submitted", description: "Layla Hassan · Annual Leave" }); }}>
                    Submit Request
                  </Button>
                </>
              }
            >
              <div className="space-y-4">
                <Select label="Request Type" placeholder="Choose type…">
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Work From Home</option>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <DateInput label="Start Date" />
                  <DateInput label="End Date" />
                </div>
                <Textarea label="Reason" placeholder="Optional reason…" />
              </div>
            </Modal>

            <Drawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              title="Request Details"
              description="REQ-2026-0041 · Annual Leave"
              footer={
                <>
                  <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Return</Button>
                  <Button onClick={() => { setDrawerOpen(false); toast({ variant: "success", title: "Request approved" }); }}>
                    Approve
                  </Button>
                </>
              }
            >
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <Avatar name="Layla Hassan" size="lg" />
                  <div>
                    <p className="font-semibold text-text-primary">Layla Hassan</p>
                    <p className="text-body-sm text-text-secondary">HR Department · Employee</p>
                  </div>
                </div>
                <Divider />
                {[
                  ["Type", "Annual Leave"],
                  ["Period", "Sep 15–17, 2026 (3 days)"],
                  ["Submitted", "September 10, 2026"],
                  ["Status", "Pending approval"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-label text-text-muted mb-0.5">{label}</p>
                    <p className="text-body-sm text-text-primary font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </Drawer>
          </Section>

          {/* Dropdown */}
          <Section title="Dropdown Menu">
            <Preview>
              <Dropdown
                trigger={<Button variant="secondary" iconRight={<ChevronDown size={14} />}>Actions</Button>}
                items={[
                  { key: "approve", label: "Approve", icon: <CheckCircle size={14} /> },
                  { key: "edit",    label: "Edit",    icon: <Edit size={14} /> },
                  { key: "divider", label: "", divider: true },
                  { key: "delete",  label: "Delete",  icon: <Trash2 size={14} />, destructive: true },
                ]}
                onSelect={() => {}}
              />
            </Preview>
          </Section>
        </div>
      )}

      {/* ── FEEDBACK ── */}
      {tab === "feedback" && (
        <div>
          <Section title="Alerts" description="Inline status messaging for forms, pages, and workflow states.">
            <div className="space-y-3">
              <Alert variant="info" title="Timesheet period opens September 15">
                You can submit your hours for the week of Sep 15–21 starting Monday.
              </Alert>
              <Alert variant="success" title="Request approved">
                Your annual leave request (Sep 15–17) has been approved by Omar Khalid.
              </Alert>
              <Alert variant="warning" title="Timesheet overdue">
                Your timesheet for Sep 1–7 is due today. Submit before end of day to avoid escalation.
              </Alert>
              <Alert variant="error" title="Submission failed" onDismiss={() => {}}>
                We couldn't process your request. Please check your connection and try again.
              </Alert>
            </div>
          </Section>

          <Section title="Toast Notifications" description="Transient feedback triggered by user actions.">
            <Preview className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => toast({ variant: "success", title: "Request submitted", description: "Annual Leave · Sep 15–17" })}>
                Success toast
              </Button>
              <Button variant="secondary" onClick={() => toast({ variant: "error", title: "Submission failed", description: "Please try again." })}>
                Error toast
              </Button>
              <Button variant="tertiary" onClick={() => toast({ variant: "warning", title: "Timesheet overdue", description: "Submit before end of day." })}>
                Warning toast
              </Button>
              <Button variant="tertiary" onClick={() => toast({ variant: "info", title: "Manager notified", description: "Omar Khalid has been notified." })}>
                Info toast
              </Button>
            </Preview>
          </Section>

          <Section title="Stat Cards (KPI tiles)" description="Used on dashboards and overview screens.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Pending Requests" value="12" delta="↑ 3 since last week" deltaType="up" icon={<ClipboardList size={18} />} />
              <StatCard label="Hours Logged" value="148h" delta="↓ 4h vs last period" deltaType="down" icon={<Clock size={18} />} />
              <StatCard label="Team Members" value="24" icon={<Users size={18} />} />
              <StatCard label="Approval Rate" value="94%" delta="↑ 2% this month" deltaType="up" icon={<TrendingUp size={18} />} />
            </div>
          </Section>
        </div>
      )}

      {/* ── PATTERNS ── */}
      {tab === "patterns" && (
        <div>
          <Section title="Empty State" description="Contextual empty states for lists, searches, and first-use moments.">
            <div className="grid md:grid-cols-2 gap-6">
              <Card padding="none">
                <EmptyState
                  icon={<ClipboardList size={22} />}
                  title="No requests yet"
                  description="You haven't submitted any leave or permission requests. Create your first request to get started."
                  action={<Button iconLeft={<Plus size={15} />}>New Request</Button>}
                />
              </Card>
              <Card padding="none">
                <EmptyState
                  icon={<Search size={22} />}
                  title="No results found"
                  description="No requests match your current filters. Try adjusting your search or date range."
                  action={<Button variant="secondary">Clear filters</Button>}
                />
              </Card>
            </div>
          </Section>

          <Section title="Loading State">
            <div className="grid md:grid-cols-2 gap-6">
              <Card padding="none">
                <LoadingState message="Loading requests…" />
              </Card>
              <Card>
                <CardHeader title="Skeleton loading" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2.5 w-1/2" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Section>

          <Section title="Error State">
            <div className="grid md:grid-cols-2 gap-6">
              <Card padding="none">
                <ErrorState
                  onRetry={() => toast({ variant: "info", title: "Retrying…" })}
                />
              </Card>
              <Card padding="none">
                <ErrorState
                  title="Access denied"
                  description="You don't have permission to view this content. Contact your HR administrator."
                />
              </Card>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

