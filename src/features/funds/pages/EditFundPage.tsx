import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { useFundById } from '../hooks/useFunds';
import { useUpdateFund } from '../hooks/useFunds';
import { DAY_NAMES } from '../utils/fundDateUtils';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function EditFundPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Use React Query hooks instead of useAppSelector
  const { data: fund, isLoading } = useFundById(id!);
  const updateFund = useUpdateFund();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [recurrence, setRecurrence] = useState<'weekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Populate form when fund data is loaded
  useEffect(() => {
    if (fund) {
      setName(fund.name);
      setAmount(String(fund.amount));
      setRecurrence(fund.recurrence);
      setDayOfWeek(fund.dayOfWeek ?? 0);
      setDayOfMonth(String(fund.dayOfMonth ?? 1));
      setStartDate(new Date(fund.startDate));
      setEndDate(fund.endDate ? new Date(fund.endDate) : undefined);
    }
  }, [fund]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
          </button>
          <h1 className="text-xl font-bold">Edit Fund</h1>
        </div>
        <div className="page-content">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if fund not found
  if (!fund) return <Navigate to="/funds" replace />;

  const canSubmit = name.trim() && amount.trim() && startDate && !updateFund.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;

    updateFund.mutate({
      id: fund.id,
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      recurrence,
      ...(recurrence === 'weekly' ? { dayOfWeek } : { dayOfMonth: parseInt(dayOfMonth) || 1 }),
      startDate: format(startDate!, 'yyyy-MM-dd'),
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    }, {
      onSuccess: () => navigate(`/funds/${fund.id}`)
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <h1 className="text-xl font-bold">Edit Fund</h1>
      </div>

      <div className="page-content space-y-5">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Fund Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Weekly Savings"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Payment Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 2000"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Payment Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            {(['weekly', 'monthly'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRecurrence(r)}
                className={cn('py-3 rounded-xl text-sm font-medium transition-colors',
                  recurrence === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                )}
              >
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
                <button
                  key={d}
                  onClick={() => setDayOfWeek(i)}
                  className={cn('py-2.5 rounded-lg text-xs font-medium transition-colors',
                    dayOfWeek === i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Day of Month</label>
            <input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={e => setDayOfMonth(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-left flex items-center gap-2",
                !startDate && "text-muted-foreground"
              )}>
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                {startDate ? format(startDate, 'PPP') : 'Pick a date'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">End Date (Optional)</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-left flex items-center gap-2",
                !endDate && "text-muted-foreground"
              )}>
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                {endDate ? format(endDate, 'PPP') : 'No end date'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn('w-full py-3.5 rounded-xl text-sm font-semibold transition-colors',
            canSubmit ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {updateFund.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}