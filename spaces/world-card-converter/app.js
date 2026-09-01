const TYPES={character:"CHARACTERS",characters:"CHARACTERS",location:"LOCATIONS",locations:"LOCATIONS",organization:"ORGANIZATIONS",organizations:"ORGANIZATIONS",faction:"ORGANIZATIONS",event:"EVENTS",events:"EVENTS",rule:"RULES",rules:"RULES",lore:"RULES",item:"ITEMS",items:"ITEMS"};
const prefix="WORLD_CARD_NOTE_TYPE_";
export const CONVERTER_VERSION="0.3.0";
const supportedFields=new Set(["uid","key","keysecondary","comment","name","content","order","disable","category","constant","selective","position","enabled","extensions"]);
export const FIELD_COMPATIBILITY=[
  {source:"uid",status:"skipped",target:null,rule:"Source-local sequence identifiers are not exported."},
  {source:"comment",status:"approximated",target:"name",rule:"Used as the title when present; falls back to name or Entry N."},
  {source:"name",status:"mapped",target:"name",rule:"Used when comment is empty."},
  {source:"content",status:"mapped",target:"description",rule:"Trimmed text; empty entries are skipped."},
  {source:"key",status:"mapped",target:"key_words",rule:"Strings are split on commas and duplicate values are removed."},
  {source:"keysecondary",status:"skipped",target:null,rule:"Secondary-key logic is not represented by the normalized target."},
  {source:"category",status:"approximated",target:"note_type",rule:"Recognized categories are mapped; unknown values use the selected fallback."},
  {source:"constant",status:"mapped",target:"trigger_mode",rule:"True becomes Always On; otherwise entries with keys use Keyword."},
  {source:"order",status:"approximated",target:"priority_level",rule:"Clamped to levels 1–5 using floor(order / 25) + 1."},
  {source:"disable",status:"mapped",target:null,rule:"Disabled entries are skipped and reported."},
  {source:"enabled",status:"mapped",target:null,rule:"Entries explicitly set to false are skipped and reported."},
  {source:"selective",status:"skipped",target:null,rule:"Selective activation logic is not represented by the normalized target."},
  {source:"position",status:"skipped",target:null,rule:"Prompt insertion position is frontend-specific."},
  {source:"extensions",status:"skipped",target:null,rule:"Unverified source extensions are not copied automatically."},
];
const compatibilityByField=new Map(FIELD_COMPATIBILITY.map(item=>[item.source,item]));
const FIELD_MAPPINGS=FIELD_COMPATIBILITY.filter(item=>item.target).map(({source,target,status,rule})=>({source,target,status,rule}));
export const SAMPLE_LOREBOOKS={
  "harbor-rules":{label:"Moonlit Harbor — location and rules",name:"Moonlit Harbor",introduction:"A fogbound port where old magic is regulated by the harbor council.",genre:"mystery",tags:"harbor, magic, rules",source:{entries:[
    {comment:"Moonlit Harbor",content:"Moonlit Harbor is a fogbound independent port governed by a five-member council.",key:["Moonlit Harbor","harbor city"],category:"location",order:70},
    {comment:"Magic Registration",content:"Visitors must register enchanted cargo at the eastern gate before entering the city.",key:["enchanted cargo","eastern gate"],category:"rule",order:85},
  ]}},
  "character-bond":{label:"Aster and Rowan — character relationship",name:"The Lantern Pact",introduction:"Two reluctant allies protect a magical archive.",genre:"fantasy",tags:"characters, relationship, archive",source:{entries:[
    {comment:"Aster Vale",content:"Aster Vale is a reserved archivist who speaks precisely and protects forbidden records.",key:["Aster","Aster Vale"],category:"character",order:80},
    {comment:"The Lantern Pact",content:"Aster and Rowan became allies after surviving the archive fire; they trust each other with dangerous records.",key:["Lantern Pact","archive fire"],category:"event",order:75},
  ]}},
  "guild-event":{label:"Ash Guild — faction and event",name:"Ash Guild Conflict",introduction:"A compact faction-and-event fixture for testing retrieval categories.",genre:"adventure",tags:"faction, event, intrigue",source:{entries:[
    {comment:"Ash Guild",content:"The Ash Guild controls night trade through the lighthouse district and uses a silver-wing emblem.",key:["Ash Guild","silver-wing emblem"],category:"faction",order:65},
    {comment:"Broken Beacon",content:"The Broken Beacon incident ended the guild's truce with the harbor council.",key:["Broken Beacon","guild truce"],category:"event",order:90},
  ]}},
};
let lastOutput=null;
let lastReportOutput=null;
let loadedExample=null;

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
  const report={sourceEntries:entries.length,converted:0,skipped:{disabled:0,empty:0,invalid:0},fallbackCategories:{},duplicateKeywordsRemoved:0,unsupportedFields:[],warnings:[],fieldMappings:FIELD_MAPPINGS,fieldCoverage:{mapped:[],approximated:[],skipped:[]}};
  const unsupported=new Set();
  const observed={mapped:new Set(),approximated:new Set(),skipped:new Set()};

  entries.forEach((entry,index)=>{
    const label=`Entry ${index+1}`;
    if(!entry||typeof entry!=="object"||Array.isArray(entry)){
      report.skipped.invalid++;
      report.warnings.push(`${label}: skipped because it is not an object.`);
      return;
    }
    Object.keys(entry).forEach(field=>{
      const compatibility=compatibilityByField.get(field);
      if(compatibility)observed[compatibility.status].add(field);
      else if(!supportedFields.has(field))unsupported.add(field);
    });
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
    const alwaysOn=entry.constant===true||!normalizedKeys.keys.length;
    const item={name,description:content,note_type:noteType,trigger_mode:alwaysOn?"WORLD_CARD_TRIGGER_MODE_ALWAYS_ON":"WORLD_CARD_TRIGGER_MODE_KEYWORD",priority_level:Math.min(5,Math.max(1,Math.floor(order/25)+1))};
    if(normalizedKeys.keys.length)item.key_words=normalizedKeys.keys;
    if(!groups.has(noteType))groups.set(noteType,[]);
    groups.get(noteType).push(item);
    report.converted++;
  });

  if(!report.converted)throw new Error("No enabled entries with content were found.");
  report.unsupportedFields=[...unsupported].sort();
  report.fieldCoverage=Object.fromEntries(Object.entries(observed).map(([status,fields])=>[status,[...fields].sort()]));
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
    `Mapped source fields observed: ${report.fieldCoverage.mapped.length?report.fieldCoverage.mapped.join(", "):"none"}`,
    `Approximated source fields observed: ${report.fieldCoverage.approximated.length?report.fieldCoverage.approximated.join(", "):"none"}`,
    `Skipped source fields observed: ${report.fieldCoverage.skipped.length?report.fieldCoverage.skipped.join(", "):"none"}`,
    "",
    "FIELD MAPPINGS",
    ...report.fieldMappings.map(mapping=>`${mapping.source} → ${mapping.target} [${mapping.status}]: ${mapping.rule}`),
  ];
  if(report.warnings.length)lines.push("","WARNINGS",...report.warnings.map(warning=>`- ${warning}`));
  return lines.join("\n");
}

export function createReportArtifact(report,{generatedAt=new Date().toISOString(),converterVersion=CONVERTER_VERSION}={}){
  return {report_format:"world-card-conversion-report",report_version:"1.0",converter_version:converterVersion,generated_at:generatedAt,summary:{source_entries:report.sourceEntries,converted:report.converted,skipped:report.skipped,duplicate_keywords_removed:report.duplicateKeywordsRemoved},field_coverage:report.fieldCoverage,fallback_categories:report.fallbackCategories,unsupported_source_fields:report.unsupportedFields,warnings:report.warnings,field_mappings:report.fieldMappings};
}

function downloadText(contents,filename,type){
  const url=URL.createObjectURL(new Blob([contents],{type}));
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}

const exampleSelect=typeof document!=="undefined"?document.querySelector("#example"):null;
if(exampleSelect){
  Object.entries(SAMPLE_LOREBOOKS).forEach(([id,sample])=>{const option=document.createElement("option");option.value=id;option.textContent=sample.label;exampleSelect.append(option);});
  document.querySelector("#loadExample").addEventListener("click",()=>{
    const sample=SAMPLE_LOREBOOKS[exampleSelect.value];if(!sample)return;
    loadedExample=sample.source;
    document.querySelector("#file").value="";
    document.querySelector("#name").value=sample.name;
    document.querySelector("#introduction").value=sample.introduction;
    document.querySelector("#genre").value=sample.genre;
    document.querySelector("#tags").value=sample.tags;
    document.querySelector("#status").textContent=`Loaded built-in SFW example: ${sample.label}. Select Convert JSON to inspect it.`;
  });
}
const fileInput=typeof document!=="undefined"?document.querySelector("#file"):null;
if(fileInput)fileInput.addEventListener("change",()=>{if(fileInput.files.length)loadedExample=null;});

const form=typeof document!=="undefined"?document.querySelector("#converter"):null;
if(form)form.addEventListener("submit",async event=>{
  event.preventDefault();
  const status=document.querySelector("#status");
  try{
    const file=document.querySelector("#file").files[0];
    if(!file&&!loadedExample)throw new Error("Choose a JSON file or load a built-in example first.");
    if(file&&file.size>5*1024*1024)throw new Error("The JSON file must be 5 MB or smaller.");
    const source=file?parseJsonWithLocation(await file.text()):loadedExample;
    const converted=convertLorebook(source,{name:document.querySelector("#name").value,introduction:document.querySelector("#introduction").value,noteType:document.querySelector("#noteType").value,genre:document.querySelector("#genre").value,tags:document.querySelector("#tags").value});
    lastOutput=JSON.stringify(converted.result,null,2);
    lastReportOutput=JSON.stringify(createReportArtifact(converted.report),null,2);
    document.querySelector("#preview").textContent=lastOutput;
    document.querySelector("#report").textContent=formatConversionReport(converted.report);
    document.querySelector("#download").disabled=false;
    document.querySelector("#downloadReport").disabled=false;
    const skipped=converted.report.sourceEntries-converted.report.converted;
    status.textContent=`Converted ${converted.count} ${converted.count===1?"entry":"entries"}; skipped ${skipped}. Review the mapping report before downloading.`;
  }catch(error){
    lastOutput=null;
    lastReportOutput=null;
    document.querySelector("#download").disabled=true;
    document.querySelector("#downloadReport").disabled=true;
    document.querySelector("#preview").textContent="Conversion failed.";
    document.querySelector("#report").textContent="No mapping report is available because conversion failed.";
    status.textContent=`Conversion failed: ${error.message}`;
  }
});

const download=typeof document!=="undefined"?document.querySelector("#download"):null;
if(download)download.addEventListener("click",()=>{if(lastOutput)downloadText(lastOutput+"\n","crushon-normalized.json","application/json");});
const downloadReport=typeof document!=="undefined"?document.querySelector("#downloadReport"):null;
if(downloadReport)downloadReport.addEventListener("click",()=>{if(lastReportOutput)downloadText(lastReportOutput+"\n","world-card-conversion-report.json","application/json");});
