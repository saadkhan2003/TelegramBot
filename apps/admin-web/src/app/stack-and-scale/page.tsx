'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AboutStackAndScaleModal from '../../components/AboutStackAndScaleModal';

export default function StackAndScalePage() {
  const router = useRouter();

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return <AboutStackAndScaleModal isOpen={true} onClose={handleClose} />;
}
