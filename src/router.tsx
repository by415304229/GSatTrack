import { createBrowserRouter } from 'react-router-dom';
import RouteGuard from './components/RouteGuard';
import HomePage from './pages/HomePage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <RouteGuard>
                <HomePage />
            </RouteGuard>
        ),
    },
]);