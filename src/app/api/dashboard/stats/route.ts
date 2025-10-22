import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order, Product, ApiResponse } from '@/types/database';

export const runtime = "nodejs";
interface DashboardStatsResponse {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

// GET - Fetch dashboard stats (today's orders + total products)
export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query only today's orders (optimized - filter at database level)
    const todayOrders = await db.collection<Order>('orders')
      .find({
        orderAt: {
          $gte: today,
          $lt: tomorrow
        }
      })
      .toArray();

    // Calculate stats
    const totalOrders = todayOrders.length;
    const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    // Get total products count
    const totalProducts = await db.collection<Product>('products').countDocuments();

    const stats: DashboardStatsResponse = {
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalProducts,
    };

    return NextResponse.json<ApiResponse<DashboardStatsResponse>>({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch dashboard stats',
      },
      { status: 500 }
    );
  }
}
