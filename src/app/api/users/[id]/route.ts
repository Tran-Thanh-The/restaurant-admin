import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { ApiResponse } from '@/types/database';

export const runtime = 'nodejs';

// DELETE - Remove a user by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { db } = await connectToDatabase();
    const usersCol = db.collection<{ _id: ObjectId | string; role?: 'admin' | 'manager' | 'staff' }>('users');

    // Do not allow deleting admin users
    const user = await usersCol.findOne(
      ObjectId.isValid(id)
        ? { $or: [ { _id: new ObjectId(id) }, { _id: id } ] }
        : { _id: id }
    );
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 });
    }
    if (user.role === 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Cannot delete admin user' }, { status: 403 });
    }

    const result = await usersCol.deleteOne(
      ObjectId.isValid(id)
        ? { $or: [ { _id: new ObjectId(id) }, { _id: id } ] }
        : { _id: id }
    );

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}

// PUT - Update user (optional fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const { fullName, role, salary, email, phoneNumber, defaultSchedule } = body;

    const update: Partial<{
      fullName: string;
      role: 'manager' | 'staff';
      salary: number;
      email: string;
      phoneNumber: string;
      defaultSchedule: number[];
      updatedAt: Date;
    }> = { updatedAt: new Date() };
    if (typeof fullName === 'string') update.fullName = fullName;
    if (role && ['manager', 'staff'].includes(role)) update.role = role; // prevent elevating to admin via API
    if (typeof salary === 'number') update.salary = salary;
    if (typeof email === 'string') update.email = email;
    if (typeof phoneNumber === 'string') update.phoneNumber = phoneNumber;
    if (Array.isArray(defaultSchedule)) update.defaultSchedule = defaultSchedule;

    const { db } = await connectToDatabase();
    const usersCol = db.collection<{ _id: ObjectId | string; username: string; role: 'admin' | 'manager' | 'staff'; fullName: string; salary?: number; email?: string; phoneNumber?: string; defaultSchedule?: number[]; createdAt?: Date | string; updatedAt?: Date | string }>('users');
    const filter = (
      ObjectId.isValid(id)
        ? { $or: [ { _id: new ObjectId(id) }, { _id: id } ] }
        : { _id: id }
    ) as Parameters<typeof usersCol.findOne>[0];

    const updRes = await usersCol.updateOne(filter, { $set: update });
    if (updRes.matchedCount === 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 });
    }

    const doc = await usersCol.findOne(filter);
    if (!doc) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 });
    }

    const u = doc as {
      _id: ObjectId;
      username: string;
      role: 'admin' | 'manager' | 'staff';
      fullName: string;
      salary?: number;
      email?: string;
      phoneNumber?: string;
      defaultSchedule?: number[];
      createdAt: Date | string;
      updatedAt: Date | string;
    };
    return NextResponse.json<ApiResponse>({ success: true, data: {
      _id: u._id.toString(),
      username: u.username,
      role: u.role,
      fullName: u.fullName,
      salary: u.salary,
      email: u.email,
      phoneNumber: u.phoneNumber,
      defaultSchedule: u.defaultSchedule,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date(u.createdAt).toISOString(),
      updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : new Date(u.updatedAt).toISOString(),
    }});
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}
