import { useEffect, useRef, useState, type ReactNode } from 'react';
import '../styles/profile-cover.css';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
export default function ProfileCover({ children }: { children?: ReactNode }) {
  const [image, setImage] = useState('');
  const [position, setPosition] = useState(50);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (image) URL.revokeObjectURL(image); }, [image]);
  function select(file?: File) {
    if (!file) return;
    if (!allowedTypes.includes(file.type)) { setError('Choose a JPG, PNG, or WebP image.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Choose an image smaller than 10 MB.'); return; }
    setError(''); setPosition(50); setImage(URL.createObjectURL(file));
  }
  return <section className="member-cover" aria-label="Profile cover photo">
    <div className={`member-cover-frame${children ? ' member-cover-with-profile' : ''}`}>
      {image ? <img src={image} alt="Your profile cover" style={{ objectPosition: `center ${position}%` }} onError={() => { setError('This image could not be opened. Please choose another image.'); setImage(''); }} /> : <div className="member-cover-empty"><span>Make this space yours</span><p>Add a cover photo above your profile.</p></div>}
      {children && <div className="member-cover-profile">{children}</div>}
    </div>
    <div className="member-cover-tools">
      <input ref={input} className="member-cover-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose cover photo" onChange={event => { select(event.target.files?.[0]); event.target.value = ''; }} />
      <button type="button" className="member-edit" onClick={() => input.current?.click()}>{image ? 'Change cover photo' : '+ Add cover photo'}</button>
      {image && <><button type="button" className="member-edit" onClick={() => { setImage(''); setError(''); }}>Remove photo</button><label className="member-cover-position">Photo position<input type="range" min="0" max="100" value={position} onChange={event => setPosition(Number(event.target.value))} /></label></>}
      <p>Preview only · JPG, PNG, WebP · up to 10 MB</p>
    </div>
    {error && <p className="member-cover-error" role="alert">{error}</p>}
  </section>;
}
