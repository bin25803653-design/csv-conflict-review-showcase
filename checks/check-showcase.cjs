/* Checks this fixed public showcase. No generic CSV processing implementation. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const original=JSON.parse(fs.readFileSync(path.join(root,'outputs/original-example.json'),'utf8'));
const summary=JSON.parse(fs.readFileSync(path.join(root,'outputs/summary-example.json'),'utf8'));
assert.deepEqual(summary.counts,{input:7,kept:3,duplicate:1,review:3});
assert.equal(original.entries.length,7);
for(const [key,status] of [['kept','kept'],['duplicate','duplicate']])assert.equal(original.entries.filter(e=>e.status===status).length,summary.counts[key]);
assert.equal(original.entries.filter(e=>e.status.startsWith('review_')).length,summary.counts.review);
assert.equal(summary.reconciled,true);
assert.equal(summary.counts.input,summary.counts.kept+summary.counts.duplicate+summary.counts.review);
const demo=fs.readFileSync(path.join(root,'demo.html'),'utf8');
const embedded=JSON.parse(demo.match(/<script id="fixed-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(embedded,original);
for(const script of demo.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g))if(!script[0].includes('application/json'))new vm.Script(script[1]);
assert(!/<input\b|fetch\s*\(|XMLHttpRequest|WebSocket|\.innerHTML\s*=|CSVReviewCore|TextDecoder|FileReader/.test(demo));
assert(demo.includes("connect-src 'none'"));
const files=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name);if(entry.isDirectory())walk(absolute);else files.push(absolute);}}walk(root);
assert(!files.some(file=>/\.zip$|csv-review\.html$|(?:^|[\\/])\.env(?:\.|$)/i.test(file)));
for(const file of files){
  const text=fs.readFileSync(file,'utf8');
  if(!file.includes(path.sep+'checks'+path.sep)){
    assert(!/sk-(?:proj-)?[A-Za-z0-9_-]{20,}/.test(text),'secret-like token: '+file);
    assert(!/[A-Z]:\\Users\\/.test(text),'private absolute path: '+file);
    assert(!/\b1[3-9]\d{9}\b/.test(text),'phone-like data: '+file);
    assert(!/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text),'email-like data: '+file);
  }
  if(file.endsWith('.md'))for(const link of text.matchAll(/\]\(([^)]+)\)/g))if(!/^https?:\/\//.test(link[1]))assert(fs.existsSync(path.resolve(path.dirname(file),link[1])),'missing local link: '+link[1]);
}
console.log('PASS 7 = 3 + 1 + 3; statuses, full input audit and embedded fixed data agree.');
console.log('PASS fixed demo script compiles; no file input, generic CSV core or network API.');
console.log('PASS no paid HTML/ZIP/env file, secret-like token, private path, phone or email found.');
console.log('PASS README local links resolve.');
console.log('LIMIT: static/basic checks; browser display and download behavior not tested.');
