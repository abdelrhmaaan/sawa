import {
  createContext,
  useContext,
  useCallback,
  useReducer,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────────────────────

type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
}

const modalSizes: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, description, size = "md", children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={cn(
          "relative z-10 w-full bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]",
          modalSizes[size]
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex-1 min-w-0">
              {title && <h2 id="modal-title" className="text-h3 text-text-primary">{title}</h2>}
              {description && <p className="text-body-sm text-text-secondary mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-alt transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 shrink-0"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAWER (slide-in panel from right)
// ─────────────────────────────────────────────────────────────────────────────

type DrawerSize = "sm" | "md" | "lg";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: DrawerSize;
  children: ReactNode;
  footer?: ReactNode;
}

const drawerSizes: Record<DrawerSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Drawer({ open, onClose, title, description, size = "md", children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
        className={cn(
          "relative z-10 ml-auto w-full bg-white shadow-xl flex flex-col h-full",
          drawerSizes[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            {title && <h2 id="drawer-title" className="text-h3 text-text-primary">{title}</h2>}
            {description && <p className="text-body-sm text-text-secondary mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary transition-colors rounded-md p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────

type ToastVariant = "default" | "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
}

type ToastAction =
  | { type: "ADD"; toast: ToastItem }
  | { type: "REMOVE"; id: string };

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD":
      return { toasts: [...state.toasts.slice(-4), action.toast] };
    case "REMOVE":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const toastIcons: Record<ToastVariant, ReactNode> = {
  default: null,
  success: <CheckCircle size={16} className="text-success shrink-0" />,
  error:   <AlertCircle size={16} className="text-error shrink-0" />,
  warning: <AlertTriangle size={16} className="text-warning shrink-0" />,
  info:    <Info size={16} className="text-info shrink-0" />,
};

function ToastItemComponent({ toast: t, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, t.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [t.duration, onRemove]);

  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-white border border-border rounded-xl px-4 py-3.5 shadow-lg min-w-[280px] max-w-sm"
    >
      {toastIcons[t.variant]}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-semibold text-text-primary leading-tight">{t.title}</p>
        {t.description && <p className="text-caption text-text-secondary mt-0.5">{t.description}</p>}
      </div>
      <button
        onClick={onRemove}
        className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const toast = useCallback((opts: Omit<ToastItem, "id">) => {
    dispatch({ type: "ADD", toast: { id: Math.random().toString(36).slice(2), ...opts } });
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 items-end">
          {state.toasts.map((t) => (
            <ToastItemComponent
              key={t.id}
              toast={t}
              onRemove={() => dispatch({ type: "REMOVE", id: t.id })}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DROPDOWN MENU
// ─────────────────────────────────────────────────────────────────────────────

interface DropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (key: string) => void;
  align?: "left" | "right";
}

export function Dropdown({ trigger, items, onSelect, align = "right" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    setMenuStyle({
      top: rect.bottom + window.scrollY + 6,
      ...(align === "right"
        ? { right: viewportWidth - rect.right }
        : { left: rect.left + window.scrollX }),
    });
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const escHandler = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  return (
    <div ref={triggerRef} className="relative inline-block">
      <div onClick={() => { updatePosition(); setOpen((v) => !v); }}>{trigger}</div>
      {open && createPortal(
        <div
          className="fixed z-[55] min-w-[160px] bg-white border border-border rounded-xl shadow-lg py-1 overflow-hidden"
          style={menuStyle}
        >
          {items.map((item, i) => (
            item.divider ? (
              <div key={`divider-${i}`} className="my-1 border-t border-divider" />
            ) : (
              <button
                key={item.key}
                disabled={item.disabled}
                onClick={() => { onSelect(item.key); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-body-sm font-medium text-left transition-colors duration-100",
                  item.destructive
                    ? "text-error hover:bg-error-subtle"
                    : "text-text-primary hover:bg-surface-alt",
                  item.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                )}
              >
                {item.icon && <span className="text-text-muted">{item.icon}</span>}
                {item.label}
              </button>
            )
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

