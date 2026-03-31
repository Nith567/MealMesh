import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('[GET-MEAL] Fetching meal with ID:', id);

    const { data: meal, error } = await supabase
      .from('Meal')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !meal) {
      console.error('[GET-MEAL] Meal not found:', error);
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    console.log('[GET-MEAL] ✅ Meal found:', meal);
    return NextResponse.json({ success: true, meal });
  } catch (error) {
    console.error('[GET-MEAL] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
