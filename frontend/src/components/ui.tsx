import {
  forwardRef,
  useState,
  useRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  type ChangeEvent,
} from "react";
import { Loader2, Upload, Check, ChevronDown, AlertCircle, CheckCircle, Info, AlertTriangle, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-600 shadow-xs",
  secondary:
    "bg-white text-brand-600 border border-brand-600 hover:bg-brand-50 active:bg-brand-100 focus-visible:ring-brand-600",
  tertiary:
    "bg-transparent text-text-secondary hover:bg-surface-alt active:bg-border focus-visible:ring-brand-600",
  destructive:
    "bg-error text-white hover:bg-error-hover active:bg-error-hover focus-visible:ring-error shadow-xs",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, iconLeft, iconRight, fullWidth, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={size === "sm" ? 13 : size === "lg" ? 17 : 15} /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  )
);
Button.displayName = "Button";

// ─────────────────────────────────────────────────────────────────────────────
// ICON BUTTON
// ─────────────────────────────────────────────────────────────────────────────

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "ghost" && "text-text-secondary hover:bg-surface-alt active:bg-border",
        variant === "outline" && "border border-border text-text-secondary hover:bg-surface-alt bg-white",
        size === "sm" && "h-7 w-7",
        size === "md" && "h-8 w-8",
        size === "lg" && "h-9 w-9",
        className
      )}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";

// ─────────────────────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, iconLeft, iconRight, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-label text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-9 bg-white border rounded-md text-sm text-text-primary placeholder:text-text-muted transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-0 focus:border-brand-600",
              error ? "border-error focus:ring-error" : "border-border hover:border-border-strong",
              iconLeft ? "pl-9" : "pl-3",
              iconRight ? "pr-9" : "pr-3",
              props.disabled && "opacity-50 cursor-not-allowed bg-surface-alt",
              className
            )}
            {...props}
          />
          {iconRight && !error && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center">
              {iconRight}
            </span>
          )}
          {error && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-error flex items-center">
              <AlertCircle size={14} />
            </span>
          )}
        </div>
        {error ? (
          <p className="text-caption text-error-text">{error}</p>
        ) : hint ? (
          <p className="text-caption">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH INPUT
// ─────────────────────────────────────────────────────────────────────────────

export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, "iconLeft">>(
  (props, ref) => <Input ref={ref} iconLeft={<Search size={14} />} {...props} />
);
SearchInput.displayName = "SearchInput";

// ─────────────────────────────────────────────────────────────────────────────
// SELECT
// ─────────────────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, placeholder, className, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-label text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full h-9 bg-white border rounded-md text-sm text-text-primary transition-all duration-150 appearance-none pr-9 pl-3",
              "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600",
              error ? "border-error" : "border-border hover:border-border-strong",
              props.disabled && "opacity-50 cursor-not-allowed bg-surface-alt",
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {children}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
        {error ? (
          <p className="text-caption text-error-text">{error}</p>
        ) : hint ? (
          <p className="text-caption">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";

// ─────────────────────────────────────────────────────────────────────────────
// TEXTAREA
// ─────────────────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-label text-text-primary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          className={cn(
            "w-full bg-white border rounded-md text-sm text-text-primary placeholder:text-text-muted transition-all duration-150 p-3 resize-y min-h-[80px]",
            "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600",
            error ? "border-error" : "border-border hover:border-border-strong",
            props.disabled && "opacity-50 cursor-not-allowed bg-surface-alt",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-caption text-error-text">{error}</p>
        ) : hint ? (
          <p className="text-caption">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ─────────────────────────────────────────────────────────────────────────────
// DATE INPUT
// ─────────────────────────────────────────────────────────────────────────────

interface DateInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-label text-text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="date"
          id={inputId}
          className={cn(
            "w-full h-9 bg-white border rounded-md text-sm text-text-primary transition-all duration-150 px-3",
            "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600",
            error ? "border-error" : "border-border hover:border-border-strong",
            props.disabled && "opacity-50 cursor-not-allowed bg-surface-alt",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-caption text-error-text">{error}</p>
        ) : hint ? (
          <p className="text-caption">{hint}</p>
        ) : null}
      </div>
    );
  }
);
DateInput.displayName = "DateInput";

// ─────────────────────────────────────────────────────────────────────────────
// FILE UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

interface FileUploadProps {
  label?: string;
  hint?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: FileList | null) => void;
}

export function FileUpload({ label, hint, error, accept, multiple, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setFileNames(Array.from(files).map((f) => f.name));
    onChange?.(files);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-label text-text-primary">{label}</p>}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-150",
          "hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
          dragging ? "border-brand-500 bg-brand-50" : error ? "border-error bg-error-subtle" : "border-border bg-surface-alt"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload size={20} className="mx-auto mb-2 text-text-muted" />
        {fileNames.length > 0 ? (
          <p className="text-body-sm text-text-primary font-medium">{fileNames.join(", ")}</p>
        ) : (
          <>
            <p className="text-body-sm font-medium text-text-secondary">
              <span className="text-brand-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-caption mt-0.5">{hint ?? "Any file up to 10MB"}</p>
          </>
        )}
      </div>
      {error && <p className="text-caption text-error-text">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKBOX
// ─────────────────────────────────────────────────────────────────────────────

interface CheckboxProps {
  label?: string;
  hint?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function Checkbox({ label, hint, checked: controlledChecked, defaultChecked, onChange, disabled, id }: CheckboxProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isControlled = controlledChecked !== undefined;
  const isChecked = isControlled ? controlledChecked : internalChecked;
  const checkId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalChecked(e.target.checked);
    onChange?.(e.target.checked);
  };

  return (
    <div className={cn("flex items-start gap-2.5", disabled && "opacity-50 cursor-not-allowed")}>
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          id={checkId}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          className="peer sr-only"
        />
        <div className={cn(
          "w-4 h-4 rounded shrink-0 border-2 transition-all duration-150 flex items-center justify-center",
          isChecked ? "bg-brand-600 border-brand-600" : "border-border-strong",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-1",
          !disabled && "hover:border-brand-500 cursor-pointer"
        )}>
          {isChecked && <Check size={10} strokeWidth={3} className="text-white" />}
        </div>
        <label htmlFor={checkId} className="absolute inset-0 cursor-pointer" />
      </div>
      {(label || hint) && (
        <label htmlFor={checkId} className={cn("flex flex-col gap-0.5", !disabled && "cursor-pointer")}>
          {label && <span className="text-body-sm font-medium text-text-primary leading-tight">{label}</span>}
          {hint && <span className="text-caption">{hint}</span>}
        </label>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RADIO
// ─────────────────────────────────────────────────────────────────────────────

interface RadioProps {
  label?: string;
  hint?: string;
  name: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function Radio({ label, hint, name, value, checked, onChange, disabled, id }: RadioProps) {
  const radioId = id ?? `${name}-${value}`;
  return (
    <div className={cn("flex items-start gap-2.5", disabled && "opacity-50 cursor-not-allowed")}>
      <div className="relative mt-0.5">
        <input
          type="radio"
          id={radioId}
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={() => onChange?.(value)}
          className="peer sr-only"
        />
        <div className={cn(
          "w-4 h-4 rounded-full border-2 transition-all duration-150 flex items-center justify-center",
          checked ? "border-brand-600" : "border-border-strong",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-1",
          !disabled && "hover:border-brand-500 cursor-pointer"
        )}>
          {checked && <div className="w-2 h-2 rounded-full bg-brand-600" />}
        </div>
        <label htmlFor={radioId} className="absolute inset-0 cursor-pointer" />
      </div>
      {(label || hint) && (
        <label htmlFor={radioId} className={cn("flex flex-col gap-0.5", !disabled && "cursor-pointer")}>
          {label && <span className="text-body-sm font-medium text-text-primary leading-tight">{label}</span>}
          {hint && <span className="text-caption">{hint}</span>}
        </label>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "brand" | "success" | "warning" | "error" | "info" | "neutral";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
  dot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default:  "bg-surface-alt text-text-secondary border border-border",
  brand:    "bg-brand-50 text-brand-700 border border-brand-200",
  success:  "bg-success-subtle text-success-text border border-success-border",
  warning:  "bg-warning-subtle text-warning-text border border-warning-border",
  error:    "bg-error-subtle text-error-text border border-error-border",
  info:     "bg-info-subtle text-info-text border border-info-border",
  neutral:  "bg-neutral-subtle text-neutral-text border border-neutral-border",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-text-muted",
  brand:   "bg-brand-500",
  success: "bg-success",
  warning: "bg-warning",
  error:   "bg-error",
  info:    "bg-info",
  neutral: "bg-neutral",
};

export function Badge({ variant = "default", size = "md", className, children, dot }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold",
      size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1",
      badgeVariants[variant],
      className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE (approval workflow states)
// ─────────────────────────────────────────────────────────────────────────────

type StatusType = "draft" | "pending" | "approved" | "rejected" | "returned" | "active" | "inactive";

const statusMap: Record<StatusType, { variant: BadgeVariant; label: string }> = {
  draft:    { variant: "neutral",  label: "Draft" },
  pending:  { variant: "warning",  label: "Pending" },
  approved: { variant: "success",  label: "Approved" },
  rejected: { variant: "error",    label: "Rejected" },
  returned: { variant: "default",  label: "Returned" },
  active:   { variant: "success",  label: "Active" },
  inactive: { variant: "neutral",  label: "Inactive" },
};

export function StatusBadge({ status }: { status: StatusType }) {
  const { variant, label } = statusMap[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const avatarSizes: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
  xl: "w-12 h-12 text-lg",
};

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold shrink-0 overflow-hidden",
        avatarSizes[size],
        !src && getAvatarColor(name),
        className
      )}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

export function AvatarGroup({ names, max = 3, size = "sm" }: { names: string[]; max?: number; size?: AvatarSize }) {
  const visible = names.slice(0, max);
  const overflow = names.length - max;
  return (
    <div className="flex -space-x-1.5">
      {visible.map((n) => (
        <div key={n} className="ring-2 ring-white rounded-full">
          <Avatar name={n} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div className={cn(
          "ring-2 ring-white rounded-full flex items-center justify-center bg-surface-alt text-text-muted font-semibold",
          avatarSizes[size]
        )}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

export function Card({ children, className, padding = "md", hoverable }: CardProps) {
  return (
    <div className={cn(
      "bg-white border border-border rounded-xl",
      "shadow-[0_1px_3px_0_rgb(0_0_0_/_0.06),_0_1px_2px_-1px_rgb(0_0_0_/_0.04)]",
      hoverable && "transition-shadow duration-150 hover:shadow-[0_4px_12px_-2px_rgb(0_0_0_/_0.08),_0_2px_4px_-2px_rgb(0_0_0_/_0.05)] cursor-pointer",
      padding === "none" && "p-0",
      padding === "sm" && "p-4",
      padding === "md" && "p-5",
      padding === "lg" && "p-6",
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h3 className="text-h3 text-text-primary">{title}</h3>
        {description && <p className="text-body-sm text-text-secondary mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE
// ─────────────────────────────────────────────────────────────────────────────

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => ReactNode;
}

interface TableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T extends Record<string, unknown>>({ columns, data, loading, emptyMessage, onRowClick }: TableProps<T>) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-2.5 text-overline text-text-muted font-semibold",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <Loader2 size={20} className="animate-spin text-text-muted mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-body-sm text-text-muted">
                  {emptyMessage ?? "No data found."}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-divider last:border-0 transition-colors duration-100",
                    onRowClick && "cursor-pointer hover:bg-surface-alt"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-4 py-3 text-body-sm text-text-primary",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center"
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────────────────────────

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  variant?: "underline" | "pills";
}

export function Tabs({ tabs, active, onChange, variant = "underline" }: TabsProps) {
  if (variant === "pills") {
    return (
      <div className="flex gap-1 p-1 bg-surface-alt rounded-lg border border-border w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
              active === tab.key
                ? "bg-white text-text-primary shadow-xs border border-border"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                active === tab.key ? "bg-brand-50 text-brand-600" : "bg-border text-text-muted"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex border-b border-border gap-0">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all duration-150 border-b-2 -mb-px focus-visible:outline-none",
            active === tab.key
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-text-muted hover:text-text-secondary hover:border-border-strong"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full font-semibold",
              active === tab.key ? "bg-brand-50 text-brand-600" : "bg-surface-alt text-text-muted"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERT
// ─────────────────────────────────────────────────────────────────────────────

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const alertConfig: Record<AlertVariant, { icon: ReactNode; styles: string; iconColor: string }> = {
  info:    { icon: <Info size={16} />,          styles: "bg-info-subtle border-info-border",    iconColor: "text-info" },
  success: { icon: <CheckCircle size={16} />,   styles: "bg-success-subtle border-success-border", iconColor: "text-success" },
  warning: { icon: <AlertTriangle size={16} />, styles: "bg-warning-subtle border-warning-border", iconColor: "text-warning" },
  error:   { icon: <AlertCircle size={16} />,   styles: "bg-error-subtle border-error-border",  iconColor: "text-error" },
};

export function Alert({ variant = "info", title, children, onDismiss, className }: AlertProps) {
  const { icon, styles, iconColor } = alertConfig[variant];
  return (
    <div className={cn("flex gap-3 p-4 rounded-lg border", styles, className)} role="alert">
      <span className={cn("shrink-0 mt-0.5", iconColor)}>{icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="text-body-sm font-semibold text-text-primary mb-0.5">{title}</p>}
        <div className="text-body-sm text-text-secondary">{children}</div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 text-text-muted hover:text-text-secondary transition-colors">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border flex items-center justify-center mb-4 text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-h3 text-text-primary mb-1.5">{title}</h3>
      {description && <p className="text-body-sm text-text-secondary max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING STATE
// ─────────────────────────────────────────────────────────────────────────────

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 size={24} className="animate-spin text-brand-600" />
      <p className="text-body-sm text-text-muted">{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-error-subtle border border-error-border flex items-center justify-center mb-4 text-error">
        <AlertCircle size={22} />
      </div>
      <h3 className="text-h3 text-text-primary mb-1.5">{title}</h3>
      <p className="text-body-sm text-text-secondary max-w-sm mb-5">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-surface-alt rounded animate-pulse",
        className
      )}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex-1 border-t border-border" />
        <span className="text-caption text-text-muted whitespace-nowrap">{label}</span>
        <div className="flex-1 border-t border-border" />
      </div>
    );
  }
  return <hr className={cn("border-0 border-t border-divider", className)} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD (KPI tile)
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "up" | "down" | "neutral";
  icon?: ReactNode;
}

export function StatCard({ label, value, delta, deltaType = "neutral", icon }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-overline text-text-muted mb-2">{label}</p>
          <p className="text-h1 text-text-primary tabular-nums">{value}</p>
          {delta && (
            <p className={cn(
              "text-small font-medium mt-1",
              deltaType === "up" && "text-success",
              deltaType === "down" && "text-error",
              deltaType === "neutral" && "text-text-muted"
            )}>
              {delta}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM FIELD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

export function FormField({ label, hint, error, required, children }: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <p className="text-label text-text-primary">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </p>
      )}
      {children}
      {error ? (
        <p className="text-caption text-error-text">{error}</p>
      ) : hint ? (
        <p className="text-caption">{hint}</p>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE SWITCH
// ─────────────────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={cn("flex items-center gap-2.5 cursor-pointer", disabled && "opacity-50 cursor-not-allowed")}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1",
          checked ? "bg-brand-600" : "bg-border-strong"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-xs transition-transform duration-200",
          checked && "translate-x-4"
        )} />
      </button>
      {label && <span className="text-body-sm font-medium text-text-primary">{label}</span>}
    </label>
  );
}
