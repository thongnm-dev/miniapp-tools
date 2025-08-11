export interface ServiceReturn<T> {
    success: boolean;
    data?: T;
    message?: string;
}