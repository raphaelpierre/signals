import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

import AuthForm from '@/components/AuthForm';
import Layout from '@/components/Layout';
import { apiClient } from '@/lib/api';

const RegisterPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (email: string, password: string) => {
    try {
      setError(null);
      await apiClient.post('/auth/register', { email, password });
      await router.push('/login?message=Registration successful! Please sign in.');
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.message || 
                          'Registration failed. Please check your connection and try again.';
      setError(errorMessage);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Create account | SignalStack</title>
      </Head>
      <AuthForm type="register" onSubmit={handleRegister} error={error} />
    </Layout>
  );
};

export default RegisterPage;
