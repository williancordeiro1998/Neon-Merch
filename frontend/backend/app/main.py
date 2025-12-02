import asyncio
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from typing import List

from .db import init_db, get_session, engine
from .models import Product, Order, OrderItem, CheckoutReq, User
from .auth import get_password_hash, verify_password, create_access_token, get_current_user

app = FastAPI(title="Neon Merch API")

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
    # Cria usuário admin se não existir
    # CORREÇÃO: Usamos Session(engine) em vez de Session(next(get_session()))
    with Session(engine) as session:
        if not session.exec(select(User).where(User.username == "admin")).first():
            # Cria a senha hashada (senha: neon123)
            # Certifique-se de que get_password_hash está importado
            admin = User(username="admin", password_hash=get_password_hash("neon123"))
            session.add(admin)
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

# --- ADICIONE ESTA FUNÇÃO AQUI EMBAIXO: ---
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
    return product