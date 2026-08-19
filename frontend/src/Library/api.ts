import type {
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';
import axios from 'axios';

import createClientLogger from '../Utils/clientLogger';

const log = createClientLogger('API.ts');
let isRefreshing = false;
const baseURL =
    import.meta.env.MODE === 'development'
        ? 'http://localhost:5100/api'
        : 'https://unparasitical-unsigned-lasonya.ngrok-free.dev';
const createSecureInstance = (pathSuffix: string = '') => {
    return axios.create({
        baseURL: `${baseURL}${pathSuffix}`,
        withCredentials: true,
    });
};
const applyInterceptors = (instance: AxiosInstance) => {
    instance.interceptors.response.use(
        (response: AxiosResponse) => response,
        async (error) => {
            const originalRequest =
                error.config as InternalAxiosRequestConfig & {
                    _retry?: boolean;
                };
            const apiError = error?.response?.data?.error;
            const statusCode = error?.response?.data?.status;
            const standardError = {
                message:
                    apiError?.message ||
                    error.response?.data?.message ||
                    'Something went wrong',
                status: statusCode || 500,
                type:
                    apiError?.type ||
                    error?.response?.data?.type ||
                    'ServerError',
            };
            if (
                error.code === 'ERR_NETWORK' ||
                error.code === 'ERROR_CONNECTION_REFUSED' ||
                error.message === 'Network Error'
            ) {
                error.apiError = {
                    message:
                        'Unable to connect to server.Please try again later',
                    type: 'Network Error',
                    statusCode: 503,
                };
                return Promise.reject(error.apiError);
            }
            if (
                statusCode === 401 &&
                apiError?.type === 'SESSION_EXPIRED' &&
                !originalRequest._retry
            ) {
                // If a refresh is already in progress, reject this duplicate request
                if (isRefreshing) {
                    log.debug(
                        'Refresh already in progress, dropping duplicate 401 request.'
                    );
                    return Promise.reject(standardError);
                }

                originalRequest._retry = true;

                try {
                    isRefreshing = true;
                    log.debug(
                        'Session cookie expired. Triggering silent token rotation...'
                    );
                } catch (retryError) {
                    isRefreshing = false;
                    log.error('Silent Re-authentication lifecycle broke');
                    window.location.href = '/auth/login?expired=true';
                    return Promise.reject(retryError);
                }
            }

            error.apiError = standardError;
            return Promise.reject(standardError);
        }
    );
};
export const authApi = createSecureInstance();
export const deliveryApi = createSecureInstance();
export const paymentApi = createSecureInstance();
export const adminAPI = createSecureInstance();
export const userApi = createSecureInstance();
export const ticketApi = createSecureInstance();
export const notificationApi = createSecureInstance();
export const appInstances = [
    authApi,

    ticketApi,
    deliveryApi,
    adminAPI,
    notificationApi,
    userApi,
    paymentApi,
];
appInstances.forEach(applyInterceptors);
