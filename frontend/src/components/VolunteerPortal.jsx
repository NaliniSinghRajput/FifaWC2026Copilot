import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, MessageSquare, Compass, Send, CheckCircle } from 'lucide-react';

export default function VolunteerPortal({ userContext, theme, getCardClass }) {
  const [volunteers, setVolunteers] = useState([]);
  const [mishaps, setMishaps] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { sender: "Carlos Gomez", text: "Gate A turnstiles are getting congested. Directing fans to Gate B now.", time: "12:45" },
    { sender: "Sarah Jenkins", text: "Sensory Room is fully staffed and has noise-canceling headsets available.", time: "12:49" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [selectedMishap, setSelectedMishap] = useState(null);

  // Sync data from endpoints
  const fetchData = async () => {
    try {
      const vRes = await fetch('/api/volunteers');
      const vData = await vRes.json();
      setVolunteers(vData);

      const mRes = await fetch('/api/crowd/mishaps');
      const mData = await mRes.json();
      setMishaps(mData);

      const hRes = await fetch(`/api/crowd/heatmap?stadium_id=${userContext.stadium_id}`);
      const hData = await hRes.json();
      setHeatmap(hData);
    } catch (err) {
      console.error("Error syncing operational data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 8 seconds for crowd alerts and coordinate shifts
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      sender: "You",
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const response = await fetch('/api/crowd/mishaps/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId })
      });
      if (response.ok) {
        alert("Alert resolved and cleared from system.");
        fetchData();
        setSelectedMishap(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignAlert = async (alertId) => {
    try {
      const response = await fetch('/api/crowd/mishaps/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, vol_id: "v1" })
      });
      if (response.ok) {
        alert("You have been successfully assigned to this alert. Coordinate directions are locked.");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn text-white">
      {/* Crowd and Alerts Column */}
      <div className="flex-grow flex flex-col gap-6">
        {/* Crowd Density Map */}
        <div className={`p-6 rounded-2xl ${getCardClass()}`}>
          <h2 className="text-xl font-black flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-emerald-500 animate-pulse" /> Live Crowd Operations Heatmap
          </h2>
          
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center">
            {/* SVG Base Stadium Outline */}
            <svg viewBox="0 0 100 100" className="w-full max-w-[320px] h-auto opacity-70">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="2" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="#1e293b" strokeWidth="4" />
              <rect x="38" y="38" width="24" height="24" rx="2" fill="none" stroke="#334155" strokeWidth="0.75" />

              {/* Heatmap blur spots */}
              {heatmap.map((point, idx) => (
                <circle
                  key={idx}
                  cx={point.x}
                  cy={point.y}
                  r={10 * point.intensity}
                  fill={point.intensity > 0.8 ? '#ef4444' : '#eab308'}
                  opacity="0.3"
                  className="blur-md animate-pulse"
                />
              ))}

              {/* Volunteer location pins */}
              {volunteers.map((vol) => (
                <g key={vol.id} className="cursor-pointer hover:scale-125 transition-transform">
                  <circle cx={vol.coords.x} cy={vol.coords.y} r="1.5" fill="#10b981" />
                  <circle cx={vol.coords.x} cy={vol.coords.y} r="3.5" fill="none" stroke="#10b981" strokeWidth="0.5" className="animate-ping" />
                </g>
              ))}

              {/* Mishap alert pins */}
              {mishaps.filter(m => m.status === 'active').map((m) => (
                <g key={m.id} className="cursor-pointer animate-bounce">
                  <polygon
                    points={`${m.coords.x},${m.coords.y - 3} ${m.coords.x - 2.5},${m.coords.y + 1.5} ${m.coords.x + 2.5},${m.coords.y + 1.5}`}
                    fill="#ef4444"
                  />
                </g>
              ))}
            </svg>

            {/* Heatmap legends */}
            <div className="absolute top-3 left-3 bg-slate-900/95 border border-slate-800 p-2.5 rounded-lg text-[10px] space-y-1.5">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span> Active Volunteer</div>
              <div className="flex items-center gap-1.5"><span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-red-500 inline-block"></span> Mishap Alert</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500/35 rounded-full inline-block blur-xs"></span> High Congestion</div>
            </div>
          </div>
        </div>

        {/* Incidents and Mishaps List */}
        <div className={`p-6 rounded-2xl ${getCardClass()}`}>
          <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-red-400">
            <ShieldAlert className="w-5 h-5 animate-bounce" /> Active Mishaps & Incident Alerts
          </h3>
          <div className="flex flex-col gap-3">
            {mishaps.filter(m => m.status === 'active').map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMishap(m)}
                className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col gap-2 ${
                  selectedMishap?.id === m.id
                    ? 'bg-red-500/10 border-red-500 shadow-md'
                    : 'bg-zinc-800/30 hover:bg-zinc-800 border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded text-white font-black uppercase tracking-wider">
                      {m.severity.toUpperCase()} ALERT
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-100 mt-1">{m.description}</h4>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {m.id}</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-sans mt-1">
                  Location: {m.location} • Assigned: {m.assigned_to ? `Volunteer ${m.assigned_to}` : "Unassigned"}
                </div>
              </div>
            ))}
            {mishaps.filter(m => m.status === 'active').length === 0 && (
              <div className="text-center py-6 text-xs text-zinc-500 font-sans">
                No active crowd alerts reported. All concourses clear.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coordination Panel Column */}
      <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-6">
        {/* Coordination Chat */}
        <div className={`p-6 rounded-2xl flex flex-col h-[350px] ${getCardClass()}`}>
          <h3 className="text-base font-bold flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-500" /> Coordinator Intercom
          </h3>
          <div className="flex-grow overflow-y-auto space-y-2 mb-3 pr-1">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-sans leading-relaxed">
                <div className="flex justify-between font-bold text-blue-400 text-[10px] mb-1">
                  <span>{msg.sender}</span>
                  <span className="text-zinc-500 font-mono">{msg.time}</span>
                </div>
                <p className="text-slate-300">{msg.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send coordinator message..."
              className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Selected mishap control panel */}
        {selectedMishap && (
          <div className={`p-6 rounded-2xl border border-red-500/30 animate-slideIn ${getCardClass()}`}>
            <h4 className="text-sm font-bold text-red-400 mb-2">Responders Actions</h4>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed mb-4">
              Mishap coordinates are locked. Resolve the bottleneck near Section 120 or clear medical alarms.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleAssignAlert(selectedMishap.id)}
                disabled={selectedMishap.assigned_to !== null}
                className="flex-grow py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {selectedMishap.assigned_to ? "Locked/Assigned" : "Assign Me"}
              </button>
              <button
                onClick={() => handleResolveAlert(selectedMishap.id)}
                className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
