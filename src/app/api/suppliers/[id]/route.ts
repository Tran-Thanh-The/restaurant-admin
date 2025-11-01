import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Supplier, SupplierResponse, ApiResponse } from '@/types/database';
import { ObjectId } from 'mongodb';

export const runtime = "nodejs";

// GET /api/suppliers/[id] - Lấy thông tin chi tiết supplier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid supplier ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const supplier = await db
      .collection<Supplier>('suppliers')
      .findOne({ _id: new ObjectId(id) });

    if (!supplier) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const supplierResponse: SupplierResponse = {
      _id: supplier._id!.toString(),
      name: supplier.name,
      imageUrl: supplier.imageUrl,
      price: supplier.price,
      contact: supplier.contact,
      notes: supplier.notes,
      unit: supplier.unit,
      weight: supplier.weight,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<SupplierResponse>>({
      success: true,
      data: supplierResponse,
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch supplier' },
      { status: 500 }
    );
  }
}

// PUT /api/suppliers/[id] - Cập nhật supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid supplier ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, imageUrl, price, contact, notes, unit, weight } = body;

    if (!name || !contact) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Name and contact are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const updateData = {
      name,
      imageUrl: imageUrl || '',
      price: price || 0,
      contact,
      notes: notes || '',
      unit: unit || '',
      weight: weight || '',
      updatedAt: new Date(),
    };

    const result = await db
      .collection<Supplier>('suppliers')
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const supplierResponse: SupplierResponse = {
      _id: result._id!.toString(),
      name: result.name,
      imageUrl: result.imageUrl,
      price: result.price,
      contact: result.contact,
      notes: result.notes,
      unit: result.unit,
      weight: result.weight,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<SupplierResponse>>({
      success: true,
      data: supplierResponse,
      message: 'Supplier updated successfully',
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] - Xóa supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid supplier ID' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const result = await db
      .collection<Supplier>('suppliers')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
