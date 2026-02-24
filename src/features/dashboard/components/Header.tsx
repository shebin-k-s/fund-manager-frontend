// features/dashboard/components/Header.tsx
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DashboardHeaderProps {
    onLogout?: () => void;
}

export function DashboardHeader({ onLogout }: DashboardHeaderProps) {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleConfirmLogout = () => {
        if (onLogout) {
            onLogout();
        }
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <header className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#333]">
                <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
                    <div>
                        <h1 className="text-xl font-mono text-white">Dashboard</h1>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">
                            secure area
                        </p>
                    </div>

                    {/* Logout Button */}
                    {onLogout && (
                        <button
                            onClick={handleLogoutClick}
                            className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Logout"
                        >

                            <LogOut className="w-5 h-5" />

                        </button>
                    )}
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