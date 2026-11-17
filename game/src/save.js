const KEY='vice-horizon-save';export function save(state){try{localStorage.setItem(KEY,JSON.stringify({money:state.player.money,x:state.player.x,y:state.player.y,index:state.missions.index,ammo:state.player.ammo}))}catch{}}
export function load(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
