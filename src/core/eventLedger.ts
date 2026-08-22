import { v4 as uuidv4 } from 'uuid';
import { appendEventToDb } from '../storage/db.js';

export function appendEvent(runId: string, type: string, turn: number, data: object): void {
  const id = uuidv4();
  appendEventToDb(id, runId, type, turn, data);
}
