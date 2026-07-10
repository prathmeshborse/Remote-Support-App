// File path: client/src/components/Navbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Navbar() {
    const navigate = useNavigate();

    const scrollToWorkflow = () => {
        const el = document.getElementById("workflow");
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-50/70 border-b border-slate-100">
            <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="text-lg font-semibold tracking-tight text-slate-900">
                        Portal<span className="text-blue-600">.rtc</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={scrollToWorkflow}
                        className="hidden md:block text-sm text-slate-600 hover:text-slate-900 transition-colors focus:outline-none"
                    >
                        Features
                    </button>

                    <button
                        onClick={() => navigate("/login")}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-all active:scale-[0.98] shadow-sm shadow-blue-600/20"
                    >
                        Start Journey
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </nav>
        </header>
    );
}