// features/dashboard/components/Header.tsx
import { LogOut } from 'lucide-react';
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

    const handleCancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
                <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
                    <div>
                        <h1 className="text-xl font-bold">Dashboard</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Welcome back!
                        </p>
                    </div>

                    {/* Logout Button */}
                    {onLogout && (
                        <button
                            onClick={handleLogoutClick}
                            className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                            aria-label="Logout"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </header>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-xl max-w-sm w-full p-6 border border-border">
                        <h3 className="text-lg font-semibold mb-2">Logout</h3>
                        <p className="text-muted-foreground mb-6">
                            Are you sure you want to logout? You'll need to enter your access key again to return.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelLogout}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-accent transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLogout}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
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