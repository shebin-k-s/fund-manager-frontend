import {
    LogOut,
    Loader2,
    Activity,
    AlertCircle,
    Bell,
    BellOff,
    BellRing
} from 'lucide-react';

import { useState } from 'react';
import { useServerStatus, ServerStatus } from '@/hooks/useServerStatus';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
    onLogout?: () => void;
}

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const { serverStatus } = useServerStatus();
    const { permission, requestPermission, triggerPush } = useNotifications();

    const notificationsGranted = permission === 'granted';

    const statusConfig: Record<
        ServerStatus,
        {
            icon: React.ElementType;
            color: string;
            bg: string;
            dot: string;
            label: string;
            animation: string;
        }
    > = {
        live: {
            icon: Activity,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            dot: 'bg-emerald-400',
            label: 'Live',
            animation: 'animate-pulse',
        },
        waking: {
            icon: Loader2,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
            dot: 'bg-amber-400',
            label: 'Waking up',
            animation: 'animate-spin',
        },
        error: {
            icon: AlertCircle,
            color: 'text-red-400',
            bg: 'bg-red-500/10 border-red-500/20',
            dot: 'bg-red-400',
            label: 'Server error',
            animation: '',
        },
    };

    const { icon: StatusIcon, color, bg, dot, label, animation } =
        statusConfig[serverStatus];

    // 🔥 unified bell behavior
    const handleBellClick = async () => {
        if (permission === 'default') {
            await requestPermission();
            return;
        }

        if (permission === 'granted') {
            triggerPush();
            return;
        }

        // denied → do nothing (or show toast if you have one)
    };

    return (
        <>
            {/* The header is sticky. We increase opacity to /95 and use backdrop-blur-2xl to prevent content from making the text hard to read on scroll */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-2xl border-b border-white/10 shadow-sm">

                {/* Main row */}
                <div className="px-5 pt-5 pb-4 flex items-center justify-between max-w-lg mx-auto gap-3">

                    {/* Title */}
                    <div className="min-w-0">
                        <h1 className="text-2xl font-black tracking-tight text-white leading-none">
                            Dashboard
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            Secure Session
                        </p>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2 shrink-0">

                        {/* Server status */}
                        <div
                            className={cn(
                                'flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider',
                                bg,
                                color
                            )}
                        >
                            <span
                                className={cn(
                                    'w-1.5 h-1.5 rounded-full shrink-0',
                                    dot,
                                    serverStatus === 'live' && 'animate-pulse'
                                )}
                            />
                            <StatusIcon
                                className={cn('w-3 h-3 shrink-0', animation)}
                            />
                            <span>{label}</span>
                        </div>

                        {/* 🔔 Bell (single unified control) */}
                        <button
                            onClick={handleBellClick}
                            title={
                                permission === 'granted'
                                    ? 'Send test notification'
                                    : permission === 'denied'
                                        ? 'Notifications blocked'
                                        : 'Enable notifications'
                            }
                            aria-label="Notifications"
                            className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95',
                                notificationsGranted
                                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                    : 'bg-white/[0.04] border-white/[0.08] text-gray-500 hover:text-gray-300 hover:bg-white/[0.08]'
                            )}
                        >
                            {permission === 'granted' ? (
                                <BellRing className="w-4 h-4" />
                            ) : permission === 'denied' ? (
                                <BellOff className="w-4 h-4" />
                            ) : (
                                <Bell className="w-4 h-4" />
                            )}
                        </button>

                        {/* Logout */}
                        {onLogout && (
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                aria-label="Logout"
                                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-95"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Logout Modal */}
            {showLogoutConfirm && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                    onClick={() => setShowLogoutConfirm(false)}
                >
                    <div
                        className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                            <LogOut className="w-4 h-4 text-red-400" />
                        </div>

                        <h3 className="text-[15px] font-semibold text-white mb-1">
                            Sign out?
                        </h3>
                        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                            You'll need your access key to sign back in.
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 h-10 rounded-xl border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onLogout?.();
                                    setShowLogoutConfirm(false);
                                }}
                                className="flex-1 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}