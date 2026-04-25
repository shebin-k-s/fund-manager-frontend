import { Fund } from '@/features/funds/types';
import { CreditCard } from '@/features/credit-cards/types';
import { getBillingCycles } from '@/features/credit-cards/utils/cardDateUtils';
import { getFundPaymentDates, getPaidAmount, isDatePaid } from '@/features/funds/utils/fundDateUtils';
import { addMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface StatementDocumentProps {
    funds: Fund[];
    cards: CreditCard[];
}

export function StatementDocument({ funds, cards }: StatementDocumentProps) {
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    const monthLabel = format(currentMonthStart, 'MMMM yyyy');

    // Filter funds due this month
    const activeFunds = funds.flatMap(fund => {
        const dates = getFundPaymentDates(fund, currentMonthEnd);
        const thisMonthDates = dates.filter(d => isWithinInterval(d, { start: currentMonthStart, end: currentMonthEnd }));
        
        return thisMonthDates.map(date => {
            const isPaid = isDatePaid(fund, date);
            return {
                name: fund.name,
                dueDate: date,
                amount: fund.amount,
                isPaid
            };
        });
    });

    // Filter cards due this month
    const activeCards = cards.flatMap(card => {
        const cycles = getBillingCycles(card, currentMonthEnd);
        const thisMonthCycles = cycles.filter(c => isWithinInterval(c.dueDate, { start: currentMonthStart, end: currentMonthEnd }));

        return thisMonthCycles.map(c => ({
            name: card.name,
            dueDate: c.dueDate,
            amount: c.paidAmount || 0,
            isPaid: c.isPaid,
            paidAmount: c.paidAmount
        }));
    });

    return (
        <div 
            id="pdf-statement-container" 
            className="fixed -left-[10000px] top-0 bg-white"
        >
            {/* A4 Document Container - Strict Dimensions & Styling */}
            <div 
                className="bg-white text-black w-[794px] h-[1123px] overflow-hidden p-12 font-sans relative"
                style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}
            >
                {/* Header */}
                <div className="flex justify-between items-end border-b-2 border-gray-200 pb-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">FinTrack.</h1>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-1">Official Statement</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">{monthLabel}</p>
                        <p className="text-sm text-gray-500">Generated on {format(new Date(), 'dd MMM yyyy')}</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-10">
                    
                    {/* Funds Section */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                            Fund Payments
                        </h2>
                        {activeFunds.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">No fund payments scheduled for this month.</p>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-widest">
                                        <th className="py-3 px-4 font-semibold">Fund Name</th>
                                        <th className="py-3 px-4 font-semibold">Due Date</th>
                                        <th className="py-3 px-4 font-semibold">Status</th>
                                        <th className="py-3 px-4 font-semibold text-right">Target Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-800 divide-y divide-gray-100">
                                    {activeFunds.map((entry, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="py-4 px-4 font-medium">{entry.name}</td>
                                            <td className="py-4 px-4">{format(entry.dueDate, 'dd MMM yyyy')}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${entry.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {entry.isPaid ? 'Paid' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right font-mono font-semibold">
                                                ₹{entry.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>

                    {/* Credit Cards Section */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                            Credit Card Dues
                        </h2>
                        {activeCards.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">No credit card dues for this month.</p>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-widest">
                                        <th className="py-3 px-4 font-semibold">Card Name</th>
                                        <th className="py-3 px-4 font-semibold">Due Date</th>
                                        <th className="py-3 px-4 font-semibold">Status</th>
                                        <th className="py-3 px-4 font-semibold text-right">Clearance</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-800 divide-y divide-gray-100">
                                    {activeCards.map((entry, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="py-4 px-4 font-medium">{entry.name}</td>
                                            <td className="py-4 px-4">{format(entry.dueDate, 'dd MMM yyyy')}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${entry.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {entry.isPaid ? 'Paid' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                {entry.isPaid ? (
                                                    <span className="font-mono font-semibold text-green-700">₹{entry.paidAmount?.toLocaleString() || 'N/A'}</span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Awaiting clearance</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>

                </div>

                {/* Footer */}
                <div className="absolute bottom-12 left-12 right-12 border-t border-gray-200 pt-6 flex justify-between items-center">
                    <p className="text-xs text-gray-400 font-medium tracking-wide">CONFIDENTIAL & PRIVATE</p>
                    <p className="text-xs text-gray-400">Page 1 of 1</p>
                </div>
            </div>
        </div>
    );
}
