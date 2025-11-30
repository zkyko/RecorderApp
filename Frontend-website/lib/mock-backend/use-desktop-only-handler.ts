'use client';

import { useState } from 'react';
import { DesktopOnlyError, isDesktopOnlyError } from './errors';
import { DesktopOnlyModal } from '@/components/demo/DesktopOnlyModal';

/**
 * Hook to handle desktop-only errors and show modal
 * Returns modal state and handler function
 */
export function useDesktopOnlyHandler() {
  const [showModal, setShowModal] = useState(false);

  const handleError = (error: unknown) => {
    if (isDesktopOnlyError(error)) {
      setShowModal(true);
      return true; // Error was handled
    }
    return false; // Error was not a DesktopOnlyError
  };

  const Modal = () => (
    <DesktopOnlyModal
      opened={showModal}
      onClose={() => setShowModal(false)}
    />
  );

  return {
    handleError,
    showModal,
    setShowModal,
    Modal,
  };
}

