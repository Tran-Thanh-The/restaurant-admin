import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export const runtime = "nodejs";

export async function POST() {
  try {
    console.log('🌱 Starting database seed...');
    const result = await seedDatabase();
    console.log('✅ Seed completed:', result);
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
    });
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
