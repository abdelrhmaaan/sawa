import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ClipboardList } from "lucide-react";

import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/overlays";
import { PageHeader } from "@/shell/Shell";
import {
  ApiError,
  createRequest,
  getRequest,
  updateRequest,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  requestTypeLabels,
  type EmployeeRequestDetail,
  type RequestType,
} from "@/lib/types";

const EDITABLE = ["draft", "returned"];

export default function RequestFormPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loaded, setLoaded] = useState<EmployeeRequestDetail | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "notfound" | "error">(
    editId ? "loading" : "ok"
  );

  const [type, setType] = useState<RequestType>("general");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!editId) return;
    setLoadState("loading");
    try {
      const req = await getRequest(editId);
      setLoaded(req);
      setType(req.type);
      setTitle(req.title);
      setDescription(req.description);
      setLoadState("ok");
    } catch (err) {
      setLoadState(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
    }
  }, [editId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setFieldErrors({});
    setSaving(true);
    try {
      const body = { type, title: title.trim(), description: description.trim() };
      const saved = editId
        ? await updateRequest(editId, body)
        : await createRequest(body);
      toast({
        variant: "success",
        title: editId ? "Request updated." : "Request created.",
        description: editId
          ? undefined
          : "It's saved as a draft — submit it when you're ready.",
      });
      navigate(`/requests/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.fieldErrors)) flat[k] = v[0];
          setFieldErrors(flat);
          if (flat.detail) setError(flat.detail);
        } else {
          setError(err.detail ?? "Couldn't save the request. Please try again.");
        }
      } else {
        setError("Couldn't reach the server. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Edit-mode loading / not-found / read-only guards ──
  if (editId) {
    if (loadState === "loading") {
      return (
        <div className="max-w-xl">
          <PageHeader title="Edit request" />
          <LoadingState message="Loading request…" />
        </div>
      );
    }
    if (loadState === "notfound") {
      return (
        <div className="max-w-xl">
          <PageHeader title="Edit request" />
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
    if (loadState === "error") {
      return (
        <div className="max-w-xl">
          <PageHeader title="Edit request" />
          <ErrorState onRetry={load} />
        </div>
      );
    }
    const notEditable =
      !loaded ||
      !EDITABLE.includes(loaded.status) ||
      loaded.owner?.id !== user?.id;
    if (notEditable) {
      return (
        <div className="max-w-xl">
          <PageHeader title="Edit request" />
          <Card>
            <Alert variant="info" title="This request is read-only">
              {loaded && loaded.owner?.id !== user?.id
                ? "You can only edit your own requests."
                : `Requests in "${loaded?.status ?? ""}" status can't be edited.`}
            </Alert>
            <div className="flex gap-2 mt-4">
              <Link to={loaded ? `/requests/${loaded.id}` : "/requests"}>
                <Button size="sm" variant="secondary">
                  {loaded ? "View request" : "Back to my requests"}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title={editId ? "Edit request" : "New request"}
        description={
          editId
            ? "Update the details — you can resubmit afterwards."
            : "Saved as a draft. Nothing is sent to your approver until you submit."
        }
        breadcrumb={
          editId
            ? [{ label: "My requests" }, { label: `Request #${editId}` }, { label: "Edit" }]
            : [{ label: "My requests" }, { label: "New request" }]
        }
      />

      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <Alert variant="error" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Select
            label="Type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as RequestType)}
            error={fieldErrors.type}
          >
            {Object.entries(requestTypeLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Input
            label="Title"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={fieldErrors.title}
            hint="Keep it short — 200 characters max."
          />
          <Textarea
            label="Description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={fieldErrors.description}
            hint="What do you need, when, and why? The more context, the faster the decision."
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="tertiary"
              onClick={() =>
                navigate(editId ? `/requests/${editId}` : "/requests")
              }
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editId ? "Save changes" : "Create draft"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
