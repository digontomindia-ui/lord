import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import { assertTransition } from '../src/services/orderStateMachine.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  await Order.deleteMany({});
});

describe('Order State Machine & Race Conditions', () => {
  
  test('assertTransition rejects out-of-order calls', () => {
    // Attempting to jump from ORDER_CREATED to WORK_STARTED (bypassing pickup)
    expect(() => assertTransition('ORDER_CREATED', 'WORK_STARTED', 'SHOP'))
      .toThrow('Illegal state transition');
      
    // Attempting invalid role
    expect(() => assertTransition('PICKUP_REQUESTED', 'PICKUP_ASSIGNED', 'SHOP'))
      .toThrow('Role SHOP is not permitted');
      
    // Legal transition
    expect(assertTransition('ORDER_CREATED', 'PICKUP_REQUESTED', 'SHOP')).toBe(true);
    expect(assertTransition('PICKUP_REQUESTED', 'PICKUP_ASSIGNED', 'SUPER_ADMIN')).toBe(true);
  });

  test('Race condition fix: concurrent modifications on the same order', async () => {
    const shopId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();
    
    let order = await Order.create({
      orderNumber: 'TEST-123',
      shopId,
      customerId,
      items: [{ garmentType: 'SUIT', quantity: 1, alterations: {} }],
      deliveryDate: new Date(),
      status: 'WORK_STARTED'
    });

    const processA_CurrentStatus = order.status;
    const processA_Updates = { $set: { status: 'WORK_IN_PROGRESS' } };

    // Process B updates first
    await Order.findOneAndUpdate(
      { _id: order._id, status: 'WORK_STARTED' },
      { $set: { status: 'WORK_COMPLETED' } }
    );

    // Process A executes with stale precondition
    const processA_Result = await Order.findOneAndUpdate(
      { _id: order._id, status: processA_CurrentStatus },
      processA_Updates,
      { new: true }
    );

    // The atomic precondition ensures Process A's stale update is prevented
    expect(processA_Result).toBeNull();
    
    const finalOrder = await Order.findById(order._id);
    expect(finalOrder.status).toBe('WORK_COMPLETED');
  });
});
