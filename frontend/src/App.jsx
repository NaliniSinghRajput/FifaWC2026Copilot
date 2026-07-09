import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [userContext, setUserContext] = useState(null);

  return (
    <div className="w-full min-h-screen">
      {!userContext ? (
        <Login onLoginSuccess={setUserContext} />
      ) : (
        <Dashboard userContext={userContext} onLogout={() => setUserContext(null)} />
      )}
    </div>
  );
}

export default App;
