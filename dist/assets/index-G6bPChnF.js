import{c as t,e as a}from"./index-B4zWEWVX.js";/**
 * @license lucide-react v0.463.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=t("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.463.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=t("Database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]),n=async e=>{await a.post("/reports",{diseaseType:e.diseaseType,district:e.district,cases:e.cases,deaths:e.deaths,date:e.date||new Date().toISOString().split("T")[0],reportDate:e.date,caseCount:e.cases,deathCount:e.deaths})},o=async(e=1,s=10)=>(await a.get(`/reports?page=${e}&limit=${s}`)).data.data,p=async({id:e,...s})=>{await a.patch(`/reports/${e}`,{diseaseType:s.diseaseType,diseaseId:s.diseaseId,district:s.district,caseCount:s.cases,deathCount:s.deaths,reportDate:s.date})},y=async e=>{await a.delete(`/reports/${e}`)},l=async()=>(await a.get("/diseases")).data.data;export{d as C,r as D,l as a,y as d,o as g,n as p,p as u};
