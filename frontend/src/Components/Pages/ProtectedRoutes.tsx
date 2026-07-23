import { Navigate, Outlet } from 'react-router';

import { useAuthStore } from '../../Store/authStore';
import createClientLogger from '../../Utils/clientLogger';

const log = createClientLogger('ProtectedRoutes');
function ProtectedRoutes() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    log.info(
        `checking if the user is authenticated ${isAuthenticated ? 'YES' : 'NO'}`
    );
    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }
    return <Outlet />;
}
export default ProtectedRoutes;
