import Head from 'next/head';
import Link from 'next/link';
import { ShoppingCart, Zap, Search, RefreshCw } from 'lucide-react';
import { useCart } from '@/context/useCart';
import { useState, useEffect } from 'react';

// URL relativa para funcionar na Vercel (/api) ou absoluta local
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getStaticProps() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error("API Offline no Build");
    const products = await res.json();
    return {
      props: { initialProducts: products },
      revalidate: 10
    };
  } catch (error) {
    // Se falhar no build (normal na Vercel), retorna vazio e o cliente busca depois
    return {
      props: { initialProducts: [] },
      revalidate: 10
    };
  }
}

export default function Home({ initialProducts }) {
  const { items, add } = useCart();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Se a página veio vazia do servidor, busca no navegador (Client-side Fetch)
    if (initialProducts.length === 0) {
      fetchProducts();
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Tenta buscar na rota relativa /api/products
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

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
          Coleção <span className="text-green-400">Future</span>
        </h1>

        {loading && (
          <div className="flex justify-center my-10">
            <RefreshCw className="animate-spin text-green-500 w-8 h-8" />
          </div>
        )}

        {products.length === 0 && !loading ? (
          <div className="text-center text-slate-500 mt-20">
            <p>Sistemas inicializando...</p>
            <button onClick={fetchProducts} className="mt-4 text-green-400 underline">Tentar novamente</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-green-500 transition duration-300 group">
                <div className="h-64 bg-slate-900 flex items-center justify-center overflow-hidden relative">
                   <img
                     src={product.image_url}
                     alt={product.title}
                     className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition group-hover:scale-105 duration-500"
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