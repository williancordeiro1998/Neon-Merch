import asyncio
import os
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from typing import List

from .db import init_db, get_session, engine
from .models import Product, Order, OrderItem, CheckoutReq, User
from .auth import get_password_hash, verify_password, create_access_token, get_current_user

# --- CORREÇÃO PARA VERCEL ---
# Define o caminho raiz como "/api" se estiver na Vercel, senão usa raiz vazia
root_path = "/api" if os.getenv("VERCEL") else ""

app = FastAPI(title="Neon Merch API", root_path=root_path)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    # Cria usuário admin e produtos automaticamente ao iniciar
    with Session(engine) as session:
        # 1. Cria Admin
        if not session.exec(select(User).where(User.username == "admin")).first():
            admin = User(username="admin", password_hash=get_password_hash("neon123"))
            session.add(admin)

        # 2. LISTA MASSIVA DE 18 PRODUTOS (Para o Portfólio)
        products_to_create = [
            # --- COMPUTADORES & SETUP ---
            {
                "slug": "cyber-setup-pro",
                "title": "Cyber Setup Pro",
                "description": "Setup completo com iluminação RGB, refrigeração líquida e RTX 4090.",
                "price_cents": 2500000,
                "stock": 5,
                "image_url": "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "monitor-ultrawide-neon",
                "title": "Monitor Odyssey Neon",
                "description": "49 polegadas, OLED, curvatura 1000R para imersão total.",
                "price_cents": 850000,
                "stock": 8,
                "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "gabinete-transparente",
                "title": "Case Crystal Flow",
                "description": "Gabinete full-tower de vidro temperado com 12 fans RGB.",
                "price_cents": 120000,
                "stock": 15,
                "image_url": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80"
            },

            # --- PERIFÉRICOS ---
            {
                "slug": "teclado-mecanico-cyber",
                "title": "Teclado Mech Cyber",
                "description": "Switches ópticos, keycaps pudding e base de alumínio.",
                "price_cents": 45000,
                "stock": 25,
                "image_url": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "mouse-ultralight",
                "title": "Mouse Zero Gravity",
                "description": "Apenas 49g, sensor 26k DPI e conexão wireless sem delay.",
                "price_cents": 35000,
                "stock": 30,
                "image_url": "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "headset-void",
                "title": "Headset Void Pro",
                "description": "Cancelamento de ruído ativo e áudio espacial 360 graus.",
                "price_cents": 89000,
                "stock": 12,
                "image_url": "https://images.unsplash.com/photo-1596207891316-23054388978f?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "microfone-streamer",
                "title": "Mic Studio Neon",
                "description": "Qualidade de estúdio, braço articulado e pop filter incluso.",
                "price_cents": 65000,
                "stock": 10,
                "image_url": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80"
            },

            # --- VESTUÁRIO / WEARABLES ---
            {
                "slug": "hoodie-hacker",
                "title": "Hoodie Hacker V2",
                "description": "Tecido tecnológico impermeável com detalhes refletivos.",
                "price_cents": 25000,
                "stock": 50,
                "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "oculos-vr-pro",
                "title": "VR Headset X",
                "description": "Realidade virtual 8K sem fios. O metaverso espera.",
                "price_cents": 350000,
                "stock": 5,
                "image_url": "https://images.unsplash.com/photo-1622979135228-51122a871b86?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "smartwatch-titanium",
                "title": "Watch Ultra Ti",
                "description": "Corpo em titânio, tela safira e bateria nuclear (quase).",
                "price_cents": 450000,
                "stock": 15,
                "image_url": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "mochila-tech",
                "title": "Backpack Anti-Theft",
                "description": "Carregamento USB externo, compartimento para laptop 17 e à prova d'água.",
                "price_cents": 19990,
                "stock": 40,
                "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"
            },

            # --- DECORAÇÃO & LIFESTYLE ---
            {
                "slug": "neon-sign-open",
                "title": "Neon Sign 'Open'",
                "description": "Luz neon real em vidro, estilo bar cyberpunk anos 80.",
                "price_cents": 35000,
                "stock": 20,
                "image_url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "nanoleaf-panels",
                "title": "Paineis Hexagonais",
                "description": "Kit com 9 painéis RGB inteligentes controlados por voz.",
                "price_cents": 90000,
                "stock": 30,
                "image_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "cadeira-gamer",
                "title": "Throne Chair Elite",
                "description": "Ergonomia total, suporte lombar 4D e tecido respirável.",
                "price_cents": 180000,
                "stock": 7,
                "image_url": "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "mesa-elevatoria",
                "title": "Standing Desk Pro",
                "description": "Mesa com regulagem de altura elétrica e memória.",
                "price_cents": 220000,
                "stock": 10,
                "image_url": "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=800&q=80"
            },

            # --- GADGETS ---
            {
                "slug": "drone-fpv",
                "title": "Drone Racer FPV",
                "description": "Voe a 140km/h com óculos de imersão incluídos.",
                "price_cents": 450000,
                "stock": 3,
                "image_url": "https://images.unsplash.com/photo-1506947411487-a56738267384?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "console-retro",
                "title": "Retro Handheld",
                "description": "Roda todos os jogos clássicos até PS1. Tela IPS.",
                "price_cents": 40000,
                "stock": 100,
                "image_url": "https://images.unsplash.com/photo-1592840496073-180e6669c3ce?auto=format&fit=crop&w=800&q=80"
            },
            {
                "slug": "camera-instantanea",
                "title": "InstaCam Neon",
                "description": "Fotos analógicas instantâneas com flash colorido.",
                "price_cents": 55000,
                "stock": 45,
                "image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"
            }
        ]

        # 3. Loop de criação (Só cria se não existir)
        for prod_data in products_to_create:
            if not session.exec(select(Product).where(Product.slug == prod_data["slug"])).first():
                new_prod = Product(**prod_data)
                session.add(new_prod)

        session.commit()


# --- SIMULAÇÃO DE WORKER (WEBHOOK/EMAIL) ---
def send_confirmation_email(email: str, order_id: int):
    # Aqui entraria o código real (SMTP, SendGrid, AWS SES)
    # Como é um worker, isso roda "em segundo plano"
    import time
    print(f"📧 [Worker] Iniciando envio de email para Pedido #{order_id}...")
    time.sleep(5)  # Simula demora
    print(f"✅ [Worker] Email enviado para Pedido #{order_id}!")


# --- ROTAS DE AUTH ---
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Usuário ou senha incorretos")

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# --- ROTAS DE PRODUTOS (Públicas) ---
@app.get("/products", response_model=List[Product])
async def get_products(session: Session = Depends(get_session)):
    return session.exec(select(Product)).all()


@app.get("/products/{slug}", response_model=Product)
async def get_product(slug: str, session: Session = Depends(get_session)):
    product = session.exec(select(Product).where(Product.slug == slug)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return product


# --- ROTA DE CHECKOUT (Lógica de Estoque) ---
@app.post("/checkout")
async def checkout(
        cart: CheckoutReq,
        background_tasks: BackgroundTasks,  # Injeção do Worker
        session: Session = Depends(get_session)
):
    # 1. Iniciar Transação (Implícito no SQLModel Session)
    total_price = 0
    new_order_items = []

    # 2. Verificar Estoque de CADA item
    for item in cart.items:
        product = session.get(Product, item.product_id)

        if not product:
            raise HTTPException(404, detail=f"Produto ID {item.product_id} não existe")

        if product.stock < item.quantity:
            raise HTTPException(400, detail=f"Estoque insuficiente para: {product.title}. Restam: {product.stock}")

        # 3. Decrementar Estoque (Lógica Crítica)
        product.stock -= item.quantity
        session.add(product)  # Prepara atualização

        # Calcula preço total
        total_price += product.price_cents * item.quantity

        # Cria o item do pedido
        order_item = OrderItem(
            order_id=0,  # Será preenchido depois
            product_id=product.id,
            quantity=item.quantity,
            price_at_purchase=product.price_cents
        )
        new_order_items.append(order_item)

    # 4. Criar o Pedido
    order = Order(total_cents=total_price, status="paid")
    session.add(order)
    session.commit()  # AQUI é onde o estoque é baixado de verdade no banco
    session.refresh(order)

    # 5. Associar itens ao pedido criado
    for item in new_order_items:
        item.order_id = order.id
        session.add(item)
    session.commit()

    # 6. Disparar Worker (Não bloqueia a resposta pro usuário)
    background_tasks.add_task(send_confirmation_email, "cliente@email.com", order.id)

    return {"status": "success", "order_id": order.id, "message": "Compra realizada!"}


# --- ROTAS PROTEGIDAS (Admin) ---
@app.post("/admin/products", response_model=Product)
async def create_prod(
        product: Product,
        user: User = Depends(get_current_user),  # <--- Só acessa se tiver logado!
        session: Session = Depends(get_session)
):
    session.add(product)
    session.commit()
    session.refresh(product)
