import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DailyChecklist, DailyChecklistResponse, ApiResponse } from '@/types/database';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

type ChecklistDoc = DailyChecklist & { _id: ObjectId };

function toResponse(doc: ChecklistDoc): DailyChecklistResponse {
  return {
    _id: doc._id!.toString(),
    dateKey: doc.dateKey,
    data: doc.data ?? {},
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// Helper to normalize/validate dateKey
function normalizeDateKey(dateKey?: string): string | null {
  if (!dateKey) return null;
  // Expecting YYYY-MM-DD
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
  return ok ? dateKey : null;
}

// GET /api/checklists?date=YYYY-MM-DD&ensure=true
// Fetch a checklist by dateKey. If ensure=true (default), create one if missing with empty data.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || undefined;
    const ensureParam = searchParams.get('ensure');
    const ensure = ensureParam === null || ensureParam === 'true'; // default true

    const dateKey = normalizeDateKey(dateParam);
    if (!dateKey) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing or invalid date. Expect YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    let checklist = (await db
      .collection<DailyChecklist>('daily_checklists')
      .findOne({ dateKey })) as ChecklistDoc | null;
    if (!checklist && ensure) {
      const now = new Date();
      const doc: Omit<DailyChecklist, '_id'> = {
        dateKey,
        data: {},
        createdAt: now,
        updatedAt: now,
      };
      const result = await db
        .collection<DailyChecklist>('daily_checklists')
        .insertOne(doc as DailyChecklist);
      checklist = { _id: result.insertedId, ...doc } as ChecklistDoc;
    }

    if (!checklist) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Checklist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<DailyChecklistResponse>>({ success: true, data: toResponse(checklist) });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch checklist' }, { status: 500 });
  }
}

// POST /api/checklists
// Create a checklist for a specific date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, data } = body ?? {};
    const dateKey = normalizeDateKey(date);
    if (!dateKey) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing or invalid date. Expect YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const existing = await db.collection<DailyChecklist>('daily_checklists').findOne({ dateKey });
    if (existing) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Checklist already exists' }, { status: 409 });
    }

    const now = new Date();
    const doc: Omit<DailyChecklist, '_id'> = {
      dateKey,
      data: typeof data === 'object' && data ? data : {},
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<DailyChecklist>('daily_checklists')
      .insertOne(doc as DailyChecklist);
    const response: DailyChecklistResponse = toResponse({ _id: result.insertedId, ...doc } as ChecklistDoc);
    return NextResponse.json<ApiResponse<DailyChecklistResponse>>({ success: true, data: response }, { status: 201 });
  } catch (error) {
    console.error('Error creating checklist:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create checklist' }, { status: 500 });
  }
}
