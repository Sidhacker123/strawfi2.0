import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    // Hardcoding the backend URL for testing purposes
    const backendUrl = "http://localhost:3001";
    const response = await fetch(`${backendUrl}/api/research/${id}/versions`);
    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying versions request to backend:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch research versions' }, { status: 500 });
  }
} 