export default function HeroCard(): JSX.Element {
  return (
    <section className="hero-card">
      <div>
        <p className="eyebrow">Team planning</p>
        <h1>Availability Matrix</h1>
        <p className="hero-copy">Track who is working, on vacation, or absent for each day.</p>
      </div>
      <div className="legend">
        <span className="legend-item status-w">W · Working</span>
        <span className="legend-item status-v">V · Vacation</span>
        <span className="legend-item status-a">A · Absence</span>
      </div>
    </section>
  );
}
