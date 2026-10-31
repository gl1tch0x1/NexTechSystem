import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';

test('production payment guards and persistent uploads use isolated fixtures', async t => {
  const cwd = process.cwd(), root = fs.mkdtempSync(path.join(os.tmpdir(), 'nextech-platform-'));
  fs.mkdirSync(path.join(root,'backend','data_store'),{recursive:true}); process.chdir(root);
  for (const m of fs.readFileSync(new URL('../src/config/env.ts',import.meta.url),'utf8').matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) process.env[m[1]] = '';
  Object.assign(process.env,{NODE_ENV:'test',JWT_SECRET:'platform-test-only-key',ENABLE_MONGODB:'false',ENABLE_FIRESTORE_SYNC:'false',CLOUDFLARE_SECURITY_ENABLED:'false'});
  const { paymentController } = await import('../src/controllers/payment.controller.js');
  const { orderService } = await import('../src/services/order.service.js');
  let order: any = { id:'order_fixture',userId:'owner',paymentMethod:'CREDIT_CARD',paymentStatus:'PENDING',orderStatus:'PENDING',total:100 };
  let updates = 0;
  orderService.getOrderById = async () => order;
  orderService.updatePaymentStatus = async () => { updates++; return order; };
  const response = () => ({statusCode:200,body:undefined as any,status(n:number){this.statusCode=n;return this;},json(body:any){this.body=body;return this;}});
  try {
    await t.test('production never settles a card or bank-transfer payment from client claims', async()=>{
      process.env.NODE_ENV='production';
      for(const method of ['CREDIT_CARD','BANK_TRANSFER']) {
        order.paymentMethod=method; const res=response();
        await paymentController.verifyPayment({user:{id:'owner',role:'CUSTOMER'},body:{orderId:order.id,paymentId:'client-fabricated',status:'success'}} as any,res as any);
        assert.equal(res.statusCode,503); assert.equal(updates,0);
      }
    });
    await t.test('editors and resellers cannot read or settle another account payment',async()=>{
      for(const role of ['PRODUCT_EDITOR','RESELLER']) {
        const req={user:{id:'not-owner',role},params:{orderId:order.id},body:{orderId:order.id,provider:'TAMARA'}};
        for(const handler of ['getPaymentStatus','verifyPayment','initiatePaymentSession'] as const){
          const res=response();await paymentController[handler](req as any,res as any); assert.equal(res.statusCode,403);
        }
      }
    });
    await t.test('unconfigured live gateway and mismatched/paid orders never create a fake checkout',async()=>{
      order.paymentMethod='TAMARA';
      let res=response();await paymentController.initiatePaymentSession({user:{id:'owner',role:'CUSTOMER'},body:{orderId:order.id,provider:'TAMARA'}} as any,res as any);assert.equal(res.statusCode,503);
      res=response();await paymentController.initiatePaymentSession({user:{id:'owner',role:'CUSTOMER'},body:{orderId:order.id,provider:'TABBY'}} as any,res as any);assert.equal(res.statusCode,409);
      order.paymentStatus='PAID';res=response();await paymentController.initiatePaymentSession({user:{id:'owner',role:'CUSTOMER'},body:{orderId:order.id,provider:'TAMARA'}} as any,res as any);assert.equal(res.statusCode,409);assert.equal(updates,0);
      process.env.NODE_ENV='test';
    });
    const {userRepository}=await import('../src/repositories/user.repository.js');
    const {productRepository}=await import('../src/repositories/product.repository.js');
    for(const role of ['ADMIN','CUSTOMER'])await userRepository.create({id:role,email:role+'@example.invalid',role,isActive:true} as any);
    productRepository.find=async()=>[{id:'suppress-seed'}] as any;
    const {createApp}=await import('../src/app.js');const server=createApp().listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
    try{
      const base=`http://127.0.0.1:${(server.address() as any).port}/api/upload`;
      await t.test('uploads reject forged/customer tokens and persist valid images byte-for-byte',async()=>{
        const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7XcAAAAASUVORK5CYII=','base64');
        const send=async(token:string,b:Uint8Array=bytes)=>{const form=new FormData();form.append('file',new Blob([b as BlobPart],{type:'image/png'}),'image.png');return fetch(base,{method:'POST',headers:{authorization:'Bearer '+token},body:form});};
        assert.equal((await send('fake')).status,401);
        assert.equal((await send(jwt.sign({id:'CUSTOMER'},process.env.JWT_SECRET!))).status,403);
        const token=jwt.sign({id:'ADMIN'},process.env.JWT_SECRET!);
        assert.equal((await send(token,new TextEncoder().encode('<html>invalid</html>'))).status,400);
        const r=await send(token);assert.equal(r.status,201);const data=await r.json() as any;
        const downloaded=await fetch(new URL(data.url,base));assert.equal(downloaded.status,200);assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),bytes);
      });
    }finally{await new Promise<void>(r=>server.close(()=>r()));}
  }finally{process.env.NODE_ENV='test';process.chdir(cwd);try { fs.rmSync(root,{recursive:true,force:true,maxRetries:3}); } catch (e: any) { if (e.code !== 'EBUSY' || fs.readdirSync(root).length > 0) throw e; }}
});
