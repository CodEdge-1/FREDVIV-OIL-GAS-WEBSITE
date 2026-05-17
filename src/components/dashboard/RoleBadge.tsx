interface RoleBadgeProps {
  role: 'admin' | 'manager' | 'accountant' | 'auditor';
  size?: 'sm' | 'md' | 'lg';
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const colors = {
    admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    manager: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    accountant: 'bg-green-500/10 text-green-500 border-green-500/20',
    auditor: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  const labels = {
    admin: 'Super Admin',
    manager: 'Manager',
    accountant: 'Accountant',
    auditor: 'Auditor',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizes[size]} ${colors[role]}`}
    >
      {labels[role]}
    </span>
  );
}
