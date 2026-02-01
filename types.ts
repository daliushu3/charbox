
export interface CharacterDataV2 {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  character_book?: {
    entries: any[];
    name?: string;
  };
  tags: string[];
  creator: string;
  character_version: string;
  extensions: Record<string, any>;
}

export interface STCharacterCard {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes?: string;
  creatorcomment?: string; // Some versions use this
  tags?: string[];
  data?: CharacterDataV2; // V2/V3 nested format
  extensions?: Record<string, any>;
}

export interface CharacterRecord {
  id?: number;
  name: string;
  imageBlob: Blob;
  data: CharacterDataV2;
  tags: string[];
  lastModified: number;
}
