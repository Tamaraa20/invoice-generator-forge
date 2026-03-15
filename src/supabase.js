// src/supabase.js
const supabaseUrl = 'https://oewovljalzhdclpdtkth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ld292bGphbHpoZGNscGR0a3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjkxMTgsImV4cCI6MjA1NzMwNTExOH0.4YpXz-uUvG-UvG';

// Initialize the Supabase client
window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
