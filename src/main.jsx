import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./vendor/normalize.css";
import "./vendor/fonts.css";
import App from "../src/components/App/App";
import { BrowserRouter } from "react-router-dom";

const basename = import.meta.env.VITE_BASENAME || '';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
