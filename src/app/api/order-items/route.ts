import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { OrderItem, OrderItemResponse, ApiResponse } from '@/types/database';

// GET - Fetch order items (optionally filtered by orderId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    const { db } = await connectToDatabase();
    
    const query = orderId && ObjectId.isValid(orderId) ? { orderId: new ObjectId(orderId) } : {};
    const orderItems = await db.collection<OrderItem>('order_items')
      .find(query)
      .toArray();

    const orderItemResponses: OrderItemResponse[] = orderItems.map(item => ({
      _id: item._id!.toString(),
      orderId: typeof item.orderId === 'string' ? item.orderId : item.orderId.toString(),
      productId: typeof item.productId === 'string' ? item.productId : item.productId.toString(),
      quantity: item.quantity,
      price: item.price,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json<ApiResponse<OrderItemResponse[]>>({
      success: true,
      data: orderItemResponses,
    });
  } catch (error) {
    console.error('Error fetching order items:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch order items',
      },
      { status: 500 }
    );
  }
}

// POST - Create new order item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, productId, quantity, price } = body;

    if (!orderId || !productId || !quantity || price === undefined) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'orderId, productId, quantity, and price are required',
        },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(orderId) || !ObjectId.isValid(productId)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid orderId or productId',
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const newOrderItem: Omit<OrderItem, '_id'> = {
      orderId: new ObjectId(orderId),
      productId: new ObjectId(productId),
      quantity: Number(quantity),
      price: Number(price),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<OrderItem>('order_items').insertOne(newOrderItem as OrderItem);

    const orderItemResponse: OrderItemResponse = {
      _id: result.insertedId.toString(),
      orderId: orderId,
      productId: productId,
      quantity: newOrderItem.quantity,
      price: newOrderItem.price,
      createdAt: newOrderItem.createdAt.toISOString(),
      updatedAt: newOrderItem.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<OrderItemResponse>>(
      {
        success: true,
        data: orderItemResponse,
        message: 'Order item created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order item:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create order item',
      },
      { status: 500 }
    );
  }
}
