import { BaseRepository } from './base.repository.js';
import { Order } from '../types/index.js';

export class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super('orders');
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.find({
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.findOne([{ field: 'orderNumber', operator: '==', value: orderNumber }]);
  }

  async findByResellerId(resellerId: string): Promise<Order[]> {
    // Return orders containing items belonging to this reseller
    const allOrders = await this.find({ orderBy: { field: 'createdAt', direction: 'desc' } });
    return allOrders.filter(order => order.items.some(item => item.resellerId === resellerId));
  }
}

export const orderRepository = new OrderRepository();
