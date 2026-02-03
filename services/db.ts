
import Dexie from 'dexie';
import type { Table } from 'dexie';
import { CharacterRecord } from '../types';

/**
 * Using the default import for Dexie ensures that the class definition 
 * and its instance methods like .version() are correctly inherited and recognized by TypeScript.
 */
export class NexusDB extends Dexie {
  // Explicitly defining the key type as number to match the auto-incrementing ID
  characters!: Table<CharacterRecord, number>;

  constructor() {
    super('NexusArchiveDB');
    
    // Define schema versions using the inherited version method from the Dexie base class
    // Fix: Using default import ensures this.version is correctly recognized as an inherited method from Dexie
    this.version(1).stores({
      characters: '++id, name, *tags, lastModified'
    });
  }
}

export const db = new NexusDB();
