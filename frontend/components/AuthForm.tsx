import { FormEvent, useState } from 'react';

interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string | null;
}

export const AuthForm = ({ type, onSubmit, error }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await onSubmit(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2 style={{ marginTop: 0 }}>{type === 'login' ? 'Log in to SignalStack' : 'Create your account'}</h2>
      <input
        className="input"
        type="email"
        value={email}
        placeholder="Email"
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <input
        className="input"
        type="password"
        value={password}
        placeholder="Password"
        onChange={(event) => setPassword(event.target.value)}
        minLength={8}
        required
      />
      {error ? <p style={{ color: '#f87171' }}>{error}</p> : null}
      <button className="button" type="submit" disabled={loading}>
        {loading ? 'Please wait...' : type === 'login' ? 'Log In' : 'Create Account'}
      </button>
    </form>
  );
};

export default AuthForm;
