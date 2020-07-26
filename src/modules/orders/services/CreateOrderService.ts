import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) throw new AppError("CUstomer doesn't exists");
    // TODO
    const productsById = await this.productsRepository.findAllById(
      products.map(product => ({ id: product.id })),
    );

    if (productsById.length !== products.length)
      throw new AppError("One or more products doesn't exists");

    const arrayToSaveProducts: IUpdateProductsQuantityDTO[] = [];
    const order = await this.ordersRepository.create({
      customer,
      products: productsById.map(p => {
        let quantity = 0;
        const productToSave = products.find(product => product.id === p.id);

        if (productToSave) {
          if (productToSave.quantity > p.quantity) {
            throw new AppError(
              `The product ${p.id} has insuficiente quantity. Requested quantity: ${productToSave.quantity} disponible quantity: ${p.quantity} units`,
            );
          }
          quantity = productToSave.quantity;
          arrayToSaveProducts.push({
            id: p.id,
            quantity: p.quantity - productToSave?.quantity,
          });
        }
        return {
          price: p.price,
          quantity,
          product_id: p.id,
        };
      }),
    });

    await this.productsRepository.updateQuantity(arrayToSaveProducts);

    if (order) {
      return order;
    }
    return {} as Order;
  }
}

export default CreateOrderService;
