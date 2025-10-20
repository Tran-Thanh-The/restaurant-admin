import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET /api/orders/[id] - Lấy chi tiết đơn hàng
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "ID không hợp lệ" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Lấy thông tin order
    const order = await db.collection("orders").findOne({ _id: new ObjectId(id) });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    // Lấy danh sách order_items
    const orderItems = await db
      .collection("order_items")
      .aggregate([
        { $match: { orderId: new ObjectId(id) } },
        {
          $lookup: {
            from: "products",
            let: { productIdStr: { $toString: "$productId" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [{ $toString: "$_id" }, "$$productIdStr"],
                  },
                },
              },
            ],
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            productName: { $ifNull: ["$productInfo.name", "Sản phẩm đã xóa"] },
            quantity: 1,
            price: 1,
          },
        },
      ])
      .toArray();

    const result = {
      _id: order._id.toString(),
      orderAt: order.orderAt,
      createdBy: order.createdBy,
      totalPrice: order.totalPrice,
      items: orderItems,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Xóa đơn hàng
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "ID không hợp lệ" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Xóa order
    const deleteResult = await db.collection("orders").deleteOne({ _id: new ObjectId(id) });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    // Xóa các order_items liên quan
    await db.collection("order_items").deleteMany({ orderId: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "Đã xóa đơn hàng thành công",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}
