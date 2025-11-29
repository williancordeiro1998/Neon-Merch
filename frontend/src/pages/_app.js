import '../styles/globals.css'
import { Toaster } from 'sonner' // <--- Importe isso

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      {/* Configuração visual das notificações (Dark Mode) */}
      <Toaster position="bottom-right" theme="dark" richColors />
    </>
  )
}