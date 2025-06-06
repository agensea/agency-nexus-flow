
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ctmsgtfdgkhxzctgcgnh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bXNndGZkZ2toeHpjdGdjZ25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MjIzMTAsImV4cCI6MjA1OTQ5ODMxMH0.c9mFz3PyQBCv_cg8zy0kWPfO7ttiXDYzdN9Zr08ttBk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
