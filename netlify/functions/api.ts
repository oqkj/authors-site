import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { authors } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export const handler = async (event: any) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return { statusCode: 500, body: "DATABASE_URL missing" };

  const sql = neon(dbUrl);
  const db = drizzle(sql);
  const { httpMethod, body } = event;

  try {
    if (httpMethod === 'GET') {
      const result = await db.select().from(authors);
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) };
    }

    if (httpMethod === 'POST') {
      const { id, ...data } = JSON.parse(body); // ID-ді алып тастаймыз, база өзі жасауы керек
      console.log("Жіберіліп жатқан деректер:", data);
      const result = await db.insert(authors).values(data).returning();
      return { statusCode: 201, body: JSON.stringify(result[0]) };
    }

    if (httpMethod === 'PUT') {
      const { id, ...data } = JSON.parse(body);
      const result = await db.update(authors).set(data).where(eq(authors.id, id)).returning();
      return { statusCode: 200, body: JSON.stringify(result[0]) };
    }

    if (httpMethod === 'DELETE') {
      const { id } = JSON.parse(body);
      await db.delete(authors).where(eq(authors.id, id));
      return { statusCode: 200, body: 'Deleted' };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error("СЕРВЕРДЕГІ ҚАТЕ:", error); // Терминалдан қатені көре аласыз
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};