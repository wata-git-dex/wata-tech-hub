/**
 * W.A.T.A. shared profile component.
 * Canonical source: community-app/lib/wata-profile.js
 * The host owns authentication, navigation, and the surrounding drawer/modal.
 */
export const WATA_PROFILE_COMPONENT_VERSION = "1.1.0";

const SKILLS = ["Water systems","Engineering","Public health","Program management","Project management","Field operations","Community engagement","Partnerships","Fundraising","Research","Data & mapping","Communications","Design","Translation","Education & training","Finance & administration","Legal & policy"];
const INTERESTS = ["Clean water","Community development","Climate action","Humanitarian work","Volunteering","Travel","Music","Sports","Tennis","Football / soccer","Art","Photography","Film","Books","Cooking","Nature","Technology","Storytelling","Youth programs"];
const COUNTRY_CODES = "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CD CG CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW".split(" ");

const COPY = {
  en: {
    title:"Your W.A.T.A. profile", loading:"Loading your profile…", retry:"Try again", name:"Name", nationality:"Nationality", nationalityPlaceholder:"Select a nationality", location:"Current location", locationPlaceholder:"City, region, or country", skills:"Professional skills", skillsHint:"Capabilities you can bring to work and projects.", interests:"Personal interests", interestsHint:"Causes, activities and hobbies you care about.", choose:"Tap to choose", add:"Add", addAnother:"Add another…", contact:"Contact information", contactHint:"Private unless you choose to share it", showEmail:"Show my email to people in my Circles", showWhatsapp:"Show my WhatsApp to people in my Circles", managed:"Your roles and app access are managed by W.A.T.A. and cannot be edited here.", offline:"You’re offline. Your saved profile is available to view, but editing requires a connection.", save:"Save profile", complete:"Complete profile", saving:"Saving…", cancel:"Cancel", later:"Finish later", saved:"Profile saved across W.A.T.A.", moved:"Moved from the other category.", upload:"Change photo", badImage:"Choose a JPG, PNG, or WebP image under 5 MB.", loadError:"We couldn’t load your profile.", saveError:"We couldn’t confirm the save. Your changes are still here—check your connection and try again.", rolePending:"Role pending"
  },
  es: {
    title:"Tu perfil de W.A.T.A.", loading:"Cargando tu perfil…", retry:"Intentar de nuevo", name:"Nombre", nationality:"Nacionalidad", nationalityPlaceholder:"Selecciona una nacionalidad", location:"Ubicación actual", locationPlaceholder:"Ciudad, región o país", skills:"Habilidades profesionales", skillsHint:"Capacidades que puedes aportar al trabajo y a los proyectos.", interests:"Intereses personales", interestsHint:"Causas, actividades y pasatiempos que te importan.", choose:"Toca para elegir", add:"Agregar", addAnother:"Agregar otro…", contact:"Información de contacto", contactHint:"Privada a menos que elijas compartirla", showEmail:"Mostrar mi email a personas en mis Círculos", showWhatsapp:"Mostrar mi WhatsApp a personas en mis Círculos", managed:"W.A.T.A. administra tus roles y acceso; no puedes editarlos aquí.", offline:"No tienes conexión. Puedes ver tu perfil guardado, pero necesitas conexión para editarlo.", save:"Guardar perfil", complete:"Completar perfil", saving:"Guardando…", cancel:"Cancelar", later:"Terminar después", saved:"Perfil guardado en W.A.T.A.", moved:"Se movió desde la otra categoría.", upload:"Cambiar foto", badImage:"Elige una imagen JPG, PNG o WebP de menos de 5 MB.", loadError:"No pudimos cargar tu perfil.", saveError:"No pudimos confirmar el guardado. Tus cambios siguen aquí; revisa tu conexión e inténtalo de nuevo.", rolePending:"Rol pendiente"
  }
};

const css = `
  :host{display:block;color:var(--wata-profile-text,var(--text,#ecf5ff));font:inherit;color-scheme:inherit}
  *{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}.wrap{display:grid;gap:14px}.hero{display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--wata-profile-line,var(--line,#24445f))}.avatar{display:grid;place-items:center;width:58px;height:58px;flex:0 0 58px;overflow:hidden;border:1px solid color-mix(in srgb,var(--wata-profile-accent,var(--accent,#2cbfee)) 55%,transparent);border-radius:50%;color:white;background:linear-gradient(145deg,var(--wata-profile-accent,var(--accent,#2cbfee)),var(--wata-profile-accent-2,#326fce));font-weight:850}.avatar img{width:100%;height:100%;object-fit:cover}.identity{min-width:0;display:grid;gap:3px}.identity strong{font-size:19px;overflow-wrap:anywhere}.identity small,.hint,.privacy,.status{color:var(--wata-profile-muted,var(--dim,#91a7bf));font-size:11px;line-height:1.4}.photo{position:relative;display:inline-flex;width:max-content;margin-top:3px;color:var(--wata-profile-accent,var(--accent,#2cbfee));font-size:11px;font-weight:750}.photo input{position:absolute;width:1px;height:1px;opacity:0}.form{display:grid;gap:13px}.field{display:grid;gap:6px}.field>span{font-size:12px;font-weight:750}.field input,.field select,.adder input{width:100%;min-height:45px;padding:10px 12px;color:inherit;background:var(--wata-profile-input,var(--surface-2,#102438));border:1px solid var(--wata-profile-line,var(--line,#24445f));border-radius:12px;outline:none}.field input:focus,.field select:focus,.adder input:focus{border-color:var(--wata-profile-accent,var(--accent,#2cbfee));box-shadow:0 0 0 3px color-mix(in srgb,var(--wata-profile-accent,var(--accent,#2cbfee)) 13%,transparent)}details{overflow:hidden;border:1px solid var(--wata-profile-line,var(--line,#24445f));border-radius:14px;background:color-mix(in srgb,var(--wata-profile-input,var(--surface-2,#102438)) 70%,transparent)}summary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;list-style:none;cursor:pointer}summary::-webkit-details-marker{display:none}summary>span{min-width:0;display:grid;gap:3px}summary strong{font-size:13px}.chev{width:8px;height:8px;flex:none;border-right:2px solid var(--wata-profile-accent,var(--accent,#2cbfee));border-bottom:2px solid var(--wata-profile-accent,var(--accent,#2cbfee));transform:rotate(45deg)}details[open] .chev{transform:rotate(225deg)}.summary-pills,.choices{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.summary-pills b,.choice{display:inline-flex;align-items:center;min-height:29px;padding:5px 9px;border:1px solid var(--wata-profile-line,var(--line,#24445f));border-radius:999px;background:transparent;color:var(--wata-profile-muted,var(--dim,#91a7bf));font-size:11px;font-weight:650}.summary-pills b{min-height:24px;padding:3px 7px;color:var(--wata-profile-accent,var(--accent,#2cbfee));background:color-mix(in srgb,var(--wata-profile-accent,var(--accent,#2cbfee)) 10%,transparent)}details[open] .summary-pills{display:none}.choice.selected{border-color:var(--wata-profile-accent,var(--accent,#2cbfee));color:var(--wata-profile-accent,var(--accent,#2cbfee));background:color-mix(in srgb,var(--wata-profile-accent,var(--accent,#2cbfee)) 11%,transparent)}.detail-body{display:grid;gap:11px;padding:0 12px 12px}.adder{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}.small-btn,.action{min-height:42px;padding:8px 13px;border:1px solid var(--wata-profile-line,var(--line,#24445f));border-radius:12px;background:transparent;color:inherit;font-weight:750}.small-btn{color:var(--wata-profile-accent,var(--accent,#2cbfee))}.contact-body{display:grid;gap:12px;padding:0 12px 12px}.visibility{display:flex;align-items:flex-start;gap:8px;color:var(--wata-profile-muted,var(--dim,#91a7bf));font-size:11px;line-height:1.35}.visibility input{width:18px;height:18px;flex:none;accent-color:var(--wata-profile-accent,var(--accent,#2cbfee))}.privacy{margin:0}.actions{display:grid;grid-template-columns:1fr 1.5fr;gap:8px}.action.primary{border:0;color:white;background:linear-gradient(100deg,var(--wata-profile-accent,var(--accent,#2cbfee)),var(--wata-profile-accent-2,#326fce));box-shadow:0 10px 28px -16px var(--wata-profile-accent,var(--accent,#2cbfee))}.action:disabled,input:disabled,select:disabled{cursor:not-allowed;opacity:.55}.status{margin:0;padding:10px 11px;border:1px solid var(--wata-profile-line,var(--line,#24445f));border-radius:11px}.status.error{color:#ff9b91;border-color:color-mix(in srgb,#ff7065 45%,var(--wata-profile-line,var(--line,#24445f)))}.status.ok{color:var(--wata-profile-accent,var(--accent,#2cbfee))}.loading{min-height:170px;display:grid;place-content:center;text-align:center;color:var(--wata-profile-muted,var(--dim,#91a7bf))}.retry{margin-top:10px}.notice{padding:10px 11px;border-radius:11px;background:color-mix(in srgb,var(--wata-profile-accent,var(--accent,#2cbfee)) 9%,transparent);color:var(--wata-profile-muted,var(--dim,#91a7bf));font-size:11px;line-height:1.45}@media(max-width:420px){.actions{grid-template-columns:1fr}.hero{align-items:flex-start}}@media(prefers-reduced-motion:no-preference){button{transition:transform .13s ease,background .17s ease,border-color .17s ease}button:active{transform:scale(.975)}}
`;

const HTMLElementBase = globalThis.HTMLElement || class {};

export class WataProfileEditor extends HTMLElementBase {
  #options = null;
  #profile = null;
  #skills = new Set();
  #interests = new Set();
  #abort = null;
  #epoch = 0;
  #previewUrl = "";
  #pendingAvatar = null;

  constructor() {
    super();
    this.attachShadow?.({ mode:"open" });
  }

  connectedCallback() {
    if (this.#options) this.#start();
  }

  disconnectedCallback() {
    this.invalidate();
  }

  configure(options) {
    if (!options?.adapter || typeof options.adapter.saveProfile !== "function") throw new TypeError("W.A.T.A. profile requires an adapter with saveProfile().");
    this.#options = { language:"en", online:()=>navigator.onLine, ...options };
    this.#profile = options.profile ? normalizeWataProfile(options.profile) : null;
    if (this.isConnected) this.#start();
    return this;
  }

  invalidate() {
    this.#epoch += 1;
    this.#abort?.abort();
    this.#abort = null;
    if (this.#previewUrl) URL.revokeObjectURL(this.#previewUrl);
    this.#previewUrl = "";
    this.#pendingAvatar = null;
  }

  async refresh() {
    return this.#load(true);
  }

  #copy() { return COPY[this.#options?.language === "es" ? "es" : "en"]; }
  #online() { return this.#options?.online?.() !== false; }

  async #start() {
    if (this.#profile) {
      this.#setCollections();
      this.#render();
      return;
    }
    await this.#load(false);
  }

  async #load(force) {
    if (!force && this.#profile) return this.#profile;
    if (typeof this.#options.adapter.loadProfile !== "function") {
      this.#renderError(this.#copy().loadError);
      return null;
    }
    const epoch = ++this.#epoch;
    this.#abort?.abort();
    this.#abort = new AbortController();
    this.shadowRoot.innerHTML = `<style>${css}</style><div class="loading" role="status">${escapeHtml(this.#copy().loading)}</div>`;
    try {
      const loaded = await this.#options.adapter.loadProfile({ signal:this.#abort.signal });
      if (epoch !== this.#epoch || !this.isConnected) return null;
      this.#profile = normalizeWataProfile(loaded?.profile || loaded);
      this.#setCollections();
      this.#render();
      return this.#profile;
    } catch (error) {
      if (error?.name === "AbortError" || epoch !== this.#epoch) return null;
      this.#renderError(error?.message || this.#copy().loadError);
      return null;
    }
  }

  #setCollections() {
    const distinct=reconcileProfileTaxonomies(this.#profile.skills,this.#profile.interests);
    this.#skills = new Set(distinct.skills);
    this.#interests = new Set(distinct.interests);
  }

  #render() {
    const c=this.#copy(),p=this.#profile,offline=!this.#online(),role=this.#options.roleLabel || p.role_label || c.rolePending,onboarding=this.#options.mode==="onboarding";
    this.shadowRoot.innerHTML = `<style>${css}</style><div class="wrap"><div class="hero"><div class="avatar">${avatarMarkup(this.#previewUrl||p.avatar_url,p.name)}</div><div class="identity"><strong>${escapeHtml(p.name || c.title)}</strong><small>${escapeHtml(role)}</small>${typeof this.#options.adapter.uploadAvatar === "function" ? `<label class="photo">${escapeHtml(c.upload)}<input id="avatar" type="file" accept="image/jpeg,image/png,image/webp" ${offline?"disabled":""}></label>`:""}</div></div>${offline?`<div class="notice" role="status">${escapeHtml(c.offline)}</div>`:""}<form class="form"><label class="field"><span>${escapeHtml(c.name)}</span><input name="name" maxlength="120" required value="${attr(p.name)}" ${offline?"disabled":""}></label><label class="field"><span>${escapeHtml(c.nationality)}</span><select name="country" ${offline?"disabled":""}>${countryOptions(p.country,this.#options.language,c.nationalityPlaceholder)}</select></label><label class="field"><span>${escapeHtml(c.location)}</span><input name="current_location" maxlength="120" value="${attr(p.current_location)}" placeholder="${attr(c.locationPlaceholder)}" ${offline?"disabled":""}></label>${this.#tagPicker("skills",c.skills,c.skillsHint,SKILLS)}${this.#tagPicker("interests",c.interests,c.interestsHint,INTERESTS)}<details><summary><span><strong>${escapeHtml(c.contact)}</strong><small class="hint">${escapeHtml(c.contactHint)}</small></span><i class="chev"></i></summary><div class="contact-body"><label class="field"><span>Email</span><input name="contact_email" type="email" maxlength="254" autocomplete="email" value="${attr(p.contact_email)}" ${offline?"disabled":""}></label><label class="visibility"><input name="show_email" type="checkbox" ${p.show_email?"checked":""} ${offline?"disabled":""}><span>${escapeHtml(c.showEmail)}</span></label><label class="field"><span>WhatsApp</span><input name="whatsapp_number" type="tel" maxlength="24" autocomplete="tel" value="${attr(p.whatsapp_number)}" placeholder="+1 555 123 4567" ${offline?"disabled":""}></label><label class="visibility"><input name="show_whatsapp" type="checkbox" ${p.show_whatsapp?"checked":""} ${offline?"disabled":""}><span>${escapeHtml(c.showWhatsapp)}</span></label></div></details><p class="privacy">${escapeHtml(c.managed)}</p><p id="status" class="status" hidden aria-live="polite"></p><div class="actions"><button type="button" class="action" data-profile-action="cancel">${escapeHtml(onboarding?c.later:c.cancel)}</button><button type="submit" class="action primary" ${offline?"disabled":""}>${escapeHtml(onboarding?c.complete:c.save)}</button></div></form></div>`;
    this.shadowRoot.addEventListener("click",event=>this.#click(event));
    this.shadowRoot.querySelector("form")?.addEventListener("submit",event=>this.#save(event));
    this.shadowRoot.querySelector("#avatar")?.addEventListener("change",event=>this.#selectAvatar(event));
  }

  #tagPicker(group,label,hint,suggestions) {
    const selected=group==="skills"?this.#skills:this.#interests,all=[...new Set([...suggestions,...selected])],c=this.#copy(),disabled=!this.#online()?"disabled":"";
    return `<details data-group="${group}"><summary><span><strong>${escapeHtml(label)}</strong><small class="hint">${escapeHtml(hint)}</small><span class="summary-pills">${selected.size?[...selected].map(value=>`<b>${escapeHtml(value)}</b>`).join(""):`<small>${escapeHtml(c.choose)}</small>`}</span></span><i class="chev"></i></summary><div class="detail-body"><div class="choices">${all.map(value=>`<button type="button" class="choice ${selected.has(value)?"selected":""}" data-profile-action="toggle" data-group="${group}" data-value="${attr(value)}" aria-pressed="${selected.has(value)}" ${disabled}>${escapeHtml(value)}</button>`).join("")}</div><div class="adder"><input data-custom="${group}" maxlength="48" placeholder="${attr(c.addAnother)}" ${disabled}><button type="button" class="small-btn" data-profile-action="add" data-group="${group}" ${disabled}>${escapeHtml(c.add)}</button></div></div></details>`;
  }

  #click(event) {
    const action=event.target.closest("[data-profile-action]");
    if (!action) return;
    if (action.dataset.profileAction === "cancel") return this.#options.onClose?.({ reason:"cancel" });
    if (action.dataset.profileAction === "toggle") this.#toggle(action.dataset.group,action.dataset.value);
    if (action.dataset.profileAction === "add") {
      const input=this.shadowRoot.querySelector(`[data-custom="${action.dataset.group}"]`),value=input?.value.trim();
      if (value) { this.#toggle(action.dataset.group,value,true); input.value=""; }
    }
  }

  #toggle(group,value,forceOn=false) {
    this.#captureDraft();
    const own=group==="skills"?this.#skills:this.#interests,other=group==="skills"?this.#interests:this.#skills;
    let moved=false;
    const existing=[...own].find(item=>item.toLowerCase()===value.toLowerCase());
    if (existing && !forceOn) own.delete(existing); else {
      if (!existing) own.add(value);
      const duplicate=[...other].find(item=>item.toLowerCase()===value.toLowerCase());
      if (duplicate) { other.delete(duplicate); moved=true; }
    }
    this.#render();
    if (moved) this.#showStatus(this.#copy().moved,"ok");
  }

  #captureDraft() {
    const form=this.shadowRoot?.querySelector("form");
    if (!form || !this.#profile) return;
    const raw=Object.fromEntries(new FormData(form));
    this.#profile={...this.#profile,name:String(raw.name||""),country:String(raw.country||""),current_location:String(raw.current_location||""),contact_email:String(raw.contact_email||""),whatsapp_number:String(raw.whatsapp_number||""),show_email:Boolean(raw.show_email),show_whatsapp:Boolean(raw.show_whatsapp)};
  }

  #selectAvatar(event) {
    const file=event.target.files?.[0];
    if (!file) return;
    if (!isSupportedProfileAvatar(file)) { this.#showStatus(this.#copy().badImage,"error"); event.target.value=""; return; }
    if (this.#previewUrl) URL.revokeObjectURL(this.#previewUrl);
    this.#previewUrl=URL.createObjectURL(file);this.#pendingAvatar=file;
    const avatar=this.shadowRoot.querySelector(".avatar");if(avatar)avatar.innerHTML=`<img src="${attr(this.#previewUrl)}" alt="">`;
  }

  async #save(event) {
    event.preventDefault();
    const form=event.currentTarget,c=this.#copy();
    if (!this.#online() || !form.reportValidity()) return;
    const epoch=++this.#epoch;this.#abort?.abort();this.#abort=new AbortController();
    const submit=form.querySelector('[type="submit"]');submit.disabled=true;submit.textContent=c.saving;
    try {
      let avatarUrl=this.#profile.avatar_url;
      if (this.#pendingAvatar) {
        const uploaded=await this.#options.adapter.uploadAvatar(this.#pendingAvatar,{ signal:this.#abort.signal });
        if (epoch!==this.#epoch || this.#abort.signal.aborted || !this.isConnected) return;
        avatarUrl=uploaded?.avatar_url || uploaded?.url || uploaded;
      }
      const raw=Object.fromEntries(new FormData(form));
      const patch=buildWataProfilePatch(raw,[...this.#skills],[...this.#interests],avatarUrl);
      const saved=await this.#options.adapter.saveProfile(patch,{ signal:this.#abort.signal,mode:this.#options.mode||"edit" });
      if (epoch!==this.#epoch || !this.isConnected) return;
      this.#profile=normalizeWataProfile(saved?.profile || saved || {...this.#profile,...patch});this.#pendingAvatar=null;
      if(this.#previewUrl)URL.revokeObjectURL(this.#previewUrl);this.#previewUrl="";
      this.dispatchEvent(new CustomEvent("wata-profile-saved",{detail:{profile:this.#profile,version:WATA_PROFILE_COMPONENT_VERSION},bubbles:true,composed:true}));
      this.#options.onSaved?.(this.#profile);
      this.#render();
      this.#showStatus(c.saved,"ok");
    } catch(error) {
      if (error?.name!=="AbortError" && epoch===this.#epoch) this.#showStatus(error?.message||c.saveError,"error");
    } finally {
      if (epoch===this.#epoch && submit?.isConnected) { submit.disabled=false;submit.textContent=c.save; }
    }
  }

  #showStatus(message,type="") {
    const status=this.shadowRoot.querySelector("#status");
    if (!status) return;
    status.hidden=false;status.className=`status ${type}`.trim();status.textContent=message;
  }

  #renderError(message) {
    const c=this.#copy();
    this.shadowRoot.innerHTML=`<style>${css}</style><div class="loading" role="alert"><span>${escapeHtml(message||c.loadError)}</span><button class="action retry" type="button">${escapeHtml(c.retry)}</button></div>`;
    this.shadowRoot.querySelector("button")?.addEventListener("click",()=>this.refresh());
  }
}

if (globalThis.customElements && !customElements.get("wata-profile-editor")) customElements.define("wata-profile-editor",WataProfileEditor);

export function mountWataProfile(host,options) {
  if (!globalThis.Element || !(host instanceof Element)) throw new TypeError("W.A.T.A. profile host must be a DOM element.");
  const editor=document.createElement("wata-profile-editor");
  host.replaceChildren(editor);
  editor.configure(options);
  return { element:editor, refresh:()=>editor.refresh(), destroy:()=>{editor.invalidate();editor.remove();} };
}

export function reconcileProfileTaxonomies(skills=[],interests=[]) {
  const clean=list=>Array.isArray(list)?[...new Set(list.map(item=>String(item).trim()).filter(Boolean))].slice(0,30):[];
  const professional=clean(skills),names=new Set(professional.map(item=>item.toLowerCase()));
  return {skills:professional,interests:clean(interests).filter(item=>!names.has(item.toLowerCase()))};
}

export function buildWataProfilePatch(raw={},skills=[],interests=[],avatarUrl="") {
  const distinct=reconcileProfileTaxonomies(skills,interests);
  return {name:String(raw.name||"").trim(),country:String(raw.country||"").trim(),current_location:String(raw.current_location||"").trim(),skills:distinct.skills,interests:distinct.interests,contact_email:String(raw.contact_email||"").trim(),whatsapp_number:String(raw.whatsapp_number||"").trim(),show_email:Boolean(raw.show_email),show_whatsapp:Boolean(raw.show_whatsapp),avatar_url:safeAvatar(avatarUrl)||null};
}

export function isSupportedProfileAvatar(file) {
  return Boolean(file && /^image\/(jpeg|png|webp)$/u.test(String(file.type||"")) && Number(file.size)>0 && Number(file.size)<=5*1024*1024);
}

export function normalizeWataProfile(value={}) {
  const list=input=>Array.isArray(input)?[...new Set(input.map(item=>String(item).trim()).filter(Boolean))].slice(0,30):[];
  return {id:value.id||null,name:String(value.name||value.display_name||"").trim(),avatar_url:safeAvatar(value.avatar_url),avatar_ref:String(value.avatar_ref||"").trim(),country:String(value.country||"").trim(),current_location:String(value.current_location||"").trim(),skills:list(value.skills),interests:list(value.interests),contact_email:String(value.contact_email||"").trim(),whatsapp_number:String(value.whatsapp_number||"").trim(),show_email:Boolean(value.show_email),show_whatsapp:Boolean(value.show_whatsapp),role_label:String(value.role_label||"").trim(),profile_completed_at:value.profile_completed_at||null};
}

export function isWataProfileComplete(value={}) { return Boolean(value?.profile_completed_at); }

function safeAvatar(value) {
  const url=String(value||"").trim();
  if (!url) return "";
  try { const origin=globalThis.location?.origin||"https://local.invalid";const parsed=new URL(url,origin); return parsed.protocol==="https:" || parsed.origin===origin || parsed.protocol==="blob:" ? parsed.href : ""; } catch { return ""; }
}
function avatarMarkup(url,name) { return url?`<img src="${attr(url)}" alt="">`:escapeHtml(initials(name)); }
function initials(name="") { return String(name).split(/\s+/u).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase()||"WA"; }
function countryOptions(current,language,placeholder) { let names;try{names=new Intl.DisplayNames([language==="es"?"es":"en"],{type:"region"})}catch{names={of:code=>code}}const countries=COUNTRY_CODES.map(code=>({code,name:names.of(code)||code})).sort((a,b)=>a.name.localeCompare(b.name,language));const known=countries.some(item=>item.name===current);return `<option value="">${escapeHtml(placeholder)}</option>${current&&!known?`<option selected value="${attr(current)}">${escapeHtml(current)}</option>`:""}${countries.map(item=>`<option value="${attr(item.name)}" ${item.name===current?"selected":""}>${flag(item.code)} ${escapeHtml(item.name)}</option>`).join("")}`; }
function flag(code) { return [...code].map(character=>String.fromCodePoint(127397+character.charCodeAt(0))).join(""); }
function escapeHtml(value="") { return String(value).replace(/[&<>'"]/gu,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]); }
function attr(value="") { return escapeHtml(value); }
