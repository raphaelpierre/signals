import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

import AuthForm from '@/components/AuthForm';
import Layout from '@/components/Layout';
import { apiClient, setAuthToken } from '@/lib/api';

const LoginPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const response = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setAuthToken(access_token);
      await router.push('/dashboard');
    } catch (err) {
      setError('Unable to sign in with those credentials.');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Sign in | SignalStack</title>
      </Head>
      <AuthForm type="login" onSubmit={handleLogin} error={error} />
    </Layout>
  );
};

export default LoginPage;
