import { StatementRow } from '../types';
import { format } from 'date-fns';

interface DynamicStatementDocumentProps {
    rows: StatementRow[];
    monthLabel: string;
    filterType: string;
    statusFilter?: string;
    metrics?: { paid: number, pending: number, overdue: number };
}

export function DynamicStatementDocument({ rows, monthLabel, filterType, statusFilter = 'all', metrics }: DynamicStatementDocumentProps) {
    const defaultMetrics = metrics || { paid: 0, pending: 0, overdue: 0, total: rows.reduce((acc, r) => acc + r.amount, 0) };

    const typePrefix = filterType === 'fund' ? 'Fund' : filterType === 'card' ? 'Card' : 'Consolidated';
    const statusPrefix = statusFilter === 'paid' ? 'Paid ' : statusFilter === 'overdue' ? 'Overdue ' : statusFilter === 'pending' ? 'Pending ' : '';
    
    return (
        <div id="dynamic-statement-container" className="hidden">
            <div className="bg-white text-black w-[794px] min-h-[1123px] overflow-hidden p-12 font-sans relative"
                 style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>
                
                {/* Header */}
                <div className="flex justify-between items-end border-b-2 border-gray-200 pb-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Velo.</h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
                            {statusPrefix}{typePrefix} Statement
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">{monthLabel}</p>
                        <p className="text-sm text-gray-500 mt-1">Generated on {format(new Date(), 'dd MMM yyyy')}</p>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Summary Area */}
                    <div className="grid grid-cols-3 gap-6 bg-gray-50 p-6 border border-gray-100 rounded">
                        <div>
                            <p className="text-xs uppercase text-emerald-600 font-semibold tracking-wider">Total Paid</p>
                            <p className="text-2xl font-bold font-mono text-emerald-700">₹{defaultMetrics.paid.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-blue-600 font-semibold tracking-wider">Pending</p>
                            <p className="text-2xl font-bold font-mono text-blue-700">₹{defaultMetrics.pending.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-red-600 font-semibold tracking-wider">Overdue</p>
                            <p className="text-2xl font-bold font-mono text-red-700">₹{defaultMetrics.overdue.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex justify-between">
                            <span>Itemized Activity</span>
                            {statusFilter !== 'all' && <span className="text-sm text-gray-400 italic">Filtered: {statusPrefix.trim()}</span>}
                        </h2>
                        {rows.length === 0 ? (
                            <p className="text-gray-500 italic text-sm">No recorded data matches these filters.</p>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-widest">
                                        <th className="py-3 px-4 font-semibold w-24">Type</th>
                                        <th className="py-3 px-4 font-semibold">Entity Name</th>
                                        <th className="py-3 px-4 font-semibold">Period / Date</th>
                                        <th className="py-3 px-4 font-semibold">Status</th>
                                        <th className="py-3 px-4 font-semibold text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-800 divide-y divide-gray-100">
                                    {rows.map((row, i) => {
                                        return (
                                            <tr key={i} className="hover:bg-gray-50/50">
                                                <td className="py-4 px-4 font-semibold text-gray-400 capitalize">{row.type}</td>
                                                <td className="py-4 px-4 font-medium">{row.name}</td>
                                                <td className="py-4 px-4 whitespace-nowrap text-xs">{row.dateLabel || format(row.dueDate, 'dd MMM yyyy')}</td>
                                                <td className="py-4 px-4 align-middle">
                                                    {row.isPaid ? (
                                                        <span className="inline-block px-3 pt-[5px] pb-[3px] text-[10px] uppercase tracking-wider font-bold rounded-full bg-green-100 text-green-800 align-middle">Paid</span>
                                                    ) : row.dueDate < new Date() ? (
                                                        <span className="inline-block px-3 pt-[5px] pb-[3px] text-[10px] uppercase tracking-wider font-bold rounded-full bg-red-100 text-red-800 align-middle">Missed</span>
                                                    ) : (
                                                        <span className="inline-block px-3 pt-[5px] pb-[3px] text-[10px] uppercase tracking-wider font-bold rounded-full bg-blue-100 text-blue-800 align-middle">Pending</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-right font-mono font-semibold">
                                                    ₹{row.amount.toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
