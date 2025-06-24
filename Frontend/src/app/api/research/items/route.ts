import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/research/items`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch research items' }, { status: 500 });
  }
}