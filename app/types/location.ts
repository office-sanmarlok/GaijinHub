// 市区町村�E型定義
export interface Municipality {
  id: string;
  name: string;
  hurigana: string;
}

// 路線�E型定義
export interface Line {
  line_code: string;
  line_ja: string;
  operator_ja: string;
}

// 駁E�E型定義
export interface StationLine {
  line?: Line;
  line_code?: string;
  line_ja?: string;
  operator_ja?: string;
}

export interface Station {
  id: string;
  name_kanji: string;
  name_kana: string;
  name_romaji?: string;
  municipality_id?: string;
  lat?: number;
  lon?: number;
  lines?: StationLine[];
}

// 位置惁E��の入力状態を管琁E��る型
export type LocationState = {
  hasLocation: boolean;
  isCityOnly: boolean;
  municipalityId: string | null;
  stationId: string | null;
};

// 位置惁E��の検索条件の垁E
export interface LocationSearchParams {
  stationId?: string;
  lineCode?: string;
  municipalityId?: string;
}

export interface StationWithLines extends Omit<Station, 'lines'> {
  lines: StationLine[] | null;
}

export interface StationGroupLineInfo {
  line_name: string;
  company_name: string;
}

export interface StationGroup {
  station_g_cd: string;
  station_name: string;
  station_name_h: string | null;
  station_name_r: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  muni_name: string | null;
  muni_name_r: string | null;
  pref_name: string | null;
  pref_name_r: string | null;
  lines: StationGroupLineInfo[];
  listing_count: number;
}
