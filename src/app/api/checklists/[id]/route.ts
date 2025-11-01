import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DailyChecklist, DailyChecklistResponse, ApiResponse } from '@/types/database';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

function toResponse(doc: DailyChecklist & { _id: ObjectId }): DailyChecklistResponse {
  return {
    _id: doc._id.toString(),
    dateKey: doc.dateKey,
    data: doc.data ?? {},
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// PUT /api/checklists/[id]
// Update data blob for the checklist by id
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const { data } = body ?? {};
    if (typeof data !== 'object' || data === null) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid data payload' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const _id = new ObjectId(id);

    const existing = await db.collection<DailyChecklist>('daily_checklists').findOne({ _id });
    if (!existing) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Checklist not found' }, { status: 404 });
    }

    await db
      .collection<DailyChecklist>('daily_checklists')
      .updateOne({ _id }, { $set: { data, updatedAt: new Date() } });

    const updated = await db.collection<DailyChecklist>('daily_checklists').findOne({ _id });
    return NextResponse.json<ApiResponse<DailyChecklistResponse>>({
      success: true,
      data: toResponse(updated as DailyChecklist & { _id: ObjectId }),
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update checklist' }, { status: 500 });
  }
}
