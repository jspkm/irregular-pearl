import { useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';

interface InstrumentPhotoUploadProps {
  instrumentId: string;
  existingPhotos: string[];
  onPhotosChange: (photos: string[]) => void;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function InstrumentPhotoUpload({ instrumentId, existingPhotos, onPhotosChange }: InstrumentPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !hasSupabase) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 5MB');
      return;
    }

    if (existingPhotos.length >= MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos per instrument`);
      return;
    }

    setUploading(true);

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${instrumentId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('instrument-photos')
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setError('Upload failed. Please try again.');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('instrument-photos')
      .getPublicUrl(path);

    onPhotosChange([...existingPhotos, publicUrl]);
    setUploading(false);

    // Reset input
    e.target.value = '';
  };

  const handleRemove = async (photoUrl: string) => {
    const path = photoUrl.split('/instrument-photos/')[1];
    if (path) {
      await supabase.storage.from('instrument-photos').remove([path]);
    }
    onPhotosChange(existingPhotos.filter(p => p !== photoUrl));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {existingPhotos.map((url) => (
          <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => handleRemove(url)}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-[#1C1917]/70 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
            >
              x
            </button>
          </div>
        ))}
      </div>

      {existingPhotos.length < MAX_PHOTOS && (
        <label className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-xs text-muted cursor-pointer hover:border-accent transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? 'Uploading...' : `Add photo (${existingPhotos.length}/${MAX_PHOTOS})`}
        </label>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
