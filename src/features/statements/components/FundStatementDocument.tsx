import { Fund } from '@/features/funds/types';
import { getFundPaymentDates, isDatePaid, getPaidAmount } from '@/features/funds/utils/fundDateUtils';
import { format } from 'date-fns';

interface FundStatementDocumentProps {
    fund: Fund;
}

export function FundStatementDocument({ fund }: FundStatementDocumentProps) {
    const dates = getFundPaymentDates(fund);
    
    const stats = {
        totalScheduled: fund.amount * dates.length,
        totalPaid: dates.filter(d => isDatePaid(fund, d)).length * fund.amount,
        missedPayments: dates.filter(d => d < new Date() && !isDatePaid(fund, d)).length,
    };

    return (
        <div id="fund-statement-container" className="fixed -left-[10000px] top-0 bg-white">
            <div className="bg-white text-black w-[794px] min-h-[1123px] overflow-hidden p-12 font-sans relative"
                 style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>
                
                {/* Header */}
                <div className="flex justify-between items-end border-b-2 border-gray-200 pb-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">FinTrack.</h1>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-1">Fund Statement</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">{fund.name}</p>
                        <p className="text-sm text-gray-500">Generated on {format(new Date(), 'dd MMM yyyy')}</p>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Stats Area */}
                    <div className="grid grid-cols-3 gap-6 bg-gray-50 p-6 border border-gray-100 rounded">
                        <div>
                            <p className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Target Invested</p>
                            <p className="text-2xl font-bold font-mono">₹{(stats.totalScheduled || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Total Paid</p>
                            <p className="text-2xl font-bold font-mono text-green-700">₹{(stats.totalPaid || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-red-500 font-semibold tracking-wider">Missed Terms</p>
                            <p className="text-2xl font-bold font-mono text-red-600">{stats.missedPayments}</p>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                            Transaction History
                        </h2>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-widest">
                                    <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                                    <th className="py-3 px-4 font-semibold">Scheduled Date</th>
                                    <th className="py-3 px-4 font-semibold">Status</th>
                                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-800 divide-y divide-gray-100">
                                {dates.map((date, i) => {
                                    const isPaid = isDatePaid(fund, date);
                                    const paidAmount = getPaidAmount(fund, date);
                                    const isPast = date < new Date();
                                    return (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="py-4 px-4 font-medium text-center text-gray-400">{i + 1}</td>
                                            <td className="py-4 px-4">{format(date, 'dd MMM yyyy')}</td>
                                            <td className="py-4 px-4">
                                                {isPaid ? (
                                                    <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full bg-green-100 text-green-800">Paid</span>
                                                ) : isPast ? (
                                                    <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full bg-red-100 text-red-800">Missed</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full bg-blue-100 text-blue-800">Scheduled</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-right font-mono font-semibold">
                                                ₹{isPaid ? (paidAmount || fund.amount).toLocaleString() : fund.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </section>
                </div>
            </div>
        </div>
    );
}
