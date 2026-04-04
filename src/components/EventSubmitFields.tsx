import { useState, useEffect } from 'react';
import Autocomplete from './Autocomplete';
import { VENUES } from '../data/venues';

/**
 * Autocomplete fields for the event submission form.
 * Rendered as a React island (client:load) within the Astro form.
 * Merges static venue data with live DB suggestions.
 */

interface Props {
  supabaseUrl: string;
  supabaseKey: string;
}

export default function EventSubmitFields({ supabaseUrl, supabaseKey }: Props) {
  const [venueOptions, setVenueOptions] = useState<string[]>(VENUES.map(v => v.venue).sort());
  const [cityOptions, setCityOptions] = useState<string[]>([...new Set(VENUES.map(v => v.city))].sort());
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Build venue-to-city map from static data
  const venueToCity: Record<string, string> = {};
  for (const v of VENUES) venueToCity[v.venue] = v.city;

  // Merge in live DB data
  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return;
    import('@supabase/supabase-js').then(({ createClient }) => {
      const supabase = createClient(supabaseUrl, supabaseKey);
      supabase.from('events').select('title, venue, city').not('title', 'is', null).limit(500)
        .then(({ data }) => {
          if (!data) return;
          const venues = new Set(venueOptions);
          const cities = new Set(cityOptions);
          const titles = new Set(titleOptions);
          const clean = (s: string) => s.replace(/\.+$/, '').trim();
          for (const e of data as Array<{ title: string; venue: string; city: string }>) {
            if (e.title) titles.add(clean(e.title));
            if (e.venue) { const v = clean(e.venue); venues.add(v); if (e.city) venueToCity[v] = clean(e.city); }
            if (e.city) cities.add(clean(e.city));
          }
          setVenueOptions([...venues].sort());
          setCityOptions([...cities].sort());
          setTitleOptions([...titles].sort());
        });
    });
  }, []);

  function handleVenueChange(v: string) {
    setSelectedVenue(v);
    const city = venueToCity[v];
    if (city && !selectedCity) setSelectedCity(city);
  }

  const inputClass = 'w-full px-3 py-2 border border-[#E7E5E4] rounded-lg text-sm focus:outline-none focus:border-[#B45309] focus:ring-1 focus:ring-[#FEF3C7] font-sans';

  return (
    <>
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-xs font-medium text-[#1C1917] mb-1">Event Title *</label>
        <Autocomplete
          id="title" name="title" required maxLength={200}
          placeholder="e.g. Bach Cello Suite Recital"
          suggestions={titleOptions}
          className={inputClass}
        />
      </div>

      {/* Venue + City */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="venue" className="block text-xs font-medium text-[#1C1917] mb-1">Venue *</label>
          <Autocomplete
            id="venue" name="venue" required maxLength={200}
            placeholder="e.g. Wigmore Hall"
            suggestions={venueOptions}
            value={selectedVenue}
            onChange={handleVenueChange}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-xs font-medium text-[#1C1917] mb-1">City</label>
          <Autocomplete
            id="city" name="city" maxLength={100}
            placeholder="e.g. London"
            suggestions={cityOptions}
            value={selectedCity}
            onChange={setSelectedCity}
            className={inputClass}
          />
        </div>
      </div>
    </>
  );
}
