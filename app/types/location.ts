// 市区町村の型定義
export interface Municipality {
  id: string;
  name: string;
  hurigana: string;
}

// 路線の型定義
export interface Line {
  line_code: string;
  line_ja: string;
  operator_ja: string;
}

// 駅の型定義
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

// 位置情報の入力状態を管理する型
export type LocationState = {
  hasLocation: boolean;
  isCityOnly: boolean;
  municipalityId: string | null;
  stationId: string | null;
};

// 位置情報の検索条件の型
export interface LocationSearchParams {
  stationId?: string;
  lineCode?: string;
  municipalityId?: string;
}

export interface StationWithLines extends Omit<Station, 'lines'> {
  lines: StationLine[] | null;
} 