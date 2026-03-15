// src/supabase.js
// Initialize Supabase Client
const SUPABASE_URL = 'https://zvkeiyiholscorxbjnnn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2a2VpeWlob2xzY29yeGJqbm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjQ4MDEsImV4cCI6MjA4ODg0MDgwMX0.PoC2uZcgJPHkG9i2iA6Cy_k2sH40ORjnkgk_xDg0sbw';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;
