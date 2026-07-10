// File path: client/src/pages/Home.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Workflow from "../components/Workflow";
import CTABanner from "../components/CTABanner";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
        {/* Core Layout Containers */}
        <Navbar /> {/* Custom Navbar handles sticky blur and public links */}
        <Hero />   {/* Hero manages key tagline headings and visual active mock card */}
        <Features /> {/* Feature mapping benefit cards */}
        <Workflow /> {/* Workflow maps layman step pipelines */}
        <CTABanner /> {/* Dynamic link redirection cards */}
        <Footer /> {/* Minimal footer displaying status and copyrights */}
    </div>
  );
}