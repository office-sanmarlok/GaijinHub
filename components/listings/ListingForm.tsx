'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LocationInput } from '@/components/location/LocationInput';
import { LocationState } from '@/app/types/location';
import { Database } from '@/types/supabase';

export function ListingForm() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState<LocationState>({
    hasLocation: false,
    isCityOnly: false,
    municipalityId: null,
    stationId: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('認証エラーが発生しました');
      }

      const { error: insertError } = await supabase.from('listings').insert({
        title,
        body,
        price: price ? parseInt(price, 10) : null,
        user_id: user.id,
        has_location: location.hasLocation,
        is_city_only: location.isCityOnly,
        municipality_id: location.municipalityId,
        station_id: location.stationId,
      });

      if (insertError) {
        throw insertError;
      }

      router.push('/listings');
      router.refresh();
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('リスティングの作成中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <Textarea
          placeholder="説明"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      </div>

      <div>
        <Input
          type="number"
          placeholder="価格"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div>
        <LocationInput
          value={location}
          onChange={setLocation}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '作成中...' : '作成'}
      </Button>
    </form>
  );
} 
