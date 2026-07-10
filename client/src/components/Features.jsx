// File path: client/src/components/Features.jsx
import React from "react";
import { Monitor, Cpu, FileText } from "lucide-react";

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-7 hover:shadow-md hover:shadow-slate-200/60 transition-all">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

export default function Features() {
  const items = [
    {
      icon: <Monitor className="w-5 h-5 text-blue-600" />,
      title: "Instant Screen Sharing",
      description:
        "Stream your screen to an agent immediately. No heavy downloads or software installations required for the client.",
    },
    {
      icon: <Cpu className="w-5 h-5 text-blue-600" />,
      title: "Instant Hardware Specs",
      description:
        "The moment a client joins, the agent can instantly view their basic device specifications, like operating system and browser type, to pinpoint problems faster.",
    },
    {
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      title: "Secure File Transfer & Chat",
      description:
        "Text back-and-forth and share troubleshooting tools, scripts, or logs directly through a clean, intuitive call interface.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-14">
          <p className="text-sm font-medium text-blue-600 mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Everything support teams actually need.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}