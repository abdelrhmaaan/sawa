import { useTranslation } from "react-i18next";
import {
  FileText,
  Mail,
  MessageCircle,
  Sheet,
} from "lucide-react";

import { Avatar, Badge, Card } from "@/components/ui";

// Brand status colours (FR-005): draft=neutral, submitted=info,
// approved=success, rejected=error, returned=warning.
type MockStatus = "submitted" | "approved" | "returned";
const mockStatusVariant = {
  submitted: "info",
  approved: "success",
  returned: "warning",
} as const;

function MockStatusBadge({ status }: { status: MockStatus }) {
  const { t } = useTranslation();
  return (
    <Badge variant={mockStatusVariant[status]} dot>
      {t(`status.${status}`)}
    </Badge>
  );
}

// Product-UI mock figures: built from real design-system pieces, never images.
// Each is wrapped in a labelled <figure> with the fake content aria-hidden so
// screen readers announce one meaningful description instead of fake data.

export function HeroMock() {
  const { t } = useTranslation();
  return (
    <figure aria-label={t("landing.hero.mockLabel")} className="m-0 max-w-full">
      <div aria-hidden="true" className="max-w-sm">
        <div className="relative">
          <Card padding="md" className="shadow-md pb-14">
          <div className="flex items-start justify-between gap-3 mb-3">
            <Badge variant="brand">{t("requestType.leave")}</Badge>
            <MockStatusBadge status="approved" />
          </div>
          <p className="text-body-sm font-semibold text-text-primary">
            {t("landing.mock.leaveTitle")}
          </p>
          <p className="text-caption mb-3">{t("landing.mock.leaveDates")}</p>
          <div className="flex items-center gap-2 mb-4">
            <Avatar name={t("landing.mock.requester")} size="sm" />
            <span className="text-small text-text-secondary">
              {t("landing.mock.requester")}
            </span>
          </div>

          {/* Vertical timeline: Submitted → Approved */}
          <ol className="relative border-s-2 border-border ps-4 space-y-4">
            <li className="relative">
              <span className="absolute -start-5.5 top-1 w-2.5 h-2.5 rounded-full bg-info" />
              <p className="text-body-sm font-medium text-text-primary">
                {t("status.submitted")}
              </p>
              <p className="text-caption">{t("landing.mock.submittedAt")}</p>
            </li>
            <li className="relative">
              <span className="absolute -start-5.5 top-1 w-2.5 h-2.5 rounded-full bg-success" />
              <p className="text-body-sm font-medium text-text-primary">
                {t("status.approved")}
              </p>
              <p className="text-caption">{t("landing.mock.approvedAt")}</p>
              <p className="text-small text-text-secondary mt-1 bg-surface-alt rounded-md px-2 py-1">
                {t("landing.mock.approvedComment")}
              </p>
            </li>
          </ol>
          </Card>

          {/* Overlapping stat tile — sits on the leave card's bottom-end corner */}
          <Card
            padding="sm"
            className="shadow-md absolute -bottom-5 -end-3 md:-end-8 w-36"
          >
            <p className="text-h2 text-brand-700 leading-none">
              {t("landing.mock.pendingCount")}
            </p>
            <p className="text-caption mt-1">{t("landing.mock.pendingLabel")}</p>
          </Card>
        </div>

        {/* Timesheet row */}
        <Card
          padding="sm"
          className="shadow-sm mt-10 flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-body-sm font-medium text-text-primary">
              {t("landing.mock.timesheetDay")}
            </p>
            <p className="text-caption">{t("landing.mock.timesheetHours")}</p>
          </div>
          <MockStatusBadge status="submitted" />
        </Card>
      </div>
    </figure>
  );
}

export function ChannelsMock() {
  const { t } = useTranslation();
  const channels = [
    { icon: Mail, label: t("landing.shift.email"), rotate: "-rotate-2" },
    { icon: MessageCircle, label: t("landing.shift.chat"), rotate: "rotate-1" },
    { icon: FileText, label: t("landing.shift.paper"), rotate: "-rotate-1" },
    { icon: Sheet, label: t("landing.shift.sheets"), rotate: "rotate-2" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-4 max-w-full overflow-hidden">
      {channels.map(({ icon: Icon, label, rotate }) => (
        <span
          key={label}
          className={`inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-body-sm text-text-secondary shadow-sm ${rotate}`}
        >
          <Icon size={16} className="text-text-muted" />
          {label}
        </span>
      ))}
    </div>
  );
}

export function SawaListMock() {
  const { t } = useTranslation();
  const rows = [
    {
      type: t("requestType.leave"),
      title: t("landing.mock.itemLeave"),
      status: "approved" as MockStatus,
    },
    {
      type: t("requestType.equipment"),
      title: t("landing.mock.itemEquipment"),
      status: "submitted" as MockStatus,
    },
    {
      type: t("requestType.wfh"),
      title: t("landing.mock.itemWfh"),
      status: "returned" as MockStatus,
    },
  ];
  return (
    <Card padding="none" className="w-full max-w-sm shadow-md divide-y divide-divider">
      {rows.map((row) => (
        <div
          key={row.title}
          className="flex items-center justify-between gap-3 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-caption">{row.type}</p>
            <p className="text-body-sm font-medium text-text-primary truncate">
              {row.title}
            </p>
          </div>
          <MockStatusBadge status={row.status} />
        </div>
      ))}
    </Card>
  );
}
