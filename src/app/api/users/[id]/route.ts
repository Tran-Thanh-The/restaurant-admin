import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { ApiResponse, User } from '@/types/database';

export const runtime = 'nodejs';

// GET - Get a user by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { db } = await connectToDatabase();
    const usersCol = db.collection<User>('users');
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };
  const doc = await usersCol.findOne(filter as Parameters<typeof usersCol.findOne>[0]);
    if (!doc) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        _id: (doc._id as unknown as ObjectId | string).toString(),
        username: doc.username,
        role: doc.role,
        fullName: doc.fullName,
        status: (doc as User).status ?? 'active',
        salary: doc.salary,
        email: doc.email,
        phoneNumber: doc.phoneNumber,
        defaultSchedule: doc.defaultSchedule,
        createdAt: (doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt)).toISOString(),
        updatedAt: (doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt)).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch user' }, { status: 500 });
  }
}

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
  const { fullName, role, salary, email, phoneNumber, defaultSchedule, status, password } = body;
  const allowedStatuses = ['probation','active','resigned'] as const;

    console.log('Received update request with password:', password ? '***' : undefined, 'type:', typeof password);

    const { db } = await connectToDatabase();
  const usersCol = db.collection<{ _id: ObjectId | string; username: string; role: 'admin' | 'manager' | 'staff'; fullName: string; status?: 'probation' | 'active' | 'resigned'; salary?: number; email?: string; phoneNumber?: string; defaultSchedule?: number[]; password?: string; createdAt?: Date | string; updatedAt?: Date | string }>('users');
    const filter = (
      ObjectId.isValid(id)
        ? { $or: [ { _id: new ObjectId(id) }, { _id: id } ] }
        : { _id: id }
    ) as Parameters<typeof usersCol.findOne>[0];

    const update: Partial<{
      fullName: string;
      role: 'admin' | 'manager' | 'staff';
      status: 'probation' | 'active' | 'resigned';
      salary: number;
      email: string;
      phoneNumber: string;
      defaultSchedule: number[];
      password: string;
      updatedAt: Date;
    }> = { updatedAt: new Date() };
    if (typeof fullName === 'string') update.fullName = fullName;
    // Allow role update for admin, manager, staff - prevent non-admin from becoming admin
    if (role && ['admin', 'manager', 'staff'].includes(role)) {
      // Only allow role update if not trying to become admin (unless already admin)
      const currentUser = await usersCol.findOne(filter);
      if (currentUser && (role !== 'admin' || currentUser.role === 'admin')) {
        update.role = role as 'admin' | 'manager' | 'staff';
      }
    }
  if (status && (allowedStatuses as readonly string[]).includes(status)) update.status = status as 'probation' | 'active' | 'resigned';
    if (typeof salary === 'number') update.salary = salary;
    if (typeof email === 'string') update.email = email;
    if (typeof phoneNumber === 'string') update.phoneNumber = phoneNumber;
    if (Array.isArray(defaultSchedule)) update.defaultSchedule = defaultSchedule;

    // Hash and set new password if provided (overwrite without extra verification)
    if (typeof password === 'string' && password.trim().length > 0) {
      const hashed = await (await import('bcryptjs')).hash(password, 10);
      update.password = hashed;
    }

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
      status?: 'probation' | 'active' | 'resigned';
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
      status: u.status ?? 'active',
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
