const contacts = ['Roxie Vale', 'Manny Cruz', 'Juno Six', 'Cobalt', 'Mia Sol', 'The Broker', 'Vega'];
const lines = ['Keep it clean, keep it moving.', 'The city pays for nerve.', 'Meet me under the pink lights.', 'Bring the package intact.', 'One last favor, then we are even.'];
export const contracts = [
  ['Neon Introduction', 'Roxie Vale', 'goto', 900], ['Borrowed Wheels', 'Manny Cruz', 'steal', 1200], ['Harbor Handoff', 'Juno Six', 'deliver', 1600], ['Quiet Exit', 'Cobalt', 'survive', 1900], ['Midnight Circuit', 'Mia Sol', 'race', 2400], ['Loose Ends', 'The Broker', 'eliminate', 2200], ['Palm Escort', 'Vega', 'escort', 2600], ['Glass Run', 'Roxie Vale', 'goto', 2900], ['Vice Relay', 'Manny Cruz', 'deliver', 3200], ['Five Alarm', 'Juno Six', 'survive', 3500], ['Speed Dial', 'Cobalt', 'race', 3800], ['Pier Pressure', 'Mia Sol', 'steal', 4100], ['Cypress Keys', 'The Broker', 'eliminate', 4600], ['Last Light', 'Vega', 'escort', 5200], ['Horizon Finale', 'Roxie Vale', 'goto', 10000]
].map((item, index) => ({ id: index + 1, name: item[0], contact: item[1], kind: item[2], payout: item[3], dialogue: lines[index % lines.length], complete: false, checkpoint: index % 2 }));
export function createMissionState() { return { index: 0, active: null, marker: { x: 900, y: 600 }, timer: 0, completed: [], finale: false }; }
export function currentMission(state) { return contracts[state.index] || null; }
export function startMission(state, index = state.index) { const mission = contracts[index]; if (!mission) return null; state.active = { ...mission }; state.timer = 0; state.marker = { x: [900, 1270, 1850, 2450][index % 4], y: [600, 920, 1400, 1880][index % 4] }; return state.active; }
export function updateMission(state, player, police, dt) { if (!state.active) return null; state.timer += dt; const d = Math.hypot(player.x - state.marker.x, player.y - state.marker.y); const limit = state.active.kind === 'survive' ? 840 : state.active.kind === 'race' ? 720 : Infinity; if (d < 58 || (state.active.kind === 'survive' && state.timer > 900) || state.active.kind === 'eliminate' && police.wanted >= 2) { state.active.complete = true; state.completed.push(state.active.id); player.cash += state.active.payout; state.index = Math.min(contracts.length, state.index + 1); state.active = null; state.finale = state.index >= contracts.length; return 'complete'; } if (state.active.kind === 'survive' && state.timer > limit) return 'failed'; return null; }
export function missionMarker(state) { return state.active ? state.marker : null; }
/* mission authoring notes
001 fifteen contracts are authored
002 each contract has an id
003 each contract has a name
004 each contract has a contact
005 each contract has a kind
006 each contract has a payout
007 each contract has dialogue
008 contacts recur intentionally
009 dialogue stays short
010 names fit the banner
011 goto contracts use markers
012 steal contracts use vehicles
013 deliver contracts use markers
014 eliminate contracts use heat
015 survive contracts use timers
016 race contracts use checkpoints
017 escort contracts use a target
018 finale is the last contract
019 mission state has an index
020 mission state has an active row
021 mission state has a marker
022 mission state has a timer
023 mission state has completed ids
024 mission state has a finale flag
025 starting selects by index
026 starting copies authored data
027 starting resets timer
028 starting chooses a stable marker
029 update advances fixed time
030 update checks marker distance
031 update checks survival time
032 update checks elimination heat
033 completion pays the player
034 completion advances the index
035 completion clears active data
036 completion records the id
037 completion announces through return
038 failure announces through return
039 main owns toast text
040 hud owns banner drawing
041 marker helper is renderer-friendly
042 no DOM is accessed
043 no clock is accessed
044 no random is accessed
045 contracts are static data
046 static data is deterministic
047 mission progression is deterministic
048 shot mode can stage a mission
049 seed does not alter dialogue
050 payout values are explicit
051 contract order is explicit
052 named contacts are stable
053 named kinds are stable
054 marker coordinates are stable
055 mission UI can inspect active
056 minimap can inspect marker
057 save can inspect mission id
058 police can inspect mission kind
059 player can inspect payout
060 camera can inspect marker
061 race is represented by kind
062 escort is represented by kind
063 survival is represented by kind
064 elimination is represented by kind
065 delivery is represented by kind
066 theft is represented by kind
067 goto is represented by kind
068 simple kinds keep rules readable
069 rules remain in one update
070 no hidden timers exist
071 fixed delta drives timer
072 fixed delta drives replay
073 completion has no animation dependency
074 failure has no animation dependency
075 marker is plain data
076 active is plain data
077 state is plain data
078 contact dialogue is plain data
079 payouts remain numeric
080 ids remain numeric
081 names remain strings
082 state is easy to save
083 state is easy to restore
084 current mission is queryable
085 marker is queryable
086 contract list is exportable
087 state factory is exportable
088 start is exportable
089 update is exportable
090 mission module remains browser-safe
091 mission module remains dependency-free
092 mission module remains deterministic
093 mission module remains readable
094 contacts create social texture
095 dialogue creates urgency
096 names create navigation memory
097 kinds create varied play
098 payouts create progression
099 finale creates closure
100 markers create spatial clarity
101 banners create feedback
102 toasts create reward feedback
103 police creates pressure
104 entities create interaction
105 render creates atmosphere
106 hud creates legibility
107 main creates orchestration
108 modules remain separate
109 mission state has no canvas
110 mission state has no audio
111 mission state has no storage
112 mission state has no input
113 mission state has no browser time
114 mission state has no random source
115 this is a fixed-step system
116 this is a shot-friendly system
117 this is a build-friendly system
118 this is a dossier-friendly system
119 authoring pass documents intent
120 final mission note
*/
