import { Navigate, Outlet } from 'react-router';

import { authClient } from '../../lib/auth-client';

//import { useAuthStore } from '../../Store/authStore';
//import createClientLogger from '../../Utils/clientLogger';

//const log = createClientLogger('ProtectedRoutes');
function ProtectedRoutes() {
    /*const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    log.info(
        `checking if the user is authenticated ${isAuthenticated ? 'YES' : 'NO'}`
    );
    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }*/
    const { data: session, isPending } = authClient.useSession();

    if (isPending) return <div>Loading...</div>;

    // 1. If no session, go to login
    if (!session)
        return (
            <Navigate
                to={`/auth/login?redirect=${location.pathname}`}
                replace
            />
        );

    // 2. If logged in BUT not verified, force them to the OTP page!
    if (session.user && !session.user.emailVerified) {
        return <Navigate to="/auth/verify-otp" replace />;
    }
    return <Outlet />;
}
export default ProtectedRoutes;
