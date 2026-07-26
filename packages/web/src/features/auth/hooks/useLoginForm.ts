import { UserToLoginSchema, UserToLoginType } from '@eventflow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { BaseSyntheticEvent } from 'react';
import { FieldErrors, UseFormRegister, useForm } from 'react-hook-form';

interface UseLoginFormReturn {
    register: UseFormRegister<UserToLoginType>;
    handleSubmit: (e?: BaseSyntheticEvent) => Promise<void>;
    errors: FieldErrors<UserToLoginType>;
}

export function useLoginForm(
    onSubmit: (email: string, password: string) => Promise<void>,
): UseLoginFormReturn {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UserToLoginType>({
        resolver: zodResolver(UserToLoginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const submit = (data: UserToLoginType) => onSubmit(data.email, data.password);

    return { register, handleSubmit: handleSubmit(submit), errors };
}
