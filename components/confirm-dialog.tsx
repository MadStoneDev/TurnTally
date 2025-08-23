'use client';

import { IconX, IconAlertTriangle } from '@tabler/icons-react';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'primary';
    onConfirm: () => void;
    onClose: () => void;
}

export default function ConfirmDialog({
                                          title,
                                          message,
                                          confirmText = 'Confirm',
                                          cancelText = 'Cancel',
                                          confirmVariant = 'primary',
                                          onConfirm,
                                          onClose
                                      }: ConfirmDialogProps) {
    const confirmButtonClass = confirmVariant === 'danger'
        ? 'bg-red-600 text-white hover:bg-red-700'
        : 'bg-neutral-900 text-white hover:bg-neutral-800';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-start space-x-3 mb-4">
                    {confirmVariant === 'danger' && (
                        <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                            <IconAlertTriangle size={20} className="text-red-600" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                            {title}
                        </h3>
                        <p className="text-neutral-600">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
                    >
                        <IconX size={20} />
                    </button>
                </div>

                <div className="flex space-x-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 rounded-md transition-colors ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}