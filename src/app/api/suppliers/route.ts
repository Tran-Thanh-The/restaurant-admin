import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Supplier, SupplierResponse, ApiResponse } from '@/types/database';

export const runtime = "nodejs";

// GET /api/suppliers - Lấy danh sách tất cả suppliers
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const suppliers = await db
      .collection<Supplier>('suppliers')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const suppliersResponse: SupplierResponse[] = suppliers.map((supplier) => ({
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
    }));

    const response: ApiResponse<SupplierResponse[]> = {
      success: true,
      data: suppliersResponse,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Tạo supplier mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, imageUrl, price, contact, notes, unit, weight } = body;

    if (!name || !contact) {
      return NextResponse.json(
        { success: false, error: 'Name and contact are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    const newSupplier: Supplier = {
      name,
      imageUrl: imageUrl || '',
      price: price || 0,
      contact,
      notes: notes || '',
      unit: unit || '',
      weight: weight || '',
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Supplier>('suppliers').insertOne(newSupplier);

    const supplierResponse: SupplierResponse = {
      _id: result.insertedId.toString(),
      name: newSupplier.name,
      imageUrl: newSupplier.imageUrl,
      price: newSupplier.price,
      contact: newSupplier.contact,
      notes: newSupplier.notes,
      unit: newSupplier.unit,
      weight: newSupplier.weight,
      createdAt: newSupplier.createdAt.toISOString(),
      updatedAt: newSupplier.updatedAt.toISOString(),
    };

    const response: ApiResponse<SupplierResponse> = {
      success: true,
      data: supplierResponse,
      message: 'Supplier created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}
