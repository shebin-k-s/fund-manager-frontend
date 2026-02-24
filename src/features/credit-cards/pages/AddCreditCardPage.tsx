import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { useCreateCard } from '../hooks/useCreditCards';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function AddCreditCardPage() {
  const navigate = useNavigate();
  const createCard = useCreateCard();
  const [name, setName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [billDate, setBillDate] = useState('25');
  const [dueDate, setDueDate] = useState('15');
  const [billingStartDate, setBillingStartDate] = useState<Date | undefined>(new Date());

  const canSubmit = name.trim() && billDate && dueDate && billingStartDate && !createCard.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createCard.mutate({
      name: name.trim(),
      lastFour: lastFour.trim(),
      billDate: parseInt(billDate) || 25,
      dueDate: parseInt(dueDate) || 15,
      billingStartDate: format(billingStartDate!, 'yyyy-MM-dd'),
    }, { onSuccess: () => navigate('/cards') });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <h1 className="text-xl font-bold">Add Credit Card</h1>
      </div>

      <div className="page-content space-y-5">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Card Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HDFC Regalia"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Last 4 Digits (Optional)</label>
          <input value={lastFour} onChange={e => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="e.g. 4532" maxLength={4}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Billing Start Date</label>
          <p className="text-[11px] text-muted-foreground mb-1">When did you start using this card / first billing cycle</p>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn("w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-left flex items-center gap-2", !billingStartDate && "text-muted-foreground")}>
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                {billingStartDate ? format(billingStartDate, 'PPP') : 'Pick a date'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={billingStartDate} onSelect={setBillingStartDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Bill Generation Date</label>
          <p className="text-[11px] text-muted-foreground mb-1">Day of month when your bill is generated</p>
          <input type="number" min="1" max="31" value={billDate} onChange={e => setBillDate(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Payment Due Date</label>
          <p className="text-[11px] text-muted-foreground mb-1">Day of month when payment is due (can be next month)</p>
          <input type="number" min="1" max="31" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <button onClick={handleSubmit} disabled={!canSubmit}
          className={cn('w-full py-3.5 rounded-xl text-sm font-semibold transition-colors',
            canSubmit ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          {createCard.isPending ? 'Adding...' : 'Add Card'}
        </button>
      </div>
    </div>
  );
}
