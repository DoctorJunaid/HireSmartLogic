import { z } from 'zod';

export const registerSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(['worker', 'customer'], { errorMap: () => ({ message: "Role must be either 'worker' or 'customer'" }) }),
    phone_number: z.string().optional(),
    cnic_number: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional(),
    age: z.union([z.number(), z.string()]).optional(),
}).refine((data) => {
    if (data.role === 'worker' && !data.cnic_number) {
        return false;
    }
    return true;
}, {
    message: "CNIC number is required for workers",
    path: ["cnic_number"],
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
    full_name: z.string().min(2).optional(),
    phone_number: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional(),
    age: z.union([z.number(), z.string()]).optional(),
});

export const completeProfileSchema = z.object({
    full_name: z.string().min(2).optional(),
    phone_number: z.string().optional(),
    role: z.enum(['worker', 'customer']),
    address: z.string().optional(),
    cnic_number: z.string().optional(),
    gender: z.string().optional(),
    age: z.union([z.number(), z.string()]).optional(),
}).refine((data) => {
    if (data.role === 'worker' && !data.cnic_number) {
        return false;
    }
    return true;
}, {
    message: "CNIC number is required for workers",
    path: ["cnic_number"],
});
