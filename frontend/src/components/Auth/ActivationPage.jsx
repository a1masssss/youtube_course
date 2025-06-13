import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

const ActivationPage = () => {
    const { token, userId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('activating'); // 'activating', 'success', 'error'
    const [message, setMessage] = useState('Please wait while we activate your account...');
    const activationAttempted = useRef(false);

    useEffect(() => {
        const activateAccount = async () => {
            // Prevent multiple activation attempts
            if (activationAttempted.current) return;
            activationAttempted.current = true;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/activate/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: token,
                        user_id: userId
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage('Your account has been activated successfully! Please log in to continue.');
                    
                    toast.success('Account activated successfully! Please log in.');
                    
                    // Redirect to login page after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Activation failed. Please try again.');
                    toast.error(data.error || 'Activation failed');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Network error. Please try again.');
                toast.error('Network error occurred');
            }
        };

        if (token && userId && !activationAttempted.current) {
            activateAccount();
        } else if (!token || !userId) {
            setStatus('error');
            setMessage('Invalid activation link');
            toast.error('Invalid activation link');
        }
    }, [token, userId, navigate]);

    const handleResendEmail = async () => {
        const email = prompt('Please enter your email address:');
        if (!email) return;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/resend-activation/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Activation email sent successfully!');
            } else {
                toast.error(data.error || 'Failed to send activation email');
            }
        } catch (error) {
            toast.error('Network error occurred');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8">
                <div className="text-center">
                    {/* Logo */}
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent mb-8">
                        Coursiva
                    </h1>

                    {/* Status Icon */}
                    <div className="mb-6">
                        {status === 'activating' && (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                        )}
                        {status === 'success' && (
                            <div className="rounded-full h-12 w-12 bg-green-500 mx-auto flex items-center justify-center">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="rounded-full h-12 w-12 bg-red-500 mx-auto flex items-center justify-center">
                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Status Message */}
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {status === 'activating' && 'Activating Your Account...'}
                        {status === 'success' && 'Account Activated!'}
                        {status === 'error' && 'Activation Failed'}
                    </h2>

                    <p className="text-gray-300 mb-6">
                        {message}
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {status === 'success' && (
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-4 rounded-md hover:from-purple-600 hover:to-indigo-700 transition duration-200"
                            >
                                Go to Login
                            </button>
                        )}

                        {status === 'error' && (
                            <>
                                <button
                                    onClick={handleResendEmail}
                                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-4 rounded-md hover:from-purple-600 hover:to-indigo-700 transition duration-200"
                                >
                                    Resend Activation Email
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-200"
                                >
                                    Back to Login
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivationPage; 