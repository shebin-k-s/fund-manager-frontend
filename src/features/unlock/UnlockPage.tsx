// UnlockPage.tsx
import apiClient from "@/lib/apiClient";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2, Lock } from "lucide-react";

export default function UnlockPage() {
    const [key, setKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!key.trim()) {
            setError("Access key required");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const res = await apiClient.post("/unlock", { key });
            localStorage.setItem("auth_token", res.data.accessToken);
            navigate("/", { replace: true });
        } catch (err) {
            setError("Invalid access key");
            setKey("");
        } finally {
            setIsLoading(false);
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

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-gray-300 mb-2">
                                $ ENTER ACCESS KEY
                            </label>
                            <input
                                type="password"
                                value={key}
                                onChange={(e) => {
                                    setKey(e.target.value);
                                    setError("");
                                }}
                                className="w-full bg-black border border-[#333] rounded px-3 py-3 text-white font-mono text-sm focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors"
                                placeholder="••••••••"
                                autoFocus
                                disabled={isLoading}
                            />
                            {error && (
                                <p className="text-xs font-mono text-red-400 mt-2">
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
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
                    </form>

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