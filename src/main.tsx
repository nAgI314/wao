import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// import Test from './Test.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className='flex justify-center items-center bg-green-400'>
      <App />
    </div>
  </StrictMode>,
)
