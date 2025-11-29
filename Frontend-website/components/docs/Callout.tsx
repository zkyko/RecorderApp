import { ReactNode } from "react";
import { Info, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";

interface CalloutProps {
  type?: "info" | "warning" | "success" | "tip";
  title?: string;
  children: ReactNode;
}

export function Callout({ type = "info", title, children }: CalloutProps) {
  const styles = {
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      icon: Info,
      iconColor: "text-blue-400",
      titleColor: "text-blue-300",
    },
    warning: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      icon: AlertCircle,
      iconColor: "text-yellow-400",
      titleColor: "text-yellow-300",
    },
    success: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      icon: CheckCircle2,
      iconColor: "text-green-400",
      titleColor: "text-green-300",
    },
    tip: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      icon: Lightbulb,
      iconColor: "text-purple-400",
      titleColor: "text-purple-300",
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4 my-6`}>
      <div className="flex gap-3">
        <Icon className={`${style.iconColor} h-5 w-5 flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          {title && (
            <h4 className={`${style.titleColor} font-semibold mb-2`}>{title}</h4>
          )}
          <div className="text-zinc-300 prose prose-invert prose-sm max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

