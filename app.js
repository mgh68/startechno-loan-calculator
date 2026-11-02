import {SCHEMES,ANNUAL_BANK_RATE,MILLION,automaticOffers,manualOffers,parseAmount,formatToman,formatMillion,suggestMessages} from './calculator.js';

const $=id=>document.getElementById(id);
const form=$('calculator-form'), invoiceField=$('invoice'), creditField=$('custom-credit'), roundField=$('rounding');
const monthField=$('months'), digiModeField=$('digipay-method');
const content=$('results-content'), subtitle=$('results-subtitle'), error=$('form-error');
const filters=$('filters'), dialog=$('info-dialog');
let offers=[];
let companyFilter='all';

const PERSIAN_DIGITS='۰۱۲۳۴۵۶۷۸۹';
const faNum=n=>Number(n).toLocaleString('fa-IR');
const currencyShort=n=>formatMillion(n,2)+' تومان';
const pRate=n=>(n*100).toLocaleString('fa-IR',{maximumFractionDigits:2})+'٪';
const escapeHTML=str=>String(str).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

// Dark is always the first-visit default; a user's explicit toggle is remembered.
let savedTheme=null;
try{savedTheme=localStorage.getItem('startechno-theme')}catch{}
setTheme(savedTheme==='light'?'light':'dark',false);
function setTheme(theme,persist=true){
  document.documentElement.dataset.theme=theme;
  $('theme-label').textContent=theme==='dark'?'حالت روشن':'حالت تاریک';
  $('theme-toggle').setAttribute('aria-label',theme==='dark'?'تغییر به حالت روشن':'تغییر به حالت تاریک');
  document.querySelector('meta[name="theme-color"]').setAttribute('content',theme==='dark'?'#0b0d17':'#f7f7fc');
  if(persist){try{localStorage.setItem('startechno-theme',theme)}catch{}}
}
$('theme-toggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));

const INFO={
  gsm:`<h3>طرح‌های GSMPAY</h3><table><thead><tr><th>بانک</th><th>سقف اعتبار</th><th>بازپرداخت</th></tr></thead><tbody><tr><td>بلوبانک</td><td>۱۰۰ میلیون تومان</td><td>۱۲ ماه</td></tr><tr><td>های‌بانک</td><td>۲۰۰ میلیون تومان</td><td>۲۴ ماه</td></tr></tbody></table><p>سود سالانه بانکی: <b>۲۳٪</b>؛ کارمزد ارائه اعتبار: <b>۱۴.۵٪ اعتبار</b>؛ اختلاف خرید نقد و اقساط: <b>۳٪ کل فاکتور</b>.</p><h3>شرایط و مدارک</h3><ul><li>رتبه اعتباری بانکی موردنیاز</li><li>یک فقره چک ضمانت صیادی بنفش به نام خود متقاضی</li></ul><p class="note">کارمزد ارائه اعتبار به‌صورت نقدی و پیش از خرید پرداخت می‌شود؛ اعتبار بانکی به همان مبلغ اسمی باقی می‌ماند. مبلغ نقدی لازم برای پوشش اختلاف فاکتور و هزینه‌ها در نتیجه جداگانه نمایش داده می‌شود.</p>`,
  digi:`<h3>طرح‌های ۱۲ ماهه دیجی‌پی</h3><table><thead><tr><th>اعتبار ثابت</th><th>بانک</th></tr></thead><tbody><tr><td>۷۰ میلیون تومان</td><td>صادرات یا ملت</td></tr><tr><td>۱۰۰ میلیون تومان</td><td>صادرات یا ملت</td></tr><tr><td>۱۵۰ میلیون تومان</td><td>ملت</td></tr><tr><td>۲۰۰ میلیون تومان</td><td>ملت</td></tr></tbody></table><p>سود بانکی: <b>۲۳٪ سالانه</b>؛ <b>هزینه تهیه اشتراک دیجی‌پی ۱۴.۵٪ اعتبار</b>؛ اختلاف خرید نقد و اقساط: <b>۹٪ کل فاکتور</b>.</p><h3>روش دریافت اشتراک و مدارک</h3><ul><li>هزینه اشتراک: پرداخت نقدی یا کسر از اعتبار</li><li>رتبه اعتباری بانکی موردنیاز</li><li>چک صیادی بنفش به نام خود متقاضی یا سفته الکترونیک</li></ul><p class="note"><b>خرید اعتباری چهارقسطه (BNPL):</b> امکان خرید با اعتبار ماهانه دیجی‌پی و پرداخت در ۴ قسط، تا سقف اعتبار تخصیص‌یافته به شما، در فروشگاه ما به‌صورت حضوری و آنلاین برقرار است. این خدمت صرفاً معرفی شده و جزو محاسبات وام نیست.</p>`,
  azki:`<h3>طرح‌های ازکی‌وام</h3><table><thead><tr><th>بازپرداخت</th><th>اعتبار</th><th>کارمزد ارائه اعتبار</th></tr></thead><tbody><tr><td>۶ ماه</td><td>۳۰ تا ۳۰۰ میلیون</td><td>۸٪</td></tr><tr><td>۱۲ ماه</td><td>۳۰ تا ۱۰۰ میلیون</td><td>۱۵٪</td></tr><tr><td>۱۸ ماه</td><td>۳۰ تا ۳۰۰ میلیون</td><td>۱۹.۵٪</td></tr><tr><td>۲۴ ماه</td><td>۳۰ تا ۳۰۰ میلیون</td><td>۲۴٪</td></tr></tbody></table><p>سود بانکی: <b>۲۳٪ سالانه</b>؛ اختلاف خرید نقد و اقساط: <b>۴٪ کل فاکتور</b>؛ کارمزد اعتبار از خود اعتبار کسر می‌شود.</p><p>بانک‌های طرف قرارداد بسته به نوع طرح: بلو، ملت، تجارت و اقتصاد نوین.</p><h3>شرایط و مدارک</h3><ul><li>رتبه اعتباری بانکی موردنیاز</li><li>یک برگ چک صیادی بنفش به نام خود متقاضی</li><li>طرح ۱۲ ماهه و طرح ۶ ماهه تا سقف ۱۰۰ میلیون: مدارک اصلی فوق</li><li>طرح ۶ ماهه برای مبالغ بالای ۱۰۰ میلیون، و تمام طرح‌های ۱۸ و ۲۴ ماهه: مدارک شغلی نیز الزامی است.</li><li>کارمندان دولتی و خصوصی، بازنشستگان و مستمری‌بگیران: آخرین فیش حقوقی مهرشده</li><li>مشاغل آزاد: پرینت گردش سه‌ماهه حساب</li></ul><p class="note">در پیشنهاد پوشش کامل هزینه‌ها، مازاد اعتبار مؤثر نسبت به فاکتور حداکثر ۵٪ در نظر گرفته می‌شود؛ امکان استفاده از اعتبار بیشتر از قیمت واقعی کالا تابع ضوابط ارائه‌دهنده است.</p>`
};
const INFO_TITLES={gsm:'GSMPAY | جی‌اس‌ام‌پی',digi:'DigiPay | دیجی‌پی',azki:'AzkiVam | ازکی‌وام'};
let dialogOpener=null;
document.querySelectorAll('[data-info]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.info;
  dialogOpener=button;
  $('dialog-title').textContent=INFO_TITLES[key];
  $('dialog-content').innerHTML=INFO[key];
  dialog.showModal();
}));
$('dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
dialog.addEventListener('close',()=>dialogOpener?.focus());

function getSettings(){
  const invoice=parseAmount(invoiceField.value);
  const hasCredit=creditField.value.trim().length>0;
  const credit=hasCredit?parseAmount(creditField.value):null;
  const round=parseAmount(roundField.value);
  const months=monthField.value;
  const digiMode=digiModeField.value;
  let problem='';
  if(invoiceField.value.trim() && !(Number.isFinite(invoice)&&invoice>0&&invoice<=1e12))problem='قیمت فاکتور باید عددی مثبت و معتبر باشد.';
  else if(hasCredit && !(Number.isFinite(credit)&&credit>0&&credit<=1e12))problem='مبلغ اعتبار دلخواه باید عددی مثبت و معتبر باشد.';
  else if(!(Number.isFinite(round)&&round>=.1&&round<=100))problem='گام گرد کردن باید بین ۰.۱ و ۱۰۰ میلیون تومان باشد.';
  return {invoice,credit,round,months,digiMode,problem,empty:!invoiceField.value.trim()};
}
function paint(){
  const state=getSettings();
  error.classList.toggle('hidden',!state.problem);
  error.textContent=state.problem;
  if(state.problem){offers=[];filters.hidden=true;content.innerHTML='<div class="empty-state"><p>ابتدا اطلاعات واردشده را اصلاح کنید.</p></div>';subtitle.textContent='اطلاعات ورودی نیاز به اصلاح دارد.';$('results-count').classList.add('hidden');$('results-info').innerHTML='';return;}
  if(state.empty){offers=[];filters.hidden=true;subtitle.textContent='برای شروع، قیمت فاکتور را وارد کنید.';$('results-count').classList.add('hidden');$('results-info').innerHTML='';content.innerHTML=`<div class="empty-state"><div class="empty-shape">٪</div><h3>آماده محاسبه هستیم!</h3><p>مبلغ فاکتور را در کادر بالا وارد کنید تا پیشنهادهای اعتباری هر سه شرکت با جزئیات اقساط نمایش داده شوند.</p><button class="link-button" type="button" id="example-button">مشاهده نمونه برای فاکتور ۱۲۰ میلیون تومانی ←</button></div>`;bindExample();return;}
  offers=state.credit===null?automaticOffers(state.invoice,{months:state.months,roundingMillions:state.round,digiMode:state.digiMode}):manualOffers(state.invoice,state.credit,{months:state.months,digiMode:state.digiMode});
  const termLabel=state.months==='all'?'تمام دوره‌های مجاز':`بازپرداخت ${faNum(state.months)} ماهه`;
  subtitle.textContent=state.credit===null?`پیشنهادهای خودکار برای فاکتور ${formatToman(state.invoice)} · ${termLabel}`:`طرح‌های سازگار با اعتبار دلخواه ${formatToman(state.credit)} · ${termLabel}`;
  const notes=[];
  if(state.credit!==null)notes.push(...suggestMessages(state.invoice,state.credit,state.months));
  if(!offers.some(o=>o.kind==='cover')&&state.credit===null)notes.push('اگر گزینه «پوشش کامل هزینه‌ها» نمایش داده نشده، اعتباری با مازاد مؤثر حداکثر ۵٪ فاکتور در طرح‌های مجاز پیدا نشده است.');
  if(state.credit===null)notes.push('در GSMPAY کارمزد اعتبار نقدی است؛ بنابراین اعتبار بالاتر از فاکتور به‌عنوان پوشش هزینه‌ها پیشنهاد نمی‌شود.');
  $('results-info').innerHTML=notes.map(n=>`<div class="notice">${escapeHTML(n)}</div>`).join('');
  if(companyFilter!=='all' && !offers.some(o=>o.scheme.company===companyFilter)){
    companyFilter='all';
    document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.company==='all'));
  }
  filters.hidden=offers.length===0;
  for(const company of ['all','gsm','digi','azki']){
    const count=company==='all'?offers.length:offers.filter(o=>o.scheme.company===company).length;
    $(`count-${company}`).textContent=faNum(count);
  }
  updateVisible();
}
function updateVisible(){
  const visible=offers.filter(o=>companyFilter==='all'||o.scheme.company===companyFilter);
  $('results-count').textContent=faNum(visible.length)+' پیشنهاد';
  $('results-count').classList.toggle('hidden',!offers.length);
  if(!visible.length){
    content.innerHTML=`<div class="empty-state"><div class="empty-shape">!</div><h3>پیشنهاد سازگاری پیدا نشد</h3><p>با مبلغ اعتبار، مدت بازپرداخت و شرایط انتخاب‌شده، گزینه‌ای در این گروه پیدا نشد. برای بررسی گزینه‌های دیگر، فیلتر یا مبلغ را تغییر دهید.</p></div>`;return;
  }
  const groups=[['gsm','GSMPAY | جی‌اس‌ام‌پی'],['digi','DigiPay | دیجی‌پی'],['azki','AzkiVam | ازکی‌وام']];
  content.innerHTML=groups.map(([company,title])=>{
    const cards=visible.filter(o=>o.scheme.company===company);
    if(!cards.length)return '';
    return `<section class="company-section" aria-label="${title}"><div class="company-heading"><h3>${title}</h3><span class="company-count">${faNum(cards.length)} پیشنهاد</span></div><div class="cards-grid">${cards.map(cardHTML).join('')}</div></section>`;
  }).join('');
}
function cardHTML(o){
  const name=o.scheme.name;
  const titleKind={equal:'اعتبار معادل فاکتور',lower:'اعتبار پایین‌تر',near:'اعتبار نزدیک به پوشش',cover:'پوشش هزینه‌ها',manual:'اعتبار انتخابی شما'}[o.kind];
  const hasSurplus=o.surplus>1;
  const upfront=o.chargeMode==='upfront';
  const paymentMethod=o.scheme.company==='digi'?(upfront?'اشتراک نقدی':'کسر اشتراک از اعتبار'):(upfront?'کارمزد نقدی':'کسر کارمزد از اعتبار');
  const docs=o.documents.map(doc=>`<li>${escapeHTML(doc)}</li>`).join('');
  let caution='';
  if(hasSurplus) caution=o.isOverLimit?'مازاد اعتبار مؤثر بیش از ۵٪ فاکتور است؛ این نتیجه فقط در حالت اعتبار دستی نمایش داده می‌شود.':'مازاد اعتبار مؤثر نتیجه ریاضی است؛ استفاده عملی از آن باید با شرکت تأمین‌کننده تأیید شود.';
  const extraCash=upfront?'این کارمزد باید جداگانه و نقدی پیش از خرید پرداخت شود.':'کارمزد از مبلغ اعتبار کسر شده است.';
  return `<article class="result-card ${o.kind==='cover'?'cover':''}">
    <div class="result-top"><div class="result-top-right"><div class="plan-title">${escapeHTML(name)}</div><div class="plan-subtitle">${escapeHTML(o.scheme.bank)} · ${faNum(o.scheme.months)} ماه · ${paymentMethod}</div></div><span class="kind-tag">${titleKind}</span></div>
    <div class="amount-block"><div><div class="amount-label">اعتبار بانکی</div><div class="amount-value">${formatMillion(o.credit,2)}</div><div class="amount-unit">تومان</div></div><div class="mini-meta"><div class="amount-label">سود سالانه</div><strong>${pRate(ANNUAL_BANK_RATE)}</strong></div></div>
    <div class="row-values">
      <div class="data-row"><span>${o.scheme.company==='digi'?'هزینه تهیه اشتراک دیجی‌پی':'کارمزد ارائه اعتبار'} (${pRate(o.scheme.fee)})</span><strong class="negative">${formatToman(o.creditFee)}</strong></div>
      <div class="data-row"><span>اختلاف نقد و اقساط (${pRate(o.scheme.invoiceFee)} کل فاکتور)</span><strong class="negative">${formatToman(o.invoiceFee)}</strong></div>
      <div class="data-row"><span>${upfront?'اعتبار بانکی قابل استفاده':'اعتبار مؤثر پس از کسر هزینه‌ها'}</span><strong>${formatToman(o.effective)}</strong></div>
      ${hasSurplus?`<div class="data-row"><span>مازاد محاسباتی اعتبار</span><strong>${formatToman(o.surplus)}</strong></div>`:''}
    </div>
    <div class="card-highlight"><div><label>وجه نقد موردنیاز${upfront?' (شامل کارمزد نقدی)':''}</label><strong class="${o.cashNeeded<1?'zero-cash':'cash'}">${formatMillion(o.cashNeeded,2)}</strong><span class="amount-unit">تومان</span></div><div><label>هر قسط ماهانه</label><strong class="monthly">${formatMillion(o.repayment.monthly,3)}</strong><span class="amount-unit">تومان</span></div></div>
    ${caution?`<p class="card-warning">${escapeHTML(caution)}</p>`:''}
    <details class="detail-box"><summary>جزئیات کامل هزینه‌ها، اقساط و مدارک</summary><div class="details-inner">
      <div class="data-row"><span>اصل تسهیلات</span><strong>${formatToman(o.credit)}</strong></div>
      <div class="data-row"><span>مجموع سود بانکی (تقریبی)</span><strong>${formatToman(o.repayment.interest)}</strong></div>
      <div class="data-row"><span>مجموع بازپرداخت بانکی (${faNum(o.scheme.months)} قسط)</span><strong>${formatToman(o.repayment.total)}</strong></div>
      <div class="data-row"><span>مجموع اقساط بانکی + وجه نقد موردنیاز</span><strong>${formatToman(o.totalOutlay)}</strong></div>
      <div class="data-row"><span>کارمزد ارائه اعتبارِ نقدی</span><strong>${formatToman(o.upfrontCreditFee)}</strong></div>
      <div class="data-row"><span>کارمزد ارائه اعتبارِ کسرشده</span><strong>${formatToman(o.deductedFee)}</strong></div>
      <p><b>شرایط و مدارک:</b></p><ul class="docs-list">${docs}</ul>
      <p class="detail-note">${extraCash} مبلغ قسط تقریبی با روش اقساط مساوی و سود سالانه ۲۳٪ محاسبه شده و ممکن است با جدول قطعی بانک متفاوت باشد.</p>
    </div></details>
  </article>`;
}
function bindExample(){const b=$('example-button');if(b)b.addEventListener('click',()=>{invoiceField.value='120,000,000';paint();invoiceField.focus();});}
function normalizeInputOnBlur(field){
  const parsed=parseAmount(field.value);
  if(Number.isFinite(parsed)&&parsed>=0){
    field.value=parsed.toLocaleString('en-US',{maximumFractionDigits:2});
  }
}
[invoiceField,creditField,roundField].forEach(field=>{
  field.addEventListener('input',paint);
  field.addEventListener('blur',()=>{if(field.value.trim())normalizeInputOnBlur(field);});
});
[monthField,digiModeField].forEach(field=>field.addEventListener('change',paint));
form.addEventListener('submit',ev=>{ev.preventDefault();paint();if(!getSettings().problem && !getSettings().empty)$('results-section').scrollIntoView({behavior:'smooth',block:'start'});});
$('reset').addEventListener('click',()=>{form.reset();invoiceField.value='';creditField.value='';roundField.value='10';monthField.value='all';digiModeField.value='both';companyFilter='all';document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.company==='all'));paint();invoiceField.focus();});
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{companyFilter=button.dataset.company;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===button));updateVisible();}));
paint();
