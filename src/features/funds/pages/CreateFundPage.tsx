import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { useCreateFund } from '../hooks/useFunds';
import { DAY_NAMES } from '../utils/fundDateUtils';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/DatePicker';

export default function CreateFundPage() {
  const navigate = useNavigate();
  const createFund = useCreateFund();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [recurrence, setRecurrence] = useState<'weekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const canSubmit = name.trim() && amount.trim() && startDate && !createFund.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createFund.mutate({
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      recurrence,
      ...(recurrence === 'weekly' ? { dayOfWeek } : { dayOfMonth: parseInt(dayOfMonth) || 1 }),
      startDate: format(startDate!, 'yyyy-MM-dd'),
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    }, { onSuccess: () => navigate('/funds') });
  };

  return (
    <div className="animate-fade-in mb-4">
      <div className="page-header sticky top-0 z-20 bg-background flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <h1 className="text-xl font-bold">Create Fund</h1>
      </div>

      <div className="page-content space-y-5">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Fund Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Savings"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Payment Amount (₹)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 2000"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Payment Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            {(['weekly', 'monthly'] as const).map(r => (
              <button key={r} onClick={() => setRecurrence(r)}
                className={cn('py-3 rounded-xl text-sm font-medium transition-colors',
                  recurrence === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
                {r === 'weekly' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        {recurrence === 'weekly' ? (
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Payment Day</label>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_NAMES.map((d, i) => (
                <button key={d} onClick={() => setDayOfWeek(i)}
                  className={cn('py-2.5 rounded-lg text-xs font-medium transition-colors',
                    dayOfWeek === i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Day of Month</label>
            <input type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Start Date</label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Pick a date"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">End Date (Optional)</label>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="No end date"
          />
        </div>

        <button onClick={handleSubmit} disabled={!canSubmit}
          className={cn('w-full py-3.5 rounded-xl text-sm font-semibold transition-colors',
            canSubmit ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          {createFund.isPending ? 'Creating...' : 'Create Fund'}
        </button>
      </div>
    </div>
  );
}
