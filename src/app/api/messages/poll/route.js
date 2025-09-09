import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const COLLECTION = 'messages';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastMessageId = searchParams.get('lastMessageId');

    if (!lastMessageId) {
      const snap = await db.collection(COLLECTION).orderBy('createdAt', 'asc').get();
      const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ messages });
    }

    const lastDoc = await db.collection(COLLECTION).doc(lastMessageId).get();

    if (!lastDoc.exists) {
      const snap = await db.collection(COLLECTION).orderBy('createdAt', 'asc').get();
      const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ messages });
    }

    const snap = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'asc')
      .startAfter(lastDoc)
      .get();

    const newMessages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ messages: newMessages });
  } catch (error) {
    console.error('GET /messages/poll error:', error);
    return NextResponse.json({ error: 'Failed to poll messages' }, { status: 500 });
  }
}
