import { useEffect, useState, type FormEvent } from "react";

import {
  Alert,
  Button,
  DateInput,
  Input,
  Textarea,
} from "@/components/ui";
import { Modal, useToast } from "@/components/overlays";
import {
  ApiError,
  createTimesheetEntry,
  updateTimesheetEntry,
} from "@/lib/api";
import type { TimesheetEntry } from "@/lib/types";

interface TimesheetEntryFormProps {
  open: boolean;
  onClose: () => void;
  /** The entry being edited — null/undefined means "new entry". */
  entry?: TimesheetEntry | null;
  onSaved: () => void;
}

function toMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function previewHours(start: string, end: string): string | null {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null || e <= s) return null;
  return ((e - s) / 60).toFixed(2);
}

function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function TimesheetEntryForm({
  open,
  onClose,
  entry,
  onSaved,
}: TimesheetEntryFormProps) {
  const { toast } = useToast();

  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // (Re)initialise the fields every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setDate(entry?.date ?? todayIso());
    setStart(entry?.start_time?.slice(0, 5) ?? "");
    setEnd(entry?.end_time?.slice(0, 5) ?? "");
    setNote(entry?.note ?? "");
    setFieldErrors({});
    setError(null);
  }, [open, entry]);

  const hours = previewHours(start, end);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setFieldErrors({});
    setSaving(true);
    try {
      const body = { date, start_time: start, end_time: end, note: note.trim() };
      if (entry) {
        await updateTimesheetEntry(entry.id, body);
      } else {
        await createTimesheetEntry(body);
      }
      toast({
        variant: "success",
        title: entry ? "Entry updated." : "Time logged.",
        description: entry ? undefined : "Saved as a draft — submit it when ready.",
      });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.fieldErrors)) flat[k] = v[0];
          setFieldErrors(flat);
          if (flat.detail) setError(flat.detail);
        } else {
          setError(err.detail ?? "Couldn't save the entry. Please try again.");
        }
      } else {
        setError("Couldn't reach the server. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? "Edit time entry" : "Log time"}
      description={
        entry
          ? "Adjust the entry — hours are recalculated on save."
          : "Pick a date and a time range. Hours are computed for you."
      }
      size="sm"
      footer={
        <>
          <Button variant="tertiary" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSubmit} loading={saving}>
            {entry ? "Save changes" : "Save entry"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <DateInput
          label="Date"
          required
          max={todayIso()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={fieldErrors.date}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start"
            type="time"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
            error={fieldErrors.start_time}
          />
          <Input
            label="End"
            type="time"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            error={fieldErrors.end_time}
          />
        </div>
        {/* Live hours preview — the server still computes the stored value */}
        <p
          className={
            hours
              ? "text-body-sm font-semibold text-text-primary"
              : "text-caption"
          }
        >
          {hours
            ? `${hours} hours`
            : start && end
              ? "End time must be after start time."
              : "Enter a start and end time to see the hours."}
        </p>
        <Textarea
          label="Note"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={fieldErrors.note}
          hint="What did you work on? 500 characters max."
        />
        {/* Visually-hidden submit so Enter works inside the form */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
