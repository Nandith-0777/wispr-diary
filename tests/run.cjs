const {spawnSync}=require('node:child_process');
const path=require('node:path');
const suites=['workspace','accounts','book-tutorial','audio-and-turn','pagination','deletion-routing','natural-voice','embedded-wispr','hosting'];
for(const suite of suites){
  const result=spawnSync(process.execPath,[path.join(__dirname,`${suite}.cjs`)],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}
console.log(`Passed ${suites.length} isolated app suites.`);
