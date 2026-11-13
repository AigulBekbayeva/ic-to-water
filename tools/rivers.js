const fs=require('fs');
const d=JSON.parse(fs.readFileSync('raw/ne_10m_rivers_lake_centerlines.geojson'));
// basin id -> [names], bbox [w,s,e,n]
const B={
 indus:[['Indus','Sutlej','Chenab','Jhelum'],[66,23,82,37]],
 aral:[['Amu  Darya','Syr  Darya','Naryn','Panj'],[55,34,79,47]],
 tarim:[['Tarim','Aksu','Yarkant'],[73,35,90,43]],
 brahmaputra:[['Brahmaputra','Dihang'],[80,22,98,32]],
 ganges:[['Ganges','Yamuna'],[73,21,91,32]],
 balkhash:[['Ili','Ile'],[73,42,86,48]],
 salween:[['Salween'],[90,15,100,34]],
 santa:[['Santa'],[-80,-11,-76,-7]],
 rhone:[['Rhône','Rhne'],[3,43,9,47.5]],
 rhine:[['Rhine','Rhein'],[3,46,12,53]],
 po:[['Po'],[6,44,13,46.5]],
 kuban:[['Kuban'],[36,43,43,46.5]],
 fraser:[['Fraser'],[-127,48,-117,55]],
 skeena:[['Skeena'],[-131,53,-125,57]],
 columbia:[['Columbia'],[-125,44,-114,53]],
 copper:[['Copper'],[-148,60,-141,64]],
 susitna:[['Susitna'],[-153,60,-146,64]],
 colorado_ar:[['Colorado'],[-72,-41,-61,-34]],
 santacruz:[['Santa Cruz'],[-74,-52,-67,-49]],
};
const out=[]; const found={};
for(const f of d.features){
  const n=f.properties.name_en||f.properties.name||''; if(!f.geometry) continue;
  const cs=f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates;
  let sx=0,sy=0,k=0; for(const l of cs) for(const c of l){sx+=c[0];sy+=c[1];k++}
  const x=sx/k,y=sy/k;
  for(const [id,[names,bb]] of Object.entries(B)){
    if(names.includes(n) && x>=bb[0]&&x<=bb[2]&&y>=bb[1]&&y<=bb[3]){
      out.push({type:'Feature',properties:{b:id,name:n.replace(/\s+/g,' ')},geometry:f.geometry}); found[id]=(found[id]||0)+1;
    }
  }
}
console.log(found, Object.keys(B).filter(k=>!found[k]));
fs.writeFileSync('raw/rivers_glacier_full.geojson',JSON.stringify({type:'FeatureCollection',features:out}));
