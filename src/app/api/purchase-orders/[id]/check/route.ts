import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PurchaseOrderItem, ApiResponse } from '@/types/database';
import { ObjectId } from 'mongodb';

export const runtime = "nodejs";

// PATCH /api/purchase-orders/[id]/check - Cập nhật số lượng kiểm hàng
export async function PATCH(
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
    const { items } = body; // Array of { itemId, checkedQuantity }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Cập nhật từng item
    for (const item of items) {
      if (!ObjectId.isValid(item.itemId)) {
        continue;
      }

      await db.collection<PurchaseOrderItem>('purchase_order_items').updateOne(
        { _id: new ObjectId(item.itemId), purchaseOrderId: new ObjectId(id) },
        {
          $set: {
            checkedQuantity: item.checkedQuantity,
            updatedAt: new Date(),
          },
        }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Checked quantities updated successfully',
    });
  } catch (error) {
    console.error('Error updating checked quantities:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update checked quantities' },
      { status: 500 }
    );
  }
}
