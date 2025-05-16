import React from 'react';

const HEADERS = [
  { key: 'name', label: 'Carpark Name' },
  { key: 'displayAddress', label: 'Address' },
  { key: 'opening_status', label: 'Status' },
  { key: 'vacancy', label: 'Vacancy' }
];

const CarParkTable = ({
  carparks,
  favorites,
  onToggleFavorite,
  onShowMap,
  onSort,
  sortConfig
}) => {
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '▲';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <>
      <h2>All Parking Lots</h2>
      <div className="table-responsive">
        <table className="table table-striped table-hover mt-4">
          <thead className="thead-dark">
            <tr>
              {HEADERS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => onSort(key)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  scope="col"
                >
                  {label} <span style={{ fontSize: '0.9em' }}>{getSortIcon(key)}</span>
                </th>
              ))}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {carparks.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length + 1} style={{ textAlign: 'center', color: '#888' }}>
                  No parking data available.
                </td>
              </tr>
            ) : (
              carparks.map(carpark => (
                <tr key={carpark.park_Id}>
                  <td>{carpark.name}</td>
                  <td>{carpark.displayAddress}</td>
                  <td>
                    <span className={`status-indicator ${carpark.opening_status?.toLowerCase()}`}>
                      {carpark.opening_status}
                    </span>
                  </td>
                  <td>{carpark.vacancy}</td>
                  <td>
                    <div className="btn-group">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onShowMap(carpark)}
                        title="Show on Map"
                      >
                        Map
                      </button>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => onToggleFavorite(carpark.park_Id)}
                        title={favorites.includes(carpark.park_Id) ? 'Remove from favorites' : 'Add to favorites'}
                        style={{ marginLeft: 8 }}
                      >
                        {favorites.includes(carpark.park_Id) ? '★' : '☆'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CarParkTable;