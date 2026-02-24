import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { useCardById, useUpdateCard } from '../hooks/useCreditCards';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function EditCreditCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: card, isLoading } = useCardById(id ?? '');
  const updateCardMut = useUpdateCard();

  const [name, setName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [billDate, setBillDate] = useState('25');
  const [dueDate, setDueDate] = useState('15');
  const [billingStartDate, setBillingStartDate] = useState<Date | undefined>();

  useEffect(() => {
    if (!card) return;

    setName(card.name);
    setLastFour(card.lastFour ?? '');
    setBillDate(String(card.billDate));
    setDueDate(String(card.dueDate));
    setBillingStartDate(new Date(card.billingStartDate));
  }, [card]);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!card) return <Navigate to="/cards" replace />;

  const parsedBillDate = parseInt(billDate);
  const parsedDueDate = parseInt(dueDate);

  const isValidBillDate = parsedBillDate >= 1 && parsedBillDate <= 31;
  const isValidDueDate = parsedDueDate >= 1 && parsedDueDate <= 31;

  const canSubmit =
    name.trim().length > 0 &&
    billingStartDate &&
    isValidBillDate &&
    isValidDueDate &&
    !updateCardMut.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;

    updateCardMut.mutate(
      {
        id: card.id,
        name: name.trim(),
        lastFour: lastFour.trim() || undefined,
        billDate: parsedBillDate,
        dueDate: parsedDueDate,
        billingStartDate: format(billingStartDate!, 'yyyy-MM-dd'),
      },
      {
        onSuccess: () => navigate(`/cards/${card.id}`),
      }
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <h1 className="text-xl font-bold">Edit Card</h1>
      </div>

      <div className="page-content space-y-5">
        {/* Card Name */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Card Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Last Four */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Last 4 Digits (Optional)
          </label>
          <input
            value={lastFour}
            onChange={e =>
              setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))
            }
            maxLength={4}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Billing Start Date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Billing Start Date
          </label>

          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-left flex items-center gap-2',
                  !billingStartDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                {billingStartDate
                  ? format(billingStartDate, 'PPP')
                  : 'Pick a date'}
              </button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={billingStartDate}
                onSelect={setBillingStartDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Bill Date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Bill Generation Date
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={billDate}
            onChange={e => setBillDate(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Payment Due Date
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

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
          {updateCardMut.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}