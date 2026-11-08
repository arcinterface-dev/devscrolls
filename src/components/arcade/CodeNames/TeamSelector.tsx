import React from 'react';
import type { RoomPlayer } from '../shared/useSupabaseRoom';

export interface PlayerTeamAssignment {
  team: 'red' | 'blue';
  role: 'spymaster' | 'operative';
}

interface TeamSelectorProps {
  players: RoomPlayer[];
  currentPlayerId: string;
  assignments: Record<string, PlayerTeamAssignment>;
  onSelectTeamRole: (team: 'red' | 'blue', role: 'spymaster' | 'operative') => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  players,
  currentPlayerId,
  assignments,
  onSelectTeamRole,
}) => {
  const redPlayers = players.filter((p) => assignments[p.id]?.team === 'red');
  const bluePlayers = players.filter((p) => assignments[p.id]?.team === 'blue');

  const myAssignment = assignments[currentPlayerId] || { team: 'red', role: 'operative' };

  return (
    <div className="team-selector-grid">
      {/* Red Team Column */}
      <div className="team-col col-red">
        <div className="team-header">
          <strong className="team-title red-title">TEAM RED</strong>
          <span className="team-count">{redPlayers.length} agents</span>
        </div>

        <div className="role-actions">
          <button
            type="button"
            onClick={() => onSelectTeamRole('red', 'spymaster')}
            className={`join-btn ${myAssignment.team === 'red' && myAssignment.role === 'spymaster' ? 'active-red' : ''}`}
          >
            Join as Spymaster (Clues)
          </button>
          <button
            type="button"
            onClick={() => onSelectTeamRole('red', 'operative')}
            className={`join-btn ${myAssignment.team === 'red' && myAssignment.role === 'operative' ? 'active-red' : ''}`}
          >
            Join as Operative (Guesser)
          </button>
        </div>

        <div className="roster-list">
          {redPlayers.map((p) => {
            const role = assignments[p.id]?.role || 'operative';
            return (
              <div key={p.id} className="roster-item">
                <span className="roster-name">{p.displayName}</span>
                <span className="roster-role">{role === 'spymaster' ? '👑 Spymaster' : 'Operative'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blue Team Column */}
      <div className="team-col col-blue">
        <div className="team-header">
          <strong className="team-title blue-title">TEAM BLUE</strong>
          <span className="team-count">{bluePlayers.length} agents</span>
        </div>

        <div className="role-actions">
          <button
            type="button"
            onClick={() => onSelectTeamRole('blue', 'spymaster')}
            className={`join-btn ${myAssignment.team === 'blue' && myAssignment.role === 'spymaster' ? 'active-blue' : ''}`}
          >
            Join as Spymaster (Clues)
          </button>
          <button
            type="button"
            onClick={() => onSelectTeamRole('blue', 'operative')}
            className={`join-btn ${myAssignment.team === 'blue' && myAssignment.role === 'operative' ? 'active-blue' : ''}`}
          >
            Join as Operative (Guesser)
          </button>
        </div>

        <div className="roster-list">
          {bluePlayers.map((p) => {
            const role = assignments[p.id]?.role || 'operative';
            return (
              <div key={p.id} className="roster-item">
                <span className="roster-name">{p.displayName}</span>
                <span className="roster-role">{role === 'spymaster' ? '👑 Spymaster' : 'Operative'}</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .team-selector-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          width: 100%;
        }

        .team-col {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .col-red {
          border-top: 3px solid #ef4444;
        }

        .col-blue {
          border-top: 3px solid #3b82f6;
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .red-title { color: #ef4444; }
        .blue-title { color: #3b82f6; }

        .team-count {
          font-size: 11px;
          color: #64748b;
        }

        .role-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .join-btn {
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 700;
          border-radius: var(--radius-sm);
          cursor: pointer;
          border: 1px solid #334155;
          background: #1e293b;
          color: #94a3b8;
          transition: all 0.15s;
          text-align: left;
        }

        .join-btn:hover {
          color: #ffffff;
          border-color: #64748b;
        }

        .active-red {
          background: #ef4444;
          border-color: #ef4444;
          color: #ffffff;
        }

        .active-blue {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #ffffff;
        }

        .roster-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 120px;
          overflow-y: auto;
          background: #090e1a;
          border-radius: var(--radius-sm);
          padding: 6px;
        }

        .roster-item {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          padding: 4px 6px;
          color: #cbd5e1;
        }

        .roster-role {
          font-size: 10px;
          color: #f59e0b;
          font-weight: 700;
        }

        @media (max-width: 600px) {
          .team-selector-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
