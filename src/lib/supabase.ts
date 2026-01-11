let createClient: any

try {
  createClient = require('@supabase/supabase-js').createClient
} catch {}

export const supabase =
  process.env.NEXT_PUBLIC_ENABLE_SUPABASE && createClient
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    : undefined
