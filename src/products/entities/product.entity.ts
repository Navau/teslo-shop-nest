import { IsDecimal, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { User } from '../../auth/entities/user.entity';

@Entity({ name: 'products' })
export class Product {
  @ApiProperty({
    example: '29afd3d5-5057-4d60-901c-70c57a5184b4',
    description: 'Product ID',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'T-Shit Teslo',
    description: 'Product Title',
    uniqueItems: true,
  })
  @Column('text', { unique: true })
  title: string;

  @ApiProperty({
    example: 100,
    description: 'Product Price',
    minimum: 0,
    maximum: 100000,
    default: 0,
    type: 'number',
  })
  @Column('float', { default: 0 })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsDecimal({ decimal_digits: '1,2', locale: 'en-US' })
  price: number;

  @ApiProperty({
    example: 'Product description',
    description: 'Product description',
    type: 'text',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    example: 'product-slug',
    description: 'Product slug - for SEO',
    uniqueItems: true,
    type: 'text',
  })
  @Column('text', { unique: true })
  slug: string;

  @ApiProperty({
    example: 100,
    description: 'Product stock',
    minimum: 0,
    maximum: 100000,
    default: 0,
    type: 'number',
  })
  @Column('int', { default: 0 })
  stock: number;

  @ApiProperty({
    example: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Product sizes',
    type: 'text',
  })
  @Column('text', { array: true })
  sizes: string[];

  @ApiProperty({
    example: ['men', 'women', 'kid', 'unisex'],
    description: 'Product gender',
    type: 'text',
  })
  @Column('text')
  gender: string;

  @ApiProperty({
    example: ['tshirt', 'hoodie', 'sweatshirt'],
    description: 'Product tags',
    type: 'text',
  })
  @Column('text', { array: true, default: [] })
  tags: string[];

  @ApiProperty({
    description: 'Product images',
  })
  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];

  // eager: Carga automaticamente la relacion
  @ManyToOne(() => User, (user) => user.product, { eager: true })
  user: User;

  @BeforeInsert()
  checkSlugInsert() {
    this.price = Math.round(this.price * 100) / 100;
    if (!this.slug) this.slug = this.title;

    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '')
      .replaceAll('`', '');
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.title
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '')
      .replaceAll('`', '');
  }
}
