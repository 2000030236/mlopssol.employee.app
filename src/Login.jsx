import React, { useState } from 'react';
import './App.css';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const CORRECT_PASSWORD = 'dev'; // Password is now 'S@r@'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      onLogin();
    } else {
      setError('Incorrect password!');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: '10vh', textAlign: 'center' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          style={{ padding: '8px', fontSize: '1rem', marginBottom: '1rem', width: '80%' }}
        />
        <br />
        <button type="submit" style={{ padding: '8px 24px', fontSize: '1rem', marginTop: '1rem' }}>
          Login
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}
