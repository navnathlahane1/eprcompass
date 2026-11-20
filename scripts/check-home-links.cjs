const fs=require('fs');
const links=JSON.parse(fs.readFileSync('../previews/home-link-inventory.json','utf8'));
const paths=[...new Set(links.map(l=>l.href).filter(h=>h.startsWith('/')&&!h.startsWith('//')))];
let cursor=0;const results=[];
async function worker(){while(cursor<paths.length){const path=paths[cursor++];try{const r=await fetch('http://127.0.0.1:3000'+path,{signal:AbortSignal.timeout(90000)}); const html=await r.text(); const title=html.match(/<title>(.*?)<\/title>/)?.[1]||'';const row={path,status:r.status,url:r.url,title,oldBrand:/eprbox/i.test(html),errorPage:/Application error:|Internal Server Error|This page could not be found/.test(html)};results.push(row);console.log(JSON.stringify(row));}catch(e){results.push({path,error:e.message});console.log(JSON.stringify({path,error:e.message}));}fs.writeFileSync('../previews/home-link-results.json',JSON.stringify(results,null,2));}}
Promise.all([worker(),worker(),worker()]).then(()=>console.log('COMPLETE '+results.length));
