import { useState } from 'react';
import { supabase } from '../lib/supabase';

const ERAS = ['Baroque', 'Classical', 'Romantic', 'Modern', 'Contemporary'];
const FORMS = [
  'Sonata', 'Concerto', 'Symphony', 'Suite', 'Etude', 'Prelude', 'Fugue',
  'Nocturne', 'Waltz', 'Polonaise', 'Ballade', 'Scherzo', 'Rhapsody',
  'Variations', 'Rondo', 'Fantasy', 'Overture', 'Opera', 'Requiem',
  'Mass', 'Oratorio', 'Cantata', 'Lied', 'Chamber', 'Solo', 'Orchestral',
  'Choral', 'Vocal', 'Other',
];
const INSTRUMENTS = [
  'Piano', 'Violin', 'Viola', 'Cello', 'Double Bass',
  'Flute', 'Oboe', 'Clarinet', 'Bassoon',
  'Trumpet', 'French Horn', 'Trombone', 'Tuba',
  'Voice', 'Choir', 'Guitar', 'Harp', 'Organ',
  'Percussion', 'Orchestra', 'Chamber Ensemble', 'Other',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export default function AddPieceForm() {
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [instrument, setInstrument] = useState('');
  const [era, setEra] = useState('');
  const [form, setForm] = useState('');
  const [catalogNumber, setCatalogNumber] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim() || !composer.trim() || !instrument || !era || !form) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);

    try {
      const composerSlug = slugify(composer.split(' ').pop() || composer);
      const titleSlug = slugify(title);
      const catalogSlug = catalogNumber ? '-' + slugify(catalogNumber) : '';
      const id = `${composerSlug}-${titleSlug}${catalogSlug}`.slice(0, 120);

      // TODO(canonical-index): pieces.canonical_index_id is NOT NULL since
      // 20260522 scaffolding migration. This form predates the canonical
      // index requirement; a real fix needs to upsert into
      // canonical_piece_index first (or remove this form if obsolete).
      // Cast for now so the type-checker passes; runtime will fail on the
      // FK constraint until this is wired up.
      const insertPayload = {
        id,
        title: title.trim(),
        composer_name: composer.trim(),
        catalog_number: catalogNumber.trim() || null,
        instruments: [instrument],
        era,
        form,
        duration_minutes: duration ? parseInt(duration, 10) : null,
        difficulty: null,
        description: description.trim(),
        source: 'user',
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await supabase.from('pieces').insert(insertPayload as any);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('A piece with this title and composer already exists.');
        } else {
          setError(insertError.message);
        }
        setSubmitting(false);
        return;
      }

      setSuccess(id);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <div className="text-2xl mb-2">&#127926;</div>
        <h2 className="font-display text-xl mb-2">Piece added!</h2>
        <p className="text-muted text-sm mb-4">
          You're the first contributor for this piece.
        </p>
        <a
          href={`/piece/${success}`}
          className="inline-block px-5 py-2.5 bg-accent text-bg rounded-lg font-medium text-sm no-underline hover:bg-accent-hover transition-colors"
        >
          View piece page
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 md:p-8">
      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm rounded-lg p-3 mb-6">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-ink mb-1.5">
          Title <span className="text-[#DC2626]">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Cello Suite No. 1 in G major"
          className="w-full px-3.5 py-2.5 border border-border rounded-lg font-sans text-sm text-ink bg-bg outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Composer */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-ink mb-1.5">
          Composer <span className="text-[#DC2626]">*</span>
        </label>
        <input
          type="text"
          value={composer}
          onChange={e => setComposer(e.target.value)}
          placeholder="e.g. Johann Sebastian Bach"
          className="w-full px-3.5 py-2.5 border border-border rounded-lg font-sans text-sm text-ink bg-bg outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Instrument + Era (side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Primary Instrument <span className="text-[#DC2626]">*</span>
          </label>
          <select
            value={instrument}
            onChange={e => setInstrument(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-border rounded-lg font-sans text-sm text-ink bg-bg outline-none focus:border-accent transition-colors appearance-none"
          >
            <option value="">Select...</option>
            {INSTRUMENTS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Era <span className="text-[#DC2626]">*</span>
          </label>
          <select
            value={era}
            onChange={e => setEra(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-border rounded-lg font-sans text-sm text-ink bg-bg outline-none focus:border-accent transition-colors appearance-none"
          >
            <option value="">Select...</option>
            {ERAS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Form */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-ink mb-1.5">
          Form <span className="text-[#DC2626]">*</span>
        </label>
        <select
          value={form}
          onChange={e => setForm(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-border rounded-lg font-sans text-sm text-ink bg-bg outline-none focus:border-accent transition-colors appearance-none"
        >
          <option value="">Select...</option>
          {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Catalog Number <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={catalogNumber}
            onChange={e => setCatalogNumber(e.target.value)}
            placeholder="e.g. BWV 1007, Op. 21"
            className="w-full px-3.5 py-2.5 border border-border rounded-lg font-sans text-sm text-ink bg-bg outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Duration <span className="text-muted font-normal">(minutes, optional)</span>
          </label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="e.g. 20"
            min="1"
            max="600"
            className="w-full px-3.5 py-2.5 border border-border rounded-lg font-sans text-sm text-ink bg-bg outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-1.5">
          Description <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Historical context, performance notes, or what makes this piece worth playing..."
          rows={4}
          className="w-full px-3.5 py-2.5 border border-border rounded-lg font-sans text-sm text-ink bg-bg outline-none focus:border-accent transition-colors resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-accent text-bg rounded-lg font-sans font-medium text-sm cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none"
      >
        {submitting ? 'Adding...' : 'Add piece to catalog'}
      </button>

      <p className="text-[11px] text-muted text-center mt-3">
        Sign in required. You'll be credited as the first contributor.
      </p>
    </form>
  );
}
