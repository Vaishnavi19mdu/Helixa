// src/components/AvatarUpload.jsx
import React, { useState, useRef } from 'react';
import { Camera, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CLOUDINARY_CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const AvatarUpload = ({ currentAvatar, firstName, onUploadSuccess }) => {
  const [preview, setPreview]   = useState(currentAvatar || null);
  const [status, setStatus]     = useState('idle'); // idle | uploading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const getInitials = () =>
    firstName ? firstName.charAt(0).toUpperCase() : '?';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file.');
      setStatus('error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image must be under 5 MB.');
      setStatus('error');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setStatus('uploading');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'avatars');

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setPreview(data.secure_url);
      setStatus('success');
      onUploadSuccess?.(data.secure_url);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      setErrorMsg('Upload failed. Please try again.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-5">
      {/* Avatar circle */}
      <div className="relative group">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-helixa-green/10 flex items-center justify-center border-2 border-[var(--border-color)]">
          {preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-helixa-green">{getInitials()}</span>
          )}
        </div>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={status === 'uploading'}
          className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:cursor-not-allowed"
        >
          {status === 'uploading'
            ? <Loader2 size={20} className="text-white animate-spin" />
            : <Camera size={20} className="text-white" />
          }
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Info + status */}
      <div className="flex-1">
        <p className="text-sm font-black text-[var(--text-primary)]">Profile Photo</p>
        <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">
          JPG, PNG or WebP · Max 5 MB
        </p>

        <AnimatePresence mode="wait">
          {status === 'uploading' && (
            <motion.p key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs font-bold text-helixa-green mt-1 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Uploading…
            </motion.p>
          )}
          {status === 'success' && (
            <motion.p key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs font-bold text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Photo updated!
            </motion.p>
          )}
          {status === 'error' && (
            <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs font-bold text-helixa-alert mt-1 flex items-center gap-1">
              <AlertTriangle size={12} /> {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={status === 'uploading'}
          className="mt-2 text-xs font-black text-helixa-green hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {preview ? 'Change photo' : 'Upload photo'}
        </button>
      </div>
    </div>
  );
};