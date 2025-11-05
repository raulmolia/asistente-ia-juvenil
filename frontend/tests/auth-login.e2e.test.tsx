import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from '@/app/auth/login/page';

const loginMock = vi.fn();
const authState = {
  status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated',
  isAuthenticated: false,
};

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    login: loginMock,
    status: authState.status,
    isAuthenticated: authState.isAuthenticated,
  }),
}));

type RouterMock = {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
};

const routerMock = (globalThis as unknown as { __routerMock: RouterMock }).__routerMock;

describe('LoginPage E2E', () => {
  beforeEach(() => {
    loginMock.mockReset();
    routerMock.push.mockReset();
    routerMock.replace.mockReset();
    routerMock.prefetch.mockReset();
    authState.status = 'unauthenticated';
    authState.isAuthenticated = false;
  });

  it('permite iniciar sesión correctamente y redirige al dashboard', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce({ success: true });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'user@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'super-secret');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(loginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'super-secret',
    });

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/');
    });
  });

  it('muestra un mensaje de error cuando las credenciales son inválidas', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValueOnce({ success: false, error: 'Credenciales inválidas' });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'user@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/credenciales inválidas/i)).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
