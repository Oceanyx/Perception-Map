import Dexie from 'dexie';

export const db = new Dexie('PerceptionMapDB');
db.version(1).stores({ nodes: '++id, title, domainIds, lensIds, createdAt' });

export async function seedIfEmpty(seedData) {
  const count = await db.nodes.count();
  if (count === 0) {
    await db.nodes.bulkAdd(seedData);
  }
}
