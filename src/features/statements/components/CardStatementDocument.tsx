import { CreditCard } from '@/features/credit-cards/types';
import { getBillingCycles } from '@/features/credit-cards/utils/cardDateUtils';
import { format } from 'date-fns';

interface CardStatementDocumentProps {
    card: CreditCard;
}

export function CardStatementDocument({ card }: CardStatementDocumentProps) {
    const cycles = getBillingCycles(card);
    
    return (
        <div id="card-statement-container" className="hidden">
            <div className="bg-white text-black w-[794px] min-h-[1123px] overflow-hidden p-12 font-sans relative"
                 style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>
                
                {/* Header */}
                <div className="flex justify-between items-end border-b-2 border-gray-200 pb-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Velo.</h1>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-1">Credit Card Statement</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">{card.name}</p>
                        {card.lastFour && <p className="text-sm font-mono text-gray-500 mb-1">**** **** **** {card.lastFour}</p>}
                        <p className="text-sm text-gray-500">Generated on {format(new Date(), 'dd MMM yyyy')}</p>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Billing History */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                            Billing Cycles
                        </h2>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-widest">
                                    <th className="py-3 px-4 font-semibold">Billing Month</th>
                                    <th className="py-3 px-4 font-semibold">Due Date</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 font-semibold text-right">Cleared Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-800 divide-y divide-gray-100">
                                {cycles.map((cycle, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="py-4 px-4 font-medium">{cycle.month}</td>
                                        <td className="py-4 px-4">{format(cycle.dueDate, 'dd MMM yyyy')}</td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center justify-center leading-none px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                                                cycle.isPaid ? 'bg-green-100 text-green-800' :
                                                cycle.isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {cycle.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right font-mono font-semibold">
                                            {cycle.isPaid && cycle.paidAmount ? `₹${cycle.paidAmount.toLocaleString()}` : <span className="text-gray-400 italic">--</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </div>
            </div>
        </div>
    );
}
