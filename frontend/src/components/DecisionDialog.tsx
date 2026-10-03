import { useEffect, useState } from "react";

import { Alert, Button, Textarea } from "@/components/ui";
import { Modal } from "@/components/overlays";
import { ApiError } from "@/lib/api";

interface DecisionDialogProps {
  open: boolean;
  onClose: () => void;
  /** Verb shown in the title/button, e.g. "Approve", "Reject", "Return". */
  action: string;
  /** What is being decided, e.g. a request title — shown in the description. */
  subject?: string;
  commentRequired?: boolean;
  loading?: boolean;
  /** Receives the comment; should perform the API call. Throw to stay open. */
  onSubmit: (comment: string) => Promise<void>;
}

/**
 * Modal that collects an optional/required comment before an approval-flow
 * action. Client-enforces the comment for reject/return (the API also 400s).
 */
export function DecisionDialog({
  open,
  onClose,
  action,
  subject,
  commentRequired,
  loading,
  onSubmit,
}: DecisionDialogProps) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Reset whenever the dialog is reopened for a different action/item.
  useEffect(() => {
    if (open) {
      setComment("");
      setError(null);
      setCommentError(null);
    }
  }, [open, action]);

  const submit = async () => {
    const trimmed = comment.trim();
    if (commentRequired && !trimmed) {
      setCommentError("A comment is required.");
      return;
    }
    setError(null);
    setCommentError(null);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors?.comment) setCommentError(err.fieldErrors.comment[0]);
        else if (err.fieldErrors?.detail) setError(err.fieldErrors.detail[0]);
        else setError(err.detail ?? "The action couldn't be completed.");
      } else {
        setError("Couldn't reach the server. Please try again.");
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${action}${subject ? ` — ${subject}` : ""}`}
      description={
        commentRequired
          ? "Explain your decision — the comment is required and shown to the owner."
          : "Optionally add a comment for the owner."
      }
      size="sm"
      footer={
        <>
          <Button variant="tertiary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={action === "Reject" ? "destructive" : "primary"}
            onClick={submit}
            loading={loading}
            disabled={commentRequired && !comment.trim()}
          >
            {action}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" className="mb-3" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Textarea
        label={commentRequired ? "Comment" : "Comment (optional)"}
        rows={3}
        maxLength={2000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        error={commentError ?? undefined}
        autoFocus
      />
    </Modal>
  );
}
