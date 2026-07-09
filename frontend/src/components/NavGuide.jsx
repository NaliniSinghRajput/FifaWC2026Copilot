import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, ChevronRight, Accessibility, AlertTriangle } from 'lucide-react';

export default function NavGuide({ userContext, theme, getCardClass }) {
  const [origin, setOrigin] = useState('Home');
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const fetchRoute = async (start) => {
    setLoading(true);
    try {
      const response = await fetch('/api/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: start,
          ticket_context: userContext
        }),
      });
      const data = await response.json();
      setRoute(data);
    } catch (err) {
      console.error("Failed to fetch navigation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute(origin);
  }, []);

  const handleRecalculate = (e) => {
    e.preventDefault();
    fetchRoute(origin);
  };

  // Compile all steps into a single array for simple step-by-step mapping
  const getCombinedSteps = () => {
    if (!route) return [];
    return [
      ...route.phases.transit.map(s => ({ ...s, phase: 'transit' })),
      ...route.phases.perimeter.map(s => ({ ...s, phase: 'perimeter' })),
      ...route.phases.indoor.map(s => ({ ...s, phase: 'indoor' }))
    ];
  };

  const steps = getCombinedSteps();

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn">
      {/* Sidebar route controller */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-6">
        <div className={`p-6 rounded-2xl ${getCardClass()}`}>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Compass className="w-5 h-5 text-blue-500" /> Route Optimizer
          </h3>
          
          <form onSubmit={handleRecalculate} className="flex gap-2 mb-4">
            <div className="flex-grow">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Set Starting Location</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Enter address, airport, hotel..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-lg text-xs mt-5 transition-colors shrink-0"
            >
              Re-Route
            </button>
          </form>

          {userContext.accessibility_required && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-400 flex items-center gap-2 mb-4">
              <Accessibility className="w-4 h-4 shrink-0 animate-pulse" />
              <span>Accessibility Routing Mode Active: Step-free elevators and ADA ramps are highlighted.</span>
            </div>
          )}

          {/* Navigation Steps */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Navigation className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-xs text-zinc-500 font-mono ml-2">Calculating optimized path...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Step-By-Step Directions</span>
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all text-xs flex gap-3 ${
                    activeStep === idx
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-zinc-800/20 border-transparent hover:bg-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] ${
                    activeStep === idx ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold leading-relaxed font-sans">{step.instruction}</p>
                    <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Est: {step.duration_est}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Map Area */}
      <div className="flex-grow flex flex-col gap-6">
        <div className={`p-6 rounded-2xl flex-grow flex flex-col min-h-[450px] ${getCardClass()}`}>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Compass className="w-5 h-5 text-blue-500" /> Interactive Seating Path Visualizer
          </h3>

          <div className="relative flex-grow bg-slate-950 border border-slate-800 rounded-xl overflow-hidden min-h-[350px] flex items-center justify-center">
            {/* Proper Landscape Visual Map of the Stadium */}
            <svg viewBox="0 0 220 110" className="w-full h-auto opacity-95 relative font-sans select-none">
              <defs>
                <style>{`
                  .gate-label { fill: #ef4444; font-size: 3px; font-weight: 900; }
                  .section-label { fill: #38bdf8; font-size: 2.5px; font-weight: bold; }
                  .zone-title { fill: #94a3b8; font-size: 2px; font-weight: bold; uppercase; }
                  .path-line { stroke: #3b82f6; stroke-width: 1.5; stroke-dasharray: 3 3; animation: dash-anim 30s infinite linear; }
                  @keyframes dash-anim { to { stroke-dashoffset: -1000; } }
                `}</style>
              </defs>

              {/* STADIUM BOWL LANDSCAPE SHELL */}
              {/* Outer Deck: Category 4 Upper Deck */}
              <ellipse cx="110" cy="55" rx="100" ry="48" fill="none" stroke="#334155" strokeWidth="4" />
              <ellipse cx="110" cy="55" rx="98" ry="46" fill="#0f172a" />

              {/* Mezzanine Tier: Category 2 */}
              <ellipse cx="110" cy="55" rx="80" ry="36" fill="none" stroke="#1e293b" strokeWidth="3" />
              <ellipse cx="110" cy="55" rx="78" ry="34" fill="#1e293b" />

              {/* Lower Bowl: Category 1 */}
              <ellipse cx="110" cy="55" rx="60" ry="24" fill="none" stroke="#0284c7" strokeWidth="2.5" />
              <ellipse cx="110" cy="55" rx="58" ry="22" fill="#0f172a" />

              {/* Pitch in the Center */}
              <rect x="75" y="42" width="70" height="26" rx="2" fill="#065f46" stroke="#10b981" strokeWidth="1" />
              <circle cx="110" cy="55" r="8" fill="none" stroke="#10b981" strokeWidth="1" />
              <line x1="110" y1="42" x2="110" y2="68" stroke="#10b981" strokeWidth="1" />

              {/* LANDSCAPE STADIUM PORTION LABELS */}
              {/* 1. Category 4 (Upper Deck Portion) */}
              <text x="110" y="14" fill="#64748b" fontSize="2.5" fontWeight="bold" textAnchor="middle" letterSpacing="1">CATEGORY 4 - UPPER DECK</text>
              <text x="35" y="55" fill="#64748b" fontSize="2.5" fontWeight="bold" textAnchor="middle" transform="rotate(-90 35 55)">CATEGORY 3 - ENDZONE</text>
              <text x="185" y="55" fill="#64748b" fontSize="2.5" fontWeight="bold" textAnchor="middle" transform="rotate(90 185 55)">CATEGORY 3 - ENDZONE</text>

              {/* 2. Category 2 (Mezzanine Portion) */}
              <text x="110" y="27" fill="#38bdf8" fontSize="2.5" fontWeight="bold" textAnchor="middle">CATEGORY 2 - MEZZANINE CORNERS</text>

              {/* 3. VIP Suites / Club Level (Middle Center Portion) */}
              <rect x="75" y="29" width="70" height="5" rx="1" fill="#ca8a04" opacity="0.15" />
              <text x="110" y="32.5" fill="#facc15" fontSize="2.5" fontWeight="black" textAnchor="middle">★ VIP LUXURY SUITES & CLUB LEVEL ★</text>

              {/* 4. Category 1 (Lower Bowl Portion) */}
              <text x="110" y="75" fill="#38bdf8" fontSize="2.5" fontWeight="bold" textAnchor="middle">CATEGORY 1 - LOWER BOWL SIDELINES</text>
              <text x="110" y="56" fill="#ffffff" fontSize="2" opacity="0.4" textAnchor="middle">FIELD PLAYING PITCH</text>

              {/* Concourse Concessions & Shops icons on map */}
              <g fill="#eab308" opacity="0.8">
                <circle cx="105" cy="30" r="1.5" title="Concession Shop" />
                <circle cx="99" cy="82" r="1.5" title="Concession Shop" />
                <circle cx="171.6" cy="49.5" r="1.5" title="Concession Shop" />
                <circle cx="132" cy="33" r="1.5" title="Official Store" />
              </g>

              {/* Entrance Gates Pointer Locations */}
              {/* Gate A (Scaled coordinates x*2.2, y*1.1 = 77, 16.5) */}
              <circle cx="77" cy="16.5" r="2.5" fill="#e11d48" className="cursor-pointer" />
              <text x="77" y="12.5" className="gate-label" textAnchor="middle">Gate A Entry</text>

              {/* Gate B (Scaled x*2.2, y*1.1 = 176, 27.5) */}
              <circle cx="176" cy="27.5" r="2.5" fill="#e11d48" />
              <text x="180" y="24.5" className="gate-label">Gate B Entry</text>

              {/* Gate C (Scaled x*2.2, y*1.1 = 143, 93.5) */}
              <circle cx="143" cy="93.5" r="2.5" fill="#e11d48" />
              <text x="143" y="99.5" className="gate-label" textAnchor="middle">Gate C Entry</text>

              {/* Gate D (Scaled x*2.2, y*1.1 = 33, 77) */}
              <circle cx="33" cy="77" r="2.5" fill="#e11d48" />
              <text x="25" y="74.5" className="gate-label">Gate D Entry</text>

              {/* Highlight active seat section path using scaled coords */}
              {route && route.visual_coordinates && (
                <>
                  {/* Scaled Coordinates */}
                  {(() => {
                    const gx = route.visual_coordinates.gate.x * 2.2;
                    const gy = route.visual_coordinates.gate.y * 1.1;
                    const sx = route.visual_coordinates.section.x * 2.2;
                    const sy = route.visual_coordinates.section.y * 1.1;

                    return (
                      <>
                        {/* Gate Coordinate Pin */}
                        <circle cx={gx} cy={gy} r="3" fill="#e11d48" className="animate-ping" />
                        <circle cx={gx} cy={gy} r="1.5" fill="#e11d48" />

                        {/* Section Coordinate Pin */}
                        <circle cx={sx} cy={sy} r="3.5" fill="#10b981" className="animate-ping" />
                        <circle cx={sx} cy={sy} r="1.8" fill="#10b981" />
                        <text x={sx} y={sy - 4} fill="#10b981" fontSize="3" fontWeight="black" textAnchor="middle">YOUR SEAT (SEC {userContext.section})</text>

                        {/* SVG Landscape Route Line */}
                        <path
                          d={`M ${gx} ${gy} Q 110 55, ${sx} ${sy}`}
                          fill="none"
                          className="path-line"
                        />
                      </>
                    );
                  })()}
                </>
              )}
            </svg>

            {/* Float Legends */}
            <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-[10px] space-y-1">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span> Entry Gate</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span> Allotted Section</div>
              <div className="flex items-center gap-1.5"><span className="w-5 h-px border-t border-dashed border-blue-500 inline-block"></span> Recommended Path</div>
            </div>
            
            <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] text-zinc-400 font-mono">
              LEVEL: {userContext.section.startsWith('3') ? 'UPPER DECK' : userContext.section.startsWith('2') ? 'MEZZANINE' : 'LOWER BOWL'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
