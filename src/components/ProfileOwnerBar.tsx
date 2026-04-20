import { useAuth } from '../lib/useAuth';

interface ProfileOwnerBarProps {
  profileUserId: string;
}

export default function ProfileOwnerBar({ profileUserId }: ProfileOwnerBarProps) {
  const { user } = useAuth();

  if (!user || user.id !== profileUserId) return null;

  return (
    <div className="bg-[#F2EEF5] border border-[#D9CCE1] rounded-lg px-4 py-2.5 mb-6 flex items-center justify-between">
      <span className="text-sm text-[#4C385C]">This is your public profile</span>
      <a
        href={`/profile/${profileUserId}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#292524] transition-colors no-underline"
      >
        Edit profile
      </a>
    </div>
  );
}
