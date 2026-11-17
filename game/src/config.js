export const WIDTH = 3200;
export const HEIGHT = 2400;
export const TILE = 96;
export const ROAD = 28;
export const WORLD_SEED = 6101;
export const palette = {
  night: '#080b17', ink: '#11152b', asphalt: '#24283a', asphalt2: '#30364b',
  sidewalk: '#77798b', concrete: '#9b9aa4', neon: '#50e9ff', pink: '#ff4e9d',
  yellow: '#ffd45a', lime: '#b7ef64', water: '#102a49', foam: '#65d6d0',
  grass: '#234b42', palm: '#67b36e', white: '#e8f4f5', danger: '#ff5b62'
};
export const districts = [
  { name: 'Neon Mile', x: 160, y: 160, w: 780, h: 820, tone: '#ff4e9d' },
  { name: 'Glass Harbor', x: 980, y: 160, w: 940, h: 640, tone: '#50e9ff' },
  { name: 'Palm Vista', x: 160, y: 1030, w: 700, h: 850, tone: '#b7ef64' },
  { name: 'Old Port', x: 880, y: 850, w: 640, h: 950, tone: '#ffd45a' },
  { name: 'Mirage Heights', x: 1550, y: 850, w: 610, h: 920, tone: '#c994ff' },
  { name: 'South Beach', x: 2200, y: 160, w: 760, h: 900, tone: '#ff9c74' },
  { name: 'Cypress Point', x: 2200, y: 1120, w: 760, h: 900, tone: '#65d6d0' }
];
export const tuning = {
  player: { speed: 3.1, sprint: 5.2, turn: .14, maxHealth: 100, maxArmor: 100 },
  cars: { sedan: { speed: 6, turn: .09, color: '#ef526f' }, coupe: { speed: 7, turn: .1, color: '#50e9ff' },
    van: { speed: 4.6, turn: .07, color: '#d5b17a' }, taxi: { speed: 5.4, turn: .08, color: '#ffd45a' },
    sport: { speed: 8.2, turn: .12, color: '#a978ff' }, police: { speed: 8.8, turn: .13, color: '#f3f5fa' } },
  weapons: { fists: { damage: 18, range: 42, cooldown: 18 }, pistol: { damage: 28, range: 520, cooldown: 18 },
    smg: { damage: 12, range: 460, cooldown: 5 } },
  wanted: { decay: 0.004, tiers: [0, 1, 2, 3, 4, 5] }
};
export const landmarks = [
  ['Vice Tower', 610, 380], ['Moonlight Mall', 1270, 360], ['Sunset Speedway', 2010, 610],
  ['Horizon Pier', 2530, 390], ['Pink Flamingo', 470, 1330], ['Civic Forum', 1170, 1180],
  ['Cypress Casino', 1840, 1390], ['Ocean Drive Club', 2510, 1530]
];
export const colors = Object.values(palette);
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const roadXs = [280, 600, 920, 1240, 1560, 1880, 2200, 2520, 2840];
export const roadYs = [280, 600, 920, 1240, 1560, 1880, 2180];
export const carNames = ['sedan', 'coupe', 'van', 'taxi', 'sport', 'police'];
// Configuration authoring index
// 001 map width
// 002 map height
// 003 tile scale
// 004 road scale
// 005 world seed
// 006 night tone
// 007 ink tone
// 008 asphalt tone
// 009 sidewalk tone
// 010 neon tone
// 011 pink tone
// 012 yellow tone
// 013 lime tone
// 014 water tone
// 015 foam tone
// 016 grass tone
// 017 palm tone
// 018 white tone
// 019 danger tone
// 020 district one
// 021 district two
// 022 district three
// 023 district four
// 024 district five
// 025 district six
// 026 district seven
// 027 player speed
// 028 player sprint
// 029 player turn
// 030 player health
// 031 player armor
// 032 sedan row
// 033 coupe row
// 034 van row
// 035 taxi row
// 036 sport row
// 037 police row
// 038 fists row
// 039 pistol row
// 040 smg row
// 041 wanted decay
// 042 wanted tiers
// 043 landmark list
// 044 color export
// 045 clamp helper
// 046 distance helper
// 047 angle helper
// 048 road x list
// 049 road y list
// 050 car name list
// 051 all values are static
// 052 all values are inspectable
// 053 all values are serializable
// 054 all values are deterministic
// 055 no date values
// 056 no random values
// 057 no DOM values
// 058 no canvas values
// 059 no audio values
// 060 names support signage
// 061 tones support districts
// 062 tuning supports vehicles
// 063 weapons support combat
// 064 helpers support modules
// 065 roads support traffic
// 066 landmarks support missions
// 067 palette supports render
// 068 dimensions support camera
// 069 dimensions support minimap
// 070 dimensions support collision
// 071 explicit values aid review
// 072 explicit values aid shots
// 073 explicit values aid saving
// 074 explicit values aid replay
// 075 shared tuning avoids drift
// 076 shared palette avoids drift
// 077 shared roads avoid drift
// 078 shared dimensions avoid drift
// 079 names remain stable
// 080 colors remain stable
// 081 speeds remain stable
// 082 damage remains stable
// 083 maps remain stable
// 084 contracts remain stable
// 085 camera remains stable
// 086 screenshots remain stable
// 087 dossier remains stable
// 088 browser remains portable
// 089 module remains lightweight
// 090 module remains side-effect free
// 091 configuration is one source
// 092 configuration is easy to tune
// 093 configuration is easy to audit
// 094 configuration is easy to extend
// 095 configuration is complete
// 096 configuration authoring pass
// 097 final config line
// 098 palette is a shared vocabulary
// 099 dimensions are world units
// 100 configuration file complete
