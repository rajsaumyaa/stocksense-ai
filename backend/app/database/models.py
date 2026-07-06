import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Text
from sqlalchemy.orm import relationship
from .connection import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    product_name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    supplier = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    
    # Relationships
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="product", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="product", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="product", cascade="all, delete-orphan")

class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_stock = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=10)
    warehouse = Column(String(100), nullable=False)
    
    # Relationships
    product = relationship("Product", back_populates="inventory")

class Sale(Base):
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    sale_date = Column(Date, nullable=False)
    revenue = Column(Float, nullable=False)
    
    # Relationships
    product = relationship("Product", back_populates="sales")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    recommendation = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)
    generated_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="recommendations")

class Forecast(Base):
    __tablename__ = "forecast"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    predicted_sales = Column(Float, nullable=False)
    forecast_date = Column(Date, nullable=False)
    stockout_probability = Column(Float, nullable=False, default=0.0)
    
    # Relationships
    product = relationship("Product", back_populates="forecasts")
