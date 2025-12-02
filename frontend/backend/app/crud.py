from sqlmodel import Session, select
from typing import List, Optional
from .models import Product

def create_product(session: Session, product: Product) -> Product:
    session.add(product)
    session.commit()
    session.refresh(product)
    return product

def get_product_by_slug(session: Session, slug: str) -> Optional[Product]:
    statement = select(Product).where(Product.slug == slug)
    return session.exec(statement).first()

def list_products(session: Session) -> List[Product]:
    statement = select(Product)
    return session.exec(statement).all()

def update_stock(session: Session, product_id: int, delta: int) -> Optional[Product]:
    product = session.get(Product, product_id)
    if not product:
        return None
    product.stock += delta
    session.add(product)
    session.commit()
    session.refresh(product)
    return product