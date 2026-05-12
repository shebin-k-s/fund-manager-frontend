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
    const defaultMetrics = metrics
        ? { ...metrics, total: metrics.total ?? (metrics.paid + metrics.pending + metrics.overdue) }
        : { paid: 0, pending: 0, overdue: 0, total: rows.reduce((acc, r) => acc + r.amount, 0) };

    const typePrefix = filterType === 'fund' ? 'Fund' : filterType === 'card' ? 'Card' : 'Consolidated';
    const statusPrefix = statusFilter === 'paid' ? 'Paid ' : statusFilter === 'overdue' ? 'Overdue ' : statusFilter === 'pending' ? 'Pending ' : '';

    return (
        <div id="dynamic-statement-container" style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -1 }}>
            <div style={{
                width: '794px',
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                backgroundColor: '#ffffff',
                color: '#0f172a',
            }}>
                {/* ── Dark Header ── */}
                <div style={{ backgroundColor: '#0f172a', padding: '40px 48px 32px' }}>
                    {/* Branding row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #334155', paddingBottom: '24px', marginBottom: '28px' }}>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.5px' }}>Velo.</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '6px' }}>
                                {statusPrefix}{typePrefix} Statement
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>{monthLabel}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                Generated {format(new Date(), 'dd MMM yyyy')}
                            </div>
                        </div>
                    </div>

                    {/* Fund entity context */}
                    {entityContext && filterType === 'fund' && (() => {
                        const dates = getFundPaymentDates(entityContext);
                        const totalScheduled = entityContext.amount * dates.length;
                        const totalPaid = dates.filter((d: Date) => isDatePaid(entityContext, d)).length * entityContext.amount;
                        const progress = totalScheduled > 0 ? Math.round((totalPaid / totalScheduled) * 100) : 0;
                        return (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '16px' }}>Fund Overview</div>
                                    {[
                                        ['Period Start', dates[0] ? format(dates[0], 'dd MMM yyyy') : '—'],
                                        ['Period End', dates[dates.length - 1] ? format(dates[dates.length - 1], 'dd MMM yyyy') : '—'],
                                        ['Total Terms', `${dates.length} Installments`],
                                        ['Base Installment', `₹${entityContext.amount.toLocaleString('en-IN')}`],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>{label}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '16px' }}>Financial Status</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                        {[
                                            ['Target Goal', `₹${totalScheduled.toLocaleString('en-IN')}`],
                                            ['Total Paid', `₹${totalPaid.toLocaleString('en-IN')}`],
                                        ].map(([label, value]) => (
                                            <div key={label} style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px', border: '1px solid #334155' }}>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>
                                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace' }}>{value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px', border: '1px solid #334155' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Progress</span>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{progress}%</span>
                                        </div>
                                        <div style={{ backgroundColor: '#334155', borderRadius: '4px', height: '6px' }}>
                                            <div style={{ backgroundColor: '#60a5fa', borderRadius: '4px', height: '6px', width: `${progress}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Card entity context */}
                    {entityContext && filterType === 'card' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '16px' }}>Billing Cycle Details</div>
                                {[
                                    ['Statement Generated', `Day ${entityContext.billDate} of every month`],
                                    ['Payment Due', `Day ${entityContext.dueDate} of every month`],
                                    ...(entityContext.billingStartDate ? [['Active Since', format(new Date(entityContext.billingStartDate), 'MMM yyyy')]] : []),
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>{label}</span>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '16px' }}>Card Performance</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {[
                                        ['Total Paid', `₹${((entityContext.payments || []).reduce((s: number, p: any) => s + (parseFloat(String(p.amount).replace(/,/g, '')) || 0), 0)).toLocaleString('en-IN')}`],
                                        ['Cycles Cleared', `${entityContext.payments?.length || 0}`],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px', border: '1px solid #334155' }}>
                                            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>
                                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace' }}>{value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Consolidated summary */}
                    {!entityContext && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="statement-block">
                            {[
                                { label: 'Total Captured', value: `₹${defaultMetrics.total.toLocaleString('en-IN')}`, color: '#f1f5f9' },
                                { label: 'Cleared / Paid', value: `₹${defaultMetrics.paid.toLocaleString('en-IN')}`, color: '#34d399' },
                                { label: 'Overdue Deficit', value: `₹${defaultMetrics.overdue.toLocaleString('en-IN')}`, color: '#f87171' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155' }}>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>{label}</div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Transaction Table ── */}
                <div style={{ backgroundColor: '#f8fafc', padding: '32px 48px 48px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                            Itemized Transactions
                        </span>
                        {statusFilter !== 'all' && (
                            <span style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '3px 12px' }}>
                                Filter: {statusPrefix.trim()}
                            </span>
                        )}
                    </div>

                    {rows.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No recorded data matches these filters.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {rows.map((row, i) => {
                                const isOverdue = !row.isPaid && row.dueDate < new Date();
                                const badge = row.isPaid
                                    ? { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0', label: 'Paid' }
                                    : isOverdue
                                        ? { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: 'Missed' }
                                        : { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', label: 'Pending' };

                                return (
                                    <div
                                        key={i}
                                        className="transaction-row"
                                        style={{
                                            padding: '14px 18px',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                        }}
                                    >
                                        {/* Line 1: name + amount */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                                {`${String(i + 1).padStart(2, '0')}. `}
                                                {!entityContext ? row.name : `${row.type.charAt(0).toUpperCase() + row.type.slice(1)} Payment`}
                                            </div>
                                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                                                {row.type === 'card' && !row.isPaid ? 'TBA' : `₹${Number(row.amount).toLocaleString('en-IN')}`}
                                            </div>
                                        </div>
                                        {/* Line 2: date + status text */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                {row.dateLabel || format(row.dueDate, 'dd MMM yyyy')}
                                            </div>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: badge.text, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                {badge.label}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
