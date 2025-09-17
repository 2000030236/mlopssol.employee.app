import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import './App.css';

// Helper to get all dates in a month
function getDatesInMonth(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const dates = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// Monthly CSV string: each date as a row, names and times as columns
function getMonthlyCSVString(dateStr) {
  const monthDates = getDatesInMonth(dateStr);
  // Collect all unique names for the month
  const nameSet = new Set();
  monthDates.forEach(d => {
    loadRecords(d).forEach(r => {
      if (r.name) nameSet.add(r.name);
    });
  });
  const names = Array.from(nameSet);
  let csv = 'Date,Day';
  names.forEach(n => {
    csv += `,${n} (Time)`;
  });
  csv += '\n';
  monthDates.forEach(d => {
    const recs = loadRecords(d);
    const day = new Date(d).toLocaleDateString('en-US', { weekday: 'long' });
    let row = `${d},${day}`;
    names.forEach(n => {
      const rec = recs.find(r => r.name === n);
      row += `,${rec ? rec.time : ''}`;
    });
    csv += row + '\n';
  });
  return csv;
}

function getToday() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // yyyy-mm-dd
  const time = now.toLocaleTimeString('en-GB', { hour12: false }); // HH:MM:SS 24-hour
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  return { date, time, day };
}

function loadRecords(date) {
  const all = JSON.parse(localStorage.getItem('attendance') || '{}');
  return all[date] || [];
}

function saveRecords(date, records) {
  const all = JSON.parse(localStorage.getItem('attendance') || '{}');
  all[date] = records;
  localStorage.setItem('attendance', JSON.stringify(all));
}

function AttendanceSheet() {
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today.date);
  const [records, setRecords] = useState(() => loadRecords(today.date));
  const [newName, setNewName] = useState('');
  const [csvUrl, setCsvUrl] = useState('');
  const isToday = selectedDate === today.date;

  // Moved downloadMonthlyCSV inside AttendanceSheet to access selectedDate state
  const downloadMonthlyCSV = () => {
    const csv = getMonthlyCSVString(selectedDate);
    // Check for empty data (header only)
    if (!csv || csv.trim() === 'Date,Day') {
      alert('No records for this month.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    if (window.navigator.msSaveOrOpenBlob) {
      // For IE
      window.navigator.msSaveOrOpenBlob(blob, `attendance_month_${selectedDate.slice(0, 7)}.csv`);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_month_${selectedDate.slice(0, 7)}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  };

  useEffect(() => {
    setRecords(loadRecords(selectedDate));
    setCsvUrl('');
  }, [selectedDate]);

  const getCSVString = () => {
    const header = 'Name,Time,Date,Day';
    const rows = records.map(r => `${r.name},'${r.time}',${r.date},${r.day}`);
    return [header, ...rows].join('\n');
  };

  const addRecord = () => {
    if (!newName.trim()) return;
    const entry = {
      name: newName.trim(),
      time: getToday().time,
      date: selectedDate,
      day: new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }),
    };
    const updated = [...records, entry];
    setRecords(updated);
    saveRecords(selectedDate, updated);
    setNewName('');
  };

  const handleNameChange = (idx, value) => {
    if (!isToday) return;
    const updated = records.map((r, i) => i === idx ? { ...r, name: value } : r);
    setRecords(updated);
    saveRecords(selectedDate, updated);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const downloadCSV = () => {
    if (!records.length) {
      alert('No records to download for this date.');
      return;
    }
    const csv = getCSVString().replace(/\n/g, '\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    setCsvUrl(url);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Do not revokeObjectURL immediately so user can open it
  };

  return (
    <div className="container">
      <h2>Employee Attendance Sheet</h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          Select Date:{' '}
          <input type="date" value={selectedDate} onChange={handleDateChange} />
        </label>
        <button onClick={downloadCSV} style={{ marginLeft: 16 }}>Download CSV</button>
        <button onClick={downloadMonthlyCSV} style={{ marginLeft: 16, background: '#1976d2', color: '#fff' }}>Download Monthly CSV</button>
        {/* Weekly average button removed */}
        {csvUrl && (
          <a href={csvUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 16, color: '#0078d4', textDecoration: 'underline', fontWeight: 500 }}>
            Open CSV
          </a>
        )}
      </div>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Time</th>
            <th>Date</th>
            <th>Day</th>
            {isToday && <th></th>}
          </tr>
        </thead>
        <tbody>
          {records.map((rec, idx) => (
            <tr key={idx}>
              <td>
                {isToday ? (
                  <input value={rec.name} onChange={e => {
                    const updated = records.map((r, i) => i === idx ? { ...r, name: e.target.value } : r);
                    setRecords(updated);
                    saveRecords(selectedDate, updated);
                  }} />
                ) : (
                  <span>{rec.name}</span>
                )}
              </td>
              <td>
                {isToday ? (
                  <input value={rec.time} onChange={e => {
                    const updated = records.map((r, i) => i === idx ? { ...r, time: e.target.value } : r);
                    setRecords(updated);
                    saveRecords(selectedDate, updated);
                  }} />
                ) : (
                  <span>{rec.time}</span>
                )}
              </td>
              <td>
                {isToday ? (
                  <input value={rec.date} onChange={e => {
                    const updated = records.map((r, i) => i === idx ? { ...r, date: e.target.value } : r);
                    setRecords(updated);
                    saveRecords(selectedDate, updated);
                  }} />
                ) : (
                  <span>{rec.date}</span>
                )}
              </td>
              <td>
                {isToday ? (
                  <input value={rec.day} onChange={e => {
                    const updated = records.map((r, i) => i === idx ? { ...r, day: e.target.value } : r);
                    setRecords(updated);
                    saveRecords(selectedDate, updated);
                  }} />
                ) : (
                  <span>{rec.day}</span>
                )}
              </td>
              {isToday && (
                <td>
                  <button onClick={() => {
                    const updated = records.filter((_, i) => i !== idx);
                    setRecords(updated);
                    saveRecords(selectedDate, updated);
                  }} style={{ color: '#fff', background: '#d32f2f', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                </td>
              )}
            </tr>
          ))}
          {isToday && (
            <tr>
              <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Enter name"
                />
                <button onClick={addRecord} style={{ padding: '4px 12px', fontSize: '0.95rem' }}>Save</button>
              </td>
              <td>{newName ? getToday().time : ''}</td>
              <td>{selectedDate}</td>
              <td>{today.day}</td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Weekly average section removed */}
      <p style={{ marginTop: 16 }}>All data is stored locally in your browser.</p>
    </div>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  return (
    <Routes>
      <Route path="/" element={loggedIn ? <Navigate to="/attendance" /> : <Login onLogin={() => setLoggedIn(true)} />} />
      <Route path="/attendance" element={loggedIn ? <AttendanceSheet /> : <Navigate to="/" />} />
      {/* Catch-all route to handle unmatched paths and suppress warnings */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
