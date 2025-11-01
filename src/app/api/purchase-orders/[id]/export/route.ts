import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PurchaseOrder, PurchaseOrderItem, Supplier } from '@/types/database';
import { ObjectId } from 'mongodb';

export const runtime = "nodejs";

// GET /api/purchase-orders/[id]/export - Xuất purchase order dưới dạng HTML để in PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return new NextResponse('Invalid purchase order ID', { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Lấy thông tin purchase order
    const purchaseOrder = await db
      .collection<PurchaseOrder>('purchase_orders')
      .findOne({ _id: new ObjectId(id) });

    if (!purchaseOrder) {
      return new NextResponse('Purchase order not found', { status: 404 });
    }

    // Lấy danh sách items
    const items = await db
      .collection<PurchaseOrderItem>('purchase_order_items')
      .find({ purchaseOrderId: new ObjectId(id) })
      .toArray();

    // Lấy thông tin suppliers
    const supplierIds = items.map(item => new ObjectId(item.supplierId));
    const suppliers = await db
      .collection<Supplier>('suppliers')
      .find({ _id: { $in: supplierIds } })
      .toArray();

    const supplierMap = new Map(suppliers.map(s => [s._id!.toString(), s]));

    // Tạo HTML cho PDF
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phiếu nhập hàng - ${purchaseOrder.orderNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    .info-section {
      margin-bottom: 30px;
    }
    .info-row {
      display: flex;
      margin-bottom: 8px;
    }
    .info-label {
      font-weight: bold;
      width: 150px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f4f4f4;
      font-weight: bold;
    }
    .text-right {
      text-align: right;
    }
    .total-section {
      text-align: right;
      font-size: 18px;
      font-weight: bold;
      margin-top: 20px;
    }
    .notes-section {
      margin-top: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border-left: 4px solid #333;
    }
    .signature-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      margin-top: 60px;
      border-top: 1px solid #333;
      padding-top: 5px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
    }
    .status-draft { background-color: #fef3c7; color: #92400e; }
    .status-ordered { background-color: #dbeafe; color: #1e40af; }
    .status-received { background-color: #e0e7ff; color: #3730a3; }
    .status-completed { background-color: #d1fae5; color: #065f46; }
    .status-cancelled { background-color: #fee2e2; color: #991b1b; }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PHIẾU NHẬP HÀNG</h1>
    <p>Mã phiếu: ${purchaseOrder.orderNumber}</p>
  </div>

  <div class="info-section">
    <div class="info-row">
      <div class="info-label">Ngày tạo:</div>
      <div>${new Date(purchaseOrder.createdAt).toLocaleString('vi-VN')}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Người tạo:</div>
      <div>${purchaseOrder.createdBy}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Trạng thái:</div>
      <div>
        <span class="status-badge status-${purchaseOrder.status}">
          ${purchaseOrder.status === 'draft' ? 'Nháp' : 
            purchaseOrder.status === 'ordered' ? 'Đang đặt' :
            purchaseOrder.status === 'received' ? 'Đã về' :
            purchaseOrder.status === 'completed' ? 'Hoàn thành' : 'Hủy'}
        </span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Tên nguồn hàng</th>
        <th>Liên hệ</th>
        <th class="text-right">Số lượng đặt</th>
        <th class="text-right">Số lượng kiểm</th>
        <th class="text-right">Đơn giá</th>
        <th class="text-right">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, index) => {
        const supplier = supplierMap.get(item.supplierId.toString());
        const subtotal = item.quantity * item.price;
        return `
        <tr>
          <td>${index + 1}</td>
          <td>${supplier?.name || 'N/A'}</td>
          <td>${supplier?.contact || 'N/A'}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${item.checkedQuantity !== undefined ? item.checkedQuantity : '-'}</td>
          <td class="text-right">${item.price.toLocaleString('vi-VN')} đ</td>
          <td class="text-right">${subtotal.toLocaleString('vi-VN')} đ</td>
        </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="total-section">
    Tổng tiền: ${purchaseOrder.totalAmount.toLocaleString('vi-VN')} đ
  </div>

  ${purchaseOrder.notes ? `
  <div class="notes-section">
    <strong>Ghi chú:</strong><br>
    ${purchaseOrder.notes}
  </div>
  ` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <div>Người tạo phiếu</div>
      <div class="signature-line">${purchaseOrder.createdBy}</div>
    </div>
    <div class="signature-box">
      <div>Người kiểm hàng</div>
      <div class="signature-line"></div>
    </div>
    <div class="signature-box">
      <div>Người duyệt</div>
      <div class="signature-line"></div>
    </div>
  </div>

  <script>
    // Tự động mở hộp thoại in khi trang được load
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error exporting purchase order:', error);
    return new NextResponse('Failed to export purchase order', { status: 500 });
  }
}
