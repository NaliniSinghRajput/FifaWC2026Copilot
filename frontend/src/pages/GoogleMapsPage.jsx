import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Map, Compass, Navigation, AlertCircle } from 'lucide-react';

export default function GoogleMapsPage({ userContext, getCardClass }) {
  const mapRef = useRef(null);
  const [apiKey] = useState(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
  const [mapError, setMapError] = useState('');
  const [origin, setOrigin] = useState(
    userContext.stadium_id === 'sofi' 
      ? 'Los Angeles International Airport (LAX)' 
      : 'Newark Liberty International Airport (EWR)'
  );

  const getStadiumLatLng = () => {
    if (userContext.stadium_id === 'sofi') {
      return { lat: 33.9534, lng: -118.3390 }; // SoFi
    }
    return { lat: 40.8135, lng: -74.0743 }; // MetLife
  };

  const initGoogleMap = () => {
    try {
      if (!apiKey) {
        setMapError('Google Maps API Key is not set. Please paste your API Key below to load the live directions map.');
        return;
      }

      setMapError('');

      // Configure loader settings
      setOptions({
        apiKey: apiKey,
        version: 'weekly'
      });

      // Load required libraries dynamically
      Promise.all([
        importLibrary('maps'),
        importLibrary('routes')
      ]).then(([mapsLib, routesLib]) => {
        try {
          const stadiumLatLng = getStadiumLatLng();
          if (!mapRef.current) return;
          
          const map = new mapsLib.Map(mapRef.current, {
            center: stadiumLatLng,
            zoom: 12,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
              { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#334155' }] },
              { featureType: 'poi', stylers: [{ visibility: 'off' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
              { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
              { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3b82f6', opacity: 0.2 }] }
            ]
          });

          const directionsService = new routesLib.DirectionsService();
          const directionsRenderer = new routesLib.DirectionsRenderer({
            map: map,
            polylineOptions: {
              strokeColor: '#3b82f6',
              strokeOpacity: 0.8,
              strokeWeight: 4
            }
          });

          directionsService.route(
            {
              origin: origin,
              destination: `${userContext?.stadium_name || 'MetLife Stadium'}, ${userContext?.city || 'East Rutherford'}`,
              travelMode: 'DRIVING'
            },
            (result, status) => {
              if (status === 'OK') {
                directionsRenderer.setDirections(result);
              } else {
                console.error("Directions request failed:", status);
              }
            }
          );
        } catch (e) {
          console.error("Error inside map rendering block:", e);
          setMapError(`Map render error: ${e.message}`);
        }
      }).catch(err => {
        console.error("Failed to load Google Maps libraries:", err);
        setMapError(`Library loading error: ${err.message}`);
      });
    } catch (err) {
      console.error("General error in initGoogleMap:", err);
      setMapError(`Loader error: ${err.message}`);
    }
  };

  useEffect(() => {
    initGoogleMap();
  }, [origin, apiKey]);

  const handleUpdateRoute = (e) => {
    e.preventDefault();
    initGoogleMap();
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-white">
      {/* Header controls */}
      <div className={`p-6 rounded-2xl ${getCardClass()}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <Map className="w-6 h-6 text-blue-500" /> Transit Directions (Google Maps)
            </h2>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">Real-time highway traffic mapping to stadium parking</p>
          </div>

          <form onSubmit={handleUpdateRoute} className="flex gap-2 w-full md:max-w-md shrink-0">
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Enter start address..."
              className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shrink-0"
            >
              Update Route
            </button>
          </form>
        </div>
      </div>

      {/* Map Container Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div className={`p-4 rounded-2xl min-h-[500px] flex flex-col relative ${getCardClass()}`}>
          {/* Always render the map container on the DOM to prevent ref null crashes */}
          <div 
            ref={mapRef} 
            className={`flex-grow w-full h-[450px] rounded-xl border border-slate-800 overflow-hidden bg-slate-950 ${
              mapError ? 'hidden' : 'block'
            }`}
          ></div>

          {/* Render error & credentials warning view only when key is missing or errored */}
          {mapError && (
            <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-950 rounded-xl border border-slate-800 text-center min-h-[450px]">
              <AlertCircle className="w-12 h-12 text-yellow-500 mb-3 animate-pulse" />
              <h3 className="font-bold text-sm text-slate-200">Google Maps Live Feed</h3>
              <p className="text-xs text-yellow-500 max-w-sm mt-1 mb-6">
                {mapError}
              </p>

              <div className="border-t border-slate-900 pt-6 w-full max-w-md">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Simulated Route Summary</span>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-left text-xs font-sans text-zinc-400 space-y-1">
                  <div><strong>From:</strong> {origin}</div>
                  <div><strong>To:</strong> {userContext.stadium_name} ({userContext.city})</div>
                  <div><strong>Distance:</strong> 18.4 miles</div>
                  <div><strong>Duration:</strong> 34 mins (moderate matchday traffic detected on route)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
