const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET } = process.env;
const serviceKey = SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (SUPABASE_URL && serviceKey) {
  supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
} else {
  console.warn('Storage: faltan variables SUPABASE_* en el .env. Funciones de storage en la nube deshabilitadas temporalmente.');
}

module.exports = { supabase, bucket: SUPABASE_BUCKET || 'aims-storage' };