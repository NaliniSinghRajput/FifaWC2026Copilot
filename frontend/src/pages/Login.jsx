import React, { useState } from 'react';
import { Upload, Ticket, Shield, Info, Activity } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleMockLogin = async (ticketType) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/login-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_type: ticketType }),
      });
      if (!response.ok) {
        throw new Error('Failed to retrieve mock ticket details.');
      }
      const data = await response.json();
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/login-ticket', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to parse ticket.');
      }
      const data = await response.json();
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url('/stadium_kick_bg.jpg')" }}
    >
      {/* Full-Screen Cinematic Animated Stadium Background Overlay */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none -z-10 overflow-hidden">
        <svg viewBox="0 0 800 400" className="w-full h-full object-cover opacity-40" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Immersive Net Mesh Pattern */}
            <pattern id="stadium-net-mesh" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 6 0 L 0 6 M 0 0 L 6 6" fill="none" stroke="#94a3b8" strokeWidth="0.5" opacity="0.6" />
            </pattern>
            
            {/* Glow Filter for Ball */}
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

          </defs>

          {/* 3D-angled Stadium Goal (Left Side) */}
          <g className="stadium-net">
            {/* Goal Netting Backdrop */}
            <rect x="25" y="210" width="65" height="130" fill="url(#stadium-net-mesh)" />
            <path d="M 25,210 L 15,225 L 15,340 L 25,340 Z" fill="url(#stadium-net-mesh)" />
            <path d="M 90,210 L 80,225 L 80,340 L 90,340 Z" fill="url(#stadium-net-mesh)" />
            {/* Goal Posts Outline */}
            <path d="M 25,340 L 25,210 L 90,210 L 90,340" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
            {/* Net Support Bars */}
            <path d="M 25,210 L 10,225 L 10,340 L 25,340 M 90,210 L 75,225 L 75,340 L 90,340" fill="none" stroke="#cbd5e1" strokeWidth="2.5" opacity="0.8" />
          </g>

          {/* Celebratory Footballer Silhouette (Right Side) */}
          <g className="stadium-player">
            {/* Torso & Head */}
            <circle cx="700" cy="275" r="7" fill="#0ea5e9" />
            <path d="M 696,282 L 704,282 L 702,308 L 698,308 Z" fill="#0ea5e9" />
            {/* Cheering/Kicking Arms */}
            <g className="player-arms">
              {/* Left Arm */}
              <path d="M 697,284 L 688,294 L 682,290" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
              {/* Right Arm */}
              <path d="M 703,284 L 712,295 L 718,292" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
            </g>
            {/* Kicking & Running Legs */}
            {/* Left Static Leg */}
            <path d="M 698,308 L 694,324 L 691,338" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" />
            <path d="M 691,338 L 687,338" fill="none" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
            {/* Right Active Leg (Kick/Running) */}
            <path d="M 702,308 L 708,323 L 715,334" fill="none" stroke="#38bdf8" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M 715,334 L 720,332" fill="none" stroke="#ffd700" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Soccer Ball (Animating from Right to Left) */}
          <g className="stadium-ball">
            <circle cx="670" cy="335" r="6" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" filter="url(#neon-glow)" />
            {/* Traditional Pentagon Details inside Ball */}
            <circle cx="670" cy="335" r="2.5" fill="#0f172a" />
            <path d="M 670,332.5 L 670,329 M 667.5,335 L 664,335 M 672.5,335 L 676,335 M 668.5,336.5 L 666,339 M 671.5,336.5 L 674,339" stroke="#0f172a" strokeWidth="0.8" />
          </g>

          {/* Dynamic Light Flashes / Stadium Projectors */}
          <path d="M 100,0 L 150,150 L 50,150 Z" fill="url(#projector-beam)" opacity="0.05" />
          <path d="M 700,0 L 750,180 L 650,180 Z" fill="url(#projector-beam)" opacity="0.05" />
          
          <defs>
            <linearGradient id="projector-beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-xl bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl relative">
        {/* FIFA World Cup Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-red-600 rounded-full mb-3 shadow-lg">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-white to-red-400 bg-clip-text text-transparent">
            FIFA WORLD CUP 2026
          </h1>
          <p className="text-slate-400 text-sm mt-1">Smart Fan & Operations Co-Pilot</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 rounded-lg p-3 text-sm mb-6 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
          }`}
          onClick={() => document.getElementById('ticket-input').click()}
        >
          <input
            id="ticket-input"
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />
          <Upload className={`w-12 h-12 mb-3 transition-colors ${dragOver ? 'text-blue-400' : 'text-slate-400'}`} />
          <h3 className="font-semibold text-base text-slate-200">Upload Digital Ticket</h3>
          <p className="text-xs text-slate-400 text-center mt-1">
            Drag and drop your ticket (PDF or Image) or click to browse.<br />
            Our RAG system will extract details and curate your layout.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="px-3 text-xs text-slate-500 font-bold uppercase tracking-wider">Demo Quick Access</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        {/* Mock Tickets Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleMockLogin('usa-mexico')}
            className="flex flex-col items-start p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-all hover:scale-[1.02]"
          >
            <span className="text-xs font-semibold text-blue-400">Match 58 • Fan Pass</span>
            <span className="text-sm font-bold text-slate-200 mt-1">🇺🇸 USA vs MEX 🇲🇽</span>
            <span className="text-[10px] text-slate-400">MetLife Stadium • Sec 112</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleMockLogin('brazil-england')}
            className="flex flex-col items-start p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-all hover:scale-[1.02]"
          >
            <span className="text-xs font-semibold text-yellow-400">Match 59 • Fan Pass</span>
            <span className="text-sm font-bold text-slate-200 mt-1">🇧🇷 BRA vs ENG 🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
            <span className="text-[10px] text-slate-400">SoFi Stadium • Sec 101</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleMockLogin('volunteer')}
            className="flex flex-col items-start p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-all hover:scale-[1.02]"
          >
            <span className="text-xs font-semibold text-emerald-400">Match 58 • Volunteer</span>
            <span className="text-sm font-bold text-slate-200 mt-1">Volunteer Pass</span>
            <span className="text-[10px] text-slate-400">Access: Gates A/B & Staff Area</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleMockLogin('staff-ada')}
            className="flex flex-col items-start p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-all hover:scale-[1.02]"
          >
            <span className="text-xs font-semibold text-purple-400">Match 58 • Staff / ADA</span>
            <span className="text-sm font-bold text-slate-200 mt-1">Accessibility Pass</span>
            <span className="text-[10px] text-slate-400">Wheelchair Route • MetLife</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-20">
            <Activity className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <span className="text-sm font-medium text-slate-300">RAG Ingesting Ticket Details...</span>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mt-4 border-t border-slate-700/50 pt-4">
          <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> SECURE TICKET DEPOSIT</span>
          <span>•</span>
          <span>PROMPT WARS CHALLENGE 4</span>
        </div>
      </div>
    </div>
  );
}
