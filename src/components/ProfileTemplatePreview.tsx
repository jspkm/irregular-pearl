import { useState } from 'react';
import ProfileCover from './ProfileCover';
import ProfileModules from './ProfileModules';
import ProfileStats from './ProfileStats';
import ProfileHeader, { type ProfileHeaderData } from './ProfileHeader';
export default function ProfileTemplatePreview() {
  const [profile, setProfile] = useState<ProfileHeaderData>({ name: 'Haji Kim', username: 'haji-kim' });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: 'Haji Kim', username: 'haji-kim', bio: '', city: '', instagram: '', website: '' });
  return <>
    <ProfileCover><ProfileHeader profile={profile} onEdit={() => setEditing(true)} /></ProfileCover>
    {editing && <form className="member-form" onSubmit={event => {
      event.preventDefault();
      setProfile({ name: draft.name.trim(), username: draft.username.trim().replace(/^@/, ''), bio: draft.bio.trim(), city: draft.city.trim(), socials: [{ label: 'Instagram', url: draft.instagram }, { label: 'Website', url: draft.website }].filter(link => link.url) });
      setEditing(false);
    }}>
      <h2>Edit profile</h2><p>This is a design preview. Changes apply here until you refresh.</p>
      <label>Name<input autoFocus value={draft.name} maxLength={100} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
      <label>Username<input value={draft.username} maxLength={50} onChange={event => setDraft({ ...draft, username: event.target.value })} /></label>
      <label>Short bio<textarea rows={3} maxLength={160} value={draft.bio} onChange={event => setDraft({ ...draft, bio: event.target.value })} /><span>{draft.bio.length}/160</span></label>
      <label>City (optional)<input value={draft.city} maxLength={100} onChange={event => setDraft({ ...draft, city: event.target.value })} /></label>
      <label>Instagram URL (optional)<input type="url" placeholder="https://www.instagram.com/…" value={draft.instagram} onChange={event => setDraft({ ...draft, instagram: event.target.value })} /></label>
      <label>Website URL (optional)<input type="url" placeholder="https://…" value={draft.website} onChange={event => setDraft({ ...draft, website: event.target.value })} /></label>
      <div><button className="member-edit" type="submit">Apply preview</button><button className="member-edit" type="button" onClick={() => setEditing(false)}>Cancel</button></div>
    </form>}
    <ProfileStats preview />
    <ProfileModules />
  </>;
}
