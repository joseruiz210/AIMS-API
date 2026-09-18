const path = require('path');
const crypto = require('crypto');
const { supabase, bucket } = require('../config/storage');
const AppError = require('./appError');

const uploadBuffer = async (buffer, { folder, originalName, mimeType }) => {
  const ext = path.extname(originalName || '').toLowerCase();
  const base = path.basename(originalName || 'archivo', ext)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);
  const key = `${folder}/${base}-${crypto.randomBytes(6).toString('hex')}${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(key, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    console.error('Error al subir archivo:', error.message, error.statusCode || '');
    throw AppError.badRequest('No se pudo subir el archivo');
  }
  return { key, size: buffer.length };
};

// inline=true permite abrir el PDF/imagen en el navegador; si no, se descarga
const getDownloadUrl = async (key, fileName, { expiresIn = 300, inline = false } = {}) => {
  const options = !inline && fileName ? { download: fileName } : undefined;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, expiresIn, options);

  if (error || !data?.signedUrl) {
    throw AppError.notFound('No se pudo generar el enlace del archivo');
  }
  return data.signedUrl;
};

const deleteFiles = async (keys) => {
  const list = (Array.isArray(keys) ? keys : [keys]).filter(Boolean);
  if (!list.length) return;
  const { error } = await supabase.storage.from(bucket).remove(list);
  if (error) console.error('No se pudieron borrar archivos:', error.message);
};

const deleteFile = (key) => deleteFiles([key]);

module.exports = { uploadBuffer, getDownloadUrl, deleteFile, deleteFiles };