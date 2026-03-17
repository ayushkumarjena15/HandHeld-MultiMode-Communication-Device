import { useState, useEffect } from 'react';
import { 
  Shield, Radio, Smartphone, Satellite, 
  Mountain, Gauge, Compass, Thermometer, Battery, 
  Signal, Info, AlertTriangle, AlertCircle, Wifi, Sparkles, Clock
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import './App.css';

// Mock Data
type UnitStatus = 'active' | 'warning' | 'sos' | 'offline';
type CommType = 'VHF' | 'GSM' | 'SATCOM';

interface Unit {
  id: string;
  name: string;
  callsign: string;
  status: UnitStatus;
  comm: CommType;
  signal: number;
  battery: number;
  coords: [number, number];
  lastActive: string;
  altitude: string;
  speed: string;
  heading: string;
  temp: string;
}

const formatCoords = (c: [number, number]) => `${c[0].toFixed(4)}° ${c[1].toFixed(4)}°`;

const UNITS: Unit[] = [
  {
    id: 'f1', name: 'FALCON-1', callsign: 'Field Unit Alpha - FU-001', status: 'active',
    comm: 'VHF', signal: 87, battery: 72, coords: [19.0756, 72.8185],
    lastActive: '23:23:53 IST', altitude: '271m', speed: '8.57 km/h', heading: '45°', temp: '34°C'
  },
  {
    id: 'f2', name: 'FALCON-2', callsign: 'Field Unit Bravo - FU-002', status: 'warning',
    comm: 'GSM', signal: 62, battery: 45, coords: [19.2856, 72.8685],
    lastActive: '23:18:30 IST', altitude: '12m', speed: '0 km/h', heading: '12°', temp: '36°C'
  },
  {
    id: 'f3', name: 'FALCON-3', callsign: 'Field Unit Charlie - FU-003', status: 'active',
    comm: 'SATCOM', signal: 94, battery: 88, coords: [19.1245, 72.8585],
    lastActive: '23:10:45 IST', altitude: '450m', speed: '12.4 km/h', heading: '105°', temp: '33°C'
  },
  {
    id: 'f4', name: 'FALCON-4', callsign: 'Field Unit Delta - FU-004', status: 'sos',
    comm: 'VHF', signal: 15, battery: 12, coords: [19.3000, 72.8000],
    lastActive: '23:28:05 IST', altitude: '144m', speed: '0 km/h', heading: '270°', temp: '35°C'
  },
  {
    id: 'f5', name: 'FALCON-5', callsign: 'Field Unit Echo - FU-005', status: 'offline',
    comm: 'GSM', signal: 0, battery: 3, coords: [19.0500, 72.9000],
    lastActive: '22:45:30 IST', altitude: '--', speed: '--', heading: '--', temp: '--'
  }
];

const ALERTS = [
  { id: 'a1', unitId: 'f4', type: 'eos', timestamp: '23:28:05', message: 'EMERGENCY SOS TRIGGERED' },
  { id: 'a2', unitId: 'f2', type: 'warn', timestamp: '23:18:30', message: 'Low battery warning (45%)' },
  { id: 'a3', unitId: 'f5', type: 'warn', timestamp: '22:45:30', message: 'Signal lost - last contact 38m ago' },
  { id: 'a4', unitId: 'f1', type: 'info', timestamp: '23:15:12', message: 'Entered geofence zone ALPHA-7' },
  { id: 'a5', unitId: 'f3', type: 'info', timestamp: '23:10:45', message: 'Switched to SATCOM mode' },
];

const CommIcon = ({ type }: { type: CommType }) => {
  if (type === 'VHF') return <Radio />;
  if (type === 'GSM') return <Smartphone />;
  if (type === 'SATCOM') return <Satellite />;
  return <Radio />;
};

const createCustomIcon = (status: UnitStatus) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-dot ${status}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

function App() {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('f1');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeUnit = UNITS.find(u => u.id === selectedUnitId) || UNITS[0];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false }) + ' IST';
  };

  const getStatusColor = (status: UnitStatus) => {
    switch (status) {
      case 'active': return 'active';
      case 'warning': return 'warning';
      case 'sos': return 'sos';
      case 'offline': return 'offline';
      default: return 'offline';
    }
  };

  const activeCount = UNITS.filter(u => u.status === 'active').length;
  const sosCount = UNITS.filter(u => u.status === 'sos').length;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div className="shield-container">
            <Shield className="shield-icon" strokeWidth={2} />
          </div>
          <div className="title-container">
            <h1 className="main-title">DHRISHTI DASHBOARD</h1>
            <span className="subtitle">MARGDARSHAK COMMAND CENTER</span>
          </div>
        </div>

        <div className="header-right">
          <div className="status-indicator">
            <Wifi className="wifi-icon" strokeWidth={2.5} />
            <span className="label">LINK:</span>
            <span className="value">ACTIVE</span>
          </div>
          <div className="navic">
            NAVIC <Sparkles size={14} fill="currentColor" />
          </div>
          <div className="time-display">
            <Clock size={14} strokeWidth={2} />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="main-wrapper">
        
        {/* LEFT PANEL */}
        <div className="panel left-panel">
          <div className="panel-header">FIELD UNITS</div>
          <div className="units-list">
            {UNITS.map(unit => (
              <div 
                key={unit.id} 
                className={`unit-card ${selectedUnitId === unit.id ? 'selected' : ''}`}
                onClick={() => setSelectedUnitId(unit.id)}
              >
                <div className="unit-card-header">
                  <span className="unit-name">{unit.name}</span>
                  <span className={`badge ${getStatusColor(unit.status)}`}>
                    {unit.status.toUpperCase()}
                  </span>
                </div>
                <div className="unit-stats-row text-xs">
                  <span className="comm-type">
                    <CommIcon type={unit.comm} /> {unit.comm}
                  </span>
                  <span className="stat-item">SIG: <span className="stat-value">{unit.signal}%</span></span>
                  <span className="stat-item">BAT: <span className="stat-value">{unit.battery}%</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="panel center-panel">
            <div className="map-overlay-stats">
              <div className="stat-segment">
                <span className="label">UNITS DEPLOYED:</span>
                <span className="val-muted">{UNITS.length}</span>
              </div>
              <div className="stat-segment">
                <span className="label">ACTIVE:</span>
                <span className="val-active">{activeCount}</span>
              </div>
              <div className="stat-segment">
                <span className="label">SOS:</span>
                <span className="val-sos">{sosCount}</span>
              </div>
            </div>

            <div className="map-container">
              <MapContainer 
                center={[19.18, 72.85]} 
                zoom={11} 
                style={{ height: '100%', width: '100%', backgroundColor: '#0c1012' }}
                zoomControl={false}
              >
                {/* A dark themed map tile layer (e.g., CartoDB Dark Matter) */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <ZoomControl position="bottomright" />
                
                {UNITS.map(unit => (
                  <Marker 
                    key={unit.id} 
                    position={unit.coords}
                    icon={createCustomIcon(unit.status)}
                    eventHandlers={{ click: () => setSelectedUnitId(unit.id) }}
                  >
                    <Popup className="dark-popup">
                      <strong>{unit.name}</strong><br/>
                      {unit.callsign}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          
          <div className="panel details-panel">
            <div className="details-header">
              <div className="details-header-text">
                <h2>{activeUnit.name}</h2>
                <p>{activeUnit.callsign}</p>
              </div>
              <div className="details-comm">
                <CommIcon type={activeUnit.comm} /> {activeUnit.comm}
              </div>
            </div>

            <div className="coords-box">
              <span className="coords-label">COORDINATES</span>
              <span className="coords-value">{formatCoords(activeUnit.coords)}</span>
              <span className="last-updated">LAST: {activeUnit.lastActive}</span>
            </div>

            <div className="details-grid">
              <div className="grid-cell-top">
                <span className="cell-label"><Mountain /> ALTITUDE</span>
                <span className="cell-value">{activeUnit.altitude}</span>
              </div>
              <div className="grid-cell-top">
                <span className="cell-label"><Gauge /> SPEED</span>
                <span className="cell-value">{activeUnit.speed}</span>
              </div>
              <div className="grid-cell-top">
                <span className="cell-label"><Compass /> HEADING</span>
                <span className="cell-value">{activeUnit.heading}</span>
              </div>
              <div className="grid-cell-top">
                <span className="cell-label"><Thermometer /> TEMP</span>
                <span className="cell-value">{activeUnit.temp}</span>
              </div>
              <div className="grid-cell-top">
                <span className="cell-label"><Battery /> BATTERY</span>
                <span className={`cell-value ${activeUnit.battery > 50 ? 'green' : ''}`}>
                  {activeUnit.battery}%
                </span>
              </div>
              <div className="grid-cell-top">
                <span className="cell-label"><Signal /> SIGNAL</span>
                <span className={`cell-value ${activeUnit.signal > 50 ? 'green' : ''}`}>
                  {activeUnit.signal}%
                </span>
              </div>
            </div>

            <div className="actions-row">
              <button className="btn btn-sos">SEND SOS</button>
              <button className="btn btn-ping">PING UNIT</button>
            </div>
          </div>

          <div className="panel logs-panel">
            <div className="panel-header">ALERTS & EVENTS</div>
            <div className="logs-list">
              {ALERTS.map(alert => {
                const unit = UNITS.find(u => u.id === alert.unitId) || UNITS[0];
                return (
                  <div key={alert.id} className={`log-item ${alert.type}`}>
                    <div className="log-header">
                      <span className="log-unit-name">
                        <span className="log-unit-name-inner">
                          {alert.type === 'eos' ? <AlertCircle /> : null}
                          {alert.type === 'warn' ? <AlertTriangle /> : null}
                          {alert.type === 'info' ? <Info /> : null}
                          {unit.name}
                        </span>
                      </span>
                      <span className="log-time">{alert.timestamp}</span>
                    </div>
                    <div className="log-message">{alert.message}</div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

export default App;
