import { LogOut, Loader2, Server, Activity, AlertCircle, Bell, BellOff } from 'lucide-react';
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
    const { permission, requestPermission } = useNotifications();

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleConfirmLogout = () => {
        if (onLogout) {
            onLogout();
        }
        setShowLogoutConfirm(false);
    };

    const statusConfig: Record<ServerStatus, { icon: any, color: string, label: string, animation: string }> = {
        live: { icon: Activity, color: 'text-emerald-500', label: 'Server Live', animation: 'animate-pulse' },
        waking: { icon: Loader2, color: 'text-amber-500', label: 'Waking up...', animation: 'animate-spin' },
        error: { icon: AlertCircle, color: 'text-red-500', label: 'Server Error', animation: '' }
    };

    const { icon: StatusIcon, color, label, animation } = statusConfig[serverStatus];

    return (
        <>
            <header className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#333]">
                <div className="px-5 py-4 flex items-center justify-between max-w-lg mx-auto">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white/95">Dashboard</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80 mt-0.5">
                            Secure Session
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Server Status Indicator */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 group cursor-help transition-all hover:bg-white/10">
                            <StatusIcon className={`w-3.5 h-3.5 ${color} ${animation}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-200 hide-on-narrow">
                                {label}
                            </span>
                        </div>

                        {/* Notification Toggle */}
                        <button
                            onClick={requestPermission}
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95",
                                permission === 'granted' 
                                    ? "bg-primary/10 text-primary border border-primary/20" 
                                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                            )}
                            aria-label="Toggle Notifications"
                        >
                            {permission === 'granted' ? (
                                <Bell className="w-5 h-5" />
                            ) : (
                                <BellOff className="w-5 h-5" />
                            )}
                        </button>

                        {/* Logout Button */}
                        {onLogout && (
                            <button
                                onClick={handleLogoutClick}
                                className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all active:scale-95"
                                aria-label="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-[#333] rounded-lg max-w-sm w-full p-6">
                        <h3 className="text-lg font-mono text-white mb-2">Confirm Logout</h3>
                        <p className="text-sm font-mono text-gray-400 mb-6">
                            Are you sure you want to logout? You'll need to enter your access key again.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-[#333] text-gray-300 hover:bg-[#1A1A1A] transition-colors font-mono text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLogout}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-mono text-sm disabled:opacity-50"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}