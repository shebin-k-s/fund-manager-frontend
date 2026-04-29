import { StatementRow } from '../types';
import { format } from 'date-fns';
import { getFundPaymentDates, isDatePaid } from '@/features/funds/utils/fundDateUtils';

interface DynamicStatementDocumentProps {
    rows: StatementRow[];
    monthLabel: string;
    filterType: string;
    statusFilter?: string;
    metrics?: { paid: number, pending: number, overdue: number, total?: number };
    entityContext?: any;
}

export function DynamicStatementDocument({ rows, monthLabel, filterType, statusFilter = 'all', metrics, entityContext }: DynamicStatementDocumentProps) {
    // Provide explicit mathematical fallback for implicit metric destructuring to prevent union-type TS bugs
    const defaultMetrics = metrics
        ? { ...metrics, total: metrics.total ?? (metrics.paid + metrics.pending + metrics.overdue) }
        : { paid: 0, pending: 0, overdue: 0, total: rows.reduce((acc, r) => acc + r.amount, 0) };

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
                    {/* Cover Page Overrides for Physical A4 Paging Breaks */}
                    {entityContext && filterType === 'fund' && (() => {
                        const dates = getFundPaymentDates(entityContext);
                        const totalScheduled = entityContext.amount * dates.length;
                        const totalPaid = dates.filter((d: Date) => isDatePaid(entityContext, d)).length * entityContext.amount;
                        const startDate = dates[0];
                        const endDate = dates[dates.length - 1];

                        return (
                            <div className="mb-12">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-900">
                                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">{entityContext.name}</h2>
                                    <div className="text-right">
                                        <span className="inline-block px-4 py-1.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-full">Fund Detail Report</span>
                                    </div>
                                </div>

                                <div className="flex gap-12">
                                    <div className="flex-1 space-y-5">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Fund Overview</h3>
                                        <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                            <span className="text-sm font-medium text-gray-500">Period Start</span>
                                            <span className="text-sm font-bold text-gray-900">{format(startDate, 'dd MMM yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                            <span className="text-sm font-medium text-gray-500">Period End</span>
                                            <span className="text-sm font-bold text-gray-900">{format(endDate, 'dd MMM yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                            <span className="text-sm font-medium text-gray-500">Total Terms</span>
                                            <span className="text-sm font-bold text-gray-900">{dates.length} Installments</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                            <span className="text-sm font-medium text-gray-500">Base Installment</span>
                                            <span className="text-base font-mono font-bold text-gray-900 block">₹{entityContext.amount.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Financial Status</h3>

                                        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-5 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Target Goal</p>
                                                <p className="text-xl font-mono text-gray-800 font-black">₹{totalScheduled.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-1">Total Paid</p>
                                                <p className="text-xl font-mono text-emerald-600 font-black">₹{totalPaid.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Progress</span>
                                                <span className="text-sm font-black text-gray-900">{Math.round((totalPaid / totalScheduled) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div className="bg-gray-900 h-2 rounded-full" style={{ width: `${Math.round((totalPaid / totalScheduled) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {entityContext && filterType === 'card' && (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-900">
                                <div>
                                    <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-baseline">
                                        {entityContext.name}
                                        {entityContext.lastFour && <span className="ml-4 text-xl font-mono text-gray-400 font-medium">•••• {entityContext.lastFour}</span>}
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-4 py-1.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-full">Credit Card Report</span>
                                </div>
                            </div>

                            <div className="flex gap-12">
                                <div className="flex-1 space-y-5">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Billing Cycle Details</h3>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-sm font-medium text-gray-500">Statement Generated</span>
                                        <span className="text-sm font-bold text-gray-900">Day {entityContext.billDate} of every month</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                                        <span className="text-sm font-medium text-gray-500">Payment Due Schedule</span>
                                        <span className="text-sm font-bold text-gray-900">Day {entityContext.dueDate} of every month</span>
                                    </div>
                                </div>
                                <div className="flex-1 opacity-5 select-none flex flex-col justify-center items-center">
                                    <h1 className="text-9xl font-black italic tracking-tighter mix-blend-multiply">Velo</h1>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Area */}
                    {!entityContext && (
                        <div className="mb-10">
                            <div className="grid grid-cols-3 gap-6 bg-gray-50 p-8 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 filter drop-shadow-sm">Total Value Captured</span>
                                    <span className="text-3xl font-black font-mono text-gray-900 tracking-tight">₹{defaultMetrics.total.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex flex-col border-l border-gray-200 pl-6">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 filter drop-shadow-sm">Cleared / Paid Out</span>
                                    <span className="text-3xl font-black font-mono text-emerald-600 tracking-tight">₹{defaultMetrics.paid.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex flex-col border-l border-gray-200 pl-6">
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1 filter drop-shadow-sm">Overdue Deficits</span>
                                    <span className="text-3xl font-black font-mono text-red-600 tracking-tight">₹{defaultMetrics.overdue.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    )}


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
                                        <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
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
                                                <td className="py-4 px-4 font-medium text-center text-gray-400">{i + 1}</td>
                                                <td className="py-4 px-4 font-semibold text-gray-400 capitalize">{row.type}</td>
                                                <td className="py-4 px-4 font-medium">{row.name}</td>
                                                <td className="py-4 px-4 whitespace-nowrap text-xs">{row.dateLabel || format(row.dueDate, 'dd MMM yyyy')}</td>
                                                <td className="py-4 px-4 align-middle">
                                                    {row.isPaid ? (
                                                        <span className="inline-block align-middle text-[10px] uppercase tracking-widest font-black text-emerald-600">Paid</span>
                                                    ) : row.dueDate < new Date() ? (
                                                        <span className="inline-block align-middle text-[10px] uppercase tracking-widest font-black text-red-600">Missed</span>
                                                    ) : (
                                                        <span className="inline-block align-middle text-[10px] uppercase tracking-widest font-black text-blue-600">Pending</span>
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
