import { ProductDto } from '../../src/products/product.dto';

export const mockProductDto: ProductDto = {
  name: 'F-35 Ligntning 2',
  description:
    'The Lockheed Martin F-35 Lightning II is an American family of single-seat, single-engine, all-weather stealth multirole combat aircraft that is intended to perform both air superiority and strike missions. It is also able to provide electronic warfare and intelligence, surveillance, and reconnaissance capabilities.',
  price: '80000000.00',
  quantity: 4,
  location: 'United States',
  status: 'new',
};

export const mockProductUpdateDto: ProductDto = {
  name: 'F-35 Ligntning 2',
  description:
    'The Lockheed Martin F-35 Lightning II is an American family of single-seat, single-engine, all-weather stealth multirole combat aircraft that is intended to perform both air superiority and strike missions. It is also able to provide electronic warfare and intelligence, surveillance, and reconnaissance capabilities.',
  price: '79000000.00',
  quantity: 10,
  location: 'Germany',
  status: 'new',
};

export const mockFilename = 'test.jpg';
export const mockFilenameUpdate = 'better-test.jpg';
