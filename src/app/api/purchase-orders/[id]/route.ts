import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PurchaseOrder, PurchaseOrderResponse, PurchaseOrderItem, PurchaseOrderItemResponse, ApiResponse } from '@/types/database';
import { ObjectId } from 'mongodb';

export const runtime = "nodejs";

// GET /api/purchase-orders/[id] - Lấy thông tin chi tiết purchase order kèm items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid purchase order ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const purchaseOrder = await db
      .collection<PurchaseOrder>('purchase_orders')
      .findOne({ _id: new ObjectId(id) });

    if (!purchaseOrder) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Lấy danh sách items
    const items = await db
      .collection<PurchaseOrderItem>('purchase_order_items')
      .find({ purchaseOrderId: new ObjectId(id) })
      .toArray();

    const itemsResponse: PurchaseOrderItemResponse[] = items.map((item) => ({
      _id: item._id!.toString(),
      purchaseOrderId: item.purchaseOrderId.toString(),
      supplierId: item.supplierId.toString(),
      quantity: item.quantity,
      checkedQuantity: item.checkedQuantity,
      price: item.price,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    const purchaseOrderResponse: PurchaseOrderResponse & { items: PurchaseOrderItemResponse[] } = {
      _id: purchaseOrder._id!.toString(),
      orderNumber: purchaseOrder.orderNumber,
      createdBy: purchaseOrder.createdBy,
      totalAmount: purchaseOrder.totalAmount,
      status: purchaseOrder.status,
      notes: purchaseOrder.notes,
      createdAt: purchaseOrder.createdAt.toISOString(),
      updatedAt: purchaseOrder.updatedAt.toISOString(),
      items: itemsResponse,
    };

    return NextResponse.json<ApiResponse<PurchaseOrderResponse & { items: PurchaseOrderItemResponse[] }>>({
      success: true,
      data: purchaseOrderResponse,
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch purchase order' },
      { status: 500 }
    );
  }
}

// PUT /api/purchase-orders/[id] - Cập nhật purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid purchase order ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { totalAmount, status, notes, items } = body;

    const { db } = await connectToDatabase();

    const updateData: Partial<PurchaseOrder> = {
      updatedAt: new Date(),
    };

    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const result = await db
      .collection<PurchaseOrder>('purchase_orders')
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Nếu có cập nhật items
    if (items && Array.isArray(items)) {
      // Xóa items cũ
      await db.collection<PurchaseOrderItem>('purchase_order_items').deleteMany({
        purchaseOrderId: new ObjectId(id),
      });

      // Tạo items mới
      if (items.length > 0) {
        const purchaseOrderItems: PurchaseOrderItem[] = items.map((item: { supplierId: string; quantity: number; price: number; checkedQuantity?: number }) => ({
          purchaseOrderId: new ObjectId(id),
          supplierId: new ObjectId(item.supplierId),
          quantity: item.quantity,
          checkedQuantity: item.checkedQuantity,
          price: item.price,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.collection<PurchaseOrderItem>('purchase_order_items').insertMany(purchaseOrderItems);
      }
    }

    const purchaseOrderResponse: PurchaseOrderResponse = {
      _id: result._id!.toString(),
      orderNumber: result.orderNumber,
      createdBy: result.createdBy,
      totalAmount: result.totalAmount,
      status: result.status,
      notes: result.notes,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<PurchaseOrderResponse>>({
      success: true,
      data: purchaseOrderResponse,
      message: 'Purchase order updated successfully',
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}

// DELETE /api/purchase-orders/[id] - Xóa purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid purchase order ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Xóa tất cả items liên quan
    await db.collection<PurchaseOrderItem>('purchase_order_items').deleteMany({
      purchaseOrderId: new ObjectId(id),
    });

    // Xóa purchase order
    const result = await db
      .collection<PurchaseOrder>('purchase_orders')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Purchase order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to delete purchase order' },
      { status: 500 }
    );
  }
}
