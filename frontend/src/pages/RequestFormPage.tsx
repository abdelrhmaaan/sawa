import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
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
  type EmployeeRequestDetail,
  type RequestType,
} from "@/lib/types";

const typeValues: RequestType[] = [
  "leave",
  "equipment",
  "wfh",
  "hr_service",
  "general",
];

const EDITABLE = ["draft", "returned"];

export default function RequestFormPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const { t } = useTranslation();
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
        title: editId ? t("requests.updatedToast") : t("requests.createdToast"),
        description: editId
          ? undefined
          : t("requests.createdToastDescription"),
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
          setError(err.detail ?? t("requests.saveError"));
        }
      } else {
        setError(t("common.networkError"));
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
          <PageHeader title={t("requests.editTitle")} />
          <LoadingState message={t("requests.loadingRequest")} />
        </div>
      );
    }
    if (loadState === "notfound") {
      return (
        <div className="max-w-xl">
          <PageHeader title={t("requests.editTitle")} />
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
    if (loadState === "error") {
      return (
        <div className="max-w-xl">
          <PageHeader title={t("requests.editTitle")} />
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
          <PageHeader title={t("requests.editTitle")} />
          <Card>
            <Alert variant="info" title={t("requests.readOnlyTitle")}>
              {loaded && loaded.owner?.id !== user?.id
                ? t("requests.readOnlyOwner")
                : t("requests.readOnlyStatus", { status: loaded?.status ?? "" })}
            </Alert>
            <div className="flex gap-2 mt-4">
              <Link to={loaded ? `/requests/${loaded.id}` : "/requests"}>
                <Button size="sm" variant="secondary">
                  {loaded ? t("requests.viewRequest") : t("requests.backToRequests")}
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
        title={editId ? t("requests.editTitle") : t("requests.newTitle")}
        description={
          editId
            ? t("requests.editDescription")
            : t("requests.newDescription")
        }
        breadcrumb={
          editId
            ? [{ label: t("requests.breadcrumbMyRequests") }, { label: t("requests.breadcrumbRequest", { id: editId }) }, { label: t("requests.breadcrumbEdit") }]
            : [{ label: t("requests.breadcrumbMyRequests") }, { label: t("requests.newTitle") }]
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
            label={t("requests.typeLabel")}
            required
            value={type}
            onChange={(e) => setType(e.target.value as RequestType)}
            error={fieldErrors.type}
          >
            {typeValues.map((v) => (
              <option key={v} value={v}>
                {t(`requestType.${v}`)}
              </option>
            ))}
          </Select>
          <Input
            dir="auto"
            label={t("requests.titleLabel")}
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={fieldErrors.title}
            hint={t("requests.titleHint")}
          />
          <Textarea
            dir="auto"
            label={t("requests.descriptionLabel")}
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={fieldErrors.description}
            hint={t("requests.descriptionHint")}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="tertiary"
              onClick={() =>
                navigate(editId ? `/requests/${editId}` : "/requests")
              }
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={saving}>
              {editId ? t("common.saveChanges") : t("requests.createDraft")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
