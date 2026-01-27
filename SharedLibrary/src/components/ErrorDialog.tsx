import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import '../index.css';

export default function ErrorDialog({ 
  title, 
  children, 
  open, 
  onOpenChange 
}: { 
  title: string; 
  children?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in-95">
          <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </Dialog.Title>
          {children}
          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}