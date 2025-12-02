import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Check, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner'; // Notificações
import confetti from 'canvas-confetti'; // Confete
import Button from '@/components/Button'; // Nosso botão novo

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- ESSA PARTE É CRUCIAL (Busca todos os produtos para criar as rotas) ---
export async function getStaticPaths() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error("Falha na API");
    const products = await res.json();

    const paths = products.map((p) => ({
      params: { slug: p.slug }
    }));

    return { paths, fallback: 'blocking' };
  } catch (err) {
    console.warn("⚠️ Backend offline durante o build. Gerando caminhos vazios.");
    // Retorna lista vazia para o build passar
    return { paths: [], fallback: 'blocking' };
  }
}
// --- ESSA PARTE TAMBÉM (Busca os dados de UM produto específico) ---
export async function getStaticProps({ params }) {
  try {
    const res = await fetch(`${API_URL}/products/${params.slug}`);

    // Se o backend disser que não existe (404), retornamos 404 no front
    if (!res.ok) return { notFound: true };

    const product = await res.json();
    return { props: { product }, revalidate: 10 };
  } catch (err) {
    console.error("Erro no getStaticProps:", err);
    return { notFound: true };
  }
}
// --------------------------------------------------------------------------

export default function ProductPage({ product }) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);

    // 1. Montar o payload
    const payload = {
      items: [
        {
          product_id: product.id,
          quantity: 1
        }
      ]
    };

    try {
      const res = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao processar compra');
      }

      // 2. SUCESSO!
      toast.success(`Pedido #${data.order_id} confirmado! Enviamos um email.`);

      // Efeito visual de confete
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#ffffff', '#000000']
      });

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Se o fallback estiver carregando (raro com 'blocking', mas boa prática)
  if (!product) return <div>Carregando...</div>;

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

            {/* BOTÃO */}
            <Button
              onClick={handleBuy}
              isLoading={loading}
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