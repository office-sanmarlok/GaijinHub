import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数をロード
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

async function updateListingsLocation() {
  console.log('リスティングの位置情報更新を開始します...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // station_id があるか lat/lng があるが point がないリスティングを取得
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('id, station_id, lat, lng')
    .is('point', null)
    .or('station_id.not.is.null,and(lat.not.is.null,lng.not.is.null)');

  if (listingsError) {
    console.error('リスティングの取得に失敗しました:', listingsError);
    return;
  }

  console.log(`更新対象のリスティング数: ${listings?.length || 0}`);

  for (const listing of listings || []) {
    let lat = listing.lat;
    let lng = listing.lng;
    let pointStr = null;

    // lat/lngがない場合は駅情報から取得
    if ((!lat || !lng) && listing.station_id) {
      const { data: station, error: stationError } = await supabase
        .from('tokyo_station_groups')
        .select('lat, lon')
        .eq('id', listing.station_id)
        .single();

      if (stationError) {
        console.error(`駅情報の取得に失敗しました (station_id: ${listing.station_id}):`, stationError);
        continue;
      }

      if (station && station.lat && station.lon) {
        lat = station.lat;
        lng = station.lon;
      } else {
        console.warn(`駅の位置情報がありません (station_id: ${listing.station_id})`);
        continue;
      }
    }

    if (lat && lng) {
      // PostGISのPOINT関数を使用してpointデータを生成
      const { data: pointData, error: pointError } = await supabase
        .rpc('generate_point', { lat, lng });

      if (pointError) {
        console.error(`ポイント生成に失敗しました (id: ${listing.id}):`, pointError);
        continue;
      }

      pointStr = pointData;

      // リスティングの更新
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          lat,
          lng,
          point: pointStr,
          has_location: true
        })
        .eq('id', listing.id);

      if (updateError) {
        console.error(`リスティングの更新に失敗しました (id: ${listing.id}):`, updateError);
      } else {
        console.log(`リスティング更新成功 (id: ${listing.id})`);
      }
    } else {
      console.warn(`位置情報がありません (id: ${listing.id})`);
    }
  }

  console.log('リスティングの位置情報更新が完了しました');
}

// ポイント生成用のSQL関数を作成
async function createPointGenerationFunction() {
  console.log('ポイント生成関数を作成します...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const functionSQL = `
  CREATE OR REPLACE FUNCTION generate_point(lat double precision, lng double precision)
  RETURNS geography AS $$
  BEGIN
    RETURN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql: functionSQL });
  
  if (error) {
    console.error('ポイント生成関数の作成に失敗しました:', error);
    return false;
  }
  
  console.log('ポイント生成関数を作成しました');
  return true;
}

// 実行
async function main() {
  // 先にポイント生成関数を作成
  const success = await createPointGenerationFunction();
  if (success) {
    await updateListingsLocation();
  }
}

main().catch(console.error); 