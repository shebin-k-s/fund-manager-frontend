import { Link } from 'react-router-dom';
import { Plus, CreditCard as CCIcon } from 'lucide-react';
import { useFinance } from '@/lib/FinanceContext';
import CreditCardVisual from '@/components/CreditCardVisual';
import EmptyState from '@/components/EmptyState';

export default function CreditCards() {
  const { cards } = useFinance();

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cards</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cards.length} card{cards.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/cards/new"
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>
      <div className="page-content">
        {cards.length === 0 ? (
          <EmptyState
            icon={CCIcon}
            title="No credit cards"
            description="Add a credit card to track billing cycles and due dates"
            action={
              <Link to="/cards/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Card
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {cards.map((c, i) => <CreditCardVisual key={c.id} card={c} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
