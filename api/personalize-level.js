const WINDOW_MS = 60_000;
const LIMIT = 18;
const requests = new Map();
const WORLD_LAYOUTS = { petalbyte: 'petalbyte_run', moonmall: 'moonmall_hops' };
const THEMES = ['sugar', 'moon', 'neon', 'mint', 'lavender'];
const DIFFICULTIES = ['relaxed', 'standard', 'challenge'];

function limited(ip, now) {
  for (const [key, entry] of requests) if (entry.until <= now) requests.delete(key);
  const entry = requests.get(ip);
  if (!entry || entry.until <= now) { requests.set(ip,{count:1,until:now+WINDOW_MS}); return false; }
  entry.count++;
  return entry.count > LIMIT;
}

function safeFallback(worldId, theme, difficulty) {
  return { worldId, layoutId: WORLD_LAYOUTS[worldId], theme: THEMES.includes(theme)?theme:(worldId==='moonmall'?'moon':'sugar'), difficulty: DIFFICULTIES.includes(difficulty)?difficulty:'relaxed', narrativeIntro: '' };
}

export default async function handler(req,res) {
  if(req.method!=='POST'){res.status(405).json({error:'method_not_allowed'});return;}
  const body=req.body&&typeof req.body==='object'?req.body:{};
  const worldId=body.worldId;
  if(!Object.hasOwn(WORLD_LAYOUTS,worldId)){res.status(400).json({error:'unsupported_world'});return;}
  const fallback=safeFallback(worldId,body.theme,body.difficulty);
  const ip=(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').toString().split(',')[0].trim();
  if(limited(ip,Date.now())){res.setHeader('Retry-After','60');res.status(429).json({error:'rate_limit_exceeded'});return;}
  const apiKey=process.env.OPENAI_API_KEY||process.env.AI_API_KEY;
  if(!apiKey){res.status(503).json({error:'ai_not_configured',fallback});return;}
  const activities=Array.isArray(body.activities)?body.activities.filter(x=>['platform','memory','rhythm','collecting'].includes(x)).slice(0,4):[];
  const storyInterests=Array.isArray(body.storyInterests)?body.storyInterests.filter(x=>['friendship','mysteries','self-expression'].includes(x)).slice(0,3):[];
  const schema={type:'object',additionalProperties:false,properties:{worldId:{type:'string',enum:[worldId]},layoutId:{type:'string',enum:[WORLD_LAYOUTS[worldId]]},theme:{type:'string',enum:THEMES},difficulty:{type:'string',enum:DIFFICULTIES},narrativeIntro:{type:'string'}},required:['worldId','layoutId','theme','difficulty','narrativeIntro']};
  try {
    const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},signal:AbortSignal.timeout(12_000),body:JSON.stringify({
      model:'gpt-4o-mini',temperature:.6,max_tokens:180,response_format:{type:'json_schema',json_schema:{name:'bleuming_level_personalization',strict:true,schema}},
      messages:[
        {role:'system',content:'Personalize a cozy 2D platform game level. Return only the required JSON. Choose only the supplied world layout. Do not add coordinates, objects, hazards, code, health advice, or game mechanics. Keep the intro under 18 words. Never alter the selected world or create a harder difficulty than requested.'},
        {role:'user',content:JSON.stringify({worldId,layoutId:WORLD_LAYOUTS[worldId],playerTheme:THEMES.includes(body.theme)?body.theme:'sugar',requestedDifficulty:DIFFICULTIES.includes(body.difficulty)?body.difficulty:'relaxed',favoriteActivities:activities,storyInterests,allowedThemes:THEMES,allowedDifficulties:DIFFICULTIES})}
      ]
    })});
    if(!response.ok){res.status(200).json(fallback);return;}
    const payload=await response.json();
    const raw=payload?.choices?.[0]?.message?.content;
    let result;try{result=JSON.parse(raw);}catch{res.status(200).json(fallback);return;}
    const requested=DIFFICULTIES.includes(body.difficulty)?body.difficulty:'relaxed';
    const valid=result&&result.worldId===worldId&&result.layoutId===WORLD_LAYOUTS[worldId]&&THEMES.includes(result.theme)&&DIFFICULTIES.includes(result.difficulty)&&DIFFICULTIES.indexOf(result.difficulty)<=DIFFICULTIES.indexOf(requested)&&typeof result.narrativeIntro==='string'&&result.narrativeIntro.length<=120;
    if(!valid){res.status(200).json(fallback);return;}
    res.status(200).json(result);
  } catch(error){
    console.warn('Level personalization unavailable; client will use the authored level.',error?.message||error);
    res.status(200).json(fallback);
  }
}
