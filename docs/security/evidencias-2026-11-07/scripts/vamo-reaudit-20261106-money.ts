import assert from 'node:assert/strict';
async function main() {
 const root=process.cwd();
 await import(root+'/apps/backend/src/test/setup.ts');
 const {createFakePrisma,memoryTable}=await import(root+'/apps/backend/src/test/helpers.ts');
 const db=createFakePrisma(); (globalThis as any).prisma=db;
 const paymentEvents=await import(root+'/apps/backend/src/lib/paymentEvents.ts');
 const money=await import(root+'/apps/backend/src/lib/money.ts');
 const payments=await import(root+'/apps/backend/src/routes/payments.ts');
 const {runPayoutSweep}=await import(root+'/apps/backend/src/jobs/payouts.ts');
 paymentEvents.refundNotifier.send=async()=>true;
 const DAY=86400000;
 const now=new Date('2026-11-06T12:00:00Z');
 function sale(over:any={}) { return {id:'sale1',itineraryId:'it1',travelerId:'trav1',price:100,commission:20,createdAt:new Date(now.getTime()-10*DAY),purchaseData:{payment:{provider:'stripe',paymentIntentId:'pi1'}},paymentIntentId:'pi1',paidAmountCents:10000,paidCurrency:'usd',commissionCents:2000,creatorEarningCents:8000,paymentStatus:'paid',refundedCents:0,disputeStatus:null,disputeId:null,disputeLostCents:0,payoutTransferId:null,payoutTransferredAt:null,payoutAmount:null,payoutStatus:null,payoutAttempts:0,payoutNextAttemptAt:null,payoutLastError:null,payoutReversedCents:0,itinerary:{currency:'USD',creator:{id:'cr1',stripeAccountId:'acct1'}},...over}; }
 const itinerary={id:'it1',title:'Synthetic itinerary',price:100,currency:'USD',status:'ACTIVE',creatorId:'cr1',creator:{id:'cr1',verificationLevel:'BASIC',averageRating:0,totalSales:0,traveler:{id:'trav_creator',name:'Synthetic',avatar:null}},images:[],days:[],files:[],accommodations:[],transports:[],checklists:[],reviews:[],_count:{sales:0}};
 function reset(rows:any[]=[]) {
  const table=memoryTable<any>(rows); Object.assign(db.itinerarySale,table);
  const unique=table.findUnique,first=table.findFirst,many=table.findMany;
  db.itinerarySale.findUnique=async(q:any)=>structuredClone(await unique(q));
  db.itinerarySale.findFirst=async(q:any)=>structuredClone(await first(q));
  db.itinerarySale.findMany=async(q:any)=>structuredClone((await many(q)).sort((a:any,b:any)=>+new Date(a.createdAt)-+new Date(b.createdAt)).slice(0,q?.take??Infinity));
  const events=memoryTable<any>([]); Object.assign(db.stripeEvent,events);
  db.traveler.findUnique=async()=>null; db.itinerary.findUnique=async()=>itinerary; db.creator.update=async()=>({});
  return {table,events};
 }
 const event=(id:string,type:string,obj:any)=>({id,type,data:{object:obj}} as any);
 function stripe() { const calls:any={transfers:[],reversals:[]}; return {calls,accounts:{retrieve:async()=>({payouts_enabled:true})},paymentIntents:{retrieve:async()=>({id:'pi1',amount:10000,amount_received:10000,currency:'usd',latest_charge:{id:'ch1',amount:10000,currency:'usd',amount_refunded:0,refunded:false,disputed:false}})},refunds:{list:async()=>({data:[],has_more:false}),create:async(p:any)=>({id:'re1',amount:p.amount,status:'succeeded'})},transfers:{create:async(p:any,o:any)=>{calls.transfers.push({p,o});return {id:'tr1'};},createReversal:async(id:string,p:any)=>{calls.reversals.push({id,p});return {id:'trr1'};}}} as any; }
 // 1. Parallel refund events read detached snapshots before either writes.
 {
  const {table}=reset([sale()]); let reads=0; let release:any; const barrier=new Promise<void>(r=>release=r); const originalFind=db.itinerarySale.findUnique;
  db.itinerarySale.findUnique=async(q:any)=>{const snapshot=await originalFind(q); if(q.where.paymentIntentId){if(++reads===2) release(); await barrier;}return snapshot;};
  const originalUpdateMany=table.updateMany; let fullDone:any; const full=new Promise<void>(r=>fullDone=r);
  db.itinerarySale.updateMany=async(q:any)=>{if(q.data.refundedCents===1000)await full; const result=await originalUpdateMany(q); if(q.data.refundedCents===10000)fullDone();return result;};
  await Promise.all([paymentEvents.handleStripeEvent(stripe(),event('ev_full','charge.refunded',{payment_intent:'pi1',amount:10000,amount_refunded:10000})),paymentEvents.handleStripeEvent(stripe(),event('ev_partial','charge.refunded',{payment_intent:'pi1',amount:10000,amount_refunded:1000}))]);
  assert.equal(table.rows[0].refundedCents,1000); assert.equal(money.hasActiveAccess(table.rows[0]),true);
  console.log('REPRODUCED 1: concurrent full+partial refund events roll full refund back to 1000, restore paid-content access');
 }
 // 2. A refund event before sale is finalized, then provider lookup fails.
 {
  const {table,events}=reset(); const st=stripe(); st.paymentIntents.retrieve=async()=>{throw new Error('synthetic provider timeout');}; payments.setStripeClientForTests(st);
  await paymentEvents.handleStripeEvent(st,event('ev_early','charge.refunded',{payment_intent:'pi1',amount:10000,amount_refunded:10000}));
  await payments.fulfillItineraryPurchaseForTests({itineraryId:'it1',travelerId:'trav1',payment:{provider:'stripe',paymentIntentId:'pi1',amountTotal:100,currency:'usd'}});
  assert.ok(events.rows[0].processedAt); assert.equal(table.rows[0].paymentStatus,'paid'); assert.equal(money.hasActiveAccess(table.rows[0]),true);
  console.log('REPRODUCED 2: refund before sale acknowledged; provider timeout swallowed; sale born paid with active access and refund event finalized');
 }
 // 3. Provider created transfer, response lost; then full refund before next sweep.
 {
  const {table}=reset([sale()]); const st=stripe(); st.transfers.create=async(p:any,o:any)=>{st.calls.transfers.push({p,o,providerCreatedId:'tr_lost'});throw new Error('synthetic response lost after provider committed transfer');};
  await runPayoutSweep(now,st);
  await paymentEvents.handleStripeEvent(st,event('ev_after_lost_response','charge.refunded',{payment_intent:'pi1',amount:10000,amount_refunded:10000}));
  await runPayoutSweep(new Date(now.getTime()+2*DAY),st);
  assert.equal(st.calls.transfers.length,1); assert.equal(st.calls.reversals.length,0); assert.equal(table.rows[0].payoutTransferId,null); assert.equal(table.rows[0].payoutStatus,'blocked');
  console.log('REPRODUCED 3: transfer committed/provider response lost + refund leaves actual transfer unreversed and sale permanently out of payout sweep');
 }
 // 4. Failed refund object accepted as successful initiation; refund.failed event ignored.
 {
  reset(); const st=stripe(); st.refunds.create=async()=>({id:'re_failed',amount:10000,status:'failed'});
  const r=await payments.refundPaymentIntentIfNeeded(st,'pi1','synthetic'); assert.equal(r.refunded,true); assert.equal(r.pending,true);
  const {events}=reset(); await paymentEvents.handleStripeEvent(st,event('ev_refund_failed','refund.failed',{id:'re_failed',payment_intent:'pi1',amount:10000,status:'failed'}));
  assert.ok(events.rows[0].processedAt);
  console.log('REPRODUCED 4: refund object status=failed returns refunded:true/pending:true; refund.failed event marked processed without action');
 }
 // 5. Queue filters/backoff actually allow 51st record after first batch of 50 unready accounts.
 {
  const rows=Array.from({length:50},(_,i)=>sale({id:'old'+i,paymentIntentId:'pi'+i,createdAt:new Date(now.getTime()-(20*DAY)+i),itinerary:{currency:'USD',creator:{id:'unready',stripeAccountId:'acct_unready'}}})); rows.push(sale({id:'eligible',paymentIntentId:'pi_good'}));
  const {table}=reset(rows);const st=stripe();st.accounts.retrieve=async(id:string)=>({payouts_enabled:id!=='acct_unready'});
  const a=await runPayoutSweep(now,st),b=await runPayoutSweep(new Date(now.getTime()+1000),st);
  assert.equal(a.transferred,0);assert.equal(b.transferred,1);assert.equal(table.rows.at(-1).payoutTransferId,'tr1');
  console.log('VALIDATED 5: SEC-15 real take=50/backoff filter lets 51st eligible sale transfer on next sweep');
 }
 // 6. Independent target keys do not serialize overlapping reversals.
 {
  const {table}=reset([sale({payoutTransferId:'tr_existing',payoutAmount:80,payoutStatus:'transferred'})]); let reads=0;let release:any;const barrier=new Promise<void>(r=>release=r);const find=db.itinerarySale.findUnique;
  db.itinerarySale.findUnique=async(q:any)=>{const snap=await find(q);if(q.where.paymentIntentId){if(++reads===2)release();await barrier;}return snap;};
  const st=stripe();await Promise.all([paymentEvents.handleStripeEvent(st,event('e_rev_1','charge.refunded',{payment_intent:'pi1',amount:10000,amount_refunded:1000})),paymentEvents.handleStripeEvent(st,event('e_rev_2','charge.refunded',{payment_intent:'pi1',amount:10000,amount_refunded:2000}))]);
  const reversed=st.calls.reversals.reduce((sum:number,c:any)=>sum+c.p.amount,0);
  assert.equal(reversed,2400); assert.equal(money.reversalTargetCents(table.rows[0]),1600);
  console.log('REPRODUCED 6: overlapping refund events reverse 2400 cents; maximum actually due is 1600 (distinct target idempotency keys)');
 }
 // 7. Concurrent repurchases with different payment intents, loser not refunded.
 {
  const {table}=reset([sale({paymentStatus:'refunded',refundedCents:10000})]);let reads=0;let release:any;const barrier=new Promise<void>(r=>release=r);const find=db.itinerarySale.findFirst;
  db.itinerarySale.findFirst=async(q:any)=>{const snap=await find(q);if(q.where.itineraryId){if(++reads===2)release();await barrier;}return snap;};
  const st=stripe();let refunds=0;st.refunds.create=async(p:any)=>{refunds++;return {id:'re',status:'succeeded',amount:p.amount};};payments.setStripeClientForTests(st);
  const results=await Promise.all(['pi_new_a','pi_new_b'].map(paymentIntentId=>payments.fulfillItineraryPurchaseForTests({itineraryId:'it1',travelerId:'trav1',payment:{provider:'stripe',paymentIntentId,amountTotal:100,currency:'usd'}})));
  assert.equal(results.filter(r=>r.alreadyPurchased===false).length,1);assert.equal(refunds,0);
  console.log('REPRODUCED 7: two concurrent paid repurchases produce one recorded payment and zero duplicate refunds');
 }
 payments.setStripeClientForTests(null);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
