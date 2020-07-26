import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    // TODO

    const product = await this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findName = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findName;
    // TODO
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    // TODO

    const productsById = await this.ormRepository.find({
      where: { id: In(products.map(product => product.id)) },
    });
    return productsById;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    // TODO
    const productsUpdated = await Promise.all(
      products.map(async product => {
        const productToUpdate = await this.ormRepository.findOne(product.id);
        if (productToUpdate) {
          if (productToUpdate.quantity < product.quantity)
            throw new AppError(
              `You don't have necessary quantity of the product ${product.id}`,
            );
          productToUpdate.quantity = product.quantity;
          return this.ormRepository.save(productToUpdate);
        }
        return {} as Product;
      }),
    );
    return productsUpdated;
  }
}

export default ProductsRepository;
