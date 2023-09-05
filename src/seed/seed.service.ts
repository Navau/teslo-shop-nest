import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';
import { forEach, map } from 'lodash';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  async runSeeds() {
    await this.deleteTables();
    const adminUser = await this.insertUsers();

    return await this.insertNewProductsIntoDB(adminUser);
  }

  private async deleteTables() {
    await this.productsService.deleteAllProducts();
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }

  private async insertUsers() {
    const seedUsers = initialData.users;

    forEach(seedUsers, (user) => {
      user.password = bcrypt.hashSync(user.password, 10);
      return this.userRepository.create(user);
    });
    const dbUsers = await this.userRepository.save(seedUsers);

    return dbUsers[0];
  }

  private async insertNewProductsIntoDB(user: User) {
    await this.productsService.deleteAllProducts();
    const products = initialData.products;
    const insertPromises = map(products, (product) => {
      return this.productsService.create(product, user);
    });

    const results = await Promise.all(insertPromises);
    return results;
  }
}
