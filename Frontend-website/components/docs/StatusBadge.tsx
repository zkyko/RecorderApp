interface StatusBadgeProps {
  status: "draft" | "pending" | "approved" | "archived";
  children?: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const styles = {
    draft: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    pending: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    approved: "bg-green-500/10 border-green-500/30 text-green-400",
    archived: "bg-zinc-500/10 border-zinc-500/30 text-zinc-400",
  };

  const labels = {
    draft: "Draft",
    pending: "Pending Approval",
    approved: "Approved",
    archived: "Archived",
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium mb-6 ${styles[status]}`}>
      {children || labels[status]}
    </div>
  );
}

