const TYPES={character:"CHARACTERS",characters:"CHARACTERS",location:"LOCATIONS",locations:"LOCATIONS",organization:"ORGANIZATIONS",organizations:"ORGANIZATIONS",faction:"ORGANIZATIONS",event:"EVENTS",events:"EVENTS",rule:"RULES",rules:"RULES",lore:"RULES",item:"ITEMS",items:"ITEMS"};
const prefix="WORLD_CARD_NOTE_TYPE_";
const supportedFields=new Set(["uid","key","keysecondary","comment","name","content","order","disable","category","constant","selective","position","enabled","extensions"]);
const FIELD_MAPPINGS=[
  {source:"comment / name",target:"name",rule:"First non-empty title; otherwise Entry N"},
  {source:"content",target:"description",rule:"Trimmed text; empty entries are skipped"},
  {source:"key",target:"key_words",rule:"Strings are split on commas; duplicates are removed"},
  {source:"category",target:"note_type",rule:"Recognized category or selected fallback note type"},
  {source:"key presence",target:"trigger_mode",rule:"Keyword when keys exist; Always On otherwise"},
  {source:"order",target:"priority_level",rule:"Clamped to levels 1–5 using floor(order / 25) + 1"},
];
let lastOutput=null;

export function parseJsonWithLocation(text){
  try{return JSON.parse(text);}catch(error){
    const message=String(error?.message||"Invalid JSON.");
    const positionMatch=message.match(/position\s+(\d+)/i);
    const tokenMatch=message.match(/Unexpected token '([^']+)'/i);
    let position=positionMatch?Number(positionMatch[1]):-1;
    if(position<0&&tokenMatch)position=String(text).indexOf(tokenMatch[1]);
    if(position<0)throw new Error(`Invalid JSON: ${message}`);
    const before=String(text).slice(0,position);
    const line=before.split("\n").length;
    const column=position-before.lastIndexOf("\n");
    throw new Error(`Invalid JSON at line ${line}, column ${column}: ${message}`);
  }
}

function normalizeKeys(value){
  if(typeof value==="string")value=value.split(",");
  if(!Array.isArray(value))return {keys:[],invalid:true,duplicates:0};
  const cleaned=value.map(item=>String(item).trim()).filter(Boolean);
  const keys=[...new Set(cleaned)];
  return {keys,invalid:false,duplicates:cleaned.length-keys.length};
}

export function convertLorebook(source,options={}){
  if(!source||typeof source!=="object"||Array.isArray(source))throw new Error("The JSON root must be an object.");
  const raw=source.entries;
  const entries=Array.isArray(raw)?raw:(raw&&typeof raw==="object"?Object.values(raw):null);
  if(!entries)throw new Error("SillyTavern Lorebook must contain an entries object or array.");
  const fallback=String(options.noteType||"Rules").toUpperCase();
  const groups=new Map();
  const report={sourceEntries:entries.length,converted:0,skipped:{disabled:0,empty:0,invalid:0},fallbackCategories:{},duplicateKeywordsRemoved:0,unsupportedFields:[],warnings:[],fieldMappings:FIELD_MAPPINGS};
  const unsupported=new Set();

  entries.forEach((entry,index)=>{
    const label=`Entry ${index+1}`;
    if(!entry||typeof entry!=="object"||Array.isArray(entry)){
      report.skipped.invalid++;
      report.warnings.push(`${label}: skipped because it is not an object.`);
      return;
    }
    Object.keys(entry).filter(field=>!supportedFields.has(field)).forEach(field=>unsupported.add(field));
    if(entry.disable===true||entry.enabled===false){report.skipped.disabled++;return;}
    const content=String(entry.content||"").trim();
    if(!content){report.skipped.empty++;return;}
    const name=String(entry.comment||entry.name||label).trim()||label;
    const normalizedKeys=normalizeKeys(entry.key||[]);
    if(normalizedKeys.invalid)report.warnings.push(`${name}: key must be an array or comma-separated string; converted as Always On.`);
    report.duplicateKeywordsRemoved+=normalizedKeys.duplicates;
    const category=String(entry.category||"").trim().toLowerCase();
    const mappedType=TYPES[category];
    if(!mappedType){
      const categoryLabel=category||"(missing)";
      report.fallbackCategories[categoryLabel]=(report.fallbackCategories[categoryLabel]||0)+1;
    }
    const noteType=prefix+(mappedType||fallback);
    const order=Number.isInteger(entry.order)?entry.order:50;
    if(entry.order!==undefined&&!Number.isInteger(entry.order))report.warnings.push(`${name}: non-integer order used the default value 50.`);
    const item={name,description:content,note_type:noteType,trigger_mode:normalizedKeys.keys.length?"WORLD_CARD_TRIGGER_MODE_KEYWORD":"WORLD_CARD_TRIGGER_MODE_ALWAYS_ON",priority_level:Math.min(5,Math.max(1,Math.floor(order/25)+1))};
    if(normalizedKeys.keys.length)item.key_words=normalizedKeys.keys;
    if(!groups.has(noteType))groups.set(noteType,[]);
    groups.get(noteType).push(item);
    report.converted++;
  });

  if(!report.converted)throw new Error("No enabled entries with content were found.");
  report.unsupportedFields=[...unsupported].sort();
  const tags=[...new Set(String(options.tags||"").split(",").map(item=>item.trim().toLowerCase()).filter(Boolean))].slice(0,20);
  const result={name:String(options.name||"").trim()||"Imported Lorebook",introduction:String(options.introduction||"").trim()||"Converted from a SillyTavern Lorebook.",rating:"WORLD_CARD_RATING_FILTERED",visibility:"WORLD_CARD_VISIBILITY_PRIVATE",tags:{genre_tag:String(options.genre||"other").trim()||"other",content_tags:tags},notes:[...groups].map(([note_type,items])=>({note_type,items}))};
  return {count:report.converted,result,report};
}

export function formatConversionReport(report){
  const skippedTotal=report.skipped.disabled+report.skipped.empty+report.skipped.invalid;
  const fallback=Object.entries(report.fallbackCategories);
  const lines=[
    "CONVERSION SUMMARY",
    `Source entries: ${report.sourceEntries}`,
    `Converted: ${report.converted}`,
    `Skipped: ${skippedTotal} (disabled ${report.skipped.disabled}, empty ${report.skipped.empty}, invalid ${report.skipped.invalid})`,
    `Duplicate keywords removed: ${report.duplicateKeywordsRemoved}`,
    `Fallback categories: ${fallback.length?fallback.map(([name,count])=>`${name} (${count})`).join(", "):"none"}`,
    `Unsupported source fields: ${report.unsupportedFields.length?report.unsupportedFields.join(", "):"none detected"}`,
    "",
    "FIELD MAPPINGS",
    ...report.fieldMappings.map(mapping=>`${mapping.source} → ${mapping.target}: ${mapping.rule}`),
  ];
  if(report.warnings.length)lines.push("","WARNINGS",...report.warnings.map(warning=>`- ${warning}`));
  return lines.join("\n");
}

const form=typeof document!=="undefined"?document.querySelector("#converter"):null;
if(form)form.addEventListener("submit",async event=>{
  event.preventDefault();
  const status=document.querySelector("#status");
  try{
    const file=document.querySelector("#file").files[0];
    if(!file)throw new Error("Choose a JSON file first.");
    if(file.size>5*1024*1024)throw new Error("The JSON file must be 5 MB or smaller.");
    const source=parseJsonWithLocation(await file.text());
    const converted=convertLorebook(source,{name:document.querySelector("#name").value,introduction:document.querySelector("#introduction").value,noteType:document.querySelector("#noteType").value,genre:document.querySelector("#genre").value,tags:document.querySelector("#tags").value});
    lastOutput=JSON.stringify(converted.result,null,2);
    document.querySelector("#preview").textContent=lastOutput;
    document.querySelector("#report").textContent=formatConversionReport(converted.report);
    document.querySelector("#download").disabled=false;
    const skipped=converted.report.sourceEntries-converted.report.converted;
    status.textContent=`Converted ${converted.count} ${converted.count===1?"entry":"entries"}; skipped ${skipped}. Review the mapping report before downloading.`;
  }catch(error){
    lastOutput=null;
    document.querySelector("#download").disabled=true;
    document.querySelector("#preview").textContent="Conversion failed.";
    document.querySelector("#report").textContent="No mapping report is available because conversion failed.";
    status.textContent=`Conversion failed: ${error.message}`;
  }
});

const download=typeof document!=="undefined"?document.querySelector("#download"):null;
if(download)download.addEventListener("click",()=>{if(!lastOutput)return;const url=URL.createObjectURL(new Blob([lastOutput+"\n"],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="crushon-normalized.json";a.click();URL.revokeObjectURL(url);});
