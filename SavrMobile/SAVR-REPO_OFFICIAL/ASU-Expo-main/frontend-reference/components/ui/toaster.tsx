import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  variantIcons,
  iconStyles,
  accentColors,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, duration, ...props }) => {
        const variantKey = variant || "default"
        const renderIcon = variantIcons[variantKey]
        const iconStyle = iconStyles[variantKey]
        const accentColor = accentColors[variantKey]
        const dur = duration ?? 5000

        return (
          <Toast key={id} variant={variant} {...props}>
            {/* Left accent strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentColor}`} />

            {/* Icon in a framed circle */}
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconStyle}`}>
              {renderIcon()}
            </div>

            {/* Content */}
            <div className="grid gap-0.5 flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.06]">
              <div
                className={`h-full ${accentColor} opacity-40`}
                style={{
                  animation: `toast-progress ${dur}ms linear forwards`,
                }}
              />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
