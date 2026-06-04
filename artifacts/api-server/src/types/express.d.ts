declare global {
  namespace Express {
    interface Request {
      /** Supabase user ID — set by requireAuth / requireSupabaseAuth middleware */
      supabaseUserId?: string;
      /** Supabase user email — set by requireAuth / requireSupabaseAuth middleware */
      supabaseUserEmail?: string;
    }
  }
}

export {};
