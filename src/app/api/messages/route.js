import { NextResponse } from 'next/server';
import { db, serverTimestamp } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const COLLECTION = 'messages';

export async function GET() {
  try {
    const snap = await db.collection(COLLECTION).orderBy('createdAt', 'asc').get();
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('GET /messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newMessage = await request.json();

    const docRef = await db.collection(COLLECTION).add({
      ...newMessage,
      createdAt: serverTimestamp(),
      createdAtIso: new Date().toISOString(),
    });

    const saved = await docRef.get();
    const message = { id: saved.id, ...saved.data() };

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error('POST /messages error:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const snap = await db.collection(COLLECTION).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /messages error:', error);
    return NextResponse.json({ error: 'Failed to clear messages' }, { status: 500 });
  }
}
