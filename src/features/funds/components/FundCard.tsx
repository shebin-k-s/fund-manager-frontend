import { useNavigate } from 'react-router-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Fund } from '../types';
import { getNextUnpaidDate } from '../utils/fundDateUtils';
import { cn } from '@/lib/utils';

interface FundCardProps {
  fund: Fund;
}

export default function FundCard({ fund }: FundCardProps) {
  const navigate = useNavigate();
  const nextDate = getNextUnpaidDate(fund);
  const totalInvested = fund.payments.reduce((s, p) => s + p.amount, 0);
  const isOverdue = nextDate && isBefore(nextDate, startOfDay(new Date()));

  return (
    <div
      onClick={() => navigate(`/funds/${fund.id}`)}
      className="touch-card p-4 animate-fade-in"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-lg">
            💰
          </div>
          <div>
            <h3 className="font-semibold text-sm">{fund.name}</h3>
            <p className="text-xs text-muted-foreground">
              ₹{fund.amount.toLocaleString('en-IN')}/{fund.recurrence === 'weekly' ? 'wk' : 'mo'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Total Invested</p>
          <p className="text-lg font-bold text-primary">₹{totalInvested.toLocaleString('en-IN')}</p>
        </div>
        {nextDate && (
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
            isOverdue ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'
          )}>
            {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {format(nextDate, 'MMM d')}
          </div>
        )}
      </div>
    </div>
  );
}
