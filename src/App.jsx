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
