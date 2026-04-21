import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 pointer-events-none sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[400px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "savr-toast group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border border-emerald-400/[0.12] bg-emerald-950/95 p-4 pr-9 text-white shadow-2xl backdrop-blur-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "toast-success shadow-emerald-500/10",
        destructive: "toast-error shadow-red-500/15",
        warning: "toast-warning shadow-amber-500/10",
        info: "toast-info shadow-slate-400/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Icon wrapper colors per variant
const iconStyles: Record<string, string> = {
  default: "text-emerald-400 bg-emerald-400/15",
  destructive: "text-red-400 bg-red-400/15",
  warning: "text-amber-400 bg-amber-400/15",
  info: "text-slate-300 bg-slate-300/15",
}

const variantIcons: Record<string, (className?: string) => React.ReactNode> = {
  default: (cls) => <CheckCircle2 className={cn("h-4 w-4", cls)} />,
  destructive: (cls) => <XCircle className={cn("h-4 w-4", cls)} />,
  warning: (cls) => <AlertTriangle className={cn("h-4 w-4", cls)} />,
  info: (cls) => <Info className={cn("h-4 w-4", cls)} />,
}

// Accent bar colors
const accentColors: Record<string, string> = {
  default: "bg-emerald-400",
  destructive: "bg-red-400",
  warning: "bg-amber-400",
  info: "bg-slate-400",
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 px-3 text-xs font-medium text-white/90 transition-colors hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2.5 top-2.5 rounded-md p-1 text-white/40 transition-colors hover:text-white/80 focus:outline-none focus:ring-1 focus:ring-white/30",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-[13px] font-semibold leading-tight tracking-[-0.01em] text-white", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-xs leading-relaxed text-white/60", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  variantIcons,
  iconStyles,
  accentColors,
}

// Global toast state - shared across all components
export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number
}

const TOAST_LIMIT = 5
const TOAST_DEFAULT_DURATION = 5000

// Global state and listeners
let toasts: ToasterToast[] = []
let listeners: Array<(toasts: ToasterToast[]) => void> = []

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]))
}

function addToast(props: Omit<ToasterToast, "id">) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

  const { duration, ...rest } = props
  const resolvedDuration = duration ?? TOAST_DEFAULT_DURATION

  const newToast: ToasterToast = {
    id,
    duration: resolvedDuration,
    ...rest,
  }

  toasts = [newToast, ...toasts].slice(0, TOAST_LIMIT)
  notifyListeners()

  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    notifyListeners()
  }, resolvedDuration)

  return id
}

function dismissToast(id: string) {
  toasts = toasts.filter((toast) => toast.id !== id)
  notifyListeners()
}

// Standalone toast function that can be called from anywhere
export function toast(props: Omit<ToasterToast, "id">) {
  return addToast(props)
}

// Hook for components that need to subscribe to toast state
export function useToast() {
  const [localToasts, setLocalToasts] = React.useState<ToasterToast[]>(toasts)

  React.useEffect(() => {
    listeners.push(setLocalToasts)
    return () => {
      listeners = listeners.filter((l) => l !== setLocalToasts)
    }
  }, [])

  return {
    toast,
    dismissToast,
    toasts: localToasts,
  }
}
