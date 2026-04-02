import { useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

interface InstrumentActionsProps {
  instrumentId: string;
  currentOwnerId: string | null;
  onOwnershipChange: () => void;
}

export default function InstrumentActions({ instrumentId, currentOwnerId, onOwnershipChange }: InstrumentActionsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!hasSupabase || !user) return null;

  const isOwner = user.id === currentOwnerId;
  const isUnclaimed = !currentOwnerId;

  const handleClaim = async () => {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from('instruments')
      .update({ current_owner_id: user.id })
      .eq('id', instrumentId)
      .is('current_owner_id', null);

    if (error) {
      setMessage('Could not claim this instrument. It may already be claimed.');
    } else {
      // Add to ownership history
      await supabase.from('instrument_history').insert({
        instrument_id: instrumentId,
        artist_id: user.id,
        date_from: new Date().toISOString().split('T')[0],
        relationship: 'owned',
      });
      setMessage('Instrument claimed.');
      onOwnershipChange();
    }
    setLoading(false);
  };

  const handleTransfer = async () => {
    const recipientSlug = prompt('Enter the username of the new owner (e.g., cellist-anna):');
    if (!recipientSlug) return;

    setLoading(true);
    setMessage(null);

    // Find recipient
    const { data: recipient, error: findError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('username', recipientSlug.toLowerCase().replace('@', ''))
      .single();

    if (findError || !recipient) {
      setMessage(`User @${recipientSlug} not found.`);
      setLoading(false);
      return;
    }

    // Close current ownership period
    await supabase
      .from('instrument_history')
      .update({ date_to: new Date().toISOString().split('T')[0] })
      .eq('instrument_id', instrumentId)
      .eq('artist_id', user.id)
      .is('date_to', null);

    // Transfer ownership
    const { error: transferError } = await supabase
      .from('instruments')
      .update({ current_owner_id: recipient.id })
      .eq('id', instrumentId)
      .eq('current_owner_id', user.id);

    if (transferError) {
      setMessage('Transfer failed. Please try again.');
    } else {
      // Create new ownership history entry
      await supabase.from('instrument_history').insert({
        instrument_id: instrumentId,
        artist_id: recipient.id,
        date_from: new Date().toISOString().split('T')[0],
        relationship: 'owned',
      });
      setMessage(`Transferred to ${recipient.display_name}.`);
      onOwnershipChange();
    }
    setLoading(false);
  };

  return (
    <div className="mt-4">
      {isUnclaimed && (
        <button
          onClick={handleClaim}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C1917] text-white text-sm font-medium rounded-lg hover:bg-[#292524] transition-colors border-none cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Claiming...' : 'Claim this instrument'}
        </button>
      )}

      {isOwner && (
        <button
          onClick={handleTransfer}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border text-sm font-medium rounded-lg hover:border-accent transition-colors bg-transparent cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Transferring...' : 'Transfer ownership'}
        </button>
      )}

      {message && (
        <p className="text-xs text-muted mt-2">{message}</p>
      )}
    </div>
  );
}
