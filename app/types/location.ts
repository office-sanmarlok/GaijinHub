// API response types for location searches

export interface StationGroupResponse {
  station_g_cd: string;
  station_name: string;
  station_name_r?: string;
  muni_name?: string;
  municipality_name_romaji?: string;
  pref_name?: string;
  prefecture_name_romaji?: string;
  lines_info?: Array<{
    line_code: string;
    line_name: string;
  }>;
}

export interface LineResponse {
  line_code?: string;
  line_id?: string;
  line_ja: string;
  line_romaji?: string;
  operator_ja?: string;
}

export interface MunicipalityResponse {
  id?: string;
  muni_id?: string;
  name: string;
  romaji?: string;
  prefecture_name?: string;
  prefecture_name_romaji?: string;
}

export interface PrefectureResponse {
  id?: string;
  pref_id?: string;
  name: string;
  name_hiragana?: string;
  name_romaji?: string;
}

export type LocationItem = StationGroupResponse | LineResponse | MunicipalityResponse | PrefectureResponse;