import { useNavigate } from 'react-router-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { CreditCard as CCIcon } from 'lucide-react';
import { CreditCard } from '@/types/finance';
import { getNextUnpaidCycle } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

const gradients = ['cc-gradient-1', 'cc-gradient-2', 'cc-gradient-3', 'cc-gradient-4'];

export default function CreditCardVisual({ card, index }: { card: CreditCard; index: number }) {
  const navigate = useNavigate();
  const nextCycle = getNextUnpaidCycle(card);
  const isOverdue = nextCycle && isBefore(nextCycle.dueDate, startOfDay(new Date()));

  return (
    <div
      onClick={() => navigate(`/cards/${card.id}`)}
      className={cn(
        'rounded-2xl p-5 cursor-pointer active:scale-[0.98] transition-transform duration-150 aspect-[1.7/1] flex flex-col justify-between animate-fade-in',
        gradients[index % gradients.length]
      )}
    >
      <div className="flex items-center justify-between">
        <CCIcon className="w-8 h-8 opacity-80" style={{ color: 'white' }} />
        {nextCycle && !nextCycle.isPaid && (
          <span className={cn(
            'text-[11px] px-2.5 py-1 rounded-full font-medium',
            isOverdue
              ? 'bg-red-500/30 text-red-100'
              : 'bg-white/20 text-white'
          )}>
            Due {format(nextCycle.dueDate, 'MMM d')}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs tracking-[0.2em] mb-1 opacity-60" style={{ color: 'white' }}>
          •••• •••• •••• {card.lastFour || '••••'}
        </p>
        <p className="font-semibold text-sm" style={{ color: 'white' }}>{card.name}</p>
      </div>
    </div>
  );
}
