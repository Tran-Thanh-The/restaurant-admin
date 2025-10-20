import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order, OrderResponse, ApiResponse } from '@/types/database';

// GET - Fetch orders (with limit and sorting)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get('createdBy');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10; // Default 10

    const { db } = await connectToDatabase();
    
    const query = createdBy ? { createdBy } : {};
    // Optimized: sort and limit at database level
    const orders = await db.collection<Order>('orders')
      .find(query)
      .sort({ orderAt: -1 }) // Latest first
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
