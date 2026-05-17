interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'submitted' | 'active' | 'suspended';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  const colors = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    approved: 'bg-green-500/10 text-green-500',
    rejected: 'bg-red-500/10 text-red-500',
    submitted: 'bg-blue-500/10 text-blue-500',
    active: 'bg-green-500/10 text-green-500',
    suspended: 'bg-red-500/10 text-red-500',
  };

  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    submitted: 'Submitted',
    active: 'Active',
    suspended: 'Suspended',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizes[size]} ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
}
