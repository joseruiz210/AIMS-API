const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET } = process.env;

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
} else {
  console.warn('Storage: faltan variables SUPABASE_* en el .env. Funciones de storage en la nube deshabilitadas temporalmente.');
}

module.exports = { supabase, bucket: SUPABASE_BUCKET || 'aims-storage' };