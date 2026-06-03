// src/App.jsx
import { SocketProvider } from './context/SocketContext';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
  return (
    <SocketProvider>
      <Dashboard />
    </SocketProvider>
  );
}

export default App;
