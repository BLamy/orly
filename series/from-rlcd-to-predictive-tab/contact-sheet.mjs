// Compact visual QA contact sheet from captured native Storybook frames.
import fs from 'node:fs';import path from 'node:path';import sharp from 'sharp';
const [slug,num]=process.argv.slice(2);const ch=Number(num);if(!slug||!ch)throw new Error('Pass slug and chapter number');
const dir=path.join(path.dirname(new URL(import.meta.url).pathname),'evidence',slug);
const files=fs.readdirSync(dir).filter(f=>new RegExp(`^draft-chapter-${ch}-cue-\\d+\\.png$`).test(f)).sort((a,b)=>Number(a.match(/cue-(\d+)/)[1])-Number(b.match(/cue-(\d+)/)[1]));
if(!files.length)throw new Error('No captured frames');
const images=await Promise.all(files.map(async(f,i)=>({input:await sharp(path.join(dir,f)).resize({width:640,height:360,fit:'contain'}).toBuffer(),left:i%2*640,top:Math.floor(i/2)*360})));
const output=path.join(dir,`draft-chapter-${ch}-contact.png`);await sharp({create:{width:1280,height:Math.ceil(files.length/2)*360,channels:3,background:'#0a0e1a'}}).composite(images).png().toFile(output);console.log(output);
