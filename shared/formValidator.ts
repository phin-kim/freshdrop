import * as z from 'zod';

export interface Input {
    email: string;
    password: string;
}
export const passwordSchema = z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(70, { message: 'Password cannot exceed 100 characters' })
    .refine((val) => /[A-Z]/.test(val), {
        message: 'Password must contain at least one uppercase letter',
    })
    .refine((val) => /[0-9]/.test(val), {
        message: 'Password must contain at least one number',
    });
const nameRegex = /^[a-zA-Z\s'-]+$/;
export const signupSchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters long' })
        .max(50, { message: 'Name cannot exceed 50 characters' })
        .refine((val) => nameRegex.test(val), {
            message:
                'Name can only contain letter space, hyphens and apostrophes',
        }),
    email: z
        .string()
        .trim()
        .pipe(z.email({ error: 'Invalid email address' })),
    password: passwordSchema,
});
export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .pipe(z.email({ error: 'Invalid email address' })),
    password: passwordSchema,
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
