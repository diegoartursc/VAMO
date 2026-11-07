// Versão com INVARIANTES CORRETAS dos cenários da revisão de 07/11 (R-01/R-02), em PostgreSQL descartável.
// Rodar: VAMO_REAUDIT_SCRIPTS=apps/backend/scripts/audit/pg-money python3 docs/security/evidencias-2026-11-07/scripts/vamo-reaudit-20261106-run-postgres.py
import assert from 'node:assert/strict';
async function main() {
 const root=process.cwd(), localUrl=process.env.VAMO_REAUDIT_DB_URL!;
 const parsed=new URL(localUrl);
 assert.equal(parsed.hostname,'127.0.0.1');assert.equal(parsed.pathname,'/vamo_audit_20261106');
 await import(root+'/apps/backend/src/test/setup.ts');
 process.env.DATABASE_URL=localUrl;
 const {createRequire}=await import('node:module');
 const require=createRequire(root+'/apps/backend/package.json');
 const {PrismaClient}=require('@prisma/client');
 const db=new PrismaClient({datasourceUrl:localUrl});(globalThis as any).prisma=db;
 try {
  const events=await import(root+'/apps/backend/src/lib/paymentEvents.ts');
  const payments=await import(root+'/apps/backend/src/routes/payments.ts');
  const {hasActiveAccess,reversalTargetCents}=await import(root+'/apps/backend/src/lib/money.ts');
  events.refundNotifier.send=async()=>true;
  const creatorTraveler=await db.traveler.create({data:{email:'creator@reaudit.invalid',name:'Synthetic creator'}});
  const buyer=await db.traveler.create({data:{email:'buyer@reaudit.invalid',name:'Synthetic buyer'}});
  const creator=await db.creator.create({data:{travelerId:creatorTraveler.id,bio:'Synthetic',destinations:[],languages:[],stripeAccountId:'acct_synthetic'}});
  const itinerary=await db.itinerary.create({data:{creatorId:creator.id,title:'Synthetic only',destination:'Test',country:'Test',description:'Test',price:100,currency:'USD',duration:1,highlights:[],inclusions:[],travelStyles:[],categories:[],activeModules:[],extraCities:[],extraCountries:[],generalTips:[],mediaUrls:[],highlightPhotos:[],status:'ACTIVE'}});
  const base={itineraryId:itinerary.id,travelerId:buyer.id,price:100,commission:20,paidAmountCents:10000,paidCurrency:'usd',commissionCents:2000,creatorEarningCents:8000,paymentIntentId:'pi_local_synthetic',purchaseData:{payment:{provider:'stripe',paymentIntentId:'pi_local_synthetic'}}};
  const event=(id:string,amount:number)=>({id,type:'charge.refunded',data:{object:{payment_intent:base.paymentIntentId,amount:10000,amount_refunded:amount}}} as any);
  const originalFind=db.itinerarySale.findUnique.bind(db.itinerarySale), originalFirst=db.itinerarySale.findFirst.bind(db.itinerarySale),originalUpdateMany=db.itinerarySale.updateMany.bind(db.itinerarySale);
  function stripe() { const calls:any={reversals:[],refunds:[]};return {calls,paymentIntents:{retrieve:async()=>({amount:10000,amount_received:10000,amount_received:10000,currency:'usd',latest_charge:{id:'ch_synthetic',amount:10000,amount_refunded:0,currency:'usd',refunded:false,disputed:false}})},refunds:{list:async()=>({data:[],has_more:false}),create:async(p:any)=>{calls.refunds.push(p);return{id:'re_synthetic',amount:p.amount,status:'succeeded'};}},transfers:{createReversal:async(id:string,p:any)=>{calls.reversals.push({id,p});return{id:'trr_synthetic'};}}} as any; }
  async function clear(){db.itinerarySale.findUnique=originalFind;db.itinerarySale.findFirst=originalFirst;db.itinerarySale.updateMany=originalUpdateMany;await db.stripeEvent.deleteMany();await db.itinerarySale.deleteMany();}
  function twoReaders(method:'findUnique'|'findFirst',selector:string){let reads=0;let release:any;const gate=new Promise<void>(r=>release=r);const original=method==='findUnique'?originalFind:originalFirst;db.itinerarySale[method]=async(q:any)=>{const snapshot=await original(q);if(q.where[selector]){if(++reads===2)release();await gate;}return snapshot;};}
  {
   await clear();const s=await db.itinerarySale.create({data:base});twoReaders('findUnique','paymentIntentId');
   let release:any;const full=new Promise<void>(r=>release=r);
   db.itinerarySale.updateMany=async(q:any)=>{if(q.data.refundedCents===1000)await full;const result=await originalUpdateMany(q);if(q.data.refundedCents===10000)release();return result;};
   await Promise.all([events.handleStripeEvent(stripe(),event('pg_full',10000)),events.handleStripeEvent(stripe(),event('pg_partial',1000))]);
   const row=await originalFind({where:{id:s.id}});assert.equal(row.refundedCents,10000);assert.equal(hasActiveAccess(row),false);
   console.log(JSON.stringify({check:'postgres-concurrent-refund-monotonic',refundedCents:row.refundedCents,activeAccess:hasActiveAccess(row),database:'disposable-local-postgres',provider:'simulated'}));
  }
  {
   await clear();const s=await db.itinerarySale.create({data:{...base,payoutTransferId:'tr_synthetic',payoutAmount:80,payoutStatus:'transferred'}});twoReaders('findUnique','paymentIntentId');const st=stripe();
   await Promise.all([events.handleStripeEvent(st,event('pg_rev_a',1000)),events.handleStripeEvent(st,event('pg_rev_b',2000))]);
   const row=await originalFind({where:{id:s.id}}),reversed=st.calls.reversals.reduce((sum:number,x:any)=>sum+x.p.amount,0);
   const correctTarget=reversalTargetCents({...row,refundedCents:2000});assert.equal(row.refundedCents,2000);assert.equal(reversed,1600);assert.equal(correctTarget,1600);assert.equal(row.payoutReversedCents,1600);
   console.log(JSON.stringify({check:'postgres-concurrent-reversal',actualProviderRequestsCents:reversed,correctTargetCents:correctTarget,databaseRefundedCents:row.refundedCents,database:'disposable-local-postgres',provider:'simulated'}));
  }
  {
   await clear();await db.itinerarySale.create({data:{...base,paymentStatus:'refunded',refundedCents:10000}});twoReaders('findFirst','itineraryId');const st=stripe();payments.setStripeClientForTests(st);
   const results=await Promise.all(['pi_rebuy_a','pi_rebuy_b'].map(paymentIntentId=>payments.fulfillItineraryPurchaseForTests({itineraryId:itinerary.id,travelerId:buyer.id,payment:{provider:'stripe',paymentIntentId,amountTotal:100,currency:'usd'}})));
   assert.equal(results.filter(x=>!x.alreadyPurchased).length,1);assert.equal(st.calls.refunds.length,1);
   console.log(JSON.stringify({check:'postgres-concurrent-repurchase',newPaymentsSimulated:2,acceptedPayments:1,duplicateRefundRequests:st.calls.refunds.length,database:'disposable-local-postgres',provider:'simulated'}));
  }
  payments.setStripeClientForTests(null);
 } finally {await db.$disconnect();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
