import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router.tsx'
import { AppInitializer } from './components/AppInitializer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppInitializer>
      <RouterProvider router={router} />
    </AppInitializer>
  </StrictMode>,
)