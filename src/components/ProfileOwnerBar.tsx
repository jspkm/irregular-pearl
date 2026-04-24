import { useAuth } from '../lib/useAuth';

interface ProfileOwnerBarProps {
  profileUserId: string;
}

export default function ProfileOwnerBar({ profileUserId }: ProfileOwnerBarProps) {
  const { user } = useAuth();

  if (!user || user.id !== profileUserId) return null;

  return (
    <div className="bg-accent-soft border border-accent-border rounded-lg px-4 py-2.5 mb-6 flex items-center justify-between">
      <span className="text-sm text-accent-hover">This is your public profile</span>
      <a
        href={`/profile/${profileUserId}`}
        className="inline-flex items-center bg-transparent border-[0.5px] border-border-strong text-muted font-body text-[11px] px-2.5 py-1 rounded-md transition-colors hover:text-ink hover:border-ink no-underline"
      >
        Edit profile
      </a>
    </div>
  );
}
