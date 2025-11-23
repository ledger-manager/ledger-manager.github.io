import{$ as f,Ab as Nt,Ac as _t,B as It,Bb as at,Bc as jt,C as y,Db as Vt,Ea as Z,F as a,Fb as Ut,Fc as Pt,Ga as ft,H as ut,Ha as Ot,I as wt,Ja as Bt,K as St,Kc as A,M as b,N as K,Oc as Qt,P as v,Q as J,Qc as Lt,R as m,Rc as Zt,Sc as rt,T as d,Tc as O,U as F,V as R,Vc as lt,Wa as nt,Xa as $,Xc as ct,Ya as Dt,Yc as H,Z as s,Za as Mt,_ as u,_a as ot,aa as I,ab as it,ba as w,ca as S,cd as x,da as E,dd as pt,ea as P,eb as z,fa as Q,fd as U,g as xt,ga as k,gd as $t,ha as X,ia as N,ib as At,id as zt,ja as W,ka as c,kb as Ft,la as Et,ma as tt,na as g,pa as _,q as B,qa as C,qb as Rt,r as q,s as Y,sd as dt,t as G,td as Ct,u as T,ua as et,v as D,va as p,w as M,wa as V,wb as ht,x as h,xa as L,xb as gt,ya as kt,zb as st}from"./chunk-KPKDQF2Q.js";var Ht=class e{constructor(o){this.router=o}SESSION_KEY="mc_manager_session";SESSION_DURATION=360*60*60*1e3;RETURN_URL_KEY="mc_manager_return_url";setSession(o,t){let i=Date.now(),n=o.expiresAt||i+this.SESSION_DURATION,r={name:o.name||"",roles:o.roles,loginTime:i,expiresAt:n,_password:t};localStorage.setItem(this.SESSION_KEY,JSON.stringify(r))}getSession(){let o=localStorage.getItem(this.SESSION_KEY);if(!o)return null;try{let t=JSON.parse(o);return Date.now()>t.expiresAt?(this.clearSession(),null):t}catch{return this.clearSession(),null}}isLoggedIn(){return this.getSession()!==null}getUsername(){return this.getSession()?.name||null}getUserRoles(){return this.getSession()?.roles||[]}refreshSession(){this.getSession()||this.logout()}clearSession(){localStorage.removeItem(this.SESSION_KEY),localStorage.removeItem(this.RETURN_URL_KEY)}logout(){this.clearSession(),this.router.navigate(["/login"])}setReturnUrl(o){localStorage.setItem(this.RETURN_URL_KEY,o)}getReturnUrl(){let o=localStorage.getItem(this.RETURN_URL_KEY);return localStorage.removeItem(this.RETURN_URL_KEY),o}isSessionExpiringSoon(){let o=this.getSession();return o?o.expiresAt-Date.now()<6e4:!1}isAdmin(){let o=this.getSession();return o?o.name==="sridhar_admin"||o.roles&&o.roles.includes("admin"):!1}static \u0275fac=function(t){return new(t||e)(G(Rt))};static \u0275prov=B({token:e,factory:e.\u0275fac,providedIn:"root"})};var qt=`
    .p-card {
        background: dt('card.background');
        color: dt('card.color');
        box-shadow: dt('card.shadow');
        border-radius: dt('card.border.radius');
        display: flex;
        flex-direction: column;
    }

    .p-card-caption {
        display: flex;
        flex-direction: column;
        gap: dt('card.caption.gap');
    }

    .p-card-body {
        padding: dt('card.body.padding');
        display: flex;
        flex-direction: column;
        gap: dt('card.body.gap');
    }

    .p-card-title {
        font-size: dt('card.title.font.size');
        font-weight: dt('card.title.font.weight');
    }

    .p-card-subtitle {
        color: dt('card.subtitle.color');
    }
`;var ie=["header"],se=["title"],ae=["subtitle"],re=["content"],le=["footer"],ce=["*",[["p-header"]],[["p-footer"]]],pe=["*","p-header","p-footer"];function de(e,o){e&1&&k(0)}function me(e,o){if(e&1&&(u(0,"div",1),tt(1,1),m(2,de,1,0,"ng-container",2),f()),e&2){let t=c();p(t.cx("header")),s("pBind",t.ptm("header")),a(2),s("ngTemplateOutlet",t.headerTemplate||t._headerTemplate)}}function ue(e,o){if(e&1&&(P(0),V(1),Q()),e&2){let t=c(2);a(),L(t.header)}}function fe(e,o){e&1&&k(0)}function he(e,o){if(e&1&&(u(0,"div",1),m(1,ue,2,1,"ng-container",3)(2,fe,1,0,"ng-container",2),f()),e&2){let t=c();p(t.cx("title")),s("pBind",t.ptm("title")),a(),s("ngIf",t.header&&!t._titleTemplate&&!t.titleTemplate),a(),s("ngTemplateOutlet",t.titleTemplate||t._titleTemplate)}}function ge(e,o){if(e&1&&(P(0),V(1),Q()),e&2){let t=c(2);a(),L(t.subheader)}}function _e(e,o){e&1&&k(0)}function Ce(e,o){if(e&1&&(u(0,"div",1),m(1,ge,2,1,"ng-container",3)(2,_e,1,0,"ng-container",2),f()),e&2){let t=c();p(t.cx("subtitle")),s("pBind",t.ptm("subtitle")),a(),s("ngIf",t.subheader&&!t._subtitleTemplate&&!t.subtitleTemplate),a(),s("ngTemplateOutlet",t.subtitleTemplate||t._subtitleTemplate)}}function ye(e,o){e&1&&k(0)}function be(e,o){e&1&&k(0)}function ve(e,o){if(e&1&&(u(0,"div",1),tt(1,2),m(2,be,1,0,"ng-container",2),f()),e&2){let t=c();p(t.cx("footer")),s("pBind",t.ptm("footer")),a(2),s("ngTemplateOutlet",t.footerTemplate||t._footerTemplate)}}var Te=`
    ${qt}

    .p-card {
        display: block;
    }
`,xe={root:"p-card p-component",header:"p-card-header",body:"p-card-body",caption:"p-card-caption",title:"p-card-title",subtitle:"p-card-subtitle",content:"p-card-content",footer:"p-card-footer"},Yt=(()=>{class e extends lt{name="card";style=Te;classes=xe;static \u0275fac=(()=>{let t;return function(n){return(t||(t=y(e)))(n||e)}})();static \u0275prov=B({token:e,factory:e.\u0275fac})}return e})();var Gt=new Y("CARD_INSTANCE"),Ie=(()=>{class e extends H{$pcCard=T(Gt,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=T(x,{self:!0});_componentStyle=T(Yt);onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}header;subheader;set style(t){Pt(this._style(),t)||(this._style.set(t),this.el?.nativeElement&&t&&Object.keys(t).forEach(i=>{this.el.nativeElement.style[i]=t[i]}))}get style(){return this._style()}styleClass;headerFacet;footerFacet;headerTemplate;titleTemplate;subtitleTemplate;contentTemplate;footerTemplate;_headerTemplate;_titleTemplate;_subtitleTemplate;_contentTemplate;_footerTemplate;_style=It(null);getBlockableElement(){return this.el.nativeElement.children[0]}templates;onAfterContentInit(){this.templates.forEach(t=>{switch(t.getType()){case"header":this._headerTemplate=t.template;break;case"title":this._titleTemplate=t.template;break;case"subtitle":this._subtitleTemplate=t.template;break;case"content":this._contentTemplate=t.template;break;case"footer":this._footerTemplate=t.template;break;default:this._contentTemplate=t.template;break}})}static \u0275fac=(()=>{let t;return function(n){return(t||(t=y(e)))(n||e)}})();static \u0275cmp=b({type:e,selectors:[["p-card"]],contentQueries:function(i,n,r){if(i&1&&(g(r,Lt,5),g(r,Zt,5),g(r,ie,4),g(r,se,4),g(r,ae,4),g(r,re,4),g(r,le,4),g(r,rt,4)),i&2){let l;_(l=C())&&(n.headerFacet=l.first),_(l=C())&&(n.footerFacet=l.first),_(l=C())&&(n.headerTemplate=l.first),_(l=C())&&(n.titleTemplate=l.first),_(l=C())&&(n.subtitleTemplate=l.first),_(l=C())&&(n.contentTemplate=l.first),_(l=C())&&(n.footerTemplate=l.first),_(l=C())&&(n.templates=l)}},hostVars:4,hostBindings:function(i,n){i&2&&(et(n._style()),p(n.cn(n.cx("root"),n.styleClass)))},inputs:{header:"header",subheader:"subheader",style:"style",styleClass:"styleClass"},features:[Z([Yt,{provide:Gt,useExisting:e},{provide:ct,useExisting:e}]),J([x]),v],ngContentSelectors:pe,decls:8,vars:11,consts:[[3,"pBind","class",4,"ngIf"],[3,"pBind"],[4,"ngTemplateOutlet"],[4,"ngIf"]],template:function(i,n){i&1&&(Et(ce),m(0,me,3,4,"div",0),u(1,"div",1),m(2,he,3,5,"div",0)(3,Ce,3,5,"div",0),u(4,"div",1),tt(5),m(6,ye,1,0,"ng-container",2),f(),m(7,ve,3,4,"div",0),f()),i&2&&(s("ngIf",n.headerFacet||n.headerTemplate||n._headerTemplate),a(),p(n.cx("body")),s("pBind",n.ptm("body")),a(),s("ngIf",n.header||n.titleTemplate||n._titleTemplate),a(),s("ngIf",n.subheader||n.subtitleTemplate||n._subtitleTemplate),a(),p(n.cx("content")),s("pBind",n.ptm("content")),a(2),s("ngTemplateOutlet",n.contentTemplate||n._contentTemplate),a(),s("ngIf",n.footerFacet||n.footerTemplate||n._footerTemplate))},dependencies:[z,ot,it,O,pt,x],encapsulation:2,changeDetection:0})}return e})(),Tn=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=K({type:e});static \u0275inj=q({imports:[Ie,O,pt,O,pt]})}return e})();var we=["data-p-icon","exclamation-triangle"],Kt=(()=>{class e extends U{pathId;onInit(){this.pathId="url(#"+A()+")"}static \u0275fac=(()=>{let t;return function(n){return(t||(t=y(e)))(n||e)}})();static \u0275cmp=b({type:e,selectors:[["","data-p-icon","exclamation-triangle"]],features:[v],attrs:we,decls:7,vars:2,consts:[["d","M13.4018 13.1893H0.598161C0.49329 13.189 0.390283 13.1615 0.299143 13.1097C0.208003 13.0578 0.131826 12.9832 0.0780112 12.8932C0.0268539 12.8015 0 12.6982 0 12.5931C0 12.4881 0.0268539 12.3848 0.0780112 12.293L6.47985 1.08982C6.53679 1.00399 6.61408 0.933574 6.70484 0.884867C6.7956 0.836159 6.897 0.810669 7 0.810669C7.103 0.810669 7.2044 0.836159 7.29516 0.884867C7.38592 0.933574 7.46321 1.00399 7.52015 1.08982L13.922 12.293C13.9731 12.3848 14 12.4881 14 12.5931C14 12.6982 13.9731 12.8015 13.922 12.8932C13.8682 12.9832 13.792 13.0578 13.7009 13.1097C13.6097 13.1615 13.5067 13.189 13.4018 13.1893ZM1.63046 11.989H12.3695L7 2.59425L1.63046 11.989Z","fill","currentColor"],["d","M6.99996 8.78801C6.84143 8.78594 6.68997 8.72204 6.57787 8.60993C6.46576 8.49782 6.40186 8.34637 6.39979 8.18784V5.38703C6.39979 5.22786 6.46302 5.0752 6.57557 4.96265C6.68813 4.85009 6.84078 4.78686 6.99996 4.78686C7.15914 4.78686 7.31179 4.85009 7.42435 4.96265C7.5369 5.0752 7.60013 5.22786 7.60013 5.38703V8.18784C7.59806 8.34637 7.53416 8.49782 7.42205 8.60993C7.30995 8.72204 7.15849 8.78594 6.99996 8.78801Z","fill","currentColor"],["d","M6.99996 11.1887C6.84143 11.1866 6.68997 11.1227 6.57787 11.0106C6.46576 10.8985 6.40186 10.7471 6.39979 10.5885V10.1884C6.39979 10.0292 6.46302 9.87658 6.57557 9.76403C6.68813 9.65147 6.84078 9.58824 6.99996 9.58824C7.15914 9.58824 7.31179 9.65147 7.42435 9.76403C7.5369 9.87658 7.60013 10.0292 7.60013 10.1884V10.5885C7.59806 10.7471 7.53416 10.8985 7.42205 11.0106C7.30995 11.1227 7.15849 11.1866 6.99996 11.1887Z","fill","currentColor"],[3,"id"],["width","14","height","14","fill","white"]],template:function(i,n){i&1&&(h(),w(0,"g"),E(1,"path",0)(2,"path",1)(3,"path",2),S(),w(4,"defs")(5,"clipPath",3),E(6,"rect",4),S()()),i&2&&(d("clip-path",n.pathId),a(5),N("id",n.pathId))},encapsulation:2})}return e})();var Se=["data-p-icon","info-circle"],Jt=(()=>{class e extends U{pathId;onInit(){this.pathId="url(#"+A()+")"}static \u0275fac=(()=>{let t;return function(n){return(t||(t=y(e)))(n||e)}})();static \u0275cmp=b({type:e,selectors:[["","data-p-icon","info-circle"]],features:[v],attrs:Se,decls:5,vars:2,consts:[["fill-rule","evenodd","clip-rule","evenodd","d","M3.11101 12.8203C4.26215 13.5895 5.61553 14 7 14C8.85652 14 10.637 13.2625 11.9497 11.9497C13.2625 10.637 14 8.85652 14 7C14 5.61553 13.5895 4.26215 12.8203 3.11101C12.0511 1.95987 10.9579 1.06266 9.67879 0.532846C8.3997 0.00303296 6.99224 -0.13559 5.63437 0.134506C4.2765 0.404603 3.02922 1.07129 2.05026 2.05026C1.07129 3.02922 0.404603 4.2765 0.134506 5.63437C-0.13559 6.99224 0.00303296 8.3997 0.532846 9.67879C1.06266 10.9579 1.95987 12.0511 3.11101 12.8203ZM3.75918 2.14976C4.71846 1.50879 5.84628 1.16667 7 1.16667C8.5471 1.16667 10.0308 1.78125 11.1248 2.87521C12.2188 3.96918 12.8333 5.45291 12.8333 7C12.8333 8.15373 12.4912 9.28154 11.8502 10.2408C11.2093 11.2001 10.2982 11.9478 9.23232 12.3893C8.16642 12.8308 6.99353 12.9463 5.86198 12.7212C4.73042 12.4962 3.69102 11.9406 2.87521 11.1248C2.05941 10.309 1.50384 9.26958 1.27876 8.13803C1.05367 7.00647 1.16919 5.83358 1.61071 4.76768C2.05222 3.70178 2.79989 2.79074 3.75918 2.14976ZM7.00002 4.8611C6.84594 4.85908 6.69873 4.79698 6.58977 4.68801C6.48081 4.57905 6.4187 4.43185 6.41669 4.27776V3.88888C6.41669 3.73417 6.47815 3.58579 6.58754 3.4764C6.69694 3.367 6.84531 3.30554 7.00002 3.30554C7.15473 3.30554 7.3031 3.367 7.4125 3.4764C7.52189 3.58579 7.58335 3.73417 7.58335 3.88888V4.27776C7.58134 4.43185 7.51923 4.57905 7.41027 4.68801C7.30131 4.79698 7.1541 4.85908 7.00002 4.8611ZM7.00002 10.6945C6.84594 10.6925 6.69873 10.6304 6.58977 10.5214C6.48081 10.4124 6.4187 10.2652 6.41669 10.1111V6.22225C6.41669 6.06754 6.47815 5.91917 6.58754 5.80977C6.69694 5.70037 6.84531 5.63892 7.00002 5.63892C7.15473 5.63892 7.3031 5.70037 7.4125 5.80977C7.52189 5.91917 7.58335 6.06754 7.58335 6.22225V10.1111C7.58134 10.2652 7.51923 10.4124 7.41027 10.5214C7.30131 10.6304 7.1541 10.6925 7.00002 10.6945Z","fill","currentColor"],[3,"id"],["width","14","height","14","fill","white"]],template:function(i,n){i&1&&(h(),w(0,"g"),E(1,"path",0),S(),w(2,"defs")(3,"clipPath",1),E(4,"rect",2),S()()),i&2&&(d("clip-path",n.pathId),a(3),N("id",n.pathId))},encapsulation:2})}return e})();var Ee=["data-p-icon","times-circle"],Xt=(()=>{class e extends U{pathId;onInit(){this.pathId="url(#"+A()+")"}static \u0275fac=(()=>{let t;return function(n){return(t||(t=y(e)))(n||e)}})();static \u0275cmp=b({type:e,selectors:[["","data-p-icon","times-circle"]],features:[v],attrs:Ee,decls:5,vars:2,consts:[["fill-rule","evenodd","clip-rule","evenodd","d","M7 14C5.61553 14 4.26215 13.5895 3.11101 12.8203C1.95987 12.0511 1.06266 10.9579 0.532846 9.67879C0.00303296 8.3997 -0.13559 6.99224 0.134506 5.63437C0.404603 4.2765 1.07129 3.02922 2.05026 2.05026C3.02922 1.07129 4.2765 0.404603 5.63437 0.134506C6.99224 -0.13559 8.3997 0.00303296 9.67879 0.532846C10.9579 1.06266 12.0511 1.95987 12.8203 3.11101C13.5895 4.26215 14 5.61553 14 7C14 8.85652 13.2625 10.637 11.9497 11.9497C10.637 13.2625 8.85652 14 7 14ZM7 1.16667C5.84628 1.16667 4.71846 1.50879 3.75918 2.14976C2.79989 2.79074 2.05222 3.70178 1.61071 4.76768C1.16919 5.83358 1.05367 7.00647 1.27876 8.13803C1.50384 9.26958 2.05941 10.309 2.87521 11.1248C3.69102 11.9406 4.73042 12.4962 5.86198 12.7212C6.99353 12.9463 8.16642 12.8308 9.23232 12.3893C10.2982 11.9478 11.2093 11.2001 11.8502 10.2408C12.4912 9.28154 12.8333 8.15373 12.8333 7C12.8333 5.45291 12.2188 3.96918 11.1248 2.87521C10.0308 1.78125 8.5471 1.16667 7 1.16667ZM4.66662 9.91668C4.58998 9.91704 4.51404 9.90209 4.44325 9.87271C4.37246 9.84333 4.30826 9.8001 4.2544 9.74557C4.14516 9.6362 4.0838 9.48793 4.0838 9.33335C4.0838 9.17876 4.14516 9.0305 4.2544 8.92113L6.17553 7L4.25443 5.07891C4.15139 4.96832 4.09529 4.82207 4.09796 4.67094C4.10063 4.51982 4.16185 4.37563 4.26872 4.26876C4.3756 4.16188 4.51979 4.10066 4.67091 4.09799C4.82204 4.09532 4.96829 4.15142 5.07887 4.25446L6.99997 6.17556L8.92106 4.25446C9.03164 4.15142 9.1779 4.09532 9.32903 4.09799C9.48015 4.10066 9.62434 4.16188 9.73121 4.26876C9.83809 4.37563 9.89931 4.51982 9.90198 4.67094C9.90464 4.82207 9.84855 4.96832 9.74551 5.07891L7.82441 7L9.74554 8.92113C9.85478 9.0305 9.91614 9.17876 9.91614 9.33335C9.91614 9.48793 9.85478 9.6362 9.74554 9.74557C9.69168 9.8001 9.62748 9.84333 9.55669 9.87271C9.4859 9.90209 9.40996 9.91704 9.33332 9.91668C9.25668 9.91704 9.18073 9.90209 9.10995 9.87271C9.03916 9.84333 8.97495 9.8001 8.9211 9.74557L6.99997 7.82444L5.07884 9.74557C5.02499 9.8001 4.96078 9.84333 4.88999 9.87271C4.81921 9.90209 4.74326 9.91704 4.66662 9.91668Z","fill","currentColor"],[3,"id"],["width","14","height","14","fill","white"]],template:function(i,n){i&1&&(h(),w(0,"g"),E(1,"path",0),S(),w(2,"defs")(3,"clipPath",1),E(4,"rect",2),S()()),i&2&&(d("clip-path",n.pathId),a(3),N("id",n.pathId))},encapsulation:2})}return e})();var Wt=`
    .p-toast {
        width: dt('toast.width');
        white-space: pre-line;
        word-break: break-word;
    }

    .p-toast-message {
        margin: 0 0 1rem 0;
    }

    .p-toast-message-icon {
        flex-shrink: 0;
        font-size: dt('toast.icon.size');
        width: dt('toast.icon.size');
        height: dt('toast.icon.size');
    }

    .p-toast-message-content {
        display: flex;
        align-items: flex-start;
        padding: dt('toast.content.padding');
        gap: dt('toast.content.gap');
    }

    .p-toast-message-text {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: dt('toast.text.gap');
    }

    .p-toast-summary {
        font-weight: dt('toast.summary.font.weight');
        font-size: dt('toast.summary.font.size');
    }

    .p-toast-detail {
        font-weight: dt('toast.detail.font.weight');
        font-size: dt('toast.detail.font.size');
    }

    .p-toast-close-button {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        cursor: pointer;
        background: transparent;
        transition:
            background dt('toast.transition.duration'),
            color dt('toast.transition.duration'),
            outline-color dt('toast.transition.duration'),
            box-shadow dt('toast.transition.duration');
        outline-color: transparent;
        color: inherit;
        width: dt('toast.close.button.width');
        height: dt('toast.close.button.height');
        border-radius: dt('toast.close.button.border.radius');
        margin: -25% 0 0 0;
        right: -25%;
        padding: 0;
        border: none;
        user-select: none;
    }

    .p-toast-close-button:dir(rtl) {
        margin: -25% 0 0 auto;
        left: -25%;
        right: auto;
    }

    .p-toast-message-info,
    .p-toast-message-success,
    .p-toast-message-warn,
    .p-toast-message-error,
    .p-toast-message-secondary,
    .p-toast-message-contrast {
        border-width: dt('toast.border.width');
        border-style: solid;
        backdrop-filter: blur(dt('toast.blur'));
        border-radius: dt('toast.border.radius');
    }

    .p-toast-close-icon {
        font-size: dt('toast.close.icon.size');
        width: dt('toast.close.icon.size');
        height: dt('toast.close.icon.size');
    }

    .p-toast-close-button:focus-visible {
        outline-width: dt('focus.ring.width');
        outline-style: dt('focus.ring.style');
        outline-offset: dt('focus.ring.offset');
    }

    .p-toast-message-info {
        background: dt('toast.info.background');
        border-color: dt('toast.info.border.color');
        color: dt('toast.info.color');
        box-shadow: dt('toast.info.shadow');
    }

    .p-toast-message-info .p-toast-detail {
        color: dt('toast.info.detail.color');
    }

    .p-toast-message-info .p-toast-close-button:focus-visible {
        outline-color: dt('toast.info.close.button.focus.ring.color');
        box-shadow: dt('toast.info.close.button.focus.ring.shadow');
    }

    .p-toast-message-info .p-toast-close-button:hover {
        background: dt('toast.info.close.button.hover.background');
    }

    .p-toast-message-success {
        background: dt('toast.success.background');
        border-color: dt('toast.success.border.color');
        color: dt('toast.success.color');
        box-shadow: dt('toast.success.shadow');
    }

    .p-toast-message-success .p-toast-detail {
        color: dt('toast.success.detail.color');
    }

    .p-toast-message-success .p-toast-close-button:focus-visible {
        outline-color: dt('toast.success.close.button.focus.ring.color');
        box-shadow: dt('toast.success.close.button.focus.ring.shadow');
    }

    .p-toast-message-success .p-toast-close-button:hover {
        background: dt('toast.success.close.button.hover.background');
    }

    .p-toast-message-warn {
        background: dt('toast.warn.background');
        border-color: dt('toast.warn.border.color');
        color: dt('toast.warn.color');
        box-shadow: dt('toast.warn.shadow');
    }

    .p-toast-message-warn .p-toast-detail {
        color: dt('toast.warn.detail.color');
    }

    .p-toast-message-warn .p-toast-close-button:focus-visible {
        outline-color: dt('toast.warn.close.button.focus.ring.color');
        box-shadow: dt('toast.warn.close.button.focus.ring.shadow');
    }

    .p-toast-message-warn .p-toast-close-button:hover {
        background: dt('toast.warn.close.button.hover.background');
    }

    .p-toast-message-error {
        background: dt('toast.error.background');
        border-color: dt('toast.error.border.color');
        color: dt('toast.error.color');
        box-shadow: dt('toast.error.shadow');
    }

    .p-toast-message-error .p-toast-detail {
        color: dt('toast.error.detail.color');
    }

    .p-toast-message-error .p-toast-close-button:focus-visible {
        outline-color: dt('toast.error.close.button.focus.ring.color');
        box-shadow: dt('toast.error.close.button.focus.ring.shadow');
    }

    .p-toast-message-error .p-toast-close-button:hover {
        background: dt('toast.error.close.button.hover.background');
    }

    .p-toast-message-secondary {
        background: dt('toast.secondary.background');
        border-color: dt('toast.secondary.border.color');
        color: dt('toast.secondary.color');
        box-shadow: dt('toast.secondary.shadow');
    }

    .p-toast-message-secondary .p-toast-detail {
        color: dt('toast.secondary.detail.color');
    }

    .p-toast-message-secondary .p-toast-close-button:focus-visible {
        outline-color: dt('toast.secondary.close.button.focus.ring.color');
        box-shadow: dt('toast.secondary.close.button.focus.ring.shadow');
    }

    .p-toast-message-secondary .p-toast-close-button:hover {
        background: dt('toast.secondary.close.button.hover.background');
    }

    .p-toast-message-contrast {
        background: dt('toast.contrast.background');
        border-color: dt('toast.contrast.border.color');
        color: dt('toast.contrast.color');
        box-shadow: dt('toast.contrast.shadow');
    }

    .p-toast-message-contrast .p-toast-detail {
        color: dt('toast.contrast.detail.color');
    }

    .p-toast-message-contrast .p-toast-close-button:focus-visible {
        outline-color: dt('toast.contrast.close.button.focus.ring.color');
        box-shadow: dt('toast.contrast.close.button.focus.ring.shadow');
    }

    .p-toast-message-contrast .p-toast-close-button:hover {
        background: dt('toast.contrast.close.button.hover.background');
    }

    .p-toast-top-center {
        transform: translateX(-50%);
    }

    .p-toast-bottom-center {
        transform: translateX(-50%);
    }

    .p-toast-center {
        min-width: 20vw;
        transform: translate(-50%, -50%);
    }

    .p-toast-message-enter-from {
        opacity: 0;
        transform: translateY(50%);
    }

    .p-toast-message-leave-from {
        max-height: 1000px;
    }

    .p-toast .p-toast-message.p-toast-message-leave-to {
        max-height: 0;
        opacity: 0;
        margin-bottom: 0;
        overflow: hidden;
    }

    .p-toast-message-enter-active {
        transition:
            transform 0.3s,
            opacity 0.3s;
    }

    .p-toast-message-leave-active {
        transition:
            max-height 0.45s cubic-bezier(0, 1, 0, 1),
            opacity 0.3s,
            margin-bottom 0.3s;
    }
`;var ke=(e,o,t,i)=>({showTransformParams:e,hideTransformParams:o,showTransitionParams:t,hideTransitionParams:i}),Oe=e=>({value:"visible",params:e}),Be=(e,o)=>({$implicit:e,closeFn:o}),De=e=>({$implicit:e});function Me(e,o){e&1&&k(0)}function Ae(e,o){if(e&1&&m(0,Me,1,0,"ng-container",3),e&2){let t=c();s("ngTemplateOutlet",t.headlessTemplate)("ngTemplateOutletContext",Ot(2,Be,t.message,t.onCloseIconClick))}}function Fe(e,o){if(e&1&&I(0,"span",4),e&2){let t=c(3);p(t.cn(t.cx("messageIcon"),t.message==null?null:t.message.icon)),s("pBind",t.ptm("messageIcon"))}}function Re(e,o){if(e&1&&(h(),I(0,"svg",11)),e&2){let t=c(4);p(t.cx("messageIcon")),s("pBind",t.ptm("messageIcon")),d("aria-hidden",!0)}}function Ne(e,o){if(e&1&&(h(),I(0,"svg",12)),e&2){let t=c(4);p(t.cx("messageIcon")),s("pBind",t.ptm("messageIcon")),d("aria-hidden",!0)}}function Ve(e,o){if(e&1&&(h(),I(0,"svg",13)),e&2){let t=c(4);p(t.cx("messageIcon")),s("pBind",t.ptm("messageIcon")),d("aria-hidden",!0)}}function Ue(e,o){if(e&1&&(h(),I(0,"svg",14)),e&2){let t=c(4);p(t.cx("messageIcon")),s("pBind",t.ptm("messageIcon")),d("aria-hidden",!0)}}function je(e,o){if(e&1&&(h(),I(0,"svg",12)),e&2){let t=c(4);p(t.cx("messageIcon")),s("pBind",t.ptm("messageIcon")),d("aria-hidden",!0)}}function Pe(e,o){if(e&1&&F(0,Re,1,4,":svg:svg",7)(1,Ne,1,4,":svg:svg",8)(2,Ve,1,4,":svg:svg",9)(3,Ue,1,4,":svg:svg",10)(4,je,1,4,":svg:svg",8),e&2){let t,i=c(3);R((t=i.message.severity)==="success"?0:t==="info"?1:t==="error"?2:t==="warn"?3:4)}}function Qe(e,o){if(e&1&&(P(0),F(1,Fe,1,3,"span",2)(2,Pe,5,1),u(3,"div",6)(4,"div",6),V(5),f(),u(6,"div",6),V(7),f()(),Q()),e&2){let t=c(2);a(),R(t.message.icon?1:2),a(2),s("pBind",t.ptm("messageText"))("ngClass",t.cx("messageText")),a(),s("pBind",t.ptm("summary"))("ngClass",t.cx("summary")),a(),kt(" ",t.message.summary," "),a(),s("pBind",t.ptm("detail"))("ngClass",t.cx("detail")),a(),L(t.message.detail)}}function Le(e,o){e&1&&k(0)}function Ze(e,o){if(e&1&&I(0,"span",4),e&2){let t=c(4);p(t.cn(t.cx("closeIcon"),t.message==null?null:t.message.closeIcon)),s("pBind",t.ptm("closeIcon"))}}function $e(e,o){if(e&1&&m(0,Ze,1,3,"span",17),e&2){let t=c(3);s("ngIf",t.message.closeIcon)}}function ze(e,o){if(e&1&&(h(),I(0,"svg",18)),e&2){let t=c(3);p(t.cx("closeIcon")),s("pBind",t.ptm("closeIcon")),d("aria-hidden",!0)}}function He(e,o){if(e&1){let t=X();u(0,"div")(1,"button",15),W("click",function(n){D(t);let r=c(2);return M(r.onCloseIconClick(n))})("keydown.enter",function(n){D(t);let r=c(2);return M(r.onCloseIconClick(n))}),F(2,$e,1,1,"span",2)(3,ze,1,4,":svg:svg",16),f()()}if(e&2){let t=c(2);a(),s("pBind",t.ptm("closeButton")),d("class",t.cx("closeButton"))("aria-label",t.closeAriaLabel),a(),R(t.message.closeIcon?2:3)}}function qe(e,o){if(e&1&&(u(0,"div",4),m(1,Qe,8,9,"ng-container",5)(2,Le,1,0,"ng-container",3),F(3,He,4,4,"div"),f()),e&2){let t=c();p(t.cn(t.cx("messageContent"),t.message==null?null:t.message.contentStyleClass)),s("pBind",t.ptm("messageContent")),a(),s("ngIf",!t.template),a(),s("ngTemplateOutlet",t.template)("ngTemplateOutletContext",ft(7,De,t.message)),a(),R((t.message==null?null:t.message.closable)!==!1?3:-1)}}var Ye=["message"],Ge=["headless"];function Ke(e,o){if(e&1){let t=X();u(0,"p-toastItem",1),W("onClose",function(n){D(t);let r=c();return M(r.onMessageClose(n))})("@toastAnimation.start",function(n){D(t);let r=c();return M(r.onAnimationStart(n))})("@toastAnimation.done",function(n){D(t);let r=c();return M(r.onAnimationEnd(n))}),f()}if(e&2){let t=o.$implicit,i=o.index,n=c();s("message",t)("index",i)("life",n.life)("template",n.template||n._template)("headlessTemplate",n.headlessTemplate||n._headlessTemplate)("@toastAnimation",void 0)("showTransformOptions",n.showTransformOptions)("hideTransformOptions",n.hideTransformOptions)("showTransitionOptions",n.showTransitionOptions)("hideTransitionOptions",n.hideTransitionOptions)("pt",n.pt)}}var Je={root:({instance:e})=>{let{_position:o}=e;return{position:"fixed",top:o==="top-right"||o==="top-left"||o==="top-center"?"20px":o==="center"?"50%":null,right:(o==="top-right"||o==="bottom-right")&&"20px",bottom:(o==="bottom-left"||o==="bottom-right"||o==="bottom-center")&&"20px",left:o==="top-left"||o==="bottom-left"?"20px":o==="center"||o==="top-center"||o==="bottom-center"?"50%":null}}},Xe={root:({instance:e})=>["p-toast p-component",`p-toast-${e._position}`],message:({instance:e})=>({"p-toast-message":!0,"p-toast-message-info":e.message.severity==="info"||e.message.severity===void 0,"p-toast-message-warn":e.message.severity==="warn","p-toast-message-error":e.message.severity==="error","p-toast-message-success":e.message.severity==="success","p-toast-message-secondary":e.message.severity==="secondary","p-toast-message-contrast":e.message.severity==="contrast"}),messageContent:"p-toast-message-content",messageIcon:({instance:e})=>({"p-toast-message-icon":!0,[`pi ${e.message.icon}`]:!!e.message.icon}),messageText:"p-toast-message-text",summary:"p-toast-summary",detail:"p-toast-detail",closeButton:"p-toast-close-button",closeIcon:({instance:e})=>({"p-toast-close-icon":!0,[`pi ${e.message.closeIcon}`]:!!e.message.closeIcon})},mt=(()=>{class e extends lt{name="toast";style=Wt;classes=Xe;inlineStyles=Je;static \u0275fac=(()=>{let t;return function(n){return(t||(t=y(e)))(n||e)}})();static \u0275prov=B({token:e,factory:e.\u0275fac})}return e})();var te=new Y("TOAST_INSTANCE"),We=(()=>{class e extends H{zone;message;index;life;template;headlessTemplate;showTransformOptions;hideTransformOptions;showTransitionOptions;hideTransitionOptions;onClose=new ut;_componentStyle=T(mt);timeout;constructor(t){super(),this.zone=t}onAfterViewInit(){this.initTimeout()}initTimeout(){this.message?.sticky||(this.clearTimeout(),this.zone.runOutsideAngular(()=>{this.timeout=setTimeout(()=>{this.onClose.emit({index:this.index,message:this.message})},this.message?.life||this.life||3e3)}))}clearTimeout(){this.timeout&&(clearTimeout(this.timeout),this.timeout=null)}onMouseEnter(){this.clearTimeout()}onMouseLeave(){this.initTimeout()}onCloseIconClick=t=>{this.clearTimeout(),this.onClose.emit({index:this.index,message:this.message}),t.preventDefault()};get closeAriaLabel(){return this.config.translation.aria?this.config.translation.aria.close:void 0}onDestroy(){this.clearTimeout()}static \u0275fac=function(i){return new(i||e)(St(wt))};static \u0275cmp=b({type:e,selectors:[["p-toastItem"]],inputs:{message:"message",index:[2,"index","index",$],life:[2,"life","life",$],template:"template",headlessTemplate:"headlessTemplate",showTransformOptions:"showTransformOptions",hideTransformOptions:"hideTransformOptions",showTransitionOptions:"showTransitionOptions",hideTransitionOptions:"hideTransitionOptions"},outputs:{onClose:"onClose"},features:[Z([mt]),v],decls:4,vars:13,consts:[["container",""],["role","alert","aria-live","assertive","aria-atomic","true",3,"mouseenter","mouseleave","pBind"],[3,"pBind","class"],[4,"ngTemplateOutlet","ngTemplateOutletContext"],[3,"pBind"],[4,"ngIf"],[3,"pBind","ngClass"],["data-p-icon","check",3,"pBind","class"],["data-p-icon","info-circle",3,"pBind","class"],["data-p-icon","times-circle",3,"pBind","class"],["data-p-icon","exclamation-triangle",3,"pBind","class"],["data-p-icon","check",3,"pBind"],["data-p-icon","info-circle",3,"pBind"],["data-p-icon","times-circle",3,"pBind"],["data-p-icon","exclamation-triangle",3,"pBind"],["type","button","autofocus","",3,"click","keydown.enter","pBind"],["data-p-icon","times",3,"pBind","class"],[3,"pBind","class",4,"ngIf"],["data-p-icon","times",3,"pBind"]],template:function(i,n){if(i&1){let r=X();u(0,"div",1,0),W("mouseenter",function(){return D(r),M(n.onMouseEnter())})("mouseleave",function(){return D(r),M(n.onMouseLeave())}),F(2,Ae,1,5,"ng-container")(3,qe,4,9,"div",2),f()}i&2&&(p(n.cn(n.cx("message"),n.message==null?null:n.message.styleClass)),s("pBind",n.ptm("message"))("@messageState",ft(11,Oe,Bt(6,ke,n.showTransformOptions,n.hideTransformOptions,n.showTransitionOptions,n.hideTransitionOptions))),d("id",n.message==null?null:n.message.id),a(2),R(n.headlessTemplate?2:3))},dependencies:[z,Dt,ot,it,$t,Kt,Jt,zt,Xt,O,x],encapsulation:2,data:{animation:[ht("messageState",[Nt("visible",st({transform:"translateY(0)",opacity:1})),at("void => *",[st({transform:"{{showTransformParams}}",opacity:0}),gt("{{showTransitionParams}}")]),at("* => void",[gt("{{hideTransitionParams}}",st({height:0,opacity:0,transform:"{{hideTransformParams}}"}))])])]},changeDetection:0})}return e})(),tn=(()=>{class e extends H{$pcToast=T(te,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=T(x,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}key;autoZIndex=!0;baseZIndex=0;life=3e3;styleClass;get position(){return this._position}set position(t){this._position=t,this.cd.markForCheck()}preventOpenDuplicates=!1;preventDuplicates=!1;showTransformOptions="translateY(100%)";hideTransformOptions="translateY(-100%)";showTransitionOptions="300ms ease-out";hideTransitionOptions="250ms ease-in";breakpoints;onClose=new ut;template;headlessTemplate;messageSubscription;clearSubscription;messages;messagesArchieve;_position="top-right";messageService=T(Qt);_componentStyle=T(mt);styleElement;id=A("pn_id_");templates;constructor(){super()}onInit(){this.messageSubscription=this.messageService.messageObserver.subscribe(t=>{if(t)if(Array.isArray(t)){let i=t.filter(n=>this.canAdd(n));this.add(i)}else this.canAdd(t)&&this.add([t])}),this.clearSubscription=this.messageService.clearObserver.subscribe(t=>{t?this.key===t&&(this.messages=null):this.messages=null,this.cd.markForCheck()})}_template;_headlessTemplate;onAfterContentInit(){this.templates?.forEach(t=>{switch(t.getType()){case"message":this._template=t.template;break;case"headless":this._headlessTemplate=t.template;break;default:this._template=t.template;break}})}onAfterViewInit(){this.breakpoints&&this.createStyle()}add(t){this.messages=this.messages?[...this.messages,...t]:[...t],this.preventDuplicates&&(this.messagesArchieve=this.messagesArchieve?[...this.messagesArchieve,...t]:[...t]),this.cd.markForCheck()}canAdd(t){let i=this.key===t.key;return i&&this.preventOpenDuplicates&&(i=!this.containsMessage(this.messages,t)),i&&this.preventDuplicates&&(i=!this.containsMessage(this.messagesArchieve,t)),i}containsMessage(t,i){return t?t.find(n=>n.summary===i.summary&&n.detail==i.detail&&n.severity===i.severity)!=null:!1}onMessageClose(t){this.messages?.splice(t.index,1),this.onClose.emit({message:t.message}),this.cd.detectChanges()}onAnimationStart(t){t.fromState==="void"&&(this.renderer.setAttribute(this.el?.nativeElement,this.id,""),this.autoZIndex&&this.el?.nativeElement.style.zIndex===""&&dt.set("modal",this.el?.nativeElement,this.baseZIndex||this.config.zIndex.modal))}onAnimationEnd(t){t.toState==="void"&&this.autoZIndex&&jt(this.messages)&&dt.clear(this.el?.nativeElement)}createStyle(){if(!this.styleElement){this.styleElement=this.renderer.createElement("style"),this.styleElement.type="text/css",_t(this.styleElement,"nonce",this.config?.csp()?.nonce),this.renderer.appendChild(this.document.head,this.styleElement);let t="";for(let i in this.breakpoints){let n="";for(let r in this.breakpoints[i])n+=r+":"+this.breakpoints[i][r]+" !important;";t+=`
                    @media screen and (max-width: ${i}) {
                        .p-toast[${this.id}] {
                           ${n}
                        }
                    }
                `}this.renderer.setProperty(this.styleElement,"innerHTML",t),_t(this.styleElement,"nonce",this.config?.csp()?.nonce)}}destroyStyle(){this.styleElement&&(this.renderer.removeChild(this.document.head,this.styleElement),this.styleElement=null)}onDestroy(){this.messageSubscription&&this.messageSubscription.unsubscribe(),this.el&&this.autoZIndex&&dt.clear(this.el.nativeElement),this.clearSubscription&&this.clearSubscription.unsubscribe(),this.destroyStyle()}static \u0275fac=function(i){return new(i||e)};static \u0275cmp=b({type:e,selectors:[["p-toast"]],contentQueries:function(i,n,r){if(i&1&&(g(r,Ye,5),g(r,Ge,5),g(r,rt,4)),i&2){let l;_(l=C())&&(n.template=l.first),_(l=C())&&(n.headlessTemplate=l.first),_(l=C())&&(n.templates=l)}},hostVars:4,hostBindings:function(i,n){i&2&&(et(n.sx("root")),p(n.cn(n.cx("root"),n.styleClass)))},inputs:{key:"key",autoZIndex:[2,"autoZIndex","autoZIndex",nt],baseZIndex:[2,"baseZIndex","baseZIndex",$],life:[2,"life","life",$],styleClass:"styleClass",position:"position",preventOpenDuplicates:[2,"preventOpenDuplicates","preventOpenDuplicates",nt],preventDuplicates:[2,"preventDuplicates","preventDuplicates",nt],showTransformOptions:"showTransformOptions",hideTransformOptions:"hideTransformOptions",showTransitionOptions:"showTransitionOptions",hideTransitionOptions:"hideTransitionOptions",breakpoints:"breakpoints"},outputs:{onClose:"onClose"},features:[Z([mt,{provide:te,useExisting:e},{provide:ct,useExisting:e}]),J([x]),v],decls:1,vars:1,consts:[[3,"message","index","life","template","headlessTemplate","showTransformOptions","hideTransformOptions","showTransitionOptions","hideTransitionOptions","pt","onClose",4,"ngFor","ngForOf"],[3,"onClose","message","index","life","template","headlessTemplate","showTransformOptions","hideTransformOptions","showTransitionOptions","hideTransitionOptions","pt"]],template:function(i,n){i&1&&m(0,Ke,1,11,"p-toastItem",0),i&2&&s("ngForOf",n.messages)},dependencies:[z,Mt,We,O],encapsulation:2,data:{animation:[ht("toastAnimation",[at(":enter, :leave",[Ut("@*",Vt())])])]},changeDetection:0})}return e})(),eo=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=K({type:e});static \u0275inj=q({imports:[tn,O,O]})}return e})();var ee=class e{constructor(o){this.http=o}baseUrl=Ct.BASE_URL;dbName=Ct.DB_NAME;dbUrl=`${this.baseUrl}/${this.dbName}`;getDocument(o){let t=`${this.dbUrl}/${o}`;return this.http.get(t,{withCredentials:!0})}putDocument(o,t){let i=`${this.dbUrl}/${o}`;return this.http.put(i,t,{withCredentials:!0})}login(o,t){let i=`${this.baseUrl}/_session`,n={name:o,password:t},r=new At({"Content-Type":"application/json"});return this.http.post(i,n,{headers:r,withCredentials:!0,observe:"response"}).pipe(xt(l=>{let yt=l.headers.get("Set-Cookie"),bt=null;if(yt){let Tt=yt.match(/Expires=([^;]+)/);Tt&&(bt=new Date(Tt[1]).getTime())}let vt=l.body;return vt.expiresAt=bt,vt}))}getSession(){let o=`${this.baseUrl}/_session`;return this.http.get(o,{withCredentials:!0})}logout(){let o=`${this.baseUrl}/_session`;return this.http.delete(o,{withCredentials:!0})}static \u0275fac=function(t){return new(t||e)(G(Ft))};static \u0275prov=B({token:e,factory:e.\u0275fac,providedIn:"root"})};export{Ht as a,Ie as b,Tn as c,tn as d,eo as e,ee as f};
