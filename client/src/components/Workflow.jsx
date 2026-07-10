// File path: client/src/components/Workflow.jsx
import React from "react";

function WorkflowStep({ number, title, description, isLast }) {
  return (
    <div className="flex-1 relative">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-semibold text-blue-600 tabular-nums">
          {number}
        </span>
        <div className="h-px flex-1 bg-slate-200 md:hidden" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed pr-4">
        {description}
      </p>
      {!isLast && (
        <div className="hidden md:block absolute top-2.5 left-full w-full">
          <div className="h-px bg-slate-200 -translate-x-6 w-12" />
        </div>
      )}
    </div>
  );
}

export default function Workflow() {
  const steps = [
    {
      number: "01",
      title: "Secure Invite",
      description:
        "The agent generates a unique session link and sends an email invitation with one click.",
    },
    {
      number: "02",
      title: "Frictionless Joining",
      description:
        "The client opens their email, clicks the link, enters a display name, and joins instantly.",
    },
    {
      number: "03",
      title: "Fast Resolution",
      description:
        "The client shares their screen, enabling the agent to guide them visually to solve the problem.",
    },
  ];

  return (
    <section id="workflow" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-16">
          <p className="text-sm font-medium text-blue-600 mb-3">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Three steps to a solved problem.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-10 md:gap-6">
          {steps.map((step, i) => (
            <WorkflowStep
              key={step.number}
              {...step}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}