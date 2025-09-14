'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function logout() {
  const supabase = await createClient();
  
  // Sign out the user
  await supabase.auth.signOut();
  
  // Revalidate all paths to ensure fresh data
  revalidatePath('/', 'layout');
  
  // Redirect to login page
  redirect('/login');
}