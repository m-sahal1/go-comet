import React from 'react';
import LeaderboardTable from './LeaderboardTable';
import PlayerRankLookup from './PlayerRankLookup';
import './MainLayout.css';

const MainLayout = () => (
  <div className="main-layout">
    <section className="leaderboard-pane">
      <h2 className="section-title">Top 10 Players</h2>
      <LeaderboardTable />
    </section>

    <section className="rank-lookup-pane">
      <h2 className="section-title">Find Your Rank</h2>
      <PlayerRankLookup />
    </section>
  </div>
);

export default MainLayout; 