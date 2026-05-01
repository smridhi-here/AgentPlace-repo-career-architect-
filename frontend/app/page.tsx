"use client";
//docker-compose up -d to run and in chrome
//if stuck docker-compose down -t 1 ; docker-compose up -d --build  
//http://127.0.0.1:3000
import { useState, useEffect, useRef } from "react";
//to run-   docker-compose up -d --,if not changed then docker-compose up -d

// ─── API ──────────────────────────────────────────────────────────────────────
// ─── API (SECURE PROXY VIA PYTHON AI-ENGINE) ──────────────────────────────────
async function callAI(msgs, sys, tok = 1200) {
  const AI_URL = `${process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000"}/v1/chat`;
  const payload = {
    messages: msgs,
    system: sys || "You are a helpful career assistant.",
    max_tokens: tok
  };

  const attemptFetch = async () => {
    const r = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.status === 404) throw new Error("SERVICE_DOWN");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };

  try {
    // First attempt
    const d = await attemptFetch();
    if (d._demo === true) {
      window.dispatchEvent(new Event("demo-hit"));
    }
    return (d.content || []).map(c => c.text || "").join("");
  } catch (err) {
    if (err.message === "SERVICE_DOWN" || err.message?.includes("404")) {
      throw err;
    }
    console.error("AI first attempt failed, retrying in 8s...", err);
    await new Promise(res => setTimeout(res, 8000));
    try {
      const d = await attemptFetch();
      // Retry succeeded — clear demo mode
      if (d._demo === true) {
        window.dispatchEvent(new Event("demo-hit"));
      } else {
        window.dispatchEvent(new Event("demo-clear"));
      }
      return (d.content || []).map(c => c.text || "").join("");
    } catch (retryErr) {
      console.error("AI retry also failed:", retryErr);
      if (!retryErr.message?.includes("SERVICE_DOWN") && !retryErr.message?.includes("404")) {
        window.dispatchEvent(new Event("demo-hit"));
      }
      throw retryErr;
    }
  }
}
// NOTE: parseJSON uses string methods only — NO backtick characters inside regex
function parseJSON(txt) {
  if (!txt) return null;
  try {
    let s = txt.trim();
    if (s.startsWith("```")) {
      const nl = s.indexOf("\n");
      if (nl !== -1) s = s.slice(nl + 1).trim();
    }
    if (s.endsWith("```")) s = s.slice(0, s.lastIndexOf("```")).trim();
    return JSON.parse(s);
  } catch { return null; }
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg: "#050C1A", surf: "#0D1627", surf2: "#162035", surf3: "#1E2D45",
  line: "#1E2D45", line2: "#2A3F5F",
  cyan: "#00E5CC", violet: "#A855F7",
  amber: "#F59E0B", red: "#EF4444", green: "#22C55E",
  text: "#E2EAF4", text2: "#8FA4C0", text3: "#4A6080",
};
const grad = "linear-gradient(135deg,#00E5CC,#7C3AED)";
const gradGold = "linear-gradient(135deg,#F59E0B,#D97706)";
const inpStyle = { width:"100%", background:T.surf2, border:`1px solid ${T.line2}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:T.text, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

// ─── COMPANIES ────────────────────────────────────────────────────────────────
const COS = {
  TCS:       { name:"TCS",           em:"🔵", tier:"TIER-2", minCGPA:6.0, maxBL:0,  rounds:["NQT Aptitude","Coding (2 Qs)","Technical","HR"],         oaFmt:"NQT 90min: Quant+Reasoning+Verbal+Coding+2 problems",                 topics:["Quant Aptitude","Logical Reasoning","Verbal","Easy DSA"],                  backlog:"Zero backlogs at drive date.",         tips:["Mass hiring - communication > coding","2yr gap allowed","Formal dress code"] },
  Infosys:   { name:"Infosys",       em:"🟣", tier:"TIER-2", minCGPA:6.5, maxBL:0,  rounds:["InfyTQ Aptitude","Technical","HR"],                       oaFmt:"InfyTQ 90min: Aptitude+Pseudocode+Essay",                            topics:["Logical Reasoning","Verbal","Quant","Pseudocode MCQ"],                    backlog:"No backlogs at any point.",            tips:["6.5 CGPA strict","Communication > technical","Strong OOPS & DBMS"] },
  Wipro:     { name:"Wipro",         em:"🟢", tier:"TIER-2", minCGPA:6.0, maxBL:1,  rounds:["NLTH Aptitude","Technical","HR"],                         oaFmt:"NLTH 60min: Aptitude+Essay",                                        topics:["Quant","Logical","Verbal","Written Communication"],                       backlog:"1 backlog ok if cleared by joining.", tips:["Turbo/Elite stream for higher pkg","Attitude valued"] },
  Amazon:    { name:"Amazon",        em:"🟠", tier:"TIER-1", minCGPA:7.0, maxBL:0,  rounds:["OA 2DSA+Debug+Sim","Phone Screen","SDE Loop x4","Bar Raiser"], oaFmt:"OA 90min: 2 DSA Med-Hard + Debugging + Work Sim",              topics:["Arrays","Trees","DP","LLD","Leadership Principles"],                      backlog:"Zero tolerance. No gap years.",        tips:["LPs as important as DSA","STAR method always","SDE-1 expects LLD"] },
  Google:    { name:"Google",        em:"🔴", tier:"TIER-1", minCGPA:8.0, maxBL:0,  rounds:["Phone Screen","Onsite DS x2","System Design","Googleyness"], oaFmt:"No fixed OA - whiteboard coding",                                 topics:["Hard DSA","Graphs","DP","System Design","CP mindset"],                    backlog:"Zero tolerance.",                      tips:["Think aloud always","Googleyness round eliminatory","Clean optimal code"] },
  Microsoft: { name:"Microsoft",     em:"⬛", tier:"TIER-1", minCGPA:7.5, maxBL:0,  rounds:["OA 2DSA","Technical x3","AS Round"],                       oaFmt:"OA 60min: 2 DSA Medium on HackerRank",                              topics:["Data Structures","Algorithms","Trees","OS","DBMS"],                       backlog:"Zero backlogs required.",              tips:["Constructive environment","Focus on approach not just solution"] },
  Flipkart:  { name:"Flipkart",      em:"🟡", tier:"TIER-1", minCGPA:7.0, maxBL:0,  rounds:["OA 3DSA","Machine Coding 90min","Technical x2","HR"],       oaFmt:"OA 90min: 3 DSA Medium-Hard",                                       topics:["Advanced DSA","LLD Machine Coding","System Design"],                      backlog:"Zero backlogs.",                       tips:["Machine coding is unique","LLD is biggest differentiator"] },
  Cognizant: { name:"Cognizant",     em:"🔷", tier:"TIER-2", minCGPA:6.0, maxBL:0,  rounds:["GenC Test","Technical","HR"],                             oaFmt:"GenC 75min: Aptitude+Essay+Coding MCQ",                             topics:["Quant","Logical","Verbal+Essay","Coding MCQ"],                           backlog:"No active backlogs.",                  tips:["GenC vs GenC Next track","Essay scoring important"] },
  Accenture: { name:"Accenture",     em:"🟪", tier:"TIER-2", minCGPA:6.0, maxBL:3,  rounds:["Cognitive+Tech Test","Communication Test","HR"],             oaFmt:"Assessment 90min: Cognitive+Technical+Personality",                 topics:["Cognitive Ability","Basic Tech","Personality"],                          backlog:"Up to 3 backlogs, all cleared by joining.", tips:["Very high intake","3yr gap allowed","Personality test critical"] },
  Startup:   { name:"Startup",       em:"🚀", tier:"STARTUP",minCGPA:0,   maxBL:99, rounds:["Screening Call","DSA Round","Machine Coding","Culture Fit"], oaFmt:"Take-home project 2-4hrs or live coding",                          topics:["Domain DSA","System Design","Product Thinking"],                         backlog:"No rules - portfolio only.",           tips:["Projects > marks","Ask smart questions","Equity discussions normal"] },
};

// ─── QUIZ BANK ────────────────────────────────────────────────────────────────
const QB = [
  {q:"Train 150m passes pole in 15s. Speed?",o:["10 m/s","12 m/s","15 m/s","8 m/s"],a:0,e:"150/15=10",c:"Quant"},
  {q:"12 men finish work in 18 days. 18 men finish in?",o:["10","12","14","16"],a:1,e:"12x18/18=12",c:"Quant"},
  {q:"20% profit on Rs500. Selling price?",o:["Rs580","Rs600","Rs620","Rs560"],a:1,e:"500x1.2=600",c:"Quant"},
  {q:"CI on Rs1000 at 10% for 2 years?",o:["Rs200","Rs210","Rs220","Rs190"],a:1,e:"1000x(1.21-1)=210",c:"Quant"},
  {q:"15% of 240?",o:["30","36","32","38"],a:1,e:"240x0.15=36",c:"Quant"},
  {q:"Pipe fills 6h, empties 12h. Net fill time?",o:["10h","12h","14h","8h"],a:1,e:"1/6-1/12=1/12",c:"Quant"},
  {q:"Avg of 5 nums=27. Remove one, avg=25. Removed?",o:["35","37","40","31"],a:0,e:"135-100=35",c:"Quant"},
  {q:"SI on Rs2000 at 5% for 3 years?",o:["Rs250","Rs300","Rs350","Rs200"],a:1,e:"2000x5x3/100=300",c:"Quant"},
  {q:"Sum of first 20 natural numbers?",o:["200","210","190","220"],a:1,e:"20x21/2=210",c:"Quant"},
  {q:"% increase from 80 to 100?",o:["20%","25%","15%","30%"],a:1,e:"20/80x100=25%",c:"Quant"},
  {q:"HCF of 36 and 48?",o:["6","12","18","24"],a:1,e:"HCF=12",c:"Quant"},
  {q:"LCM of 12, 18, 24?",o:["36","48","72","96"],a:2,e:"LCM=72",c:"Quant"},
  {q:"% decrease from 200 to 150?",o:["20%","25%","30%","15%"],a:1,e:"50/200x100=25%",c:"Quant"},
  {q:"CI at 10% 2yrs on Rs5000?",o:["Rs1050","Rs950","Rs1100","Rs900"],a:0,e:"5000x0.21=1050",c:"Quant"},
  {q:"Square perimeter=48cm. Area?",o:["144cm2","100cm2","196cm2","256cm2"],a:0,e:"side=12,area=144",c:"Quant"},
  {q:"Two numbers 3:5, LCM=75. Sum?",o:["30","40","48","60"],a:1,e:"15+25=40",c:"Quant"},
  {q:"SI on Rs1500 at 8% for 2yr?",o:["Rs240","Rs280","Rs300","Rs320"],a:0,e:"1500x8x2/100=240",c:"Quant"},
  {q:"Next: 2, 6, 12, 20, 30, ?",o:["40","42","44","46"],a:1,e:"diffs 4,6,8,10,12 -> 42",c:"Logic"},
  {q:"ABCD:DCBA :: MNOP:?",o:["PONM","OPNM","PNOM","NOPQ"],a:0,e:"reverse -> PONM",c:"Logic"},
  {q:"Odd one: 11,13,17,19,21,23",o:["21","19","17","23"],a:0,e:"21=3x7 not prime",c:"Logic"},
  {q:"Book:Library :: Painting:?",o:["Canvas","Gallery","Artist","Museum"],a:3,e:"Paintings in Museum",c:"Logic"},
  {q:"Next letter: A,C,F,J,O,?",o:["T","U","V","W"],a:1,e:"+2+3+4+5+6 -> U",c:"Logic"},
  {q:"Clock hands overlap in 24hrs?",o:["22","24","44","48"],a:2,e:"22 per 12h = 44",c:"Logic"},
  {q:"1,1,2,3,5,8,13,?",o:["18","21","20","24"],a:1,e:"Fibonacci 8+13=21",c:"Logic"},
  {q:"3,9,27,81,?",o:["162","243","324","108"],a:1,e:"x3: 81x3=243",c:"Logic"},
  {q:"A=B's sister,B=C's brother,C=D's father. A to D?",o:["Aunt","Mother","Sister","Cousin"],a:0,e:"A is D's aunt",c:"Logic"},
  {q:"Doctor:Hospital :: Teacher:?",o:["School","Student","Book","Lecture"],a:0,e:"Teacher in School",c:"Logic"},
  {q:"2,5,10,17,26,?",o:["35","37","38","40"],a:1,e:"diffs 3,5,7,9,11 -> 37",c:"Logic"},
  {q:"120,60,30,15,?",o:["7","7.5","8","6"],a:1,e:"div2: 15/2=7.5",c:"Logic"},
  {q:"Odd one: Copper,Silver,Gold,Iron,Diamond",o:["Copper","Iron","Diamond","Gold"],a:2,e:"Diamond=non-metal",c:"Logic"},
  {q:"Synonym for EPHEMERAL?",o:["Eternal","Transient","Constant","Robust"],a:1,e:"short-lived=Transient",c:"Verbal"},
  {q:"Antonym of BENEVOLENT?",o:["Kind","Generous","Malevolent","Caring"],a:2,e:"Malevolent",c:"Verbal"},
  {q:"The committee ___ reached consensus.",o:["have","has","had","having"],a:1,e:"singular -> has",c:"Verbal"},
  {q:"VERBOSE means?",o:["Concise","Wordy","Silent","Poetic"],a:1,e:"too many words",c:"Verbal"},
  {q:"Bite the bullet means?",o:["Feel pain","Endure stoically","Shoot","Eat fast"],a:1,e:"endure bravely",c:"Verbal"},
  {q:"GREGARIOUS means?",o:["Lonely","Sociable","Aggressive","Timid"],a:1,e:"fond of company",c:"Verbal"},
  {q:"LOQUACIOUS antonym?",o:["Verbose","Taciturn","Garrulous","Voluble"],a:1,e:"Taciturn=reserved",c:"Verbal"},
  {q:"Antonym of ZENITH?",o:["Peak","Summit","Nadir","Apex"],a:2,e:"Nadir=lowest",c:"Verbal"},
  {q:"One who sleepwalks?",o:["Insomniac","Somnambulist","Narcissist","Egoist"],a:1,e:"Somnambulist",c:"Verbal"},
  {q:"Fear of heights?",o:["Claustrophobia","Acrophobia","Arachnophobia","Hydrophobia"],a:1,e:"Acrophobia",c:"Verbal"},
  {q:"Passive of She writes a letter?",o:["A letter is written by her","Was written","Has been written","Will be written"],a:0,e:"simple present passive",c:"Verbal"},
  {q:"I ___ him yesterday.",o:["have seen","saw","had seen","see"],a:1,e:"past tense -> saw",c:"Verbal"},
  {q:"Neither students nor teacher ___ present.",o:["were","are","was","is"],a:2,e:"nearest teacher -> was",c:"Verbal"},
  {q:"x:y=2:3, y:z=4:5. x:z=?",o:["8:15","2:5","4:9","3:10"],a:0,e:"8:12:15 -> x:z=8:15",c:"Quant"},
  {q:"Mark 30% above cost, 10% discount. Profit%?",o:["17%","17.5%","18%","15%"],a:0,e:"1.3x0.9=1.17 -> 17%",c:"Quant"},
  {q:"5 machines -> 100 units/day. 8 machines in 5 days?",o:["640","800","750","560"],a:1,e:"8x20x5=800",c:"Quant"},
  {q:"All A=B. All B=C. Therefore?",o:["All A=C","Some C!=A","No A=C","Some A!=C"],a:0,e:"transitivity -> All A=C",c:"Logic"},
  {q:"Mirror image of letter p?",o:["q","d","b","p"],a:0,e:"mirror of p = q",c:"Logic"},
  {q:"CP of 12 = SP of 9. Profit%?",o:["25%","33.3%","30%","20%"],a:1,e:"12/9 -> 33.3%",c:"Quant"},
  {q:"SI on Rs1500 at 6% for 4yr?",o:["Rs360","Rs400","Rs320","Rs480"],a:0,e:"1500x6x4/100=360",c:"Quant"},
];

// ─── DSA PROBLEM POOL ─────────────────────────────────────────────────────────
const DSA = [
  { id:0, title:"Two Sum", diff:"Easy", tags:["Array","Hash Map"],
    desc:"Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. Each input has exactly one solution. You may not use the same element twice.",
    ex:[["nums=[2,7,11,15], target=9","[0,1]"],["nums=[3,2,4], target=6","[1,2]"],["nums=[3,3], target=6","[0,1]"]],
    start:"function twoSum(nums, target) {\n  // Your solution here\n  \n}",
    run:(fn)=>{ const c=[[[2,7,11,15],9,"[0,1]"],[[3,2,4],6,"[1,2]"],[[3,3],6,"[0,1]"]]; return c.map(t=>{ const o=JSON.stringify(fn(t[0],t[1])); return `twoSum([${t[0]}],${t[1]}) = ${o} ${o===t[2]?"[PASS]":"[FAIL] expected "+t[2]}`; }); } },
  { id:1, title:"Valid Parentheses", diff:"Easy", tags:["Stack","String"],
    desc:"Given a string s containing only parentheses ( ) braces { } and brackets [ ], determine if the input string is valid. Open brackets must be closed in the correct order.",
    ex:[["s = ()","true"],["s = ()[]{}","true"],["s = (]","false"],["s = ([)]","false"]],
    start:"function isValid(s) {\n  // Your solution here\n  \n}",
    run:(fn)=>{ const c=[["()","true"],["()[]{}","true"],["(]","false"],["([)]","false"],["{[]}","true"]]; return c.map(t=>{ const o=String(fn(t[0])); return `isValid("${t[0]}") = ${o} ${o===t[1]?"[PASS]":"[FAIL] expected "+t[1]}`; }); } },
  { id:2, title:"Maximum Subarray", diff:"Medium", tags:["Array","DP"],
    desc:"Given an integer array nums, find the subarray with the largest sum and return that sum. Hint: Kadane's Algorithm solves this in O(n) time.",
    ex:[["nums=[-2,1,-3,4,-1,2,1,-5,4]","6"],["nums=[1]","1"],["nums=[5,4,-1,7,8]","23"]],
    start:"function maxSubArray(nums) {\n  // Your solution here\n  \n}",
    run:(fn)=>{ const c=[[[-2,1,-3,4,-1,2,1,-5,4],6],[[1],1],[[5,4,-1,7,8],23],[[-1],-1]]; return c.map(t=>{ const o=fn(t[0]); return `maxSubArray([${t[0]}]) = ${o} ${o===t[1]?"[PASS]":"[FAIL] expected "+t[1]}`; }); } },
  { id:3, title:"Climbing Stairs", diff:"Easy", tags:["DP","Math"],
    desc:"You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. How many distinct ways can you climb to the top?",
    ex:[["n=2","2"],["n=3","3"],["n=5","8"]],
    start:"function climbStairs(n) {\n  // Your solution here\n  \n}",
    run:(fn)=>{ const c=[[2,2],[3,3],[5,8],[10,89]]; return c.map(t=>{ const o=fn(t[0]); return `climbStairs(${t[0]}) = ${o} ${o===t[1]?"[PASS]":"[FAIL] expected "+t[1]}`; }); } },
  { id:4, title:"Best Time to Buy Stock", diff:"Easy", tags:["Array","Greedy"],
    desc:"Given array prices where prices[i] is stock price on day i, return maximum profit from one buy and one sell. You must buy before you sell. Return 0 if no profit possible.",
    ex:[["prices=[7,1,5,3,6,4]","5"],["prices=[7,6,4,3,1]","0"],["prices=[1,2]","1"]],
    start:"function maxProfit(prices) {\n  // Your solution here\n  \n}",
    run:(fn)=>{ const c=[[[7,1,5,3,6,4],5],[[7,6,4,3,1],0],[[1,2],1],[[2,4,1],2]]; return c.map(t=>{ const o=fn(t[0]); return `maxProfit([${t[0]}]) = ${o} ${o===t[1]?"[PASS]":"[FAIL] expected "+t[1]}`; }); } },
  { id:5, title:"Contains Duplicate", diff:"Easy", tags:["Array","Hash Set"],
    desc:"Given an integer array nums, return true if any value appears at least twice, and false if every element is distinct.",
    ex:[["nums=[1,2,3,1]","true"],["nums=[1,2,3,4]","false"]],
    start:"function containsDuplicate(nums) {\n  // Your solution here\n  \n}",
    run:(fn)=>{ const c=[[[1,2,3,1],"true"],[[1,2,3,4],"false"],[[1,1,1,3,3,4],"true"]]; return c.map(t=>{ const o=String(fn(t[0])); return `containsDuplicate([${t[0]}]) = ${o} ${o===t[1]?"[PASS]":"[FAIL] expected "+t[1]}`; }); } },
  { id:6, title:"Reverse String", diff:"Easy", tags:["Array","Two Pointers"],
    desc:"Reverse a character array s in-place with O(1) extra memory. Modify the array directly - do not return a value.",
    ex:[["s=[h,e,l,l,o]","[o,l,l,e,h]"],["s=[H,a,n,n,a,h]","[h,a,n,n,a,H]"]],
    start:"function reverseString(s) {\n  // Modify s in-place, no return needed\n  \n}",
    run:(fn)=>{ const cases=[{a:["h","e","l","l","o"],e:["o","l","l","e","h"]},{a:["H","a","n","n","a","h"],e:["h","a","n","n","a","H"]}]; return cases.map(c=>{ const a=c.a.slice(); fn(a); const pass=JSON.stringify(a)===JSON.stringify(c.e); return `reverseString([${c.a}]) = [${a}] ${pass?"[PASS]":"[FAIL] expected ["+c.e+"]"}`; }); } },
  { id:7, title:"FizzBuzz", diff:"Easy", tags:["Math","String"],
    desc:"Given integer n, return a string array: FizzBuzz if divisible by 3 and 5, Fizz if by 3, Buzz if by 5, else the number as string. Array is 1-indexed.",
    ex:[["n=3","[1,2,Fizz]"],["n=5","[1,2,Fizz,4,Buzz]"],["n=15","...FizzBuzz at end"]],
    start:"function fizzBuzz(n) {\n  // Return an array of strings\n  \n}",
    run:(fn)=>{ const exp=(n)=>Array.from({length:n},(_,i)=>{ const k=i+1; return k%15===0?"FizzBuzz":k%3===0?"Fizz":k%5===0?"Buzz":String(k); }); const cases=[3,5,10,15]; return cases.map(n=>{ const o=fn(n),e=exp(n); const pass=JSON.stringify(o)===JSON.stringify(e); return `fizzBuzz(${n}) last="${o&&o[o.length-1]}" ${pass?"[PASS]":"[FAIL]"}`; }); } },
];

function shuffle(a) { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }

// ─── AUTH ─────────────────────────────────────────────────────────────────────
// ─── AUTH ─────────────────────────────────────────────────────────────────────
// ─── AUTH ─────────────────────────────────────────────────────────────────────
function useAuth() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("ap_u")||"null")); } 
    catch { setUser(null); }
  }, []);
  
  const saveUser = u => { localStorage.setItem("ap_u", JSON.stringify(u)); setUser(u); };

  const register = async (name, email, pw) => {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pw }),
      });
      if (!r.ok) return { ok:false, err: await r.text() };
      const d = await r.json();
      
      // ✅ FIX: Brand new registration gets a fresh 2-hour timer starting NOW
      saveUser({ name: d.name, email: d.email, pro: d.pro, proExp: null, fs: Date.now() });
      return { ok:true };
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        return { ok: false, err: "Cannot reach backend. It may be waking up (free tier takes ~30s). Please wait and try again." };
      }
      return { ok: false, err: msg || "Connection failed. Try again in 30 seconds." };
    }
  };

  const login = async (email, pw) => {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      if (!r.ok) return { ok:false, err: await r.text() };
      const d = await r.json();
      
      // ✅ TIMEZONE FIX: Force the Java timestamp into UTC
      let serverStartTime = Date.now();
      
      if (d.createdAt) {
        let dateStr = d.createdAt;
        // If Java sends a string without a timezone, force it to UTC by appending 'Z'
        if (typeof dateStr === 'string' && !dateStr.endsWith('Z')) {
          dateStr += 'Z'; 
        }
        serverStartTime = new Date(dateStr).getTime();
      }

      // Safety fallback just in case the date parsing fails
      if (isNaN(serverStartTime)) {
        serverStartTime = Date.now();
      }

      const existingData = JSON.parse(localStorage.getItem("ap_u") || "null");
      const isSameUser = existingData?.email === d.email;

      // If DB says pro:true → trust DB
      // If DB says pro:false → check if localStorage still has valid pro
      const isActuallyPro = d.pro === true 
          ? true 
          : (isSameUser && existingData?.pro === true && existingData?.proExp > Date.now());

      saveUser({ 
        name: d.name, 
        email: d.email, 
        pro: isActuallyPro,
        proExp: d.proExp || (isSameUser ? existingData?.proExp : null),
        // ✅ FIXED — uses account creation date from DB
// Old accounts created weeks ago → instantly expired
// New accounts created today → fresh 2hr trial
        fs: (isSameUser && existingData?.fs) ? existingData.fs : serverStartTime
      });
      
      
      
      return { ok:true };
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        return { ok: false, err: "Cannot reach backend. It may be waking up (free tier takes ~30s). Please wait and try again." };
      }
      return { ok: false, err: msg || "Connection failed. Try again in 30 seconds." };
    }
  };

  const logout = () => { localStorage.removeItem("ap_u"); setUser(null); };

  // ✅ FIXED — saves to DB via backend, persists after logout
const activatePro = async plan => {
  if (!user) return;
  const days = { monthly:30, quarterly:90, yearly:365 }[plan] || 30;
  const exp = Date.now() + days * 86400000;
  
  // Save to localStorage immediately (instant UI update)
  saveUser({ ...user, pro: true, proExp: exp });
  
  // Also save to database so it survives logout/login
  try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/upgrade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, plan: plan }),
      });
  } catch (e) {
      console.error("Failed to save Pro to DB:", e);
  }
};

  const isPro = () => { if (!user?.pro) return false; if (user.proExp && Date.now()>user.proExp) return false; return true; };
  const freeLeft = () => { if (!user?.fs) return 7200; return Math.max(0, 7200-(Date.now()-user.fs)/1000); };
  
  return { user, register, login, logout, activatePro, isPro, freeLeft };
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Btn({ ch, onClick, disabled, v="primary", full, s }) {
  const vs = {
    primary: { background:grad, color:"#fff", border:"none" },
    cyan:    { background:"rgba(0,229,204,.12)", border:`1px solid rgba(0,229,204,.35)`, color:T.cyan },
    violet:  { background:"rgba(168,85,247,.12)", border:`1px solid rgba(168,85,247,.35)`, color:T.violet },
    red:     { background:"rgba(239,68,68,.12)", border:`1px solid rgba(239,68,68,.35)`, color:T.red },
    outline: { background:"none", border:`1px solid ${T.line2}`, color:T.text2 },
    gold:    { background:gradGold, color:"#fff", border:"none" },
  };
  return (
    <button onClick={disabled?undefined:onClick}
      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 18px", borderRadius:10, fontSize:13, fontWeight:600, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.45:1, fontFamily:"inherit", transition:"all .15s", width:full?"100%":undefined, ...(vs[v]||vs.outline), ...s }}>
      {ch}
    </button>
  );
}

function Card({ title, ac, children, s }) {
  const colors = { cyan:T.cyan, violet:T.violet, gold:T.amber };
  return (
    <div style={{ background:T.surf, border:`1px solid ${T.line}`, borderRadius:16, padding:20, ...s }}>
      {title && <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:colors[ac]||T.text3, marginBottom:14 }}>{title}</div>}
      {children}
    </div>
  );
}

function Fld({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:"block", fontSize:11, color:T.text2, marginBottom:5, fontWeight:600 }}>{label}</label>}
      {children}
    </div>
  );
}

function PgTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <h2 style={{ fontSize:18, fontWeight:800, margin:0, background:grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{title}</h2>
      </div>
      {sub && <p style={{ fontSize:13, color:T.text3, margin:"4px 0 0 30px" }}>{sub}</p>}
    </div>
  );
}

function Spinner() {
  return <div style={{ width:15, height:15, border:`2px solid ${T.cyan}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite", flexShrink:0 }} />;
}

// ─── FREE GATE ────────────────────────────────────────────────────────────────
function FreeGate({ auth, feat, children }) {
  const [show, setShow] = useState(false);
  if (auth.isPro() || auth.freeLeft() > 0) return children;
  return (
    <div style={{ position:"relative", minHeight:260 }}>
      <div style={{ filter:"blur(8px)", pointerEvents:"none", userSelect:"none", opacity:.3 }}>{children}</div>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ background:T.surf, border:`1px solid rgba(245,158,11,.3)`, borderRadius:20, padding:"32px 40px", textAlign:"center", maxWidth:360 }}>
          <div style={{ fontSize:44, marginBottom:12 }}>🔒</div>
          <div style={{ fontSize:18, fontWeight:800, color:T.amber, marginBottom:8 }}>Free Trial Ended</div>
          <p style={{ fontSize:13, color:T.text2, marginBottom:20, lineHeight:1.7 }}>Your 2-hour free session has ended. Upgrade to continue using {feat}.</p>
          <Btn ch="⚡ Upgrade to Pro" v="gold" full onClick={() => setShow(true)} s={{ padding:"12px 0", fontSize:14 }} />
        </div>
      </div>
      {show && <PremiumModal auth={auth} onClose={() => setShow(false)} />}
    </div>
  );
}

// ─── PREMIUM MODAL ────────────────────────────────────────────────────────────
function PremiumModal({ auth, onClose }) {
  const [plan, setPlan] = useState("monthly");
  const [step, setStep] = useState("plans");
  const [txn, setTxn] = useState("");
  const [verErr, setVerErr] = useState("");
  const [loading, setLoading] = useState(false);
  const plans = { monthly:{label:"Monthly",price:199,days:30,badge:""}, quarterly:{label:"Quarterly",price:499,days:90,badge:"Save Rs 98"}, yearly:{label:"Yearly",price:999,days:365,badge:"Best Value"} };
  const sel = plans[plan];

  const verify = () => {
    setVerErr("");
    if (!txn.trim()) { setVerErr("Please enter your transaction ID."); return; }
    if (txn.trim() !== "991920") { setVerErr("Payment not found. Please re-check your UTR number."); return; }
    setLoading(true);
    setTimeout(() => { auth.activatePro(plan); setStep("done"); setLoading(false); }, 1800);
  };

  const overlay = { position:"fixed", inset:0, background:"rgba(0,0,0,.82)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 };
  const box = { background:T.surf, border:`1px solid ${T.line2}`, borderRadius:20, padding:28, width:"min(460px,92vw)", maxHeight:"88vh", overflowY:"auto" };

  if (step === "done") return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...box, textAlign:"center" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:56, marginBottom:14 }}>🎉</div>
        <div style={{ fontSize:20, fontWeight:800, background:grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:8 }}>Pro Activated!</div>
        <p style={{ color:T.text2, marginBottom:20 }}>All features unlocked for {sel.days} days.</p>
        <Btn ch="Start Using Pro" v="primary" full onClick={onClose} s={{ padding:13 }} />
      </div>
    </div>
  );

  if (step === "qr") return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <button onClick={() => setStep("plans")} style={{ background:T.surf2, border:"none", color:T.text2, cursor:"pointer", borderRadius:8, padding:"6px 10px", fontFamily:"inherit" }}>Back</button>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>Pay Rs {sel.price}</div>
            <div style={{ fontSize:12, color:T.text3 }}>{sel.label} - {sel.days} days</div>
          </div>
        </div>
        <div style={{ textAlign:"center", marginBottom:18 }}>
          <div style={{ background:"#fff", borderRadius:14, padding:12, display:"inline-block", marginBottom:10 }}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay%3Fpa%3Dagentplace%40upi%26am%3D${sel.price}`} alt="UPI QR" style={{ width:180, height:180, display:"block" }} />
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:T.cyan }}>UPI: agentplace@upi</div>
          <div style={{ fontSize:12, color:T.text3, marginTop:4 }}>Google Pay · PhonePe · Paytm · BHIM</div>
        </div>
        <Fld label="TRANSACTION ID / UTR NUMBER">
          <input value={txn} onChange={e => { setTxn(e.target.value); setVerErr(""); }} placeholder="Enter your UTR after payment" style={inpStyle} onKeyDown={e => e.key === "Enter" && verify()} />
        </Fld>
        {verErr && <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"9px 12px", fontSize:12, color:T.red, marginBottom:10 }}>{verErr}</div>}
        <Btn ch={loading ? "Verifying..." : "Confirm Payment"} v="gold" full disabled={loading} onClick={verify} s={{ padding:13 }} />
      </div>
    </div>
  );

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800, background:grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>AgentPlace Pro</div>
            <div style={{ fontSize:13, color:T.text3, marginTop:3 }}>Unlock everything. No limits.</div>
          </div>
          <button onClick={onClose} style={{ background:T.surf2, border:"none", color:T.text2, cursor:"pointer", borderRadius:8, width:32, height:32, fontSize:18, fontFamily:"inherit" }}>x</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
          {Object.entries(plans).map(([k, p]) => (
            <button key={k} onClick={() => setPlan(k)} style={{ background:plan===k?"rgba(0,229,204,.12)":T.surf2, border:`2px solid ${plan===k?T.cyan:T.line2}`, borderRadius:12, padding:"14px 8px", cursor:"pointer", textAlign:"center", fontFamily:"inherit" }}>
              {p.badge && <div style={{ fontSize:10, background:T.amber, color:"#000", borderRadius:8, padding:"2px 7px", fontWeight:700, marginBottom:4 }}>{p.badge}</div>}
              <div style={{ fontSize:12, fontWeight:700, color:plan===k?T.cyan:T.text2, marginBottom:3 }}>{p.label}</div>
              <div style={{ fontSize:22, fontWeight:900, color:T.text }}>Rs {p.price}</div>
              <div style={{ fontSize:11, color:T.text3 }}>{p.days} days</div>
            </button>
          ))}
        </div>
        <div style={{ background:T.surf2, borderRadius:12, padding:14, marginBottom:18 }}>
          {["Unlimited AI mock interviews","Full 50-question aptitude bank","AI resume & GitHub analyser","System design critique","Company-specific blueprints","Practice sheets & DSA notes","No session time limits"].map(f => (
            <div key={f} style={{ fontSize:12, color:T.text2, marginBottom:6, display:"flex", gap:8 }}>
              <span style={{ color:T.green }}>✓</span>{f}
            </div>
          ))}
        </div>
        <Btn ch={`Pay Rs ${sel.price} — Scan QR to Pay`} v="gold" full onClick={() => setStep("qr")} s={{ padding:"13px 0" }} />
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ auth }) {
  const [tab, setTab] = useState("login");
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/actuator/health`).catch(() => {});
    fetch(`${process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000"}/docs`).catch(() => {});
  }, []);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("Log In");
  const [showPw, setShowPw] = useState(false);

  const submit = async () => {
    setErr("");
    if (!email || !pw) { setErr("Fill all fields."); return; }
    setLoading(true);
    let r = tab === "login" ? await auth.login(email, pw) : (!name ? { ok:false, err:"Name required." } : await auth.register(name, email, pw));
    if (!r.ok && r.err && r.err.includes("reach backend")) {
      setErr("Server waking up — auto-retrying in 12s...");
      await new Promise(res => setTimeout(res, 12000));
      r = tab === "login" ? await auth.login(email, pw) : await auth.register(name, email, pw);
    }
    if (!r.ok) setErr(r.err);
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}@keyframes wave{0%,100%{height:4px}50%{height:18px}}@keyframes cdAnim{0%{transform:scale(1.8);opacity:0}30%{transform:scale(1);opacity:1}80%{opacity:1}100%{transform:scale(.6);opacity:0}}*{box-sizing:border-box}`}</style>
      <div style={{ width:"100%", maxWidth:400, padding:20 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:60, height:60, borderRadius:18, background:grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:900, margin:"0 auto 14px", color:"#fff" }}>A</div>
          <h1 style={{ fontSize:24, fontWeight:900, background:grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:"0 0 4px" }}>AgentPlace</h1>
          <p style={{ color:T.text3, fontSize:13, margin:0 }}>AI-powered campus placement simulator</p>
        </div>
        <Card>
          <div style={{ display:"flex", background:T.surf2, borderRadius:10, padding:4, marginBottom:20 }}>
            {["login","register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setErr(""); }} style={{ flex:1, padding:9, borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:700, background:tab===t?T.cyan:"transparent", color:tab===t?T.bg:T.text2, fontFamily:"inherit" }}>
                {t === "login" ? "Log In" : "Register"}
              </button>
            ))}
          </div>
          {tab === "register" && <Fld label="FULL NAME"><input value={name} onChange={e => setName(e.target.value)} placeholder="Arjun Sharma" style={inpStyle} onKeyDown={e => e.key==="Enter" && submit()} disabled={loading} /></Fld>}
          <Fld label="EMAIL"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.edu" style={inpStyle} onKeyDown={e => e.key==="Enter" && submit()} disabled={loading} /></Fld>
          <Fld label="PASSWORD">
            <div style={{ position:"relative" }}>
              <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="password" style={{...inpStyle, paddingRight:38}} onKeyDown={e => e.key==="Enter" && submit()} disabled={loading} />
              <button onClick={() => setShowPw(s => !s)} type="button" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:T.text3, fontSize:14 }}>{showPw ? "🙈" : "👁"}</button>
            </div>
          </Fld>
          {err && <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"8px 12px", fontSize:12, color:T.red, marginBottom:12 }}>{err}</div>}
          <Btn ch={loading ? loadMsg : (tab === "login" ? "Log In" : "Create Account")} v="primary" full disabled={loading} onClick={submit} s={{ padding:"13px 0", marginTop:4 }} />
          <p style={{ textAlign:"center", fontSize:12, color:T.text3, marginTop:14, marginBottom:0 }}>
            {tab === "login" ? "No account? " : "Have account? "}
            <button onClick={() => { setTab(tab==="login"?"register":"login"); setErr(""); }} style={{ background:"none", border:"none", color:T.cyan, fontSize:12, fontWeight:700, cursor:"pointer" }} disabled={loading}>
              {tab === "login" ? "Register free" : "Log In"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}

// ─── TIMER BADGE ──────────────────────────────────────────────────────────────
function TimerBadge({ auth, onUpgrade }) {
  const [left, setLeft] = useState(auth.freeLeft());
  useEffect(() => {
    if (auth.isPro()) return;
    const t = setInterval(() => setLeft(auth.freeLeft()), 1000);
    return () => clearInterval(t);
  }, [auth.isPro()]);
  if (auth.isPro()) {
    const d = auth.user?.proExp ? Math.ceil((auth.user.proExp-Date.now())/86400000) : null;
    return <div onClick={onUpgrade} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(245,158,11,.15)", border:"1px solid rgba(245,158,11,.3)", borderRadius:8, padding:"5px 12px", cursor:"pointer" }}><span style={{ fontSize:11, fontWeight:700, color:T.amber }}>{d ? `Pro · ${d}d left` : "Pro · Active"}</span></div>;
    
  }
  const m = Math.floor(left/60), s = String(Math.floor(left%60)).padStart(2,"0");
  const col = left < 600 ? T.red : left < 1800 ? T.amber : T.cyan;
  return (
    <div onClick={onUpgrade} style={{ display:"flex", alignItems:"center", gap:8, background:T.surf2, border:`1px solid ${T.line2}`, borderRadius:8, padding:"5px 12px", cursor:"pointer" }}>
      <div style={{ width:36, height:4, background:T.surf3, borderRadius:2, overflow:"hidden" }}>
        <div style={{ width:`${(left/7200)*100}%`, height:"100%", background:col, borderRadius:2 }} />
      </div>
      <span style={{ fontSize:11, fontWeight:700, color:col }}>{left<=0?"Expired":`${m}:${s}`}</span>
      <span style={{ fontSize:10, background:T.amber, color:"#000", borderRadius:5, padding:"2px 6px", fontWeight:700 }}>Upgrade</span>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const auth = useAuth();
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const aiUrl = process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000";
    
    // This wakes up the servers while the user is still looking at the homepage
    fetch(`${backendUrl}/actuator/health`).catch(() => {});
    fetch(`${aiUrl}/docs`).catch(() => {});
  }, []);
  const [tab, setTab] = useState(0);
  const [dd, setDd] = useState(false);
  const [comp, setComp] = useState(null);
  const cd = comp ? COS[comp] : null;
  const [showPrem, setShowPrem] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    const hitHandler = () => { setIsDemo(true); };
    const clearHandler = () => { setIsDemo(false); };
    window.addEventListener("demo-hit", hitHandler);
    window.addEventListener("demo-clear", clearHandler);
    return () => {
      window.removeEventListener("demo-hit", hitHandler);
      window.removeEventListener("demo-clear", clearHandler);
    };
  }, []);
  const TABS = [
    { icon:"🏢", label:"Blueprint",     pro:false },
    { icon:"🎓", label:"Academic",      pro:false },
    { icon:"📄", label:"Resume",        pro:false },
    { icon:"⏱", label:"OA Round",      pro:false },
    { icon:"🧠", label:"Aptitude",      pro:false },
    { icon:"🎥", label:"Interview",     pro:false },
    { icon:"🗺", label:"System Design", pro:false },
    { icon:"📋", label:"Practice Sheet",pro:true  },
  ];

  if (!auth.user) return <AuthScreen auth={auth} />;

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'Segoe UI',system-ui,sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`*{box-sizing:border-box}input,select,textarea{-webkit-appearance:none;-webkit-tap-highlight-color:transparent;}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}@keyframes wave{0%,100%{height:4px}50%{height:18px}}@keyframes cdAnim{0%{transform:scale(1.8);opacity:0}30%{transform:scale(1);opacity:1}80%{opacity:1}100%{transform:scale(.6);opacity:0}}*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0D1627}::-webkit-scrollbar-thumb{background:#1E2D45;border-radius:3px}@media(max-width:640px){.app-layout{flex-direction:column!important;height:auto!important;overflow:visible!important}.app-sidebar{width:100%!important;height:auto!important;flex-direction:row!important;overflow-x:auto!important;flex-shrink:0!important;padding:8px!important}.app-sidebar button{min-width:80px;flex-shrink:0}.app-main{height:auto!important;overflow-y:visible!important}.grid-2col,.grid-3col{grid-template-columns:1fr!important}}`}</style>
      {showPrem && <PremiumModal auth={auth} onClose={() => setShowPrem(false)} />}

      <nav style={{ height:54, background:T.surf, borderBottom:`1px solid ${T.line}`, display:"flex", alignItems:"center", padding:"0 16px", gap:12, flexShrink:0, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:9, background:grad, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:"#fff" }}>A</div>
          <span style={{ fontWeight:800, fontSize:15, background:grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>AgentPlace</span>
          {isDemo && <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(245,158,11,.15)", border:"1px solid rgba(245,158,11,.4)", borderRadius:7, padding:"3px 10px", fontSize:11, fontWeight:700, color:"#F59E0B" }}>⚡ Demo Mode — showing sample data</div>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, background:T.surf2, borderRadius:8, padding:"5px 10px", border:`1px solid ${T.line2}` }}>
          <span style={{ fontSize:11, color:T.text3 }}>Target:</span>
          <select value={comp||""} onChange={e => setComp(e.target.value||null)} style={{ background:"transparent", border:"none", color:T.cyan, fontSize:12, fontWeight:700, outline:"none", cursor:"pointer", fontFamily:"inherit" }}>
            <option value="">Select Company</option>
            {Object.entries(COS).map(([k,c]) => <option key={k} value={k}>{c.em} {c.name}</option>)}
          </select>
        </div>
        {cd && <div style={{ fontSize:11, background:"rgba(0,229,204,.1)", border:"1px solid rgba(0,229,204,.3)", borderRadius:8, padding:"4px 10px", color:T.cyan, fontWeight:700 }}>{cd.em} {cd.name} — {cd.tier}</div>}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          <TimerBadge auth={auth} onUpgrade={() => setShowPrem(true)} />
          <div style={{ position:"relative" }}>
            <button onClick={() => setDd(o => !o)} style={{ display:"flex", alignItems:"center", gap:8, background:T.surf2, border:`1px solid ${T.line2}`, borderRadius:9, padding:"6px 10px", cursor:"pointer", fontFamily:"inherit", color:T.text, fontSize:12 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff" }}>{auth.user.name?.[0]?.toUpperCase()}</div>
              {auth.user.name}
              <span style={{ color:T.text3 }}>▾</span>
            </button>
            {dd && (
              <div style={{ position:"absolute", right:0, top:44, width:180, background:T.surf2, border:`1px solid ${T.line2}`, borderRadius:14, zIndex:200, overflow:"hidden" }} onClick={() => setDd(false)}>
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.line}` }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{auth.user.name}</div>
                  <div style={{ fontSize:11, color:T.text3 }}>{auth.user.email}</div>
                  <div style={{ fontSize:11, color:auth.isPro()?T.amber:T.text3, marginTop:3 }}>{auth.isPro()?"Pro Active":"Free Trial"}</div>
                </div>
                {!auth.isPro() && <button onClick={() => setShowPrem(true)} style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 16px", fontSize:13, color:T.amber, background:"none", cursor:"pointer", border:"none", fontFamily:"inherit" }}>Upgrade to Pro</button>}
                <button onClick={auth.logout} style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 16px", fontSize:13, color:T.red, background:"none", cursor:"pointer", border:"none", fontFamily:"inherit" }}>Log Out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="app-layout" style={{ display:"flex", flex:1, overflow:"hidden", minHeight:"calc(100vh - 54px)" }}>
      <aside className="app-sidebar" style={{ width:185, background:T.surf, borderRight:`1px solid ${T.line}`, display:"flex", flexDirection:"column", padding:"12px 8px", gap:3, flexShrink:0, overflowY:"auto" }}>
      {tab > 0 && (
            <button onClick={() => setTab(0)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer", width:"100%", background:"none", color:T.text3, border:`1px solid ${T.line}`, fontFamily:"inherit", marginBottom:8 }}>
              ← Home
            </button>
          )}
          {TABS.map(({ icon, label, pro }, i) => (
            <button key={i} onClick={() => { if (pro && !auth.isPro()) setShowPrem(true); else setTab(i); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left", width:"100%", background:tab===i?"rgba(0,229,204,.12)":"none", color:tab===i?T.cyan:pro?T.text3:T.text2, border:tab===i?"1px solid rgba(0,229,204,.3)":"1px solid transparent", fontFamily:"inherit", transition:"all .15s" }}>
              <span style={{ fontSize:15 }}>{icon}</span>
              <span style={{ flex:1 }}>{label}</span>
              {pro && <span style={{ fontSize:9, background:T.amber, color:"#000", borderRadius:4, padding:"2px 5px", fontWeight:800 }}>PRO</span>}
            </button>
          ))}
          <div style={{ marginTop:"auto", padding:"8px 4px" }}>
            {auth.isPro()
              ? <div style={{ background:"rgba(245,158,11,.1)", border:"1px solid rgba(245,158,11,.25)", borderRadius:12, padding:"10px 12px" }}>
                  <div style={{ fontSize:12, fontWeight:800, color:T.amber }}>Pro Active</div>
                  <div style={{ fontSize:11, color:T.text3 }}>All features unlocked</div>
                </div>
              : <button onClick={() => setShowPrem(true)} style={{ width:"100%", background:gradGold, border:"none", borderRadius:12, padding:12, fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>Upgrade to Pro</button>
            }
          </div>
        </aside>
        <main className="app-main" style={{ flex:1, overflowY:"auto", background:T.bg, minWidth:0 }}>
          {tab===0 && <BlueprintTab cd={cd} comp={comp} setComp={setComp} />}
          {tab===1 && <AcademicTab cd={cd} auth={auth} />}
          {tab===2 && <ResumeTab auth={auth} />}
          {tab===3 && <OATab cd={cd} auth={auth} />}
          {tab===4 && <AptitudeTab auth={auth} />}
          {tab===5 && <InterviewTab auth={auth} />}
          {tab===6 && <SDTab auth={auth} />}
          {tab===7 && <PracticeTab auth={auth} showPrem={() => setShowPrem(true)} />}
        </main>
      </div>
    </div>
  );
}

// ─── BLUEPRINT TAB ────────────────────────────────────────────────────────────
function BlueprintTab({ cd, comp, setComp }) {
  const [cgpa, setCgpa] = useState("7.5"); const [bl, setBl] = useState("0");
  const [loading, setLoading] = useState(false); const [err, setErr] = useState(""); const [res, setRes] = useState(null);
  const analyse = async () => {
    if (!cd) return;
    setLoading(true); setErr(""); setRes(null);
    const cgpaNum = parseFloat(cgpa);
    const blNum = parseInt(bl) || 0;
    const actuallyEligible = cgpaNum >= cd.minCGPA && blNum <= cd.maxBL;
    const prompt = `Student CGPA=${cgpa}, Backlogs=${bl}, Target: ${cd.name} (${cd.tier}). Min CGPA: ${cd.minCGPA}, Max BL: ${cd.maxBL}. Policy: ${cd.backlog}. Return ONLY valid JSON: {"eligible":true,"score":80,"gaps":["gap"],"actionPlan":["step1","step2","step3","step4"],"timeline":"8 weeks","verdict":"2 sentences","pivotCompanies":["name"]}`;
    try {
      const raw = await callAI([{ role:"user", content:prompt }], null, 600);
      const p = parseJSON(raw);
      if (p) {
        p.eligible = actuallyEligible;
        if (!actuallyEligible) {
          p.score = Math.min(p.score || 30, 30);
          p.gaps = [
            cgpaNum < cd.minCGPA ? `CGPA ${cgpaNum} is below the ${cd.minCGPA} minimum` : null,
            blNum > cd.maxBL ? `${blNum} backlogs exceed the limit of ${cd.maxBL}` : null,
          ].filter(Boolean);
        }
      }
      setRes(p || { eligible:actuallyEligible, score:actuallyEligible?72:20, gaps:[], actionPlan:["Prepare for OA","DSA daily","Mock interviews","Company research"], timeline:"8 weeks", verdict:actuallyEligible?"You meet basic eligibility.":"Address gaps first.", pivotCompanies:[] });
    } catch (e) {
      setErr(e.message);
      setRes({ eligible:actuallyEligible, score:actuallyEligible?72:20, gaps:actuallyEligible?[]:["Below cutoff"], actionPlan:["Study OA pattern","DSA daily","Mock interviews","Research company"], timeline:"8-10 weeks", verdict:actuallyEligible?"You meet basic eligibility.":"Address gaps first.", pivotCompanies:[] });
    }
    setLoading(false);
  };
  if (!cd) return (
    <div style={{ padding:28 }}>
      <PgTitle icon="🏢" title="Company Blueprint Engine" sub="Select your target company — the entire app adapts to their exact rules and strategy." />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))", gap:14 }}>
        {Object.entries(COS).map(([k,c]) => (
          <button key={k} onClick={() => setComp(k)} style={{ background:T.surf, border:`1px solid ${T.line}`, borderRadius:16, padding:"18px 14px", cursor:"pointer", textAlign:"left", color:T.text, fontFamily:"inherit", transition:"all .2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor=T.cyan} onMouseLeave={e => e.currentTarget.style.borderColor=T.line}>
            <div style={{ fontSize:26, marginBottom:8 }}>{c.em}</div>
            <div style={{ fontSize:14, fontWeight:800, marginBottom:3 }}>{c.name}</div>
            <div style={{ fontSize:11, fontWeight:700, color:c.tier==="TIER-1"?T.violet:c.tier==="STARTUP"?T.amber:T.cyan, marginBottom:5 }}>{c.tier}</div>
            <div style={{ fontSize:11, color:T.text3 }}>CGPA {c.minCGPA}+ / {c.maxBL===0?"No backlogs":`${c.maxBL} ok`}</div>
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ padding:28 }}>
      <PgTitle icon={cd.em} title={`${cd.name} — Placement Blueprint`} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
        <Card title="Profile Eligibility" ac="cyan">
        <Fld label="YOUR CGPA">
          <input type="number" value={cgpa}
            onChange={e => { const v = parseFloat(e.target.value); if (e.target.value === "" || (v >= 0 && v <= 10)) setCgpa(e.target.value); }}
            onBlur={e => { const v = parseFloat(e.target.value); if (isNaN(v) || v < 0) setCgpa("0"); else if (v > 10) setCgpa("10"); }}
            step="0.1" min="0" max="10" style={inpStyle} placeholder="0.0 - 10.0" />
        </Fld>
        <Fld label="ACTIVE BACKLOGS">
          <input type="number" value={bl}
            onChange={e => { const v = parseInt(e.target.value); if (e.target.value === "" || (v >= 0 && v <= 20)) setBl(e.target.value); }}
            onBlur={e => { const v = parseInt(e.target.value); if (isNaN(v) || v < 0) setBl("0"); else if (v > 20) setBl("20"); }}
            min="0" max="20" style={inpStyle} placeholder="0 - 20" />
        </Fld>
          <Btn ch={loading?"Analysing...":"Check Eligibility"} v="primary" full disabled={loading} onClick={analyse} />
          {err && <div style={{ marginTop:8, fontSize:12, color:T.red }}>{err}</div>}
          {res && (
            <div style={{ marginTop:12, background:res.eligible?"rgba(34,197,94,.08)":"rgba(239,68,68,.08)", border:`1px solid ${res.eligible?"rgba(34,197,94,.3)":"rgba(239,68,68,.3)"}`, borderRadius:12, padding:12 }}>
              <div style={{ fontWeight:800, fontSize:14, color:res.eligible?T.green:T.red, marginBottom:6 }}>{res.eligible?"ELIGIBLE":"NOT ELIGIBLE"} · {res.score}/100</div>
              {res.gaps?.map((g,i) => <div key={i} style={{ fontSize:12, color:T.amber, marginBottom:3 }}>! {g}</div>)}
              <p style={{ fontSize:12, color:T.text2, margin:"6px 0 0" }}>{res.verdict}</p>
            </div>
          )}
        </Card>
        <Card title="Requirements" ac="violet">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {[["Min CGPA", cd.minCGPA+"+"],["Max Backlogs", cd.maxBL===0?"Zero":String(cd.maxBL)],["Tier", cd.tier]].map(([l,v]) => (
              <div key={l} style={{ background:T.surf2, borderRadius:8, padding:"8px 10px" }}>
                <div style={{ fontSize:10, color:T.text3, marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:800, color:T.violet }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:T.text3, fontWeight:700, textTransform:"uppercase", marginBottom:6 }}>Backlog Policy</div>
          <div style={{ fontSize:12, color:T.text2, lineHeight:1.7, paddingLeft:10, borderLeft:`2px solid ${T.amber}`, marginBottom:10 }}>{cd.backlog}</div>
          {cd.tips.map((t,i) => <div key={i} style={{ fontSize:12, color:T.text2, marginBottom:5, display:"flex", gap:7 }}><span style={{ color:T.cyan }}>›</span>{t}</div>)}
        </Card>
        <Card title="Interview Rounds" ac="cyan">
          {cd.rounds.map((r,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, flexShrink:0, color:"#fff" }}>{i+1}</div>
              <div style={{ fontSize:12 }}>{r}</div>
            </div>
          ))}
          <div style={{ background:"rgba(168,85,247,.1)", border:"1px solid rgba(168,85,247,.2)", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#c4b5fd" }}>{cd.oaFmt}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
            {cd.topics.map(t => <span key={t} style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:T.surf2, color:T.text2 }}>{t}</span>)}
          </div>
        </Card>
      </div>
      {res?.actionPlan?.length > 0 && (
        <Card title="Your Personalised Action Plan" ac="cyan">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            {res.actionPlan.map((s,i) => (
              <div key={i} style={{ background:T.surf2, border:`1px solid ${T.line2}`, borderRadius:12, padding:"10px 14px", fontSize:13, color:T.text2 }}>
                <span style={{ color:T.cyan, fontWeight:800, marginRight:8 }}>{i+1}.</span>{s}
              </div>
            ))}
          </div>
          {res.timeline && <div style={{ marginTop:10, fontSize:12, color:T.text3 }}>Timeline: <strong style={{ color:T.cyan }}>{res.timeline}</strong></div>}
        </Card>
      )}
    </div>
  );
}

// ─── ACADEMIC TAB ─────────────────────────────────────────────────────────────
function AcademicTab({ cd, auth }) {
  // ✅ THE FIXED CODE
// Inside AcademicTab

  const [cgpa, setCgpa] = useState("7.8"); 
  const [yr, setYr] = useState("2026"); 
  const [bl, setBl] = useState("0");
  const blNum = bl === "" ? 0 : parseInt(bl);
  const ok = parseFloat(cgpa) >= (cd?.minCGPA||7.0) && blNum <= (cd?.maxBL||1);
  const WKS = [["W1-2","Linear Algebra + Prob","Arrays + Strings"],["W3-4","DBMS + SQL","Linked Lists + Stacks"],["W5-6","OS + CN Basics","Trees + BST + Heaps"],["W7-8","Pending Subjects","Graphs + BFS/DFS"],["W9-10","Mock Exams","DP + Greedy"],["W11-12","Full Revision","System Design + Mocks"]];
  
  return (
    <FreeGate auth={auth} feat="Academic Optimizer">
      <div style={{ padding:28 }}>
        <PgTitle icon="🎓" title="Academic Optimizer & Day-1 Predictor" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:18, marginBottom:18 }}>
          <Card title="Your Profile" ac="cyan">
          <Fld label="CURRENT CGPA">
            <input type="number" value={cgpa}
              onChange={e => { const v = parseFloat(e.target.value); if (e.target.value === "" || (v >= 0 && v <= 10)) setCgpa(e.target.value); }}
              onBlur={e => { const v = parseFloat(e.target.value); if (isNaN(v) || v < 0) setCgpa("0"); else if (v > 10) setCgpa("10"); }}
              step="0.1" min="0" max="10" style={inpStyle} placeholder="0.0 - 10.0" />
            </Fld>
          <Fld label="GRADUATION YEAR">
            <input type="number" value={yr}
              onChange={e => { const v = parseInt(e.target.value); if (e.target.value === "" || (v >= 2024 && v <= 2030)) setYr(e.target.value); }}
              onBlur={e => { const v = parseInt(e.target.value); if (isNaN(v) || v < 2024) setYr("2024"); else if (v > 2030) setYr("2030"); }}
              min="2024" max="2030" style={inpStyle} placeholder="2024 - 2030" />
          </Fld>
          <Fld label="PENDING BACKLOGS">
            <input type="number" value={bl}
              onChange={e => { const v = parseInt(e.target.value); if (e.target.value === "" || (v >= 0 && v <= 20)) setBl(e.target.value); }}
              onBlur={e => { const v = parseInt(e.target.value); if (isNaN(v) || v < 0) setBl("0"); else if (v > 20) setBl("20"); }}
              min="0" max="20" style={inpStyle} placeholder="0 - 20" />
          </Fld>
            {cd && <div style={{ fontSize:11, color:T.text3, marginBottom:8 }}>Checking vs: <strong style={{ color:T.violet }}>{cd.name}</strong></div>}
            <div style={{ borderRadius:10, padding:"12px 14px", fontSize:13, fontWeight:700, background:ok?"rgba(34,197,94,.08)":"rgba(239,68,68,.08)", border:`1px solid ${ok?"rgba(34,197,94,.3)":"rgba(239,68,68,.3)"}`, color:ok?T.green:T.red }}>
  {ok ? 
    (parseInt(bl) === 1 ? `Eligible (Clear 5th sem re in 7th Sem)` : `Eligible for ${cd?.name||"Day-1"} drives`) 
    : `Ineligible: ${(bl === "" ? 0 : parseInt(bl)) > (cd?.maxBL||1) ? "Too many backlogs" : "CGPA below cutoff"}`
  }
</div>
          </Card>
          <Card title="Trajectory Chart" ac="violet">
            <svg viewBox="0 0 420 165" style={{ width:"100%", height:"auto" }}>
              <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00E5CC" stopOpacity=".3"/><stop offset="100%" stopColor="#00E5CC" stopOpacity="0"/></linearGradient></defs>
              {[40,80,120].map(y => <line key={y} x1="30" y1={y} x2="395" y2={y} stroke={T.line2} strokeWidth="1"/>)}
              <polygon fill="url(#ga)" points="30,142 105,118 185,94 265,70 345,46 345,155 30,155"/>
              <polyline fill="none" stroke={T.cyan} strokeWidth="2.5" strokeLinecap="round" points="30,142 105,118 185,94 265,70 345,46"/>
              <polyline fill="none" stroke={T.violet} strokeWidth="2" strokeDasharray="7,4" points="30,155 105,131 185,108 265,80 345,43"/>
              {["Jan","Apr","Jul","Oct","Dec"].map((m,i) => <text key={m} x={30+i*79} y="163" fill={T.text3} fontSize="9" textAnchor="middle">{m}</text>)}
              <text x="34" y="15" fill={T.cyan} fontSize="10">CGPA</text>
              <text x="100" y="15" fill={T.violet} fontSize="10">DSA</text>
            </svg>
          </Card>
        </div>
        <Card title="Hybrid Preparation Timeline" ac="cyan">
          {WKS.map(([w,study,dsa],i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:11, color:T.text3, width:48, flexShrink:0, fontFamily:"monospace", fontWeight:700 }}>{w}</div>
              <div style={{ flex:1, display:"flex", gap:8 }}>
                <div style={{ flex:1, borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600, background:i%2===0?"rgba(0,229,204,.1)":"rgba(168,85,247,.1)", border:`1px solid ${i%2===0?"rgba(0,229,204,.2)":"rgba(168,85,247,.2)"}`, color:i%2===0?T.cyan:T.violet }}>Study: {study}</div>
                <div style={{ flex:1, borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600, background:T.surf2, border:`1px solid ${T.line2}`, color:T.text2 }}>DSA: {dsa}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </FreeGate>
  );
}

// ─── RESUME TAB — ATS analysis is now AI-powered ──────────────────────────────
// ─── RESUME TAB — Real GitHub API + Real PDF text extraction ─────────────────
function ResumeTab({ auth }) {
  const [url, setUrl] = useState("");
  const [fname, setFname] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [drag, setDrag] = useState(false);
  const [qs, setQs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [err, setErr] = useState("");
  const [ats, setAts] = useState(null);
  const [ghData, setGhData] = useState(null);

  // Extract username from full GitHub URL or plain username
  const parseGHUsername = (input) => {
    const trimmed = input.trim();
    // Handle full URLs like https://github.com/torvalds or github.com/torvalds
    const match = trimmed.match(/github\.com\/([a-zA-Z0-9_.-]+)/);
    if (match) return match[1];
    // Plain username like "torvalds"
    if (/^[a-zA-Z0-9_.-]+$/.test(trimmed)) return trimmed;
    return null;
  };

  const gen = async () => {
    if (!url.trim() && !fileObj) {
      setErr("Please upload a resume PDF or enter a GitHub URL/username.");
      return;
    }

    setLoading(true);
    setErr("");
    setQs([]);
    setAts(null);
    setGhData(null);

    let context = "";

    try {
      // ── STEP 1: Get real data ───────────────────────────────────────────────
      if (url.trim()) {
        const username = parseGHUsername(url.trim());
        if (!username) {
          throw new Error("Invalid GitHub URL. Use: https://github.com/username or just the username.");
        }

        setLoadingStep("Fetching real GitHub profile...");
        const ghResp = await fetch(`${process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000"}/v1/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        if (!ghResp.ok) {
          let errMsg = "GitHub fetch failed";
          try { const errData = await ghResp.json(); errMsg = errData.detail || errMsg; } catch {}
          throw new Error(errMsg);
        }

        const gh = await ghResp.json();
        setGhData(gh);

        context = `
REAL GitHub Profile Data for @${gh.username}:
- Name: ${gh.name}
- Bio: ${gh.bio}
- Public Repos: ${gh.public_repos} | Followers: ${gh.followers}
- Total Stars: ${gh.total_stars}
- Languages Used: ${gh.languages.join(", ") || "None detected"}
- Top Repositories:
${gh.top_repos.map(r =>
  `  • ${r.name} [${r.language}] ★${r.stars} — ${r.description}${r.topics.length ? " | Topics: " + r.topics.join(", ") : ""}`
).join("\n")}
        `.trim();

      } else if (fileObj) {
        setLoadingStep("Reading PDF text...");
        const formData = new FormData();
        formData.append("file", fileObj);

        const pdfResp = await fetch(`${process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8000"}/v1/parse-pdf`, {
          method: "POST",
          body: formData,
        });

        if (!pdfResp.ok) {
          const errData = await pdfResp.json();
          throw new Error(errData.detail || "PDF parsing failed");
        }

        const pdfData = await pdfResp.json();
        context = `REAL Resume Text (${pdfData.pages} pages):\n\n${pdfData.text}`;
      }

      // ── STEP 2: Send REAL data to AI ───────────────────────────────────────
      setLoadingStep("AI analysing real profile...");

      const prompt = `You are a senior ATS recruiter. Analyse this REAL candidate data and give an honest, specific assessment.

${context}

Based ONLY on the actual data above, return ONLY valid JSON:
{
  "questions": [
    {"question": "specific question based on their actual projects/skills", "followUp": "deeper follow-up", "difficulty": "Easy|Medium|Hard", "topic": "topic area"},
    {"question": "...", "followUp": "...", "difficulty": "...", "topic": "..."},
    {"question": "...", "followUp": "...", "difficulty": "...", "topic": "..."}
  ],
  "ats": {
    "score": <realistic 20-95 based on actual profile strength>,
    "summary": "2 sentences mentioning specific projects/skills found",
    "strengths": ["specific strength from their actual data"],
    "weaknesses": ["specific gap found in their actual data"],
    "keywords": [
      {"name": "actual skill/technology seen in data", "status": "found"},
      {"name": "important missing skill for SDE roles", "status": "missing"}
    ]
  }
}`;

      const raw = await callAI([{ role: "user", content: prompt }], "You are a professional ATS system giving honest analysis based only on real data provided.", 1200);
      const p = parseJSON(raw);

      if (p && Array.isArray(p.questions) && p.ats) {
        setQs(p.questions);
        setAts(p.ats);
      } else {
        throw new Error("AI returned invalid format. Try again.");
      }

    } catch (e) {
      setErr(e.message || "Analysis failed");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const circ = 2 * Math.PI * 46;
  const atsScore = ats?.score || 0;
  const atsOff = circ - (atsScore / 100) * circ;
  const ringColor = atsScore >= 70 ? T.green : atsScore >= 50 ? T.amber : atsScore > 0 ? T.red : T.surf2;

  return (
    <FreeGate auth={auth} feat="Resume Analyser">
      <div style={{ padding: 28 }}>
        <PgTitle icon="📄" title="ATS Resume & GitHub Interrogator" sub="Real analysis — reads actual PDF text and live GitHub data" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
          <div>
            {/* PDF Upload */}
            <div
              onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f && f.name.endsWith(".pdf")) { setFname(f.name); setFileObj(f); setUrl(""); } else setErr("Only PDF files supported."); }}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onClick={() => document.getElementById("pdfIn")?.click()}
              style={{ border: `2px dashed ${drag ? T.cyan : fileObj ? T.green : T.line2}`, borderRadius: 16, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: drag ? "rgba(0,229,204,.05)" : fileObj ? "rgba(34,197,94,.05)" : "transparent", marginBottom: 14, transition: "all .2s" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{fileObj ? "✅" : "📋"}</div>
              <div style={{ fontSize: 14, color: fileObj ? T.green : T.text2, fontWeight: 600 }}>{fname || "Drop your resume PDF here"}</div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>{fileObj ? "PDF loaded — will extract real text" : "or click to browse · PDF only"}</div>
            </div>
            <input id="pdfIn" type="file" accept=".pdf" style={{ display: "none" }}
              onChange={e => { const f = e.target.files[0]; if (f) { setFname(f.name); setFileObj(f); setUrl(""); setErr(""); } }} />

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: T.line2 }} />
              <span style={{ fontSize: 11, color: T.text3, fontWeight: 700 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: T.line2 }} />
            </div>

            {/* GitHub URL */}
            <Fld label="GITHUB URL OR USERNAME">
              <input
                value={url}
                onChange={e => { setUrl(e.target.value); if (e.target.value.trim()) { setFname(""); setFileObj(null); } setErr(""); }}
                placeholder="https://github.com/torvalds  or  torvalds"
                style={inpStyle}
                onKeyDown={e => e.key === "Enter" && gen()}
              />
            </Fld>

            <Btn ch={loading ? (loadingStep || "Analysing...") : "Analyse Profile"} v="primary" full disabled={loading} onClick={gen} s={{ padding: "13px 0" }} />

            {err && (
              <div style={{ marginTop: 10, fontSize: 12, color: T.red, lineHeight: 1.6, padding: "10px 12px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8 }}>
                ⚠ {err}
              </div>
            )}

            {/* Show real GitHub stats if fetched */}
            {ghData && (
              <div style={{ marginTop: 14, background: T.surf2, border: `1px solid ${T.line2}`, borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.cyan, marginBottom: 10, textTransform: "uppercase" }}>Real GitHub Data Fetched</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{ghData.name} <span style={{ color: T.text3, fontWeight: 400 }}>@{ghData.username}</span></div>
                <div style={{ fontSize: 12, color: T.text2, marginBottom: 8 }}>{ghData.bio}</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                  {[["Repos", ghData.public_repos], ["Followers", ghData.followers], ["Stars", ghData.total_stars]].map(([l, v]) => (
                    <div key={l} style={{ fontSize: 12, color: T.text3 }}><strong style={{ color: T.cyan }}>{v}</strong> {l}</div>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {ghData.languages.slice(0, 6).map(lang => (
                    <span key={lang} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(0,229,204,.1)", color: T.cyan, border: "1px solid rgba(0,229,204,.2)" }}>{lang}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ATS Score Ring */}
          <Card title="ATS Match Results" ac="cyan">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r="46" fill="none" stroke={T.surf2} strokeWidth="11" />
                <circle cx="65" cy="65" r="46" fill="none" stroke={ringColor} strokeWidth="11"
                  strokeDasharray={String(circ)} strokeDashoffset={String(atsOff)}
                  strokeLinecap="round" transform="rotate(-90 65 65)" />
                <text x="65" y="70" textAnchor="middle" fill={atsScore > 0 ? ringColor : T.text3} fontSize="26" fontWeight="900">
                  {atsScore > 0 ? `${atsScore}%` : "--"}
                </text>
              </svg>
              <div style={{ fontSize: 11, fontWeight: 700, color: ringColor }}>
                {atsScore >= 70 ? "Strong Profile" : atsScore >= 50 ? "Average Profile" : atsScore > 0 ? "Needs Improvement" : "No Profile Loaded"}
              </div>

              {ats?.summary && (
                <div style={{ fontSize: 12, color: T.text2, textAlign: "center", lineHeight: 1.6, padding: "8px 4px", borderTop: `1px solid ${T.line}`, width: "100%" }}>
                  {ats.summary}
                </div>
              )}

              {ats?.keywords && (
                <div style={{ width: "100%" }}>
                  {ats.keywords.map((k, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.line}` }}>
                      <span style={{ fontSize: 12, color: T.text2 }}>{k.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: k.status === "found" ? T.green : k.status === "partial" ? T.amber : T.red }}>{k.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {ats?.strengths && (
                <div style={{ width: "100%", marginTop: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.green, textTransform: "uppercase", marginBottom: 6 }}>Strengths</div>
                  {ats.strengths.map((s, i) => <div key={i} style={{ fontSize: 12, color: T.text2, marginBottom: 4, paddingLeft: 10, borderLeft: `2px solid ${T.green}` }}>{s}</div>)}
                </div>
              )}

              {ats?.weaknesses && (
                <div style={{ width: "100%", marginTop: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.red, textTransform: "uppercase", marginBottom: 6 }}>Gaps Found</div>
                  {ats.weaknesses.map((w, i) => <div key={i} style={{ fontSize: 12, color: T.text2, marginBottom: 4, paddingLeft: 10, borderLeft: `2px solid ${T.red}` }}>{w}</div>)}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Interview Questions */}
        {qs.length > 0 && (
          <Card title="AI-Generated Interview Questions Based on Your Profile" ac="violet">
            {qs.map((q, i) => (
              <div key={i} style={{ background: T.surf2, border: `1px solid ${T.line2}`, borderRadius: 12, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 700, flexShrink: 0, background: q.difficulty === "Hard" ? "rgba(239,68,68,.15)" : q.difficulty === "Medium" ? "rgba(245,158,11,.15)" : "rgba(34,197,94,.15)", color: q.difficulty === "Hard" ? T.red : q.difficulty === "Medium" ? T.amber : T.green }}>{q.difficulty}</span>
                  <span style={{ fontSize: 11, color: T.text3, flexShrink: 0 }}>{q.topic}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6, lineHeight: 1.5 }}>{q.question}</div>
                <div style={{ fontSize: 12, color: T.text3, fontStyle: "italic" }}>↳ {q.followUp}</div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </FreeGate>
  );
}

// ─── OA TAB ───────────────────────────────────────────────────────────────────
function OATab({ cd, auth }) {
  const [time, setTime] = useState(90*60); const [running, setRunning] = useState(false);
  const [pidx, setPidx] = useState(0); const prob = DSA[pidx];
  const [code, setCode] = useState(prob.start);
  const [anal, setAnal] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState(""); const [out, setOut] = useState(null);
  const tRef = useRef(null);
  const changeProblem = i => { setPidx(i); setCode(DSA[i].start); setOut(null); setAnal(null); setErr(""); };
  useEffect(() => {
    if (running) { tRef.current = setInterval(() => setTime(t => { if (t<=1){clearInterval(tRef.current);setRunning(false);return 0;}return t-1;}), 1000); }
    else clearInterval(tRef.current);
    return () => clearInterval(tRef.current);
  }, [running]);
  const mins = String(Math.floor(time/60)).padStart(2,"0"), secs = String(time%60).padStart(2,"0");
  const analyse = async () => {
    setLoading(true); setErr(""); setAnal(null);
    const prompt = `Analyse this JavaScript solution for "${prob.title}". Return ONLY valid JSON: {"timeComplexity":"O(n)","spaceComplexity":"O(n)","explanation":"2-3 sentences","optimizations":"tip or Already optimal","score":85}\n\nCode:\n${code}`;
    try {
      const raw = await callAI([{ role:"user", content:prompt }], null, 500);
      const p = parseJSON(raw); if (p) setAnal(p); else throw new Error("Parse failed");
    } catch (e) { setErr(e.message); setAnal({ timeComplexity:"O(n)", spaceComplexity:"O(n)", explanation:"Unable to reach AI.", optimizations:"Check edge cases.", score:70 }); }
    setLoading(false);
  };
  const runTests = () => {
    setOut(null);
    try { const fn=new Function("return ("+code+")")(); const results=prob.run(fn); setOut(results.join("\n")); }
    catch (e) { setOut("Error: " + e.message); }
  };
  const dc = { Easy:T.green, Medium:T.amber, Hard:T.red };
  return (
    <FreeGate auth={auth} feat="OA Simulator">
      <div style={{ padding:28 }}>
        <PgTitle icon="⏱" title={cd ? `OA Simulator — ${cd.name}` : "OA Round Simulator"} />
        {cd && <div style={{ background:"rgba(168,85,247,.08)", border:"1px solid rgba(168,85,247,.2)", borderRadius:13, padding:"13px 16px", marginBottom:18 }}>
          <div style={{ fontSize:12, fontWeight:800, color:T.violet, marginBottom:4 }}>{cd.name} OA Format</div>
          <div style={{ fontSize:13, color:T.text2 }}>{cd.oaFmt}</div>
        </div>}
        <Card s={{ marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
            <div style={{ fontSize:52, fontWeight:900, fontFamily:"monospace", letterSpacing:2, color:time<300?T.red:T.cyan }}>{mins}:{secs}</div>
            <Btn ch={running?"Pause":"Start Timer"} v={running?"red":"cyan"} onClick={() => setRunning(r => !r)} />
            <Btn ch="Reset" v="outline" onClick={() => { setRunning(false); setTime(90*60); }} />
            <div style={{ flex:1, minWidth:100 }}>
              <div style={{ height:6, background:T.surf3, borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(time/(90*60))*100}%`, background:grad, borderRadius:3, transition:"width .5s" }} />
              </div>
            </div>
          </div>
        </Card>
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:12, color:T.text3, fontWeight:700 }}>PROBLEM:</span>
          {DSA.map((p,i) => (
            <button key={i} onClick={() => changeProblem(i)} style={{ padding:"5px 11px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", background:pidx===i?"rgba(0,229,204,.12)":T.surf2, border:`1px solid ${pidx===i?T.cyan:T.line2}`, color:pidx===i?T.cyan:T.text2, transition:"all .15s" }}>{p.title}</button>
          ))}
          <button onClick={() => changeProblem((pidx+1+Math.floor(Math.random()*(DSA.length-1)))%DSA.length)} style={{ marginLeft:"auto", padding:"5px 11px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", background:"rgba(168,85,247,.12)", border:"1px solid rgba(168,85,247,.3)", color:T.violet }}>Random</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <span style={{ fontSize:16, fontWeight:800 }}>{prob.title}</span>
              <span style={{ fontSize:11, padding:"3px 9px", borderRadius:7, fontWeight:700, background:(dc[prob.diff]||T.text3)+"20", color:dc[prob.diff]||T.text3 }}>{prob.diff}</span>
              {prob.tags.map(t => <span key={t} style={{ fontSize:11, padding:"3px 9px", borderRadius:6, background:T.surf2, color:T.text2 }}>{t}</span>)}
            </div>
            <p style={{ fontSize:13, color:T.text2, lineHeight:1.75, marginBottom:14 }}>{prob.desc}</p>
            <div style={{ fontSize:11, fontWeight:700, color:T.text3, textTransform:"uppercase", marginBottom:8 }}>Examples</div>
            {prob.ex.map((ex,i) => (
              <div key={i} style={{ background:T.bg, borderRadius:8, padding:"10px 12px", fontFamily:"monospace", fontSize:12, marginBottom:8 }}>
                <div style={{ color:T.text3 }}>Input: <span style={{ color:T.cyan }}>{ex[0]}</span></div>
                <div style={{ color:T.text3, marginTop:4 }}>Output: <span style={{ color:T.violet }}>{ex[1]}</span></div>
              </div>
            ))}
          </Card>
          <div>
            <div style={{ display:"flex", gap:6, background:T.surf2, padding:"7px 12px", borderRadius:"11px 11px 0 0", border:`1px solid ${T.line2}`, borderBottom:"none", alignItems:"center" }}>
              {["#FF5F57","#FFBC2E","#28CA41"].map(c => <div key={c} style={{ width:12, height:12, borderRadius:"50%", background:c }} />)}
              <span style={{ fontSize:11, color:T.text3, marginLeft:8 }}>solution.js</span>
              <button onClick={() => { setCode(prob.start); setOut(null); setAnal(null); }} style={{ marginLeft:"auto", fontSize:10, color:T.text3, background:T.surf3, border:"none", cursor:"pointer", fontFamily:"inherit", padding:"2px 7px", borderRadius:4 }}>Reset</button>
            </div>
            <textarea value={code} onChange={e => setCode(e.target.value)} spellCheck={false}
              style={{ width:"100%", background:T.bg, border:`1px solid ${T.line2}`, borderTop:"none", borderRadius:"0 0 11px 11px", padding:14, fontFamily:"'Courier New',monospace", fontSize:12, color:"#7DD3FC", minHeight:250, resize:"vertical", outline:"none", lineHeight:1.65, boxSizing:"border-box" }} />
            <div style={{ display:"flex", gap:8, marginTop:10 }}>
              <Btn ch={loading?"Analysing...":"Analyse Big-O"} v="cyan" disabled={loading} onClick={analyse} />
              <Btn ch="Run Tests" v="outline" onClick={runTests} />
            </div>
            {out && <pre style={{ background:T.bg, border:`1px solid ${T.line2}`, borderRadius:8, padding:12, fontSize:12, color:T.text2, marginTop:10, fontFamily:"monospace", whiteSpace:"pre-wrap", lineHeight:1.7 }}>{out}</pre>}
            {err && <div style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"8px 12px", fontSize:12, color:T.red, marginTop:8 }}>{err}</div>}
          </div>
        </div>
        {anal && (
          <Card title="Complexity Analysis" ac="cyan" s={{ marginTop:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
              {[["Time",anal.timeComplexity,T.cyan],["Space",anal.spaceComplexity,T.violet],["Score",`${anal.score}/100`,anal.score>=80?T.green:anal.score>=60?T.cyan:T.red]].map(([l,v,col]) => (
                <div key={l} style={{ background:T.surf2, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:900, color:col }}>{v}</div>
                  <div style={{ fontSize:11, color:T.text3, marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize:13, color:T.text2, lineHeight:1.7, marginBottom:anal.optimizations?8:0 }}>{anal.explanation}</p>
            {anal.optimizations && <p style={{ fontSize:12, color:T.cyan }}>Tip: {anal.optimizations}</p>}
          </Card>
        )}
      </div>
    </FreeGate>
  );
}

// ─── APTITUDE TAB ─────────────────────────────────────────────────────────────
function AptitudeTab({ auth }) {
  const [phase, setPhase] = useState("home");
  const [topic, setTopic] = useState("All"); const [qcount, setQcount] = useState(10);
  const [qs, setQs] = useState([]); const [cur, setCur] = useState(0); const [ans, setAns] = useState({});
  const [tl, setTl] = useState(30); const [tu, setTu] = useState(false); const [exp, setExp] = useState({});
  const tRef = useRef(null);
  const getHist = () => { try { return JSON.parse(localStorage.getItem("apt_h")||"[]"); } catch { return []; } };
  const start = () => {
    let pool = topic==="All" ? QB : QB.filter(q => q.c===topic);
    const picked = shuffle(pool).slice(0, Math.min(qcount, pool.length)).map((q,i) => ({ ...q, id:i, opts:shuffle(q.o.map((o,j) => ({ t:o, orig:j }))) }));
    setQs(picked); setCur(0); setAns({}); setPhase("quiz"); setTl(30); setTu(false);
  };
  const finish = () => {
    clearInterval(tRef.current); setPhase("result");
    const sc = qs.reduce((s,q) => { const u=ans[q.id]; return (u!==undefined && q.opts[u].orig===q.a) ? s+1 : s; }, 0);
    const h = [{ sc, total:qs.length, topic, date:new Date().toLocaleDateString("en-IN") }, ...getHist()].slice(0,5);
    try { localStorage.setItem("apt_h", JSON.stringify(h)); } catch {}
  };
  useEffect(() => {
    if (phase !== "quiz") return;
    clearInterval(tRef.current); setTu(false); setTl(30);
    tRef.current = setInterval(() => setTl(t => { if (t<=1){clearInterval(tRef.current);setTu(true);setTimeout(()=>{if(cur<qs.length-1)setCur(c=>c+1);else finish();},1400);return 0;}return t-1;}), 1000);
    return () => clearInterval(tRef.current);
  }, [cur, phase]);
  const pick = (id, i) => { if (ans[id]!==undefined||tu) return; setAns(a=>({...a,[id]:i})); clearInterval(tRef.current); setTimeout(()=>{if(cur<qs.length-1)setCur(c=>c+1);else finish();},650); };
  const hist = getHist();
  if (phase === "home") return (
    <div style={{ padding:28 }}>
      <PgTitle icon="🧠" title="Aptitude Training Centre" sub="Timed practice — Quant, Logic, Verbal" />
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:18 }}>
        <div>
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:11, color:T.text3, fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Category</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 }}>
              {[["All","All topics"],["Quant","17 Qs"],["Logic","16 Qs"],["Verbal","17 Qs"]].map(([t,d]) => (
                <button key={t} onClick={() => setTopic(t)} style={{ background:topic===t?"rgba(0,229,204,.12)":T.surf, border:`2px solid ${topic===t?T.cyan:T.line}`, borderRadius:12, padding:"14px 8px", cursor:"pointer", textAlign:"center", fontFamily:"inherit" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:topic===t?T.cyan:T.text, marginBottom:4 }}>{t}</div>
                  <div style={{ fontSize:11, color:T.text3 }}>{d}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:T.text3, fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Questions</div>
            <div style={{ display:"flex", gap:8 }}>
              {[[5,"Quick"],[10,"Standard"],[15,"Full"]].map(([n,l]) => (
                <button key={n} onClick={() => setQcount(n)} style={{ flex:1, padding:"10px 8px", borderRadius:10, border:`1px solid ${qcount===n?T.cyan:T.line2}`, background:qcount===n?"rgba(0,229,204,.12)":T.surf2, color:qcount===n?T.cyan:T.text2, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  {n} Qs<div style={{ fontSize:10, marginTop:2 }}>{l}</div>
                </button>
              ))}
            </div>
          </div>
          <Btn ch={`Start ${qcount}-Question Session`} v="primary" full onClick={start} s={{ padding:"14px 0", fontSize:15 }} />
        </div>
        <Card title="Recent Scores" ac="cyan">
          {hist.length===0 ? <p style={{ fontSize:13, color:T.text3, fontStyle:"italic" }}>No attempts yet.</p>
            : hist.map((h,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<hist.length-1?`1px solid ${T.line}`:"none" }}>
                <div><div style={{ fontSize:13, fontWeight:600 }}>{h.topic}</div><div style={{ fontSize:11, color:T.text3 }}>{h.date}</div></div>
                <div style={{ fontSize:18, fontWeight:900, color:h.sc/h.total>=.8?T.green:h.sc/h.total>=.6?T.amber:T.red }}>{h.sc}/{h.total}</div>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
  if (phase === "quiz") {
    const q = qs[cur]; const tlCol = tl<=10?T.red:tl<=20?T.amber:T.cyan;
    return (
      <div style={{ padding:28, maxWidth:660, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <span style={{ fontSize:14, fontWeight:700, color:T.text2 }}>Q {cur+1}/{qs.length}</span>
          <span style={{ fontSize:38, fontWeight:900, fontFamily:"monospace", color:tlCol }}>{tl}s</span>
          <Btn ch="End Quiz" v="outline" onClick={finish} s={{ fontSize:12, padding:"6px 13px" }} />
        </div>
        <div style={{ height:6, background:T.surf3, borderRadius:3, marginBottom:22, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${(cur/qs.length)*100}%`, background:grad, borderRadius:3 }} />
        </div>
        {tu && <div style={{ textAlign:"center", color:T.red, fontWeight:800, marginBottom:12 }}>Time's Up!</div>}
        <Card s={{ marginBottom:18 }}><p style={{ fontSize:15, fontWeight:600, lineHeight:1.65, margin:0 }}>{q.q}</p></Card>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          {q.opts.map((opt,i) => {
            const sel = ans[q.id]===i;
            return (
              <button key={i} onClick={() => pick(q.id,i)} disabled={ans[q.id]!==undefined||tu}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 15px", borderRadius:11, fontSize:13, fontWeight:500, cursor:ans[q.id]!==undefined?"default":"pointer", background:sel?"rgba(0,229,204,.12)":T.surf2, border:`1px solid ${sel?T.cyan:T.line2}`, color:sel?T.cyan:T.text2, fontFamily:"inherit", textAlign:"left" }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:sel?"rgba(0,229,204,.3)":T.surf3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, flexShrink:0, color:sel?T.cyan:T.text3 }}>{String.fromCharCode(65+i)}</div>
                {opt.t}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  const score = qs.reduce((s,q) => { const u=ans[q.id]; return (u!==undefined && q.opts[u].orig===q.a) ? s+1 : s; }, 0);
  const pct = qs.length > 0 ? score/qs.length : 0;
  return (
    <div style={{ padding:28 }}>
      <div style={{ display:"flex", gap:10, marginBottom:20 }}><Btn ch="Home" v="outline" onClick={() => setPhase("home")} /><Btn ch="Retake" v="primary" onClick={start} /></div>
      <div style={{ background:pct>=.8?"rgba(34,197,94,.08)":pct>=.6?"rgba(245,158,11,.08)":"rgba(239,68,68,.08)", border:`1px solid ${pct>=.8?"rgba(34,197,94,.3)":pct>=.6?"rgba(245,158,11,.3)":"rgba(239,68,68,.3)"}`, borderRadius:18, padding:"28px 24px", textAlign:"center", marginBottom:20 }}>
        <div style={{ fontSize:60, fontWeight:900 }}>{score}<span style={{ fontSize:28, color:T.text3 }}>/{qs.length}</span></div>
        <div style={{ fontSize:18, fontWeight:800, color:pct>=.8?T.green:pct>=.6?T.amber:T.red }}>{pct>=.8?"Excellent!":pct>=.6?"Good job!":"Keep practising!"}</div>
      </div>
      {qs.map(q => {
        const picked=ans[q.id]; const ok=picked!==undefined&&q.opts[picked].orig===q.a;
        return (
          <div key={q.id} style={{ background:T.surf, border:`1px solid ${ok?"rgba(34,197,94,.3)":"rgba(239,68,68,.3)"}`, borderRadius:14, padding:14, marginBottom:10 }}>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:15, flexShrink:0 }}>{ok?"[ok]":"[no]"}</span>
              <p style={{ fontSize:13, fontWeight:600, margin:0, lineHeight:1.55 }}>{q.q}</p>
            </div>
            {!ok && picked!==undefined && <div style={{ fontSize:12, color:T.text3, marginLeft:26, marginBottom:3 }}>Your answer: <span style={{ color:T.red }}>{q.opts[picked].t}</span></div>}
            <div style={{ fontSize:12, marginLeft:26, marginBottom:4 }}>Correct: <span style={{ color:T.cyan, fontWeight:700 }}>{q.o[q.a]}</span></div>
            <button onClick={() => setExp(e => ({...e,[q.id]:!e[q.id]}))} style={{ marginLeft:26, background:"none", border:"none", color:T.text3, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>{exp[q.id]?"Hide":"Show explanation"}</button>
            {exp[q.id] && <div style={{ marginLeft:26, marginTop:6, fontSize:12, color:T.text2, background:T.surf2, padding:"7px 11px", borderRadius:7, fontStyle:"italic" }}>{q.e}</div>}
          </div>
        );
      })}
    </div>
  );
}
const DEMO_IVQ = [
  "Tell me about yourself and your most impactful project.",
  "Describe the hardest bug you ever debugged — what was your process?",
  "How do you approach picking up a new technology under deadline pressure?",
  "Tell me about a time you conflicted with a teammate and how you resolved it.",
  "Where do you see yourself in 3 years, and why does this role interest you?",
];
const DEMO_FB = [
  "Good intro — try to add a specific metric or outcome next time.",
  "Nice structure. Mention what tools you used for debugging.",
  "Good approach. Quantify how quickly you ramped up.",
  "Well handled. Always close by stating what you personally learned.",
  "Clear direction. Tie it more to the company's specific mission.",
];
const DEMO_RPT = {
  overallScore:7, communication:7, technical:6, confidence:7,
  keyMistakes:["Answers lacked specific metrics and numbers","Technical explanations need Big-O analysis","STAR format not consistently applied"],
  strengths:["Clear communication and structured answers","Engaged with every question","Demonstrated self-awareness"],
  improvements:["Quantify all achievements — use % and numbers","End every technical answer with Big-O analysis","Practise STAR: Situation → Task → Action → Result"],
  verdict:"PLACEHOLDER"
};
// ─── INTERVIEW TAB ────────────────────────────────────────────────────────────
function InterviewTab({ auth }) {
  const [phase, setPhase] = useState("setup");
  const [persona, setPersona] = useState("friendly"); const [bg, setBg] = useState("");
  const [cam, setCam] = useState(null); const [camErr, setCamErr] = useState("");
  const [msgs, setMsgs] = useState([]); const [done, setDone] = useState(false);
  const [answer, setAnswer] = useState(""); const [thinking, setThinking] = useState(false);
  const [micOn, setMicOn] = useState(false); const [report, setReport] = useState(null);
  const [aiTalk, setAiTalk] = useState(false); const [lastQ, setLastQ] = useState("");
  const [cd, setCd] = useState(3); const [qd, setQd] = useState(0); const [ivSecs, setIvSecs] = useState(0);
  const msgsRef=useRef([]); const apiRef=useRef([]); const doneRef=useRef(false);
  const demoModeRef=useRef(false); const demoQIdxRef=useRef(0);
  const camRef=useRef(null); const vLob=useRef(null); const vAct=useRef(null);
  const chatRef=useRef(null); const micRef=useRef(null); const ivTimer=useRef(null);
  const MAX_SECS = 5 * 60;
  useEffect(() => {
    const handler = () => { demoModeRef.current = true; };
    window.addEventListener("demo-hit", handler);
    return () => window.removeEventListener("demo-hit", handler);
  }, []);
  // 1. ADD THIS WATCHDOG EFFECT HERE
  useEffect(() => {
    // Logic: If interview is 'active', not yet 'done', and time hits 120s (2 mins)
    if (phase === "active" && !done && ivSecs >= 120) {
      
      // Stop the microphone if it's recording
      if (typeof stopMic === 'function') stopMic(); 
      
      // Trigger the existing end/report logic
      triggerEnd(); 
      
      // Show a message so the user knows why it stopped
      pushMsg("ai", "⚠️ Interview Session Timed Out: 2 minutes of inactivity detected. Generating your report...", null);
      
      // Optional: Audio alert
      if ('speechSynthesis' in window) {
        const ut = new SpeechSynthesisUtterance("Session timed out due to inactivity.");
        window.speechSynthesis.speak(ut);
      }
    }
  }, [ivSecs, phase, done]); // It re-checks every time the second-counter ticks

  // ... rest of your existing functions (triggerEnd, reset, etc.)
  


  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [msgs]);
  const setVideoRef = el => { vAct.current = el; if (el && camRef.current) el.srcObject = camRef.current; };

  const P = { friendly:{name:"Priya Sharma",title:"Senior HR · Campus",em:"👩"}, strict:{name:"Rahul Kapoor",title:"SDE-3 · FAANG",em:"👨"}, hr:{name:"Neha Gupta",title:"HR Manager · MNC",em:"👩"} };
  const p = P[persona];

  const getSys = () => {
    const ctx = bg ? ` Candidate: ${bg}.` : "";
    const fmt = "\n\nALWAYS respond in EXACTLY this two-line format:\nFEEDBACK: [honest feedback on their answer]\nNEXT: [your next question]\n\nWhen candidate says I don't know: give a hint, ask simpler version.\nAfter 6 questions total: NEXT: END_INTERVIEW";
    if (persona==="strict") return `You are Rahul Kapoor, FAANG SDE-3 interviewer.${ctx} Ask tough DSA, system design, CS fundamentals. Be direct and honest. 6 questions total, varied topics.${fmt}`;
    if (persona==="hr") return `You are Neha Gupta, HR behavioural interviewer.${ctx} Ask STAR-method questions about teamwork, conflict, failure, achievement. 6 questions total.${fmt}`;
    return `You are Priya Sharma, warm campus HR interviewer.${ctx} Ask intro, projects, strengths, goals, situational questions. Be warm but honest. 6 questions total.${fmt}`;
  };
  const parseResp = raw => {
    const text=raw.trim(), upper=text.toUpperCase();
    const fi=upper.indexOf("FEEDBACK:"), ni=upper.indexOf("NEXT:");
    if (fi!==-1&&ni!==-1&&ni>fi) return { fb:text.slice(fi+9,ni).trim(), next:text.slice(ni+5).trim() };
    if (ni!==-1) return { fb:null, next:text.slice(ni+5).trim() };
    return { fb:null, next:text };
  };
  const speak = raw => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    let clean = raw.trim();
    const ni = clean.toUpperCase().indexOf("NEXT:");
    if (ni !== -1) clean = clean.slice(ni+5);
    clean = clean.replace(/END_INTERVIEW/gi,"").split("\n").join(" ").trim().slice(0,420);
    if (!clean) return;
    const ut = new SpeechSynthesisUtterance(clean);
    ut.rate = persona==="strict"?.87:.93; ut.pitch = persona==="strict"?.82:1.05;
    const go = () => {
      const vs = window.speechSynthesis.getVoices();
      const pick = vs.find(v => v.lang.startsWith("en")&&(v.name.includes("Google")||v.name.includes("Samantha")||v.name.includes("Alex"))) || vs.find(v => v.lang.startsWith("en"));
      if (pick) ut.voice = pick;
      setAiTalk(true); ut.onend=ut.onerror=()=>setAiTalk(false); window.speechSynthesis.speak(ut);
    };
    window.speechSynthesis.getVoices().length ? go() : window.speechSynthesis.addEventListener("voiceschanged", go, { once:true });
  };
  const pushMsg = (role, text, fb) => { const m={r:role,t:text,fb:fb||null}; msgsRef.current=[...msgsRef.current,m]; setMsgs([...msgsRef.current]); };
  const isDK = t => { const l=t.toLowerCase().trim(); return l.length<35||["i don't know","i dont know","idk","no idea","not sure","skip","pass","can't answer","no clue"].some(k=>l.includes(k)); };
  const startTimer = () => {
    clearInterval(ivTimer.current); setIvSecs(0);
    ivTimer.current = setInterval(() => setIvSecs(s => {
      const n=s+1;
      if (n>=MAX_SECS&&!doneRef.current) { clearInterval(ivTimer.current); doneRef.current=true; setDone(true); pushMsg("ai","Time is up — 5 minutes reached. Generating your report.",null); speak("Time is up. Generating your report."); genReport(); }
      return n;
    }), 1000);
  };
  const triggerEnd = () => { if (doneRef.current) return; clearInterval(ivTimer.current); doneRef.current=true; setDone(true); pushMsg("ai","That wraps up the interview! Generating your personalised report now.",null); speak("Thank you. Generating your report."); genReport(); };
  const enableCam = () => {
    setCamErr("");
    if (!navigator.mediaDevices?.getUserMedia) { setCamErr("Camera unavailable — open via localhost, not file://."); return; }
    navigator.mediaDevices.getUserMedia({ video:true, audio:true }).then(s => { camRef.current=s; setCam(s); if (vLob.current){vLob.current.srcObject=s;vLob.current.style.display="block";} }).catch(e => {
      if (e.name==="NotAllowedError") setCamErr("Permission denied. Click lock in address bar, allow Camera & Mic, then reload.");
      else if (e.name==="NotReadableError") setCamErr("Camera busy — close Zoom/Teams/Meet and retry.");
      else setCamErr(e.name+": "+e.message);
    });
  };
  const startCountdown = () => { if (!camRef.current){alert("Enable camera first!");return;} setCd(3); setPhase("countdown"); };
  useEffect(() => {
    if (phase!=="countdown") return;
    if (cd===0){setPhase("active");doStart();return;}
    const t=setTimeout(()=>setCd(c=>c-1),1000);
    return ()=>clearTimeout(t);
  }, [cd, phase]);
  const doStart = async () => {
    msgsRef.current=[]; apiRef.current=[]; doneRef.current=false;
    demoModeRef.current=false; demoQIdxRef.current=0;
    setMsgs([]); setQd(0); setDone(false); setAnswer(""); setReport(null); setThinking(true);
    const seed = { role:"user", content:"The interview is starting. Greet me in one sentence then ask your first question.\nFEEDBACK: [greeting]\nNEXT: [first question]" };
    apiRef.current = [seed];
    try {
      const raw = await callAI([seed], getSys(), 500);
      apiRef.current=[...apiRef.current,{role:"assistant",content:raw}];
      if (demoModeRef.current) {
        demoQIdxRef.current=0;
        const q=DEMO_IVQ[0];
        pushMsg("ai",q,null); setQd(1); setLastQ(q); speak(q);
        setThinking(false); startTimer(); return;
      }
      const {next}=parseResp(raw); const q=(next&&next.length>4)?next:raw.trim();
      pushMsg("ai",q,null); setQd(1); setLastQ(q); speak(q);
    } catch {
      demoModeRef.current=true; demoQIdxRef.current=0;
      const q=DEMO_IVQ[0];
      pushMsg("ai",q,null); setQd(1); setLastQ(q); speak(q);
    }
    setThinking(false); startTimer();
  };
  const submit = async () => {
    const a=answer.trim(); if (!a||doneRef.current) return;
    stopMic(); window.speechSynthesis?.cancel();
    pushMsg("user",a,null); setAnswer("");
    const qSoFar=apiRef.current.filter(m=>m.role==="assistant").length;
    apiRef.current=[...apiRef.current,{role:"user",content:a}];
    if (qSoFar>=6){triggerEnd();return;}
    if (isDK(a)&&qSoFar>=3){triggerEnd();return;}

    if (demoModeRef.current) {
      const nextIdx=demoQIdxRef.current+1;
      demoQIdxRef.current=nextIdx;
      if (nextIdx>=DEMO_IVQ.length||qSoFar>=4){triggerEnd();return;}
      const fb=DEMO_FB[nextIdx-1]||"Good effort — keep it up!";
      const q=DEMO_IVQ[nextIdx];
      apiRef.current=[...apiRef.current,{role:"assistant",content:`FEEDBACK: ${fb}\nNEXT: ${q}`}];
      pushMsg("ai",q,fb); setQd(nextIdx+1); setLastQ(q);
      speak(fb+"  "+q); return;
    }

    setThinking(true);
    try {
      const raw=await callAI(apiRef.current,getSys(),700);
      apiRef.current=[...apiRef.current,{role:"assistant",content:raw}];
      const {fb,next}=parseResp(raw);
      const isEnd=(next||"").toUpperCase().includes("END_INTERVIEW")||qSoFar>=5;
      if (isEnd){triggerEnd();}
      else {
        const q=(next&&next.length>5&&!next.toUpperCase().includes("END_INTERVIEW"))?next:raw.trim();
        pushMsg("ai",q,(fb&&fb.length>5)?fb:null); setQd(qSoFar+1); setLastQ(q);
        speak((fb&&fb.length>8&&fb.length<200)?fb+"  "+q:q);
      }
    } catch {
      if (qSoFar>=4){triggerEnd();return;}
      const fb=["Describe a specific project and its biggest technical challenge.","What data structures do you use most, and why?","Tell me about learning something new under pressure.","How would you design a simple URL shortener?","Difference between an array and a linked list?"];
      const fallback=fb[qSoFar%fb.length];
      apiRef.current=[...apiRef.current,{role:"assistant",content:"FEEDBACK: Good effort.\nNEXT: "+fallback}];
      pushMsg("ai",fallback,null); setQd(qSoFar+1); setLastQ(fallback); speak(fallback);
    }
    setThinking(false);
  };
  const genReport = async () => {
    setThinking(true);
    const history=msgsRef.current; const pairs=[];
    for (let i=0;i<history.length;i++) { if (history[i].r==="ai"&&history[i+1]?.r==="user") pairs.push({q:history[i].t,a:history[i+1].t}); }

    if (demoModeRef.current) {
      setReport({ ...DEMO_RPT, verdict:`You answered ${pairs.length} question${pairs.length!==1?"s":""} in this demo session. Communication was clear and structured. To stand out in real drives, add specific metrics to every answer and deepen your technical explanations with Big-O analysis.` });
      setThinking(false); return;
    }

    if (pairs.length===0){setReport(defRpt(pairs));setThinking(false);return;}
    const transcript=pairs.map((p,i)=>`Question ${i+1}: ${p.q}\nCandidate: ${p.a}`).join("\n\n");
    const prompt=`Analyse this mock interview transcript. Based ONLY on what was actually said, give specific feedback. Return ONLY valid JSON:\n{"overallScore":6,"communication":6,"technical":5,"confidence":6,"keyMistakes":["specific weakness"],"strengths":["specific strength"],"improvements":["concrete tip"],"verdict":"3 sentences referencing actual answers"}\n\n${transcript}`;
    try { const raw=await callAI([{role:"user",content:prompt}],null,1200); const p=parseJSON(raw); setReport(p&&p.overallScore?p:defRpt(pairs)); }
    catch { setReport(defRpt(pairs)); }
    setThinking(false);
  };
  const defRpt = pairs => ({ overallScore:6, communication:6, technical:5, confidence:6, keyMistakes:["Answers too brief — add more detail","Did not mention time/space complexity","Missing concrete examples"], strengths:["Attempted all questions","Willingness to engage"], improvements:["State what you DO know when unsure","End every technical answer with complexity analysis","Use STAR: Situation, Task, Action, Result"], verdict:`Candidate answered ${pairs.length} questions. Communication was adequate but technical depth needs improvement. Focus on adding specifics, metrics, and algorithm analysis to every answer.` });
  const endIV = () => { if (msgsRef.current.filter(m=>m.r==="user").length<1){alert("Answer at least one question first.");return;} clearInterval(ivTimer.current); triggerEnd(); };
  const startMic = () => {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR){alert("Speech recognition needs Chrome.");return;}
    if (micRef.current){try{micRef.current.stop();}catch{}} window.speechSynthesis?.cancel();
    const r=new SR(); r.continuous=true; r.interimResults=true; r.lang="en-IN";
    r.onstart=()=>setMicOn(true); r.onresult=e=>setAnswer(Array.from(e.results).map(x=>x[0].transcript).join(""));
    r.onend=()=>setMicOn(false); r.onerror=e=>{setMicOn(false);if(e.error!=="aborted"&&e.error!=="no-speech")alert("Mic error: "+e.error);}; r.start(); micRef.current=r;
  };
  const stopMic = () => { if (micRef.current){try{micRef.current.stop();}catch{}} micRef.current=null; setMicOn(false); };
  const reset = () => { msgsRef.current=[]; apiRef.current=[]; doneRef.current=false; demoModeRef.current=false; demoQIdxRef.current=0; clearInterval(ivTimer.current); setPhase("setup"); setMsgs([]); setQd(0); setIvSecs(0); setDone(false); setAnswer(""); setReport(null); setAiTalk(false); stopMic(); window.speechSynthesis?.cancel(); };

  if (phase==="setup") return (
    <FreeGate auth={auth} feat="Interview Simulator">
      <div style={{ padding:28 }}>
        <PgTitle icon="🎥" title="Live AI Mock Interview" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, maxWidth:840 }}>
          <Card title="Camera Setup (Required)" ac="cyan">
            <div style={{ background:"#000", borderRadius:12, aspectRatio:"4/3", position:"relative", display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${cam?T.cyan:T.line2}`, marginBottom:14, overflow:"hidden" }}>
              <video ref={vLob} autoPlay playsInline muted style={{ width:"100%", height:"100%", objectFit:"cover", display:"none" }} />
              {!cam && <div style={{ textAlign:"center" }}><div style={{ fontSize:40 }}>📷</div><div style={{ fontSize:13, color:T.text3, marginTop:8 }}>Camera off</div></div>}
              {cam && <div style={{ position:"absolute", top:10, left:10, display:"flex", alignItems:"center", gap:6, background:"rgba(0,0,0,.75)", borderRadius:8, padding:"4px 10px", fontSize:12 }}><div style={{ width:7, height:7, borderRadius:"50%", background:T.green }}/>Live</div>}
            </div>
            {camErr && <div style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.3)", borderRadius:9, padding:12, fontSize:12, color:"#FCA5A5", marginBottom:12, lineHeight:1.8 }}>{camErr}</div>}
            <Btn ch={cam?"Camera Ready":"Enable Camera & Mic"} v={cam?"outline":"primary"} full disabled={!!cam} onClick={enableCam} />
          </Card>
          <Card title="Interview Setup" ac="violet">
            <Fld label="INTERVIEWER PERSONA">
              <select value={persona} onChange={e => setPersona(e.target.value)} style={inpStyle}>
                <option value="friendly">Friendly Campus HR</option>
                <option value="strict">Strict FAANG Tech Lead</option>
                <option value="hr">HR Behavioural Round</option>
              </select>
            </Fld>
            <Fld label="YOUR BACKGROUND (optional)"><input value={bg} onChange={e => setBg(e.target.value)} placeholder="e.g. B.Tech CSE 2025, SDE at Amazon" style={inpStyle} /></Fld>
            <div style={{ background:T.surf2, borderRadius:11, padding:"13px 15px", display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,#1e40af,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{p.em}</div>
              <div><div style={{ fontSize:14, fontWeight:700 }}>{p.name}</div><div style={{ fontSize:12, color:T.text3 }}>{p.title}</div><div style={{ fontSize:11, color:T.text3, marginTop:2 }}>6 questions · Dynamic follow-ups · Full report</div></div>
            </div>
            <Btn ch={!cam?"Enable Camera First":"Start Interview — 3·2·1"} v={!cam?"outline":"primary"} full disabled={!cam} onClick={startCountdown} s={{ padding:"13px 0", opacity:!cam?0.4:1 }} />
          </Card>
        </div>
      </div>
    </FreeGate>
  );

  if (phase==="countdown") return (
    <div style={{ position:"fixed", inset:0, background:"rgba(5,12,26,.96)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", zIndex:500 }}>
      <video ref={setVideoRef} autoPlay playsInline muted style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.1 }} />
      <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.cyan, letterSpacing:4, textTransform:"uppercase", marginBottom:24 }}>Get Ready...</div>
        <div key={cd} style={{ fontSize:160, fontWeight:900, lineHeight:1, fontFamily:"monospace", color:cd===1?T.red:cd===2?T.amber:T.green, animation:"cdAnim 1s ease-out" }}>{cd===0?"GO!":String(cd)}</div>
        <div style={{ fontSize:15, color:T.text2, marginTop:24 }}>{p.em} {p.name} is waiting...</div>
      </div>
    </div>
  );

  const remSecs=MAX_SECS-ivSecs, tm=Math.floor(remSecs/60), ts=String(remSecs%60).padStart(2,"0"), tc=remSecs<60?T.red:remSecs<120?T.amber:T.text3;
  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:T.surf, border:`1px solid ${T.line}`, borderRadius:13, padding:"11px 18px", marginBottom:16, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ width:9, height:9, borderRadius:"50%", background:T.red }}/>
          <span style={{ fontSize:14, fontWeight:700 }}>Live Interview</span>
          <span style={{ fontSize:12, color:T.cyan, fontWeight:800, background:"rgba(0,229,204,.1)", borderRadius:7, padding:"3px 10px" }}>Q{qd}/6</span>
          <span style={{ fontSize:11, fontWeight:700, fontFamily:"monospace", color:tc }}>{tm}:{ts}</span>
          {aiTalk && <span style={{ fontSize:11, color:T.violet }}>AI Speaking...</span>}
          {thinking && <span style={{ fontSize:11, color:T.cyan }}>Processing...</span>}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn ch="Replay" v="outline" onClick={() => lastQ&&speak(lastQ)} s={{ fontSize:12, padding:"6px 12px" }} />
          {!done && <Btn ch="End Interview" v="red" onClick={endIV} />}
          <Btn ch="New" v="outline" onClick={reset} s={{ fontSize:12, padding:"6px 12px" }} />
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <div style={{ background:"#04090F", borderRadius:15, border:`2px solid ${aiTalk?T.cyan:T.line}`, aspectRatio:"16/9", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10, position:"relative", transition:"border-color .3s" }}>
          <div style={{ fontSize:54 }}>{p.em}</div>
          <div style={{ fontSize:14, fontWeight:700 }}>{p.name}</div>
          {aiTalk && <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:22 }}>{[4,11,18,11,4].map((h,i) => <div key={i} style={{ width:3, borderRadius:2, background:T.cyan, height:h, animation:"wave .55s infinite alternate", animationDelay:`${i*.1}s` }}/>)}</div>}
          {aiTalk && <div style={{ position:"absolute", top:10, right:10, background:T.cyan, color:T.bg, borderRadius:14, padding:"3px 10px", fontSize:11, fontWeight:800 }}>Speaking</div>}
          <div style={{ position:"absolute", bottom:10, left:10, background:"rgba(0,0,0,.8)", borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:700 }}>{p.name}</div>
        </div>
        <div style={{ background:"#000", borderRadius:15, border:`2px solid ${T.line}`, aspectRatio:"16/9", overflow:"hidden", position:"relative" }}>
          <video ref={setVideoRef} autoPlay playsInline muted style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          {micOn && <div style={{ position:"absolute", top:10, right:10, background:T.violet, color:"#fff", borderRadius:14, padding:"3px 10px", fontSize:11, fontWeight:800 }}>Recording</div>}
          <div style={{ position:"absolute", top:10, left:10, display:"flex", alignItems:"center", gap:5, background:"rgba(0,0,0,.75)", borderRadius:7, padding:"3px 9px", fontSize:11 }}><div style={{ width:7, height:7, borderRadius:"50%", background:T.red }}/>REC</div>
          <div style={{ position:"absolute", bottom:10, left:10, background:"rgba(0,0,0,.8)", borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:700 }}>You</div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:done?"1fr":"1fr 1fr", gap:14 }}>
        {!done && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:T.text2, marginBottom:8 }}>Your Answer</div>
            <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Click mic to speak, or type here..." rows={5} disabled={thinking}
              style={{ width:"100%", background:T.surf2, border:`1px solid ${T.line2}`, borderRadius:11, padding:13, fontSize:13, color:T.text, resize:"none", outline:"none", lineHeight:1.65, boxSizing:"border-box", fontFamily:"inherit" }} />
            <div style={{ display:"flex", gap:9, marginTop:9 }}>
              <button onClick={() => micOn?stopMic():startMic()} style={{ flex:1, padding:11, borderRadius:10, cursor:"pointer", border:"1px solid", background:micOn?"rgba(239,68,68,.15)":"rgba(168,85,247,.12)", borderColor:micOn?"rgba(239,68,68,.4)":"rgba(168,85,247,.4)", color:micOn?T.red:T.violet, fontSize:13, fontWeight:700, fontFamily:"inherit" }}>{micOn?"Stop Recording":"Speak Answer"}</button>
              <button onClick={submit} disabled={!answer.trim()||thinking} style={{ flex:1, padding:11, borderRadius:10, background:grad, color:"#fff", fontSize:13, fontWeight:700, border:"none", cursor:!answer.trim()||thinking?"not-allowed":"pointer", opacity:!answer.trim()||thinking?0.45:1, fontFamily:"inherit" }}>{thinking?"Processing...":"Send Answer"}</button>
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:T.text2, marginBottom:8 }}>Conversation</div>
          <div ref={chatRef} style={{ background:T.surf, border:`1px solid ${T.line}`, borderRadius:12, padding:12, height:done?130:215, overflowY:"auto", display:"flex", flexDirection:"column", gap:9 }}>
            {msgs.length===0 && <p style={{ fontSize:12, color:T.text3, fontStyle:"italic", margin:0 }}>Conversation appears here...</p>}
            {msgs.map((m,i) => (
              <div key={i} style={{ borderRadius:9, padding:"9px 12px", fontSize:12, lineHeight:1.6, background:m.r==="ai"?"rgba(168,85,247,.08)":T.surf2, border:`1px solid ${m.r==="ai"?"rgba(168,85,247,.2)":T.line2}` }}>
                <div style={{ fontSize:10, fontWeight:800, marginBottom:5, color:m.r==="ai"?T.violet:T.cyan }}>{m.r==="ai"?"Interviewer":"You"}</div>
                {m.fb && <div style={{ fontSize:11, color:T.amber, fontStyle:"italic", marginBottom:5, padding:"4px 9px", background:"rgba(245,158,11,.08)", borderRadius:6, borderLeft:`2px solid ${T.amber}` }}>{m.fb}</div>}
                <div style={{ color:T.text2 }}>{m.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {thinking&&done&&!report && <div style={{ textAlign:"center", color:T.cyan, padding:20, fontSize:13 }}>Generating your performance report...</div>}
      {report && (
        <div style={{ background:T.surf, border:"1px solid rgba(0,229,204,.3)", borderRadius:18, padding:24, marginTop:16 }}>
          <div style={{ fontSize:17, fontWeight:800, background:grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:18 }}>Performance Report</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
            {[["Overall",report.overallScore],["Communication",report.communication],["Technical",report.technical],["Confidence",report.confidence]].map(([l,v]) => (
              <div key={l} style={{ background:T.surf2, borderRadius:11, padding:"13px 14px", textAlign:"center" }}>
                <div style={{ fontSize:24, fontWeight:900, color:v>=8?T.green:v>=6?T.cyan:T.red }}>{v}/10</div>
                <div style={{ fontSize:11, color:T.text3, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:18, marginBottom:18 }}>
            {[["Mistakes",T.red,report.keyMistakes],["Strengths",T.green,report.strengths],["Improvements",T.amber,report.improvements]].map(([title,color,items]) => (
              <div key={title}>
                <div style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", color, marginBottom:9 }}>{title}</div>
                {(items||[]).map((item,i) => <div key={i} style={{ fontSize:12, color:T.text2, marginBottom:7, paddingLeft:12, borderLeft:`2px solid ${color}`, lineHeight:1.55 }}>{item}</div>)}
              </div>
            ))}
          </div>
          <div style={{ background:T.surf2, borderRadius:11, padding:14, fontSize:13, color:T.text2, fontStyle:"italic", borderLeft:`3px solid ${T.cyan}`, marginBottom:16 }}>{report.verdict}</div>
          <Btn ch="Start New Interview" v="primary" onClick={reset} s={{ padding:"11px 24px" }} />
        </div>
      )}
    </div>
  );
}

// ─── SYSTEM DESIGN TAB ────────────────────────────────────────────────────────
function SDTab({ auth }) {
  const [nodes, setNodes] = useState([]); const [conns, setConns] = useState([]);
  const [linking, setLinking] = useState(null); const [drag, setDrag] = useState(null); const [off, setOff] = useState({x:0,y:0});
  const [crit, setCrit] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const cvRef = useRef(null);
  const COMPS = [{id:"client",l:"Client",i:"💻"},{id:"lb",l:"Load Balancer",i:"⚖"},{id:"api",l:"API Gateway",i:"🔀"},{id:"cache",l:"Cache",i:"⚡"},{id:"db",l:"Database",i:"🗄"},{id:"q",l:"Queue",i:"📬"},{id:"cdn",l:"CDN",i:"🌐"},{id:"auth",l:"Auth",i:"🔐"},{id:"worker",l:"Worker",i:"⚙"},{id:"store",l:"Storage",i:"🪣"}];
  const add = c => setNodes(n => [...n, {...c, id:Date.now(), x:60+Math.random()*280, y:40+Math.random()*270}]);
  const md = (e,id) => { e.stopPropagation(); const r=cvRef.current.getBoundingClientRect(); const nd=nodes.find(n=>n.id===id); setDrag(id); setOff({x:e.clientX-r.left-nd.x, y:e.clientY-r.top-nd.y}); };
  const mm = e => { if (!drag||!cvRef.current) return; const r=cvRef.current.getBoundingClientRect(); setNodes(ns=>ns.map(n=>n.id===drag?{...n,x:Math.max(0,e.clientX-r.left-off.x),y:Math.max(0,e.clientY-r.top-off.y)}:n)); };
  const clickNode = id => { if (!linking){setLinking(id);return;} if (linking!==id) setConns(c=>[...c,{from:linking,to:id}]); setLinking(null); };
  const critique = async () => {
    if (!nodes.length){alert("Add components first!");return;}
    setLoading(true); setErr(""); setCrit(null);
    const arch=nodes.map(n=>n.l).join(", ");
    const cs=conns.map(c=>{const f=nodes.find(n=>n.id===c.from),t=nodes.find(n=>n.id===c.to);return `${f.l}->${t.l}`;}).join(", ");
    const prompt=`Critique system design. Components: ${arch}. Connections: ${cs||"none"}. Return ONLY valid JSON: {"score":7,"strengths":["s"],"issues":["i"],"suggestions":["sug"],"scalability":"Medium","verdict":"2 sentences"}`;
    try { const raw=await callAI([{role:"user",content:prompt}],null,600); const p=parseJSON(raw); if(p)setCrit(p); else throw new Error("Parse failed"); }
    catch(e) {
      const msg = e.message === "SERVICE_DOWN" ? "AI service offline — showing cached result" : e.message;
      setErr(msg);
      setCrit({score:6,strengths:["Good component selection","Shows distributed thinking"],issues:["No caching","Single DB bottleneck"],suggestions:["Add Redis cache","Add DB read replicas"],scalability:"Medium",verdict:"Solid start. Add caching and redundancy."});
    }
    setLoading(false);
  };
  return (
    <FreeGate auth={auth} feat="System Design Whiteboard">
      <div style={{ padding:28 }}>
        <PgTitle icon="🗺" title="System Design Whiteboard" />
        {linking && <div style={{ fontSize:12, color:T.cyan, marginBottom:10 }}>Click another node to connect — Escape to cancel</div>}
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, background:T.surf, border:`1px solid ${T.line}`, borderRadius:13, padding:11, marginBottom:14 }}>
          {COMPS.map(c => <button key={c.id} onClick={() => add(c)} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, background:T.surf2, border:`1px solid ${T.line2}`, color:T.text2, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.cyan;e.currentTarget.style.color=T.cyan;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.line2;e.currentTarget.style.color=T.text2;}}>{c.i} {c.l}</button>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
          <div>
            <div ref={cvRef} tabIndex={0} onMouseMove={mm} onMouseUp={() => setDrag(null)} onKeyDown={e => e.key==="Escape"&&setLinking(null)}
              style={{ position:"relative", height:380, background:T.bg, borderRadius:16, border:`1px solid ${T.line}`, overflow:"hidden", cursor:drag?"grabbing":"default" }}>
              <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
                <defs><marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={T.cyan}/></marker></defs>
                {conns.map((c,i) => { const f=nodes.find(n=>n.id===c.from),t=nodes.find(n=>n.id===c.to); if(!f||!t)return null; return <g key={i} style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();setConns(cs=>cs.filter((_,j)=>j!==i));}}><line x1={f.x+32} y1={f.y+32} x2={t.x+32} y2={t.y+32} stroke={T.cyan} style={{strokeWidth:2,strokeDasharray:"7,3"}} markerEnd="url(#arr)"/><line x1={f.x+32} y1={f.y+32} x2={t.x+32} y2={t.y+32} stroke="transparent" style={{strokeWidth:20}}/></g>; })}
                
              </svg>
              {nodes.map(nd => (
                <div key={nd.id} onMouseDown={e => md(e,nd.id)} onClick={() => clickNode(nd.id)} style={{ position:"absolute", left:nd.x, top:nd.y, cursor:drag===nd.id?"grabbing":"grab", userSelect:"none", zIndex:5 }}>
                  <div style={{ width:66, height:66, borderRadius:13, background:T.surf2, border:`1px solid ${linking===nd.id?T.cyan:T.line2}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, boxShadow:linking===nd.id?`0 0 0 3px rgba(0,229,204,.4)`:"none" }}>
                    <span style={{ fontSize:22 }}>{nd.i}</span><span style={{ fontSize:9, color:T.text3 }}>{nd.l}</span>
                  </div>
                </div>
              ))}
              {nodes.length===0 && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6, color:T.surf3, fontSize:14, textAlign:"center", pointerEvents:"none" }}>
                <div style={{ fontSize:30 }}>🗺</div>
                <div>Add components above to start designing</div>
                <div style={{ fontSize:12 }}>Click two nodes to draw a connection</div>
              </div>}
            </div>
            <div style={{ display:"flex", gap:9, marginTop:12 }}>
              <Btn ch={loading?"Analysing...":"Get AI Architecture Critique"} v="primary" disabled={!nodes.length||loading} onClick={critique} />
              <Btn ch="Clear" v="outline" onClick={() => {setNodes([]);setConns([]);setCrit(null);setErr("");}} />
            </div>
            {err && <div style={{ marginTop:8, fontSize:12, color:T.red }}>{err}</div>}
          </div>
          <Card title="AI Architecture Critique" ac="violet">
            {!crit&&!loading && <p style={{ fontSize:13, color:T.text3, fontStyle:"italic" }}>Build your architecture then click Get AI Critique.</p>}
            {loading && <div style={{ textAlign:"center", color:T.cyan, fontSize:13 }}>Analysing...</div>}
            {crit && (
              <div>
                <div style={{ textAlign:"center", fontSize:40, fontWeight:900, marginBottom:14, color:crit.score>=8?T.green:crit.score>=6?T.cyan:T.red }}>{crit.score}/10</div>
                {[["Strengths",T.green,crit.strengths],["Issues",T.red,crit.issues],["Suggestions",T.amber,crit.suggestions]].map(([title,color,items]) => (
                  <div key={title} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", color, marginBottom:6 }}>{title}</div>
                    {(items||[]).map((s,i) => <p key={i} style={{ fontSize:12, color:T.text2, marginBottom:4 }}>• {s}</p>)}
                  </div>
                ))}
                <div style={{ fontSize:11, color:T.text2, borderTop:`1px solid ${T.line}`, paddingTop:8 }}>Scalability: <strong style={{ color:T.cyan }}>{crit.scalability}</strong></div>
                {crit.verdict && <div style={{ fontSize:12, color:T.text2, fontStyle:"italic", marginTop:8, background:T.surf2, borderRadius:9, padding:11 }}>{crit.verdict}</div>}
              </div>
            )}
          </Card>
        </div>
      </div>
    </FreeGate>
  );
}

// ──practice tab
function PracticeTab({ auth, showPrem }) {
  const [sec, setSec] = useState("dsa");

  if (!auth.isPro()) return (
    <div style={{ padding:28 }}>
      <PgTitle icon="📋" title="Practice Sheet" />
      <div style={{ background:T.surf, border:"1px solid rgba(245,158,11,.3)", borderRadius:20, padding:"40px 32px", textAlign:"center", maxWidth:500, margin:"0 auto" }}>
        <div style={{ fontSize:52, marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:20, fontWeight:800, color:T.amber, marginBottom:10 }}>Pro Feature</div>
        <p style={{ fontSize:14, color:T.text2, lineHeight:1.8, marginBottom:24 }}>Practice Sheets with DSA cheat sheets, interview patterns, aptitude formulae, and the HR guide are exclusively for Pro members.</p>
        <Btn ch="Upgrade to Pro — Unlock Now" v="gold" full onClick={showPrem} s={{ padding:"14px 0", fontSize:15 }} />
      </div>
    </div>
  );

  const SECTIONS = {
    dsa: {
      label:"DSA Cheat Sheet", icon:"💻", items:[
        { title:"Arrays & Strings", content:"Two Pointers: O(n) | Sliding Window: O(n) | Prefix Sum: O(n)\nKey: sorted array → two pointers, substring → sliding window" },
        { title:"Linked List", content:"Fast/Slow pointer for cycle detection\nReverse: prev=null, curr=head, while curr: next=curr.next, curr.next=prev, prev=curr, curr=next" },
        { title:"Stack & Queue", content:"Monotonic Stack: next greater element, histogram area\nQueue: BFS level order, sliding window max" },
        { title:"Trees & BST", content:"Inorder BST = sorted array\nHeight: max(left,right)+1\nDFS: preorder/inorder/postorder | BFS: level order queue" },
        { title:"Dynamic Programming", content:"1D DP: Fibonacci, Climbing Stairs, House Robber\n2D DP: Grid paths, Edit Distance, LCS\nPattern: define state → recurrence → base case" },
        { title:"Graphs", content:"BFS: shortest path (unweighted) | DFS: connected components\nDijkstra: weighted shortest path O((V+E)logV)\nUnion-Find: cycle detection, MST" },
        { title:"Sorting", content:"Quick: O(nlogn) avg | Merge: O(nlogn) stable\nHeap: O(nlogn) | Counting: O(n+k)\nInterview tip: always state time+space complexity" },
        { title:"Binary Search", content:"Template: lo=0,hi=n-1, while lo<=hi, mid=(lo+hi)//2\nLeft boundary: hi=mid-1 when arr[mid]==target\nRight boundary: lo=mid+1 when arr[mid]==target" },
      ]
    },
    patterns: {
      label:"Interview Patterns", icon:"🎯", items:[
        { title:"STAR Method (HR)", content:"Situation: Set the scene briefly\nTask: What was your responsibility\nAction: What YOU specifically did\nResult: Quantify the outcome (%, time saved, users impacted)" },
        { title:"Tell Me About Yourself", content:"Formula: Present → Past → Future\n'I am currently [role/year]. Previously I [achievement]. I am looking to [goal].'\nKeep under 2 minutes." },
        { title:"System Design Framework", content:"1. Clarify requirements (5 min)\n2. Estimate scale (DAU, QPS, storage)\n3. High-level design\n4. Deep dive components\n5. Identify bottlenecks & tradeoffs" },
        { title:"Coding Interview Flow", content:"1. Repeat problem in own words\n2. Ask clarifying questions\n3. State brute force first\n4. Optimise with interviewer\n5. Code clean solution\n6. Test with examples + edge cases" },
        { title:"Weakness Answer Pattern", content:"Choose a REAL weakness → Show self-awareness → Show improvement steps → Show result\nNever: 'I work too hard' or 'I am a perfectionist'" },
        { title:"Salary Negotiation", content:"Never give first number. Say: 'I am flexible, what is the budgeted range?'\nCounter: 'Based on my research and skills, I was expecting X. Is there flexibility?'\nAlways negotiate — worst they say is no." },
      ]
    },
    aptitude: {
      label:"Aptitude Formulae", icon:"🧮", items:[
        { title:"Time & Work", content:"Work = Rate × Time\nIf A does in 'a' days, B in 'b' days: Together = ab/(a+b) days\nPipe fill/empty: Net rate = sum of fill rates - empty rates" },
        { title:"Speed, Distance, Time", content:"D = S × T\nAverage speed = 2S1S2/(S1+S2) for equal distance\nRelative speed: same dir = S1-S2, opposite = S1+S2" },
        { title:"Profit & Loss", content:"Profit% = (Profit/CP)×100\nSP = CP×(1+P/100)\nDiscount% = (Discount/MP)×100\nSuccessive discount a%,b%: effective = a+b-ab/100" },
        { title:"Simple & Compound Interest", content:"SI = PRT/100\nCI = P(1+R/100)^T - P\nCI-SI for 2 years = P(R/100)²\nDoubling time ≈ 72/R (Rule of 72)" },
        { title:"Percentages", content:"X% of Y = Y% of X\n% increase = (New-Old)/Old × 100\nIf increased by x% then decreased by x%: net change = -x²/100 %" },
        { title:"Ratio & Proportion", content:"a:b = c:d → ad = bc (cross multiply)\nCompound ratio: (a:b)×(c:d) = ac:bd\nMixture: C1V1 + C2V2 = C(V1+V2)" },
        { title:"Permutation & Combination", content:"nPr = n!/(n-r)!\nnCr = n!/r!(n-r)!\nCircular: (n-1)!\nWith repetition: n^r" },
        { title:"Number Series Tips", content:"Check differences (AP), ratios (GP)\nSquares: 1,4,9,16,25,36,49,64,81,100\nCubes: 1,8,27,64,125,216\nPrimes: 2,3,5,7,11,13,17,19,23,29" },
      ]
    },
    hr: {
      label:"HR Guide", icon:"🤝", items:[
        { title:"Top 10 HR Questions", content:"1. Tell me about yourself\n2. Why this company?\n3. Where do you see yourself in 5 years?\n4. Biggest weakness?\n5. Greatest achievement?\n6. Why should we hire you?\n7. Describe a conflict situation\n8. How do you handle pressure?\n9. What motivates you?\n10. Do you have any questions for us?" },
        { title:"Questions to Ask Interviewer", content:"'What does success look like in this role in 90 days?'\n'What are the biggest challenges the team faces?'\n'How would you describe the team culture?'\n'What growth opportunities exist?'\nNever ask: salary first, holidays, or 'what does your company do?'" },
        { title:"Body Language Tips", content:"✓ Firm handshake (if in person)\n✓ Maintain eye contact 60-70%\n✓ Sit upright, lean slightly forward\n✓ Nod when interviewer speaks\n✗ No crossing arms\n✗ No fidgeting or checking phone" },
        { title:"Virtual Interview Tips", content:"✓ Test camera/mic 15 min before\n✓ Eye level camera (books under laptop)\n✓ Clean background or blur it\n✓ Good lighting (face the window)\n✓ Close all notifications\n✓ Have water nearby" },
        { title:"Day Before Checklist", content:"□ Research company news (last 3 months)\n□ Re-read job description\n□ Prepare 3 STAR stories\n□ Print/save resume copy\n□ Plan route/test video link\n□ Prepare smart questions\n□ Iron formal clothes\n□ Sleep by 11pm" },
        { title:"Dress Code by Company", content:"FAANG/Tech: Smart casual (clean shirt, no tie needed)\nTCS/Infosys/Wipro: Formal (shirt+trousers, formal shoes)\nStartup: Business casual or smart casual\nBanking/Finance: Full formal always\nRule: When in doubt, dress one level above." },
      ]
    }
  };

  const cur = SECTIONS[sec];

  return (
    <div style={{ padding:28 }}>
      <PgTitle icon="📋" title="Practice Sheet" sub="Your complete placement preparation reference — DSA, patterns, formulae & HR guide" />
      
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {Object.entries(SECTIONS).map(([k,v]) => (
          <button key={k} onClick={() => setSec(k)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:sec===k?"rgba(0,229,204,.12)":T.surf, border:`1px solid ${sec===k?T.cyan:T.line}`, color:sec===k?T.cyan:T.text2, transition:"all .15s" }}>
            <span>{v.icon}</span>{v.label}
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:14 }}>
        {cur.items.map((item, i) => (
          <Card key={i} s={{ borderLeft:`3px solid ${T.cyan}` }}>
            <div style={{ fontSize:13, fontWeight:800, color:T.cyan, marginBottom:10 }}>{item.title}</div>
            <pre style={{ fontSize:12, color:T.text2, lineHeight:1.8, margin:0, whiteSpace:"pre-wrap", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>{item.content}</pre>
          </Card>
        ))}
      </div>

      <div style={{ marginTop:20, background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.2)", borderRadius:14, padding:"14px 18px", fontSize:12, color:T.amber }}>
        ⭐ Pro Tip: Print this sheet or bookmark it. Review DSA patterns daily for 2 weeks before your placement drives.
      </div>
    </div>
  );
}


