import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product, ProductResponse, ApiResponse } from '@/types/database';

// GET - Fetch all products
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const products = await db.collection<Product>('products').find({}).toArray();

    const productResponses: ProductResponse[] = products.map(product => ({
      _id: product._id!.toString(),
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));

    return NextResponse.json<ApiResponse<ProductResponse[]>>({
      success: true,
      data: productResponses,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, imageUrl } = body;

    if (!name || price === undefined || !imageUrl) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Name, price, and imageUrl are required',
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const newProduct: Omit<Product, '_id'> = {
      name,
      price: Number(price),
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Product>('products').insertOne(newProduct as Product);

    const productResponse: ProductResponse = {
      _id: result.insertedId.toString(),
      name: newProduct.name,
      price: newProduct.price,
      imageUrl: newProduct.imageUrl,
      createdAt: newProduct.createdAt.toISOString(),
      updatedAt: newProduct.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<ProductResponse>>(
      {
        success: true,
        data: productResponse,
        message: 'Product created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create product',
      },
      { status: 500 }
    );
  }
}
