// 蟶ょ玄逕ｺ譚代・蝙句ｮ夂ｾｩ
export interface Municipality {
  id: string;
  name: string;
  hurigana: string;
}

// 霍ｯ邱壹・蝙句ｮ夂ｾｩ
export interface Line {
  line_code: string;
  line_ja: string;
  operator_ja: string;
}

// 鬧・・蝙句ｮ夂ｾｩ
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

// 菴咲ｽｮ諠・ｱ縺ｮ蜈･蜉帷憾諷九ｒ邂｡逅・☆繧句梛
export type LocationState = {
  hasLocation: boolean;
  isCityOnly: boolean;
  municipalityId: string | null;
  stationId: string | null;
};

// 菴咲ｽｮ諠・ｱ縺ｮ讀懃ｴ｢譚｡莉ｶ縺ｮ蝙・
export interface LocationSearchParams {
  stationId?: string;
  lineCode?: string;
  municipalityId?: string;
}

export interface StationWithLines extends Omit<Station, 'lines'> {
  lines: StationLine[] | null;
} 
