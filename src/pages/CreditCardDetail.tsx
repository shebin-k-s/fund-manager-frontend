import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { ArrowLeft, Trash2, Check, X, CreditCard as CCIcon, AlertTriangle } from 'lucide-react';
import { useFinance } from '@/lib/FinanceContext';
import { getBillingCycles, getMissedCardCount } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

const gradients = ['cc-gradient-1', 'cc-gradient-2', 'cc-gradient-3', 'cc-gradient-4'];

export default function CreditCardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cards, setCards } = useFinance();
  const cardIndex = cards.findIndex(c => c.id === id);
  const card = cards[cardIndex];

  const [activeCycle, setActiveCycle] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!card) return <Navigate to="/cards" replace />;

  const today = startOfDay(new Date());
  const cycles = getBillingCycles(card).reverse();
  const totalPaid = card.payments.reduce((s, p) => s + p.amount, 0);
  const paidCount = card.payments.length;
  const unpaidOverdue = getMissedCardCount(card);

  const handlePay = (cycle: string) => {
    const amount = parseFloat(payAmount) || 0;
    setCards(prev => prev.map(c =>
      c.id === card.id ? { ...c, payments: [...c.payments, { cycle, amount }] } : c
    ));
    setActiveCycle(null);
    setPayAmount('');
  };

  const handleRemove = (cycle: string) => {
    setCards(prev => prev.map(c =>
      c.id === card.id ? { ...c, payments: c.payments.filter(p => p.cycle !== cycle) } : c
    ));
    setActiveCycle(null);
  };

  const handleDelete = () => {
    setCards(prev => prev.filter(c => c.id !== card.id));
    navigate('/cards');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => navigate('/cards')} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <h1 className="text-xl font-bold truncate">{card.name}</h1>
      </div>

      <div className="page-content">
        {/* Visual Card */}
        <div className={cn(
          'rounded-2xl p-5 aspect-[1.7/1] flex flex-col justify-between',
          gradients[cardIndex % gradients.length]
        )}>
          <CCIcon className="w-8 h-8 opacity-80" style={{ color: 'white' }} />
          <div>
            <p className="text-xs tracking-[0.2em] mb-1 opacity-60" style={{ color: 'white' }}>
              •••• •••• •••• {card.lastFour || '••••'}
            </p>
            <p className="font-semibold" style={{ color: 'white' }}>{card.name}</p>
            <p className="text-xs mt-1 opacity-70" style={{ color: 'white' }}>
              Bill: {card.billDate}th · Due: {card.dueDate}th
            </p>
          </div>
        </div>

        {/* Missed Alert */}
        {unpaidOverdue > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3.5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">{unpaidOverdue} Overdue Bill{unpaidOverdue > 1 ? 's' : ''}</p>
              <p className="text-xs text-destructive/70">Pay immediately to avoid penalties</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-base font-bold text-primary mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground">Bills Paid</p>
            <p className="text-base font-bold mt-1">{paidCount}</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className={cn('text-base font-bold mt-1', unpaidOverdue > 0 ? 'text-destructive' : 'text-primary')}>{unpaidOverdue}</p>
          </div>
        </div>

        {/* Billing Cycles */}
        <h2 className="text-sm font-semibold">Billing Cycles</h2>
        <div className="space-y-2.5">
          {cycles.map(cycle => {
            const overdue = !cycle.isPaid && isBefore(cycle.dueDate, today);
            const isActive = activeCycle === cycle.cycle;

            return (
              <div key={cycle.cycle} className={cn(
                "bg-card rounded-xl border overflow-hidden",
                overdue ? "border-destructive/40" : "border-border"
              )}>
                <button
                  onClick={() => { setActiveCycle(isActive ? null : cycle.cycle); setPayAmount(''); }}
                  className="w-full flex items-center gap-3 p-3.5"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    cycle.isPaid ? 'bg-primary/15' :
                    overdue ? 'bg-destructive/15' :
                    'bg-warning/15'
                  )}>
                    <span className="text-xs font-bold">
                      {format(cycle.billDate, 'MMM').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">
                      {format(cycle.billDate, 'MMM yyyy')} Bill
                    </p>
                    <p className={cn("text-xs", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                      {cycle.isPaid 
                        ? `Paid ₹${cycle.paidAmount?.toLocaleString('en-IN')}` 
                        : overdue 
                          ? `⚠ Overdue since ${format(cycle.dueDate, 'MMM d')}` 
                          : `Due: ${format(cycle.dueDate, 'MMM d, yyyy')}`}
                    </p>
                  </div>
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center',
                    cycle.isPaid ? 'bg-primary/20' :
                    overdue ? 'bg-destructive/20' : 'bg-secondary'
                  )}>
                    {cycle.isPaid ? <Check className="w-3.5 h-3.5 text-primary" /> :
                     overdue ? <X className="w-3.5 h-3.5 text-destructive" /> :
                     <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                  </div>
                </button>

                {isActive && (
                  <div className="px-3.5 pb-3.5 border-t border-border pt-3">
                    {cycle.isPaid ? (
                      <button
                        onClick={() => handleRemove(cycle.cycle)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium"
                      >
                        <X className="w-4 h-4" /> Remove Payment
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          placeholder="Amount (₹)"
                          className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          onClick={() => handlePay(cycle.cycle)}
                          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium"
                        >
                          Pay
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Delete */}
        <div className="pt-4">
          {showDeleteConfirm ? (
            <div className="bg-destructive/10 rounded-xl p-4 text-center">
              <p className="text-sm text-destructive mb-3">Delete this card permanently?</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium">Delete</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-destructive text-sm"
            >
              <Trash2 className="w-4 h-4" /> Delete Card
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
