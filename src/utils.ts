export const getInitialSeed = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlSeed = urlParams.get('seed');
  if (urlSeed && !isNaN(Number(urlSeed))) {
    return Number(urlSeed);
  }
  return Math.floor(Math.random() * 100000);
};

export const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const getDailySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

export const generateRandomSeed = () => {
  return Math.floor(Math.random() * 100000);
};
