/**
 * StarTechno installment calculator: pure, dependency-free calculations.
 * All amounts are in Iranian toman.
 * The company's commercial terms are user-provided and must be confirmed
 * against the merchant's contracts before public deployment.
 */
export const ANNUAL_BANK_RATE = 0.23;
export const DEFAULT_ROUNDING_MILLIONS = 10;
export const MAX_AUTO_SURPLUS_RATIO = 0.05;
export const MILLION = 1_000_000;

export const SCHEMES = Object.freeze([
  {id:'gsm-blu', company:'gsm', companyName:'GSMPAY', bank:'بلوبانک', name:'بلو — ۱۲ ماهه', months:12, min:0, max:100*MILLION, fee:.145, invoiceFee:.03, charge:'upfront', type:'flex'},
  {id:'gsm-hi', company:'gsm', companyName:'GSMPAY', bank:'های‌بانک', name:'های‌بانک — ۲۴ ماهه', months:24, min:0, max:200*MILLION, fee:.145, invoiceFee:.03, charge:'upfront', type:'flex'},
  {id:'digi-70', company:'digi', companyName:'دیجی‌پی', bank:'صادرات یا ملت', name:'اعتبار ثابت ۷۰ میلیونی', months:12, min:70*MILLION, max:70*MILLION, fixed:70*MILLION, fee:.145, invoiceFee:.09, charge:'choice', type:'fixed'},
  {id:'digi-100', company:'digi', companyName:'دیجی‌پی', bank:'صادرات یا ملت', name:'اعتبار ثابت ۱۰۰ میلیونی', months:12, min:100*MILLION, max:100*MILLION, fixed:100*MILLION, fee:.145, invoiceFee:.09, charge:'choice', type:'fixed'},
  {id:'digi-150', company:'digi', companyName:'دیجی‌پی', bank:'ملت', name:'اعتبار ثابت ۱۵۰ میلیونی', months:12, min:150*MILLION, max:150*MILLION, fixed:150*MILLION, fee:.145, invoiceFee:.09, charge:'choice', type:'fixed'},
  {id:'digi-200', company:'digi', companyName:'دیجی‌پی', bank:'ملت', name:'اعتبار ثابت ۲۰۰ میلیونی', months:12, min:200*MILLION, max:200*MILLION, fixed:200*MILLION, fee:.145, invoiceFee:.09, charge:'choice', type:'fixed'},
  {id:'azki-6', company:'azki', companyName:'ازکی‌وام', bank:'بلو، ملت، تجارت یا اقتصاد نوین (بسته به طرح)', name:'۶ ماهه', months:6, min:30*MILLION, max:300*MILLION, fee:.08, invoiceFee:.04, charge:'deduct', type:'flex'},
  {id:'azki-12', company:'azki', companyName:'ازکی‌وام', bank:'بلو، ملت، تجارت یا اقتصاد نوین (بسته به طرح)', name:'۱۲ ماهه', months:12, min:30*MILLION, max:100*MILLION, fee:.15, invoiceFee:.04, charge:'deduct', type:'flex'},
  {id:'azki-18', company:'azki', companyName:'ازکی‌وام', bank:'بلو، ملت، تجارت یا اقتصاد نوین (بسته به طرح)', name:'۱۸ ماهه', months:18, min:30*MILLION, max:300*MILLION, fee:.195, invoiceFee:.04, charge:'deduct', type:'flex'},
  {id:'azki-24', company:'azki', companyName:'ازکی‌وام', bank:'بلو، ملت، تجارت یا اقتصاد نوین (بسته به طرح)', name:'۲۴ ماهه', months:24, min:30*MILLION, max:300*MILLION, fee:.24, invoiceFee:.04, charge:'deduct', type:'flex'},
]);

export function parseAmount(value) {
  const normalized = String(value ?? '').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
    .replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))
    .replace(/[\s,٬،]/g,'').replace(/٫/g,'.');
  return normalized === '' ? NaN : Number(normalized);
}
export function formatToman(n) { return Math.round(n).toLocaleString('fa-IR') + ' تومان'; }
export function formatMillion(n, digits=1) { return (n/MILLION).toLocaleString('fa-IR',{maximumFractionDigits:digits}) + ' میلیون'; }
export function installment(principal, months, annualRate=ANNUAL_BANK_RATE) {
  if (!(principal>0 && months>0)) return null;
  const r=annualRate/12;
  const monthly=r===0?principal/months:principal*r/(1-Math.pow(1+r,-months));
  const total=monthly*months;
  return {monthly,total,interest:total-principal,months,annualRate};
}
export function isAllowedAmount(scheme, amount) {
  return Number.isFinite(amount) && amount>0 && amount>=scheme.min && amount<=scheme.max
    && (scheme.type!=='fixed' || amount===scheme.fixed);
}
export function paperwork(scheme, amount) {
  if (scheme.company==='gsm') return ['رتبه اعتباری بانکی موردنیاز','یک فقره چک ضمانت صیادی بنفش به نام خود متقاضی'];
  if (scheme.company==='digi') return ['رتبه اعتباری بانکی موردنیاز','چک صیادی بنفش به نام خود متقاضی یا سفته الکترونیک'];
  const docs=['رتبه اعتباری بانکی موردنیاز','یک برگ چک صیادی بنفش به نام خود متقاضی'];
  if (scheme.months===18 || scheme.months===24 || (scheme.months===6 && amount>100*MILLION)) {
    docs.push('مدارک شغلی: کارمندان دولتی و خصوصی، بازنشستگان و مستمری‌بگیران: آخرین فیش حقوقی مهرشده؛ مشاغل آزاد: پرینت گردش سه‌ماهه حساب');
  }
  return docs;
}
export function calculateOffer(scheme, invoice, credit, chargeMode=scheme.charge, kind='manual') {
  if (!isAllowedAmount(scheme, credit) || !(invoice>0) || !(chargeMode==='upfront'||chargeMode==='deduct')) return null;
  if (scheme.company==='gsm' && (chargeMode!=='upfront'||credit>invoice)) return null;
  if (scheme.company==='azki' && chargeMode!=='deduct') return null;
  const creditFee=credit*scheme.fee;
  const invoiceFee=invoice*scheme.invoiceFee;
  const deductedFee=chargeMode==='deduct'?creditFee:0;
  const upfrontCreditFee=chargeMode==='upfront'?creditFee:0;
  const effective=credit-deductedFee-(chargeMode==='deduct'?invoiceFee:0);
  const purchaseGap=Math.max(0,invoice-(credit-deductedFee));
  const payableAtPurchase=purchaseGap+invoiceFee+upfrontCreditFee;
  // If the invoice difference is deducted from credit, the buyer must top up
  // the same amount; the resulting cash figure is equivalent to invoice-effective.
  // For prepaid fees, do NOT reduce the nominal bank credit.
  const cashNeeded=chargeMode==='deduct'?Math.max(0,invoice-effective):payableAtPurchase;
  const surplus=Math.max(0,effective-invoice);
  const repayment=installment(credit,scheme.months);
  const isCover=chargeMode==='deduct' && effective>=invoice && surplus<=invoice*MAX_AUTO_SURPLUS_RATIO+1e-6;
  return {
    key:`${scheme.id}:${credit}:${chargeMode}`,
    scheme, invoice,credit,creditFee,invoiceFee,chargeMode,upfrontCreditFee,
    deductedFee,effective,purchaseGap,cashNeeded,surplus,repayment,kind,
    isCover, excessLimit:invoice*MAX_AUTO_SURPLUS_RATIO,
    totalOutlay:repayment.total+cashNeeded,
    documents:paperwork(scheme,credit),
    isOverLimit: surplus>invoice*MAX_AUTO_SURPLUS_RATIO+1e-6,
  };
}
function addCandidate(map, scheme, invoice, amount, mode, kind) {
  if (!isAllowedAmount(scheme,amount))return;
  const offer=calculateOffer(scheme,invoice,amount,mode,kind);
  if (!offer)return;
  const key=offer.key;
  // Higher priority: cover > near > equal > lower, except equal should keep a distinct exact label.
  const priority={cover:5,near:4,equal:3,lower:2,manual:6};
  if (!map.has(key)||(priority[kind]??0)>(priority[map.get(key).kind]??0))map.set(key,offer);
}
const down=(amount,step)=>Math.floor((amount+1e-8)/step)*step;
const up=(amount,step)=>Math.ceil((amount-1e-8)/step)*step;
function modesFor(scheme,choice){
  return scheme.company==='digi' ? (choice==='both'?['deduct','upfront']:[choice]) : [scheme.charge];
}
/** Automatic candidate generation. No unsupported borrowing above invoice for GSMPAY.
 * Upper-credit offers are only generated when the effective surplus is <= 5% of invoice.
 */
export function automaticOffers(invoice, opts={}) {
  const {months='all',roundingMillions=DEFAULT_ROUNDING_MILLIONS,digiMode='both'}=opts;
  if (!(Number.isFinite(invoice)&&invoice>0&&Number.isFinite(roundingMillions)&&roundingMillions>0))return [];
  const step=roundingMillions*MILLION;
  const map=new Map();
  for (const s of SCHEMES) {
    if (months!=='all' && s.months!==Number(months))continue;
    for (const mode of modesFor(s,digiMode)) {
      if (s.company==='gsm') {
        if(isAllowedAmount(s,invoice))addCandidate(map,s,invoice,invoice,mode,'equal');
        const nearest=down(Math.min(invoice,s.max),step);
        const lower=nearest===invoice ? nearest-step : nearest;
        if(lower<invoice) addCandidate(map,s,invoice,lower,mode,'lower');
        // Include the exact ceiling when it is a smaller usable plan but not divisible by step.
        if(s.max<invoice) addCandidate(map,s,invoice,s.max,mode,'lower');
        continue;
      }
      if (s.type==='fixed') {
        const offer=calculateOffer(s,invoice,s.fixed,mode,'lower');
        if(!offer) continue;
        if (s.fixed===invoice)addCandidate(map,s,invoice,s.fixed,mode,'equal');
        else if (s.fixed<invoice)addCandidate(map,s,invoice,s.fixed,mode,'lower');
        else if (mode==='deduct') {
          if (offer.isCover)addCandidate(map,s,invoice,s.fixed,mode,'cover');
          else if (offer.effective<invoice)addCandidate(map,s,invoice,s.fixed,mode,'near');
        }
        continue;
      }
      // Azki: list equal, rounded-below, just-below-break-even, full-coverage.
      if(isAllowedAmount(s,invoice))addCandidate(map,s,invoice,invoice,mode,'equal');
      const pDown=down(Math.min(invoice,s.max),step);
      // When invoice already aligns with the rounding step, the equal-credit
      // option is the baseline; do not add a redundant extra lower card.
      if(pDown<invoice)addCandidate(map,s,invoice,pDown,mode,'lower');
      if(s.max<invoice)addCandidate(map,s,invoice,s.max,mode,'lower');
      const threshold=invoice*(1+s.invoiceFee)/(1-s.fee);
      // Closest rounded candidate below fee-covering threshold.
      let near=down(threshold,step);
      if(near>=threshold-1e-6)near-=step;
      near=Math.min(near,down(s.max,step));
      if(near>=s.min){
        const o=calculateOffer(s,invoice,near,mode,'near');
        if(o && near>invoice && o.effective<invoice)addCandidate(map,s,invoice,near,mode,'near');
      }
      const cover=up(threshold,step);
      const result=calculateOffer(s,invoice,cover,mode,'cover');
      if(result && result.isCover)addCandidate(map,s,invoice,cover,mode,'cover');
    }
  }
  return sortOffers([...map.values()]);
}
export function manualOffers(invoice,credit,opts={}) {
  const {months='all',digiMode='both'}=opts;
  if (!(invoice>0 && credit>0))return [];
  const offers=[];
  for(const scheme of SCHEMES){
    if(months!=='all'&&scheme.months!==Number(months))continue;
    if(!isAllowedAmount(scheme,credit))continue;
    for(const mode of modesFor(scheme,digiMode)){
      const offer=calculateOffer(scheme,invoice,credit,mode,'manual');
      if(offer)offers.push(offer);
    }
  }
  return sortOffers(offers);
}
export function sortOffers(offers){
  const companyRank={gsm:0,digi:1,azki:2};
  const kindRank={equal:0,lower:1,near:2,cover:3,manual:0};
  return offers.sort((a,b)=> companyRank[a.scheme.company]-companyRank[b.scheme.company] ||
    a.scheme.months-b.scheme.months || (kindRank[a.kind]-kindRank[b.kind]) ||
    a.credit-b.credit || (a.chargeMode==='deduct'?-1:1));
}
export function suggestMessages(invoice,credit,months) {
  const messages=[];
  if (credit && ![70,100,150,200].some(v=>credit===v*MILLION) && (months==='all'||Number(months)===12)){
    const options=[70,100,150,200].map(v=>v*MILLION).filter(v=>v<credit);
    messages.push(`دیجی‌پی فقط اعتبارهای ثابت ۷۰، ۱۰۰، ۱۵۰ و ۲۰۰ میلیون تومان دارد${options.length?`؛ نزدیک‌ترین مبلغ پایین‌تر: ${formatToman(Math.max(...options))}`:''}.`);
  }
  if (credit && credit>invoice) messages.push('مبلغ اعتبار دستی از مبلغ فاکتور بیشتر است؛ در طرح‌های دارای مازاد، قابلیت استفاده از اعتبار اضافه باید با شرکت تأمین‌کننده تأیید شود.');
  return messages;
}
