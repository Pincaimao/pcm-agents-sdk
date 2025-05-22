// src/store/auth.store.ts
import { createStore } from '@stencil/store';

export const { state: authState, onChange } = createStore({
  token: localStorage.getItem('pcm-sdk-auth-token') || null
});

// 添加一些辅助方法
export const authStore = {
  getToken: () => authState.token,
  setToken: (token: string) => {
    authState.token = token;
    localStorage.setItem('pcm-sdk-auth-token', token);
  },
  clearToken: () => {
    authState.token = null;
    localStorage.removeItem('pcm-sdk-auth-token');
  }
};

// 自动保存到localStorage
onChange('token', value => {
  if (value) {
    localStorage.setItem('pcm-sdk-auth-token', value);
  } else {
    localStorage.removeItem('pcm-sdk-auth-token');
  }
});