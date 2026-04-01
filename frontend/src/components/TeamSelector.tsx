import React from 'react';
import type { Team } from '../lib/api.models';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: number | null;
  defaultTeamId?: number | null;
  onTeamChange: (teamId: number) => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  selectedTeamId,
  defaultTeamId,
  onTeamChange,
}) => {
  if (!teams || teams.length === 0) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTeamChange(Number(e.target.value));
  };

  return (
    <div className="team-selector">
      <label htmlFor="team-select" className="team-selector-label">
        Team:
      </label>
      <select
        id="team-select"
        value={selectedTeamId || ''}
        onChange={handleChange}
        className="team-selector-select"
        disabled={teams.length === 1}
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
            {team.id === defaultTeamId ? ' ★' : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TeamSelector;