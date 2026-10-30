import { MapPin, UserRound } from 'lucide-react';
import '../styles/profile-header.css';
export interface ProfileHeaderData {
  name: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  socials?: { label: string; url: string }[];
}
export default function ProfileHeader({ profile, onEdit }: { profile: ProfileHeaderData; onEdit?: () => void }) {
  return <header className="member-header">
    <div className="member-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt={`${profile.name || profile.username}’s avatar`} /> : <UserRound size={40} strokeWidth={1} aria-label="Avatar placeholder" />}</div>
    <div className="member-identity">
      <div className="member-name-row"><h1>{profile.name || profile.username || 'Your name'}</h1>{onEdit && <button type="button" className="member-edit" onClick={onEdit}>Edit profile</button>}</div>
      {profile.username && <p className="member-handle">@{profile.username}</p>}
      <p className={`member-bio${profile.bio ? '' : ' member-placeholder'}`}>{profile.bio || 'A little about you and your life in music.'}</p>
      <div className="member-details">
        {profile.city && <span className="member-city"><MapPin size={14} strokeWidth={1.5} aria-hidden="true" />{profile.city}</span>}
        {profile.socials?.filter(link => /^https?:\/\//i.test(link.url)).map(link => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}
        {!profile.city && !profile.socials?.length && <span className="member-placeholder">City and social links are optional.</span>}
      </div>
    </div>
  </header>;
}
