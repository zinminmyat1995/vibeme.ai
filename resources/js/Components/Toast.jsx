import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

export default function GlobalToast() {
    const { flash } = usePage().props;
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        console.log('Flash props:', flash);
        if (flash?.success) addToast('success', flash.success);
        if (flash?.error)   addToast('error',   flash.error);
    }, [flash]);

    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeToast(id), 4000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 w-80">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-lg backdrop-blur-sm animate-slide-in ${
                        toast.type === 'success'
                            ? 'border-green-200 bg-white text-green-800'
                            : 'border-red-200 bg-white text-red-800'
                    }`}
                >
                    {/* Icon */}
                    {toast.type === 'success' ? (
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    ) : (
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                            <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            </svg>
                        </div>
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-xs font-bold text-gray-900">
                            {toast.type === 'success' ? 'Success' : 'Error'}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                            {toast.message}
                        </p>
                    </div>

                    {/* Close */}
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>

                    {/* Progress bar */}
                    <div className={`absolute bottom-0 left-0 h-0.5 rounded-b-xl animate-progress ${
                        toast.type === 'success' ? 'bg-green-400' : 'bg-red-400'
                    }`}/>
                </div>
            ))}
        </div>
    );
}