import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbxqpoomxwvhlscuxfrs.supabase.co';
const supabaseAnonKey = 'sb_publishable_fLOr8HrTLMJ72DWAF-Y56w_47bGgBs3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
