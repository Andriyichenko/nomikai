import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_DB_PATH = path.join(process.cwd(), 'data', 'users.json');

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
}

// Init Users DB
if (!fs.existsSync(USERS_DB_PATH)) {
  if (!fs.existsSync(path.dirname(USERS_DB_PATH))) {
     fs.mkdirSync(path.dirname(USERS_DB_PATH), { recursive: true });
  }
  // Create a default admin user: admin / admin123
  const defaultAdmin = {
    id: 'admin',
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin' as const,
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(USERS_DB_PATH, JSON.stringify([defaultAdmin], null, 2));
}

export function getUsers(): User[] {
  try {
    const data = fs.readFileSync(USERS_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export function saveUsers(users: User[]) {
  fs.writeFileSync(USERS_DB_PATH, JSON.stringify(users, null, 2));
}

export function findUserByUsername(username: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.username === username);
}

export function createUser(username: string, password: string, role: 'admin' | 'user' = 'user') {
  const users = getUsers();
  if (users.find(u => u.username === username)) {
    throw new Error('User already exists');
  }

  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function deleteUser(id: string) {
    let users = getUsers();
    users = users.filter(u => u.id !== id);
    saveUsers(users);
}

export function updateUser(id: string, data: Partial<User>) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
        users[index] = { ...users[index], ...data };
        saveUsers(users);
        return users[index];
    }
    return null;
}
