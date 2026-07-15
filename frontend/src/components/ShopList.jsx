import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Leaf, MapPin, Compass } from 'lucide-react';

export default function ShopList({ userContext, getCardClass }) {
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [activeShop, setActiveShop] = useState(null);

  useEffect(() => {
    fetch('/api/shops')
      .then(res => res.json())
      .then(data => setShops(data.shops))
      .catch(err => console.error("Error fetching shops:", err));
  }, []);

  const filteredShops = shops.filter(shop => {
    // Filter by stadium
    const isAtStadium = shop.stadium_ids.includes(userContext.stadium_id);
    if (!isAtStadium) return false;

    // Filter by type
    if (filterType !== 'All' && shop.type !== filterType) return false;

    // Filter by search name or menu items
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.menu.some(item => item.item.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="flex flex-col xl:flex-row gap-6 animate-fadeIn">
      {/* Search & Directory Grid */}
      <div className="flex-grow flex flex-col gap-6">
        <div className={`p-6 rounded-2xl ${getCardClass()}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-blue-500" /> Stadium Concourse Directory
            </h2>

            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search food, jerseys, tacos..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Segmented Category Filter */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1 overflow-x-auto select-none mb-6">
            {['All', 'Food & Beverage', 'Merchandise', 'Sustainability', 'First Aid'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all ${
                  filterType === type
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Directory List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredShops.map((shop) => (
              <div
                key={shop.id}
                onClick={() => setActiveShop(activeShop?.id === shop.id ? null : shop)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeShop?.id === shop.id
                    ? 'bg-blue-500/10 border-blue-500 shadow-lg'
                    : 'bg-zinc-800/30 hover:bg-zinc-800 border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-100">{shop.name}</h3>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">{shop.type}</span>
                  </div>
                  {shop.sustainability_rating >= 4.5 && (
                    <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg px-2 py-0.5 text-[9px] font-black">
                      <Leaf className="w-3 h-3 animate-pulse" /> ECO BEST
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[10px] text-zinc-400 mt-3 font-sans">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-500" /> Sec {shop.locations[0].section} ({shop.locations[0].gate})</span>
                  <span>•</span>
                  <span>{shop.menu.length} items available</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Shop Detail/Menu Drawer */}
      {activeShop && (
        <div className="w-full xl:w-[450px] shrink-0 animate-slideIn">
          <div className={`p-6 rounded-2xl flex flex-col gap-6 ${getCardClass()}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-white">{activeShop.name}</h3>
                <span className="text-[10px] text-zinc-500 font-bold uppercase">{activeShop.type}</span>
              </div>
              <button
                onClick={() => setActiveShop(null)}
                className="text-zinc-500 hover:text-zinc-300 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Sustainability Policy box */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex gap-2.5 text-xs text-emerald-400">
              <Leaf className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold block text-[10px] uppercase">Sustainability Commitment</span>
                <p className="mt-1 leading-relaxed font-sans">{activeShop.sustainability_note}</p>
              </div>
            </div>

            {/* Menu List */}
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-3">Item Menu & Prices</span>
              <div className="flex flex-col gap-3">
                {activeShop.menu.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="flex-grow pr-4">
                      <h4 className="font-bold text-xs text-slate-100">{item.item}</h4>
                      <p className="text-[10px] text-zinc-400 font-sans mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                    <span className="text-xs font-black text-blue-400 font-mono shrink-0 mt-0.5">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seating Route Quick Nav */}
            <button
              onClick={() => {
                alert(`Routing generated! Draw path from Section ${userContext.section} (Gate: ${userContext.gate.split(' ')[0]}) to Concourse Shop at Section ${activeShop.locations[0].section}. Walk duration: approx. 3 mins. Please look at the Seating Map tab for coordinates.`);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-md"
            >
              <Compass className="w-4 h-4 animate-spin" /> MAP ROUTE FROM SEAT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
