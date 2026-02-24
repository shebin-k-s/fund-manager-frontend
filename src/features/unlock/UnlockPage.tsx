// UnlockPage.tsx
import apiClient from "@/lib/apiClient";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";

export default function UnlockPage() {
    const [key, setKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleUnlock = async (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;

        if (!key.trim()) {
            setError("Access key required");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            console.log("Sending request...");
            const res = await apiClient.post("/unlock", { key });
            console.log("Response:", res.data);

            if (res.data.accessToken) {
                localStorage.setItem("auth_token", res.data.accessToken);
                // Small delay to ensure localStorage is set
                setTimeout(() => {
                    navigate("/", { replace: true });
                }, 100);
            }
        } catch (err: any) {
            console.log("Error:", err.response?.data || err.message);

            // Handle error gracefully - no page refresh!
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError("Invalid access key");
            }
        } finally {
            setIsLoading(false);
        }

        return false;
    };

    const handleButtonClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading) {
            handleUnlock(e);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Simple Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 border border-[#333] rounded-2xl mb-4">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-xl font-mono text-white mb-1 tracking-tight">
                        RESTRICTED ACCESS
                    </h1>
                    <p className="text-sm font-mono text-gray-400">
                        Authentication required
                    </p>
                </div>

                {/* Terminal-style Card */}
                <div className="border border-[#333] bg-[#111] rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#333]">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-xs font-mono text-gray-400 ml-auto">secure://auth</span>
                    </div>

                    {/* Using div instead of form for complete control */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-gray-300 mb-2">
                                $ ENTER ACCESS KEY
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={key}
                                    onChange={(e) => {
                                        setKey(e.target.value);
                                        setError("");
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isLoading) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleUnlock(e);
                                        }
                                    }}
                                    className="w-full bg-black border border-[#333] rounded px-3 py-3 text-white font-mono text-sm focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors pr-10"
                                    placeholder="••••••••"
                                    autoFocus
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowPassword(!showPassword);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {error && (
                                <p className="text-xs font-mono text-red-400 mt-2 flex items-center gap-1">
                                    <span>✗</span> {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleButtonClick}
                            disabled={isLoading}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-[#444]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    authenticating...
                                </>
                            ) : (
                                "> UNLOCK"
                            )}
                        </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#333]">
                        <p className="text-[10px] font-mono text-gray-300 text-center">
                            © 2026 • secure connection • v2.1.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}