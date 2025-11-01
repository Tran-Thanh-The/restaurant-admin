import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PurchaseOrder, PurchaseOrderResponse, PurchaseOrderItem, ApiResponse } from '@/types/database';
import { ObjectId } from 'mongodb';

export const runtime = "nodejs";

// GET /api/purchase-orders - Lấy danh sách tất cả purchase orders
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PurchaseOrder['status'] | null;

    const filter = status ? { status } : {};

    const purchaseOrders = await db
      .collection<PurchaseOrder>('purchase_orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const purchaseOrdersResponse: PurchaseOrderResponse[] = purchaseOrders.map((order) => ({
      _id: order._id!.toString(),
      orderNumber: order.orderNumber,
      createdBy: order.createdBy,
      totalAmount: order.totalAmount,
      status: order.status,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }));

    const response: ApiResponse<PurchaseOrderResponse[]> = {
      success: true,
      data: purchaseOrdersResponse,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders - Tạo purchase order mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { createdBy, totalAmount, status, notes, items } = body;

    if (!createdBy || totalAmount === undefined || !status) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'CreatedBy, totalAmount, and status are required' },
        { status: 400 }
      );
    }

    if (!['draft', 'ordered', 'received', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    // Tạo mã phiếu nhập tự động
    const count = await db.collection<PurchaseOrder>('purchase_orders').countDocuments();
    const orderNumber = `PO${String(count + 1).padStart(6, '0')}`;

    const newPurchaseOrder: PurchaseOrder = {
      orderNumber,
      createdBy,
      totalAmount,
      status,
      notes: notes || '',
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<PurchaseOrder>('purchase_orders').insertOne(newPurchaseOrder);

    // Nếu có items thì tạo luôn purchase order items
    if (items && Array.isArray(items) && items.length > 0) {
      const purchaseOrderItems: PurchaseOrderItem[] = items.map((item: { supplierId: string; quantity: number; price: number }) => ({
        purchaseOrderId: result.insertedId,
        supplierId: new ObjectId(item.supplierId),
        quantity: item.quantity,
        price: item.price,
        createdAt: now,
        updatedAt: now,
      }));

      await db.collection<PurchaseOrderItem>('purchase_order_items').insertMany(purchaseOrderItems);
    }

    const purchaseOrderResponse: PurchaseOrderResponse = {
      _id: result.insertedId.toString(),
      orderNumber: newPurchaseOrder.orderNumber,
      createdBy: newPurchaseOrder.createdBy,
      totalAmount: newPurchaseOrder.totalAmount,
      status: newPurchaseOrder.status,
      notes: newPurchaseOrder.notes,
      createdAt: newPurchaseOrder.createdAt.toISOString(),
      updatedAt: newPurchaseOrder.updatedAt.toISOString(),
    };

    const response: ApiResponse<PurchaseOrderResponse> = {
      success: true,
      data: purchaseOrderResponse,
      message: 'Purchase order created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
