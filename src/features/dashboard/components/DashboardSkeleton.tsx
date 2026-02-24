import React from 'react'

type Props = {}

const DashboardSkeleton = (props: Props) => {
    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="page-content space-y-5">
                {/* Stats skeletons */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="stat-card">
                        <div className="w-8 h-8 rounded-lg bg-muted animate-pulse mb-2.5"></div>
                        <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2"></div>
                        <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="stat-card">
                        <div className="w-8 h-8 rounded-lg bg-muted animate-pulse mb-2.5"></div>
                        <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2"></div>
                        <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                    </div>
                </div>

                {/* Upcoming section skeletons */}
                <div>
                    <div className="h-4 w-40 bg-muted rounded animate-pulse mb-3"></div>
                    <div className="space-y-2.5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="touch-card p-3.5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-muted animate-pulse"></div>
                                <div className="flex-1">
                                    <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2"></div>
                                    <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                                </div>
                                <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardSkeleton