const TYPES={character:"CHARACTERS",characters:"CHARACTERS",location:"LOCATIONS",locations:"LOCATIONS",organization:"ORGANIZATIONS",organizations:"ORGANIZATIONS",faction:"ORGANIZATIONS",event:"EVENTS",events:"EVENTS",rule:"RULES",rules:"RULES",lore:"RULES",item:"ITEMS",items:"ITEMS"};
const prefix="WORLD_CARD_NOTE_TYPE_";
let lastOutput=null;

export function convertLorebook(source,options={}){
  if(!source||typeof source!=="object"||Array.isArray(source))throw new Error("The JSON root must be an object.");
  let raw=source.entries;
  const entries=Array.isArray(raw)?raw:(raw&&typeof raw==="object"?Object.values(raw):null);
  if(!entries)throw new Error("SillyTavern Lorebook must contain an entries object or array.");
  const fallback=String(options.noteType||"Rules").toUpperCase();
  const groups=new Map();
  let count=0;
  entries.forEach((entry,index)=>{
    if(!entry||typeof entry!=="object"||entry.disable===true)return;
    const content=String(entry.content||"").trim(); if(!content)return;
    const name=String(entry.comment||entry.name||`Entry ${index+1}`).trim();
    let keys=entry.key||[]; if(typeof keys==="string")keys=keys.split(",");
    keys=[...new Set(keys.map(x=>String(x).trim()).filter(Boolean))];
    const category=String(entry.category||"").trim().toLowerCase();
    const noteType=prefix+(TYPES[category]||fallback);
    const order=Number.isInteger(entry.order)?entry.order:50;
    const item={name,description:content,note_type:noteType,trigger_mode:keys.length?"WORLD_CARD_TRIGGER_MODE_KEYWORD":"WORLD_CARD_TRIGGER_MODE_ALWAYS_ON",priority_level:Math.min(5,Math.max(1,Math.floor(order/25)+1))};
    if(keys.length)item.key_words=keys;
    if(!groups.has(noteType))groups.set(noteType,[]); groups.get(noteType).push(item); count++;
  });
  if(!count)throw new Error("No enabled entries with content were found.");
  const tags=[...new Set(String(options.tags||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean))].slice(0,20);
  return {count,result:{name:String(options.name||"").trim()||"Imported Lorebook",introduction:String(options.introduction||"").trim()||"Converted from a SillyTavern Lorebook.",rating:"WORLD_CARD_RATING_FILTERED",visibility:"WORLD_CARD_VISIBILITY_PRIVATE",tags:{genre_tag:String(options.genre||"other").trim()||"other",content_tags:tags},notes:[...groups].map(([note_type,items])=>({note_type,items}))}};
}

const form=typeof document!=="undefined"?document.querySelector("#converter"):null;
if(form)form.addEventListener("submit",async event=>{
  event.preventDefault(); const status=document.querySelector("#status");
  try{
    const file=document.querySelector("#file").files[0]; if(!file)throw new Error("Choose a JSON file first.");
    if(file.size>5*1024*1024)throw new Error("The JSON file must be 5 MB or smaller.");
    const source=JSON.parse(await file.text());
    const converted=convertLorebook(source,{name:document.querySelector("#name").value,introduction:document.querySelector("#introduction").value,noteType:document.querySelector("#noteType").value,genre:document.querySelector("#genre").value,tags:document.querySelector("#tags").value});
    lastOutput=JSON.stringify(converted.result,null,2); document.querySelector("#preview").textContent=lastOutput; document.querySelector("#download").disabled=false;
    status.textContent=`Converted ${converted.count} enabled ${converted.count===1?"entry":"entries"}. Output is Private and Filtered.`;
  }catch(error){lastOutput=null;document.querySelector("#download").disabled=true;document.querySelector("#preview").textContent="Conversion failed.";status.textContent=`Conversion failed: ${error.message}`;}
});

const download=typeof document!=="undefined"?document.querySelector("#download"):null;
if(download)download.addEventListener("click",()=>{if(!lastOutput)return;const url=URL.createObjectURL(new Blob([lastOutput+"\n"],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="crushon-normalized.json";a.click();URL.revokeObjectURL(url);});
