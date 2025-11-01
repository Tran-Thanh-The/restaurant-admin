import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { User, UserResponse, ApiResponse } from '@/types/database';

export const runtime = "nodejs";

// GET - Fetch all users
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const users = await db.collection<User>('users').find({}).toArray();

    const userResponses: UserResponse[] = users.map(user => ({
      _id: user._id!.toString(),
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      status: user.status ?? 'active',
      salary: user.salary,
      email: user.email,
      phoneNumber: user.phoneNumber,
      defaultSchedule: user.defaultSchedule,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return NextResponse.json<ApiResponse<UserResponse[]>>({
      success: true,
      data: userResponses,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
  const { username, password, role, fullName, salary, email, phoneNumber, defaultSchedule, status } = body;

    const allowedStatuses = ['probation','active','resigned'] as const;

    if (!username || !password || !role || !fullName) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'All fields are required',
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection<User>('users').findOne({ username });
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Username already exists',
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: Omit<User, '_id'> = {
      username,
      password: hashedPassword,
      role,
      fullName,
      status: allowedStatuses.includes(status) ? status : 'active',
      salary: typeof salary === 'number' ? salary : undefined,
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
      defaultSchedule: Array.isArray(defaultSchedule) ? defaultSchedule : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<User>('users').insertOne(newUser as User);

    const userResponse: UserResponse = {
      _id: result.insertedId.toString(),
      username: newUser.username,
      role: newUser.role,
      fullName: newUser.fullName,
      status: newUser.status,
      salary: newUser.salary,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
      defaultSchedule: newUser.defaultSchedule,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<UserResponse>>(
      {
        success: true,
        data: userResponse,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create user',
      },
      { status: 500 }
    );
  }
}
