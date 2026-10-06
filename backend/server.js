import express from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();
const app=express();
const PORT=Number(process.env.PORT||3000);

if(!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET missing");

app.use(helmet({
  contentSecurityPolicy:{
    directives:{
      defaultSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],
      scriptSrc:["'self'"],imgSrc:["'self'","data:"],connectSrc:["'self'"],
      objectSrc:["'none'"],baseUri:["'self'"],frameAncestors:["'none'"]
    }
  }
}));
app.use(express.json({limit:"10kb"}));

app.use(session({
  name:"myeyes.sid",secret:process.env.SESSION_SECRET,resave:false,
  saveUninitialized:false,
  cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:30*60*1000}
}));

const limiter=rateLimit({
  windowMs:10*60*1000,max:10,standardHeaders:true,legacyHeaders:false,
  message:{error:"Trop de tentatives. Réessayez plus tard."}
});

function sessionCode(){
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

async function discord(title,description,color,fields=[]){
  const url=process.env.DISCORD_WEBHOOK_URL;
  if(!url) return;
  try{
    await fetch(url,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({embeds:[{
        title,description,color,timestamp:new Date().toISOString(),
        fields,footer:{text:"MyEyesOnly • GTA RP"}
      }]})
    });
  }catch(e){console.error("Discord webhook error:",e.message)}
}

app.post("/api/request",limiter,async(req,res)=>{
  // RP-only identifier: do not use real phone authentication or real SMS OTPs.
  const identifier=typeof req.body?.identifier==="string"?req.body.identifier.trim():"";
  if(!/^[A-Za-z0-9+() ._-]{3,32}$/.test(identifier))
    return res.status(400).json({error:"Identifiant RP invalide."});

  const id=sessionCode();
  req.session.rpSession=id;
  req.session.verified=false;
  req.session.expectedCode=null;

  await discord("🟡 Nouvelle demande MyEyesOnly",
    "Une demande d'accès RP vient d'être créée.",
    0xF4C400,
    [
      {name:"Identifiant RP",value:identifier,inline:true},
      {name:"Session",value:id,inline:true},
      {name:"Statut",value:"En attente de vérification manuelle",inline:false}
    ]);

  res.json({ok:true,session:id});
});

// The RP operator sets the temporary code server-side through a protected admin route.
// This is intentionally not exposed to the public frontend.
app.post("/api/admin/set-code",async(req,res)=>{
  const admin=String(req.headers["x-rp-admin-key"]||"");
  if(!process.env.RP_ADMIN_KEY || admin!==process.env.RP_ADMIN_KEY)
    return res.status(403).json({error:"Accès refusé."});
  const sessionId=typeof req.body?.session==="string"?req.body.session:"";
  const code=typeof req.body?.code==="string"?req.body.code:"";
  if(!/^[A-F0-9]{6}$/.test(sessionId)||!/^[0-9]{4}$/.test(code))
    return res.status(400).json({error:"Données invalides."});
  // In-memory session lookup by the session cookie is not suitable for admin control.
  // This route is therefore intentionally disabled in the public build.
  return res.status(410).json({error:"Utilisez RP_ACCESS_CODE pour le scénario RP."});
});

app.post("/api/verify",limiter,(req,res)=>{
  if(!req.session.rpSession)
    return res.status(400).json({error:"Demande introuvable."});
  const code=typeof req.body?.code==="string"?req.body.code.trim():"";
  const expected=String(process.env.RP_ACCESS_CODE||"");
  if(!/^[0-9]{4}$/.test(code)||expected.length!==4||code!==expected)
    return res.status(401).json({error:"Code incorrect. Veuillez réessayer."});
  req.session.verified=true;
  req.session.rpSession=null;
  res.json({ok:true});
});

app.get("/api/me",(req,res)=>res.json({authenticated:req.session?.verified===true}));

app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));

app.use(express.static("frontend"));
app.get("*splat",(req,res)=>res.sendFile(process.cwd()+"/frontend/index.html"));
app.listen(PORT,()=>console.log("MyEyesOnly backend listening on "+PORT));