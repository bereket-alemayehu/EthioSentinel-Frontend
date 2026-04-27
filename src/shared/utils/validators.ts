export const validators = {
  email: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone: string) => /^\+?[\d\s-]{10,}$/.test(phone),
};
