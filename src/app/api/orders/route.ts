import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order, OrderResponse, ApiResponse } from '@/types/database';

export const runtime = "nodejs";

// GET - Fetch orders (with limit and sorting)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get('createdBy');
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');
    
    const limit = limitParam ? parseInt(limitParam, 10) : 10; // Default 10
    const page = pageParam ? parseInt(pageParam, 10) : 1; // Default page 1
    const skip = (page - 1) * limit;

    const { db } = await connectToDatabase();
    
    const query = createdBy ? { createdBy } : {};
    
    // Get total count for pagination
    const total = await db.collection<Order>('orders').countDocuments(query);
    
    // Optimized: sort, skip and limit at database level
    const orders = await db.collection<Order>('orders')
      .find(query)
      .sort({ orderAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .toArray();

    const orderResponses: OrderResponse[] = orders.map(order => ({
      _id: order._id!.toString(),
      orderAt: order.orderAt.toISOString(),
      createdBy: order.createdBy,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));

    return NextResponse.json<ApiResponse<OrderResponse[]>>({
      success: true,
      data: orderResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch orders',
      },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { createdBy, orderAt, totalPrice } = body;

    if (!createdBy || totalPrice === undefined) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'createdBy and totalPrice are required',
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const newOrder: Omit<Order, '_id'> = {
      orderAt: orderAt ? new Date(orderAt) : new Date(),
      createdBy,
      totalPrice: Number(totalPrice),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Order>('orders').insertOne(newOrder as Order);

    const orderResponse: OrderResponse = {
      _id: result.insertedId.toString(),
      orderAt: newOrder.orderAt.toISOString(),
      createdBy: newOrder.createdBy,
      totalPrice: newOrder.totalPrice,
      createdAt: newOrder.createdAt.toISOString(),
      updatedAt: newOrder.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<OrderResponse>>(
      {
        success: true,
        data: orderResponse,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create order',
      },
      { status: 500 }
    );
  }
}
