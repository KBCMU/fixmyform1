/**
 * GET /api/coach/conversations
 *
 * Returns the user's conversation list, or messages for a specific conversation.
 *
 * Query params:
 *   - (none)      → list all conversations
 *   - ?id=<uuid>  → return messages for that conversation
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (conversationId) {
      // Return messages for a specific conversation
      // First verify ownership
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: conversation } = await (supabase as any)
        .from('coach_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 },
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: messages, error } = await (supabase as any)
        .from('coach_messages')
        .select('id, role, content, tool_data, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch messages:', error);
        return NextResponse.json(
          { error: 'Failed to fetch messages' },
          { status: 500 },
        );
      }

      // Filter to only user/assistant messages for the UI
      const filtered = ((messages ?? []) as Array<{
        id: string;
        role: string;
        content: string | null;
        tool_data: Record<string, unknown> | null;
        created_at: string;
      }>).filter((m) => m.role === 'user' || m.role === 'assistant');

      return NextResponse.json({ messages: filtered });
    }

    // List all conversations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conversations, error } = await (supabase as any)
      .from('coach_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 },
      );
    }

    return NextResponse.json({ conversations: conversations ?? [] });
  } catch (err) {
    console.error('Conversations route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
