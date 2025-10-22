import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order, OrderItem, ApiResponse } from '@/types/database';
import { ObjectId } from 'mongodb';

export const runtime = "nodejs";

interface ReportData {
  timeSeries: {
    label: string; // time point (hour, day, month)
    revenue: number;
    orders: number;
  }[];
  productBreakdown: {
    productId: string;
    productName: string;
    quantity: number;
    percentage: number;
  }[];
  orders: {
    _id: string;
    orderAt: string;
    createdBy: string;
    totalPrice: number;
    itemCount: number;
  }[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

// GET - Fetch report data by time range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const timeUnit = searchParams.get('timeUnit') || 'day'; // hour, day, month

    if (!startDate || !endDate) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'startDate and endDate are required',
        },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Fetch orders in range
    const orders = await db.collection<Order>('orders')
      .find({
        orderAt: {
          $gte: start,
          $lte: end
        }
      })
      .sort({ orderAt: -1 })
      .toArray();

    // Fetch all order items for these orders
    const orderIds = orders.map(o => o._id!);
    const orderItems = await db.collection<OrderItem>('order_items')
      .find({
        orderId: { $in: orderIds }
      })
      .toArray();

    // Get products for names
    const productIds = [...new Set(orderItems.map(item => 
      typeof item.productId === 'string' ? new ObjectId(item.productId) : item.productId
    ))];
    const products = await db.collection('products')
      .find({ _id: { $in: productIds } })
      .toArray();

    const productMap = new Map(products.map(p => [p._id.toString(), p.name]));

    // 1. TIME SERIES DATA
    const timeSeriesMap = new Map<string, { revenue: number; orders: number }>();
    
    orders.forEach(order => {
      let key: string;
      const orderDate = new Date(order.orderAt);

      if (timeUnit === 'hour') {
        key = `${orderDate.getDate()}/${orderDate.getMonth() + 1} ${orderDate.getHours()}h`;
      } else if (timeUnit === 'month') {
        key = `${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;
      } else {
        key = `${orderDate.getDate()}/${orderDate.getMonth() + 1}`;
      }

      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, { revenue: 0, orders: 0 });
      }

      const point = timeSeriesMap.get(key)!;
      point.revenue += order.totalPrice || 0;
      point.orders += 1;
    });

    const timeSeries = Array.from(timeSeriesMap.entries()).map(([label, data]) => ({
      label,
      revenue: Number(data.revenue.toFixed(2)),
      orders: data.orders,
    }));

    // 2. PRODUCT BREAKDOWN
    const productQuantityMap = new Map<string, number>();
    
    orderItems.forEach(item => {
      const productId = typeof item.productId === 'string' ? item.productId : item.productId.toString();
      const current = productQuantityMap.get(productId) || 0;
      productQuantityMap.set(productId, current + item.quantity);
    });

    const totalQuantity = Array.from(productQuantityMap.values()).reduce((sum, q) => sum + q, 0);

    const productBreakdown = Array.from(productQuantityMap.entries()).map(([productId, quantity]) => ({
      productId,
      productName: productMap.get(productId) || 'Unknown',
      quantity,
      percentage: totalQuantity > 0 ? Number(((quantity / totalQuantity) * 100).toFixed(2)) : 0,
    }));

    // 3. ORDERS LIST WITH ITEM COUNT
    const orderItemCountMap = new Map<string, number>();
    orderItems.forEach(item => {
      const orderId = typeof item.orderId === 'string' ? item.orderId : item.orderId.toString();
      orderItemCountMap.set(orderId, (orderItemCountMap.get(orderId) || 0) + 1);
    });

    const ordersList = orders.map(order => ({
      _id: order._id!.toString(),
      orderAt: order.orderAt.toISOString(),
      createdBy: order.createdBy,
      totalPrice: order.totalPrice,
      itemCount: orderItemCountMap.get(order._id!.toString()) || 0,
    }));

    // 4. SUMMARY
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const reportData: ReportData = {
      timeSeries,
      productBreakdown,
      orders: ordersList,
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
      },
    };

    return NextResponse.json<ApiResponse<ReportData>>({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch report data',
      },
      { status: 500 }
    );
  }
}
