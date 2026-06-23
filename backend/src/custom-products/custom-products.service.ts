import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface CustomProduct {
  id: string;
  name: string;
  code: string;
  price: number;
  updatedAt: string;
}

export interface CustomPriceHistory {
  id: string;
  product: string;
  oldPrice: number;
  newPrice: number;
  date: string;
  adminId: string;
}

@Injectable()
export class CustomProductsService {
  private productsPath = path.join(process.cwd(), 'custom-products.json');
  private historyPath = path.join(process.cwd(), 'custom-products-history.json');

  private readJsonFile(filePath: string): any[] {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(`Failed to read file ${filePath}:`, e);
    }
    return [];
  }

  private writeJsonFile(filePath: string, data: any[]): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error(`Failed to write file ${filePath}:`, e);
    }
  }

  getProducts(): CustomProduct[] {
    return this.readJsonFile(this.productsPath);
  }

  createProduct(name: string, code: string, initialPrice: number, adminId: string): CustomProduct {
    const products = this.getProducts();
    const cleanCode = code.toUpperCase().trim();
    
    // Check if duplicate code exists
    if (products.some(p => p.code === cleanCode) || cleanCode === 'PMS' || cleanCode === 'AGO') {
      throw new ConflictException('Product code already exists');
    }

    const newProduct: CustomProduct = {
      id: Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      code: cleanCode,
      price: initialPrice,
      updatedAt: new Date().toISOString(),
    };

    products.push(newProduct);
    this.writeJsonFile(this.productsPath, products);

    // Save initial history
    this.addHistoryRecord(cleanCode, 0, initialPrice, adminId);

    return newProduct;
  }

  updateProductPrice(id: string, newPrice: number, adminId: string): CustomProduct {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new NotFoundException('Product not found');
    }

    const product = products[index];
    const oldPrice = product.price;
    if (oldPrice === newPrice) return product;

    product.price = newPrice;
    product.updatedAt = new Date().toISOString();
    
    products[index] = product;
    this.writeJsonFile(this.productsPath, products);

    // Save history
    this.addHistoryRecord(product.code, oldPrice, newPrice, adminId);

    return product;
  }

  getHistory(): CustomPriceHistory[] {
    return this.readJsonFile(this.historyPath);
  }

  private addHistoryRecord(productCode: string, oldPrice: number, newPrice: number, adminId: string) {
    const history = this.getHistory();
    const record: CustomPriceHistory = {
      id: Math.random().toString(36).substring(2, 11),
      product: productCode,
      oldPrice,
      newPrice,
      date: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      adminId,
    };
    history.unshift(record);
    this.writeJsonFile(this.historyPath, history);
  }

  deleteProduct(id: string): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new NotFoundException('Product not found');
    }
    const filteredProducts = products.filter(p => p.id !== id);
    this.writeJsonFile(this.productsPath, filteredProducts);
  }

  deleteHistoryRecord(id: string): void {
    const history = this.getHistory();
    const filteredHistory = history.filter(h => h.id !== id);
    this.writeJsonFile(this.historyPath, filteredHistory);
  }
}
