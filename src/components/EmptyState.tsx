import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-[260px]">{description}</p>
      {action}
    </div>
  );
}
