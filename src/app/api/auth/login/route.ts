import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { User, UserResponse, ApiResponse } from '@/types/database';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Username and password are required',
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const user = await db.collection<User>('users').findOne({ username });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid username or password',
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid username or password',
        },
        { status: 401 }
      );
    }

    // Only allow login for users in probation or active status
    const status = user.status ?? 'active';
    if (!(status === 'probation' || status === 'active')) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Tài khoản không được phép đăng nhập',
        },
        { status: 403 }
      );
    }

    // Remove password from response
    const userResponse: UserResponse = {
      _id: user._id!.toString(),
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<UserResponse>>({
      success: true,
      data: userResponse,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
