import * as z from 'zod';

export interface Input {
    email: string;
    password: string;
}

export const signupSchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters long' }),
    email: z
        .string()
        .trim()
        .pipe(z.email({ error: 'Invalid email address' })),
    password: z.string().trim().min(1, 'Password is required'),
});
export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .pipe(z.email({ error: 'Invalid email address' })),
    password: z.string().trim().min(1, 'Password is required'),
});
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
/*export function validateSignup(body: unknown): SignupInput {
    const result = signupSchema.safeParse(body);
    if (!result.success) {
        const message = result.error.issues
            .map((issue) => issue.message)
            .join(', ');
        log.error('Error from zod', { data: { message } });
        return;
    }
}*/
