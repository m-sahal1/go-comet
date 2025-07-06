import React, { useState, useEffect } from 'react';
import './LeaderboardTable.css';

// Temporary mock data until API integration (Step 7)
const mockTopPlayers = [
  { rank: 1, username: 'ShadowHunter', score: 9870, country: '🇺🇸' },
  { rank: 2, username: 'CyberPhoenix', score: 9560, country: '🇬🇧' },
  { rank: 3, username: 'NeonBlade', score: 9340, country: '🇨🇦' },
  { rank: 4, username: 'QuantumKnight', score: 9125, country: '🇩🇪' },
  { rank: 5, username: 'DigitalStorm', score: 8990, country: '🇫🇷' },
  { rank: 6, username: 'LaserRanger', score: 8840, country: '🇯🇵' },
  { rank: 7, username: 'PlasmaReaper', score: 8720, country: '🇰🇷' },
  { rank: 8, username: 'StormDragon', score: 8615, country: '🇦🇺' },
  { rank: 9, username: 'OrbitronWarrior', score: 8500, country: '🇮🇳' },
  { rank: 10, username: 'PixelFury', score: 8420, country: '🇧🇷' },
];

const LeaderboardTable = () => {
  const [players, setPlayers] = useState([]);

  // In a later step we will fetch real data via hooks / API
  useEffect(() => {
    setPlayers(mockTopPlayers);
  }, []);

  return (
    <div className="table-container">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th className="country-col">Country</th>
          </tr>
        </thead>
        <tbody>
          {players.map(({ rank, username, score, country }) => (
            <tr key={rank} className={`rank-${rank}`}>
              <td>{rank}</td>
              <td className="username-cell">{username}</td>
              <td>{score.toLocaleString()}</td>
              <td className="country-col">{country}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable; 