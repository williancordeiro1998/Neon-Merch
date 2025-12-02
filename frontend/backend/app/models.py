from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime


# Tabela de Usuários (Admin)
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str


# Tabela de Produtos (Com controle de versão para concorrência simples)
class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(index=True, unique=True)
    title: str
    description: str
    price_cents: int = 0
    stock: int = 0
    image_url: Optional[str] = None

    # Relacionamento: Um produto pode estar em vários itens de pedido
    order_items: List["OrderItem"] = Relationship(back_populates="product")


# Tabela de Pedidos
class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"  # pending, paid, shipped
    total_cents: int = 0

    items: List["OrderItem"] = Relationship(back_populates="order")


# Tabela de Ligação (Item do Pedido)
class OrderItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.id")
    product_id: int = Field(foreign_key="product.id")
    quantity: int
    price_at_purchase: int  # Importante: salvar o preço na hora da compra!

    order: Order = Relationship(back_populates="items")
    product: Product = Relationship(back_populates="order_items")


# Modelos para receber dados no Checkout (Pydantic puro, não vai pro DB)
class CartItemReq(SQLModel):
    product_id: int
    quantity: int


class CheckoutReq(SQLModel):
    items: List[CartItemReq]