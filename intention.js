/* Mode Intention (option « Freeze ») : un bouton suspend l'outil, pose des repères sur ses zones
   et ouvre un bloc qui dit pourquoi l'outil existe. Aucune dépendance, aucun lien avec le moteur.
   Usage : Intention.monter({ racine, ancrage, titre, reperes, onglets }). */
(function(global){
'use strict';

var CSS=[
':root{--int-voile:rgba(78,90,150,.16);--int-voile-2:rgba(120,110,190,.10);--int-surface:rgba(247,248,253,.94);--int-ink:#1e2236;--int-ink-2:#555b78;--int-trait:#6a72b6;--int-halo:rgba(106,114,182,.32);--int-mote:rgba(90,100,170,.55);--int-point:#F39200;--int-gel:saturate(.28) contrast(.82) brightness(.97) blur(.7px)}',
'@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--int-voile:rgba(110,125,210,.14);--int-voile-2:rgba(150,130,230,.08);--int-surface:rgba(20,22,34,.94);--int-ink:#e7e9f6;--int-ink-2:#a7acc8;--int-trait:#9ca5ea;--int-halo:rgba(156,165,234,.30);--int-mote:rgba(170,180,240,.5);--int-gel:saturate(.28) contrast(.8) brightness(.72) blur(.7px)}}',
':root[data-theme="dark"]{--int-voile:rgba(110,125,210,.14);--int-voile-2:rgba(150,130,230,.08);--int-surface:rgba(20,22,34,.94);--int-ink:#e7e9f6;--int-ink-2:#a7acc8;--int-trait:#9ca5ea;--int-halo:rgba(156,165,234,.30);--int-mote:rgba(170,180,240,.5);--int-gel:saturate(.28) contrast(.8) brightness(.72) blur(.7px)}',
'.int-entree{display:inline-flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;font-weight:500;color:var(--ink-2,#52514e);border:1px solid var(--axis,#c3c2b7);border-radius:999px;padding:5px 14px 5px 11px;background:transparent;cursor:pointer}',
'.int-entree::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--int-point)}',
'.int-entree:hover{background:var(--grid,#e1e0d9);color:var(--ink,#0b0b0b)}',
'.int-racine{transition:filter .5s ease,opacity .5s ease}',
'html.int-gel .int-racine{filter:var(--int-gel);opacity:.9}',
'html.int-gel .tip{display:none!important}',
'#int-voile{position:fixed;inset:0;z-index:40;opacity:0;pointer-events:none;transition:opacity .6s ease;background:radial-gradient(120% 80% at 70% 20%,var(--int-voile-2),transparent 60%),linear-gradient(var(--int-voile),var(--int-voile))}',
'#int-voile.int-on{opacity:1;pointer-events:auto}',
'#int-motes{position:fixed;inset:0;z-index:41;pointer-events:none;opacity:0;transition:opacity 1.2s ease}',
'#int-motes.int-on{opacity:1}',
'#int-calque{position:absolute;left:0;top:0;width:100%;height:0;z-index:50;pointer-events:none}',
'.int-ancre{position:absolute;border:1px solid var(--int-trait);border-radius:12px;box-shadow:0 0 0 4px var(--int-halo),0 0 40px var(--int-halo);opacity:0;transition:opacity .6s ease}',
'.int-repere{position:absolute;max-width:270px;padding:10px 14px 12px;border-radius:10px;background:var(--int-surface);color:var(--int-ink);border:1px solid var(--int-halo);box-shadow:0 18px 40px -20px var(--int-halo);opacity:0;transform:translateY(6px);transition:opacity .5s ease,transform .5s ease}',
'.int-repere b{display:block;font-family:var(--mono,ui-monospace,monospace);font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--int-trait)}',
'.int-repere span{display:block;font-family:"Newsreader",Georgia,"Times New Roman",serif;font-style:italic;font-size:18px;line-height:1.3;margin-top:3px}',
'.int-repere::before{content:"";position:absolute;left:-26px;top:22px;width:26px;height:1px;background:var(--int-trait)}',
'.int-repere::after{content:"";position:absolute;left:-30px;top:19px;width:7px;height:7px;border-radius:50%;background:var(--int-trait);box-shadow:0 0 0 4px var(--int-halo)}',
'.int-vu{opacity:1!important;transform:none!important}',
'#int-bloc{position:fixed;z-index:60;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));width:min(560px,calc(100vw - 32px));box-sizing:border-box;transform:translate(-50%,14px);opacity:0;visibility:hidden;background:var(--int-surface);color:var(--int-ink);border:1px solid var(--int-halo);border-radius:16px;padding:22px 24px 18px;box-shadow:0 30px 80px -30px var(--int-halo),0 0 0 6px var(--int-voile-2);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);transition:opacity .5s ease,transform .5s cubic-bezier(.2,.7,.2,1),visibility 0s .5s;display:flex;flex-direction:column;gap:12px;font-family:var(--font,system-ui,sans-serif)}',
'#int-bloc.int-on{opacity:1;visibility:visible;transform:translate(-50%,0);transition-delay:0s}',
'#int-bloc .int-oeil{font-family:var(--mono,ui-monospace,monospace);font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--int-trait)}',
'#int-bloc h2{font-family:"Newsreader",Georgia,"Times New Roman",serif;font-weight:400;font-size:28px;line-height:1.15;margin:0;outline:none}',
'.int-onglets{display:flex;flex-wrap:wrap;gap:6px}',
'.int-onglets button{font:inherit;font-size:13px;color:var(--int-ink-2);background:transparent;border:1px solid var(--int-halo);border-radius:999px;padding:5px 13px;cursor:pointer}',
'.int-onglets button[aria-selected="true"]{border-color:var(--int-trait);color:var(--int-ink);background:var(--int-halo)}',
'.int-onglets button:focus-visible,.int-retour:focus-visible{outline:2px solid var(--int-trait);outline-offset:2px}',
'.int-corps{max-height:34vh;overflow-y:auto;font-size:14.5px;line-height:1.55}',
'.int-corps p{margin:0 0 8px}.int-corps ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px}',
'.int-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}',
'.int-retour{font:inherit;font-size:14px;font-weight:500;color:var(--int-ink);background:transparent;border:1px solid var(--int-trait);border-radius:999px;padding:7px 16px;cursor:pointer}',
'.int-retour:hover{background:var(--int-halo)}',
'.int-touche{font-family:var(--mono,ui-monospace,monospace);font-size:11.5px;color:var(--int-ink-2)}',
'.int-lecteur{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
'@media (max-width:720px){.int-repere{max-width:calc(100vw - 64px)}.int-repere::before,.int-repere::after{display:none}.int-repere span{font-size:16px}#int-bloc{bottom:calc(12px + env(safe-area-inset-bottom,0px));padding:18px 18px 14px}#int-bloc h2{font-size:24px}.int-corps{max-height:30vh}}',
'@media (prefers-reduced-motion: reduce){.int-racine,#int-voile,#int-bloc,.int-repere,.int-ancre{transition-duration:.01s!important}#int-motes{display:none}}'
].join('\n');

function el(tag,attrs,html){
  var e=document.createElement(tag);
  for(var k in attrs) e.setAttribute(k,attrs[k]);
  if(html!=null) e.innerHTML=html;
  return e;
}

function monter(cfg){
  var R=document.documentElement;
  var racine=document.querySelector(cfg.racine);
  var ancrage=document.querySelector(cfg.ancrage);
  if(!racine||!ancrage) return null;
  var moins=global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  racine.classList.add('int-racine');
  document.head.appendChild(el('style',{},CSS));

  var entree=el('button',{type:'button','class':'int-entree','aria-haspopup':'dialog'},'Intention');
  ancrage.appendChild(entree);

  var voile=el('div',{id:'int-voile','aria-hidden':'true'});
  var motes=el('canvas',{id:'int-motes','aria-hidden':'true'});
  var calque=el('div',{id:'int-calque','aria-hidden':'true'});
  var onglets=cfg.onglets||[];
  var bloc=el('section',{id:'int-bloc',role:'dialog','aria-modal':'true','aria-labelledby':'int-titre',hidden:''},
    '<span class="int-oeil">Intention</span>'+
    '<h2 id="int-titre" tabindex="-1"></h2>'+
    '<ul class="int-lecteur" aria-label="Repères sur l\'outil"></ul>'+
    '<div class="int-onglets" role="tablist" aria-label="Explorer l\'intention"></div>'+
    '<div class="int-corps" role="tabpanel" id="int-corps" tabindex="0"></div>'+
    '<div class="int-actions"><button type="button" class="int-retour">Revenir à l\'outil</button><span class="int-touche" aria-hidden="true">Échap</span></div>');
  bloc.querySelector('h2').textContent=cfg.titre||'Intention';
  bloc.querySelector('.int-lecteur').innerHTML=(cfg.reperes||[]).map(function(r){return '<li>'+r.libelle+' : '+r.phrase+'</li>';}).join('');
  var liste=bloc.querySelector('.int-onglets');
  onglets.forEach(function(o,i){
    var b=el('button',{type:'button',role:'tab',id:'int-o-'+o.id,'aria-controls':'int-corps','aria-selected':i?'false':'true',tabindex:i?'-1':'0'});
    b.textContent=o.titre;
    b.addEventListener('click',function(){montrer(i);});
    liste.appendChild(b);
  });
  liste.addEventListener('keydown',function(e){
    var n=onglets.length, i=courant;
    if(e.key==='ArrowRight') i=(i+1)%n; else if(e.key==='ArrowLeft') i=(i+n-1)%n; else if(e.key==='Home') i=0; else if(e.key==='End') i=n-1; else return;
    e.preventDefault(); montrer(i); liste.children[i].focus();
  });
  [voile,motes,calque,bloc].forEach(function(n){document.body.appendChild(n);});

  var courant=0;
  function montrer(i){
    courant=i;
    Array.prototype.forEach.call(liste.children,function(b,j){b.setAttribute('aria-selected',j===i?'true':'false'); b.tabIndex=j===i?0:-1;});
    var c=bloc.querySelector('.int-corps');
    c.innerHTML=onglets[i]?onglets[i].html:'';
    c.setAttribute('aria-labelledby','int-o-'+(onglets[i]&&onglets[i].id));
    c.scrollTop=0;
  }

  function poser(){
    calque.innerHTML='';
    var large=global.innerWidth>720;
    (cfg.reperes||[]).forEach(function(r){
      var e=document.querySelector(r.cible); if(!e) return;
      var b=e.getBoundingClientRect(), x=b.left+global.scrollX, y=b.top+global.scrollY;
      var a=el('div',{'class':'int-ancre'});
      a.style.cssText='left:'+(x-6)+'px;top:'+(y-6)+'px;width:'+(b.width+12)+'px;height:'+(b.height+12)+'px';
      var n=el('div',{'class':'int-repere'},'<b></b><span></span>');
      n.querySelector('b').textContent=r.libelle; n.querySelector('span').textContent=r.phrase;
      var nx=large? Math.max(x+34,Math.min(x+b.width*0.55,global.innerWidth-300)) : x+12;
      n.style.left=nx+'px'; n.style.top=(y+(large?18:12))+'px';
      calque.appendChild(a); calque.appendChild(n);
    });
  }

  var cx=motes.getContext&&motes.getContext('2d'), points=[], anim=0;
  function particules(on){
    cancelAnimationFrame(anim); motes.classList.toggle('int-on',on);
    if(!on||moins||!cx) return;
    var w=global.innerWidth, h=global.innerHeight, dpr=global.devicePixelRatio||1;
    motes.width=w*dpr; motes.height=h*dpr; cx.setTransform(dpr,0,0,dpr,0,0);
    var coul=getComputedStyle(R).getPropertyValue('--int-mote').trim();
    points=[]; for(var i=0;i<16;i++) points.push({x:Math.random()*w,y:Math.random()*h,r:.6+Math.random()*1.4,v:.08+Math.random()*.18,p:Math.random()*6.28});
    (function pas(){
      cx.clearRect(0,0,w,h); cx.fillStyle=coul;
      points.forEach(function(m){m.y-=m.v; m.p+=.006; if(m.y<-4) m.y=h+4; cx.globalAlpha=.35+.35*Math.sin(m.p); cx.beginPath(); cx.arc(m.x+Math.sin(m.p)*6,m.y,m.r,0,6.283); cx.fill();});
      anim=requestAnimationFrame(pas);
    })();
  }

  // Séquence : silence, voile, repères un à un, puis le bloc. Un clic ou une touche pendant la séquence la termine.
  var ouvert=false, minuteurs=[];
  function plus(f,ms){minuteurs.push(setTimeout(f,moins?0:ms));}
  function purger(){minuteurs.forEach(clearTimeout); minuteurs=[];}
  function afficherBloc(){
    if(!bloc.hidden&&bloc.classList.contains('int-on')) return;
    bloc.hidden=false;
    requestAnimationFrame(function(){bloc.classList.add('int-on'); bloc.querySelector('h2').focus({preventScroll:true});});
  }
  function tout(){
    purger(); voile.classList.add('int-on'); particules(true);
    Array.prototype.forEach.call(calque.children,function(n){n.classList.add('int-vu');});
    afficherBloc();
  }
  function ouvrir(){
    if(ouvert) return; ouvert=true; purger();
    R.classList.add('int-gel'); racine.inert=true;
    // Sur mobile, le bloc occupe le bas de l'écran : on amène le premier repère en haut pour qu'il reste visible.
    var premier=cfg.reperes&&cfg.reperes[0]&&document.querySelector(cfg.reperes[0].cible);
    if(premier&&global.innerWidth<=720) global.scrollTo(0,premier.getBoundingClientRect().top+global.scrollY-16);
    montrer(0); poser();
    plus(function(){voile.classList.add('int-on');},300);
    plus(function(){particules(true);},500);
    var ns=calque.children;
    for(var i=0;i<ns.length;i+=2) (function(i){plus(function(){ns[i].classList.add('int-vu'); ns[i+1].classList.add('int-vu');},600+(i/2)*300);})(i);
    plus(afficherBloc,700+Math.max(1,ns.length/2)*300);
  }
  function fermer(){
    if(!ouvert) return; ouvert=false; purger();
    bloc.classList.remove('int-on');
    Array.prototype.forEach.call(calque.children,function(n){n.classList.remove('int-vu');});
    plus(function(){voile.classList.remove('int-on'); particules(false); R.classList.remove('int-gel');},150);
    plus(function(){bloc.hidden=true; calque.innerHTML=''; racine.inert=false; entree.focus({preventScroll:true});},550);
  }

  entree.addEventListener('click',ouvrir);
  bloc.querySelector('.int-retour').addEventListener('click',fermer);
  voile.addEventListener('click',function(){ if(bloc.hidden) tout(); else fermer(); });
  document.addEventListener('keydown',function(e){
    if(!ouvert) return;
    if(e.key==='Escape'){ e.preventDefault(); fermer(); return; }
    if(bloc.hidden){ tout(); return; }
    if(e.key==='Tab'){
      var f=bloc.querySelectorAll('button:not([tabindex="-1"]),[tabindex="0"]');
      var p=f[0], d=f[f.length-1];
      if(e.shiftKey&&(document.activeElement===p||document.activeElement===bloc.querySelector('h2'))){e.preventDefault(); d.focus();}
      else if(!e.shiftKey&&document.activeElement===d){e.preventDefault(); p.focus();}
    }
  });
  global.addEventListener('resize',function(){
    if(!ouvert) return;
    poser(); Array.prototype.forEach.call(calque.children,function(n){n.classList.add('int-vu');});
  });
  return {ouvrir:ouvrir,fermer:fermer};
}

global.Intention={monter:monter};
})(window);
