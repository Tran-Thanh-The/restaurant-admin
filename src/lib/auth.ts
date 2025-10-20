import { USERS, User } from '@/constants/auth';

const AUTH_STORAGE_KEY = 'restaurant_admin_auth';

export interface AuthData {
  user: User;
  timestamp: number;
}

// Authenticate user
export function authenticateUser(username: string, password: string): User | null {
  const user = USERS.find(
    u => u.username === username && u.password === password
  );

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  return null;
}

// Save auth data to localStorage
export function saveAuthData(user: User): void {
  if (typeof window === 'undefined') return;
  
  const authData: AuthData = {
    user,
    timestamp: Date.now()
  };
  
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

// Get auth data from localStorage
export function getAuthData(): AuthData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    
    return JSON.parse(data) as AuthData;
  } catch (error) {
    console.error('Error reading auth data:', error);
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const authData = getAuthData();
  return authData !== null;
}

// Get current user
export function getCurrentUser(): User | null {
  const authData = getAuthData();
  return authData?.user || null;
}

// Logout user
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
