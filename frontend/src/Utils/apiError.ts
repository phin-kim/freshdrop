import axios from 'axios';

const handleApiError = (
    error: unknown,
    setError: (message: string) => void
): void => {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            console.error('ERROR:Server responded with an error', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
            });
            const message =
                error.response.data?.error?.message ||
                error.response.data?.error ||
                error.response.data?.message ||
                'Something went wrong on the server';
            setError(message);
            return;
        }
        if (error.request) {
            console.error('No response received from server', error.request);
            setError('Network error:Server not responding or offline');
            return;
        }
        console.error('Axios configuration error:', error.message);
        setError(error.message);
        return;
    }
    //handle custom rejected objects(e.g. from interceptors)
    if (typeof error === 'object' && error !== null && 'message' in error) {
        setError((error as { message: string }).message);

        return;
    }
    //native js errors
    if (error instanceof Error) {
        console.error('Unexpected JS error:', error.message);
        setError(error.message);
        return;
    }
    console.error('Unknown error: ', error);
    setError('Unknown error occurred');
};
export default handleApiError;
