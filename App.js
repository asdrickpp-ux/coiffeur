"use strict";

const APP_NAME="COIFF'BOOST";
const VERSION="11.0";
const STORAGE_KEY="coiffboost_v11";
const OWNER_CODE="AUDREY";

const PLANS={
FREE:{
name:"GRATUIT",
price:0,
features:{
statistics:false,
products:false
}
},
PRO:{
name:"PRO",
price:9.99,
features:{
statistics:true,
products:true
}
},
PREMIUM:{
name:"PREMIUM",
price:19.99,
features:{
statistics:true,
products:true
}
}
};

let state={
settings:{
salon:"",
owner:"",
phone:"",
address:""
},
plan:"FREE",
ownerUnlocked:false,
clients:[],
appointments:[],
services:[],
products:[],
invoices:[],
calendarDate:new Date().toISOString().slice(0,10)
};

document.addEventListener("DOMContentLoaded",()=>{
loadData();
initialiseDefaults();
setupEvents();
renderAll();
navigate("dashboard");
});


function loadData(){
try{
const saved=localStorage.getItem(STORAGE_KEY);
if(!saved)return;
const data=JSON.parse(saved);

state={
...state,
...data,
settings:{
...state.settings,
...(data.settings||{})
},
clients:Array.isArray(data.clients)?data.clients:[],
appointments:Array.isArray(data.appointments)?data.appointments:[],
services:Array.isArray(data.services)?data.services:[],
products:Array.isArray(data.products)?data.products:[],
invoices:Array.isArray(data.invoices)?data.invoices:[]
};
}catch(e){
console.error(e);
}
}


function saveData(){
localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}


function initialiseDefaults(){

if(state.services.length===0){

state.services=[
{id:uid(),name:"Coupe femme",duration:60,price:35,cost:4},
{id:uid(),name:"Brushing",duration:45,price:25,cost:2},
{id:uid(),name:"Coupe homme",duration:30,price:22,cost:2}
];

saveData();
}

}


function renderAll(){
renderDashboard();
renderClients();
renderServices();
renderAppointments();
renderCalendar();
renderInvoiceHistory();
renderProducts();
renderStatistics();
renderSettings();
updateSubscriptionPage();
updateSalonHeader();
updatePlanBadge();
}


function navigate(page){

document.querySelectorAll(".page").forEach(p=>{
p.classList.remove("active");
});

const target=document.getElementById("page-"+page);

if(!target){
console.error("Page inexistante:",page);
return;
}

target.classList.add("active");

document.querySelectorAll(".bottom-nav button").forEach(btn=>{
btn.classList.toggle("active",btn.dataset.nav===page);
});

if(page==="dashboard")renderDashboard();
if(page==="planning"){
renderCalendar();
renderAppointments();
}
if(page==="clients")renderClients();
if(page==="services")renderServices();
if(page==="calculator")resetCalculatorResult();
if(page==="invoice")renderInvoiceHistory();
if(page==="products")renderProducts();
if(page==="statistics")renderStatistics();
if(page==="subscription")updateSubscriptionPage();
if(page==="settings")renderSettings();

}


function renderDashboard(){

setText("dashboardRevenue",money(calculateRevenue()));
setText("dashboardToday",countTodayAppointments());
setText("dashboardClients",state.clients.length);
setText("dashboardInvoices",state.invoices.length);

const box=document.getElementById("dashboardAppointments");
if(!box)return;

const now=new Date();

const appointments=[...state.appointments]
.filter(a=>new Date(`${a.date}T${a.time||"00:00"}`)>=now)
.sort(sortAppointments)
.slice(0,5);

box.innerHTML=appointments.length
?appointments.map(a=>appointmentHTML(a)).join("")
:`<div class="list-empty">Aucun prochain rendez-vous.</div>`;
}


function openClientModal(){

setValue("clientName","");
setValue("clientPhone","");
setValue("clientNotes","");
openModal("clientModal");
}


function saveClient(){

const name=value("clientName");

if(!name){
toast("Indiquez le nom de la cliente.");
return;
}

state.clients.push({
id:uid(),
name,
phone:value("clientPhone"),
notes:value("clientNotes"),
createdAt:new Date().toISOString()
});

saveData();
closeModal("clientModal");
renderClients();
renderDashboard();
toast("Cliente ajoutée.");
}


function renderClients(){

const box=document.getElementById("clientsList");
if(!box)return;

const search=value("clientSearch").toLowerCase();

const clients=state.clients.filter(c=>
c.name.toLowerCase().includes(search) ||
(c.phone||"").includes(search)
);

if(!clients.length){
box.innerHTML=`<div class="list-empty">Aucune cliente trouvée.</div>`;
return;
}

box.innerHTML=clients.map(c=>{

const revenue=state.invoices
.filter(i=>i.client===c.name)
.reduce((s,i)=>s+Number(i.total||0),0);

return `
<div class="list-item">
<div class="list-avatar">${initials(c.name)}</div>

<div class="list-content">
<strong>${esc(c.name)}</strong>
<small>${esc(c.phone||"Aucun téléphone")}</small>
<small>CA : ${money(revenue)}</small>
</div>

<div class="list-actions">
<button class="small-btn" onclick="editClient('${c.id}')">✏️</button>
<button class="small-btn" onclick="deleteClient('${c.id}')">🗑️</button>
</div>
</div>`;
}).join("");
}


function editClient(id){

const c=state.clients.find(x=>x.id===id);
if(!c)return;

const name=prompt("Nom",c.name);
if(name===null)return;

const phone=prompt("Téléphone",c.phone||"");
const notes=prompt("Notes",c.notes||"");

if(!name.trim())return;

c.name=name.trim();
c.phone=phone||"";
c.notes=notes||"";

saveData();
renderClients();
toast("Cliente modifiée.");
}


function deleteClient(id){

const c=state.clients.find(x=>x.id===id);
if(!c)return;

if(!confirm(`Supprimer ${c.name} ?`))return;

state.clients=state.clients.filter(x=>x.id!==id);

saveData();
renderClients();
renderDashboard();
toast("Cliente supprimée.");
}


function openAppointmentModal(){

setValue("appointmentClient","");
setValue("appointmentService","");
setValue("appointmentPrice","");

setValue(
"appointmentDate",
new Date().toISOString().slice(0,10)
);

setValue("appointmentTime","10:00");

openModal("appointmentModal");
}


function saveAppointment(){

const client=value("appointmentClient");
const date=value("appointmentDate");
const time=value("appointmentTime");

if(!client||!date||!time){
toast("Complétez la cliente, la date et l'heure.");
return;
}

state.appointments.push({
id:uid(),
client,
date,
time,
service:value("appointmentService"),
price:Number(value("appointmentPrice")||0),
status:"planned"
});

saveData();
closeModal("appointmentModal");
renderAppointments();
renderCalendar();
renderDashboard();
toast("Rendez-vous ajouté.");
}


function renderAppointments(){

const box=document.getElementById("appointmentsList");
if(!box)return;

const data=[...state.appointments].sort(sortAppointments);

box.innerHTML=data.length
?data.map(a=>appointmentHTML(a,true)).join("")
:`<div class="list-empty">Aucun rendez-vous.</div>`;
}


function appointmentHTML(a,detailed=false){

let status="Prévue";

if(a.status==="done")status="Terminée";
if(a.status==="cancelled")status="Annulée";

return `
<div class="list-item">
<div class="list-avatar">📅</div>

<div class="list-content">
<strong>${esc(a.client)}</strong>
<small>${formatDate(a.date)} à ${esc(a.time||"")}</small>
<small>${esc(a.service||"Prestation")}</small>
${detailed?`<small>${status}</small>`:""}
</div>

<div class="list-actions">
<span class="list-price">${money(a.price)}</span>

${detailed?`
<button class="small-btn" onclick="toggleAppointmentStatus('${a.id}')">✓</button>
<button class="small-btn" onclick="deleteAppointment('${a.id}')">🗑️</button>
`:""}

</div>
</div>`;
}


function toggleAppointmentStatus(id){

const a=state.appointments.find(x=>x.id===id);
if(!a)return;

if(a.status==="planned")a.status="done";
else if(a.status==="done")a.status="cancelled";
else a.status="planned";

saveData();
renderAppointments();
renderDashboard();
toast("Statut modifié.");
}


function deleteAppointment(id){

if(!confirm("Supprimer ce rendez-vous ?"))return;

state.appointments=state.appointments.filter(x=>x.id!==id);

saveData();
renderAppointments();
renderCalendar();
renderDashboard();
toast("Rendez-vous supprimé.");
}


function changeCalendar(direction){

const d=new Date(state.calendarDate);

d.setMonth(d.getMonth()+direction);

state.calendarDate=d.toISOString().slice(0,10);

renderCalendar();
}


function renderCalendar(){

const calendar=document.getElementById("calendar");
const title=document.getElementById("calendarTitle");

if(!calendar||!title)return;

const d=new Date(state.calendarDate);
const year=d.getFullYear();
const month=d.getMonth();

title.textContent=d.toLocaleDateString("fr-FR",{
month:"long",
year:"numeric"
});

const first=new Date(year,month,1);
const last=new Date(year,month+1,0);

let start=first.getDay();
start=start===0?6:start-1;

let html=["L","M","M","J","V","S","D"]
.map(x=>`<div class="calendar-day-name">${x}</div>`).join("");

for(let i=0;i<start;i++){
html+=`<div class="calendar-day empty"></div>`;
}

for(let day=1;day<=last.getDate();day++){

const date=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

const event=state.appointments.some(a=>a.date===date);

const today=date===new Date().toISOString().slice(0,10);

html+=`
<div class="calendar-day ${today?"today":""} ${event?"has-event":""}"
onclick="selectCalendarDate('${date}')">
${day}
</div>`;
}

calendar.innerHTML=html;
}


function selectCalendarDate(date){

state.calendarDate=date;

renderCalendar();

const count=state.appointments.filter(a=>a.date===date).length;

toast(
count
?`${count} rendez-vous le ${formatDate(date)}`
:`Aucun rendez-vous le ${formatDate(date)}`
);
}


function openServiceModal(){

setValue("serviceName","");
setValue("serviceDuration",60);
setValue("servicePrice","");
setValue("serviceCost","");

openModal("serviceModal");
}


function saveService(){

const name=value("serviceName");

if(!name){
toast("Indiquez le nom de la prestation.");
return;
}

state.services.push({
id:uid(),
name,
duration:Number(value("serviceDuration")||0),
price:Number(value("servicePrice")||0),
cost:Number(value("serviceCost")||0)
});

saveData();
closeModal("serviceModal");
renderServices();
toast("Prestation ajoutée.");
}


function renderServices(){

const box=document.getElementById("servicesList");
if(!box)return;

if(!state.services.length){
box.innerHTML=`<div class="list-empty">Aucune prestation.</div>`;
return;
}

box.innerHTML=state.services.map(s=>{

const margin=Number(s.price)-Number(s.cost);

return `
<div class="list-item">
<div class="list-avatar">✂️</div>

<div class="list-content">
<strong>${esc(s.name)}</strong>
<small>${s.duration} min · coût ${money(s.cost)}</small>
<small>Marge ${money(margin)}</small>
</div>

<div class="list-actions">
<span class="list-price">${money(s.price)}</span>
<button class="small-btn" onclick="editService('${s.id}')">✏️</button>
<button class="small-btn" onclick="deleteService('${s.id}')">🗑️</button>
</div>
</div>`;
}).join("");
}


function editService(id){

const s=state.services.find(x=>x.id===id);
if(!s)return;

const name=prompt("Nom",s.name);
if(name===null)return;

const price=prompt("Prix",s.price);
const duration=prompt("Durée",s.duration);
const cost=prompt("Coût produits",s.cost);

s.name=name.trim();
s.price=Number(price||0);
s.duration=Number(duration||0);
s.cost=Number(cost||0);

saveData();
renderServices();
toast("Prestation modifiée.");
}


function deleteService(id){

if(!confirm("Supprimer cette prestation ?"))return;

state.services=state.services.filter(x=>x.id!==id);

saveData();
renderServices();
toast("Prestation supprimée.");
}


function calculatePrice(){

const name=value("calculatorName");
const minutes=Number(value("calculatorMinutes")||0);
const hourly=Number(value("calculatorHourly")||0);
const products=Number(value("calculatorProducts")||0);
const charges=Number(value("calculatorCharges")||0);
const margin=Number(value("calculatorMargin")||0);

if(minutes<=0||hourly<=0){
toast("Indiquez une durée et un taux horaire.");
return;
}

const labor=minutes/60*hourly;
const cost=labor+products+charges;
const recommended=cost*(1+margin/100);

document.getElementById("calculatorResult").innerHTML=`
<small>${esc(name||"Tarif conseillé")}</small>
<strong>${money(recommended)}</strong>
<p>Coût estimé : ${money(cost)}</p>
`;
}


function resetCalculatorResult(){

const box=document.getElementById("calculatorResult");
if(!box)return;

box.innerHTML=`
<small>Tarif conseillé</small>
<strong>0,00 €</strong>
<p>Remplissez les informations.</p>`;
}


function openProductModal(){

if(!hasFeature("products")){
showProMessage();
return;
}

setValue("productName","");
setValue("productPrice","");
setValue("productStock",1);

openModal("productModal");
}


function saveProduct(){

if(!hasFeature("products")){
showProMessage();
return;
}

const name=value("productName");

if(!name){
toast("Indiquez le nom du produit.");
return;
}

state.products.push({
id:uid(),
name,
price:Number(value("productPrice")||0),
stock:Number(value("productStock")||0)
});

saveData();
closeModal("productModal");
renderProducts();
toast("Produit ajouté.");
}


function renderProducts(){

const box=document.getElementById("productsList");
if(!box)return;

if(!hasFeature("products")){

box.innerHTML=`
<div class="locked-card">
<div class="lock-icon">🔒</div>
<h2>Gestion produits PRO</h2>
<p>Cette fonction est disponible avec PRO ou PREMIUM.</p>
<button class="primary-btn" onclick="navigate('subscription')">Voir les offres</button>
</div>`;

return;
}

if(!state.products.length){
box.innerHTML=`<div class="list-empty">Aucun produit.</div>`;
return;
}

box.innerHTML=state.products.map(p=>`
<div class="list-item">
<div class="list-avatar">🧴</div>

<div class="list-content">
<strong>${esc(p.name)}</strong>
<small>Prix : ${money(p.price)}</small>
<small>Stock : ${p.stock}</small>
</div>

<div class="list-actions">
<button class="small-btn" onclick="deleteProduct('${p.id}')">🗑️</button>
</div>
</div>
`).join("");
}


function deleteProduct(id){

if(!hasFeature("products")){
showProMessage();
return;
}

if(!confirm("Supprimer ce produit ?"))return;

state.products=state.products.filter(x=>x.id!==id);

saveData();
renderProducts();
toast("Produit supprimé.");
}


function generateInvoice(){

const client=value("invoiceClient");
const service=value("invoiceService");
const quantity=Number(value("invoiceQuantity")||1);
const price=Number(value("invoicePrice")||0);
const discount=Number(value("invoiceDiscount")||0);

if(!client||!service){
toast("Indiquez la cliente et la prestation.");
return;
}

const total=Math.max(0,quantity*price-discount);

setText("invoiceNumber",invoiceNumber());
setText("invoiceDate",formatDate(new Date().toISOString().slice(0,10)));
setText("invoiceClientDisplay",client);
setText("invoiceServiceDisplay",service);
setText("invoiceQuantityDisplay",quantity);
setText("invoiceTotalDisplay",money(total));
setText("invoiceFinalTotal",money(total));

toast("Aperçu généré.");
}


function saveInvoice(){

const client=value("invoiceClient");
const service=value("invoiceService");
const quantity=Number(value("invoiceQuantity")||1);
const price=Number(value("invoicePrice")||0);
const discount=Number(value("invoiceDiscount")||0);

if(!client||!service){
toast("Complétez la facture.");
return;
}

const total=Math.max(0,quantity*price-discount);

state.invoices.push({
id:uid(),
number:invoiceNumber(),
client,
service,
quantity,
price,
discount,
total,
date:new Date().toISOString().slice(0,10),
paid:false
});

saveData();
renderInvoiceHistory();
renderDashboard();
toast("Facture enregistrée.");
}


function renderInvoiceHistory(){

const box=document.getElementById("invoiceHistory");
if(!box)return;

if(!state.invoices.length){
box.innerHTML=`<div class="list-empty">Aucune facture enregistrée.</div>`;
return;
}

box.innerHTML=[...state.invoices].reverse().map(i=>`
<div class="list-item">
<div class="list-avatar">🧾</div>

<div class="list-content">
<strong>${esc(i.number)}</strong>
<small>${esc(i.client)} · ${esc(i.service)}</small>
<small>${formatDate(i.date)} · ${i.paid?"Payée":"Impayée"}</small>
</div>

<div class="list-actions">
<span class="list-price">${money(i.total)}</span>
<button class="small-btn" onclick="toggleInvoicePaid('${i.id}')">
${i.paid?"✓":"€"}
</button>
<button class="small-btn" onclick="deleteInvoice('${i.id}')">🗑️</button>
</div>
</div>
`).join("");
}


function toggleInvoicePaid(id){

const i=state.invoices.find(x=>x.id===id);
if(!i)return;

i.paid=!i.paid;

saveData();
renderInvoiceHistory();
toast(i.paid?"Facture payée.":"Facture impayée.");
}


function deleteInvoice(id){

if(!confirm("Supprimer cette facture ?"))return;

state.invoices=state.invoices.filter(x=>x.id!==id);

saveData();
renderInvoiceHistory();
renderDashboard();
toast("Facture supprimée.");
}


function printInvoice(){

window.print();
}


function renderStatistics(){

const locked=document.getElementById("statisticsLocked");
const content=document.getElementById("statisticsContent");

if(!locked||!content)return;

if(!hasFeature("statistics")){

locked.classList.remove("hidden");
content.classList.add("hidden");
return;
}

locked.classList.add("hidden");
content.classList.remove("hidden");

const revenue=calculateRevenue();

setText("statsRevenue",money(revenue));
setText(
"statsAverage",
money(state.invoices.length?revenue/state.invoices.length:0)
);
setText("statsClients",state.clients.length);
setText("statsServices",state.services.length);

const bestClient=getBestClient();
const bestService=getBestService();

document.getElementById("statsAnalysis").innerHTML=`
<div class="analysis-row">
<span>Meilleure cliente</span>
<strong>${bestClient?esc(bestClient.name):"—"}</strong>
</div>

<div class="analysis-row">
<span>Prestation la plus vendue</span>
<strong>${bestService?esc(bestService):"—"}</strong>
</div>

<div class="analysis-row">
<span>Factures payées</span>
<strong>${state.invoices.filter(i=>i.paid).length}</strong>
</div>

<div class="analysis-row">
<span>Factures impayées</span>
<strong>${state.invoices.filter(i=>!i.paid).length}</strong>
</div>
`;
}


function getBestClient(){

if(!state.clients.length)return null;

return state.clients.map(c=>({
...c,
revenue:state.invoices
.filter(i=>i.client===c.name)
.reduce((s,i)=>s+Number(i.total||0),0)
}))
.sort((a,b)=>b.revenue-a.revenue)[0];
}


function getBestService(){

const counts={};

state.invoices.forEach(i=>{
counts[i.service]=(counts[i.service]||0)+Number(i.quantity||1);
});

const list=Object.entries(counts).sort((a,b)=>b[1]-a[1]);

return list.length?list[0][0]:null;
}


function selectPlan(plan){

if(!PLANS[plan])return;

if(plan==="FREE"){

state.plan="FREE";
state.ownerUnlocked=false;

saveData();
updatePlanBadge();
updateSubscriptionPage();
renderProducts();
renderStatistics();

toast("Formule Gratuit activée.");
return;
}

if(!confirm(
`Activer ${PLANS[plan].name} en mode présentation locale ?`
))return;

state.plan=plan;

saveData();

updatePlanBadge();
updateSubscriptionPage();
renderProducts();
renderStatistics();

toast(`Formule ${PLANS[plan].name} activée.`);
}


function hasFeature(feature){

if(state.ownerUnlocked)return true;

return Boolean(
PLANS[state.plan]?.features?.[feature]
);
}


function updateSubscriptionPage(){

setText(
"currentPlan",
PLANS[state.plan]?.name||"GRATUIT"
);
}


function updatePlanBadge(){

setText(
"planBadge",
state.ownerUnlocked
?"ACCÈS COMPLET"
:PLANS[state.plan]?.name||"GRATUIT"
);
}


function showProMessage(){

toast("★ Cette fonction nécessite PRO.");
}


function renderSettings(){

setValue("settingSalon",state.settings.salon);
setValue("settingOwner",state.settings.owner);
setValue("settingPhone",state.settings.phone);
setValue("settingAddress",state.settings.address);
}


function saveSettings(){

state.settings.salon=value("settingSalon");
state.settings.owner=value("settingOwner");
state.settings.phone=value("settingPhone");
state.settings.address=value("settingAddress");

saveData();
updateSalonHeader();

toast("Paramètres enregistrés.");
}


function updateSalonHeader(){

setText(
"salonHeader",
state.settings.salon||"Gestion professionnelle"
);

setText(
"invoiceSalon",
state.settings.salon||APP_NAME
);

setText(
"invoiceOwner",
state.settings.owner||"Gestion professionnelle"
);
}


function unlockOwner(){

const code=value("masterCode");
const message=document.getElementById("unlockMessage");

if(code===OWNER_CODE){

state.ownerUnlocked=true;
state.plan="PREMIUM";

saveData();

updatePlanBadge();
updateSubscriptionPage();
renderProducts();
renderStatistics();

setValue("masterCode","");

message.textContent="✓ Accès complet activé.";
message.style.color="var(--green)";

toast("Accès complet débloqué.");
return;
}

message.textContent="Code incorrect.";
message.style.color="var(--red)";

toast("Code incorrect.");
}


function exportData(){

const blob=new Blob(
[JSON.stringify(state,null,2)],
{type:"application/json"}
);

const url=URL.createObjectURL(blob);
const a=document.createElement("a");

a.href=url;
a.download=`coiffboost-${new Date().toISOString().slice(0,10)}.json`;

a.click();

URL.revokeObjectURL(url);

toast("Sauvegarde exportée.");
}


function resetData(){

if(prompt("Tapez SUPPRIMER pour confirmer.")!=="SUPPRIMER")return;

localStorage.removeItem(STORAGE_KEY);
location.reload();
}


function openModal(id){

const modal=document.getElementById(id);

if(modal)modal.classList.add("active");
}


function closeModal(id){

const modal=document.getElementById(id);

if(modal)modal.classList.remove("active");
}


function setupEvents(){

document.querySelectorAll(".modal").forEach(modal=>{

modal.addEventListener("click",e=>{

if(e.target===modal){
modal.classList.remove("active");
}

});

});

document.addEventListener("keydown",e=>{

if(e.key==="Escape"){

document.querySelectorAll(".modal.active")
.forEach(m=>m.classList.remove("active"));

}

});

}


function uid(){

return Date.now().toString(36)+
Math.random().toString(36).slice(2);
}


function value(id){

const el=document.getElementById(id);

return el?el.value.trim():"";
}


function setValue(id,v){

const el=document.getElementById(id);

if(el)el.value=v??"";
}


function setText(id,v){

const el=document.getElementById(id);

if(el)el.textContent=v??"";
}


function money(v){

return new Intl.NumberFormat("fr-FR",{
style:"currency",
currency:"EUR"
}).format(Number(v)||0);
}


function formatDate(v){

if(!v)return"—";

const d=new Date(`${v}T12:00:00`);

return isNaN(d)?v:d.toLocaleDateString("fr-FR");
}


function sortAppointments(a,b){

return new Date(`${a.date}T${a.time||"00:00"}`)-
new Date(`${b.date}T${b.time||"00:00"}`);
}


function countTodayAppointments(){

const today=new Date().toISOString().slice(0,10);

return state.appointments.filter(a=>a.date===today).length;
}


function calculateRevenue(){

return state.invoices.reduce(
(s,i)=>s+Number(i.total||0),0
);
}


function initials(name){

return name
.trim()
.split(/\s+/)
.slice(0,2)
.map(x=>x[0]?.toUpperCase()||"")
.join("");
}


function invoiceNumber(){

return `CB-${new Date().getFullYear()}${String(
new Date().getMonth()+1
).padStart(2,"0")}${String(
new Date().getDate()
).padStart(2,"0")}-${String(
state.invoices.length+1
).padStart(4,"0")}`;
}


function esc(v){

return String(v??"")
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;");
}


let toastTimer;

function toast(message){

const el=document.getElementById("toast");
if(!el)return;

el.textContent=message;
el.classList.add("show");

clearTimeout(toastTimer);

toastTimer=setTimeout(()=>{
el.classList.remove("show");
},2600);
}


window.COIFFBOOST={
state,
navigate,
saveData,
calculatePrice,
unlockOwner
};

console.log(`${APP_NAME} V${VERSION} chargé.`);