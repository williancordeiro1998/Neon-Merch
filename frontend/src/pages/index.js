import Head from 'next/head';
import Link from 'next/link';
import { ShoppingCart, Zap, Search } from 'lucide-react';
import { useCart } from '@/context/useCart';
import { useState, useEffect } from 'react';

// URL da API (Fallback para localhost se não houver variável de ambiente)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 1. O Next.js roda isso no SERVIDOR antes de criar a página HTML
export async function getStaticProps() {
  try {
    // Tenta pegar produtos do Backend
    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();
    return {
      props: { products },
      revalidate: 10 // Revalida a cada 10 segundos (ISR)
    };
  } catch (error) {
    console.error("Erro ao buscar API:", error);
    // Se a API estiver offline, retorna array vazio para não quebrar o site
    return { props: { products: [] } };
  }
}

export default function Home({ products }) {
  // Conecta ao Zustand
  const { items, add } = useCart();
  const [mounted, setMounted] = useState(false);

  // Evita erro de hidratação do Zustand
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Head><title>Neon Merch</title></Head>

      {/* HEADER */}
      <header className="fixed w-full top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="text-green-400" />
            <span className="text-2xl font-bold tracking-tighter text-white">
              NEON<span className="text-green-400 text-glow">MERCH</span>
            </span>
          </div>

          <div className="relative">
            <ShoppingCart className="text-slate-200 w-6 h-6" />
            {mounted && items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* LISTA DE PRODUTOS */}
      <main className="flex-grow pt-24 pb-20 px-4 max-w-7xl mx-auto w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Coleção <span className="text-green-400">2077</span>
        </h1>

        {products.length === 0 ? (
          <div className="text-center text-slate-500 mt-20">
            <p>Sistemas offline... (Nenhum produto encontrado ou API desligada)</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-green-500 transition duration-300 group">
                {/* Imagem Placeholder se não tiver URL */}
                <div className="h-64 bg-slate-900 flex items-center justify-center overflow-hidden">
                   <img
                     src={product.image_url || `https://via.placeholder.com/400?text=${product.slug}`}
                     alt={product.title}
                     className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition"
                   />
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">{product.title}</h2>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-2xl font-mono text-green-400">
                      R$ {(product.price_cents / 100).toFixed(2).replace('.', ',')}
                    </span>
                    <div className="flex gap-2">
                      <Link href={`/products/${product.slug}`} className="px-3 py-2 text-sm bg-slate-700 rounded hover:bg-slate-600">
                        Ver
                      </Link>
                      <button
                        onClick={() => add(product)}
                        className="px-3 py-2 bg-green-500 text-black font-bold rounded hover:bg-green-400 transition shadow-[0_0_10px_rgba(74,222,128,0.3)]"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}