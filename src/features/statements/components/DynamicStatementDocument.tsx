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
            <div className="bg-slate-900 text-slate-100 w-[794px] min-h-[1123px] overflow-hidden font-sans relative flex flex-col"
                style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>

                {/* Top Section: Dark Fintech Header */}
                <div className="p-12 pb-16">

                    {/* Header Top */}
                    <div className="flex justify-between items-end border-b pb-6 mb-8 border-slate-700/50">
                        <div>
                            <h1 className="text-3xl font-extrabold text-blue-400 tracking-tight">Velo.</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                {statusPrefix}{typePrefix} Statement
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-white">{monthLabel}</p>
                            <p className="text-sm text-slate-400 mt-1">Generated {format(new Date(), 'dd MMM yyyy')}</p>
                        </div>
                    </div>

                    {/* Entity Cards Overlay Array */}
                    {entityContext && filterType === 'fund' && (() => {
                        const dates = getFundPaymentDates(entityContext);
                        const totalScheduled = entityContext.amount * dates.length;
                        const totalPaid = dates.filter((d: Date) => isDatePaid(entityContext, d)).length * entityContext.amount;
                        const startDate = dates[0];
                        const endDate = dates[dates.length - 1];

                        return (
                            <div className="mb-6 pt-4">
                                <div className="grid grid-cols-2 gap-8">
                                    {/* Left side: Overview details */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2">Fund Overview</h3>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-sm font-medium text-slate-400">Period Start</span>
                                            <span className="text-sm font-bold text-white">{format(startDate, 'dd MMM yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-sm font-medium text-slate-400">Period End</span>
                                            <span className="text-sm font-bold text-white">{format(endDate, 'dd MMM yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-sm font-medium text-slate-400">Total Terms</span>
                                            <span className="text-sm font-bold text-white">{dates.length} Installments</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-sm font-medium text-slate-400">Base Installment</span>
                                            <span className="text-base font-mono font-bold text-white">₹{entityContext.amount.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>

                                    {/* Right side: Financial Status details */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2">Financial Status</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 border border-white/10 shadow-sm">
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Target Goal</p>
                                                <p className="text-xl font-mono text-white font-bold break-words">₹{totalScheduled.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 border border-white/10 shadow-sm">
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total Paid</p>
                                                <p className="text-xl font-mono text-white font-bold break-words">₹{totalPaid.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white/5 backdrop-blur-sm p-5 rounded-lg border border-white/10 shadow-sm">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Progress</span>
                                                <span className="text-sm font-bold text-white">{Math.round((totalPaid / totalScheduled) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-2">
                                                <div className="bg-blue-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.round((totalPaid / totalScheduled) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {entityContext && filterType === 'card' && (
                        <div className="mb-6 pt-4">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2">Billing Cycle Details</h3>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-sm font-medium text-slate-400">Statement Generated</span>
                                        <span className="text-sm font-bold text-white">Day {entityContext.billDate} of every month</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-sm font-medium text-slate-400">Payment Due Schedule</span>
                                        <span className="text-sm font-bold text-white">Day {entityContext.dueDate} of every month</span>
                                    </div>
                                    {entityContext.billingStartDate && (
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-sm font-medium text-slate-400">Cycle Active Since</span>
                                            <span className="text-sm font-bold text-white">{format(new Date(entityContext.billingStartDate), 'MMM yyyy')}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2">Card Performance</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 border border-white/10 shadow-sm">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total Paid</p>
                                            <p className="text-xl font-mono text-white font-bold break-words">
                                                ₹{((entityContext.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0)).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-5 border border-white/10 shadow-sm">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total Cleared</p>
                                            <p className="text-xl font-mono text-white font-bold break-words">
                                                {entityContext.payments?.length || 0} Cycles
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Area */}
                    {!entityContext && (
                        <div className="mb-6">
                            <div className="grid grid-cols-3 gap-6 bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                <div className="flex flex-col pl-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 filter drop-shadow-sm">Total Value Captured</span>
                                    <span className="text-3xl font-bold font-mono text-white tracking-tight break-words">₹{defaultMetrics.total.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex flex-col border-l border-slate-700 pl-6">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 filter drop-shadow-sm">Cleared / Paid Out</span>
                                    <span className="text-3xl font-bold font-mono text-emerald-400 tracking-tight break-words">₹{defaultMetrics.paid.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex flex-col border-l border-slate-700 pl-6">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 filter drop-shadow-sm">Overdue Deficits</span>
                                    <span className="text-3xl font-bold font-mono text-rose-400 tracking-tight break-words">₹{defaultMetrics.overdue.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Bottom Section: Soft Light Transactions Table */}
                <div className="bg-slate-50 flex-1 w-full rounded-t-[2.5rem] p-12 -mt-10 relative z-10 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] text-slate-800">
                    <section>
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 pb-2 flex justify-between items-end border-b-2 border-slate-200">
                            <span>Itemized Ledger Pipeline</span>
                            {statusFilter !== 'all' && <span className="text-xs text-slate-500 italic font-medium px-3 py-1 bg-white rounded-full border border-slate-200">Filter: {statusPrefix.trim()}</span>}
                        </h2>
                        {rows.length === 0 ? (
                            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                                <p className="text-slate-500 font-medium text-sm">No recorded data matches these filters.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rows.map((row, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-[0_4px_20px_rgba(59,130,246,0.1)] bg-white transition-all group">
                                        <div className="flex items-center gap-5">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-base">{!entityContext ? row.name : <span className="capitalize">{row.type} Payment</span>}</p>
                                                <p className="text-xs font-medium text-slate-500 mt-0.5">{row.dateLabel || format(row.dueDate, 'MMM dd, yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {row.isPaid ? (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-md text-[10px] uppercase tracking-widest font-bold text-emerald-600 border border-emerald-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Paid
                                                </div>
                                            ) : row.dueDate < new Date() ? (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 rounded-md text-[10px] uppercase tracking-widest font-bold text-rose-600 border border-rose-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Missed
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-md text-[10px] uppercase tracking-widest font-bold text-blue-600 border border-blue-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Pending
                                                </div>
                                            )}

                                            <div className="text-right w-32">
                                                <p className="text-lg font-mono font-extrabold text-slate-900 tracking-tight">₹{row.amount.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
