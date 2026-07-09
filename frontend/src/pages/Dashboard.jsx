import React, { useState, useEffect } from 'react';
import { Home, Calendar, MapPin, ShoppingBag, Award, ShieldAlert, LogOut, MessageSquare, HeartHandshake, User, Leaf, Map, BarChart3 } from 'lucide-react';

// Subcomponents to import/declare
import ThemeToggle from '../components/ThemeToggle';
import ChatBot from '../components/ChatBot';
import NavGuide from '../components/NavGuide';
import ShopList from '../components/ShopList';
import VolunteerPortal from '../components/VolunteerPortal';
import Trivia from './Trivia';
import GoogleMapsPage from './GoogleMapsPage';
import PollPage from './PollPage';

export default function Dashboard({ userContext, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState('dark'); // 'light', 'dark', 'high-contrast'
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Sustainability mock state
  const [ecoPoints, setEcoPoints] = useState(120);
  const [claimedTransit, setClaimedTransit] = useState(false);

  useEffect(() => {
    // Fetch match schedule
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => setMatches(data.matches))
      .catch(err => console.error("Error loading matches:", err));
  }, []);

  const handleClaimTransitPoints = () => {
    if (!claimedTransit) {
      setEcoPoints(prev => prev + 50);
      setClaimedTransit(true);
    }
  };

  const currentMatch = matches.find(m => m.id === userContext.match_id) || (matches.length > 0 ? matches[0] : null);

  const getThemeClass = () => {
    if (theme === 'high-contrast') return 'bg-black text-yellow-300 border-yellow-300';
    if (theme === 'light') return 'bg-zinc-50 text-zinc-950';
    return 'bg-[#09090b] text-zinc-100'; // dark
  };

  const getCardClass = () => {
    if (theme === 'high-contrast') return 'bg-black border-2 border-yellow-300 text-yellow-300';
    if (theme === 'light') return 'bg-white border border-zinc-200 shadow-sm';
    return 'bg-[#0c0c0f] border border-zinc-800 shadow-xl'; // dark
  };

  return (
    <div className={`min-h-screen ${getThemeClass()} flex flex-col font-sans transition-colors duration-300`}>
      {/* Header Bar */}
      <header className={`px-6 py-4 flex flex-col md:flex-row justify-between items-center border-b ${theme === 'high-contrast' ? 'border-yellow-300' : 'border-zinc-200 dark:border-zinc-800'} ${theme === 'light' ? 'bg-white' : 'bg-slate-900/60 backdrop-blur-md'}`}>
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-red-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
            26
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">FWC26 CO-PILOT</h1>
            <p className="text-[10px] text-zinc-400 font-mono">ROLE: {userContext.role.toUpperCase()}</p>
          </div>
        </div>

        {/* Header Right */}
        <div className="flex flex-wrap items-center gap-4">
          {/* User Widget */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${getCardClass()}`}>
            <User className="w-3.5 h-3.5" />
            <span>Sec {userContext.section}, Row {userContext.row}, Seat {userContext.seat}</span>
          </div>

          {/* SOS Emergency Button */}
          <button
            onClick={() => setIsSosOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-md animate-pulse"
          >
            <ShieldAlert className="w-4 h-4" />
            EMERGENCY SOS
          </button>

          {/* Theme Switcher */}
          <ThemeToggle theme={theme} onChangeTheme={setTheme} />

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-zinc-400 transition-colors"
            title="Log out ticket"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Tab Routing */}
      <div className="flex-grow flex flex-col md:flex-row max-w-[1600px] w-full mx-auto p-4 md:p-6 gap-6 relative">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'home'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Home className="w-5 h-5" /> Home Hub
          </button>

          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'matches'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Calendar className="w-5 h-5" /> Matches & rosters
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <MapPin className="w-5 h-5" /> Seat Navigation
          </button>

          <button
            onClick={() => setActiveTab('gmaps')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'gmaps'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Map className="w-5 h-5" /> Google Maps
          </button>

          <button
            onClick={() => setActiveTab('concourse')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'concourse'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <ShoppingBag className="w-5 h-5" /> Shops & Menus
          </button>

          <button
            onClick={() => setActiveTab('trivia')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'trivia'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Award className="w-5 h-5" /> Kids Trivia Quiz
          </button>

          <button
            onClick={() => setActiveTab('polls')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'polls'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            <BarChart3 className="w-5 h-5" /> Live Predictor Polls
          </button>

          {/* Volunteer Portal Tab (Only for Staff / Volunteers) */}
          {(userContext.role === 'Volunteer' || userContext.role === 'Staff') && (
            <button
              onClick={() => setActiveTab('portal')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                activeTab === 'portal'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <HeartHandshake className="w-5 h-5 animate-pulse" /> VOLUNTEER PORTAL
            </button>
          )}
        </aside>

        {/* Content Panel */}
        <main className="flex-grow min-w-0">
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div 
              className="flex flex-col gap-6 animate-fadeIn p-6 rounded-2xl bg-cover bg-center border border-zinc-850 relative overflow-hidden"
              style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.9)), url('/metlife_stadium_bg.jpg')" }}
            >
              {/* Branded Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-red-950 text-white p-8 border border-zinc-800">
                {/* Subtle player kicking ball background image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay -z-10"
                  style={{ backgroundImage: "url('/stadium_kick_bg.jpg')" }}
                ></div>
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-red-600/30 rounded-full blur-3xl"></div>
                <h2 className="text-3xl font-extrabold tracking-tight">Welcome, {userContext.role}!</h2>
                <p className="text-zinc-300 text-sm mt-1 max-w-xl">
                  Welcome to {userContext.stadium_name} in {userContext.city}. Use FWC26 Co-Pilot to map your way to your seat, check concourse menus, or get real-time aid.
                </p>

                {currentMatch && (
                  <div className="mt-6 flex flex-wrap items-center gap-4 bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 max-w-fit">
                    <span className="text-2xl">{currentMatch.home_team.flag}</span>
                    <span className="text-sm font-bold text-slate-100">{currentMatch.home_team.name}</span>
                    <span className="text-xs font-mono text-zinc-400">vs</span>
                    <span className="text-2xl">{currentMatch.away_team.flag}</span>
                    <span className="text-sm font-bold text-slate-100">{currentMatch.away_team.name}</span>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <span className="text-xs text-yellow-400 font-semibold">{currentMatch.stage} • {currentMatch.date} • {currentMatch.time}</span>
                  </div>
                )}
              </div>

              {/* Home Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seat Information Card */}
                <div className={`p-6 rounded-2xl ${getCardClass()}`}>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-blue-500" /> Seating Assignment
                  </h3>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[10px] text-zinc-500 font-bold block">GATE</span>
                      <span className="text-base font-black text-blue-500">{userContext.gate.split(' ')[0]}</span>
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[10px] text-zinc-500 font-bold block">SECTION</span>
                      <span className="text-base font-black text-blue-500">{userContext.section}</span>
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[10px] text-zinc-500 font-bold block">ROW</span>
                      <span className="text-base font-black text-blue-500">{userContext.row}</span>
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[10px] text-zinc-500 font-bold block">SEAT</span>
                      <span className="text-base font-black text-blue-500">{userContext.seat}</span>
                    </div>
                  </div>
                  {userContext.accessibility_required && (
                    <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-400 flex gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>Accessibility Assistance Mode active. Elevator routing and accessible path coordinates are enabled on your navigation map.</span>
                    </div>
                  )}
                </div>

                {/* Sustainability & Eco Points Card */}
                <div className={`p-6 rounded-2xl ${getCardClass()}`}>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Leaf className="w-5 h-5 text-emerald-500 animate-pulse" /> Green Cup Sustainability
                  </h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-zinc-500">Your Current Green Points Balance</p>
                      <h4 className="text-3xl font-black text-emerald-400 mt-1">{ecoPoints} GP</h4>
                    </div>
                    <button
                      onClick={handleClaimTransitPoints}
                      disabled={claimedTransit}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        claimedTransit
                          ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      {claimedTransit ? 'Transit Bonus Claimed!' : 'Claim Transit Bonus (+50)'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
                    Earn 10–15 points for returning cans or utilizing green transport. Redeem points for cup holders or discount coupons in the concourse shop.
                  </p>
                </div>
              </div>

              {/* Sponsor Marquee */}
              <div className={`p-4 rounded-xl ${getCardClass()} text-center`}>
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Proud FIFA World Cup Partners</span>
                <div className="flex justify-around items-center gap-8 mt-4 flex-wrap">
                  {/* Coca-Cola Logo */}
                  <img src="/sponsors/cocacola.png" alt="Coca-Cola" className="h-8 md:h-10 object-contain transition-all hover:scale-105" />
                  
                  {/* Adidas Logo */}
                  <img src="/sponsors/adidas.png" alt="Adidas" className="h-10 md:h-12 object-contain dark:invert transition-all hover:scale-105" />
                  
                  {/* Visa Logo */}
                  <img src="/sponsors/visa.png" alt="Visa" className="h-6 md:h-8 object-contain dark:brightness-150 transition-all hover:scale-105" />
                  
                  {/* Hyundai Logo */}
                  <img src="/sponsors/hyundai.png" alt="Hyundai" className="h-8 md:h-10 object-contain dark:invert transition-all hover:scale-105" />
                </div>
              </div>
            </div>
          )}

          {/* MATCHES & ROSTERS TAB */}
          {activeTab === 'matches' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-500" /> Tournament Schedule & Squads
              </h2>

              {/* Bracket display */}
              <div className={`p-4 rounded-xl ${getCardClass()}`}>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Active Tournament Stage: Quarter-Finals</h3>
                <div className="flex flex-col gap-3">
                  {matches.map(m => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedTeam(selectedTeam === m.id ? null : m.id)}
                      className={`flex flex-col md:flex-row justify-between items-center p-4 rounded-xl cursor-pointer transition-all border ${
                        selectedTeam === m.id
                          ? 'bg-blue-500/10 border-blue-500'
                          : 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <span className="text-2xl">{m.home_team.flag}</span>
                          <span>{m.home_team.name}</span>
                        </div>
                        <span className="text-zinc-500 font-mono text-xs">vs</span>
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <span className="text-2xl">{m.away_team.flag}</span>
                          <span>{m.away_team.name}</span>
                        </div>
                      </div>
                      <div className="mt-3 md:mt-0 flex items-center gap-4">
                        <span className="text-xs font-semibold text-zinc-400">{m.date} • {m.time}</span>
                        <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md text-[10px] text-blue-400 font-bold uppercase">
                          Details
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Roster Section */}
              {selectedTeam && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideIn">
                  {/* Home Squad */}
                  {(() => {
                    const match = matches.find(m => m.id === selectedTeam);
                    if (!match) return null;
                    return (
                      <div className={`p-6 rounded-2xl ${getCardClass()}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-3xl">{match.home_team.flag}</span>
                          <div>
                            <h3 className="text-lg font-bold">{match.home_team.name} Squad</h3>
                            <p className="text-xs text-zinc-500">Coach: {match.home_team.coach}</p>
                          </div>
                        </div>
                        <p className="text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 italic text-zinc-400 mb-4">
                          {match.home_team.trivia}
                        </p>
                        <div className="flex flex-col gap-2">
                          {match.home_team.roster.map(p => (
                            <div
                              key={p.number}
                              onClick={() => setSelectedPlayer(p)}
                              className="flex justify-between items-center p-2.5 bg-zinc-800/20 hover:bg-zinc-800/60 rounded-lg cursor-pointer border border-transparent hover:border-zinc-700 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-black">
                                  {p.number}
                                </span>
                                <img 
                                  src={p.image_url || "/usa_player.jpg"} 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { e.target.src = "/usa_player.jpg"; }}
                                  alt={p.name} 
                                  className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0" 
                                />
                                <span className="text-sm font-semibold">{p.name}</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md">
                                {p.position}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Away Squad */}
                  {(() => {
                    const match = matches.find(m => m.id === selectedTeam);
                    if (!match) return null;
                    return (
                      <div className={`p-6 rounded-2xl ${getCardClass()}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-3xl">{match.away_team.flag}</span>
                          <div>
                            <h3 className="text-lg font-bold">{match.away_team.name} Squad</h3>
                            <p className="text-xs text-zinc-500">Coach: {match.away_team.coach}</p>
                          </div>
                        </div>
                        <p className="text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 italic text-zinc-400 mb-4">
                          {match.away_team.trivia}
                        </p>
                        <div className="flex flex-col gap-2">
                          {match.away_team.roster.map(p => (
                            <div
                              key={p.number}
                              onClick={() => setSelectedPlayer(p)}
                              className="flex justify-between items-center p-2.5 bg-zinc-800/20 hover:bg-zinc-800/60 rounded-lg cursor-pointer border border-transparent hover:border-zinc-700 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 bg-red-600/20 text-red-400 rounded-full flex items-center justify-center text-xs font-black">
                                  {p.number}
                                </span>
                                <img 
                                  src={p.image_url || "/mex_player.jpg"} 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { e.target.src = "/mex_player.jpg"; }}
                                  alt={p.name} 
                                  className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0" 
                                />
                                <span className="text-sm font-semibold">{p.name}</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md">
                                {p.position}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Player detail Modal/overlay */}
              {selectedPlayer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className={`w-full max-w-md rounded-2xl p-6 ${getCardClass()} overflow-hidden`}>
                    <div className="relative h-44 -mx-6 -mt-6 mb-4 bg-slate-900 border-b border-slate-800">
                      <img 
                        src={selectedPlayer.image_url || (selectedPlayer.club === 'Club América' || selectedPlayer.club === 'Al-Merrikh' || selectedPlayer.club === 'West Ham' || selectedPlayer.club === 'Tigres' || selectedPlayer.club === 'Feyenoord' || selectedPlayer.club === 'San Diego FC' ? '/mex_player.jpg' : '/usa_player.jpg')} 
                        referrerPolicy="no-referrer"
                        onError={(e) => { 
                          e.target.src = selectedPlayer.club === 'Club América' || selectedPlayer.club === 'Al-Merrikh' || selectedPlayer.club === 'West Ham' || selectedPlayer.club === 'Tigres' || selectedPlayer.club === 'Feyenoord' || selectedPlayer.club === 'San Diego FC' ? '/mex_player.jpg' : '/usa_player.jpg'; 
                        }}
                        alt={selectedPlayer.name} 
                        className="w-full h-full object-cover opacity-80" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-2xl font-black text-blue-500">#{selectedPlayer.number}</span>
                        <h3 className="text-xl font-bold mt-1 text-white">{selectedPlayer.name}</h3>
                        <p className="text-xs text-zinc-500">{selectedPlayer.position} • {selectedPlayer.club}</p>
                      </div>
                      <button
                        onClick={() => setSelectedPlayer(null)}
                        className="text-zinc-500 hover:text-zinc-300 text-lg font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Fan Trivia & Fact</span>
                      <p className="text-sm text-zinc-300 leading-relaxed font-sans">{selectedPlayer.fact}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MAP TAB */}
          {activeTab === 'map' && (
            <div className="animate-fadeIn">
              <NavGuide userContext={userContext} theme={theme} getCardClass={getCardClass} />
            </div>
          )}

          {/* CONCOURSE/SHOPS TAB */}
          {activeTab === 'concourse' && (
            <div className="animate-fadeIn">
              <ShopList userContext={userContext} getCardClass={getCardClass} />
            </div>
          )}

          {/* VOLUNTEER PORTAL */}
          {activeTab === 'portal' && (userContext.role === 'Volunteer' || userContext.role === 'Staff') && (
            <div className="animate-fadeIn">
              <VolunteerPortal userContext={userContext} theme={theme} getCardClass={getCardClass} />
            </div>
          )}

          {/* TRIVIA TAB */}
          {activeTab === 'trivia' && (
            <div className="animate-fadeIn">
              <Trivia getCardClass={getCardClass} theme={theme} />
            </div>
          )}

          {/* GOOGLE MAPS TAB */}
          {activeTab === 'gmaps' && (
            <div className="animate-fadeIn">
              <GoogleMapsPage userContext={userContext} getCardClass={getCardClass} />
            </div>
          )}

          {/* POLLS TAB */}
          {activeTab === 'polls' && (
            <div className="animate-fadeIn">
              <PollPage getCardClass={getCardClass} theme={theme} />
            </div>
          )}
        </main>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-slate-950 border border-sky-400 text-sky-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.6)] hover:shadow-[0_0_30px_rgba(56,189,248,0.95)] hover:text-white transition-all duration-300 z-40 active:scale-95 group"
        title="Ask GenAI Companion"
      >
        <svg viewBox="0 0 24 24" className="w-9 h-9 fill-current stroke-current stroke-[0.5] animate-pulse group-hover:rotate-45 transition-transform duration-500">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <polygon points="12,8 15.5,10.5 14,14.5 10,14.5 8.5,10.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
          <line x1="12" y1="8" x2="12" y2="2" stroke="currentColor" strokeWidth="1" />
          <line x1="15.5" y1="10.5" x2="21.5" y2="10.5" stroke="currentColor" strokeWidth="1" />
          <line x1="14" y1="14.5" x2="18" y2="20.5" stroke="currentColor" strokeWidth="1" />
          <line x1="10" y1="14.5" x2="6" y2="20.5" stroke="currentColor" strokeWidth="1" />
          <line x1="8.5" y1="10.5" x2="2.5" y2="10.5" stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>

      {/* Collapsible ChatBot panel */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userContext={userContext} getCardClass={getCardClass} />

      {/* SOS MODAL */}
      {isSosOpen && (
        <div className="fixed inset-0 bg-red-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-black border-2 border-red-500 rounded-2xl p-6 shadow-2xl text-yellow-500">
            <div className="flex items-center gap-3 text-red-500 mb-4 border-b border-red-900/50 pb-3">
              <ShieldAlert className="w-8 h-8 animate-ping" />
              <div>
                <h3 className="text-xl font-black tracking-tight text-white">EMERGENCY MEDICAL DISPATCH</h3>
                <p className="text-[10px] text-zinc-400 font-mono">INCIDENT PROTOCOL INITIATED</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 mb-6">
              You are dispatching emergency services directly to your seat at **{userContext.stadium_name}**:
              <br />
              <strong className="text-white block mt-2">Section: {userContext.section} • Row: {userContext.row} • Seat: {userContext.seat}</strong>
            </p>

            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 text-xs text-red-300 mb-6 flex flex-col gap-2">
              <span className="font-bold flex items-center gap-1">🚨 GPS COORDINATES TRANSMITTED:</span>
              <span className="font-mono text-zinc-400">Lat: 40.8135° N, Lon: 74.0743° W (Seat Node X: 50, Y: 30)</span>
              <span className="block mt-1">Medical responders at Gate A First Aid Station have been notified. An electric responder cart has been assigned to your sector.</span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  // Post request to trigger mishap
                  fetch('/api/crowd/mishaps/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      description: `MEDICAL EMERGENCY TRIGGERED BY FAN at Section ${userContext.section}, Row ${userContext.row}, Seat ${userContext.seat}`,
                      coords: { x: 50, y: 30 },
                      severity: "high"
                    })
                  });
                  setIsSosOpen(false);
                  alert("SOS Transmitted! Responders are on their way. Please stay at your seat.");
                }}
                className="flex-grow py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-sm transition-colors text-center"
              >
                TRANSMIT ALARM & CALL RESCUERS
              </button>
              <button
                onClick={() => setIsSosOpen(false)}
                className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-sm transition-colors font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
