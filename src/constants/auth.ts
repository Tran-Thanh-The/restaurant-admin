// Thông tin đăng nhập cho internal use
export const USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    fullName: 'Administrator'
  },
  {
    username: 'manager',
    password: 'manager123',
    role: 'manager',
    fullName: 'Manager'
  },
  {
    username: 'staff',
    password: 'staff123',
    role: 'staff',
    fullName: 'Staff Member'
  }
];

export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  username: string;
  role: UserRole;
  fullName: string;
}
