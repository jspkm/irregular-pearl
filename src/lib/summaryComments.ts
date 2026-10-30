import { hasSupabase, supabase } from './supabase';

export interface SummaryComment {
  id: string;
  pieceId: string;
  userId: string;
  body: string;
  createdAt: string;
  averageRating: number;
  ratingCount: number;
  author: {
    displayName: string;
    username: string | null;
  };
}

export async function getSummaryComments(pieceId: string): Promise<SummaryComment[]> {
  if (!hasSupabase) return [];
  const { data, error } = await supabase
    .from('piece_summary_comments')
    .select('id, piece_id, user_id, body, created_at')
    .eq('piece_id', pieceId)
    .order('created_at', { ascending: false });
  if (error || !data?.length) return [];

  const userIds = [...new Set(data.map((row) => row.user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, username')
    .in('id', userIds);
  const userById = new Map((users ?? []).map((user) => [user.id, user]));
  const { data: ratings } = await supabase
    .from('piece_summary_comment_ratings')
    .select('comment_id, rating')
    .in('comment_id', data.map((row) => row.id));
  const ratingByComment = new Map<string, number[]>();
  for (const rating of ratings ?? []) {
    const values = ratingByComment.get(rating.comment_id) ?? [];
    values.push(rating.rating);
    ratingByComment.set(rating.comment_id, values);
  }

  const comments = data.map((row) => {
    const author = userById.get(row.user_id);
    const ratingValues = ratingByComment.get(row.id) ?? [];
    return {
      id: row.id,
      pieceId: row.piece_id,
      userId: row.user_id,
      body: row.body,
      createdAt: row.created_at,
      averageRating: ratingValues.length
        ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length
        : 0,
      ratingCount: ratingValues.length,
      author: {
        displayName: author?.display_name ?? 'Irregular Pearl member',
        username: author?.username ?? null,
      },
    };
  });

  return comments.sort((a, b) =>
    b.averageRating - a.averageRating || b.ratingCount - a.ratingCount || b.createdAt.localeCompare(a.createdAt));
}
