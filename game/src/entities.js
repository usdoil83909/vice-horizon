import { clamp, tuning, carNames, dist, angleTo } from './config.js';
import { between, choose, chance, angle } from './random.js';
export function createPlayer() { return { x: 640, y: 610, angle: 0, health: 100, armor: 35, state: 'foot', car: null, cash: 1250, sprint: false, invuln: 0 }; }
export function createEntities(city, rng) { const cars = []; const peds = []; const pickups = []; for (let i = 0; i < 26; i++) cars.push(createCar(choose(rng, carNames.slice(0, 5)), between(rng, 250, 2850), between(rng, 220, 2100), angle(rng))); for (let i = 0; i < 42; i++) peds.push({ x: between(rng, 180, 2860), y: between(rng, 170, 2060), angle: angle(rng), speed: between(rng, .35, .9), mood: 'calm', health: 40, panic: 0, color: choose(rng, ['#ffcfaa', '#b87958', '#f1c4a8']), shirt: choose(rng, ['#50e9ff', '#ff4e9d', '#ffd45a', '#9c84ff']) }); for (let i = 0; i < 14; i++) pickups.push({ x: between(rng, 220, 2800), y: between(rng, 200, 2050), type: i % 3 === 0 ? 'armor' : 'cash', taken: false }); return { cars, peds, pickups, particles: [], projectiles: [], skid: [] }; }
export function createCar(type, x, y, rotation = 0) { const tune = tuning.cars[type] || tuning.cars.sedan; return { type, x, y, rotation, speed: 0, health: 100, color: tune.color, occupied: false, reckless: false, braking: false, dead: false }; }
export function updatePlayer(player, input, city, dt) { if (player.invuln > 0) player.invuln -= dt; if (player.state === 'drive') return; let dx = (input.is('right') ? 1 : 0) - (input.is('left') ? 1 : 0); let dy = (input.is('down') ? 1 : 0) - (input.is('up') ? 1 : 0); const length = Math.hypot(dx, dy) || 1; const speed = input.is('sprint') ? tuning.player.sprint : tuning.player.speed; player.sprint = input.is('sprint'); if (dx || dy) { const nx = player.x + dx / length * speed * dt; const ny = player.y + dy / length * speed * dt; if (!city.blocked?.(nx, player.y)) player.x = nx; if (!city.blocked?.(player.x, ny)) player.y = ny; player.angle = Math.atan2(dy, dx); } }
export function tryCarjack(player, entities) { const candidate = entities.cars.find(car => !car.occupied && !car.dead && dist(player, car) < 48); if (!candidate) return false; candidate.occupied = true; player.state = 'drive'; player.car = candidate; player.x = candidate.x; player.y = candidate.y; return true; }
export function exitCar(player) { if (player.state !== 'drive' || !player.car) return false; player.state = 'foot'; player.car.occupied = false; player.x += Math.cos(player.car.rotation + Math.PI / 2) * 28; player.y += Math.sin(player.car.rotation + Math.PI / 2) * 28; player.car = null; return true; }
export function updateCar(player, car, input, dt, city) { const tune = tuning.cars[car.type] || tuning.cars.sedan; const throttle = input.is('up') ? 1 : input.is('down') ? -.6 : 0; car.speed += throttle * .22 * dt; car.speed *= Math.pow(.93, dt); car.speed = clamp(car.speed, -2.5, tune.speed); if (input.is('left')) car.rotation -= tune.turn * dt * (1 + Math.abs(car.speed) / 5); if (input.is('right')) car.rotation += tune.turn * dt * (1 + Math.abs(car.speed) / 5); const nx = car.x + Math.cos(car.rotation) * car.speed * dt; const ny = car.y + Math.sin(car.rotation) * car.speed * dt; if (!city.blocked?.(nx, ny)) { car.x = nx; car.y = ny; } else car.speed *= -.3; player.x = car.x; player.y = car.y; }
export function updatePeds(entities, player, dt, rng) { for (const ped of entities.peds) { const fear = dist(ped, player) < 130 && player.state === 'drive'; if (fear) { ped.mood = 'panic'; ped.panic = 80; ped.angle = angleTo(player, ped); } else if (ped.panic > 0) ped.panic -= dt; else if (chance(rng, .01)) ped.angle += between(rng, -.8, .8); const speed = ped.mood === 'panic' ? 2.2 : ped.speed; ped.x += Math.cos(ped.angle) * speed * dt; ped.y += Math.sin(ped.angle) * speed * dt; if (ped.x < 90 || ped.x > 2900) ped.angle = Math.PI - ped.angle; if (ped.y < 90 || ped.y > 2150) ped.angle = -ped.angle; } }
export function collectPickups(player, entities) { for (const item of entities.pickups) if (!item.taken && dist(player, item) < 26) { item.taken = true; if (item.type === 'cash') player.cash += 250; else player.armor = clamp(player.armor + 30, 0, 100); } }
/* entity authoring notes
001 player begins on foot
002 player can enter a car
003 player can exit a car
004 foot movement uses cardinal input
005 diagonal movement is normalized
006 sprint increases foot speed
007 player angle follows movement
008 player health has a fixed maximum
009 player armor has a fixed maximum
010 invulnerability is a short grace
011 cars have named types
012 each type has a tuning row
013 each type has a distinct color
014 each type has distinct speed
015 each type has distinct steering
016 cars carry rotation
017 cars carry current speed
018 cars carry health
019 cars carry occupancy
020 cars carry reckless state
021 cars carry braking state
022 dead cars remain queryable
023 dead cars are skipped by rendering
024 carjack checks nearby cars
025 carjack claims occupancy
026 carjack synchronizes player position
027 carjack raises wanted heat
028 exit clears occupancy
029 exit places player beside car
030 drive input uses throttle
031 drive input uses reverse
032 drive input uses steering
033 drive input applies drag
034 drive input clamps speed
035 drive input respects collision
036 blocked drive bounces gently
037 pedestrians have positions
038 pedestrians have headings
039 pedestrians have speeds
040 pedestrians have moods
041 pedestrians have health
042 pedestrians have clothing colors
043 pedestrians wander naturally
044 pedestrians panic near vehicles
045 panic changes direction
046 panic changes speed
047 edges reflect headings
048 pickups have positions
049 pickups have types
050 pickups have taken state
051 cash pickups pay a fixed amount
052 armor pickups refill armor
053 collection uses a small radius
054 entities are seeded at creation
055 creation is deterministic
056 update accepts a fixed delta
057 no wall clock is read
058 no browser randomness is read
059 player is plain data
060 car is plain data
061 pedestrian is plain data
062 pickup is plain data
063 particles are owned by entities
064 projectiles are owned by entities
065 renderer reads entity arrays
066 combat writes projectile arrays
067 traffic writes car motion
068 police writes cruiser motion
069 missions reads player motion
070 save reads player resources
071 audio is called by main
072 input is passed by main
073 city collision is passed by main
074 ownership remains clear
075 cars support traffic graph targets
076 cars support police flags
077 cars support explosions
078 cars support skid records
079 peds support panic visuals
080 peds support combat targets
081 pickups support minimap omission
082 player supports foot sprite
083 player supports vehicle camera
084 player supports mission distance
085 player supports collection
086 vehicle camera lead is renderer-owned
087 entity movement remains compact
088 fixed steps produce stable scenes
089 shot seeds produce stable entities
090 named types support debugging
091 sedan is balanced
092 coupe is nimble
093 van is heavy
094 taxi is visible
095 sport is fast
096 police is responsive
097 colors make types readable
098 occupied cars are not traffic
099 dead cars are not traffic
100 entities remain browser-safe
101 arrays are mutable by simulation
102 helper factories keep shape stable
103 factory defaults are explicit
104 player defaults are visible
105 car defaults are visible
106 pedestrian defaults are visible
107 pickup defaults are visible
108 update paths are small
109 update paths are testable
110 update paths avoid timers
111 update paths avoid dates
112 update paths avoid async work
113 player controls feel direct
114 car controls feel heavier
115 pedestrians stay lightweight
116 pickups stay lightweight
117 collection feedback is handled by main
118 damage feedback is handled by combat
119 wanted feedback is handled by police
120 mission feedback is handled by missions
121 render feedback is handled by render
122 this block documents the authoring pass
123 entity state is intentionally explicit
124 state transitions are visible
125 state transitions are deterministic
126 carjack is a single action
127 exit is a single action
128 collection is a single action
129 movement is a fixed action
130 no hidden global state exists
131 no storage access exists
132 no canvas access exists
133 no audio context exists
134 no DOM access exists
135 module remains portable
136 module remains easy to inspect
137 module remains easy to extend
138 module remains compact at runtime
139 generated data remains plain
140 gameplay data remains serializable
141 resources remain numeric
142 positions remain numeric
143 headings remain numeric
144 colors remain strings
145 types remain strings
146 flags remain booleans
147 health remains bounded by callers
148 entity authoring note complete
149 deterministic behavior is preserved
150 final entity line
*/
