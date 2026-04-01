import { Link } from 'react-router-dom';

export function TeamlessNotification() {
  return (
    <div className="teamless-banner" role="status">
      <span className="teamless-banner-icon" aria-hidden="true">
        ℹ️
      </span>
      <p className="teamless-banner-text">
        You are not yet part of a team.
        <Link to="/teams" className="teamless-banner-link">
          Join or create a team to collaborate.
        </Link>
      </p>
    </div>
  );
}
