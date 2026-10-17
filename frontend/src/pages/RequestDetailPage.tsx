import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import {
  Check,
  ClipboardList,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/ui";
import { ConfirmDialog, useToast } from "@/components/overlays";
import { DecisionDialog } from "@/components/DecisionDialog";
import { Timeline, formatDateTime } from "@/components/Timeline";
import { PageHeader } from "@/shell/Shell";
import {
  ApiError,
  decideRequest,
  deleteRequest,
  getRequest,
  submitRequest,
  type RequestAction,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { EmployeeRequestDetail } from "@/lib/types";
import { formatDate } from "./RequestsPage";

const EDITABLE = ["draft", "returned"];
const FINAL = ["approved", "rejected"];

const decisionToastKeys = {
  approve: "requests.decidedApproved",
  reject: "requests.decidedRejected",
  return: "requests.decidedReturned",
} as const;

const actionMeta: Record<
  RequestAction,
  { key: "common.approve" | "common.return" | "common.reject"; icon: ReactNode; variant: "primary" | "secondary" | "destructive" }
> = {
  approve: { key: "common.approve", icon: <Check size={14} />, variant: "primary" },
  return: { key: "common.return", icon: <RotateCcw size={14} />, variant: "secondary" },
  reject: { key: "common.reject", icon: <X size={14} />, variant: "destructive" },
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const requestId = Number(id);
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<EmployeeRequestDetail | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [actionError, setActionError] = useState<string | null>(null);

  const [decision, setDecision] = useState<RequestAction | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      setData(await getRequest(requestId));
      setState("ok");
    } catch (err) {
      setState(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
    }
  }, [requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const fail = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      setActionError(
        err.detail ?? err.fieldErrors?.detail?.[0] ?? fallback
      );
    } else {
      setActionError(t("common.networkError"));
    }
  };

  const onSubmitRequest = async () => {
    if (!data || submitting) return;
    setSubmitting(true);
    setActionError(null);
    try {
      setData(await submitRequest(data.id));
      toast({ variant: "success", title: t("requests.submittedToast") });
    } catch (err) {
      fail(err, t("requests.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!data || deleting) return;
    setDeleting(true);
    try {
      await deleteRequest(data.id);
      toast({ variant: "success", title: t("requests.deletedToast") });
      navigate("/requests");
    } catch (err) {
      setConfirmDelete(false);
      fail(err, t("requests.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  const onDecide = async (comment: string) => {
    if (!data || !decision) return;
    setDeciding(true);
    try {
      setData(await decideRequest(data.id, decision, comment));
      toast({
        variant: "success",
        title: t(decisionToastKeys[decision]),
      });
    } finally {
      setDeciding(false);
    }
  };

  if (state === "loading") {
    return (
      <div>
        <PageHeader title={t("requests.detailTitle")} breadcrumb={[{ label: t("requests.breadcrumbMyRequests") }, { label: `#${id}` }]} />
        <LoadingState message={t("requests.loadingRequest")} />
      </div>
    );
  }

  if (state === "notfound") {
    return (
      <div>
        <PageHeader title={t("requests.detailTitle")} breadcrumb={[{ label: t("requests.breadcrumbMyRequests") }, { label: `#${id}` }]} />
        <EmptyState
          icon={<ClipboardList size={22} />}
          title={t("requests.notFoundTitle")}
          description={t("requests.notFoundDescription")}
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate("/requests")}>
              {t("requests.backToRequests")}
            </Button>
          }
        />
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div>
        <PageHeader title={t("requests.detailTitle")} breadcrumb={[{ label: t("requests.breadcrumbMyRequests") }, { label: `#${id}` }]} />
        <ErrorState onRetry={load} />
      </div>
    );
  }

  const isOwner = data.owner?.id === user?.id;
  const canEdit = isOwner && EDITABLE.includes(data.status);
  const canDelete = isOwner && data.status === "draft"; // API allows delete on drafts only
  const canSubmit = isOwner && EDITABLE.includes(data.status);
  const isApprover =
    (user?.role === "manager" || user?.role === "hr") &&
    !isOwner &&
    data.status === "submitted";

  return (
    <div>
      <PageHeader
        title={data.title}
        breadcrumb={[{ label: t("requests.breadcrumbMyRequests") }, { label: `#${data.id}` }]}
        action={<StatusBadge status={data.status} />}
      />

      {actionError && (
        <Alert variant="error" className="mb-4" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={t("requests.details")}
            action={<Badge variant="brand" size="sm">{t(`requestType.${data.type}`)}</Badge>}
          />
          <p className="text-body-sm text-text-primary whitespace-pre-wrap mb-5" dir="auto">
            {data.description}
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 border-t border-divider pt-4">
            <div>
              <dt className="text-overline text-text-muted">{t("requests.ownerLabel")}</dt>
              <dd className="text-body-sm text-text-primary mt-0.5">
                {data.owner?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-overline text-text-muted">{t("requests.createdLabel")}</dt>
              <dd className="text-body-sm text-text-primary mt-0.5">{formatDate(data.created_at)}</dd>
            </div>
            <div>
              <dt className="text-overline text-text-muted">{t("requests.submittedLabel")}</dt>
              <dd className="text-body-sm text-text-primary mt-0.5">
                {data.submitted_at ? formatDateTime(data.submitted_at) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-overline text-text-muted">{t("requests.decidedLabel")}</dt>
              <dd className="text-body-sm text-text-primary mt-0.5">
                {data.decided_at ? formatDateTime(data.decided_at) : "—"}
              </dd>
            </div>
          </dl>

          {/* Actions */}
          {(canEdit || canSubmit || canDelete || isApprover) && (
            <div className="flex flex-wrap gap-2 border-t border-divider mt-5 pt-4">
              {canSubmit && (
                <Button
                  size="sm"
                  iconLeft={<Send size={14} />}
                  onClick={onSubmitRequest}
                  loading={submitting}
                >
                  {t("common.submit")}
                </Button>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<Pencil size={14} />}
                  onClick={() => navigate(`/requests/${data.id}/edit`)}
                >
                  {t("common.edit")}
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  iconLeft={<Trash2 size={14} />}
                  onClick={() => setConfirmDelete(true)}
                >
                  {t("common.delete")}
                </Button>
              )}
              {isApprover &&
                (Object.keys(actionMeta) as RequestAction[]).map((a) => (
                  <Button
                    key={a}
                    size="sm"
                    variant={actionMeta[a].variant}
                    iconLeft={actionMeta[a].icon}
                    onClick={() => setDecision(a)}
                  >
                    {t(actionMeta[a].key)}
                  </Button>
                ))}
            </div>
          )}

          {isOwner && FINAL.includes(data.status) && (
            <p className="text-caption mt-4 border-t border-divider pt-4">
              {t("requests.finalNote", { status: t(`status.${data.status}`) })}
            </p>
          )}
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader title={t("requests.timeline")} />
          <Timeline history={data.history} />
        </Card>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        title={t("requests.deleteTitle")}
        description={t("requests.deleteDescription")}
        confirmLabel={t("common.delete")}
        destructive
        loading={deleting}
      />

      {/* Approver decision dialog */}
      <DecisionDialog
        open={decision !== null}
        onClose={() => setDecision(null)}
        action={decision ? t(actionMeta[decision].key) : ""}
        subject={data.title}
        commentRequired={decision === "reject" || decision === "return"}
        loading={deciding}
        onSubmit={onDecide}
      />
    </div>
  );
}
