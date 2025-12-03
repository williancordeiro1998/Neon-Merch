import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Check, ShieldCheck, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import Button from '@/components/Button';

// Configuração para Vercel
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 1. Diz ao Next.js para criar as páginas conforme forem acessadas
export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

// 2. Apenas passa o SLUG para o componente, sem buscar dados no servidor (evita erro de URL relativa)
export async function getStaticProps({ params }) {
  return {
    props: { slug: params.slug },
    revalidate: 10
  };
}

export default function ProductPage({ slug }) {
  const [product, setProduct] = useState(null);
  const [loadingData, setLoadingData] = useState(true); // Carregando os dados da página
  const [buying, setBuying] = useState(false); // Carregando o botão de compra

  // 3. Busca os dados no Navegador (Onde o /api funciona)
  useEffect(() => {
    if (!slug) return;

    // Tenta buscar usando rota relativa primeiro (Vercel)
    const fetchProduct = async () => {
      try {
        // Tenta rota relativa
        const res = await fetch(`/api/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else {
            // Se falhar, tenta rota absoluta (Localhost fallback)
            const resLocal = await fetch(`${API_URL}/products/${slug}`);
            if (resLocal.ok) {
                const dataLocal = await resLocal.json();
                setProduct(dataLocal);
            } else {
                toast.error("Produto não encontrado");
            }
        }
      } catch (error) {
        console.error("Erro ao carregar produto:", error);
        toast.error("Erro de conexão");
      } finally {
        setLoadingData(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleBuy = async () => {
    if (!product) return;
    setBuying(true);

    const payload = {
      items: [{ product_id: product.id, quantity: 1 }]
    };

    try {
      // Tenta rota relativa para checkout
      const res = await fetch(`/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Erro ao processar compra');

      toast.success(`Pedido #${data.order_id} confirmado! Enviamos um email.`);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#4ade80', '#ffffff'] });

    } catch (error) {
      toast.error(error.message);
    } finally {
      setBuying(false);
    }
  };

  // Loading State da Página
  if (loadingData) {
      return (
          <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-green-500" />
          </div>
      );
  }

  // Erro 404 Visual
  if (!product) {
      return (
          <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
              <h1 className="text-4xl font-bold mb-4">Produto não encontrado</h1>
              <Link href="/" className="text-green-400 hover:underline">Voltar para a loja</Link>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in-up">

        {/* Coluna Imagem */}
        <div className="relative group">
           <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <img
             src={product.image_url || `https://via.placeholder.com/600`}
             alt={product.title}
             className="relative z-10 w-full rounded-2xl border border-slate-700 shadow-2xl hover:scale-[1.02] transition duration-500"
           />
        </div>

        {/* Coluna Infos */}
        <div className="flex flex-col justify-center space-y-6">
          <Link href="/" className="flex items-center text-slate-400 hover:text-green-400 transition w-fit">
            <ArrowLeft size={20} className="mr-2" /> Voltar para Loja
          </Link>

          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{product.title}</h1>
            {product.stock > 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200 border border-green-700">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Em Estoque ({product.stock})
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-200 border border-red-700">
                Esgotado
              </span>
            )}
          </div>

          <p className="text-lg text-slate-300 leading-relaxed border-l-2 border-green-500/30 pl-4">
            {product.description}
          </p>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <span className="text-slate-400">Total</span>
              <span className="text-4xl font-mono font-bold text-white">
                R$ {(product.price_cents / 100).toFixed(2).replace('.', ',')}
              </span>
            </div>

            <Button
              onClick={handleBuy}
              isLoading={buying}
              disabled={product.stock <= 0}
              className="w-full text-lg"
            >
              {product.stock > 0 ? (
                <>
                   <ShoppingCart className="mr-2" /> COMPRAR AGORA
                </>
              ) : (
                "INDISPONÍVEL"
              )}
            </Button>

            <div className="mt-4 flex justify-center items-center text-xs text-slate-500 gap-2">
               <ShieldCheck size={14} /> Pagamento 100% Seguro via Stripe (Simulado)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}