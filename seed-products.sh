#!/bin/bash

# Script to seed sample products
echo "🌱 Seeding sample products..."

BASE_URL="http://localhost:3000"

# Array of sample products
products=(
  '{"name":"Phở Bò Đặc Biệt","price":65000,"imageUrl":"https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400"}'
  '{"name":"Bánh Mì Thịt","price":25000,"imageUrl":"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400"}'
  '{"name":"Bún Chả Hà Nội","price":55000,"imageUrl":"https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400"}'
  '{"name":"Cơm Tấm Sườn","price":45000,"imageUrl":"https://images.unsplash.com/photo-1626074353765-517a65ead1c2?w=400"}'
  '{"name":"Gỏi Cuốn","price":35000,"imageUrl":"https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400"}'
  '{"name":"Cà Phê Sữa Đá","price":20000,"imageUrl":"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400"}'
  '{"name":"Trà Sữa Trân Châu","price":30000,"imageUrl":"https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400"}'
  '{"name":"Sinh Tố Bơ","price":35000,"imageUrl":"https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400"}'
)

count=0
for product in "${products[@]}"
do
  echo "Adding product $((count+1))..."
  curl -X POST "$BASE_URL/api/products" \
    -H "Content-Type: application/json" \
    -d "$product" \
    -s | grep -o '"success":[^,]*' || echo "Failed"
  count=$((count+1))
  sleep 0.5
done

echo ""
echo "✅ Done! Added $count products."
echo "📋 View products at: $BASE_URL/products"
