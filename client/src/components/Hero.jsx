// File path: client/src/components/Hero.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ScreenShare, Cpu, FileText, Circle } from "lucide-react";

export default function Hero() {
  const navigate = useNavigate();

  const scrollToWorkflow = () => {
    const el = document.getElementById("workflow");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
            <Circle className="w-2 h-2 fill-blue-600 text-blue-600" />
            No installations. Ever.
          </div>

          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-slate-900 leading-[1.08]">
            Remote support made simple.
            <br />
            <span className="text-slate-400">No installations required.</span>
          </h1>

          <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
            Share screens, transfer diagnostic files, and get technical help
            directly in your web browser. Connect with an expert in seconds.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3.5 rounded-full transition-all active:scale-[0.98] shadow-sm shadow-blue-600/20 w-full sm:w-auto"
            >
              Launch Workspace
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={scrollToWorkflow}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-2 py-3.5 focus:outline-none"
            >
              See how it works
            </button>
          </div>
        </div>
      </div>

      {/* Signature visual: dynamic connection layout */}
      <div className="max-w-6xl mx-auto px-6 pb-4">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/60 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            </div>
            <span className="ml-3 text-xs text-slate-400">
              session — active
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-100">
            <div className="bg-white p-5">
              <ScreenShare className="w-4 h-4 text-blue-600 mb-2" />
              <p className="text-xs text-slate-400">Screen</p>
              <p className="text-sm font-medium text-slate-900">Sharing now</p>
            </div>
            <div className="bg-white p-5">
              <Cpu className="w-4 h-4 text-blue-600 mb-2" />
              <p className="text-xs text-slate-400">Device</p>
              <p className="text-sm font-medium text-slate-900">
                macOS · Chrome
              </p>
            </div>
            <div className="bg-white p-5">
              <FileText className="w-4 h-4 text-blue-600 mb-2" />
              <p className="text-xs text-slate-400">Files</p>
              <p className="text-sm font-medium text-slate-900">
                2 shared
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}