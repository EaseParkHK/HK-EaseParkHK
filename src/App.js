import React, { useState, useEffect } from 'react';
import CarParkTable from './CarParkTable';
import './App.css';

const VEHICLE_TYPES = [
  { key: 'privateCar', label: 'Private Car' },
  { key: 'motorCycle', label: 'Motorcycle' },
  { key: 'HGV', label: 'Heavy Goods Vehicle' },
  { key: 'LGV', label: 'Light Goods Vehicle' },
  { key: 'coach', label: 'Coach' }
];

const App = () => {
  const [carparks, setCarparks] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [filters, setFilters] = useState(() => {
    const savedType = localStorage.getItem('vehicleType');
    return {
      vehicleType: savedType || 'privateCar'
    };
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'vacancy',
    direction: 'desc'
  });
  const [selectedCarpark, setSelectedCarpark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const toggleFavorite = (parkId) => {
    let updatedFavorites;
    if (favorites.includes(parkId)) {
      updatedFavorites = favorites.filter(id => id !== parkId);
    } else {
      updatedFavorites = [...favorites, parkId];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Save vehicle type to localStorage when changed
  const handleVehicleTypeChange = (e) => {
    const vehicleType = e.target.value;
    setFilters({ vehicleType });
    localStorage.setItem('vehicleType', vehicleType);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [res1, res2] = await Promise.all([
          fetch('https://api.data.gov.hk/v1/carpark-info-vacancy'),
          fetch('https://api.data.gov.hk/v1/carpark-info-vacancy?data=vacancy&vehicleTypes=privateCar,motorCycle,LGV,HGV,coach&lang=en_US')
        ]);
        const data1 = await res1.json();
        const data2 = await res2.json();

        // 建 vacancyMap
        const vacancyMap = data2.results.reduce((acc, item) => {
          acc[item.park_Id] = {
            privateCar: item.privateCar?.[0] || { vacancy: 'N/A' },
            motorCycle: item.motorCycle?.[0] || { vacancy: 'N/A' },
            LGV: item.LGV?.[0] || { vacancy: 'N/A' },
            HGV: item.HGV?.[0] || { vacancy: 'N/A' },
            coach: item.coach?.[0] || { vacancy: 'N/A' }
          };
          return acc;
        }, {});

        // 合併 vacancy
        const merged = data1.results.map(carpark => {
          const vacancyInfo = vacancyMap[carpark.park_Id] || {};
          return {
            ...carpark,
            ...vacancyInfo,
            vacancy: vacancyInfo[filters.vehicleType]?.vacancy ?? 'N/A'
          };
        });

        setCarparks(merged);
      } catch (error) {
        console.error('Error fetching data:', error);
        setCarparks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.vehicleType]);

  // 過濾、搜尋、排序
  let filteredCarparks = carparks
    .filter(carpark => {
      const vacancy = carpark[filters.vehicleType]?.vacancy ?? carpark.vacancy;
      return vacancy && !['N/A', 'none', '-1'].includes(vacancy.toString());
    })
    .filter(carpark =>
      search.trim() === '' ||
      carpark.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
      carpark.displayAddress?.toLowerCase().includes(search.trim().toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let aValue = a[sortConfig.key] ?? '';
      let bValue = b[sortConfig.key] ?? '';
      // vacancy 用數字排序
      if (sortConfig.key === 'vacancy') {
        aValue = parseInt(aValue, 10) || 0;
        bValue = parseInt(bValue, 10) || 0;
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  // 收藏在最上方
  filteredCarparks = [
    ...filteredCarparks.filter(c => favorites.includes(c.park_Id)),
    ...filteredCarparks.filter(c => !favorites.includes(c.park_Id))
  ];

  // 收藏區塊
  const favouriteCarparks = carparks.filter(c => favorites.includes(c.park_Id))
    .filter(carpark =>
      search.trim() === '' ||
      carpark.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
      carpark.displayAddress?.toLowerCase().includes(search.trim().toLowerCase())
    );

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">🚗 EaseParkHK</h1>
        <p className="app-subtitle">Find Real-Time Parking Availability in Hong Kong</p>
      </header>

      <div className="controls-container">
        <div className="filter-group">
          <label htmlFor="vehicle-type" className="filter-label">Vehicle Type:</label>
          <select
            id="vehicle-type"
            className="filter-select"
            value={filters.vehicleType}
            onChange={handleVehicleTypeChange}
          >
            {VEHICLE_TYPES.map(type => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="search" className="filter-label">Search:</label>
          <input
            id="search"
            className="filter-select"
            type="text"
            placeholder="Search by name or address"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.8rem', fontSize: '1rem' }}
          />
        </div>
      </div>

      {/* 收藏區塊 */}
      {favouriteCarparks.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#f39c12' }}>★ Favourite Car Parks</h2>
          <CarParkTable
            carparks={favouriteCarparks}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onShowMap={setSelectedCarpark}
            onSort={handleSort}
            sortConfig={sortConfig}
            currentVehicleType={filters.vehicleType}
          />
        </section>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading parking data...</p>
        </div>
      ) : (
        <>
          <CarParkTable
            carparks={filteredCarparks}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onShowMap={setSelectedCarpark}
            onSort={handleSort}
            sortConfig={sortConfig}
            currentVehicleType={filters.vehicleType}
          />

          {selectedCarpark && (
            <div className="modal-backdrop" onClick={() => setSelectedCarpark(null)}>
              <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{selectedCarpark.name}</h3>
                  <button
                    className="modal-close"
                    onClick={() => setSelectedCarpark(null)}
                  >
                    &times;
                  </button>
                </div>
                <div className="modal-content">
                  <div className="map-container">
                    <iframe
                      title="map"
                      className="map-iframe"
                      src={`https://www.google.com/maps?q=${selectedCarpark.latitude},${selectedCarpark.longitude}&output=embed`}
                    />
                  </div>
                  <div className="carpark-info">
                    <p><strong>📍 Address:</strong> {selectedCarpark.displayAddress}</p>
                    <p><strong>🕒 Status:</strong>
                      <span className={`status-indicator ${selectedCarpark.opening_status?.toLowerCase()}`}>
                        {selectedCarpark.opening_status}
                      </span>
                    </p>
                    <p><strong>🅿️ Vacancies:</strong>
                      {selectedCarpark[filters.vehicleType]?.vacancy || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;