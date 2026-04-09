import { useState } from 'react';
import { useLoginMutation } from '../api';

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});

  const mutation = useLoginMutation();

  function validate(): boolean {
    const newErrors: LoginErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email address';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setErrors({});
    try {
      await mutation.mutateAsync({ email: email.trim(), password });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setErrors({ general: message });
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    errors,
    isLoading: mutation.isPending,
    handleLogin,
  };
}
