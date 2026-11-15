(() => {
"use strict";

const KEY = "adart_albrg_complete_v2";
let data = [];

const $ = id => document.getElementById(id);

function message(text,type="ok"){
  const el=$("message");
  el.textContent=text;
  el.className="message "+type;
  clearTimeout(message.t);
  message.t=setTimeout(()=>{el.textContent="";el.className="message"},3500);
}

function save(){
  try{
    localStorage.setItem(KEY,JSON.stringify(data));
    const test=localStorage.getItem(KEY);
    if(test===null) throw new Error("storage");
    return true;
  }catch(e){
    message("تعذر الحفظ على هذا الجهاز. جرّب فتح الموقع من Safari مباشرة.", "err");
    return false;
  }
}

function load(){
  try{
    const raw=localStorage.getItem(KEY);
    data=raw?JSON.parse(raw):[];
    if(!Array.isArray(data)) data=[];
  }catch(e){data=[]}
  render();
}

function esc(v){
  return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function money(v){
  return v===""||v==null?"—":Number(v).toLocaleString("ar-IQ")+" د.ع";
}

function daysLeft(date){
  if(!date) return null;
  const a=new Date(); a.setHours(0,0,0,0);
  const b=new Date(date+"T00:00:00");
  return Math.ceil((b-a)/86400000);
}

function statusOf(s){
  const d=daysLeft(s.dueDate);
  if(d!==null && d<0) return "expired";
  if(d!==null && d<=3) return "soon";
  return s.paid?"paid":"unpaid";
}

function statusText(s){
  const st=statusOf(s);
  return {paid:"مسدّد ✓",unpaid:"غير مسدّد",soon:"قريب الانتهاء",expired:"منتهي"}[st];
}

function render(){
  const q=$("search").value.trim().toLowerCase();
  const filter=$("statusFilter").value;
  const soon=data.filter(s=>daysLeft(s.dueDate)!==null && daysLeft(s.dueDate)>=0 && daysLeft(s.dueDate)<=3).length;
  const expired=data.filter(s=>daysLeft(s.dueDate)!==null && daysLeft(s.dueDate)<0).length;

  $("totalCount").textContent=data.length;
  $("paidCount").textContent=data.filter(s=>s.paid).length;
  $("unpaidCount").textContent=data.filter(s=>!s.paid).length;
  $("soonCount").textContent=soon;
  $("expiredCount").textContent=expired;

  let list=data.filter(s=>{
    const text=[s.name,s.phone,s.account,s.plan].join(" ").toLowerCase();
    const st=statusOf(s);
    return text.includes(q) && (filter==="all" || st===filter);
  });

  $("empty").style.display=list.length?"none":"block";
  $("list").innerHTML=list.map(s=>{
    const d=daysLeft(s.dueDate);
    const remaining=d===null?"":(d<0?`منتهي منذ ${Math.abs(d)} يوم`:`متبقي ${d} يوم`);
    return `<article class="item">
      <div class="itemTop">
        <div>
          <div class="name">${esc(s.name)}</div>
          <div class="meta">
            <div>📱 ${esc(s.phone||"—")}</div>
            <div>👤 الحساب: ${esc(s.account||"—")}</div>
            <div>📶 الباقة: ${esc(s.plan||"—")}</div>
            <div>💰 ${money(s.amount)}</div>
            <div>📅 ${esc(s.dueDate||"—")}</div>
            <div>⏱️ ${esc(remaining||"غير محدد")}</div>
          </div>
        </div>
        <span class="badge ${statusOf(s)}">${statusText(s)}</span>
      </div>
      <div class="itemActions">
        <button class="whatsapp" data-a="wa" data-id="${s.id}">💬 تنبيه واتساب</button>
        <button class="pay" data-a="pay" data-id="${s.id}">${s.paid?"إلغاء التسديد":"تسجيل التسديد"}</button>
        <button class="invoice" data-a="invoice" data-id="${s.id}">🧾 إيصال</button>
        <button class="edit" data-a="edit" data-id="${s.id}">✏️ تعديل</button>
        <button class="delete" data-a="delete" data-id="${s.id}">🗑️ حذف</button>
      </div>
    </article>`;
  }).join("");
}

function resetForm(){
  $("subscriberForm").reset();
  $("editId").value="";
  $("formTitle").textContent="➕ إضافة مشترك";
  $("saveBtn").textContent="حفظ المشترك";
  $("cancelBtn").classList.add("hidden");
}

$("subscriberForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("editId").value;
  const old=data.find(x=>x.id===id);
  const item={
    id:id||String(Date.now()),
    name:$("name").value.trim(),
    phone:$("phone").value.trim(),
    account:$("account").value.trim(),
    plan:$("plan").value.trim(),
    amount:$("amount").value,
    dueDate:$("dueDate").value,
    paid:old?old.paid:false
  };
  if(!item.name){message("اكتب اسم المشترك أولاً.","err");return}
  if(id)data=data.map(x=>x.id===id?item:x);
  else data.unshift(item);
  if(save()){message(id?"تم تعديل المشترك وحفظه ✅":"تم حفظ المشترك بنجاح ✅");resetForm();render()}
});

$("cancelBtn").addEventListener("click",resetForm);
$("search").addEventListener("input",render);
$("statusFilter").addEventListener("change",render);

$("list").addEventListener("click",e=>{
  const b=e.target.closest("button[data-a]");
  if(!b)return;
  const s=data.find(x=>x.id===b.dataset.id);
  if(!s)return;

  if(b.dataset.a==="pay"){
    s.paid=!s.paid;
    if(save()){message(s.paid?"تم تسجيل التسديد ✅":"تم إلغاء التسديد");render()}
  }

  if(b.dataset.a==="edit"){
    $("editId").value=s.id;
    $("name").value=s.name;
    $("phone").value=s.phone;
    $("account").value=s.account;
    $("plan").value=s.plan;
    $("amount").value=s.amount;
    $("dueDate").value=s.dueDate;
    $("formTitle").textContent="✏️ تعديل المشترك";
    $("saveBtn").textContent="حفظ التعديل";
    $("cancelBtn").classList.remove("hidden");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  if(b.dataset.a==="delete"){
    if(!confirm("هل تريد حذف هذا المشترك؟"))return;
    data=data.filter(x=>x.id!==s.id);
    if(save()){message("تم حذف المشترك.");render()}
  }

  if(b.dataset.a==="wa"){
    let phone=(s.phone||"").replace(/\D/g,"");
    if(!phone){message("لا يوجد رقم هاتف للمشترك.","err");return}
    if(phone.startsWith("0"))phone="964"+phone.slice(1);
    if(!phone.startsWith("964"))phone="964"+phone;
    const msg=`السلام عليكم 🌹
عزيزي المشترك، نود إعلامك بأن اشتراكك في خدمة الإنترنت ${s.dueDate?`سينتهي بتاريخ ${s.dueDate}`:"قارب على الانتهاء"}.
يرجى تسديد الاشتراك قبل موعد الانتهاء لضمان استمرار الخدمة دون انقطاع.
شكراً لتعاونكم 🌹
إدارة البرج`;
    window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(msg),"_blank");
  }

  if(b.dataset.a==="invoice")showInvoice(s);
});

function showInvoice(s){
  $("invoice").innerHTML=`<div class="invoicePaper">
    <h2>🧾 إيصال تسديد — إدارة البرج</h2>
    <div class="invoiceRow"><span>المشترك</span><b>${esc(s.name)}</b></div>
    <div class="invoiceRow"><span>رقم الهاتف</span><b>${esc(s.phone||"—")}</b></div>
    <div class="invoiceRow"><span>الحساب</span><b>${esc(s.account||"—")}</b></div>
    <div class="invoiceRow"><span>الباقة</span><b>${esc(s.plan||"—")}</b></div>
    <div class="invoiceRow"><span>تاريخ التسديد</span><b>${new Date().toLocaleDateString("ar-IQ")}</b></div>
    <div class="invoiceRow invoiceTotal"><span>المبلغ</span><b>${money(s.amount)}</b></div>
    <p style="text-align:center;margin-top:18px">تم تسجيل التسديد بنجاح ✅</p>
  </div>`;
  $("invoiceModal").classList.remove("hidden");
}

function closeModal(){$("invoiceModal").classList.add("hidden")}
$("closeModal").addEventListener("click",closeModal);
$("closeModal2").addEventListener("click",closeModal);
$("printInvoice").addEventListener("click",()=>window.print());

$("backupBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="adart-albrg-backup.json";
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});

$("restoreInput").addEventListener("change",async e=>{
  const file=e.target.files[0];
  if(!file)return;
  try{
    const imported=JSON.parse(await file.text());
    if(!Array.isArray(imported))throw new Error("invalid");
    if(!confirm("سيتم استبدال البيانات الحالية بالنسخة الاحتياطية. هل تريد المتابعة؟"))return;
    data=imported;
    if(save()){message("تم استرجاع البيانات بنجاح ✅");render()}
  }catch(err){message("ملف النسخة الاحتياطية غير صالح.","err")}
  e.target.value="";
});

load();
})();