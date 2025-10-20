import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xqybsnrppintjfqxfdne.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWJzbnJwcGludGpmcXhmZG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzYxMjIsImV4cCI6MjA3NTkxMjEyMn0.Z74zIAuVvBSID6bpQQ8n37c_CuVd3KWWO1TLOajtjcY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
