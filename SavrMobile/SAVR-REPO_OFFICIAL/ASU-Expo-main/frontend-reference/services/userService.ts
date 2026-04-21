// User model type definition
export interface User {
  id: string;
  email: string;
  password: string; // In a real app, this would be hashed
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  created_at: string;
}

// Get all registered users from localStorage
export const getUsers = (): User[] => {
  const usersJson = localStorage.getItem('registered_users');
  return usersJson ? JSON.parse(usersJson) : [];
};

// Save users to localStorage
export const saveUsers = (users: User[]): void => {
  localStorage.setItem('registered_users', JSON.stringify(users));
};

// Find a user by email
export const findUserByEmail = (email: string): User | undefined => {
  const users = getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

// Register a new user
export const registerUser = (userData: Omit<User, 'id' | 'created_at'>): User => {
  const users = getUsers();
  
  // Check if user already exists
  if (findUserByEmail(userData.email)) {
    throw new Error('Email already registered');
  }
  
  // Create new user
  const newUser = {
    ...userData,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  
  // Add to users array
  users.push(newUser);
  saveUsers(users);
  
  // Return the new user (without password)
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword as User;
};

// Authenticate user
export const authenticateUser = (email: string, password: string): Omit<User, 'password'> => {
  // First, check for demo account
  if (email === 'demo@savr.com' && password === 'password') {
    return {
      id: 'mock-user-id',
      email: 'demo@savr.com',
      address: {
        street: '123 Yonge Street',
        city: 'Toronto',
        state: 'ON',
        zipCode: 'M5B 2H1'
      },
      created_at: new Date().toISOString()
    };
  }
  
  // Find user in registered users
  const user = findUserByEmail(email);
  
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password');
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}; 