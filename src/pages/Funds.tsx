import { Link } from 'react-router-dom';
import { Plus, Wallet } from 'lucide-react';
import { useFinance } from '@/lib/FinanceContext';
import FundCard from '@/components/FundCard';
import EmptyState from '@/components/EmptyState';

export default function Funds() {
  const { funds } = useFinance();

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funds</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{funds.length} active</p>
        </div>
        <Link
          to="/funds/new"
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>
      <div className="page-content">
        {funds.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No funds yet"
            description="Create a recurring fund to start tracking your payments"
            action={
              <Link to="/funds/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium">
                <Plus className="w-4 h-4" /> Create Fund
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {funds.map(f => <FundCard key={f.id} fund={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}
