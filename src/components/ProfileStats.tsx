import '../styles/profile-stats.css';
export default function ProfileStats({ following = null, followers = null, contributions = null, preview = false }: { following?: number | null; followers?: number | null; contributions?: number | null; preview?: boolean }) {
  return <section className="member-stats" aria-label="Profile statistics">
    <dl>{[{ label: 'Following', count: following }, { label: 'Followers', count: followers }, { label: 'Contributions', count: contributions }].map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.count === null ? '—' : stat.count.toLocaleString()}</dd></div>)}</dl>
    {preview && <p>Preview counts — following and contribution tracking are not connected yet.</p>}
  </section>;
}
