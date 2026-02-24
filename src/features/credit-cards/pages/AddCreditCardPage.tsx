import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useCreateCard } from '../hooks/useCreditCards';
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/DatePicker';

export default function AddCreditCardPage() {
  const navigate = useNavigate();
  const createCard = useCreateCard();

  const [name, setName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [billDate, setBillDate] = useState('25');
  const [dueDate, setDueDate] = useState('15');
  const [billingStartDate, setBillingStartDate] = useState<Date | undefined>(new Date());

  // ✅ Validate last 4 digits (optional but must be exactly 4 if provided)
  const isLastFourValid =
    lastFour.length === 0 || lastFour.length === 4;

  const canSubmit =
    name.trim() &&
    billDate &&
    dueDate &&
    billingStartDate &&
    isLastFourValid &&
    !createCard.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;

    // Extra safety check
    if (lastFour && lastFour.length !== 4) return;

    createCard.mutate(
      {
        name: name.trim(),
        lastFour: lastFour.trim(),
        billDate: parseInt(billDate) || 25,
        dueDate: parseInt(dueDate) || 15,
        billingStartDate: format(billingStartDate!, 'yyyy-MM-dd'),
      },
      { onSuccess: () => navigate('/cards') }
    );
  };

  return (
    <div className="animate-fade-in mb-4">
      <div className="page-header sticky top-0 z-20 bg-background flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <h1 className="text-xl font-bold">Add Credit Card</h1>
      </div>

      <div className="page-content space-y-5">
        {/* Card Name */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Card Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HDFC Regalia"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Last 4 Digits */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Last 4 Digits (Optional)
          </label>
          <input
            value={lastFour}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setLastFour(value.slice(0, 4));
            }}
            inputMode="numeric"
            pattern="\d{4}"
            placeholder="e.g. 4532"
            maxLength={4}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {lastFour.length > 0 && lastFour.length !== 4 && (
            <p className="text-xs text-red-500 mt-1">
              Must be exactly 4 digits
            </p>
          )}
        </div>

        {/* Billing Start Date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Billing Start Date
          </label>
          <p className="text-[11px] text-muted-foreground mb-1">
            When did you start using this card / first billing cycle
          </p>
          <DatePicker
            value={billingStartDate}
            onChange={setBillingStartDate}
            placeholder="Pick a date"
          />
        </div>

        {/* Bill Generation Date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Bill Generation Date
          </label>
          <p className="text-[11px] text-muted-foreground mb-1">
            Day of month when your bill is generated
          </p>
          <input
            type="number"
            min="1"
            max="31"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Payment Due Date
          </label>
          <p className="text-[11px] text-muted-foreground mb-1">
            Day of month when payment is due (can be next month)
          </p>
          <input
            type="number"
            min="1"
            max="31"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {createCard.isError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">
              {(createCard.error as Error)?.message || 'Something went wrong'}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'w-full py-3.5 rounded-xl text-sm font-semibold transition-colors',
            canSubmit
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {createCard.isPending ? 'Adding...' : 'Add Card'}
        </button>
      </div>
    </div>
  );
}