import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Product, ProductResponse, ApiResponse } from '@/types/database';

// GET - Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid product ID',
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const product = await db.collection<Product>('products').findOne({ _id: new ObjectId(id) });

    if (!product) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    const productResponse: ProductResponse = {
      _id: product._id!.toString(),
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<ProductResponse>>({
      success: true,
      data: productResponse,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch product',
      },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid product ID',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, price, imageUrl } = body;

    const { db } = await connectToDatabase();

    const updateData: Partial<Product> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const result = await db.collection<Product>('products').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    const productResponse: ProductResponse = {
      _id: result._id!.toString(),
      name: result.name,
      price: result.price,
      imageUrl: result.imageUrl,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<ProductResponse>>({
      success: true,
      data: productResponse,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update product',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Invalid product ID',
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const result = await db.collection<Product>('products').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete product',
      },
      { status: 500 }
    );
  }
}
