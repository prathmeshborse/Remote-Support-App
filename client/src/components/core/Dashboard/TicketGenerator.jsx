// File path: client/src/components/core/Dashboard/TicketGenerator.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link2, Loader2, Check, Copy, ScreenShare } from "lucide-react";
import { toast } from "react-hot-toast";
import { createTicket } from "../../../services/operations/ticketAPI";

export default function TicketGenerator({ onTicketCreated }) {
    const navigate = useNavigate();

    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState(null); // { url, roomId }
    const [copied, setCopied] = useState(false);

    const canGenerate = clientName.trim() && clientEmail.trim();

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!canGenerate) return;

        setIsGenerating(true);
        setGeneratedLink(null);

        try {
            // Connect directly to your backend Ticket REST endpoint
            const result = await createTicket(clientName, clientEmail);

            if (result?.success && result?.data) {
                setGeneratedLink({
                    url: result.joiningUrl,
                    roomId: result.data.roomId
                });

                // Add newly generated ticket dynamically to frontend history
                onTicketCreated?.(result.data);

                toast.success("Ticket and invite email successfully generated!");
                setClientName("");
                setClientEmail("");
            }
        } catch (error) {
            toast.error(error.message || "Failed to create support ticket.");
        } finally {
            setIsGenerating(false); // Clean and isolated loader reset
        }
    };

    const handleCopy = async () => {
        if (!generatedLink) return;
        try {
            await navigator.clipboard.writeText(generatedLink.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    const handleJoinRoom = () => {
        if (!generatedLink) return;
        // Pass the private history state flag to satisfy the direct access check
        navigate(`/room/${generatedLink.roomId}`, {
            state: { fromDashboard: true },
        });
    };

    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-7">
            <div className="flex items-center gap-2 mb-1 select-none">
                <Link2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-900">
                    Generate a support link
                </h2>
            </div>
            <p className="text-sm text-slate-500 mb-6 select-none">
                Send a client a one-click invitation directly to their email to join a support session.
            </p>

            <form onSubmit={handleGenerate} className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Client Name
                    </label>
                    <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Jordan Lee"
                        required
                        className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Client Email
                    </label>
                    <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="jordan@example.com"
                        required
                        className="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                </div>

                <div className="sm:col-span-2">
                    <button
                        type="submit"
                        disabled={!canGenerate || isGenerating}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all active:scale-[0.98] w-full sm:w-auto focus:outline-none"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating…
                            </>
                        ) : (
                            "Generate secure link"
                        )}
                    </button>
                </div>
            </form>

            {/* Generated Success Card */}
            {generatedLink && (
                <div className="mt-6 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="flex-1 text-sm text-slate-700 font-mono truncate">
                        {generatedLink.url}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-2 rounded-full transition-all active:scale-[0.98] focus:outline-none"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy Link
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleJoinRoom}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-full transition-all active:scale-[0.98] focus:outline-none"
                        >
                            <ScreenShare className="w-3.5 h-3.5" />
                            Join Room
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}