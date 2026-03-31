import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { transactionId } = body;

    console.log(`[API] Updating meal ${id} with transaction ID:`, transactionId);

    // Update the meal with the transaction ID
    const { data: meal, error: updateError } = await supabase
      .from('Meal')
      .update({ transactionId: transactionId })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Update error:', updateError);
      return Response.json({ error: updateError.message }, { status: 400 });
    }

    console.log('[API] ✅ Meal updated with transaction ID');

    return Response.json({ success: true, meal });
  } catch (error) {
    console.error('[API] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
