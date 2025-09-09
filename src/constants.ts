export const LERP_SPEED = 0.1; // the higher value - the faster player moves

export const GAME_SIZE = 600;
export const SPAWN_RADIUS = 70;

export const FEAR_RADIUS = 200; // The distance at which ducks start to flee
export const FEAR_FORCE = 0.0004; // The maximum force applied to a duck

export const BOUNDS_FORCE = 0.008; // The force that pushes ducks back into the play area
export const BOUNDS_BUFFER = 20; // The buffer zone outside the play area where nothing happens

export const GROUPING_FORCE = 0.0000003; // The gentle force pulling ducks together

export const COMFORT_RADIUS = 20; // Ducks' personal space radius
export const COMFORT_FORCE = 0.00005; // Force to push ducks apart

export const SORTING_RADIUS = 40; // Radius to check for foreign ducks

export const DUCK_SIZE = 8;
export const DUCK_GROUP_SIZE = 4;
export const DUCK_GROUP_COUNT = 3;

export const FRICTION_AIR = 0.1;

export const STARTING_PLAYER_POSITION = { x: 295, y: 500 };
export const BASE_COLORS = [
  '#ddcf99',
  '#cca87b',
  '#b97a60',
  '#9c524e',
  '#774251',
  '#4b3d44',
  '#4e5463',
  '#5b7d73',
  '#8e9f7d',
  '#645355',
  '#8c7c79',
  '#a99c8d',
  '#7d7b62',
  '#aaa25d',
  '#846d59',
  '#a88a5e',
];

export const GROUP_OPTIONS = [2, 3, 4];
export const DUCKS_OPTIONS = [3, 4, 5];
