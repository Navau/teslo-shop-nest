import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dts';
import { validate as isUUID } from 'uuid';
import { isNull, isUndefined, map, size } from 'lodash';
import { ProductImage } from './entities';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}
  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: map(images, (image) =>
          this.productImageRepository.create({ url: image }),
        ),
        user,
      });
      await this.productRepository.save(product);
      return { ...product, images };
    } catch (err) {
      this.handleDBExceptions(err);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    try {
      const products = await this.productRepository.find({
        take: limit,
        skip: offset,
        relations: {
          images: true,
        },
      });
      return map(products, (product) => ({
        ...product,
        images: map(product.images, 'url'),
      }));
    } catch (err) {
      this.handleDBExceptions(err);
    }
  }

  async findOne(term: string) {
    let product: Product;
    try {
      if (isUUID(term))
        product = await this.productRepository.findOneBy({
          id: term,
        });
      else {
        const queryBuilder = this.productRepository.createQueryBuilder('prod');
        product = await queryBuilder
          .where('UPPER(title)=:title OR LOWER(slug)=:slug', {
            title: term.toUpperCase(),
            slug: term.toLowerCase(),
          })
          .leftJoinAndSelect('prod.images', 'prodImages')
          .getOne();
      }
    } catch (err) {
      this.handleDBExceptions(err);
    }
    if (isNull(product))
      throw new NotFoundException(`Product '${term}' not found`);
    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...product } = await this.findOne(term);
    return { ...product, images: map(images, 'url') };
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images, ...toUpdate } = updateProductDto;
    const product = await this.productRepository.preload({ id, ...toUpdate });
    if (isUndefined(product))
      throw new NotFoundException(`Product ${id} not found`);

    // Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (size(images) > 0) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = map(images, (image) =>
          this.productImageRepository.create({ url: image }),
        );
      } else {
        product.images = await this.productImageRepository.findBy({
          product: { id },
        });
      }
      product.user = user;
      await queryRunner.manager.save(product);
      // return await this.productRepository.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      // return product;
      return this.findOnePlain(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(err);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    try {
      await this.productRepository.remove(product);
      return product;
    } catch (err) {
      this.handleDBExceptions(err);
    }
  }

  private handleDBExceptions(err: any) {
    if (err.code === '23505') throw new BadRequestException(err.detail);
    this.logger.error(err);
    throw new InternalServerErrorException(
      'Unexpected error ocurred - check server logs',
    );
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query.delete().where({}).execute();
    } catch (err) {
      this.handleDBExceptions(err);
    }
  }
}
