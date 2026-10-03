import { useCallback, useEffect, useState, type ReactNode } from "react";
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
import {
  requestTypeLabels,
  type EmployeeRequestDetail,
} from "@/lib/types";
import { formatDate } from "./RequestsPage";

const EDITABLE = ["draft", "returned"];
const FINAL = ["approved", "rejected"];

const actionMeta: Record<
  RequestAction,
  { label: string; icon: ReactNode; variant: "primary" | "secondary" | "destructive" }
> = {
  approve: { label: "Approve", icon: <Check size={14} />, variant: "primary" },
  return: { label: "Return", icon: <RotateCcw size={14} />, variant: "secondary" },
  reject: { label: "Reject", icon: <X size={14} />, variant: "destructive" },
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const requestId = Number(id);
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
      setActionError("Couldn't reach the server. Please try again.");
    }
  };

  const onSubmitRequest = async () => {
    if (!data || submitting) return;
    setSubmitting(true);
    setActionError(null);
    try {
      setData(await submitRequest(data.id));
      toast({ variant: "success", title: "Request submitted for approval." });
    } catch (err) {
      fail(err, "Couldn't submit the request.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!data || deleting) return;
    setDeleting(true);
    try {
      await deleteRequest(data.id);
      toast({ variant: "success", title: "Request deleted." });
      navigate("/requests");
    } catch (err) {
      setConfirmDelete(false);
      fail(err, "Couldn't delete the request.");
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
        title: `Request ${decision === "return" ? "returned" : `${decision}d`}.`,
      });
    } finally {
      setDeciding(false);
    }
  };

  if (state === "loading") {
    return (
      <div>
        <PageHeader title="Request" breadcrumb={[{ label: "My requests" }, { label: `#${id}` }]} />
        <LoadingState message="Loading request…" />
      </div>
    );
  }

  if (state === "notfound") {
    return (
      <div>
        <PageHeader title="Request" breadcrumb={[{ label: "My requests" }, { label: `#${id}` }]} />
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="Request not found"
          description="It doesn't exist or isn't visible to you."
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate("/requests")}>
              Back to my requests
            </Button>
          }
        />
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div>
        <PageHeader title="Request" breadcrumb={[{ label: "My requests" }, { label: `#${id}` }]} />
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
        breadcrumb={[{ label: "My requests" }, { label: `#${data.id}` }]}
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
            title="Details"
            action={<Badge variant="brand" size="sm">{requestTypeLabels[data.type]}</Badge>}
          />
          <p className="text-body-sm text-text-primary whitespace-pre-wrap mb-5">
            {data.description}
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 border-t border-divider pt-4">
            <div>
              <dt className="text-overline text-text-muted">Owner</dt>
              <dd className="text-body-sm text-text-primary mt-0.5">
                {data.owner?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-overline text-text-muted">Created</dt>
              <dd className="text-body-sm text-text-primary mt-0.5">{formatDate(data.created_at)}</dd>
            </div>
            <div>
              <dt className="text-overline text-text-muted">Submitted</dt>
              <dd className="text-body-sm text-text-primary mt-0.5">
                {data.submitted_at ? formatDateTime(data.submitted_at) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-overline text-text-muted">Decided</dt>
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
                  Submit
                </Button>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<Pencil size={14} />}
                  onClick={() => navigate(`/requests/${data.id}/edit`)}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  iconLeft={<Trash2 size={14} />}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
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
                    {actionMeta[a].label}
                  </Button>
                ))}
            </div>
          )}

          {isOwner && FINAL.includes(data.status) && (
            <p className="text-caption mt-4 border-t border-divider pt-4">
              This request is {data.status} — that decision is final.
            </p>
          )}
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader title="Timeline" />
          <Timeline history={data.history} />
        </Card>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        title="Delete this request?"
        description="The draft will be permanently removed. This can't be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />

      {/* Approver decision dialog */}
      <DecisionDialog
        open={decision !== null}
        onClose={() => setDecision(null)}
        action={decision ? actionMeta[decision].label : ""}
        subject={data.title}
        commentRequired={decision === "reject" || decision === "return"}
        loading={deciding}
        onSubmit={onDecide}
      />
    </div>
  );
}
